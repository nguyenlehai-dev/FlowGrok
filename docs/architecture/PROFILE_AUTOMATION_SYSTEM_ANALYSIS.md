# FlowGrok Profile Automation System Analysis

## 1. Mục tiêu mới của project

Project cần mở rộng từ hệ thống CRUD cơ bản hiện tại thành một nền tảng quản lý profile và automation có thể vận hành thực tế cho nhiều nguồn dịch vụ khác nhau.

Các yêu cầu cốt lõi:

- Tạo hệ thống quản lý Profile
- Phân loại category: `Grok`, `Flow`, `Dreamina`
- Mỗi profile có cookie và cache riêng
- Cho phép import cookie vào profile qua file `txt` hoặc `json`
- Có trang quản lý `Profiles`, `Proxies`, `Antidetect settings`
- Với `Grok`: dùng cookie `grok.com`, chạy automation Playwright để gen ảnh/video
- Với `Flow`: đăng nhập `labs.google flow`, chạy automation Playwright để gen ảnh/video
- Chạy `headless=true`
- Cho phép cài đặt `concurrency`
- Có hệ thống `API Key` để client gọi từ bên ngoài
- Kiến trúc tách rõ `FE` và `BE`

## 2. Hiện trạng hệ thống

### 2.1 Frontend hiện có

Frontend hiện đã có các module chính:

- `auth`
- `dashboard`
- `profiles`
- `proxies`
- `api-keys`
- `navigation`

Các route đang hoạt động:

- `/login`
- `/`
- `/profiles`
- `/proxies`
- `/api-keys`

Frontend đã tách dần theo cấu trúc module:

- `views`
- `services`
- `models`
- `configs`

Điểm mạnh hiện tại:

- Đã có shell quản trị
- Đã có sidebar module-based
- Đã có các trang CRUD cơ bản cho `profiles`, `proxies`, `api-keys`
- Đã có auth login với JWT

Điểm còn thiếu:

- Chưa có module `jobs`
- Chưa có module `antidetect settings`
- Chưa có import cookie file
- Chưa có upload manager
- Chưa có workflow chạy automation
- Chưa có monitor concurrency
- Chưa có phân tách rõ trang cấu hình runtime cho Playwright

### 2.2 Backend hiện có

Backend hiện đã có các bảng/model:

- `users`
- `api_keys`
- `proxies`
- `profiles`
- `generation_jobs`

Backend đã có endpoint:

- `auth`
- `profiles`
- `proxies`

Điểm mạnh hiện tại:

- Có JWT auth
- Có bảng `profiles`
- Có bảng `proxies`
- Có bảng `api_keys`
- Đã có bảng `generation_jobs` để mở rộng workflow automation

Điểm còn thiếu:

- `profiles` mới chỉ lưu `cookies_json` thô và `antidetect_settings` JSON đơn giản
- Chưa có `profile storage isolation`
- Chưa có `cookie import pipeline`
- Chưa có `browser session manager`
- Chưa có `playwright job runner`
- Chưa có `concurrency control`
- Chưa có `provider-specific automation` cho Grok/Flow
- Chưa có `API key middleware` cho client external
- Chưa có phân tầng service/usecase rõ ràng

## 3. Khoảng cách giữa hiện trạng và yêu cầu

Hiện tại hệ thống mới ở mức:

- quản lý dữ liệu tĩnh
- login user
- CRUD profile/proxy/api key

Yêu cầu mới đẩy hệ thống sang mức:

- quản lý browser identity
- quản lý state phiên làm việc
- job orchestration
- automation execution
- external API platform

Điều đó có nghĩa project không còn là CRUD app đơn thuần. Nó sẽ trở thành:

- `Admin Console` ở FE
- `Profile + Job Orchestration API` ở BE
- `Playwright Worker Runtime` ở worker layer
- `Storage Manager` cho cookie/cache/profile session

## 4. Phân tích domain chính

### 4.1 Profile domain

`Profile` là entity trung tâm.

Mỗi profile cần đại diện cho một browser identity độc lập, gồm:

- category
- cookie set
- local cache path
- proxy binding
- antidetect settings
- runtime preferences
- status

