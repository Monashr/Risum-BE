import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettierPlugin from "eslint-plugin-prettier";
import importPlugin from "eslint-plugin-import";

export default [
  {
    ignores: ["dist", "node_modules"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
      import: importPlugin,
    },
    rules: {
      // Enable TypeScript recommended rules
      ...tsPlugin.configs.recommended.rules,

      // Prettier integration
      "prettier/prettier": "warn",

      // Import fixes
      "import/no-unresolved": "off",

      // Avoid TS unused var false positives
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
