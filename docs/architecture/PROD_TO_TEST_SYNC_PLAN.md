# Prod To Test Sync Plan

## 1. Muc tieu

Dong bo logic/code/config runtime dang chay on dinh tren `prod` ve moi truong `test/staging`, de test co cung flow chuan nhu prod.

Nguyen tac quan trong nhat: **khong sua, khong restart, khong rebuild, khong ghi file, khong copy DB khach hang tu prod**. Prod chi duoc dung lam nguon tham chieu read-only.

## 2. Pham vi

Moi truong nguon:

- Server prod: `192.168.100.68`
- Hostname prod: `pro`
- Backend prod container: `gatewaygrok-api-prod`
- Frontend prod container: `gatewaygrok-frontend-prod`
- Backend prod path da biet: `/home/vpsroot/apps/gatewaygrok-prod/be`
- Frontend prod path da biet: `/home/vpsroot/apps/gatewaygrok-prod/fe`
- Public domain prod: `https://flowgrok.plxeditor.com/`

Moi truong dich:

- Server test/dev: `192.168.100.67`
- Hostname test/dev: `dev`
- Backend staging container hien tai: `gatewaygrok-api-staging`
- Frontend staging container hien tai: `gatewaygrok-frontend-staging`
- Backend staging path da biet: `/home/vpsroot/apps/gatewaygrok-staging/be`
- Frontend staging path da biet: `/home/vpsroot/apps/gatewaygrok-staging/fe`
- Public domain test: `https://testflowgrok.plxeditor.com/`

## 3. Khong Duoc Lam

- Khong chay `docker compose up`, `docker compose down`, `docker restart`, `docker stop`, `docker rm`, hoac bat ky lenh thay doi nao tren prod.
- Khong sua file trong `/home/vpsroot/apps/gatewaygrok-prod/`.
- Khong copy database prod sang test.
- Khong copy storage output/profiles khach hang prod sang test.
- Khong copy API keys, session tokens, cookies, hoac credential khach hang prod sang test.
- Khong tro test vao Redis/Postgres/SQLite/storage cua prod.
- Khong thay doi Cloudflare, reverse proxy global, DNS, hoac nginx manager neu chua co buoc verify rieng.

## 4. Nguyen Tac An Toan

- Prod la read-only source of truth.
- Moi file lay tu prod phai di qua thu muc staging tam tren may test, khong ghi de truc tiep runtime test.
- Truoc khi thay test, tao backup current test config/source.
- Moi config moi cho test phai duoc sanitize:
  - Doi domain prod thanh test domain.
  - Doi port prod thanh test port.
  - Doi container name prod thanh staging/test container name.
  - Doi database URL sang DB test rieng.
  - Doi storage path sang storage test rieng.
  - Loai bo secret/key/session/cookie prod.
- Chi promote vao runtime test sau khi diff da duoc review.

## 5. Baseline Hien Tai

Tinh trang da check ngay 2026-04-16:

- Prod FE public `https://flowgrok.plxeditor.com/login`: `200 OK`.
- Prod API public `https://flowgrok.plxeditor.com/api/health`: `200 OK`.
- Prod backend container: `gatewaygrok-api-prod` dang `healthy`.
- Prod frontend container: `gatewaygrok-frontend-prod` dang `Up`.
- Prod logs co job Grok thanh cong gan day.
- Test FE public `https://testflowgrok.plxeditor.com/`: `200 OK`.
- Test backend noi bo qua `127.0.0.1:18083/api/health`: `200 OK`.
- Test public API `https://testflowgrok.plxeditor.com/api/health`: timeout.
- Nguyen nhan test public API: frontend staging nginx dang proxy sai port `18084`, trong khi backend staging that dang publish `18083`.

## 6. Lo Trinh Thuc Hien

### Phase 0 - Dong Bang Quyen Thao Tac

Muc tieu: dam bao khong ai vo tinh tac dong prod.

Buoc thuc hien:

1. Xac nhan lai chi duoc chay lenh doc tren prod.
2. Tao bien/alias command rieng cho prod read-only va test writable.
3. Ghi lai timestamp bat dau.
4. Ghi lai danh sach container prod va test hien tai bang lenh read-only.

Lenh duoc phep tren prod:

```bash
hostname
pwd
ls -la
find
grep
sed -n
cat
docker ps
docker inspect
docker logs --tail
docker compose config
git status
git rev-parse HEAD
git log -1 --oneline
curl -fsS
```

Lenh cam tren prod:

```bash
docker compose up
docker compose down
docker compose restart
docker restart
docker stop
docker rm
docker rmi
docker exec sh -lc "echo ... > file"
sed -i
cp
mv
rm
rsync --delete
git pull
git checkout
git reset
```

