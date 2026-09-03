# NowHere backend — production-hardening todo

Source: whole-project evaluation of branch `fixes` (NestJS monorepo, gateway + NATS/JetStream).  
Goal: make the system production-grade. Work top-down. Check items off as they land.

Suggested order when picking a phase:

1. Nearby + seen (the product)
2. Seed + signup role + string `ROLES`
3. Presign-only uploads + key ownership
4. Gateway hardening + NATS error/timeout mapping
5. Tokens / `isActive` / refresh-from-DB
6. HTTP surface + Socket.IO JWT
7. Compose + Dockerfiles + TypeORM sync
8. k8s + secrets process
9. Tests + CI + dead-code cleanup

---

## P0 — Product and security

Do these before anything faces a network you do not fully control.

### 1. Nearby / unseen feed

The app’s core query is inverted.

- [x] Stop filtering nearby snaps by the caller’s `_userId` in `SnapsService.findNear` (`apps/snaps/src/snaps/snaps.service.ts`). That currently returns **only the caller’s snaps**.
- [x] Stop using `userId: Not(userId)` in `UsersService.getSeen` when `seen === false` (`apps/users/src/users/users.service.ts`). That is other people’s seen rows, not “I have not seen this”.
- [x] Change `getSeenSnaps` to: geo-query **successful** snaps in radius (all users), load **this user’s** `snap_seen` rows, then keep unseen (nearby) or seen (seen feed).
- [x] Only include `SnapStatus.SUCCESS` in the public nearby feed (hide `PROCESSING` / failed).
- [x] Add a unit test that inserts two users’ snaps near the same point and asserts the caller sees the other person’s **unseen** snap.

### 2. Dead file-upload path

Multipart → NATS/JetStream buffers → `saveLocalFiles` HTTP-GETs snaps tmp. Snaps no longer serves that tree. Default NATS payload is 1MB; 5MB images will fail.

- [x] Make presigned client upload the production path (`POST /storage/presigned-upload` then `POST /snaps` with keys).
- [x] Stop sending file buffers from gateway → snaps over NATS.
- [x] Delete or stop using `StorageService.saveLocalFiles` (HTTP fetch of snaps tmp).
- [x] Delete unused JetStream `storage.snap.upload` / `storage.snap.uploaded` handlers if nothing else publishes them.
- [x] If gateway still accepts multipart, upload each file to storage from the **gateway**, then call snaps with keys only.
- [x] Validate pre-uploaded object keys belong to the caller (`snaps/{date}/{userId}/...` or `profile/{userId}`). Reject `..` and foreign prefixes.
- [x] Allowlist presign `prefix` to `snaps` | `profile`. Ignore arbitrary client prefixes. Always embed `userId` in the key.
- [x] Allowlist image content types (`image/jpeg`, `image/png`, `image/webp`). Cap batch size (e.g. 4 files).

### 3. Open seed endpoint

- [x] `GET /seed` on snaps `:3000` has no auth (`apps/snaps/src/seed/seed.controller.ts`) and `SeedModule` is always imported in `AppModule`.
- [x] Do not register `SeedController` unless `ENABLE_SEED=true` **and** `NODE_ENV !== 'production'`, **or** move seed to a CLI (`pnpm nx seed snaps`).
- [x] Never expose seed on a public/LoadBalancer port.
- [x] Seed must not send `role` on signup (after item 4). Known password `Password123!` is fine only for local seed.

### 4. Signup privilege + broken admin

- [x] Remove optional `role` from public signup DTO (`apps/gateway/src/dto/create-credential.dto.ts` and `nowhere-common` create-credential DTO).
- [x] Authentication service always persists `ROLES.USER` for public signup. Ignore any smuggled role. Admin exists only via `ADMIN_EMAIL` / `ADMIN_PASSWORD` seed.
- [x] Change `ROLES` from a **numeric** enum (`ADMIN=0`) to a **string** enum (`'ADMIN' | 'USER'`) in `libs/contracts/src/users/users.types.ts`.
- [x] Replace `user.role || 'USER'` with `user.role ?? 'USER'` in `GatewayAuthGuard` (numeric `0` is falsy and turns real admins into `'USER'`).
- [x] Align JWT payload, `RoleGuard`, TypeORM `simple-enum`, and Zod `SignupSchema` on the string enum.
- [x] Note: existing DB rows stored as `0`/`1` need a migration or one-time sync if any real data exists.

