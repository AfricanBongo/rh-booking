# RoyalHouse Booking — Design System

> Conference room booking for RoyalHouse Church. 22 branches. One family.
> Visual DNA: Airbnb's premium whitespace + Eventbrite's soft rounded cards + Luma's single-CTA clarity + Splash's full-bleed hero energy + Booking.com's trust patterns.
> Built with custom components on Tailwind CSS v4 + HeroUI v3 (selective usage).

---

## 1. Design Philosophy

### Core Principles

| Principle | Meaning | Reference |
|-----------|---------|-----------|
| **Premium warmth** | Generous whitespace, large photography, rounded surfaces (16-20px radius), border-based elevation (no shadow at rest) | Airbnb |
| **Event excitement** | Full-bleed hero imagery, bold display type, urgency signals (days away, spots remaining) | Splash, Eventbrite |
| **Single CTA clarity** | One primary action per context. No competing buttons. | Luma |
| **Trust through transparency** | Price breakdowns visible, payment flexibility prominent, real availability counts | Booking.com |
| **Church-appropriate** | Warm, inviting, energetic. Not corporate SaaS, not overly playful. Confident but approachable. | Original |
| **Mobile-first** | 390px is the primary canvas; desktop (1280px) is the responsive expansion | Original |

### Dual-Mode UX Strategy

The app operates in two modes that require different visual treatments:

**Excitement Mode** (Conference discovery, landing page, merch):
- Full-bleed imagery, large display type, social proof
- Single prominent CTA per section
- Event-forward language ("Secure Your Spot", not "Register")

**Trust Mode** (Booking flow, payments, profile):
- Step indicators, price breakdowns, progress bars
- Transparent cost splitting
- Reassuring language ("Pay at your pace", not "Payment required")

---

## 2. Color Tokens

All colors use oklch color space. Defined as CSS custom properties, mapped to Tailwind via `@theme inline`.

### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.9702 0 0)` | Page background |
| `--foreground` | `oklch(0.2103 0.0059 285.89)` | Primary text |
| `--surface` | `oklch(100% 0 0)` | Cards, panels |
| `--surface-secondary` | `oklch(0.9524 0.0013 286.37)` | Subtle section backgrounds |
| `--surface-tertiary` | `oklch(0.9373 0.0013 286.37)` | Deeper contrast sections |
| `--accent` | `oklch(0.6204 0.195 253.83)` | Primary actions, links, focus rings |
| `--accent-foreground` | `oklch(0.9911 0 0)` | Text on accent backgrounds |
| `--success` | `oklch(0.7329 0.1935 150.81)` | Success states, "Paid in Full" |
| `--warning` | `oklch(0.7819 0.1585 72.33)` | Urgency, countdowns |
| `--danger` | `oklch(0.6532 0.2328 25.74)` | Errors, destructive actions |
| `--muted` | `oklch(0.5517 0.0138 285.94)` | Secondary text, captions |
| `--default` | `oklch(94% 0.001 286.375)` | Neutral backgrounds |
| `--border` | `oklch(90% 0.004 286.32)` | Card borders, dividers |

### Dark Mode (class: `.dark`)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(12% 0.005 285.823)` | Page background |
| `--foreground` | `oklch(0.9911 0 0)` | Primary text |
| `--surface` | `oklch(0.2103 0.0059 285.89)` | Cards, panels |
| `--surface-secondary` | `oklch(0.257 0.0037 286.14)` | Section backgrounds |
| `--accent` | `oklch(0.68 0.18 253.83)` | Slightly brighter for dark bg |
| `--border` | `oklch(28% 0.006 286.033)` | Card borders |

Dark mode is class-based (`.dark` on `<html>`), managed by `next-themes`. Users can toggle between light, dark, and system via the header ThemeToggle.

---

## 3. Typography

### Font Families

| Role | Font | Source |
|------|------|--------|
| Headings (Display, H1-H3) | **Outfit** | Google Fonts |
| Body, Caption, UI | **Switzer** | Fontshare CDN |

### Type Scale

| Level | Font | Size (mobile) | Size (desktop) | Weight | Usage |
|-------|------|--------------|----------------|--------|-------|
| Display | Outfit | 32px | 56px | Bold (700) | Hero headlines |
| H1 | Outfit | 24px | 36px | Semi Bold (600) | Page/section titles |
| H2 | Outfit | 20px | 28px | Semi Bold (600) | Card titles |
| H3 | Outfit | 18px | 22px | Semi Bold (600) | Subsections |
| Body | Switzer | 16px | 16px | Regular (400) | Paragraphs |
| Body Small | Switzer | 14px | 14px | Regular (400) | Secondary info |
| Caption | Switzer | 12px | 12px | Medium (500) | Badges, fine print |

---

## 4. Iconography

**Library:** Phosphor Icons (`@phosphor-icons/react`)

### Import Convention

