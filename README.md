## Stack by Category

- **Email**: Resend, React Email
- **Payment**: Stripe, PayPal, Paddle, Dodo Payments
- **Auth**: Better Auth, Google OAuth, Email/Password, Magic Link
- **Database**: PostgreSQL, Drizzle ORM, Supabase, Neon
- **Background Job**: Inngest
- **Analytics**: Umami, Betterlytics
- **More**: Next.js, React, TypeScript, Bun, Biome, TanStack Query, Sentry, Fumadocs MDX, AWS S3, T3, NextSEO

## Quick Start

```bash
bun install
cp .env.example .env.local
bun run dev

```

## Database Schema

This template organizes Drizzle schemas into `core` and `extensions`.

- `src/db/schema/core/*`
  - The minimum schema set that is always included.
- `src/db/schema/extensions/*`
  - Optional schema modules that can be added when needed.

Drizzle reads `DB_MODULES` from `drizzle.config.ts` to decide which extensions to include.

### Supabase RLS and Better Auth

Better Auth remains the source of truth for users and sessions. Supabase RLS uses short-lived Better Auth JWTs only as a downstream authorization contract when a Supabase exposed role calls the database directly.

- `app_user`, Better Auth internals, JWKS, credit ledger, and coupon tables are RLS-enabled with no exposed-role policies by default.
- Public profile tables allow `anon` and `authenticated` reads. Authenticated writes require the JWT `sub` to match the owning `app_user.id`.
- `plans` allows public reads and keeps writes server-only.
- Next.js route guards and API checks still stay in place. RLS is the database defense layer, not the `/[handle]/app` UX or API authorization controller.
- Do not put service-role or secret database credentials in client code. Browser Supabase clients must use only a publishable key plus a Better Auth JWT access token.

### Core Schema

The default command targets the following tables:

- `app_user`
- `auth_account`
- `auth_session`
- `auth_verification`
- `plans`
- `credit_transactions`

### Extension Schema

- `coupons`
  - Creates: `coupon`
- `contact`
  - Creates: `contact`
- `paypal`
  - Creates: `paypal_access_tokens`, `paypal_context`
- `waitlist`
  - Creates: `waitlist`

### Apply Schema Directly to the Database

`push` reads the current code schema and applies it directly to the database pointed to by `DATABASE_URL`.

Create only the minimum schema:

```bash
bun run db:push
```

Created tables:

- All core schema tables

Add marketing-related modules:

```bash
DB_MODULES=contact,waitlist bun run db:push
```

Created tables:

- All core schema tables
- `contact`
- `waitlist`

Add only PayPal-related modules:

```bash
DB_MODULES=paypal bun run db:push
```

Created tables:

- All core schema tables
- `paypal_access_tokens`
- `paypal_context`

Add only coupon-related modules:

```bash
DB_MODULES=coupons bun run db:push
```

Created tables:

- All core schema tables
- `coupon`

Include all extensions:

```bash
DB_MODULES=coupons,contact,paypal,waitlist bun run db:push
```

Created tables:

- All core schema tables
- `coupon`
- `contact`
- `paypal_access_tokens`
- `paypal_context`
- `waitlist`

### Generate Migration Files and Apply Them

`generate` creates SQL migration files under `drizzle/`, and `migrate` applies those files to the actual database.

Generate SQL for the minimum schema:

```bash
bun run db:generate
```

Generate SQL with all extensions included:

```bash
DB_MODULES=coupons,contact,paypal,waitlist bun run db:generate
```

Apply generated SQL:

```bash
bun run db:migrate
```

### Specify Modules Directly

Both `db:push` and `db:generate` accept `DB_MODULES` directly so you can choose which extension schemas to include.

```bash
DB_MODULES=contact,waitlist bun run db:push
DB_MODULES=paypal bun run db:generate
```

Available values:

- `coupons`
- `contact`
- `paypal`
- `waitlist`

### Notes

- Running `db:push` applies the current schema directly to the database.
- Running `db:generate` only creates files and does not change the database.
- If you run `push` again against the same database with a smaller schema set, Drizzle may detect removals. Keep module combinations consistent for production databases.

## Environment Variables

Minimum required variables:

- `NEXT_PUBLIC_APP_URL`
- `DATABASE_URL`
- `AUTH_SECRET`
- `BETTER_AUTH_URL`

For additional payment, email, S3, and Sentry settings, see `.env.example`.

## SEO Customization

SEO defaults are managed in `src/lib/seo/index.ts`.

- Site name, default description, and default OG image: `seoConfig`
- Canonical URL generation: `absoluteUrl`
- Page metadata generation: `createPageMetadata`

On each page, passing `createPageMetadata({ path, title, description })`
applies `openGraph`, `twitter`, and `canonical` metadata consistently.

## Notes

- Store real secrets only in `.env.local`.
- `.env` and `.env.local` are configured to stay untracked by Git.
