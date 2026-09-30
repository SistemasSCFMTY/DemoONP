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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideCircleAlert } from '@lucide/angular';
import { Store, select } from '@ngxs/store';

import { environment } from '../../../environments/environment';
import { IniciarSesion, LimpiarErrorSesion } from '../../state/panel/panel.actions';
import { PanelState } from '../../state/panel/panel.state';

/**
 * `POST /admin/login`.
 *
 * The source authenticated against a hardcoded `PASS_ADMIN` string comparison
 * in local mode (`onp_fer_etapa2_pf.html:5278`). That is gone with CP-B7 —
 * departure 5 in the master plan. Credentials go to the Worker, which sets an
 * httpOnly session cookie; this component never sees a token and has nowhere
 * to put one.
 */
@Component({
  selector: 'panel-acceso',
  imports: [ReactiveFormsModule, LucideCircleAlert],
  templateUrl: './acceso.html',
  host: { class: 'block min-h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Acceso implements AfterViewInit {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #ruta = inject(ActivatedRoute);
  readonly #fb = inject(FormBuilder);

  /** §9: the page title takes focus so a screen reader announces the screen. */
  private readonly titulo = viewChild.required<ElementRef<HTMLElement>>('titulo');

  protected readonly cargando = select(PanelState.cargando);
  readonly #errorServidor = select(PanelState.error);
  readonly #autenticado = select(PanelState.autenticado);

  /** The source's own pre-flight message (`:5286`), before anything is sent. */
  readonly #errorLocal = signal<string | null>(null);

  protected readonly error = computed(() => this.#errorLocal() ?? this.#errorServidor());

  /** Surfaces the environment's mock switch, so the label stays honest (§11). */
  protected readonly modoSimulado = environment.usarApiSimulada;

  protected readonly formulario = this.#fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  /** "Entrando…" verbatim from the source (`:5289`). */
  protected readonly textoBoton = computed(() => (this.cargando() ? 'Entrando…' : 'Entrar'));

  constructor() {
    // Clear a stale "Correo o contraseña incorrectos" as soon as they retype.
    this.formulario.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.#errorLocal.set(null);
      this.#store.dispatch(new LimpiarErrorSesion());
    });

    effect(() => {
      if (!this.#autenticado()) return;
      // A route path the guard stashed, never a field value (§12).
      const destino = this.#ruta.snapshot.queryParamMap.get('destino');
      void this.#router.navigateByUrl(destino ?? '/expedientes');
    });
  }

  ngAfterViewInit(): void {
    this.titulo().nativeElement.focus();
  }

  protected entrar(): void {
    const { correo, password } = this.formulario.getRawValue();

    if (!correo.trim() || !password) {
      this.formulario.markAllAsTouched();
      this.#errorLocal.set('Escribe tu correo y tu contraseña');
      return;
    }

    this.#errorLocal.set(null);
    this.#store.dispatch(new IniciarSesion({ correo: correo.trim(), password }));
  }
}
