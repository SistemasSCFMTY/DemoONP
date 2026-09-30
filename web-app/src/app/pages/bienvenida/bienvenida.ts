import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { BRAND } from '../../brand.config';
import { NavegacionService } from '../../core/navegacion-service';
import { ElegirSiEsCliente } from '../../state/sesion/sesion.actions';
import { OnpButton } from '../../ui/onp-button/onp-button';

/**
 * The portada. Screen 1 (onp_fer_etapa2_pf.html:274).
 *
 * No topbar, no progress bar: it is the presentation and no trámite has
 * started yet. Copy ported verbatim.
 *
 * Every brand value comes from `brand.config.ts`, as `pintarDatosSofom`
 * (`:2197`) read them from a `sofoms` row in the source. The nombre comercial
 * is the razón social up to its first comma, which is the rule the source
 * used and which `brand.config` now states outright.
 *
 * "Iniciar sesión" is for someone who already has a relationship with the
 * SOFOM, so it sets `esCliente` before jumping to verificar-cliente (`:2193`).
 */
@Component({
  selector: 'onp-bienvenida',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OnpButton],
  template: `
    <section class="pt-4 text-center">
      <div
        class="mx-auto mb-5 grid size-22 place-items-center overflow-hidden rounded-card border border-border bg-surface shadow-e2"
      >
        @if (marca.logo) {
          <img [src]="marca.logo" [alt]="marca.nombreComercial" class="size-full object-contain" />
        } @else {
          <span class="px-1.5 text-status leading-tight text-text-soft">LOGOTIPO<br />DE LA SOFOM</span>
        }
      </div>

      <p class="text-body text-text-soft">Bienvenido a</p>
      <h1 class="mt-0.5 font-heading text-wordmark leading-tight font-bold text-navy-deep">
        {{ marca.nombreComercial }}
      </h1>
      <p class="mt-3 text-h3 font-semibold text-gold">Financiamiento para alcanzar tus objetivos.</p>
      <p class="mt-3 text-body leading-relaxed text-text-soft">
        Solicita tu crédito de forma fácil, segura<br />y desde donde estés.
      </p>
    </section>

    <div class="mt-6">
      <onp-button (pulsar)="solicitar()">Solicitar crédito</onp-button>
      <onp-button variante="secondary" (pulsar)="iniciarSesion()">Iniciar sesión</onp-button>
    </div>

    <section class="mt-7 rounded-card border border-border bg-surface p-4">
      <h2 class="mb-1.5 font-heading text-h3 font-bold text-navy-deep">
        Conoce nuestras opciones de crédito
      </h2>
      <p class="text-label leading-relaxed text-text-soft">
        Consulta las características, requisitos y costos de nuestros productos antes de iniciar tu
        solicitud.
      </p>
      <onp-button variante="secondary" (pulsar)="abrir('catalogo')">Ver créditos</onp-button>
    </section>

    <footer class="mt-8 border-t border-border pt-4 text-center">
      <p class="text-status text-text-soft">{{ marca.razonSocial }}</p>
      <nav class="mt-2 flex flex-col items-center" aria-label="Información legal">
        <onp-button variante="enlace" (pulsar)="abrir('privacidad')">Aviso de Privacidad</onp-button>
        <onp-button variante="enlace" (pulsar)="abrir('terminos')">
          Términos y Condiciones
        </onp-button>
        <onp-button variante="enlace" (pulsar)="abrir('ayuda')">Ayuda / Contacto</onp-button>
      </nav>
    </footer>
  `,
})
export class Bienvenida {
  protected readonly marca = BRAND;

  private readonly navegacion = inject(NavegacionService);
  private readonly store = inject(Store);

  protected solicitar(): void {
    void this.navegacion.avanzar('es-cliente', 'bienvenida');
  }

  protected iniciarSesion(): void {
    this.store.dispatch(new ElegirSiEsCliente(true));
    void this.navegacion.avanzar('verificar-cliente', 'bienvenida');
  }

  protected abrir(destino: 'catalogo' | 'privacidad' | 'terminos' | 'ayuda'): void {
    void this.navegacion.abrirInformativa(destino, 'bienvenida');
  }
}
