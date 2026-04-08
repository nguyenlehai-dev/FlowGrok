# FlowGrok Worker Automation Design

## 1. Mục tiêu

Worker là lớp chịu trách nhiệm thực thi Playwright automation cho các profile thuộc các provider:

- `grok`
- `flow`
- `dreamina`

Worker phải:

- chạy `headless=true`
- tách session theo profile
- tuân thủ concurrency
- xuất artifact
- cập nhật trạng thái job

## 2. Vì sao worker phải tách khỏi API

Không nên chạy Playwright trực tiếp trong request API vì:

- request timeout
- khó retry
- khó scale
- khó giới hạn tài nguyên browser
- khó thu thập log và artifact

API chỉ nên:

- validate
- tạo job
- enqueue

Worker mới là nơi:

- launch browser
- load cookie
- open target provider
- run automation
- collect result

## 3. Kiến trúc worker đề xuất

## 3.1 Thành phần chính

- `Job Poller`
- `Concurrency Manager`
- `Profile Runtime Loader`
- `Cookie Loader`
- `Proxy Binder`
- `Playwright Session Factory`
- `Provider Automation`
- `Artifact Collector`
- `Job Status Reporter`

## 3.2 Flow xử lý job

1. Poller lấy job `queued`
2. Concurrency Manager kiểm tra quota hệ thống
3. Worker reserve job
4. Load profile + runtime settings + antidetect settings
5. Bootstrap storage path
6. Launch Playwright headless
7. Bind proxy nếu có
8. Import cookie/context state
9. Run provider-specific automation
10. Save artifact
11. Update job `completed` hoặc `failed`
12. Cleanup browser/context

## 4. Concurrency design

## 4.1 System-wide concurrency

Ví dụ:

- `WORKER_MAX_CONCURRENCY=5`

Ý nghĩa:

- tối đa 5 browser job đồng thời trên một worker process

## 4.2 Per-profile concurrency

Ví dụ:

- `profile.concurrency_limit = 1`

Ý nghĩa:

- không cho một profile chạy song song quá số lượng đã cấu hình

## 4.3 Queue selection strategy

Ưu tiên:

1. `queued`
2. `priority ASC`
3. `created_at ASC`

## 5. Storage isolation

Mỗi profile phải có thư mục riêng:

- browser state
- cache
- cookie imports
- logs

Đề xuất:

- `/data/profiles/{profile_id}/browser/`
- `/data/profiles/{profile_id}/cache/`
- `/data/profiles/{profile_id}/cookies/`

Mỗi job cũng cần có thư mục riêng:

- `/data/jobs/{job_id}/artifacts/`
- `/data/jobs/{job_id}/logs/`

## 6. Browser launch strategy

Mặc định:

- browser: `chromium`
- mode: `headless=true`

Launch options tối thiểu:

- proxy theo profile nếu có
- timeout
- locale
- timezone
- viewport
- user agent

Có thể ánh xạ từ `profile_runtime_settings` và `profile_antidetect_settings`.

## 7. Cookie import strategy

Cookie có thể đến từ:

- txt file
- json file
- manual paste

Worker không nên parse file upload trực tiếp từ UI. API/backend nên parse và normalize trước.

Worker chỉ nên dùng:

- normalized cookie json
- hoặc Playwright storage state file

## 8. Provider automation abstraction

Nên xây 1 interface thống nhất:

```ts
interface ProviderAutomation {
  validateCookies(): Promise<void>
  bootstrapContext(): Promise<void>
  loginWithCookies(): Promise<void>
  generateImage(input: GenerateImageInput): Promise<ArtifactResult[]>
  generateVideo(input: GenerateVideoInput): Promise<ArtifactResult[]>
}
```

Implementations:

- `GrokAutomationProvider`
- `FlowAutomationProvider`
- `DreaminaAutomationProvider`

## 9. Grok automation

### Input

- cookie hợp lệ cho `grok.com`
- prompt
- runtime settings

### Flow khuyến nghị

1. open site
2. inject cookie/storage state
3. xác minh session còn sống
4. chuyển đến khu vực generation
5. submit prompt
6. chờ result
7. tải artifact

### Rủi ro

- selector thay đổi
- anti-bot detection
- cookie expired
- site throttle

## 10. Flow automation

### Input

- cookie/session cho `labs.google`/Flow
- prompt
- runtime settings

### Flow khuyến nghị

1. open provider page
2. restore session
3. verify logged-in state
4. submit generation task
5. collect image/video

### Rủi ro

- login redirect
- region limitation
- UI flow thay đổi

## 11. Error handling

Mỗi job cần ghi rõ:

- error code
- error message
- screenshot path
- page html snapshot path nếu cần
- retry count

Các nhóm lỗi:

- `COOKIE_INVALID`
- `PROXY_UNAVAILABLE`
- `LOGIN_FAILED`
- `SELECTOR_NOT_FOUND`
- `GENERATION_TIMEOUT`
- `ARTIFACT_DOWNLOAD_FAILED`
- `UNEXPECTED_PROVIDER_LAYOUT`

## 12. Artifact handling

Artifact có thể gồm:

- image
- video
- thumbnail
- metadata json
- logs

Worker cần:

- lưu file ra storage
- đăng ký artifact vào DB
- trả URL/path cho API layer

## 13. Cleanup strategy

Sau mỗi job:

- đóng page
- đóng context
- đóng browser nếu cần
- giải phóng semaphore concurrency

Nếu worker crash:

- job cần timeout recovery
- chuyển về `queued` hoặc `failed` theo policy

## 14. Observability

Worker nên log:

- job claimed
- browser launched
- provider selected
- session restored
- step transitions
- artifact exported
- job completed/failed

Metrics nên có:

- active jobs
- queued jobs
- avg job duration
- success rate theo provider
- fail rate theo provider

## 15. Phase implementation gợi ý

### Phase 1

- queue polling cơ bản
- single worker
- single browser type
- `headless=true`
- `grok` image generation flow cơ bản

### Phase 2

- thêm `flow`
- thêm video jobs
- thêm retry
- thêm screenshot khi lỗi

### Phase 3

- distributed workers
- stronger concurrency controls
- richer observability
- provider plugin system

## 16. Kết luận

Worker phải được coi là runtime độc lập với API. Đây là phần quyết định dự án có chạy được ở thực tế hay không. Nếu API là lớp quản trị và orchestration, thì worker là lớp tạo giá trị thật thông qua:

- session isolation
- headless automation
- concurrency control
- artifact generation
