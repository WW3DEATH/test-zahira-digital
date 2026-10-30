import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SiteConfigProvider, useSiteConfig } from './context/SiteConfigContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
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
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthModal } from './components/common/AuthModal';
import { Megaphone } from 'lucide-react';

const MainApp: React.FC = () => {
  const { activeRole, userProfile } = useAuth();
  const { siteConfig } = useSiteConfig();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [tutorInitialTopic, setTutorInitialTopic] = useState<string>('');

  const handleLaunchTutorTopic = (topic: string) => {
    setTutorInitialTopic(topic);
    setCurrentPage('tutor');
  };

  const renderCurrentPage = () => {
    // If not authenticated, restrict protected dashboards and admin panels to guest landing
    if (!userProfile) {
      if (
        currentPage === 'dashboard' ||
        currentPage === 'admin_panel' ||
        currentPage === 'users_admin' ||
        currentPage === 'settings' ||
        currentPage === 'profile'
      ) {
        return (
          <GuestPortalLanding
            onOpenAuthModal={() => setAuthModalOpen(true)}
            onNavigate={setCurrentPage}
          />
        );
      }
    }

    switch (currentPage) {
      case 'dashboard':
        if (activeRole === 'admin') return <AdminDashboard onNavigate={setCurrentPage} />;
        if (activeRole === 'teacher') return <TeacherDashboard onNavigate={setCurrentPage} />;
        if (activeRole === 'student') return <StudentDashboard onNavigate={setCurrentPage} onLaunchTutorTopic={handleLaunchTutorTopic} />;
        return (
          <GuestPortalLanding
            onOpenAuthModal={() => setAuthModalOpen(true)}
            onNavigate={setCurrentPage}
          />
        );

      case 'admin_panel':
        return userProfile && activeRole === 'admin' ? (
          <AdminMasterControlPage />
        ) : (
          <GuestPortalLanding
            onOpenAuthModal={() => setAuthModalOpen(true)}
            onNavigate={setCurrentPage}
          />
        );

      case 'classes':
        return <ClassesPage />;
      case 'subjects':
        return <SubjectsPage />;
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
        return <CalendarPage />;
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
        return (
          <GuestPortalLanding
            onOpenAuthModal={() => setAuthModalOpen(true)}
            onNavigate={setCurrentPage}
          />
        );
      case 'users_admin':
        return userProfile && activeRole === 'admin' ? (
          <UsersAdminPage />
        ) : (
          <GuestPortalLanding
            onOpenAuthModal={() => setAuthModalOpen(true)}
            onNavigate={setCurrentPage}
          />
        );
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return userProfile && activeRole === 'admin' ? (
          <SettingsPage />
        ) : (
          <GuestPortalLanding
            onOpenAuthModal={() => setAuthModalOpen(true)}
            onNavigate={setCurrentPage}
          />
        );
      default:
        return userProfile ? (
          <AdminDashboard onNavigate={setCurrentPage} />
        ) : (
          <GuestPortalLanding
            onOpenAuthModal={() => setAuthModalOpen(true)}
            onNavigate={setCurrentPage}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar in Light Theme with Custom Scrollbar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Marquee Announcement Bar (Blue, White, Red theme) */}
        {siteConfig.showMarquee && siteConfig.marqueeNotice && (
          <div className="bg-blue-900 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between border-b border-blue-950 shadow-xs z-40">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shrink-0">
                <Megaphone className="w-3 h-3" />
                <span>Notice</span>
              </span>
              <span className="truncate text-blue-100 font-medium">
                {siteConfig.marqueeNotice}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-3 text-[11px] text-blue-200 shrink-0">
              <span className="font-bold text-white">{siteConfig.schoolName}</span>
              <span>•</span>
              <span className="text-red-400 font-semibold">{siteConfig.cohortName}</span>
            </div>
          </div>
        )}

        <Header
          onOpenProfile={() => setCurrentPage('profile')}
          onOpenAuthModal={() => setAuthModalOpen(true)}
          onNavigate={setCurrentPage}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          <div className="mx-auto max-w-7xl pb-12">
            {renderCurrentPage()}
          </div>
        </main>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SiteConfigProvider>
        <MainApp />
      </SiteConfigProvider>
    </AuthProvider>
  );
}
