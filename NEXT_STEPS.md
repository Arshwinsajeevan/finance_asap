# 🚀 NEXT STEPS — Before Handoff to Senior Developer

> Remaining work to make the ASAP Kerala Finance Module fully production-ready.
> Priority: **P0** = Must do before launch, **P1** = Should do, **P2** = Nice to have.
> Last updated: **30 April 2026**

---

## ✅ Completed (This Sprint)

- [x] All controllers atomic via `prisma.$transaction`
- [x] Server-side salary tax computation (PF 12%, TDS 10%)
- [x] Invoice GST/TDS auto-split engine
- [x] Zod validation on all POST/PATCH routes
- [x] Transaction ledger locked down (append-only, no public POST)
- [x] Auth hardened (role enforcement, rate limiting, Zod)
- [x] 13 database indexes pushed to Neon DB
- [x] Budget overspend protection (backend reject + frontend warning)
- [x] Response caching on dashboard overview (5 min TTL, auto-invalidation)
- [x] Salary form synced with backend (`grossAmount`, PF/TDS table columns)
- [x] Critical bugs fixed (studentPayment imports, utilisation status check)

---

## 🔧 Backend — Remaining Work

### P0: Core Business Logic

#### 1. AWS S3 File Uploads for Utilisation Proofs
The `Utilisation` model already has a `proofFileUrl` field, but no upload logic exists.
- [ ] Install `multer` and `@aws-sdk/client-s3`
- [ ] Create upload middleware at `backend/src/middleware/upload.js`
- [ ] Update `utilisation.controller.js` → `submitUtilisation` to accept multipart form data
- [ ] Upload PDF/image to S3, store the returned URL in `proofFileUrl`
- [ ] Add file size limits (max 10MB) and type restrictions (PDF, PNG, JPG only)

#### 2. Payment Gateway Integration (Razorpay/PayU)
Students currently pay offline. The SRS requires online payment collection.
- [ ] Create `backend/src/controllers/payment.controller.js` with Razorpay/PayU integration
- [ ] Add `POST /finance/payments/create-order` to generate a payment link
- [ ] Add `POST /finance/webhooks/payment` to receive payment confirmations
- [ ] On successful payment → atomically update `StudentPayment` + create `FEE_COLLECTION` transaction
- [ ] Add webhook signature verification to prevent spoofed callbacks

#### 3. TallyPrime XML Export API
The SRS requires seamless sync with TallyPrime (v5.1.0).
- [ ] Create `backend/src/controllers/tally.controller.js`
- [ ] Add `GET /finance/tally/export?startDate=...&endDate=...` endpoint
- [ ] Fetch all `SUCCESS` transactions in the date range
- [ ] Map each transaction to TallyPrime XML format (Journal Voucher / Day Book entry)
- [ ] Return downloadable XML file

---

### P1: Data Integrity & Compliance

#### 4. Centralized Audit Logger Service
Currently, audit logging is manually duplicated in each controller.
- [ ] Create `backend/src/services/auditLogger.js`:
  ```js
  async function logAudit(tx, { action, entity, entityId, performedBy, details }) { ... }
  ```
- [ ] Refactor all controllers to use this shared service
- [ ] Add `GET /finance/audit-logs` endpoint for compliance officers to search/filter logs
- [ ] Support filtering by entity, action, performer, and date range

#### 5. Soft Delete for Sensitive Records
Financial records should never be hard-deleted.
- [ ] Add `deletedAt DateTime?` field to `Requisition`, `Invoice`, `DonorFund`, `Salary`
- [ ] Update all queries to filter `deletedAt IS NULL` by default
- [ ] Replace any existing `delete` operations with soft-delete (`deletedAt = now()`)

#### 6. Replace Mock Opening Balance
Dashboard currently uses hardcoded `openingBalance = 15000000`.
- [ ] Create a `SystemConfig` model or use environment variable for opening balance
- [ ] Allow Finance Officer to set the opening balance for each financial year
- [ ] Compute closing balance dynamically: `openingBalance + totalIncome - totalExpenses`

---

### P2: Performance & Scale

