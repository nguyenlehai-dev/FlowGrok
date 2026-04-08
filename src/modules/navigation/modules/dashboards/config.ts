import { LayoutDashboard } from 'lucide-react';
import type { SidebarModule } from '../../models/sidebar';

export const dashboardsModule: SidebarModule = {
  id: 'dashboards',
  label: 'Dashboards',
  icon: LayoutDashboard,
  to: '/',
};
