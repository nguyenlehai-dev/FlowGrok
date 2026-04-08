import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { CircleEllipsis, Pencil, Plus, Trash2, Wifi } from 'lucide-react';
import { createProxy, deleteProxy, fetchProxies } from '../services/proxyService';
import type { ProxyItem } from '../models/proxy';

export default function ProxiesView() {
  const [proxies, setProxies] = useState<ProxyItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const loadProxies = async () => {
    setProxies(await fetchProxies());
  };

  useEffect(() => {
    let active = true;

    void fetchProxies().then((data) => {
      if (active) {
        setProxies(data);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await createProxy({ ip, port: parseInt(port), username: username || null, password: password || null });
    setIp('');
    setPort('');
    setUsername('');
    setPassword('');
    setShowForm(false);
    loadProxies();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa proxy này?')) return;
    await deleteProxy(id);
    loadProxies();
  };

  return (
    <div className="admin-page-card">
      <div className="admin-page-inner">
        <h1 className="admin-page-title">Proxies</h1>
        <p className="admin-page-subtitle">Kho IP dùng cho Antidetect Browser theo bố cục bảng quản trị sáng.</p>
      </div>

      <div className="admin-filters">
        <div className="admin-filter-title">Filters</div>
        <div className="admin-filter-grid">
          <select className="admin-select"><option>Status</option></select>
          <select className="admin-select"><option>Auth</option></select>
          <select className="admin-select"><option>Type</option></select>
        </div>
      </div>

      {showForm ? (
        <div className="admin-filters border-t-0">
          <h3 className="mb-4 text-lg font-semibold text-[#4c4761]">Thêm Proxy Mới</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div><label className="mb-2 block text-sm text-[#8f8aa3]">IP Address</label><input value={ip} onChange={(e) => setIp(e.target.value)} required className="admin-input" placeholder="103.152.112.55" /></div>
            <div><label className="mb-2 block text-sm text-[#8f8aa3]">Port</label><input value={port} onChange={(e) => setPort(e.target.value)} required type="number" className="admin-input" placeholder="8080" /></div>
            <div><label className="mb-2 block text-sm text-[#8f8aa3]">Username</label><input value={username} onChange={(e) => setUsername(e.target.value)} className="admin-input" placeholder="(tuỳ chọn)" /></div>
            <div><label className="mb-2 block text-sm text-[#8f8aa3]">Password</label><input value={password} onChange={(e) => setPassword(e.target.value)} className="admin-input" placeholder="(tuỳ chọn)" /></div>
            <div className="flex gap-3 md:col-span-4">
              <button type="submit" className="admin-btn admin-btn-primary">Lưu Proxy</button>
              <button type="button" onClick={() => setShowForm(false)} className="admin-btn admin-btn-muted">Hủy</button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="admin-toolbar">
        <input className="admin-input max-w-[240px]" placeholder="Search Proxy" />
        <div className="admin-toolbar-actions">
          <button className="admin-btn admin-btn-muted">Export</button>
          <button onClick={() => setShowForm(!showForm)} className="admin-btn admin-btn-primary"><Plus className="h-4 w-4" />Add Proxy</button>
        </div>
      </div>

      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead><tr><th>Proxy</th><th>Auth</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {proxies.map((proxy) => (
              <tr key={proxy.id} className="admin-table-row">
                <td>
                  <div className="admin-product">
                    <span className="admin-product-thumb"><Wifi size={18} /></span>
                    <div>
                      <div className="admin-product-name">{proxy.ip}:{proxy.port}</div>
                      <div className="admin-product-meta">{proxy.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td>{proxy.username ? `${proxy.username}:***` : 'Không'}</td>
                <td><span className={`admin-status ${proxy.status === 'alive' ? 'publish' : 'inactive'}`}>{proxy.status}</span></td>
                <td><div className="admin-table-actions"><Pencil className="h-4 w-4" /><button onClick={() => handleDelete(proxy.id)}><Trash2 className="h-4 w-4" /></button><CircleEllipsis className="h-4 w-4" /></div></td>
              </tr>
            ))}
            {proxies.length === 0 ? <tr><td colSpan={4} className="py-12 text-center text-sm text-[#9b96ad]">Chưa có proxy nào.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <div className="admin-table-footer">
        <span>Showing 1 to {proxies.length || 0} of {proxies.length || 0} entries</span>
        <div className="admin-pagination">
          <span className="admin-page-chip">‹</span>
          <span className="admin-page-chip is-active">1</span>
          <span className="admin-page-chip">2</span>
        </div>
      </div>
    </div>
  );
}
