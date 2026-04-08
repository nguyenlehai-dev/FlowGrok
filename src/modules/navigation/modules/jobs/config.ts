import { Bot } from 'lucide-react';
import type { SidebarModule } from '../../models/sidebar';

export const jobsModule: SidebarModule = {
  id: 'jobs',
  label: 'Jobs',
  icon: Bot,
  to: '/jobs',
};
