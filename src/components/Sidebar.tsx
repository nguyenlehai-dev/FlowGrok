import { CircleDot, LogOut, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSystemAuth } from '../auth/SystemAuthContext';
import SidebarMenuLink from '../modules/navigation/components/SidebarMenuLink';
import { sidebarModules } from '../modules/navigation/configs/sidebarMenus';
import { useAuthStore } from '../store/authStore';

type SidebarProps = {
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { clearKey } = useSystemAuth();
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearKey();
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className={`admin-mobile-overlay ${mobileOpen ? 'is-open' : ''}`} onClick={onCloseMobile} />
      <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-brand-main">
            <div className="admin-brand-mark" />
            <span className="admin-brand-text">FlowGrok</span>
          </div>
          <div className="admin-brand-actions">
            <span className="admin-brand-dot"><CircleDot size={10} /></span>
            <button type="button" className="admin-sidebar-close" onClick={onCloseMobile} aria-label="Close menu">
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="admin-nav">
          {sidebarModules.map((module) => (
            <SidebarMenuLink key={module.id} module={module} onNavigate={onCloseMobile} />
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-user-avatar">{user?.email?.[0] || '?'}</div>
            <div>
              <div className="admin-user-name">{user?.email}</div>
              <div className="admin-user-role">{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="admin-logout">
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}
