# 📋 CHANGELOG — Finance Module Production Hardening

> All changes made during the Backend + Frontend production hardening phase.
> Last updated: **30 April 2026 — Session 2**

---

## 🗄️ Database Schema (`backend/prisma/schema.prisma`)

### New Fields Added
| Model | Field | Type | Purpose |
|-------|-------|------|---------|
| `Invoice` | `panGstin` | `String?` | PAN or GSTIN for taxation tracking |
| `Invoice` | `tdsPercent` | `Float @default(0)` | TDS deduction percentage |
| `Invoice` | `cgstAmount` | `Float @default(0)` | Auto-computed CGST (half of GST) |
| `Invoice` | `sgstAmount` | `Float @default(0)` | Auto-computed SGST (half of GST) |
| `Salary` | `pfAmount` | `Float @default(0)` | Provident Fund deduction (12% for employees) |
| `Salary` | `tdsAmount` | `Float @default(0)` | TDS deduction (10% for trainers/mentors) |
| `Utilisation` | `proofFileUrl` | `String?` | S3 URL for uploaded PDF bills/receipts |

### Performance Indexes Added (13 total)
| Model | Indexed Fields |
|-------|---------------|
| `Transaction` | `transactionType`, `source`, `status`, `createdAt` |
| `Requisition` | `status`, `vertical`, `raisedById` |
| `Salary` | `status`, `month`, `vertical` |
| `StudentPayment` | `status`, `studentId` |
| `AuditLog` | `[entity, entityId]` (composite), `performedBy` |

---

## ⚛️ Atomic Transactions (`prisma.$transaction`)

All critical financial operations are now atomic — if any step fails, everything rolls back:

| Controller | Function | Operations in Single Transaction |
|------------|----------|----------------------------------|
| `requisition.controller.js` | `createRequisition` | Budget check + Create requisition + Audit log |
| `requisition.controller.js` | `approveRequisition` | Update requisition + Audit log |
| `requisition.controller.js` | `releaseFunds` | Update requisition + Deduct budget + Create ledger entry + Audit log |
| `salary.controller.js` | `createSalary` | PF/TDS computation + Create salary + Audit log |
| `salary.controller.js` | `markSalaryPaid` | Update salary + Create ledger entry + Audit log |
| `donor.controller.js` | `createDonorFund` | Create donor + Create ledger entry + Audit log |
| `invoice.controller.js` | `createInvoice` | GST/TDS splits + Create invoice + Audit log |
| `utilisation.controller.js` | `submitUtilisation` | Create utilisation + Audit log |

---

## 🧮 Server-Side Tax Computation

### Salary Engine (`salary.controller.js`)
- Accepts `grossAmount` from the frontend (not `amount`)
- **EMPLOYEE** → 12% PF deduction (`pfAmount`)
- **TRAINER / MENTOR** → 10% TDS deduction (`tdsAmount`)
- **AGENT** → No deductions (commission-based)
- Stores `amount` = `grossAmount - pfAmount - tdsAmount` (net payable)

### Invoice Engine (`invoice.controller.js`)
- Accepts `baseAmount`, `gstPercent`, `tdsPercent`, `panGstin`
- Auto-computes: `cgstAmount`, `sgstAmount`, `gstAmount`, `totalAmount`, `netReceivable`
- PAN validated via regex: `ABCDE1234F` (10 chars)
- GSTIN validated via regex: `22ABCDE1234F1Z5` (15 chars)

---

## 🛡️ Security Hardening

### Auth System (`auth.controller.js`)
| Feature | Details |
|---------|---------|
| **Role Enforcement** | Only ADMINs can assign elevated roles. FINANCE_OFFICERs can only create VERTICAL_USER/STUDENT. All other attempts silently downgraded. |
| **Rate Limiting** | `/api/auth/login` limited to **5 attempts/min/IP** via `express-rate-limit` |
| **Zod Validation** | Login: email normalization + password required. Register: min 8 char password, enum-validated role/vertical. |

### Transaction Ledger Lockdown
- `POST /finance/transactions` — **REMOVED**. Ledger is append-only.
- Transactions ONLY created internally by other controllers inside `prisma.$transaction` blocks.
- No `PUT`, `DELETE`, or `UPDATE` endpoint exists for the ledger.

---

## 💰 Budget Overspend Protection

### Backend — `createRequisition` Pre-Check
- Looks up the vertical's budget for the requested financial year
- **Rejects** if no budget allocation exists
- **Rejects** if `amount > (allocated - used)` with detailed error showing remaining balance
- Audit log captures `budgetRemaining` and utilisation percentage

