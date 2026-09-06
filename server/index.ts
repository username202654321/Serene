import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../data");
const dataFile = path.join(dataDir, "serene-auth.json");

type User = { id: string; email: string; username: string; displayName: string; bio: string; avatarSeed: string; avatarAnimation: string; avatarFrame: string; siteTheme: string; particles: string; stars: number; ownedItems: string[]; passwordHash?: string; googleId?: string; lastDaily?: string };
type Store = { users: User[]; sessions: Record<string, string> };

mkdirSync(dataDir, { recursive: true });
function loadStore(): Store { if (!existsSync(dataFile)) return { users: [], sessions: {} }; try { return JSON.parse(readFileSync(dataFile, "utf8")); } catch { return { users: [], sessions: {} }; } }
let store = loadStore();
function saveStore() { writeFileSync(dataFile, JSON.stringify(store, null, 2)); }
function publicUser(user: User) { const { passwordHash, googleId, lastDaily, ...safe } = user; return safe; }
function sessionCookie(token: string) { return `serene_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${process.env.NODE_ENV === "production" ? "; Secure" : ""}`; }
function getCookies(req: express.Request) { return Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map((item) => { const [key, ...rest] = item.trim().split("="); return [key, decodeURIComponent(rest.join("="))]; })); }
function currentUser(req: express.Request) { const token = getCookies(req).serene_session; const id = token ? store.sessions[token] : undefined; return id ? store.users.find((user) => user.id === id) : undefined; }
function normalizeUsername(value: string) { return value.trim().toLowerCase(); }
function validUsername(value: string) { return /^[a-z0-9_]{3,20}$/.test(value); }
function passwordHash(password: string) { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`; }
function verifyPassword(password: string, stored: string) { const [salt, hash] = stored.split(":"); if (!salt || !hash) return false; const candidate = scryptSync(password, salt, 64); const actual = Buffer.from(hash, "hex"); return candidate.length === actual.length && timingSafeEqual(candidate, actual); }
function createSession(user: User) { const token = randomBytes(32).toString("hex"); store.sessions[token] = user.id; saveStore(); return token; }
function newUser(email: string, username: string): User { return { id: randomUUID(), email, username, displayName: username, bio: "", avatarSeed: randomUUID().slice(0, 8), avatarAnimation: "float", avatarFrame: "none", siteTheme: "white", particles: "dust", stars: 500, ownedItems: [] }; }

const shopItems: Record<string, { price: number; kind: string; value: string }> = {
  "theme-hydrochrome": { price: 450, kind: "theme", value: "hydrochrome" },
  "theme-pastel": { price: 300, kind: "theme", value: "pastel" },
  "theme-midnight": { price: 250, kind: "theme", value: "midnight" },
  "particle-spark": { price: 180, kind: "particles", value: "spark" },
  "particle-orbit": { price: 240, kind: "particles", value: "orbit" },
  "avatar-spin": { price: 220, kind: "avatarAnimation", value: "spin" },
  "frame-orbit": { price: 200, kind: "avatarFrame", value: "orbit" },
};

async function googleProfile(credential: string) {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!response.ok) throw new Error("Google token could not be verified.");
  const token = await response.json() as { aud?: string; sub?: string; email?: string; email_verified?: string; name?: string };
  if (process.env.GOOGLE_CLIENT_ID && token.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error("Google client ID does not match.");
  if (!token.sub || !token.email || token.email_verified !== "true") throw new Error("Google account verification failed.");
  return token;
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "64kb" }));

  app.get("/api/auth/me", (req, res) => { const user = currentUser(req); res.json({ user: user ? publicUser(user) : null }); });
  app.post("/api/auth/signup", (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const username = normalizeUsername(String(req.body?.username || ""));
    const password = String(req.body?.password || "");
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (!validUsername(username)) return res.status(400).json({ error: "Username must be 3–20 characters using letters, numbers, or underscores." });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
    if (store.users.some((user) => user.email === email)) return res.status(409).json({ error: "An account with that email already exists." });
    if (store.users.some((user) => user.username === username)) return res.status(409).json({ error: "That username is already taken." });
    const user = newUser(email, username); user.passwordHash = passwordHash(password); store.users.push(user); const token = createSession(user); res.setHeader("Set-Cookie", sessionCookie(token)); res.status(201).json({ user: publicUser(user) });
  });
  app.post("/api/auth/login", (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase(); const password = String(req.body?.password || ""); const user = store.users.find((item) => item.email === email);
    if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) return res.status(401).json({ error: "Email or password is incorrect." });
    const token = createSession(user); res.setHeader("Set-Cookie", sessionCookie(token)); res.json({ user: publicUser(user) });
  });
  app.post("/api/auth/logout", (req, res) => { const cookies = getCookies(req); if (cookies.serene_session) delete store.sessions[cookies.serene_session]; saveStore(); res.setHeader("Set-Cookie", "serene_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"); res.json({ ok: true }); });
  app.post("/api/auth/google", async (req, res) => {
    try { const token = await googleProfile(String(req.body?.credential || "")); let user = store.users.find((item) => item.googleId === token.sub || item.email === token.email!.toLowerCase()); if (!user) { const base = normalizeUsername((token.email || "serene").split("@")[0]).replace(/[^a-z0-9_]/g, "").slice(0, 20) || "serene"; let username = base; let suffix = 1; while (store.users.some((item) => item.username === username)) username = `${base.slice(0, 17)}_${suffix++}`; user = newUser(token.email!.toLowerCase(), username); } user.googleId = token.sub; if (token.name && !user.displayName) user.displayName = token.name; if (!store.users.includes(user)) store.users.push(user); saveStore(); const session = createSession(user); res.setHeader("Set-Cookie", sessionCookie(session)); res.json({ user: publicUser(user) }); } catch (error) { res.status(401).json({ error: error instanceof Error ? error.message : "Google sign-in failed." }); }
  });
  app.patch("/api/profile", (req, res) => { const user = currentUser(req); if (!user) return res.status(401).json({ error: "Sign in first." }); const patch = req.body || {}; if (typeof patch.displayName === "string") user.displayName = patch.displayName.trim().slice(0, 30) || user.username; if (typeof patch.bio === "string") user.bio = patch.bio.slice(0, 160); for (const key of ["avatarSeed", "avatarAnimation", "avatarFrame", "siteTheme", "particles"] as const) if (typeof patch[key] === "string") user[key] = patch[key]; saveStore(); res.json({ user: publicUser(user) }); });
  app.post("/api/stars/daily", (req, res) => { const user = currentUser(req); if (!user) return res.status(401).json({ error: "Sign in first." }); const today = new Date().toISOString().slice(0, 10); if (user.lastDaily === today) return res.status(409).json({ error: "You already collected today's Stars." }); const reward = 75; user.stars += reward; user.lastDaily = today; saveStore(); res.json({ user: publicUser(user), reward }); });
  app.post("/api/shop/buy", (req, res) => { const user = currentUser(req); if (!user) return res.status(401).json({ error: "Sign in first." }); const itemId = String(req.body?.itemId || ""); const item = shopItems[itemId]; if (!item) return res.status(404).json({ error: "Shop item not found." }); if (user.ownedItems.includes(itemId)) return res.status(409).json({ error: "You already own this item." }); if (user.stars < item.price) return res.status(400).json({ error: "Not enough Stars." }); user.stars -= item.price; user.ownedItems.push(itemId); if (item.kind === "theme") user.siteTheme = item.value; if (item.kind === "particles") user.particles = item.value; if (item.kind === "avatarAnimation") user.avatarAnimation = item.value; if (item.kind === "avatarFrame") user.avatarFrame = item.value; saveStore(); res.json({ user: publicUser(user) }); });

  const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(staticPath));
  app.get("*", (_req, res) => { res.sendFile(path.join(staticPath, "index.html")); });
  const port = process.env.PORT || (process.env.NODE_ENV === "production" ? 3000 : 3001);
  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}

startServer().catch(console.error);
