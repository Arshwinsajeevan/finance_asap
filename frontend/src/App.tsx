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
import InvoicesPage from './pages/InvoicesPage';
import TaxationPage from './pages/TaxationPage';
import PettyCashPage from './pages/PettyCashPage';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />; // Redirect to login if unauthorized
  }

  return <>{children}</>;
};

const AdminOrOverview: React.FC = () => {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <AdminDashboard /> : <OverviewPage />;
};

const AppRoutes: React.FC = () => {
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
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="taxation" element={<TaxationPage />} />
        <Route path="petty-cash" element={<PettyCashPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
