import React, { useState } from 'react';
import {
  Home,
  ShieldCheck,
  CalendarCheck2,
  Calendar,
  BookOpen,
  FileText,
  BarChart3,
  ShoppingBag,
  Bell,
  User,
  LogOut,
  LogIn,
  LayoutGrid,
  FlaskConical,
  Sparkles,
  CheckCircle2,
  MessagesSquare,
  MessageSquare,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenAuthModal?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onOpenAuthModal,
}) => {
  const { userProfile, activeRole, signOut } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Directly accessible squircle buttons in the floating capsule
  const primaryButtons = [
    {
      id: 'dashboard',
      label: 'Home Dashboard',
      icon: Home,
      gradient: 'from-[#00b4d8] via-[#0096c7] to-[#0077b6]',
      activeGlow: 'ring-2 ring-sky-400 ring-offset-2 dark:ring-offset-slate-900',
    },
    ...(activeRole === 'admin'
      ? [
          {
            id: 'admin_panel',
            label: 'Admin Master Panel',
            icon: ShieldCheck,
            gradient: 'from-[#4f46e5] via-[#4338ca] to-[#312e81]',
            activeGlow: 'ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900',
          },
        ]
      : activeRole === 'teacher'
      ? [
          {
            id: 'teacher_panel',
            label: 'Teacher Workspace',
            icon: ShieldCheck,
            gradient: 'from-[#4f46e5] via-[#4338ca] to-[#312e81]',
            activeGlow: 'ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900',
          },
        ]
      : []),
    {
      id: 'messages',
      label: 'Private Messages',
      icon: MessageSquare,
      gradient: 'from-[#6366f1] via-[#4f46e5] to-[#4338ca]',
      activeGlow: 'ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900',
    },
    {
      id: 'calendar',
      label: 'Calendar & Timetable',
      icon: CalendarCheck2,
      gradient: 'from-[#0284c7] to-[#0369a1]',
      activeGlow: 'ring-2 ring-cyan-400 ring-offset-2 dark:ring-offset-slate-900',
    },
    {
      id: 'classes',
      label: 'Classes & Cohorts',
      icon: BookOpen,
      gradient: 'from-[#10b981] to-[#059669]',
      activeGlow: 'ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900',
    },
    {
      id: 'assignments',
      label: 'Papers & Coursework',
      icon: FileText,
      gradient: 'from-[#22c55e] to-[#16a34a]',
      activeGlow: 'ring-2 ring-green-400 ring-offset-2 dark:ring-offset-slate-900',
    },
    {
      id: 'assessments',
      label: 'Marks & Assessments',
      icon: BarChart3,
      gradient: 'from-[#ec4899] to-[#d946ef]',
      activeGlow: 'ring-2 ring-pink-400 ring-offset-2 dark:ring-offset-slate-900',
    },
    {
      id: 'materials',
      label: 'Store & Materials',
      icon: ShoppingBag,
      gradient: 'from-[#8b5cf6] to-[#6366f1]',
      activeGlow: 'ring-2 ring-purple-400 ring-offset-2 dark:ring-offset-slate-900',
    },
    {
      id: 'announcements',
      label: 'School Notices',
      icon: Bell,
      gradient: 'from-[#f59e0b] to-[#ea580c]',
      activeGlow: 'ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-slate-900',
    },
    {
      id: 'profile',
      label: 'User Profile',
      icon: User,
      gradient: 'from-[#eab308] to-[#ca8a04]',
      activeGlow: 'ring-2 ring-yellow-400 ring-offset-2 dark:ring-offset-slate-900',
    },
  ];

  const moreTools = [
    { id: 'labs', label: 'Virtual Science Labs', icon: FlaskConical, desc: 'Interactive practical simulations' },
    { id: 'tutor', label: 'Socrates AI Tutor', icon: Sparkles, desc: 'Step-by-step problem solver' },
    { id: 'attendance', label: 'Daily Roll-Call & QR', icon: CalendarCheck2, desc: 'Attendance register' },
    { id: 'quizzes', label: 'Quizzes & Tests', icon: CheckCircle2, desc: 'Self-assessment tests' },
    { id: 'discussions', label: 'Discussion Forums', icon: MessagesSquare, desc: 'Peer study circles' },
    { id: 'messages', label: 'Direct Messages', icon: MessageSquare, desc: 'Contact faculty' },
  ];

  const handleLogoutOrLogin = () => {
    if (userProfile) {
      signOut();
    } else {
      onOpenAuthModal?.();
    }
  };

  return (
    <aside className="relative flex flex-col items-center select-none py-2 px-1">
      {/* Floating Capsule Container with side view scroll bar */}
      <div className="w-14 sm:w-16 max-h-[calc(100vh-5.5rem)] overflow-y-auto side-view-scrollbar rounded-[28px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 sm:p-2.5 shadow-lg shadow-slate-200/50 dark:shadow-none flex flex-col items-center gap-2 sm:gap-2.5 transition-all duration-200">
        {/* Primary Buttons */}
        {primaryButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = currentPage === btn.id;

          return (
            <div key={btn.id} className="relative group">
              <button
                onClick={() => {
                  onNavigate(btn.id);
                  setShowMoreMenu(false);
                }}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-b ${
                  btn.gradient
                } flex items-center justify-center text-white shadow-xs transition-all duration-150 transform hover:scale-105 active:scale-95 ${
                  isActive ? btn.activeGlow : 'hover:opacity-95'
                }`}
                title={btn.label}
                aria-label={btn.label}
              >
                <Icon className="w-5 h-5 drop-shadow-xs" />
              </button>

              {/* Tooltip on Hover */}
              <div className="hidden md:group-hover:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap shadow-xl pointer-events-none items-center gap-1.5 animate-in fade-in zoom-in-95">
                <span>{btn.label}</span>
              </div>
            </div>
          );
        })}

        {/* Exit / Logout Button */}
        <div className="relative group">
          <button
            onClick={handleLogoutOrLogin}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-b from-[#ef4444] to-[#dc2626] flex items-center justify-center text-white shadow-xs transition-all duration-150 transform hover:scale-105 active:scale-95 hover:opacity-95"
            title={userProfile ? 'Sign Out' : 'Sign In'}
            aria-label={userProfile ? 'Sign Out' : 'Sign In'}
          >
            {userProfile ? (
              <LogOut className="w-5 h-5 drop-shadow-xs" />
            ) : (
              <LogIn className="w-5 h-5 drop-shadow-xs" />
            )}
          </button>
          <div className="hidden md:group-hover:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap shadow-xl pointer-events-none items-center gap-1.5 animate-in fade-in zoom-in-95">
            <span>{userProfile ? 'Sign Out' : 'Sign In'}</span>
          </div>
        </div>

        {/* More Tools Drawer */}
        <div className="relative group pt-1 border-t border-slate-100 dark:border-slate-800 w-full flex justify-center">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              showMoreMenu
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="More Modules & Labs"
            aria-label="More modules"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          <div className="hidden md:group-hover:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap shadow-xl pointer-events-none items-center gap-1.5 animate-in fade-in zoom-in-95">
            <span>More Modules & Labs</span>
          </div>
        </div>
      </div>

      {/* Floating More Tools Popover Modal */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  More Science Modules
                </h3>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-1.5 max-h-80 overflow-y-auto">
              {moreTools.map((t) => {
                const ToolIcon = t.icon;
                const isSelected = currentPage === t.id;

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      onNavigate(t.id);
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                      <ToolIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {t.label}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {t.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
