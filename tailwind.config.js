module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#006d77',
        secondary: '#83c5be',
        background: '#edf6f9',
      },
      keyframes: {
        modal: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' }
        }
      },
    },
    animation: {
      modal: 'modal 0.2s ease-out'
    }
  },
  plugins: [],
}