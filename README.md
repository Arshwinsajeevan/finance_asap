# ASAP Kerala - Unified Finance Module

This is the central financial management system built for ASAP Kerala. It manages budgets, internal requisitions, salaries, student fees, and external donor funds across all verticals in a secure, role-based environment.

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

### 1. Finance Officer (Full Access)
* **Email:** `finance@asapkerala.gov.in`
* **Role:** Can approve requisitions, manage budgets, verify utilisations, and record manual transactions.

### 2. Vertical User (Restricted Access)
* **Email:** `training@asapkerala.gov.in`
* **Role:** A department head (Training vertical). Can only view their own dashboard, raise requests for money, and submit expense bills.

### 3. Admin / Auditor (Read-Only)
* **Email:** `admin@asapkerala.gov.in`
* **Role:** Has full visibility over all financial data, reports, and dashboards, but cannot make any changes or approve funds.

---

## 🛠️ Technology Stack
* **Frontend:** React.js (Vite), Tailwind CSS, React Router
* **Backend:** Node.js, Express.js, Prisma ORM
* **Database:** SQLite (Configured for easy local testing, can be swapped to PostgreSQL)
* **Security:** JWT Authentication, bcrypt password hashing
