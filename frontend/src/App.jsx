import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import RequisitionsPage from './pages/RequisitionsPage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetPage from './pages/BudgetPage';
import SalariesPage from './pages/SalariesPage';
import DonorFundsPage from './pages/DonorFundsPage';
import BankRecordsPage from './pages/BankRecordsPage';
import ReportsPage from './pages/ReportsPage';
import AdminDashboard from './pages/AdminDashboard';
import StudentPaymentsPage from './pages/StudentPaymentsPage';
import RefundsPage from './pages/RefundsPage';
import UtilisationPage from './pages/UtilisationPage';

// Placeholder components for routes not yet implemented
const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      <p className="text-slate-500 mt-2">This page is under construction.</p>
    </div>
  </div>
);

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />; // Redirect to login if unauthorized
  }

  return children;
};

const AdminOrOverview = () => {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <AdminDashboard /> : <OverviewPage />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<PrivateRoute allowedRoles={['FINANCE_OFFICER', 'ADMIN']}><DashboardLayout /></PrivateRoute>}>
        <Route index element={<AdminOrOverview />} />

        <Route path="budget" element={<BudgetPage />} />
        <Route path="requisitions" element={<RequisitionsPage />} />
        <Route path="utilisations" element={<UtilisationPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="salaries" element={<SalariesPage />} />
        <Route path="donors" element={<DonorFundsPage />} />
        <Route path="bank" element={<BankRecordsPage />} />
        <Route path="fee-collections" element={<StudentPaymentsPage />} />
        <Route path="refunds" element={<RefundsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
