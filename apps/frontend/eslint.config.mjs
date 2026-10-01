import { fixupConfigRules } from "@eslint/compat"
import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import { frontendBoundaries } from "./eslint-rules/frontend-boundaries.mjs"

const eslintConfig = defineConfig([
  ...fixupConfigRules([...nextVitals, ...nextTs]),
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.test.ts", "lib/api/json-request-client.ts"],
    plugins: { whiteplate: frontendBoundaries },
    rules: { "whiteplate/shared-requests": "error" },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: ["const", "let", "var"] },
        { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
        { blankLine: "always", prev: "block-like", next: "*" },
        { blankLine: "always", prev: "*", next: "return" },
      ],
    },
  },
  {
    files: ["lib/**/*.ts", "actions/**/*.ts", "services/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: {
      "max-lines-per-function": [
        "error",
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["types/**", "**/*.test.ts", "next-env.d.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSTypeAliasDeclaration, TSInterfaceDeclaration",
          message:
            "Declare and export named types in the feature's types/ module; import them with import type.",
        },
      ],
      "max-lines": [
        "error",
        { max: 350, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: ["components/**/*.tsx", "app/**/*.tsx"],
    ignores: ["components/ui/**"],
    plugins: { whiteplate: frontendBoundaries },
    rules: {
      "whiteplate/shared-controls": "error",
      "whiteplate/jsx-block-spacing": "error",
    },
  },
  {
    files: [
      "components/**/*.{ts,tsx}",
      "hooks/**/*.{ts,tsx}",
      "actions/**/*.ts",
      "services/**/*.ts",
    ],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message:
            "Keep HTTP transport in lib/api adapters, not in UI, hooks, actions, or feature services.",
        },
      ],
    },
  },
  {
    files: ["components/**/*.{ts,tsx}", "hooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            "@/lib/auth",
            "@/lib/email",
            "@/lib/api",
            "@/lib/api/index",
            "@/lib/api/public-storefront",
            "@/lib/checkout/order-client",
          ],
          patterns: [
            {
              group: ["@/services/*"],
              message:
                "Keep server services and credentials behind server pages, actions, or route handlers. Import contracts from types/.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
])

export default eslintConfig
