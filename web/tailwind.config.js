/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface-container': '#eaeff1',
        'secondary-fixed': '#e0e1f2',
        'tertiary-fixed-dim': '#c4cbe9',
        'inverse-surface': '#0c0f10',
        'surface-container-high': '#e3e9ec',
        'surface-container-highest': '#dbe4e7',
        'on-tertiary-fixed': '#323951',
        'inverse-primary': '#e3dffd',
        'outline-variant': '#abb3b7',
        'secondary-container': '#e0e1f2',
        primary: '#5e5c75',
        'primary-dim': '#525068',
        'primary-fixed': '#e3dffd',
        'primary-fixed-dim': '#d5d1ee',
        'primary-container': '#e3dffd',
        'surface-bright': '#f8f9fa',
        'on-primary': '#faf6ff',
        'on-primary-fixed': '#3e3d54',
        'on-primary-fixed-variant': '#5b5972',
        'on-primary-container': '#514f67',
        'on-surface-variant': '#586064',
        'on-surface': '#2b3437',
        error: '#9e3f4e',
        'error-dim': '#4f0116',
        'error-container': '#ff8b9a',
        'on-error': '#fff7f7',
        'on-error-container': '#782232',
        'surface-container-lowest': '#ffffff',
        outline: '#737c7f',
        'surface-container-low': '#f1f4f6',
        background: '#f8f9fa',
        'on-background': '#2b3437',
        surface: '#f8f9fa',
        'surface-dim': '#d1dce0',
        'surface-variant': '#dbe4e7',
        'surface-tint': '#5e5c75',
        'inverse-on-surface': '#9b9d9e',
        tertiary: '#575e78',
        'tertiary-dim': '#4b526c',
        'tertiary-container': '#d2d9f8',
        'tertiary-fixed': '#d2d9f8',
        'on-tertiary': '#faf8ff',
        'on-tertiary-container': '#444c65',
        'on-tertiary-fixed-variant': '#4e556f',
        secondary: '#5b5e6c',
        'secondary-dim': '#4f5360',
        'secondary-fixed-dim': '#d1d3e4',
        'on-secondary': '#faf8ff',
        'on-secondary-container': '#4e515f',
        'on-secondary-fixed': '#3c3f4c',
        'on-secondary-fixed-variant': '#585b69',

        // === Editorial tokens (v2 — a16z/Stripe Press/Bloomberg style) ===

        // Ink: primary CTA, active, headings
        'ed-ink':            '#1A1A2E',
        'ed-ink-hover':      '#2A2A42',

        // Text hierarchy
        'ed-text-primary':   '#1A1A2E',
        'ed-text-secondary': '#52525B',
        'ed-text-muted':     '#78716C',
        'ed-text-faint':     '#A8A29E',

        // Surface
        'ed-canvas':         '#FAFAF9',
        'ed-surface':        '#FFFFFF',
        'ed-surface-cool':   '#F4F5F7',
        'ed-surface-sunken': '#F5F4F1',

        // Hairlines (dividers)
        'ed-hairline':       '#E7E5E4',
        'ed-hairline-faint': '#F0EFEC',

        // Semantic: only one colour kept
        'ed-incident':       '#B91C1C',

        // --- deprecated (kept to avoid build errors, do not use in new components) ---
        'ed-accent':         '#5E5C75',
        'ed-accent-hover':   '#4E4C65',
        'ed-surface-hover':  '#F5F5F4',
        'ed-divider-faint':  '#F0EFEC',
        'ed-divider':        '#E7E5E4',
        'ed-divider-strong': '#D6D3D1',
        'ed-type-policy':      '#B45309',
        'ed-type-institution': '#6D28D9',
        'ed-type-project':     '#047857',
        'ed-type-research':    '#1D4ED8',
        'ed-type-data':        '#475569',
        'ed-type-incident':    '#B91C1C',
        'ed-type-regulatory':  '#B45309',
        'ed-chip-bg':   '#F5F4F1',
        'ed-chip-text': '#44403C',
        'ed-info-bg':      '#F0F4FF',
        'ed-info-text':    '#1E3A8A',
        'ed-warn-bg':      '#FEFAEB',
        'ed-warn-text':    '#854D0E',
        'ed-success-bg':   '#F0FDF4',
        'ed-success-text': '#166534',
        'ed-hk-bg':     '#EFF6FB',
        'ed-hk-border': '#D6E4EE',
        'ed-hk-text':   '#0C447C',
      },
      fontFamily: {
        sans:     ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        headline: ['Inter', 'system-ui', 'sans-serif'],
        body:     ['Inter', 'system-ui', 'sans-serif'],
        label:    ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'ed-hero':          '6rem',    // 96px  hero padding
        'ed-section':       '8rem',    // 128px between top-level sections
        'ed-section-lg':    '4rem',    // 64px  major sub-blocks
        'ed-section-md':    '2.5rem',  // 40px  secondary blocks
        'ed-section-sm':    '1.5rem',  // 24px  compact blocks
        'ed-block':         '2.5rem',  // 40px  (alias kept)
        'ed-item':          '1.5rem',  // 24px
        // deprecated aliases
        'ed-sub':           '1.5rem',
      },
      boxShadow: {
        'ed-card':       '0 1px 2px rgba(15, 15, 25, 0.04), 0 0 0 1px rgba(15, 15, 25, 0.03)',
        'ed-card-hover': '0 4px 12px rgba(15, 15, 25, 0.06), 0 0 0 1px rgba(15, 15, 25, 0.04)',
        'ed-inset':      'inset 0 1px 0 rgba(15, 15, 25, 0.02)',
      },
      fontSize: {
        // v2 editorial scale
        'ed-hero-h1':    ['4rem',      { lineHeight: '4.4rem',   letterSpacing: '-0.03em',  fontWeight: '600' }],
        'ed-lede':       ['1.375rem',  { lineHeight: '2rem',     letterSpacing: '-0.005em', fontWeight: '400' }],
        'ed-section-h2':       ['2.625rem',  { lineHeight: '3rem',     letterSpacing: '-0.025em', fontWeight: '600' }],
        'ed-section-h2-light': ['2.625rem',  { lineHeight: '3rem',     letterSpacing: '-0.025em', fontWeight: '400' }],
        'ed-block-h3':         ['1.5rem',    { lineHeight: '1.875rem', letterSpacing: '-0.015em', fontWeight: '600' }],
        'ed-item-h4':    ['1.0625rem', { lineHeight: '1.5rem',   letterSpacing: '-0.005em', fontWeight: '500' }],
        'ed-body-lg':    ['1.125rem',  { lineHeight: '1.875rem', fontWeight: '400' }],
        'ed-body':       ['0.9375rem', { lineHeight: '1.625rem', fontWeight: '400' }],
        'ed-meta':       ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '400', fontVariantNumeric: 'tabular-nums' }],
        'ed-eyebrow':    ['0.6875rem', { lineHeight: '1rem',     letterSpacing: '0.18em',   fontWeight: '500' }],
        // Intelligence page hero
        'ed-page-h1':    ['5rem',      { lineHeight: '1.05',     letterSpacing: '-0.025em', fontWeight: '600' }],
      },
      borderRadius: {
        DEFAULT: '0px',
        lg: '0px',
        xl: '0px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
