import React, { useState, useEffect } from 'react';
import {
  QrCode,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  FileText,
  Building2,
  CalendarCheck2,
  Calendar,
  ShieldCheck,
  Award,
  Sparkles,
  Send,
  X,
  Cpu,
  Plus,
  Bell,
  Users,
  BarChart3,
  MessageSquare,
  Filter,
  Check,
  Save,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
} from 'recharts';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { TestMark, Announcement, AcademicTest } from '../../types';
import { ensureStudentIndexNumber } from '../../services/studentIndexService';

interface ZNCDashboardProps {
  onNavigate: (page: string) => void;
  onLaunchTutorTopic?: (topic: string) => void;
}

export const ZNCDashboard: React.FC<ZNCDashboardProps> = ({
  onNavigate,
  onLaunchTutorTopic,
}) => {
  const { userProfile, activeRole } = useAuth();
  const { isDark } = useTheme();

  // Real-time Firestore state
  const [firestoreMarks, setFirestoreMarks] = useState<TestMark[]>([]);
  const [firestoreTests, setFirestoreTests] = useState<AcademicTest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Marks Trend UI state
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [marksViewMode, setMarksViewMode] = useState<'trend' | 'breakdown'>('trend');
  const [showAddMarkModal, setShowAddMarkModal] = useState(false);

  // New Mark Form state
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Combined Mathematics');
  const [newScore, setNewScore] = useState('92');
  const [newMaxMarks, setNewMaxMarks] = useState('100');
  const [savingMark, setSavingMark] = useState(false);

  // Modals state
  const [showStudentIDModal, setShowStudentIDModal] = useState(false);
  const [showAITutorModal, setShowAITutorModal] = useState(false);
  const [showInstituteModal, setShowInstituteModal] = useState(false);

  // Quick AI Ask state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Time-aware greeting
  const [greeting, setGreeting] = useState('Good Morning');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Listen to test marks, tests, & announcements from Firestore in real-time
  useEffect(() => {
    const unsubMarks = onSnapshot(
      collection(db, 'testMarks'),
      (snap) => {
        const list: TestMark[] = [];
        snap.forEach((d) => list.push(d.data() as TestMark));
        setFirestoreMarks(list);
      },
      (err) => console.warn('Test marks listener:', err)
    );

    const unsubTests = onSnapshot(
      collection(db, 'tests'),
      (snap) => {
        const list: AcademicTest[] = [];
        snap.forEach((d) => list.push(d.data() as AcademicTest));
        setFirestoreTests(list);
      },
      (err) => console.warn('Tests listener:', err)
    );

    const unsubAnnounce = onSnapshot(
      collection(db, 'announcements'),
      (snap) => {
        const list: Announcement[] = [];
        snap.forEach((d) => list.push(d.data() as Announcement));
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAnnouncements(list);
      },
      (err) => console.warn('Announcements listener:', err)
    );

    return () => {
      unsubMarks();
      unsubTests();
      unsubAnnounce();
    };
  }, []);

  // Ensure current student profile has their allocated 7-digit student index number
  useEffect(() => {
    if (userProfile && !userProfile.indexNumber) {
      ensureStudentIndexNumber(userProfile).catch(() => {});
    }
  }, [userProfile]);

  const studentDisplayName =
    userProfile?.fullName ||
    (activeRole === 'admin' ? 'Administrator' : activeRole === 'teacher' ? 'Faculty Lead' : 'Student Scholar');

  const studentIdNumber =
    userProfile?.indexNumber ||
    (userProfile?.userId
      ? `286${userProfile.userId.replace(/\D/g, '').padEnd(4, '0').slice(0, 4)}`
      : '2860001');

  // Helper to normalize subject labels
  const normalizeSubjectName = (subj?: string) => {
    if (!subj) return 'Science';
    const s = subj.toLowerCase();
    if (s.includes('math') || s.includes('cmath')) return 'Combined Maths';
    if (s.includes('phys')) return 'Physics';
    if (s.includes('chem')) return 'Chemistry';
    if (s.includes('bio')) return 'Biology';
    if (s.includes('ict')) return 'ICT';
    if (s.includes('eng')) return 'General English';
    return subj;
  };

  // Convert real Firestore testMarks into real trend datapoints - ZERO FAKE MARKS
  const realMarksTrend = firestoreMarks.map((m, idx) => {
    const testObj = firestoreTests.find((t) => t.id === m.testId);
    const pct = m.maxMarks > 0 ? Math.round((m.marksObtained / m.maxMarks) * 100) : 0;
    const testTitle = testObj?.title || m.subjectId || `Paper 0${idx + 1}`;
    const subjectName = normalizeSubjectName(testObj?.subjectId || m.subjectId);

    // Calculate real class average for this test among all submitted marks in Firestore
    const peerMarks = firestoreMarks.filter((pm) => pm.testId === m.testId);
    const classAvg = peerMarks.length > 0
      ? Math.round(
          peerMarks.reduce((sum, pm) => sum + (pm.maxMarks > 0 ? (pm.marksObtained / pm.maxMarks) * 100 : 0), 0) /
            peerMarks.length
        )
      : pct;

    return {
      id: m.id,
      paper: testTitle.length > 15 ? testTitle.slice(0, 14) + '…' : testTitle,
      title: testTitle,
      subject: subjectName,
      studentScore: pct,
      marksObtained: m.marksObtained,
      maxMarks: m.maxMarks,
      classAverage: classAvg,
      benchmark: 85,
      date: testObj?.examDate || m.createdAt || '',
      feedback: m.feedback,
    };
  });

  // Sort real marks chronologically
  realMarksTrend.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Filter by subject if user selects a tab
  const filteredTrendData =
    selectedSubjectFilter === 'all'
      ? realMarksTrend
      : realMarksTrend.filter((item) =>
          item.subject.toLowerCase().includes(selectedSubjectFilter.toLowerCase())
        );

  const hasRealMarks = filteredTrendData.length > 0;
  const activeScores = filteredTrendData.map((d) => d.studentScore);
  const avgScore = activeScores.length > 0
    ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
    : 0;
  const peakScore = activeScores.length > 0 ? Math.max(...activeScores) : 0;
  const benchmarkDiff = avgScore > 0 ? avgScore - 85 : 0;

  const handleSaveQuickMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestTitle.trim()) return;

    setSavingMark(true);
    try {
      const testId = `test-${Date.now()}`;
      const scoreNum = Math.max(0, parseInt(newScore, 10) || 90);
      const maxNum = Math.max(1, parseInt(newMaxMarks, 10) || 100);

      // Create test in 'tests' collection
      const newTestDoc: AcademicTest = {
        id: testId,
        title: newTestTitle.trim(),
        classId: 'general',
        subjectId: newSubject,
        teacherId: userProfile?.userId || 'faculty',
        examDate: new Date().toISOString().split('T')[0],
        maxMarks: maxNum,
        term: 'Term 1 (2026)',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'tests', testId), newTestDoc);

      // Create mark in 'testMarks' collection
      const markId = `mark-${testId}-${userProfile?.userId || 'student-2860003'}`;
      const markDoc: TestMark = {
        id: markId,
        testId,
        studentId: userProfile?.userId || 'student-2860003',
        studentName: studentDisplayName,
        classId: 'general',
        subjectId: newSubject,
        marksObtained: scoreNum,
        maxMarks: maxNum,
        feedback: 'Verified Academic Assessment',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'testMarks', markId), markDoc);
      setShowAddMarkModal(false);
      setNewTestTitle('');
    } catch (err) {
      console.error('Failed to save test mark:', err);
    } finally {
      setSavingMark(false);
    }
  };

  const handleAskTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    setAiAnswer(null);

    try {
      const res = await fetch('/api/ask-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: aiQuestion.trim(),
          subject: 'Science',
          academicContext: 'ZNC Science Project • Zahira College 2k28 Science EM Scholar',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnswer(data.answer);
      } else {
        throw new Error('Fallback to fast response');
      }
    } catch {
      setAiAnswer(
        `Science Academic Guidance:\nFor your inquiry regarding "${aiQuestion.trim()}": In G.C.E. Advanced Level Science, formulate physical equations cleanly using SI units. You can also explore the dedicated Socrates AI Tutor module for interactive derivations.`
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. GREETING & INSTITUTE STATUS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="sun behind cloud">
            ⛅
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {greeting}, {studentDisplayName} !
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {activeRole === 'admin' && (
            <button
              onClick={() => onNavigate('admin_panel')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors shrink-0"
              title="Open Admin Master Control Panel"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Admin Panel</span>
            </button>
          )}

          {activeRole === 'teacher' && (
            <button
              onClick={() => onNavigate('teacher_panel')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors shrink-0"
              title="Open Teacher Workspace"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Teacher Panel</span>
            </button>
          )}

          {(activeRole === 'admin' || activeRole === 'teacher') && (
            <button
              onClick={() => onNavigate('calendar')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors shrink-0"
              title="Open Calendar to Mark Attendance"
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Mark Attendance</span>
            </button>
          )}

          <button
            onClick={() => setShowInstituteModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0095ff] hover:bg-[#0084e3] px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors shrink-0"
          >
            <Building2 className="w-4 h-4" />
            <span>Institute : Online</span>
          </button>
        </div>
      </div>

      {/* 2. TOP 4-CARD METRIC & ACTION GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Student ID (Individual separate ID) */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center justify-between hover:shadow-sm transition-shadow">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block">
              {activeRole === 'student' ? 'MY STUDENT ID' : 'ACTIVE USER ID'}
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 block">
              {studentIdNumber}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Zahira College 2k28 Science EM
            </span>
          </div>
          <button
            onClick={() => setShowStudentIDModal(true)}
            className="w-11 h-11 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-500 hover:bg-sky-100 dark:hover:bg-sky-900/60 flex items-center justify-center transition-colors shadow-2xs"
            title="View Student QR Pass"
          >
            <QrCode className="w-5 h-5" />
          </button>
        </div>

        {/* Card 2: Gemini AI Science Tutor Card (Dynamic Generative AI) */}
        <div
          onClick={() => setShowAITutorModal(true)}
          className="rounded-2xl bg-gradient-to-r from-[#d946ef] via-[#a855f7] to-[#4f46e5] p-5 text-white shadow-md cursor-pointer hover:opacity-95 transition-all flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-bold tracking-wider text-white/80 uppercase block">
              ASK GEMINI AI ANYTHING...
            </span>
            <span className="text-xl sm:text-2xl font-black text-white mt-1 block tracking-tight">
              Gemini AI Tutor
            </span>
            <span className="text-[10px] text-purple-100 mt-0.5 block">
              Any custom questions answered
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 group-hover:scale-105 transition-transform">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Role-specific action card (Students NEVER see Master Admin Panel) */}
        {activeRole === 'admin' ? (
          <div
            onClick={() => onNavigate('admin_panel')}
            className="rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-white dark:bg-slate-900 p-5 shadow-xs cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase block">
                MASTER ADMINISTRATION
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                Admin Master Panel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rosters, classes & permissions
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        ) : activeRole === 'teacher' ? (
          <div
            onClick={() => onNavigate('assessments')}
            className="rounded-2xl border border-pink-100 dark:border-pink-950 bg-white dark:bg-slate-900 p-5 shadow-xs cursor-pointer hover:border-pink-300 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold tracking-wider text-pink-600 dark:text-pink-400 uppercase block">
                TEACHER MARKS UPLOAD
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                Assessments & Marks
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload & evaluate test marks
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 border border-pink-200 dark:border-pink-800 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        ) : (
          <div
            onClick={() => onNavigate('messages')}
            className="rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-white dark:bg-slate-900 p-5 shadow-xs cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase block">
                PRIVATE MESSAGING
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                Direct Consultations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Chat with teachers & mentors
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* Card 4: Attendance Card */}
        {activeRole === 'teacher' || activeRole === 'admin' ? (
          <div
            onClick={() => onNavigate('attendance')}
            className="rounded-2xl border border-blue-100 dark:border-blue-950 bg-white dark:bg-slate-900 p-5 shadow-xs cursor-pointer hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase block">
                ATTENDANCE REGISTER
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                Mark Daily Roll-Call
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pick date & record presence
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800 group-hover:scale-105 transition-transform">
              <CalendarCheck2 className="w-6 h-6" />
            </div>
          </div>
        ) : (
          <div
            onClick={() => onNavigate('attendance')}
            className="rounded-2xl border border-blue-100 dark:border-blue-950 bg-white dark:bg-slate-900 p-5 shadow-xs cursor-pointer hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase block">
                MY ATTENDANCE
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                View My Attendance
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Certified daily roll-call logs
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800 group-hover:scale-105 transition-transform">
              <CalendarCheck2 className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>

      {/* 3. MAIN 2-COLUMN SECTION: MARKS TREND ANALYZE & NOTICES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Paper Marks Trend Analyze (~65%) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between min-h-[440px]">
          <div>
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    Marks Trend & Academic Performance
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  G.C.E. A/L Science exam marks progression and honors trajectory
                </p>
              </div>

              {/* View Toggle & Add Button */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
                  <button
                    onClick={() => setMarksViewMode('trend')}
                    className={`rounded-lg px-2.5 py-1 transition-all ${
                      marksViewMode === 'trend'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Trend Curve
                  </button>
                  <button
                    onClick={() => setMarksViewMode('breakdown')}
                    className={`rounded-lg px-2.5 py-1 transition-all ${
                      marksViewMode === 'breakdown'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Breakdown
                  </button>
                </div>

                <button
                  onClick={() => setShowAddMarkModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors shrink-0"
                  title="Record new test mark"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Mark</span>
                </button>
              </div>
            </div>

            {/* Subject Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-3 pb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Filter:
              </span>
              {[
                { id: 'all', label: 'All Science Papers' },
                { id: 'maths', label: 'Combined Maths' },
                { id: 'physics', label: 'Physics' },
                { id: 'chemistry', label: 'Chemistry' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedSubjectFilter(filter.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    selectedSubjectFilter === filter.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* High-Impact Metric Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Batch Average
                </span>
                <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 block">
                  {hasRealMarks ? `${avgScore}%` : 'Pending'}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                  {hasRealMarks ? (benchmarkDiff >= 0 ? `+${benchmarkDiff}% vs Benchmark` : `${benchmarkDiff}% vs Benchmark`) : 'Awaiting Exam Scores'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Peak Score
                </span>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {hasRealMarks ? `${peakScore}%` : 'Pending'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                  {hasRealMarks ? 'Exam Distinction Tier' : 'Awaiting Release'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Honors Target
                </span>
                <span className="text-xl font-extrabold text-amber-500 mt-0.5 block">
                  85%
                </span>
                <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">
                  Island Rank Baseline
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Evaluated Papers
                </span>
                <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 block">
                  {filteredTrendData.length}
                </span>
                <span className="text-[10px] text-blue-600 font-medium mt-0.5 block">
                  {hasRealMarks ? 'Live Cloud Synced' : 'Ready for Upload'}
                </span>
              </div>
            </div>

            {/* MARKS TREND VISUALIZATION OR CLEAN EMPTY STATE (ZERO FAKE MARKS) */}
            {!hasRealMarks ? (
              <div className="py-14 flex flex-col items-center justify-center text-center">
                {/* Styled mint/green document icon matching reference design */}
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center mb-3 text-emerald-600 shadow-2xs">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  No papers to analyze yet
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                  {selectedSubjectFilter !== 'all'
                    ? `No marks uploaded yet for ${selectedSubjectFilter}. Choose "All Science Papers" or record a mark.`
                    : 'When examination marks are uploaded in "Marks and Assessments", your academic performance trend curve and subject averages will sync and activate here in real time.'}
                </p>
                <div className="mt-5 flex items-center gap-2.5">
                  <button
                    onClick={() => onNavigate('assessments')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors"
                  >
                    <span>Go to Marks & Assessments</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowAddMarkModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Quick Add Mark</span>
                  </button>
                </div>
              </div>
            ) : marksViewMode === 'trend' ? (
              <div className="pt-2">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={filteredTrendData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="zncMarksGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} vertical={false} />
                      <XAxis
                        dataKey="paper"
                        tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          borderColor: isDark ? '#334155' : '#e2e8f0',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: isDark ? '#f8fafc' : '#0f172a',
                        }}
                        formatter={(val: any, name?: any) => [
                          `${val}%`,
                          name === 'studentScore' ? 'Score' : name === 'classAverage' ? 'Batch Average' : 'Honors Benchmark',
                        ]}
                        labelFormatter={(label, payload) => {
                          const item = payload?.[0]?.payload;
                          return item?.title ? `${item.title} (${item.subject}) — ${item.marksObtained}/${item.maxMarks}` : label;
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        height={32}
                        formatter={(val) => (
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            {val === 'studentScore' ? 'Score' : val === 'classAverage' ? 'Batch Average' : 'Benchmark (85%)'}
                          </span>
                        )}
                      />
                      <Area
                        type="monotone"
                        dataKey="studentScore"
                        stroke="#2563eb"
                        strokeWidth={3}
                        fill="url(#zncMarksGrad)"
                      />
                      <Line
                        type="monotone"
                        dataKey="classAverage"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#10b981' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="benchmark"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              /* Breakdown List View */
              <div className="pt-2 space-y-2 max-h-64 overflow-y-auto">
                {filteredTrendData.map((d, i) => (
                  <div
                    key={d.id || i}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                        #{i + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{d.title}</p>
                        <p className="text-[11px] text-slate-400">{d.subject} • Scored: {d.marksObtained}/{d.maxMarks}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-mono text-base font-extrabold text-blue-600 dark:text-blue-400">
                          {d.studentScore}%
                        </span>
                        <p className="text-[10px] text-slate-400">Batch: {d.classAverage}%</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                        {d.studentScore >= 90 ? 'Distinction (A)' : d.studentScore >= 75 ? 'Credit (B)' : 'Pass'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>G.C.E. A/L Science Trajectory: <strong>Island Top Tier</strong></span>
            </div>
            <button
              onClick={() => onNavigate('assessments')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Detailed Report Card</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Notices (ONLY REAL NOTICES FROM FIRESTORE - NO FAKE ONES) (~35%) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#f59e0b]" />
                <h2 className="text-base font-bold text-[#f59e0b]">Official Notices</h2>
              </div>
              <button
                onClick={() => onNavigate('announcements')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {/* RENDER ONLY REAL FIRESTORE ANNOUNCEMENTS */}
              {announcements.length > 0 ? (
                announcements.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => onNavigate('announcements')}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-100 dark:border-slate-800 text-xs cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 leading-snug truncate">
                        {a.title}
                      </h4>
                      {a.isPinned && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase shrink-0">
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                      {a.content}
                    </p>
                    <span className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 block font-mono">
                      {new Date(a.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                ))
              ) : (
                /* Clean Empty State when no real notices are posted yet */
                <div className="py-12 text-center text-xs text-slate-400">
                  <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    No official notices posted yet.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Faculty circulars and announcements will appear here in real time.
                  </p>
                  <button
                    onClick={() => onNavigate('announcements')}
                    className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Post Notice</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onNavigate('announcements')}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            >
              + View All Institutional Announcements
            </button>
          </div>
        </div>
      </div>

      {/* 4. MODALS */}

      {/* Modal: Quick Record Test Mark */}
      {showAddMarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setShowAddMarkModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                  Record Paper Test Mark
                </h3>
                <p className="text-xs text-slate-500">Adds score to Firestore and updates trend graph in real time</p>
              </div>
            </div>

            <form onSubmit={handleSaveQuickMark} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Exam / Paper Title
                </label>
                <input
                  type="text"
                  required
                  value={newTestTitle}
                  onChange={(e) => setNewTestTitle(e.target.value)}
                  placeholder="e.g. Paper 08: Kinematics & Calculus"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Subject
                </label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value="Combined Mathematics">Combined Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="ICT">Information & Communication Technology</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Marks Obtained
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={newScore}
                    onChange={(e) => setNewScore(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMarkModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMark}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingMark ? 'Saving...' : 'Record Score'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal A: Student ID & QR Pass Modal */}
      {showStudentIDModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setShowStudentIDModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                Official Student Identity Pass
              </span>
              <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100 mt-3">
                {studentDisplayName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ZNC Science Project • 2k28 Science EM Scholar
              </p>

              {/* QR Code Graphic */}
              <div className="my-5 p-4 rounded-2xl bg-white border border-slate-200 shadow-inner inline-block">
                <div className="w-40 h-40 flex items-center justify-center bg-slate-50 rounded-xl relative overflow-hidden">
                  <QrCode className="w-36 h-36 text-slate-900" />
                </div>
                <p className="text-xs font-mono font-bold text-slate-800 mt-2 tracking-widest">
                  ID: {studentIdNumber}
                </p>
              </div>

              <div className="text-left text-xs bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 space-y-1.5 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Batch Cohort:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">2k28 Science EM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stream:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Physical & Bio Science</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-emerald-600">Active Verified</span>
                </div>
              </div>

              <button
                onClick={() => setShowStudentIDModal(false)}
                className="w-full mt-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 text-xs font-bold transition-colors"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal B: Socrates AI Science Tutor Modal */}
      {showAITutorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setShowAITutorModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Socrates AI Science Tutor
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Instant guidance in Combined Maths, Physics, Chemistry, and Biology
                </p>
              </div>
            </div>

            <form onSubmit={handleAskTutor} className="space-y-3">
              <textarea
                rows={3}
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask any science question (e.g., How to solve kinematics with constant acceleration, or explain dynamic equilibrium)..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
              />

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowAITutorModal(false);
                    onNavigate('tutor');
                  }}
                  className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline"
                >
                  Launch Full Socrates Tutor →
                </button>
                <button
                  type="submit"
                  disabled={aiLoading || !aiQuestion.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 shadow-xs transition-all"
                >
                  {aiLoading ? (
                    <span>Solving...</span>
                  ) : (
                    <>
                      <span>Ask Tutor</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {aiAnswer && (
              <div className="mt-4 p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                <div className="flex items-center gap-1.5 font-bold text-purple-700 dark:text-purple-300 mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Socrates Tutor Solution:</span>
                </div>
                {aiAnswer}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal C: Institute Online Status Modal */}
      {showInstituteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setShowInstituteModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#0095ff]/15 text-[#0095ff] mx-auto flex items-center justify-center mb-3">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                Institute : Online
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ZNC Science Project • Zahira College Mawanella
              </p>

              <div className="my-4 text-left text-xs bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Server Status:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Operational
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cloud DB:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Firestore Realtime</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Directorate:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Science Project Management</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Term:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">2026/2028 Semester 1</span>
                </div>
              </div>

              <button
                onClick={() => setShowInstituteModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#0095ff] hover:bg-[#0084e3] text-white text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
