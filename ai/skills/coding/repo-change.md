# Repository change skill

## Purpose

Make a small, reviewable repository change.

## Procedure

1. Inspect the current file layout.
2. Reuse existing naming and formatting patterns.
3. Make the smallest useful change.
4. Run a whitespace/diff check.
5. Scan for accidental secrets before commit.
6. Provide commit commands.

## Validation

```bash
git --no-pager diff --check
git status --short --ignored
```

## Notes

Do not commit private inventory, kubeconfigs, API keys, passwords, backup
archives, or local recovery material.
