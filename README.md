# Rollback Demo Service

A minimal Node.js 22 HTTP service designed to demonstrate rollbacks on a PaaS.

## Endpoints

- `GET /` — Returns `200 "ok v<APP_VERSION>"` (e.g. `ok v1.0.0`).
- `GET /healthz` — Health check endpoint, returns `200 "ok"`.

## Configuration

Set via environment variables:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the HTTP service listens on |
| `APP_VERSION` | `1.0.0` | Version string returned by `GET /` |
| `FAIL_MODE` | `ok` | Failure simulation mode (see below) |

### Failure Modes (`FAIL_MODE`)

- **unset / `ok`**: Operates normally (`GET /` returns `200 "ok v<APP_VERSION>"`, `GET /healthz` returns `200`).
- **`crash`**: Starts normally, then exits with code 1 after 20 seconds (simulates a crash loop).
- **`cpu`**: Starts normally and runs a busy loop on the main thread at ~100% CPU (uses a `worker_thread` so `/healthz` still answers).
- **`memory`**: Allocates 50 MB every 5 seconds and retains references until OOM-killed.
- **`errors`**: Every request returns `500` with a 2-second delay (`/healthz` still returns `200` immediately).
