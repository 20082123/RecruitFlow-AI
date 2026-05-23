import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#102027",
        ocean: "#0F6B7A",
        mint: "#49A078",
        amber: "#D88C43",
        paper: "#F5F7F4"
      },
      boxShadow: {
        panel: "0 18px 50px rgba(16, 32, 39, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
