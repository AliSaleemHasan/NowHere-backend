/** @type {import('jest').Config} */
const base = require('../../jest.config.base');

module.exports = {
  ...base,
  rootDir: 'src',
  displayName: 'storage',
  coverageDirectory: '<rootDir>/../coverage',
};
