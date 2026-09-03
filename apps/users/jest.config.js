const base = require('../../jest.config.base');

module.exports = {
  ...base,
  rootDir: 'src',
  displayName: 'users',
  coverageDirectory: '<rootDir>/../coverage',
};
