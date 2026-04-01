# Database Guide

This project uses **Drizzle ORM** with **Supabase (PostgreSQL)**.
All schema is defined in TypeScript — no raw SQL needed for day-to-day work.

---

## Table of Contents

1. [First-Time Setup](#1-first-time-setup)
2. [Schema Overview](#2-schema-overview)
3. [Making Schema Changes](#3-making-schema-changes)
4. [Running Migrations](#4-running-migrations)
5. [Useful Commands](#5-useful-commands)
6. [Common Mistakes to Avoid](#6-common-mistakes-to-avoid)
7. [Using the DB in Code](#7-using-the-db-in-code)

---

## 1. First-Time Setup

### Step 1 — Copy the env file

```bash
cp .env.local.example .env.local
```

### Step 2 — Fill in your DATABASE_URL

Go to your Supabase dashboard:

```
Supabase Dashboard → Settings → Database → Connection String → Transaction mode
```

It looks like:

```
postgresql://postgres.axexjyczzrmlrbqqgueh:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

Paste it into `.env.local` as `DATABASE_URL`.

> **Why Transaction mode (port 6543)?**
> Next.js is serverless — each request opens a new connection. Transaction mode pools those connections so Supabase isn't overwhelmed. Never use the direct connection (port 5432) in production.

### Step 3 — Install dependencies

```bash
npm install
```

### Step 4 — Push schema to the database

If this is a **fresh database** (no existing tables):

```bash
npm run db:push
```

This creates all tables directly from the TypeScript schema. Done.

---

## 2. Schema Overview

Files are in `src/lib/db/schema/`:

```
schema/
  sites.ts        → The 3 delivery sites (Newcastle Eats, Kilkeel Eats, Downpatrick Eats)
  restaurants.ts  → Restaurants belonging to a site
  menu.ts         → Menu categories and menu items per restaurant
  orders.ts       → Customer orders with status tracking
  relations.ts    → Drizzle relations (joins) — DO NOT define relations elsewhere
  index.ts        → Re-exports everything (don't edit this manually)
```

### Tables at a glance

| Table | Primary Key | Notable columns |
|---|---|---|
| `sites` | `key` (e.g. `"kilkeeleats"`) | theme, stats, contact info |
| `restaurants` | `uuid` | `site_key` FK, `delivery_fee_pence`, `is_active` |
| `menu_categories` | `uuid` | `restaurant_id` FK, `sort_order` |
| `menu_items` | `uuid` | `restaurant_id` FK, `price_pence`, `is_available` |
| `orders` | `uuid` | `status` enum, `items` JSONB snapshot, totals in pence |

> **Prices are stored in pence (integers).**
> £9.99 = `999`. This avoids floating-point rounding bugs. Always divide by 100 when displaying.

---

## 3. Making Schema Changes

All schema changes happen in the TypeScript files — **never edit the database directly** unless it's an emergency.

### Adding a new column

Open the relevant schema file and add the column:

```ts
// src/lib/db/schema/restaurants.ts
export const restaurants = pgTable("restaurants", {
  // ... existing columns ...
  averageRating: integer("average_rating"), // ← add this
});
```

Then generate and run a migration (see [Section 4](#4-running-migrations)).

### Adding a new table

1. Create a new file in `src/lib/db/schema/`, e.g. `drivers.ts`
2. Define your table using Drizzle helpers
3. Add relations for it in `relations.ts`
4. Export it from `schema/index.ts`

```ts
// schema/index.ts
export * from "./drivers"; // ← add this line
```

### Renaming a column

Do **not** just rename the TypeScript field. Drizzle will see it as a drop + add (data loss).
Instead, use an explicit column name:

```ts
// BAD — Drizzle will drop the old column and create a new one
firstName: varchar("firstName", { length: 100 })

// GOOD — rename the TS field but keep the DB column name the same, then migrate in two steps
firstName: varchar("first_name", { length: 100 })
```

If you genuinely need to rename a DB column, write a custom SQL migration (see below).

### Removing a column

Remove it from the schema file, generate a migration, review the SQL before applying — dropping a column is destructive and irreversible.

---

## 4. Running Migrations

There are two workflows depending on the situation.

---

### Workflow A — Development (quick iteration)

Use `db:push` to sync your schema directly to the database **without** creating migration files.
Best for: local dev, staging, early-stage projects where you don't need a migration history yet.

```bash
npm run db:push
```

Drizzle will show you what it's about to change and ask for confirmation before applying.

---

### Workflow B — Production (safe, tracked migrations)

Use this when working on a shared database or going to production.

#### Step 1 — Generate the migration file

```bash
npm run db:generate
```

This reads your schema and creates a `.sql` file in `drizzle/migrations/`.
**Always review this file before proceeding.** Check that it only contains what you expect.

```
drizzle/migrations/
  0000_initial_schema.sql
  0001_add_average_rating.sql   ← example of a new migration
  meta/
    _journal.json               ← Drizzle tracks which migrations have run
```

#### Step 2 — Review the generated SQL

Open the `.sql` file and read it. Confirm:
- No unexpected `DROP TABLE` or `DROP COLUMN` statements
- Column types match what you intended
- Foreign keys look correct

#### Step 3 — Apply the migration

```bash
npm run db:migrate
```

Drizzle applies any pending migrations in order. It tracks what's already been run so it won't apply the same migration twice.

#### Step 4 — Commit the migration file

```bash
git add drizzle/migrations/
git commit -m "db: add average_rating to restaurants"
```

Migration files are part of the codebase. Every developer and every deployment environment needs them to stay in sync.

---

### Custom SQL migrations

For things Drizzle can't handle automatically (e.g. column renames, backfilling data):

1. Run `npm run db:generate` to create an empty migration file
2. Open the generated `.sql` file and write your SQL manually
3. Apply with `npm run db:migrate`

Example of a safe column rename in SQL:

```sql
-- Rename first_name to given_name safely
ALTER TABLE customers RENAME COLUMN first_name TO given_name;
```

---

## 5. Useful Commands

| Command | When to use |
|---|---|
| `npm run db:push` | Sync schema changes in dev/staging quickly |
| `npm run db:generate` | Create a migration file for production |
| `npm run db:migrate` | Apply pending migrations to the database |
| `npm run db:studio` | Open a visual browser of your database at `localhost:4983` |
| `npm run db:pull` | Pull the current DB schema back into Drizzle format (useful if DB was edited directly) |

---

## 6. Common Mistakes to Avoid

### Never edit `drizzle/migrations/` files after they've been applied

Once a migration has run on any database (local, staging, production), treat it as immutable. If you need to fix something, generate a new migration.

### Never edit the database directly in production

If you run raw SQL in the Supabase SQL editor on the production database, Drizzle won't know about it. The next migration might conflict or produce unexpected diffs. If you must make an emergency fix directly, immediately run `npm run db:pull` to re-sync and commit the diff.

### Don't use `db:push` in production

`db:push` is interactive and doesn't leave a migration trail. Use `db:migrate` for production.

### Don't commit `.env.local`

It's in `.gitignore`. Never commit database credentials. Use `.env.local.example` to document what's needed.

### Migration files must be committed alongside code changes

If you add a column to the schema AND write code that uses it, both the schema change and the migration file must be in the same PR. Otherwise the next person to pull will have code that references a column that doesn't exist yet in their database.

---

## 7. Using the DB in Code

Import the `db` instance and your schema tables:

```ts
import { db } from "@/lib/db";
import { restaurants, menuItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Fetch all active restaurants for a site
const results = await db
  .select()
  .from(restaurants)
  .where(and(eq(restaurants.siteKey, "kilkeeleats"), eq(restaurants.isActive, true)));

// Insert a new restaurant
await db.insert(restaurants).values({
  siteKey: "kilkeeleats",
  name: "The Anchor Bar",
  slug: "the-anchor-bar",
  deliveryFee: 199,       // £1.99 in pence
  minOrderPence: 1000,    // £10.00 minimum
  estimatedMinutes: 30,
});

// Update a restaurant
await db
  .update(restaurants)
  .set({ isOpen: false })
  .where(eq(restaurants.id, "some-uuid"));

// Delete
await db.delete(menuItems).where(eq(menuItems.id, "some-uuid"));
```

Use `npm run db:studio` to visually browse data while developing.
