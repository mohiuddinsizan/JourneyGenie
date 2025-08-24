/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",  // Make sure this is included, especially if you are using Vite's default HTML.
    "./src/**/*.{js,ts,jsx,tsx}",  // This is perfect if you're using React or TypeScript in the `src` folder.
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
