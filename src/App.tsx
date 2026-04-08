import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import MainLayout from './layouts/MainLayout';
import LoginView from './modules/auth/views/LoginView';
import DashboardView from './modules/dashboard/views/DashboardView';
import JobsView from './modules/jobs/views/JobsView';
import ProfileDetailView from './modules/profiles/views/ProfileDetailView';
import ProfilesView from './modules/profiles/views/ProfilesView';
import ProxiesView from './modules/proxies/views/ProxiesView';
import ApiKeysView from './modules/api-keys/views/ApiKeysView';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
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
          <Route path="/profiles" element={<ProfilesView />} />
          <Route path="/profiles/:profileId" element={<ProfileDetailView />} />
          <Route path="/proxies" element={<ProxiesView />} />
          <Route path="/api-keys" element={<ApiKeysView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
