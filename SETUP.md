# Kalpa Living — Setup & Hand-off Guide

A lightweight e-commerce store that takes **UPI payments** (Google Pay, PhonePe, Paytm, BHIM…),
sends **order confirmation emails**, gives customers **order tracking**, and has a **no-code admin panel**.

**Stack:** Next.js 16 (React) · PostgreSQL · Drizzle ORM · Tailwind CSS · Razorpay (UPI) · Nodemailer.
One codebase, one database, no third-party CMS to keep patched.

---

## 1. What's in the box

| Path | What it is |
|---|---|
| `src/app/(store)/` | Storefront pages: home/catalogue, product, cart, checkout, UPI pay page, order tracking |
| `src/app/admin/` | Admin panel: dashboard, orders, products, settings |
| `src/app/api/checkout` | Creates an order + payment |
| `src/app/api/payments/razorpay/verify` | Verifies a Razorpay UPI payment (signature check) |
| `src/app/api/payments/razorpay/webhook` | Razorpay webhook (safety net if the customer closes the browser) |
| `src/app/api/payments/sandbox/complete` | Built-in UPI simulator callback |
| `src/lib/payments/` | **Payment gateway abstraction** — Razorpay UPI, sandbox, and stubs for Stripe/PayPal/Square |
| `src/lib/orders.ts` | Order creation, payment finalisation (idempotent), stock deduction, status updates |
| `src/lib/email.ts` | Confirmation + status-update emails (SMTP) |
| `src/db/schema.ts` | Database schema (source of truth) |
| `docs/schema.sql` | The same schema as plain SQL (for DBAs / manual setup) |
| `drizzle/` | Generated migration files |
| `.env.example` | Every setting, explained |
| `scripts/handoff.sh` | Builds the source zip |

---

## 2. Run it locally (10 minutes)

**You need:** Node.js 20+ and PostgreSQL 14+.

```bash
# 1. unzip, then install dependencies
npm install

# 2. create your settings file
cp .env.example .env
#    edit DATABASE_URL to point at your PostgreSQL. e.g.
#    DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db

# 3. create the tables
npx drizzle-kit push          # or: psql "$DATABASE_URL" -f docs/schema.sql

# 4. start
npm run dev                   # http://localhost:3000
```

The first time the home page loads with an empty database it **auto-seeds 8 sample products**
(edit or delete them in the admin).

- Store: <http://localhost:3000>
- Admin: <http://localhost:3000/admin> — password `admin123` until you set `ADMIN_PASSWORD`

### Do a test UPI transaction right now (no gateway account needed)
1. Add a product to the cart → **Checkout with UPI** → fill in the address → **Pay**.
2. You land on the built-in UPI sandbox page (QR code + GPay/PhonePe/Paytm/BHIM buttons).
3. Click **Approve payment**. You're redirected to the order page with a ✅ confirmation.
4. Open **Admin → Orders**: the order is there with status **Paid**, a UPI reference,
   stock reduced, and an entry in the email log.

That is the same code path used for real Razorpay payments — only the "who confirms the money"
step changes.

---

## 3. Going live with real UPI (Razorpay)

Razorpay is an RBI-licensed payment aggregator. Its checkout supports every UPI app (intent),
"enter your UPI ID" (collect) and dynamic QR. Cards, net banking, wallets can be switched on later
from the same account.

### 3.1 Sandbox (test) keys — no money moves
1. Sign up at <https://dashboard.razorpay.com> → switch to **Test Mode** (toggle top-left).
2. **Settings → API Keys → Generate Test Key.** Copy Key ID (`rzp_test_…`) and Key Secret.
3. In `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
   ```
4. Restart the app. **Admin → Settings** now shows *Razorpay · TEST*.
5. Place an order. The Razorpay window opens showing **only UPI**. In test mode Razorpay lets you
   pick *success* or *failure* — choose success, and the order flips to Paid exactly like the sandbox.

### 3.2 Webhook (strongly recommended before live)
Protects you when a customer pays but closes the tab before the site hears back.

1. Deploy the site somewhere with an https URL (see §6) and set `NEXT_PUBLIC_BASE_URL=https://yourdomain.com`.
2. Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**
   - URL: `https://yourdomain.com/api/payments/razorpay/webhook`
   - Secret: any long random string — put the same value in `.env` as `RAZORPAY_WEBHOOK_SECRET`
   - Events: tick **payment.captured** and **payment.failed**
3. Restart. Test by paying and closing the window immediately — the order still turns Paid.

