# 🏢 ASAP Kerala Centralized Finance Management System
## System Architecture & Workflow Overview (For Senior Review)

This document provides a simple yet comprehensive overview of the **Centralized Finance Management System** built for ASAP Kerala. 

---

## 🎯 CORE PRINCIPLES & PHILOSOPHY

The system operates not just as a standard CRUD application, but as a **workflow-driven financial control system**. All modules enforce high-integrity finance rules:

```
Money In  ───► Track ─────► Verify ───► Report
Money Out ───► Request ───► Approve ──► Release ──► Verify ──► Close
```

1. **Every Financial Move Must Log:** Every transaction must simultaneously log in the main `Transaction` ledger and the `AuditLog` table within an atomic transaction.
2. **Double-Entry Discipline:** For each fund released or expense verified, it must deduct/allocate budget appropriately.
3. **No Unaccounted Cash:** Workflows enforce strict tracking of invoices, student fees, salaries, and requisitions.

---

## 🛠️ TECHNICAL STACK & ARCHITECTURE

The application uses a **Modular Monolith** pattern where features are grouped logically by finance domain to ensure separation of concerns.

- **Frontend:** React + Vite, Tailwind CSS / Custom Sleek CSS, React Query (for centralized cached data fetching).
- **Backend:** Node.js, Express, TypeScript, Passport.js (JWT authentication).
- **ORM & DB:** Prisma ORM connecting to a high-availability **PostgreSQL** database.

---

## 🔁 MAIN WORKFLOWS IN DEPTH

Below are the strictly enforced business workflows as defined by the core system requirements.

### 1️⃣ REQUISITION FLOW (Fund Request Workflow)
Handles fund requests originating from vertical users (Training, CSP, SDC, etc.).

```
[Create Request] ──► [Finance Officer Approves] ──► [Release Funds] ──► [Track Utilisation]
```
- **Step A: Creation:** A vertical user creates a requisition with an amount, purpose, and financial year.
- **Step B: Approval:** A Finance Officer reviews the request and either approves it (can modify `approvedAmount`) or rejects it with a reason.
- **Step C: Fund Release:** The Finance Officer releases the funds (partial or full).
  - *Data Impact:* Reduces the vertical's remaining budget. Changes requisition status to `UTILISATION_PENDING`. Creates a **FUND_RELEASE** entry in the central `Transaction` ledger.

---

### 2️⃣ UTILISATION FLOW (Proof of Expenditure)
Closes the loop after funds are released to a vertical.

- **Step A: Submission:** After receiving released funds, the vertical user submits a utilisation report along with an attached receipt/invoice document and the matching requisition reference.
- **Step B: Review & Verification:** The Finance Officer verifies the submitted utilisation report.
- **Step C: Approval & Closure:** 
  - If approved, the requisition status changes to `COMPLETED`.
  - An **EXPENSE** transaction is permanently added to the central unified ledger (`Transaction` table).
  - If rejected, it moves back to `PENDING_RESUBMISSION` for the vertical user to fix.

---

### 3️⃣ STUDENT PAYMENTS & INVOICES (Money In)
Manages incoming revenues from student enrollments or corporate sponsors.

- **Direct Payment (Student Payment):** Student makes a fee payment.
  - Creates a **STUDENT_PAYMENT** transaction in the central ledger.
- **Invoice Flow:** For institutional/B2B deals.
  - Finance generates an invoice with auto-calculated **GST (18%)**.
  - On payment, the invoice marks as paid, and an **INVOICE_PAYMENT** transaction is generated.

---

### 4️⃣ SALARY DISBURSEMENT (Money Out)
Manages recurring employee, trainer, mentor, and agent payouts.

- Finance reviews the generated monthly salary sheets for various roles.
- On executing payout, the system automatically computes any configured deductions like **PF (Provident Fund)** and **TDS (Tax Deducted at Source)**.
- Status moves to `PAID`, and a **SALARY** expense transaction is created in the unified ledger.

---

## 📈 DATA INTEGRITY & AUDIT TRAILS

### 1. Unified Append-Only Ledger (`Transaction` Table)
The `Transaction` table is the single source of truth for all financial volume. It contains **no public create, update, or delete** routes. Data can *only* be appended internally by other workflows inside atomic DB transactions (`prisma.$transaction`).

### 2. Comprehensive Logging
Every crucial action (e.g., releasing funds, verifying utilisation, approving invoices) logs an unalterable history record in the `AuditLog` table containing metadata, budget levels before and after, and the identity of the officer who performed it.
