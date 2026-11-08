/**
 * Theme tokens — the single source of truth for all MCP semantic token values.
 *
 * Every key in McpUiStyleVariableKey must be present in both lightTokens and
 * darkTokens. The TypeScript compiler enforces this: if the SDK adds a new key,
 * the build breaks until both maps are updated.
 *
 * Values are applied to :root via style.setProperty() before first paint
 * (see renderer.tsx). main.css only registers the variable names for Tailwind
 * class generation — it does NOT define values.
 *
 * These tokens serve two purposes:
 *  1. Goose desktop — applied to :root per resolved theme.
 *  2. MCP apps — encoded as light-dark() in hostContext.styles.variables.
 */
import type {
  McpUiHostStyles,
  McpUiStyleVariableKey,
  McpUiStyles,
} from '@modelcontextprotocol/ext-apps/app-bridge';

type ThemeTokens = Record<McpUiStyleVariableKey, string>;

// Subset of keys that are the same across both themes.
type BaseTokenKey = Extract<
  McpUiStyleVariableKey,
  `--font-${string}` | `--border-radius-${string}` | `--border-width-${string}`
>;

type ColorTokenKey = Exclude<McpUiStyleVariableKey, BaseTokenKey>;

// ---------------------------------------------------------------------------
// Base tokens — shared across light and dark themes
// ---------------------------------------------------------------------------
const baseTokens: Pick<ThemeTokens, BaseTokenKey> = {
  // Typography — families
  '--font-sans': "'Montserrat', 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  '--font-mono': "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace",

  // Typography — weights
  '--font-weight-normal': '400',
  '--font-weight-medium': '500',
  '--font-weight-semibold': '600',
  '--font-weight-bold': '700',

  // Typography — text sizes
  '--font-text-xs-size': '0.75rem',
  '--font-text-sm-size': '0.875rem',
  '--font-text-md-size': '1rem',
  '--font-text-lg-size': '1.125rem',

  // Typography — heading sizes
  '--font-heading-xs-size': '1rem',
  '--font-heading-sm-size': '1.125rem',
  '--font-heading-md-size': '1.25rem',
  '--font-heading-lg-size': '1.5rem',
  '--font-heading-xl-size': '1.875rem',
  '--font-heading-2xl-size': '2.25rem',
  '--font-heading-3xl-size': '3rem',

  // Typography — text line heights
  '--font-text-xs-line-height': '1rem',
  '--font-text-sm-line-height': '1.25rem',
  '--font-text-md-line-height': '1.5rem',
  '--font-text-lg-line-height': '1.75rem',

  // Typography — heading line heights
  '--font-heading-xs-line-height': '1.5rem',
  '--font-heading-sm-line-height': '1.75rem',
  '--font-heading-md-line-height': '1.75rem',
  '--font-heading-lg-line-height': '2rem',
  '--font-heading-xl-line-height': '2.25rem',
  '--font-heading-2xl-line-height': '2.5rem',
  '--font-heading-3xl-line-height': '3.5rem',

  // Border radius
  '--border-radius-xs': '2px',
  '--border-radius-sm': '4px',
  '--border-radius-md': '8px',
  '--border-radius-lg': '12px',
  '--border-radius-xl': '16px',
  '--border-radius-full': '9999px',

  // Border width
  '--border-width-regular': '1px',
};

// Theme-specific color/shadow tokens only.
type ColorTokens = Pick<ThemeTokens, ColorTokenKey>;

