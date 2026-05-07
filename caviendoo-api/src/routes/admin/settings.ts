import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const ProfileSchema = z.object({
  email:           z.string().email(),
  name:            z.string().max(100).optional(),
  currentPassword: z.string().min(1, 'Current password is required to update profile'),
});

const PasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(10, 'New password must be at least 10 characters'),
});

const router = Router();
router.use(requireAuth);

// PATCH /api/v1/admin/settings/profile
router.patch('/profile', validate({ body: ProfileSchema }), async (req, res, next) => {
  try {
    const { email, name, currentPassword } = req.body as z.infer<typeof ProfileSchema>;

    const admin = await prisma.adminUser.findUnique({ where: { id: req.adminId } });
    if (!admin) { res.status(404).json({ error: 'Admin not found' }); return; }

    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) { res.status(401).json({ error: 'Current password is incorrect' }); return; }

    // Check email uniqueness if changing
    if (email !== admin.email) {
      const exists = await prisma.adminUser.findUnique({ where: { email } });
      if (exists) { res.status(409).json({ error: 'Email already in use' }); return; }
    }

    const updated = await prisma.adminUser.update({
      where:  { id: req.adminId },
      data:   { email, ...(name !== undefined ? { name } : {}) },
      select: { id: true, email: true, name: true },
    });

    res.json({ admin: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/admin/settings/password
router.patch('/password', validate({ body: PasswordSchema }), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body as z.infer<typeof PasswordSchema>;

    const admin = await prisma.adminUser.findUnique({ where: { id: req.adminId } });
    if (!admin) { res.status(404).json({ error: 'Admin not found' }); return; }

    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) { res.status(401).json({ error: 'Current password is incorrect' }); return; }

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.adminUser.update({ where: { id: req.adminId }, data: { passwordHash: hash } });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
