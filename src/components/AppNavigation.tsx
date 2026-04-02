import { Home, LogOut, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from '@/components/NotificationBell';
import { Button, rawButtonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types';

type AppNavigationProps = {
  isAdmin: boolean;
  isAdminAccount: boolean;
  isHostRoute: boolean;
  isAdminRoute: boolean;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onLogout: () => void;
  profile: UserProfile | null;
  user: {
    id: string;
    email: string;
    photoUrl?: string | null;
  } | null;
};

export default function AppNavigation({
  isAdmin,
  isAdminAccount,
  isHostRoute,
  isAdminRoute,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onLogout,
  profile,
  user,
}: AppNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();

  if (isHostRoute || isAdminRoute) {
    return null;
  }

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/50 bg-surface-variant/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18 items-center py-3">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center shadow-md shadow-primary/20">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block text-lg font-semibold tracking-tight">Ideal Stay</span>
                <span className="hidden sm:block text-xs uppercase tracking-[0.22em] text-on-surface-variant">
                  Curated escapes
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className={cn('text-sm font-medium', location.pathname === '/' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface')}>Explore</Link>
              {user ? (
                <>
                  {profile?.role === 'host' && (
                    <Link to="/host" className={cn('text-sm font-medium', location.pathname.startsWith('/host') ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface')}>Host Dashboard</Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className={cn('text-sm font-medium', location.pathname.startsWith('/admin') ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface')}>Admin Panel</Link>
                  )}
                  {isAdminAccount && !isAdmin && (
                    <Link to="/account" className="text-sm font-medium text-primary hover:text-primary/80">Return to Admin</Link>
                  )}
                  <Link to="/guest" className={cn('text-sm font-medium', location.pathname === '/guest' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface')}>My Stays</Link>
                  <Link to="/referral" className={cn('text-sm font-medium', location.pathname === '/referral' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface')}>Rewards</Link>
                  <Link to="/account" className={cn('text-sm font-medium', location.pathname === '/account' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface')}>Account</Link>
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <NotificationBell />
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold leading-none">{profile?.displayName}</p>
                    <p className="text-xs text-on-surface-variant capitalize">{profile?.role}</p>
                  </div>
                  {user.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      className="w-8 h-8 rounded-full border border-outline-variant cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      alt="Profile"
                      onClick={() => navigate('/account')}
                    />
                  ) : (
                    <button
                      type="button"
                      className={cn(
                        rawButtonVariants({ variant: 'neutral', size: 'icon-sm' }),
                        "text-xs"
                      )}
                      onClick={() => navigate('/account')}
                      aria-label="Open account"
                    >
                      {profile?.displayName?.slice(0, 1)?.toUpperCase() || user.email.slice(0, 1).toUpperCase()}
                    </button>
                  )}
                  <Button variant="ghost" size="sm" onClick={onLogout} className="hidden sm:flex">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate('/signup')}>Sign In</Button>
                  <Button className="rounded-full px-4" onClick={() => navigate('/signup')}>Sign Up</Button>
                </div>
              )}
              <button
                type="button"
                className={cn(rawButtonVariants({ variant: 'neutral', size: 'icon-sm' }), "md:hidden")}
                onClick={onToggleMenu}
              >
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-surface pt-20 px-4 md:hidden"
          >
            <div className="flex flex-col gap-6 text-center">
              <Link to="/" onClick={onCloseMenu} className="text-2xl font-bold">Explore</Link>
              {user ? (
                <>
                  {profile?.role === 'host' && (
                    <Link to="/host" onClick={onCloseMenu} className="text-2xl font-bold">Host Dashboard</Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" onClick={onCloseMenu} className="text-2xl font-bold">Admin Panel</Link>
                  )}
                  {isAdminAccount && !isAdmin && (
                    <Link to="/account" onClick={onCloseMenu} className="text-2xl font-bold text-primary">Return to Admin</Link>
                  )}
                  <Link to="/guest" onClick={onCloseMenu} className="text-2xl font-bold">My Stays</Link>
                  <Link to="/referral" onClick={onCloseMenu} className="text-2xl font-bold">Rewards</Link>
                  <Link to="/account" onClick={onCloseMenu} className="text-2xl font-bold">Account</Link>
                  <button
                    type="button"
                    onClick={onLogout}
                    className={cn(rawButtonVariants({ variant: 'destructive', size: 'lg' }), "justify-center")}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { onCloseMenu(); navigate('/signup'); }}
                    className={cn(rawButtonVariants({ variant: 'neutral', size: 'lg' }), "justify-center")}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { onCloseMenu(); navigate('/signup'); }}
                    className={cn(rawButtonVariants({ variant: 'primary', size: 'lg' }), "justify-center")}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
