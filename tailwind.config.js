/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        '3xl': '1760px',
        '4xl': '1920px',
      },
    },
    extend: {
      colors: {
        // tokens (usa CSS vars para permitir theming fácil)
        background: 'var(--bg, #ffffff)',
        foreground: 'var(--fg, #0f172a)',
        primary: 'var(--primary, #4f46e5)',
        secondary: 'var(--secondary, #0ea5e9)',
        accent: 'var(--accent, #10b981)',
        border: 'var(--border, #e5e7eb)',
        ring: 'var(--ring, #6366f1)',
        muted: 'var(--muted, #f5f7fb)',
      },
      borderRadius: { lg: '14px', xl: '18px', '2xl': '22px' },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(0,0,0,0.22)',
        brand: '0 8px 24px -8px rgba(79,70,229,0.32)',
        focus: '0 0 0 3px rgba(99,102,241,0.35)',
      },
      fontSize: {
        'responsive-title': ['clamp(1.25rem, 1rem + 1.2vw, 2.25rem)', { lineHeight: '1.1' }],
      },
      screens: {
        '3xl': '1760px',
        '4xl': '1920px',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'slide-up': { from: { transform: 'translateY(8px)' }, to: { transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in .25s ease-out both',
        'slide-up': 'slide-up .2s ease-out both',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
    // scrollbar leve
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-thin': { 'scrollbar-width': 'thin' },
        '.scrollbar': {
          '&::-webkit-scrollbar': { height: '8px', width: '8px' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,.25)', borderRadius: '9999px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
        },
      })
    },
  ],
}
