import { randomBytes } from 'crypto';

// A process-local secret makes these demo cookies unusable after a backend restart.
const processDemoSecret = randomBytes(32).toString('hex');

export const isDevAuthEnabled = () =>
  process.env.NODE_ENV === 'development' &&
  process.env.npm_lifecycle_event === 'dev' &&
  process.env.DEV_AUTH_BYPASS === 'true';

export const getDevAuthSecret = () => processDemoSecret;
