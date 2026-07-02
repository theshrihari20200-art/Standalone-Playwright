module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: [
      'src/tests/steps/test.ts',
      'src/tests/steps/**/*.ts',
      'src/tests/support/**/*.ts'
    ],
    format: ['progress'],
    timeout: 120000   // <-- bumped from 20s; TC4 stacks login + 2x submit + 5x5s settle waits
  }
};