### 5. Unauthenticated NATS and Redis

- [x] NATS: enable `--auth` (token) or nkeys/TLS. Set `NATS_URL` with credentials on every service.
- [x] Redis: `requirepass` / `REDIS_URL` with password (storage cache).
- [x] Do not publish `4222` / `8222` / `6379` except on a laptop.
- [x] Raise NATS `max_payload` only if any remaining server-side uploads need it; prefer not sending binaries on the bus.

---

## P1 — Edge, tokens, HTTP surface

### 6. Gateway hardening

Public API is `gateway` on `:3005`.

- [x] `helmet()` on gateway `main.ts`.
- [x] Explicit CORS from `CORS_ORIGIN` (comma-separated). In production, do not default to `*`.
- [x] `ThrottlerModule` + `ThrottlerGuard` on gateway. Stricter limits on `POST /auth/login` and `POST /auth/signup`. Skip throttle on `/health`.
- [x] Remove unused `ThrottlerModule` from users (no public users HTTP API).
- [x] Timeout every NATS `firstValueFrom` (hung service must not hang HTTP). Shared helper, e.g. `natsRequest(client, pattern, data, timeoutMs)`.
- [x] Map NATS/RPC errors back to original HTTP status (401/400/409), not generic 500. NATS-side filter that serializes `HttpException` as `{ statusCode, message }`.
- [x] Fallback HTTP mapper must not leak internal `exception.message` on 500s.
- [x] Do not wrap Terminus `/health` in `{ success, data }`.
- [x] Restrict `GET /storage/signed?key=` to keys the user owns, or admin. Other people’s images come from snaps/users responses (server-fetched signed URLs).
- [x] `GET /snaps` (findAll) → admin only. Nearby is the public feed.
- [x] Declare static snap routes (`tags`, `near/:lng/:lat`, `seen/:lng/:lat`) **before** `:id`.
- [x] Validate `POST /snaps` body with a real DTO (not `body: any`).

### 7. Auth tokens

- [x] Login: check `isActive`; disabled accounts cannot sign in.
- [x] Login: same error for unknown email and wrong password (`Invalid email or password`).
- [x] Refresh: verify refresh JWT, **load user from DB by `sub`**, check `isActive`, issue new tokens from DB user (not the JWT blob).
- [x] Access token default `15m` in code **and** `.env.example` / k8s (today examples use `1d`).
- [x] Duplicate email → `409 Conflict`, not generic 400.
- [ ] Optional follow-up (not blocking): refresh rotation / family / reuse detection.

### 8. Extra HTTP surfaces

- [x] Users: HTTP is health-only. Remove Swagger (`setupSwagger`) from users `main.ts`. Bind `PORT` / `0.0.0.0`.
- [x] Authentication: hybrid app — NATS + HTTP `/health` only. Register `HealthController` + Terminus (file exists, not in the module today).
- [x] Storage: same — HTTP `/health` only (no health controller today).
- [x] Socket.IO: verify `ACCESS_SECRET` on handshake (`auth.token` or `Authorization`). Disconnect if missing/invalid.
- [x] Socket.IO CORS from `CORS_ORIGIN` / `GATEWAY_URL`.
- [x] Document that the in-memory location map does not survive restart or a second replica (sticky sessions or a shared store is a later phase).

### 9. Signup vs profile race

- [x] Users consumer `createUser`: find-or-create / upsert on `authId` (and email) so JetStream redelivery is idempotent.
- [x] JetStream consumer: `max_deliver` (and ideally backoff) so poison messages do not NAK-loop forever.
- [ ] Optional: gateway retries `GET /users/settings` after signup, or auth waits for profile ack (only if the client actually 404s in practice).

