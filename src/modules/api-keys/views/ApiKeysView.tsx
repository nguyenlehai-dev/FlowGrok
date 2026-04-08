import { useEffect, useState } from 'react';
import { Check, CircleEllipsis, Copy, KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ApiKeyItem } from '../models/apiKey';
import { createApiKey, fetchApiKeys, revokeApiKey } from '../services/apiKeyService';

export default function ApiKeysView() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadApiKeys = async () => {
    setKeys(await fetchApiKeys());
  };

  useEffect(() => {
    let active = true;

    void fetchApiKeys().then((data) => {
      if (active) {
        setKeys(data);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async () => {
    await createApiKey();
    loadApiKeys();
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Thu hồi API Key này?')) return;
    await revokeApiKey(id);
    loadApiKeys();
  };

  const handleCopy = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="admin-page-card">
      <div className="admin-page-inner">
        <h1 className="admin-page-title">API Keys</h1>
        <p className="admin-page-subtitle">Sinh và quản lý khóa truy cập cho Client Tool theo bảng danh sách quản trị.</p>
      </div>

      <div className="admin-filters">
        <div className="admin-filter-title">Filters</div>
        <div className="admin-filter-grid">
          <select className="admin-select"><option>Status</option></select>
          <select className="admin-select"><option>Access</option></select>
          <select className="admin-select"><option>Sort</option></select>
        </div>
      </div>

      <div className="admin-toolbar">
        <input className="admin-input max-w-[240px]" placeholder="Search Key" />
        <div className="admin-toolbar-actions">
          <button className="admin-btn admin-btn-muted">Export</button>
          <button onClick={handleCreate} className="admin-btn admin-btn-primary"><Plus className="h-4 w-4" />Add Product</button>
        </div>
      </div>

      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead><tr><th>Key</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {keys.map((keyItem) => (
              <tr key={keyItem.id} className="admin-table-row">
                <td>
                  <div className="admin-product">
                    <span className="admin-product-thumb"><KeyRound size={18} /></span>
                    <div>
                      <div className="admin-product-name">{keyItem.key.slice(0, 18)}...</div>
                      <div className="admin-product-meta">{keyItem.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="admin-category">
                    <span className="admin-category-icon api"><KeyRound size={16} /></span>
                    API Access
                  </span>
                </td>
                <td><span className={`admin-status ${keyItem.status === 'active' ? 'publish' : 'inactive'}`}>{keyItem.status}</span></td>
                <td>
                  <div className="admin-table-actions">
                    <button onClick={() => handleCopy(keyItem.key, keyItem.id)}>{copiedId === keyItem.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>
                    <Pencil className="h-4 w-4" />
                    {keyItem.status === 'active' ? <button onClick={() => handleRevoke(keyItem.id)}><Trash2 className="h-4 w-4" /></button> : null}
                    <CircleEllipsis className="h-4 w-4" />
                  </div>
                </td>
              </tr>
            ))}
            {keys.length === 0 ? <tr><td colSpan={4} className="py-16 text-center text-sm text-[#9b96ad]">Chưa có API Key nào. Nhấn "Sinh API Key" để tạo.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <div className="admin-table-footer">
        <span>Showing 1 to {keys.length || 0} of {keys.length || 0} entries</span>
        <div className="admin-pagination">
          <span className="admin-page-chip">‹</span>
          <span className="admin-page-chip is-active">1</span>
          <span className="admin-page-chip">2</span>
        </div>
      </div>
    </div>
  );
}
