# 03 — Videograbación: de simulada a real

Owner decision, 2026-09-30: **record and upload for real, but the video never fails the
submission.** Same principle CLAUDE.md already applies to email. Biometrics (`huella`,
`rostro`) stay simulated this pass.

Checkpoint protocol is `00-master-plan.md` §"Checkpoint protocol": one branch, one PR,
owner reviews. Tiering is P0 → P1 → P2, ordered so that running out of hours costs the
least. Build in order.

---

## What is already true (verified in the code, 2026-09-30)

These four findings are why this is a small change and not a project.

1. **`video_identificacion` is already a value of the Postgres `tipo_archivo` enum**,
   listed in `backend/src/schemas/comunes.ts` alongside `huella` and `rostro`. **No
   migration. No schema write to production.** This was expected to be the blocker and
   it is not one.
2. **Uploads are already non-blocking.** `services/solicitudes.ts` loops the parts inside
   a `try/catch`: a failure pushes the part to `fallidos`, logs a warning, and the
   expediente is still created — the call returns `archivosFallidos`. A video that is
   rejected for its MIME type or its size _cannot_ cost an expediente today. The work is
   to avoid breaking that, not to build it.
3. **`Grabacion` is an abstract class behind DI** (`services/domain/videograbacion.ts`),
   with `GrabacionSimulada` provided by a factory. A real recorder is a drop-in.
4. **The panel already lists `e.archivos` generically** — name, size, timestamp,
   SHA-256 — and the detail already has a "Videograbación" row. Only a label and a
   player are missing.

What is genuinely missing: the MIME allowlist has no video type, the part→enum map has
no `video` key, and nothing captures bytes.

---

## Risks, named before the work

- **Safari/iOS is the one that breaks on stage.** `MediaRecorder` exists there since
  14.1 but does **not** do WebM; asking for it throws. Needs `isTypeSupported`
  detection, an mp4/h264 preference, and a clean fall back to the simulation when
  neither is available. Headless Chromium cannot prove any of this — only a real device
  can (CP-V5).
- **Size and time land on the worst possible click.** The upload happens on "Completar
  Etapa 2", already the slowest moment in the flow. 45 s at default 720p bitrate blows
  past any sane cap; pinned to 640×480 at ~500 kbps it is roughly 3 MB. The caps are not
  a nicety, they are the mitigation.
- **Worker memory.** Each file is materialised whole to be hashed, against a 128 MB
  ceiling the upload loop already comments about. One 25 MB video is fine; it is simply
  one more item in a deliberately sequential loop.
- **Demo is 2026-10-01.** Every checkpoint below is independently shippable and
  independently revertible, and CP-V2 carries a kill switch, precisely because of this.

---

## CP-V1 · P0 — el Worker acepta la parte `video`

Branch `cp/v1-video-backend`. **Ship this first and alone**: nothing sends a `video`
part yet, so it is inert on arrival and can be deployed without touching the apps.

- [ ] `schemas/comunes.ts`: add `video: 'video_identificacion'` to
      `TIPO_ARCHIVO_POR_PARTE`. `PARTES_ARCHIVO` derives from it, so the upload loop
      picks the part up with no further change.
- [ ] `services/archivos.ts`: add `video/webm` → `webm` and `video/mp4` → `mp4` to
      `EXTENSION_POR_MIME`. Safari reports `video/mp4`; Chromium `video/webm`.
- [ ] Per-part size cap instead of one constant: video **25 MB**, everything else stays
      at **10 MB**. A single `MAX_BYTES` either starves the video or lets an 11 MB "INE
      photo" through.
- [ ] Rejection copy per part: the current message names "JPG, PNG, WEBP o PDF", which
      is wrong for a video part.
- [ ] Tests: a `video` part with `video/webm` stores as `video_identificacion`; an
      oversized video is rejected **and the expediente is still created** with the part
      listed in `archivosFallidos` — that last assertion is the whole point of the
      checkpoint and must not be skipped.
- [ ] `02-api-contract.md`: eleven upload parts become twelve. Same PR (protocol §3).

