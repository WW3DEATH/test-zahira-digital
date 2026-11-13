import React, { useState } from 'react';
import {
  Bell,
  Search,
  User,
  ShieldCheck,
  CalendarCheck2,
  Sun,
  Moon,
  CheckCheck,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ZahiraLogo } from '../common/ZahiraLogo';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onOpenProfile?: () => void;
  onOpenAuthModal?: () => void;
  onNavigate?: (page: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  onOpenProfile,
  onOpenAuthModal,
  onNavigate,
  onToggleMobileMenu,
}) => {
  const {
    userProfile,
    activeRole,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [showNotifs, setShowNotifs] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const unreadNotifs = notifications.filter((n) => !n.read);

  // Compute Initials for Avatar Badge
  const displayName =
    userProfile?.fullName ||
    (activeRole === 'admin' ? 'Administrator' : activeRole === 'teacher' ? 'Faculty Lead' : 'Student Scholar');
  const getInitials = (name: string) => {
    const clean = name.replace(/[^a-zA-Z\s]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'ZS';
  };
  const initials = getInitials(displayName);

  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 w-full items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 sm:px-6 md:px-8 transition-colors select-none shadow-2xs">
      {/* LEFT: MOBILE MENU BUTTON + ZNC SCIENCE PROJECT BRANDING */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden min-h-[44px] min-w-[44px] px-2.5 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-900 dark:hover:text-white active:scale-95 transition-all shrink-0 shadow-2xs"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[11px] font-bold hidden min-[400px]:inline">Menu</span>
          </button>
        )}

        <div
          onClick={() => onNavigate?.('dashboard')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group min-w-0"
          title="Zahira College Mawanella • ZNC Science Project"
        >
          {/* Official Zahira College Mawanella Crest */}
          <ZahiraLogo size="sm" className="group-hover:scale-105 transition-transform" />

          <div className="flex flex-col min-w-0">
            <span className="font-serif text-sm sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none truncate">
              ZNC Science Project
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-red-600 dark:text-red-400 tracking-wider uppercase mt-0.5 truncate">
              Zahira College Mawanella · 2k28 Science EM
            </span>
          </div>
        </div>
      </div>

      {/* CENTER / RIGHT ACTION SHORTCUTS: ROLE-RESTRICTED CONTROLS */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Prominent Admin Master Panel Button - Strictly for Admin Only */}
        {activeRole === 'admin' ? (
          <button
            onClick={() => onNavigate?.('admin_panel')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white px-2.5 sm:px-3 py-1.5 min-h-[36px] text-xs font-bold transition-all shadow-xs"
            title="Open Faculty & Administration Master Control Panel"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Admin Panel</span>
          </button>
        ) : activeRole === 'teacher' ? (
          <button
            onClick={() => onNavigate?.('teacher_panel')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white px-2.5 sm:px-3 py-1.5 min-h-[36px] text-xs font-bold transition-all shadow-xs"
            title="Open Teacher Workspace"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Teacher Panel</span>
          </button>
        ) : null}

        {/* Calendar & Mark Attendance Button - Visible to Teacher and Admin */}
        {(activeRole === 'admin' || activeRole === 'teacher') && (
          <button
            onClick={() => onNavigate?.('calendar')}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 min-h-[36px] text-xs font-bold transition-all shadow-xs"
            title="Open Academic Calendar to Mark Student Attendance"
          >
            <CalendarCheck2 className="w-4 h-4 text-white" />
            <span className="hidden md:inline">Calendar & Attendance</span>
          </button>
        )}

        {/* Global Dark Mode Switcher */}
        <button
          onClick={toggleTheme}
          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="School Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 stroke-[1.8]" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifs && (
            <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    School Notifications
                  </h4>
                  {unreadNotifs.length > 0 && (
                    <span className="rounded-full bg-red-100 dark:bg-red-950 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-400">
                      {unreadNotifs.length} new
                    </span>
                  )}
                </div>

                {unreadNotifs.length > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead()}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark read</span>
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No new notifications. You're up to date!
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
                      className="p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex items-start gap-2.5"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                          {n.title}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Name + Round Initial Avatar Badge (MJ) */}
        {userProfile ? (
          <div
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 cursor-pointer p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`${displayName} • View Profile`}
          >
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">
              {displayName}
            </span>
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center border border-slate-300 dark:border-slate-600 shadow-2xs">
              {initials}
            </div>
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
      </div>
    </header>
  );
};
