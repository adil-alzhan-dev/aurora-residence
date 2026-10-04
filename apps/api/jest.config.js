module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  roots: ['<rootDir>/src', '<rootDir>/prisma', '<rootDir>/test'],
  testRegex: '.*\\.(spec|e2e-spec)\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  globalSetup: '<rootDir>/test/global-setup.ts',
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  // e2e suites share one test database.
  maxWorkers: 1,
  testTimeout: 30000,
};
