# Contributing to xor

Thanks for taking the time to contribute. This file explains how to get the project running locally, the preferred workflow for changes, and what to include in pull requests.

## Quick start

Requirements

- Node.js
- pnpm (or another package manager, but commands below use `pnpm`)

Clone and install:

```bash
git clone https://github.com/sql-hkr/xor.git
cd xor
pnpm install
```

Available scripts (from package.json)

- `pnpm dev` — start Next.js dev server
- `pnpm build` — build the production site
- `pnpm export` — export a static site
- `pnpm start` — start production server
- `pnpm lint` — run ESLint
- `pnpm deploy` — build and export

Run locally:

```bash
pnpm dev
# visit http://localhost:3000
```

## Branching & workflow

- This repository's default branch is `main`.
- Create a short-lived feature branch from `main`:

```bash
git checkout main
git pull origin main
git checkout -b feat/short-description
```

- Keep changes small and focused. One feature or fix per pull request.

## Pull request guidelines

- Open PRs against `main`.
- Use a descriptive title and explain the motivation, what changed, and any trade-offs.
- Include screenshots or recordings for UI changes.
- Link related issues using `#<issue-number>`.

PR checklist

- [ ] Based on `main` and up to date
- [ ] Linted: `pnpm lint`

## Code style & linting

- This is a Next.js + TypeScript project. Use idiomatic React/Next patterns.
- Run ESLint before opening a PR:

```bash
pnpm lint
```

- Configure your editor to use the project's TypeScript and ESLint settings for best results.

## Commit messages

Use a short conventional style to make changelogs readable. Example:

```
type(scope): short description

More details if necessary.
```

Common types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`.

## Issues

- Provide a minimal reproduction, expected vs actual behavior, environment (OS/browser/Node), and steps to reproduce.

## Security

If you discover a security vulnerability, please contact the repository owner privately rather than opening a public issue.

## Need help?

- Open an issue with the `question` label and include environment details and any relevant logs.

---

Thanks — your contributions help make xor better!
