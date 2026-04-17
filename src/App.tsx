import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { SystemAuthProvider } from './auth/SystemAuthContext';
import { useAuthStore } from './store/authStore';
import MainLayout from './layouts/MainLayout';
import LoginView from './modules/auth/views/LoginView';
import ApiDocsView from './modules/api-docs/views/ApiDocsView';
import DashboardView from './modules/dashboard/views/DashboardView';
import JobsView from './modules/jobs/views/JobsView';
import LocalAgentTestView from './modules/local-agent/views/LocalAgentTestView';
import ProfileDetailView from './modules/profiles/views/ProfileDetailView';
import ProfilesView from './modules/profiles/views/ProfilesView';
import ProxiesView from './modules/proxies/views/ProxiesView';
import ApiKeysView from './modules/api-keys/views/ApiKeysView';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (isLoading) return <div className="admin-page-shell">Checking your session...</div>;
  return <>{children}</>;
}

function App() {
  const { token, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token) {
      void fetchMe();
    }
  }, [fetchMe, token]);

  return (
    <BrowserRouter>
      <SystemAuthProvider>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardView />} />
            <Route path="/jobs" element={<JobsView />} />
            <Route path="/jobs/:jobId" element={<JobsView />} />
            <Route path="/local-agent-test" element={<LocalAgentTestView />} />
            <Route path="/profiles" element={<ProfilesView />} />
            <Route path="/profiles/:profileId" element={<ProfileDetailView />} />
            <Route path="/proxies" element={<ProxiesView />} />
            <Route path="/api-keys" element={<ApiKeysView />} />
            <Route path="/api-docs" element={<ApiDocsView />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SystemAuthProvider>
    </BrowserRouter>
  );
}

export default App;
