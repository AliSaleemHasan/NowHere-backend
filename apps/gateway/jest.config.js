const base = require('../../jest.config.base');

module.exports = {
  ...base,
  rootDir: 'src',
  displayName: 'gateway',
  coverageDirectory: '<rootDir>/../coverage',
  moduleNameMapper: {
    '^nowhere-common(|/.*)$': '<rootDir>/../../../libs/nowhere-common/src/$1',
    '^contracts(|/.*)$': '<rootDir>/../../../libs/contracts/src/$1',
  },
};
