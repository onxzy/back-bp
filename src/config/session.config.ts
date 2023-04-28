import { registerAs } from '@nestjs/config';
import * as sqlite3 from 'better-sqlite3';
import { SessionOptions } from 'express-session';

// eslint-disable-next-line @typescript-eslint/no-var-requires, prettier/prettier
const SqliteStore = require('better-sqlite3-session-store')(require('express-session'));
const db = new sqlite3('sessions.sqlite');

export const config = {
  store: new SqliteStore({
    client: db,
    expired: {
      clear: true,
      intervalMs: 900000, //ms = 15min
    },
  }),
  name: process.env.SESSION_COOKIE_NAME || 'connect.sid',
  secret: process.env.SESSION_SECRET || 'session-secret',
  resave: false,
  saveUninitialized: false,
} as SessionOptions;

export const sessionConfig = registerAs('session', () => config);
export type sessionConfig = ReturnType<typeof sessionConfig>;
