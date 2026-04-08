export type ProfileItem = {
  id: string;
  name: string;
  category: string;
  status: string;
  description?: string | null;
  proxy_id?: string | null;
  cookies_json: string | null;
  headless?: boolean;
  concurrency_limit?: number;
  cookie_source_type?: string | null;
  cookie_import_name?: string | null;
  cookie_imported_at?: string | null;
  storage_path?: string | null;
  cache_path?: string | null;
  provider_config?: Record<string, unknown> | null;
  antidetect_settings?: Record<string, unknown> | null;
  is_enabled?: boolean;
};

export type CreateProfilePayload = {
  name: string;
  category: string;
  cookies_json: string | null;
  antidetect_settings: {
    user_agent: string;
  };
  headless?: boolean;
  concurrency_limit?: number;
  provider_config?: Record<string, unknown>;
  is_enabled?: boolean;
};

export type UpdateProfilePayload = Partial<CreateProfilePayload> & {
  description?: string | null;
  proxy_id?: string | null;
  status?: string;
};

export type ProfileRuntimeSettings = {
  id: string;
  profile_id: string;
  browser_type: string;
  channel: string | null;
  headless: boolean;
  timeout_ms: number;
  navigation_timeout_ms: number;
  max_retries: number;
  concurrency_limit: number;
  launch_args: Record<string, unknown> | null;
};

export type ProfileAntidetectSettings = {
  id: string;
  profile_id: string;
  user_agent: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  timezone: string | null;
  locale: string | null;
  platform: string | null;
  webrtc_mode: string;
  canvas_mode: string;
  webgl_vendor: string | null;
  hardware_concurrency: number | null;
  device_memory: number | null;
};

export type ProfileCookieImport = {
  id: string;
  profile_id: string;
  source_type: string;
  file_name: string | null;
  raw_content_path: string | null;
  parsed_count: number;
  valid_count: number;
  invalid_count: number;
  import_status: string;
  error_message: string | null;
  created_at: string;
};

export type ProfileLoginTestResult = {
  status: string;
  provider: string;
  valid: boolean;
  parsed_count: number;
  valid_count: number;
  invalid_count: number;
  message: string;
  error_code?: string | null;
  cookie_state?: Record<string, unknown> | null;
  login_state?: Record<string, unknown> | null;
};