#### 7. Pagination on All List Endpoints
Some endpoints return all records without pagination.
- [ ] Ensure every `GET` list endpoint uses `skip`/`take` pagination
- [ ] Affected: `GET /finance/refunds`, `GET /finance/invoices`, `GET /finance/bank/guarantees`
- [ ] Frontend tables should support page navigation with prev/next buttons

#### 8. Swap node-cache → Redis (for multi-instance deployment)
Current caching uses `node-cache` (in-memory, single-process).
- [ ] Install `ioredis`
- [ ] Update `utils/cache.js` to use Redis client (API surface stays the same)
- [ ] Add `REDIS_URL` to `.env` config
- [ ] This is only needed if deploying multiple backend instances behind a load balancer

#### 9. Background Job Queue (BullMQ)
Long-running tasks shouldn't block the API.
- [ ] Install `bullmq` with Redis as the backing store
- [ ] Move Form 16 PDF generation to a background job
- [ ] Move email notifications (approval/rejection alerts) to a background job

---

## 🎨 Frontend — Remaining Work

### P0: Must Fix

#### 10. File Upload Component (Utilisations)
- [ ] Build a drag-and-drop dropzone component for PDF/image uploads
- [ ] Wire it into the Utilisation submission form
- [ ] Show uploaded file preview with a download link after submission

### P1: Export & Reporting

#### 11. Excel/CSV Export
- [ ] Install `xlsx` or `papaparse`
- [ ] Add "Download CSV" button to: Transactions, Receivables, Payables tables
- [ ] Generate client-side Excel files with formatted headers

#### 12. PDF Generation
- [ ] Install `jspdf` or `@react-pdf/renderer`
- [ ] Wire the "Generate PDF" button on Form 16 / Invoice pages
- [ ] Generate downloadable, printable PDF documents

### P2: UX Polish

#### 13. Toast Notifications
- [ ] Install `react-hot-toast`
- [ ] Add global toast system for success/error messages on all actions

#### 14. Mobile Responsive Tables
- [ ] Implement responsive table strategy (card view on mobile)
- [ ] Test on common mobile screen sizes

#### 15. Actionable Dashboard Badges
- [ ] Make "Pending Approvals" count clickable → navigate to filtered Requisitions list
- [ ] Make "Pending Refunds" count clickable → navigate to filtered Refunds list

---

## 🔗 Inter-Vertical API Contracts

Before other ASAP verticals integrate, these contracts must be documented:

| Vertical | Calls Finance API | Purpose |
|----------|-------------------|---------|
| **Training** | `POST /finance/student-payments` | Register a student fee record |
| **Training** | `PATCH /finance/student-payments/:id/installment` | Record an installment payment |
| **All Verticals** | `POST /finance/requisitions` | Request funds for a project |
| **All Verticals** | `POST /finance/utilisations` | Submit proof of spending |
| **Fund Raising** | `POST /finance/donors` | Log a donor contribution |
| **Payment Gateway** | `POST /finance/webhooks/payment` | Confirm online student payment |

> **Action Item:** Generate Swagger/OpenAPI docs using `swagger-jsdoc` so other teams have a self-service API reference.

---

## 🏗️ Infrastructure & DevOps

| Task | Priority | Notes |
|------|----------|-------|
| CI/CD pipeline (GitHub Actions) | P0 | Auto-run `prisma generate` + `npm test` on every PR |
| Production `.env` config | P0 | Switch from dev JWT secret to a strong 256-bit key |
| HTTPS with SSL certificate | P0 | Required for IT Act 2000 compliance |
| CORS for production domain | P0 | Replace `localhost:5173` with actual domain |
| Error monitoring (Sentry) | P1 | Capture unhandled exceptions in production |
| Log aggregation (Winston + CloudWatch) | P1 | Centralized logging for debugging |
| Load testing (k6 / Artillery) | P2 | Validate 10,000+ concurrent user support |

---

## ✅ Handoff Checklist

- [ ] All P0 backend items completed
- [ ] Seed script updated for new fields (`grossAmount`, `pfAmount`, etc.)
- [ ] All API endpoints documented in Swagger
- [ ] `.env.example` updated with all required environment variables
- [ ] Database backup strategy configured on Neon
- [ ] README updated with setup instructions for new developers
- [ ] CHANGELOG.md reviewed and committed
