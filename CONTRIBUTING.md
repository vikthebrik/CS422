# Contributing to MCC Calendar Hub

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository and clone your fork.
2. Run `./setup.sh` (or `bash setup.sh`) to install dependencies and create `.env` files from the examples. Then fill in the required values as directed by the script.
3. Create a branch from `main` using the format `type/short-description`:
   - `fix/event-sync-crash`
   - `feat/rsvp-export`
   - `docs/setup-guide`

## Making Changes

- Keep PRs focused — one logical change per PR.
- Run `tsc --noEmit` in `server/` before opening a PR.
- Run `pnpm build` in `frontend/` before opening a PR.
- Do not commit `.env` files or secrets of any kind.

## Opening a Pull Request

- Use the PR template that auto-fills when you open a PR.
- Link any related issue with `Closes #123`.
- Wait for CI to pass before requesting review.

## Reporting Bugs

Open an issue using the **Bug Report** template. Include steps to reproduce,
expected behavior, and your Node/pnpm version.

## Requesting Features

Open an issue using the **Feature Request** template. Describe the problem
you're trying to solve and your proposed solution.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
By participating you agree to abide by its terms.