**Closeable when** `npm run typecheck` passes, tests are green, `wrangler deploy` is
done, and a `curl` with a small webm part returns 201 with the file registered.

---

## CP-V2 · P0 — grabadora real en `web-app`

Branch `cp/v2-video-recorder`. Depends on CP-V1 being **deployed**, not merely merged.

- [ ] `GrabacionReal implements Grabacion`, using `MediaRecorder`.
- [ ] Pick the mime with `MediaRecorder.isTypeSupported`, in this order:
      `video/mp4;codecs=avc1`, `video/webm;codecs=vp9`, `video/webm;codecs=vp8`,
      `video/webm`. **No supported type → fall back to `GrabacionSimulada`.**
- [ ] `getUserMedia` constrained to 640×480, `facingMode: 'user'`, audio on, and
      `videoBitsPerSecond: 500_000`.
- [ ] Hard 45 s cap with `setTimeout(stop)`, and stop every track in a `finally` — a
      camera left running after the screen is gone is the kind of thing a stakeholder
      notices.
- [ ] Return the `Blob` together with the mime actually used.
- [ ] `simulada` keeps telling the truth, so the "Modo demostración" note on the screen
      appears exactly when the recording _is_ simulated and not otherwise. A simulation
      that stops admitting it is the failure mode `01-conventions.md` §11 exists to
      prevent.
- [ ] **Kill switch**: `grabarVideo: boolean` in both environment files. False →
      `GrabacionSimulada`, no camera, no upload. This is the "it is misbehaving on stage"
      lever: flip it, push, Pages rebuilds in about two minutes.
- [ ] Store the blob in `IdentidadState` via `RegistrarVideo`.
- [ ] `'video'` added to `TipoArchivo`; `signature.ts` puts it in the `archivos` map.
- [ ] Live preview while recording, with the seconds remaining.
- [ ] Verification: Playwright with `--use-fake-device-for-media-stream`, asserting the
      blob is non-empty, the mime is one of the four, and the tracks are stopped.

**Closeable when** `ng build` and `ng test` pass, and a full Playwright run reaches
`/solicitud/complete` with a `video` part present in the request.

---

## CP-V3 · P1 — el panel lo muestra

Branch `cp/v3-video-panel`.

- [ ] Label for `video_identificacion` in the detail's `nombreArchivo` map — without it
      the row renders with an empty name.
- [ ] `<video controls preload="metadata" playsinline>` in the evidence column, fed by
      the same short-lived signed URL the images use. `panel-archivo-imagen` is an
      `<img>` and must not be bent into serving both.
- [ ] `preload="metadata"`, not `auto`: the panel must not pull megabytes for every
      expediente an analyst merely opens.
- [ ] Both copies of the design tokens and API types stay in step (CLAUDE.md).

---

## CP-V4 · P1 — reintento sin vídeo

Branch `cp/v4-reintento-sin-video`. Droppable; everything else stands without it.

The backend is already non-blocking for a _rejected_ video. It cannot be non-blocking
for a **stalled upload**, because the video rides inside the same multipart POST as the
expediente: if the request dies, the expediente dies with it.

- [ ] On a failed `POST /solicitudes` where a video was attached, retry **once** without
      the video part, and tell the prospect plainly that the recording could not be
      attached but the application was received.
- [ ] Worst case this doubles the wait, which is why it is P1 and not P0. If it is not
      built, say so in the runbook: a stalled video upload then costs the submission.

---

## CP-V5 · P2 — verificación en aparato real

Not optional in spirit, only in ordering.

- [ ] A real **iPhone/Safari** run. This is the only way to learn whether the codec
      fallback works; headless Chromium will pass regardless and prove nothing.
- [ ] A real **Android/Chrome** run over mobile data, not Wi-Fi, timing the submit.
- [ ] Update `00-master-plan.md` §"Demo-day runbook": where the kill switch is, and
      what the screen does when the camera is denied.

---

## Rollback

Each checkpoint reverts independently. CP-V1 is inert without CP-V2. The fastest lever
during the demo is the CP-V2 kill switch — no revert, no merge, one flag and a redeploy.
