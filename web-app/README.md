# web-app — the prospect flow

The 28-screen loan application a prospect fills out on a phone. Angular 21
(standalone, signals, zoneless) + NGXS 21 + Tailwind 4. **No PrimeNG** — that
belongs to `superadmin-app/`.

Mobile first at **390px**. Build there; never design wide and squeeze.

Canonical docs, in reading order: the repo's `CLAUDE.md`, then
`.claude/plans/onp/01-conventions.md`, `00-master-plan.md` and
`02-api-contract.md`. Where this file and those disagree, those win.

## Commands

| | |
|---|---|
| `npm start` | dev server on http://localhost:4200 |
| `npm run build` | production build → **`dist/DemoONP/browser`** |
| `npm test` | unit tests (vitest, `--no-watch` for one run) |
| `npm run deploy` | publish to Cloudflare Pages — **see the warning below** |

The output directory is `dist/DemoONP/browser`. `DemoONP` is the project name
in `angular.json`; renaming the project moves the folder and breaks the deploy
script.

## Deploying to Cloudflare Pages

```
npm run build
npm run deploy      # wrangler pages deploy dist/DemoONP/browser --project-name=onp-web
```

**Do not run the deploy without the owner's signal.** They hold the Cloudflare
account, and it is not the one `wrangler` is currently authenticated against.
Publishing from the wrong account creates a project nobody can find and a URL
that does not match the one CORS is configured for.

`public/_redirects` sends every path to `index.html` with a 200, so the Angular
router owns routing. Without it a deep link into the wizard 404s — which
happens the first time anyone reloads mid-flow.

### Before the demo

1. Set `apiBaseUrl` in `src/environments/environment.ts` to the deployed
   Worker. It is the only place the origin appears.
2. Confirm the Worker's CORS allows this Pages origin. The API is on a
   different origin and every call sends `withCredentials`.
3. Geolocation and `getUserMedia` need **HTTPS** and a permission grant. Pages
   gives you HTTPS. Grant both before anyone is watching, and do not use an
   incognito window — it re-prompts for everything.
4. At the registro step, type the address that owns the Resend account.
   Resend sends from the sandbox sender and delivers nowhere else (deviation
   D8). Nothing visibly fails otherwise; the email just never arrives.
5. The OTP appears on screen under "Modo demostración". That is deliberate and
   labelled — say so out loud before someone asks.

## What is in here

```
src/app/
  core/          app-wide singletons (navigation)
  guards/        one guard per file
  layout/        the 390px shell: topbar, progress bar
  model/
    constants/   one constant per file, by entity
    interfaces/  Expediente, Producto, Paso…
  pages/         one folder per screen
  pipes/         pesos, porcentaje
  services/
    domain/      the arithmetic, the validators, camera, OCR, PDF
    http/        one service per backend resource
  state/         NGXS: Navegación, Simulador, Sesión, Solicitud, Identidad
  ui/            the design-system primitives
```

No `index.ts` barrels, anywhere.

## Two rules that are not style preferences

**No Supabase in the browser.** No URL, no anon key, no `supabase-js`. The
Worker holds the credentials.

**No PII in localStorage, sessionStorage or IndexedDB. Ever.** The expediente
holds a CURP, an income and photographs of an identity document; the backend is
the only place it lands. There is no storage plugin on the store and there must
not be. The source wrote base64 INE photos into IndexedDB — that is departure 2
and it does not come back.