Profile không nên chỉ lưu `cookies_json`. Cần mở rộng thành:

- `cookie_source_type`
- `cookie_file_name`
- `cookie_last_imported_at`
- `storage_path`
- `cache_path`
- `browser_fingerprint`
- `headless`
- `concurrency_limit`
- `provider_config`

### 4.2 Category domain

Category hiện có:

- `grok`
- `flow`
- `dreamina`

Ý nghĩa category không chỉ là label hiển thị. Nó quyết định:

- domain login
- cookie validation rule
- action set được hỗ trợ
- required selectors / Playwright flow
- output type supported

Ví dụ:

- `grok`: login qua cookie `grok.com`, hỗ trợ text-to-image, text-to-video nếu provider hỗ trợ
- `flow`: login qua `labs.google` hoặc endpoint tương ứng của Flow, hỗ trợ image/video workflow khác
- `dreamina`: về sau có thể có flow automation riêng

Vì vậy category nên được coi là `provider type`.

### 4.3 Proxy domain

Proxy không chỉ là danh sách IP.

Proxy cần hỗ trợ:

- assign vào profile
- test health
- lưu auth info
- track usage
- đánh dấu khả dụng cho category hoặc region

Nên mở rộng:

- `protocol`
- `country`
- `last_checked_at`
- `latency_ms`
- `is_active`
- `fail_count`

### 4.4 Antidetect domain

Yêu cầu hiện tại là “thiết lập antidetect cơ bản nhất”.

Mức tối thiểu nên có:

- `user_agent`
- `viewport`
- `timezone`
- `locale`
- `platform`
- `webrtc_mode`
- `canvas_noise`
- `webgl_vendor`
- `hardware_concurrency`
- `device_memory`

Không nên nhồi toàn bộ vào `antidetect_settings` mà không chuẩn hóa. Nên có schema rõ ràng.

### 4.5 Automation job domain

`generation_jobs` hiện đã tồn tại nhưng còn quá mỏng.

Job thực tế cần chứa:

- loại provider: `grok`, `flow`, `dreamina`
- loại tác vụ: `generate_image`, `generate_video`
- prompt
- input options
- assigned profile
- proxy snapshot
- browser session path
- status timeline
- artifact output
- error detail
- retry count

Nên mở rộng trạng thái:

- `queued`
- `reserved`
- `booting_browser`
- `logging_in`
- `running`
- `uploading_result`
- `completed`
- `failed`
- `cancelled`

## 5. Kiến trúc đề xuất

## 5.1 Tổng quan

Nên tách thành 3 lớp:

1. `Frontend`
2. `Backend API`
3. `Worker/Automation Runtime`

### Frontend

Vai trò:

- quản trị profile
- quản trị proxy
- import cookie
- cấu hình antidetect
- theo dõi job
- quản trị API key
- cấu hình concurrency

### Backend API

Vai trò:

- auth
- profile management
- proxy management
- cookie import metadata
- job creation
- job status query
- API key authentication
- validate business rules

### Worker Runtime

Vai trò:

- nhận job
- load profile storage
- khởi tạo Playwright browser
- gắn proxy
- nạp cookie
- chạy flow automation
- lưu ảnh/video output
- update trạng thái job

## 5.2 Vì sao phải có worker layer riêng

Nếu nhét Playwright vào trực tiếp trong request API:

- request sẽ timeout
- khó scale concurrency
- khó retry
- khó theo dõi trạng thái
- khó tách resource browser ra khỏi API

Do đó API chỉ nên:

- tạo job
- enqueue job

Worker mới là nơi:

- chạy Playwright headless
- quản lý hàng đợi
- giới hạn concurrency

## 6. Thiết kế dữ liệu đề xuất

## 6.1 Bảng `profiles`

Hiện có:

- `id`
- `user_id`
- `proxy_id`
- `name`
- `category`
- `cookies_json`
- `antidetect_settings`
- `status`
- `created_at`

Đề xuất bổ sung:

- `description`
- `cookie_source_type`
- `cookie_import_name`
- `cookie_imported_at`
- `storage_path`
- `cache_path`
- `headless`
- `concurrency_limit`
- `last_used_at`
- `last_health_check_at`
- `is_enabled`

