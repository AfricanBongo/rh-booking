<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md

## Project Overview

Conference room booking platform for RoyalHouse Church. Members register for conferences, book and share hotel rooms, manage payments in installments, and purchase merchandise.

**Read `CONTEXT.md` at project root before doing anything.** It contains current project state, architecture decisions, business rules, and what's been built so far.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript (strict) |
| UI Library | HeroUI |
| Styling | Tailwind CSS 4 + CSS Modules (for complex component styles) |
| Forms | React Hook Form + Zod validation |
| Client State | Zustand (only when needed) |
| Server Data | Native fetch (no data-fetching library) |
| Auth | Supabase Auth (email) |
| Database | Supabase (Postgres + RLS + Edge Functions) |
| CMS | Strapi v5 (headless, self-hosted on Coolify) |
| Payments | Stripe Checkout + stripe-sync-engine |
| Testing | Vitest (unit + integration) |
| Deployment | Cloudflare Pages via GitHub Actions |
| Package Manager | npm |

---

## Architecture

```
Next.js 16 (Cloudflare Pages)
  |
  |-- reads content from --> Strapi (Coolify)
  |-- auth + CRUD --------> Supabase (Auth + DB + Edge Functions)
  |-- payments -----------> Stripe Checkout
  |                            |
  |                            v
  |<-- stripe-sync-engine -- Supabase (mirrored payment data)
```

**Data access layer** (`lib/data/`) abstracts the source. Components never know if data comes from Strapi or Supabase.

- **Strapi** serves read-only content: conferences, room types, merch items, pickup locations
- **Supabase** handles transactional data: profiles, bookings, invitations, children, merch orders, payment records
- **Stripe Checkout** (hosted page) processes payments. No custom payment forms.

---

## Core Principles

### 1. KISS + YAGNI

Always prefer the simplest working solution. Do not build for hypothetical futures.

- No unnecessary abstractions
- No premature optimization
- No config for values that never change
- Deletion over addition
- Boring over clever

### 2. Server-First Components

Default to React Server Components. Add `'use client'` only when the component needs:
- Form interactivity (React Hook Form)
- Browser APIs (localStorage, window)
- Event handlers (onClick, onChange)
- Client state (Zustand)
- Animations

### 3. Teach As You Build

After completing each task, provide a brief summary explaining:
- What was built
- Why this approach was chosen over alternatives
- Any patterns or concepts worth understanding

Keep it digestible. 3-5 sentences max. Not an essay.

### 4. Tests Must Stay Green

Any change to platform logic that would break an existing test MUST be flagged. Do NOT automatically rewrite failing tests - flag the failure and let the developer decide how to handle it. CI runs on every push.

---

## Coding Conventions

### TypeScript

- Strict mode, no `any`
- Explicit return types on all exported functions
- Interfaces for object shapes, types for unions/primitives
- Enums are banned. Use `as const` objects or union types.

```typescript
// Good
interface Booking {
  id: string;
  userId: string;
  status: 'confirmed' | 'cancelled';
}

export function getBooking(id: string): Promise<Booking> { ... }

// Bad
export function getBooking(id: any): any { ... }
```

### Components

- Functional components only. No class components.
- Named exports for components. Default export only for page.tsx files (Next.js requirement).
- Server components by default. `'use client'` only when needed.
- Props interface defined above the component, named `{ComponentName}Props`.

```typescript
// Good
interface BookingCardProps {
  title: string;
  dates: string;
  status: 'confirmed' | 'cancelled';
}

export function BookingCard({ title, dates, status }: BookingCardProps): React.ReactElement {
  return ( ... );
}
```

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `BookingCard.tsx` |
| Pages | lowercase (Next.js) | `page.tsx`, `layout.tsx` |
| Utilities/lib | kebab-case | `stripe-helpers.ts` |
| Constants | kebab-case | `church-branches.ts` |
| Types | kebab-case | `booking-types.ts` |
| Tests | Same as source + `.test` | `BookingCard.test.tsx` |
| CSS Modules | Same as component | `BookingCard.module.css` |

### Imports

- Use `@/` path alias for absolute imports (configured in tsconfig.json)
- Group imports: React/Next > external libs > internal modules > types > styles
- Barrel files (`index.ts`) per component folder for clean imports

```typescript
// Good
import { BookingCard } from '@/components/cards';
import { getBooking } from '@/lib/data/bookings';

// Bad
import { BookingCard } from '../../../components/cards/BookingCard';
```

### Component Extraction Rule

Any JSX rendered inside a `.map()` MUST be extracted into its own component file. No complex inline JSX in loops.

---

## File Structure