// ---------------------------------------------------------------------------
// Light theme — colors & shadows
// The 10router cabinet palette: white cards on a pale blue-grey page, brand
// blue #2463F5 as the inverse surface (primary actions), ink #0B1220 text.
// Mirrors html.theme-user in the 10router cabinet redesign (DESIGN.md).
// ---------------------------------------------------------------------------
const lightColorTokens: ColorTokens = {
  // Backgrounds
  '--color-background-primary': '#ffffff',
  '--color-background-secondary': '#f6f7f9',
  '--color-background-tertiary': '#edeff2',
  '--color-background-inverse': '#2463f5',
  '--color-background-ghost': 'transparent',
  '--color-background-info': '#2463f5',
  '--color-background-danger': '#db2424',
  '--color-background-success': '#059669',
  '--color-background-warning': '#d97706',
  '--color-background-disabled': '#e1e6ee',

  // Text
  '--color-text-primary': '#0b1220',
  '--color-text-secondary': '#666d7a',
  '--color-text-tertiary': '#98a2b3',
  '--color-text-inverse': '#ffffff',
  '--color-text-ghost': '#666d7a',
  '--color-text-info': '#2463f5',
  '--color-text-danger': '#db2424',
  '--color-text-success': '#059669',
  '--color-text-warning': '#b45309',
  '--color-text-disabled': '#a6adbd',

  // Borders
  '--color-border-primary': '#e1e6ee',
  '--color-border-secondary': '#e1e6ee',
  '--color-border-tertiary': '#d6dae0',
  '--color-border-inverse': '#2463f5',
  '--color-border-ghost': 'transparent',
  '--color-border-info': '#2463f5',
  '--color-border-danger': '#db2424',
  '--color-border-success': '#059669',
  '--color-border-warning': '#d97706',
  '--color-border-disabled': '#e1e6ee',

  // Rings
  '--color-ring-primary': '#2463f5',
  '--color-ring-secondary': '#d6dae0',
  '--color-ring-inverse': '#ffffff',
  '--color-ring-info': '#2463f5',
  '--color-ring-danger': '#db2424',
  '--color-ring-success': '#059669',
  '--color-ring-warning': '#d97706',

  // Shadows — the cabinet's crisp hairline style, no floating blocks
  '--shadow-hairline': '0 0 0 1px rgba(16, 24, 40, 0.06)',
  '--shadow-sm': '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
  '--shadow-md': '0 2px 6px -1px rgba(16, 24, 40, 0.07), 0 1px 2px -1px rgba(16, 24, 40, 0.04)',
  '--shadow-lg': '0 10px 24px -6px rgba(16, 24, 40, 0.1), 0 2px 6px -2px rgba(16, 24, 40, 0.05)',
};

// ---------------------------------------------------------------------------
// Dark theme — colors & shadows
// The cabinet's dark twin: ink-blue page #0E1016, #161A22 cards, a lighter
// brand blue #4A7EF7 for actions and rings (html.theme-user.dark).
// ---------------------------------------------------------------------------
const darkColorTokens: ColorTokens = {
  // Backgrounds
  '--color-background-primary': '#161a22',
  '--color-background-secondary': '#0e1016',
  '--color-background-tertiary': '#22262f',
  '--color-background-inverse': '#4a7ef7',
  '--color-background-ghost': 'transparent',
  '--color-background-info': '#4a7ef7',
  '--color-background-danger': '#e64c4c',
  '--color-background-success': '#34d399',
  '--color-background-warning': '#fbbf24',
  '--color-background-disabled': '#22262f',

  // Text
  '--color-text-primary': '#edeff3',
  '--color-text-secondary': '#9aa0ac',
  '--color-text-tertiary': '#737d90',
  '--color-text-inverse': '#ffffff',
  '--color-text-ghost': '#9aa0ac',
  '--color-text-info': '#4a7ef7',
  '--color-text-danger': '#e64c4c',
  '--color-text-success': '#34d399',
  '--color-text-warning': '#fbbf24',
  '--color-text-disabled': '#4a5266',

  // Borders
  '--color-border-primary': '#292d38',
  '--color-border-secondary': '#292d38',
  '--color-border-tertiary': '#373c49',
  '--color-border-inverse': '#4a7ef7',
  '--color-border-ghost': 'transparent',
  '--color-border-info': '#4a7ef7',
  '--color-border-danger': '#e64c4c',
  '--color-border-success': '#34d399',
  '--color-border-warning': '#fbbf24',
  '--color-border-disabled': '#292d38',

  // Rings
  '--color-ring-primary': '#4a7ef7',
  '--color-ring-secondary': '#373c49',
  '--color-ring-inverse': '#ffffff',
  '--color-ring-info': '#4a7ef7',
  '--color-ring-danger': '#e64c4c',
  '--color-ring-success': '#34d399',
  '--color-ring-warning': '#fbbf24',

  // Shadows (deeper ink, no colored glow)
  '--shadow-hairline': '0 0 0 1px rgba(0, 0, 0, 0.3)',
  '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  '--shadow-md': '0 2px 6px -1px rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
  '--shadow-lg': '0 10px 24px -6px rgba(0, 0, 0, 0.5), 0 2px 6px -2px rgba(0, 0, 0, 0.35)',
};

