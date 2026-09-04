# Kalpa Living

A full-stack e-commerce application built with Next.js 16, PostgreSQL, Drizzle ORM, and Tailwind CSS. The application supports direct UPI payments through Razorpay, includes a local sandbox UPI simulator for testing without external credentials, provides transactional order confirmation emails via SMTP, and includes an administrative control panel for catalogue and order management.

---

## Key Features

- **Storefront**: Catalogue browsing, category filters, responsive product detail pages, and dynamic cart state management.
- **UPI Payments**: Native UPI integration through Razorpay (supporting Google Pay, PhonePe, Paytm, and BHIM) with a built-in sandbox simulator for local testing.
- **Order Tracking**: Customer self-service tracking page at `/track` matching orders by order number and email address.
- **Admin Panel**: Cookie-based administrative interface at `/admin` for viewing revenue analytics, tracking low-stock alerts, managing product availability, and updating fulfillment statuses.
- **Data Persistence**: Schema-managed PostgreSQL database using Drizzle ORM with automatic initial catalogue seeding.
- **Security Protections**: Rate-limited checkout endpoints, CSRF validation on mutating API routes, HMAC-signed session tokens, and strict Content Security Policy headers.
- **Transactional Emails**: Automated HTML and plaintext order confirmations and status updates delivered via SMTP or logged locally when unconfigured.
- **Testing and Verification**: Full test coverage with Vitest unit tests and Playwright end-to-end browser specifications.

---

## Screenshots

### Storefront Home
![Storefront Home](docs/screenshots/storefront-home.png)

### Admin Login
![Admin Login](docs/screenshots/admin-login.png)

### Admin Dashboard
![Admin Dashboard](docs/screenshots/admin-dashboard.png)

### Admin Catalogue Management
![Admin Products](docs/screenshots/admin-products.png)

### Customer Order Confirmation
![Order Confirmation](docs/screenshots/order-confirmation.png)

### Admin Dashboard Updated Post-Payment
![Admin Dashboard Updated](docs/screenshots/admin-dashboard-updated.png)

---

## Tech Stack

- **Framework**: Next.js 16.2 (App Router, React Server Components, Server Actions)
- **UI Library**: React 19.2
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4.1 with PostCSS
- **Database**: PostgreSQL 16
- **Database Client and ORM**: `pg` 8.20 and Drizzle ORM 0.45
- **Payment Processing**: Razorpay Node SDK with UPI intent flows and custom local simulator
- **Email Delivery**: Nodemailer 10.0
- **Testing**: Vitest 5.0 (unit tests) and Playwright 1.62 (end-to-end tests)
- **Containerization**: Docker multi-stage builds and Docker Compose

---

## Prerequisites

Before running the application locally, ensure you have the following installed:

- **Node.js**: version 20.10.0 or higher
- **npm**: version 10 or higher
- **Docker and Docker Compose**: required for containerized PostgreSQL (or a standalone PostgreSQL 14+ instance)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Sehaan-1/e-commerce-site-with-upi-integration.git
cd e-commerce-site-with-upi-integration
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root by copying the template:

```bash
cp .env.example .env
```

