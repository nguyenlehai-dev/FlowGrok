import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, FileKey2, LockKeyhole, Plus } from 'lucide-react';
import { createApiKey, fetchApiKeys } from '../../api-keys/services/apiKeyService';
import type { ApiKeyItem } from '../../api-keys/models/apiKey';
import { useSystemAuth } from '../../../auth/SystemAuthContext';
import { getRuntimeApiBaseUrl, getRuntimeClientApiKey } from '../../../utils/runtimeConfig';

const API_BASE = `${window.location.origin}/api/v1`;

type SnippetCardProps = {
  title: string;
  description: string;
  code: string;
};

function SnippetCard({ title, description, code }: SnippetCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-[#ece8f5] bg-white p-5 shadow-[0_8px_20px_rgba(47,43,61,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#3f3957]">{title}</h3>
          <p className="mt-1 text-sm text-[#8f8aa3]">{description}</p>
        </div>
        <button type="button" onClick={handleCopy} className="admin-btn admin-btn-muted">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-2xl bg-[#2c2638] p-4 text-sm text-[#f7f4ff]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function ApiDocsView() {
  const { isVerified } = useSystemAuth();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [freshKey, setFreshKey] = useState<ApiKeyItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const activeKeys = useMemo(() => keys.filter((item) => item.status === 'active'), [keys]);
  const hasAccess = isVerified;
  const previewKey = getRuntimeClientApiKey() || freshKey?.key || activeKeys[0]?.key_preview || 'YOUR_API_KEY';
  const docsBaseUrl = getRuntimeApiBaseUrl() || API_BASE;

  const curlProfiles = `curl -X GET "${window.location.origin}${docsBaseUrl}/client/profiles/" \\\n  -H "Authorization: Bearer ${previewKey}"`;
  const curlCreateJob = `curl -X POST "${window.location.origin}${docsBaseUrl}/client/jobs/" \\\n  -H "Authorization: Bearer ${previewKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "profile_id": "your-profile-id",\n    "job_type": "generate_image",\n    "prompt": "A cinematic neon city at night"\n  }'`;
  const curlGetArtifacts = `curl -X GET "${window.location.origin}${docsBaseUrl}/client/jobs/{job_id}/artifacts" \\\n  -H "Authorization: Bearer ${previewKey}"`;

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApiKeys();
      setKeys(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  const handleCreateKey = async () => {
    setCreating(true);
    try {
      const response = await createApiKey();
      setFreshKey(response.data);
      await loadKeys();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="admin-stack">
      <div className="admin-page-card">
        <div className="admin-page-inner">
          <h1 className="admin-page-title">API Docs</h1>
          <p className="admin-page-subtitle">
            Tài liệu client API theo mô hình gateway. Bạn phải verify API key trong System Auth thì browser session này mới được dùng luồng client.
          </p>
        </div>
      </div>

      <div className="admin-page-card">
        <div className="admin-page-inner">
          <h2 className="admin-section-title">Access Gate</h2>
          {loading ? (
            <div className="admin-toolbar-note">Đang kiểm tra API Key...</div>
          ) : hasAccess ? (
            <div className="admin-kv-list">
              <div><strong>Gateway Access:</strong> Unlocked</div>
              <div><strong>Active Keys:</strong> {activeKeys.length}</div>
              <div><strong>Working Token:</strong> {previewKey}</div>
              <div><strong>Rule:</strong> Chỉ browser session đã verify trong System Auth mới nên dùng `/client/*` endpoints.</div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#f1d9c6] bg-[#fff8f2] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f08c3c] text-white">
                  <LockKeyhole className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#5f3c1f]">Gateway locked</h3>
                  <p className="mt-1 text-sm text-[#7d6049]">
                    Bạn chưa verify Gateway API Key trong browser này. Hãy tạo hoặc copy key, sau đó mở System Auth và bấm Verify.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={handleCreateKey} disabled={creating} className="admin-btn admin-btn-primary">
                      <Plus className="h-4 w-4" />
                      {creating ? 'Đang tạo...' : 'Tạo API Key và mở Docs'}
                    </button>
                    <a href="/api-keys" className="admin-btn admin-btn-muted">
                      <FileKey2 className="h-4 w-4" />
                      Đi tới API Keys
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {freshKey?.key ? (
            <div className="mt-5 rounded-2xl border border-[#dce8d7] bg-[#f5fbf1] p-5">
              <div className="admin-kv-list">
                <div><strong>API Key mới:</strong> chỉ hiển thị đúng một lần.</div>
                <div><strong>Preview:</strong> {freshKey.key_preview || 'n/a'}</div>
                <div><strong>Full Key:</strong> {freshKey.key}</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className={`admin-page-card ${hasAccess ? '' : 'pointer-events-none opacity-50'}`}>
        <div className="admin-page-inner">
          <h2 className="admin-section-title">Gateway Flow</h2>
          <div className="admin-kv-list">
            <div><strong>Base URL:</strong> {docsBaseUrl}</div>
            <div><strong>Auth Mode:</strong> `Authorization: Bearer &lt;API_KEY&gt;`</div>
            <div><strong>Profile Scope:</strong> Chỉ profile thuộc chính user sở hữu API Key.</div>
            <div><strong>Use Case:</strong> Dùng từ client tool bên ngoài, không gọi internal worker routes.</div>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-5 xl:grid-cols-2 ${hasAccess ? '' : 'pointer-events-none opacity-50'}`}>
        <SnippetCard
          title="1. List Profiles"
          description="Lấy danh sách profile khả dụng của user thông qua client gateway."
          code={curlProfiles}
        />
        <SnippetCard
          title="2. Queue Generate Job"
          description="Tạo job generate image/video bằng API Key. Backend vẫn giữ logic concurrency theo profile."
          code={curlCreateJob}
        />
        <SnippetCard
          title="3. Poll Job Artifacts"
          description="Lấy artifact đầu ra sau khi worker xử lý xong job."
          code={curlGetArtifacts}
        />
        <SnippetCard
          title="4. Important Rules"
          description="Các nguyên tắc để dùng giống gateway."
          code={`- Phải đăng nhập UI trước\n- Phải tạo hoặc copy API Key\n- Mở System Auth và bấm Verify trong browser hiện tại\n- Dùng /api/v1/client/* cho client tool\n- Không dùng /api/v1/internal/* từ frontend hoặc public client\n- Job vẫn bị chặn nếu profile disable hoặc vượt concurrency_limit`}
        />
      </div>
    </div>
  );
}
