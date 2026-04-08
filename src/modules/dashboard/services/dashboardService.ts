import { profileApi, proxyApi } from '../../../api/client';
import type { DashboardStats } from '../models/dashboard';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [profiles, proxies] = await Promise.all([profileApi.list(), proxyApi.list()]);
  return {
    profiles: profiles.data.length,
    proxies: proxies.data.length,
  };
}
