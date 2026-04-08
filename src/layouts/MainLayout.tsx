import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import '../components/admin/admin.css';

export default function MainLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
        <Outlet />
      </main>
    </div>
  );
}
