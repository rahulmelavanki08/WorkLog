import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import RoleGuard from './components/RoleGuard';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Worker Pages
import WorkerDashboard from './pages/worker/WorkerDashboard';
import FindWork from './pages/worker/FindWork';
import MyApplications from './pages/worker/MyApplications';
import WorkerCheckIn from './pages/worker/WorkerCheckIn';
import WageLedger from './pages/worker/WageLedger';
import DisputeReportPage from './pages/worker/DisputeReportPage';

// Contractor Pages
import ContractorDashboard from './pages/contractor/ContractorDashboard';
import NewSite from './pages/contractor/NewSite';
import PostJob from './pages/contractor/PostJob';
import ManageJobs from './pages/contractor/ManageJobs';
import ConfirmAttendance from './pages/contractor/ConfirmAttendance';
import PaymentLogging from './pages/contractor/PaymentLogging';
import ContractorSafetyReports from './pages/contractor/ContractorSafetyReports';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminLinks from './pages/admin/AdminLinks';

function RootRedirect() {
  const { user, role, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (role === 'WORKER') return <Navigate to="/worker/dashboard" replace />;
  if (role === 'CONTRACTOR') return <Navigate to="/contractor/dashboard" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
          <Navbar />
          <main className="flex-1 pb-12">
            <Routes>
              {/* Root */}
              <Route path="/" element={<RootRedirect />} />

              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Worker Routes */}
              <Route
                path="/worker/dashboard"
                element={
                  <RoleGuard allowedRoles={['WORKER']}>
                    <WorkerDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/worker/find-work"
                element={
                  <RoleGuard allowedRoles={['WORKER']}>
                    <FindWork />
                  </RoleGuard>
                }
              />
              <Route
                path="/worker/my-applications"
                element={
                  <RoleGuard allowedRoles={['WORKER']}>
                    <MyApplications />
                  </RoleGuard>
                }
              />
              <Route
                path="/worker/checkin"
                element={
                  <RoleGuard allowedRoles={['WORKER']}>
                    <WorkerCheckIn />
                  </RoleGuard>
                }
              />
              <Route
                path="/worker/ledger"
                element={
                  <RoleGuard allowedRoles={['WORKER']}>
                    <WageLedger />
                  </RoleGuard>
                }
              />
              <Route
                path="/worker/report"
                element={
                  <RoleGuard allowedRoles={['WORKER']}>
                    <DisputeReportPage />
                  </RoleGuard>
                }
              />

              {/* Contractor Routes */}
              <Route
                path="/contractor/dashboard"
                element={
                  <RoleGuard allowedRoles={['CONTRACTOR']}>
                    <ContractorDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/contractor/site/new"
                element={
                  <RoleGuard allowedRoles={['CONTRACTOR']}>
                    <NewSite />
                  </RoleGuard>
                }
              />
              <Route
                path="/contractor/post-job"
                element={
                  <RoleGuard allowedRoles={['CONTRACTOR']}>
                    <PostJob />
                  </RoleGuard>
                }
              />
              <Route
                path="/contractor/manage-jobs"
                element={
                  <RoleGuard allowedRoles={['CONTRACTOR']}>
                    <ManageJobs />
                  </RoleGuard>
                }
              />
              <Route
                path="/contractor/confirm"
                element={
                  <RoleGuard allowedRoles={['CONTRACTOR']}>
                    <ConfirmAttendance />
                  </RoleGuard>
                }
              />
              <Route
                path="/contractor/safety-reports"
                element={
                  <RoleGuard allowedRoles={['CONTRACTOR']}>
                    <ContractorSafetyReports />
                  </RoleGuard>
                }
              />
              <Route
                path="/contractor/payments"
                element={
                  <RoleGuard allowedRoles={['CONTRACTOR']}>
                    <PaymentLogging />
                  </RoleGuard>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/disputes"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <AdminDisputes />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/links"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <AdminLinks />
                  </RoleGuard>
                }
              />

              {/* Catch all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
