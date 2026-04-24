# AutoCut Pro AI

AI-powered silence trimming, subtitle generation, multi-camera sync, and subject tracking — delivered as a Premiere Pro extension.

---

## For Users

### What it does
AutoCut Pro AI is an Adobe Premiere Pro extension that automates the tedious parts of video editing:

- **Silence trimming** — detects and removes silent gaps automatically
- **AI subtitles** — transcribes your audio and generates SRT files via Whisper
- **Multi-camera sync** — aligns multiple camera angles by waveform
- **Subject tracking** — follows faces and subjects for vertical/reframe edits

### How to get it
1. Visit the website and subscribe to the Pro plan
2. After payment, you'll be taken to the download page
3. Download the installer for your operating system
4. Run it — the extension installs automatically, no manual steps

### macOS installation
1. Download `AutoCut Pro AI Installer.dmg`
2. Open the DMG and run the installer app inside
3. Click **Install Extension** and wait for completion
4. Open (or restart) Adobe Premiere Pro
5. Go to **Window → Extensions → AutoCut Pro AI**

### Windows installation
1. Download `AutoCut Pro AI Installer.exe`
2. Run the installer — it completes automatically
3. Open (or restart) Adobe Premiere Pro
4. Go to **Window → Extensions → AutoCut Pro AI**

### Troubleshooting
- **Extension not in Window → Extensions**: Restart Premiere Pro completely (quit and reopen)
- **Extension still missing**: Re-run the installer, then restart Premiere Pro
- **Panel is blank**: Make sure you're signed in to your AutoCut Pro AI account inside the panel

---

## For Developers

### Project structure

```
autocut-pro-ai/
├── frontend/          Next.js 14 app (marketing site + dashboard)
├── backend/           Node.js + Express API (auth, jobs, downloads)
├── python-services/   Celery workers (FFmpeg, Whisper, librosa, OpenCV)
├── installer-app/     Electron installer (macOS DMG + Windows EXE)
├── premiere-plugin/   CEP extension (bundled inside installer)
├── packages/types/    Shared Zod schemas
├── docs/schema.sql    Supabase database schema
└── docker-compose.yml Dev environment
```

### Running locally

**Prerequisites:** Docker, pnpm, Node 20

```bash
# 1. Clone and install
git clone https://github.com/dhosses/autocut-pro-ai.git
cd autocut-pro-ai
pnpm install

# 2. Copy and fill env vars
cp .env.example .env

# 3. Start all services
docker-compose up

# Frontend: http://localhost:3000
# Backend:  http://localhost:4000
```

### Applying the database schema

Paste `docs/schema.sql` into your Supabase project's SQL Editor and run it.
This creates the `projects`, `clips`, `jobs`, and `subscriptions` tables with RLS policies.

### Building the macOS installer

```bash
cd installer-app
npm install
npm run build:mac
# Output: dist/AutoCut Pro AI-1.0.0-arm64.dmg  (Apple Silicon)
#         dist/AutoCut Pro AI-1.0.0.dmg         (Intel)
```

### Building the Windows installer

Requires running on Windows, or macOS with Wine + NSIS (`brew install wine-stable nsis`):

```bash
cd installer-app
npm run build:win
# Output: dist/AutoCut Pro AI Setup 1.0.0.exe
```

For automated Windows builds, use GitHub Actions with a `windows-latest` runner.

### Environment variables

Copy `.env.example` to `.env` and fill in:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (Whisper transcription)
OPENAI_API_KEY=sk-...

# Lemon Squeezy (payments)
LEMONSQUEEZY_API_KEY=your-api-key
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret
LEMONSQUEEZY_STORE_ID=your-store-id
LEMONSQUEEZY_FREE_VARIANT_ID=your-free-variant-id
LEMONSQUEEZY_PRO_VARIANT_ID=your-pro-variant-id

# Redis (job queue)
REDIS_URL=redis://localhost:6379

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL=https://yourstore.lemonsqueezy.com/buy/...

# Free plan quota
FREE_PLAN_MINUTES=30
```

### Key backend endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Health check |
| POST | `/upload` | JWT | Upload video clip |
| POST | `/process/silence-trim` | JWT + quota | Enqueue silence trim job |
| POST | `/process/subtitles` | JWT + quota | Enqueue subtitle job |
| GET | `/process/:jobId/status` | JWT | SSE job status stream |
| POST | `/export` | JWT | Request export |
| GET | `/export/:jobId/download` | JWT | Get signed download URL |
| POST | `/webhooks/lemonsqueezy` | HMAC | Payment webhook |
| GET | `/download/mac` | JWT + pro | Download macOS installer |
| GET | `/download/windows` | JWT + pro | Download Windows installer |
| GET | `/download/me` | JWT | Get subscription status |

### Deploying

**Backend + Python:** Any Docker host (Railway, Render, Fly.io). Set all env vars and point `REDIS_URL` to a managed Redis instance.

**Frontend:** Vercel (recommended) or any Node host. Set all `NEXT_PUBLIC_*` env vars.

**Webhooks:** After deploying, update the Lemon Squeezy webhook URL in your LS dashboard to `https://your-api-domain.com/webhooks/lemonsqueezy`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS, Supabase JS |
| Backend | Node.js, Express, BullMQ |
| Processing | Python, Celery, FFmpeg, librosa, OpenCV, Whisper |
| Database | Supabase (Postgres + Auth + Storage) |
| Payments | Lemon Squeezy |
| Queue | Redis |
| Installer | Electron + electron-builder |
| Extension | Adobe CEP (Premiere Pro panel) |
