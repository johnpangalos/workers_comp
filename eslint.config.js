import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["**/dist/", "**/build/", "**/.react-router/", ".claude/"]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      // Branch with `if`, `&&` / `??`, or comp0's `dataAttr` for on/off data attributes.
      "no-ternary": "error",
      // `const { disabled: _disabled, ...rest } = props` drops a prop on purpose.
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
    },
  },
);
