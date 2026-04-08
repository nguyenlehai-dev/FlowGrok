import { useEffect, useState } from 'react';
import { authApi } from '../api/client';
import { Plus, Trash2, Copy, Check } from 'lucide-react';

interface ApiKeyItem {
  id: string;
  key: string;
  status: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchKeys = async () => {
    const res = await authApi.listApiKeys();
    setKeys(res.data);
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async () => {
    await authApi.createApiKey();
    fetchKeys();
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Thu hồi API Key này? Các Client đang sử dụng sẽ bị mất quyền.')) return;
    await authApi.revokeApiKey(id);
    fetchKeys();
  };

  const handleCopy = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">API Keys</h1>
          <p className="text-gray-500 text-sm mt-1">Sinh và quản lý khóa truy cập cho Client Tool</p>
        </div>
        <button onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-500 text-white text-sm font-medium rounded-xl hover:from-amber-500 hover:to-orange-400 shadow-lg shadow-amber-500/20 transition-all">
          <Plus className="w-4 h-4" />
          Sinh API Key
        </button>
      </div>

      {/* Info box */}
      <div className="mb-6 px-5 py-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <p className="text-sm text-amber-300">
          <strong>Hướng dẫn:</strong> Copy key bên dưới và truyền vào Header <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs">Authorization: Bearer &lt;key&gt;</code> để xác thực API từ ứng dụng Client.
        </p>
      </div>

      <div className="space-y-3">
        {keys.map((k) => (
          <div key={k.id} className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
            k.status === 'active' ? 'bg-gray-900/70 border-gray-800 hover:border-gray-700' : 'bg-gray-900/40 border-gray-800/50 opacity-60'
          }`}>
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${
                k.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
              }`}>
                {k.status}
              </span>
              <code className="text-sm text-gray-300 font-mono truncate">{k.key}</code>
            </div>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <button onClick={() => handleCopy(k.key, k.id)}
                className="p-2 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                {copiedId === k.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              {k.status === 'active' && (
                <button onClick={() => handleRevoke(k.id)}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {keys.length === 0 && (
          <div className="text-center py-16 text-gray-500 text-sm">
            Chưa có API Key nào. Nhấn "Sinh API Key" để tạo.
          </div>
        )}
      </div>
    </div>
  );
}
