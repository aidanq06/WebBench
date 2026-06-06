import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "out/**", "build/**"] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // The benchmark/landing animations intentionally reset local state when a
      // prop changes (e.g. clearing streamed text when a panel scrolls out of
      // view). That's a valid use the new rule over-flags, so keep it as a warning.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
