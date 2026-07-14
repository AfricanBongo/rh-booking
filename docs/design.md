# RoyalHouse Booking — Design System

> A conference room booking platform for RoyalHouse Church (US branches).
> Visual DNA: Airbnb's premium warmth and generous whitespace meets Eventbrite's event-forward urgency and bold CTAs.
> Built on HeroUI v3 Figma Kit with default tokens. Layout tokens from Tailwind CSS v4.

---

## 1. Design Principles

| Principle | Meaning |
|-----------|---------|
| **Premium warmth** | Generous whitespace, large photography, rounded surfaces, trust-building layouts (Airbnb) |
| **Event urgency** | Countdown timers, bold CTAs, clear action hierarchy, progress indicators (Eventbrite) |
| **Mobile-first** | 390px is the primary canvas; desktop (1280px) is the responsive expansion |
| **Component-driven** | Every UI element maps to a HeroUI v3 component; no custom primitives unless HeroUI lacks coverage |
| **Church-appropriate** | Warm, inviting, energetic - not corporate SaaS. Confident but approachable. |

---

## 2. Color Tokens

All colors use oklch color space. HeroUI v3 defaults - customizable via CSS variables.

### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.9702 0 0)` | Page background |
| `--foreground` | `oklch(0.2103 0.0059 285.89)` (eclipse) | Primary text |
| `--surface` | `oklch(100% 0 0)` (white) | Cards, panels, non-overlay containers |
| `--surface-secondary` | `oklch(0.9524 0.0013 286.37)` | Subtle section backgrounds |
| `--surface-tertiary` | `oklch(0.9373 0.0013 286.37)` | Deeper contrast sections |
| `--accent` | `oklch(0.6204 0.195 253.83)` | Primary actions, links, focus rings (blue) |
| `--accent-foreground` | `oklch(0.9911 0 0)` (snow) | Text on accent backgrounds |
| `--success` | `oklch(0.7329 0.1935 150.81)` | Success states, "Paid in Full" badges |
| `--warning` | `oklch(0.7819 0.1585 72.33)` | Urgency, countdown timers, low stock |
| `--danger` | `oklch(0.6532 0.2328 25.74)` | Errors, destructive actions, "Closed" badges |
| `--muted` | `oklch(0.5517 0.0138 285.94)` | Secondary text, placeholders, captions |
| `--default` | `oklch(94% 0.001 286.375)` | Neutral backgrounds, disabled states |
| `--border` | `oklch(90% 0.004 286.32)` | Card borders, dividers |
| `--separator` | `oklch(92% 0.004 286.32)` | Section dividers |

### Dark Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(12% 0.005 285.823)` | Page background |
| `--foreground` | `oklch(0.9911 0 0)` (snow) | Primary text |
| `--surface` | `oklch(0.2103 0.0059 285.89)` | Cards, panels |
| `--surface-secondary` | `oklch(0.257 0.0037 286.14)` | Subtle section backgrounds |
| `--overlay` | `oklch(0.2103 0.0059 285.89)` | Modals, popovers |
| `--default` | `oklch(27.4% 0.006 286.033)` | Neutral backgrounds |
| `--border` | `oklch(28% 0.006 286.033)` | Card borders |

### Semantic Color Usage

| Context | Color Token |
|---------|------------|
| Primary CTA buttons | `--accent` |
| Registration countdown | `--warning` |
| "Registration Closed" badge | `--danger` |
| "Paid in Full" / success | `--success` |
| Disabled buttons/inputs | `--default` at `0.5` opacity |
| Section alternate background | `--surface-secondary` |
| Card background | `--surface` |

---

## 3. Typography

### Font Families

| Role | Font | Source |
|------|------|--------|
| Headings (Display, H1-H3) | **Outfit** | Google Fonts |
| Body, Caption, Footnote | **Switzer** | Fontshare |

### Type Scale

| Level | Font | Size (mobile) | Size (desktop) | Weight | Usage |
|-------|------|--------------|----------------|--------|-------|
| Display | Outfit | 32px | 56px | Bold (700) | Hero headlines, page titles |
| Heading 1 | Outfit | 24px | 36px | Semi Bold (600) | Section titles |
| Heading 2 | Outfit | 20px | 28px | Semi Bold (600) | Card titles, subsections |
| Heading 3 | Outfit | 18px | 22px | Semi Bold (600) | Step titles, labels |
| Body | Switzer | 16px | 16px | Regular (400) | Paragraphs, descriptions |
| Body Small | Switzer | 14px | 14px | Regular (400) | Secondary info, metadata |
| Caption | Switzer | 12px | 12px | Medium (500) | Timestamps, badges, fine print |
| Overline | Switzer | 12px | 12px | Medium (500) | Section labels, categories (uppercase) |

