# FlowGrok Database Design

## 1. Mục tiêu

Tài liệu này chuyển hóa nội dung trong [PROFILE_AUTOMATION_SYSTEM_ANALYSIS.md](/home/vpsroot/projects/frontend/FlowGrok/docs/architecture/PROFILE_AUTOMATION_SYSTEM_ANALYSIS.md) thành thiết kế database cụ thể để backend có thể triển khai theo phase.

Mục tiêu database:

- hỗ trợ quản lý profile theo category `grok`, `flow`, `dreamina`
- hỗ trợ import cookie và lưu audit
- hỗ trợ proxy assignment và health tracking
- hỗ trợ cấu hình antidetect và runtime
- hỗ trợ job orchestration cho Playwright worker
- hỗ trợ artifact output
- hỗ trợ API key cho external client

## 2. Nguyên tắc thiết kế

- Dùng UUID string làm primary key để đồng bộ với hiện trạng backend
- Tách dữ liệu domain rõ ràng, tránh nhồi quá nhiều JSON không kiểm soát
- Chỉ giữ JSON ở những phần thật sự linh hoạt như provider config hoặc request payload
- Tất cả thực thể quan trọng cần có `created_at`
- Các thực thể chạy runtime nên có thêm `updated_at`
- Không lưu plain cookie file trong DB, chỉ lưu metadata và path
- Về production nên hash `api_keys`, không lưu raw key lâu dài

## 3. Thực thể cốt lõi

### 3.1 `users`

Mục đích:

- tài khoản đăng nhập web
- chủ sở hữu profile, job, api key

Trường:

| Field | Type | Notes |
|---|---|---|
| `id` | string UUID | PK |
| `email` | string | unique, indexed |
| `hashed_password` | string | bắt buộc |
| `role` | string | `admin`, `user` |
| `is_active` | boolean | default true |
| `created_at` | datetime | UTC |
| `updated_at` | datetime | nên thêm |

### 3.2 `api_keys`

Mục đích:

- xác thực client ngoài hệ thống

Trường:

| Field | Type | Notes |
|---|---|---|
| `id` | string UUID | PK |
| `user_id` | string UUID | FK `users.id` |
| `name` | string | tên dễ nhớ của key |
| `key_hash` | string | khuyến nghị production |
| `key_preview` | string | ví dụ `fgk_xxx...abc` |
| `status` | string | `active`, `revoked`, `expired` |
| `rate_limit_per_minute` | int | default theo plan |
| `last_used_at` | datetime | nullable |
| `last_used_ip` | string | nullable |
| `expires_at` | datetime | nullable |
| `revoked_at` | datetime | nullable |
| `created_at` | datetime | UTC |
| `updated_at` | datetime | UTC |

Ghi chú:

- Bản hiện tại của backend đang lưu raw `key`
- Bản production nên thay bằng `key_hash`
- Plain key chỉ trả về đúng một lần khi tạo

### 3.3 `proxies`

Mục đích:

- quản lý proxy dùng cho profile/browser automation

Trường:

| Field | Type | Notes |
|---|---|---|
| `id` | string UUID | PK |
| `ip` | string | bắt buộc |
| `port` | int | bắt buộc |
| `protocol` | string | `http`, `https`, `socks5` |
| `username` | string | nullable |
| `password` | string | nullable, nên mã hóa |
| `country` | string | nullable |
| `provider` | string | nullable |
| `status` | string | `alive`, `dead`, `unknown` |
| `latency_ms` | int | nullable |
| `fail_count` | int | default 0 |
| `is_active` | boolean | default true |
| `last_checked_at` | datetime | nullable |
| `created_at` | datetime | UTC |
| `updated_at` | datetime | UTC |

### 3.4 `profiles`

Mục đích:

- browser identity chính của hệ thống

Trường:

