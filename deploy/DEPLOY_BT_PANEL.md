# Deploy FlowGrok On BT Panel Nginx

This frontend supports two domains:

- Test: `https://testflowgrok.plxeditor.com/`
- Prod: `https://flowgrok.plxeditor.com/login`

Both vhosts:

- serve static files built from `/home/vpsroot/projects/frontend/FlowGrok/dist`
- proxy API requests from `/api/` to `http://127.0.0.1:8080/api/`

Recommended public web roots on this server:

- Test: `/www/wwwroot/testflowgrok.plxeditor.com`
- Prod: `/www/wwwroot/flowgrok.plxeditor.com`

## 1. Build frontend

```bash
cd /home/vpsroot/projects/frontend/FlowGrok
npm run build
```

## 2. Install Nginx vhosts

Copy the provided vhost files into BT Panel's Nginx include directory:

```bash
cp /home/vpsroot/projects/frontend/FlowGrok/deploy/testflowgrok.plxeditor.com.btpanel.conf \
  /www/server/panel/vhost/nginx/testflowgrok.plxeditor.com.conf

cp /home/vpsroot/projects/frontend/FlowGrok/deploy/flowgrok.plxeditor.com.btpanel.conf \
  /www/server/panel/vhost/nginx/flowgrok.plxeditor.com.conf
```

## 3. Test and reload Nginx

```bash
/www/server/nginx/sbin/nginx -t -c /www/server/nginx/conf/nginx.conf
/www/server/nginx/sbin/nginx -s reload -c /www/server/nginx/conf/nginx.conf
```

## 4. Verify

```bash
curl -I http://flowgrok.plxeditor.com/
curl -I https://flowgrok.plxeditor.com/
curl -I http://testflowgrok.plxeditor.com/
curl -I https://testflowgrok.plxeditor.com/
curl -I https://flowgrok.plxeditor.com/api/v1/auth/me
```

## Notes

- The current user does not have permission to write into `/www/server/panel/vhost/nginx/`, so step 2 must be run by root or through the BT Panel UI.
- If Cloudflare is set to proxy this domain, the origin still needs this Nginx vhost, otherwise Cloudflare returns `403`.
- If you want HTTPS between Cloudflare and the origin, add an SSL vhost block in BT Panel or attach the certificate for `flowgrok.plxeditor.com`.
