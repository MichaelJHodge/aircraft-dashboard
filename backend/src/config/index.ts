import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  API_PREFIX: z.string().default('/api'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://postgres:postgres@localhost:5432/aircraft_dashboard'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters')
    .default('change-me-in-production-change-me-in-production'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  EVENT_PUBLISHER: z.enum(['noop', 'log', 'eventbridge']).default('log'),
  EVENT_SOURCE: z.string().default('aircraft-dashboard.backend'),
  EVENTBRIDGE_EVENT_BUS_NAME: z.string().default('aircraft-dashboard-bus'),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_EVENTBRIDGE_ENDPOINT: z.string().optional(),
  ADMIN_JOB_EVENT_REPLAY_LIMIT: z.coerce.number().int().positive().default(50),
  ADMIN_JOB_EVENT_REPLAY_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  corsOrigin: env.CORS_ORIGIN,
  databaseUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  logLevel: env.LOG_LEVEL,
  eventPublisher: env.EVENT_PUBLISHER,
  eventSource: env.EVENT_SOURCE,
  eventBridgeBusName: env.EVENTBRIDGE_EVENT_BUS_NAME,
  awsRegion: env.AWS_REGION,
  awsEventBridgeEndpoint: env.AWS_EVENTBRIDGE_ENDPOINT,
  adminJobEventReplayLimit: env.ADMIN_JOB_EVENT_REPLAY_LIMIT,
  adminJobEventReplayMaxAttempts: env.ADMIN_JOB_EVENT_REPLAY_MAX_ATTEMPTS,
  isDevelopment: env.NODE_ENV === 'development',
};
