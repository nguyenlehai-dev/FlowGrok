import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSystemAuth } from '../auth/SystemAuthContext';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import '../components/admin/admin.css';

export default function MainLayout() {
  const location = useLocation();
  const { isVerified, isVerifying } = useSystemAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const shouldLockContent =
    !isVerifying &&
    !isVerified &&
    (location.pathname === '/profiles' ||
      location.pathname.startsWith('/profiles/') ||
      location.pathname === '/api-docs');

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  return (
    <div className="admin-app">
      <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
      <main className="admin-main">
        <Topbar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        {shouldLockContent ? (
          <div className="admin-locked-shell">
            <div className="admin-locked-backdrop" />
            <div className="admin-locked-card">
              <h2 className="admin-locked-title">Verification Required</h2>
              <p className="admin-locked-text">No Gateway API Key is active in this browser.</p>
              <p className="admin-locked-text">Create or copy a key from API Keys, then open System Auth and click Verify.</p>
              <a href="/api-keys" className="admin-btn admin-btn-primary">
                Go to API Keys
              </a>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
