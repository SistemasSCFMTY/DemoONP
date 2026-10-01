import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OnpButton } from './onp-button';

/**
 * `cargando` exists because a disabled button with a changed label is
 * indistinguishable from a hung one: nothing on screen moves. On an unstable
 * connection — the submit carries ~1.6 MB of video — that is the whole
 * question the prospect is asking.
 *
 * What these tests defend is the pair of meanings, not the looks. A gate the
 * prospect has not met (`deshabilitado`) and a request in flight (`cargando`)
 * render the same grey button, so the only thing telling them apart is the
 * spinner and `aria-busy`. If a screen ever OR-s them into one input, the
 * button starts claiming a request is running when the real answer is "tick
 * the box first", and these tests are what catches it.
 */
@Component({
  imports: [OnpButton],
  template: `
    <onp-button [deshabilitado]="deshabilitado()" [cargando]="cargando()" (pulsar)="clics.push(1)">
      Completar Etapa 2
    </onp-button>
  `,
})
class Anfitrion {
  readonly deshabilitado = signal(false);
  readonly cargando = signal(false);
  readonly clics: number[] = [];
}

async function montar() {
  const fixture = TestBed.createComponent(Anfitrion);
  await fixture.whenStable();
  const boton = () => fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const giro = () => fixture.nativeElement.querySelector('.onp-giro');
  return { fixture, boton, giro };
}

describe('onp-button en reposo', () => {
  it('no trae hilandero ni aria-busy, y se puede pulsar', async () => {
    const { fixture, boton, giro } = await montar();

    expect(giro()).toBeNull();
    expect(boton().getAttribute('aria-busy')).toBeNull();
    expect(boton().disabled).toBe(false);

    boton().click();
    expect(fixture.componentInstance.clics).toHaveLength(1);
  });
});

describe('onp-button cargando', () => {
  it('muestra el hilandero, se anuncia ocupado y queda inhabilitado', async () => {
    const { fixture, boton, giro } = await montar();
    fixture.componentInstance.cargando.set(true);
    await fixture.whenStable();

    expect(giro()).not.toBeNull();
    expect(boton().getAttribute('aria-busy')).toBe('true');
    expect(boton().disabled).toBe(true);
  });

  it('conserva la etiqueta: bajo movimiento reducido es lo único que queda', async () => {
    const { fixture, boton } = await montar();
    fixture.componentInstance.cargando.set(true);
    await fixture.whenStable();

    expect(boton().textContent?.trim()).toContain('Completar Etapa 2');
  });

  it('no deja mandar la solicitud dos veces', async () => {
    const { fixture, boton } = await montar();
    fixture.componentInstance.cargando.set(true);
    await fixture.whenStable();

    boton().click();
    boton().click();
    expect(fixture.componentInstance.clics).toHaveLength(0);
  });
});

describe('onp-button inhabilitado por una compuerta, no por una petición', () => {
  it('no finge que hay algo en vuelo', async () => {
    const { fixture, boton, giro } = await montar();
    fixture.componentInstance.deshabilitado.set(true);
    await fixture.whenStable();

    expect(boton().disabled).toBe(true);
    // Lo que distingue «espera» de «falta que hagas algo».
    expect(giro()).toBeNull();
    expect(boton().getAttribute('aria-busy')).toBeNull();
  });
});
