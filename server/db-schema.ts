import { boolean, date, integer, jsonb, pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  role: text("role").notNull().default("user"),
  stars: integer("stars").notNull().default(500),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  bio: text("bio").notNull().default(""),
  avatarSeed: text("avatar_seed").notNull().default(""),
  avatarAnimation: text("avatar_animation").notNull().default("float"),
  avatarFrame: text("avatar_frame").notNull().default("none"),
  siteTheme: text("site_theme").notNull().default("white"),
  particles: text("particles").notNull().default("dust"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const starsTransactions = pgTable("stars_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  kind: text("kind").notNull(),
  referenceId: text("reference_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ dailyReward: uniqueIndex("stars_daily_reward_idx").on(table.userId, table.kind, table.createdAt) }));

export const shopItems = pgTable("shop_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  kind: text("kind").notNull(),
  value: text("value").notNull(),
  active: boolean("active").notNull().default(true),
});

export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull().references(() => shopItems.id),
  pricePaid: integer("price_paid").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ onePerItem: uniqueIndex("user_shop_item_idx").on(table.userId, table.itemId) }));

export const games = pgTable("games", { id: uuid("id").primaryKey().defaultRandom(), title: text("title").notNull(), description: text("description").notNull(), thumbnail: text("thumbnail").notNull().default(""), url: text("url").notNull().default(""), embedSource: text("embed_source").notNull().default(""), category: text("category").notNull(), tags: jsonb("tags").notNull().default([]), developer: text("developer").notNull(), version: text("version").notNull().default("1.0.0"), popularity: integer("popularity").notNull().default(0), status: text("status").notNull().default("draft"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() });
export const gameSubmissions = pgTable("game_submissions", { id: uuid("id").primaryKey().defaultRandom(), gameId: uuid("game_id").references(() => games.id, { onDelete: "cascade" }), submittedBy: uuid("submitted_by").notNull().references(() => users.id), status: text("status").notNull().default("pending"), reviewNote: text("review_note"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() });
export const apps = pgTable("apps", { id: uuid("id").primaryKey().defaultRandom(), name: text("name").notNull(), description: text("description").notNull(), icon: text("icon").notNull().default(""), url: text("url").notNull(), category: text("category").notNull(), embedSettings: jsonb("embed_settings").notNull().default({}), developer: text("developer").notNull(), status: text("status").notNull().default("draft") });
export const appSubmissions = pgTable("app_submissions", { id: uuid("id").primaryKey().defaultRandom(), appId: uuid("app_id").references(() => apps.id, { onDelete: "cascade" }), submittedBy: uuid("submitted_by").notNull().references(() => users.id), status: text("status").notNull().default("pending"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() });
export const announcements = pgTable("announcements", { id: uuid("id").primaryKey().defaultRandom(), title: text("title").notNull(), body: text("body").notNull(), status: text("status").notNull().default("draft"), createdBy: uuid("created_by").notNull().references(() => users.id), publishedAt: timestamp("published_at", { withTimezone: true }) });
export const chatServers = pgTable("chat_servers", { id: uuid("id").primaryKey().defaultRandom(), name: text("name").notNull(), icon: text("icon").notNull().default(""), ownerId: uuid("owner_id").notNull().references(() => users.id) });
export const chatCategories = pgTable("chat_categories", { id: uuid("id").primaryKey().defaultRandom(), serverId: uuid("server_id").notNull().references(() => chatServers.id, { onDelete: "cascade" }), name: text("name").notNull() });
export const chatChannels = pgTable("chat_channels", { id: uuid("id").primaryKey().defaultRandom(), categoryId: uuid("category_id").notNull().references(() => chatCategories.id, { onDelete: "cascade" }), name: text("name").notNull() });
export const messages = pgTable("messages", { id: uuid("id").primaryKey().defaultRandom(), channelId: uuid("channel_id").notNull().references(() => chatChannels.id, { onDelete: "cascade" }), authorId: uuid("author_id").notNull().references(() => users.id), body: text("body").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() });
export const notifications = pgTable("notifications", { id: uuid("id").primaryKey().defaultRandom(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), kind: text("kind").notNull(), title: text("title").notNull(), body: text("body").notNull(), readAt: timestamp("read_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() });
export const bookmarks = pgTable("bookmarks", { id: uuid("id").primaryKey().defaultRandom(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), url: text("url").notNull(), title: text("title").notNull().default(""), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() });
export const userSettings = pgTable("user_settings", { userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }), settings: jsonb("settings").notNull().default({}), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow() });
