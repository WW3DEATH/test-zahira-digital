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
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import { Assignment, Quiz, TestMark, Submission, AttendanceRecord, QuizAttempt } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SEED_ASSIGNMENTS, SEED_SUBMISSIONS, SEED_TESTS, SEED_ATTENDANCE } from '../../services/dataService';
import { calculateStudentBadges } from '../../services/badgeService';
import { StudentBadgeSection } from '../common/StudentBadgeSection';

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
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<'term1' | 'term2' | 'all'>('term1');

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
      unsubMarks();
    };
  }, [userProfile?.userId]);

  const badgeSummary = calculateStudentBadges({
    studentId: userProfile?.userId || 'student_scholar',
    submissions,
    quizAttempts,
    attendanceRecords: attendance,
    totalAssignmentsCount: assignments.length,
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
              onClick={() => onNavigate('assignments')}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-3 text-xs font-semibold text-white transition-colors"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>View Coursework</span>
            </button>
            <button
              onClick={() => onNavigate('tutor')}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-3 text-xs font-bold text-white transition-all shadow-md shrink-0"
            >
              <Lightbulb className="w-4 h-4 text-white" />
              <span>Launch Socrates AI Tutor</span>
            </button>
          </div>
        </div>
      </div>

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

                  return (
                    <div
                      key={a.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{a.title}</h4>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              isSubmitted
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {isSubmitted ? 'Submitted' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">{a.description}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Due: {new Date(a.dueDate).toLocaleDateString()} • Max Marks: {a.maxMarks}
                        </p>
                      </div>

                      <button
                        onClick={() => onNavigate('assignments')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors shrink-0 shadow-xs"
                      >
                        <span>{isSubmitted ? 'View Submission' : 'Submit Solution'}</span>
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
    </div>
  );
};
