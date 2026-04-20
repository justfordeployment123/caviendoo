import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/httpError';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Known HTTP errors (thrown intentionally)
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Resource already exists' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Resource not found' });
    }
  }

  // Unknown errors — log full details server-side, return generic message to client
  console.error('[error]', err);
  return res.status(500).json({ error: 'Internal server error' });
};
