# Password-protect invoice — UI review links

Demo-only flow (no real encryption). Local base: **http://localhost:3000**

Use these links to walk each step after a refresh. Session state lives in `sessionStorage` under `atb-invoice-password-protect`.

---

## Happy path (recommended)

### 1. Set protection on send
**http://localhost:3000/preview**

1. Open **Send**
2. Turn on **Require a password to open** (auto-generates a password; you can edit or regenerate)
3. Choose Email, Text, or URL link
4. Confirm send / copy link

### 2. Sender confirmation (password shown once)
Stays in the Send sheet after confirm:

- Confirms delivery / link copied
- Shows the **password** and share URL when protection is on
- **View sent invoice** continues to the sent screen

### 3. Customer unlock gate
**http://localhost:3000/pay/invoice/3001**

- Enter the password from step 2
- Wrong password shows an error; correct unlocks the invoice card

**Cold open (no prior send):**  
**http://localhost:3000/pay/invoice/3001?setup=1**  
Seeds a demo password and shows a review hint on the lock screen.

### 4. Unlocked customer view (skip gate)
**http://localhost:3000/pay/invoice/3001?unlocked=1**

### 5. Sent invoice — password cue
**http://localhost:3000/sent**  
(after a protected send)

Or force the lock without sending:  
**http://localhost:3000/sent?passwordProtected=1**

Click the **lock** icon beside the status to open **Invoice Sent with Password** (password + Copy).

---

## Quick Links panel

In the prototype Quick Links flyout, group **Password protect (review)** mirrors the same URLs.

---

## What’s intentionally not built

- Real crypto / server-side verification
- Password reset / rotate after send
- Per-document password history
- PDF encryption
