import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  LucideCircleAlert,
  LucideCircleCheck,
  LucideDownload,
  LucideLoaderCircle,
} from '@lucide/angular';
import { Store, select } from '@ngxs/store';

import { DatosSofom } from '../../model/interfaces/sofom';
import {
  CargarSofom,
  ExportarExpedientes,
  GuardarSofom,
  LimpiarAvisoSofom,
} from '../../state/sofom/sofom.actions';
import { SofomState } from '../../state/sofom/sofom.state';
import { Seccion } from '../../ui/seccion/seccion';

interface Aviso {
  readonly ok: boolean;
  readonly texto: string;
  readonly clases: string;
}

/**
 * Ajustes — the SOFOM's identity, and the export.
 *
 * Two cards, where the source has four. What is deliberately gone:
 *
 * - **"Dónde se guarda la información"** (`:2048`): storage mode, Project URL,
 *   anon key, "Probar conexión". The owner's explicit decision, and it is also
 *   the one thing CLAUDE.md forbids outright — a Supabase key typed into a
 *   browser form. The Worker owns the credentials, set with
 *   `wrangler secret put`.
 * - **"Borrar todos los datos"** (`:6025`): an unguarded mass delete against a
 *   live database, behind two `confirm()` calls. Not ported.
 *
 * The write needs `rol === 'administrador'`. The panel cannot know the role —
 * `GET /admin/me` does not return it — so it attempts the save and renders the
 * refusal. That is the correct shape regardless: authorization is the
 * Worker's, and hiding a control is a convenience, never the boundary (§12).
 */
@Component({
  selector: 'panel-ajustes',
  imports: [
    ReactiveFormsModule,
    Seccion,
    LucideLoaderCircle,
    LucideCircleCheck,
    LucideCircleAlert,
    LucideDownload,
  ],
  templateUrl: './ajustes.html',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ajustes implements AfterViewInit {
  readonly #store = inject(Store);
  readonly #fb = inject(FormBuilder);

  private readonly titulo = viewChild.required<ElementRef<HTMLElement>>('titulo');

  protected readonly cargando = select(SofomState.cargando);
  protected readonly guardando = select(SofomState.guardando);
  protected readonly exportando = select(SofomState.exportando);
  protected readonly errorExportar = select(SofomState.errorExportar);
  readonly #guardado = select(SofomState.guardado);
  readonly #error = select(SofomState.error);
  readonly #datos = select(SofomState.datos);

  protected readonly formulario = this.#fb.nonNullable.group({
    razon_social: [''],
    rfc: [''],
    domicilio: [''],
    telefono: [''],
    correo_contacto: [''],
  });

  /** Mirrors the form so nothing in the template calls a function (§6). */
  readonly #valor = signal(this.formulario.getRawValue());

  protected readonly textoGuardar = computed(() =>
    this.guardando() ? 'Guardando…' : 'Guardar',
  );

  protected readonly textoExportar = computed(() =>
    this.exportando() ? 'Preparando el archivo…' : 'Exportar todos los expedientes',
  );

  protected readonly aviso = computed<Aviso | null>(() => {
    const error = this.#error();
    if (error) return { ok: false, texto: error, clases: 'bg-error/10 text-error' };

    return this.#guardado()
      ? {
          ok: true,
          texto: 'Los datos de la SOFOM quedaron guardados.',
          clases: 'bg-surface-success text-success',
        }
      : null;
  });

  constructor() {
    this.#store.dispatch(new CargarSofom());

    effect(() => {
      const datos = this.#datos();
      if (!datos) return;
      // `emitEvent: false` — arriving data is not an edit. The mirror signal
      // is set by hand for the same reason `producto` does it: `valueChanges`
      // never fires for a silent patch.
      //
      // `telefono` and `correo_contacto` come back null from the live row
      // (verified 2026-09-30). A null in a text input renders the string
      // "null", so they are coerced here and coerced back on the way out.
      this.formulario.patchValue(
        {
          razon_social: datos.razon_social,
          rfc: datos.rfc,
          domicilio: datos.domicilio,
          telefono: datos.telefono ?? '',
          correo_contacto: datos.correo_contacto ?? '',
        },
        { emitEvent: false },
      );
      this.#valor.set(this.formulario.getRawValue());
    });

    this.formulario.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.#valor.set(this.formulario.getRawValue());
      this.#store.dispatch(new LimpiarAvisoSofom());
    });
  }

  ngAfterViewInit(): void {
    this.titulo().nativeElement.focus();
  }

  protected guardar(): void {
    const v = this.#valor();
    // An emptied optional field goes back as null, not as "", so the row
    // reads the same whether it was never filled in or was cleared.
    const datos: DatosSofom = {
      razon_social: v.razon_social.trim(),
      rfc: v.rfc.trim(),
      domicilio: v.domicilio.trim(),
      telefono: v.telefono.trim() || null,
      correo_contacto: v.correo_contacto.trim() || null,
    };
    this.#store.dispatch(new GuardarSofom(datos));
  }

  protected exportar(): void {
    this.#store.dispatch(new ExportarExpedientes());
  }
}
