import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
    enabled: process.env.MAIL_ENABLED === 'true',
    token: process.env.MAILTRAP_TOKEN,
    fromEmail: process.env.MAIL_FROM_EMAIL || 'hello@demomailtrap.co',
    fromName: process.env.MAIL_FROM_NAME || 'Sistema de Onboarding',
}));