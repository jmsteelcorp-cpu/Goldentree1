# GoldUAE — Golden Visa & Property Valuation Platform

Three portals on one codebase:

- **User** (`/user/*`) — register/login, upload a title deed for instant OCR
  eligibility, apply for the investor Golden Visa (+ dependents), pay, upload
  documents, track government process stages.
- **Agent** (`/agent/*`) — register with a referral code, manage client
  applications, upload documents on a client's behalf, view commission ledger.
- **Admin** (`/admin/*`) — seeded account only. Verify/reject documents,
  advance DLD / GDRFA / medical / biometric / Emirates ID stages.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Prisma + Postgres ·
NextAuth (credentials + email OTP) · Vercel Blob (file storage) ·
Google Cloud Vision (real title-deed OCR) · pdf-lib (invoices) · mock payments.

## 1. Local setup

```bash
npm install
cp .env.example .env   # fill in the values below
npx prisma db push     # creates all tables from prisma/schema.prisma
npm run db:seed        # creates the first admin account (ADMIN_EMAIL/ADMIN_PASSWORD)
npm run dev
```

### Environment variables

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | A Postgres connection string — [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Neon](https://neon.tech), or [Supabase](https://supabase.com) all work. |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` locally; your production URL on Vercel |
| `BLOB_READ_WRITE_TOKEN` | Vercel dashboard → Storage → Blob → create a store |
| `GOOGLE_VISION_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) — enable the **Cloud Vision API**, create an API key. This is what powers real title-deed OCR. |
| `RESEND_API_KEY` | [resend.com](https://resend.com) — optional. Without it, OTP codes print to the server console instead of emailing, so you can still test the flow locally. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Whatever you want the first admin login to be — used only by `npm run db:seed`. |

## 2. Deploy to Vercel

1. Push this project to a GitHub repo.
2. In Vercel: **New Project → Import** the repo.
3. Add all the environment variables above in **Project Settings → Environment
   Variables** (use your production Postgres URL and a fresh
   `NEXTAUTH_SECRET`).
4. Attach a **Vercel Blob** store to the project (Storage tab) — this
   auto-fills `BLOB_READ_WRITE_TOKEN`.
5. Deploy. Vercel runs `npm run build`, which runs `prisma generate` first.
6. After the first deploy, run the schema push and admin seed against your
   production database:
   ```bash
   npx prisma db push
   npm run db:seed
   ```
   (Run these locally with `DATABASE_URL` pointed at production, or via
   `vercel env pull` + the commands above.)
7. Sign in at `https://your-app.vercel.app/admin/login`.

## Notes on scope / what's mocked vs real

- **OCR is real** (Google Cloud Vision `DOCUMENT_TEXT_DETECTION`) — see
  `lib/ocr.ts`. Field extraction uses regex heuristics tuned to common Dubai
  title deed layouts; every field is optional and the raw OCR text is always
  stored, since deed formats vary and this is best-effort, not a certified
  reading.
- **Payments are mocked** — `app/api/payments/route.ts` marks a payment PAID
  immediately and generates a real PDF invoice via `lib/pdf.ts`. Swap that
  block for a real gateway (Stripe, Telr, PayTabs are common for UAE) plus a
  webhook that flips `Payment.status` to `PAID` before advancing the
  application.
- **Auth** uses bcrypt-hashed passwords + a 6-digit email OTP that must be
  verified before first login (`OtpCode` model, `lib/otp.ts`). Swap the OTP
  delivery channel to SMS if you'd rather verify by phone.
- The **document checklist** (`lib/checklist.ts`) and **pricing**
  (`lib/pricing.ts`) encode the rules from the original spec: AED 130,000 for
  the investor package, AED 7,000 per dependent, NOC-from-bank if mortgaged,
  SOA/NOC-from-developer if off-plan, and the relation → document mapping
  (marriage certificate for a wife, birth certificate for children, etc).
- The database schema (`prisma/schema.prisma`) is the full data model:
  users/agents/admin, properties with OCR fields, applications, dependents,
  per-document verification state, payments/invoices, and an agent commission
  ledger.
