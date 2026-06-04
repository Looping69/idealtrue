import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

import SignupPage from '@/pages/SignupPage';

const signInMock = vi.fn();
const signUpMock = vi.fn();
const signInWithGoogleMock = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: signInMock,
    signUp: signUpMock,
    signInWithGoogle: signInWithGoogleMock,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/lib/google-identity', () => ({
  getGoogleClientId: () => null,
  loadGoogleIdentityScript: vi.fn(),
}));

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preselects host signup and shows the managed onboarding note when routed from managed pricing', async () => {
    render(
      <MemoryRouter initialEntries={['/signup?role=host&management=managed&returnTo=%2Fpricing']}>
        <SignupPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/managed hosting selected/i)).toBeInTheDocument();
    expect(screen.getByText("I'm a Host")).toBeInTheDocument();
    expect(screen.getByText(/ideal stay team can onboard the r650 \/ month managed package/i)).toBeInTheDocument();
  });

  it('submits managed host onboarding mode through email signup when routed from managed pricing', async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValue({
      profile: { role: 'host' },
      verificationEmailStatus: 'sent',
    });

    render(
      <MemoryRouter initialEntries={['/signup?role=host&management=managed&returnTo=%2Fpricing']}>
        <SignupPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('Your full name'), 'Managed Host');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'managed@example.com');
    await user.type(screen.getByPlaceholderText('Create a password'), 'password123');
    await user.type(screen.getByPlaceholderText('Repeat your password'), 'password123');
    const submitButton = screen.getAllByRole('button', { name: /create account/i }).find((button) => button.getAttribute('type') === 'submit');
    expect(submitButton).toBeTruthy();
    await user.click(submitButton!);

    await waitFor(() =>
      expect(signUpMock).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'host',
          managementMode: 'managed',
        }),
      ),
    );
  });
});
