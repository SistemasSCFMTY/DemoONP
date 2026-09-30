import { z } from 'zod';

/**
 * Los parámetros del simulador (02-api-contract.md).
 *
 * Exactamente los ocho campos del contrato, ni uno más. El CAT, el pago
 * mensual y la comisión **no** viajan: se calculan en el navegador a
 * partir de estos (`pagoMensual` :2380, `comisionDe` :2386,
 * `calcularCAT` :2395). Es deliberado — la UI no debería tener que
 * confiar en una cifra financiera que no puede reproducir, y esas
 * fórmulas son justo lo que un director de crédito va a querer picar
 * en la demo.
 */
export const ProductoSchema = z.object({
  monto_min: z.number(),
  monto_max: z.number(),
  plazo_min: z.number().int(),
  plazo_max: z.number().int(),
  tasa_anual: z.number(),
  comision_apertura: z.boolean(),
  comision_pct: z.number(),
  comision_desde: z.number(),
});

export type Producto = z.infer<typeof ProductoSchema>;

/**
 * `PUT /producto` (CP-B9, P1).
 *
 * Mismos campos, con los límites que impiden guardar un producto
 * imposible: el mínimo por debajo del máximo, plazos positivos, tasa
 * no negativa. La base no tiene esas restricciones y el panel es un
 * formulario — un dedo de más en el teclado no debería dejar el
 * simulador del prospecto sin rango.
 */
export const ProductoEntradaSchema = ProductoSchema.extend({
  monto_min: z.number().positive().max(100_000_000),
  monto_max: z.number().positive().max(100_000_000),
  plazo_min: z.number().int().positive().max(600),
  plazo_max: z.number().int().positive().max(600),
  tasa_anual: z.number().min(0).max(500),
  comision_pct: z.number().min(0).max(100),
  comision_desde: z.number().min(0).max(100_000_000),
})
  .refine((p) => p.monto_min <= p.monto_max, {
    message: 'El monto mínimo no puede ser mayor que el máximo.',
    path: ['monto_min'],
  })
  .refine((p) => p.plazo_min <= p.plazo_max, {
    message: 'El plazo mínimo no puede ser mayor que el máximo.',
    path: ['plazo_min'],
  });