### Type Rules

- Body text: 1.5 line-height for readability
- Headings: 1.2 line-height (tighter)
- Max line width: ~65 characters for body text
- Letter-spacing: -0.02em on Display, normal elsewhere
- Outfit handles all heading hierarchy; Switzer handles everything else

---

## 4. Spacing, Sizing, Shadows, Radius (Tailwind CSS v4)

All layout tokens use Tailwind CSS v4's default scale. Reference Tailwind classes directly - no custom spacing tokens.

### Spacing Scale (used for padding, margin, gap)

| Tailwind Class | Value | Common Usage |
|----------------|-------|--------------|
| `1` | 4px | Icon-to-text gaps |
| `2` | 8px | Between related elements |
| `3` | 12px | Small card padding, chip spacing |
| `4` | 16px | Card padding, mobile grid gap |
| `5` | 20px | Medium component spacing |
| `6` | 24px | Desktop grid gap, element groups |
| `8` | 32px | Section padding (mobile), footer |
| `10` | 40px | Large section gaps |
| `12` | 48px | Section vertical padding (mobile) |
| `16` | 64px | Between-section spacing |
| `20` | 80px | Section vertical padding (desktop), hero padding |

### Airbnb-Inspired Spacing Rules

- Generous whitespace between sections: `py-12` mobile, `py-20` desktop
- Card interiors: minimum `p-4`
- Content never touches edges: `px-4` mobile page margin
- Visual grouping: related items `gap-2` to `gap-3`, unrelated groups `gap-6` to `gap-12`

### Border Radius

| Tailwind Class | Value | Usage |
|----------------|-------|-------|
| `rounded-lg` | 8px | Buttons, inputs, chips |
| `rounded-xl` | 12px | Cards, form fields |
| `rounded-2xl` | 16px | Hero images, modals |
| `rounded-full` | 9999px | Avatars, circular badges |

### Shadows

| Tailwind Class | Usage |
|----------------|-------|
| `shadow-sm` | Cards at rest |
| `shadow-md` | Cards on hover, elevated elements |
| `shadow-lg` | Dropdowns, popovers |
| `shadow-xl` | Modals |

### Sizing

| Context | Tailwind Approach |
|---------|-------------------|
| Container max-width | `max-w-7xl` (1280px) |
| Form max-width | `max-w-md` (448px) or `max-w-lg` (512px) |
| Card min-height | Content-driven (no fixed) |
| Button height | Determined by HeroUI size prop (sm/md/lg) |
| Navbar height | `h-14` (56px) mobile, `h-16` (64px) desktop |
| Touch targets | Minimum `w-11 h-11` (44px) on mobile |
| Image aspect ratio | `aspect-video` (16:9) for card thumbnails |

---

## 5. Layout & Grid

### Breakpoints

| Name | Width | Tailwind Prefix |
|------|-------|-----------------|
| Mobile | 390px | Default (no prefix) |
| Tablet | 810px | `md:` |
| Desktop | 1280px | `lg:` |

### Container

- Max width: `max-w-7xl` (1280px), centered with `mx-auto`
- Horizontal padding: `px-4` (mobile), `px-6` (tablet), `px-8` (desktop)

### Grid

- Mobile: Single column (`grid-cols-1`)
- Tablet: 2-column where applicable (`md:grid-cols-2`)
- Desktop: 2-3 columns (`lg:grid-cols-2` or `lg:grid-cols-3`)

### Page Templates

| Template | Structure | Used For |
|----------|-----------|----------|
| **Marketing** | Navbar > Hero > Content sections > Footer | Landing page |
| **Detail** | Navbar > Back link > Content > Action area > Footer | Conference detail, merch detail |
| **Form** | Navbar > Centered card (`max-w-md`) > Footer | Auth, profile edit |
| **Multi-step** | Navbar > Step indicator > Content > Navigation buttons | Booking flow |
| **Dashboard** | Navbar > Welcome > Cards grid > Sections > Footer | User dashboard |
| **List** | Navbar > Page title > Filter/sort > Grid/List > Pagination > Footer | Merch store, orders, invitations |

---

## 6. Iconography

**Library:** UI Icons by Flaticon

### Usage Rules

- Sizes: `w-4 h-4` inline with text, `w-5 h-5` in buttons, `w-6 h-6` standalone
- Color inherits from parent text color (`currentColor`)
- Functional icons only - no decorative filler
- Button icons: left-positioned for actions ("+ Add Child"), right-positioned for navigation ("Register Now >")

### Common Icons Needed

