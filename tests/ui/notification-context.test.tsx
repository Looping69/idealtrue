import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { NotificationProvider, useNotifications } from '@/context/NotificationContext';

const listMyNotificationsMock = vi.fn();
const markNotificationReadMock = vi.fn();
const markAllNotificationsReadMock = vi.fn();

vi.mock('@/lib/notification-client', () => ({
  listMyNotifications: () => listMyNotificationsMock(),
  markNotificationRead: (notificationId: string) => markNotificationReadMock(notificationId),
  markAllNotificationsRead: () => markAllNotificationsReadMock(),
}));

function NotificationProbe() {
  const { notifications, unreadCount, isNotificationRead, markNotificationRead } = useNotifications();

  return (
    <div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="n1-state">{isNotificationRead('n1') ? 'read' : 'unread'}</div>
      <div data-testid="notification-count">{notifications.length}</div>
      <button type="button" onClick={() => void markNotificationRead('n1')}>
        Mark read
      </button>
    </div>
  );
}

describe('NotificationProvider', () => {
  it('merges polled notifications without clobbering backend read state', async () => {
    let pollNotifications: (() => void) | null = null;
    vi.spyOn(window, 'setInterval').mockImplementation((callback) => {
      if (!pollNotifications) {
        pollNotifications = callback as () => void;
      }
      return 1 as unknown as ReturnType<typeof setInterval>;
    });
    vi.spyOn(window, 'clearInterval').mockImplementation(() => undefined);

    listMyNotificationsMock
      .mockResolvedValueOnce([
        {
          id: 'n1',
          title: 'Booking update',
          message: 'Your booking is awaiting payment.',
          type: 'info',
          target: 'guest-1',
          actionPath: '/guest',
          createdAt: '2026-04-01T10:00:00.000Z',
          readAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'n1',
          title: 'Booking update',
          message: 'Your booking is awaiting payment.',
          type: 'info',
          target: 'guest-1',
          actionPath: '/guest',
          createdAt: '2026-04-01T10:00:00.000Z',
          readAt: null,
        },
        {
          id: 'n2',
          title: 'Host replied',
          message: 'The host confirmed your booking.',
          type: 'success',
          target: 'guest-1',
          actionPath: '/guest',
          createdAt: '2026-04-01T10:05:00.000Z',
          readAt: null,
        },
      ]);
    markNotificationReadMock.mockResolvedValue({ readAt: '2026-04-01T10:02:00.000Z' });

    render(
      <NotificationProvider user={{ id: 'guest-1', email: 'guest@example.com', displayName: 'Guest Example', photoUrl: '' }}>
        <NotificationProbe />
      </NotificationProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('unread-count')).toHaveTextContent('1'));

    fireEvent.click(screen.getByRole('button', { name: 'Mark read' }));

    await waitFor(() => expect(screen.getByTestId('n1-state')).toHaveTextContent('read'));

    expect(pollNotifications).not.toBeNull();
    await act(async () => {
      pollNotifications?.();
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByTestId('notification-count')).toHaveTextContent('2'));
    expect(screen.getByTestId('n1-state')).toHaveTextContent('read');
    expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
  });
});