## 6.2 Bảng `profile_cookie_imports`

Mục đích:

- audit việc import cookie
- hỗ trợ rollback/debug

Cột đề xuất:

- `id`
- `profile_id`
- `source_type` (`txt`, `json`, `manual`)
- `file_name`
- `raw_content_path`
- `parsed_count`
- `import_status`
- `error_message`
- `created_at`

## 6.3 Bảng `profile_runtime_settings`

Nếu muốn tách riêng khỏi `profiles`:

- `id`
- `profile_id`
- `headless`
- `concurrency_limit`
- `browser_type`
- `channel`
- `timeout_ms`
- `max_retries`

## 6.4 Bảng `profile_antidetect_settings`

Nếu muốn rõ domain:

- `id`
- `profile_id`
- `user_agent`
- `viewport_width`
- `viewport_height`
- `timezone`
- `locale`
- `platform`
- `webrtc_mode`
- `canvas_mode`
- `webgl_vendor`
- `hardware_concurrency`
- `device_memory`

Nếu chưa muốn tách bảng, có thể vẫn để JSON nhưng schema phải được validate ở tầng service.

## 6.5 Bảng `generation_jobs`

Hiện có:

- `id`
- `profile_id`
- `prompt`
- `category`
- `status`
- `result_url`
- `error_logs`
- `created_at`

Đề xuất bổ sung:

- `job_type`
- `request_payload`
- `result_payload`
- `provider`
- `priority`
- `retry_count`
- `started_at`
- `finished_at`
- `worker_id`
- `api_key_id`
- `requested_by_user_id`

## 6.6 Bảng `job_artifacts`

Để quản lý ảnh/video output:

- `id`
- `job_id`
- `artifact_type` (`image`, `video`, `thumbnail`, `json`)
- `file_path`
- `public_url`
- `mime_type`
- `size_bytes`
- `created_at`

## 6.7 Bảng `api_keys`

Hiện có thể dùng được nhưng nên bổ sung:

- `name`
- `last_used_at`
- `last_used_ip`
- `rate_limit_per_minute`
- `expires_at`
- `revoked_at`

## 7. Luồng nghiệp vụ chính

## 7.1 Tạo profile mới

1. User vào trang `Profiles`
2. Chọn category: `Grok`, `Flow`, `Dreamina`
3. Chọn proxy hoặc để trống
4. Cấu hình antidetect cơ bản
5. Chọn `headless=true`
6. Thiết lập `concurrency_limit`
7. Lưu profile

Kết quả:

- tạo record profile
- tạo storage directory riêng cho profile
- tạo cache directory riêng cho profile

## 7.2 Import cookie vào profile

1. User mở chi tiết profile
2. Upload file `txt` hoặc `json`
3. Backend parse file
4. Validate cookie theo provider
5. Lưu cookie import log
6. Ghi cookie hợp lệ vào storage của profile
7. Update `cookie_imported_at`

Lưu ý:

- `txt` cần xác định chuẩn format
- `json` cần chuẩn hóa theo Playwright cookie schema hoặc schema nội bộ
- phải reject file không đúng domain

## 7.3 Chạy job generate image/video

1. Client FE hoặc external client gọi tạo job
2. Backend validate:
   - profile tồn tại
   - profile đúng category
   - profile có cookie
   - API key hợp lệ nếu gọi từ client ngoài
3. Backend tạo `generation_job`
4. Worker lấy job từ queue
5. Worker khởi tạo Playwright `headless=true`
6. Worker load cache/cookie của profile
7. Worker gắn proxy nếu có
8. Worker mở site provider
9. Worker chạy automation flow
10. Worker lưu artifact
11. Worker cập nhật trạng thái job

## 8. Tách FE và BE

## 8.1 Frontend responsibilities

Frontend chỉ nên lo:

- UI/UX
- form config
- upload file
- gọi API
- hiển thị trạng thái job
- hiển thị artifacts

Frontend không nên:

- parse cookie logic phức tạp
- xác thực domain cookie
- chạy Playwright
- giữ business rule về concurrency

## 8.2 Backend responsibilities

Backend nên lo:

