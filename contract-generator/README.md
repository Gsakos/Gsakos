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
| `RESEND_API_KEY` | No | Sends the signing-request and fully-executed emails via [Resend](https://resend.com). Without it, the app still works - signing links are shown in the UI for you to copy/send yourself instead of being emailed automatically. |
| `EMAIL_FROM` | No | The "from" address for outgoing email. Defaults to Resend's shared sandbox sender, which works for testing but looks less trustworthy to recipients - verify your own domain with Resend for real use. |
| `NEXT_PUBLIC_APP_URL` | Yes (in production) | The public URL this app is deployed at, used to build signing links. Defaults to `http://localhost:3000` for local dev. |

Run it:

```bash
npm run dev
```

## Deploying

This is a standard Next.js app - it deploys to Vercel, Render, Railway, Fly.io,
or any Node host. Set the environment variables above in your host's
dashboard, and set `NEXT_PUBLIC_APP_URL` to the real deployed URL.

**Storage note:** contracts are currently stored as JSON files under
`data/contracts/`. That's zero-setup and fine for local use or a single
always-on server with persistent disk. It will **not** work reliably on a
stateless/serverless host (e.g. Vercel's default deployment) because the
filesystem isn't shared or persistent across invocations. For that kind of
deployment, swap `src/lib/store.ts` for a real database (Postgres, etc.) -
`getContract`/`saveContract` are the only two functions the rest of the app
calls, so the swap is contained to that one file.

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
    store.ts                 File-based contract storage (swap for a DB in production)
    types.ts                 Shared types
  components/                SignaturePad, ContractDocument, SignatureDisplay, etc.
```