| Field | Type | Notes |
|---|---|---|
| `id` | string UUID | PK |
| `user_id` | string UUID | FK `users.id` |
| `proxy_id` | string UUID | FK `proxies.id`, nullable |
| `name` | string | bắt buộc |
| `description` | text | nullable |
| `category` | string | `grok`, `flow`, `dreamina` |
| `status` | string | `idle`, `running`, `cookie_dead`, `error`, `disabled` |
| `cookie_source_type` | string | `txt`, `json`, `manual`, `api` |
| `cookie_import_name` | string | tên file/lần import gần nhất |
| `cookie_imported_at` | datetime | nullable |
| `storage_path` | string | path browser storage |
| `cache_path` | string | path cache riêng |
| `headless` | boolean | default true |
| `concurrency_limit` | int | default 1 |
| `provider_config` | JSON | config linh hoạt theo provider |
| `last_used_at` | datetime | nullable |
| `last_health_check_at` | datetime | nullable |
| `is_enabled` | boolean | default true |
| `created_at` | datetime | UTC |
| `updated_at` | datetime | UTC |

Ghi chú:

- `cookies_json` cũ nên được thay thế dần bởi `cookie import + storage`
- nếu vẫn muốn giữ tương thích ngược, có thể giữ `cookies_json` ở phase 1 rồi loại bỏ ở phase sau

### 3.5 `profile_antidetect_settings`

Mục đích:

- lưu cấu hình antidetect cơ bản theo profile

Trường:

| Field | Type | Notes |
|---|---|---|
| `id` | string UUID | PK |
| `profile_id` | string UUID | unique FK `profiles.id` |
| `user_agent` | string | nullable |
| `viewport_width` | int | nullable |
| `viewport_height` | int | nullable |
| `timezone` | string | nullable |
| `locale` | string | nullable |
| `platform` | string | nullable |
| `webrtc_mode` | string | `default`, `proxy`, `disabled` |
| `canvas_mode` | string | `default`, `noise`, `block` |
| `webgl_vendor` | string | nullable |
| `hardware_concurrency` | int | nullable |
| `device_memory` | int | nullable |
| `created_at` | datetime | UTC |
| `updated_at` | datetime | UTC |

### 3.6 `profile_runtime_settings`

Mục đích:

- cấu hình chạy Playwright riêng cho profile

Trường:

| Field | Type | Notes |
|---|---|---|
| `id` | string UUID | PK |
| `profile_id` | string UUID | unique FK `profiles.id` |
| `browser_type` | string | `chromium`, `firefox`, `webkit` |
| `channel` | string | nullable |
| `headless` | boolean | default true |
| `timeout_ms` | int | default 120000 |
| `navigation_timeout_ms` | int | default 60000 |
| `max_retries` | int | default 2 |
| `concurrency_limit` | int | default 1 |
| `launch_args` | JSON | nullable |
| `created_at` | datetime | UTC |
| `updated_at` | datetime | UTC |

### 3.7 `profile_cookie_imports`

Mục đích:

- lưu lịch sử import cookie
- audit lỗi import

Trường:

| Field | Type | Notes |
|---|---|---|
| `id` | string UUID | PK |
| `profile_id` | string UUID | FK `profiles.id` |
| `source_type` | string | `txt`, `json`, `manual` |
| `file_name` | string | nullable |
| `raw_content_path` | string | path file gốc |
| `parsed_count` | int | số cookie parse được |
| `valid_count` | int | số cookie hợp lệ |
| `invalid_count` | int | số cookie lỗi |
| `import_status` | string | `pending`, `success`, `failed` |
| `error_message` | text | nullable |
| `created_at` | datetime | UTC |

### 3.8 `generation_jobs`

Mục đích:

- hàng đợi tác vụ automation

Trường:

| Field | Type | Notes |
|---|---|---|
| `id` | string UUID | PK |
| `requested_by_user_id` | string UUID | FK `users.id`, nullable |
| `api_key_id` | string UUID | FK `api_keys.id`, nullable |
| `profile_id` | string UUID | FK `profiles.id` |
| `provider` | string | `grok`, `flow`, `dreamina` |
| `job_type` | string | `generate_image`, `generate_video` |
| `prompt` | text | bắt buộc |
| `request_payload` | JSON | params thêm |
| `status` | string | `queued`, `reserved`, `booting_browser`, `logging_in`, `running`, `uploading_result`, `completed`, `failed`, `cancelled` |
| `priority` | int | default 100 |
| `retry_count` | int | default 0 |
| `worker_id` | string | nullable |
| `proxy_snapshot` | JSON | nullable |
| `browser_session_path` | string | nullable |
| `result_payload` | JSON | nullable |
| `error_logs` | text | nullable |
| `started_at` | datetime | nullable |
| `finished_at` | datetime | nullable |
| `created_at` | datetime | UTC |
| `updated_at` | datetime | UTC |

