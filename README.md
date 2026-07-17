# ATB-Invoice

Parent index for working versions of the ATB Q3 Invoice build.

Use this repo as a catalog of snapshots. Each entry under `versions/` is a complete, restorable working build. The active build lives in `current/`.

## How versioning works

1. Do day-to-day work in `current/`.
2. When you want a restore point, copy `current/` into a new dated folder under `versions/`.
3. Record that snapshot in the Version Index below.
4. To roll back, replace `current/` with a chosen `versions/...` snapshot.

## Version Index

| Version | Folder | Date | Notes |
|---|---|---|---|
| v001 | `versions/v001-baseline` | 2026-07-16 | Placeholder slot before first app scaffold. |
| v002 | `versions/v002-draft-preview-send` | 2026-07-16 | Full draft editor (line items, notes, templates, details), preview, send modal (email / text / link), and sent view. Browser back works across modes for iteration. |
| v003 | `versions/v003-quote-invoice-flows` | 2026-07-17 | Quote + invoice status surfaces, send accordion with message previews, draft PDF watermark, refined More Actions, accept quote → draft invoice, Record Payment / Decision, expired quote highlighting, Save and Preview. |
| — | `current/` | 2026-07-17 | Active working copy — continue from v003. |

## Active build

- Path: `current/`
- Source of truth for the latest working UI
- Based on Figma: [ATB-Q3-Invoice](https://www.figma.com/design/b8HeibpBaWOr2m4fjhzas2/ATB-Q3-Invoice)
- Last snapshot: `versions/v003-quote-invoice-flows`
- **Progress tracker:** [`STATUS.md`](STATUS.md) — what’s done, deferred, and locked decisions

## Product scope (locked so far)

Single invoices only. Ignore parent/child invoice relationships for now.

### Modes

**Quote (before invoice)**
1. **Draft Quote** — `/quote` — editable quote (estimate number/date; no payment options)
2. **Preview Quote** — `/quote/preview` — customer preview; Send opens send options
3. **Quote Sent** — `/quote/sent` — Awaiting Decision; **Record Decision** → Accepted (creates Draft Invoice) or Rejected

**Invoice**
1. **Draft / edit** — `/` — editable invoice; Preview opens customer preview
2. **Preview** — `/preview` — read-only customer preview; Send opens send options modal; can return to draft via Edit or browser back
3. **Sent** — `/sent` — post-send view; branches to Paid (`/sent/paid`) or Overdue (`/sent/overdue`)

Prototype-only **Quick Links** (floating, bottom-left) maps the full quote → invoice flow.

### Status action matrix (single invoices)

| Status | Edit | Delete | Void | Template | Uncollectible | Duplicate |
|---|---|---|---|---|---|---|
| Drafted | yes | yes | | | | yes |
| Sent | | | yes | yes | | yes |
| Viewed | | | yes | yes | yes | yes |
| Partially Paid | | | yes | yes | yes | yes |
| Paid | | | | yes | | yes |
| Overdue (<90 days) | | | yes | yes | yes | yes |
| Overdue (>90 days) | | | | yes | yes | yes |
| Uncollectible | | | | yes | | yes |
