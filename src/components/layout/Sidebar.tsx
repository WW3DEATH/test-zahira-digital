import React from 'react';
import {
  LayoutDashboard,
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
  FlaskConical,
  Sparkles,
  CheckCircle2,
  MessagesSquare,
  MessageSquare,
  Users,
  Settings,
  GraduationCap,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  School,
  X,
  Swords,
  Trophy,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { ZahiraLogo } from '../common/ZahiraLogo';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenAuthModal?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onOpenAuthModal,
  collapsed = false,
  onToggleCollapse,
  onCloseMobile,
}) => {
  const { userProfile, activeRole, signOut } = useAuth();
  const { siteConfig } = useSiteConfig();
  const [menuFilter, setMenuFilter] = React.useState('');

  const sections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Home Dashboard', hint: 'Overview, stats & quick shortcuts', icon: LayoutDashboard },
        ...(activeRole === 'admin'
          ? [{ id: 'admin_panel', label: 'Admin Master Panel', hint: 'Full school control & settings', icon: ShieldCheck, badge: 'Admin' }]
          : []),
        ...(activeRole === 'teacher'
          ? [{ id: 'teacher_panel', label: 'Teacher Workspace', hint: 'Classes, grading & faculty tools', icon: ShieldCheck, badge: 'Faculty' }]
          : []),
      ],
    },
    {
      title: 'Competitions & Rankings',
      items: [
        { id: 'pvp_quiz', label: 'PvP Quiz Arena', hint: '1v1 live Gemini AI quiz duels', icon: Swords, badge: 'Live' },
        { id: 'leaderboard', label: 'Leaderboards', hint: 'Top 20 week, month & year', icon: Trophy },
      ],
    },
    {
      title: 'Academic & Classes',
      items: [
        { id: 'classes', label: 'Classes & Cohorts', hint: 'Batch groups & class sessions', icon: GraduationCap },
        { id: 'subjects', label: 'Subjects & Syllabus', hint: 'Physics, Chem, Maths & Bio units', icon: BookOpen },
        { id: 'materials', label: 'Learning Materials', hint: 'Notes, past papers & PDF packs', icon: ShoppingBag },
        { id: 'assignments', label: 'Assignments', hint: 'Tasks, due dates & submissions', icon: FileText },
        { id: 'quizzes', label: 'Quizzes & Tests', hint: 'Practice tests & instant scoring', icon: CheckCircle2 },
        { id: 'assessments', label: 'Marks & Assessments', hint: 'Term exam marks & report PDFs', icon: BarChart3 },
        { id: 'labs', label: 'Virtual Science Labs', hint: 'Interactive science simulations', icon: FlaskConical },
      ],
    },
    {
      title: 'Attendance & Schedule',
      items: [
        { id: 'attendance', label: 'Attendance Register', hint: 'Daily roll-call, QR & Google Calendar', icon: CalendarCheck2 },
        { id: 'calendar', label: 'Academic Calendar', hint: 'Holidays, exams & class schedule', icon: Calendar },
      ],
    },
    {
      title: 'Gemini AI & Communication',
      items: [
        { id: 'tutor', label: 'Gemini AI Tutor', hint: 'Ask any math or science question', icon: Sparkles, badge: 'AI' },
        ...(activeRole === 'teacher' || activeRole === 'admin'
          ? [{ id: 'teacher_assistant', label: 'Teacher AI Assistant', hint: 'Lesson plans, notes & rubrics', icon: BrainCircuit }]
          : []),
        { id: 'messages', label: 'Private Messages', hint: '1-on-1 consultations & requests', icon: MessageSquare },
        { id: 'announcements', label: 'School Notices', hint: 'Official circulars & bulletins', icon: Bell },
        { id: 'discussions', label: 'Discussion Room', hint: 'Live group chat, file uploads & topics', icon: MessagesSquare, badge: 'Chat' },
      ],
    },
    ...(activeRole === 'admin'
      ? [
          {
            title: 'Administration',
            items: [
              { id: 'users_admin', label: 'User Directory', hint: 'Manage students, teachers & IDs', icon: Users },
              { id: 'settings', label: 'Platform Settings', hint: 'Portal configuration & preferences', icon: Settings },
            ],
          },
        ]
      : []),
    {
      title: 'Account & Information',
      items: [
        { id: 'profile', label: 'My Profile', hint: 'Student ID, role & account info', icon: User },
        { id: 'about', label: 'About Us', hint: 'Zahira College AL EM Science project & credits', icon: Info },
      ],
    },
  ];

  const normalizedFilter = menuFilter.trim().toLowerCase();
  const filteredSections = normalizedFilter
    ? sections
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              item.label.toLowerCase().includes(normalizedFilter) ||
              item.hint.toLowerCase().includes(normalizedFilter)
          ),
        }))
        .filter((section) => section.items.length > 0)
    : sections;

  return (
    <aside
      className={`flex flex-col h-full max-h-dvh min-h-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 select-none shrink-0 ${
        collapsed ? 'w-20' : 'w-[84vw] max-w-[300px] md:w-64'
      }`}
    >
      {/* Top Branding Bar inside Sidebar */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <ZahiraLogo size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-blue-950 dark:text-slate-100 truncate">
                {siteConfig.schoolName || 'Zahira College Mawanella'}
              </p>
              <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider truncate">
                {activeRole === 'guest' ? 'Visitor Mode' : `${activeRole} Portal`}
              </p>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex justify-center w-full">
            <ZahiraLogo size="xs" />
          </div>
        )}

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto"
            title="Close Menu"
            aria-label="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Quick Filter & Scroll Hint (especially helpful in mobile left drawer) */}
      {!collapsed && (
        <div className="px-3 pt-2.5 pb-1.5 border-b border-slate-100/80 dark:border-slate-800/80 shrink-0 md:hidden">
          <input
            type="text"
            value={menuFilter}
            onChange={(e) => setMenuFilter(e.target.value)}
            placeholder="Find a page or scroll below..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-500 px-1 pt-1 flex items-center justify-between">
            <span>Scroll menu to choose where to land</span>
            {menuFilter && (
              <button
                type="button"
                onClick={() => setMenuFilter('')}
                className="text-blue-600 dark:text-blue-400 font-semibold"
              >
                Clear
              </button>
            )}
          </p>
        </div>
      )}

      {/* Scrollable Navigation Links with visible Side View Scrollbar */}
      <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y sidebar-menu-scroll side-view-scrollbar px-3 py-3.5 space-y-5">
        {filteredSections.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-slate-400">
            No matching pages found.
          </div>
        ) : (
          filteredSections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setMenuFilter('');
                      }}
                      title={collapsed ? item.label : item.hint}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl text-left text-xs font-semibold transition-all ${
                        collapsed ? 'justify-center' : 'justify-between'
                      } ${
                        isActive
                          ? 'bg-blue-900 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-950 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-red-400' : 'text-slate-400 dark:text-slate-400'
                          }`}
                        />
                        {!collapsed && (
                          <div className="min-w-0">
                            <span className="block truncate leading-snug">{item.label}</span>
                            {onCloseMobile && (
                              <span
                                className={`block md:hidden text-[10px] font-normal truncate mt-0.5 ${
                                  isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                                }`}
                              >
                                {item.hint}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {!collapsed && item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                            isActive
                              ? 'bg-red-600 text-white'
                              : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* Bottom Auth Action Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0 pb-safe">
        {userProfile ? (
          <button
            type="button"
            onClick={signOut}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuthModal}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white transition-colors shadow-xs ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Sign In"
          >
            <LogIn className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign In / Register</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
