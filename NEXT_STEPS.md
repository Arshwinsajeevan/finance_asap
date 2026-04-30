# 🚀 NEXT STEPS — Before Handoff to Senior Developer

> This document lists everything remaining to make the ASAP Kerala Finance Module fully dynamic and production-ready for deployment.
> Priority: **P0** = Must do before launch, **P1** = Should do, **P2** = Nice to have.

---

## 🔧 Backend — Remaining Work

### P0: Core Business Logic

#### 1. AWS S3 File Uploads for Utilisation Proofs
The `Utilisation` model already has a `proofFileUrl` field, but no actual upload logic exists yet.
- [ ] Install `multer` and `@aws-sdk/client-s3`
- [ ] Create upload middleware at `backend/src/middleware/upload.js`
- [ ] Update `utilisation.controller.js` → `submitUtilisation` to accept multipart form data
- [ ] Upload PDF/image to S3, save the returned URL into `proofFileUrl`
- [ ] Add file size limits (max 10MB) and type restrictions (PDF, PNG, JPG only)

#### 2. Payment Gateway Integration (Razorpay/PayU)
Students currently pay offline. The SRS requires online payment collection.
- [ ] Create `backend/src/controllers/payment.controller.js` with Razorpay/PayU integration
- [ ] Add `POST /finance/payments/create-order` to generate a payment link
- [ ] Add `POST /finance/webhooks/payment` to receive payment confirmations
- [ ] On successful payment → atomically update `StudentPayment` status and create `FEE_COLLECTION` transaction
- [ ] Add webhook signature verification to prevent spoofed payment callbacks

#### 3. TallyPrime XML Export API
The SRS requires seamless sync with TallyPrime (v5.1.0).
- [ ] Create `backend/src/controllers/tally.controller.js`
- [ ] Add `GET /finance/tally/export?startDate=...&endDate=...` endpoint
- [ ] Fetch all `SUCCESS` transactions in the date range
- [ ] Map each transaction to TallyPrime XML format (Journal Voucher / Day Book entry)
- [ ] Return downloadable XML file

#### 4. Frontend ↔ Backend Sync for Salary Page
The salary form on the frontend still sends `amount` but the backend now expects `grossAmount`.
- [ ] Update `SalariesPage.jsx` form to send `grossAmount` instead of `amount`
- [ ] Display the server-computed PF/TDS breakdown in the salary table
- [ ] Show net payable vs gross amount in the salary details view

---

### P1: Data Integrity & Compliance

#### 5. Centralized Audit Logger Service
Currently, audit logging is manually added in each controller. This is error-prone.
- [ ] Create `backend/src/services/auditLogger.js` as a reusable function:
  ```js
  async function logAudit(tx, { action, entity, entityId, performedBy, details }) { ... }
  ```
- [ ] Refactor all controllers to use this shared service
- [ ] Add an `GET /finance/audit-logs` endpoint for compliance officers to search/filter logs

#### 6. Soft Delete for Sensitive Records
Financial records should never be hard-deleted. They should be "archived".
- [ ] Add `deletedAt DateTime?` field to `Requisition`, `Invoice`, `DonorFund`, `Salary`
- [ ] Update all queries to filter out `deletedAt IS NOT NULL` by default
- [ ] Replace any existing `delete` operations with soft-delete (set `deletedAt = now()`)

#### 7. Budget Overspend Protection
Currently nothing prevents a vertical from submitting requisitions exceeding their budget allocation.
- [ ] In `createRequisition`, add a pre-check: if `amount > (budget.allocated - budget.used)`, reject with a clear error
- [ ] Add a dashboard warning when any vertical's budget utilisation exceeds 90%

---

### P2: Performance & Scale

#### 8. Response Caching with Redis
Dashboard overview hits 5+ aggregation queries. At scale, this will be slow.
- [ ] Install `ioredis`
- [ ] Cache the `GET /finance/reports/overview` response for 5 minutes
- [ ] Invalidate cache when any write operation occurs (transaction, requisition, salary, etc.)