### Phase 1 - Inventory Prod Read-Only

Muc tieu: chup lai ban do runtime prod ma khong thay doi gi.

Can thu thap:

- `docker ps` cua prod.
- `docker inspect` cho `gatewaygrok-api-prod` va `gatewaygrok-frontend-prod`.
- `docker compose config` trong thu muc prod BE/FE neu co.
- Danh sach file config prod:
  - `docker-compose.yml`
  - `.env` chi doc de biet key name, khong dua secret raw vao docs.
  - `nginx.conf`
  - `nginx.prod.conf` neu co.
  - `Dockerfile` va `Dockerfile.prod` neu co.
- Git commit/source version cua prod neu thu muc la git repo.
- Health endpoints dang dung:
  - FE root/login.
  - BE `/api/health`.
  - Cac route can thiet nhu `/api/jobs`, `/api/overview`, `/api/profiles` neu can smoke test.

Output cua phase nay:

- Mot thu muc artifact local/test, vi du:

```text
/home/vpsroot/sync-audit/prod-readonly-YYYYMMDD-HHMM/
```

- File tong hop:

```text
prod-runtime-inventory.txt
prod-compose-config.redacted.yml
prod-env.keys-only.txt
prod-container-inspect.redacted.json
```

### Phase 2 - Backup Test Truoc Khi Ghi De

Muc tieu: co diem rollback cho test.

Thuc hien tren test/dev:

1. Tao thu muc backup:

```bash
/home/vpsroot/backups/gatewaygrok-staging-before-prod-sync-YYYYMMDD-HHMM/
```

2. Backup source/config test hien tai:

```bash
/home/vpsroot/apps/gatewaygrok-staging/be
/home/vpsroot/apps/gatewaygrok-staging/fe
```

3. Backup config runtime quan trong:

```text
docker-compose.yml
.env
nginx.conf
nginx.staging.conf
Dockerfile*
```

4. Backup DB test neu test dang co du lieu can giu.

Luu y: backup test duoc phep copy DB test, nhung khong copy DB prod.

### Phase 3 - Lay Logic Tu Prod Ve Test Workspace

Muc tieu: dua logic prod ve test workspace tam, chua ap dung runtime.

Nguon duoc copy tu prod:

- Source code backend, tru `.env`, DB, storage, artifact, cache, browser profile, output media, log.
- Source code frontend, tru `node_modules`, `dist` neu se build lai, log, cache.
- Dockerfile, compose template, nginx config can lam base.

Khong copy tu prod:

```text
.env
*.db
storage/
storage-prod/
profiles/
cookies/
sessions/
logs/
node_modules/
dist/
__pycache__/
.venv/
```

Thu muc tam tren test:

```text
/home/vpsroot/prod-sync-work/gatewaygrok-prod-snapshot/
```

Output cua phase nay:

- Snapshot source prod da sanitize.
- Danh sach file bi exclude.
- Diff giua prod snapshot va test current.

### Phase 4 - Chuyen Hoa Config Prod Thanh Test

Muc tieu: giu logic prod nhung test van tach biet hoan toan.

Mapping bat buoc:

| Prod | Test |
| --- | --- |
| `gatewaygrok-api-prod` | `gatewaygrok-api-staging` |
| `gatewaygrok-frontend-prod` | `gatewaygrok-frontend-staging` |
| `gatewaygrok-prod` | `gatewaygrok-staging` |
| `flowgrok.plxeditor.com` | `testflowgrok.plxeditor.com` |
| `192.168.100.68` | `192.168.100.67` |
| backend port `38081` | backend port `18083` |
| frontend port `38082` | frontend port `8083` |
| prod DB path/name | test DB path/name |
| prod storage path | test storage path |

Config can verify rieng:

- `GATEWAY_DATABASE_URL` phai tro DB test.
- `APP_PORT` phai la port test.
- `FRONTEND_PORT` phai la port test.
- `CORS` phai cho test domain.
- `proxy_pass` trong nginx staging phai tro `192.168.100.67:18083`.
- `COMPOSE_PROJECT_NAME` phai la staging/test.
- Cookie/session/API key seed khong lay tu prod.

### Phase 5 - Dry Run Tren Test

Muc tieu: validate config moi truoc khi thay runtime test.

Thuc hien tren test/dev:

1. Chay `docker compose config` cho BE va FE.
2. Kiem tra khong con chuoi prod nguy hiem trong config staging:

```bash
grep -RIn "flowgrok.plxeditor.com\|192.168.100.68\|gatewaygrok-api-prod\|gatewaygrok-frontend-prod\|gatewaygrok-prod" .
```

3. Kiem tra khong tro DB/storage ve prod:

