import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * A block of legal text set off by a gold rule.
 *
 * The buró authorisation, the videograbación notice and the firma declaration
 * all render through this. **Never `text-transform`** — the declaratoria, the
 * aviso de privacidad and the términos render exactly as authored
 * (01-conventions.md §2), and `capitalize` is not a softer option.
 *
 * Set in Archivo, confirmed by the owner 2026-09-30 (§2): the 290 lines of
 * legal copy are body text, not headings.
 */
@Component({
  selector: 'onp-leyenda',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onp-leyenda.html',
  host: {
    class:
      'my-3 block border-l-4 border-gold bg-surface-muted p-3 text-label leading-relaxed text-text-soft',
  },
})
export class OnpLeyenda {}
