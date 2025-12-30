import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { AdminProvider } from './context/AdminContext';
import useAdmin from './hooks/useAdmin';
import Layout from './components/layout/Layout';
import AdminLayout from './components/admin/AdminLayout';

// Lazy load pages for better performance
const Login = React.lazy(() => import('./pages/auth/Login'));
const Dashboard = React.lazy(() => import('./pages/ib_users/Dashboard'));
const PipCalculator = React.lazy(() => import('./pages/ib_users/PipCalculator'));
const MyClients = React.lazy(() => import('./pages/ib_users/MyClients'));
const MyCommission = React.lazy(() => import('./pages/ib_users/MyCommission'));
const Withdrawals = React.lazy(() => import('./pages/ib_users/payments/Withdrawal'));
const WithdrawalHistory = React.lazy(() => import('./pages/ib_users/payments/WithdrawalHistory'));
const Clients = React.lazy(() => import('./pages/ib_users/Clients'));
const ClientAccounts = React.lazy(() => import('./pages/ib_users/ClientAccounts'));
const RewardHistory = React.lazy(() => import('./pages/ib_users/RewardHistory'));
const ClientTransactions = React.lazy(() => import('./pages/ib_users/ClientTransactions'));
const TransactionsPending = React.lazy(() => import('./pages/ib_users/TransactionsPending'));
const PerformanceStatistics = React.lazy(() => import('./pages/ib_users/PerformanceStatistics'));
const ClaimRewards = React.lazy(() => import('./pages/ib_users/ClaimRewards'));

// Admin pages
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./pages/admin/IBDashboard'));
const IBOverview = React.lazy(() => import('./pages/admin/ib-management/IBOverview'));
const IBRequests = React.lazy(() => import('./pages/admin/ib-management/IBRequests'));
const IBProfiles = React.lazy(() => import('./pages/admin/ib-management/IBProfiles'));
const TradersProfile = React.lazy(() => import('./pages/admin/ib-management/TradersProfile'));
const IBProfileDetails = React.lazy(() => import('./pages/admin/ib-management/IBProfileDetails'));
const Groups = React.lazy(() => import('./pages/admin/ib-management/Groups'));
const GroupCommissions = React.lazy(() => import('./pages/admin/ib-management/GroupCommissions'));
const CommissionStructures = React.lazy(() => import('./pages/admin/ib-management/CommissionStructures'));
const AllSymbols = React.lazy(() => import('./pages/admin/ib-management/AllSymbols'));
const SymbolsPipValues = React.lazy(() => import('./pages/admin/trading-management/SymbolsPipValues'));
const IBWithdrawals = React.lazy(() => import('./pages/admin/trading-management/IBWithdrawals'));
const ClientLinking = React.lazy(() => import('./pages/admin/trading-management/ClientLinking'));
const CommissionDistribution = React.lazy(() => import('./pages/admin/group-management/CommissionDistribution'));
const Promotions = React.lazy(() => import('./pages/admin/content-management/Promotions'));
const HelpSupport = React.lazy(() => import('./pages/admin/content-management/HelpSupport'));
const ClaimedRewards = React.lazy(() => import('./pages/admin/rewards/ClaimedRewards'));
const IBReports = React.lazy(() => import('./pages/admin/reports/IBReports'));
const WithdrawalHistoryReports = React.lazy(() => import('./pages/admin/reports/WithdrawalHistoryReports'));


// Placeholder components for other pages (to be implemented)
const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600">404-Not Found</p>
    </div>
  </div>
);

