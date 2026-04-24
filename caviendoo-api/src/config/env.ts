import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().url('DATABASE_URL must be a valid postgresql:// URL'),
  REDIS_URL: z.string().url('REDIS_URL must be a valid redis:// URL'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),

  AWS_REGION: z.string().default('eu-west-1'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  S3_BUCKET: z.string().min(1, 'S3_BUCKET is required'),
  CDN_BASE_URL: z.string().url('CDN_BASE_URL must be a valid URL'),
  S3_ENDPOINT: z.string().url().optional(), // set to http://localhost:9000 for local MinIO

  PIXABAY_API_KEY: z.string().min(1, 'PIXABAY_API_KEY is required'),
  UNSPLASH_ACCESS_KEY: z.string().min(1, 'UNSPLASH_ACCESS_KEY is required'),
  PEXELS_API_KEY: z.string().min(1, 'PEXELS_API_KEY is required'),

  OPENUV_API_KEY: z.string().min(1, 'OPENUV_API_KEY is required'),
  UV_ALERT_THRESHOLD: z.coerce.number().int().min(1).max(11).default(8),

  ANTHROPIC_API_KEY: z.string().optional(), // used for AI image scoring; falls back to keyword scoring if unset

  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),

  ADMIN_INITIAL_EMAIL: z.string().email().optional(),
  ADMIN_INITIAL_PASSWORD: z.string().min(8).optional(),
});

function parseEnv() {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    result.error.errors.forEach((e) => {
      console.error(`   ${e.path.join('.')}: ${e.message}`);
    });
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
export type Env = z.infer<typeof EnvSchema>;
