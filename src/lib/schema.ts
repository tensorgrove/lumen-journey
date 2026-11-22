import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  planId: text("plan_id"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  isSample: boolean("is_sample").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const progress = pgTable("progress", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  path: text("path"),
  challengeId: text("challenge_id"),
  strengths: jsonb("strengths").$type<string[]>().notNull().default([]),
  purpose: text("purpose"),
  steps: jsonb("steps").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lanternRuns = pgTable("lantern_runs", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  path: text("path"),
  challengeId: text("challenge_id").notNull(),
  isSample: boolean("is_sample").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  planId: text("plan_id").notNull(),
  amountCents: integer("amount_cents").notNull(),
  provider: text("provider").notNull(), // "stripe" | "demo"
  status: text("status").notNull(), // "paid"
  ref: text("ref").unique(),
  isSample: boolean("is_sample").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const content = pgTable("content", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Progress = typeof progress.$inferSelect;

// Plain SQL used to create the tables on first run (no migration step needed).
export const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    plan_id TEXT,
    paid_at TIMESTAMPTZ,
    is_sample BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS progress (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    path TEXT,
    challenge_id TEXT,
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    purpose TEXT,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS lantern_runs (
    id SERIAL PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    path TEXT,
    challenge_id TEXT NOT NULL,
    is_sample BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    provider TEXT NOT NULL,
    status TEXT NOT NULL,
    ref TEXT UNIQUE,
    is_sample BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS content (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS lantern_runs_visitor_idx ON lantern_runs(visitor_id)`,
];
