import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        medexBlue: "#3b82f6",
        medexDarkBlue: "#1e40af",
        medexRed: "#ef4444",
      },
    },
  },
  plugins: [],
};
export default config;