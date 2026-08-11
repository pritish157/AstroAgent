const app = require('./app');

const PORT = process.env.PORT || 5005;

/**
 * server.js: Entry point script responsible solely for starting the HTTP port
 * listener. Configures clean shutdown hooks and environment logging.
 */
const server = app.listen(PORT, () => {
  console.log(`✨ AstroAgent Express backend successfully active on port ${PORT}.`);
  console.log('💡 Frontend Vite dev server runs separately on http://localhost:3000');
});

// Handle graceful termination (close DB connection and stop port listening)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down server gracefully...');
  server.close(() => {
    console.log('🔒 HTTP server closed.');
    process.exit(0);
  });
});