```bash
grep -RIn "gatewaygrok_prod\|storage-prod\|38081\|38082" .
```

4. Build image test voi tag moi neu can, khong dung tag prod de tranh nham.

Output cua phase nay:

- `docker compose config` pass.
- Secret/config scan pass.
- Build test pass.

### Phase 6 - Apply Len Test

Muc tieu: cap nhat test runtime bang logic prod da sanitize.

Chi thuc hien sau khi Phase 0-5 pass.

Buoc de xuat:

1. Stop/recreate chi container test:

```bash
cd /home/vpsroot/apps/gatewaygrok-staging/be
docker compose up -d --build

cd /home/vpsroot/apps/gatewaygrok-staging/fe
docker compose up -d --build
```

2. Khong thao tac tren prod.
3. Khong dung `--remove-orphans` neu chua review compose project name.
4. Khong dung volume prod.

Neu chi can fix bug public API staging truoc, co the lam buoc nho rieng:

- Doi nginx staging proxy tu `18084` sang `18083`.
- Rebuild/recreate chi `gatewaygrok-frontend-staging`.
- Verify `https://testflowgrok.plxeditor.com/api/health`.

### Phase 7 - Verify Test

Smoke test bat buoc:

```bash
curl -I https://testflowgrok.plxeditor.com/
curl -fsS https://testflowgrok.plxeditor.com/api/health
curl -fsS https://testflowgrok.plxeditor.com/api/overview
```

Kiem tra container:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep gatewaygrok
docker stats --no-stream | grep gatewaygrok
docker logs --tail 100 gatewaygrok-api-staging
docker logs --tail 100 gatewaygrok-frontend-staging
```

Functional test:

- Mo UI test.
- Login bang account test.
- Xac nhan khong thay du lieu khach hang prod.
- Tao API key test neu can.
- Chay mot job Grok test bang profile test.
- Xac nhan output ghi vao storage test.
- Xac nhan job/history khong ghi ve prod.

### Phase 8 - Rollback Test Neu Can

Neu test loi:

1. Khong dong vao prod.
2. Dung backup Phase 2 de restore test source/config.
3. Recreate chi container test.
4. Ghi lai nguyen nhan va diff gay loi.

Rollback target:

```text
/home/vpsroot/backups/gatewaygrok-staging-before-prod-sync-YYYYMMDD-HHMM/
```

## 7. Checklist Truoc Khi Cho Phep Apply

- [ ] Prod da duoc xac nhan read-only.
- [ ] Da co inventory prod redacted.
- [ ] Da backup test current.
- [ ] Snapshot prod khong chua DB/storage/session/key khach hang.
- [ ] Test config da map domain/port/container/DB/storage rieng.
- [ ] `docker compose config` tren test pass.
- [ ] Scan chuoi prod trong test config pass.
- [ ] Co rollback folder.
- [ ] Co lenh verify public test.
- [ ] Chua co bat ky lenh write/restart nao chay tren prod.

## 8. Tieu Chi Hoan Thanh

Test duoc xem la dong bo thanh cong khi:

- `https://testflowgrok.plxeditor.com/` load UI.
- `https://testflowgrok.plxeditor.com/api/health` tra `200 OK`.
- `gatewaygrok-api-staging` healthy.
- `gatewaygrok-frontend-staging` up.
- Test chay duoc flow Grok nhu prod bang du lieu/profile test.
- Khong co route/config nao cua test tro ve DB/storage/container prod.
- Prod van giu nguyen uptime va khong co restart/change trong logs.

## 9. Ghi Chu Rui Ro

- Neu copy `.env` prod nguyen ban sang test se co nguy co test ghi vao DB/storage prod. Viec nay bi cam.
- Neu copy storage/profile prod co the lam lo du lieu khach hang. Viec nay bi cam.
- Neu nginx staging proxy sai port, UI co the load nhung API public timeout. Hien tai test dang gap dung truong hop nay.
- Neu compose project/container name khong doi, co nguy co thao tac nham container. Phai scan truoc khi apply.
- Neu frontend build tu source prod nhung backend test chua dong bo schema, UI co the goi route moi khong ton tai. Can deploy BE test truoc FE test neu co thay doi API.

## 10. Execution Log - 2026-04-16

Trang thai thuc hien:

- Da thuc hien sync prod runtime source sang test.
- Prod chi duoc doc inventory/source; khong ghi file, khong restart, khong rebuild prod.
- Test da duoc backup truoc khi thay doi.

Backup/working paths tren test:

