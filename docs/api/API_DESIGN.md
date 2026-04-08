# FlowGrok API Design

## 1. Mục tiêu

Tài liệu này mô tả API contract đề xuất để triển khai hệ thống theo [PROFILE_AUTOMATION_SYSTEM_ANALYSIS.md](/home/vpsroot/projects/frontend/FlowGrok/docs/architecture/PROFILE_AUTOMATION_SYSTEM_ANALYSIS.md).

API được chia thành 3 nhóm:

- Web admin API
- Internal worker API
- External client API

## 2. Chuẩn chung

- Base path: `/api/v1`
- Auth web admin: `Authorization: Bearer <jwt>`
- Auth external client: `Authorization: Bearer <api_key>`
- Response lỗi chuẩn:

```json
{
  "status": "error",
  "code": "validation_error",
  "message": "Human readable message",
  "details": {}
}
```

## 3. Auth API

### `POST /auth/register`

- tạo user mới

### `POST /auth/login`

- login và nhận JWT

### `GET /auth/me`

- lấy user hiện tại

### `POST /auth/api-keys`

- tạo API key mới

### `GET /auth/api-keys`

- liệt kê API key của user

### `DELETE /auth/api-keys/{id}`

- revoke key

## 4. Profiles API

### `GET /profiles`

Query:

- `category`
- `status`
- `proxy_id`
- `search`
- `skip`
- `limit`

Response:

- list profile
- pagination metadata ở phase sau nếu cần

### `POST /profiles`

Payload:

```json
{
  "name": "Grok Main 01",
  "description": "Primary Grok account",
  "category": "grok",
  "proxy_id": "uuid-or-null",
  "headless": true,
  "concurrency_limit": 1
}
```

### `GET /profiles/{id}`

- lấy chi tiết profile

### `PATCH /profiles/{id}`

- cập nhật metadata profile

### `DELETE /profiles/{id}`

- soft delete hoặc hard delete theo policy

### `POST /profiles/{id}/cookies/import`

Mục đích:

- import cookie qua file `txt` hoặc `json`

Gợi ý:

- dùng multipart upload

Fields:

- `file`
- `source_type`

Response:

- import summary

### `POST /profiles/{id}/cookies/validate`

- validate cookie hiện tại của profile theo provider

Response ví dụ:

```json
{
  "status": "success",
  "provider": "grok",
  "valid": true,
  "account_hint": "user@example.com"
}
```

### `GET /profiles/{id}/cookie-imports`

- lịch sử import cookie

### `GET /profiles/{id}/runtime-settings`

- lấy runtime settings

### `PUT /profiles/{id}/runtime-settings`

Payload:

```json
{
  "browser_type": "chromium",
  "headless": true,
  "timeout_ms": 120000,
  "navigation_timeout_ms": 60000,
  "concurrency_limit": 1
}
```

### `GET /profiles/{id}/antidetect-settings`

- lấy antidetect settings

### `PUT /profiles/{id}/antidetect-settings`

Payload:

```json
{
  "user_agent": "Mozilla/5.0 ...",
  "viewport_width": 1366,
  "viewport_height": 768,
  "timezone": "Asia/Ho_Chi_Minh",
  "locale": "vi-VN",
  "platform": "Win32",
  "webrtc_mode": "proxy",
  "canvas_mode": "noise"
}
```

### `POST /profiles/{id}/test-login`

- worker thực hiện check login hợp lệ với cookie hiện có

## 5. Proxies API

### `GET /proxies`

Query:

- `status`
- `search`
- `skip`
- `limit`

### `POST /proxies`

Payload:

```json
{
  "ip": "1.2.3.4",
  "port": 8080,
  "protocol": "http",
  "username": "user",
  "password": "pass"
}
```

### `PATCH /proxies/{id}`

- cập nhật proxy

### `DELETE /proxies/{id}`

- xóa proxy

### `POST /proxies/{id}/health-check`

- chạy proxy health check

Response:

```json
{
  "status": "success",
  "proxy_status": "alive",
  "latency_ms": 812
}
```

## 6. Jobs API

### `GET /jobs`

Query:

- `status`
- `provider`
- `job_type`
- `profile_id`
- `skip`
- `limit`

### `POST /jobs`

Payload:

```json
{
  "profile_id": "uuid",
  "job_type": "generate_image",
  "prompt": "A cinematic futuristic city at sunset",
  "request_payload": {
    "aspect_ratio": "16:9",
    "quality": "high"
  }
}
```

Validation:

- profile tồn tại
- profile enabled
- category tương thích
- profile có cookie hợp lệ
- chưa vượt `concurrency_limit`

### `GET /jobs/{id}`

- lấy chi tiết job

### `POST /jobs/{id}/cancel`

- cancel job đang queue/running

### `GET /jobs/{id}/artifacts`

- list artifacts của job

## 7. External Client API

Nhóm này dành cho user dùng API key.

### `POST /client/jobs/image`

Payload:

```json
{
  "profile_id": "uuid",
  "provider": "grok",
  "prompt": "A realistic astronaut portrait",
  "options": {
    "aspect_ratio": "1:1"
  }
}
```

### `POST /client/jobs/video`

Payload tương tự nhưng `job_type = generate_video`

### `GET /client/jobs/{id}`

- client query trạng thái job

### `GET /client/jobs/{id}/artifacts`

- lấy artifact output

## 8. Internal Worker API

Nếu worker không đọc DB trực tiếp mà gọi API nội bộ, có thể có:

### `POST /internal/jobs/claim`

- worker xin nhận 1 job tiếp theo

### `POST /internal/jobs/{id}/heartbeat`

- cập nhật worker vẫn sống

### `POST /internal/jobs/{id}/status`

- update status transition

### `POST /internal/jobs/{id}/artifacts`

- đăng ký artifact output

### `POST /internal/profiles/{id}/storage/bootstrap`

- đảm bảo storage path đã sẵn sàng

## 9. API status model đề xuất

### Profile statuses

- `idle`
- `running`
- `cookie_dead`
- `error`
- `disabled`

### Proxy statuses

- `alive`
- `dead`
- `unknown`

### Job statuses

- `queued`
- `reserved`
- `booting_browser`
- `logging_in`
- `running`
- `uploading_result`
- `completed`
- `failed`
- `cancelled`

## 10. Gợi ý triển khai phase đầu

Phase 1 nên làm trước các endpoint:

- `GET /profiles`
- `POST /profiles`
- `PATCH /profiles/{id}`
- `POST /profiles/{id}/cookies/import`
- `GET /profiles/{id}/runtime-settings`
- `PUT /profiles/{id}/runtime-settings`
- `GET /profiles/{id}/antidetect-settings`
- `PUT /profiles/{id}/antidetect-settings`
- `POST /jobs`
- `GET /jobs`
- `GET /jobs/{id}`
- `POST /proxies/{id}/health-check`

## 11. Kết luận

API cần được tách đúng vai trò:

- admin UI dùng JWT
- external client dùng API key
- worker cập nhật trạng thái job theo async flow

Nếu giữ được ranh giới này, backend sẽ dễ mở rộng và dễ bảo trì khi thêm Grok/Flow/Dreamina provider.
