import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * A long legal document: the aviso de privacidad, the términos.
 *
 * Its whole job is to make several screens of prose readable on a 390px
 * viewport, which means line-height and spacing between headings, nothing
 * else. **No `text-transform` anywhere in here** — legal text renders exactly
 * as authored (01-conventions.md §2).
 *
 * The headings inside are Charis SIL like every other heading; the body is
 * Archivo, confirmed by the owner 2026-09-30 (§2).
 */
@Component({
  selector: 'onp-documento-legal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onp-documento-legal.html',
  styles: `
    :host {
      display: block;
      font-size: var(--text-label);
      line-height: 1.7;
      color: var(--color-text-soft);
    }

    :host ::ng-deep h2 {
      font-size: var(--text-h3);
      font-weight: 700;
      margin: 20px 0 7px 0;
      color: var(--color-navy-deep);
    }

    :host ::ng-deep h2:first-child {
      margin-top: 0;
    }

    :host ::ng-deep p {
      margin: 0 0 10px 0;
    }

    :host ::ng-deep ul {
      margin: 0 0 10px 0;
      padding-left: 18px;
      list-style: disc;
    }

    :host ::ng-deep li {
      margin-bottom: 4px;
    }

    :host ::ng-deep b {
      color: var(--color-text);
      font-weight: 600;
    }

    :host ::ng-deep .fecha {
      font-size: var(--text-status);
      color: var(--color-text-soft);
      margin-bottom: 14px;
    }
  `,
})
export class OnpDocumentoLegal {}
