This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## API rate limiting

The `/api/explain` endpoint now includes an in-memory per-IP rate limiter to reduce abuse and protect your AI quota.

You can configure it with environment variables:

- `API_RATE_LIMIT_MAX_REQUESTS` (default: `10`)
- `API_RATE_LIMIT_WINDOW_MS` (default: `60000`)

Example `.env.local` values:

```bash
API_RATE_LIMIT_MAX_REQUESTS=10
API_RATE_LIMIT_WINDOW_MS=60000
```


## Subscription and billing setup

Free tier + subscription controls for `/api/explain`:

- `DAILY_FREE_TRANSLATIONS` (default: `5`)
- `PADDLE_CHECKOUT_URL` (link shown when subscription is required)

Account and subscription cookies used by the app:

- `translator_account_email` (set through `/api/account/session`)
- `translator_subscription_ends_at` (ISO datetime used to determine active subscription)

### Notes

- The `/account` page lets users create/sign in with email (cookie-based starter flow).
- The `/pricing` page shows plan details and links to Paddle checkout.
- The `/refund-policy` page contains a template policy; update it for your legal needs.
- In production, update subscription state from Paddle webhooks and persist account/subscription data in a database.
