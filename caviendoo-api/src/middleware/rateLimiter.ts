import rateLimit from 'express-rate-limit';

// General API limiter — 120 requests per minute per IP
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down.' },
  skipSuccessfulRequests: false,
});

// Strict limiter for auth endpoints — 10 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts — try again in 15 minutes.' },
  skipSuccessfulRequests: false,
});

// Image pipeline trigger — 5 calls per minute (admin only, still rate-limited)
export const imagePipelineLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Image pipeline rate limit exceeded.' },
});
