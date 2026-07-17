# UI Polish & Sidebar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix merch bug, add DiceBear avatars, HeroUI header dropdown, collapsible sidebar for protected pages, enhanced dashboard, and date/time improvements.

**Architecture:** Sidebar layout wraps `(app)` route group. Header dropdown on marketing pages. DiceBear Thumbs for avatars seeded by full name. Date/time fields use date picker + hour dropdown.

**Tech Stack:** @dicebear/thumbs, HeroUI Dropdown, Next.js Image, localStorage for sidebar state, Tailwind transitions.

---

## Task 1: Fix Merch "Item Not Found" Bug

**Files:**
- Debug: `lib/data/merch.ts` (getMerchItemBySlug)

**Issue:** Strapi slug filter likely not matching. Check if slugs are auto-generated or manually set. The listing page uses `item.slug` to link, detail page calls `getMerchItemBySlug(slug)`. If Strapi doesn't have a `slug` field or it's empty, the filter returns [].

**Fix approach:** Check Strapi response, fall back to documentId-based lookup if slug fails.

---

## Task 2: Install DiceBear

**Command:**
```bash
npm install @dicebear/core @dicebear/thumbs
```

**Files:**
- Create: `lib/utils/avatar.ts` — helper that generates avatar data URL from full name

---

## Task 3: Header Avatar Dropdown (Marketing Pages)

**Files:**
- Modify: `components/layout/Header.tsx` — replace avatar Link with HeroUI Dropdown
- Create: `components/layout/UserDropdown.tsx` — client component with Dropdown

---

## Task 4: Sidebar Component

**Files:**
- Create: `components/layout/Sidebar.tsx` — client component, icon rail / full width, localStorage persistence
- Create: `components/layout/Topbar.tsx` — breadcrumbs + theme toggle
- Modify: `app/(app)/layout.tsx` — replace Header with Sidebar + Topbar layout

**Nav items:** Dashboard, My Booking, Payments, Invitations, Merch Orders, Profile, Log Out

---

## Task 5: Enhanced Dashboard

**Files:**
- Modify: `app/(app)/dashboard/page.tsx` — full width, stats row, deadlines panel, richer booking card

---

## Task 6: Conference Date/Time Display + Registration Form

**Files:**
- Modify: `app/(marketing)/conferences/[slug]/page.tsx` — show localized times
- Modify: `components/forms/RegistrationForm.tsx` — date + hour dropdown, side-by-side on desktop
- Modify: `lib/validations/booking.ts` — update validation for datetime (allow 24h before start)

---

## Task 7: Profile Page Avatar Preview (Live Update)

**Files:**
- Modify: `app/(app)/dashboard/profile/page.tsx` — show DiceBear avatar that updates as name changes

---
