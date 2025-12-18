const base = require('../../jest.config.base');

module.exports = {
  ...base,
  rootDir: 'src',

  displayName: 'authentication',

  moduleNameMapper: {
    '^apps/authentication/src/(.*)$': '<rootDir>/$1',
    '^nowhere-common(|/.*)$': '<rootDir>/../../../libs/nowhere-common/src/$1',
    '^proto(|/.*)$': '<rootDir>/../../../libs/proto/$1',
  },
};
