export const mainConfig = () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  session: {
    // FIXME: Session store
    name: process.env.SESSION_COOKIE_NAME || 'connect.sid',
    secret: process.env.SESSION_SECRET || 'session-secret',
    resave: false,
    saveUninitialized: false,
  },
});
