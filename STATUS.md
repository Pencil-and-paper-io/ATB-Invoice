# Prototype status

Short reference for singular quote and invoice work. Not product docs.

## In scope

- Singular quotes and invoices
- Status surfaces, action menus, builder fields, Record Payment, accept → draft invoice

## Out of scope / deferred

- Dashboard, customer creation, parent/child invoices, partial payments
- Expiry / 90-day overdue automation
- Reminders, receipts, outreach logging
- Client-facing quote acceptance portal

## Locked decisions

- Accepting a quote creates a **draft invoice** (payment options and due date live on the invoice only)
- **Sent quotes remain editable**
- **Viewed** = customer opens link, or owner marks manually
- **Record Payment** = amount + method; cheque may include a reference number

## Done in this pass

- Separate quote vs invoice action matrices
- Status-specific More Actions (including Mark as viewed, Re-send, Copy link, etc.)
- Extra Quick Link states: quote Viewed / Expired / Void; invoice Viewed / Void / Overdue 90+ / Uncollectible
- Quote fields: Valid Until, service start/end (no payment options on quotes)
- Invoice fields: Reference #, service start/end
- Record Payment modal → Paid
- Accept quote → draft invoice
- Confirmations for delete / void / reject (demo)

## Outstanding (next)

- Wire real activity history (not static demo text)
- Enforce edit locks on invoices after send
- Simulate Viewed via public link (manual Mark as viewed is in menus)
- Deferred items listed above

See also Quick Links (floating) for jumping between status surfaces.
