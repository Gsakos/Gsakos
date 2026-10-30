import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        signature: ["Georgia", "Cambria", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
