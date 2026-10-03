// Rediseño "Terroir Editorial Luxury" (2026-10-01): wine-dark/wine-primary/wine-light
// reemplazan los tonos tannat; basalto profundo en tannat-900 para secciones oscuras;
// crema pasa a pergamino cálido; dorado champán envejecido. terroir/basalt (texto) sin cambios.
module.exports = {
  content: ['./LaRutadelTannat.html', './LaRutadelTannat_files/*.js'],
  future: { hoverOnlyWhenSupported: true }, // los hover: y group-hover: solo aplican con mouse (en táctil quedaban pegados tras tocar)
  theme: {
    extend: {
      colors: {
        tannat: { DEFAULT: '#721B28', dark: '#4A101D', light: '#8F2636', 50: '#FAF5F6', 100: '#F4EBED', 900: '#2B0A14' },
        gold: { DEFAULT: '#C29D62', light: '#D9B47A', dark: '#7E6536', 50: '#FCF9F2' },
        terroir: { DEFAULT: '#5A4D41', light: '#8E7F72', dark: '#3A3027' },
        basalt: { DEFAULT: '#242424', surface: '#181818', card: '#2A2A2A' },
        crema: '#FAF8F5',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
};
