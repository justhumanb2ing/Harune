## Stack by Category

- **Email**: Resend, React Email
- **Payment**: Stripe, PayPal, Paddle, Dodo Payments
- **Auth**: Better Auth, Google OAuth, Email/Password, Magic Link
- **Storage**: AWS S3, Cloudflare R2, Supabase Storage
- **Background Job**: Inngest
- **Analytics**: Umami, Betterlytics
- **More**: Next.js, React, TypeScript, Bun, Biome, TanStack Query, Sentry, Fumadocs MDX, AWS S3, T3, NextSEO

## Quick Start

```bash
bun install
cp .env.example .env.local
bun run dev

```

## Environment Variables

Minimum required variables:

- `NEXT_PUBLIC_APP_URL`
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
