/** Root Jest config — discovers *.test.ts across every workspace. */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  clearMocks: true,
  roots: ["<rootDir>/shared", "<rootDir>/pipeline-config"],
  testMatch: ["**/src/**/*.test.ts"],
  collectCoverageFrom: ["*/src/**/*.ts", "!*/src/index.ts"],
};