### Frontend — Dashboard Warning Banner
- Scans all budgets — if any vertical is **≥90% utilised**, a red/amber alert banner appears
- Shows each flagged vertical with exact percentage and remaining amount
- 100%+ → Red ("Exhausted"), 90–99% → Amber ("₹X left")
- Links directly to the Budget page

---

## ⚡ Response Caching

### Cache Layer (`utils/cache.js`)
- In-memory cache using `node-cache` (5 min TTL, zero-setup)
- Dashboard overview (`GET /finance/reports/overview`) cached — 8 DB queries avoided on cache hit
- Cache key includes date range so filtered views don't conflict

### Cache Invalidation (`middleware/cacheBust.js`)
- `withCacheBust()` wrapper applied to **18 write endpoints** across all route files
- On any successful write (salary, requisition, invoice, etc.) → dashboard cache instantly cleared
- Next dashboard load fetches fresh data from DB

| Routes with Cache Invalidation |
|---|
| `salary.routes.js` — POST `/`, PATCH `/:id/pay` |
| `requisition.routes.js` — POST `/`, PATCH approve/reject/release |
| `donor.routes.js` — POST `/` |
| `invoice.routes.js` — POST `/`, PATCH `/:id/status` |
| `refund.routes.js` — POST `/`, PATCH `/:id/verify` |
| `utilisation.routes.js` — POST `/`, PATCH `/:id/verify` |
| `studentPayment.routes.js` — POST `/`, PATCH installment/refund |
| `budget.routes.js` — POST `/` |
| `bank.routes.js` — POST `/` |

---

## ✅ Zod Validation Coverage — Complete

Every `POST` and `PATCH` route now has strict Zod schema validation:

| Schema File | Schemas |
|-------------|---------|
| `auth.schema.js` | `loginSchema`, `registerSchema` |
| `invoice.schema.js` | `createInvoiceSchema`, `updateInvoiceStatusSchema` |
| `refund.schema.js` | `createRefundSchema`, `verifyRefundSchema` |
| `utilisation.schema.js` | `submitUtilisationSchema`, `verifyUtilisationSchema` |
| `transaction.schema.js` | `transactionQuerySchema` (GET query validation) |
| `requisition.schema.js` | create, approve, reject, release schemas |
| `salary.schema.js` | Updated — accepts `grossAmount` instead of `amount` |
| `donor.schema.js` | `createDonorFundSchema` |
| `bank.schema.js` | `createBankRecordSchema` |
| `studentPayment.schema.js` | create, update, refund schemas |

---

## 🐛 Bugs Fixed

| # | Severity | File | Fix |
|---|----------|------|-----|
| 1 | 🔴 CRITICAL | `studentPayment.controller.js` | Imported `sendSuccess`/`sendError` which don't exist. All 16 calls replaced with correct `success`/`error` (parameter order swapped). |
| 2 | 🟠 MEDIUM | `utilisation.controller.js` | Status check blocked all utilisation submissions. Now accepts both `UTILISATION_PENDING` and `FUNDS_RELEASED`. |

---

## 🎨 Frontend Changes

| Feature | Page | Description |
|---------|------|-------------|
| Salary Form Sync | `SalariesPage.jsx` | Sends `grossAmount` to backend. Table shows 3 columns: Gross → Deductions (PF/TDS) → Net Payable. Agent deductions fixed to 0%. |
| Budget Alert Banner | `OverviewPage.jsx` | Auto-detects verticals ≥90% utilisation. Red/amber pills with exact % and remaining budget. Links to Budget page. |
| Taxation Tab | `TaxationPage.jsx` | Sidebar link + view for Form 16s, GST filing, TDS deductions |
| Invoice Tax Inputs | `InvoicesPage.jsx` | PAN/GSTIN, TDS %, CGST/SGST auto-split, Net Receivable |
| Rejection Modals | `RefundsPage.jsx`, `RequisitionsPage.jsx` | Mandatory rejection reason before API fires |
| Clickable Charts | `OverviewPage.jsx` | Donut chart slices navigate to filtered ledger pages |
| Global Date Picker | `OverviewPage.jsx` | `react-datepicker` range filter on all dashboard data |
| Bank Sub-module | `BankRecordsPage.jsx` | Arrears, Petty Cash, and Imprest ledger tracking |

---

## 📦 Dependencies Added

| Package | Purpose |
|---------|---------|
| `express-rate-limit` | Brute force protection on login endpoint |
| `node-cache` | In-memory response caching (5 min TTL) |
| `react-datepicker` | Frontend date range picker |
| `date-fns` | Date formatting utilities |
