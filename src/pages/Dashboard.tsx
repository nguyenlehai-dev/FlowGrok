import { useEffect, useState } from 'react';
import { profileApi, proxyApi } from '../api/client';
import { Users, Globe, Key, Activity } from 'lucide-react';
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
    { label: 'Profiles', value: stats.profiles, icon: Users, color: 'from-violet-500 to-violet-700', shadow: 'shadow-violet-500/20' },
    { label: 'Proxies', value: stats.proxies, icon: Globe, color: 'from-cyan-500 to-cyan-700', shadow: 'shadow-cyan-500/20' },
    { label: 'API Keys', value: '—', icon: Key, color: 'from-amber-500 to-amber-700', shadow: 'shadow-amber-500/20' },
    { label: 'Trạng thái', value: 'Online', icon: Activity, color: 'from-emerald-500 to-emerald-700', shadow: 'shadow-emerald-500/20' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
        <p className="text-gray-500 mt-1">Xin chào, <span className="text-violet-400">{user?.email}</span></p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-xl bg-gray-900/70 border border-gray-800 p-5 shadow-lg ${card.shadow} hover:border-gray-700 transition-all duration-300 group`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{card.label}</p>
                <p className="text-3xl font-bold text-gray-100 mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            {/* Decorative gradient */}
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br ${card.color} rounded-full opacity-10 blur-2xl`} />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-900/70 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Bắt đầu nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/profiles" className="px-4 py-3 rounded-lg bg-violet-600/10 border border-violet-500/30 text-violet-400 text-sm font-medium hover:bg-violet-600/20 transition-all text-center">
            + Tạo Profile mới
          </a>
          <a href="/proxies" className="px-4 py-3 rounded-lg bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:bg-cyan-600/20 transition-all text-center">
            + Thêm Proxy
          </a>
          <a href="/api-keys" className="px-4 py-3 rounded-lg bg-amber-600/10 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-600/20 transition-all text-center">
            + Sinh API Key
          </a>
        </div>
      </div>
    </div>
  );
}
