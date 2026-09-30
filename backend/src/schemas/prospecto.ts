import { z } from 'zod';
import { correo, telefono } from './comunes';

/**
 * `POST /prospectos` (02-api-contract.md).
 *
 * Crea un `expedientes` en `borrador` — no hay tabla `prospectos`
 * (decisión del dueño, 2026-09-30; ver `services/prospectos.ts`).
 *
 * La contraseña se valida en ocho caracteres como en la fuente
 * (onp_fer_etapa2_pf.html:2552) y **se descarta**. Sigue en el contrato
 * porque la pantalla de registro la pide y validarla del lado del
 * servidor es lo correcto; no se guarda porque no hay nada que la
 * verifique después. El prospecto no inicia sesión: quien lo hace es el
 * personal del panel, en Supabase Auth (CP-B7).
 */
export const ProspectoSchema = z.object({
  nombres: z.string().trim().min(1).max(120),
  apellidoPaterno: z.string().trim().min(1).max(120),
  apellidoMaterno: z.string().trim().max(120).optional(),
  correo,
  telefono,
  password: z.string().min(8, 'Usa al menos 8 caracteres.').max(200),
});

export const ProspectoCreadoSchema = z.object({ id: z.string().uuid() });

export type Prospecto = z.infer<typeof ProspectoSchema>;
