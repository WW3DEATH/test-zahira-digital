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
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Assignment, Quiz, TestMark, Submission } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface StudentDashboardProps {
  onNavigate: (page: string) => void;
  onLaunchTutorTopic?: (topic: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onLaunchTutorTopic,
}) => {
  const { userProfile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [marks, setMarks] = useState<TestMark[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time synchronization
  useEffect(() => {
    const unsubAssignments = onSnapshot(collection(db, 'assignments'), (snap) => {
      const list: Assignment[] = [];
      snap.forEach((d) => list.push(d.data() as Assignment));
      setAssignments(list);
    });

    const unsubSubmissions = onSnapshot(collection(db, 'submissions'), (snap) => {
      const list: Submission[] = [];
      snap.forEach((d) => list.push(d.data() as Submission));
      setSubmissions(list);
    });

    const unsubQuizzes = onSnapshot(collection(db, 'quizzes'), (snap) => {
      const list: Quiz[] = [];
      snap.forEach((d) => list.push(d.data() as Quiz));
      setQuizzes(list);
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
      unsubMarks();
    };
  }, [userProfile?.userId]);

  const upcomingAssignments = assignments.slice(0, 3);
  const myCompletedSubmissions = submissions.filter((s) => s.studentId === userProfile?.userId);

  const totalScore = marks.reduce((sum, m) => sum + m.marksObtained, 0);
  const totalMax = marks.reduce((sum, m) => sum + m.maxMarks, 0);
  const gpaPercent = totalMax > 0 ? `${Math.round((totalScore / totalMax) * 100)}%` : '92.0%';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner - Blue, White, Red Collegiate Theme */}
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
              You are enrolled in the 2026-2028 G.C.E. Advanced Level Science cohort. Socrates Gemini Flash AI Tutor is ready to answer your subject questions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('calendar')}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-3 text-xs font-semibold text-white transition-colors"
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Timetable & Calendar</span>
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
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Academic Standing</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-stone-900 mt-2">{gpaPercent}</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-2">G.C.E. A/L Honors Range</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Attendance Rate</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-stone-900 mt-2">98.5%</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-2">Exemplary attendance</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Submitted Tasks</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-stone-900 mt-2">{myCompletedSubmissions.length}</p>
          <p className="text-[11px] text-stone-500 mt-2">{assignments.length} total active tasks</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Interactive Quizzes</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-stone-900 mt-2">{quizzes.length}</p>
          <p className="text-[11px] text-stone-500 mt-2">Objective tests available</p>
        </div>
      </div>

      {/* Main Student Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Coursework */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Active Coursework Assignments
                </h3>
                <p className="text-xs text-stone-500">
                  Submit solutions for evaluation by Zahira College faculty
                </p>
              </div>
              <button
                onClick={() => onNavigate('assignments')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {upcomingAssignments.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-stone-50 text-xs text-stone-500">
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
                      className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:border-amber-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-stone-900">{a.title}</h4>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              isSubmitted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isSubmitted ? 'Submitted' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1 line-clamp-1">{a.description}</p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Due: {new Date(a.dueDate).toLocaleDateString()} • Max Marks: {a.maxMarks}
                        </p>
                      </div>

                      <button
                        onClick={() => onNavigate('assignments')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors shrink-0"
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
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">
              Socrates AI Study Assistant
            </h3>
            <p className="text-xs text-stone-500 mb-4">
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
                  className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all group"
                >
                  <p className="text-xs font-bold text-stone-900 group-hover:text-amber-900">{item.title}</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">{item.topic}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
