import { KeyRound, LockKeyhole, Plus } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { createApiKey } from '../modules/api-keys/services/apiKeyService';
import { useActiveApiKey } from './ActiveApiKeyContext';
import { useState } from 'react';

export default function RequireActiveApiKey() {
  const { hasActiveKey, isChecking, refreshKeys } = useActiveApiKey();
  const [creating, setCreating] = useState(false);

  const handleCreateKey = async () => {
    setCreating(true);
    try {
      await createApiKey();
      await refreshKeys();
    } finally {
      setCreating(false);
    }
  };

  if (isChecking) {
    return (
      <div className="admin-page-card">
        <div className="admin-page-inner">
          <div className="admin-toolbar-note">Đang kiểm tra API Key active...</div>
        </div>
      </div>
    );
  }

  if (!hasActiveKey) {
    return (
      <div className="admin-page-card">
        <div className="admin-page-inner">
          <div className="rounded-2xl border border-[#f1d9c6] bg-[#fff8f2] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f08c3c] text-white">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-[#5f3c1f]">Profile gateway bị khóa</h2>
                <p className="mt-2 text-sm text-[#7d6049]">
                  Luồng này yêu cầu ít nhất một API Key active. Bạn phải tạo API Key trước thì mới mở được Profile và API Docs,
                  giống flow gateway.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={handleCreateKey} disabled={creating} className="admin-btn admin-btn-primary">
                    <Plus className="h-4 w-4" />
                    {creating ? 'Đang tạo...' : 'Tạo API Key để mở khóa'}
                  </button>
                  <a href="/api-keys" className="admin-btn admin-btn-muted">
                    <KeyRound className="h-4 w-4" />
                    Đi tới API Keys
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