- Backup test truoc sync: `/home/vpsroot/backups/gatewaygrok-staging-before-prod-sync-20260416-085038/gatewaygrok-staging-source-config.tar.gz`
- Audit dir: `/home/vpsroot/sync-audit/prod-to-test-sync-20260416-085038`
- Workspace tam: `/home/vpsroot/prod-sync-work/prod-runtime-snapshot-20260416-0850`

Noi dung da ap dung len test:

- Copy source BE tu prod sang `/home/vpsroot/apps/gatewaygrok-staging/be`.
- Copy source FE tu prod sang `/home/vpsroot/apps/gatewaygrok-staging/fe`.
- Khong copy prod `.env`, DB, storage, profile/session/cookie, `.git`, `node_modules`, `dist`.
- Giu `.env` test va DB/storage test rieng.
- Sanitize nginx FE test:
  - `testflowgrok.plxeditor.com`
  - `192.168.100.67:18083`
- Chinh `.env` test CORS ve `["https://testflowgrok.plxeditor.com"]`.
- Bo sung `.dockerignore` tren test de Docker build khong doc `storage-test`, DB, log, profile runtime.
- Rebuild/recreate chi container test:
  - `gatewaygrok-api-staging`
  - `gatewaygrok-frontend-staging`

Verify sau sync:

- `https://testflowgrok.plxeditor.com/`: `200 OK`
- `https://testflowgrok.plxeditor.com/api/health`: `200 OK`
- `https://testflowgrok.plxeditor.com/api/overview`: `401 Missing admin token`, xac nhan proxy API da vao backend va auth dang hoat dong.
- `gatewaygrok-api-staging`: `healthy`
- `gatewaygrok-frontend-staging`: `Up`
- Scan test source/runtime khong con marker prod nguy hiem:
  - `192.168.100.68`
  - `38081`
  - `38082`
  - `gatewaygrok-api-prod`
  - `gatewaygrok-frontend-prod`
  - `gatewaygrok-prod`

Verify prod sau sync:

- `gatewaygrok-api-prod`: van `Up` va `healthy`
- `gatewaygrok-frontend-prod`: van `Up`
- `https://flowgrok.plxeditor.com/api/health`: `200 OK`

Ghi chu:

- Trong lan sync nay, source prod co nhieu thay doi chua commit tren server prod. Snapshot da lay theo file runtime hien tai tren prod, khong dua theo git branch thuan tuy.
- Neu can rollback test, restore tu backup path o tren va recreate chi container staging.

## 11. Execution Log - Prod Profile Clone To Test - 2026-04-16

Trang thai thuc hien:

- Da clone DB/profile runtime tu prod sang test de test giong prod ve profile/session.
- Prod van chi doc:
  - Doc SQLite prod bang read-only dump qua stdout.
  - Doc `storage/profiles` prod bang tar stream qua stdout.
  - Khong restart, khong rebuild, khong ghi file vao prod.
- Chi restart backend test `gatewaygrok-api-staging`.

Backup test truoc khi thay data:

```text
/home/vpsroot/backups/gatewaygrok-test-data-before-prod-profile-clone-20260416-091051/test-storage-and-storage-test.tar.gz
```

Workspace tam:

```text
/home/vpsroot/prod-sync-work/prod-profile-clone-20260416-0912
```

Noi dung da clone sang test:

- Prod DB `storage/gatewaygrok_prod.db` duoc dump read-only va restore vao test DB filename:

```text
/home/vpsroot/apps/gatewaygrok-staging/be/storage/gatewaygrok_staging.db
```

- Prod profile directories duoc extract vao:

```text
/home/vpsroot/apps/gatewaygrok-staging/be/storage/profiles
```

Profiles test sau clone:

- `fd7f1ba2-7395-4c4e-8e34-09c5fd5cad36` - `Grok-Hotmail-01`
- `a9f18c6e-d319-49d2-87a7-c6e7c601a2f0` - `Plax`

Verify test sau clone:

- `gatewaygrok-api-staging`: `Up` va `healthy`
- `gatewaygrok-frontend-staging`: `Up`
- `https://testflowgrok.plxeditor.com/api/health`: `200 OK`
- Authenticated `/api/profiles` tra dung 2 profile clone tu prod.

Verify prod sau clone:

- `gatewaygrok-api-prod`: van `Up` va `healthy`
- `gatewaygrok-frontend-prod`: van `Up`
- Prod health local `http://127.0.0.1:38081/api/health`: `200 OK`

Luu y bao mat:

- Sau buoc nay, test co ban sao profile/session/cookie tu prod. Can xem test nhu moi truong co du lieu nhay cam.
- Khong nen public/chia se test credentials hoac artifacts profile sau khi clone.
- Neu can tach test khoi session prod sau nay, restore backup test data o tren hoac tao profile test moi va xoa `storage/profiles` clone.
