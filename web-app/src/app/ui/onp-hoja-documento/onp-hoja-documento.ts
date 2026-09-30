import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The rendered solicitud, as a sheet of paper.
 *
 * Its content is HTML the app itself produced from `PLANTILLA_BASE`, with
 * every prospect-supplied value escaped by `llenarPlantilla`. It is bound
 * with `innerHTML`, which Angular sanitises again — belt and braces on the
 * one surface in this app that renders generated markup.
 *
 * The styles live here rather than in `styles.css` because they describe a
 * document, not the app: serif headings, ruled tables, a signature block.
 * `html2pdf` renders this element, so what is on screen is what is in the
 * PDF.
 */
@Component({
  selector: 'onp-hoja-documento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="hoja" [innerHTML]="contenido()"></div>`,
  styles: `
    :host {
      display: block;
    }

    .hoja {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      padding: 18px 16px;
      font-size: 11px;
      line-height: 1.65;
      color: var(--color-text);
    }

    .hoja ::ng-deep h1 {
      font-family: var(--font-heading);
      font-size: 15px;
      font-weight: 700;
      text-align: center;
      color: var(--color-navy-deep);
      margin: 0 0 4px 0;
    }

    .hoja ::ng-deep h2 {
      font-family: var(--font-heading);
      font-size: 13px;
      font-weight: 700;
      color: var(--color-navy-deep);
      margin: 16px 0 7px 0;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 3px;
    }

    .hoja ::ng-deep p {
      margin: 0 0 8px 0;
    }

    .hoja ::ng-deep .c {
      text-align: center;
    }

    .hoja ::ng-deep .j {
      text-align: justify;
    }

    .hoja ::ng-deep table {
      width: 100%;
      border-collapse: collapse;
      margin: 0 0 8px 0;
    }

    .hoja ::ng-deep td {
      border: 1px solid var(--color-border);
      padding: 5px 7px;
      vertical-align: top;
      word-break: break-word;
    }

    .hoja ::ng-deep .firma-zona {
      margin-top: 26px;
      text-align: center;
    }

    .hoja ::ng-deep .firma-zona img {
      max-width: 220px;
      display: block;
      margin: 0 auto 4px;
    }

    .hoja ::ng-deep .firma-zona .linea {
      border-top: 1px solid var(--color-text);
      display: inline-block;
      padding-top: 5px;
      min-width: 220px;
      font-size: 10px;
    }
  `,
})
export class OnpHojaDocumento {
  readonly contenido = input.required<string>();
}
