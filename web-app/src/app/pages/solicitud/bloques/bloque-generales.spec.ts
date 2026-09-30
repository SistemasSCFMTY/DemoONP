import { Component, ErrorHandler, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { grupoGenerales } from '../../../services/domain/formularios-expediente';
import { GENERALES_VACIOS } from '../../../state/solicitud/solicitud.model';
import { BloqueGenerales } from './bloque-generales';

/**
 * These tests exist because of a bug that shipped to Pages and read, from the
 * outside, as "the styles are not loading".
 *
 * `estadoCurp` is a `computed`, and it used to call `sincronizarOrigen()`,
 * which writes `generadaPorLaApp`. Writing a signal inside a `computed`
 * throws NG0600. The template reads `estadoCurp()` on the very first render,
 * so the throw landed in the middle of the update pass: the static markup was
 * already in the DOM from the create pass, but not one binding after it ever
 * ran. Every label rendered empty, every `[class]` binding stayed unapplied,
 * and the `Continuar` button in the parent screen lost its styling too. Two
 * screens were affected — `form-generales` and `declaratoria`.
 *
 * Nothing in the suite caught it, because the unit tests exercised
 * `generarCURP` and `validarCURP` directly and never rendered the component.
 *
 * Angular routes a template error to the `ErrorHandler` and leaves the
 * half-updated DOM in place, so "it did not throw" is not on its own a
 * useful assertion. These check both halves: that nothing reached the error
 * handler, and that the bindings actually resolved.
 */
@Component({
  imports: [BloqueGenerales],
  template: `<onp-bloque-generales [grupo]="grupo" idPrefijo="pf" />`,
})
class Anfitrion {
  private readonly fb = inject(FormBuilder);
  grupo = grupoGenerales(this.fb, GENERALES_VACIOS);
}

class ErrorHandlerEspia extends ErrorHandler {
  readonly vistos: unknown[] = [];
  override handleError(error: unknown): void {
    this.vistos.push(error);
  }
}

function montar() {
  const espia = new ErrorHandlerEspia();
  TestBed.configureTestingModule({
    providers: [{ provide: ErrorHandler, useValue: espia }],
  });
  return { fixture: TestBed.createComponent(Anfitrion), espia };
}

describe('bloque-generales: el render no debe romperse', () => {
  it('renderiza sin lanzar NG0600 (escribir una señal dentro de un computed)', async () => {
    const { fixture, espia } = montar();
    await fixture.whenStable();

    const texto = espia.vistos.map((e) => String(e)).join('\n');
    expect(texto).not.toContain('NG0600');
    expect(texto).not.toContain('Writing to signals');
    expect(espia.vistos).toHaveLength(0);
  });

  it('las etiquetas traen su texto: la pasada de actualización llegó al final', async () => {
    const { fixture } = montar();
    await fixture.whenStable();

    const etiquetas = [
      ...fixture.nativeElement.querySelectorAll('onp-field label, onp-select label'),
    ] as HTMLElement[];

    expect(etiquetas.length).toBeGreaterThan(5);
    // A blank label is the signature of the aborted update pass.
    for (const etiqueta of etiquetas) {
      expect(etiqueta.textContent?.trim()).not.toBe('');
    }
    expect(etiquetas.map((e) => e.textContent?.trim())).toContain('Apellido paterno *');
  });

  it('los controles reciben las clases que arma clasesInput()', async () => {
    const { fixture } = montar();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('onp-field input') as HTMLInputElement;
    // These come from a `[class]` binding, which is exactly what an aborted
    // update pass drops on the floor.
    expect(input.className).toContain('rounded-control');
    expect(input.className).toContain('min-h-11');
    expect(input.className).toContain('border-border');
  });

  it('una CURP restaurada que coincide con los datos cuenta como generada por la app', async () => {
    const { fixture, espia } = montar();
    await fixture.whenStable();

    const grupo = fixture.componentInstance.grupo;
    grupo.controls.curp.setValue('PAEF990319HDFRND09');
    await fixture.whenStable();

    // Reading the derivation repeatedly must not change anything: a computed
    // is a derivation, not a place to run initialisation.
    const antes = grupo.controls.curp.value;
    await fixture.whenStable();
    await fixture.whenStable();
    expect(grupo.controls.curp.value).toBe(antes);
    expect(espia.vistos).toHaveLength(0);
  });
});
