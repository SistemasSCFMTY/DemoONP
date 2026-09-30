/**
 * CP-V2 verification: the real recorder against a real browser.
 *
 *   node e2e/videograbacion.mjs
 *
 * What the unit tests cannot prove is proved here: that Chromium's own
 * `MediaRecorder` produces bytes for the mime the detection chose, and that
 * the `finally` really ends the tracks — `readyState === 'ended'` on the
 * browser's own `MediaStreamTrack`, not on a stub that sets a field.
 *
 * `--use-fake-device-for-media-stream` gives the camera and the microphone a
 * synthetic source, so no hardware and no human are involved.
 *
 * Deliberately not a Playwright test-runner project: `web-app/` does not
 * depend on Playwright and should not start doing so a day before the demo.
 * This is one script, run by hand, using the already-cached browser.
 *
 * Two things that cost time if rediscovered:
 *  - **Never pass `--user-data-dir` as a launch arg.** Playwright rejects it.
 *  - `getUserMedia` needs a secure context. `http://127.0.0.1` counts as one
 *    in Chromium; any other host would not.
 */
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = dirname(AQUI);
const DURACION_MS = 2000;

/**
 * `playwright-core` is not a dependency of this project on purpose. Point
 * `PLAYWRIGHT_CORE` at an install, or let this find one `npx` has already
 * cached — the browser binary itself is in `~/.cache/ms-playwright`.
 */
const requerir = createRequire(import.meta.url);
const { chromium } = (() => {
  const candidatos = [process.env['PLAYWRIGHT_CORE'], 'playwright-core'].filter(Boolean);
  const cacheNpx = join(homedir(), '.npm/_npx');
  if (existsSync(cacheNpx)) {
    for (const entrada of readdirSync(cacheNpx)) {
      candidatos.push(join(cacheNpx, entrada, 'node_modules/playwright-core'));
    }
  }
  for (const candidato of candidatos) {
    try {
      return requerir(candidato);
    } catch {
      // Siguiente.
    }
  }
  throw new Error(
    'No encontré playwright-core. Instálalo o exporta PLAYWRIGHT_CORE=/ruta/a/playwright-core.',
  );
})();

const fallos = [];
function comprobar(descripcion, condicion, detalle) {
  if (condicion) {
    console.log(`  ok   ${descripcion}`);
  } else {
    console.log(`  FALLA ${descripcion}${detalle ? ` — ${detalle}` : ''}`);
    fallos.push(descripcion);
  }
}

const salida = mkdtempSync(join(tmpdir(), 'onp-video-'));
let servidor;
let navegador;

try {
  // --- 1. Bundle the real module, unmodified, into the harness page. -------
  execFileSync(
    join(RAIZ, 'node_modules/.bin/esbuild'),
    [
      join(AQUI, 'harness.ts'),
      '--bundle',
      '--format=iife',
      '--target=chrome120',
      `--outfile=${join(salida, 'harness.js')}`,
    ],
    { stdio: 'inherit' },
  );

  const pagina = `<!doctype html><meta charset="utf-8"><title>CP-V2</title>
<video autoplay playsinline muted></video>
<script src="/harness.js"></script>`;
  const guion = readFileSync(join(salida, 'harness.js'), 'utf8');

  servidor = createServer((peticion, respuesta) => {
    if (peticion.url === '/harness.js') {
      respuesta.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
      respuesta.end(guion);
      return;
    }
    respuesta.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    respuesta.end(pagina);
  });
  // Port 0 — the owner watches :4200 and :4201 and this must not go near them.
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${servidor.address().port}/`;
  console.log(`\nservidor de prueba en ${base}\n`);

  // --- 2. Real Chromium, fake camera. -------------------------------------
  navegador = await chromium.launch({
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });
  const contexto = await navegador.newContext({ permissions: ['camera', 'microphone'] });
  const hoja = await contexto.newPage();
  hoja.on('console', (m) => {
    if (m.type() === 'error') console.log(`  [consola] ${m.text()}`);
  });
  await hoja.goto(base);

  const informe = await hoja.evaluate((ms) => window.correrGrabacion(ms), DURACION_MS);

  console.log('informe:', JSON.stringify(informe, null, 2), '\n');

  // --- 3. The three assertions CP-V2 asks for, plus what they rest on. -----
  comprobar(
    'la detección de códec eligió uno de los cuatro mimes',
    informe.mimeElegido !== null && informe.mimesConocidos.includes(informe.mimeElegido),
    `eligió ${informe.mimeElegido}`,
  );
  // Chromium soporta los cuatro, así que "es uno de los cuatro" pasa incluso
  // con una detección que nunca pregunta — el bug que mata a Safari. Esto
  // compara contra lo que isTypeSupported responde de verdad, en orden.
  comprobar(
    'eligió el PRIMERO que isTypeSupported acepta, preguntando de verdad',
    informe.mimeElegido === informe.mimeEsperado,
    `eligió ${informe.mimeElegido}, esperaba ${informe.mimeEsperado}`,
  );
  comprobar('la grabación terminó como real, no simulada', informe.grabado && !informe.simulado);
  comprobar('el blob no está vacío', informe.bytes > 0, `${informe.bytes} bytes`);
  comprobar(
    'el mime solicitado es uno de los cuatro',
    informe.mimeSolicitado !== null && informe.mimesConocidos.includes(informe.mimeSolicitado),
    `${informe.mimeSolicitado}`,
  );
  comprobar(
    'el mime del wire es el tipo base, sin parámetro codecs',
    informe.mime === 'video/webm' || informe.mime === 'video/mp4',
    `${informe.mime}`,
  );
  comprobar(
    'el Blob lleva ese mismo tipo base (el Worker busca por coincidencia exacta)',
    informe.tipoDelBlob === informe.mime,
    `blob=${informe.tipoDelBlob} mime=${informe.mime}`,
  );
  comprobar(
    'se abrieron pistas de vídeo y de audio',
    informe.pistas.some((p) => p.kind === 'video') &&
      informe.pistas.some((p) => p.kind === 'audio'),
    informe.pistas.map((p) => p.kind).join(', ') || 'ninguna',
  );
  comprobar(
    'TODAS las pistas quedaron detenidas después de grabar',
    informe.pistas.length > 0 && informe.pistas.every((p) => p.readyState === 'ended'),
    informe.pistas.map((p) => `${p.kind}=${p.readyState}`).join(', '),
  );
  comprobar('el visor soltó el stream', informe.visorSuelto);
} finally {
  await navegador?.close();
  servidor?.close();
  rmSync(salida, { recursive: true, force: true });
}

console.log('');
if (fallos.length) {
  console.log(`${fallos.length} comprobación(es) fallaron.`);
  process.exit(1);
}
console.log('Todas las comprobaciones pasaron.');
