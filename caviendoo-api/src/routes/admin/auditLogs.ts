import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { buildMeta, buildSkip } from '../../utils/paginate';

const QuerySchema = z.object({
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(100).default(30),
  entityType: z.enum(['fruit', 'governorate']).optional(),
  action:     z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
});

const router = Router();
router.use(requireAuth);

// GET /api/v1/admin/audit-logs
router.get('/', validate({ query: QuerySchema }), async (req, res, next) => {
  try {
    const { page, limit, entityType, action } = req.query as any;

    const where = {
      ...(entityType && { entityType }),
      ...(action     && { action }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    buildSkip(page, limit),
        take:    limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ data: logs, meta: buildMeta(total, page, limit) });
  } catch (err) {
    next(err);
  }
});

export default router;
