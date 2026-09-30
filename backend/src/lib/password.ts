/**
 * Contraseñas: PBKDF2-SHA256 con Web Crypto.
 *
 * Por qué PBKDF2 y no bcrypt o argon2: son los únicos parámetros que el
 * runtime de Workers ofrece de forma nativa. Meter una implementación
 * WASM de argon2 en el bundle cuesta tamaño y arranque, y PBKDF2 con
 * 100 000 iteraciones es defensa suficiente para un panel interno de
 * una demo. Si esto vive más de una semana, el cambio a argon2id es la
 * primera deuda a pagar.
 *
 * Formato guardado:  pbkdf2$sha256$<iteraciones>$<sal b64>$<hash b64>
 *
 * `scripts/hash-password.mjs` genera exactamente este formato con los
 * mismos parámetros. Si cambias uno, cámbialo en los dos lados o ningún
 * login vuelve a pasar.
 */

const ITERACIONES = 100_000;
const BYTES_SAL = 16;
const BITS_LLAVE = 256;

const aBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes));

const deBase64 = (texto: string): Uint8Array =>
  Uint8Array.from(atob(texto), (c) => c.charCodeAt(0));

async function derivar(
  password: string,
  sal: Uint8Array,
  iteraciones: number,
): Promise<Uint8Array> {
  const llaveBase = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: sal.slice().buffer as ArrayBuffer, iterations: iteraciones },
    llaveBase,
    BITS_LLAVE,
  );
  return new Uint8Array(bits);
}

/** Genera el hash almacenable de una contraseña nueva. */
export async function hashearPassword(password: string): Promise<string> {
  const sal = crypto.getRandomValues(new Uint8Array(BYTES_SAL));
  const llave = await derivar(password, sal, ITERACIONES);
  return ['pbkdf2', 'sha256', ITERACIONES, aBase64(sal), aBase64(llave)].join('$');
}

/**
 * Compara una contraseña contra un hash almacenado.
 *
 * La comparación es de tiempo constante: un `===` sobre el hash filtra,
 * por cuánto tarda en fallar, cuántos bytes iniciales acertaste.
 * Devuelve `false` ante cualquier hash malformado en vez de reventar —
 * un renglón corrupto en `usuarios_panel` no debe tumbar el login.
 */
export async function verificarPassword(password: string, almacenado: string): Promise<boolean> {
  try {
    const partes = almacenado.split('$');
    if (partes.length !== 5) return false;
    const [algoritmo, digest, iteracionesTexto, salB64, hashB64] = partes as [
      string,
      string,
      string,
      string,
      string,
    ];
    if (algoritmo !== 'pbkdf2' || digest !== 'sha256') return false;

    const iteraciones = Number.parseInt(iteracionesTexto, 10);
    if (!Number.isFinite(iteraciones) || iteraciones < 1000) return false;

    const esperado = deBase64(hashB64);
    const obtenido = await derivar(password, deBase64(salB64), iteraciones);
    if (esperado.length !== obtenido.length) return false;

    let diferencia = 0;
    for (let i = 0; i < esperado.length; i++) diferencia |= esperado[i]! ^ obtenido[i]!;
    return diferencia === 0;
  } catch {
    return false;
  }
}
