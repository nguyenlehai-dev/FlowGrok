# FlowGrok FE Deployment Flow

## Domain Mapping

- `staging` branch -> `https://testflowgrok.plxeditor.com/`
- `prod` branch -> `https://flowgrok.plxeditor.com/login`

Production user entrypoint:

- `https://flowgrok.plxeditor.com/login`

## Source Model

- Chỉ có **1 source gốc** để phát triển:
  - `/home/vpsroot/projects/frontend/FlowGrok`
- Server không chạy frontend trực tiếp từ source.
- Frontend được build ra `dist/`, sau đó Nginx hoặc BT Panel serve static files.

## Release Flow

1. Develop trong source repo `/home/vpsroot/projects/frontend/FlowGrok`
2. Commit và push branch làm việc
3. Promote commit cần test lên `staging`
4. Build frontend từ branch `staging`
5. Deploy bản build lên `testflowgrok.plxeditor.com`
6. Validate trên test
7. Promote commit đã validate lên `prod`
8. Build lại từ `prod`
9. Deploy lên `flowgrok.plxeditor.com`

Short form:

- `source -> staging -> build -> test -> promote -> prod -> build -> prod`

## SOP

1. Sửa code trong `/home/vpsroot/projects/frontend/FlowGrok`
2. Kiểm tra lại branch và thay đổi local
3. Build thử local để chắc chắn `dist/` tạo được
4. Commit thay đổi
5. Push branch hiện tại
6. Promote lên `staging`
7. Checkout `staging` và pull bản mới nhất
8. Chạy `npm run build`
9. Sync nội dung `dist/` lên web root test
10. QA trên `https://testflowgrok.plxeditor.com/`
11. Promote `staging -> prod`
12. Checkout `prod` và pull bản mới nhất
13. Chạy lại `npm run build`
14. Sync `dist/` lên web root production
15. Smoke test `https://flowgrok.plxeditor.com/login`

Lệnh thường dùng:

```bash
cd /home/vpsroot/projects/frontend/FlowGrok
git status
npm install
npm run build
git add .
git commit -m "feat: mo ta thay doi"
git push origin staging
```

Promote branch bằng script:

```bash
cd /home/vpsroot/projects/frontend/FlowGrok
./scripts/promote-branch.sh staging prod
```

Ví dụ sync bản build lên test:

```bash
cd /home/vpsroot/projects/frontend/FlowGrok
./scripts/deploy-static.sh staging
```

Ví dụ sync bản build lên production:

```bash
cd /home/vpsroot/projects/frontend/FlowGrok
./scripts/deploy-static.sh prod
```

## Runtime Config

- Source path:
  - `/home/vpsroot/projects/frontend/FlowGrok`
- Build command:
  - `npm run build`
- Build output:
  - `/home/vpsroot/projects/frontend/FlowGrok/dist`
- Promote script:
  - `/home/vpsroot/projects/frontend/FlowGrok/scripts/promote-branch.sh`
- Deploy script:
  - `/home/vpsroot/projects/frontend/FlowGrok/scripts/deploy-static.sh`
- Test vhost:
  - `/home/vpsroot/projects/frontend/FlowGrok/deploy/testflowgrok.plxeditor.com.btpanel.conf`
- Prod vhost:
  - `/home/vpsroot/projects/frontend/FlowGrok/deploy/flowgrok.plxeditor.com.btpanel.conf`
- API base:
  - mặc định dùng `window.location.origin`
- Nginx reverse proxy:
  - `/api/` -> `http://127.0.0.1:8080/api/`

## Verify

```bash
curl -I https://testflowgrok.plxeditor.com/
curl -I https://flowgrok.plxeditor.com/login
curl -I https://flowgrok.plxeditor.com/api/v1/auth/me
```

## Rules

- Không sửa trực tiếp file trong web root nếu thay đổi đó thuộc source code
- Không copy tay file lẻ từ repo lên server; chỉ deploy bằng bản build `dist/`
- FE luôn phải tương thích với BE đang được reverse proxy tại `127.0.0.1:8080`
- Nếu chưa có branch `prod`, phải tạo branch release rõ ràng trước khi áp dụng flow `staging -> prod`
