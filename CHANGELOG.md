# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

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
