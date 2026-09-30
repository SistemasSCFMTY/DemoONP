import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { OnpField } from '../onp-field/onp-field';
import { OnpSelect } from '../onp-select/onp-select';

/**
 * `onp-fila` aligns its two fields by making each one a subgrid spanning
 * three rows — label, control, messages. That only works while a field
 * renders **exactly three top-level children**.
 *
 * It is an easy thing to break by accident: wrapping the template in a
 * `<div class="mb-4">` for spacing, or letting the error and help messages
 * be separate top-level siblings, both look harmless and both silently
 * misalign every paired row instead of failing. Hence these tests, which
 * assert the structure rather than the appearance.
 */
@Component({
  imports: [OnpField],
  template: `
    <onp-field idCampo="x" etiqueta="Código postal" [control]="control" [ayuda]="ayuda" />
  `,
})
class AnfitrionCampo {
  control = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  ayuda = '';
}

@Component({
  imports: [OnpSelect],
  template: `
    <onp-select idCampo="y" etiqueta="Género" [opciones]="opciones" [control]="control" />
  `,
})
class AnfitrionSelect {
  control = new FormControl('', { nonNullable: true });
  opciones = [{ valor: 'H', texto: 'Masculino' }];
}

describe('la estructura de la que depende onp-fila', () => {
  it('onp-field expone tres hijos: etiqueta, control y mensajes', async () => {
    const fixture = TestBed.createComponent(AnfitrionCampo);
    await fixture.whenStable();

    const campo = fixture.nativeElement.querySelector('onp-field') as HTMLElement;
    expect(campo.children).toHaveLength(3);
    expect(campo.children[0].tagName).toBe('LABEL');
    expect(campo.children[1].tagName).toBe('INPUT');
  });

  it('sigue siendo tres hijos con ayuda y con error visibles', async () => {
    const fixture = TestBed.createComponent(AnfitrionCampo);
    fixture.componentInstance.ayuda = 'Cinco dígitos.';
    fixture.componentInstance.control.markAsTouched();
    fixture.componentInstance.control.updateValueAndValidity();
    await fixture.whenStable();

    const campo = fixture.nativeElement.querySelector('onp-field') as HTMLElement;
    // Both messages live inside the third child, not beside it.
    expect(campo.children).toHaveLength(3);
    expect(campo.children[2].querySelectorAll('p').length).toBeGreaterThan(1);
  });

  it('onp-select expone la misma estructura de tres hijos', async () => {
    const fixture = TestBed.createComponent(AnfitrionSelect);
    await fixture.whenStable();

    const campo = fixture.nativeElement.querySelector('onp-select') as HTMLElement;
    expect(campo.children).toHaveLength(3);
    expect(campo.children[0].tagName).toBe('LABEL');
    expect(campo.children[1].tagName).toBe('SELECT');
  });

  it('el control es el segundo hijo en ambos, para que caigan en la misma banda', async () => {
    const campo = TestBed.createComponent(AnfitrionCampo);
    const select = TestBed.createComponent(AnfitrionSelect);
    await campo.whenStable();
    await select.whenStable();

    const indiceControl = (host: HTMLElement) =>
      [...host.children].findIndex((c) => ['INPUT', 'SELECT'].includes(c.tagName));

    expect(indiceControl(campo.nativeElement.querySelector('onp-field'))).toBe(1);
    expect(indiceControl(select.nativeElement.querySelector('onp-select'))).toBe(1);
  });
});
