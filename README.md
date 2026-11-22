# The Lumen Journey

A guided coaching web app. Visitors bring what's weighing on them to the Lantern for free, create an account, unlock the journey, and work through three steps (strengths, direction, voice) to their Horizon. The coach has a dashboard to see who is taking the journey and to edit every word and price without touching code.

> **Portfolio demo.** "Lumen Coaching" and "Maya Hart" are a fictional brand and coach created for this demo. All artwork is original.

## What's inside

| Area | What it does |
|---|---|
| `/` | Opening page with two paths: *Transform a challenge* and *Find your purpose* |
| `/lantern` | The free first step. Works without an account; the result is linked to the account if they sign up afterwards |
| `/signup`, `/signin` | Email and password accounts, secure session cookie |
| `/journey` | The journey map. Progress is stored on the server, so it follows the person to any device |
| `/unlock` | Plans and prices. Real Stripe Checkout when Stripe keys are set, otherwise a clearly labeled preview checkout |
| `/step/strengths`, `/step/direction`, `/step/voice`, `/horizon` | The three steps and the final Horizon. Each step only opens after payment and after the step before it |
| `/coach` | Coach dashboard: visitors, accounts, members, revenue, a funnel from first step to Horizon, what people bring to the Lantern, and a list of people with their progress. Includes a "Load sample people" button for demos |
| `/coach/content` | The coach edits headline, challenges (what goes in, what it lights up, their words), qualities, step 3 feedback, plans and prices, and booking link. No code needed |

**Stack:** Next.js 16 (App Router, Server Actions) · TypeScript · Postgres with Drizzle ORM · Stripe Checkout · bcrypt + signed JWT sessions.

## Run it locally (no setup)

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without `DATABASE_URL`, the app uses an embedded Postgres (PGlite) stored in `./.data`, so nothing else needs installing. Fonts are bundled through `@fontsource`, and payments use the built-in preview checkout when Stripe keys aren't set, so after `npm install` the app runs fully offline. To start over with an empty database, stop the server and delete the `.data` folder.

In development, the coach login is created automatically:

- Email: `coach@example.com`
- Password: `lumenjourney`

## Deploy to Vercel (about 15 minutes)

1. **Database.** Create a free Postgres database at [neon.tech](https://neon.tech) and copy its connection string. Tables are created automatically on first start.
2. **Code.** Push this folder to a GitHub repository.
3. **Vercel.** Import the repository at [vercel.com/new](https://vercel.com/new). Add these environment variables (see `.env.example`):
   - `DATABASE_URL`: the Neon connection string
   - `SESSION_SECRET`: a long random string (`openssl rand -hex 32`)
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD`: the coach dashboard login
   - `SITE_URL`: the site's address, e.g. `https://lumen-journey.vercel.app`
4. Deploy. Visit `/coach`, sign in, and press **Load sample people** if you want the dashboard to look busy for a demo. **Remove sample people** clears them again.

## Turn on real Stripe Checkout (test mode)

1. In the Stripe dashboard, switch to **Test mode** and copy the secret key (`sk_test_…`) into `STRIPE_SECRET_KEY`.
2. Add a webhook endpoint `https://YOUR-SITE/api/stripe/webhook` for the event `checkout.session.completed`, and copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
3. Redeploy. The unlock page now goes to a real Stripe Checkout page. Use card `4242 4242 4242 4242`, any future date, any CVC. Nothing is charged in test mode.

Payment is confirmed twice for reliability: on the return page, and by the webhook. Whichever arrives first marks the person as paid; the other is ignored.

A banner at the top of every page shows whether payments are simulated or in Stripe test mode. It disappears with live keys.

## Where things live

```
src/lib/content.ts      Default words, challenges, plans (the coach's edits are saved over these)
src/lib/schema.ts       Database tables
src/lib/db.ts           Postgres connection (Neon in production, PGlite locally) and admin seeding
src/lib/auth.ts         Sessions and anonymous visitor ids
src/lib/data.ts         Progress, step gating, payments
src/app/actions.ts      Server actions: lantern, accounts, checkout, steps, coach editor, sample data
src/app/coach/          Coach dashboard and editor
public/                 Lantern, horizon and badge artwork (original SVG)
```
