# AutoCut Pro AI

An AI-powered video editing assistant for Adobe Premiere Pro that automates multi-camera editing, silence trimming, subject tracking, and subtitle generation — delivered as a SaaS.

---

## What It Does

| Feature | Description |
|---|---|
| Multi-file Upload | Drag-and-drop multiple video/audio clips with live progress |
| Audio Sync | Align multi-POV clips via waveform cross-correlation |
| Auto Camera Switching | Detect active speaker and cut between cameras automatically |
| Silence Trimming | Detect and remove pauses using audio analysis |
| Subject Tracking | Face detection + auto-crop/zoom for vertical video |
| Auto Subtitles | Whisper speech-to-text → SRT file, optional burn-in |
| Timeline Preview | Visual canvas timeline of all cut points |
| Export | FCPXML (Premiere Pro), SRT subtitles, processed MP4 |

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + Shadcn/ui + Tailwind | Fast, polished UI with zero custom component work |
| Backend | Node.js + Express + BullMQ | API + async job queue for long-running video tasks |
| Python Services | Celery workers (FFmpeg, librosa, OpenCV, Whisper) | Runs as Redis-backed workers, not a separate HTTP server |
| Database + Auth | Supabase (Postgres + Auth + Storage) | Replaces AWS S3, raw Postgres, and JWT setup in one service |
| Job Queue | Redis + BullMQ (Node) / Celery (Python) | Robust async processing with retries and status tracking |
| Subscriptions | Lemon Squeezy | Merchant of record — handles VAT/GST globally, simpler than Stripe |
| Type Safety | Zod (shared `/packages/types`) | Single schema definition validated on both backend and frontend |
| Real-time Status | Server-Sent Events (SSE) | Stateless push from server to browser — no WebSocket overhead |
| Dev Environment | Docker Compose (5 services) | One command to start everything locally |

---

## Monorepo Structure

```
autocut-pro-ai/
├── frontend/               # Next.js App Router
├── backend/                # Node.js Express API + BullMQ
├── python-services/        # Celery workers (FFmpeg, librosa, OpenCV)
├── packages/
│   └── types/              # Shared Zod schemas
├── docs/                   # Architecture diagrams, API reference
├── docker-compose.yml
├── .env.example
└── README.MD
```

---

## Phase-by-Phase Build Plan

### Phase 1 — Monorepo Scaffold & Dev Environment
- Init Turborepo with `pnpm` workspaces
- Docker Compose: `frontend`, `backend`, `python`, `postgres`, `redis`
- `.env.example` with all required secrets
- Shared `/packages/types` Zod schema package

### Phase 2 — Database Schema (Supabase)
Tables: `users`, `projects`, `clips`, `jobs`, `subscriptions`

- `jobs`: tracks status (`queued` → `processing` → `done` / `failed`), job type, output paths
- Row-level security (RLS) — users only access their own rows
- Storage buckets: `raw-uploads` (private), `exports` (private, signed URLs)

### Phase 3 — Backend API (Node.js)
```
POST /upload                  → stream to Supabase Storage, create job row
POST /process/silence-trim    → enqueue BullMQ job
POST /process/subtitles       → enqueue BullMQ job
POST /process/sync            → enqueue BullMQ job
POST /process/tracking        → enqueue BullMQ job
GET  /jobs/:id/status         → SSE stream of live job status
POST /export                  → trigger export job
POST /webhooks/lemonsqueezy   → handle subscription events
```
Auth: Supabase JWT validated on all protected routes.

### Phase 4 — Python Processing Workers (Celery)
Each worker: download from Supabase Storage → process → upload output → update job status

| Worker | Tools |
|---|---|
| `silence_trim.py` | FFmpeg + librosa |
| `subtitles.py` | OpenAI Whisper API → SRT, optional FFmpeg burn-in |
| `sync.py` | librosa waveform cross-correlation |
| `tracking.py` | OpenCV face detection + FFmpeg crop/zoom |
| `export_xml.py` | FCPXML builder (Premiere Pro compatible) |

### Phase 5 — Frontend (Next.js)
Pages: `/` (landing + pricing), `/login`, `/signup`, `/dashboard`, `/project/[id]`, `/project/[id]/export`

Key components:
- `<UploadZone>` — react-dropzone, multi-file, per-file progress bars
- `<JobStatusBadge>` — SSE-connected live status indicator
- `<TimelinePreview>` — canvas/SVG visualization of cut points
- `<UsageMeter>` — free plan minutes used vs. remaining

### Phase 6 — Subscriptions (Lemon Squeezy)
- Webhook: `subscription_created` / `subscription_updated` → update `subscriptions` table
- Usage middleware: block processing jobs when free quota exceeded
- Frontend: upgrade prompt when quota hit

### Phase 7 — Export
- FCPXML — import via File > Import in Premiere Pro
- SRT — direct Supabase signed URL download
- MP4 — direct Supabase signed URL download

### Phase 8 — Docs & README
- Architecture diagram
- Full API reference
- Local setup guide

---

## Improvements Over Original Spec

| Original | Improved | Reason |
|---|---|---|
| AWS S3 | Supabase Storage | No IAM setup, same pricing tier, integrated with auth |
| Stripe | Lemon Squeezy | Handles global tax compliance automatically |
| Python as HTTP microservice | Celery workers | Simpler — shares Redis with Node, no second HTTP server |
| Polling for job status | SSE stream | Lower overhead, simpler code, better UX |
| Raw component building | Shadcn/ui + Tailwind | Hours vs. days to a polished dashboard |
| No type sharing | Shared Zod schemas | Single source of truth, runtime + compile-time safety |

---

## Environment Variables

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI (Whisper)
OPENAI_API_KEY=

# Lemon Squeezy
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_STORE_ID=

# Redis
REDIS_URL=redis://localhost:6379

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_URL=http://localhost:4000
```

---

## Running Locally

```bash
# 1. Clone and install
git clone https://github.com/your-org/autocut-pro-ai
pnpm install

# 2. Copy env
cp .env.example .env
# Fill in your Supabase, OpenAI, and Lemon Squeezy keys

# 3. Start all services
docker-compose up

# 4. Open the app
open http://localhost:3000
```

---

## Future Roadmap

- **Adobe Premiere Pro UXP Panel** — native in-app panel, no XML import needed
- **Real-time collaboration** — multiple editors per project via Supabase Realtime
- **Custom Whisper fine-tuning** — domain-specific vocabulary (podcasts, gaming, etc.)
- **Batch processing** — parallel processing for power users
- **Mobile upload companion** — upload footage directly from phone

---

## Verification Checklist

- [ ] `docker-compose up` — all 5 services healthy
- [ ] Sign up → JWT issued → dashboard accessible
- [ ] Upload video → job created → Celery processes → SSE status updates → file downloadable
- [ ] Lemon Squeezy test subscription → DB updated → quota lifted
- [ ] Export FCPXML → import into Premiere Pro → timeline matches edits
