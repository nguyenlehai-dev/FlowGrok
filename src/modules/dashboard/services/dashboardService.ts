import { authApi, profileApi, proxyApi, systemApi } from '../../../api/client';
import type { DashboardStats } from '../models/dashboard';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [profiles, proxies, apiKeys, health] = await Promise.all([
    profileApi.list(),
    proxyApi.list(),
    authApi.listApiKeys(),
    systemApi.health(),
  ]);
  return {
    profiles: profiles.data.length,
    proxies: proxies.data.length,
    apiKeys: apiKeys.data.length,
    status: health.data.status,
    databaseDialect: health.data.database.dialect,
    databaseUrl: health.data.database.url,
  };
}
