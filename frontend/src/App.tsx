import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { Products } from './pages/Products';
import { StockMovements } from './pages/StockMovements';
import { Challans } from './pages/Challans';
import { CreateChallan } from './pages/CreateChallan';
import { ChallanDetail } from './pages/ChallanDetail';
import { UsersPage } from './pages/Users';
import { NotFound } from './pages/NotFound';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, token, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Authenticating session..." />;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(...(roles as any[]))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* CRM */}
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />

            {/* Inventory */}
            <Route path="products" element={<Products />} />
            <Route path="stock-movements" element={<StockMovements />} />

            {/* Sales */}
            <Route path="challans" element={<Challans />} />
            <Route path="challans/new" element={<CreateChallan />} />
            <Route path="challans/:id" element={<ChallanDetail />} />

            {/* Admin */}
            <Route
              path="users"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
