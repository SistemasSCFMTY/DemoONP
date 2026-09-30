import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BRAND } from '../../brand.config';
import { NavegacionService } from '../../core/navegacion-service';
import { OnpAlert } from '../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../ui/onp-button/onp-button';
import { OnpDocumentoLegal } from '../../ui/onp-documento-legal/onp-documento-legal';
import { OnpTitulo } from '../../ui/onp-titulo/onp-titulo';

/**
 * Aviso de Privacidad. Screen 3 (onp_fer_etapa2_pf.html:343).
 *
 * Ported verbatim, including the machote warning at the top — this text has
 * not been through legal review and the screen says so. Do not "improve" the
 * legal copy (01-conventions.md §11), and never `text-transform` it (§2).
 *
 * The razón social and domicilio come from `brand.config`, as
 * `pintarDatosSofom` painted them into `priv_razon` / `priv_domicilio`
 * (`:2205`).
 */
@Component({
  selector: 'onp-privacidad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OnpTitulo, OnpAlert, OnpButton, OnpDocumentoLegal],
  template: `
    <onp-titulo texto="Aviso de Privacidad" lede="Integral y simplificado" />

    <onp-alert tono="warning">
      <strong>Texto de ejemplo.</strong> Este contenido es un machote y debe ser revisado y
      sustituido por el área jurídica antes de operar con clientes reales.
    </onp-alert>

    <onp-documento-legal>
      <p class="fecha">Última actualización: [FECHA]</p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        <b>{{ marca.razonSocial }}</b
        >, con domicilio en {{ marca.domicilio }}, es responsable del tratamiento de tus datos
        personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los
        Particulares.
      </p>

      <h2>2. Datos que recabamos</h2>
      <p>Para la prestación de nuestros servicios recabamos las siguientes categorías de datos:</p>
      <ul>
        <li>
          <b>De identificación:</b> nombre, fecha y lugar de nacimiento, género, nacionalidad, CURP,
          RFC, firma.
        </li>
        <li><b>De contacto:</b> domicilio, teléfono, correo electrónico.</li>
        <li>
          <b>Patrimoniales y financieros:</b> ocupación, ingresos, historial crediticio, cuenta
          bancaria.
        </li>
        <li><b>Biométricos:</b> imagen del rostro, huella dactilar, voz y videograbación.</li>
        <li><b>De geolocalización:</b> ubicación al momento de la solicitud.</li>
      </ul>

      <h2>3. Datos sensibles</h2>
      <p>
        Los datos biométricos son considerados datos personales sensibles. Su tratamiento requiere
        tu consentimiento expreso, el cual otorgas al continuar con el proceso de identificación y
        al aceptar las autorizaciones que se te presentan durante la solicitud.
      </p>

      <h2>4. Finalidades</h2>
      <p>Finalidades necesarias para la relación jurídica:</p>
      <ul>
        <li>
          Verificar tu identidad conforme a las Disposiciones de Carácter General aplicables.
        </li>
        <li>Evaluar tu solicitud de crédito y determinar tu capacidad de pago.</li>
        <li>Formalizar, administrar y dar seguimiento al crédito.</li>
        <li>Cumplir obligaciones en materia de prevención de lavado de dinero.</li>
        <li>Atender requerimientos de autoridades competentes.</li>
      </ul>
      <p>Finalidades adicionales, que puedes rechazar sin que ello afecte tu solicitud:</p>
      <ul>
        <li>Ofrecerte productos y servicios.</li>
        <li>Realizar encuestas de calidad.</li>
      </ul>

      <h2>5. Transferencias</h2>
      <p>
        Tus datos pueden ser transferidos a sociedades de información crediticia, autoridades
        competentes y proveedores que nos auxilien en la verificación de identidad. Las
        transferencias previstas en el artículo 37 de la Ley no requieren tu consentimiento.
      </p>

      <h2>6. Conservación</h2>
      <p>
        Conservamos tu información por el tiempo que exija la normativa aplicable. Tratándose de
        expedientes de identificación y videograbaciones, el plazo mínimo es de diez años contados a
        partir de la terminación de la relación contractual.
      </p>

      <h2>7. Derechos ARCO</h2>
      <p>
        Puedes solicitar el Acceso, Rectificación, Cancelación u Oposición al tratamiento de tus
        datos, así como revocar tu consentimiento, mediante escrito dirigido a nuestro Departamento
        de Datos Personales a través de los medios indicados en la sección de Contacto.
      </p>

      <h2>8. Cambios al aviso</h2>
      <p>
        Cualquier modificación será puesta a tu disposición a través de esta aplicación y de nuestro
        sitio web.
      </p>
    </onp-documento-legal>

    <onp-button variante="secondary" (pulsar)="volver()">Volver</onp-button>
  `,
})
export class Privacidad {
  protected readonly marca = BRAND;
  private readonly navegacion = inject(NavegacionService);

  protected volver(): void {
    void this.navegacion.regresar();
  }
}
