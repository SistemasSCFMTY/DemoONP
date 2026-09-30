/**
 * SHA-256 en hexadecimal, con Web Crypto — disponible en Workers sin
 * dependencias.
 *
 * Es el valor probatorio del producto. Cada archivo que entra se sella
 * aquí, en el servidor, antes de tocar el almacén; el hash que el panel
 * muestra es el de los bytes que realmente se guardaron, no uno que el
 * cliente dijo. La fuente lo calculaba en el navegador
 * (`huellaSHA256`, onp_fer_etapa2_pf.html:2989), donde no prueba nada.
 */
export async function sha256Hex(datos: ArrayBuffer | Uint8Array): Promise<string> {
  const buffer = datos instanceof Uint8Array ? (datos.slice().buffer as ArrayBuffer) : datos;
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 de una cadena UTF-8. */
export async function sha256Texto(texto: string): Promise<string> {
  return sha256Hex(new TextEncoder().encode(texto));
}
