/**
 * Stand-in images for the mocked signed-URL endpoint.
 *
 * CP-S3 is the payoff shot of the demo — the expediente arriving with its
 * photographs — and it cannot be judged against grey boxes. Until CP-B4 mints
 * real signed URLs from the bucket, `PanelApiSimulada` hands the detail view
 * these: inline SVG, drawn in the §3 palette, obviously synthetic up close and
 * correctly shaped from across a room.
 *
 * They are drawings, not photographs of a real credential: a fabricated ID
 * good enough to pass for a scan would be the wrong artefact to have lying
 * around in a repository.
 */

function comoDataUri(svg: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/\s{2,}/g, ' '));
}

const TIPOGRAFIA = "font-family='Archivo, system-ui, sans-serif'";

/** A credential-shaped front face: photo, name block, CURP, clave de elector. */
function ineFrente(nombre: string, curp: string, clave: string): string {
  return comoDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 404" width="640" height="404">
      <rect width="640" height="404" fill="#e8e4d9"/>
      <rect x="10" y="10" width="620" height="384" rx="12" fill="#f6f4ef" stroke="#d6d0c0"/>
      <rect x="10" y="10" width="620" height="54" rx="12" fill="#1c3352"/>
      <rect x="10" y="48" width="620" height="16" fill="#1c3352"/>
      <text x="30" y="34" ${TIPOGRAFIA} font-size="15" font-weight="700" fill="#ffffff">INSTITUTO NACIONAL ELECTORAL</text>
      <text x="30" y="54" ${TIPOGRAFIA} font-size="12" fill="#c6a866">CREDENCIAL PARA VOTAR</text>

      <rect x="30" y="86" width="132" height="168" rx="6" fill="#d6d0c0" stroke="#a9a294"/>
      <circle cx="96" cy="140" r="34" fill="#a9a294"/>
      <path d="M46 254c0-33 22-54 50-54s50 21 50 54z" fill="#a9a294"/>
      <text x="96" y="272" ${TIPOGRAFIA} font-size="10" fill="#7c7566" text-anchor="middle">FOTOGRAFÍA</text>

      <text x="186" y="100" ${TIPOGRAFIA} font-size="10" fill="#7c7566">NOMBRE</text>
      <text x="186" y="122" ${TIPOGRAFIA} font-size="18" font-weight="600" fill="#1a1c1f">${nombre}</text>

      <text x="186" y="154" ${TIPOGRAFIA} font-size="10" fill="#7c7566">DOMICILIO</text>
      <rect x="186" y="162" width="300" height="8" rx="4" fill="#d6d0c0"/>
      <rect x="186" y="176" width="252" height="8" rx="4" fill="#d6d0c0"/>

      <text x="186" y="208" ${TIPOGRAFIA} font-size="10" fill="#7c7566">CLAVE DE ELECTOR</text>
      <text x="186" y="226" ${TIPOGRAFIA} font-size="14" font-weight="600" fill="#1a1c1f" letter-spacing="1.5">${clave}</text>

      <text x="186" y="252" ${TIPOGRAFIA} font-size="10" fill="#7c7566">CURP</text>
      <text x="186" y="270" ${TIPOGRAFIA} font-size="14" font-weight="600" fill="#1a1c1f" letter-spacing="1.5">${curp}</text>

      <rect x="30" y="282" width="580" height="1" fill="#d6d0c0"/>
      <text x="30" y="306" ${TIPOGRAFIA} font-size="10" fill="#7c7566">SECCIÓN 1842 · VIGENCIA 2033</text>
      <path d="M470 292h140v92H470z" fill="none"/>
      <path d="M476 376c34-52 62-52 96 0" stroke="#1c3352" stroke-width="2" fill="none" stroke-linecap="round"/>
      <text x="560" y="390" ${TIPOGRAFIA} font-size="9" fill="#7c7566" text-anchor="middle">FIRMA</text>
      <text x="30" y="380" ${TIPOGRAFIA} font-size="10" fill="#8a5a1c">Imagen de demostración</text>
    </svg>
  `);
}

/** The reverse: the OCR band and the machine-readable zone. */
function ineReverso(ocr: string): string {
  const barras = Array.from({ length: 46 }, (_, i) => {
    const x = 30 + i * 13;
    const ancho = i % 3 === 0 ? 6 : i % 2 === 0 ? 3 : 4;
    return `<rect x="${x}" y="96" width="${ancho}" height="62" fill="#1a1c1f"/>`;
  }).join('');

  return comoDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 404" width="640" height="404">
      <rect width="640" height="404" fill="#e8e4d9"/>
      <rect x="10" y="10" width="620" height="384" rx="12" fill="#f6f4ef" stroke="#d6d0c0"/>
      <rect x="10" y="10" width="620" height="44" rx="12" fill="#0e2036"/>
      <rect x="10" y="40" width="620" height="14" fill="#0e2036"/>
      <text x="30" y="36" ${TIPOGRAFIA} font-size="12" fill="#c6a866">REVERSO · CREDENCIAL PARA VOTAR</text>

      ${barras}

      <text x="30" y="192" ${TIPOGRAFIA} font-size="10" fill="#7c7566">OCR</text>
      <text x="30" y="212" ${TIPOGRAFIA} font-size="15" font-weight="600" fill="#1a1c1f" letter-spacing="2">${ocr}</text>

      <rect x="30" y="236" width="580" height="1" fill="#d6d0c0"/>
      <text x="30" y="272" font-family="ui-monospace, monospace" font-size="15" fill="#1a1c1f" letter-spacing="2.5">IDMEX1234567890&lt;&lt;1842004</text>
      <text x="30" y="296" font-family="ui-monospace, monospace" font-size="15" fill="#1a1c1f" letter-spacing="2.5">9903194M3312319MEX&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
      <text x="30" y="320" font-family="ui-monospace, monospace" font-size="15" fill="#1a1c1f" letter-spacing="2.5">${ocr}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>

      <text x="30" y="376" ${TIPOGRAFIA} font-size="10" fill="#8a5a1c">Imagen de demostración</text>
    </svg>
  `);
}

