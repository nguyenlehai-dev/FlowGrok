import { BookText } from 'lucide-react';
import type { SidebarModule } from '../../models/sidebar';

export const apiDocsModule: SidebarModule = {
  id: 'api-docs',
  label: 'API Docs',
  icon: BookText,
  to: '/api-docs',
};
