export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/e2e/**/*.test.ts"],
  testTimeout: 30000,
};
