import { app } from './app';

/**
 * El punto de entrada del Worker.
 *
 * Todo lo demás vive en `app.ts` (middleware y montaje de rutas),
 * `routes/` (una por recurso, delgadas) y `services/` (la lógica).
 */
export default app;