- validate dữ liệu
- chuẩn hóa cookie input
- cấp storage path
- quản lý profile runtime
- queue job
- auth JWT
- auth API key
- audit log

## 8.3 Worker responsibilities

Worker nên lo:

- browser lifecycle
- Playwright context
- session isolation
- artifact export
- retry
- error screenshot
- structured logs

## 9. Thiết kế module FE đề xuất

Theo cấu trúc hiện tại của frontend, nên mở rộng thành:

- `src/modules/auth`
- `src/modules/dashboard`
- `src/modules/profiles`
- `src/modules/proxies`
- `src/modules/api-keys`
- `src/modules/navigation`
- `src/modules/profile-settings`
- `src/modules/cookie-import`
- `src/modules/jobs`
- `src/modules/artifacts`

### 9.1 Module `profiles`

Nên có:

- `views/ProfileListView.tsx`
- `views/ProfileDetailView.tsx`
- `views/ProfileFormView.tsx`
- `services/profileService.ts`
- `services/profileStorageService.ts`
- `models/profile.ts`
- `configs/profileCategories.ts`

### 9.2 Module `cookie-import`

Nên có:

- `components/CookieUploadCard.tsx`
- `components/CookieImportHistory.tsx`
- `services/cookieImportService.ts`
- `utils/parseCookieFile.ts`
- `models/cookieImport.ts`

### 9.3 Module `profile-settings`

Nên có:

- `components/AntidetectBasicForm.tsx`
- `components/RuntimeSettingsForm.tsx`
- `services/profileSettingsService.ts`
- `models/antidetect.ts`
- `models/runtimeSettings.ts`

### 9.4 Module `jobs`

Nên có:

- `views/JobsListView.tsx`
- `views/JobDetailView.tsx`
- `components/JobStatusBadge.tsx`
- `components/CreateJobDialog.tsx`
- `services/jobService.ts`
- `models/job.ts`

## 10. Thiết kế module BE đề xuất

Backend hiện tại đang có:

- `api/endpoints`
- `models`
- `schemas`

Nên mở rộng thêm:

- `services`
- `repositories`
- `worker`
- `automation`
- `storage`

### 10.1 API endpoints đề xuất

#### Profiles

- `POST /profiles`
- `GET /profiles`
- `GET /profiles/{id}`
- `PATCH /profiles/{id}`
- `DELETE /profiles/{id}`
- `POST /profiles/{id}/cookies/import`
- `POST /profiles/{id}/cookies/validate`
- `POST /profiles/{id}/test-login`

#### Proxies

- `POST /proxies`
- `GET /proxies`
- `PATCH /proxies/{id}`
- `DELETE /proxies/{id}`
- `POST /proxies/{id}/health-check`

#### Antidetect

- `GET /profiles/{id}/antidetect`
- `PUT /profiles/{id}/antidetect`

#### Jobs

- `POST /jobs`
- `GET /jobs`
- `GET /jobs/{id}`
- `POST /jobs/{id}/cancel`
- `GET /jobs/{id}/artifacts`

#### API keys

- `POST /auth/api-keys`
- `GET /auth/api-keys`
- `DELETE /auth/api-keys/{id}`

#### Client external

- `POST /client/jobs/image`
- `POST /client/jobs/video`
- `GET /client/jobs/{id}`

## 11. Concurrency design

`Concurrency` phải được hiểu ở 2 mức:

### 11.1 System concurrency

Số lượng browser/job toàn hệ thống chạy cùng lúc.

Ví dụ:

- tối đa `5` job cùng lúc trên một worker

### 11.2 Profile concurrency

Số lượng job tối đa cho từng profile.

Ví dụ:

- profile A chỉ được chạy `1`
- profile B được chạy `2`

Khuyến nghị:

- mặc định `1 profile = 1 concurrent job`
- `system max concurrency` cấu hình ở worker
- `profile concurrency limit` cấu hình ở profile runtime settings

## 12. Playwright runtime requirements

## 12.1 Headless mode

Yêu cầu của project là `headless=true`.

Điều này phù hợp cho:

- chạy server
- tiết kiệm tài nguyên
- scale worker

Nhưng cần lưu ý:

- một số site có thể detect headless
- cần giữ fallback debug mode ở môi trường dev

