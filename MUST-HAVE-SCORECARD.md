# Must-have completion scorecard

Reference for July 15 must-haves from `Invoicing Product Flows.xlsx` vs the current UX prototype (`current/` on `mvp-ux`).

**Last updated:** 2026-07-22  
**Scope of ratings:** Prototype completeness / demo confidence — **not** production backend readiness.

### Rating scale

| Stars | Meaning |
|---|---|
| ★★★★★ | Story is walkable in UI with solid acceptance-criteria coverage |
| ★★★★☆ | Mostly done; small polish or demo-persistence gaps |
| ★★★☆☆ | Core UI present; important AC pieces thin or demo-only |
| ★★☆☆☆ | Partial stub; not demo-ready as a full story |
| ★☆☆☆☆ | Missing or barely started |

---

## Scorecard by user story

| Story | Stars | Notes |
|---|---|---|
| **US0** Onboarding | ★★★★☆ | Wizard covers CRA name, payments, tax, numbering, branding; some AC polish gaps |
| **US1.1** Customer fields | ★★★★★ | Legal name, addresses, tags, notes, CAD lock, cascading defaults |
| **US1.2** Create-customer nav | ★★★★★ | Onboarding, directory, Bill To |
| **US1.3** Customer ledger | ★★★★☆ | Outstanding / Lifetime paid / Overdue + Quotes / Invoices / Notes tabs; demo numbers |
| **US1.4** Lifecycle locks | ★★★★★ | Delete/archive rules by engagement |
| **US1.5** Archived directory | ★★★★★ | Active/Archived + view-only |
| **US2.1** Quote builder | ★★★★☆ | Single-payment builder solid; not every AC field verified |
| **US2.2** Quote creation nav | ★★★★☆ | Profile + `/quotes` + `/quote`; TopNav includes Quotes |
| **US2.3** Quote lifecycle | ★★★★☆ | Status screens + action matrix; demo navigation, not real persistence |
| **US2.4** Client accept portal | ★☆☆☆☆ | Owner “Record Decision” only — no public client portal |
| **US2.5** Visual quote output | ★★★☆☆ | Layout via shared card; PDF is demo modal |
| **US2.6** Manual reject | ★★★★☆ | Owner reject flow works (demo) |
| **US2.7** Quote directory | ★★★★☆ | `/quotes` list with search/filter (demo data) |
| **US2.8** Quote helpers | ★★★☆☆ | Copy link, download, send/resend exist; mostly demo toasts |
| **US2.9** Post-accept → invoice | ★★★★☆ | Accept prefills draft + reference #; not a full persisted pipeline |
| **US4.1** Invoice builder | ★★★★☆ | Required inputs + payment options + automations block |
| **US4.2** Activity / audit log | ★★☆☆☆ | Timeline UI with static demo events |
| **US4.5** Receipts | ★☆☆☆☆ | Toggles only — no send/auto-delivery |
| **US4.6** Void / uncollectible / locks | ★★★★☆ | Action matrix + status screens (demo) |
| **US4.7** Uncollectible notifications | ★☆☆☆☆ | Mark uncollectible only — no notify |
| **US4.11** Payment logging / settlement | ★★★★☆ | Record payment + partial + void remainder (demo routing) |
| **US4.15** Visual invoice (CSBFL) | ★★★☆☆ | Strong CRA-oriented layout; not a verified compliance checklist |
| **US4.16** Partially Paid status | ★★★★☆ | Status, page, directory row, re-record payment |
| **US4.18** EFT reconciliation | ★☆☆☆☆ | Payment method only |
| **US5.2** Manual reminders | ★★★★☆ | Send Reminder action + confirm (demo send) |
| **US6.1** Org settings | ★★★★★ | Tax, payments, cascading defaults aligned |
| **US6.3** When-to-send notification | ★☆☆☆☆ | Issue-date presets only — no scheduled notify |
| **US7.1** Unsaved nav warning | ★★☆☆☆ | Dirty discard on org settings; not quote/invoice/customer |
| **US8.1** Default invoice template | ★★★★☆ | Template picker + localStorage default |

---

## By epic (average)

| Epic | Avg | Verdict |
|---|---|---|
| **0 Onboarding** | ★★★★☆ | Strong |
| **1 Customers** | ★★★★★ | Strongest area |
| **2 Quotes** | ★★★☆☆ | Builders/dirs good; **client portal** is the hole |
| **4 Invoices** | ★★★☆☆ | Builder + partial pay up; **receipts / EFT / notify** weak |
| **5 Outreach** | ★★★★☆ | Manual reminder in; auto still nice-to-have |
| **6 Settings** | ★★★☆☆ | Org settings strong; when-to-send notify missing |
| **7 Guardrails** | ★★☆☆☆ | Thin |
| **8 Templates** | ★★★★☆ | Default template OK |

---

## Plan order (raise the low stars)

### 1. ★★ or less — next if demos need them

- **US2.4** Client accept portal (highest product gap)
- **US4.5** Receipt send (even demo)
- **US4.7** Uncollectible notify stub
- **US6.3** When-to-send due queue/banner
- **US7.1** Unsaved warnings on quote/invoice/customer
- **US4.18** EFT recon — keep last / cut if needed

### 2. ★★★ — polish when walking the happy path

- **US2.5 / 2.8** Realer PDF + send UX
- **US4.2** Activity entries when paying / reminding / accepting
- **US4.15** CSBFL checklist pass

### 3. ★★★★+ — maintain; don’t reopen unless bugs

- Customers, org settings, builders, directories, partial pay, reminders

---

## Bottom line

Customer + org + builders are in good shape. Biggest must-have confidence gaps:

1. Client quote acceptance portal (**US2.4**)
2. Receipts (**US4.5**)
3. When-to-send notification (**US6.3**)
4. EFT reconciliation (**US4.18**)

---

## Related sources

- Spreadsheet: `Invoicing Product Flows.xlsx` → sheets **Must have user stories**, **Scope Update Overview July 15**
- Remaining work + UX/UI map: [`MUST-HAVE-REMAINING-UX.md`](./MUST-HAVE-REMAINING-UX.md)
- Older prototype notes: [`STATUS.md`](./STATUS.md) (may be stale vs this scorecard)
- Working app: `current/`
