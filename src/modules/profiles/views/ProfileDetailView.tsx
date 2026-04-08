import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, RefreshCw, Upload } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type {
  ProfileAntidetectSettings,
  ProfileCookieImport,
  ProfileItem,
  ProfileLoginTestResult,
  ProfileRuntimeSettings,
} from '../models/profile';
import {
  fetchAntidetectSettings,
  fetchCookieImports,
  fetchProfile,
  fetchRuntimeSettings,
  saveAntidetectSettings,
  saveRuntimeSettings,
  testProfileLogin,
  updateProfile,
  uploadCookieFile,
} from '../services/profileService';

const defaultRuntimeSettings: ProfileRuntimeSettings = {
  id: '',
  profile_id: '',
  browser_type: 'chromium',
  channel: null,
  headless: true,
  timeout_ms: 120000,
  navigation_timeout_ms: 60000,
  max_retries: 2,
  concurrency_limit: 1,
  launch_args: null,
};

const defaultAntidetectSettings: ProfileAntidetectSettings = {
  id: '',
  profile_id: '',
  user_agent: '',
  viewport_width: 1366,
  viewport_height: 768,
  timezone: 'Asia/Ho_Chi_Minh',
  locale: 'vi-VN',
  platform: 'Win32',
  webrtc_mode: 'default',
  canvas_mode: 'default',
  webgl_vendor: '',
  hardware_concurrency: 8,
  device_memory: 8,
};

