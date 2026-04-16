export type JobItem = {
  id: string;
  requested_by_user_id?: string | null;
  api_key_id?: string | null;
  profile_id: string;
  prompt: string;
  category: string;
  provider?: string | null;
  job_type?: string | null;
  request_payload?: Record<string, unknown> | null;
  status: string;
  priority?: number | null;
  retry_count?: number | null;
  worker_id?: string | null;
  proxy_snapshot?: Record<string, unknown> | null;
  browser_session_path?: string | null;
  result_url?: string | null;
  result_payload?: Record<string, unknown> | null;
  error_message?: string | null;
  error_logs?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type JobArtifact = {
  id: string;
  job_id: string;
  artifact_type: string;
  file_path: string;
  public_url?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  created_at: string;
};

export type WorkerRunOnceResult = {
  worker_id: string;
  status: string;
  job_id?: string | null;
  detail?: string | null;
};

export type CreateJobPayload = {
  profile_id: string;
  job_type: 'generate_image' | 'generate_video';
  prompt: string;
  request_payload?: Record<string, unknown> | null;
  priority?: number;
  source_image?: File | null;
};