#### 9. Pagination on All List Endpoints
Some endpoints return all records without pagination.
- [ ] Ensure every `GET` list endpoint uses `skip`/`take` pagination
- [ ] Affected endpoints: `GET /finance/refunds`, `GET /finance/invoices`, `GET /finance/bank/guarantees`
- [ ] Frontend tables should support page navigation

#### 10. Background Job Queue (BullMQ)
Long-running tasks like PDF generation and email notifications should not block the API.
- [ ] Install `bullmq` with Redis as the backing store
- [ ] Move Form 16 PDF generation to a background job
- [ ] Move email notifications (approval/rejection alerts) to a background job

---

## 🎨 Frontend — Remaining Work

### P0: Must Fix

#### 11. Sync Salary Form with New Backend
- [ ] Update the "Add Salary" form to send `grossAmount` (not `amount`)
- [ ] Display PF/TDS breakdown columns in the salary table
- [ ] Show `Net Payable` vs `Gross` in the details view

#### 12. File Upload Component (Utilisations)
- [ ] Build a drag-and-drop dropzone component for PDF/image uploads
- [ ] Wire it into the Utilisation submission form
- [ ] Show uploaded file preview with a download link after submission

### P1: Export & Reporting

#### 13. Excel/CSV Export
- [ ] Install `xlsx` or `papaparse`
- [ ] Add "Download CSV" button to: Transactions, Receivables, Payables tables
- [ ] Generate client-side Excel files with formatted headers

#### 14. PDF Generation
- [ ] Install `jspdf` or `@react-pdf/renderer`
- [ ] Wire the "Generate PDF" button on Form 16 / Invoice pages
- [ ] Generate downloadable, printable PDF documents

### P2: UX Polish

#### 15. Toast Notifications
- [ ] Install `react-hot-toast`
- [ ] Add global toast system for success/error messages on all actions (approve, reject, create, delete)

#### 16. Mobile Responsive Tables
- [ ] Implement a responsive table strategy (card view on mobile)
- [ ] Test on common mobile screen sizes

#### 17. Actionable Dashboard Alerts
- [ ] Make "Pending Approvals" badges clickable → navigate to filtered Requisitions list
- [ ] Make "Pending Refunds" badge clickable → navigate to filtered Refunds list

---

## 🔗 Inter-Vertical API Contracts

Before the senior developer connects the other ASAP vertical systems, these API contracts must be documented:

| Vertical | Calls Finance API | Purpose |
|----------|-------------------|---------|
| **Training** | `POST /finance/student-payments` | Register a student fee record |
| **Training** | `PATCH /finance/student-payments/:id/installment` | Record an installment payment |
| **All Verticals** | `POST /finance/requisitions` | Request funds for a project |
| **All Verticals** | `POST /finance/utilisations` | Submit proof of spending |
| **Fund Raising** | `POST /finance/donors` | Log a donor contribution |
| **Payment Gateway** | `POST /finance/webhooks/payment` | Confirm online student payment |

> **Action Item:** Generate Swagger/OpenAPI documentation using `swagger-jsdoc` so other vertical teams have a self-service API reference.

---

## 🏗️ Infrastructure & DevOps

| Task | Priority | Notes |
|------|----------|-------|
| Set up CI/CD pipeline (GitHub Actions) | P0 | Auto-run `prisma generate` + `npm test` on every PR |
| Configure `.env` for production | P0 | Switch from dev JWT secret to a strong 256-bit key |
| Set up HTTPS with SSL certificate | P0 | Required for IT Act 2000 compliance |
| Configure CORS for production domain | P0 | Replace `localhost:5173` with actual domain |
| Set up error monitoring (Sentry) | P1 | Capture unhandled exceptions in production |
| Set up log aggregation (Winston + CloudWatch) | P1 | Centralized logging for debugging |
| Load testing with k6 or Artillery | P2 | Validate 10,000+ concurrent user support |

---

## ✅ Checklist Before Handoff

- [ ] All P0 items above are completed
- [ ] Seed script updated to reflect new schema fields (`grossAmount`, `pfAmount`, etc.)
- [ ] All API endpoints documented in Swagger
- [ ] `.env.example` updated with all required environment variables
- [ ] Database backup strategy configured on Neon
- [ ] README updated with setup instructions for new developers
