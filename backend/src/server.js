const app = require('./app');

const PORT = process.env.PORT || 5005;

/**
 * server.js: Entry point script responsible solely for starting the HTTP port
 * listener. Configures clean shutdown hooks and environment logging.
 */
const server = app.listen(PORT, () => {
  console.log(`✨ AstroAgent Express backend successfully active on port ${PORT}.`);
  console.log('💡 Frontend Vite dev server runs separately on http://localhost:3000');
  
  // Automated 5-minute self-ping for Render free-tier keep-alive
  const renderExternalUrl = process.env.RENDER_EXTERNAL_URL || process.env.SELF_PING_URL;
  if (renderExternalUrl) {
    console.log(`💓 [Render Keep-Alive] Automated 5-minute self-ping enabled for: ${renderExternalUrl}`);
    const KEEP_ALIVE_INTERVAL_MS = 5 * 60 * 1000;
    setInterval(async () => {
      try {
        const pingUrl = `${renderExternalUrl.replace(/\/$/, '')}/api/ping`;
        const response = await fetch(pingUrl);
        if (response.ok) {
          console.log(`💓 [Render Keep-Alive] Pinged ${pingUrl} at ${new Date().toISOString()}`);
        }
      } catch (err) {
        console.warn(`⚠️ [Render Keep-Alive] Self-ping failed: ${err.message}`);
      }
    }, KEEP_ALIVE_INTERVAL_MS);
  }
});

// Handle graceful termination (close DB connection and stop port listening)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down server gracefully...');
  server.close(() => {
    console.log('🔒 HTTP server closed.');
    process.exit(0);
  });
});
