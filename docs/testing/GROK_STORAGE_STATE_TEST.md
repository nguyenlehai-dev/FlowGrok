# Grok Storage State Test

## Mục tiêu

Tài liệu này hướng dẫn cách lấy `storage_state.json` từ browser đang đăng nhập `grok.com`, sau đó import vào FlowGrok để test `test-login` và `job runner`.

## 1. Chuẩn bị

- Mở Chrome hoặc Chromium
- Đăng nhập tài khoản thật tại `https://grok.com`
- Đảm bảo tab `grok.com` đang mở và session còn sống

## 2. Lấy `storage_state.json`

### Cách khuyến nghị

Chạy Playwright từ máy local có cùng browser profile đang đăng nhập:

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch_persistent_context(
        user_data_dir="/path/to/your/chrome-profile",
        headless=False,
    )
    page = browser.new_page()
    page.goto("https://grok.com", wait_until="domcontentloaded")
    browser.storage_state(path="storage_state.json")
```

Kết quả:

- file `storage_state.json`
- chứa:
  - `cookies`
  - `origins`

### Nếu không dùng Playwright local

Dùng extension browser để export cookie JSON, nhưng cách này kém ổn định hơn `storage_state.json`.

## 3. Import vào FlowGrok

1. Vào `Profiles`
2. Tạo hoặc mở profile có `category = grok`
3. Ở phần `Cookie Import`
4. Chọn `source_type = storage_state_json`
5. Upload file `storage_state.json`

Kỳ vọng:

- import trả `success`
- `valid_count > 0`

## 4. Test Login

1. Bấm `Test Login`
2. Kiểm tra các field trả về:

- `status`
- `valid`
- `message`
- `error_code`
- `cookie_state`
- `login_state`

## 5. Cách đọc kết quả

### Thành công

```json
{
  "status": "success",
  "valid": true
}
```

Và `login_state.looks_logged_in = true`

### Session chưa đủ tốt

- `COOKIE_INVALID`
- `cookie_needs_review`
- `has_challenge = true`

Trường hợp này thường là:

- session hết hạn
- thiếu cookie
- bị Cloudflare challenge

## 6. Test Job

1. Vào `Jobs`
2. Tạo job với profile Grok vừa import
3. Bấm `Run Worker`

Kỳ vọng:

- nếu selector và session đúng: job tiến xa hơn vào flow generate
- nếu chưa đúng: job sẽ `failed` có kiểm soát và có `error_logs`

## 7. Debug server

Artifact và log nằm ở:

- `/home/vpsroot/projects/backend/-FlowGrok-BE/storage/jobs/{job_id}/artifacts/`
- `/home/vpsroot/projects/backend/-FlowGrok-BE/storage/jobs/{job_id}/logs/`

## 8. Ghi chú

- `storage_state.json` tốt hơn cookie txt/json
- với Grok, nếu thấy title `Just a moment...` thì đang bị challenge, không nên coi là login thành công
