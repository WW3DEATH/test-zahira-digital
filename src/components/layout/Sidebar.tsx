import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  FileCheck2,
  CalendarCheck2,
  Calendar,
  Bell,
  MessageSquare,
  MessagesSquare,
  Sparkles,
  Settings,
  Award,
  BookMarked,
  BrainCircuit,
  Lightbulb,
  School,
  ChevronRight,
  LogOut,
  ShieldCheck,
  User,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenAuthModal?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onOpenAuthModal,
  collapsed = false,
}) => {
  const { activeRole, userProfile, signOut } = useAuth();
  const { siteConfig } = useSiteConfig();

  const getNavItems = (role: UserRole): NavItem[] => {
    switch (role) {
      case 'admin':
        return [
          { id: 'admin_panel', label: 'Master Admin Panel', icon: ShieldCheck, highlight: true },
          { id: 'dashboard', label: 'School Overview', icon: LayoutDashboard },
          { id: 'calendar', label: 'Academic Calendar', icon: Calendar },
          { id: 'users_admin', label: 'Users & Roles', icon: Users },
          { id: 'classes', label: 'Classes & Cohorts', icon: GraduationCap },
          { id: 'subjects', label: 'Academic Subjects', icon: BookOpen },
          { id: 'materials', label: 'Learning Materials', icon: BookMarked },
          { id: 'assignments', label: 'Assignments & Grading', icon: FileText },
          { id: 'quizzes', label: 'Quizzes & Tests', icon: FileCheck2 },
          { id: 'assessments', label: 'Marks & Report Cards', icon: Award },
          { id: 'attendance', label: 'School Attendance', icon: CalendarCheck2 },
          { id: 'announcements', label: 'Announcements', icon: Bell },
          { id: 'messages', label: 'Direct Messages', icon: MessageSquare },
          { id: 'discussions', label: 'Community Forums', icon: MessagesSquare },
          { id: 'insights', label: 'AI Performance Insights', icon: BrainCircuit, highlight: true },
          { id: 'settings', label: 'School Settings', icon: Settings },
        ];
      case 'teacher':
        return [
          { id: 'dashboard', label: 'Teacher Dashboard', icon: LayoutDashboard },
          { id: 'calendar', label: 'Calendar & Timetables', icon: Calendar },
          { id: 'classes', label: 'My Classes', icon: GraduationCap },
          { id: 'subjects', label: 'My Subjects', icon: BookOpen },
          { id: 'materials', label: 'Upload Materials', icon: BookMarked },
          { id: 'assignments', label: 'Assignments & Review', icon: FileText },
          { id: 'quizzes', label: 'Quizzes & AI Generator', icon: FileCheck2 },
          { id: 'assessments', label: 'Enter Test Marks', icon: Award },
          { id: 'attendance', label: 'Daily Attendance', icon: CalendarCheck2 },
          { id: 'announcements', label: 'Class Announcements', icon: Bell },
          { id: 'messages', label: 'Student Messages', icon: MessageSquare },
          { id: 'discussions', label: 'Class Discussions', icon: MessagesSquare },
          { id: 'teacher_assistant', label: 'Gemini Teacher Assistant', icon: Sparkles, highlight: true },
          { id: 'insights', label: 'Class Insights', icon: BrainCircuit, highlight: true },
          { id: 'profile', label: 'Faculty Profile', icon: Users },
        ];
      case 'student':
        return [
          { id: 'dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
          { id: 'calendar', label: 'School Calendar', icon: Calendar },
          { id: 'classes', label: 'My Classes', icon: GraduationCap },
          { id: 'materials', label: 'Study Materials', icon: BookMarked },
          { id: 'assignments', label: 'My Assignments', icon: FileText },
          { id: 'quizzes', label: 'Take Quizzes', icon: FileCheck2 },
          { id: 'assessments', label: 'Marks & Report Card', icon: Award },
          { id: 'attendance', label: 'My Attendance', icon: CalendarCheck2 },
          { id: 'announcements', label: 'School Notices', icon: Bell },
          { id: 'messages', label: 'Message Teachers', icon: MessageSquare },
          { id: 'discussions', label: 'Study Groups', icon: MessagesSquare },
          { id: 'tutor', label: 'Socrates AI Tutor', icon: Lightbulb, highlight: true },
          { id: 'profile', label: 'Student Profile', icon: Users },
        ];
      case 'parent':
        return [
          { id: 'dashboard', label: 'Family Dashboard', icon: LayoutDashboard },
          { id: 'calendar', label: 'School Calendar', icon: Calendar },
          { id: 'assessments', label: 'Report Cards & Marks', icon: Award },
          { id: 'attendance', label: 'Child Attendance', icon: CalendarCheck2 },
          { id: 'assignments', label: 'Homework & Deadlines', icon: FileText },
          { id: 'announcements', label: 'School Announcements', icon: Bell },
          { id: 'messages', label: 'Contact Teachers', icon: MessageSquare },
          { id: 'insights', label: 'Academic Insights', icon: BrainCircuit, highlight: true },
          { id: 'profile', label: 'Parent Profile', icon: Users },
        ];
      case 'guest':
      default:
        return [
          { id: 'dashboard', label: 'Portal Overview', icon: LayoutDashboard },
          { id: 'materials', label: 'Study Materials', icon: BookMarked },
          { id: 'calendar', label: 'Academic Calendar', icon: Calendar },
          { id: 'classes', label: 'Cohorts & Subjects', icon: GraduationCap },
          { id: 'announcements', label: 'School Notices', icon: Bell },
        ];
    }
  };

  const navItems = getNavItems(activeRole);

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-200/90 bg-white text-slate-800 transition-all duration-200 select-none shadow-xs ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header - Light Collegiate Blue with Red Crest */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5 bg-white">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
          <School className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-serif text-sm font-bold tracking-tight text-blue-950 truncate">
              {siteConfig.schoolName}
            </h1>
            <p className="text-[10px] font-bold text-red-600 tracking-wider uppercase">
              {siteConfig.cohortName}
            </p>
          </div>
        )}
      </div>

      {/* Role Banner */}
      {!collapsed && (
        <div className="mx-4 mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-blue-900 uppercase">
              {userProfile ? 'Authenticated Account' : 'Portal Access'}
            </span>
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                userProfile ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
          </div>
          <p className="mt-0.5 text-xs font-bold text-blue-950 capitalize">
            {userProfile ? (activeRole === 'admin' ? 'Administrator' : `${activeRole} Portal`) : 'Guest Visitor'}
          </p>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">
            {userProfile ? userProfile.fullName : 'Sign in to access your records'}
          </p>
        </div>
      )}

      {/* Nav List with Custom Scrollbar */}
      <nav className="flex-1 overflow-y-auto sidebar-menu-scroll px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-900 text-white shadow-xs font-bold'
                  : item.highlight
                  ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-blue-950'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                  isActive
                    ? 'text-white'
                    : item.highlight
                    ? 'text-red-600'
                    : 'text-slate-400 group-hover:text-blue-900'
                }`}
              />
              {!collapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}
              {!collapsed && isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-white/80" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Sign Out or Sign In */}
      <div className="border-t border-slate-100 p-3 bg-slate-50/50">
        {userProfile ? (
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-700 transition-colors"
            title="Sign out of account"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 hover:bg-blue-950 px-3 py-2 text-xs font-bold text-white transition-colors shadow-xs"
            title="Sign in to your account"
          >
            <LogIn className="w-4 h-4" />
            {!collapsed && <span>Sign In</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
