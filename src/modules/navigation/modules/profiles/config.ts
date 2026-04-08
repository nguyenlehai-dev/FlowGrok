import { Users } from 'lucide-react';
import type { SidebarModule } from '../../models/sidebar';

export const profilesModule: SidebarModule = {
  id: 'profiles',
  label: 'Profiles',
  icon: Users,
  to: '/profiles',
};
