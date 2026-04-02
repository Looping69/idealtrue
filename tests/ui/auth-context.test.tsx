import React from 'react';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { server } from './msw/server';

function AuthProbe() {
  const { user, profile } = useAuth();

  return (
    <div>
      <div data-testid="user-id">{user?.id}</div>
      <div data-testid="display-name">{profile?.displayName}</div>
      <div data-testid="host-plan">{profile?.hostPlan}</div>
    </div>
  );
}

describe('AuthProvider', () => {
  it('restores a session through the same-origin proxy cookie path', async () => {
    server.use(
      http.get('*/api/encore/auth/session', () =>
        HttpResponse.json({
          user: {
            id: 'user-1',
            email: 'guest@example.com',
            emailVerified: true,
            displayName: 'Guest Example',
            photoUrl: 'https://cdn.example.com/avatar.jpg',
            role: 'host',
            hostPlan: 'professional',
            kycStatus: 'verified',
            balance: 1250,
            referralCount: 4,
            tier: 'silver',
            referralCode: 'GUEST123',
            referredByCode: null,
            paymentMethod: 'bank_transfer',
            paymentInstructions: 'Use the booking ID as reference.',
            paymentReferencePrefix: 'IDEAL',
            createdAt: '2026-03-01T10:00:00.000Z',
            updatedAt: '2026-03-30T10:00:00.000Z',
          },
        }),
      ),
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(await screen.findByTestId('user-id')).toHaveTextContent('user-1');
    expect(screen.getByTestId('display-name')).toHaveTextContent('Guest Example');
    expect(screen.getByTestId('host-plan')).toHaveTextContent('professional');
  });
});
