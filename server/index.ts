import express, { type NextFunction, type Request, type Response } from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { buyItem, claimDailyStars, createSession, createUser, deleteSession, findUserByEmail, findUserByGoogleId, findUserBySession, publicUser, sql, updateProfile, usernameExists, type User } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === "production";
const sessionMaxAge = 60 * 60 * 24 * 30;

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
const asyncRoute = (handler: AsyncRoute) => (req: Request, res: Response, next: NextFunction) => { void handler(req, res, next).catch(next); };

function sessionCookie(token: string) {
  return `serene_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${sessionMaxAge}${isProduction ? "; Secure" : ""}`;
}
function expiredCookie() {
  return "serene_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0";
}
function getCookies(req: Request) {
  return Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map((item) => {
    const [key, ...rest] = item.trim().split("=");
    return [key, decodeURIComponent(rest.join("="))];
  }));
}
async function currentUser(req: Request) {
  return findUserBySession(getCookies(req).serene_session);
}
async function requireUser(req: Request, res: Response) {
  const user = await currentUser(req);
  if (!user) {
    res.status(401).json({ error: "Sign in first." });
    return undefined;
  }
  return user;
}
async function requireAdmin(req: Request, res: Response) {
  const user = await requireUser(req, res);
  if (!user) return undefined;
  if (user.role !== "owner" && user.role !== "admin") {
    res.status(403).json({ error: "Owner or admin access is required." });
    return undefined;
  }
  return user;
}
function normalizeUsername(value: string) { return value.trim().toLowerCase(); }
function validUsername(value: string) { return /^[a-z0-9_]{3,20}$/.test(value); }
function passwordHash(password: string) { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`; }
function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const actual = Buffer.from(hash, "hex");
  return candidate.length === actual.length && timingSafeEqual(candidate, actual);
}
function normalizeEmail(value: string) { return value.trim().toLowerCase(); }
function validEmail(value: string) { return /^\S+@\S+\.\S+$/.test(value); }
async function googleProfile(credential: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Google sign-in is not configured on the server.");
  if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error("Google sign-in is missing its server-only configuration.");
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!response.ok) throw new Error("Google token could not be verified.");
  const token = await response.json() as { aud?: string; sub?: string; email?: string; email_verified?: string; name?: string };
  if (token.aud !== clientId || !token.sub || !token.email || token.email_verified !== "true") throw new Error("Google account verification failed.");
  return token;
}
function handleDatabaseError(error: unknown, res: Response) {
  if (error && typeof error === "object" && "code" in error && error.code === "23505") {
    res.status(409).json({ error: "That email or username is already in use." });
    return true;
  }
  return false;
}

export const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));
app.get("/api/health", asyncRoute(async (_req, res) => {
  await sql`select 1`;
  res.json({ ok: true });
}));
app.get("/api/auth/me", asyncRoute(async (req, res) => {
  const user = await currentUser(req);
  res.json({ user: user ? publicUser(user) : null });
}));
app.post("/api/auth/signup", asyncRoute(async (req, res) => {
  const email = normalizeEmail(String(req.body?.email || ""));
  const username = normalizeUsername(String(req.body?.username || ""));
  const password = String(req.body?.password || "");
  if (!validEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
  if (!validUsername(username)) return res.status(400).json({ error: "Username must be 3-20 characters using letters, numbers, or underscores." });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
  if (await usernameExists(username)) return res.status(409).json({ error: "That username is already taken." });
  try {
    const user = await createUser({ email, username, passwordHash: passwordHash(password) });
    res.setHeader("Set-Cookie", sessionCookie(await createSession(user.id)));
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (handleDatabaseError(error, res)) return;
    throw error;
  }
}));
app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const email = normalizeEmail(String(req.body?.email || ""));
  const password = String(req.body?.password || "");
  const user = await findUserByEmail(email);
  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) return res.status(401).json({ error: "Email or password is incorrect." });
  res.setHeader("Set-Cookie", sessionCookie(await createSession(user.id)));
  res.json({ user: publicUser(user) });
}));
app.post("/api/auth/logout", asyncRoute(async (req, res) => {
  await deleteSession(getCookies(req).serene_session);
  res.setHeader("Set-Cookie", expiredCookie());
  res.json({ ok: true });
}));
app.post("/api/auth/google", asyncRoute(async (req, res) => {
  try {
    const token = await googleProfile(String(req.body?.credential || ""));
    let user = await findUserByGoogleId(token.sub!);
    if (!user) user = await findUserByEmail(normalizeEmail(token.email!));
    if (!user) {
      const base = normalizeUsername(token.email!.split("@")[0]).replace(/[^a-z0-9_]/g, "").slice(0, 20) || "serene";
      let username = base;
      let suffix = 1;
      while (await usernameExists(username)) username = `${base.slice(0, 17)}_${suffix++}`;
      user = await createUser({ email: normalizeEmail(token.email!), username, googleId: token.sub, displayName: token.name || username });
    }
    res.setHeader("Set-Cookie", sessionCookie(await createSession(user.id)));
    res.json({ user: publicUser(user) });
  } catch (error) {
    res.status(401).json({ error: error instanceof Error ? error.message : "Google sign-in failed." });
  }
}));
app.patch("/api/profile", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const patch: Record<string, string> = {};
  for (const key of ["displayName", "bio", "avatarSeed", "bannerColor"]) if (typeof req.body?.[key] === "string") patch[key] = req.body[key].slice(0, key === "bio" ? 160 : 80);
  res.json({ user: publicUser((await updateProfile(user.id, patch)) as User) });
}));
app.post("/api/stars/daily", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const result = await claimDailyStars(user.id);
  if ("error" in result) return res.status(409).json({ error: "You already collected today's Stars." });
  res.json({ user: publicUser(result.user), reward: result.reward });
}));
app.post("/api/shop/buy", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const result = await buyItem(user.id, String(req.body?.itemId || ""));
  if ("error" in result) {
    const status = result.error === "missing" ? 404 : result.error === "owned" ? 409 : 400;
    const message = result.error === "missing" ? "Shop item not found." : result.error === "owned" ? "You already own this item." : "Not enough Stars.";
    return res.status(status).json({ error: message });
  }
  const profileKey = result.item.kind === "theme" ? "siteTheme" : result.item.kind;
  const updated = await updateProfile(user.id, { [profileKey]: result.item.value });
  res.json({ user: publicUser(updated as User) });
}));
app.get("/api/shop/items", asyncRoute(async (_req, res) => {
  const items = await sql`select id, name, description, price, kind, value, active from shop_items where active = true order by kind, price, name`;
  res.json({ items });
}));
app.get("/api/stars/transactions", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const transactions = await sql`select id, amount, kind, reference_id as "referenceId", created_at as "createdAt" from stars_transactions where user_id = ${user.id} order by created_at desc limit 100`;
  res.json({ transactions });
}));
app.post("/api/profile/equip", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const itemId = String(req.body?.itemId || "");
  const item = await sql<{ kind: string; value: string }[]>`select s.kind, s.value from shop_items s join purchases p on p.item_id = s.id where p.user_id = ${user.id} and s.id = ${itemId}`;
  if (!item[0]) return res.status(403).json({ error: "Purchase the item before equipping it." });
  const profileKey = item[0].kind === "theme" ? "siteTheme" : item[0].kind;
  const updated = await updateProfile(user.id, { [profileKey]: item[0].value });
  res.json({ user: publicUser(updated as User) });
}));
app.post("/api/profile/unequip", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const kind = String(req.body?.kind || "");
  const defaults: Record<string, string> = { theme: "white", particles: "dust", avatarAnimation: "float", avatarFrame: "none" };
  if (!defaults[kind]) return res.status(400).json({ error: "Unknown cosmetic type." });
  const profileKey = kind === "theme" ? "siteTheme" : kind;
  const updated = await updateProfile(user.id, { [profileKey]: defaults[kind] });
  res.json({ user: publicUser(updated as User) });
}));
app.get("/api/catalog/games", asyncRoute(async (_req, res) => {
  const games = await sql`select id, title, description, thumbnail as image, url, embed_source as "embedSource", category, tags, developer, version, popularity, created_at as "dateAdded", status from games where status = 'published' order by created_at desc`;
  res.json({ games });
}));
app.get("/api/catalog/apps", asyncRoute(async (_req, res) => {
  const apps = await sql`select id, name, description, icon, url, category, embed_settings as "embedSettings", developer, status from apps where status = 'published' order by name`;
  res.json({ apps });
}));
app.get("/api/bookmarks", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const bookmarks = await sql`select id, url, title, created_at as "createdAt" from bookmarks where user_id = ${user.id} order by created_at desc`;
  res.json({ bookmarks });
}));
app.post("/api/bookmarks", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const url = String(req.body?.url || "").trim();
  const title = String(req.body?.title || "").trim().slice(0, 160);
  if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: "Only valid web addresses can be bookmarked." });
  const rows = await sql`insert into bookmarks (user_id, url, title) values (${user.id}, ${url}, ${title}) on conflict (user_id, url) do update set title = excluded.title returning id, url, title, created_at as "createdAt"`;
  res.status(201).json({ bookmark: rows[0] ?? null });
}));
app.delete("/api/bookmarks/:id", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  await sql`delete from bookmarks where id = ${req.params.id} and user_id = ${user.id}`;
  res.json({ ok: true });
}));
app.get("/api/browser/history", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const history = await sql`select id, url, title, created_at as "createdAt" from browser_history where user_id = ${user.id} order by created_at desc limit 100`;
  res.json({ history });
}));
app.post("/api/browser/history", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const url = String(req.body?.url || "").trim();
  const title = String(req.body?.title || "").trim().slice(0, 160);
  if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: "Only web addresses can be saved in history." });
  const rows = await sql`insert into browser_history (user_id, url, title) values (${user.id}, ${url}, ${title}) on conflict (user_id, url) do update set title = coalesce(nullif(excluded.title, ''), browser_history.title), created_at = now() returning id, url, title, created_at as "createdAt"`;
  res.status(201).json({ history: rows[0] });
}));
app.delete("/api/browser/history", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  await sql`delete from browser_history where user_id = ${user.id}`;
  res.json({ ok: true });
}));
app.delete("/api/browser/history/:id", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  await sql`delete from browser_history where id = ${req.params.id} and user_id = ${user.id}`;
  res.json({ ok: true });
}));
app.get("/api/games/activity", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const activity = await sql`select game_id as "gameId", favorite, last_played_at as "lastPlayedAt" from game_activity where user_id = ${user.id}`;
  res.json({ activity });
}));
app.post("/api/games/:gameId/activity", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const favorite = typeof req.body?.favorite === "boolean" ? req.body.favorite : undefined;
  const played = req.body?.played === true;
  const rows = await sql`insert into game_activity (user_id, game_id, favorite, last_played_at) select ${user.id}, ${req.params.gameId}, coalesce(${favorite ?? false}, false), ${played ? sql`now()` : sql`null`} where exists (select 1 from games where id = ${req.params.gameId}) on conflict (user_id, game_id) do update set favorite = coalesce(${favorite ?? null}, game_activity.favorite), last_played_at = case when ${played} then now() else game_activity.last_played_at end returning game_id as "gameId", favorite, last_played_at as "lastPlayedAt"`;
  if (!rows[0]) return res.status(404).json({ error: "Game not found." });
  res.json({ activity: rows[0] });
}));
app.get("/api/notifications", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const notifications = await sql`select id, kind, title, body, read_at as "readAt", created_at as "createdAt" from notifications where user_id = ${user.id} order by created_at desc limit 100`;
  res.json({ notifications, unread: notifications.filter((item) => !item.readAt).length });
}));
app.post("/api/notifications/:id/read", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  await sql`update notifications set read_at = coalesce(read_at, now()) where id = ${req.params.id} and user_id = ${user.id}`;
  res.json({ ok: true });
}));
app.post("/api/notifications/read-all", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  await sql`update notifications set read_at = coalesce(read_at, now()) where user_id = ${user.id}`;
  res.json({ ok: true });
}));
app.get("/api/chat/servers", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const servers = await sql`select id, name, icon, owner_id as "ownerId" from chat_servers order by name`;
  res.json({ servers });
}));
app.get("/api/chat/servers/:serverId", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const rows = await sql`select id, name, icon, owner_id as "ownerId" from chat_servers where id = ${req.params.serverId}`;
  if (!rows[0]) return res.status(404).json({ error: "Server not found." });
  res.json({ server: rows[0] });
}));
app.post("/api/chat/servers", asyncRoute(async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const name = String(req.body?.name || "").trim().slice(0, 50);
  if (!name) return res.status(400).json({ error: "A server name is required." });
  const rows = await sql`insert into chat_servers (name, icon, owner_id) values (${name}, ${String(req.body?.icon || "").slice(0, 200)}, ${user.id}) returning id, name, icon, owner_id as "ownerId"`;
  res.status(201).json({ server: rows[0] });
}));
app.delete("/api/chat/servers/:serverId", asyncRoute(async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  await sql`delete from chat_servers where id = ${req.params.serverId} and (${user.role} = 'owner' or owner_id = ${user.id})`;
  res.json({ ok: true });
}));
app.get("/api/chat/servers/:serverId/channels", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const channels = await sql`select c.id, c.name, cat.id as "categoryId", cat.name as category from chat_channels c join chat_categories cat on cat.id = c.category_id where cat.server_id = ${req.params.serverId} order by cat.name, c.name`;
  res.json({ channels });
}));
app.post("/api/chat/servers/:serverId/channels", asyncRoute(async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const name = String(req.body?.name || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 40);
  const categoryName = String(req.body?.category || "Community").trim().slice(0, 40);
  if (!name) return res.status(400).json({ error: "A channel name is required." });
  const rows = await sql.begin(async (transaction) => {
    const category = await transaction<{ id: string }[]>`insert into chat_categories (server_id, name) values (${req.params.serverId}, ${categoryName}) on conflict do nothing returning id`;
    const categoryId = category[0]?.id ?? (await transaction<{ id: string }[]>`select id from chat_categories where server_id = ${req.params.serverId} and name = ${categoryName} limit 1`)[0].id;
    return transaction`insert into chat_channels (category_id, name) values (${categoryId}, ${name}) returning id, name, ${categoryId} as "categoryId", ${categoryName} as category`;
  });
  res.status(201).json({ channel: rows[0] });
}));
app.patch("/api/chat/channels/:channelId", asyncRoute(async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const name = String(req.body?.name || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 40);
  if (!name) return res.status(400).json({ error: "A channel name is required." });
  const rows = await sql`update chat_channels c set name = ${name} from chat_categories cat join chat_servers s on s.id = cat.server_id where c.id = ${req.params.channelId} and c.category_id = cat.id and (${user.role} = 'owner' or s.owner_id = ${user.id}) returning c.id, c.name, c.category_id as "categoryId"`;
  if (!rows[0]) return res.status(404).json({ error: "Channel not found." });
  res.json({ channel: rows[0] });
}));
app.delete("/api/chat/channels/:channelId", asyncRoute(async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const rows = await sql`delete from chat_channels c using chat_categories cat, chat_servers s where c.id = ${req.params.channelId} and c.category_id = cat.id and cat.server_id = s.id and (${user.role} = 'owner' or s.owner_id = ${user.id}) returning c.id`;
  if (!rows[0]) return res.status(404).json({ error: "Channel not found." });
  res.json({ ok: true });
}));
app.get("/api/chat/channels/:channelId/messages", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const messages = await sql`select m.id, m.body, m.author_id as "authorId", u.username, p.display_name as "displayName", p.avatar_seed as "avatarSeed", m.created_at as "createdAt", coalesce((select json_agg(json_build_object('emoji', r.emoji, 'count', r.count, 'reacted', r.reacted)) from (select emoji, count(*)::int as count, bool_or(user_id = ${user.id}) as reacted from message_reactions where message_id = m.id group by emoji) r), '[]'::json) as reactions from messages m join users u on u.id = m.author_id left join profiles p on p.user_id = u.id where m.channel_id = ${req.params.channelId} order by m.created_at asc limit 200`;
  res.json({ messages });
}));
app.post("/api/chat/messages/:messageId/reactions", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const emoji = String(req.body?.emoji || "").trim().slice(0, 16);
  if (!emoji) return res.status(400).json({ error: "Choose an emoji." });
  const rows = await sql`insert into message_reactions (message_id, user_id, emoji) select ${req.params.messageId}, ${user.id}, ${emoji} where exists (select 1 from messages where id = ${req.params.messageId}) on conflict (message_id, user_id, emoji) do nothing returning message_id as "messageId", emoji`;
  if (!rows[0]) return res.status(404).json({ error: "Message not found or reaction already added." });
  res.status(201).json({ reaction: rows[0] });
}));
app.delete("/api/chat/messages/:messageId/reactions/:emoji", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  await sql`delete from message_reactions where message_id = ${req.params.messageId} and user_id = ${user.id} and emoji = ${req.params.emoji}`;
  res.json({ ok: true });
}));
app.post("/api/chat/channels/:channelId/messages", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const body = String(req.body?.body || "").trim().slice(0, 2000);
  if (!body) return res.status(400).json({ error: "Message cannot be empty." });
  const rows = await sql`insert into messages (channel_id, author_id, body) select ${req.params.channelId}, ${user.id}, ${body} where exists (select 1 from chat_channels where id = ${req.params.channelId}) returning id, body, author_id as "authorId", created_at as "createdAt"`;
  if (!rows[0]) return res.status(404).json({ error: "Channel not found." });
  res.status(201).json({ message: { ...rows[0], username: user.username } });
}));
app.get("/api/studio/submissions", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const isAdmin = user.role === "owner" || user.role === "admin";
  const rows = isAdmin
    ? await sql`select id, 'game' as type, title as name, description, url, status from games union all select id, 'app' as type, name, description, url, status from apps order by name`
    : await sql`select g.id, 'game' as type, g.title as name, g.description, g.url, g.status from games g join game_submissions s on s.game_id = g.id where s.submitted_by = ${user.id} union all select a.id, 'app' as type, a.name, a.description, a.url, a.status from apps a join app_submissions s on s.app_id = a.id where s.submitted_by = ${user.id} order by name`;
  res.json({ submissions: rows });
}));
app.post("/api/studio/submissions", asyncRoute(async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const type = req.body?.type === "app" ? "app" : "game";
  const name = String(req.body?.name || "").trim().slice(0, 80);
  const description = String(req.body?.description || "").trim().slice(0, 500);
  const url = String(req.body?.url || "").trim();
  if (!name || !description || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: "Name, description, and a valid URL are required." });
  if (type === "game") {
    const rows = await sql`insert into games (title, description, url, embed_source, category, developer, status) values (${name}, ${description}, ${url}, ${url}, 'New', ${user.username}, 'pending') returning id`;
    await sql`insert into game_submissions (game_id, submitted_by, status) values (${rows[0].id}, ${user.id}, 'pending')`;
  } else {
    const rows = await sql`insert into apps (name, description, url, category, developer, status) values (${name}, ${description}, ${url}, 'New', ${user.username}, 'pending') returning id`;
    await sql`insert into app_submissions (app_id, submitted_by, status) values (${rows[0].id}, ${user.id}, 'pending')`;
  }
  res.status(201).json({ ok: true });
}));
app.patch("/api/studio/submissions/:id", asyncRoute(async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const status = ["pending", "published", "rejected", "draft"].includes(req.body?.status) ? req.body.status : "pending";
  const game = await sql`update games set status = ${status} where id = ${req.params.id} returning id`;
  if (!game.length) await sql`update apps set status = ${status} where id = ${req.params.id}`;
  res.json({ ok: true });
}));
app.get("/api/announcements", asyncRoute(async (_req, res) => {
  const rows = await sql`select id, title, body, published_at as "publishedAt" from announcements where status = 'published' order by published_at desc limit 20`;
  res.json({ announcements: rows });
}));
app.post("/api/announcements", asyncRoute(async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const title = String(req.body?.title || "Serene update").trim().slice(0, 100);
  const body = String(req.body?.body || "").trim().slice(0, 1000);
  if (!body) return res.status(400).json({ error: "Announcement text is required." });
  const rows = await sql`insert into announcements (title, body, status, created_by, published_at) values (${title}, ${body}, 'published', ${user.id}, now()) returning id, title, body`;
  await sql`insert into notifications (user_id, kind, title, body) select id, 'announcement', ${title}, ${body} from users where id <> ${user.id}`;
  res.status(201).json({ announcement: rows[0] });
}));
app.get("/api/studio/announcements", asyncRoute(async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const announcements = await sql`select id, title, body, status, published_at as "publishedAt" from announcements order by created_at desc limit 100`;
  res.json({ announcements });
}));
app.patch("/api/studio/announcements/:id", asyncRoute(async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const status = req.body?.status === "published" ? "published" : "draft";
  const title = typeof req.body?.title === "string" ? req.body.title.trim().slice(0, 100) : undefined;
  const body = typeof req.body?.body === "string" ? req.body.body.trim().slice(0, 1000) : undefined;
  const rows = await sql`update announcements set title = coalesce(${title ?? null}, title), body = coalesce(${body ?? null}, body), status = ${status}, published_at = case when ${status} = 'published' then coalesce(published_at, now()) else null end where id = ${req.params.id} returning id, title, body, status, published_at as "publishedAt"`;
  if (!rows[0]) return res.status(404).json({ error: "Announcement not found." });
  if (status === "published") await sql`insert into notifications (user_id, kind, title, body) select id, 'announcement', ${rows[0].title}, ${rows[0].body} from users where id <> ${user.id}`;
  res.json({ announcement: rows[0] });
}));
app.delete("/api/studio/announcements/:id", asyncRoute(async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  await sql`delete from announcements where id = ${req.params.id}`;
  res.json({ ok: true });
}));

const staticPath = isProduction ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
app.use(express.static(staticPath));
app.get("*", (_req, res) => { res.sendFile(path.join(staticPath, "index.html")); });

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  if (!res.headersSent) res.status(500).json({ error: "Something went wrong." });
});

export function startServer() {
  const port = Number(process.env.PORT || (isProduction ? 3000 : 3001));
  return createServer(app).listen(port, () => console.log(`Server running on port ${port}`));
}

if (!process.env.VERCEL) startServer();
