import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Bot, ChevronLeft, ChevronRight, CircleEllipsis, Download, ExternalLink, LoaderCircle, Plus, RefreshCcw, SquareX, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import type { JobArtifact, JobItem } from '../models/job';
import {
  cancelJob,
  createJob,
  fetchJob,
  fetchJobArtifactBlob,
  fetchJobArtifactText,
  fetchJobArtifacts,
  fetchJobs,
  runWorkerOnce,
} from '../services/jobService';
import { fetchProfiles } from '../../profiles/services/profileService';
import type { ProfileItem } from '../../profiles/models/profile';

type PreviewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'image' | 'video'; url: string }
  | { kind: 'text'; text: string; language: 'json' | 'text' }
  | { kind: 'unsupported'; message: string }
  | { kind: 'error'; message: string };

export default function JobsView() {
  const PAGE_SIZE = 10;
  const ARTIFACTS_PAGE_SIZE = 8;
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [artifacts, setArtifacts] = useState<JobArtifact[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>({ kind: 'idle' });
  const [showForm, setShowForm] = useState(false);
  const [sourceImagePreviewUrl, setSourceImagePreviewUrl] = useState<string | null>(null);
  const [profileId, setProfileId] = useState('');
  const [jobType, setJobType] = useState<'generate_image' | 'generate_video'>('generate_image');
  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [videoResolution, setVideoResolution] = useState<'480p' | '720p'>('480p');
  const [videoDuration, setVideoDuration] = useState<'6s' | '10s'>('6s');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [workerState, setWorkerState] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isBusy, setIsBusy] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [artifactsPage, setArtifactsPage] = useState(1);
  const selectedJobStatus = selectedJob?.status ?? null;
  const selectedProfile = profiles.find((profile) => profile.id === profileId) || null;
  const selectedArtifact = artifacts.find((artifact) => artifact.id === selectedArtifactId) || null;
  const previewableArtifacts = artifacts.filter((artifact) => isVisualArtifact(artifact));
  const selectedPreviewIndex = selectedArtifact ? previewableArtifacts.findIndex((artifact) => artifact.id === selectedArtifact.id) : -1;
  const hasPreviewGallery = previewableArtifacts.length > 1 && selectedPreviewIndex >= 0;

  const loadJobs = async () => {
    const nextJobs = await fetchJobs(statusFilter ? { status: statusFilter } : undefined);
    setJobs(nextJobs);
    if (jobId) {
      const matched = nextJobs.find((item) => item.id === jobId);
      if (!matched) {
        setSelectedJob(null);
        setArtifacts([]);
        setSelectedArtifactId(null);
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
          setSelectedArtifactId(null);
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
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    setArtifactsPage(1);
  }, [jobId, artifacts.length]);

  useEffect(() => {
    if (!sourceImage) {
      setSourceImagePreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      return;
    }

    const nextUrl = URL.createObjectURL(sourceImage);
    setSourceImagePreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return nextUrl;
    });

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [sourceImage]);

  useEffect(() => {
    if (!jobId) {
      setSelectedJob(null);
      setArtifacts([]);
      setSelectedArtifactId(null);
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
        setSelectedArtifactId((current) => (
          current && nextArtifacts.some((artifact) => artifact.id === current)
            ? current
            : getDefaultArtifactId(nextArtifacts)
        ));
      } catch {
        if (!active) return;
        setSelectedJob(null);
        setArtifacts([]);
        setSelectedArtifactId(null);
      }
    };

    void loadSelected();
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
          setSelectedArtifactId(null);
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
          setSelectedArtifactId((current) => (
            current && nextArtifacts.some((artifact) => artifact.id === current)
              ? current
              : getDefaultArtifactId(nextArtifacts)
          ));
        } catch {
          // Ignore polling errors and keep last state visible.
        }
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [jobId, selectedJobStatus, statusFilter]);

  useEffect(() => {
    if (!selectedJob || !selectedArtifact) {
      setPreview({ kind: 'idle' });
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    const loadPreview = async () => {
      const mimeType = selectedArtifact.mime_type || '';
      try {
        if (isImageMime(mimeType)) {
          setPreview({ kind: 'loading' });
          const blob = await fetchJobArtifactBlob(selectedJob.id, selectedArtifact.id);
          if (!active) return;
          objectUrl = URL.createObjectURL(blob);
          setPreview({ kind: 'image', url: objectUrl });
          return;
        }

        if (isVideoMime(mimeType)) {
          setPreview({ kind: 'loading' });
          const blob = await fetchJobArtifactBlob(selectedJob.id, selectedArtifact.id);
          if (!active) return;
          objectUrl = URL.createObjectURL(blob);
          setPreview({ kind: 'video', url: objectUrl });
          return;
        }

        if (isTextPreviewable(selectedArtifact)) {
          setPreview({ kind: 'loading' });
          const text = await fetchJobArtifactText(selectedJob.id, selectedArtifact.id);
          if (!active) return;
          setPreview({
            kind: 'text',
            text,
            language: isJsonArtifact(selectedArtifact) ? 'json' : 'text',
          });
          return;
        }

        setPreview({ kind: 'unsupported', message: 'Artifact này chưa có preview trực tiếp. Bạn vẫn có thể mở hoặc tải xuống.' });
      } catch {
        if (!active) return;
        setPreview({ kind: 'error', message: 'Không tải được artifact preview.' });
      }
    };

    void loadPreview();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedArtifact, selectedJob]);

  const handleCreateJob = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const videoOptions: Record<string, unknown> = {};
      if (jobType === 'generate_video') {
        videoOptions.video_resolution = videoResolution;
        videoOptions.video_duration = videoDuration;
      }
      const job = await createJob({
        profile_id: profileId,
        job_type: jobType,
        prompt,
        source_image: sourceImage,
        request_payload: Object.keys(videoOptions).length > 0 ? videoOptions : undefined,
      });
      setPrompt('');
      setSourceImage(null);
      setShowForm(false);
      await loadJobs();
      navigate(`/jobs/${job.id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setFormError(formatUiValue(error.response?.data?.detail || error.message));
        return;
      }
      setFormError('Không tạo được job. Vui lòng thử lại.');
    }
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
      setWorkerState(formatUiValue(result.detail || result.status));
      await loadJobs();
      if (result.job_id) {
        navigate(`/jobs/${result.job_id}`);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleOpenArtifact = async (artifact: JobArtifact) => {
    if (!selectedJob) return;
    const blob = await fetchJobArtifactBlob(selectedJob.id, artifact.id);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleDownloadArtifact = async (artifact: JobArtifact) => {
    if (!selectedJob) return;
    const blob = await fetchJobArtifactBlob(selectedJob.id, artifact.id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getArtifactFileName(artifact);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const handleReviewArtifact = (artifact: JobArtifact) => {
    const targetArtifact = isVisualArtifact(artifact)
      ? artifact
      : previewableArtifacts[0] ?? artifact;
    setSelectedArtifactId(targetArtifact.id);
    setIsPreviewModalOpen(true);
  };

  const handlePreviewStep = useCallback((direction: -1 | 1) => {
    if (!hasPreviewGallery) return;
    const nextIndex = (selectedPreviewIndex + direction + previewableArtifacts.length) % previewableArtifacts.length;
    setSelectedArtifactId(previewableArtifacts[nextIndex]?.id ?? null);
  }, [hasPreviewGallery, previewableArtifacts, selectedPreviewIndex]);

  useEffect(() => {
    if (!isPreviewModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePreviewStep(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handlePreviewStep(1);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setIsPreviewModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewModalOpen, handlePreviewStep]);

  const filteredJobs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return jobs;
    return jobs.filter((job) =>
      [job.prompt, job.provider, job.category, job.job_type, job.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [jobs, search]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedJobs = filteredJobs.slice(pageStart, pageStart + PAGE_SIZE);
  const showingFrom = filteredJobs.length === 0 ? 0 : pageStart + 1;
  const showingTo = filteredJobs.length === 0 ? 0 : Math.min(pageStart + PAGE_SIZE, filteredJobs.length);
  const artifactsTotalPages = Math.max(1, Math.ceil(artifacts.length / ARTIFACTS_PAGE_SIZE));
  const safeArtifactsPage = Math.min(artifactsPage, artifactsTotalPages);
  const artifactsStart = (safeArtifactsPage - 1) * ARTIFACTS_PAGE_SIZE;
  const paginatedArtifacts = artifacts.slice(artifactsStart, artifactsStart + ARTIFACTS_PAGE_SIZE);
  const artifactsShowingFrom = artifacts.length === 0 ? 0 : artifactsStart + 1;
  const artifactsShowingTo = artifacts.length === 0 ? 0 : Math.min(artifactsStart + ARTIFACTS_PAGE_SIZE, artifacts.length);

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
              {jobType === 'generate_video' ? (
                <>
                  <label className="admin-field">
                    <span>Resolution</span>
                    <select className="admin-select" value={videoResolution} onChange={(e) => setVideoResolution(e.target.value as '480p' | '720p')}>
                      <option value="480p">480p</option>
                      <option value="720p">720p</option>
                    </select>
                  </label>
                  <label className="admin-field">
                    <span>Duration</span>
                    <select className="admin-select" value={videoDuration} onChange={(e) => setVideoDuration(e.target.value as '6s' | '10s')}>
                      <option value="6s">6s</option>
                      <option value="10s">10s</option>
                    </select>
                  </label>
                </>
              ) : null}
              <label className="admin-field admin-field-wide">
                <span>Source Image</span>
                <input
                  className="admin-input admin-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSourceImage(e.target.files?.[0] || null)}
                />
                <small className="admin-field-hint">
                  {jobType === 'generate_video'
                    ? 'Tùy chọn. Upload ảnh để Grok tạo video từ ảnh này. Nếu không upload, video sẽ được tạo trực tiếp từ prompt.'
                    : 'Tùy chọn. Nếu chọn ảnh ở đây thì job sẽ ưu tiên dùng ảnh gốc làm input cho provider.'}
                </small>
                {sourceImagePreviewUrl ? (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 12 }}>
                    <img
                      src={sourceImagePreviewUrl}
                      alt="Source image preview"
                      style={{
                        width: 96,
                        height: 96,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: '#f3f2f7',
                      }}
                    />
                    <div className="admin-kv-list" style={{ margin: 0 }}>
                      <div><strong>Selected:</strong> {sourceImage?.name}</div>
                      <div><strong>Type:</strong> {sourceImage?.type || 'n/a'}</div>
                      <div><strong>Size:</strong> {sourceImage ? `${Math.max(1, Math.round(sourceImage.size / 1024))} KB` : 'n/a'}</div>
                    </div>
                  </div>
                ) : null}
              </label>
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn admin-btn-primary"><Plus size={16} />Queue Job</button>
                <button type="button" className="admin-btn admin-btn-muted" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
              {formError ? <div className="admin-toolbar-note">{formError}</div> : null}
              {selectedProfile ? (
                <div className="admin-kv-list">
                  <div><strong>Provider:</strong> {selectedProfile.category}</div>
                  <div><strong>Headless:</strong> true</div>
                  <div><strong>Concurrency:</strong> {selectedProfile.concurrency_limit || 1}</div>
                  <div><strong>Cookie imported:</strong> {selectedProfile.cookie_import_name ? 'yes' : 'no'}</div>
                  <div><strong>Source image:</strong> {sourceImage ? sourceImage.name : 'none'}</div>
                  {jobType === 'generate_video' ? (
                    <>
                      <div><strong>Resolution:</strong> {videoResolution}</div>
                      <div><strong>Duration:</strong> {videoDuration}</div>
                    </>
                  ) : null}
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
                {paginatedJobs.map((job) => (
                  <tr key={job.id} className={`admin-table-row ${selectedJobId === job.id ? 'is-selected' : ''}`} onClick={() => handleSelectJob(job.id)}>
                    <td>{job.provider || job.category}</td>
                    <td>{job.job_type}</td>
                    <td>{renderJobStatus(job)}</td>
                    <td>{job.priority}</td>
                    <td>{new Date(job.created_at).toLocaleString()}</td>
                    <td>
                      <div className="admin-table-actions">
                        <button onClick={(e) => { e.stopPropagation(); void handleCancelJob(job.id); }} title="Cancel job"><SquareX className="h-4 w-4" /></button>
                        <CircleEllipsis className="h-4 w-4" />
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedJobs.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-sm text-[#9b96ad]">No jobs yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <div className="admin-table-footer">
            <span>Showing {showingFrom} to {showingTo} of {filteredJobs.length || 0} entries</span>
            <div className="admin-pagination">
              <button className="admin-btn admin-btn-muted" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                Prev
              </button>
              <span>Page {safeCurrentPage} / {totalPages}</span>
              <button className="admin-btn admin-btn-muted" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-page-card">
        <div className="admin-page-inner">
          <h2 className="admin-section-title">Job Detail</h2>
          {selectedJob ? (
            <div className="admin-kv-list admin-job-detail">
              <div><strong>ID:</strong> {selectedJob.id}</div>
              <div><strong>Status:</strong> {renderJobStatus(selectedJob)}</div>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedArtifacts.map((artifact) => (
                  <tr
                    key={artifact.id}
                    className={`admin-table-row ${selectedArtifactId === artifact.id ? 'is-selected' : ''}`}
                    onClick={() => setSelectedArtifactId(artifact.id)}
                  >
                    <td>{artifact.artifact_type}</td>
                    <td className="admin-path-cell">{artifact.public_url || artifact.file_path}</td>
                    <td>{artifact.mime_type || 'n/a'}</td>
                    <td>{new Date(artifact.created_at).toLocaleString()}</td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-btn admin-btn-muted admin-btn-inline"
                          onClick={(e) => { e.stopPropagation(); handleReviewArtifact(artifact); }}
                          title="Review artifact"
                        >
                          Review
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); void handleOpenArtifact(artifact); }} title="Open artifact in new tab">
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); void handleDownloadArtifact(artifact); }} title="Download artifact">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {artifacts.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-sm text-[#9b96ad]">Select a job to view artifacts.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <div className="admin-table-footer">
            <span>Showing {artifactsShowingFrom} to {artifactsShowingTo} of {artifacts.length || 0} artifacts</span>
            <div className="admin-pagination">
              <button
                className="admin-btn admin-btn-muted"
                disabled={safeArtifactsPage <= 1}
                onClick={() => setArtifactsPage((page) => Math.max(1, page - 1))}
              >
                Prev
              </button>
              <span>Page {safeArtifactsPage} / {artifactsTotalPages}</span>
              <button
                className="admin-btn admin-btn-muted"
                disabled={safeArtifactsPage >= artifactsTotalPages}
                onClick={() => setArtifactsPage((page) => Math.min(artifactsTotalPages, page + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {isPreviewModalOpen ? (
        <div className="admin-modal-backdrop" onClick={() => setIsPreviewModalOpen(false)}>
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(980px, calc(100vw - 32px))', padding: 0, overflow: 'hidden' }}
          >
            <div className="admin-modal-header" style={{ padding: '20px 22px 0 22px' }}>
              <h3 className="admin-modal-title" style={{ fontSize: 22 }}>
                {selectedArtifact ? `${selectedArtifact.artifact_type} Preview` : 'Artifact Preview'}
              </h3>
              <div className="admin-toolbar-actions">
                {hasPreviewGallery ? (
                  <>
                    <button
                      type="button"
                      className="admin-modal-close"
                      onClick={() => handlePreviewStep(-1)}
                      aria-label="Previous artifact"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="admin-page-subtitle" style={{ marginBottom: 0 }}>
                      {selectedPreviewIndex + 1} / {previewableArtifacts.length}
                    </div>
                    <button
                      type="button"
                      className="admin-modal-close"
                      onClick={() => handlePreviewStep(1)}
                      aria-label="Next artifact"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                ) : null}
                <button type="button" className="admin-modal-close" onClick={() => setIsPreviewModalOpen(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div style={{ padding: '0 22px 22px 22px' }}>
              <div className="admin-page-subtitle" style={{ marginBottom: 14 }}>
                {selectedArtifact ? getArtifactFileName(selectedArtifact) : 'Select an artifact to preview.'}
              </div>
              {renderPreview(preview, true)}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderPreview(preview: PreviewState, isModal = false) {
  if (preview.kind === 'idle') {
    return <p className="admin-page-subtitle">Select an artifact to preview.</p>;
  }

  if (preview.kind === 'loading') {
    return <div className="admin-toolbar-note">Loading artifact preview...</div>;
  }

  if (preview.kind === 'image') {
    return <img src={preview.url} alt="Artifact preview" style={{ width: '100%', maxHeight: isModal ? '72vh' : undefined, objectFit: 'contain', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }} />;
  }

  if (preview.kind === 'video') {
    return (
      <video
        src={preview.url}
        controls
        preload="metadata"
        style={{ width: '100%', maxHeight: isModal ? '72vh' : undefined, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: '#0b1020' }}
      />
    );
  }

  if (preview.kind === 'text') {
    return (
      <pre
        style={{
          margin: 0,
          maxHeight: isModal ? '72vh' : 360,
          overflow: 'auto',
          padding: 16,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#0b1020',
          color: '#dbe7ff',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {preview.language === 'json' ? formatJson(preview.text) : preview.text}
      </pre>
    );
  }

  if (preview.kind === 'unsupported') {
    return <div className="admin-toolbar-note">{preview.message}</div>;
  }

  if (preview.kind === 'error') {
    return <div className="admin-toolbar-note">{preview.message}</div>;
  }

  return null;
}

function getArtifactFileName(artifact: JobArtifact): string {
  const raw = artifact.public_url || artifact.file_path;
  const normalized = raw.replace(/\\/g, '/');
  return normalized.split('/').pop() || `${artifact.artifact_type}-artifact`;
}

function getDefaultArtifactId(artifacts: JobArtifact[]): string | null {
  const preferred = artifacts.find((artifact) => (
    (artifact.artifact_type === 'image' || artifact.artifact_type === 'video')
    && !artifact.artifact_type.startsWith('debug_')
  ));
  if (preferred) return preferred.id;

  const firstVisual = artifacts.find((artifact) => isVisualArtifact(artifact));
  if (firstVisual) return firstVisual.id;

  return artifacts[0]?.id ?? null;
}

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

function isVideoMime(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

function isVisualArtifact(artifact: JobArtifact): boolean {
  const mimeType = artifact.mime_type || '';
  return isImageMime(mimeType) || isVideoMime(mimeType);
}

function isJsonArtifact(artifact: JobArtifact): boolean {
  const fileName = getArtifactFileName(artifact).toLowerCase();
  return (artifact.mime_type || '').includes('json') || fileName.endsWith('.json');
}

function isTextPreviewable(artifact: JobArtifact): boolean {
  const mimeType = artifact.mime_type || '';
  const fileName = getArtifactFileName(artifact).toLowerCase();
  return mimeType.startsWith('text/') || mimeType.includes('json') || fileName.endsWith('.json') || fileName.endsWith('.log') || fileName.endsWith('.txt');
}

function formatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function formatUiValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function renderJobStatus(job: JobItem) {
  const progress = getJobProgress(job);
  const statusClass = getJobStatusClass(job.status);

  return (
    <div className="admin-job-status">
      <span className={`admin-status ${statusClass}`}>{job.status}</span>
      <div className="admin-job-progress" aria-label={`Job progress ${progress}%`}>
        <span className="admin-job-progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <span className="admin-job-progress-text">{progress}%</span>
    </div>
  );
}

function getJobStatusClass(status: string): string {
  if (status === 'completed') return 'publish';
  if (['queued', 'reserved', 'booting_browser', 'logging_in', 'running', 'uploading_result'].includes(status)) {
    return 'scheduled';
  }
  return 'inactive';
}

function getJobProgress(job: JobItem): number {
  if (job.status === 'completed') return 100;
  if (job.status === 'failed' || job.status === 'cancelled') return 0;

  const baseProgress: Record<string, number> = {
    queued: 5,
    reserved: 12,
    booting_browser: 22,
    logging_in: 35,
    running: 65,
    uploading_result: 90,
  };

  const base = baseProgress[job.status] ?? 0;
  if (job.status !== 'running') return base;

  const startedAt = job.started_at ? new Date(job.started_at).getTime() : 0;
  if (!startedAt || Number.isNaN(startedAt)) return base;

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const timeBonus = Math.min(20, Math.floor(elapsedSeconds / 18));
  return Math.min(85, base + timeBonus);
}
