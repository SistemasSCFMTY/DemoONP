# `superadmin-app` — el panel del personal

El panel administrativo de ONP FER. Angular 21 (standalone, signals, zoneless) +
NGXS 21 + Tailwind 4 + PrimeNG 21. **Un solo tenant.** Despliega a Cloudflare Pages.

Es la única superficie del producto que **no** es mobile first: es una herramienta de
escritorio para el personal de la SOFOM. No se le aplica el shell de 390px
(`.claude/plans/onp/01-conventions.md` §12).

## Desarrollo

```bash
npm install
npm start          # http://localhost:4200
```

Arranca contra `PanelApiSimulada`, un servicio en memoria con tres expedientes de
ejemplo. Cualquier contraseña entra: no hay nada detrás más que datos inventados.

## A dónde apunta la API

`src/environments/environment.ts` (desarrollo) y `environment.production.ts`
(producción, sustituido por `fileReplacements` en `angular.json`).

```ts
apiBaseUrl: 'https://…',   // el Worker de CP-B1
usarApiSimulada: true,     // false para hablar con el Worker
```

**Las dos compilaciones siguen con el simulador**, a propósito: CP-B8 (desplegar el
Worker) todavía no aterriza y un build apuntando a un origen muerto mostraría un panel
vacío el día de la demo. Cambiar esas dos líneas es todo lo que hace falta para pasar
al backend real; no hay ningún otro punto en la aplicación que conozca una URL.

La sesión es una cookie `httpOnly`, y el panel se sirve desde un origen distinto al del
Worker, así que **cada llamada va con `withCredentials: true`** (`PanelApiHttp`). Sin
eso el login parece funcionar y todo lo demás responde 401. El Worker, por su parte,
debe permitir ese origen en CORS con `credentials` habilitado.

## Compilar

```bash
npm run build
```

- Configuración por omisión: `production`.
- Directorio de salida: **`dist/superadmin-app/browser`**.
- `public/_redirects` se copia a la raíz de la salida. Contiene `/*  /index.html  200`,
  que es lo que hace que un *reload* sobre `/expedientes/<id>` no devuelva 404 desde el
  CDN.

## Desplegar a Cloudflare Pages

```bash
npm run deploy
# wrangler pages deploy dist/superadmin-app/browser --project-name=onp-panel
```

**Todavía no se ha ejecutado.** La cuenta de Cloudflare es del dueño y no es contra la
que `wrangler` está autenticado en este entorno; él lo corre cuando lo decida. Lo que
hay aquí es configuración y documentación.

Antes del primer despliegue:

1. `wrangler login` con la cuenta correcta.
2. Crear el proyecto de Pages (`onp-panel`) o ajustar `--project-name`.
3. Poner `apiBaseUrl` y `usarApiSimulada: false` en `environment.production.ts`.
4. Añadir el origen de Pages a la lista de CORS del Worker (CP-B1), con credenciales.

## Estructura

```
src/app/
  core/            interceptor del sobre de error de la API
  guards/          sesion.guard.ts — conveniencia para el usuario, no una frontera
  layout/          panel-shell — la barra lateral y el área de trabajo
  model/
    constants/expediente/   estados, tipos de archivo, momentos de ubicación
    interfaces/             la copia del contrato de 02-api-contract.md
  pages/           acceso · expedientes · expediente-detalle
  pipes/           pesos · fechaMx · siNo · tamanoArchivo
  services/
    domain/        impresión del documento firmado
    http/          PanelApi (abstracta) + la real, la simulada y sus datos
  state/           PanelState · ExpedientesState
  theme/           el preset de PrimeNG construido con los tokens de §3
  ui/              seccion · dato-fila · estado-badge · archivo-imagen
```

Sin `index.ts` barrels, en ningún nivel.

## Datos personales

Esta aplicación muestra más PII que cualquier otra pantalla del producto: CURP, RFC,
domicilio, ingresos, geolocalización, fotografías de la identificación y la firma.

- Ningún valor de un campo llega a una URL. La ruta de detalle lleva el id opaco.
- Ningún cuerpo de petición o respuesta llega a un log. El interceptor registra un
  código de estado y una ruta, nada más.
- Las URLs firmadas se piden de una en una, sólo para el archivo que se va a pintar,
  duran cinco minutos y **no se persisten**: esta aplicación no tiene
  `@ngxs/storage-plugin`.
- La autorización es del backend. El guard de sesión es una comodidad para el
  operador, no una frontera de seguridad.
