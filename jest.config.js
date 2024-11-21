module.exports = {
  testEnvironment: 'node',
  testRunner: 'jest-jasmine2',
  reporters: [
    'default',
    'jest-allure'
  ],
  setupFilesAfterEnv: ['jest-allure/dist/setup'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
};
