# ASAP Kerala - Unified Finance Module
**Project Overview & Functional Documentation**

## 1. What is this project?
The **Unified Finance Module** is a strictly controlled, audit-compliant, centralized financial management system built for ASAP Kerala. Instead of each department (vertical) managing its own finances in silos, this single module handles the financial operations, budget tracking, fund allocations, invoices, and accounting ledgers for the entire organization (including Training, CSP, SDC, Fund Raising, and Secretariat services).

## 2. Why a Single Project? (The 3 User Roles)
To maintain security, oversight, and smooth workflow, the system uses strict **Role-Based Access Control (RBAC)**. Three distinct types of users interact within this single system, each with different permissions:

### 👤 Vertical User (e.g., Training Head, SDC Manager)
* **Role:** The operational staff from various departments who need funds to execute their projects or need to request refunds for students.
* **What they do:** They log in to a restricted view where they can:
  1. Raise yearly/monthly **Requisitions** (requests for funds).
  2. Submit **Utilisation Reports** (uploading bills to prove how they spent the released funds).
  3. Initiate base entities that require financial processing (like submitting a Refund request or recording student enrollments).

### 💼 Finance Officer (Operations)
* **Role:** The core operators of the finance department who manage the money.
* **What they do:** They have Write/Approve access but are locked into strict financial workflows. They *cannot* magically invent primary entities (like creating a student out of thin air). They strictly process financial actions:
  1. Review, approve, or reject requisitions from verticals.
  2. Release funds, which automatically updates the department's budget.
  3. Verify utilisation reports submitted by verticals.
  4. Record student payments against existing dues.
  5. Process Refunds (Approve/Reject), seamlessly updating the central ledger.
  6. Create GST Invoices (Inbound/Outbound) and mark them as Paid.

### 👁️ Admin (Oversight / Management)
* **Role:** Higher-level management (like Directors or Auditors) who need to monitor the organization's financial health.
* **What they do:** They have an exclusive **Admin Oversight Panel**. They have **100% Read-Only** access. They can view all transactions, ledgers, budgets, and generated reports, but they *cannot* approve funds, release money, record payments, or alter records. This ensures strict auditing, complete transparency, and fraud prevention.

---

## 3. Core Workflows (How it works)

The system is designed around strict, automated financial state machines to ensure no funds are manipulated manually:

### Requisition & Budget Flow:
1. **Budget Allocation:** At the start of the financial year, the Finance Officer allocates a specific budget to each vertical.
2. **Requisition Raised:** A Vertical User submits a request for funds (e.g., ₹2 Lakhs for Lab Equipment).
3. **Approval & Release:** The Finance Officer reviews the request. If approved, they click "Release Funds."
4. **Automated Tracking:** The system *automatically*:
   * Deducts ₹2 Lakhs from the vertical's available budget.
   * Creates an immutable transaction record in the central ledger (`FUND_RELEASE`).
5. **Verification:** The Vertical User submits an expense report with bills, and the Finance Officer verifies them to close the loop.

### Invoice Processing Flow:
1. **Drafting:** The Finance Officer generates an Invoice, automatically calculating GST (0%, 5%, 12%, 18%) and total amount. The invoice remains as a `DRAFT`.
2. **Approval:** Once verified, the draft is marked as `APPROVED` and sent to the client.
3. **Payment Realization:** When the amount hits the bank, the Finance Officer marks it as `PAID`.
4. **Automated Ledger:** The system automatically inserts a ledger record (`INVOICE_PAYMENT`).

### Refund Processing Flow:
1. **Request:** A vertical initiates a refund for a student.
2. **Review:** The Finance Officer reviews the request.
3. **Action:** If rejected, a reason is documented. If `APPROVED`, the system automatically restores the pending fee balance for the student and inserts a `REFUND` ledger entry.

---

## 4. Key Modules & Features

* **Centralized Dashboard:** Dual-mode dashboards. A tactical dashboard for Finance Officers, and a strategic, high-level oversight dashboard for Admins (showing Net Balance, Total Income vs Expenses, and Pending Approvals).
* **Automated Ledger (Transactions):** A completely automated, immutable central transaction ledger. Manual ledger entries are strictly prohibited. The ledger populates via triggers from Fee Collections, Salary Payouts, Requisitions, Invoices, and Refunds.
* **Budget Tracking:** Progress bars and alerts that warn if a vertical is close to over-exhausting its allocated budget.
* **Fee & Refund Management:** Strict tracking of student dues. Finance officers record payments and process refunds against auto-calculated pending amounts.
* **GST Invoice Engine:** Built-in engine to generate outbound and inbound tax invoices with dynamic GST brackets.
* **Salary & Payouts:** Manages and tracks monthly payments to ASAP employees, trainers, mentors, and commissioned agents.
* **Donor & Sponsorship Tracking:** View-only dashboards summarizing funds raised from individual, corporate, or government sponsors.
* **Financial Reports:** Clean executive summaries comparing Income (Fees, Donors) against Expenses (Salaries, Requisitions, Refunds).
* **Audit Trail:** Every action (creating a payment, approving funds, rejecting a request, updating an invoice status) is permanently logged with the user's ID and timestamp for strict compliance.