```
app/
  page.tsx                          # Marketing landing
  layout.tsx                        # Root layout with HeroUI provider
  loading.tsx                       # Global loading state
  conferences/
    [id]/page.tsx                   # Conference detail + register
  auth/
    register/page.tsx
    login/page.tsx
    callback/route.ts
  dashboard/
    page.tsx                        # User dashboard
    profile/page.tsx
  book/
    [conferenceId]/
      page.tsx                      # Room selection
      children/page.tsx
      roommate/page.tsx
      confirm/page.tsx
  pay/page.tsx
  invitations/page.tsx
  merch/
    page.tsx                        # Merch listing
    [id]/page.tsx                   # Merch detail
    orders/page.tsx
  api/
    checkout/route.ts               # Stripe Checkout session

components/
  ui/                               # Shared atomic components
  cards/                            # Data display cards
  layout/                           # Header, Footer, MobileNav
  forms/                            # Form components with RHF + Zod

lib/
  data/                             # Data access layer (abstracts Strapi/Supabase)
    conferences.ts                  # Reads from Strapi
    rooms.ts                        # Reads Strapi + Supabase
    merch.ts                        # Reads from Strapi
    bookings.ts                     # Reads/writes Supabase
    payments.ts                     # Reads Supabase (synced Stripe data)
    profiles.ts                     # Reads/writes Supabase
    invitations.ts                  # Reads/writes Supabase
  supabase/
    client.ts                       # Browser client
    server.ts                       # Server client
    middleware.ts                   # Auth middleware helper
  strapi.ts                         # Strapi REST client
  heroui-theme.ts                   # Custom HeroUI theme
  constants/
    church-branches.ts
  validations/                      # Zod schemas
    auth.ts
    booking.ts
    children.ts
    payment.ts

stores/                             # Zustand stores (client state only)
  booking-flow.ts                   # Multi-step booking wizard state

supabase/
  migrations/                       # SQL migrations
  functions/                        # Edge Functions (webhooks)

tests/                              # Test utilities and setup
  setup.ts

middleware.ts                       # Route protection (auth)
CONTEXT.md                          # Project context for agents
```

---

## Forms Pattern

All forms use React Hook Form + Zod:

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
});

type FormData = z.infer<typeof schema>;

export function RegistrationForm(): React.ReactElement {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData): Promise<void> {
    // ...
  }

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

---

## Error Handling

Three layers:

1. **Data layer** (`lib/data/`) - try/catch, return typed errors or throw
2. **Error boundaries** - `error.tsx` files in route segments catch rendering errors
3. **Toast notifications** - User-facing feedback for actions (payment success, invite sent, etc.)

Never swallow errors silently. Log them and surface to the user appropriately.

---

## Figma-to-Code Workflow

When implementing UI from designs:

1. **Read `docs/design.md`** - it is the single source of truth for all visual decisions
2. **Follow design tokens exactly** - oklch colors, Outfit/Switzer fonts, Tailwind spacing, radius, shadows
3. **Use HeroUI components** mapped in design.md Section 7
4. **Match page templates** from design.md Section 5 (Marketing, Detail, Form, Multi-step, Dashboard, List)
5. **Implement all states** - loading (Skeleton), error (Alert + retry), empty (message + CTA), success (Toast)
6. **Follow interaction patterns** from design.md Section 8 (hover effects, transitions, disabled states)

Rules:
- Always use HeroUI components where they fit (buttons, inputs, modals, cards, etc.)
- Fall back to custom components with Tailwind only when HeroUI doesn't cover it
- Match spacing, sizing, and layout from design.md exactly
- Support all states: hover, focus, disabled, loading, empty, error
- Mobile-first implementation (390px base, responsive up)

---

## Testing Strategy

### Framework: Vitest

- Unit tests for business logic (price calculation, gender validation, invitation state)
- Integration tests for data access layer functions
- Component tests for interactive components (forms, modals)
- Tests co-located with source files: `Component.tsx` + `Component.test.tsx`

### What MUST be tested

- Price splitting logic (room cost / occupants)
- Children surcharge calculation (12+ billing)
- Gender validation rules (married/siblings exception)
- Invitation state machine (pending > accepted/declined)
- Payment amount validation ($25 min, remaining max)
- Search privacy rules (name vs phone search results)
- Room availability calculation (Strapi total - Supabase bookings)

### CI Pipeline

Tests run on every push to GitHub via GitHub Actions:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
```

### Test Maintenance Rule

Any code change that would break an existing test MUST be flagged. Do NOT automatically rewrite failing tests - flag the failure and let the developer decide how to handle it.

---

## Git Workflow

### Branching

Feature branches merged to `main` via pull request.

```
main (production)
  |-- feat/auth
  |-- feat/room-booking
  |-- feat/payments
  |-- fix/price-calculation
```

Branch naming: `<type>/<short-description>` (e.g., `feat/roommate-search`, `fix/split-price`)

### Conventional Commits

All commits follow Conventional Commits:

```
<type>(<scope>): <description>
```

| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `test` | Adding/updating tests |
| `refactor` | Code change, no behavior change |
| `chore` | Dependencies, config, tooling |
| `docs` | Documentation |
| `style` | Formatting only |

Examples:
```
feat(auth): implement email registration with church branch selection
fix(booking): correct price split when third roommate joins
test(invitations): add gender validation edge cases
chore(deps): add react-hook-form and zod
```

### Atomic Commits

One logical change per commit. Every commit must pass build + tests.

---

## Deployment

### Cloudflare Pages via GitHub Actions

Deployment is handled manually by the developer. Do NOT create or modify deployment workflows.

### Environment Variables

All env vars documented in `.env.local.example`. Production values set in Cloudflare dashboard.

---

## What NOT To Do

- Use `any` type
- Write class components
- Skip TypeScript strict checks
- Import with relative paths when `@/` works
- Put complex JSX inside `.map()` loops
- Use inline styles when Tailwind classes exist
- Ship without tests for business logic
- Commit with failing tests
- Add dependencies when native fetch or stdlib covers it
- Build custom UI components when HeroUI has one
- Use `'use client'` without a reason
- Hardcode values that should be constants or env vars
- Ignore the Figma design (spacing, sizing, layout must match)
- Write documentation files unless explicitly asked
- Use em-dashes in any text content
- Merge to main without PR
- Leave TODO comments without a linked issue or plan reference

---

## Agent Behavior Summary

Priorities:

```
correctness > speed
simplicity > abstraction
tested > untested
design fidelity > convenience
teaching > silently shipping
```

Act like a pragmatic senior full-stack engineer. Challenge assumptions. Detect flawed architecture. Explain your choices. Ship working code with tests.
