export const mainConfig = () => {
  const port = parseInt(process.env.PORT, 10) || 3000;
  return {
    port,
    apiUrl: process.env.API_URL || `http://localhost:${port}`,
    session: {
      // FIXME: Session store
      name: process.env.SESSION_COOKIE_NAME || 'connect.sid',
      secret: process.env.SESSION_SECRET || 'session-secret',
      resave: false,
      saveUninitialized: false,
    },
  };
};
