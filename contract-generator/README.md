# DealSeal

Describe a situation, add the people involved and where it's happening, and
[Claude](https://www.anthropic.com/claude) drafts a plain-language contract.
You can edit it, send each party a link to review and sign it in the
browser, and once everyone has signed, a copy is emailed out automatically.

Installable as a PWA (frosted-glass, Apple-style UI) - open it on your phone
and use "Add to Home Screen" for a full-screen, app-like experience.

> **Not legal advice.** This is a convenience tool, not a law firm. The
> generated contract has not been reviewed by an attorney. For anything
> significant, high-value, or regulated, have a licensed attorney review it
> before anyone signs.

## How it works

1. **Describe it** - on the home page, enter the situation, a location (used
   for governing law), and the parties involved (name, email, role).
2. **Draft** - the app calls the Claude API to draft a fair, plain-language
   agreement tailored to what you described.
3. **Review & send** - you can edit the draft, then send it out. Each party
   gets a unique link by email (or you can copy/paste the link yourself).
4. **Sign** - each party opens their link, reviews the contract, and signs by
   typing or drawing their signature. A timestamp and IP address are
   recorded alongside each signature.
5. **Done** - once everyone has signed, everyone is emailed a link to the
   final, fully-signed agreement, which can be downloaded/printed as a PDF
   from the browser.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Drafts the contract. Get one at [console.anthropic.com](https://console.anthropic.com/settings/keys). |
| `SUPABASE_URL` | Yes | Where contracts are stored. Create a free project at [supabase.com](https://supabase.com) - find this under Project Settings -> Data API. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Project Settings -> API Keys -> `service_role` (not the anon/publishable key). Server-side only, never exposed to the browser. |
| `RESEND_API_KEY` | No | Sends the signing-request and fully-executed emails via [Resend](https://resend.com). Without it, the app still works - signing links are shown in the UI for you to copy/send yourself instead of being emailed automatically. |
| `EMAIL_FROM` | No | The "from" address for outgoing email. Defaults to Resend's shared sandbox sender, which works for testing but looks less trustworthy to recipients - verify your own domain with Resend for real use. |
| `NEXT_PUBLIC_APP_URL` | Yes (in production) | The public URL this app is deployed at, used to build signing links. Defaults to `http://localhost:3000` for local dev. |

In your Supabase project's SQL Editor, run once:

```sql
create table public.contracts (
  id uuid primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contracts enable row level security;

create index contracts_status_idx on public.contracts (((data ->> 'status')));
```

Run it:

```bash
npm run dev
```

## Deploying

This is a standard Next.js app backed by Postgres (Supabase), so it works on
any host, including fully serverless ones (Vercel, Netlify) - unlike plain
file storage, contract data survives across requests and cold starts.

**Netlify:** create a new site from this repo, set the site's **Base
directory** to `contract-generator` (this is a monorepo - the app lives in
that subfolder), and add the environment variables above in Site
configuration -> Environment variables. A `netlify.toml` in this folder
already configures the build command and the official Next.js plugin. Once
deployed, set `NEXT_PUBLIC_APP_URL` to the Netlify URL you're given and
redeploy.

**Vercel / Render / Railway / Fly.io:** same environment variables, same
build (`npm install && npm run build`) and start (`npm start`) commands.

## Security model (MVP)

There are no user accounts. Access is by unguessable token instead:

- The person who creates a contract gets a `draftToken` (in the URL as
  `?key=...`) that lets them view, edit, and send it.
- Each party gets their own `signToken` (in the URL as `?token=...`) that
  lets them view and sign - and only sign as themselves.

Anyone who gets hold of one of these links can act as that party, so treat
them like a password (this is the same trust model most e-signature tools
use for email-delivered signing links). The signatures captured here are a
lightweight audit trail (typed/drawn signature + timestamp + IP) suitable
for everyday agreements - they are **not** a certified e-signature product
(no identity verification, no tamper-evident seal). For agreements that need
that level of rigor, use a provider like DocuSign instead.

The `contracts` table has Row Level Security enabled with **no policies**,
so the token/key checks above are the only thing gating access - and even if
the anon/publishable key ever leaked, it would have zero access to the
table. Only the server-side `service_role` key (used exclusively in API
routes, never sent to the browser) can read or write it.

## Project structure

```
src/
  app/
    page.tsx                 Home page - describe the situation & parties
    draft/[id]/page.tsx      Drafter view - review, edit, send, track status
    sign/[id]/page.tsx       Signer view - read, sign, see final result
    api/contracts/...        REST endpoints backing the above
  lib/
    anthropic.ts             Calls Claude to draft the contract text
    email.ts                 Sends signing-request / fully-executed emails via Resend
    store.ts                 Contract storage (Supabase/Postgres)
    types.ts                 Shared types
  components/                SignaturePad, ContractDocument, SignatureDisplay, etc.
```
