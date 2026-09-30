import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { PRODUCTO_PREDETERMINADO } from '../../model/constants/producto/producto-predeterminado';
import type { Producto } from '../../model/interfaces/producto';
import { ApiBase, conRespaldo } from './api-base';

/** `GET /producto` — the simulator parameters (02-api-contract.md). */
@Injectable({ providedIn: 'root' })
export class ProductoHttp extends ApiBase {
  obtener(): Observable<Producto> {
    return this.get<Producto>('/producto').pipe(conRespaldo(() => PRODUCTO_PREDETERMINADO));
  }
}
