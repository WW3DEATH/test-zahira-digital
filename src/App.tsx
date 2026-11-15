import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SiteConfigProvider } from './context/SiteConfigContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { TeacherDashboard } from './components/dashboards/TeacherDashboard';
import { StudentDashboard } from './components/dashboards/StudentDashboard';
import { ParentDashboard } from './components/dashboards/ParentDashboard';
import { GuestPortalLanding } from './components/dashboards/GuestPortalLanding';
import { AdminMasterControlPage } from './pages/AdminMasterControlPage';
import { ClassesPage } from './pages/ClassesPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { QuizzesPage } from './pages/QuizzesPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { AttendancePage } from './pages/AttendancePage';
import { CalendarPage } from './pages/CalendarPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { MessagesPage } from './pages/MessagesPage';
import { DiscussionsPage } from './pages/DiscussionsPage';
import { TutorPage } from './pages/TutorPage';
import { TeacherAssistantPage } from './pages/TeacherAssistantPage';
import { UsersAdminPage } from './pages/UsersAdminPage';
import { TeacherPanelPage } from './pages/TeacherPanelPage';
import { ScienceLabsPage } from './pages/ScienceLabsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { PvPQuizArenaPage } from './pages/PvPQuizArenaPage';
import { AboutUsPage } from './pages/AboutUsPage';
import { AuthModal } from './components/common/AuthModal';
import { StudentAIChatWidget } from './components/common/StudentAIChatWidget';
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  MessageSquare,
  Menu,
} from 'lucide-react';

