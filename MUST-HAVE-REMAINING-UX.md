# Must-have remaining work & UX/UI map

Companion to [`MUST-HAVE-SCORECARD.md`](./MUST-HAVE-SCORECARD.md).  
Source: **Must have user stories** tab in `Invoicing Product Flows.xlsx`.  
**Last updated:** 2026-07-22

Ratings and epic averages live in the scorecard. This doc lists **what still needs to be done** and the **UX/UI pages and flows** those items imply.

---

## Still need to do (clear gaps)

| Story | What’s missing |
|---|---|
| **US2.4** Client accept portal | Public secure quote URL, Accept & Sign modal (name/email/attestation), Decline with reason, status + invoice generation from client side |
| **US2.5** Visual quote (+ ties to 2.4) | Full branded quote layout AC; client accept UI; real PDF (not demo modal) |
| **US2.6** Manual reject | Rejection **reason** required in modal; public link stays viewable but actions hidden (“You have rejected…”) |
| **US2.8** Quote helpers | Real PDF; **Send Test** with TEST watermark; **Log inbound/outbound outreach** modals → timeline |
| **US2.9** Post-accept invoice | Full field carriage (line items, tax, discount, shipping); duplicate-generation guard; issue-date mapping from quote trigger |
| **US4.2** Invoice activity feed | Real immutable logs (create/send/view/pay/receipt); **Log outreach** buttons |
| **US4.5** Receipts | Auto-send on Paid when toggle on; receipt document; **Send/Resend Receipt** on paid/partial |
| **US4.7** Uncollectible notify | Auto 90-day flag; dashboard banner; detail CTA when overdue 90+ |
| **US4.18** EFT reconciliation | Unique ref on EFT; payments page guidance; match deposit API → confirm mark paid/partial |
| **US5.2** Manual reminder | Also on **quotes** (Sent/Viewed); show client email in toast; 10s throttle; timeline log |
| **US6.3** When-to-send notify | Daily check; in-app + email; Send now / Snooze / Dismiss |
| **US7.1** Unsaved navigation | Dirty-state warn on customer / quote / invoice (not only org settings) |

## Partial — finish AC gaps

| Story | Still to do |
|---|---|
| **US0** Onboarding | Meganne marked `x`; remaining polish: banking-prefilled legal name, logo upload validation, full payment-terms radios, start-number step |
| **US1.1** Customer fields | Contact checkbox UX vs AC (“Contact information is different…”); shipping clone; full preference cascade |
| **US1.3** Ledger | Notes as auto-saving scratchpad; contact name prominence when different |
| **US2.1 / US4.1** Builders | Email in customer dropdown; Edit Customer Profile link; date guardrails; when-to-send exactness |
| **US2.3** Quote lifecycle | Accepted status surface; auto-expire; dashboard metrics; stricter edit locks |
| **US2.7** Quote directory | Color status badges; multi-select status filter |
| **US4.6** Immutability | Align matrix to AC; padlock after send; void rebuild flow |
| **US4.11** Record payment | Payment date picker; Interac/EFT labels; timeline logs |
| **US4.15** Visual invoice | CSBFL: logo/brand, Sold-To/Ship-To, GST# under tax, payment footer |
| **US4.16** Partially Paid | Exists for manual partial; parent/child language is out of single-payment MVP |
| **US6.1** Org settings | Permissions/sub-users, reply-to, bank disconnect safety |
| **US8.1** Default template | Org default control; banner on create; deletion protection |

## Done enough (this tab)

- **US1.2** Create-customer nav  
- **US1.4** Lifecycle locks  
- **US1.5** Archived directory  
- **US2.2** Quote creation nav  
- Core **US6.1** business/tax/payment/defaults (permissions aside)

## Priority order

1. **US2.4 + US2.5** — Client quote portal + visual accept/decline  
2. **US4.5** — Receipts (auto + manual)  
3. **US4.2 + outreach logging** — Real activity (also **US2.8 / US5.2**)  
4. **US6.3** — When-to-send notifications  
5. **US7.1** — Unsaved-change guards  
6. **US2.9** — Harden quote→invoice mapping  
7. **US4.7** — 90-day uncollectible prompts  
8. **US4.18** — EFT recon (last / cut if needed)  
9. Builder/directory polish (**US2.1, 2.3, 2.7, 4.1, 4.11, 4.15, 8.1**)

---

## UX / UI flows and pages these imply

### New or public pages

