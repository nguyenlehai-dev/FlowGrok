# FlowGrok Prod Rollout Checklist

## 1. Pham vi

Checklist nay dung cho tinh huong:

- giu nguyen `test` vi khach dang chay
- chi be logic Grok tu `test` len `prod`
- giam rui ro dung nham runtime hoac tai nguyen cua `test`

## 2. Xac nhan moi truong dich

- [x] Chi thao tac tren server `prod`: `192.168.100.68`
- [x] Chi thao tac trong thu muc `/home/vpsroot/apps/gatewaygrok-prod/`
- [x] Chi nham toi container `gatewaygrok-api-prod`
- [x] Chi nham toi container `gatewaygrok-frontend-prod`

## 3. Xac nhan moi truong khong duoc dung

- [x] Khong sua gi trong `/home/vpsroot/apps/gatewaygrok-staging/`
- [x] Khong restart `gatewaygrok-api-test`
- [x] Khong restart `gatewaygrok-frontend-staging`
- [x] Khong chay `docker compose` trong thu muc `gatewaygrok-staging`

## 4. Xac minh tach biet giua test va prod

- [x] `test` va `prod` nam tren 2 VPS khac nhau
- [x] `test` co DB rieng: `sqlite:///./storage-test/gatewaygrok_test.db`
- [x] `prod` co DB rieng: `sqlite:///./storage/gatewaygrok_prod.db`
- [x] `test` co storage rieng: `/home/vpsroot/apps/gatewaygrok-staging/be/storage-test`
- [x] `prod` co storage rieng: `/home/vpsroot/apps/gatewaygrok-prod/be/storage`
- [x] `test` va `prod` khong dung chung queue broker
- [x] `test` va `prod` khong dung chung Redis`
- [x] `test` va `prod` khong dung chung Postgres
- [x] `test` va `prod` khong dung chung profile path hoac artifact path

## 5. Kiem tra file runtime dung cua prod

- [x] Backend compose `prod`: `/home/vpsroot/apps/gatewaygrok-prod/be/docker-compose.yml`
- [x] Backend env `prod`: `/home/vpsroot/apps/gatewaygrok-prod/be/.env`
- [x] Frontend compose `prod`: `/home/vpsroot/apps/gatewaygrok-prod/fe/docker-compose.yml`
- [x] Frontend env `prod`: `/home/vpsroot/apps/gatewaygrok-prod/fe/.env`
- [x] Xac nhan `COMPOSE_PROJECT_NAME=gatewaygrok-prod-be`
- [x] Xac nhan `APP_CONTAINER_NAME=gatewaygrok-api-prod`
- [x] Xac nhan `FRONTEND_CONTAINER_NAME=gatewaygrok-frontend-prod`

## 6. Ghi nho khac biet cua test

- [x] Nho rang backend `test` runtime that dang dung `docker-compose.test.yml`
- [x] Nho rang backend `test` runtime that dang dung `.env.test`
- [x] Khong copy nguyen xi port, container name, path, env tu `test`
- [x] Khong copy `storage-test` sang `prod`

## 7. Baseline truoc khi doi prod

- [x] Ghi lai `docker ps` hien tai cua `prod`
- [x] Ghi lai `docker stats --no-stream` hien tai
- [x] Ghi lai RAM hien tai cua `gatewaygrok-api-prod`
- [ ] Ghi lai CPU hien tai cua `gatewaygrok-api-prod`
- [x] Ghi lai trang thai healthcheck cua `gatewaygrok-api-prod`
- [x] Ghi lai so luong profile trong `prod`
- [x] Ghi lai dung luong thu muc `/home/vpsroot/apps/gatewaygrok-prod/be/storage`
- [ ] Tao commit hoac backup trang thai code hien tai cua `prod`

## 8. Khi copy logic tu test sang prod

- [x] Chi copy logic nghiep vu can thiet
- [x] Khong copy file cau hinh moi truong test sang prod
- [x] Khong copy domain test sang prod
- [x] Khong copy port test sang prod
- [x] Khong copy bien moi truong danh rieng cho test
- [x] Soat lai cac thay doi lien quan toi `Playwright`
- [x] Soat lai cac thay doi lien quan toi `browser/context/page`
- [x] Soat lai cac thay doi lien quan toi `profile runtime`
- [x] Soat lai cac thay doi lien quan toi `queue`
- [x] Soat lai cac thay doi lien quan toi `cleanup finally`

## 9. Nhung diem phai kiem tra ky truoc deploy

- [x] `GATEWAY_DATABASE_URL` van tro dung DB `prod`
- [x] Volume mount van la `./storage:/app/storage`
- [x] `APP_PORT` cua `prod` van dung
- [x] `FRONTEND_PORT` cua `prod` van dung
- [x] `VITE_API_BASE_URL` cua frontend van dung
- [x] `GATEWAY_CORS_ORIGINS` khong bi thay nham
- [x] `AUTO_LOGIN_PROFILE_ID` neu con dung thi van la profile hop le tren `prod`
- [x] Khong co hardcode path tu `test`
- [x] Khong co hardcode container name tu `test`
- [x] Khong co hardcode profile id cua `test`

## 10. Deploy an toan

- [x] Chi chay lenh deploy trong `/home/vpsroot/apps/gatewaygrok-prod/be`
- [x] Chi rebuild backend `prod` khi backend co thay doi
- [x] Chi rebuild frontend `prod` khi frontend co thay doi
- [x] Khong restart cac service ngoai Grok neu khong can
- [x] Khong thay nginx/global reverse proxy neu khong bat buoc
- [x] Khong dung cac project khac nhu `video-*`, `gateway-prod-*`, `project_prod_web`

## 11. Kiem tra ngay sau deploy

- [x] `gatewaygrok-api-prod` o trang thai `Up` va `healthy`
- [x] `gatewaygrok-frontend-prod` o trang thai `Up`
- [x] API health tra ve binh thuong
- [x] UI dang nhap duoc
- [x] Danh sach profile tai duoc
- [x] Tao duoc mot job thu tren `prod`
- [x] Luong `image_to_video` tra ve file video that, khong con download nham PNG
- [x] Job thu khong lam crash container
- [x] Browser/tab duoc don sau khi job xong
- [x] Browser warm theo profile co `idle timeout` va tu dong dong sau khi profile rong

## 12. Theo doi sau deploy

- [x] Kiem tra RAM container sau `5 phut`
- [x] Kiem tra RAM container sau `15 phut`
- [ ] Kiem tra RAM container sau `30 phut`
- [x] Kiem tra so process `Chromium` con song
- [x] Kiem tra so tab/profile con mo sau khi job xong
- [x] Kiem tra log loi cua `Playwright`
- [x] Kiem tra job co bi treo o `queued`, `running`, `uploading_result` qua lau khong

## 13. Dieu kien dung rollout

- [x] Container bi restart loop
- [x] Healthcheck fail lien tuc
- [x] RAM tang nhanh bat thuong
- [x] Job fail hang loat
- [x] Chromium renderer khong tu don
- [ ] Profile runtime khong dong sau idle timeout
- [x] Xuat hien loi anh huong service khac tren `prod`

Ghi chu:

- Cac muc tren da duoc xac minh theo nghia "da kiem tra va khong gap van de" trong qua trinh rollout.
- `idle timeout` cho profile runtime chua duoc trien khai thanh co che rieng; hien tai runtime van on nho on-demand browser va cleanup sau job.

## 14. Rollback

- [ ] Co san commit hoac image truoc khi deploy
- [x] Co the redeploy lai ban truoc cua `prod`
- [x] Rollback chi thuc hien tren `prod`
- [x] Sau rollback, kiem tra lai `healthy`, RAM va job test nhanh

## 15. Ket qua rollout da hoan tat

Nhung phan da thuc hien xong tren `prod`:

- [x] Tat co che browser/watchdog nen chay lien tuc cho job Grok
- [x] Chuyen Grok sang browser mo theo nhu cau
- [x] Warm session theo nhu cau thay vi giu live browser nen
- [x] Them `idle timeout` cho browser warm theo profile de tai su dung ngan han nhung van tu dong dong sau khi rong
- [x] Chuyen browser job sang wrapper `xvfb-run` de Grok headed van chay on dinh
- [x] Dong bo source host `prod` voi runtime dang chay
- [x] Them `tini -s` de reap process tot hon trong container
- [x] Bo `Xvfb` nen khoi `start_api.sh`
- [x] Xac minh khong con zombie process tich tu nhu truoc
- [x] Xac minh Grok image generation chay thanh cong end-to-end tren `prod`
- [x] Them file log rieng cho lifecycle browser/job: `/app/storage/runtime/browser-jobs.log`
- [x] Cap nhat prod FE tao job theo client flow `/client/generate` thay vi admin create job cu
- [x] Cap nhat prod FE form Jobs de map payload sat schema client cua BE (`profile_id`, `ratio`, `quality`, `duration`, `reference_images`, `provider_payload`)
- [x] Cap nhat prod FE cho phep auto-select profile nhung van hien dung option Grok theo pool prod hien tai
- [x] Chot luong `image_to_video` tren prod: uu tien nut `Make video`, chi chap nhan output `.mp4/.webm/.mov`, khong coi PNG la video thanh cong
- [x] Rut gon thong bao loi tren danh sach job FE: hien loi than thien o card, giu full traceback trong modal `Review`
- [x] Them hien thi rieng cho job bi chan noi dung 18+/sensitive tren FE card: chip `18+`, nen/ vien canh bao, summary ngan
- [x] Fix session guard prod de auto-pick profile retry khi Grok vua warm browser con state `unknown`, tranh cooldown nham va khong bat user gan `profile_id`
- [x] Fix Grok image extractor cho anh portrait/narrow card: khong fail nham `No media output captured` khi Grok da tao anh nhung UI hien thi rong duoi 280px
- [x] Tang warm browser idle timeout len `600s` de giam do tre submit dau sau idle ma van tu dong dong browser
- [x] Rut ngan image submit wait: neu Grok giu submit disabled thi fallback/ket thuc som hon, tranh cho Playwright mac dinh qua lau
- [x] Fix image-to-video submit detector cho UI Grok moi: fallback click nut mui ten custom o goc composer khi selector button/role khong bat duoc

## 16. Job xac minh da chay thanh cong

Mot so job da verify thanh cong tren `prod`:

- [x] `84b6034e-c287-44da-807d-cb0f4e8721f7`
- [x] `2fd107b2-640c-4ded-969e-155729cd87c1`
- [x] `53ff1181-4a53-430f-a219-2e3eabacf0c1`
- [x] `0fcb269e-ffdf-46c8-a0c9-61a2f010aa64`
- [x] `d44a6c5c-b246-481d-a8d8-b432faa4782b`
- [x] `be03458e-bfa2-4ea6-8e4e-788816d1bc1d`
- [x] `de3e8a1f-7bd6-4ad9-9085-6b16e1ebf9ce` (`image_to_video` sau khi fix da tra ve `.mp4`)
- [x] `c7d085b8-1b82-4dab-9709-984a315d60cd` (`image` retry sau khi fix extractor da capture duoc anh)
- [x] `591329c0-106d-4175-b2ee-df9f9d6ee90d` (`image` retry sau submit-wait fix da capture duoc anh)
- [x] `9a84a9ef-51d5-4bfc-b27b-a5d8cd0ac433` (`image_to_video` retry sau submit-detector fix da tra ve `.mp4`)

## 17. Ket luan van hanh

Tai thoi diem cap nhat tai lieu nay, rollout Grok tu `test` len `prod` duoc xem la da:

- [x] Gioi han dung pham vi
- [x] Khong dung `test`
- [x] Khong dung storage/DB cua `test`
- [x] Dua `prod` ve trang thai chay duoc, on dinh, va de quan sat hon
