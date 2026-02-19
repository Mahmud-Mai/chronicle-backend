import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  
  DATABASE_URL: z.string().default('postgresql://chronicle:chronicle_dev@localhost:5433/chronicle'),
  
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  
  CORS_ORIGIN: z.string().default('http://localhost:3001'),
  
  SUPERTOKENS_API_KEY: z.string().optional(),
  SUPERTOKENS_API_DOMAIN: z.string().optional(),
  SUPERTOKENS_API_BASE_PATH: z.string().default('/auth'),
  SUPERTOKENS_WEBSITE_DOMAIN: z.string().default('http://localhost:3001'),
  
  JWT_SECRET: z.string().default('dev-secret-change-in-production'),
  
  RESEND_API_KEY: z.string().optional(),
  
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

export default () => {
  const config = configSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    SUPERTOKENS_API_KEY: process.env.SUPERTOKENS_API_KEY,
    SUPERTOKENS_API_DOMAIN: process.env.SUPERTOKENS_API_DOMAIN,
    SUPERTOKENS_API_BASE_PATH: process.env.SUPERTOKENS_API_BASE_PATH,
    SUPERTOKENS_WEBSITE_DOMAIN: process.env.SUPERTOKENS_WEBSITE_DOMAIN,
    JWT_SECRET: process.env.JWT_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  });
  
  return config;
};
