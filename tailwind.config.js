// Misma paleta y tipografías que definía el runtime de Tailwind en el HTML.
module.exports = {
  content: ['./LaRutadelTannat.html', './LaRutadelTannat_files/*.js'],
  theme: {
    extend: {
      colors: {
        tannat: { DEFAULT: '#4A1525', dark: '#2E0B16', light: '#722F37', 50: '#FAF5F6', 100: '#F4EBED', 900: '#1D060D' },
        gold: { DEFAULT: '#C5A059', light: '#DFCA9D', dark: '#83692F', 50: '#FCF9F2' },
        terroir: { DEFAULT: '#5A4D41', light: '#8E7F72', dark: '#3A3027' },
        basalt: { DEFAULT: '#242424', surface: '#181818', card: '#2A2A2A' },
        crema: '#FDFBF7',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
};