const MainApp: React.FC = () => {
  const { activeRole, userProfile } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [tutorInitialTopic, setTutorInitialTopic] = useState<string>('');

  // Close authentication modal as soon as user is authenticated
  useEffect(() => {
    if (userProfile && authModalOpen) {
      setAuthModalOpen(false);
    }
  }, [userProfile, authModalOpen]);

  const handleLaunchTutorTopic = (topic: string) => {
    setTutorInitialTopic(topic);
    setCurrentPage('tutor');
  };

  const renderRoleDashboard = () => {
    if (!userProfile) {
      return (
        <GuestPortalLanding
          onOpenAuthModal={() => setAuthModalOpen(true)}
          onNavigate={setCurrentPage}
        />
      );
    }
    if (activeRole === 'admin') {
      return <AdminDashboard onNavigate={setCurrentPage} />;
    }
    if (activeRole === 'teacher') {
      return <TeacherDashboard onNavigate={setCurrentPage} />;
    }
    if (activeRole === 'parent') {
      return <ParentDashboard onNavigate={setCurrentPage} />;
    }
    return (
      <StudentDashboard
        onNavigate={setCurrentPage}
        onLaunchTutorTopic={handleLaunchTutorTopic}
      />
    );
  };

  const renderCurrentPage = () => {
    if (currentPage === 'admin_panel' || currentPage.startsWith('admin_panel:')) {
      const subTab = currentPage.includes(':')
        ? (currentPage.split(':')[1] as any)
        : 'branding';
      return activeRole === 'admin' ? (
        <AdminMasterControlPage
          key={subTab}
          initialTab={subTab}
          onNavigate={setCurrentPage}
        />
      ) : (
        renderRoleDashboard()
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return renderRoleDashboard();

      case 'teacher_panel':
        return userProfile && (activeRole === 'teacher' || activeRole === 'admin') ? (
          <TeacherPanelPage onNavigate={setCurrentPage} />
        ) : (
          renderRoleDashboard()
        );

      case 'classes':
        return <ClassesPage />;
      case 'subjects':
        return <SubjectsPage />;
      case 'labs':
        return <ScienceLabsPage />;
      case 'materials':
        return <MaterialsPage />;
      case 'assignments':
        return <AssignmentsPage />;
      case 'quizzes':
        return <QuizzesPage />;
      case 'pvp_quiz':
        return (
          <PvPQuizArenaPage
            initialTab="arena"
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
        );
      case 'leaderboard':
        return (
          <PvPQuizArenaPage
            initialTab="leaderboard"
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
        );
      case 'assessments':
        return <AssessmentsPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'calendar':
        return <CalendarPage initialTab="attendance" />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'messages':
        return <MessagesPage />;
      case 'discussions':
        return <DiscussionsPage onOpenAuthModal={() => setAuthModalOpen(true)} />;
      case 'tutor':
        return <TutorPage initialTopic={tutorInitialTopic} />;
      case 'teacher_assistant':
        return userProfile && (activeRole === 'teacher' || activeRole === 'admin') ? (
          <TeacherAssistantPage />
        ) : (
          renderRoleDashboard()
        );
      case 'insights':
        return renderRoleDashboard();
      case 'users_admin':
        return userProfile && activeRole === 'admin' ? (
          <UsersAdminPage />
        ) : (
          renderRoleDashboard()
        );
      case 'profile':
        return <ProfilePage />;
      case 'about':
        return <AboutUsPage onNavigate={setCurrentPage} />;
      case 'settings':
        return userProfile && activeRole === 'admin' ? (
          <SettingsPage />
        ) : (
          renderRoleDashboard()
        );
      default:
        return renderRoleDashboard();
    }
  };

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors duration-200">
      {/* 1. TOP HEADER */}
      <Header
        onOpenProfile={() => setCurrentPage('profile')}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onNavigate={setCurrentPage}
        onToggleMobileMenu={() => setMobileNavOpen(!mobileNavOpen)}
      />

      {/* 2. BODY CONTAINER: DOCKED COLLEGIATE SIDEBAR + MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden w-full min-w-0">
        {/* Desktop Docked Sidebar */}
        <div className="hidden md:flex shrink-0 h-full">
          <Sidebar
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onOpenAuthModal={() => setAuthModalOpen(true)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile Off-Canvas Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden h-dvh">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative flex flex-col h-full max-h-dvh min-h-0 z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
              <Sidebar
                currentPage={currentPage}
                onNavigate={(page) => {
                  setCurrentPage(page);
                  setMobileNavOpen(false);
                }}
                onOpenAuthModal={() => {
                  setAuthModalOpen(true);
                  setMobileNavOpen(false);
                }}
                onCloseMobile={() => setMobileNavOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-6 lg:px-8 py-4 sm:py-6 w-full min-w-0">
          <div className="mx-auto max-w-7xl pb-24 md:pb-10 w-full min-w-0 space-y-10">
            {renderCurrentPage()}

            <footer className="border-t border-slate-200/80 dark:border-slate-800 pt-5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <p>
                &copy; {new Date().getFullYear()} M. N. M. Jaasim · Zahira College Mawanella AL EM Science Project
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentPage('about')}
                  className="font-semibold text-blue-900 dark:text-blue-400 hover:underline underline-offset-4"
                >
                  About Us &amp; Copyrights
                </button>
                <a
                  href="https://www.linkedin.com/in/m-n-m-jaasim-9ab879380/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:underline underline-offset-4"
                >
                  Developer LinkedIn
                </a>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Thumb Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe shadow-lg"
      >
        <div className="grid grid-cols-5 items-center h-14 px-1">
          {[
            { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
            { id: 'calendar', label: 'Calendar', icon: Calendar },
            { id: 'tutor', label: 'Gemini AI', icon: Sparkles },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl transition-colors ${
                  isActive
                    ? 'text-blue-900 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-red-600 dark:text-red-400' : ''}`} />
                <span className="text-[10px] leading-tight mt-0.5 truncate max-w-full px-0.5">
                  {item.label}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] leading-tight mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Floating AI Chat Widget */}
      <StudentAIChatWidget onNavigate={setCurrentPage} />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SiteConfigProvider>
          <MainApp />
        </SiteConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
