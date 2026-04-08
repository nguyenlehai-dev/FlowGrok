import type { LucideIcon } from 'lucide-react';

export type SidebarChildItem = {
  label: string;
  to?: string;
};

export type SidebarModule = {
  id: string;
  label: string;
  icon: LucideIcon;
  to?: string;
  badge?: string;
  disabled?: boolean;
  children?: SidebarChildItem[];
};
