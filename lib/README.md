# lib/ - Application Library

The core application logic, split into clear responsibilities.

## data/

**Data access layer.** Abstracts whether data comes from Strapi (CMS) or Supabase (database). Components import from here and never talk to Strapi/Supabase directly.

| File | Source | Functions |
|------|--------|-----------|
| `conferences.ts` | Strapi | `getConferences()`, `getConference(id)`, `getConferenceBySlug(slug)` |
| `rooms.ts` | Strapi + Supabase | `getRoomTypes(conferenceId)`, `getRoomTypesWithAvailability(conferenceId)` |
| `merch.ts` | Strapi | `getMerchItems(conferenceId)`, `getMerchItem(id)`, `getMerchItemBySlug(slug)`, `getPickupLocations(conferenceId)` |
| `bookings.ts` | Supabase | `registerForConference(data)`, `getBooking(id)`, `getUserBooking(userId, conferenceId)` |
| `invitations.ts` | Supabase | `createInvitation(data)`, `acceptInvitation(id, inviteeId)`, `declineInvitation(id, inviteeId)`, `getInvitationsForUser(userId)` |
| `profiles.ts` | Supabase | `getProfile(userId)`, `updateProfile(userId, data)`, `fetchChurchBranches()`, `searchRoommates(query, conferenceId, userId)` |
| `payments.ts` | Supabase | `getBookingPaymentSummary(userId)`, `getPaymentHistory(bookingId)` |

## utils/

**Pure business logic.** No side effects, no data fetching. Fully unit-tested.

| File | Purpose | Key functions |
|------|---------|---------------|
| `price.ts` | Room cost splitting | `calculatePerPersonPrice(roomPrice, maxOccupants)`, `calculateRoomAvailability(total, booked)` |
| `children.ts` | Surcharge for children 12+ | `calculateChildrenSurcharge(children, perPersonRate)` |
| `gender-validation.ts` | Room sharing rules | `validateGenderSharing(inviterGender, inviteeGender, relationship)` |
| `search-privacy.ts` | Search result filtering | `detectSearchType(query)`, `applyPrivacyFilter(results, searchType)` |
| `avatar.ts` | DiceBear avatar generation | `getAvatarUrl(seed)` - returns data URI |

## validations/

**Zod schemas** for form and API input validation. Each has a co-located `.test.ts` file.

| File | Validates |
|------|-----------|
| `auth.ts` | Registration fields (name, email, phone, gender, age, branch) |
| `booking.ts` | Check-in/check-out dates (within conference window, 24h early arrival) |
| `children.ts` | Child entries (age 1-17, gender enum) |
| `payment.ts` | Payment amounts ($25 min, remaining balance max) |

## supabase/

| File | Purpose |
|------|---------|
| `server.ts` | Creates Supabase client for server components (reads cookies from next/headers) |
| `client.ts` | Creates Supabase client for browser (client components) |

## Other Files

| File | Purpose |
|------|---------|
| `strapi.ts` | Generic Strapi REST client (`strapiGet<T>(path, params)`) |
| `constants/index.ts` | App-wide constants (min payment, urgency hours, etc.) |
| `heroui-theme.ts` | HeroUI theme customization (minimal usage) |
