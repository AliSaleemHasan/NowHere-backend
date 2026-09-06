# NowHere backend

Location-based ephemeral photo snaps. An Expo client talks HTTP to a NestJS gateway; domain logic lives in separate Nest apps.

**This is a local Compose demo / portfolio system, not a hosted product.** There is no production URL.

Matches the CV line: NestJS monorepo (Nx) for real-time nearby updates. Portfolio system.

Site: [ali-hasan.me/projects/nowhere](https://ali-hasan.me/projects/nowhere) · app: [NowHere-frontend](https://github.com/AliSaleemHasan/NowHere-frontend)

## What’s in this repo

| App | Port (compose) | Role |
|-----|----------------|------|
| gateway | 3005 | HTTP + JWT verify + NATS request-reply. OpenAPI at `/docs` when `ENABLE_SWAGGER=true` |
| snaps | 3000 | Nearby snaps, Mongo `2dsphere`, Socket.IO (**on this process**, not the gateway) |
| users | 3001 | Profile, settings, bookmarks, reports, DSGVO export/delete |
| storage | 3002 | Presigned PUT for snap photos; S3-compatible / GCS / MinIO |
| authentication | 3004 | bcrypt, JWT, lockout, forgot-password **202**, HMAC reset tokens |

Stores: Mongo (snaps), MySQL (users + credentials), MinIO, Redis, NATS with JetStream. Mailhog in the **dev** compose file (`:8025` UI, SMTP `:1025`).

Transport between services is **NATS**, not gRPC.

## Architecture

- **Gateway:** HTTP API. Verifies JWT locally. Forwards work over NATS. Does not open Mongo/MySQL/S3 at runtime.
- **Auth:** bcrypt (not Argon2). JWT default is HMAC (`ACCESS_SECRET` / `REFRESH_SECRET`, not RS256). Refresh is a JWT; there is no refresh-token table. Forgot-password always returns 202.
- **Users:** profile, settings, bookmarks, reports, `GET /users/me/export`, `DELETE /users/me` with `{ password }`. JetStream `AUTH_EVENTS` consumer for signup fan-out.
- **Snaps:** Mongo `2dsphere`. Nearby: `$geoWithin` `$centerSphere`, `$near` fallback. Default vision distance in code is **5 km**. In-process Socket.IO; does not survive a second replica.
- **Storage:** `POST /storage/presigned-upload` then PUT bytes. Profile photos go multipart through the gateway. `STORAGE_PROVIDER`: `aws` | `gcp` | `minio`.

`k8s/` is example manifests (`replicas: 1`), not a production cluster.

This is not: likes/comments, OAuth, a store listing, or 1,000 concurrent sockets.

## Run locally

```bash
pnpm install
docker compose -f docker-compose.dev.yml up --build
```

```bash
curl http://localhost:3005/health    # gateway
curl http://localhost:3000/health    # snaps
# OpenAPI: http://localhost:3005/docs  (ENABLE_SWAGGER=true)
```

Production-like compose (still local): `docker compose up` — publishes gateway `:3005` and snaps `:3000`.

## Tests / CI

```bash
pnpm typecheck
pnpm test
pnpm nx test users   # also snaps, storage, authentication, gateway
```

`.github/workflows/backend.yml` runs lint, typecheck, unit tests, and a no-push `docker build` of the **gateway** image. It does not deploy and does not start compose.

Ali Saleem Hasan — [ali-hasan.me](https://ali-hasan.me)
