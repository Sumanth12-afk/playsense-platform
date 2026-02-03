// electron/main/crash-reporter.ts
import { crashReporter } from 'electron';
import { logger } from '../utils/logger';

export function initCrashReporter() {
  crashReporter.start({
    productName: 'PlaySense Companion',
    companyName: 'PlaySense',
    submitURL: '', // Add your crash report endpoint
    uploadToServer: false,
  });

  logger.info('Crash reporter initialized');
}

