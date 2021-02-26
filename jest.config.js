module.exports = {
  roots: ['<rootDir>/test/', '<rootDir>/src/'],
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|js)'],
  moduleDirectories: ['.', 'src', 'node_modules'],
  preset: 'ts-jest',
};
