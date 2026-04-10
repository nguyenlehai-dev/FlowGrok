import { Activity, Globe, Key, Users } from 'lucide-react';
import type { DashboardCard, DashboardStats } from '../models/dashboard';

export function buildDashboardCards(stats: DashboardStats): DashboardCard[] {
  return [
    { label: 'Profiles', value: stats.profiles, icon: Users, color: 'from-violet-500 to-violet-700' },
    { label: 'Proxies', value: stats.proxies, icon: Globe, color: 'from-cyan-500 to-cyan-700' },
    { label: 'API Keys', value: stats.apiKeys, icon: Key, color: 'from-amber-500 to-orange-500' },
    { label: 'Status', value: `${stats.status} / ${stats.databaseDialect}`, icon: Activity, color: 'from-emerald-500 to-emerald-700' },
  ];
}
