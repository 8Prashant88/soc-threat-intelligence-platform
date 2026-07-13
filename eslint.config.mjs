import coreWebVitals from "eslint-config-next/core-web-vitals"
import typescript from "eslint-config-next/typescript"

const eslintConfig = [
  // Vendored shadcn/ui scaffold and build output — not linted as app code.
  { ignores: ["components/ui/**", ".next/**", "node_modules/**"] },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Pragmatic relaxations for this project's style.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // React-compiler performance advisories (Next 16). The app intentionally
      // hydrates state from localStorage/DOM on mount, which is correct here —
      // surface these as warnings rather than hard errors.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
]

export default eslintConfig
