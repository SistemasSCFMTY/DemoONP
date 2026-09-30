import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideHouse, LucideIdCard, LucideLightbulb, LucideSignal } from '@lucide/angular';
import { NavegacionService } from '../../../core/navegacion-service';
import { OnpAlert } from '../../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpCard } from '../../../ui/onp-card/onp-card';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Ten esto a la mano. Screen 8 (onp_fer_etapa2_pf.html:592).
 *
 * The source's 🪪 💡 📶 🏠 become Lucide icons (CLAUDE.md: no emojis).
 */
@Component({
  selector: 'onp-requisitos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OnpTitulo,
    OnpCard,
    OnpAlert,
    OnpButton,
    LucideIdCard,
    LucideLightbulb,
    LucideSignal,
    LucideHouse,
  ],
  template: `
    <onp-titulo
      texto="Ten esto a la mano"
      lede="Para terminar en una sola sesión, prepara lo siguiente."
    />

    <onp-card>
      <ul class="divide-y divide-border">
        <li class="flex gap-3 py-3 first:pt-0">
          <svg lucideIdCard class="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true"></svg>
          <div class="min-w-0">
            <p class="text-label font-semibold text-text">Tu identificación oficial</p>
            <p class="text-label leading-relaxed text-text-soft">
              Credencial para votar vigente, pasaporte mexicano o matrícula consular.
            </p>
          </div>
        </li>
        <li class="flex gap-3 py-3">
          <svg lucideLightbulb class="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true"></svg>
          <div class="min-w-0">
            <p class="text-label font-semibold text-text">Un lugar bien iluminado</p>
            <p class="text-label leading-relaxed text-text-soft">
              Vas a tomar fotos de tu identificación y grabar un video.
            </p>
          </div>
        </li>
        <li class="flex gap-3 py-3">
          <svg lucideSignal class="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true"></svg>
          <div class="min-w-0">
            <p class="text-label font-semibold text-text">Conexión estable</p>
            <p class="text-label leading-relaxed text-text-soft">
              Evita perder el progreso a media captura.
            </p>
          </div>
        </li>
        <li class="flex gap-3 py-3 last:pb-0">
          <svg lucideHouse class="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true"></svg>
          <div class="min-w-0">
            <p class="text-label font-semibold text-text">Comprobante de domicilio</p>
            <p class="text-label leading-relaxed text-text-soft">
              Recibo de luz, agua o teléfono reciente.
            </p>
          </div>
        </li>
      </ul>
    </onp-card>

    <onp-alert tono="info">
      <strong>Nota:</strong> el proceso incluye una videograbación y la captura de tus datos
      biométricos. Se te pedirá autorización expresa antes de cada paso.
    </onp-alert>

    <onp-button (pulsar)="continuar()">Entendido, continuar</onp-button>
  `,
})
export class Requisitos {
  private readonly navegacion = inject(NavegacionService);

  protected continuar(): void {
    void this.navegacion.avanzar('registro', 'requisitos');
  }
}
