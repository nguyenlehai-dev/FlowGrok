import { useEffect, useState } from 'react';
import { Activity, Globe, Key, Users } from 'lucide-react';
import { profileApi, proxyApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ profiles: 0, proxies: 0 });

  useEffect(() => {
    Promise.all([profileApi.list(), proxyApi.list()]).then(([profiles, proxies]) => {
      setStats({ profiles: profiles.data.length, proxies: proxies.data.length });
    });
  }, []);

  const cards = [
    { label: 'Profiles', value: stats.profiles, icon: Users, color: 'from-violet-500 to-violet-700' },
    { label: 'Proxies', value: stats.proxies, icon: Globe, color: 'from-cyan-500 to-cyan-700' },
    { label: 'API Keys', value: '—', icon: Key, color: 'from-amber-500 to-orange-500' },
    { label: 'Status', value: 'Online', icon: Activity, color: 'from-emerald-500 to-emerald-700' },
  ];

  return (
    <div className="admin-page-card">
      <div className="admin-page-inner">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">Xin chào, {user?.email}. Đây là tổng quan hệ thống FlowGrok của bạn.</p>
      </div>

      <div className="admin-filters">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-[#ece8f5] bg-white p-5 shadow-[0_8px_20px_rgba(47,43,61,0.04)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#8f8aa3]">{card.label}</p>
                  <p className="mt-1 text-3xl font-bold text-[#3f3957]">{card.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-white`}>
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-toolbar">
        <input className="admin-input max-w-[240px]" placeholder="Search Product" />
        <div className="admin-toolbar-actions">
          <button className="admin-btn admin-btn-muted">Export</button>
          <a href="/profiles" className="admin-btn admin-btn-primary">+ Tạo Profile mới</a>
          <a href="/proxies" className="admin-btn admin-btn-primary">+ Thêm Proxy</a>
          <a href="/api-keys" className="admin-btn admin-btn-primary">+ Sinh API Key</a>
        </div>
      </div>

      <div className="admin-table-footer border-0 pt-0">
        <span>Everything is ready for profile, proxy and key management.</span>
      </div>
    </div>
  );
}
