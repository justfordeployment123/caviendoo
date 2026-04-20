import './config/env'; // parse and validate env vars before anything else
import app from './app';
import { prisma } from './config/db';
import { env } from './config/env';

const PORT = env.PORT;

async function start(): Promise<void> {
  // Verify DB connection before accepting traffic
  await prisma.$connect();
  console.log('[db] Connected to PostgreSQL');

  const server = app.listen(PORT, () => {
    console.log(`[server] Caviendoo API running on port ${PORT} (${env.NODE_ENV})`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[server] ${signal} — shutting down gracefully…`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('[server] Shutdown complete');
      process.exit(0);
    });

    // Force exit after 10 s if graceful shutdown hangs
    setTimeout(() => {
      console.error('[server] Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
