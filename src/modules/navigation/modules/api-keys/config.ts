import { KeyRound } from 'lucide-react';
import type { SidebarModule } from '../../models/sidebar';

export const apiKeysModule: SidebarModule = {
  id: 'api-keys',
  label: 'API Keys',
  icon: KeyRound,
  to: '/api-keys',
};
