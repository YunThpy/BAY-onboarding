
import pino from 'pino';
import { CONFIG } from '../config';
export const log = pino({ level: CONFIG.LOG_LEVEL });
