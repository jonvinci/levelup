/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0B',
        card: '#121214',
        card2: '#18181B',
        well: '#0D0D0F',
        line: 'rgba(255,255,255,0.07)',
        line2: 'rgba(255,255,255,0.12)',
        gold: { DEFAULT: '#E8E1D5', light: '#F5F0E6', dark: '#C9C0B0' },
        flame: '#F97316',
        muted: '#8B8B94',
        dim: '#5B5B63',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: { '4xl': '28px' },
      boxShadow: {
        glow: '0 0 24px rgba(232,225,213,0.45)',
        'glow-lg': '0 0 48px rgba(232,225,213,0.55)',
      },
    },
  },
  plugins: [],
};
