import type { Notification } from '@/types';
import { encoreRequest } from './encore-client';

interface EncoreNotification {
  id: string;
  title: string;
  message: string;
  type: Notification['type'];
  target: string;
  actionPath?: string | null;
  createdAt: string;
}

function mapNotification(notification: EncoreNotification): Notification {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    target: notification.target,
    actionPath: notification.actionPath || null,
    createdAt: notification.createdAt,
  };
}

function isUserNotificationFeedEnabled() {
  const env = (import.meta as any).env ?? {};
  return env.DEV || env.VITE_ENABLE_USER_NOTIFICATIONS === 'true';
}

export async function listMyNotifications() {
  if (!isUserNotificationFeedEnabled()) {
    return [];
  }

  try {
    const response = await encoreRequest<{ notifications: EncoreNotification[] }>(
      '/ops/my-notifications',
      {},
      { auth: true },
    );

    return response.notifications.map(mapNotification);
  } catch (error) {
    if (error instanceof Error && error.message.includes('"code":"not_found"')) {
      return [];
    }
    throw error;
  }
}
