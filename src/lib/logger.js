import { timestampPtBR } from './format';

export const log = {
  info: (...args) => console.log(`[${timestampPtBR()}] [info]`, ...args),
  warn: (...args) => console.warn(`[${timestampPtBR()}] [warn]`, ...args),
  error: (...args) => console.error(`[${timestampPtBR()}] [error]`, ...args),
};
