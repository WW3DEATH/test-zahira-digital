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
  CheckCheck,
  Trash2,
  FileText,
  CheckCircle2,
  MessageSquare,
  Megaphone,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';
import { requestNotificationPermission } from '../../services/notificationService';

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
    markAllNotificationsRead,
    clearNotification,
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
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    School Notifications
                  </h4>
                  {unreadNotifs.length > 0 && (
                    <span className="rounded-full bg-red-100 dark:bg-red-950 px-2 py-0.5 text-[10px] font-bold text-red-800 dark:text-red-400">
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
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Browser Notification Permission Banner */}
              {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-blue-900 dark:text-blue-200 font-medium">
                    Enable browser alerts for upcoming deadlines
                  </span>
                  <button
                    onClick={async () => {
                      await requestNotificationPermission();
                      setShowNotifs(false);
                      setTimeout(() => setShowNotifs(true), 200);
                    }}
                    className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shrink-0"
                  >
                    Enable
                  </button>
                </div>
              )}

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 opacity-50" />
                    No notifications yet. You're all caught up!
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isAssignment = n.type === 'assignment';
                    const isMaterial = n.type === 'material';
                    const isQuiz = n.type === 'quiz';
                    const isDiscussion = n.type === 'discussion';
                    const isAnnouncement = n.type === 'announcement';
                    const isAttendanceAlert = n.type === 'attendance_alert';
                    const isDirectMessage = n.type === 'message';

                    return (
                      <div
                        key={n.id}
                        className={`p-3.5 text-xs transition-colors flex items-start gap-3 group relative ${
                          !n.read
                            ? 'bg-blue-50/40 dark:bg-blue-950/25 border-l-3 border-blue-600 dark:border-blue-500'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {/* Type Icon Badge */}
                        <div
                          className={`h-8 w-8 rounded-xl shrink-0 flex items-center justify-center ${
                            isAttendanceAlert
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 ring-1 ring-rose-300 dark:ring-rose-800'
                              : isDirectMessage
                              ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                              : isAssignment
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                              : isMaterial
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400'
                              : isQuiz
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : isDiscussion
                              ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400'
                              : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {isAttendanceAlert && <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                          {isDirectMessage && <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                          {isAssignment && <FileText className="w-4 h-4" />}
                          {isMaterial && <BookOpen className="w-4 h-4" />}
                          {isQuiz && <CheckCircle2 className="w-4 h-4" />}
                          {isDiscussion && <MessageSquare className="w-4 h-4" />}
                          {isAnnouncement && <Megaphone className="w-4 h-4" />}
                          {!isAttendanceAlert && !isDirectMessage && !isAssignment && !isMaterial && !isQuiz && !isDiscussion && !isAnnouncement && (
                            <Bell className="w-4 h-4" />
                          )}
                        </div>

                        {/* Content */}
                        <div
                          className="flex-1 cursor-pointer pr-5"
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (n.link) onNavigate?.(n.link);
                            setShowNotifs(false);
                          }}
                        >
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <p
                              className={`font-semibold line-clamp-1 ${
                                !n.read
                                  ? 'text-blue-950 dark:text-blue-200'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {n.title}
                            </p>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                            {n.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            <span>
                              {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} •{' '}
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {n.link && (
                              <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5 group-hover:underline">
                                <span>Go to {n.link}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delete/Dismiss single notification */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(n.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          title="Dismiss notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
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
