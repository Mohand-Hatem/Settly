import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Boundary Rule 1: Cross-Module Boundaries for ALL module files (including repositories)
  // No file in a module may directly access another module's repository/ or sql/
  {
    files: ["src/modules/**/*.{ts,js}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "../../**/repository*",
                "../../../**/repository*",
                "../../**/sql*",
                "../../../**/sql*",
              ],
              message:
                "ARCHITECTURAL VIOLATION: Modules must call other modules only through their public service interface. Direct repository/SQL imports are forbidden (BACKEND.md Section 4).",
            },
          ],
        },
      ],
    },
  },
  // Boundary Rule 2: Prisma Isolation — files outside repository/ cannot import Prisma
  // declared exception: identity module for Better Auth (BACKEND.md Section 4)
  {
    files: ["src/**/*.{ts,js}"],
    ignores: [
      "src/modules/*/repository/**/*.{ts,js}",
      "src/modules/identity/**/*.{ts,js}",
      "src/shared/database/**/*.{ts,js}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message:
                "ARCHITECTURAL VIOLATION: Prisma may only be imported in repository/ layers (BACKEND.md Section 4).",
            },
            {
              name: "prisma",
              message:
                "ARCHITECTURAL VIOLATION: Prisma may only be imported in repository/ layers (BACKEND.md Section 4).",
            },
          ],
          patterns: [
            {
              group: [
                "../../**/repository*",
                "../../../**/repository*",
                "../../**/sql*",
                "../../../**/sql*",
              ],
              message:
                "ARCHITECTURAL VIOLATION: Modules must call other modules only through their public service interface. Direct repository/SQL imports are forbidden (BACKEND.md Section 4).",
            },
          ],
        },
      ],
    },
  }
);
