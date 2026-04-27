# ASAP Kerala - Unified Finance Module

This is the strictly-controlled, central financial management system built for ASAP Kerala. It acts as an audit-compliant hub for managing budgets, internal requisitions, salaries, GST invoices, student fee tracking, and external donor funds across all verticals in a highly secure, role-based environment.

## 🚀 How to Run the Project Locally

Follow these steps to run the application on your machine.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher is recommended).

### 1. Backend Setup & Start
Open a terminal and navigate to the `backend` folder:
```bash
cd backend
```

Install the required dependencies:
```bash
npm install
```

Set up the database and generate the initial demo data:
```bash
npx prisma generate
npx prisma db push
npm run seed
```

Start the backend server:
```bash
npm run dev
```
*The backend will now be running on `http://localhost:5000`*

---

### 2. Frontend Setup & Start
Open a **new** terminal window and navigate to the `frontend` folder:
```bash
cd frontend
```

Install the required dependencies:
```bash
npm install
```

Start the frontend React application:
```bash
npm run dev
```
*The frontend will open in your browser, usually at `http://localhost:5173`*

---

## 🔑 Demo Login Credentials

To test the different access levels and Role-Based Access Control (RBAC), you can use the following pre-configured demo accounts. 

**Note: The password for all accounts is exactly the same.**

* **Password for ALL accounts:** `password123`

### 1. Finance Officer (Operations)
* **Email:** `finance@asapkerala.gov.in`
* **Role:** The core operators. Can approve requisitions, release budgets, verify utilisations, generate GST invoices, process refunds, and record payments. They cannot manually invent transactions; everything is workflow-driven.

### 2. Vertical User (Restricted Access)
* **Email:** `training@asapkerala.gov.in`
* **Role:** A department head (Training vertical). Can only view their own dashboard, raise requests for funds, and submit expense bills.

### 3. Admin / Auditor (Read-Only Oversight)
* **Email:** `admin@asapkerala.gov.in`
* **Role:** Has full visibility over the "Admin Oversight Panel", global ledgers, and reports. They are 100% read-only and cannot make any changes or approve funds, ensuring absolute audit integrity.

---

## 🛠️ Technology Stack
* **Frontend:** React.js (Vite), Tailwind CSS, React Router, Lucide Icons
* **Backend:** Node.js, Express.js, Prisma ORM
* **Database:** SQLite (Configured for easy local testing, can be swapped to PostgreSQL)
* **Security:** JWT Authentication, bcrypt password hashing, Strict RBAC Middleware
