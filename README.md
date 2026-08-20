# LAFIYA Frontend (React + Vite)

Matches blueprint SS10/SS23. Deploys to Vercel from GitHub — pushed via
`push_frontend.py` in Colab, same write-then-verify pattern as the
backend's `push_backend.py`. Nothing to upload or edit locally.

## Status: Phase 0 (foundation)

Per Master Build Spec SS15 Phase 0 — this confirms the push-to-deploy
pipeline works end to end, nothing more. Every role route
(`/chw`, `/doctor`, `/pharmacy`, `/admin`) currently renders a labeled
placeholder screen using the real design tokens, not the real feature
screens yet.

**Design system of record:** `lafiya-mockup.html` (shared separately,
not part of this repo). Every interaction, animation, and component
state documented there — the stamp-thunk, live fee recalculation,
urgency scoring, USSD state machine, staggered card entrances — is the
target this codebase migrates toward, screen by screen. `src/styles/`
ports the token layer now; components arrive with each real screen.

**One deliberate value already locked in that differs from the
mockup's original default:** `--paper` / `--paper-card` are plain
white (`#FFFFFF`), not the cream the mockup started with — a decision
made after directly comparing both live in the mockup's toggle, not a
default carried over unexamined.

## What's live

- Vite + React 18 + React Router, deployed empty-but-real to Vercel
- Design tokens (`src/styles/tokens.css`) and a small starter component
  layer (`src/styles/base.css`) — stamp, button, ledger-card, matching
  the mockup's CSS custom-property approach (no Tailwind, per the
  project's locked stack decision)
- `src/lib/supabaseClient.js` — anon-key client only, fails loudly if
  env vars are missing rather than silently constructing a broken
  client
- `src/lib/apiClient.js` — thin fetch wrapper that attaches a Supabase
  JWT as `Authorization: Bearer` to every backend call, matching
  `app/core/auth.py`'s `get_current_user` contract on the FastAPI side
- `vercel.json` — SPA rewrite so client-side routes (`/chw`, `/doctor`,
  etc.) survive a browser refresh instead of 404ing

## Not built yet — in build order

1. **Real Supabase auth** (`src/app/Login.jsx`) — email/password for
   the 4 roles, session persisted, redirect to the right role route on
   login. No route guard exists yet either — every `/chw`, `/doctor`,
   etc. path is currently open with no auth check.
2. **CHW app** — migrate the phone-frame shell + 5 screens from the
   mockup, wire each to its real endpoint (`POST /api/patients`,
   `POST /api/consultations`, `POST /api/loans` + guarantors +
   disburse/repay, `GET .../earnings`).
3. **Doctor console** — queue + detail split, wired to
   `GET /api/consultations/queue` and `PATCH /api/consultations/{id}`.
4. **Pharmacy claim screen** — wired to `POST /api/claims`.
5. **Admin console** — wired to `GET/PATCH /api/admin/pharmacies` and
   `/api/admin/fraud-flags`.
6. **Real offline sync** (Master Build Spec SS10) — IndexedDB queue,
   `client_operation_id` dedup against the backend's `sync_receipts`
   table. This was blocked on the frontend existing at all; it exists
   now, so this becomes buildable once the CHW registration/triage
   screens are live.
7. **Live Whisper wiring** on the triage screen's audio capture —
   was blocked the same way, same unblock condition.

## Environment variables

See `.env.example`. `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from
Supabase's **Legacy API Keys** tab (anon key — never the service-role
key in a browser-exposed client). `VITE_API_BASE_URL` points at the
Render backend.

## Running locally

```
npm install
cp .env.example .env   # fill in real values
npm run dev
```

## Deployment

Vercel, auto-deploy on push to `main`, same as Render does for the
backend. `vercel.json`'s rewrite rule is required for React Router's
client-side routes to work — without it, refreshing on `/chw` 404s.
