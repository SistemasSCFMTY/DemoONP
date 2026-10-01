import { HttpErrorResponse } from '@angular/common/http';

/**
 * Whether a failed `POST /solicitudes` may be sent again without the `video`
 * part (03-videograbacion.md, CP-V4).
 *
 * ## Why a retry exists at all
 *
 * The Worker is already non-blocking for a video it *rejects*: the upload
 * loop catches per part, records it in `archivosFallidos`, and creates the
 * expediente anyway. It cannot be non-blocking for a **stalled upload**,
 * because the video rides inside the same multipart POST as the expediente —
 * if the request dies on the wire, the expediente dies with it.
 *
 * And the video is the whole of the weight. Measured on folio
 * `ONP-260930-6659`, a 45 s Chromium recording is `video/mp4`, **1,665,296
 * bytes**; every other file in that expediente was 4–7 KB. Dropping the video
 * turns a 1.6 MB upload into a ~40 KB one. That is the difference between a
 * submission that survives a bad mobile uplink and one that does not.
 *
 * ## Why only `status === 0`
 *
 * **A retry can duplicate the expediente**, and two folios for one person —
 * two sets of KYC files, and an analyst who cannot tell which is real — is a
 * worse outcome than a lost recording. So the question is never "did this
 * fail?" but "can this failure have committed a row?".
 *
 *  - **`status === 0`** is Angular's shape for a failure the browser itself
 *    reported with no response at all: connection refused, DNS, TLS, CORS
 *    rejection, or the connection dropping mid-body. For *this* endpoint the
 *    dominant case is the one the checkpoint exists for — the body is ~97%
 *    video, so the seconds are spent in the upload phase and that is where a
 *    bad link breaks. A Worker that never received a complete body never
 *    created anything.
 *  - **Any status the Worker answered with — 4xx and 5xx alike — is refused.**
 *    A response means the whole body arrived and the Worker ran. A 500 raised
 *    *after* the `expedientes` row was written (a later file, a subrequest
 *    limit, a CPU kill mid-loop) is indistinguishable from one raised before
 *    it, so retrying a 5xx is precisely how the duplicate happens. 4xx is
 *    refused for the simpler reason that a second identical request gets the
 *    same rejection.
 *
 * `status === 0` is the best evidence available in the browser, not proof: a
 * connection dropped after full delivery looks the same. The honest fix is an
 * idempotency key the Worker honours, which would let the retry be safe for
 * every failure class. **The Worker has no idempotency support today and
 * adding it is `backend/`, not this project's folder** — so this is the safe
 * subset, and the residual risk is a narrow one.
 *
 * ## Why there is no client-side timeout
 *
 * A timeout was considered and rejected. Aborting at, say, 60 s and retrying
 * would *manufacture* the ambiguous case instead of merely reacting to it: at
 * 1.6 MB, a working-but-slow mobile uplink takes minutes, so the timeout would
 * fire on submissions that were about to succeed and turn them into duplicate
 * expedientes. Losing a recording is recoverable; a duplicate expediente is
 * not. Without idempotency the browser must not invent the abort.
 */
export function puedeReintentarseSinVideo(err: unknown): boolean {
  return err instanceof HttpErrorResponse && err.status === 0;
}
