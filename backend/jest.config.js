module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  testTimeout: 20000,
  verbose: true,
  moduleFileExtensions: ['ts', 'js', 'json'],
};
