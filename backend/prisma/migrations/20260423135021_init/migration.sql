-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VERTICAL_USER',
    "vertical" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Requisition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vertical" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "purpose" TEXT NOT NULL,
    "description" TEXT,
    "financialYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionNote" TEXT,
    "approvedAmount" REAL,
    "releasedAmount" REAL,
    "raisedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Requisition_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Requisition_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vertical" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "allocated" REAL NOT NULL DEFAULT 0,
    "used" REAL NOT NULL DEFAULT 0,
    "released" REAL NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Salary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeType" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "employeeId" TEXT,
    "vertical" TEXT,
    "amount" REAL NOT NULL,
    "month" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentDate" DATETIME,
    "reference" TEXT,
    "commission" REAL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Salary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DonorFund" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donorName" TEXT NOT NULL,
    "donorType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "amount" REAL NOT NULL,
    "vertical" TEXT,
    "project" TEXT,
    "purpose" TEXT,
    "reference" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BankRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryType" TEXT NOT NULL,
    "bankName" TEXT,
    "accountNo" TEXT,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "validFrom" DATETIME,
    "validUntil" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StudentPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "totalFee" REAL NOT NULL,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "installmentNo" INTEGER NOT NULL DEFAULT 1,
    "paymentType" TEXT NOT NULL DEFAULT 'FEE',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentPayment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "performedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_vertical_financialYear_key" ON "Budget"("vertical", "financialYear");
