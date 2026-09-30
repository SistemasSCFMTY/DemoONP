import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * The ONP FER PrimeNG preset.
 *
 * Preset-first, per `01-conventions.md` §12: stock Aura plus this preset, built
 * from the §3 colour table and the §4 radius ladder. There is deliberately no
 * `theme/` override stylesheet for looks — if a PrimeNG component is the wrong
 * colour, the fix belongs here, in a design token, not in a CSS rule that wins
 * a specificity fight.
 *
 * The hex values below are the §3 table, restated. They are the one place in
 * this app where a hex literal is correct: PrimeNG's design-token engine emits
 * its own custom properties at runtime and cannot read Tailwind's `@theme`
 * block. If a token changes in §3, it changes here, in `src/styles.css`, and in
 * `web-app/src/styles.css` — in the same pull request (§12, duplication policy).
 */

/**
 * A navy ramp generated around `navy #1c3352` / `navy-deep #0e2036`.
 *
 * Aura addresses `primary.50 … primary.950`, so the two brand navies alone are
 * not enough — the steps between them are interpolated toward white so that
 * tints (a table highlight, a focus background) stay recognisably the same
 * hue instead of falling back to Aura's emerald.
 */
const NAVY = {
  50: '#f2f5f9',
  100: '#e0e7f0',
  200: '#c2cee0',
  300: '#95aac9',
  400: '#6480ab',
  500: '#3f5c8c',
  600: '#2a4571',
  700: '#1c3352', // navy (§3)
  800: '#152741',
  900: '#0e2036', // navy-deep (§3)
  950: '#081524',
} as const;

/**
 * The surface ramp. `0` is `surface #ffffff` and `100` is `bg #f6f4ef` — the
 * warm cream ground. That white-card-on-cream contrast *is* the visual system
 * (§3), so the ramp is warm all the way down rather than Aura's cool slate;
 * a grey ramp here would quietly repaint the panel in a different company's
 * colours.
 */
const CREMA = {
  0: '#ffffff',
  50: '#faf9f5',
  100: '#f6f4ef', // bg (§3)
  200: '#e8e4d9', // border (§3)
  300: '#d6d0c0',
  400: '#a9a294',
  500: '#7c7566',
  600: '#525a66', // text-soft (§3)
  700: '#3d434c',
  800: '#2a2e34',
  900: '#1a1c1f', // text (§3)
  950: '#0e0f11',
} as const;

export const ONP_PRESET = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: '4px',
      // §4: radius by what the element IS. `control 6px` for inputs, buttons,
      // alerts and status chips; `card 8px` for cards, dialogs and preview
      // boxes. Aura's md/lg are the two rungs its components actually reach
      // for, so they carry the ladder.
      md: '6px',
      lg: '8px',
      xl: '8px',
    },
  },
  semantic: {
    primary: NAVY,
    // §4: buttons and inputs are rounded rectangles, never pills.
    formField: {
      borderRadius: '{border.radius.md}',
      paddingX: '0.75rem',
      paddingY: '0.5rem',
    },
    focusRing: {
      // §9: a visible focus ring on everything focusable, matching the
      // `:focus-visible` rule in styles.css so keyboard focus looks the same
      // whether the control is PrimeNG's or ours.
      width: '2px',
      style: 'solid',
      color: '{primary.700}',
      offset: '2px',
      shadow: 'none',
    },
    colorScheme: {
      light: {
        surface: CREMA,
        primary: {
          color: '{primary.700}', // navy
          contrastColor: '#ffffff',
          hoverColor: '{primary.900}', // navy-deep
          activeColor: '{primary.950}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.900}',
          focusColor: '{primary.950}',
        },
        text: {
          color: '{surface.900}', // text
          hoverColor: '{surface.950}',
          mutedColor: '{surface.600}', // text-soft
          hoverMutedColor: '{surface.700}',
        },
        content: {
          background: '{surface.0}',
          hoverBackground: '{surface.50}',
          borderColor: '{surface.200}', // border — the hairline the app leans on
          color: '{text.color}',
          hoverColor: '{text.hover.color}',
        },
        formField: {
          background: '{surface.0}',
          borderColor: '{surface.200}',
          hoverBorderColor: '{surface.300}',
          focusBorderColor: '{primary.700}',
          color: '{surface.900}',
          placeholderColor: '{surface.500}',
          // §4: elevation encodes height. A form field sits in the flow, so it
          // gets the hairline and nothing more.
          shadow: 'none',
        },
        overlay: {
          modal: {
            background: '{surface.0}',
            borderColor: '{surface.200}',
            color: '{text.color}',
          },
          popover: {
            background: '{surface.0}',
            borderColor: '{surface.200}',
            color: '{text.color}',
          },
          select: {
            background: '{surface.0}',
            borderColor: '{surface.200}',
            color: '{text.color}',
          },
        },
      },
      // §3: light mode only. The source has no dark mode and a single-tenant
      // demo does not need one — an untested dark palette drifts. `darkModeSelector`
      // is switched off in app.config.ts so Aura's dark block never applies.
    },
  },
  components: {
    datatable: {
      headerCell: {
        background: '{surface.50}',
        color: '{surface.900}',
        borderColor: '{surface.200}',
      },
      bodyCell: {
        borderColor: '{surface.200}',
      },
      row: {
        background: '{surface.0}',
        hoverBackground: '{surface.50}',
        color: '{text.color}',
      },
    },
  },
});
