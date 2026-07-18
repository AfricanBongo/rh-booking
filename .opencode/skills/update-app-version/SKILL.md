---
name: update-app-version
description: Use when asked to do commits and update app version, release a version, tag the app, or bump the version after committing changes.
---

# Update App Version

## Overview

After all commits are done, bump the app version using `commit-and-tag-version`. This tool reads `package.json`, determines the next SemVer based on conventional commits since the last tag, updates `package.json` + `CHANGELOG.md`, creates a version commit, and creates an annotated git tag.

**Always show the current version before and the new version after.**

---

## Trigger phrases

Use this skill when the user says anything like:
- "do commits and update app version"
- "commit and release"
- "tag the release"
- "bump the version"
- "cut a release"
- "release after commits"

---

## Version bump rules

| Commit type(s) since last tag | Auto bump |
|---|---|
| `fix`, `perf`, `refactor`, `docs`, `chore` only | `PATCH` |
| At least one `feat` | `MINOR` |
| Any commit with `BREAKING CHANGE:` footer | `MINOR` (pre-1.0) / `MAJOR` (1.0+) |

**Major releases are NEVER automatic.** Only bump major when the user explicitly says "major release" or "bump major".

---

## Workflow

### Step 1 - Confirm all commits are done

Do not run the version step until all intended commits for this session are complete. If there are uncommitted changes, commit them first following the Conventional Commits format.

### Step 2 - Read current version

```bash
npm pkg get version
```

Show the user: **Current version: `vX.Y.Z`**

### Step 3 - Preview what the bump will be (dry run)

```bash
npm run release:dry
```

This shows what version will be created and what will go in the changelog - without making any changes. Show the output to the user so they can confirm before proceeding.

### Step 4 - Run the version bump

**Automatic (let commits decide):**
```bash
npm run release
```

**Force a specific level:**
```bash
npm run release:patch    # x.y.Z
npm run release:minor    # x.Y.0
npm run release:major    # X.0.0  - only on explicit user request
```

**Pre-release (alpha/beta/rc):**
```bash
npm run release:alpha    # x.y.z-alpha.N
npm run release:beta     # x.y.z-beta.N
npm run release:prerelease  # x.y.z-N
```

This will:
1. Bump `version` in `package.json`
2. Update / create `CHANGELOG.md`
3. Create a commit: `chore(release): vX.Y.Z`
4. Create an annotated git tag: `vX.Y.Z`

### Step 5 - Read new version and report

```bash
npm pkg get version
```

Show the user:

```
Version updated:
  Before: v0.4.0
  After:  v0.5.0

Tag created: v0.5.0
Run `git push --follow-tags` to push the tag to remote.
```

### Step 6 - Remind about pushing

Do NOT push automatically. Always remind the user:

```bash
git push --follow-tags
```

This pushes both the commits and the tag in one command.

---

## Decision tree

```
User says "commit and update version"
|
+-- Uncommitted changes? -> commit them first (conventional commits)
|
+-- User says "major release" or "bump major"?
|   +-- YES -> npm run release:major
|
+-- User says "alpha", "beta", or "prerelease"?
|   +-- alpha -> npm run release:alpha
|   +-- beta  -> npm run release:beta
|   +-- other -> npm run release:prerelease
|
+-- Default -> npm run release  (auto-detects PATCH or MINOR from commits)
```

---

## Project context

- Repository: `AfricanBongo/rh-booking`
- Stack: Next.js 16 + React 19 + TypeScript + Supabase + Stripe
- CHANGELOG link format: `https://github.com/AfricanBongo/rh-booking/compare/vOLD...vNEW`
- Commit link format: `https://github.com/AfricanBongo/rh-booking/commit/HASH`

---

## Common mistakes

| Mistake | Fix |
|---|---|
| Running release before all commits are done | Commit everything first, then release |
| Bumping major automatically | Major is ONLY on explicit user request |
| Forgetting to push tags | Always remind: `git push --follow-tags` |
| Running release with no new commits since last tag | Skip - nothing to release |
| Editing CHANGELOG.md manually | Never - let the tool manage it |
