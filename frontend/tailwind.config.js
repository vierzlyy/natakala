/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F8F6F2',
        surface: '#EDEAE5',
        line: '#D6D3CE',
        text: '#2B2B2B',
        muted: '#6B6B6B',
        danger: '#FF6B6B',
        primary: '#4D96FF',
        warning: '#FFD93D',
        success: '#6BCB77',
        ink: '#1E1E1E',
      },
      boxShadow: {
        panel: '0 18px 35px rgba(43, 43, 43, 0.08)',
      },
      backgroundImage: {
        'soft-grid':
          'radial-gradient(circle at 1px 1px, rgba(43, 43, 43, 0.04) 1px, transparent 0)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
