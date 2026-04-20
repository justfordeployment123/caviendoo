import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { HttpError } from '../utils/httpError';

interface JwtPayload {
  adminId: number;
  iat: number;
  exp: number;
}

// Extend Express Request to carry adminId after auth
declare global {
  namespace Express {
    interface Request {
      adminId?: number;
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Missing or malformed Authorization header'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.adminId = payload.adminId;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new HttpError(401, 'Token has expired'));
    }
    return next(new HttpError(401, 'Invalid token'));
  }
};
