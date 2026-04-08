import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { proxyApi } from '../api/client';
import { Plus, Trash2, Wifi } from 'lucide-react';

interface Proxy {
  id: string;
  ip: string;
  port: number;
  username: string | null;
  password: string | null;
  status: string;
  created_at: string;
}

export default function ProxiesPage() {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const fetchProxies = async () => {
    const res = await proxyApi.list();
    setProxies(res.data);
  };

  useEffect(() => { fetchProxies(); }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await proxyApi.create({ ip, port: parseInt(port), username: username || null, password: password || null });
    setIp(''); setPort(''); setUsername(''); setPassword('');
    setShowForm(false);
    fetchProxies();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa proxy này?')) return;
    await proxyApi.remove(id);
    fetchProxies();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Quản lý Proxies</h1>
          <p className="text-gray-500 text-sm mt-1">Kho IP dùng cho Antidetect Browser</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-cyan-500 hover:to-blue-400 shadow-lg shadow-cyan-500/20 transition-all">
          <Plus className="w-4 h-4" />
          Thêm Proxy
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-gray-900/80 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Thêm Proxy Mới</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">IP Address</label>
              <input value={ip} onChange={(e) => setIp(e.target.value)} required
                className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                placeholder="103.152.112.55" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Port</label>
              <input value={port} onChange={(e) => setPort(e.target.value)} required type="number"
                className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                placeholder="8080" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                placeholder="(tuỳ chọn)" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                placeholder="(tuỳ chọn)" />
            </div>
            <div className="md:col-span-4 flex gap-3">
              <button type="submit" className="px-5 py-2.5 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-500 transition-colors">Lưu Proxy</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-gray-800 text-gray-400 text-sm rounded-lg hover:bg-gray-700 transition-colors">Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gray-900/70 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Proxy</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Auth</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {proxies.map((p) => (
              <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Wifi className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-200 font-mono">{p.ip}:{p.port}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{p.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-400">
                  {p.username ? `${p.username}:***` : <span className="text-gray-600">Không</span>}
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${p.status === 'alive' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {proxies.length === 0 && (
              <tr><td colSpan={4} className="text-center py-12 text-gray-500 text-sm">Chưa có proxy nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
