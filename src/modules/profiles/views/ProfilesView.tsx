import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { CircleEllipsis, Cookie, Pencil, Plus, Shirt, Trash2, Watch } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProfileItem } from '../models/profile';
import { createProfile, deleteProfile, fetchProfiles } from '../services/profileService';

export default function ProfilesView() {
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('grok');
  const [cookies, setCookies] = useState('');

  const loadProfiles = async () => {
    setProfiles(await fetchProfiles());
  };

  useEffect(() => {
    let active = true;

    void fetchProfiles().then((data) => {
      if (active) {
        setProfiles(data);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await createProfile({
      name,
      category,
      cookies_json: cookies || null,
      antidetect_settings: { user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    setName('');
    setCookies('');
    setShowForm(false);
    loadProfiles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa profile này?')) return;
    await deleteProfile(id);
    loadProfiles();
  };

  return (
    <div className="admin-page-card">
      <div className="admin-page-inner">
        <h1 className="admin-page-title">Profiles</h1>
        <p className="admin-page-subtitle">Quản lý các môi trường Browser Antidetect theo phong cách bảng dữ liệu tập trung.</p>
      </div>

      <div className="admin-filters">
        <div className="admin-filter-title">Filters</div>
        <div className="admin-filter-grid">
          <select className="admin-select"><option>Status</option></select>
          <select className="admin-select"><option>Category</option></select>
          <select className="admin-select"><option>Cookie</option></select>
        </div>
      </div>

      {showForm ? (
        <div className="admin-filters border-t-0">
          <h3 className="mb-4 text-lg font-semibold text-[#4c4761]">Tạo Profile Mới</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm text-[#8f8aa3]">Tên Profile</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="admin-input" placeholder="VD: Grok Account 1" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[#8f8aa3]">Loại (Category)</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="admin-select">
                <option value="grok">Grok</option>
                <option value="flow">Flow</option>
                <option value="dreamina">Dreamina</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-[#8f8aa3]">Cookie JSON (tùy chọn)</label>
              <input value={cookies} onChange={(e) => setCookies(e.target.value)} className="admin-input" placeholder='{"session_id":"abc123"}' />
            </div>
            <div className="flex gap-3 md:col-span-3">
              <button type="submit" className="admin-btn admin-btn-primary">Lưu Profile</button>
              <button type="button" onClick={() => setShowForm(false)} className="admin-btn admin-btn-muted">Hủy</button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="admin-toolbar">
        <input className="admin-input max-w-[240px]" placeholder="Search Product" />
        <div className="admin-toolbar-actions">
          <select className="admin-select w-[76px]"><option>10</option></select>
          <button className="admin-btn admin-btn-muted">Export</button>
          <button onClick={() => setShowForm(!showForm)} className="admin-btn admin-btn-primary"><Plus className="h-4 w-4" />Add Profile</button>
        </div>
      </div>

      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="w-[50px]"><input type="checkbox" /></th>
              <th>Product</th>
              <th>Category</th>
              <th>Status</th>
              <th>Cookie</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id} className="admin-table-row">
                <td><input type="checkbox" /></td>
                <td>
                  <div className="admin-product">
                    <span className="admin-product-thumb">
                      {profile.category === 'grok' ? <Shirt size={18} /> : profile.category === 'flow' ? <Watch size={18} /> : <Cookie size={18} />}
                    </span>
                    <div>
                      <div className="admin-product-name">{profile.name}</div>
                      <div className="admin-product-meta">{profile.id.slice(0, 8)}</div>
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
                <td>
                  <div className="admin-table-actions">
                    <Link to={`/profiles/${profile.id}`}><Pencil className="h-4 w-4" /></Link>
                    <button onClick={() => handleDelete(profile.id)}><Trash2 className="h-4 w-4" /></button>
                    <CircleEllipsis className="h-4 w-4" />
                  </div>
                </td>
              </tr>
            ))}
            {profiles.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-sm text-[#9b96ad]">Chưa có profile nào. Hãy tạo profile đầu tiên.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <div className="admin-table-footer">
        <span>Showing 1 to {profiles.length || 0} of {profiles.length || 0} entries</span>
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
