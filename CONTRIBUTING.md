# Contributing

This repository is primarily maintained as a personal infrastructure project,
but the same review discipline applies whether a change has one author or many.

## Workflow

1. Create a short-lived branch from `main`, such as `feature/monitoring` or
   `fix/backup-retention`.
2. Keep configuration, documentation, and recovery instructions in sync.
3. Run `make validate` before opening a pull request.
4. Describe the change, its risk, validation, and rollback plan.
5. Merge only when the desired state is safe for `main` to reconcile.

## Commits

Use an imperative summary of no more than 72 characters. Prefixes such as
`docs:`, `feat:`, `fix:`, `chore:`, and `refactor:` are encouraged.

Examples:

- `docs: record the k3s architecture decision`
- `feat: add Homepage deployment manifests`
- `fix: correct Longhorn backup schedule`

## Architecture decisions

Create or update an ADR when a change introduces a significant technology,
security boundary, data-storage approach, or operating model. Accepted ADRs are
immutable; supersede an old decision with a new ADR instead of rewriting history.

## Releases

1. Move relevant entries from `Unreleased` in `CHANGELOG.md` into a dated version.
2. Update `VERSION` using semantic versioning.
3. Update any version shown in documentation.
4. Merge the release pull request to `main`.
5. Tag the commit as `vX.Y.Z` and create release notes from the changelog.
