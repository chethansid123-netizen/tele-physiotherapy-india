# Preventive Cardiac Care — Telehealth Billing Platform

Full-stack Next.js 14 + Prisma + PostgreSQL application for billing post cardiac and lung
surgery telehealth care (video visits, phone, RPM, CCM, async digital). Includes CPT
auto-suggest, CMS-1500 claim generation, RPM time tracking, role-based auth, and a
HIPAA-style audit log.

## Stack
- **Framework**: Next.js 14 (App Router) — frontend + API routes in one process
- **Language**: TypeScript
- **DB / ORM**: PostgreSQL + Prisma
- **Auth**: NextAuth (credentials, JWT, 8-hour session)
- **Styling**: Tailwind CSS
- **Validation**: Zod

## Features
- Patient registry with surgery type, ICD-10 codes, risk level, consent
- Telehealth encounter logging with SOAP fields
- CPT auto-suggest engine (99441-99443, 99421-99423, 99453/99454/99457/99458, 99490/99491/99439, 93297, 94014, ...)
- Billing records → Claims → CMS-1500 data export
- RPM device data + clinician time tracking with 16-day / 20-minute threshold calculators
- Revenue dashboard (by CPT, by month, claim status summary)
- HIPAA audit log of every PHI access, create, update, delete, claim submission, status change
- Role-based routes (ADMIN, PHYSICIAN, NURSE, BILLING_SPECIALIST, STAFF)

## Project layout
```
preventive-cardiac-care/
├── prisma/
│   ├── schema.prisma      # 13 models
│   └── seed.ts            # CPT/ICD codes + default users
├── src/
│   ├── app/
│   │   ├── api/           # All backend endpoints
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── patients/  (+ [id])
│   │   │   ├── encounters/
│   │   │   ├── billing/   (+ suggest)
│   │   │   ├── claims/    (+ [id])
│   │   │   ├── rpm/       (+ time-tracking)
│   │   │   └── reports/revenue/
│   │   ├── dashboard/     # Frontend pages (patients, encounters, billing, claims, rpm, reports)
│   │   └── login/
│   ├── lib/               # prisma, auth, audit, validators, billing-engine, claim-generator, rpm-calculator
│   └── middleware.ts      # Auth + RBAC
└── package.json
```

The frontend and backend are the **same Next.js app** — pages in `src/app/dashboard/*`
call API routes in `src/app/api/*` via plain `fetch('/api/...')`. No separate server.

## Running locally

```bash
cd preventive-cardiac-care
npm install
cp .env.example .env
# edit .env: set DATABASE_URL and NEXTAUTH_SECRET
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Visit http://localhost:3000 and login with:
- `admin@cardiaccare.com` / `admin123` (Admin)
- `dr.smith@cardiaccare.com` / `admin123` (Physician)
- `billing@cardiaccare.com` / `admin123` (Billing Specialist)

## Environment variables

| Variable | Example |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/cardiac_billing` |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | output of `openssl rand -base64 32` |

## Deploy to Vercel + Supabase

1. Create a Supabase project → copy the Postgres connection string into `DATABASE_URL`.
2. On vercel.com → New Project → import this repo. **Set Root Directory to `preventive-cardiac-care`**.
3. Add env vars `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (= your vercel URL).
4. Deploy.
5. Once: `DATABASE_URL=... npx prisma migrate deploy && npx prisma db seed`.

## HIPAA notes
This repo implements the application-layer requirements (audit logging, RBAC, session
timeout, soft delete). A production HIPAA deployment additionally requires a BAA with
Vercel/Supabase, encryption at rest, backup retention, access reviews, and a written
incident-response plan.
