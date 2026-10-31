import React, { useState } from 'react';
import {
  Bell,
  Search,
  User,
  Shield,
  BookOpen,
  GraduationCap,
  Users,
  Settings,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onOpenProfile?: () => void;
  onOpenAuthModal?: () => void;
  onNavigate?: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  onOpenProfile,
  onOpenAuthModal,
  onNavigate,
}) => {
  const {
    firebaseUser,
    userProfile,
    activeRole,
    signOut,
    notifications,
    markNotificationRead,
  } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const [showNotifs, setShowNotifs] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const unreadNotifs = notifications.filter((n) => !n.read);

  const roleBadges: Record<UserRole, { label: string; bg: string; text: string; icon: any }> = {
    admin: { label: 'Administrator', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900', text: 'text-red-700 dark:text-red-400', icon: Shield },
    teacher: { label: 'Faculty / Teacher', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900', text: 'text-blue-900 dark:text-blue-300', icon: BookOpen },
    student: { label: 'Student Scholar', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-blue-950 dark:text-blue-300', icon: GraduationCap },
    parent: { label: 'Parent / Guardian', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900', text: 'text-amber-800 dark:text-amber-400', icon: Users },
    guest: { label: 'Guest Visitor', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400', icon: Users },
  };

  const currentBadge = roleBadges[activeRole] || roleBadges.student;
  const RoleIcon = currentBadge.icon;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-blue-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 md:px-8 backdrop-blur-md transition-colors duration-200">
      {/* Search Bar */}
      <div className="flex items-center gap-3 w-72 md:w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search classes, materials, topics..."
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              onSearch?.(e.target.value);
            }}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-1.5 pl-9 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Right controls: Role Status, Admin Button, Theme Toggle, Notifications, User */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Role Status Badge (Only shown when authenticated) */}
        {userProfile ? (
          <div
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold tracking-wide shadow-2xs ${currentBadge.bg} ${currentBadge.text}`}
          >
            <RoleIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{currentBadge.label}</span>
            <span className="sm:hidden">{activeRole.toUpperCase()}</span>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}

        {/* Quick Admin Master Panel Button for Admins */}
        {userProfile && activeRole === 'admin' && (
          <button
            onClick={() => onNavigate?.('admin_panel')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
            title="Open Master Admin Control Panel"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Master Admin Panel</span>
          </button>
        )}

        {/* Global Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-blue-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Notifications
                  </h4>
                  {unreadNotifs.length > 0 && (
                    <span className="rounded-full bg-red-100 dark:bg-red-950 px-2 py-0.5 text-[10px] font-semibold text-red-800 dark:text-red-400">
                      {unreadNotifs.length} new
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    No new notifications right now.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.link) onNavigate?.(n.link);
                        setShowNotifs(false);
                      }}
                      className={`p-3 text-xs cursor-pointer transition-colors hover:bg-blue-50/50 dark:hover:bg-slate-800/60 ${
                        !n.read
                          ? 'bg-blue-50/40 dark:bg-blue-950/20 font-medium'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-blue-950 dark:text-blue-300">{n.title}</p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile (Only shown when authenticated) */}
        {userProfile && (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 rounded-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <img
              src={userProfile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.fullName || 'User')}&background=1e3a8a&color=fff`}
              alt={userProfile?.fullName}
              className="w-8 h-8 rounded-full border border-blue-200 dark:border-slate-700 object-cover"
            />
            <div className="hidden lg:block text-left text-xs">
              <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">{userProfile?.fullName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{userProfile?.email}</p>
            </div>
          </button>
        )}
      </div>
    </header>
  );
};
