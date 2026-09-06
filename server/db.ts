import { createHash, randomUUID } from "node:crypto";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL (or POSTGRES_URL) is required to start Serene.");
}

export const sql = postgres(connectionString, {
  max: process.env.VERCEL ? 1 : 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});

export type User = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatarSeed: string;
  avatarAnimation: string;
  avatarFrame: string;
  siteTheme: string;
  particles: string;
  stars: number;
  role: "user" | "admin" | "owner";
  ownedItems: string[];
  passwordHash?: string;
  googleId?: string;
  lastDaily?: string;
};

type UserRow = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_seed: string;
  avatar_animation: string;
  avatar_frame: string;
  site_theme: string;
  particles: string;
  stars: number;
  role: "user" | "admin" | "owner";
  password_hash: string | null;
  google_id: string | null;
  last_daily: string | null;
  owned_items: string[] | null;
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    avatarSeed: row.avatar_seed,
    avatarAnimation: row.avatar_animation,
    avatarFrame: row.avatar_frame,
    siteTheme: row.site_theme,
    particles: row.particles,
    stars: row.stars,
    role: row.role,
    ownedItems: row.owned_items ?? [],
    passwordHash: row.password_hash ?? undefined,
    googleId: row.google_id ?? undefined,
    lastDaily: row.last_daily ?? undefined,
  };
}

const userSelect = sql`select u.id, u.email, u.username, p.display_name, p.bio, p.avatar_seed, p.avatar_animation, p.avatar_frame, p.site_theme, p.particles, u.stars, u.role, u.password_hash, u.google_id, (select max(created_at)::date::text from stars_transactions where user_id = u.id and kind = 'daily') as last_daily, coalesce(array_agg(distinct pu.item_id) filter (where pu.item_id is not null), '{}') as owned_items from users u join profiles p on p.user_id = u.id left join purchases pu on pu.user_id = u.id`;

export async function findUserById(id: string): Promise<User | undefined> {
  const rows = await sql<UserRow[]>`${userSelect} where u.id = ${id} group by u.id, p.user_id, u.email, u.username, p.display_name, p.bio, p.avatar_seed, p.avatar_animation, p.avatar_frame, p.site_theme, p.particles, u.stars, u.role, u.password_hash, u.google_id`;
  return rows[0] ? mapUser(rows[0]) : undefined;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const rows = await sql<UserRow[]>`${userSelect} where u.email = ${email} group by u.id, p.user_id, u.email, u.username, p.display_name, p.bio, p.avatar_seed, p.avatar_animation, p.avatar_frame, p.site_theme, p.particles, u.stars, u.role, u.password_hash, u.google_id`;
  return rows[0] ? mapUser(rows[0]) : undefined;
}

export async function findUserByGoogleId(googleId: string): Promise<User | undefined> {
  const rows = await sql<UserRow[]>`${userSelect} where u.google_id = ${googleId} group by u.id, p.user_id, u.email, u.username, p.display_name, p.bio, p.avatar_seed, p.avatar_animation, p.avatar_frame, p.site_theme, p.particles, u.stars, u.role, u.password_hash, u.google_id`;
  return rows[0] ? mapUser(rows[0]) : undefined;
}

export async function usernameExists(username: string): Promise<boolean> {
  const rows = await sql`select 1 from users where username = ${username} limit 1`;
  return rows.length > 0;
}

export async function createUser(input: { email: string; username: string; passwordHash?: string; googleId?: string; displayName?: string }): Promise<User> {
  const id = randomUUID();
  await sql.begin(async (transaction) => {
    const role = input.email === process.env.OWNER_EMAIL ? "owner" : "user";
    await transaction`insert into users (id, email, username, password_hash, google_id, role) values (${id}, ${input.email}, ${input.username}, ${input.passwordHash ?? null}, ${input.googleId ?? null}, ${role})`;
    await transaction`insert into profiles (user_id, display_name) values (${id}, ${input.displayName || input.username})`;
    await transaction`insert into stars_transactions (user_id, amount, kind) values (${id}, 500, 'signup')`;
  });
  return (await findUserById(id))!;
}