```tsx
// Server Components (RSC):
import { UsersIcon, HouseIcon } from "@phosphor-icons/react/dist/ssr";

// Client Components ('use client'):
import { SunIcon, MoonIcon } from "@phosphor-icons/react";
```

**IMPORTANT:** Always use the `Icon` suffix export (e.g. `UsersIcon`, not `Users`). The non-suffixed exports are deprecated.

### Icon Weights

| Context | Weight | Example |
|---------|--------|---------|
| Feature/decorative icons | `duotone` | How It Works step icons |
| UI icons (nav, buttons) | `regular` (default) | CaretRight, ArrowLeft |
| Placeholder/empty states | `thin` | ShoppingBag in empty merch |
| Strong emphasis | `bold` | Check in success states |

### Sizes

| Context | Size | Example |
|---------|------|---------|
| Inline with text | 14-16px | MapPin next to location |
| In buttons | 18-20px | Nav icons |
| Feature cards | 24px | How It Works |
| Empty states | 48px | Placeholder icons |

---

## 5. Custom Component Library

We use HeroUI v3 selectively (Spinner, Disclosure for accessible accordion) but primarily rely on custom components that match our design language exactly. HeroUI's default BEM CSS does not load in our Tailwind 4 setup, so we built custom alternatives.

### PillButton (`components/ui/PillButton.tsx`)

Pill-shaped CTA button. The primary interactive element throughout the app.

| Variant | Visual | Usage |
|---------|--------|-------|
| `primary` | Accent bg, white text | Main CTAs |
| `dark` | Foreground bg, background text | Auth pages, header |
| `outline` | Border, transparent bg | Secondary actions |
| `ghost` | No border, hover bg | Tertiary actions |

| Size | Dimensions |
|------|-----------|
| `sm` | h-9 px-4 text-sm |
| `md` | h-11 px-6 text-sm |
| `lg` | h-12 px-8 text-base |

Props: `href` (renders as Link), `onClick`/`type` (renders as button), `fullWidth`, `disabled`.

### Badge (`components/ui/Badge.tsx`)

Small pill indicator for status, dates, or labels.

| Variant | Visual | Usage |
|---------|--------|-------|
| `soft` | Accent/10 bg, accent text | Date badges on cards |
| `outline` | Border only | Unavailable, neutral labels |
| `solid` | Filled accent | Strong status |
| `glass` | White/15 bg, backdrop-blur | On dark/image backgrounds (hero) |

### FormField (`components/ui/FormField.tsx`)

Wraps label + input + error. Used in all forms.

### InfoCard (`components/ui/InfoCard.tsx`)

Icon + label + value display card. Used on conference detail for key facts.

### SectionHeader (`components/ui/SectionHeader.tsx`)

Section title with optional overline, subtitle, and right-aligned link.

---

## 6. Motion & Animation

### Philosophy

Motion is subtle and purposeful. Never busy. It communicates:
- **Entrance**: Content arriving on screen (fade-up, stagger)
- **Feedback**: User action acknowledged (press scale, hover lift)
- **Transition**: State changing (accordion open, page navigation)

### Keyframe Animations

| Name | Easing | Duration | Usage |
|------|--------|----------|-------|
| `fade-up` | `cubic-bezier(0.16, 1, 0.3, 1)` | 600ms | Section entrance |
| `fade-in` | `ease` | 500ms | Simple reveals |
| `scale-in` | `cubic-bezier(0.16, 1, 0.3, 1)` | 400ms | Modals, confirmations |
| `slide-up` | `cubic-bezier(0.16, 1, 0.3, 1)` | 500ms | Accordion content, toasts |

### Stagger Pattern

The `.stagger` class applies sequential delays to children (80ms apart). Use on card grids:

```html
<div class="grid stagger">
  <div class="animate-fade-up">Card 1</div> <!-- delay 0ms -->
  <div class="animate-fade-up">Card 2</div> <!-- delay 80ms -->
  <div class="animate-fade-up">Card 3</div> <!-- delay 160ms -->
</div>
```

### Micro-Interactions

| Element | Interaction | CSS |
|---------|-------------|-----|
| PillButton | Scale up on hover, scale down on press | `hover:scale-[1.02] active:scale-[0.98]` |
| Cards | Lift on hover (translateY + shadow) | `.hover-lift` utility |
| Images in cards | Zoom on hover | `group-hover:scale-105 transition-transform duration-500` |
| Card borders | Accent tint on hover | `hover:border-accent/30` |
| FAQ accordion | Content slides up on open | `details[open] > summary ~ * { animation: slide-up }` |
| Icon containers | Color fill on hover | `group-hover:bg-accent group-hover:text-accent-foreground` |
| Focus rings | Smooth outline appearance | `focus-visible: outline-accent, outline-offset-2` |
| Page load | Sections fade up sequentially | `animate-fade-up` on sections |

### Reduced Motion

All animations respect `prefers-reduced-motion: reduce`. The easing function includes `motion-reduce:transition-none` fallback.

---

## 7. Page Specifications

### Marketing Landing Page

