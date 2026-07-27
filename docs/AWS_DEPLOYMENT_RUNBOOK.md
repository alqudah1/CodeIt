# CodeIt AWS deployment runbook

This records the verified Lightsail layout so a future deployment does not need
to rediscover the server. It is documentation only; nothing should be deployed
without the owner's explicit approval.

## Verified layout

- Host: AWS Lightsail, `bitnami@35.183.87.161`
- Private release branch: `feature/homepage-seo-redesign`
- Private worktree: `/home/bitnami/CodeIt-worktrees/homepage-seo-redesign`
- Production checkout: `/home/bitnami/CodeIt`
- Frontend package: `packages/gamified-elearning`
- Apache document root: `/opt/bitnami/apache/htdocs`
- Backend process: PM2 `codeit-backend`
- Backend working directory: `/home/bitnami/CodeIt/packages/codeit-backend`
- `/api/` is proxied by Apache to `127.0.0.1:8080/api/`

## Release checklist

1. Confirm the exact commit and confirm production deployment with the owner.
2. Require a clean private worktree and run `git diff --check`.
3. Run the frontend production build.
4. Save a timestamped backup of the current Apache document root under
   `/home/bitnami/deploy-backups/`.
5. Copy only the new frontend build into the Apache document root.
6. Do not restart `codeit-backend` unless backend files changed.
7. Verify:
   - `https://codeitlearn.com/`
   - `https://codeitlearn.com/builder`
   - one lesson page
   - `/api/health` or the currently configured backend health route
8. If a critical check fails, restore the timestamped frontend backup.

## Current release note

The logo and Pixel mascot work is private. A successful frontend build is
required before it becomes eligible for deployment.