At minimum, verify that `DATABASE_URL` matches your local PostgreSQL credentials:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
ADMIN_PASSWORD=admin123
ADMIN_SESSION_SECRET=a-random-secret-key-at-least-32-chars-long
PAYMENT_MODE=sandbox
```

### 4. Start PostgreSQL

If using Docker, start the database container defined in `docker-compose.yml`:

```bash
docker compose up -d db
```

Wait until the container is healthy:

```bash
docker compose ps
```

### 5. Apply Database Migrations

Apply the database schema to the PostgreSQL instance:

```bash
npm run db:migrate
```

To sync changes directly during schema iteration without creating migration files:

```bash
npx drizzle-kit push --force
```

When the application runs for the first time, `ensureSeeded()` automatically populates initial product records if the database is empty.

### 6. Start the Development Server

```bash
npm run dev
```

Open the following URLs in your browser:
- **Storefront**: [http://localhost:3000](http://localhost:3000)
- **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin) (Sign in with password: `admin123`)
- **System Health**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## Architecture Overview

### Directory Structure

```
├── docs/                      # Documentation assets, SQL schema, and screenshots
│   └── screenshots/           # UI reference screenshots
├── drizzle/                   # Drizzle SQL migration files
├── e2e/                       # Playwright end-to-end test suites
├── public/                    # Static assets, product images, and manifest icons
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (store)/           # Customer-facing storefront routes
│   │   │   ├── cart/          # Shopping cart review
│   │   │   ├── checkout/      # Checkout form and UPI dispatch
│   │   │   ├── orders/        # Order confirmation pages
│   │   │   ├── products/      # Dynamic product detail pages
│   │   │   ├── track/         # Customer order tracking
│   │   │   └── page.tsx       # Storefront homepage and product grid
│   │   ├── admin/             # Administrative routes
│   │   │   ├── (panel)/       # Authenticated dashboard, orders, products, settings
│   │   │   ├── login/         # Admin login form
│   │   │   └── actions.ts     # Server actions for catalogue and order updates
│   │   ├── api/               # Server-side API endpoints
│   │   │   ├── checkout/      # Order creation and payment dispatch
│   │   │   ├── health/        # Database health probe
│   │   │   ├── observability/ # Client log ingestion
│   │   │   └── payments/      # Webhook and verification endpoints
│   │   ├── layout.tsx         # Global layout with navigation and header
│   │   ├── globals.css        # Tailwind CSS imports and utility layers
│   │   └── not-found.tsx      # 404 handler
│   ├── components/            # Reusable React components (product card, cart drawer, badges)
│   ├── db/
│   │   ├── index.ts           # PostgreSQL connection pool and Drizzle client instance
│   │   └── schema.ts          # Relational tables, enums, and foreign keys
│   ├── lib/                   # Business logic and service modules
│   │   ├── payments/          # UPI provider interfaces (Razorpay and Sandbox)
│   │   ├── admin-auth.ts      # HMAC cookie signing, password verification, and lockout logic
│   │   ├── catalog.ts         # Product retrieval, queries, and seed data
│   │   ├── config.ts          # Centralized environment variable validation
│   │   ├── email.ts           # Nodemailer transport and HTML email templates
│   │   ├── logger.ts          # Structured JSON logging
│   │   ├── money.ts           # Currency formatting (paise to INR)
│   │   ├── order-status.ts    # Order state machine constants and badges
│   │   └── orders.ts          # Order creation, transitions, and stock reconciliation
│   └── proxy.ts               # Edge request proxy (auth check, rate limiter, CSRF validation)
├── docker-compose.yml         # Container definitions for app and database
├── Dockerfile                 # Multi-stage production container build
├── drizzle.config.ts          # Drizzle Kit migration configuration
├── package.json               # Dependencies and command scripts
└── vitest.config.ts           # Unit test configuration
```

### Request Lifecycle and Middleware

Every incoming HTTP request passes through `src/proxy.ts` before reaching route handlers:

1. **Header Normalization**: Generates or forwards a unique `x-request-id` header for distributed tracing.
2. **Admin Route Protection**: Intercepts paths under `/admin` (excluding `/admin/login`). Verifies the presence of the `kl_admin` HMAC session cookie. Redirects unauthenticated requests to `/admin/login`.
3. **CSRF Validation**: For mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) hitting `/api/*`, compares the `Origin` header against the server `Host`. Mismatches return HTTP 403 Forbidden.
4. **Rate Limiting**: Enforces an in-memory window limiter on `/api/checkout` (maximum 10 requests per minute per IP address). Excessive requests receive HTTP 429 Too Many Requests.
5. **Bot Protection**: Checks checkout requests for automated or empty user agents, blocking unauthorized scripted submissions.

### Checkout and Payment Flow

```
[Customer Browser]               [Next.js Server]              [UPI Provider / DB]
       |                                |                               |
       |--- 1. POST /api/checkout ----->|                               |
       |    (Items, Address, Contact)   |--- 2. Verify stock ---------->| [PostgreSQL]
       |                                |--- 3. Create order (pending)->|
       |                                |--- 4. Initialize payment ---->| [Razorpay / Sandbox]
       |<-- 5. Return order details ----|                               |
       |       and payment intent       |                               |
       |                                |                               |
       |--- 6. Submit UPI Payment ----->|                               |
       |    (Intent app / Sandbox QR)   |--- 7. Verify signature ------>| [Razorpay / Sandbox]
       |                                |--- 8. Update status: paid --->| [PostgreSQL]
       |                                |--- 9. Decrement stock ------->| [PostgreSQL]
       |                                |--- 10. Dispatch email ------->| [SMTP Server]
       |<-- 11. Redirect to /orders --->|                               |
```

### Database Schema

The database relies on six relational tables defined in `src/db/schema.ts`:

- **`products`**:
  - `id`: Serial primary key
  - `slug`: Unique URL identifier
  - `name`: Product title
  - `description`: Detailed product description
  - `category`: Classification label (Decor, Kitchen, Textiles, Storage)
  - `price_paise`: Base price in integer paise (e.g., 89900 for INR 899.00)
  - `compare_at_paise`: Optional strikethrough price
  - `stock`: Available inventory count
  - `image_url`: Path or CDN URL to image
  - `active`: Boolean visibility flag
  - `featured`: Boolean homepage priority flag
  - `created_at` / `updated_at`: Timestamp records

- **`orders`**:
  - `id`: Serial primary key
  - `order_number`: Unique identifier (format: `KL-YYMMDD-XXXX`)
  - `access_token`: Random cryptographic token for unauthenticated order tracking access
  - `customer_name`, `email`, `phone`: Contact information
  - `address_line1`, `address_line2`, `city`, `state`, `pincode`: Shipping destination
  - `subtotal_paise`, `shipping_paise`, `total_paise`: Breakdown of financial figures
  - `status`: Enum (`pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, `failed`)
  - `payment_status`: Enum (`pending`, `paid`, `failed`, `refunded`)
  - `payment_provider`: Name of gateway (`razorpay` or `sandbox`)
  - `provider_order_id`, `provider_payment_id`: External payment references
  - `tracking_carrier`, `tracking_number`: Shipping dispatch metadata

- **`order_items`**:
  - `id`: Serial primary key
  - `order_id`: Foreign key reference to `orders.id` (cascades on delete)
  - `product_id`: Foreign key reference to `products.id` (set null on delete)
  - `name`: Snapshot of product name at purchase time
  - `unit_price_paise`: Snapshot of unit price at purchase time
  - `quantity`: Number of units ordered

- **`order_status_history`**:
  - `id`: Serial primary key
  - `order_id`: Foreign key reference to `orders.id`
  - `status`: Order status enum
  - `note`: Operational note describing the change
  - `created_at`: Timestamp of transition

- **`payment_events`**:
  - `id`: Serial primary key
  - `order_id`: Foreign key reference to `orders.id`
  - `provider`: Gateway name
  - `event_type`: Event name (e.g., `payment.captured`)
  - `payload`: Full JSON payload received from payment webhook or simulator

- **`email_log`**:
  - `id`: Serial primary key
  - `order_id`: Foreign key reference to `orders.id`
  - `recipient`, `subject`, `template`: Notification metadata
  - `status`: Delivery outcome (`sent`, `failed`, `logged`)
  - `error`: Error message text if dispatch failed

---

## Environment Variables Reference

| Variable | Requirement | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Required | None | PostgreSQL connection URI (`postgresql://user:pass@host:port/db`) |
| `NEXT_PUBLIC_STORE_NAME` | Optional | `Kalpa Living` | Storefront branding displayed in headers, metadata, and emails |
| `NEXT_PUBLIC_BASE_URL` | Optional | `http://localhost:3000` | Canonical site origin used for absolute URLs and webhook validation |
| `SUPPORT_EMAIL` | Optional | `support@example.com` | Customer support contact address displayed on invoice and footer |
| `FREE_SHIPPING_THRESHOLD_PAISE`| Optional | `99900` | Cart subtotal threshold in paise required for zero shipping cost |
| `FLAT_SHIPPING_PAISE` | Optional | `7900` | Shipping cost in paise applied to carts below the threshold |
| `ADMIN_PASSWORD` | Required | `admin123` | Password required to authenticate at `/admin/login` |
| `ADMIN_SESSION_SECRET` | Required | Development fallback | Secret key used to sign and verify HMAC session cookies |
| `PAYMENT_MODE` | Optional | `auto` | Active payment processor mode: `auto`, `razorpay`, or `sandbox` |
| `RAZORPAY_KEY_ID` | Conditional | Empty string | Razorpay API key ID (`rzp_test_*` or `rzp_live_*`). Required if using Razorpay. |
| `RAZORPAY_KEY_SECRET` | Conditional | Empty string | Razorpay API secret key. Required if using Razorpay. |
| `RAZORPAY_WEBHOOK_SECRET` | Conditional | Empty string | Secret used to verify incoming webhook signatures from Razorpay |
| `MERCHANT_UPI_ID` | Optional | `kalpaliving@upi` | VPA displayed on the sandbox payment simulator QR code |
| `SMTP_HOST` | Optional | Empty string | SMTP mail server hostname. When left blank, emails are logged to stdout |
| `SMTP_PORT` | Optional | `587` | SMTP port number |
| `SMTP_USER` | Optional | Empty string | Username for SMTP server authentication |
| `SMTP_PASS` | Optional | Empty string | Password for SMTP server authentication |
| `EMAIL_FROM` | Optional | `"Kalpa Living <orders@example.com>"` | Sender address header on outbound notifications |

---

## Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts Next.js in development mode with Turbopack |
| `npm run build` | Compiles the production build with standalone output |
| `npm run start` | Runs the compiled Next.js standalone production server |
| `npm run typecheck` | Executes `tsc --noEmit` to validate all TypeScript types |
| `npm run lint` | Runs ESLint across all codebase files |
| `npm test` | Runs all unit and integration tests once via Vitest |
| `npm run test:watch` | Starts Vitest in interactive file-watching mode |
| `npm run test:coverage` | Generates a test code coverage report using V8 |
| `npm run test:e2e` | Runs Playwright browser tests across all configured engines |
| `npm run db:generate` | Generates new SQL migration scripts from schema changes |
| `npm run db:migrate` | Applies pending SQL migrations from `./drizzle` to PostgreSQL |
| `npm run db:push` | Pushes schema declarations directly to the database without migrations |
| `npm run db:studio` | Launches the interactive Drizzle Studio database browser |

---

## Testing

### Unit and Integration Tests

Unit tests are written with Vitest and `@testing-library/react`. Tests verify monetary calculations, environment configurations, order validation, and rate-limiting security mechanisms.

Run the test suite:

```bash
npm test
```

Execute tests in watch mode during development:

```bash
npm run test:watch
```

Run tests with code coverage analysis:

```bash
npm run test:coverage
```

### End-to-End Browser Tests

Playwright tests verify complete browser workflows including product discovery, shopping cart additions, address validation, and simulated payment confirmation.

Run the Playwright test suite:

```bash
npm run test:e2e
```

---

## Deployment

### Docker Deployment

The repository includes a multi-stage `Dockerfile` configured to produce a minimal production container using Next.js standalone output.

#### 1. Build Container Image

```bash
docker build -t kalpa-living:latest .
```

#### 2. Run Container with Environment Variables

```bash
docker run -d \
  --name kalpa-living \
  -p 3000:3000 \
  --env-file .env.production \
  kalpa-living:latest
```

### Docker Compose (Full Stack)

To run both the application server and the PostgreSQL database container together:

```bash
docker compose up -d --build
```

To stop all services and preserve data volumes:

```bash
docker compose down
```

### Production Readiness Checklist

Before publishing this application to production:

- [ ] Change `ADMIN_PASSWORD` from the default value.
- [ ] Generate a random 64-character string for `ADMIN_SESSION_SECRET` (run `node -e "console.log(crypto.randomBytes(32).toString('hex'))"`).
- [ ] Set `NEXT_PUBLIC_BASE_URL` to your production HTTPS domain.
- [ ] Set `PAYMENT_MODE=razorpay` with live credentials (`rzp_live_*`).
- [ ] Register the webhook endpoint in the Razorpay dashboard pointing to `https://yourdomain.com/api/payments/razorpay/webhook`.
- [ ] Configure valid SMTP credentials and verify receipt of a test order confirmation email.
- [ ] Run `npm run typecheck`, `npm run lint`, and `npm test` to confirm all validation checks pass.

---

## Troubleshooting

### Database Connection Refused

**Symptom**: `Error: connect ECONNREFUSED 127.0.0.1:5432` or `DATABASE_URL is required`.

**Resolution**:
1. Check that PostgreSQL is active:
   ```bash
   docker compose ps
   ```
2. If the container is stopped, start it:
   ```bash
   docker compose up -d db
   ```
3. Ensure `.env` contains the proper connection string:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
   ```

### Non-Interactive Migration Failures

**Symptom**: `Error: Interactive prompts require a TTY terminal` when executing `npm run db:push`.

**Resolution**: Use the `--force` flag when running in CI or non-TTY environments:
```bash
npx drizzle-kit push --force
```
Or execute pre-generated migrations using:
```bash
npm run db:migrate
```

### Admin Authentication Lockout

**Symptom**: Admin login fails repeatedly with `IP locked out after failed login attempts`.

**Resolution**: The security guard locks an IP address for 15 minutes after 5 consecutive failed attempts. To clear the lockout in a local development environment, restart the Next.js process, which resets the in-memory rate-limiter map.

### Port 3000 In Use

**Symptom**: Next.js automatically starts on port 3001 or throws an `EADDRINUSE` error.

**Resolution**: Terminate the conflicting process occupying port 3000:
- Windows (PowerShell):
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
  ```
- Linux / macOS:
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```

---

## Contributing

Review [CONTRIBUTING.md](./CONTRIBUTING.md) for branch management rules, coding conventions, and pull request submission guidelines.

---

## License

This project is licensed under the MIT License. Details are available in the [LICENSE](./LICENSE) file.