// ---------------------------------------------------------------------------
// Aura theme — colors & shadows (dark variant)
// Ported from OpenChamber's Aura preset: purple-black surfaces, purple accent,
// mint/peach/cyan/coral status colors, monospace typography.
// ---------------------------------------------------------------------------
const auraColorTokens: ColorTokens = {
  // Backgrounds
  '--color-background-primary': '#15141b',
  '--color-background-secondary': '#1a1921',
  '--color-background-tertiary': '#201e2b',
  '--color-background-inverse': '#a277ff',
  '--color-background-ghost': 'transparent',
  '--color-background-info': '#82e2ff',
  '--color-background-danger': '#ff6767',
  '--color-background-success': '#61ffca',
  '--color-background-warning': '#ffca85',
  '--color-background-disabled': '#25232f',

  // Text
  '--color-text-primary': '#edecee',
  '--color-text-secondary': '#8a8282',
  '--color-text-tertiary': '#6d6d6d',
  '--color-text-inverse': '#15141b',
  '--color-text-ghost': '#8a8282',
  '--color-text-info': '#82e2ff',
  '--color-text-danger': '#ff6767',
  '--color-text-success': '#61ffca',
  '--color-text-warning': '#ffca85',
  '--color-text-disabled': '#525b68',

  // Borders
  '--color-border-primary': '#2d2b38',
  '--color-border-secondary': '#47415a',
  '--color-border-tertiary': '#4e496c',
  '--color-border-inverse': '#edecee',
  '--color-border-ghost': 'transparent',
  '--color-border-info': '#82e2ff',
  '--color-border-danger': '#ff6767',
  '--color-border-success': '#61ffca',
  '--color-border-warning': '#ffca85',
  '--color-border-disabled': '#2d2b38',

  // Rings
  '--color-ring-primary': '#47415a',
  '--color-ring-secondary': '#2d2b38',
  '--color-ring-inverse': '#15141b',
  '--color-ring-info': '#82e2ff',
  '--color-ring-danger': '#ff6767',
  '--color-ring-success': '#61ffca',
  '--color-ring-warning': '#ffca85',

  // Shadows (dark)
  '--shadow-hairline': '0 0 0 1px rgba(0, 0, 0, 0.2)',
  '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
  '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
  '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
};

// Aura is monospace-first — override the shared sans family.
const auraFontTokens: Partial<Pick<ThemeTokens, BaseTokenKey>> = {
  '--font-sans': 'ui-monospace, "SFMono-Regular", "Menlo", "Cascadia Mono", "Segoe UI Mono", monospace',
  '--font-mono': 'ui-monospace, "SFMono-Regular", "Menlo", "Cascadia Mono", "Segoe UI Mono", monospace',
};

// ---------------------------------------------------------------------------
// Merged token maps — used by applyThemeTokens() and buildMcpHostStyles()
// ---------------------------------------------------------------------------
export const lightTokens: ThemeTokens = { ...baseTokens, ...lightColorTokens };
export const darkTokens: ThemeTokens = { ...baseTokens, ...darkColorTokens };
export const auraTokens: ThemeTokens = { ...baseTokens, ...auraFontTokens, ...auraColorTokens };

// ---------------------------------------------------------------------------
// Theme registry — the set of selectable named themes.
// `variant` drives the .dark/.light class and colorScheme for anything outside
// the token system; `tokens` is the map applied to :root. Adding a future theme
// is a single entry here plus its token map above.
// ---------------------------------------------------------------------------
export type ThemeId = 'light' | 'dark' | 'aura';
export type ThemeVariant = 'light' | 'dark';

interface ThemeDefinition {
  variant: ThemeVariant;
  tokens: ThemeTokens;
}

