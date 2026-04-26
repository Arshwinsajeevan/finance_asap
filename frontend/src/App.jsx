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
    return <Navigate to="/" />; // Redirect to overview if unauthorized
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
      
      <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<AdminOrOverview />} />
        
        {/* Available to vertical users too */}
        <Route path="requisitions" element={<RequisitionsPage />} />
        <Route path="utilisations" element={<UtilisationPage />} />
        
        {/* Admin / Finance Officer only */}
        <Route path="transactions" element={
          <PrivateRoute allowedRoles={['FINANCE_OFFICER', 'ADMIN']}>
            <TransactionsPage />
          </PrivateRoute>
        } />
        
        <Route path="budget" element={
          <PrivateRoute allowedRoles={['FINANCE_OFFICER', 'ADMIN']}>
            <BudgetPage />
          </PrivateRoute>
        } />
        
        <Route path="salaries" element={
          <PrivateRoute allowedRoles={['FINANCE_OFFICER', 'ADMIN']}>
            <SalariesPage />
          </PrivateRoute>
        } />
        
        <Route path="donors" element={
          <PrivateRoute allowedRoles={['FINANCE_OFFICER', 'ADMIN']}>
            <DonorFundsPage />
          </PrivateRoute>
        } />
        
        <Route path="bank" element={
          <PrivateRoute allowedRoles={['FINANCE_OFFICER', 'ADMIN']}>
            <BankRecordsPage />
          </PrivateRoute>
        } />
        
        <Route path="student-payments" element={
          <PrivateRoute allowedRoles={['FINANCE_OFFICER', 'ADMIN']}>
            <StudentPaymentsPage />
          </PrivateRoute>
        } />

        {/* Adding reports route that might not have been in sidebar originally but makes sense */}
        <Route path="reports" element={
          <PrivateRoute allowedRoles={['FINANCE_OFFICER', 'ADMIN']}>
            <ReportsPage />
          </PrivateRoute>
        } />
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
