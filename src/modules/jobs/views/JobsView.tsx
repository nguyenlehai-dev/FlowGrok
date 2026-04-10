import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Bot, CircleEllipsis, LoaderCircle, Plus, RefreshCcw, SquareX } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { JobArtifact, JobItem } from '../models/job';
import { cancelJob, createJob, fetchJob, fetchJobArtifacts, fetchJobs, runWorkerOnce } from '../services/jobService';
import { fetchProfiles } from '../../profiles/services/profileService';
import type { ProfileItem } from '../../profiles/models/profile';

export default function JobsView() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [artifacts, setArtifacts] = useState<JobArtifact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [profileId, setProfileId] = useState('');
  const [jobType, setJobType] = useState<'generate_image' | 'generate_video'>('generate_image');
  const [prompt, setPrompt] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [workerState, setWorkerState] = useState<string>('');
  const [isBusy, setIsBusy] = useState(false);
  const selectedJobStatus = selectedJob?.status ?? null;
  const selectedProfile = profiles.find((profile) => profile.id === profileId) || null;

  const loadJobs = async () => {
    const nextJobs = await fetchJobs(statusFilter ? { status: statusFilter } : undefined);
    setJobs(nextJobs);
    if (jobId) {
      const matched = nextJobs.find((item) => item.id === jobId);
      if (!matched) {
        setSelectedJob(null);
        setArtifacts([]);
      }
    }
  };

  useEffect(() => {
    let active = true;

    void fetchJobs(statusFilter ? { status: statusFilter } : undefined).then((nextJobs) => {
      if (!active) return;
      setJobs(nextJobs);
      if (jobId) {
        const matched = nextJobs.find((item) => item.id === jobId);
        if (!matched) {
          setSelectedJob(null);
          setArtifacts([]);
        }
      }
    });

    void fetchProfiles().then((data) => {
      if (!active) return;
      setProfiles(data);
      setProfileId((current) => current || data[0]?.id || '');
    });

    return () => {
      active = false;
    };
  }, [jobId, statusFilter]);

  useEffect(() => {
    if (!jobId) {
      setSelectedJob(null);
      setArtifacts([]);
      return;
    }

    let active = true;
    const loadSelected = async () => {
      try {
        const [job, nextArtifacts] = await Promise.all([
          fetchJob(jobId),
          fetchJobArtifacts(jobId),
        ]);
        if (!active) return;
        setSelectedJob(job);
        setArtifacts(nextArtifacts);
      } catch {
        if (!active) return;
        setSelectedJob(null);
        setArtifacts([]);
      }
    };

    loadSelected();
    return () => {
      active = false;
    };
  }, [jobId]);

  useEffect(() => {
    if (!selectedJobStatus || !['queued', 'reserved', 'booting_browser', 'logging_in', 'running', 'uploading_result'].includes(selectedJobStatus)) {
      return;
    }

    const timer = window.setInterval(async () => {
      const nextJobs = await fetchJobs(statusFilter ? { status: statusFilter } : undefined);
      setJobs(nextJobs);
      if (jobId) {
        const matched = nextJobs.find((item) => item.id === jobId);
        if (!matched) {
          setSelectedJob(null);
          setArtifacts([]);
          return;
        }
      }

      if (jobId) {
        try {
          const [job, nextArtifacts] = await Promise.all([
            fetchJob(jobId),
            fetchJobArtifacts(jobId),
          ]);
          setSelectedJob(job);
          setArtifacts(nextArtifacts);
        } catch {
          // Ignore polling errors and keep last state visible.
        }
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [jobId, selectedJobStatus, statusFilter]);

  const handleCreateJob = async (e: FormEvent) => {
    e.preventDefault();
    const job = await createJob({ profile_id: profileId, job_type: jobType, prompt });
    setPrompt('');
    setShowForm(false);
    await loadJobs();
    navigate(`/jobs/${job.id}`);
  };

  const handleCancelJob = async (id: string) => {
    await cancelJob(id);
    await loadJobs();
    if (jobId === id) {
      const updated = await fetchJob(id);
      setSelectedJob(updated);
    }
  };

  const handleSelectJob = async (id: string) => {
    navigate(`/jobs/${id}`);
  };

  const handleRunWorker = async () => {
    setIsBusy(true);
    try {
      const result = await runWorkerOnce();
      setWorkerState(result.detail || result.status);
      await loadJobs();
      if (result.job_id) {
        navigate(`/jobs/${result.job_id}`);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const filteredJobs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return jobs;
    return jobs.filter((job) =>
      [job.prompt, job.provider, job.category, job.job_type, job.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [jobs, search]);

  const selectedJobId = selectedJob?.id ?? null;

  return (
    <div className="admin-stack">
      <div className="admin-page-card">
        <div className="admin-page-inner">
          <h1 className="admin-page-title">Jobs</h1>
          <p className="admin-page-subtitle">Theo dõi hàng đợi generation, trạng thái worker và artifact đầu ra.</p>
        </div>
      </div>

      {showForm ? (
        <div className="admin-page-card">
          <div className="admin-page-inner">
            <h2 className="admin-section-title">Create Job</h2>
            <form className="admin-form-grid" onSubmit={handleCreateJob}>
              <label className="admin-field">
                <span>Profile</span>
                <select className="admin-select" value={profileId} onChange={(e) => setProfileId(e.target.value)}>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>{profile.name} [{profile.category}]</option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>Job Type</span>
                <select className="admin-select" value={jobType} onChange={(e) => setJobType(e.target.value as 'generate_image' | 'generate_video')}>
                  <option value="generate_image">generate_image</option>
                  <option value="generate_video">generate_video</option>
                </select>
              </label>
              <label className="admin-field admin-field-wide">
                <span>Prompt</span>
                <textarea className="admin-textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} />
              </label>
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn admin-btn-primary"><Plus size={16} />Queue Job</button>
                <button type="button" className="admin-btn admin-btn-muted" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
              {selectedProfile ? (
                <div className="admin-kv-list">
                  <div><strong>Provider:</strong> {selectedProfile.category}</div>
                  <div><strong>Headless:</strong> true</div>
                  <div><strong>Concurrency:</strong> {selectedProfile.concurrency_limit || 1}</div>
                  <div><strong>Cookie imported:</strong> {selectedProfile.cookie_import_name ? 'yes' : 'no'}</div>
                </div>
              ) : null}
            </form>
          </div>
        </div>
      ) : (
        <div className="admin-page-card">
          <div className="admin-toolbar">
            <div className="admin-toolbar-actions admin-toolbar-actions-grow">
              <input className="admin-input admin-input-compact" placeholder="Search Job" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="admin-select admin-input-compact" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All status</option>
                <option value="queued">queued</option>
                <option value="reserved">reserved</option>
                <option value="booting_browser">booting_browser</option>
                <option value="logging_in">logging_in</option>
                <option value="running">running</option>
                <option value="uploading_result">uploading_result</option>
                <option value="completed">completed</option>
                <option value="failed">failed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
            <div className="admin-toolbar-actions">
              <button className="admin-btn admin-btn-muted" onClick={() => void loadJobs()}><RefreshCcw size={16} />Refresh</button>
              <button className="admin-btn admin-btn-muted" onClick={handleRunWorker} disabled={isBusy}>
                {isBusy ? <LoaderCircle size={16} className="spin" /> : <Bot size={16} />}
                Run Worker
              </button>
              <button className="admin-btn admin-btn-primary" onClick={() => setShowForm(true)}><Plus size={16} />Add Job</button>
            </div>
          </div>
          {workerState ? <div className="admin-toolbar-note">{workerState}</div> : null}
        </div>
      )}

      <div className="admin-detail-grid">
        <div className="admin-page-card">
          <div className="admin-page-inner">
            <h2 className="admin-section-title">Queue</h2>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className={`admin-table-row ${selectedJobId === job.id ? 'is-selected' : ''}`} onClick={() => handleSelectJob(job.id)}>
                      <td>{job.provider || job.category}</td>
                      <td>{job.job_type}</td>
                      <td><span className={`admin-status ${job.status === 'completed' ? 'publish' : job.status === 'running' || job.status === 'queued' || job.status === 'reserved' ? 'scheduled' : 'inactive'}`}>{job.status}</span></td>
                      <td>{job.priority}</td>
                      <td>{new Date(job.created_at).toLocaleString()}</td>
                      <td>
                        <div className="admin-table-actions">
                          <button onClick={(e) => { e.stopPropagation(); handleCancelJob(job.id); }}><SquareX className="h-4 w-4" /></button>
                          <CircleEllipsis className="h-4 w-4" />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredJobs.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-sm text-[#9b96ad]">No jobs yet.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="admin-page-card">
          <div className="admin-page-inner">
            <h2 className="admin-section-title">Job Detail</h2>
            {selectedJob ? (
              <div className="admin-kv-list admin-job-detail">
                <div><strong>ID:</strong> {selectedJob.id}</div>
                <div><strong>Status:</strong> {selectedJob.status}</div>
                <div><strong>Provider:</strong> {selectedJob.provider || selectedJob.category}</div>
                <div><strong>Type:</strong> {selectedJob.job_type}</div>
                <div><strong>Worker:</strong> {selectedJob.worker_id || 'unassigned'}</div>
                <div><strong>Prompt:</strong> {selectedJob.prompt}</div>
                <div><strong>Started:</strong> {selectedJob.started_at ? new Date(selectedJob.started_at).toLocaleString() : 'n/a'}</div>
                <div><strong>Finished:</strong> {selectedJob.finished_at ? new Date(selectedJob.finished_at).toLocaleString() : 'n/a'}</div>
                <div><strong>Result:</strong> {selectedJob.result_url || 'n/a'}</div>
                <div><strong>Error:</strong> {selectedJob.error_logs || 'none'}</div>
              </div>
            ) : (
              <p className="admin-page-subtitle">Select a job from the queue to inspect detail and artifacts.</p>
            )}
            <h3 className="admin-subsection-title">Artifacts</h3>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Path</th>
                    <th>Mime</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {artifacts.map((artifact) => (
                    <tr key={artifact.id} className="admin-table-row">
                      <td>{artifact.artifact_type}</td>
                      <td className="admin-path-cell">{artifact.public_url || artifact.file_path}</td>
                      <td>{artifact.mime_type || 'n/a'}</td>
                      <td>{new Date(artifact.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {artifacts.length === 0 ? <tr><td colSpan={4} className="py-12 text-center text-sm text-[#9b96ad]">Select a job to view artifacts.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
