import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    expect(screen.getByText(/ideal stay team can onboard the managed package/i)).toBeInTheDocument();
  });
});
