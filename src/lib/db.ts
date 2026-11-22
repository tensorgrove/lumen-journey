import "server-only";
import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

const g = globalThis as unknown as { __ljDb?: Promise<DB> };

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  let db: DB;
  if (url) {
    // Production: any Postgres (Neon, Supabase, Vercel Postgres...)
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    const client = postgres(url, { prepare: false, max: 5 });
    db = drizzle(client, { schema }) as unknown as DB;
  } else {
    // Local development: embedded Postgres stored in ./.data, zero setup.
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const dir = process.env.PGLITE_DIR || "./.data/pglite";
    const { mkdirSync } = await import("node:fs");
    mkdirSync(dir, { recursive: true });
    const client = new PGlite(dir);
    db = drizzle(client, { schema }) as unknown as DB;
  }
  for (const stmt of schema.SCHEMA_SQL) await db.execute(sql.raw(stmt));
  await seedAdmin(db);
  return db;
}

async function seedAdmin(db: DB) {
  let email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  let password = process.env.ADMIN_PASSWORD;
  if ((!email || !password) && process.env.NODE_ENV !== "production") {
    email = "coach@example.com";
    password = "lumenjourney";
  }
  if (!email || !password) return;
  const hash = await bcrypt.hash(password, 10);
  await db
    .insert(schema.users)
    .values({ email, name: "Maya Hart", passwordHash: hash, isAdmin: true })
    .onConflictDoUpdate({ target: schema.users.email, set: { isAdmin: true, passwordHash: hash } });
}

export function getDb(): Promise<DB> {
  if (!g.__ljDb) {
    g.__ljDb = connect().catch((e) => {
      g.__ljDb = undefined;
      throw e;
    });
  }
  return g.__ljDb;
}

export { schema };
