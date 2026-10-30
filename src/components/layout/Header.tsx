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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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

  const [showNotifs, setShowNotifs] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const unreadNotifs = notifications.filter((n) => !n.read);

  const roleBadges: Record<UserRole, { label: string; bg: string; text: string; icon: any }> = {
    admin: { label: 'Administrator', bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: Shield },
    teacher: { label: 'Faculty / Teacher', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-900', icon: BookOpen },
    student: { label: 'Student Scholar', bg: 'bg-slate-100 border-slate-200', text: 'text-blue-950', icon: GraduationCap },
    parent: { label: 'Parent / Guardian', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', icon: Users },
  };

  const currentBadge = roleBadges[activeRole] || roleBadges.student;
  const RoleIcon = currentBadge.icon;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-blue-100 bg-white/95 px-4 md:px-8 backdrop-blur-md">
      {/* Search Bar */}
      <div className="flex items-center gap-3 w-72 md:w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search classes, materials, topics..."
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              onSearch?.(e.target.value);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Right controls: Role Status, Admin Button, Notifications, User */}
      <div className="flex items-center gap-2.5">
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

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-blue-950 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-blue-100 bg-white shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">Notifications</h4>
                  {unreadNotifs.length > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800">
                      {unreadNotifs.length} new
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
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
                      className={`p-3 text-xs cursor-pointer transition-colors hover:bg-blue-50/50 ${
                        !n.read ? 'bg-blue-50/40 font-medium' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-blue-950">{n.title}</p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 line-clamp-2">{n.message}</p>
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
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100 transition-colors"
          >
            <img
              src={userProfile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.fullName || 'User')}&background=1e3a8a&color=fff`}
              alt={userProfile?.fullName}
              className="w-8 h-8 rounded-full border border-blue-200 object-cover"
            />
            <div className="hidden lg:block text-left text-xs">
              <p className="font-semibold text-blue-950 leading-tight">{userProfile?.fullName}</p>
              <p className="text-[10px] text-slate-500 capitalize">{userProfile?.email}</p>
            </div>
          </button>
        )}
      </div>
    </header>
  );
};
