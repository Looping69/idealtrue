import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PricingPage from '@/pages/PricingPage';

const refreshProfileMock = vi.fn();
const authState = {
  user: null as unknown,
  profile: null as unknown,
  refreshProfile: refreshProfileMock,
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('@/lib/billing-client', () => ({
  createSubscriptionCheckout: vi.fn(),
  getCheckoutStatus: vi.fn(),
  getMyHostBillingAccount: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

describe('PricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = null;
    authState.profile = null;
  });

  it('opens the Yoco payment link for a selected plan when the user is signed in', async () => {
    const user = userEvent.setup();
    const assignMock = vi.fn();
    authState.user = { id: 'host-1' };

    Object.defineProperty(window, 'location', {
      value: { ...window.location, assign: assignMock },
      writable: true,
    });

    render(
      <MemoryRouter initialEntries={['/pricing']}>
        <Routes>
          <Route path="/pricing" element={<PricingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /get more visibility/i }));

    expect(assignMock).toHaveBeenCalledWith('https://pay.yoco.com/r/4nJJ1B');
  });

  it('shows the managed hosting card and routes its CTA into managed host signup', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/pricing']}>
        <Routes>
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/signup" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('button', { name: /apply for managed hosting/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /apply for managed hosting/i }));

    await waitFor(() => {
      const location = screen.getByTestId('location').textContent ?? '';
      expect(location).toContain('/signup?');
      expect(location).toContain('role=host');
      expect(location).toContain('management=managed');
      expect(location).toContain('returnTo=%2Fpricing');
    });
  });
});
