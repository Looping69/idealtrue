import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import SignupPage from '@/pages/SignupPage';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false,
    logout: vi.fn(),
    refreshProfile: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithGoogle: vi.fn(),
  }),
}));

vi.mock('@/lib/google-identity', () => ({
  getGoogleClientId: () => '',
  loadGoogleIdentityScript: vi.fn(),
}));

describe('SignupPage Google auth config', () => {
  it('shows a clear fallback when Google auth is not configured', () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('google-auth-unavailable')).toHaveTextContent(
      'Google sign-in is unavailable in this environment. Use email and password for now.',
    );
  });
});
