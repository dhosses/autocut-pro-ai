# Architecture

```
Browser (Next.js)
    │
    │ REST + SSE
    ▼
Backend (Node.js / Express)
    │  Auth via Supabase JWT
    │  BullMQ job queue
    ▼
Redis ─────────────────────┐
                           │ Celery broker
                           ▼
                  Python Workers (Celery)
                  ├── silence_trim (FFmpeg + librosa)
                  ├── subtitles   (Whisper + FFmpeg)
                  ├── sync        (librosa cross-correlation)
                  ├── tracking    (OpenCV + FFmpeg)
                  └── export_xml  (FCPXML builder)
                           │
                           ▼
                  Supabase Storage
                  ├── raw-uploads/ (user uploads)
                  └── exports/     (processed outputs)
                           │
                  Supabase Postgres
                  ├── projects
                  ├── clips
                  ├── jobs  ◄── SSE polls this for status
                  └── subscriptions
                           │
                  Lemon Squeezy
                  └── Webhooks → /webhooks/lemonsqueezy
```

## Request flow — processing a clip

1. User uploads file → `POST /upload` → stored in `raw-uploads` bucket, `clips` row created
2. User clicks "Trim Silence" → `POST /process/silence-trim` → `jobs` row created (status: queued), BullMQ job enqueued
3. Frontend opens SSE stream → `GET /process/:jobId/status` → polls `jobs` table every 2s, streams updates
4. Celery worker picks up job → downloads clip from storage → runs FFmpeg/librosa → uploads result to `exports` bucket → updates `jobs.status = done`
5. SSE stream receives `done` → frontend shows download button
6. User clicks Export → `POST /export` → same flow, outputs FCPXML/SRT/MP4

## Subscription flow

1. User clicks "Get Pro" → redirected to Lemon Squeezy checkout with `custom_data.user_id`
2. Purchase completes → Lemon Squeezy sends `subscription_created` webhook
3. `POST /webhooks/lemonsqueezy` → verifies signature → updates `subscriptions.tier = pro`, `minutes_limit = 99999`
4. Next API call → `checkQuota` middleware finds `tier = pro` → passes through
