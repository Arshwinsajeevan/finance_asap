# ASAP Kerala - Unified Finance Module
**Project Overview & Functional Documentation**

## 1. What is this project?
The **Unified Finance Module** is a centralized financial management system built for ASAP Kerala. Instead of each department (vertical) managing its own finances in silos, this single module handles the financial operations, budget tracking, and fund allocations for the entire organization (including Training, CSP, SDC, Fund Raising, and Secretariat services).

## 2. Why a Single Project? (The 3 User Roles)
To maintain security, oversight, and smooth workflow, the system uses **Role-Based Access Control (RBAC)**. Three distinct types of users interact within this single system, each with different permissions:

### 👤 Vertical User (e.g., Training Head, SDC Manager)
* **Role:** The operational staff from various departments who need funds to execute their projects.
* **What they do:** They cannot access the main finance dashboard. They log in to a restricted view where they can:
  1. Raise yearly/monthly **Requisitions** (requests for funds).
  2. Submit **Utilisation Reports** (uploading bills to prove how they spent the released funds).

### 💼 Finance Officer
* **Role:** The core operators of the finance department who manage the money.
* **What they do:** They have full read/write access to the entire system. They:
  1. Review, approve, or reject requisitions from verticals.
  2. Release funds, which automatically updates the department's budget.
  3. Verify utilisation reports submitted by verticals.
  4. Manage salaries, track student fee payments, and record bank guarantees.

### 👁️ Admin (Oversight / Management)
* **Role:** Higher-level management (like Directors or Auditors) who need to monitor the organization's financial health.
* **What they do:** They have **Read-Only** access. They can view all transactions, budgets, and generated reports, but they *cannot* approve funds, release money, or alter records. This ensures strict auditing and fraud prevention.

---

## 3. Core Workflow (How it works)

The system is designed around a strict, automated financial pipeline to ensure no funds are misused:

1. **Budget Allocation:** At the start of the financial year, the Finance Officer allocates a specific budget to each vertical (e.g., ₹50 Lakhs to Training).
2. **Requisition Raised:** A Vertical User submits a request for funds (e.g., ₹2 Lakhs for Lab Equipment).
3. **Approval & Release:** The Finance Officer reviews the request. If approved, they click "Release Funds."
4. **Automated Tracking:** The system *automatically*:
   * Deducts ₹2 Lakhs from the Training vertical's available budget.
   * Creates a permanent transaction record in the central ledger.
5. **Utilisation Submission:** Once the equipment is bought, the Vertical User submits an expense report with the bill details.
6. **Verification:** The Finance Officer verifies the bills to close the loop.

---

## 4. Key Functionalities

* **Centralized Dashboard:** Real-time visibility into total budget, funds used, available balance, and recent transactions.
* **Budget Tracking:** Progress bars and alerts that warn the Finance Officer if a vertical is close to over-exhausting its allocated budget.
* **Student Fee Management:** Tracks fee payments, calculates pending installments, and processes refunds for students enrolled in ASAP courses.
* **Salary & Payouts:** Manages and tracks monthly payments to ASAP employees, trainers, mentors, and commissioned agents (who earn per enrollment).
* **Donor & Sponsorship Tracking:** Keeps a distinct record of funds raised from individual, corporate, or government sponsors, linking them to specific projects.
* **Bank Records Management:** Tracks Bank Statements, Fixed Deposits (FD), Earnest Money Deposits (EMD) against tenders, and Bank Guarantees, including their validity and expiry dates.
* **Automated Reporting:** Generates Annual Financial Reports and vertical-specific expenditure reports that can be exported to PDF.
* **Audit Trail:** Every action (creating a payment, approving funds, rejecting a request) is secretly logged in the database with the user's ID and timestamp for strict accountability.
