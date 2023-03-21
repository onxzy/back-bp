require('dotenv').config();

process.env.DATABASE_URL = `${process.env.TESTS_E2E_DATABASE_PROVIDER}://${process.env.TESTS_E2E_DATABASE_USER}:${process.env.TESTS_E2E_DATABASE_PASSWORD}@${process.env.TESTS_E2E_DATABASE_HOST}:${process.env.TESTS_E2E_DATABASE_PORT}/${process.env.TESTS_E2E_DATABASE_NAME}?connection_limit=1`;

process.env.SMTP_HOST = process.env.TESTS_E2E_SMTP_HOST;
process.env.SMTP_USER = process.env.TESTS_E2E_SMTP_USER;
process.env.SMTP_PASSWORD = process.env.TESTS_E2E_SMTP_PASSWORD;
process.env.SMTP_PORT = process.env.TESTS_E2E_SMTP_PORT;
process.env.SMTP_SECURE = process.env.TESTS_E2E_SMTP_SECURE;

global.console = {
  ...console,
  info: jest.fn(),
};
