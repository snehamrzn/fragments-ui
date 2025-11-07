import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: ["**/*.{jsx,tsx}"],
    rules: {
      "react/react-in-jsx-scope": "off", // Not needed in Next.js with automatic JSX runtime
    },
  },
  { files: ["**/*.json"], plugins: { json }, language: "json/json", extends: ["json/recommended"] },
  { files: ["**/*.jsonc"], plugins: { json }, language: "json/jsonc", extends: ["json/recommended"] },
  { files: ["**/*.md"], plugins: { markdown }, language: "markdown/gfm", extends: ["markdown/recommended"] },
]);