export const themes: Record<ThemeId, ThemeDefinition> = {
  light: { variant: 'light', tokens: lightTokens },
  dark: { variant: 'dark', tokens: darkTokens },
  aura: { variant: 'dark', tokens: auraTokens },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// @font-face rules passed to MCP apps so sandboxed iframes can load host fonts.
const HOST_FONT_CSS = `
@font-face { font-family: 'IBM Plex Mono'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/ibmplexmono/v20/-F63fjptAgt5VM-kVkqdyU8n1isq131nj-otFQ.woff2) format('woff2'); unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'IBM Plex Mono'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/ibmplexmono/v20/-F63fjptAgt5VM-kVkqdyU8n1i8q131nj-o.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'IBM Plex Mono'; font-style: normal; font-weight: 500; font-display: swap; src: url(https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3twJwlRFgsAXHNlYzg.woff2) format('woff2'); unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'IBM Plex Mono'; font-style: normal; font-weight: 500; font-display: swap; src: url(https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3twJwlBFgsAXHNk.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'IBM Plex Sans'; font-style: normal; font-weight: 400; font-stretch: 100%; font-display: swap; src: url(https://fonts.gstatic.com/s/ibmplexsans/v23/zYXzKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1syxaKYbSB4ZhRNU.woff2) format('woff2'); unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'IBM Plex Sans'; font-style: normal; font-weight: 400; font-stretch: 100%; font-display: swap; src: url(https://fonts.gstatic.com/s/ibmplexsans/v23/zYXzKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1syxeKYbSB4Zh.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'IBM Plex Sans'; font-style: normal; font-weight: 500; font-stretch: 100%; font-display: swap; src: url(https://fonts.gstatic.com/s/ibmplexsans/v23/zYXzKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1syxaKYbSB4ZhRNU.woff2) format('woff2'); unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'IBM Plex Sans'; font-style: normal; font-weight: 500; font-stretch: 100%; font-display: swap; src: url(https://fonts.gstatic.com/s/ibmplexsans/v23/zYXzKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1syxeKYbSB4Zh.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'IBM Plex Sans'; font-style: normal; font-weight: 600; font-stretch: 100%; font-display: swap; src: url(https://fonts.gstatic.com/s/ibmplexsans/v23/zYXzKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1syxaKYbSB4ZhRNU.woff2) format('woff2'); unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'IBM Plex Sans'; font-style: normal; font-weight: 600; font-stretch: 100%; font-display: swap; src: url(https://fonts.gstatic.com/s/ibmplexsans/v23/zYXzKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1syxeKYbSB4Zh.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'Montserrat'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459W1hyyTh89ZNpQ.woff2) format('woff2'); unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'Montserrat'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'Montserrat'; font-style: normal; font-weight: 500; font-display: swap; src: url(https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459W1hyyTh89ZNpQ.woff2) format('woff2'); unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'Montserrat'; font-style: normal; font-weight: 500; font-display: swap; src: url(https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'Montserrat'; font-style: normal; font-weight: 600; font-display: swap; src: url(https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459W1hyyTh89ZNpQ.woff2) format('woff2'); unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'Montserrat'; font-style: normal; font-weight: 600; font-display: swap; src: url(https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'Montserrat'; font-style: normal; font-weight: 700; font-display: swap; src: url(https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459W1hyyTh89ZNpQ.woff2) format('woff2'); unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'Montserrat'; font-style: normal; font-weight: 700; font-display: swap; src: url(https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'Montserrat'; font-style: normal; font-weight: 800; font-display: swap; src: url(https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459W1hyyTh89ZNpQ.woff2) format('woff2'); unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'Montserrat'; font-style: normal; font-weight: 800; font-display: swap; src: url(https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
`.trim();

/**
 * Build the McpUiHostStyles object for MCP apps.
 *
 * For the built-in light/dark pair, color keys use light-dark() so a single
 * payload resolves correctly against the guest's color-scheme. Custom themes
 * (e.g. aura) share a variant with dark but carry their own palette and fonts,
 * so light-dark() can't express them — emit that theme's concrete token values
 * instead. Non-color keys always use the theme's own values so overrides like
 * Aura's monospace font family reach the guest.
 * css.fonts provides @font-face rules so sandboxed apps can load host fonts.
 */
export function buildMcpHostStyles(themeId: ThemeId = 'light'): McpUiHostStyles {
  const tokens = (themes[themeId] ?? themes.light).tokens;
  const isBuiltinVariant = themeId === 'light' || themeId === 'dark';
  const variables: McpUiStyles = {} as McpUiStyles;
  for (const key of Object.keys(lightTokens) as McpUiStyleVariableKey[]) {
    if (key.startsWith('--color-') && isBuiltinVariant) {
      variables[key] = `light-dark(${lightTokens[key]}, ${darkTokens[key]})`;
    } else {
      variables[key] = tokens[key];
    }
  }
  return { variables, css: { fonts: HOST_FONT_CSS } };
}

/**
 * Resolve the current theme id from localStorage / system preference.
 * Best-effort pre-paint resolution; the authoritative preference lives in the
 * Electron settings store and is applied by ThemeContext once loaded.
 */
export function getResolvedTheme(): ThemeId {
  const useSystem = localStorage.getItem('use_system_theme') !== 'false';
  if (useSystem) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  const stored = localStorage.getItem('theme');
  if (stored === 'aura') return 'aura';
  return stored === 'dark' ? 'dark' : 'light';
}

/**
 * Apply a theme's tokens to the document root as CSS custom properties.
 * When called without an argument, resolves the theme from localStorage.
 */
export function applyThemeTokens(theme?: ThemeId): void {
  const resolved = theme ?? getResolvedTheme();
  const { tokens } = themes[resolved] ?? themes.light;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
}
