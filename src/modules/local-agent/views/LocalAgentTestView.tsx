import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Play, RefreshCcw, ShieldCheck } from 'lucide-react';

type LocalArtifact = {
  id: string;
  artifact_type: string;
  file_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  metadata?: Record<string, unknown>;
};

type LocalJob = {
  id: string;
  profile_id: string;
  profile_name: string;
  provider: string;
  job_type: 'generate_image' | 'generate_video';
  prompt: string;
  request_payload: Record<string, unknown>;
  status: string;
  headless: boolean;
  artifacts: LocalArtifact[];
  result_payload: Record<string, unknown> | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

const keyStorage = 'flowgrok-local-agent-test-key';

export default function LocalAgentTestView() {
  const [apiKey, setApiKey] = useState(() => window.localStorage.getItem(keyStorage) || '');
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [jobs, setJobs] = useState<LocalJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<LocalJob | null>(null);
  const [jobType, setJobType] = useState<'generate_image' | 'generate_video'>('generate_image');
  const [prompt, setPrompt] = useState('FlowGrok web test job');
  const [headless, setHeadless] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedArtifacts = selectedJob?.artifacts || [];
  const baseUrl = useMemo(() => '/local-agent', []);

  const headers = () => ({
    'Content-Type': 'application/json',
    ...(apiKey ? { 'X-API-Key': apiKey } : {}),
  });

  const requestJson = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${baseUrl}${path}`, init);
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new Error(data?.detail || `HTTP ${response.status}`);
    }
    return data as T;
  };

  const saveKey = () => {
    window.localStorage.setItem(keyStorage, apiKey);
    setMessage('API key saved in this browser.');
  };

  const loadHealth = async () => {
    setBusy(true);
    setMessage('');
    try {
      const data = await requestJson<Record<string, unknown>>('/health');
      setHealth(data);
      setMessage('Health check OK.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Health check failed.');
    } finally {
      setBusy(false);
    }
  };

  const loadJobs = async () => {
    setBusy(true);
    setMessage('');
    try {
      const data = await requestJson<LocalJob[]>('/api/v1/jobs', { headers: headers() });
      setJobs(data);
      if (selectedJob) {
        const nextSelected = data.find((job) => job.id === selectedJob.id) || null;
        setSelectedJob(nextSelected);
      }
      setMessage('Jobs loaded.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load jobs.');
    } finally {
      setBusy(false);
    }
  };

  const checkSession = async () => {
    setBusy(true);
    setMessage('');
    try {
      const data = await requestJson<Record<string, unknown>>('/api/v1/session/check', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ headless }),
      });
      setMessage(JSON.stringify(data, null, 2));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Session check failed.');
    } finally {
      setBusy(false);
    }
  };

  const createJob = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const data = await requestJson<LocalJob>('/api/v1/jobs', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          job_type: jobType,
          prompt,
          headless,
          request_payload: jobType === 'generate_video'
            ? { video_resolution: '480p', video_duration: '6s' }
            : {},
        }),
      });
      setSelectedJob(data);
      setJobs((current) => [data, ...current.filter((job) => job.id !== data.id)]);
      setMessage(`Job queued: ${data.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create job.');
    } finally {
      setBusy(false);
    }
  };

  const refreshSelectedJob = async (jobId: string) => {
    setBusy(true);
    setMessage('');
    try {
      const data = await requestJson<LocalJob>(`/api/v1/jobs/${jobId}`, { headers: headers() });
      setSelectedJob(data);
      setJobs((current) => current.map((job) => (job.id === data.id ? data : job)));
      setMessage(`Job status: ${data.status}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not refresh job.');
    } finally {
      setBusy(false);
    }
  };

  const openArtifact = async (artifact: LocalArtifact) => {
    if (!selectedJob) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`${baseUrl}/api/v1/jobs/${selectedJob.id}/artifacts/${artifact.id}/content`, {
        headers: apiKey ? { 'X-API-Key': apiKey } : {},
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || `HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not open artifact.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void loadHealth();
  }, []);

  return (
    <div className="admin-page-card">
      <div className="admin-page-inner">
        <h1 className="admin-page-title">Local Agent Test</h1>
        <p className="admin-page-subtitle">Test API local-agent trên domain test, tạo job và xem trạng thái worker.</p>
      </div>

      <div className="admin-page-inner border-top">
        <div className="admin-form-grid">
          <label>
            <span className="admin-form-label">API Key</span>
            <input
              className="admin-input"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Paste X-API-Key"
            />
          </label>
          <div className="flex items-end gap-2">
            <button type="button" className="admin-btn admin-btn-primary" onClick={saveKey}>
              <ShieldCheck size={16} />Save Key
            </button>
            <button type="button" className="admin-btn admin-btn-muted" onClick={loadHealth} disabled={busy}>
              <RefreshCcw size={16} />Health
            </button>
            <button type="button" className="admin-btn admin-btn-muted" onClick={loadJobs} disabled={busy}>
              <RefreshCcw size={16} />Load Jobs
            </button>
          </div>
        </div>

        {health ? (
          <pre className="admin-code-block mt-4">{JSON.stringify(health, null, 2)}</pre>
        ) : null}
      </div>

      <form className="admin-page-inner border-top" onSubmit={createJob}>
        <div className="admin-form-grid">
          <label>
            <span className="admin-form-label">Job Type</span>
            <select className="admin-select" value={jobType} onChange={(event) => setJobType(event.target.value as 'generate_image' | 'generate_video')}>
              <option value="generate_image">generate_image</option>
              <option value="generate_video">generate_video</option>
            </select>
          </label>
          <label>
            <span className="admin-form-label">Browser Mode</span>
            <select className="admin-select" value={headless ? 'headless' : 'headed'} onChange={(event) => setHeadless(event.target.value === 'headless')}>
              <option value="headless">Headless</option>
              <option value="headed">Headed</option>
            </select>
          </label>
        </div>
        <label className="mt-4 block">
          <span className="admin-form-label">Prompt</span>
          <textarea className="admin-textarea" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="admin-btn admin-btn-primary" disabled={busy || !apiKey || !prompt.trim()}>
            <Play size={16} />Create Job
          </button>
          <button type="button" className="admin-btn admin-btn-muted" onClick={checkSession} disabled={busy || !apiKey}>
            Check Session
          </button>
        </div>
      </form>

      {message ? (
        <div className="admin-page-inner border-top">
          <pre className="admin-code-block">{message}</pre>
        </div>
      ) : null}

      <div className="admin-page-inner border-top">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Type</th>
                <th>Status</th>
                <th>Error</th>
                <th>Artifacts</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? <tr><td colSpan={6} className="py-10 text-center text-sm text-[#8f8aa3]">No local-agent jobs loaded.</td></tr> : null}
              {jobs.map((job) => (
                <tr key={job.id} className={`admin-table-row ${selectedJob?.id === job.id ? 'is-selected' : ''}`}>
                  <td className="font-mono text-xs">{job.id}</td>
                  <td>{job.job_type}</td>
                  <td>{job.status}</td>
                  <td>{job.error_code || '-'}</td>
                  <td>{job.artifacts.length}</td>
                  <td>
                    <button type="button" className="admin-btn admin-btn-muted admin-btn-inline" onClick={() => refreshSelectedJob(job.id)}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedJob ? (
        <div className="admin-page-inner border-top">
          <h2 className="text-lg font-semibold text-[#3f3957]">Selected Job</h2>
          <pre className="admin-code-block mt-3">{JSON.stringify(selectedJob, null, 2)}</pre>
          <div className="mt-4 grid gap-3">
            {selectedArtifacts.map((artifact) => (
              <button
                type="button"
                key={`${artifact.id}-${artifact.file_path}`}
                className="admin-btn admin-btn-muted justify-start"
                onClick={() => void openArtifact(artifact)}
              >
                {artifact.artifact_type} - {artifact.mime_type}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
