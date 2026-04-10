export type DashboardStats = {
  profiles: number;
  proxies: number;
  apiKeys: number;
  status: string;
  databaseDialect: string;
  databaseUrl: string;
};

export type DashboardCard = {
  label: string;
  value: number | string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
};