| Context | Icon |
|---------|------|
| Calendar/dates | Calendar |
| Location/venue | Map pin |
| Price/money | Dollar sign |
| Time/countdown | Clock |
| Arrow right (CTA) | Chevron right / arrow right |
| Add/create | Plus |
| Search | Magnifying glass |
| User/profile | Person |
| Check/success | Checkmark |
| Close/remove | X |
| Menu (mobile) | Hamburger (3 lines) |
| Back navigation | Arrow left |

---

## 7. Component Library (HeroUI v3 Mapping)

### Primary Components Used

| UI Need | HeroUI Component | Variant/Config |
|---------|-----------------|----------------|
| Primary actions | `Button` | `primary` variant, sizes: sm/md/lg |
| Secondary actions | `Button` | `secondary` or `ghost` variant |
| Destructive actions | `Button` | `danger` variant |
| Text links | `Link` | Inline or standalone |
| Form inputs | `TextField` | With label, description, error states |
| Dropdowns | `Select` or `ComboBox` | ComboBox for searchable (church branches) |
| Date selection | `DatePicker` / `DateRangePicker` | Calendar popup |
| Cards | `Card` | Compound: Card.Header, Card.Content, Card.Footer |
| Modals/dialogs | `Modal` or `AlertDialog` | AlertDialog for confirmations |
| Chips/tags | `Chip` | Status indicators, countdown badges |
| Progress | `ProgressBar` | Payment progress display |
| Tabs | `Tabs` | Section switching |
| Toast notifications | `Toast` | Success/error feedback |
| Loading states | `Skeleton` | Content placeholders |
| Spinner | `Spinner` | Button loading, inline loading |
| Search | `SearchField` | Roommate search |
| Toggle | `Switch` | Children attending toggle |
| Radio options | `RadioGroup` | Room type, bed preference |
| Checkbox | `Checkbox` / `CheckboxGroup` | Multi-select options |
| Avatars | `Avatar` | User profiles, roommate display |
| Badges | `Badge` | Notification counts, status |
| Pagination | `Pagination` | Lists with many items |
| Separator | `Separator` | Content dividers |
| Drawer | `Drawer` | Mobile navigation |
| Disclosure | `Disclosure` | FAQ, expandable details |
| Breadcrumbs | `Breadcrumbs` | Multi-step flow context |
| Alert | `Alert` | Inline warnings, info messages |
| Number input | `NumberField` | Payment amount, children age |
| Meter | `Meter` | Visual payment progress |

### Button Variants Per Context

| Context | Variant | Size |
|---------|---------|------|
| Hero CTA | `primary` | `lg` |
| Card actions | `ghost` or `secondary` | `md` |
| Form submit | `primary` | `md` |
| Destructive (decline invite) | `danger` | `md` |
| Skip/secondary flow | `secondary` | `md` |
| Disabled/closed | `primary` with `isDisabled` | `md`/`lg` |
| Navbar login/register | `primary` | `sm` |

### Card Patterns

| Context | Style |
|---------|-------|
| Conference card (grid) | Image top + content + action link |
| Booking summary | Header + content rows + footer with price |
| Dashboard quick link | Icon + title + description (compact) |
| Room type selection | Image + details + radio/select action |
| Invitation card | Avatar + details + accept/decline buttons |
| Payment history item | Date + amount + status chip |

---

## 8. Interaction Patterns

### Loading States

| Context | Pattern |
|---------|---------|
| Page data loading | `Skeleton` placeholders matching content layout |
| Button action pending | Spinner inside button, text changes, `isDisabled` |
| Inline loading (search) | Spinner inside search field |
| Image loading | Skeleton rectangle with shimmer |

### Error States

| Context | Pattern |
|---------|---------|
| Page data error | Centered message + retry button (`Alert`) |
| Form validation | Inline red error text below field (`FieldError`) |
| Network error | `Toast` (danger variant) |
| Action failure | `Toast` with retry suggestion |

### Empty States

| Context | Pattern |
|---------|---------|
| No conferences | Icon + "Stay tuned" + email signup |
| No bookings (dashboard) | Message + "Browse Conferences" CTA |
| No invitations | "You have no pending invitations" |
| No orders | Message + "Browse Merch" CTA |
| No search results | "No members found matching your search" |

### Success States

| Context | Pattern |
|---------|---------|
| Registration complete | Toast + redirect to dashboard |
| Booking confirmed | Confirmation page with summary |
| Payment successful | Toast + updated progress bar |
| Invitation sent | Toast + updated status in list |
| Invite accepted | Toast + booking created notification |

### Micro-Interactions (Moderate Level)

