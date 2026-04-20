import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Routes
import fruitsRouter       from './routes/fruits';
import governoratesRouter from './routes/governorates';
import searchRouter       from './routes/search';
import metricsRouter      from './routes/metrics';
import imagesRouter       from './routes/images';
import envDataRouter      from './routes/envData';
import adminAuthRouter    from './routes/admin/auth';
import adminFruitsRouter  from './routes/admin/fruits';
import adminGovsRouter    from './routes/admin/governorates';

const app = express();

// ── Trust proxy (Nginx sits in front) ────────────────────────────────────────
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        imgSrc:     ["'self'", 'https://media.caviendoo.com'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin:      env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge:      600, // preflight cache 10 min
  }),
);

// ── Body parsing + compression ─────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// ── Health / readiness check ──────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString(), env: env.NODE_ENV });
});

// ── Public API ────────────────────────────────────────────────────────────────
app.use('/api/v1', apiLimiter);
app.use('/api/v1/fruits',       fruitsRouter);
app.use('/api/v1/governorates', governoratesRouter);
app.use('/api/v1/search',       searchRouter);
app.use('/api/v1/metrics',      metricsRouter);
app.use('/api/v1/images',       imagesRouter);
app.use('/api/v1/env-data',     envDataRouter);

// ── Admin API (all routes inside require JWT via requireAuth middleware) ───────
app.use('/api/v1/admin',              adminAuthRouter);
app.use('/api/v1/admin/fruits',       adminFruitsRouter);
app.use('/api/v1/admin/governorates', adminGovsRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

export default app;
