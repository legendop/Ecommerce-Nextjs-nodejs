import { validateConfig } from './env';

// Run validation on load
validateConfig();

// Re-export everything from env and constants
export { default } from './env';
export * from './constants';
export * from './prisma';
