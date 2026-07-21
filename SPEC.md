# ATB Invoicing UX — Implementation Spec

Knowledge base for re-implementing this prototype in another codebase.  
**Prototype source:** `current/` on branch `mvp-ux`  
**Remote:** https://github.com/ATB-Ventures/atbv-invoicing-ux

This is a **UX prototype**, not production software. Prefer matching behaviour and structure over copying stack choices unless you intentionally keep Next.js.

---

## 1. Purpose & scope

### In scope (singular documents)

- Draft / preview / send flows for **one quote** and **one invoice** at a time
- Organization settings that cascade defaults to new customers
- Customer create / edit with account summary
- Payment options defined at org level, refined per customer / invoice
- Status surfaces for sent quotes and invoices (viewed, paid, overdue, void, etc.)

### Out of scope / deferred

- Real auth, multi-tenant backend, or durable DB
- Parent/child invoices, partial payments UI, live automation (reminders/receipts)
- Client acceptance portal (beyond preview pages)
- Shipping product chrome that exists only for prototyping (Quick Links, Design System panel)

### Design references

- Product: [ATB-Q3-Invoice (Figma)](https://www.figma.com/design/b8HeibpBaWOr2m4fjhzas2/ATB-Q3-Invoice)
- Library: [ATB Library (Figma)](https://www.figma.com/design/OqPEqFxVANuTJDUarkml5D/Library?node-id=1-44)

---

## 2. Repo map

| Path | Role |
|------|------|
| `current/` | **Active app** — implement against this |
| `versions/` | Frozen snapshots (`v001`…`v003`); do not treat as latest |
| `README.md` / `STATUS.md` / `VERSIONING.md` | Catalog, plan tracker, snapshot workflow |
| `SPEC.md` | This document |

Day-to-day code lives under:

```
current/src/app/           # Next App Router pages
current/src/components/invoice/  # Feature views + shared UI
current/src/lib/           # Tokens, org settings, demo data, action matrices
current/public/brand/      # ATB logo assets
```

---

## 3. Tech stack (prototype)

| Concern | Choice |
|---------|--------|
| Framework | Next.js **16.2.10** (App Router) |
| UI | React **19.2.4** + Tailwind CSS **v4** |
| Persistence | `localStorage` + in-memory demo data |
| Fonts | Inter (body) + Montserrat (display stand-in for ATB TT Norms) |

Scripts: `npm run dev` / `build` / `start` / `lint` from `current/`.

---

## 4. Routes

| Route | Intent | Primary component |
|-------|--------|-------------------|
| `/` | Draft invoice | `DraftInvoiceView` |
| `/preview` | Invoice preview + send | `PreviewInvoiceView` |
| `/sent`, `/sent/*` | Invoice lifecycle states | `SentInvoiceView` + `sentVariantMeta` |
| `/quote` | Draft quote (**no** payment options) | `DraftQuoteView` |
| `/quote/preview` | Quote preview | `PreviewQuoteView` |
| `/quote/sent` … `/quote/void` | Quote lifecycle | `SentQuoteView` / status pages |
| `/organization` | Manage organization | `OrganizationSettingsView` |
| `/customers/new` | New customer | `CustomerFormView` |
| `/customers/new?id=acme` | Edit demo customer (Acme) | same |
| `/payment-options/new` | Redirect → org payment options | stub |
| `/status` | Renders `STATUS.md` | plan tracker |

Root layout also mounts **prototype-only** chrome: `QuickLinks`, `DesignSystemPanel` (`current/src/app/layout.tsx`). Do not ship these as product UI.

---

## 5. Product flows

### 5.1 Quote → invoice

1. Draft quote (`/quote`) — line items, notes, details; **no** payment options / due date.
2. Preview → send → status surfaces (viewed, rejected, expired, void).
3. Accepting a quote creates a **draft invoice** (`/?from=quote`) where payment options and due date are set.
4. Invoice path: draft → preview → sent → paid / overdue / void / uncollectible.

**Rule:** Sent quotes remain editable in this prototype (product decision recorded in status notes).

### 5.2 Organization settings (`/organization`)

Tabs: **Business Details** | **Permissions** | **Sub Users**.

Under Business Details (white section shells):

| Section | Behaviour |
|---------|-----------|
| Business Details | Name, GST/HST, email, phone — view/edit cards |
| Business Address | Separate card from business details |
| Brand | Color + logo upload (stored as data URL); tip: applies to **new** invoices only |
| Payment Options | Enable methods, mark defaults, add via modal (see §5.4) |
| Settings | Currency, tax, quote expiry (days), payment terms |
| Default Automations | Auto-send, reminders (+ days before), receipts |

Deep links: `?tab=…`, `#organization-details`, `#default-settings`, `#payment-options`.

Permissions / Sub Users are **UI demos only** (not persisted).

### 5.3 Customer create / edit (`/customers/new`)

Aligned with Epic 1 (Customer Profile).

**New customer**

1. Page loads with a **blocking modal**: Business Details fields.
2. **Customer / Business Legal Name is mandatory** (CRA/CSBFL tooltip); Save disabled until non-empty.
3. Primary Business Email optional but format-validated when present; phone optional.
4. On Save: modal closes; page title becomes the legal name; land on **About Customer** tab.
5. Behind the modal the page is dimmed and non-interactive.

**Existing customer** (`?id=acme`)

- No create modal.
- Default tab: **Account Summary** (demo invoices).

**Tabs (order)**

1. **Account Summary** — read-only totals + invoice table; empty for brand-new customers.
2. **About Customer** — profile sections (details, address, contact, tags, settings, payment preferences, automations, notes).

**Header**

- Title = saved business legal name (fallback: “New Customer” / “Edit Customer”).
- Top-right primary button: **Create Invoice for {name}** → `/` (hidden while create modal is open).

**About Customer field rules**

- Contact: checkbox *Contact information is different (e.g., Accounts Payable)* → Contact Name (optional) + Contact Email (required); communications route to contact email.
- Billing: Street, City, Province/Territory (**13 CA dropdown, required for tax**), Postal; optional Address Line 2.
- Shipping: checkbox *Add shipping address or service address* clones billing on check; shipping edits do not overwrite billing.
- Tags: multi-select (VIP, Contractor, …).
- Internal notes: multiline, customers never see them.
- Currency: locked **CAD** (no dropdown). Invoice/quote builders show badge *Invoice Total in CAD (Canadian Dollars)*.
- Quote expiry / payment terms / payment methods cascade from org settings with local override.

**Create entry points (Epic 1.2)**

1. Dashboard onboarding modal: *Want to create an invoice? Start with creating a customer.*
2. Customer directory `/customers` → **+ Create new customer**.
3. Bill-to dropdown on invoice/quote → **+ Create new customer**.

**About Customer sections** mirror org patterns (view/edit cards). Settings / payment preferences / automations **seed from org cascade defaults**.

### 5.4 Payment options

Configured at **organization** level.

| Concept | Storage | UX |
|---------|---------|-----|
| Available methods | `paymentMethods[].enabled` | Outline cards; expand/collapse for cost copy |
| Enabled by default | `paymentPreferences` (labels) | Checkbox on card; light “Enabled by default” copy in edit; checkmark in view (aligned slot) |
| Remove | Sets method disabled + drops preference | **Remove** outside card, underline on hover, visible on row hover |
| Add | Multi-step modal | Pick method → review costs → Next → verification **placeholder** → Complete setup |

Core methods (shared reference copy — **not** user-editable text):

- Interac e-Transfer  
- EFT (Direct Deposit)  
- Cash  
- Cheque  

Definitions + cost notes: `current/src/lib/organization-settings.ts` (`CORE_PAYMENT_METHODS`).

**Cascade**

- Org defaults → new customer payment preferences (checked subset of enabled methods).
- Customer preferences → invoice payment rows via `getInvoicePaymentOptions()`.
- Invoice “Add more payment options” navigates to `/organization#payment-options`.

---

## 6. Design system (prototype)

### 6.1 Tokens

- CSS variables + utility classes: `current/src/app/globals.css`
- Token catalog for the floating panel: `current/src/lib/design-tokens.ts`

**Brand colors (approx.)**

| Token | Hex |
|-------|-----|
| Prime Blue | `#0072F0` (hover `#0063D1`) |
| Melon Orange / brand | `#FF7F30` |
| Midnight Ink | `#0E162A` |
| Sunshine Yellow | `#FCDC3E` |
| Sky Blue | `#9DE3FF` |
| Delete / danger | `#C3004E` |
| Page / cloud greys | `#F3F4F6` / `#F3F5F7` |

**Type classes** (do not hardcode ink color in type classes):  
`.type-page-title`, `.type-headline-5/6`, `.type-subtitle-1`, `.type-body`, `.type-body-muted`, `.type-label`, `.type-danger`, etc.

**Shared UI classes (`UI_CLASS`)**

| Class | Rule |
|-------|------|
| `.ui-section-shell` | White shell; **children spaced 10px** |
| `.ui-hover-card` | Card border; hover → prime-blue ring |
| `.ui-input` | Form controls |
| `.ui-btn-primary` / `.ui-btn-secondary` | Primary / secondary actions |

### 6.2 View / edit card pattern (org + customer)

Implement once and reuse:

1. **`FIELD` constant** — single source of truth for every field label in edit **and** view. Never diverge copy.
2. **`ViewCard`** — whole card clickable to enter edit; pencil affordance; box title muted grey.
3. **`SectionEditor`** — box title black; X close; Cancel / Save; outside-click dismiss (`useDismissOnOutsideClick`); can disable outside dismiss while a nested modal is open.
4. **`ViewField` / `ViewFieldList`** — stacked `type-subtitle-1` label + `type-body` value.
5. Empty sections use tertiary “+ Add …” affordances (`TertiaryButton` with plus icon).

### 6.3 Unsaved changes

Leaving a dirty section editor prompts a centered **Unsaved changes** dialog (Keep editing / Discard), not a toast at the bottom.

### 6.4 Modal pattern

Use the shared `Modal` component (`current/src/components/invoice/ui.tsx`) for all product dialogs.

| Element | Rule |
|---------|------|
| Padding | `p-8` / `sm:p-10` on the panel |
| Title | Centered `.type-headline-3` (30px bold), with space below (`mt-8`) |
| Close | X top-right |
| Cancel | Red `.type-danger` link, bottom-left (underline on hover) |
| Primary | Bottom-right (`ui-btn-primary` / danger red when destructive) |

Exceptions: PDF download preview overlay, and prototype chrome panels (Quick Links / Design System).

---

## 7. Data model

### 7.1 Organization settings

- **Key:** `atb-organization-settings`
- **Module:** `current/src/lib/organization-settings.ts`
- **Shape (conceptual):** business identity + address, `brandColor`, `logoDataUrl`, `currency`, `taxStatus`, `quoteExpiryDays`, `paymentTerms`, `paymentMethods[]`, `paymentPreferences[]`, automation flags (`autoSend`, `reminders`, `reminderDays`, `receipts`).

**Cascade helper:** `getCustomerCascadeDefaults(settings)` → fields applied to new customer forms.

### 7.2 Demo customers / invoices

`current/src/lib/invoice-demo-data.ts`

- Customers: `acme`, `beta`, `cedar`
- Acme has demo invoices + account summary totals (illustrative)
- Draft invoice demo business: **Horlicks Company** ↔ customer **Acme**

### 7.3 Other localStorage keys (prototype helpers)

| Key | Purpose |
|-----|---------|
| `atb-invoice-saved-line-items` | Saved line items |
| `atb-invoice-self-notes` | Note to self |
| `atb-invoice-saved-addons` | Saved add-ons |
| `atb-invoice-templates` / `atb-invoice-default-template` | Templates |
| `atb-invoice-saved-customer-notes` | Customer notes |
| `atb-invoice-quote-details` | Quote details |

Re-implementers may replace all of this with API models; keep the **field semantics** and cascade rules.

---

## 8. Action matrices & status UX

Status-specific **More actions** menus are driven by matrices:

- Invoices: `current/src/lib/invoice-actions.ts`
- Quotes: `current/src/lib/quote-actions.ts`

Notable UX rules:

- **Viewed** = customer opened the link **or** owner marked viewed manually.
- **Record Payment** collects amount + method (cheque may include reference).
- Surface primary buttons may hide actions that already appear elsewhere (e.g. Edit on preview).

---

## 9. Prototype chrome (do not ship)

### Quick Links (`QuickLinks.tsx`)

Fixed bottom-left flow map for jumping between quote/invoice stages and setup screens.

Setup entries:

- Manage Organization → `/organization`
- Edit Customer → `/customers/new?id=acme`
- New Customer → `/customers/new`

### Design System Panel

Floating panel listing tokens/type from `design-tokens.ts` for designers/devs while prototyping.

---

## 10. File checklist for implementers

Copy behaviour / structure from these first:

| Area | Files |
|------|--------|
| Org settings | `OrganizationSettingsView.tsx`, `organization-settings.ts` |
| Customer | `CustomerFormView.tsx` |
| Tokens / chrome | `globals.css`, `design-tokens.ts`, `TopNav.tsx`, `ui.tsx` |
| Demo data | `invoice-demo-data.ts` |
| Draft invoice / quote | `DraftInvoiceView.tsx`, `DraftQuoteView.tsx`, line items / notes sections |
| Status / actions | `invoice-actions.ts`, `quote-actions.ts`, sent/preview views |

---

## 11. Known prototype gaps

- No durable customer/invoice persistence beyond localStorage + demo arrays.
- Payment “verification” step is a placeholder.
- Permissions / Sub Users are static.
- Invoice edit-lock after send and live activity feeds are not enforced.
- Demo money totals are illustrative, not always arithmetically consistent.
- `STATUS.md` may lag features already in `current/` — prefer this SPEC + code.

---

## 12. Suggested inheritance strategy

1. Recreate **tokens + view/edit card pattern + FIELD labels**.
2. Port **org settings + cascade** before customer.
3. Port **customer modal + tabs + account summary**.
4. Wire **payment methods** as shared reference data with org enable/default + customer/invoice overrides.
5. Rebuild quote/invoice status graphs using the action matrices.
6. Strip Quick Links / Design System panel before production.

When in doubt, match the **running prototype in `current/`** on `mvp-ux`, then reconcile Figma.
