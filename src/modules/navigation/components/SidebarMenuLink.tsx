import { NavLink, useLocation } from 'react-router-dom';
import type { SidebarModule } from '../models/sidebar';

type SidebarMenuLinkProps = {
  module: SidebarModule;
  onNavigate: () => void;
};

export default function SidebarMenuLink({ module, onNavigate }: SidebarMenuLinkProps) {
  const location = useLocation();
  const isRouteActive = module.to ? location.pathname === module.to : false;
  const Icon = module.icon;

  return (
    <NavLink
      to={module.disabled ? '#' : module.to || '#'}
      className={({ isActive }) => `admin-nav-item admin-nav-item-single ${((isActive && !module.disabled) || isRouteActive) ? 'is-active' : ''}`}
      onClick={onNavigate}
    >
      <span className="admin-nav-main">
        <Icon size={18} />
        <span>{module.label}</span>
      </span>
      {module.badge ? (
        <span className="admin-nav-tail">
          <span className="admin-nav-badge">{module.badge}</span>
        </span>
      ) : null}
    </NavLink>
  );
}
