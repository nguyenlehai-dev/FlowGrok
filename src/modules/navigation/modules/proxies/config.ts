import { Globe } from 'lucide-react';
import type { SidebarModule } from '../../models/sidebar';

export const proxiesModule: SidebarModule = {
  id: 'proxies',
  label: 'Proxies',
  icon: Globe,
  to: '/proxies',
};
