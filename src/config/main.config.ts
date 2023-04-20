import * as sqlite3 from 'better-sqlite3';
import { CorsOptions } from 'cors';
import { SessionOptions } from 'express-session';
import { ServerOptions } from 'socket.io';

// import sqlite from "better-sqlite3"; 
const SqliteStore = require("better-sqlite3-session-store")(require("express-session"))
const db = new sqlite3("sessions.sqlite");

export const mainConfig = () => {
  const port = parseInt(process.env.PORT, 10) || 3000;
  return {
    port,
    apiUrl: process.env.API_URL || `http://localhost:${port}`,
    session: {
      store: new SqliteStore({
        client: db, 
        expired: {
          clear: true,
          intervalMs: 900000 //ms = 15min
        }
      }),
      name: process.env.SESSION_COOKIE_NAME || 'connect.sid',
      secret: process.env.SESSION_SECRET || 'session-secret',
      resave: false,
      saveUninitialized: false,
    } as SessionOptions,
    cors: {
      origin: '*',
      credentials: true,
      exposedHeaders: ['Content-Type', 'Authorization'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    } as CorsOptions,
    socketIo: {
      cors: {
        origin: '*',
        credentials: true,
      } as CorsOptions,
    } as Partial<ServerOptions>
  } as const;
};

export type mainConfig = ReturnType<typeof mainConfig>;
