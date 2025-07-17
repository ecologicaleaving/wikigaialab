const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './apps/web',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ['node_modules', '<rootDir>/'],
  
  testEnvironment: 'jest-environment-jsdom',
  
  // Module name mapping for monorepo packages
  moduleNameMapping: {
    '^@wikigaialab/shared$': '<rootDir>/packages/shared/src',
    '^@wikigaialab/shared/(.*)$': '<rootDir>/packages/shared/src/$1',
    '^@wikigaialab/ui$': '<rootDir>/packages/ui/src',
    '^@wikigaialab/ui/(.*)$': '<rootDir>/packages/ui/src/$1',
    '^@wikigaialab/database$': '<rootDir>/packages/database/src',
    '^@wikigaialab/database/(.*)$': '<rootDir>/packages/database/src/$1',
  },
  
  // Test patterns
  testMatch: [
    '<rootDir>/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/**/*.(test|spec).(ts|tsx|js)',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'apps/web/src/**/*.{ts,tsx}',
    'packages/*/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  
  // Jest environment setup
  testEnvironment: 'jsdom',
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);