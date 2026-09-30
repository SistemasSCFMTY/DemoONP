# ONP FER — backend

Hono 4 on Cloudflare Workers. Supabase for data and storage, Resend for email.

## Setup

```bash
npm install
cp .dev.vars.example .dev.vars   # then fill it in
npm run dev                      # wrangler dev
curl localhost:8787/health
```

## Secrets

Never in `wrangler.jsonc` — that file is committed.

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put JWT_SECRET
wrangler secret put RESEND_API_KEY
```

`DEMO_MODE` is a plain var in `wrangler.jsonc`: `"true"` makes `/otp/enviar` echo the
generated code so the UI can show it under its "Modo demostración" label.

## Things that bite

- **Tesseract OCR cannot run here.** Its WASM core plus a ~15MB `traineddata` exceed
  the Worker bundle cap and CPU budget. OCR runs in the browser; `web-app/` owns it.
  See `01-conventions.md` deviation D7.
- **Resend sends from `onboarding@resend.dev`**, the sandbox sender, which delivers
  **only** to the address that owns the Resend account. No verified domain before the
  demo — owner's call. Register with that address on stage or the mail silently 403s.
  See deviation D8.
- **Do not port `../ONP/arreglo_permisos_final.sql`.** It opens `SELECT` on the whole
  `expedientes` bucket to `public`. It existed because the browser talked to Supabase
  directly; this Worker holds the service key and nothing else does.

## Deploy

```bash
npm run deploy
```
