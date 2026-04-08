export type DashboardStats = {
  profiles: number;
  proxies: number;
};

export type DashboardCard = {
  label: string;
  value: number | string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
};