| Page / surface | Stories | What the user does |
|---|---|---|
| **Client quote review** `/quote/review?token=…` | US2.4, US2.5 | See branded quote; Accept & Sign or Decline |
| **Accept & Sign modal** | US2.4 | Name, email, legal checkbox → Sign & Accept |
| **Decline modal** | US2.4 | Reason (+ optional comments) → Confirm Decline |
| **Post-accept confirmation** (client) | US2.4 | “Quote accepted”; no more action buttons |
| **Post-decline confirmation** (client) | US2.4, US2.6 | Static “You have rejected this quotation” |
| **Payment receipt** (email/PDF or preview) | US4.5 | Parties, GST#, lines, proportional tax, method, date |
| **Dashboard alerts** | US6.3, US4.7 | Due-to-send + aging / uncollectible banners |
| **Payments / EFT match review** | US4.18 | Match deposits → confirm paid/partial |

### Existing pages that need new flows / UI

**Quotes**

| Surface | Flows to add |
|---|---|
| **Quote directory** `/quotes` | Color badges; multi-status filter |
| **Sent / Viewed quote** | Send Reminder; Log outreach; Mark Rejected with reason; Copy portal link; Send Test |
| **Accepted quote** (owner) | Read-only; link to generated draft invoice |
| **Owner Record Decision** | Align with portal; rejection reason |
| **Quote PDF** | Print-ready layout |

**Invoices**

| Surface | Flows to add |
|---|---|
| **Draft invoice** (from quote) | Full carriage; Default Template banner |
| **Sent / Viewed / Overdue / Partially Paid** | Reminder + throttle; Log outreach; Send Receipt; richer Record Payment; live Activity |
| **Overdue 90+** | Inline “write off?” → Mark Uncollectible |
| **Paid / Partially Paid** | Send Receipt; payment/receipt activity lines |
| **Invoice PDF / visual** | CSBFL layout pass |

**Org / system**

| Surface | Flows to add |
|---|---|
| **Org → Templates** | Default template / None; deletion protection |
| **Org → Payments** | Block bank disconnect if in use |
| **When-to-send notification** | Send now / Snooze / Keep as draft |

**Cross-cutting**

| Pattern | Where |
|---|---|
| Unsaved changes dialog | Customer, quote builder, invoice builder |
| Activity timeline | Quote + invoice detail |
| Toast + 10s disable | After Send Reminder |

### End-to-end flows

1. **Client accept quote** — Send → client link → Accept & Sign → draft invoice → owner sees Accepted + draft link  
2. **Client decline / owner offline reject** — Decline or Mark Rejected (+ reason) → Rejected → portal read-only  
3. **Quote → invoice** — Accept → draft with full mapped fields → review → send  
4. **Collect payment** — Record Payment → Paid or Partially Paid (± forgive remainder) → timeline ± receipt  
5. **Chase** — Send Reminder; optional Log outreach  
6. **Schedule send** — Future When-to-send → morning notify → Send / Snooze / Dismiss  
7. **Bad debt** — 90+ days → banner + detail CTA → Uncollectible  
8. **EFT** — Unique ref on invoice → Payments match → confirm Paid/Partial  

### Rough page inventory

| Kind | Approx. |
|---|---|
| **New primary pages** | Client quote portal (+ states), Dashboard alerts, Payments match, Receipt preview |
| **Heavy upgrades** | Sent quote/invoice detail, Record Payment, Activity, Org templates/payments, Visual PDF |
| **Light upgrades** | Directories, builders, unsaved-nav |

**Highest UI surface area:** client quote portal (US2.4/2.5) → invoice detail + receipts/activity (US4.2/4.5/4.11) → dashboard notifications (US6.3/4.7).

---

## Prototype permutation map (Quick Links)

Owner-facing and client stub routes (see `current/src/components/invoice/QuickLinks.tsx`):

| Kind | Routes |
|---|---|
| Directories | `/quotes`, `/invoices` |
| Quote (owner) | `/quote` → `/quote/preview` → `/quote/sent` → viewed / **accepted** / rejected / expired / void → `/?from=quote` |
| Client portal (stubs) | `/quote/review` → `/quote/review/accepted` · `/quote/review/declined` |
| Invoice | `/` → `/preview` → `/sent` → viewed / paid / **partially-paid** / overdue / overdue-90 / void / uncollectible |

---

## Related

- [`MUST-HAVE-SCORECARD.md`](./MUST-HAVE-SCORECARD.md) — star ratings  
- Spreadsheet: Must have user stories + Scope Update Overview July 15  
- App: `current/` on branch `mvp-ux`
