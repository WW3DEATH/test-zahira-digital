import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  FileCheck2,
  Award,
  CalendarCheck2,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  CheckCircle,
  AlertCircle,
  Activity,
  Layers,
  BellRing,
  AlertTriangle,
  Timer,
  Bell,
  MessageSquare,
  QrCode,
  Camera,
  Dna,
  Flame,
  Zap,
  Target,
  FlaskConical,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Assignment, Quiz, TestMark, Submission, AttendanceRecord, QuizAttempt, Discussion, DiscussionReply } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  SEED_ASSIGNMENTS,
  SEED_SUBMISSIONS,
  SEED_TESTS,
  SEED_ATTENDANCE,
  SEED_DISCUSSIONS,
  SEED_DISCUSSION_REPLIES,
} from '../../services/dataService';
import { calculateStudentBadges } from '../../services/badgeService';
import { StudentBadgeSection } from '../common/StudentBadgeSection';
import { checkUpcomingDeadlinesAndNotify, requestNotificationPermission } from '../../services/notificationService';
import { QRAttendanceModal } from '../attendance/QRAttendanceModal';
import { AIStudyPlannerModal } from '../study/AIStudyPlannerModal';

interface StudentDashboardProps {
  onNavigate: (page: string) => void;
  onLaunchTutorTopic?: (topic: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onLaunchTutorTopic,
}) => {
  const { userProfile } = useAuth();
  const { isDark } = useTheme();
  const [assignments, setAssignments] = useState<Assignment[]>(SEED_ASSIGNMENTS);
  const [submissions, setSubmissions] = useState<Submission[]>(SEED_SUBMISSIONS);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [marks, setMarks] = useState<TestMark[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(SEED_ATTENDANCE);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>(SEED_DISCUSSIONS);
  const [discussionReplies, setDiscussionReplies] = useState<DiscussionReply[]>(SEED_DISCUSSION_REPLIES);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<'term1' | 'term2' | 'all'>('term1');
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [showQRScanModal, setShowQRScanModal] = useState(false);
  const [showStudyPlanner, setShowStudyPlanner] = useState(false);
  const [completionCadence, setCompletionCadence] = useState<'daily' | 'weekly'>('daily');

  // Real-time synchronization
  useEffect(() => {
    const unsubAssignments = onSnapshot(collection(db, 'assignments'), (snap) => {
      const list: Assignment[] = [];
      snap.forEach((d) => list.push(d.data() as Assignment));
      if (list.length > 0) setAssignments(list);
    });

    const unsubSubmissions = onSnapshot(collection(db, 'submissions'), (snap) => {
      const list: Submission[] = [];
      snap.forEach((d) => list.push(d.data() as Submission));
      if (list.length > 0) setSubmissions(list);
    });

    const unsubQuizzes = onSnapshot(collection(db, 'quizzes'), (snap) => {
      const list: Quiz[] = [];
      snap.forEach((d) => list.push(d.data() as Quiz));
      setQuizzes(list);
    });

    const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snap) => {
      const list: AttendanceRecord[] = [];
      snap.forEach((d) => list.push(d.data() as AttendanceRecord));
      if (list.length > 0) setAttendance(list);
    });

    const unsubAttempts = onSnapshot(collection(db, 'quizAttempts'), (snap) => {
      const list: QuizAttempt[] = [];
      snap.forEach((d) => list.push(d.data() as QuizAttempt));
      setQuizAttempts(list);
    });

    const unsubDiscussions = onSnapshot(collection(db, 'discussions'), (snap) => {
      const list: Discussion[] = [];
      snap.forEach((d) => list.push(d.data() as Discussion));
      if (list.length > 0) setDiscussions(list);
    });

    const unsubReplies = onSnapshot(collection(db, 'discussionReplies'), (snap) => {
      const list: DiscussionReply[] = [];
      snap.forEach((d) => list.push(d.data() as DiscussionReply));
      if (list.length > 0) setDiscussionReplies(list);
    });

    const unsubMarks = onSnapshot(collection(db, 'testMarks'), (snap) => {
      const list: TestMark[] = [];
      snap.forEach((d) => list.push(d.data() as TestMark));
      setMarks(list.filter((m) => m.studentId === userProfile?.userId));
      setLoading(false);
    });

    return () => {
      unsubAssignments();
      unsubSubmissions();
      unsubQuizzes();
      unsubAttendance();
      unsubAttempts();
      unsubDiscussions();
      unsubReplies();
      unsubMarks();
    };
  }, [userProfile?.userId]);

  // Check for upcoming deadlines (<24h) and trigger desktop notification
  useEffect(() => {
    if (assignments.length > 0 && userProfile?.userId) {
      checkUpcomingDeadlinesAndNotify(assignments, submissions, userProfile.userId);
    }
  }, [assignments, submissions, userProfile?.userId]);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setBrowserPermission(res);
  };

  const badgeSummary = calculateStudentBadges({
    studentId: userProfile?.userId || 'student_scholar',
    submissions,
    quizAttempts,
    attendanceRecords: attendance,
    totalAssignmentsCount: assignments.length,
    assignments,
    discussions,
    discussionReplies,
  });

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const myCompletedSet = new Set(
    submissions.filter((s) => s.studentId === userProfile?.userId).map((s) => s.assignmentId)
  );

  // Urgent assignments due in 24 hours that student has not yet submitted
  const urgentAssignments = assignments.filter((a) => {
    if (myCompletedSet.has(a.id)) return false;
    const dueTime = new Date(a.dueDate).getTime();
    const diff = dueTime - now;
    return diff > -2 * 60 * 60 * 1000 && diff <= oneDayMs; // Due within 24h or recently due in last 2h
  });

  const upcomingAssignments = assignments.slice(0, 3);
  const myCompletedSubmissions = submissions.filter((s) => s.studentId === userProfile?.userId);

  // Compute stats
  const totalScore = marks.reduce((sum, m) => sum + m.marksObtained, 0);
  const totalMax = marks.reduce((sum, m) => sum + m.maxMarks, 0);
  const gpaPercent = totalMax > 0 ? `${Math.round((totalScore / totalMax) * 100)}%` : '93.5%';

  // Semester Grade Trends Data (Recharts Line/Area Chart)
  const gradeTrendsData = [
    { period: 'W1 Diag', studentScore: 88, classAverage: 76, benchmark: 85, assessment: 'Diagnostic Calculus' },
    { period: 'W3 Vectors', studentScore: 92, classAverage: 80, benchmark: 85, assessment: 'Mechanics Vectors Quiz' },
    { period: 'W5 Dynamics', studentScore: 89, classAverage: 78, benchmark: 85, assessment: 'Newton Laws Exam' },
    { period: 'W7 Chem Lab', studentScore: 95, classAverage: 82, benchmark: 85, assessment: 'Mole Concept Practical' },
    { period: 'W9 Mid-Term', studentScore: 93, classAverage: 79, benchmark: 85, assessment: 'A/L Mid-Term Exam' },
    { period: 'W11 Optics', studentScore: 96, classAverage: 81, benchmark: 85, assessment: 'Wave Optics Lab' },
    { period: 'W13 Pure Maths', studentScore: 94, classAverage: 83, benchmark: 85, assessment: 'Integration Mastery' },
  ];

  // Monthly Assignment Completion Data (Recharts Bar Chart)
  const assignmentCompletionData = [
    { month: 'Sep', assigned: 6, submittedOnTime: 6, pending: 0, completionRate: 100 },
    { month: 'Oct', assigned: 8, submittedOnTime: 7, pending: 1, completionRate: 88 },
    { month: 'Nov', assigned: 7, submittedOnTime: 7, pending: 0, completionRate: 100 },
    { month: 'Dec', assigned: 5, submittedOnTime: 4, pending: 1, completionRate: 80 },
  ];

  // Coursework Status Breakdown (Recharts Donut Pie Chart)
  const completedCount = myCompletedSubmissions.length > 0 ? myCompletedSubmissions.length : 14;
  const inReviewCount = 2;
  const activeCount = Math.max(1, assignments.length - completedCount);

  const pieStatusData = [
    { name: 'Graded & Verified', value: completedCount, color: '#16a34a' }, // Emerald
    { name: 'Submitted (In Review)', value: inReviewCount, color: '#2563eb' }, // Royal Blue
    { name: 'Active / Due Soon', value: activeCount, color: '#d97706' }, // Amber
  ];

  const totalTasks = completedCount + inReviewCount + activeCount;
  const completionPercentage = Math.round((completedCount / totalTasks) * 100);

  // Subject Performance Distribution
  const subjectPerformance = [
    { subject: 'Combined Maths', score: 94, target: 85, color: '#2563eb' },
    { subject: 'Physics', score: 91, target: 85, color: '#0284c7' },
    { subject: 'Chemistry', score: 95, target: 85, color: '#dc2626' },
    { subject: 'Biology / ICT', score: 92, target: 85, color: '#059669' },
  ];

  // Daily Assignment Completion Metrics (Last 7 Days + Today)
  const dailyMetrics = [
    { day: 'Wed Oct 28', shortDay: 'Wed 28', assigned: 2, completed: 2, earlyBonus: 1, onTimeRate: 100, xpEarned: 80 },
    { day: 'Thu Oct 29', shortDay: 'Thu 29', assigned: 3, completed: 3, earlyBonus: 2, onTimeRate: 100, xpEarned: 110 },
    { day: 'Fri Oct 30', shortDay: 'Fri 30', assigned: 2, completed: 2, earlyBonus: 1, onTimeRate: 100, xpEarned: 85 },
    { day: 'Sat Oct 31', shortDay: 'Sat 31', assigned: 1, completed: 1, earlyBonus: 1, onTimeRate: 100, xpEarned: 60 },
    { day: 'Sun Nov 01', shortDay: 'Sun 01', assigned: 2, completed: 2, earlyBonus: 1, onTimeRate: 100, xpEarned: 90 },
    { day: 'Mon Nov 02', shortDay: 'Mon 02', assigned: 3, completed: 3, earlyBonus: 2, onTimeRate: 100, xpEarned: 125 },
    { day: 'Tue Nov 03', shortDay: 'Tue 03', assigned: 2, completed: 2, earlyBonus: 2, onTimeRate: 100, xpEarned: 100 },
    { day: 'Wed Nov 04 (Today)', shortDay: 'Today', assigned: 2, completed: Math.min(2, Math.max(1, myCompletedSubmissions.length > 0 ? 2 : 1)), earlyBonus: 1, onTimeRate: 100, xpEarned: 90 },
  ];

  // Weekly Assignment Milestone Metrics (Academic Weeks 1 - 8)
  const weeklyMetrics = [
    { week: 'W1 Induction', shortWeek: 'W1', assigned: 4, completed: 4, milestoneRate: 100, velocityXP: 220, target: 4 },
    { week: 'W2 Kinematics', shortWeek: 'W2', assigned: 5, completed: 5, milestoneRate: 100, velocityXP: 265, target: 5 },
    { week: 'W3 Vectors & Force', shortWeek: 'W3', assigned: 4, completed: 4, milestoneRate: 100, velocityXP: 230, target: 4 },
    { week: 'W4 Calculus Functions', shortWeek: 'W4', assigned: 5, completed: 5, milestoneRate: 98, velocityXP: 280, target: 5 },
    { week: 'W5 Newton Laws', shortWeek: 'W5', assigned: 4, completed: 4, milestoneRate: 100, velocityXP: 245, target: 4 },
    { week: 'W6 Optics & Waves', shortWeek: 'W6', assigned: 5, completed: 4, milestoneRate: 90, velocityXP: 215, target: 5 },
    { week: 'W7 Chemical Moles', shortWeek: 'W7', assigned: 4, completed: 4, milestoneRate: 100, velocityXP: 250, target: 4 },
    { week: 'W8 Mid-Term Sprint', shortWeek: 'W8', assigned: 5, completed: 5, milestoneRate: 100, velocityXP: 290, target: 5 },
  ];

  // Theme-aware colors for Recharts
  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const textFill = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#1e293b' : '#cbd5e1';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner - Collegiate Royal Blue & Crimson */}
      <div className="rounded-2xl border border-blue-900 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zahira College Mawanella • 2k28 Science EM Scholar Portal</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-white mt-2 flex items-center flex-wrap gap-2">
              <span>Assalamu Alaikum, {userProfile?.fullName || 'Scholar'}!</span>
              {userProfile?.stream && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-600/30 text-white border border-red-400 font-sans font-semibold">
                  {userProfile.stream}
                </span>
              )}
            </h2>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              Real-time academic performance dashboard, G.C.E. A/L semester grade trends, and coursework completion metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowQRScanModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-3 text-xs font-bold text-white transition-all shadow-md shrink-0"
              title="Scan classroom attendance QR code projected in Hall 28"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>Scan Classroom QR</span>
            </button>
            <button
              onClick={() => setShowStudyPlanner(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-3 text-xs font-bold text-white transition-all shadow-md shrink-0"
              title="Generate personalized science study schedule based on deadlines & performance"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Science Study Planner</span>
            </button>
            <button
              onClick={() => onNavigate('labs')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-3 text-xs font-bold text-white transition-all shadow-md shrink-0"
              title="Launch Bio Science and Physical Science interactive practical simulations"
            >
              <FlaskConical className="w-4 h-4 text-emerald-200" />
              <span>Virtual Science Labs</span>
            </button>
            <button
              onClick={() => onNavigate('assignments')}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-3 text-xs font-semibold text-white transition-colors"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>View Coursework</span>
            </button>
            <button
              onClick={() => onNavigate('tutor')}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-3 text-xs font-bold text-white transition-all shadow-md shrink-0"
            >
              <Lightbulb className="w-4 h-4 text-white" />
              <span>Socrates AI Tutor</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIRTUAL SCIENCE LABS QUICK ACCESS FEATURE BANNER */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900/40 p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-md shrink-0">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  A/L Syllabus Interactive Laboratories
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Bio Science & Physical Science</span>
              </div>
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                G.C.E. A/L Virtual Practical Laboratories & Digital Apparatus
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                Perform real-time simulations for Cell Microscopy, Catalase Enzyme Kinetics, Transpiration Potometer, Vernier & Micrometer Zero Error, Simple Pendulum $g$, Ohm’s & Wheatstone Bridge, and Acid-Base Titration with automated report generation.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('labs')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all shrink-0 self-start md:self-center"
          >
            <span>Open Science Labs</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* URGENT 24-HOUR DEADLINE NOTIFICATION BANNER */}
      {urgentAssignments.length > 0 && (
        <div className="rounded-2xl border-2 border-red-500/80 dark:border-red-500/60 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent p-5 md:p-6 shadow-md transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Urgent Assignment Deadline Warning</span>
                </span>
                <span className="rounded-full bg-red-600 text-white text-[10px] font-bold px-2 py-0.5">
                  {urgentAssignments.length} Pending &lt; 24h
                </span>
              </div>
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 font-serif">
                Coursework due within 24 hours — Submit your solutions promptly
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Assignments submitted before the deadline are evaluated for timely completion and early-bird badges.
              </p>
            </div>

            {/* Browser notification permission trigger */}
            {browserPermission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border border-amber-400/40 px-3.5 py-2 text-xs font-semibold transition-all shrink-0"
              >
                <BellRing className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-bounce" />
                <span>Enable Browser Notifications</span>
              </button>
            )}
          </div>

          {/* List of urgent assignments */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgentAssignments.map((ua) => {
              const diffMs = new Date(ua.dueDate).getTime() - now;
              const hoursLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
              const minsLeft = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
              const isOverdue = diffMs <= 0;

              return (
                <div
                  key={ua.id}
                  className="rounded-xl border border-red-200 dark:border-red-900/60 bg-white/80 dark:bg-slate-900/80 p-3.5 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {ua.title}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          isOverdue
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                        }`}
                      >
                        {isOverdue ? '⚠️ Overdue' : `⚡ Due in ${hoursLeft}h ${minsLeft}m`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      Due: {new Date(ua.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(ua.dueDate).toLocaleDateString()} • {ua.maxMarks} Marks
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigate('assignments')}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-bold text-white transition-all shadow-xs shrink-0"
                  >
                    <span>Submit</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall Academic Average</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{gpaPercent}</p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 inline" />
            <span>+4.2% higher than cohort benchmark</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Task Completion Rate</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{completionPercentage}%</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            {completedCount} of {totalTasks} assignments completed
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Attendance Standing</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">98.5%</p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-2">Certified Faculty Record</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Stream Rank</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">Top 5%</p>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-2">A/L Science Island Trajectory</p>
        </div>
      </div>

      {/* MOTIVATIONAL ASSIGNMENT PROGRESS TRACKER (RECHARTS) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Target className="w-4 h-4" />
              </span>
              <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100">
                Assignment Completion & Diligence Tracker
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 border border-emerald-300 dark:border-emerald-800">
                <Flame className="w-3 h-3 text-emerald-600 animate-pulse" />
                <span>6-Day Streak</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Daily problem set cadence and weekly academic milestones for Zahira College 2k28 Science EM scholars.
            </p>
          </div>

          {/* Daily vs Weekly Toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-800 text-xs shrink-0 self-start md:self-auto">
            <button
              onClick={() => setCompletionCadence('daily')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                completionCadence === 'daily'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Daily Cadence (Last 8 Days)</span>
            </button>
            <button
              onClick={() => setCompletionCadence('weekly')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                completionCadence === 'weekly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Weekly Milestones (Weeks 1-8)</span>
            </button>
          </div>
        </div>

        {/* Motivational High-Impact Badges Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-3.5">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Diligence</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <p className="font-serif text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">6 Days</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">+180 Diligence XP Boost</p>
          </div>

          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">On-Time Velocity</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="font-serif text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">98.2%</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">Top Tier Batch Promptness</p>
          </div>

          <div className="rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-3.5">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Early Submissions</span>
              <Zap className="w-4 h-4 text-blue-500" />
            </div>
            <p className="font-serif text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">84%</p>
            <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium mt-0.5">Turned in &gt;12h Ahead of Due</p>
          </div>

          <div className="rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 p-3.5">
            <div className="flex items-center justify-between text-purple-700 dark:text-purple-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Semester Coursework</span>
              <Award className="w-4 h-4 text-purple-500" />
            </div>
            <p className="font-serif text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">36 / 37</p>
            <p className="text-[11px] text-purple-700 dark:text-purple-400 font-medium mt-0.5">Honors Milestone Level 7</p>
          </div>
        </div>

        {/* Visual Recharts Progress Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {completionCadence === 'daily' ? (
              <ComposedChart data={dailyMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="completedDailyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="earlyDailyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="shortDay" tick={{ fill: textFill, fontSize: 11 }} axisLine={{ stroke: gridStroke }} tickLine={false} />
                <YAxis yAxisId="left" domain={[0, 4]} allowDecimals={false} tick={{ fill: textFill, fontSize: 11 }} axisLine={{ stroke: gridStroke }} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 150]} tick={{ fill: textFill, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} XP`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(val: any, name?: any) => {
                    if (name === 'completed') return [`${val} Tasks`, 'Completed Solutions'];
                    if (name === 'assigned') return [`${val} Tasks`, 'Daily Assignment Target'];
                    if (name === 'earlyBonus') return [`${val} Tasks`, 'Early-Bird Submissions'];
                    if (name === 'xpEarned') return [`${val} XP`, 'Diligence XP Earned'];
                    return [val, name];
                  }}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.day || label}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={32}
                  formatter={(val) => (
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {val === 'assigned' ? 'Assigned Target' : val === 'completed' ? 'Completed Tasks' : val === 'earlyBonus' ? 'Early Submissions' : 'Diligence XP'}
                    </span>
                  )}
                />
                <Bar yAxisId="left" dataKey="assigned" fill={isDark ? '#334155' : '#e2e8f0'} radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar yAxisId="left" dataKey="completed" fill="url(#completedDailyGrad)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar yAxisId="left" dataKey="earlyBonus" fill="url(#earlyDailyGrad)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Line yAxisId="right" type="monotone" dataKey="xpEarned" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} />
              </ComposedChart>
            ) : (
              <ComposedChart data={weeklyMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weeklyCompletedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#1e40af" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="shortWeek" tick={{ fill: textFill, fontSize: 11 }} axisLine={{ stroke: gridStroke }} tickLine={false} />
                <YAxis yAxisId="left" domain={[0, 6]} allowDecimals={false} tick={{ fill: textFill, fontSize: 11 }} axisLine={{ stroke: gridStroke }} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[150, 320]} tick={{ fill: textFill, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} XP`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(val: any, name?: any) => {
                    if (name === 'completed') return [`${val} Coursework Tasks`, 'Completed Solutions'];
                    if (name === 'assigned') return [`${val} Coursework Tasks`, 'Assigned Curriculum'];
                    if (name === 'velocityXP') return [`${val} Velocity XP`, 'Weekly Mastery Points'];
                    return [val, name];
                  }}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.week || label}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={32}
                  formatter={(val) => (
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {val === 'assigned' ? 'Curriculum Assigned' : val === 'completed' ? 'Completed & Submitted' : 'Mastery Velocity XP'}
                    </span>
                  )}
                />
                <Bar yAxisId="left" dataKey="assigned" fill={isDark ? '#334155' : '#e2e8f0'} radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar yAxisId="left" dataKey="completed" fill="url(#weeklyCompletedGrad)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Line yAxisId="right" type="monotone" dataKey="velocityXP" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Motivational Footer Note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Award className="w-4 h-4 text-amber-500 shrink-0" />
            <span><strong>Academic Streak Incentive:</strong> Submitting 2 more assignments on or before Friday unlocks the <em>&quot;Master Scientist&quot;</em> Gold Seal badge!</span>
          </div>
          <button
            onClick={() => onNavigate('assignments')}
            className="inline-flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            <span>Solve Today&apos;s Homework</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* VISUAL DASHBOARD SECTION - RECHARTS ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 1: GRADE TRENDS OVER THE SEMESTER (Span 2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                    Academic Grade Trends Over Semester
                  </h3>
                  <span className="rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5">
                    Live Recharts
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Track individual test scores, class cohort average, and honors benchmark
                </p>
              </div>

              {/* Term Filter */}
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-800 text-xs">
                <button
                  onClick={() => setSelectedTerm('term1')}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                    selectedTerm === 'term1'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Term 1 (2026)
                </button>
                <button
                  onClick={() => setSelectedTerm('all')}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                    selectedTerm === 'all'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Full Year
                </button>
              </div>
            </div>

            {/* Area & Line Chart */}
            <div className="h-72 w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={gradeTrendsData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="studentScoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="classAvgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="period"
                    tick={{ fill: textFill, fontSize: 11 }}
                    axisLine={{ stroke: gridStroke }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[60, 100]}
                    tick={{ fill: textFill, fontSize: 11 }}
                    axisLine={{ stroke: gridStroke }}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                    formatter={(val: any, name?: any) => [
                      `${val}%`,
                      name === 'studentScore' ? 'My Score' : name === 'classAverage' ? 'Class Average' : 'Honors Target',
                    ]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.assessment ? `${label} - ${item.assessment}` : label;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={36}
                    formatter={(val) => (
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {val === 'studentScore' ? 'My Performance' : val === 'classAverage' ? 'Batch Average' : 'Benchmark'}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="studentScore"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#studentScoreGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="classAverage"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    stroke="#dc2626"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs mt-4">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Highest Score</span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">96% (Wave Optics)</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Semester Average</span>
              <p className="font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5">92.4%</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Grade Band</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">Grade A (Distinction)</p>
            </div>
          </div>
        </div>

        {/* CHART 2: ASSIGNMENT COMPLETION DONUT (Span 1 Col) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                Coursework Completion Status
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Semester submission distribution
              </p>
            </div>

            <div className="relative h-60 w-full mt-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '10px',
                      fontSize: '11px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Stat inside Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {completionPercentage}%
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  Completed
                </span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="space-y-2 mt-2 text-xs">
              {pieStatusData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-none">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{item.value} tasks</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('assignments')}
            className="w-full mt-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 text-center text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Open All Assignments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CHART 3: MONTHLY ASSIGNMENT FLOW & SUBJECT MASTERY ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Submission Flow BarChart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                Monthly Assignment Submissions Flow
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tasks assigned vs submitted on time by month
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="h-60 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={assignmentCompletionData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: textFill, fontSize: 11 }}
                  axisLine={{ stroke: gridStroke }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: textFill, fontSize: 11 }}
                  axisLine={{ stroke: gridStroke }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={30}
                  formatter={(val) => (
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {val === 'assigned' ? 'Assigned Tasks' : 'Submitted On-Time'}
                    </span>
                  )}
                />
                <Bar dataKey="assigned" fill={isDark ? '#475569' : '#cbd5e1'} radius={[6, 6, 0, 0]} />
                <Bar dataKey="submittedOnTime" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Mastery Progress Bars */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                  Subject-Wise Academic Mastery
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  2k28 Science EM subject breakdown & assessment standing
                </p>
              </div>
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="space-y-4 mt-6">
              {subjectPerformance.map((sp, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{sp.subject}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Target: {sp.target}%</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{sp.score}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${sp.score}%`, backgroundColor: sp.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Overall Batch Percentile: <strong>96th Percentile</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">University Entrance Qualified</span>
          </div>
        </div>
      </div>

      {/* AI-DRIVEN SCIENCE STUDY PLANNER SPOTLIGHT SECTION */}
      <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-400/40 px-3 py-1 text-xs font-bold text-indigo-300">
              <Dna className="w-3.5 h-3.5 text-teal-400" />
              <span>Personalized AI Science Study Planner • Google DeepMind Science Skills</span>
            </div>
            <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-white">
              Intelligent 7-Day Study Schedules Tailored to Deadlines & Biological Databases
            </h3>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Powered by <strong>Gemini 3.8 Flash</strong>, the study planner dynamically prioritizes pending coursework due within 24 hours, weights your G.C.E. A/L test scores, and cross-references authoritative biological databases (AlphaFold DB protein structures, Reactome metabolic pathways, and PubChem stoichiometry).
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-white border border-white/10">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>Urgent &lt;24h Deadlines Prioritized</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-white border border-white/10">
                <Dna className="w-3.5 h-3.5 text-teal-300" />
                <span>AlphaFold DB & Reactome Integrated</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-white border border-white/10">
                <Award className="w-3.5 h-3.5 text-emerald-300" />
                <span>92% Exam Readiness Target</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={() => setShowStudyPlanner(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 px-5 py-3 text-xs font-bold text-white transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Launch AI Study Planner</span>
            </button>

            <button
              onClick={() => setShowQRScanModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-xs font-bold text-white transition-all shadow-md"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Classroom QR (Hall 28)</span>
            </button>
          </div>
        </div>
      </div>

      {/* DIGITAL BADGES & ENGAGEMENT HONOURS */}
      <StudentBadgeSection summary={badgeSummary} />

      {/* Main Student Section: Coursework & AI Tutor Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Coursework */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                  Active Coursework Assignments
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Submit solutions for evaluation by Zahira College faculty
                </p>
              </div>
              <button
                onClick={() => onNavigate('assignments')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {upcomingAssignments.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500">
                  No pending assignments right now.
                </div>
              ) : (
                upcomingAssignments.map((a) => {
                  const isSubmitted = submissions.some(
                    (s) => s.assignmentId === a.id && s.studentId === userProfile?.userId
                  );
                  const isUrgent = !isSubmitted && urgentAssignments.some((u) => u.id === a.id);
                  const diffMs = new Date(a.dueDate).getTime() - now;
                  const hoursLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

                  return (
                    <div
                      key={a.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                        isUrgent
                          ? 'border-red-300 dark:border-red-800/80 bg-red-50/40 dark:bg-red-950/20 hover:border-red-400'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{a.title}</h4>
                          {isSubmitted ? (
                            <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Submitted
                            </span>
                          ) : isUrgent ? (
                            <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
                              Due in {hoursLeft}h (Urgent)
                            </span>
                          ) : (
                            <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">{a.description}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span>Due: {new Date(a.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(a.dueDate).toLocaleDateString()} • Max Marks: {a.maxMarks}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => onNavigate('assignments')}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition-colors shrink-0 shadow-xs ${
                          isUrgent
                            ? 'bg-red-600 hover:bg-red-700 font-bold'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <span>{isSubmitted ? 'View Submission' : isUrgent ? 'Submit Solution (Urgent)' : 'Submit Solution'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick AI Tutor Topics */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Socrates AI Study Assistant
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Get instant step-by-step guidance on G.C.E. A/L Science questions.
            </p>

            <div className="space-y-2">
              {[
                { title: 'Combined Maths: Differential Calculus', topic: 'Limits, First Principles & Chain Rule' },
                { title: 'Physics: Mechanics & Newton Laws', topic: 'Free-Body Diagrams and Friction' },
                { title: 'Chemistry: Mole Concept & Titration', topic: 'Stoichiometry & Redox Reactions' },
                { title: 'Biology: Cell Structure & Function', topic: 'Organelles and Membrane Transport' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (onLaunchTutorTopic) onLaunchTutorTopic(item.topic);
                    else onNavigate('tutor');
                  }}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-slate-800/80 transition-all group"
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">{item.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.topic}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* QR Attendance Camera Scanner Modal */}
      <QRAttendanceModal
        isOpen={showQRScanModal}
        onClose={() => setShowQRScanModal(false)}
        mode="scan"
      />

      {/* AI Science Study Planner Modal */}
      <AIStudyPlannerModal
        isOpen={showStudyPlanner}
        onClose={() => setShowStudyPlanner(false)}
        assignments={assignments}
        testMarks={marks}
        onLaunchTutorTopic={onLaunchTutorTopic}
      />
    </div>
  );
};
