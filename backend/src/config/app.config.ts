import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    nodeEnv: process.env.NODE_ENV,
    name: process.env.APP_NAME,
    version: process.env.APP_VERSION,
    port: parseInt(process.env.PORT || '3001', 10),
    apiPrefix: process.env.API_PREFIX,
    frontendUrl: process.env.FRONTEND_URL,
    corsOrigin: process.env.CORS_ORIGIN,
}));