**Structure (top to bottom):**
1. **Hero** (85vh): Full-bleed conference photo, gradient overlay, conference name in Display type, subtitle copy, PillButton CTA + Badge ("30 days away")
2. **How It Works**: Centered heading + 4 icon cards (stagger entrance)
3. **Upcoming Conferences**: Section header + card grid (3-col desktop)
4. **Merch** ("Wear the moment"): Overline + heading + product cards from Strapi
5. **FAQ** ("Common questions"): Native details/summary with slide animation
6. **CTA Band** ("Ready to join?"): Centered heading + dual buttons

**Copy tone:** Warm, clear, encouraging. Active voice. Short sentences.

**Key copy:**
- Hero subtitle: "Three days of worship, teaching, and community that will stay with you long after you leave."
- How It Works heading: "From registration to room key"
- Merch overline: "LIMITED COLLECTION"
- Merch heading: "Wear the moment"
- FAQ heading: "Common questions"
- CTA: "Spots fill up fast. Register today and take your time with the rest."

### Conference Detail Page

**Structure:**
1. **Hero image** (full-width, gradient overlay, back link, title + dates)
2. **Info cards** (3-column: dates, location, payment deadline) - uses InfoCard component
3. **About section** (prose)
4. **Registration card** (state-dependent: not logged in / registered / active / closed)

### Auth Pages (Login + Register)

**Layout:** Split screen. Left 45% = gradient panel with brand tagline. Right = form.

**Login copy:** "Welcome back" / "Enter your email and we'll send you a sign-in link. No password needed."
**Register copy:** "Create your account" / "Takes under a minute. No password required."
**Register step 2:** "Almost there" / "Just a few more details so we can match you with your branch."

### Merch Store

**Listing:** Grid of product cards (image-dominant, square aspect ratio). Unavailable items grayed with Badge overlay.
**Detail:** Split layout - image left, details + purchase form right.

---

## 8. Spacing, Sizing, Radius

### Border Radius

| Usage | Value | Tailwind |
|-------|-------|----------|
| Buttons | 9999px (pill) | `rounded-full` |
| Cards, panels | 16px | `rounded-2xl` |
| Input fields | 12px | `rounded-xl` |
| Icon containers | 12px | `rounded-xl` |
| Images (heroes) | 16px | `rounded-2xl` |
| Badges | 9999px (pill) | `rounded-full` |

### Section Spacing

| Context | Mobile | Desktop |
|---------|--------|---------|
| Between sections | `py-16` (64px) | `py-24` (96px) |
| Section heading to content | `mb-10` (40px) | `mb-14` (56px) |
| Card grid gap | `gap-6` (24px) | `gap-6` (24px) |
| Page horizontal padding | `px-4` | `px-8` |

---

## 9. Responsive Behavior

| Breakpoint | Width | Tailwind |
|-----------|-------|----------|
| Mobile | 390px | Default |
| Tablet | 810px | `md:` |
| Desktop | 1280px | `lg:` |

- Container: `max-w-7xl mx-auto`
- Cards: 1-col mobile → 2-col tablet → 3-col desktop
- Hero: Full-bleed on all sizes, 75vh mobile, 85vh desktop
- Auth: Stacked on mobile (gradient panel hidden), split on desktop

---

## 10. Imagery & Media

- Conference photos: Full-bleed, warm-toned, showing community/gathering
- Gradient overlay on hero: `bg-gradient-to-t from-black/70 via-black/30 to-transparent`
- Card images: `aspect-[16/10]` for conferences, `aspect-square` for merch
- Zoom on hover: `group-hover:scale-105 transition-transform duration-500`
- Empty state: Phosphor icon (`weight="thin"`, size 48) centered

---

## 11. HeroUI v3 Usage

HeroUI is installed (`@heroui/react`) but used selectively. Its CSS doesn't auto-load in Tailwind v4's PostCSS pipeline.

**Use HeroUI for:**
- `Spinner` - loading indicators in buttons
- `Disclosure` / `DisclosureGroup` - accessible accordion (when needed beyond native details)
- `Input` - with `variant="secondary"` inside surface contexts
- Future: `Modal`, `Drawer`, `Toast`, `Select`, `ComboBox` as features are built

**Use custom components for:**
- Buttons → `PillButton`
- Badges/chips → `Badge`
- Cards → plain `div` with border + rounded-2xl
- Form fields → `FormField`

---

## 12. Platform Context

| Feature | Design Implication |
|---------|-------------------|
| 22 church branches | Searchable dropdown (ComboBox) |
| Room types: Private, Shared-2, Shared-4 | RadioGroup cards with visual distinction |
| Roommate privacy rules | Limited info in search results, full after acceptance |
| Gender validation | AlertDialog modal with relationship options |
| Payments: partial, installments | ProgressBar + preset buttons + custom amount |
| Children 12+ surcharge | Inline warning when age >= 12 |
| Countdown to deadline | Badge with warning color |
| Merch: separate flow | Own listing, own purchase flow, own order history |
