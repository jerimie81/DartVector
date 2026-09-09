import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserAuthButton } from '@/components/auth/UserAuthButton';

const mockUseAuth = vi.fn();

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('UserAuthButton', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('renders guest state with sign-in CTA', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      isSyncing: false,
      syncStatus: 'Ready',
      syncLocalToCloud: vi.fn(),
    });

    render(<UserAuthButton />);

    expect(screen.getByText('Guest Play')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /backup with google/i })).toBeInTheDocument();
  });

  it('calls signInWithGoogle when the sign-in button is clicked', async () => {
    const signInWithGoogle = vi.fn();

    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signInWithGoogle,
      signOut: vi.fn(),
      isSyncing: false,
      syncStatus: 'Ready',
      syncLocalToCloud: vi.fn(),
    });

    const user = userEvent.setup();
    render(<UserAuthButton />);

    await user.click(screen.getByRole('button', { name: /backup with google/i }));

    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
  });
});
