export default {
  "backend/**/*.{ts,tsx}": [
    () => "bun --cwd backend typecheck",
    "bun --cwd backend biome check --write",
    "bun --cwd backend biome format --write"
  ],
  "frontend/**/*.{ts,tsx}": [
    () => "bun --cwd frontend typecheck",
    "bun --cwd frontend eslint --fix"
  ],
  // "backend/src/database/schema/**/*.ts": [
  //   () => "bun --cwd backend db:generate"
  // ]
};