### 3.3 Live keys — real money
1. Complete KYC on the Razorpay dashboard (business docs, bank account). Takes 1–3 working days.
2. Switch the dashboard toggle to **Live Mode** → Settings → API Keys → Generate Live Key.
3. Replace the two values in `.env` with `rzp_live_…` keys. Add a live-mode webhook (same URL) too.
4. Restart. Admin → Settings should say *Razorpay · LIVE*. Do one ₹1 order yourself and refund it
   from the Razorpay dashboard.

`PAYMENT_MODE` (optional): `auto` (default: Razorpay if keys exist, else sandbox),
`razorpay` (never fall back to sandbox — set this in production), `sandbox` (force simulator).

> **Alternatives**: the same provider file pattern works for Cashfree, PhonePe PG or PayU if you
> ever prefer another aggregator — see §5.

---

## 4. Emails

Emails are sent automatically:
- **Order confirmation** — the moment a payment is confirmed (client callback *or* webhook, whichever comes first; never twice).
- **Status update** — when you change an order's status in the admin (Processing / Shipped / Delivered / Cancelled) with "Email the customer" ticked. Includes courier + tracking number if you filled them in.

Any SMTP provider works. Example with Gmail (create an *App Password* in your Google account):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM="Kalpa Living <you@gmail.com>"
```
Brevo, Zoho Mail, Amazon SES, Resend and Postmark all provide SMTP credentials that drop in the same way.

Until `SMTP_HOST` is set, emails are **not sent** but are recorded in the admin (order page →
"Emails & gateway events") so you can see exactly what would have gone out.

---

## 5. Adding PayPal / Stripe / Square later (no rebuild)

Everything payment-related goes through the `PaymentProvider` interface in
`src/lib/payments/types.ts`. Checkout, order finalisation, stock, emails and the admin never
talk to a gateway directly.

To add one:
1. Open `src/lib/payments/future-providers.ts` — there is already a stub for each.
2. Implement two functions:
   - `createPayment(order)` → call the gateway, return either
     `{ kind: "redirect", url }` (PayPal approve URL, Stripe Checkout URL) or a new `ClientAction` kind.
   - `confirmFromClient(order, params)` → verify with the gateway server-side and return `{ paid: true, providerPaymentId, methodLabel }`.
3. Add a webhook route by copying `src/app/api/payments/razorpay/webhook/route.ts`.
4. Set the gateway's env var (e.g. `STRIPE_SECRET_KEY`). `isConfigured()` becomes true and it
   appears in the checkout's provider list automatically.

Amounts are already stored in the smallest currency unit (paise), which is what all of these
gateways expect.

---

## 6. Deploying

Any host that runs Node.js + PostgreSQL works. Simplest options:

- **Vercel + Neon/Supabase Postgres** — import the repo, add the `.env` values as project
  environment variables, done. (`npm run build` is the build command.)
- **Railway / Render** — one Node service + one Postgres add-on.
- **Docker (self-hosted)** — use the included `Dockerfile` + `docker-compose.yml`.
- **Your own VPS** — `npm ci && npm run build && npm run start` behind Nginx/Caddy with https.

Before launch checklist:
- [ ] `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` set to long random values
- [ ] `NEXT_PUBLIC_BASE_URL` = your https domain (email links + webhook)
- [ ] `PAYMENT_MODE=razorpay` with live keys and webhook secret
- [ ] SMTP configured and one test email received
- [ ] Sample products removed or replaced (Admin → Products)

---

## 6a. Docker Deployment

### Local development with Docker (no local Postgres needed)

```bash
cp .env.example .env        # set DATABASE_URL and other vars
docker compose up --build   # starts app on :3000 + postgres on :5432
```

The `docker-compose.yml` file starts two services:
| Service | Image | Port |
|---|---|---|
| `app` | Built from `Dockerfile` | 3000 |
| `db` | `postgres:16-alpine` | 5432 |

Data is persisted in a named Docker volume (`postgres_data`) — it survives container restarts.

### Production Docker deployment

The `Dockerfile` uses a **multi-stage build** for the smallest possible production image:

```
Stage 1 (install)  →  npm ci  →  all node_modules
Stage 2 (build)    →  next build  →  .next/standalone output
Stage 3 (runtime)  →  node:20-alpine + standalone output only (~150 MB image)
```

```bash
# Build the production image
docker build -t kalpa-living:latest .

# Run with environment variables
docker run -d \
  --name kalpa-living \
  -p 3000:3000 \
  --env-file .env.production \
  kalpa-living:latest
