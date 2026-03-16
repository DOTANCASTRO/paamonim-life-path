# CLAUDE.md — מסלול החיים (Life Path Tool)

A Hebrew RTL financial planning web app for the Paamonim nonprofit.
Users set a baseline budget, add life events (בלתי נמנע / חשוב / רצוי), and see a multi-year cash flow timeline.

---

## Stack

- **Next.js 15** (App Router, TypeScript) — deployed on Vercel
- **Supabase** — Postgres + Auth (email magic link) + RLS
- **Tailwind CSS** — RTL layout, Heebo Hebrew font
- **Recharts** — timeline chart (`components/Timeline.tsx`)
- **@vercel/analytics** — `<Analytics />` in root layout

---

## Environment Variables

| Variable | Where used | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | everywhere | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + middleware | public |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only (`lib/supabase.ts`) | **never expose as NEXT_PUBLIC_** |
| `ANTHROPIC_API_KEY` | AI advice API route | server-only |

All must be set in Vercel → Settings → Environment Variables.

---

## Supabase Client Rules — Critical

Two clients in `lib/supabase.ts`:

- `getSupabase()` — anon key, subject to RLS. Used for reads where open access is fine.
- `getServiceSupabase()` — service role key, **bypasses RLS**. Used for all writes (`createPlan`, `updatePlan`, `deletePlan`, `getUserPlans`).

**Why:** RLS Phase 2 policies require `auth.uid() = user_id`, but server-side DB calls have no user session JWT. Service role bypasses this. Auth is validated in the API route layer before calling DB functions.

**Rule:** Never use `getSupabase()` for writes. Never expose `getServiceSupabase()` to client components.

---

## Auth Pattern

- Magic link email auth via Supabase
- `middleware.ts` redirects: `/` → `/login` if unauthenticated; `/login` → `/` if authenticated
- Server components: `createSupabaseServerClient()` from `lib/supabase-server.ts`
- API routes: `createSupabaseRouteHandlerClient(req, res)` from `lib/supabase-server.ts`
- Always call `supabase.auth.getUser()` (not `getSession()`) — getSession is unsafe server-side

---

## Database Schema

Table: `plans`
- `id` uuid (primary key, client-generated)
- `title` text
- `budget` jsonb → `Budget` type
- `events` jsonb → `LifeEvent[]` type
- `user_id` uuid (FK to auth.users, added in Phase 1 migration)
- `created_at`, `updated_at` timestamptz

RLS: Phase 2 is active — SELECT open (link sharing), INSERT/UPDATE/DELETE require `user_id = auth.uid()`.

---

## Key Data Types (`lib/types.ts`)

```typescript
EventDirection: 'burden' | 'relief'         // הכבדה | הקלה
EventDuration: 'oneTime' | 'forever' | number  // months
EventPriority: 'unavoidable' | 'important' | 'desirable'

LifeEvent: { id, name, direction, startMonth, duration, monthlyAmount, totalAmount, priority, fundingSource? }
Budget: { income, expenses, debtRepayment, bankBalance, startMonth }
Plan: { id, title, budget, events, createdAt, updatedAt }
```

---

## API Routes

| Method | Route | Auth required | Notes |
|---|---|---|---|
| POST | `/api/plans` | Yes | Creates plan, sets `user_id` |
| GET | `/api/plans/[id]` | No | Open read (link sharing) |
| PUT | `/api/plans/[id]` | No (rate limited) | Validates title/budget/events |
| DELETE | `/api/plans/[id]` | Yes | Enforces ownership via `user_id` |
| POST | `/api/ai-advice` | No | Calls Anthropic API |

Rate limits in `lib/ratelimit.ts`: 60 reads/min, 120 writes/min per IP.

---

## Component Map

```
app/page.tsx          — Dashboard (server): lists user's plans
app/plan/[id]/page.tsx — Plan editor (server shell → client PlanEditor)
app/login/page.tsx    — Login page

components/
  Header.tsx          — Logo + logout, RTL
  NewPlanButton.tsx   — Client, calls POST /api/plans, navigates
  DeletePlanButton.tsx — Client, two-click confirm, calls DELETE /api/plans/[id]
  BudgetSetup.tsx     — Budget form
  EventsTable.tsx     — Events CRUD table
  Timeline.tsx        — Recharts area chart + reference areas
  AIAdvicePanel.tsx   — Calls /api/ai-advice, streams response
  PDFExport.tsx       — Print/export plan

lib/
  calculator.ts       — Core financial logic (monthly surplus, cumulative balance)
  validate.ts         — Input validation for API routes
  db.ts               — All DB operations
```

---

## RTL / Hebrew Notes

- Root `<html lang="he" dir="rtl">` in `layout.tsx`
- Tailwind classes work as-is; RTL handled by browser
- Dates formatted with `toLocaleDateString('he-IL')`
- All user-facing strings in Hebrew
- `startMonth` fields are ISO date strings (first day of month)

---

## UX Patterns

- **Delete confirmation**: two-click (first shows "מחק | ביטול", second executes) — don't simplify to one-click
- **Auto-save**: plan editor debounces writes at ~1.5s, calls PUT `/api/plans/[id]`
- **Plan sharing**: read-only by UUID link (RLS SELECT is open)

---

## git notes

- When staging files with `[id]` in the path, quote them: `git add "app/api/plans/[id]/route.ts"` — zsh expands unquoted brackets as globs
