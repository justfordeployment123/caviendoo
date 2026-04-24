import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { authLimiter } from '../../middleware/rateLimiter';
import { validate } from '../../middleware/validate';
import { LoginSchema } from '../../schemas/adminSchemas';

const router = Router();

// POST /api/v1/admin/login
router.post('/login', authLimiter, validate({ body: LoginSchema }), async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const admin = await prisma.adminUser.findUnique({ where: { email } });

    // Constant-time comparison — prevents user enumeration via timing attacks
    const dummyHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQJT3/Km';
    const hashToCheck = admin?.passwordHash ?? dummyHash;
    const valid = await bcrypt.compare(password, hashToCheck);

    if (!admin || !valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const expiresInMs = 24 * 60 * 60 * 1000;
    // JWT_EXPIRES_IN is a validated string like "24h" — cast satisfies ms.StringValue brand
    const token = jwt.sign({ adminId: admin.id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    // Update last login timestamp (non-blocking)
    prisma.adminUser.update({
      where: { id: admin.id },
      data:  { lastLoginAt: new Date() },
    }).catch(() => {/* non-critical */});

    res.json({
      token,
      expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
