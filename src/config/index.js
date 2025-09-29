import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = Joi.object({
  BOT_TOKEN: Joi.string().required(),
  BOT_USERNAME: Joi.string().required(),
  MONGODB_URI: Joi.string().required(),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  SOCHMA_API_URL: Joi.string().uri().required(),
  SOCHMA_API_KEY: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  ENCRYPTION_KEY: Joi.string().required(),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(20),
  WEBHOOK_URL: Joi.string().uri().optional(),
  WEBHOOK_PORT: Joi.number().default(8443),
  WEBHOOK_CERT_PATH: Joi.string().optional(),
  WEBHOOK_KEY_PATH: Joi.string().optional()
}).unknown();

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

// Export configuration
export const config = {
  bot: {
    token: envVars.BOT_TOKEN,
    username: envVars.BOT_USERNAME,
  },
  database: {
    uri: envVars.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  app: {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    logLevel: envVars.LOG_LEVEL,
  },
  sochma: {
    apiUrl: envVars.SOCHMA_API_URL,
    apiKey: envVars.SOCHMA_API_KEY,
  },
  security: {
    jwtSecret: envVars.JWT_SECRET,
    encryptionKey: envVars.ENCRYPTION_KEY,
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
  webhook: {
    url: envVars.WEBHOOK_URL,
    port: envVars.WEBHOOK_PORT,
    certPath: envVars.WEBHOOK_CERT_PATH,
    keyPath: envVars.WEBHOOK_KEY_PATH,
  }
};

export default config;
