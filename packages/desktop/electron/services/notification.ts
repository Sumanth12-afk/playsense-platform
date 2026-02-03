// electron/services/notification.ts
import { Notification } from 'electron';
import { logger } from '../utils/logger';

export function showNotification(title: string, body: string) {
  try {
    if (Notification.isSupported()) {
      new Notification({
        title,
        body,
        silent: false,
      }).show();
    }
  } catch (error) {
    logger.error('Failed to show notification:', error);
  }
}

export function showGameStartedNotification(gameName: string) {
  showNotification(
    'Game Session Started',
    `Now tracking: ${gameName}`
  );
}

export function showGameEndedNotification(gameName: string, durationMinutes: number) {
  showNotification(
    'Game Session Ended',
    `${gameName} - Played for ${durationMinutes} minutes`
  );
}

export function showSyncNotification(sessionCount: number) {
  showNotification(
    'Sessions Synced',
    `Successfully synced ${sessionCount} gaming session${sessionCount !== 1 ? 's' : ''}`
  );
}

export function showSyncErrorNotification() {
  showNotification(
    'Sync Failed',
    'Unable to sync sessions. Will retry later.'
  );
}

