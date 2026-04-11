import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, FileKey2, LockKeyhole, Plus } from 'lucide-react';
import { createApiKey, fetchApiKeys } from '../../api-keys/services/apiKeyService';
import type { ApiKeyItem } from '../../api-keys/models/apiKey';
import { useSystemAuth } from '../../../auth/SystemAuthContext';
import { getRuntimeApiBaseUrl, getRuntimeClientApiKey } from '../../../utils/runtimeConfig';

const DEFAULT_API_BASE = '/api/v1';

type SnippetCardProps = {
  title: string;
  description: string;
  code: string;
};

type EndpointDoc = {
  method: string;
  path: string;
  auth: string;
  description: string;
};

type EndpointSection = {
  title: string;
  description: string;
  endpoints: EndpointDoc[];
};

function resolveBaseUrl(baseUrl: string) {
  if (baseUrl.startsWith('http')) return baseUrl.replace(/\/$/, '');
  const normalized = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
  return `${window.location.origin}${normalized}`.replace(/\/$/, '');
}

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

function EndpointTable({ section }: { section: EndpointSection }) {
  return (
    <div className="admin-page-card">
      <div className="admin-page-inner">
        <h2 className="admin-section-title">{section.title}</h2>
        <p className="admin-page-subtitle mb-4">{section.description}</p>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Auth</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {section.endpoints.map((endpoint) => (
                <tr key={`${endpoint.method}-${endpoint.path}`} className="admin-table-row">
                  <td>
                    <span className="admin-status publish">{endpoint.method}</span>
                  </td>
                  <td className="admin-path-cell">
                    <code>{endpoint.path}</code>
                  </td>
                  <td>{endpoint.auth}</td>
                  <td>{endpoint.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const endpointSections: EndpointSection[] = [
  {
    title: 'Auth And API Keys',
    description: 'Đăng ký, đăng nhập, lấy user hiện tại và quản lý API key dùng cho client gateway.',
    endpoints: [
      { method: 'POST', path: '/api/v1/auth/register', auth: 'Public', description: 'Tạo user bằng email và password.' },
      { method: 'POST', path: '/api/v1/auth/login', auth: 'Public', description: 'Đăng nhập và nhận JWT bearer token.' },
      { method: 'GET', path: '/api/v1/auth/me', auth: 'JWT', description: 'Lấy thông tin user đang đăng nhập.' },
      { method: 'GET', path: '/api/v1/auth/api-keys', auth: 'JWT', description: 'Liệt kê API key của user hiện tại.' },
      { method: 'POST', path: '/api/v1/auth/api-keys', auth: 'JWT', description: 'Tạo API key mới. Full key chỉ hiển thị một lần.' },
      { method: 'DELETE', path: '/api/v1/auth/api-keys/{key_id}', auth: 'JWT', description: 'Thu hồi API key.' },
    ],
  },
  {
    title: 'Profiles',
    description: 'Quản lý profile provider, cookie, runtime setting, antidetect setting và test login.',
    endpoints: [
      { method: 'GET', path: '/api/v1/profiles/', auth: 'JWT', description: 'Liệt kê profile. Hỗ trợ filter category, status, proxy_id, search, skip, limit.' },
      { method: 'POST', path: '/api/v1/profiles/', auth: 'JWT', description: 'Tạo profile mới cho grok, flow hoặc dreamina.' },
      { method: 'GET', path: '/api/v1/profiles/{profile_id}', auth: 'JWT', description: 'Xem chi tiết profile.' },
      { method: 'PATCH', path: '/api/v1/profiles/{profile_id}', auth: 'JWT', description: 'Cập nhật name, status, proxy, provider_config, headless, concurrency_limit.' },
      { method: 'DELETE', path: '/api/v1/profiles/{profile_id}', auth: 'JWT', description: 'Xóa profile.' },
      { method: 'GET', path: '/api/v1/profiles/{profile_id}/runtime-settings', auth: 'JWT', description: 'Xem runtime settings, gồm browser_type, channel, cdp_url, timeout.' },
      { method: 'PUT', path: '/api/v1/profiles/{profile_id}/runtime-settings', auth: 'JWT', description: 'Tạo hoặc cập nhật runtime settings.' },
      { method: 'GET', path: '/api/v1/profiles/{profile_id}/antidetect-settings', auth: 'JWT', description: 'Xem fingerprint settings như user_agent, viewport, timezone, locale, WebGL.' },
      { method: 'PUT', path: '/api/v1/profiles/{profile_id}/antidetect-settings', auth: 'JWT', description: 'Tạo hoặc cập nhật antidetect settings.' },
      { method: 'POST', path: '/api/v1/profiles/{profile_id}/cookies/import', auth: 'JWT', description: 'Import cookie bằng multipart form. source_type: storage_state_json, json hoặc txt.' },
      { method: 'GET', path: '/api/v1/profiles/{profile_id}/cookie-imports', auth: 'JWT', description: 'Liệt kê lịch sử import cookie.' },
      { method: 'POST', path: '/api/v1/profiles/{profile_id}/test-login', auth: 'JWT', description: 'Kiểm tra cookie/session với provider.' },
    ],
  },
  {
    title: 'Proxies',
    description: 'Quản lý proxy dùng cho profile.',
    endpoints: [
      { method: 'GET', path: '/api/v1/proxies/', auth: 'JWT', description: 'Liệt kê proxy. Hỗ trợ status và search.' },
      { method: 'POST', path: '/api/v1/proxies/', auth: 'JWT', description: 'Tạo proxy mới.' },
      { method: 'PATCH', path: '/api/v1/proxies/{proxy_id}', auth: 'JWT', description: 'Cập nhật proxy.' },
      { method: 'DELETE', path: '/api/v1/proxies/{proxy_id}', auth: 'JWT', description: 'Xóa proxy.' },
      { method: 'POST', path: '/api/v1/proxies/{proxy_id}/health-check', auth: 'JWT', description: 'Đánh dấu/kiểm tra tình trạng proxy.' },
    ],
  },
  {
    title: 'Jobs',
    description: 'Tạo job image/video, upload source image, theo dõi trạng thái, cancel và tải artifact.',
    endpoints: [
      { method: 'GET', path: '/api/v1/jobs/', auth: 'JWT', description: 'Liệt kê job. Hỗ trợ status, profile_id, category, job_type, skip, limit.' },
      { method: 'POST', path: '/api/v1/jobs/', auth: 'JWT', description: 'Tạo job JSON cho generate_image hoặc generate_video.' },
      { method: 'POST', path: '/api/v1/jobs/with-source-image', auth: 'JWT', description: 'Tạo job multipart có source_image cho image-to-video hoặc image reference.' },
      { method: 'GET', path: '/api/v1/jobs/{job_id}', auth: 'JWT', description: 'Xem chi tiết job.' },
      { method: 'POST', path: '/api/v1/jobs/{job_id}/cancel', auth: 'JWT', description: 'Cancel job khi còn queued, reserved, booting_browser, logging_in hoặc running.' },
      { method: 'GET', path: '/api/v1/jobs/{job_id}/artifacts', auth: 'JWT', description: 'Liệt kê artifact publishable của job.' },
      { method: 'GET', path: '/api/v1/jobs/{job_id}/artifacts/{artifact_id}/content', auth: 'JWT', description: 'Tải hoặc preview nội dung artifact.' },
      { method: 'POST', path: '/api/v1/jobs/run-worker-once', auth: 'JWT', description: 'Chạy worker một lượt từ UI/admin.' },
    ],
  },
  {
    title: 'Client Gateway',
    description: 'Endpoint dành cho tool/khách bên ngoài. Dùng API key qua Authorization Bearer.',
    endpoints: [
      { method: 'GET', path: '/api/v1/client/profiles/', auth: 'API Key', description: 'Liệt kê profile thuộc user sở hữu API key.' },
      { method: 'GET', path: '/api/v1/client/jobs/', auth: 'API Key', description: 'Liệt kê job theo API key/user. Hỗ trợ filter tương tự jobs.' },
      { method: 'POST', path: '/api/v1/client/jobs/', auth: 'API Key', description: 'Tạo job generate_image hoặc generate_video từ client gateway.' },
      { method: 'GET', path: '/api/v1/client/jobs/{job_id}', auth: 'API Key', description: 'Xem chi tiết job client tạo.' },
      { method: 'GET', path: '/api/v1/client/jobs/{job_id}/artifacts', auth: 'API Key', description: 'Liệt kê artifact publishable của job.' },
      { method: 'GET', path: '/api/v1/client/jobs/{job_id}/artifacts/{artifact_id}/content', auth: 'API Key', description: 'Tải hoặc preview artifact qua gateway.' },
    ],
  },
  {
    title: 'Internal Worker',
    description: 'Endpoint nội bộ cho worker. Không dùng từ frontend public hoặc client gateway.',
    endpoints: [
      { method: 'POST', path: '/api/v1/internal/jobs/claim', auth: 'Worker Token', description: 'Worker claim job queued theo priority.' },
      { method: 'POST', path: '/api/v1/internal/jobs/{job_id}/heartbeat', auth: 'Worker Token', description: 'Cập nhật heartbeat cho job đang xử lý.' },
      { method: 'POST', path: '/api/v1/internal/jobs/{job_id}/status', auth: 'Worker Token', description: 'Cập nhật status, result_url, result_payload hoặc error_logs.' },
      { method: 'POST', path: '/api/v1/internal/jobs/{job_id}/artifacts', auth: 'Worker Token', description: 'Worker ghi artifact sau khi xử lý.' },
      { method: 'POST', path: '/api/v1/internal/jobs/run-once', auth: 'Worker Token', description: 'Chạy worker một lượt bằng token nội bộ.' },
    ],
  },
  {
    title: 'Health',
    description: 'Endpoint kiểm tra service và database runtime.',
    endpoints: [
      { method: 'GET', path: '/', auth: 'Public', description: 'Root status của API.' },
      { method: 'GET', path: '/health', auth: 'Public', description: 'Health trực tiếp trên backend.' },
      { method: 'GET', path: '/api/health', auth: 'Public', description: 'Health qua proxy domain. Hiện trả dialect PostgreSQL.' },
    ],
  },
];

export default function ApiDocsView() {
  const { isVerified } = useSystemAuth();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [freshKey, setFreshKey] = useState<ApiKeyItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const activeKeys = useMemo(() => keys.filter((item) => item.status === 'active'), [keys]);
  const hasAccess = isVerified;
  const previewKey = getRuntimeClientApiKey() || freshKey?.key || activeKeys[0]?.key_preview || 'YOUR_API_KEY';
  const docsBasePath = getRuntimeApiBaseUrl() || DEFAULT_API_BASE;
  const docsBaseUrl = resolveBaseUrl(docsBasePath);
  const apiRootUrl = docsBaseUrl.replace(/\/api\/v1$/, '');

  const snippets = [
    {
      title: 'Login And Get JWT',
      description: 'Dùng cho UI/admin endpoints như profiles, proxies, jobs và api-keys.',
      code: `curl -X POST "${docsBaseUrl}/auth/login" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "email": "user@example.com",\n    "password": "your-password"\n  }'`,
    },
    {
      title: 'Create API Key',
      description: 'Tạo API key gateway bằng JWT token.',
      code: `curl -X POST "${docsBaseUrl}/auth/api-keys" \\\n  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    },
    {
      title: 'List Client Profiles',
      description: 'Kiểm tra API key gateway và lấy profile có thể chạy job.',
      code: `curl -X GET "${docsBaseUrl}/client/profiles/" \\\n  -H "Authorization: Bearer ${previewKey}"`,
    },
    {
      title: 'Create Image Job',
      description: 'Tạo job generate_image qua client gateway.',
      code: `curl -X POST "${docsBaseUrl}/client/jobs/" \\\n  -H "Authorization: Bearer ${previewKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "profile_id": "your-profile-id",\n    "job_type": "generate_image",\n    "prompt": "A cinematic neon city at night",\n    "priority": 100\n  }'`,
    },
    {
      title: 'Create Video Job',
      description: 'Tạo job generate_video với request_payload video.',
      code: `curl -X POST "${docsBaseUrl}/client/jobs/" \\\n  -H "Authorization: Bearer ${previewKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "profile_id": "your-profile-id",\n    "job_type": "generate_video",\n    "prompt": "A slow camera move over a futuristic street",\n    "request_payload": {\n      "video_resolution": "720p",\n      "video_duration": "6s"\n    }\n  }'`,
    },
    {
      title: 'Create Job With Source Image',
      description: 'Dùng multipart endpoint khi cần upload ảnh nguồn.',
      code: `curl -X POST "${docsBaseUrl}/jobs/with-source-image" \\\n  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\\n  -F "profile_id=your-profile-id" \\\n  -F "job_type=generate_video" \\\n  -F "prompt=Animate this product photo" \\\n  -F "priority=100" \\\n  -F 'request_payload={"video_resolution":"720p","video_duration":"6s"}' \\\n  -F "source_image=@/path/to/source.png"`,
    },
    {
      title: 'Poll Job And Artifacts',
      description: 'Lấy trạng thái job, danh sách artifact và tải artifact content.',
      code: `curl -X GET "${docsBaseUrl}/client/jobs/{job_id}" \\\n  -H "Authorization: Bearer ${previewKey}"\n\ncurl -X GET "${docsBaseUrl}/client/jobs/{job_id}/artifacts" \\\n  -H "Authorization: Bearer ${previewKey}"\n\ncurl -L "${docsBaseUrl}/client/jobs/{job_id}/artifacts/{artifact_id}/content" \\\n  -H "Authorization: Bearer ${previewKey}" \\\n  -o artifact.bin`,
    },
    {
      title: 'Health Check',
      description: 'Kiểm tra API và database runtime.',
      code: `curl -X GET "${apiRootUrl}/api/health"`,
    },
  ];

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
            Tài liệu đầy đủ cho FlowGrok API: auth, API keys, profiles, proxies, jobs, client gateway, internal worker và health check.
          </p>
        </div>
      </div>

      <div className="admin-page-card">
        <div className="admin-page-inner">
          <h2 className="admin-section-title">Access And Base URL</h2>
          {loading ? (
            <div className="admin-toolbar-note">Đang kiểm tra API Key...</div>
          ) : hasAccess ? (
            <div className="admin-kv-list">
              <div><strong>Gateway Access:</strong> Unlocked</div>
              <div><strong>Active Keys:</strong> {activeKeys.length}</div>
              <div><strong>Working Token:</strong> {previewKey}</div>
              <div><strong>Base URL:</strong> {docsBaseUrl}</div>
              <div><strong>Auth Header:</strong> <code>Authorization: Bearer &lt;TOKEN_OR_API_KEY&gt;</code></div>
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
                    Tài liệu vẫn đọc được. Muốn chạy thử client gateway trong browser này thì tạo hoặc copy API key, mở System Auth và bấm Verify.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={handleCreateKey} disabled={creating} className="admin-btn admin-btn-primary">
                      <Plus className="h-4 w-4" />
                      {creating ? 'Đang tạo...' : 'Tạo API Key'}
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

      <div className="admin-page-card">
        <div className="admin-page-inner">
          <h2 className="admin-section-title">Auth Modes</h2>
          <div className="admin-kv-list">
            <div><strong>JWT:</strong> lấy từ <code>POST /api/v1/auth/login</code>, dùng cho UI/admin endpoints.</div>
            <div><strong>API Key:</strong> tạo từ <code>POST /api/v1/auth/api-keys</code>, dùng cho <code>/api/v1/client/*</code>.</div>
            <div><strong>Worker Token:</strong> dùng riêng cho <code>/api/v1/internal/*</code>, không đưa cho frontend public hoặc khách ngoài.</div>
            <div><strong>Database:</strong> runtime hiện tại dùng PostgreSQL, kiểm tra qua <code>/api/health</code>.</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {snippets.map((snippet) => (
          <SnippetCard key={snippet.title} {...snippet} />
        ))}
      </div>

      <div className="admin-page-card">
        <div className="admin-page-inner">
          <h2 className="admin-section-title">Payload Notes</h2>
          <div className="admin-kv-list">
            <div><strong>Profile category:</strong> <code>grok</code>, <code>flow</code>, <code>dreamina</code>.</div>
            <div><strong>Job type:</strong> <code>generate_image</code> hoặc <code>generate_video</code>.</div>
            <div><strong>Video payload:</strong> <code>request_payload.video_resolution</code> hỗ trợ <code>480p</code>, <code>720p</code>; <code>video_duration</code> hỗ trợ <code>6s</code>, <code>10s</code>.</div>
            <div><strong>Cookie import:</strong> multipart fields gồm <code>source_type</code> và <code>file</code>. source_type nhận <code>storage_state_json</code>, <code>json</code>, <code>txt</code>.</div>
            <div><strong>Job status:</strong> thường gặp <code>queued</code>, <code>reserved</code>, <code>booting_browser</code>, <code>logging_in</code>, <code>running</code>, <code>uploading_result</code>, <code>completed</code>, <code>failed</code>, <code>cancelled</code>.</div>
          </div>
        </div>
      </div>

      {endpointSections.map((section) => (
        <EndpointTable key={section.title} section={section} />
      ))}
    </div>
  );
}
