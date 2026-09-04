module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^nowhere-common(|/.*)$': '<rootDir>/../../../libs/nowhere-common/src/$1',
    '^contracts(|/.*)$': '<rootDir>/../../../libs/contracts/src/$1',
  },
};