Đề xuất:

- production worker mặc định `headless=true`
- local dev cho phép override `headless=false`

## 12.2 Storage isolation

Mỗi profile phải có:

- `user_data_dir`
- `cookie storage`
- `cache dir`

Ví dụ path:

- `/data/profiles/{profile_id}/browser`
- `/data/profiles/{profile_id}/cookies`
- `/data/profiles/{profile_id}/artifacts`

Không được dùng chung browser context giữa các profile.

## 13. Provider-specific automation

## 13.1 Grok automation

Yêu cầu:

- login bằng cookie `grok.com`
- thao tác tạo ảnh/video

Cần định nghĩa:

- cookie domain rule
- selector strategy
- prompt submission strategy
- download strategy
- timeout strategy

## 13.2 Flow automation

Yêu cầu:

- login `labs.google flow`
- thao tác tạo ảnh/video

Cần định nghĩa riêng:

- auth/session validation
- selector map
- upload/download flow
- retry logic

## 13.3 Abstraction đề xuất

Nên tạo interface:

- `ProviderAutomation`

Gồm các method:

- `validateCookies()`
- `bootstrapContext()`
- `loginWithCookies()`
- `generateImage()`
- `generateVideo()`
- `collectArtifacts()`

Sau đó triển khai:

- `GrokAutomationProvider`
- `FlowAutomationProvider`
- `DreaminaAutomationProvider`

## 14. API Key system for client

Mục tiêu:

- user client không cần login qua web UI
- chỉ cần API key để gọi generate job

Tối thiểu cần:

- api key prefix
- hash key trong DB thay vì lưu plain text nếu đi production
- rate limit
- revoke
- usage log

Hiện tại backend đang lưu raw key. Với production nên chuyển sang:

- lưu `key_hash`
- chỉ show plain key đúng 1 lần lúc tạo

## 15. Bảo mật và rủi ro

Rủi ro chính:

- cookie là dữ liệu nhạy cảm
- proxy password là dữ liệu nhạy cảm
- artifact có thể chứa nội dung riêng tư
- Playwright worker có thể bị treo
- headless automation dễ bị site detect

Yêu cầu tối thiểu:

- mã hóa dữ liệu nhạy cảm trong DB nếu có thể
- không log raw cookie
- không log proxy password
- audit API key usage
- timeout cho browser/job
- cleanup browser context sau mỗi job

## 16. Roadmap triển khai đề xuất

### Phase 1: Chuẩn hóa nền tảng

- chuẩn hóa schema `profiles`
- thêm schema `jobs`
- thêm schema `profile settings`
- refactor backend theo service layer
- refactor FE cho profile detail/settings

### Phase 2: Cookie import + storage isolation

- upload `txt/json`
- parse cookie
- validate cookie theo provider
- tạo storage path riêng cho profile

### Phase 3: Antidetect + runtime settings

- form basic antidetect
- runtime settings: headless, timeout, concurrency
- save/load settings

### Phase 4: Job orchestration

- tạo job API
- queue worker
- tracking status
- artifact storage

### Phase 5: Provider automation

- Grok provider
- Flow provider
- Dreamina provider

### Phase 6: External API platform

- API key auth middleware
- rate limit
- public client endpoints
- usage dashboard

## 17. Kết luận

Với yêu cầu mới, FlowGrok nên được định nghĩa lại là:

- một hệ thống quản trị profile automation
- có session isolation
- có provider-specific Playwright worker
- có API platform cho client ngoài

Kiến trúc hiện tại là nền khởi đầu tốt, nhưng mới chỉ đủ cho CRUD cơ bản. Để đáp ứng đầy đủ yêu cầu mới, cần ưu tiên các phần sau theo thứ tự:

1. Chuẩn hóa domain `Profile`
2. Bổ sung `Cookie Import + Storage Isolation`
3. Tách `Automation Worker`
4. Xây `Jobs + Artifacts`
5. Hoàn thiện `API Key platform`

Nếu làm đúng hướng này, FE và BE sẽ tách rõ vai trò, mở rộng được về sau, và không bị khóa chặt vào logic Grok/Flow ngay trong request API đồng bộ.
