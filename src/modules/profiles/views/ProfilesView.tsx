import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { CircleEllipsis, Cookie, Pencil, Plus, Shirt, Trash2, Watch } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProfileItem } from '../models/profile';
import { createProfile, deleteProfile, fetchProfiles } from '../services/profileService';
import { fetchProxies } from '../../proxies/services/proxyService';
import type { ProxyItem } from '../../proxies/models/proxy';

const categoryDescriptions: Record<string, string> = {
  grok: 'Cookie grok.com, Playwright auto gen image/video.',
  flow: 'Cookie Google Flow, Playwright auto gen image/video.',
  dreamina: 'Quản lý profile/category sẵn sàng mở rộng provider.',
};

export default function ProfilesView() {
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [proxies, setProxies] = useState<ProxyItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'grok' | 'flow' | 'dreamina'>('grok');
  const [proxyId, setProxyId] = useState('');
  const [cookies, setCookies] = useState('');
  const [search, setSearch] = useState('');
  const [concurrencyLimit, setConcurrencyLimit] = useState(1);

  const loadProfiles = async () => {
    setProfiles(await fetchProfiles());
  };

  const loadSupportingData = async () => {
    setProxies(await fetchProxies());
  };

  useEffect(() => {
    let active = true;

    void Promise.all([fetchProfiles(), fetchProxies()]).then(([profileData, proxyData]) => {
      if (!active) return;
      setProfiles(profileData);
      setProxies(proxyData);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await createProfile({
      name,
      description: description || null,
      category,
      proxy_id: proxyId || null,
      cookies_json: cookies || null,
      antidetect_settings: { user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      headless: category === 'grok' ? false : true,
      concurrency_limit: concurrencyLimit,
      is_enabled: true,
    });
    setName('');
    setDescription('');
    setCookies('');
    setProxyId('');
    setConcurrencyLimit(1);
    setShowForm(false);
    await Promise.all([loadProfiles(), loadSupportingData()]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa profile này?')) return;
    await deleteProfile(id);
    await loadProfiles();
  };

  const filteredProfiles = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return profiles;
    return profiles.filter((profile) =>
      [
        profile.name,
        profile.description,
        profile.category,
        profile.status,
        profile.cookie_source_type,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [profiles, search]);

  return (
    <div className="admin-page-card">
      <div className="admin-page-inner">
        <h1 className="admin-page-title">Profiles</h1>
        <p className="admin-page-subtitle">Quản lý profile theo đúng cấu trúc khách: category, cookie riêng, cache riêng, proxy, antidetect cơ bản và concurrency.</p>
      </div>

      <div className="admin-filters">
        <div className="admin-filter-title">Categories</div>
        <div className="admin-kv-list">
          <div><strong>Grok:</strong> {categoryDescriptions.grok}</div>
          <div><strong>Flow:</strong> {categoryDescriptions.flow}</div>
          <div><strong>Dreamina:</strong> {categoryDescriptions.dreamina}</div>
          <div><strong>Headless:</strong> Grok nên để <code>false</code> hoặc cấu hình CDP URL trong runtime settings; các provider khác có thể giữ <code>true</code>.</div>
        </div>
      </div>

      {showForm ? (
        <div className="admin-filters border-t-0">
          <h3 className="mb-4 text-lg font-semibold text-[#4c4761]">Tạo Profile Mới</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm text-[#8f8aa3]">Tên Profile</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="admin-input" placeholder="VD: Grok Account 1" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[#8f8aa3]">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as 'grok' | 'flow' | 'dreamina')} className="admin-select">
                <option value="grok">Grok</option>
                <option value="flow">Flow</option>
                <option value="dreamina">Dreamina</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-[#8f8aa3]">Concurrency</label>
              <input value={concurrencyLimit} min={1} onChange={(e) => setConcurrencyLimit(Number(e.target.value) || 1)} required type="number" className="admin-input" />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <label className="mb-2 block text-sm text-[#8f8aa3]">Mô tả</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="admin-input" placeholder="Mô tả vai trò profile, nguồn cookie, ghi chú proxy..." />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[#8f8aa3]">Proxy</label>
              <select value={proxyId} onChange={(e) => setProxyId(e.target.value)} className="admin-select">
                <option value="">Không gán proxy</option>
                {proxies.map((proxy) => (
                  <option key={proxy.id} value={proxy.id}>
                    {proxy.ip}:{proxy.port}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 xl:col-span-2">
              <label className="mb-2 block text-sm text-[#8f8aa3]">Cookie JSON ban đầu (tùy chọn)</label>
              <input value={cookies} onChange={(e) => setCookies(e.target.value)} className="admin-input" placeholder='[{"name":"sid","value":"...","domain":".grok.com"}]' />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <div className="rounded-2xl border border-[#ece8f5] bg-white px-4 py-3 text-sm text-[#6c6683]">
                <strong>Runtime mặc định:</strong> Grok tạo profile với <code>headless=false</code>; nếu đã có browser đang login Grok, hãy khai báo CDP URL trong màn chi tiết profile. Cookie import file chi tiết được thực hiện trong màn chi tiết profile sau khi tạo.
              </div>
            </div>
            <div className="flex gap-3 md:col-span-2 xl:col-span-3">
              <button type="submit" className="admin-btn admin-btn-primary">Lưu Profile</button>
              <button type="button" onClick={() => setShowForm(false)} className="admin-btn admin-btn-muted">Hủy</button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="admin-toolbar">
        <input className="admin-input max-w-[280px]" placeholder="Tìm theo tên, category, trạng thái..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="admin-toolbar-actions">
          <button onClick={() => setShowForm(!showForm)} className="admin-btn admin-btn-primary"><Plus className="h-4 w-4" />Add Profile</button>
        </div>
      </div>

      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="w-[50px]"><input type="checkbox" /></th>
              <th>Profile</th>
              <th>Category</th>
              <th>Status</th>
              <th>Cookie</th>
              <th>Concurrency</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map((profile) => (
              <tr key={profile.id} className="admin-table-row">
                <td><input type="checkbox" /></td>
                <td>
                  <div className="admin-product">
                    <span className="admin-product-thumb">
                      {profile.category === 'grok' ? <Shirt size={18} /> : profile.category === 'flow' ? <Watch size={18} /> : <Cookie size={18} />}
                    </span>
                    <div>
                      <div className="admin-product-name">{profile.name}</div>
                      <div className="admin-product-meta">{profile.description || profile.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="admin-category">
                    <span className={`admin-category-icon ${profile.category === 'flow' ? 'home' : profile.category === 'dreamina' ? 'shoes' : 'accessories'}`}>
                      {profile.category === 'flow' ? <Watch size={16} /> : profile.category === 'dreamina' ? <Cookie size={16} /> : <Shirt size={16} />}
                    </span>
                    {profile.category}
                  </span>
                </td>
                <td><span className={`admin-status ${profile.status === 'idle' ? 'publish' : profile.status === 'running' ? 'scheduled' : 'inactive'}`}>{profile.status}</span></td>
                <td><span className={`admin-switch ${profile.cookies_json ? 'on' : ''}`} /></td>
                <td>{profile.concurrency_limit || 1}</td>
                <td>
                  <div className="admin-table-actions">
                    <Link to={`/profiles/${profile.id}`}><Pencil className="h-4 w-4" /></Link>
                    <button onClick={() => void handleDelete(profile.id)}><Trash2 className="h-4 w-4" /></button>
                    <CircleEllipsis className="h-4 w-4" />
                  </div>
                </td>
              </tr>
            ))}
            {filteredProfiles.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-sm text-[#9b96ad]">Chưa có profile nào. Hãy tạo profile đầu tiên.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <div className="admin-table-footer">
        <span>Showing 1 to {filteredProfiles.length || 0} of {filteredProfiles.length || 0} entries</span>
        <div className="admin-pagination">
          <span className="admin-page-chip">‹</span>
          <span className="admin-page-chip is-active">1</span>
          <span className="admin-page-chip">2</span>
          <span className="admin-page-chip">3</span>
        </div>
      </div>
    </div>
  );
}