export async function updateProfile(userId: string, patch: Record<string, string>): Promise<User | undefined> {
  const allowed = {
    displayName: patch.displayName?.trim().slice(0, 30),
    bio: patch.bio?.slice(0, 160),
    avatarSeed: patch.avatarSeed,
    avatarAnimation: patch.avatarAnimation,
    avatarFrame: patch.avatarFrame,
    siteTheme: patch.siteTheme,
    particles: patch.particles,
  };
  await sql`update profiles set display_name = coalesce(${allowed.displayName ?? null}, display_name), bio = coalesce(${allowed.bio ?? null}, bio), avatar_seed = coalesce(${allowed.avatarSeed ?? null}, avatar_seed), avatar_animation = coalesce(${allowed.avatarAnimation ?? null}, avatar_animation), avatar_frame = coalesce(${allowed.avatarFrame ?? null}, avatar_frame), site_theme = coalesce(${allowed.siteTheme ?? null}, site_theme), particles = coalesce(${allowed.particles ?? null}, particles), updated_at = now() where user_id = ${userId}`;
  return findUserById(userId);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomUUID().replaceAll("-", "") + randomUUID().replaceAll("-", "");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await sql`insert into sessions (token_hash, user_id, expires_at) values (${tokenHash}, ${userId}, now() + interval '30 days')`;
  return token;
}

export async function findUserBySession(token: string | undefined): Promise<User | undefined> {
  if (!token) return undefined;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const rows = await sql<{ user_id: string }[]>`select user_id from sessions where token_hash = ${tokenHash} and expires_at > now()`;
  return rows[0] ? findUserById(rows[0].user_id) : undefined;
}

export async function deleteSession(token: string | undefined) {
  if (!token) return;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await sql`delete from sessions where token_hash = ${tokenHash}`;
}

export async function claimDailyStars(userId: string): Promise<{ user: User; reward: number } | { error: "already_claimed" }> {
  const result = await sql.begin(async (transaction) => {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await transaction`select 1 from stars_transactions where user_id = ${userId} and kind = 'daily' and reference_id = ${today} limit 1`;
    if (existing.length) return null;
    const reward = 75;
    await transaction`update users set stars = stars + ${reward}, updated_at = now() where id = ${userId} and stars + ${reward} >= 0`;
    await transaction`insert into stars_transactions (user_id, amount, kind, reference_id) values (${userId}, ${reward}, 'daily', ${today})`;
    return reward;
  });
  if (result === null) return { error: "already_claimed" };
  return { user: (await findUserById(userId))!, reward: result as number };
}

export async function buyItem(userId: string, itemId: string): Promise<{ user: User; item: { price: number; kind: string; value: string } } | { error: "missing" | "owned" | "insufficient" }> {
  const result = await sql.begin(async (transaction) => {
    const items = await transaction<{ price: number; kind: string; value: string }[]>`select price, kind, value from shop_items where id = ${itemId}`;
    if (!items[0]) return "missing" as const;
    const purchased = await transaction`select 1 from purchases where user_id = ${userId} and item_id = ${itemId} limit 1`;
    if (purchased.length) return "owned" as const;
    const updated = await transaction`update users set stars = stars - ${items[0].price}, updated_at = now() where id = ${userId} and stars >= ${items[0].price} returning id`;
    if (!updated.length) return "insufficient" as const;
    await transaction`insert into purchases (user_id, item_id, price_paid) values (${userId}, ${itemId}, ${items[0].price})`;
    await transaction`insert into stars_transactions (user_id, amount, kind, reference_id) values (${userId}, ${-items[0].price}, 'purchase', ${itemId})`;
    return items[0];
  });
  if (typeof result === "string") return { error: result };
  return { user: (await findUserById(userId))!, item: result as { price: number; kind: string; value: string } };
}

export function publicUser(user: User) {
  const { passwordHash, googleId, lastDaily, ...safe } = user;
  return safe;
}
