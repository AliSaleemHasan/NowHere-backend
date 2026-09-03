const base = require('../../jest.config.base');

module.exports = {
  ...base,
  rootDir: 'src',

  displayName: 'authentication',
  coverageDirectory: '<rootDir>/../coverage',
  moduleNameMapper: {
    '^apps/authentication/src/(.*)$': '<rootDir>/$1',
    '^nowhere-common(|/.*)$': '<rootDir>/../../../libs/nowhere-common/src/$1',
    '^contracts(|/.*)$': '<rootDir>/../../../libs/contracts/src/$1',
    '^proto(|/.*)$': '<rootDir>/../../../libs/proto/$1',
  },
};
