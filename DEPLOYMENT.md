# Deployment Guide: Vercel + Neon Postgres

This guide walks you through deploying **Kalpa Living** to **Vercel** with a free serverless **PostgreSQL** database on **Neon** (or Supabase).

---

## Architecture Overview

- **Frontend & Serverless API**: Hosted on [Vercel](https://vercel.com) (Next.js 16 App Router).
- **Database**: Managed Serverless Postgres on [Neon](https://neon.tech) (Free tier: 0.5 GB, connection pooling built-in).
- **Payment Gateway**: UPI via Razorpay (or Sandbox mode for instant testing).
- **Transactional Emails**: SMTP via Brevo, SendGrid, or Resend.

---

## Step 1: Set Up Free PostgreSQL on Neon

1. Go to [neon.tech](https://neon.tech) and sign up / log in with your GitHub account.
2. Click **Create Project**:
   - **Project Name**: `kalpa-living-db` (or any name)
   - **Region**: Select the region closest to your users (e.g., `AWS ap-south-1` for India / Mumbai, or `AWS us-east-1`).
   - Click **Create Project**.
3. In the Neon Dashboard, copy the **Connection string**.
   - Make sure to toggle **Pooled connection** (recommended for Vercel serverless functions).
   - Your URL will look like:
     ```
     postgresql://user:password@ep-xyz-pooler.ap-south-1.aws.neon.tech/neondb?sslmode=require
     ```

---

## Step 2: Initialize the Database Schema

You can initialize tables in one of two easy ways:

### Option A: Via Neon Web SQL Editor (Simplest)
1. In the Neon dashboard, click **SQL Editor** on the left menu.
2. Open [`docs/schema.sql`](./docs/schema.sql) from this repository.
3. Paste the contents into the SQL Editor and click **Run**.
4. All tables (`products`, `orders`, `order_items`, `order_status_history`, `email_log`) and enums are created.

### Option B: From Your Local Terminal
Run Drizzle push with your Neon connection string:
```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://user:password@ep-xyz-pooler.ap-south-1.aws.neon.tech/neondb?sslmode=require"
npm run db:push
```

> **Note on Catalog Seeding**: Once tables exist, the application will automatically populate the initial 8 curated products on the very first page load via `ensureSeeded()`.

---

## Step 3: Deploy to Vercel

### 1. Import Your GitHub Repository
1. Go to [vercel.com/new](https://vercel.com/new) and log in with your GitHub account.
2. Under **Import Git Repository**, search for `e-commerce-site-with-upi-integration` and click **Import**.

### 2. Configure Environment Variables
In the Vercel project configuration screen, expand **Environment Variables** and add:

| Variable | Recommended / Example Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://...-pooler...neon.tech/neondb?sslmode=require` | Your Neon pooled connection string |
| `NEXT_PUBLIC_BASE_URL` | `https://your-project.vercel.app` | Leave as your Vercel URL (or custom domain) |
| `NEXT_PUBLIC_STORE_NAME` | `Kalpa Living` | Store brand title |
| `SUPPORT_EMAIL` | `support@yourdomain.com` | Customer support email |
| `FREE_SHIPPING_THRESHOLD_PAISE` | `99900` | ₹999 free shipping mark |
| `FLAT_SHIPPING_PAISE` | `7900` | ₹79 delivery fee |
| `ADMIN_PASSWORD` | *(Your choice of strong password)* | Password for `/admin/login` |
| `ADMIN_SESSION_SECRET` | *(64-character random hex)* | Used to sign admin session cookies |
| `PAYMENT_MODE` | `sandbox` *(or `razorpay`)* | Use `sandbox` to test UPI instantly without live keys |
| `MERCHANT_UPI_ID` | `store@bank` | Your merchant UPI handle |

#### If Using Live Razorpay:
| Variable | Example Value | Description |
|---|---|---|
| `PAYMENT_MODE` | `razorpay` | Enable live payment processing |
| `RAZORPAY_KEY_ID` | `rzp_live_...` | From Razorpay Dashboard |
| `RAZORPAY_KEY_SECRET` | `...` | From Razorpay Dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | `...` | Secret configured in Razorpay Webhooks |

#### If Using Transactional Email (Optional):
| Variable | Example Value | Description |
|---|---|---|
| `SMTP_HOST` | `smtp-relay.brevo.com` | SMTP host |
| `SMTP_PORT` | `587` | Port |
| `SMTP_USER` | `...` | SMTP username / API key |
| `SMTP_PASS` | `...` | SMTP password / secret |
| `EMAIL_FROM` | `Kalpa Living <orders@yourdomain.com>` | Sender address |

### 3. Click Deploy
1. Click **Deploy**.
2. Vercel will run `npm run build` and provision preview and production URLs.
3. Once finished, click **Go to Dashboard** or open the `.vercel.app` URL.

---

## Step 4: Verification Checklist

- [ ] Visit `https://<your-project>.vercel.app` — check that the hero, categories, and 8 seeded products appear.
- [ ] Add an item to cart and go through `/checkout`.
- [ ] In sandbox mode, complete payment and verify the order confirmation page (`/orders/[orderNumber]`).
- [ ] Visit `https://<your-project>.vercel.app/admin` and log in with your `ADMIN_PASSWORD`.
- [ ] Confirm order status updates, catalog management, and stock changes work.
