import { defineConfig } from 'vitest/config';

/**
 * Node, no `@cloudflare/vitest-pool-workers`.
 *
 * Lo que se prueba aquí son las funciones puras de `src/services/` y
 * `src/schemas/`: folio, normalización del payload, formato de
 * contraseña. Nada de eso toca un binding, y levantar workerd por
 * archivo costaría más de lo que aporta con el tiempo que hay.
 *
 * Web Crypto está en `globalThis` en Node 20+, así que `password.ts` y
 * `hash.ts` corren tal cual.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