/** A drawn signature on transparent ground, as the canvas produces one. */
function firma(trazo: string): string {
  return comoDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 150" width="420" height="150">
      <path d="${trazo}" fill="none" stroke="#1a1c1f" stroke-width="3.5"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `);
}

export const IMAGENES_SIMULADAS = {
  paez: {
    id_frente: ineFrente('PÁEZ ESQUIVEL FERNANDO', 'PAEF990319HNLZSR09', 'PZESFR99031901H300'),
    id_reverso: ineReverso('1234567890123'),
    firma: firma(
      'M28 104c18-44 34-58 44-42s-6 58 8 60 30-40 44-56 22-10 20 14-10 44 4 46 26-32 38-50 26-14 26 6-10 40 2 44 30-24 44-40',
    ),
  },
  robles: {
    id_frente: ineFrente('ROBLES CANTÚ MARÍA GUADALUPE', 'ROCM880712MNLBNR04', 'RBCNMR88071219M600'),
    id_reverso: ineReverso('2938475610928'),
    firma: firma(
      'M30 96c10-36 26-52 38-40s0 52 12 56 24-34 34-54 20-18 22 2-4 42 8 48 24-20 32-38 18-24 24-10 2 34 14 38 26-16 36-30',
    ),
  },
  villalobos: {
    id_frente: ineFrente('VILLALOBOS MENDOZA JORGE ALBERTO', 'VIMJ750224HDFLNR07', 'VLMNJR75022409H100'),
    id_reverso: ineReverso('5647382910475'),
    firma: firma(
      'M26 100c22-40 40-54 48-38s-10 56 4 60 28-38 40-58 24-14 24 8-8 42 6 46 28-26 40-44 22-16 26 0',
    ),
  },
} as const;