---

## P2 — Deploy, images, schema

### 10. Production Compose

- [x] Rewrite `docker-compose.yml` to match current apps: `authentication`, `users`, `snaps`, `storage`, `gateway`, plus NATS, MySQL, Mongo, MinIO, Redis.
- [x] Stop referencing `apps/auth`, gRPC `50051`, and missing gateway.
- [x] `NODE_ENV=production` (not `deployment`).
- [x] `TYPEORM_SYNC=false` in prod.
- [x] Publish **gateway `:3005` only** (plus snaps `:3000` only if Socket.IO is not proxied).
- [x] Wire NATS auth + Redis password from env (see item 5).
- [x] Dev compose (`docker-compose.dev.yml`): `TYPEORM_SYNC=true` explicitly; `ENABLE_SEED` default false.

### 11. Dockerfiles (all five apps)

- [x] Remove `protobuf-compiler` and gRPC `EXPOSE 50051` / `50052`.
- [x] Unify `outDir` so CMD matches reality. Today gateway/authentication emit to repo-root `dist/apps/...` but CMD is `apps/<name>/dist/apps/<name>/src/main.js`.
- [x] Drop debug `RUN ls node_modules`.
- [x] Do not copy the entire `/usr/src` (source + devDeps) into runtime if a slimmer copy is feasible.
- [x] Run as non-root. Pin base image digest if/when publishing.

### 12. Kubernetes

- [x] Manifests still describe HTTP/gRPC `nowhere-auth:1.0.2`. Rebuild around **current** services: gateway, authentication, users, snaps, storage, NATS, Redis, MySQL, Mongo.
- [x] Gateway is the only external Service (Ingress or one LoadBalancer). Everything else ClusterIP.
- [x] liveness/readiness on `/health`. Resource requests/limits. `securityContext` non-root.
- [x] Fix secret **name** mismatch (`nowhere-mysql-secrets` vs `nowhere-auth-db-secrets`).
- [x] Redis: password, not untagged `redis` + `emptyDir` as the only persistence story.
- [x] Commit **example** secrets only (`k8s/secrets.example/`). Keep real `k8s/secrets/` gitignored. README must not say `kubectl create -f k8s/secrets` with live values.
- [x] Snaps Socket.IO: Ingress path or a dedicated internal URL — do not LoadBalance the whole snaps HTTP API.

### 13. Schema / init SQL

- [x] Users migrations still create a combined `users` table (`Id`, `password`, `role`). Live entities are split: `credentials` + `users` (lowercase `id`). Write migrations that match entities.
- [x] TypeORM `synchronize` only when `TYPEORM_SYNC=true` — never `NODE_ENV !== 'production'`.
- [x] Align `mysql_init/init.sql` DB/user names with `.env.example` (`Users_Info` / `Users_Credentials` vs default `users`).
- [x] `lastLoginAt` is `date` (time truncated) — use `datetime`.
- [x] Authentication `package.json` typeorm scripts point at missing `src/data-source.ts`. Add it or remove the scripts.

---

## P3 — Contracts, dead code, tests, secrets hygiene

### 14. Contracts and validation

- [x] Call Zod `validateSchema()` (or a NATS ValidationPipe) on every `@MessagePattern` payload.
- [x] Collapse three DTO layers (gateway class-validator, `nowhere-common/dto`, `contracts` Zod) toward **one** source of truth.
- [x] Implement or delete unused patterns: `auth.validateToken`, `users.createUserInfo`.
- [x] `Tags.PROOMOTION` typo — add `PROMOTION` and keep the old value as a deprecated alias if Mongo already has it.
- [x] `SNAP_DISAPPEAR_TIME` currently reads `maxDistance_NEAR` (`libs/nowhere-common/src/constants/settings.ts`). Use `SNAP_DISAPPEAR_TIME`.
- [x] Env validation on gateway and authentication (users/snaps/storage already have classes; several fields are leftover/wrong).
- [x] Storage env class requires AWS_* even when `STORAGE_PROVIDER=gcp`. Make provider-specific fields optional; drop unused `STATIC_TMP_FILES` / `SNAPS_URL` / `ACCESS_SECRET` on storage.

