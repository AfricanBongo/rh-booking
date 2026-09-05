# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.6.12](https://github.com/AfricanBongo/rh-booking/compare/v0.6.11...v0.6.12) (2026-09-05)


### Features

* **api:** include dining pass in booking creation and pricing ([755dcf8](https://github.com/AfricanBongo/rh-booking/commit/755dcf8538ba61b4014fc8ab226f6d0c1bfb6b89))
* **api:** update booking children insert for guest schema (no gender) ([2c09e4e](https://github.com/AfricanBongo/rh-booking/commit/2c09e4e3a16f507ad76a4b27b786dbcc922e22c2))
* **booking:** add Dining Pass selection step ([cae4618](https://github.com/AfricanBongo/rh-booking/commit/cae46181672666f6bff71ed7be55246569536af4))
* **booking:** integrate dining step into booking flow navigation ([0317c98](https://github.com/AfricanBongo/rh-booking/commit/0317c9859d5e33fc3a3cf310a2f730bcc44a83bd))
* **cms:** connect landing page to Strapi Main Page (hero + FAQ) ([49a5dfd](https://github.com/AfricanBongo/rh-booking/commit/49a5dfda331be031dd03ce4fca98619c04e05019))
* **data:** add dining pass data layer ([69e6e85](https://github.com/AfricanBongo/rh-booking/commit/69e6e850ecbf495ffd619cd8cd81455aeec3b879))
* **data:** add main page data layer for hero and FAQ ([7fc7424](https://github.com/AfricanBongo/rh-booking/commit/7fc7424503e9dacd7bbf88b467560cbed7aaa9ec))
* **data:** add portrait image and gallery images to Conference ([06e9c0f](https://github.com/AfricanBongo/rh-booking/commit/06e9c0fad0d76d37baeb7e6fc6feb34c10d23189))
* **db:** add booking_dining_passes table with RLS ([773ea4a](https://github.com/AfricanBongo/rh-booking/commit/773ea4ab7e0905c25ee81fd8a9bbc3ef29425f68))
* **db:** add get_booking_payment_history RPC ([e3b8f8f](https://github.com/AfricanBongo/rh-booking/commit/e3b8f8fb132f6ab8cc4fe114c3600efbdf0773a9))
* **db:** enable Supabase Realtime on bookings table ([a96b91c](https://github.com/AfricanBongo/rh-booking/commit/a96b91cfa14f664a923f56b3e58d54d9275b6259))
* **db:** make children.gender nullable, add dining_pass_id column ([f625ced](https://github.com/AfricanBongo/rh-booking/commit/f625ceda8d20568e0d05bc308d9ef6e0ae4afb89))
* **guests:** update validation schema for additional guests ([73afe12](https://github.com/AfricanBongo/rh-booking/commit/73afe128ef440fb1cbefae469af493f565799cb7))
* **payments:** send email to user when cash invoice is marked as paid ([982e53d](https://github.com/AfricanBongo/rh-booking/commit/982e53dfa49c9227eeabe32e47f5d3d173559b64))
* **payments:** show payment history on pay page ([9e97955](https://github.com/AfricanBongo/rh-booking/commit/9e97955b4587e4677da887da10e9b1229699d292))
* **realtime:** add usePaymentUpdates hook for live payment updates ([46c94d9](https://github.com/AfricanBongo/rh-booking/commit/46c94d94c6033dc0f897e94c7890026f1b31ca61))
* **realtime:** live payment updates on pay page ([28d5e94](https://github.com/AfricanBongo/rh-booking/commit/28d5e9439e7d68084c8bba643d056e19a7b1941b))
* **strapi:** add dining pass + main page dev seed data ([984c77f](https://github.com/AfricanBongo/rh-booking/commit/984c77f093fa8303ac52da175ce58c7a66b2463c))
* **strapi:** add Dining Pass collection with conference relation ([8e0d5b9](https://github.com/AfricanBongo/rh-booking/commit/8e0d5b9da8ac5dc3593a22d88f7c6c107a650b3a))
* **strapi:** add Main Page single type with hero and FAQ ([2c9d6c5](https://github.com/AfricanBongo/rh-booking/commit/2c9d6c53d17d085eb2d3467179377e0a78e3ce80))
* **strapi:** add portrait_image and other_images to Conference ([1f88f2e](https://github.com/AfricanBongo/rh-booking/commit/1f88f2e1f597bc5ef37845451e7aacc6652308ae))
* **tests:** add comprehensive test coverage framework (+50 tests, 113 total) ([4c5d7b5](https://github.com/AfricanBongo/rh-booking/commit/4c5d7b5e4ebea01525932264dc08914d03bad7f4))
* **ui:** rename children to additional guests, remove gender selector ([fd9b209](https://github.com/AfricanBongo/rh-booking/commit/fd9b209dd4484ceb147dfe07d1b58366823af602))
* **ui:** responsive hero images and event gallery carousel ([6463995](https://github.com/AfricanBongo/rh-booking/commit/6463995c4ab38233858ffb1a00b02b2d38021a1a))
* **ui:** show dining pass in booking confirmation breakdown ([5411f62](https://github.com/AfricanBongo/rh-booking/commit/5411f627ce337827b5b90f40f01d5abc3219e88f))


### Bug Fixes

* **booking:** correct step navigation and room type detection in dining and roommate steps ([ba50b5b](https://github.com/AfricanBongo/rh-booking/commit/ba50b5b98c34acc622219c9fa77e3c32ebde073c))
* **children:** allow age 0-99, remove max 17 cap ([82a9319](https://github.com/AfricanBongo/rh-booking/commit/82a9319f36bb44bb5a9df575c230768edc1f0abf))
* **payments:** use correct env var name for Supabase key in usePaymentUpdates ([796b6bc](https://github.com/AfricanBongo/rh-booking/commit/796b6bc6fcc3642611b2ebc61515450e086684c7))
* **price:** room price is per-person, remove division logic ([8d7a93e](https://github.com/AfricanBongo/rh-booking/commit/8d7a93e35def47c9e7c00f4f67956faf700ea18a))
* **ui:** rename remaining Children labels to Guests ([1eae440](https://github.com/AfricanBongo/rh-booking/commit/1eae4407f23480c8b779536dc6214df02cd58bf2))

## [0.6.11](https://github.com/AfricanBongo/rh-booking/compare/v0.6.10...v0.6.11) (2026-09-03)


### Bug Fixes

* **strapi:** allow R2 media domains in CSP for admin panel thumbnails ([f9012ab](https://github.com/AfricanBongo/rh-booking/commit/f9012ab0605b3935c470a0a9c8888ee2514739f9))

## [0.6.10](https://github.com/AfricanBongo/rh-booking/compare/v0.6.9...v0.6.10) (2026-09-03)


### Bug Fixes

* **strapi:** remove config/src volume mounts so git-managed files are used ([f110beb](https://github.com/AfricanBongo/rh-booking/commit/f110beb69076e3c1dbcc1de8b77d922c9359730a))

## [0.6.9](https://github.com/AfricanBongo/rh-booking/compare/v0.6.8...v0.6.9) (2026-09-03)


### Bug Fixes

* **strapi:** remove forcePathStyle and set ACL to undefined for R2 compatibility ([34b36e9](https://github.com/AfricanBongo/rh-booking/commit/34b36e946cf4445fa8d6d9d2721d29a9cb7886a1))

## [0.6.8](https://github.com/AfricanBongo/rh-booking/compare/v0.6.7...v0.6.8) (2026-09-02)


### Bug Fixes

* **strapi:** fix R2 provider config format, add R2 to staging environment ([886e0f5](https://github.com/AfricanBongo/rh-booking/commit/886e0f55c7dc5d6911f0c8838e2705356e73f9aa))

## [0.6.7](https://github.com/AfricanBongo/rh-booking/compare/v0.6.6...v0.6.7) (2026-09-02)


### Bug Fixes

* **strapi:** wrap R2 credentials in s3Options to fix deprecated provider config ([43bde50](https://github.com/AfricanBongo/rh-booking/commit/43bde502e96d028817d8d2f3cdb5e7f08c22539d))

## [0.6.6](https://github.com/AfricanBongo/rh-booking/compare/v0.6.5...v0.6.6) (2026-09-02)


### Bug Fixes

* **strapi:** add sharp for image processing (required for upload plugin) ([5d2d141](https://github.com/AfricanBongo/rh-booking/commit/5d2d14139cf20de210c993d38b6a6c14e1d56343))

## [0.6.5](https://github.com/AfricanBongo/rh-booking/compare/v0.6.4...v0.6.5) (2026-09-02)

## [0.6.4](https://github.com/AfricanBongo/rh-booking/compare/v0.6.3...v0.6.4) (2026-09-02)


### Bug Fixes

* **build:** exclude strapi/ from root tsconfig, remove invalid viewTransition experimental key ([22bdcf8](https://github.com/AfricanBongo/rh-booking/commit/22bdcf801255f676bbc400215bdd23792c3f8a1a))

## [0.6.3](https://github.com/AfricanBongo/rh-booking/compare/v0.6.2...v0.6.3) (2026-09-02)


### Bug Fixes

* **strapi:** use plain env vars for salts -- Coolify does not auto-generate SERVICE_BASE64_64_* custom suffixes ([2505717](https://github.com/AfricanBongo/rh-booking/commit/250571713265828ac16432964300b5c1a5d784f8))

## [0.6.2](https://github.com/AfricanBongo/rh-booking/compare/v0.6.1...v0.6.2) (2026-09-01)

## [0.6.1](https://github.com/AfricanBongo/rh-booking/compare/v0.5.14...v0.6.1) (2026-09-01)

## [0.5.14](https://github.com/AfricanBongo/rh-booking/compare/v0.5.13...v0.5.14) (2026-09-01)


### Features

* **supabase:** update config with remotes ids ([2d19c3f](https://github.com/AfricanBongo/rh-booking/commit/2d19c3f4e5f07ce0a2e1d0a445cf3a9d32576f76))

## [0.5.13](https://github.com/AfricanBongo/rh-booking/compare/v0.5.12...v0.5.13) (2026-09-01)


### Features

* **strapi:** add content type schemas and dev seed data from production ([ef27294](https://github.com/AfricanBongo/rh-booking/commit/ef2729443b574adb47be85f24be43f1c55eaff3c))

## [0.5.12](https://github.com/AfricanBongo/rh-booking/compare/v0.6.0...v0.5.12) (2026-08-28)


### Bug Fixes

* **deps:** pin @opennextjs/cloudflare to 1.20.1 for Next.js 16.2.x compat ([ad8c673](https://github.com/AfricanBongo/rh-booking/commit/ad8c67332dff7f29d26efb9828397df6ea6ffc18))

## [0.5.11](https://github.com/AfricanBongo/rh-booking/compare/v0.5.10...v0.5.11) (2026-08-27)


### Features

* **db:** add trigger for stripe invoice paid events ([ffa4656](https://github.com/AfricanBongo/rh-booking/commit/ffa4656948d363cf6e5b3654a6b716e11c2a3da1))
* **db:** void open cash invoices when booking paid in full via checkout ([32a01ba](https://github.com/AfricanBongo/rh-booking/commit/32a01ba3ca10b237a1943e1048f9f90bda9a8dd3))
* **payments:** add cash invoice creation handler to stripe-checkout edge function ([c551c65](https://github.com/AfricanBongo/rh-booking/commit/c551c65676ea014aeb01ee64cc4974d018c8a56a))
* **ui:** add pay with cash button to merch purchase form ([8897cac](https://github.com/AfricanBongo/rh-booking/commit/8897cacccfcea1dcf4737f101cc51b5602729d99))
* **ui:** add pay with cash button to room payment card ([0c6887a](https://github.com/AfricanBongo/rh-booking/commit/0c6887a4ac0dab5b005b0c75570c3d65dada1439))


### Bug Fixes

* **db:** grant service_role access to stripe.invoices for void logic ([add555f](https://github.com/AfricanBongo/rh-booking/commit/add555f222d049be56414504776f38a266df0cbe))

## [0.5.10](https://github.com/AfricanBongo/rh-booking/compare/v0.5.9...v0.5.10) (2026-08-26)


### Bug Fixes

* **db:** grant service_role privileges on bookings, profiles, merch_orders ([fcaf804](https://github.com/AfricanBongo/rh-booking/commit/fcaf8047ebeab0259299e2cd0e99e4b72b5fd418))

## [0.5.9](https://github.com/AfricanBongo/rh-booking/compare/v0.5.8...v0.5.9) (2026-07-28)


### Bug Fixes

* **deploy:** add __name polyfill for Cloudflare Workers bundling issue ([67b3943](https://github.com/AfricanBongo/rh-booking/commit/67b3943d9582e871b892674333a797f5d43a08bc))

## [0.5.8](https://github.com/AfricanBongo/rh-booking/compare/v0.5.7...v0.5.8) (2026-07-28)

## [0.5.7](https://github.com/AfricanBongo/rh-booking/compare/v0.5.6...v0.5.7) (2026-07-28)

## [0.5.6](https://github.com/AfricanBongo/rh-booking/compare/v0.5.5...v0.5.6) (2026-07-28)


### Features

* **booking:** fixed check-in/out from conference, remove pay-later, rename to Royalhouse ([7d89b4b](https://github.com/AfricanBongo/rh-booking/commit/7d89b4b7e39b3cf9bad0220614d0ce7dbeecbcd0))

## [0.5.5](https://github.com/AfricanBongo/rh-booking/compare/v0.5.4...v0.5.5) (2026-07-18)

## [0.5.4](https://github.com/AfricanBongo/rh-booking/compare/v0.5.3...v0.5.4) (2026-07-18)


### Bug Fixes

* **rls:** add INSERT policy on profiles for complete-profile flow ([9a5303f](https://github.com/AfricanBongo/rh-booking/commit/9a5303fc148fcb1b742d6adb0d3801988dbbf5d4))

## [0.5.3](https://github.com/AfricanBongo/rh-booking/compare/v0.5.2...v0.5.3) (2026-07-18)


### Bug Fixes

* **checkout:** derive origin from request headers instead of env var ([e6e3f51](https://github.com/AfricanBongo/rh-booking/commit/e6e3f51095d9c3f45173f7aab10f905e2920ce5a))

## [0.5.2](https://github.com/AfricanBongo/rh-booking/compare/v0.5.1...v0.5.2) (2026-07-18)


### Bug Fixes

* **test:** update phone validation tests for E.164 format ([f56542d](https://github.com/AfricanBongo/rh-booking/commit/f56542d619bc14f791dff923da8bbc278c5a5873))

## [0.5.1](https://github.com/AfricanBongo/rh-booking/compare/v0.5.0...v0.5.1) (2026-07-18)

## [0.5.0](https://github.com/AfricanBongo/rh-booking/compare/v0.4.0...v0.5.0) (2026-07-18)


### Features

* **db:** add account deletion cascade + delete_own_account RPC ([42c6519](https://github.com/AfricanBongo/rh-booking/commit/42c6519711b6c625e57a5cc7ecdae5bd7f9d391b))