```

**Health check** — Docker will automatically probe `GET /api/health` every 30 s:
```bash
curl http://localhost:3000/api/health
# → {"status":"ok","db":"ok","timestamp":"..."}
```

### Deploy to a VPS with docker compose (production)

```bash
# On the VPS
git clone https://github.com/Sehaan-1/e-commerce-site-with-upi-integration.git
cd e-commerce-site-with-upi-integration
cp .env.production.example .env   # fill in ALL values
docker compose -f docker-compose.yml up -d
```

Put **Nginx or Caddy** in front for HTTPS:

**Caddyfile** (simplest, auto-TLS with Let's Encrypt):
```
yourdomain.com {
    reverse_proxy localhost:3000
}
```

**Nginx snippet**:
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    # ssl_certificate / ssl_certificate_key via certbot

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6b. CI/CD Pipeline

The project ships two GitHub Actions workflows in `.github/workflows/`.

### `ci.yml` — runs on every push and pull request

```
push / pull_request to main
         │
    ┌────┴────┐
    │         │
  lint      test
 (ESLint +  (Vitest unit
 TypeScript) tests)
    │         │
    └────┬────┘
         │
       build
  (next build — ensure
   production build works)
         │
        e2e
  (Playwright E2E, optional —
   runs against ephemeral DB)
```

**What each job does:**

| Job | Command | Fails on |
|---|---|---|
| `lint` | `npm run lint && npm run typecheck` | ESLint warnings, TypeScript errors |
| `test` | `npm run test` | Any failing unit test |
| `build` | `npm run build` | Build errors, missing env vars |
| `e2e` | `npm run test:e2e` | Broken user flows (checkout, tracking) |

### `deploy.yml` — runs on push to `main` (after CI passes)

Builds a Docker image, pushes to GitHub Container Registry (`ghcr.io`), then optionally deploys to your hosting platform.

```bash
# The image is tagged with the commit SHA and `latest`
ghcr.io/sehaan-1/e-commerce-site-with-upi-integration:latest
ghcr.io/sehaan-1/e-commerce-site-with-upi-integration:abc1234
```

**To enable deployment**, add these secrets to your GitHub repository settings:

| Secret | Value |
|---|---|
| `DATABASE_URL` | Production Postgres connection string |
| `ADMIN_PASSWORD` | Strong admin password |
| `ADMIN_SESSION_SECRET` | 32+ char random string |
| `RAZORPAY_KEY_ID` | Live Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Live Razorpay key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature secret |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Email credentials |
| `NEXT_PUBLIC_BASE_URL` | Production HTTPS domain |

> **Vercel users**: You don't need `deploy.yml` — Vercel auto-deploys from the `main` branch.
> Just set your env vars in the Vercel project dashboard.

---

## 7. Day-to-day admin

- **Products** — add/edit name, description, price, "was" price, stock, category, image, visibility,
  featured flag. Inline stock editing on the list page. Hide rather than delete to keep order history.
- **Product images** — put JPG/PNG files in `public/products/` and use `/products/filename.jpg`, or
  paste any https image URL (e.g. from your Google Drive/Cloudinary).
- **Orders** — filter by status, open an order to see items, address, payment reference, timeline,
  email log and raw gateway events. Update status + courier/tracking; the customer gets an email.
- **Stock** is deducted only when payment succeeds. Unpaid ("Awaiting payment") orders are
  abandoned checkouts and don't hold stock.
- **Customers** track orders via the link in their email or at `/track` (order number + email).

---

## 8. Database at a glance

```
products              catalogue (price_paise, stock, active, featured …)
orders                one row per checkout; status + payment_status + provider refs
order_items           line items (snapshot of name/price at purchase time)
order_status_history  timeline shown to the customer
payment_events        every gateway callback / webhook (audit trail)
email_log             every email sent / skipped / failed
```
Full DDL: `docs/schema.sql`. Money columns are integers in paise (₹499 = 49900).

---

## 9. Performance notes (Lighthouse)

- Pages are server-rendered; the storefront ships almost no client JavaScript (cart state only).
- Product images go through `next/image` (responsive sizes, lazy-load, WebP/AVIF).
- No web fonts; system font stack. No third-party scripts on the storefront — Razorpay's
  checkout script loads **only** after the customer clicks Pay.
- Run `npx lighthouse https://yourdomain.com --preset=mobile` after deploying to confirm 90+.

## 10. Hand-off zip

```bash
bash scripts/handoff.sh      # -> ../kalpa-living-source.zip (source + schema + this guide, no secrets)
```
