/** A `<select>` option. `valor` is what travels on the wire, `texto` what the
 *  prospect reads — both ported verbatim from the source's markup. */
export interface Opcion {
  readonly valor: string;
  readonly texto: string;
}
