import { MonitorCog } from 'lucide-react';
import type { SidebarModule } from '../../models/sidebar';

export const localAgentModule: SidebarModule = {
  id: 'local-agent',
  label: 'Local Agent',
  icon: MonitorCog,
  to: '/local-agent-test',
  badge: 'Test',
};
