/**
 * The staff member currently signed in.
 *
 * Shape from `02-api-contract.md` → `POST /admin/login` and `GET /admin/me`.
 *
 * Property names are the wire names, `snake_case`, deliberately: these
 * interfaces ARE the contract's third copy (§12 duplication policy), and a
 * camelCase mirror plus a mapper would add a second place for the three
 * projects to drift apart silently.
 *
 * The session itself is an httpOnly cookie the browser never reads; this is
 * only what the panel needs in order to greet the operator and offer a logout.
 */
export interface SesionPanel {
  readonly correo: string;
  readonly nombre_completo: string;
}

/**
 * What `POST /admin/login` actually returns: the name, and a `Set-Cookie`.
 *
 * **Not** a `SesionPanel` — there is no `correo` in the body. Verified
 * against the running Worker, 2026-09-30. The full profile comes from
 * `GET /admin/me`, which `PanelState` calls straight after a successful
 * login so one code path builds the session and the cookie is proven to work
 * before the operator is let in.
 */
export interface RespuestaLogin {
  readonly nombre_completo: string;
}

/** `POST /admin/login` request body. */
export interface CredencialesPanel {
  readonly correo: string;
  readonly password: string;
}
