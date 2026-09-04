# Contributing to Kalpa Living

Thank you for considering a contribution! This guide explains how to set up the project for development, our coding standards, and the process for submitting changes.

---

## Table of Contents

1. [Development Setup](#1-development-setup)
2. [Project Structure](#2-project-structure)
3. [Code Style](#3-code-style)
4. [Branch Naming Convention](#4-branch-naming-convention)
5. [Commit Messages](#5-commit-messages)
6. [Testing Requirements](#6-testing-requirements)
7. [Pull Request Process](#7-pull-request-process)
8. [PR Template](#8-pr-template)

---

## 1. Development Setup

**Prerequisites**: Node.js 20+, PostgreSQL 14+, Git

```bash
# Fork the repository, then clone your fork
git clone https://github.com/YOUR_USERNAME/kalpa-living.git
cd kalpa-living

# Install dependencies
npm install

# Set up your local environment
cp .env.example .env
# Edit DATABASE_URL and other required vars

# Create the database tables
npm run db:push

# Start the dev server
npm run dev
```

### Verifying Everything Works

```bash
npm run lint          # ESLint — must pass with zero warnings
npm run typecheck     # TypeScript — must pass with zero errors
npm run test          # Vitest unit tests — must all pass
npm run build         # Production build — must succeed
```

---

## 2. Project Structure

Key directories to know before making changes:

| Path | Purpose |
|---|---|
| `src/app/(store)/` | Storefront pages — customer-facing |
| `src/app/admin/` | Admin panel pages |
| `src/app/api/` | API route handlers |
| `src/lib/` | Shared business logic (orders, email, auth, payments) |
| `src/db/schema.ts` | **Single source of truth** for the database schema |
| `src/lib/payments/` | Payment gateway abstraction (implement new providers here) |
| `src/lib/__tests__/` | Unit tests — mirror the `lib/` structure |
| `e2e/` | Playwright end-to-end tests |

---

## 3. Code Style

The project uses ESLint with the `eslint-config-next` ruleset. All rules are enforced automatically in CI.

**TypeScript**
- Prefer `const` over `let`; avoid `var`
- All functions should have explicit return types when they are exported
- Use `unknown` instead of `any` for catch clause variables
- No `@ts-ignore` or `@ts-nocheck` without an explanatory comment

**React / Next.js**
- Prefer React Server Components (RSC) — only add `"use client"` when strictly necessary (event handlers, browser APIs)
- Use `next/image` for all images — never plain `<img>`
- Use `next/link` for all internal navigation — never plain `<a href>`
- Fetch data in Server Components; avoid client-side data fetching where server-side works

**Money**
- All monetary values are stored and passed as **integers in paise** (1 INR = 100 paise)
- Use `formatPaise()` from `src/lib/money.ts` when displaying prices to users
- Never store floating-point prices

**Error handling**
- Use `src/lib/logger.ts` (`log.info`, `log.warn`, `log.error`) instead of `console.log`
- API route handlers should never expose raw error messages to the client — catch and return a generic message

---

## 4. Branch Naming Convention

Use the format: `<type>/<short-description>`

| Type | Use for |
|---|---|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `docs/` | Documentation only |
| `refactor/` | Code change with no feature or bug impact |
| `test/` | Adding or updating tests |
| `chore/` | Build scripts, dependencies, CI config |
| `perf/` | Performance improvement |

**Examples:**
```
feat/add-cashfree-provider
fix/webhook-duplicate-event
docs/update-api-reference
chore/upgrade-next-16
```

---

## 5. Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org) specification:

```
<type>(<optional scope>): <short summary in imperative mood>

[optional body]

[optional footer]
```

**Examples:**
```
feat(payments): add Cashfree UPI provider
fix(email): prevent duplicate confirmation on webhook race condition
docs(setup): add VPS deployment section
test(orders): add edge cases for cart validation
chore: upgrade Drizzle ORM to 0.32
```

Rules:
- Use the imperative mood in the summary ("add" not "added", "fix" not "fixed")
- Keep the summary line ≤ 72 characters
- Reference issues with `Closes #123` in the footer

---

## 6. Testing Requirements

Every pull request must pass all CI checks:

```bash
npm run lint          # Zero ESLint warnings
npm run typecheck     # Zero TypeScript errors
npm run test          # All Vitest unit tests pass
npm run build         # Production build succeeds
```

**Unit tests (Vitest)**
- New business logic in `src/lib/` **must** include unit tests
- Tests live in `src/lib/__tests__/` mirroring the source structure
- Aim for >80% coverage on new code
- Mock database and external services — unit tests must not make network calls

**E2E tests (Playwright)**
- Critical flows must be covered by an E2E test:
  - Checkout end-to-end (add to cart → checkout → sandbox pay → confirmation)
  - Admin login + order management
- E2E tests live in `e2e/`
- Run locally with `npm run test:e2e` against a seeded local database

---

## 7. Pull Request Process

1. **Fork** the repository and create your branch from `main`
2. **Make your changes** following the code style guidelines above
3. **Write tests** for any new logic — see testing requirements
4. **Run the full test suite** locally and ensure everything passes
5. **Push** your branch and open a pull request against `main`
6. **Fill in the PR template** completely
7. **Wait for CI** — all checks must be green before review
8. **Address feedback** — respond to comments and push fixes to the same branch
9. **Squash and merge** once approved — keep `main` history clean

### Review criteria

PRs are reviewed for:
- Correctness and logic
- Security (no secrets in code, no XSS vectors, SQL via Drizzle ORM only)
- Performance (no N+1 queries, no blocking synchronous operations in API routes)
- Accessibility (interactive elements have labels, keyboard navigable)
- Test coverage

---

## 8. PR Template

When you open a pull request, please fill in the following:

```markdown
## Summary
<!-- What does this PR do? Why? -->

## Type of change
- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactor / chore

## Testing
<!-- How was this tested? Which tests were added or modified? -->
- [ ] Unit tests added/updated (`npm run test` passes)
- [ ] E2E tests added/updated (`npm run test:e2e` passes)
- [ ] Manually tested locally

## Checklist
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run build` succeeds
- [ ] No secrets or credentials in code
- [ ] SETUP.md or README.md updated if behaviour changed
- [ ] `.env.example` updated if new env vars added

## Screenshots (if UI changes)
<!-- Before / after screenshots or a short screen recording -->

## Related issues
<!-- Closes #123 -->
```

---

## Questions?

Open a [GitHub Discussion](https://github.com/Sehaan-1/e-commerce-site-with-upi-integration/discussions) or email `support@kalparliving.com`.
