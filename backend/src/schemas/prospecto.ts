import { z } from 'zod';
import { correo, telefono } from './comunes';

/**
 * `POST /prospectos` (02-api-contract.md).
 *
 * La contraseña se valida en ocho caracteres como en la fuente
 * (onp_fer_etapa2_pf.html:2552) y se guarda hasheada con PBKDF2. El
 * prospecto **no** es un usuario de Supabase Auth: Auth es para el
 * personal del panel (CP-B7).
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
