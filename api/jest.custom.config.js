module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  resetMocks: true,
  resetModules: true,
  roots: ['<rootDir>/custom/test'],
  coverageDirectory: 'coverage',
  setupFiles: [
    './custom/test/jestSetup.js',
    './custom/test/__mocks__/logger.js',
    './custom/test/__mocks__/fetchEventSource.js',
  ],
  moduleNameMapper: {
    '^~/config$': '<rootDir>/config',
    '^~/config/(.*)$': '<rootDir>/config/$1',
    '^~/db$': '<rootDir>/db',
    '^~/db/(.*)$': '<rootDir>/db/$1',
    '^@server/(.*)$': '<rootDir>/server/$1',
    '^~/server/(.*)$': '<rootDir>/server/$1',
    '^~/(.*)$': '<rootDir>/$1',
    '~/data/auth.json': '<rootDir>/custom/__mocks__/auth.mock.json',
    '^openid-client/passport$': '<rootDir>/custom/test/__mocks__/openid-client-passport.js', // Mock for the passport strategy part
    '^openid-client$': '<rootDir>/custom/test/__mocks__/openid-client.js',
    '^winston$': '<rootDir>/custom/test/__mocks__/logger.js',
    '^winston-daily-rotate-file$': '<rootDir>/custom/test/__mocks__/logger.js',
  },
  transformIgnorePatterns: ['/node_modules/(?!(openid-client|oauth4webapi|jose)/).*/'],
  testMatch: ['**/?(*.)+(custom.spec).[jt]s?(x)'], // Only run files ending in .custom.spec.js or .custom.spec.ts
  testPathIgnorePatterns: [
    '<rootDir>/test/',
    '<rootDir>/../test/',
    '<rootDir>/../api/test/',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/test/',
    '<rootDir>/../test/',
    '<rootDir>/../api/test/',
  ],
};
