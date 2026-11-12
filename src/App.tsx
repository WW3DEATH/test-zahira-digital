import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SiteConfigProvider, useSiteConfig } from './context/SiteConfigContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ZNCDashboard } from './components/dashboards/ZNCDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { TeacherDashboard } from './components/dashboards/TeacherDashboard';
import { StudentDashboard } from './components/dashboards/StudentDashboard';
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
import { AuthModal } from './components/common/AuthModal';
import { StudentAIChatWidget } from './components/common/StudentAIChatWidget';
import { Megaphone } from 'lucide-react';

const MainApp: React.FC = () => {
  const { activeRole, userProfile } = useAuth();
  const { siteConfig } = useSiteConfig();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
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

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <ZNCDashboard
            onNavigate={setCurrentPage}
            onLaunchTutorTopic={handleLaunchTutorTopic}
          />
        );

      case 'admin_panel':
        return activeRole === 'admin' ? (
          <AdminMasterControlPage />
        ) : (
          <ZNCDashboard
            onNavigate={setCurrentPage}
            onLaunchTutorTopic={handleLaunchTutorTopic}
          />
        );

      case 'teacher_panel':
        return userProfile && (activeRole === 'teacher' || activeRole === 'admin') ? (
          <TeacherPanelPage onNavigate={setCurrentPage} />
        ) : (
          <ZNCDashboard
            onNavigate={setCurrentPage}
            onLaunchTutorTopic={handleLaunchTutorTopic}
          />
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
        return <DiscussionsPage />;
      case 'tutor':
        return <TutorPage initialTopic={tutorInitialTopic} />;
      case 'teacher_assistant':
        return <TeacherAssistantPage />;
      case 'insights':
        if (activeRole === 'teacher') return <TeacherDashboard onNavigate={setCurrentPage} />;
        if (activeRole === 'student') return <StudentDashboard onNavigate={setCurrentPage} onLaunchTutorTopic={handleLaunchTutorTopic} />;
        if (activeRole === 'admin') return <AdminDashboard onNavigate={setCurrentPage} />;
        return <ZNCDashboard onNavigate={setCurrentPage} onLaunchTutorTopic={handleLaunchTutorTopic} />;
      case 'users_admin':
        return userProfile && activeRole === 'admin' ? (
          <UsersAdminPage />
        ) : (
          <ZNCDashboard
            onNavigate={setCurrentPage}
            onLaunchTutorTopic={handleLaunchTutorTopic}
          />
        );
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return userProfile && activeRole === 'admin' ? (
          <SettingsPage />
        ) : (
          <ZNCDashboard
            onNavigate={setCurrentPage}
            onLaunchTutorTopic={handleLaunchTutorTopic}
          />
        );
      default:
        return (
          <ZNCDashboard
            onNavigate={setCurrentPage}
            onLaunchTutorTopic={handleLaunchTutorTopic}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f4f7fa] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors duration-200">
      {/* 1. TOP HEADER (Spans Across Top) */}
      <Header
        onOpenProfile={() => setCurrentPage('profile')}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onNavigate={setCurrentPage}
        onToggleMobileMenu={() => setMobileNavOpen(!mobileNavOpen)}
      />

      {/* 2. BODY CONTAINER: FLOATING CAPSULE SIDEBAR + MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden w-full">
        {/* Desktop Floating Vertical Capsule Sidebar (Detached with smooth margins) */}
        <div className="hidden md:flex shrink-0 items-start pl-3 sm:pl-5 py-4">
          <Sidebar
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
        </div>

        {/* Mobile Off-Canvas Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative flex flex-col p-4 bg-transparent z-10 animate-in slide-in-from-left duration-200">
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
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 w-full min-w-0">
          <div className="mx-auto max-w-7xl pb-12 w-full">
            {renderCurrentPage()}
          </div>
        </main>
      </div>

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
