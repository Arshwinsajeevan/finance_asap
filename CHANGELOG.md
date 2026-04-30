# 📋 CHANGELOG — Finance Module Production Hardening

> All changes made during the Backend + Frontend production hardening phase.
> Last updated: **30 April 2026**

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

The following controllers were refactored so that **all related database writes happen together or not at all** (rollback on failure):

| Controller | Function | Operations in Single Transaction |
|------------|----------|----------------------------------|
| `requisition.controller.js` | `approveRequisition` | Update requisition + Audit log |
| `requisition.controller.js` | `releaseFunds` | Update requisition + Deduct budget + Create ledger entry + Audit log |
| `salary.controller.js` | `createSalary` | Create salary (with PF/TDS computation) + Audit log |
| `salary.controller.js` | `markSalaryPaid` | Update salary + Create ledger entry + Audit log |
| `donor.controller.js` | `createDonorFund` | Create donor + Create ledger entry + Audit log |
| `invoice.controller.js` | `createInvoice` | Create invoice (with GST/TDS splits) + Audit log |
| `utilisation.controller.js` | `submitUtilisation` | Create utilisation + Audit log |

---

## 🧮 Server-Side Tax Computation

### Salary Engine (`salary.controller.js`)
- Accepts `grossAmount` from the frontend
- **EMPLOYEE** → 12% PF deduction
- **TRAINER / MENTOR** → 10% TDS deduction
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
- **Role Enforcement:** Only ADMINs can assign elevated roles (FINANCE_OFFICER, ADMIN). FINANCE_OFFICERs can only create VERTICAL_USER or STUDENT accounts. All other attempts are silently downgraded to VERTICAL_USER.
- **Rate Limiting:** `/api/auth/login` is limited to **5 attempts per minute per IP** via `express-rate-limit`.

### Transaction Ledger Lockdown
- `POST /finance/transactions` has been **removed** — the Transaction table is append-only.
- Transactions can ONLY be created internally by salary, requisition, refund, invoice, and donor controllers inside `prisma.$transaction` blocks.
- No `PUT`, `DELETE`, or `UPDATE` endpoint exists for the ledger.

---

## ✅ Zod Validation Coverage

Every `POST` and `PATCH` route now has strict Zod schema validation:

| Schema File | Schemas |
|-------------|---------|
| `auth.schema.js` | `loginSchema`, `registerSchema` |
| `invoice.schema.js` | `createInvoiceSchema`, `updateInvoiceStatusSchema` |
| `refund.schema.js` | `createRefundSchema`, `verifyRefundSchema` |
| `utilisation.schema.js` | `submitUtilisationSchema`, `verifyUtilisationSchema` |
| `transaction.schema.js` | `transactionQuerySchema` (GET query params) |
| `requisition.schema.js` | Already existed — `createRequisitionSchema`, `approveRequisitionSchema`, `rejectRequisitionSchema`, `releaseRequisitionSchema` |
| `salary.schema.js` | Updated — now accepts `grossAmount` instead of `amount` |
| `donor.schema.js` | Already existed |
| `bank.schema.js` | Already existed |
| `studentPayment.schema.js` | Already existed |

---

## 🐛 Bugs Fixed

| # | Severity | File | Fix |
|---|----------|------|-----|
| 1 | 🔴 CRITICAL | `studentPayment.controller.js` | Imported `sendSuccess`/`sendError` which don't exist. All 16 calls replaced with `success`/`error` (with corrected parameter order). |
| 2 | 🟠 MEDIUM | `utilisation.controller.js` | Status check on line 75 blocked all utilisation submissions. Now accepts both `UTILISATION_PENDING` and `FUNDS_RELEASED`. |

---

## 🎨 Frontend Features Implemented

| Feature | Page | Description |
|---------|------|-------------|
| Taxation & Compliance Tab | `TaxationPage.jsx` | Sidebar link + view for Form 16s, GST filing, TDS deductions |
| Salary Taxation Engine | `SalariesPage.jsx` | Widget to calculate PF/TDS deductions before releasing salaries |
| Bank Records Sub-module | `BankRecordsPage.jsx` | Arrears, Petty Cash, and Imprest ledger tracking |
| Invoice Tax Inputs | `InvoicesPage.jsx` | PAN/GSTIN, TDS %, CGST/SGST auto-split, Net Receivable |
| Rejection Modals | `RefundsPage.jsx`, `RequisitionsPage.jsx` | Mandatory rejection reason before API fires |
| Clickable Charts | `OverviewPage.jsx` | Donut chart slices navigate to filtered ledger pages |
| Global Date Picker | `OverviewPage.jsx` | `react-datepicker` range filter on all dashboard data |

---

## 📦 Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| `express-rate-limit` | latest | Brute force protection on login endpoint |
| `react-datepicker` | latest | Frontend date range picker |
| `date-fns` | latest | Date formatting utilities |
