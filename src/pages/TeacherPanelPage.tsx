import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Bell,
  Plus,
  Trash2,
  Search,
  School,
  CheckCircle2,
  Calendar,
  BookOpen,
  Filter,
  Shield,
  FileText,
  AlertCircle,
  Megaphone,
  Pin,
  X,
  Mail,
  Phone,
  Tag,
} from 'lucide-react';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { SchoolClass, UserProfile, Announcement, UserRole } from '../types';
import { SEED_CLASSES } from '../services/dataService';

interface TeacherPanelPageProps {
  onNavigate?: (page: string) => void;
}

export const TeacherPanelPage: React.FC<TeacherPanelPageProps> = ({ onNavigate }) => {
  const { userProfile, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'classes' | 'users' | 'notices'>('classes');

  // 1. Classes State
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);
  const [isDeletingClass, setIsDeletingClass] = useState(false);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [classNameInput, setClassNameInput] = useState('');
  const [classGradeInput, setClassGradeInput] = useState('A/L Batch 2028');
  const [classYearInput, setClassYearInput] = useState('2026-2028');
  const [classRoomInput, setClassRoomInput] = useState('Science Complex - Hall 28');
  const [classDescInput, setClassDescInput] = useState('');
  const [savingClass, setSavingClass] = useState(false);

  // 2. Users Directory State (View Only)
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'student' | 'teacher' | 'parent'>('all');

  // 3. Notices State
  const [notices, setNotices] = useState<Announcement[]>([]);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeAudience, setNoticeAudience] = useState<'all' | 'students' | 'parents' | 'teachers'>('all');
  const [noticePinned, setNoticePinned] = useState(false);
  const [postingNotice, setPostingNotice] = useState(false);
  const [noticeSuccessMessage, setNoticeSuccessMessage] = useState<string | null>(null);

  // Real-time listener for classes
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'classes'),
      (snap) => {
        const list: SchoolClass[] = [];
        snap.forEach((d) => list.push(d.data() as SchoolClass));
        setClasses(list);
        if (list.length > 0) {
          if (!selectedClass || !list.some((c) => c.id === selectedClass.id)) {
            setSelectedClass(list[0]);
          }
        } else {
          setSelectedClass(null);
        }
      },
      (err) => {
        console.warn('Classes listener warning:', err);
        setClasses([]);
        setSelectedClass(null);
      }
    );
    return () => unsub();
  }, [selectedClass]);

  // Real-time listener for users directory
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'userProfiles'),
      (snap) => {
        const list: UserProfile[] = [];
        snap.forEach((d) => {
          const u = d.data() as UserProfile;
          // Filter out any admin accounts from being shown to users
          if (u.role !== 'admin') {
            list.push(u);
          }
        });
        setUsers(list);
      },
      (err) => {
        console.warn('Users listener warning:', err);
      }
    );
    return () => unsub();
  }, []);

  // Real-time listener for announcements
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'announcements'),
      (snap) => {
        const list: Announcement[] = [];
        snap.forEach((d) => list.push(d.data() as Announcement));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotices(list);
      },
      (err) => {
        console.warn('Announcements listener warning:', err);
      }
    );
    return () => unsub();
  }, []);

  // Class Management Handlers
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) return;

    setSavingClass(true);
    try {
      const classId = `class-${Date.now()}`;
      const newClass: SchoolClass = {
        id: classId,
        name: classNameInput.trim(),
        grade: classGradeInput.trim(),
        academicYear: classYearInput.trim(),
        description: classDescInput.trim() || 'Zahira College Science Cohort',
        room: classRoomInput.trim() || 'Science Complex - Hall 28',
        teacherIds: [userProfile?.userId || 'teacher_kareem'],
        studentIds: [],
        subjectIds: ['sub-cmath', 'sub-phys', 'sub-chem', 'sub-bio', 'sub-ict', 'sub-eng'],
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'classes', classId), newClass);
      setIsAddClassModalOpen(false);
      setClassNameInput('');
      setClassDescInput('');
      setSelectedClass(newClass);
      setNoticeSuccessMessage(`Created class cohort "${newClass.name}".`);
      setTimeout(() => setNoticeSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Error creating class:', err);
      setNoticeSuccessMessage(`Failed to create class cohort: ${err.message}`);
      setTimeout(() => setNoticeSuccessMessage(null), 4000);
    } finally {
      setSavingClass(false);
    }
  };

  const confirmDeleteClass = async () => {
    if (!classToDelete) return;
    const targetId = classToDelete.id;
    const targetName = classToDelete.name;
    setIsDeletingClass(true);

    try {
      // Optimistically remove from state
      setClasses((prev) => prev.filter((c) => c.id !== targetId));
      if (selectedClass?.id === targetId) {
        const remaining = classes.filter((c) => c.id !== targetId);
        setSelectedClass(remaining.length > 0 ? remaining[0] : null);
      }
      // Delete from Firestore
      await deleteDoc(doc(db, 'classes', targetId));
      setClassToDelete(null);
      setNoticeSuccessMessage(`Class cohort "${targetName}" removed successfully.`);
      setTimeout(() => setNoticeSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error('Error deleting class:', err);
      setNoticeSuccessMessage(`Failed to remove class cohort: ${err.message}`);
      setTimeout(() => setNoticeSuccessMessage(null), 4000);
    } finally {
      setIsDeletingClass(false);
    }
  };

  // Notices Handlers
  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    setPostingNotice(true);
    try {
      const noticeId = `ann-${Date.now()}`;
      const newNotice: Announcement = {
        id: noticeId,
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        authorId: userProfile?.userId || 'teacher_faculty',
        authorName: userProfile?.fullName || 'Academic Faculty Lead',
        authorRole: 'teacher',
        audience: noticeAudience,
        isPinned: noticePinned,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'announcements', noticeId), newNotice);
      setNoticeTitle('');
      setNoticeContent('');
      setNoticePinned(false);
      setNoticeSuccessMessage(`Published notice: "${newNotice.title}"`);
      setTimeout(() => setNoticeSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Error posting notice:', err);
      setNoticeSuccessMessage(`Failed to post notice: ${err.message}`);
      setTimeout(() => setNoticeSuccessMessage(null), 4000);
    } finally {
      setPostingNotice(false);
    }
  };

  const [confirmDeleteNoticeId, setConfirmDeleteNoticeId] = useState<string | null>(null);

  const handleDeleteNotice = async (noticeId: string) => {
    try {
      setNotices((prev) => prev.filter((n) => n.id !== noticeId));
      setConfirmDeleteNoticeId(null);
      await deleteDoc(doc(db, 'announcements', noticeId));
      setNoticeSuccessMessage('Notice deleted from interface and Firebase.');
      setTimeout(() => setNoticeSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error deleting notice:', err);
      setNoticeSuccessMessage(`Failed to delete notice: ${err.message}`);
      setTimeout(() => setNoticeSuccessMessage(null), 4000);
    }
  };

  // Filter Users
  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    const q = userSearchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.bio && u.bio.toLowerCase().includes(q)) ||
      (u.stream && u.stream.toLowerCase().includes(q)) ||
      (u.subject && u.subject.toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  const studentsCount = users.filter((u) => u.role === 'student').length;
  const teachersCount = users.filter((u) => u.role === 'teacher').length;
  const parentsCount = users.filter((u) => u.role === 'parent').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="rounded-3xl border border-blue-900/30 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-3">
              <School className="w-3.5 h-3.5 text-blue-400" />
              <span>Zahira College Mawanella • Teacher Faculty Portal</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-white">
              Teacher Faculty Management Panel
            </h1>
            <p className="text-xs md:text-sm text-blue-200/90 mt-2 max-w-2xl leading-relaxed">
              Dedicated teacher workstation: add and remove class cohorts, view the complete school user directory, and publish official academic notices for scholars and parents.
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab('classes');
                setIsAddClassModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class Cohort</span>
            </button>
          </div>
        </div>

        {/* Success toast notification */}
        {noticeSuccessMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{noticeSuccessMessage}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'classes'
                ? 'bg-white text-blue-950 shadow-md'
                : 'text-blue-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Class Cohorts ({classes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-white text-blue-950 shadow-md'
                : 'text-blue-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>View Users ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'notices'
                ? 'bg-white text-blue-950 shadow-md'
                : 'text-blue-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Publish Notices ({notices.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: CLASS COHORTS MANAGEMENT (ADD & REMOVE)
          ========================================================================= */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Classes List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Academic Cohorts ({classes.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select a class to review details or remove cohort
                  </p>
                </div>

                <button
                  onClick={() => setIsAddClassModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Class</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1 sidebar-menu-scroll">
                {classes.map((cls) => {
                  const isSelected = selectedClass?.id === cls.id;
                  return (
                    <div
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                              {cls.grade}
                            </span>
                            <span className="text-[10px] text-slate-400">{cls.academicYear}</span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{cls.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                            <span>Room:</span>
                            <strong className="text-slate-700 dark:text-slate-300 font-normal">{cls.room}</strong>
                          </p>
                        </div>

                        {/* Delete Button for Teachers & Admin */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setClassToDelete(cls);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title={`Remove ${cls.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {classes.length === 0 && (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 space-y-2">
                    <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No active class cohorts found.</p>
                    <p className="text-[11px] text-slate-400">
                      Use the "Add Class Cohort" button to register a cohort.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Selected Class Cohort Details */}
          <div className="lg:col-span-7 space-y-6">
            {selectedClass ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                        {selectedClass.grade}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Session Year: {selectedClass.academicYear}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mt-2">
                      {selectedClass.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {selectedClass.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setClassToDelete(selectedClass)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 transition-colors shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Cohort</span>
                    </button>
                  </div>
                </div>

                {/* Cohort Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Room</span>
                    <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">{selectedClass.room}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enrolled Scholars</span>
                    <p className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{studentsCount}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Teachers</span>
                    <p className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{teachersCount}</p>
                  </div>
                </div>

                {/* Respective Faculty Instructors */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Respective Subject Teachers</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {users
                      .filter((u) => u.role === 'teacher')
                      .map((t) => (
                        <div key={t.userId} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                          <div className="h-9 w-9 rounded-full bg-blue-900 text-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                            {t.fullName ? t.fullName.charAt(0) : 'T'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{t.fullName}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{t.subject || 'Faculty Member'}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500">
                <GraduationCap className="w-12 h-12 mx-auto text-slate-400 mb-2 opacity-50" />
                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No Class Cohort Selected</p>
                <p className="text-xs text-slate-400 mt-1">Select an existing class from the list or create a new cohort.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: VIEW USERS DIRECTORY (READ-ONLY)
          ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Zahira College Users Directory (View Only)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Read-only view of enrolled scholars, parents, and respective faculty members
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search scholars, parents, teachers..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Role Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedRoleFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All Users ({users.length})
              </button>
              <button
                onClick={() => setSelectedRoleFilter('student')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedRoleFilter === 'student'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Students ({studentsCount})
              </button>
              <button
                onClick={() => setSelectedRoleFilter('teacher')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedRoleFilter === 'teacher'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Teachers ({teachersCount})
              </button>
              <button
                onClick={() => setSelectedRoleFilter('parent')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedRoleFilter === 'parent'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Parents ({parentsCount})
              </button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">User / Scholar</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Subject / Stream</th>
                    <th className="py-3 px-4">Phone / Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.userId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                              {u.fullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{u.fullName}</p>
                              {u.bio && (
                                <p className="text-[10px] text-slate-400 line-clamp-1">{u.bio}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'teacher'
                                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                                : u.role === 'student'
                                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{u.email}</td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {u.stream || u.subject || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{u.phone || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PUBLISH & MANAGE NOTICES
          ========================================================================= */}
      {activeTab === 'notices' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Post Notice Form */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
              <div>
                <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Publish Academic Notice</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Send updates directly to students, parents, and cohort channels
                </p>
              </div>

              <form onSubmit={handlePostNotice} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Notice Subject / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Combined Maths Revision Session on Saturday"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Target Audience *
                  </label>
                  <select
                    value={noticeAudience}
                    onChange={(e) => setNoticeAudience(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">Entire 2k28 Science EM Cohort (Students & Parents)</option>
                    <option value="students">Students Only</option>
                    <option value="parents">Parents Only</option>
                    <option value="teachers">Teaching Faculty Only</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Notice Content & Instructions *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Provide full details, room location, timings, and required materials..."
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pinNoticeCheck"
                    checked={noticePinned}
                    onChange={(e) => setNoticePinned(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="pinNoticeCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Pin this notice to top of announcements
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={postingNotice}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>{postingNotice ? 'Publishing...' : 'Publish Academic Notice'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Published Notices Feed */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span>Published School Circulars ({notices.length})</span>
            </h3>

            {notices.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500 text-xs">
                No academic notices have been published yet.
              </div>
            ) : (
              notices.map((nt) => (
                <div
                  key={nt.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2 relative"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {nt.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          <Pin className="w-3 h-3" />
                          <span>PINNED</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 uppercase">
                        Audience: {nt.audience}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(nt.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {confirmDeleteNoticeId === nt.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteNotice(nt.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteNoticeId(null)}
                          className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteNoticeId(nt.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{nt.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {nt.content}
                  </p>

                  <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                    Posted by: <strong className="text-slate-600 dark:text-slate-300">{nt.authorName}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD CLASS COHORT
          ========================================================================= */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <span>Create Class Cohort</span>
              </h3>
              <button
                onClick={() => setIsAddClassModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Class Cohort Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2k28 Science Section B"
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Grade Level
                  </label>
                  <input
                    type="text"
                    value={classGradeInput}
                    onChange={(e) => setClassGradeInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={classYearInput}
                    onChange={(e) => setClassYearInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Assigned Lecture Room
                </label>
                <input
                  type="text"
                  value={classRoomInput}
                  onChange={(e) => setClassRoomInput(e.target.value)}
                  placeholder="e.g. Science Complex - Hall 28"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Description / Academic Objectives
                </label>
                <textarea
                  rows={2}
                  value={classDescInput}
                  onChange={(e) => setClassDescInput(e.target.value)}
                  placeholder="G.C.E. Advanced Level 2k28 Science EM class..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingClass}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-md"
                >
                  {savingClass ? 'Creating...' : 'Save Class Cohort'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Deletion Confirmation Modal for Teachers & Admin */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">Remove Class Cohort?</h3>
                <p className="text-[11px] text-slate-500">Teacher & Faculty Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete the cohort <strong className="text-slate-900 dark:text-white">"{classToDelete.name}"</strong> ({classToDelete.grade})? This will remove the cohort from the database immediately.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeletingClass}
                onClick={() => setClassToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingClass}
                onClick={confirmDeleteClass}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-xs font-bold text-white transition-colors shadow-sm"
              >
                {isDeletingClass ? 'Removing Cohort...' : 'Yes, Delete Cohort'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
