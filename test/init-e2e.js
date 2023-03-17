const { exec } = require('child_process');
require('dotenv').config();

process.env.DATABASE_URL = `${process.env.TESTS_E2E_DATABASE_PROVIDER}://${process.env.TESTS_E2E_DATABASE_USER}:${process.env.TESTS_E2E_DATABASE_PASSWORD}@${process.env.TESTS_E2E_DATABASE_HOST}:${process.env.TESTS_E2E_DATABASE_PORT}/${process.env.TESTS_E2E_DATABASE_NAME}`;
process.env.SMTP_HOST = null;

exec("prisma db push --force-reset", (err, stdout, stderr) => {
  if (err) throw err;
  if (stderr) {
    console.error(stderr);
    throw new Error("Can't push test-db");
  }
})