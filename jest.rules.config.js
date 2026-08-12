// Config for the RTDB security-rules tests, which run under Node against the
// Firebase emulator (see `npm run test:rules`). Kept separate so the default
// `npm test` unit run stays fast and emulator-free.
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/rules/**/*.test.ts'],
};
