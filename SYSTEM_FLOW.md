# ASAP Kerala Finance Module - System Flow & Architecture

This document outlines the entire data flow and business logic of the finance module based on the system requirements and existing implementation. It explains how money enters the system, how budgets are managed, how expenses are tracked, and exactly where the dashboard gets its numbers.

---

## 1. Core Architecture Overview

The system is built on a **Central Ledger Architecture**. Instead of just changing static numbers on a dashboard, every single financial movement (income or expense) is recorded in a central `Transaction` table. 

The Dashboard doesn't store any numbers; it calculates everything dynamically by running aggregations (sums) on this central `Transaction` table and the `Budget` table.

---

## 2. System Roles (RBAC)

The system operates on strict Role-Based Access Control (RBAC):
*   **Finance Officer**: Has global access. They approve requests, release funds, pay salaries, and monitor the macro-level dashboard.
*   **Vertical User (e.g., Training, CSP, SDC)**: Has restricted access. They can only see their specific vertical's budget. Their main job is to request funds (Requisitions) and submit proofs of spending (Utilisations).
*   **Student**: A client in the system who generates revenue by paying course fees.
*   **Admin**: Handles system configuration and user management.

---

## 3. Core Data Flows

### A. The Budget Flow (Where the Dashboard "Budget" numbers come from)
At the start of every financial year (e.g., FY 2025-26), a total **Allocated Budget** is defined for each Vertical (Training, SDC, etc.). 
*   **Source Table**: `Budget`
*   **Flow**: 
    *   Initial State: `allocated` = ₹X, `used` = ₹0, `released` = ₹0.
    *   When the Finance Officer releases funds for a Requisition, the `used` and `released` columns are automatically increased.
    *   The "Budget & Allocations" page reads directly from this table to draw the progress bars and trigger the "Near Limit" warning labels.

### B. The Expense Flow (Requisitions & Utilisations)
When a department needs to spend money, it follows a strict 4-step workflow:
1.  **Request**: A Vertical User raises a `Requisition` (Status: `PENDING`).
2.  **Approve**: The Finance Officer reviews it and approves a specific amount (Status: `APPROVED`).
3.  **Release Funds**: The Finance Officer releases the money. 
    *   *System Action 1*: Creates a `Transaction` (Type: `FUND_RELEASE`).
    *   *System Action 2*: Increases the `used` amount in the `Budget` table for that vertical.
    *   *System Action 3*: Changes Requisition status to `UTILISATION_PENDING`.
4.  **Proof of Spending**: The Vertical User spends the money and uploads bills/receipts as a `Utilisation` report. Once the Finance Officer verifies the bills, the cycle is marked `COMPLETED`.

### C. The Revenue Flow (Inflows)
Money entering the system primarily comes from two sources:
1.  **Student Fees**: When a student pays a fee, a `StudentPayment` record is created, and instantly, a `Transaction` (Type: `STUDENT_PAYMENT`) is logged in the ledger.
2.  **Donor Funds**: When the government or a corporate entity gives a grant, a `DonorFund` record is created, and a `Transaction` (Type: `DONOR_FUND`) is logged.

### D. The Payroll Flow
1.  Salaries are generated monthly (`Salary` table) with status `PENDING`.
2.  When the Finance Officer clicks "Pay", the status changes to `PAID` and a `Transaction` (Type: `SALARY`) is recorded as an outflow.

---

## 4. Where Does the Dashboard Data Come From?

When the Finance Officer logs in and looks at the Overview Page, here is exactly how the backend calculates those massive numbers:

1.  **Total Revenue (Inflow)**: 
    *   The backend groups the `Transaction` table.
    *   It sums up the `amount` of all successful transactions where the type is `STUDENT_PAYMENT` or `DONOR_FUND`.
2.  **Total Expenses (Outflow)**:
    *   It sums up the `amount` for successful transactions of types like `SALARY`, `FUND_RELEASE`, and `EXPENSE`.
3.  **Net Surplus**:
    *   Calculated dynamically as `Total Revenue - Total Expenses`.
4.  **Trends (The ↑ ↓ Percentages)**:
    *   The backend dynamically sums the transactions for the *current* date range.
    *   It then sums the transactions for the *previous* date range of the exact same length (e.g., last 30 days vs previous 30 days).
    *   It applies a standard percentage change formula `((Current - Previous) / Previous) * 100` to generate the green/red trend arrows.

---

## 5. Security & High-Concurrency Performance

*   **Caching (The 7k User Protection)**: To prevent the database from crashing when calculating these massive sums, the backend runs the aggregations once and caches the result in memory (RAM) for 5 minutes. If 7,000 users view the dashboard, only 1 database query is executed; the rest are served instantly from RAM.
*   **Automated Cache Busting**: If someone pays a fee or releases funds, a `withCacheBust` middleware automatically deletes the dashboard cache. The next user to view the dashboard triggers a fresh calculation, ensuring no one ever sees stale data.
*   **Atomic Transactions**: When funds are released, deducting the budget and creating the transaction happen simultaneously using `prisma.$transaction`. If the server crashes mid-process, the database rolls back, guaranteeing that financial data is never out of sync.