### 3.9 `job_artifacts`

Mục đích:

- lưu ảnh/video/json kết quả từ job

Trường:

| Field | Type | Notes |
|---|---|---|
| `id` | string UUID | PK |
| `job_id` | string UUID | FK `generation_jobs.id` |
| `artifact_type` | string | `image`, `video`, `thumbnail`, `json`, `log` |
| `file_path` | string | path local/storage |
| `public_url` | string | nullable |
| `mime_type` | string | nullable |
| `size_bytes` | bigint | nullable |
| `created_at` | datetime | UTC |

## 4. Quan hệ giữa các bảng

- `users 1 - n api_keys`
- `users 1 - n profiles`
- `proxies 1 - n profiles`
- `profiles 1 - 1 profile_antidetect_settings`
- `profiles 1 - 1 profile_runtime_settings`
- `profiles 1 - n profile_cookie_imports`
- `profiles 1 - n generation_jobs`
- `generation_jobs 1 - n job_artifacts`
- `api_keys 1 - n generation_jobs`

## 5. Chỉ mục đề xuất

### Bắt buộc

- `users.email` unique index
- `api_keys.key_hash` unique index
- `profiles.user_id` index
- `profiles.category` index
- `profiles.status` index
- `profiles.proxy_id` index
- `proxies.status` index
- `generation_jobs.profile_id` index
- `generation_jobs.status` index
- `generation_jobs.provider` index
- `generation_jobs.created_at` index
- `profile_cookie_imports.profile_id` index
- `job_artifacts.job_id` index

### Composite indexes nên có

- `generation_jobs(status, priority, created_at)`
- `profiles(user_id, category, status)`
- `proxies(is_active, status)`

## 6. Ràng buộc nghiệp vụ

- `profiles.category` chỉ nhận `grok`, `flow`, `dreamina`
- `profiles.concurrency_limit >= 1`
- `profile_runtime_settings.concurrency_limit >= 1`
- `generation_jobs.job_type` phải tương thích với `provider`
- `job_artifacts.job_id` chỉ gắn vào job đã tồn tại
- `api_keys.status = revoked` thì không được tạo job mới
- `profiles.is_enabled = false` thì không được enqueue job

## 7. Chuẩn hóa dữ liệu nhạy cảm

Không nên lưu raw plain text ở production cho:

- cookie content
- proxy password
- api key

Đề xuất:

- cookie file lưu trong secure storage path
- DB chỉ lưu metadata và path
- proxy password mã hóa bằng application secret
- api key lưu dạng hash

## 8. Migration roadmap

### Phase 1

- bổ sung `updated_at` cho bảng hiện có
- mở rộng `profiles`
- mở rộng `api_keys`
- mở rộng `proxies`

### Phase 2

- thêm `profile_antidetect_settings`
- thêm `profile_runtime_settings`
- thêm `profile_cookie_imports`

### Phase 3

- mở rộng `generation_jobs`
- thêm `job_artifacts`

### Phase 4

- thêm usage/audit tables nếu cần:
  - `api_key_usage_logs`
  - `job_status_history`
  - `proxy_health_checks`

## 9. Gợi ý path storage ngoài DB

Database không nên chứa toàn bộ file nặng. Chỉ chứa metadata.

Path storage đề xuất:

- `/data/profiles/{profile_id}/browser/`
- `/data/profiles/{profile_id}/cache/`
- `/data/profiles/{profile_id}/cookies/`
- `/data/jobs/{job_id}/artifacts/`
- `/data/jobs/{job_id}/logs/`

## 10. Kết luận

Thiết kế database nên coi `Profile` là trung tâm, `Job` là runtime core, `API Key` là cổng client ngoài, và `Worker` là lớp thực thi. Nếu giữ đúng hướng này, backend sẽ mở rộng được cho:

- quản lý profile thật
- import cookie có audit
- chạy Playwright headless
- scale concurrency
- phục vụ external clients bằng API key
