# Versioning workflow

## Save a working version

From the project root:

```bash
VERSION="v00X-short-label"
cp -R current "versions/$VERSION"
```

Then add a row to the Version Index in `README.md`.

## Restore a previous version

```bash
# optional safety snapshot of current first
cp -R current "versions/v00X-before-restore"

# restore
rm -rf current
cp -R "versions/v00X-short-label" current
```

## Naming convention

Use:

```text
vNNN-short-label
```

Examples:

- `v001-baseline`
- `v002-draft-preview-send`
- `v003-next-iteration`