| Element | Interaction |
|---------|-------------|
| Buttons | Scale down on press (`scale-[0.97]`), color transition on hover (`transition-colors duration-150`) |
| Cards | Lift on hover (`hover:-translate-y-0.5 hover:shadow-md transition-all duration-200`) |
| Page transitions | Fade-in content (`animate-in fade-in duration-150`) |
| Modal open/close | Scale + fade (200ms) |
| Toast | Slide in from top-right, auto-dismiss after 5s |
| Progress bar | Animated fill (`transition-all duration-300 ease-out`) |
| Skeleton | Shimmer animation (HeroUI built-in) |
| Countdown | Subtle pulse on number change |
| Step indicator | Current step pulses, completed steps get check icon |
| Form fields | Border transition on focus (`transition-colors duration-150`) |

### Disabled States

- Opacity: `opacity-50`
- Cursor: `cursor-not-allowed`
- No hover effects
- No focus ring

---

## 9. Page-Specific Patterns

### Multi-Step Booking Flow

- Step indicator at top: horizontal on desktop, "Step 2 of 4" on mobile
- Steps: Room Selection > Children > Roommate > Confirmation
- "Back" and "Continue" buttons at bottom (`flex justify-between`)
- Progress persists in URL (each step is a route segment)

### Forms (Auth, Profile, Registration)

- Centered single-column layout, `max-w-md mx-auto`
- Card container with surface background
- Fields stacked vertically, `gap-4`
- Submit button full-width at bottom
- Inline validation (red border + error message)
- Church branch: `ComboBox` (searchable) with 22 options

### Dashboard Layout

- Welcome header with user name
- Cards in responsive grid (`grid-cols-1 md:grid-cols-2`)
- Primary card (booking) full width or visually dominant
- Payment `ProgressBar` prominently visible
- Pending invitations as a list below

### Payment Page

- Balance display: large number with `ProgressBar` or `Meter`
- Preset amount buttons in a row (`flex gap-3`)
- Custom amount: `NumberField` with min/max validation
- "Pay Now" button > Stripe Checkout redirect
- Payment history below (stacked cards on mobile, `Table` on desktop)

### Search (Roommate)

- `SearchField` at top with real-time results below
- Result items: `Avatar` + name + limited info (privacy rules)
- "Invite" button on each result
- Gender mismatch triggers `AlertDialog` before invite proceeds

---

## 10. Responsive Behavior

### Mobile (390px)

- Single column (`grid-cols-1`)
- Cards stack vertically
- Hero: text above, image below
- Navigation: hamburger > `Drawer`
- Buttons: full-width in forms (`w-full`), auto in cards
- No horizontal scrolling

### Tablet (810px)

- 2-column grids (`md:grid-cols-2`)
- Hero: still stacked or early split
- Navigation: full visible
- Cards: 2 per row

### Desktop (1280px)

- Hero: split layout (text left, image right)
- Cards: 2-3 per row (`lg:grid-cols-3`)
- Forms: centered with `max-w-md`
- Generous side margins (`px-8`, centered container)
- Footer: multi-column

### Responsive Rules

- Images: `object-cover`, responsive height
- Touch targets: minimum `w-11 h-11` (44px) on mobile
- Cards: equal height in grid (`items-stretch`)

---

## 11. Image & Media

### Photography Style

- Large, high-quality conference/event photography
- Warm tones, well-lit, showing community/gathering
- Rounded corners (`rounded-xl` to `rounded-2xl`)
- `aspect-video` (16:9) for card thumbnails

### Placeholder Strategy

- `Skeleton` rectangle during loading
- Fallback: `bg-surface-secondary` if no image
- Never show broken image icons

---

## 12. Localization

| Element | Format |
|---------|--------|
| Currency | USD ($X,XXX) |
| Dates | Month Day-Day, Year (e.g., "Dec 15-18, 2026") |
| Cities | US cities (Atlanta, Houston, Dallas, etc.) |
| Phone | US format (+1 XXX-XXX-XXXX) |
| Language | English (US) only |

---

## 13. Platform Context (for design decisions)

| Feature | Design Implication |
|---------|-------------------|
| 22 church branches | Searchable `ComboBox`, not basic dropdown |
| Room types: Private, Shared-2, Shared-4 | `RadioGroup` cards with visual distinction |
| Bed preference: King/Double | Secondary `RadioGroup` within room selection |
| Roommate privacy rules | Search results show limited info, full details post-acceptance |
| Gender validation | `AlertDialog` modal with relationship options |
| Payments: partial, installments | `ProgressBar` + preset buttons + custom input |
| Children 12+ surcharge | Inline `Alert` when age >= 12 entered |
| Countdown to registration close | `Chip` with warning color |
| Merch: separate from room payment | Distinct flow, own order history |