export default function ProfileDetailView() {
  const { profileId = '' } = useParams();
  const [profile, setProfile] = useState<ProfileItem | null>(null);
  const [runtimeSettings, setRuntimeSettings] = useState<ProfileRuntimeSettings>(defaultRuntimeSettings);
  const [antidetectSettings, setAntidetectSettings] = useState<ProfileAntidetectSettings>(defaultAntidetectSettings);
  const [cookieImports, setCookieImports] = useState<ProfileCookieImport[]>([]);
  const [loginResult, setLoginResult] = useState('No validation run yet.');
  const [loginStateDetail, setLoginStateDetail] = useState<ProfileLoginTestResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<'txt' | 'json' | 'storage_state_json'>('json');

  const loadProfileDetail = async () => {
    const [profileData, runtimeData, antidetectData, importData] = await Promise.all([
      fetchProfile(profileId),
      fetchRuntimeSettings(profileId),
      fetchAntidetectSettings(profileId),
      fetchCookieImports(profileId),
    ]);
    setProfile(profileData);
    setRuntimeSettings(runtimeData);
    setAntidetectSettings(antidetectData);
    setCookieImports(importData);
  };

  useEffect(() => {
    if (!profileId) return;

    let active = true;

    void Promise.all([
      fetchProfile(profileId),
      fetchRuntimeSettings(profileId),
      fetchAntidetectSettings(profileId),
      fetchCookieImports(profileId),
    ]).then(([profileData, runtimeData, antidetectData, importData]) => {
      if (!active) return;
      setProfile(profileData);
      setRuntimeSettings(runtimeData);
      setAntidetectSettings(antidetectData);
      setCookieImports(importData);
    });

    return () => {
      active = false;
    };
  }, [profileId]);

  const handleRuntimeSave = async (e: FormEvent) => {
    e.preventDefault();
    const saved = await saveRuntimeSettings(profileId, runtimeSettings);
    setRuntimeSettings(saved);
    const nextProfile = await updateProfile(profileId, {
      headless: saved.headless,
      concurrency_limit: saved.concurrency_limit,
    });
    setProfile(nextProfile);
  };

  const handleAntidetectSave = async (e: FormEvent) => {
    e.preventDefault();
    const saved = await saveAntidetectSettings(profileId, antidetectSettings);
    setAntidetectSettings(saved);
  };

  const handleCookieUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    await uploadCookieFile(profileId, selectedFile, sourceType);
    setSelectedFile(null);
    await loadProfileDetail();
  };

  const handleTestLogin = async () => {
    const result = await testProfileLogin(profileId);
    setLoginStateDetail(result);
    setLoginResult(`${result.status.toUpperCase()} | ${result.valid ? 'Valid' : 'Invalid'} | parsed=${result.parsed_count} valid=${result.valid_count} invalid=${result.invalid_count}${result.error_code ? ` | code=${result.error_code}` : ''}`);
    const nextProfile = await fetchProfile(profileId);
    setProfile(nextProfile);
  };

  if (!profile) {
    return (
      <div className="admin-page-card">
        <div className="admin-page-inner">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="admin-stack">
      <div className="admin-page-card">
        <div className="admin-page-inner admin-detail-header">
          <div>
            <Link to="/profiles" className="admin-inline-link"><ArrowLeft size={16} />Back to Profiles</Link>
            <h1 className="admin-page-title">{profile.name}</h1>
            <p className="admin-page-subtitle">
              Category: {profile.category} | Status: {profile.status} | Cookie Source: {profile.cookie_source_type || 'n/a'}
            </p>
          </div>
          <div className="admin-toolbar-actions">
            <button type="button" className="admin-btn admin-btn-muted" onClick={loadProfileDetail}><RefreshCw size={16} />Refresh</button>
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleTestLogin}>Test Login</button>
          </div>
        </div>
      </div>

      <div className="admin-detail-grid">
        <div className="admin-page-card">
          <div className="admin-page-inner">
            <h2 className="admin-section-title">Runtime Settings</h2>
            <form className="admin-form-grid" onSubmit={handleRuntimeSave}>
              <label className="admin-field">
                <span>Browser</span>
                <select className="admin-select" value={runtimeSettings.browser_type} onChange={(e) => setRuntimeSettings((current) => ({ ...current, browser_type: e.target.value }))}>
                  <option value="chromium">Chromium</option>
                  <option value="firefox">Firefox</option>
                  <option value="webkit">Webkit</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Headless</span>
                <select className="admin-select" value={String(runtimeSettings.headless)} onChange={(e) => setRuntimeSettings((current) => ({ ...current, headless: e.target.value === 'true' }))}>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Timeout ms</span>
                <input className="admin-input" type="number" value={runtimeSettings.timeout_ms} onChange={(e) => setRuntimeSettings((current) => ({ ...current, timeout_ms: Number(e.target.value) }))} />
              </label>
              <label className="admin-field">
                <span>Navigation Timeout ms</span>
                <input className="admin-input" type="number" value={runtimeSettings.navigation_timeout_ms} onChange={(e) => setRuntimeSettings((current) => ({ ...current, navigation_timeout_ms: Number(e.target.value) }))} />
              </label>
              <label className="admin-field">
                <span>Retries</span>
                <input className="admin-input" type="number" value={runtimeSettings.max_retries} onChange={(e) => setRuntimeSettings((current) => ({ ...current, max_retries: Number(e.target.value) }))} />
              </label>
              <label className="admin-field">
                <span>Concurrency</span>
                <input className="admin-input" type="number" min={1} value={runtimeSettings.concurrency_limit} onChange={(e) => setRuntimeSettings((current) => ({ ...current, concurrency_limit: Number(e.target.value) }))} />
              </label>
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn admin-btn-primary">Save Runtime</button>
              </div>
            </form>
          </div>
        </div>

        <div className="admin-page-card">
          <div className="admin-page-inner">
            <h2 className="admin-section-title">Antidetect Settings</h2>
            <form className="admin-form-grid" onSubmit={handleAntidetectSave}>
              <label className="admin-field admin-field-wide">
                <span>User Agent</span>
                <input className="admin-input" value={antidetectSettings.user_agent || ''} onChange={(e) => setAntidetectSettings((current) => ({ ...current, user_agent: e.target.value }))} />
              </label>
              <label className="admin-field">
                <span>Viewport Width</span>
                <input className="admin-input" type="number" value={antidetectSettings.viewport_width || 0} onChange={(e) => setAntidetectSettings((current) => ({ ...current, viewport_width: Number(e.target.value) }))} />
              </label>
              <label className="admin-field">
                <span>Viewport Height</span>
                <input className="admin-input" type="number" value={antidetectSettings.viewport_height || 0} onChange={(e) => setAntidetectSettings((current) => ({ ...current, viewport_height: Number(e.target.value) }))} />
              </label>
              <label className="admin-field">
                <span>Timezone</span>
                <input className="admin-input" value={antidetectSettings.timezone || ''} onChange={(e) => setAntidetectSettings((current) => ({ ...current, timezone: e.target.value }))} />
              </label>
              <label className="admin-field">
                <span>Locale</span>
                <input className="admin-input" value={antidetectSettings.locale || ''} onChange={(e) => setAntidetectSettings((current) => ({ ...current, locale: e.target.value }))} />
              </label>
              <label className="admin-field">
                <span>Platform</span>
                <input className="admin-input" value={antidetectSettings.platform || ''} onChange={(e) => setAntidetectSettings((current) => ({ ...current, platform: e.target.value }))} />
              </label>
              <label className="admin-field">
                <span>WebRTC</span>
                <select className="admin-select" value={antidetectSettings.webrtc_mode} onChange={(e) => setAntidetectSettings((current) => ({ ...current, webrtc_mode: e.target.value }))}>
                  <option value="default">default</option>
                  <option value="proxy">proxy</option>
                  <option value="disabled">disabled</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Canvas</span>
                <select className="admin-select" value={antidetectSettings.canvas_mode} onChange={(e) => setAntidetectSettings((current) => ({ ...current, canvas_mode: e.target.value }))}>
                  <option value="default">default</option>
                  <option value="noise">noise</option>
                  <option value="block">block</option>
                </select>
              </label>
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn admin-btn-primary">Save Antidetect</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="admin-detail-grid">
        <div className="admin-page-card">
          <div className="admin-page-inner">
            <h2 className="admin-section-title">Cookie Import</h2>
            <form className="admin-form-grid" onSubmit={handleCookieUpload}>
              <label className="admin-field">
                <span>Source Type</span>
                <select className="admin-select" value={sourceType} onChange={(e) => setSourceType(e.target.value as 'txt' | 'json' | 'storage_state_json')}>
                  <option value="json">json</option>
                  <option value="txt">txt</option>
                  <option value="storage_state_json">storage_state_json</option>
                </select>
              </label>
              <label className="admin-field admin-field-wide">
                <span>Cookie File</span>
                <input className="admin-input admin-file-input" type="file" accept=".json,.txt" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </label>
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn admin-btn-primary" disabled={!selectedFile}><Upload size={16} />Import Cookie</button>
              </div>
            </form>
            <div className="admin-kv-list mt-3">
              <div><strong>Recommended:</strong> Use <code>storage_state_json</code> for Grok.</div>
              <div><strong>How to get it:</strong> export <code>browser.storage_state(path=&quot;storage_state.json&quot;)</code> from a browser profile that is already logged into <code>grok.com</code>.</div>
              <div><strong>Fallback:</strong> use cookie <code>json</code> or <code>txt</code> if you do not have Playwright local.</div>
              <div><strong>Quick steps:</strong> login Grok in browser, export <code>storage_state.json</code>, upload here, then run <code>Test Login</code>.</div>
            </div>
            <p className="admin-page-subtitle mt-3">{loginResult}</p>
            {loginStateDetail ? (
              <div className="admin-kv-list mt-3">
                <div><strong>Message:</strong> {loginStateDetail.message}</div>
                <div><strong>Error Code:</strong> {loginStateDetail.error_code || 'n/a'}</div>
                <div><strong>Cookie State:</strong> {JSON.stringify(loginStateDetail.cookie_state || {})}</div>
                <div><strong>Login State:</strong> {JSON.stringify(loginStateDetail.login_state || {})}</div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="admin-page-card">
          <div className="admin-page-inner">
            <h2 className="admin-section-title">Storage Isolation</h2>
            <div className="admin-kv-list">
              <div><strong>Browser:</strong> {profile.storage_path || 'n/a'}</div>
              <div><strong>Cache:</strong> {profile.cache_path || 'n/a'}</div>
              <div><strong>Cookie File:</strong> {profile.cookie_import_name || 'n/a'}</div>
              <div><strong>Imported At:</strong> {profile.cookie_imported_at || 'n/a'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-page-card">
        <div className="admin-page-inner">
          <h2 className="admin-section-title">Cookie Import History</h2>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Source</th>
                  <th>Parsed</th>
                  <th>Valid</th>
                  <th>Invalid</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {cookieImports.map((item) => (
                  <tr key={item.id} className="admin-table-row">
                    <td>{item.file_name || 'manual'}</td>
                    <td>{item.source_type}</td>
                    <td>{item.parsed_count}</td>
                    <td>{item.valid_count}</td>
                    <td>{item.invalid_count}</td>
                    <td><span className={`admin-status ${item.import_status === 'success' ? 'publish' : 'inactive'}`}>{item.import_status}</span></td>
                    <td>{new Date(item.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {cookieImports.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-sm text-[#9b96ad]">No cookie imports yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
