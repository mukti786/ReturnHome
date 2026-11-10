import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MissingPersonsPage = lazy(() => import('./pages/MissingPersonsPage'));
const RegisterMissingPersonPage = lazy(() => import('./pages/RegisterMissingPersonPage'));
const CaseDetailsPage = lazy(() => import('./pages/CaseDetailsPage'));
const EditCasePage = lazy(() => import('./pages/EditCasePage'));
const LiveCameraPage = lazy(() => import('./pages/LiveCameraPage'));
const VideoAnalysisPage = lazy(() => import('./pages/VideoAnalysisPage'));
const EvidencePage = lazy(() => import('./pages/EvidencePage'));
const SubmitSightingPage = lazy(() => import('./pages/SubmitSightingPage'));
const PotentialMatchesPage = lazy(() => import('./pages/PotentialMatchesPage'));
const InvestigationTimelinePage = lazy(() => import('./pages/InvestigationTimelinePage'));
const MapViewPage = lazy(() => import('./pages/MapViewPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PublicReportPage = lazy(() => import('./pages/PublicReportPage'));
const InfoPage = lazy(() => import('./pages/InfoPage'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f7f8f6] text-slate-500 font-sans" role="status">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-[#1d5147] border-t-transparent animate-spin" />
          <span className="text-xs font-medium tracking-wide text-slate-600">Verifying session…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
};

const RoleRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const requestedPath = (location.state as { from?: string } | null)?.from;
  const destination = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/dashboard';
  return isAuthenticated ? <Navigate to={destination} replace /> : <>{children}</>;
};

const PrivatePage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const AppRoutes = () => (
  <Suspense fallback={<div className="min-h-screen grid place-items-center bg-slate-950 text-slate-400" role="status">Loading page…</div>}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/privacy" element={<InfoPage kind="privacy" />} />
      <Route path="/terms" element={<InfoPage kind="terms" />} />
      <Route path="/dashboard" element={<PrivatePage><DashboardPage /></PrivatePage>} />
      <Route path="/cases" element={<PrivatePage><MissingPersonsPage /></PrivatePage>} />
      <Route path="/cases/new" element={<PrivatePage><RegisterMissingPersonPage /></PrivatePage>} />
      <Route path="/cases/:id" element={<PrivatePage><CaseDetailsPage /></PrivatePage>} />
      <Route path="/cases/:id/edit" element={<PrivatePage><EditCasePage /></PrivatePage>} />
      <Route path="/sightings/new" element={<PrivatePage><SubmitSightingPage /></PrivatePage>} />
      <Route path="/map" element={<PrivatePage><MapViewPage /></PrivatePage>} />
      <Route path="/settings" element={<PrivatePage><SettingsPage /></PrivatePage>} />

      {/* Investigator & Analyst restricted routes */}
      <Route path="/live-camera" element={<PrivatePage><RoleRoute allowedRoles={['Admin', 'Investigator', 'Analyst']}><LiveCameraPage /></RoleRoute></PrivatePage>} />
      <Route path="/video-analysis" element={<PrivatePage><RoleRoute allowedRoles={['Admin', 'Investigator', 'Analyst']}><VideoAnalysisPage /></RoleRoute></PrivatePage>} />
      <Route path="/evidence" element={<PrivatePage><RoleRoute allowedRoles={['Admin', 'Investigator', 'Analyst']}><EvidencePage /></RoleRoute></PrivatePage>} />
      <Route path="/matches" element={<PrivatePage><RoleRoute allowedRoles={['Admin', 'Investigator', 'Analyst']}><PotentialMatchesPage /></RoleRoute></PrivatePage>} />
      <Route path="/timeline" element={<PrivatePage><RoleRoute allowedRoles={['Admin', 'Investigator', 'Analyst']}><InvestigationTimelinePage /></RoleRoute></PrivatePage>} />
      <Route path="/alerts" element={<PrivatePage><RoleRoute allowedRoles={['Admin', 'Investigator', 'Analyst']}><AlertsPage /></RoleRoute></PrivatePage>} />
      <Route path="/reports" element={<PrivatePage><RoleRoute allowedRoles={['Admin', 'Investigator', 'Analyst']}><ReportsPage /></RoleRoute></PrivatePage>} />

      {/* Administrator only routes */}
      <Route path="/users" element={<PrivatePage><RoleRoute allowedRoles={['Admin']}><UsersPage /></RoleRoute></PrivatePage>} />
      <Route path="/audit-logs" element={<PrivatePage><RoleRoute allowedRoles={['Admin', 'Investigator']}><AuditLogsPage /></RoleRoute></PrivatePage>} />
      <Route path="/public-report" element={<PublicReportPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export const App: React.FC = () => (
  <AuthProvider>
    <Router>
      <AppRoutes />
    </Router>
  </AuthProvider>
);

export default App;
