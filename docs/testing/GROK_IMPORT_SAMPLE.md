# Grok Import Sample

Tài liệu này cung cấp file mẫu đúng schema để import vào FlowGrok. Đây chỉ là **sample format**, không phải session thật.

## File mẫu

- Storage state mẫu:
  - `/home/vpsroot/projects/frontend/FlowGrok/docs/testing/samples/grok-storage-state.sample.json`
- Cookie JSON mẫu:
  - `/home/vpsroot/projects/frontend/FlowGrok/docs/testing/samples/grok-cookies.sample.json`

## Khi nào dùng file nào

- Ưu tiên `grok-storage-state.sample.json`
  - dùng khi bạn export từ Playwright hoặc browser state đầy đủ
- Chỉ dùng `grok-cookies.sample.json`
  - khi bạn chỉ có cookie JSON từ extension browser

## Những gì phải thay bằng dữ liệu thật

Các giá trị dưới đây chỉ là placeholder:

- `REPLACE_WITH_REAL_GROK_COOKIE`
- `REPLACE_WITH_REAL_CF_CLEARANCE`
- `REPLACE_WITH_REAL_X_CSRF_TOKEN`

Nếu giữ nguyên placeholder này, import vẫn có thể parse được nhưng `test-login` hoặc `job runner` sẽ fail với:

- `COOKIE_INVALID`

## Import bằng UI

1. Vào `https://flowgrok.plxeditor.com/login`
2. Đăng nhập
3. Mở `Profiles`
4. Chọn hoặc tạo profile có `category = grok`
5. Tại `Cookie Import`
6. Chọn:
   - `storage_state_json` nếu dùng file storage state
   - `json` nếu dùng file cookie JSON
7. Upload file
8. Bấm `Test Login`

## Import bằng API

Ví dụ với `storage_state.json`:

```bash
TOKEN="REPLACE_WITH_BEARER_TOKEN"
PROFILE_ID="REPLACE_WITH_PROFILE_ID"

curl -X POST "https://flowgrok.plxeditor.com/api/v1/profiles/${PROFILE_ID}/cookies/import" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "source_type=storage_state_json" \
  -F "file=@/home/vpsroot/projects/frontend/FlowGrok/docs/testing/samples/grok-storage-state.sample.json"
```

Ví dụ với `cookies.json`:

```bash
TOKEN="REPLACE_WITH_BEARER_TOKEN"
PROFILE_ID="REPLACE_WITH_PROFILE_ID"

curl -X POST "https://flowgrok.plxeditor.com/api/v1/profiles/${PROFILE_ID}/cookies/import" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "source_type=json" \
  -F "file=@/home/vpsroot/projects/frontend/FlowGrok/docs/testing/samples/grok-cookies.sample.json"
```

## Kỳ vọng sau import

- API trả `import_status = success`
- `valid_count > 0`
- profile có:
  - `cookie_source_type`
  - `cookie_import_name`
  - `storage_path`
  - `provider_config.storage_state_path`

## Kiểm tra nhanh

Sau import, gọi:

```bash
curl -X POST "https://flowgrok.plxeditor.com/api/v1/profiles/${PROFILE_ID}/test-login" \
  -H "Authorization: Bearer ${TOKEN}"
```

Nếu session thật còn sống, bạn kỳ vọng:

```json
{
  "status": "success",
  "valid": true
}
```

## Ghi chú

- Với Grok, `storage_state_json` ổn định hơn `cookies.json`
- Nếu gặp Cloudflare challenge, cần export lại session sạch hơn
- File sample này chủ yếu để chỉ ra đúng schema backend đang parse