### 15. Dead / leftover code

- [x] `SecretManagerModule` is complete and **no app imports it**. Wire it at bootstrap or delete it and the README section.
- [x] Shared `JwtGuard` unused. Use it or delete.
- [x] `InternalAuthGuard` unused and trusts `x-user-id` with no shared secret. Require `x-internal-secret` or delete.
- [x] Snaps `InternalAuthMiddleware` is not registered and accepts any Bearer without verifying JWT. Register with a real secret or delete.
- [x] `MICROSERVICES` host/port map in `nowhere-common` is gRPC-era. Delete or replace with NATS URLs.
- [x] `types/jwt-payload.type.ts` imports `User` from the users app. Standalone JWT type; no app→lib cycle.
- [x] `nowhere-common` `"types": "dist/index.d.js"` → `.d.ts`.
- [x] README still describes gRPC isolation for storage. Update to NATS + gateway.
- [x] `exceptionTodo.md` / `responsesTypeschanges.md` name deleted HTTP controllers. Update or archive.
- [x] Local `uploads/`, `apps/snaps/tmp/`, `apps/users/uploads/` hold real images (gitignored). Do not force-add. Delete locally if they are PII.
- [x] Coverage HTML under `apps/*/src/coverage` because Jest `rootDir: 'src'`. Point coverage at a non-source dir.

### 16. Tests and CI

Current unit run: 7 suites, 26 tests, all passing, almost all mocks. Not enough to catch P0 bugs.

- [x] Replace gateway e2e (`GET /` → `Hello World!`) with real health/auth tests.
- [x] Replace auth e2e (HTTP `/auth/login`, `USERS_GRPC`) — auth is NATS-only.
- [x] Replace users e2e that imports deleted `users.http.controller`.
- [x] Replace storage e2e Nest scaffold (`GET /` Hello World).
- [x] Add snaps tests for nearby/unseen (item 1). Snaps has no e2e spec.
- [x] Replace storage unit test (`useValue: {}` + `toBeDefined`) with strategy/service tests.
- [x] Gateway-level e2e: signup → login → presign → create snap → nearby.
- [x] Auth service tests: generic login error, disabled account, signup ignores role, refresh reloads DB user.
- [x] Fix root `"test:e2e"` pointing at missing `apps/backend/test/jest-e2e.json`.
- [x] GitHub Actions: `pnpm install`, lint, `jest --ci`, `nx run-many --target=build --all`. No secret files in CI.
- [x] Users Jest `displayName: 'auth'` leftover — rename.

### 17. Local secret files (gitignored, on disk)

`k8s/secrets/` and root `.env` are **not** on GitHub but exist locally with production-looking AWS, RDS, Mongo, JWT, and admin values.

- [ ] Rotate AWS, RDS/Mongo, JWT, and admin credentials. Treat anything that left this machine as compromised. (Operator action — not done in this change set.)
- [ ] Delete local live secret YAML. Keep `.gitignore` on `k8s/secrets` and `*.env`. (Left in place; files stay gitignored.)
- [x] Add committed `*.env.example` / `k8s/secrets.example/` with `change_me_*` only.
- [x] Do not print or commit real secret values.

---

## Out of scope unless you explicitly ask

- Proxying Socket.IO through the gateway (today clients must reach snaps HTTP for WS).
- Refresh-token family / reuse detection store.
- Shared geo map for multiple snaps replicas (Redis/NATS).
- OpenTelemetry / request IDs.
- Virus scanning / magic-byte checks beyond MIME.
- Full ExternalSecrets operator setup in a real cluster.

---

## Phase extraction

Copy one heading (e.g. `### 1. Nearby / unseen feed`) plus its checkboxes into a new chat or ticket and implement only that slice.
