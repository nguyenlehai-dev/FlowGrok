import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { profileApi } from '../api/client';
import { Plus, Trash2, Cookie } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  category: string;
  status: string;
  cookies_json: string | null;
  antidetect_settings: any;
  created_at: string;
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('grok');
  const [cookies, setCookies] = useState('');

  const fetchProfiles = async () => {
    const res = await profileApi.list();
    setProfiles(res.data);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await profileApi.create({
      name,
      category,
      cookies_json: cookies || null,
      antidetect_settings: { user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    setName(''); setCookies(''); setShowForm(false);
    fetchProfiles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa profile này?')) return;
    await profileApi.remove(id);
    fetchProfiles();
  };

  const categoryColors: Record<string, string> = {
    grok: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    flow: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dreamina: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  };

  const statusColors: Record<string, string> = {
    idle: 'bg-emerald-500/15 text-emerald-400',
    running: 'bg-yellow-500/15 text-yellow-400',
    cookie_dead: 'bg-red-500/15 text-red-400',
    error: 'bg-red-500/15 text-red-400',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Quản lý Profiles</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý các môi trường Browser Antidetect</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-medium rounded-xl hover:from-violet-500 hover:to-cyan-400 shadow-lg shadow-violet-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tạo Profile
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="mb-6 bg-gray-900/80 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Tạo Profile Mới</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tên Profile</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                placeholder="VD: Grok Account 1" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Loại (Category)</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                <option value="grok">Grok</option>
                <option value="flow">Flow</option>
                <option value="dreamina">Dreamina</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cookie JSON (tùy chọn)</label>
              <input value={cookies} onChange={(e) => setCookies(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                placeholder='{"session_id": "abc123"}' />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-500 transition-colors">
                Lưu Profile
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-gray-800 text-gray-400 text-sm rounded-lg hover:bg-gray-700 transition-colors">
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profiles Table */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cookie</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {profiles.map((p) => (
              <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-gray-200">{p.name}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{p.id.slice(0, 8)}</p>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium border ${categoryColors[p.category] || 'bg-gray-700 text-gray-300'}`}>
                    {p.category}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${statusColors[p.status] || ''}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <Cookie className={`w-4 h-4 ${p.cookies_json ? 'text-emerald-400' : 'text-gray-600'}`} />
                </td>
                <td className="px-5 py-4 text-right">
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-gray-500 text-sm">Chưa có profile nào. Hãy tạo profile đầu tiên!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
