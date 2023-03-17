require('dotenv').config();

process.env.DATABASE_URL = `${process.env.TESTS_E2E_DATABASE_PROVIDER}://${process.env.TESTS_E2E_DATABASE_USER}:${process.env.TESTS_E2E_DATABASE_PASSWORD}@${process.env.TESTS_E2E_DATABASE_HOST}:${process.env.TESTS_E2E_DATABASE_PORT}/${process.env.TESTS_E2E_DATABASE_NAME}`;
process.env.SMTP_HOST = '';

global.console = {
  ...console,
  info: jest.fn(),
};