const AdminPlaceholder = ({ title }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600">404-Not Found</p>
    </div>
  </div>
);

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user } = useApp();
  
  if (!user.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { user } = useApp();
  
  if (user.isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AdminProtectedRoute = ({ children }) => {
  const { adminUser } = useAdmin();
  // Fallback to token presence on initial load so reload doesn't bounce
  let hasToken = false;
  try {
    hasToken = Boolean(localStorage.getItem('adminToken') || localStorage.getItem('admin_token'));
  } catch {}

  if (!adminUser.isAuthenticated && !hasToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

const AdminPublicRoute = ({ children }) => {
  const { adminUser } = useAdmin();

  if (adminUser.isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => (
  <AdminProtectedRoute>
    <AdminLayout>
      <PageTransition>{children}</PageTransition>
    </AdminLayout>
  </AdminProtectedRoute>
);

// Page transition wrapper
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6242a5]"></div>
  </div>
);

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <PageTransition>
                <Login />
              </PageTransition>
            </PublicRoute>
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Dashboard />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* New IB Portal Routes */}
        <Route 
          path="/pip-calculator" 
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <PipCalculator />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-clients" 
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <MyClients />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-commission" 
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <MyCommission />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/withdrawals" 
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Withdrawals />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/withdrawal-history" 
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <WithdrawalHistory />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/clients" 
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Clients />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/client-accounts" 
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <ClientAccounts />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reward-history" 
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <RewardHistory />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/client-transactions" 
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <ClientTransactions />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/transactions-pending" 
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <TransactionsPending />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/performance-statistics" 
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <PerformanceStatistics />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/claim-rewards" 
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <ClaimRewards />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Admin Routes */}
        <Route
          path="/admin/login"
          element={
            <AdminPublicRoute>
              <PageTransition>
                <AdminLogin />
              </PageTransition>
            </AdminPublicRoute>
          }
        />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/ib-management" element={<AdminRoute><IBOverview /></AdminRoute>} />
        <Route path="/admin/ib-management/requests" element={<AdminRoute><IBRequests /></AdminRoute>} />
        <Route path="/admin/ib-management/profiles" element={<AdminRoute><IBProfiles /></AdminRoute>} />
        <Route path="/admin/ib-management/profiles/:id" element={<AdminRoute><IBProfileDetails /></AdminRoute>} />
        <Route path="/admin/ib-management/traders" element={<AdminRoute><TradersProfile /></AdminRoute>} />
        <Route path="/admin/ib-management/commissions" element={<AdminRoute><Groups /></AdminRoute>} />
        <Route path="/admin/ib-management/commissions/*" element={<AdminRoute><GroupCommissions /></AdminRoute>} />
        <Route path="/admin/ib-management/commission-structures" element={<AdminRoute><CommissionStructures /></AdminRoute>} />
        <Route path="/admin/ib-management/all-symbols" element={<AdminRoute><AllSymbols /></AdminRoute>} />
        <Route path="/admin/trading-management" element={<AdminRoute><SymbolsPipValues /></AdminRoute>} />
        <Route path="/admin/trading-management/symbols" element={<AdminRoute><SymbolsPipValues /></AdminRoute>} />
        <Route path="/admin/trading-management/ib-withdrawals" element={<AdminRoute><IBWithdrawals /></AdminRoute>} />
        <Route path="/admin/reports/withdrawal-history" element={<AdminRoute><WithdrawalHistoryReports /></AdminRoute>} />
        <Route path="/admin/trading-management/client-linking" element={<AdminRoute><ClientLinking /></AdminRoute>} />
        <Route path="/admin/group-management/commission-distribution" element={<AdminRoute><CommissionDistribution /></AdminRoute>} />
        <Route path="/admin/financial-management" element={<AdminRoute><AdminPlaceholder title="Financial Management" /></AdminRoute>} />
        <Route path="/admin/content-management" element={<AdminRoute><Promotions /></AdminRoute>} />
        <Route path="/admin/content-management/promotions" element={<AdminRoute><Promotions /></AdminRoute>} />
        <Route path="/admin/content-management/support" element={<AdminRoute><HelpSupport /></AdminRoute>} />
        <Route path="/admin/rewards/claims" element={<AdminRoute><ClaimedRewards /></AdminRoute>} />
        <Route path="/admin/ib-reports" element={<AdminRoute><IBReports /></AdminRoute>} />
        {/* Live chat route removed */}
        <Route path="/admin/*" element={<AdminRoute><AdminPlaceholder title="Admin Section" /></AdminRoute>} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AppProvider>
      <AdminProvider>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
      </AdminProvider>
    </AppProvider>
  );
}

export default App;
