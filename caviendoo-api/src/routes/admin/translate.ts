import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { env } from '../../config/env';

const BodySchema = z.object({
  texts: z.array(z.string().nullable().optional().transform((v) => v ?? '')).min(1).max(20),
});

const router = Router();
router.use(requireAuth);

// POST /api/v1/admin/translate
// Translates an array of English strings into French and Arabic in one Claude call.
router.post('/', validate({ body: BodySchema }), async (req, res, next) => {
  try {
    if (!env.ANTHROPIC_API_KEY) {
      res.status(503).json({ error: 'Translation service not configured (ANTHROPIC_API_KEY missing)' });
      return;
    }

    const { texts } = req.body as { texts: string[] };

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const numbered = texts.map((t, i) => `${i + 1}. ${t || '(empty)'}`).join('\n');

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Translate each numbered item from English into French and Arabic.
Return ONLY a JSON array with objects: [{"fr":"...","ar":"..."},...].
One object per input, in the same order. No extra text.

Items:
${numbered}`,
        },
      ],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    // Strip markdown fences if Claude wrapped the JSON
    const json = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

    let results: { fr: string; ar: string }[];
    try {
      const parsed = JSON.parse(json);
      results = z.array(z.object({ fr: z.string(), ar: z.string() })).parse(parsed);
    } catch {
      return next(new Error('Translation service returned an unexpected format'));
    }

    res.json({ results });
  } catch (err) {
    next(err);
  }
});

export default router;
