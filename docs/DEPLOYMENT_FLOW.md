# FlowGrok Deployment Flow

## Domain mapping

- `staging` branch -> `https://testflowgrok.plxeditor.com/`
- `prod` branch -> `https://flowgrok.plxeditor.com/login`

The app already exposes the login page at `/login`, so production users should enter from:

- `https://flowgrok.plxeditor.com/login`

## Release flow

1. Develop and merge changes into `staging`
2. Deploy `staging` to `testflowgrok.plxeditor.com`
3. Validate on test
4. Promote the validated commit to `prod`
5. Deploy `prod` to `flowgrok.plxeditor.com`

Short form:

- `staging -> test -> promote -> prod`

## Server config files

- Test vhost: `/home/vpsroot/projects/frontend/FlowGrok/deploy/testflowgrok.plxeditor.com.btpanel.conf`
- Prod vhost: `/home/vpsroot/projects/frontend/FlowGrok/deploy/flowgrok.plxeditor.com.btpanel.conf`

## Notes

- This document assumes your second mention of `origin/staging` was intended to mean the production branch.
- If you use a different production branch name such as `main` or `master`, keep the same domain mapping and update the branch label in this document only.
