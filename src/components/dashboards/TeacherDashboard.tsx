import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  GraduationCap,
  FileText,
  Award,
  CalendarCheck2,
  Sparkles,
  ArrowRight,
  BrainCircuit,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Plus,
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { SchoolClass, Assignment, Submission, Discussion, Quiz } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface TeacherDashboardProps {
  onNavigate: (page: string) => void;
  onGradeSubmission?: (sub: Submission) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onNavigate,
  onGradeSubmission,
}) => {
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time synchronization
  useEffect(() => {
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      const list: SchoolClass[] = [];
      snap.forEach((d) => list.push(d.data() as SchoolClass));
      setClasses(list);
    });

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
      setLoading(false);
    });

    return () => {
      unsubClasses();
      unsubAssignments();
      unsubSubmissions();
      unsubQuizzes();
    };
  }, []);

  const pendingSubmissions = submissions.filter((s) => s.status === 'submitted' || s.status === 'under_review');
  const myClasses = classes.length > 0 ? classes : [
    {
      id: 'class-2k28-science-em',
      name: '2k28 Science EM',
      grade: 'A/L Batch 2028',
      academicYear: '2026-2028',
      description: 'Zahira College 2k28 Science EM Cohort',
      room: 'Science Complex - Hall 28',
      teacherIds: [],
      studentIds: [],
      subjectIds: [],
      createdAt: '',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner - Blue, White, Red Collegiate Theme */}
      <div className="rounded-2xl border border-blue-900 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zahira College Mawanella • Faculty Workspace</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-white mt-2 flex items-center flex-wrap gap-2">
              <span>Welcome back, {userProfile?.fullName || 'Faculty Instructor'}</span>
              {userProfile?.subject && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-600/30 text-white border border-red-400 font-sans font-semibold">
                  {userProfile.subject}
                </span>
              )}
            </h2>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              You are managing the Zahira College 2k28 Science EM cohort. You have {pendingSubmissions.length} coursework submission(s) awaiting grading review. Gemini Flash AI is active.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('quizzes')}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gemini Flash Quiz Generator</span>
            </button>
            <button
              onClick={() => onNavigate('calendar')}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-semibold text-white transition-colors"
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Calendar & Attendance</span>
            </button>
            <button
              onClick={() => onNavigate('teacher_assistant')}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-semibold text-white transition-colors"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Lesson Planner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Assigned Classes</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-stone-900 mt-2">{myClasses.length}</p>
          <p className="text-[11px] text-stone-500 mt-2">2k28 Science EM (A/L Batch 2028)</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Grading</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-stone-900 mt-2">{pendingSubmissions.length}</p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-amber-700 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Gemini Flash rubric ready</span>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Quizzes</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-stone-900 mt-2">{quizzes.length}</p>
          <p className="text-[11px] text-stone-500 mt-2">Auto-scored objective questions</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Attendance Register</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-stone-900 mt-2">Live</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-2">Real-time roll call enabled</p>
        </div>
      </div>

      {/* Main Action Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions Pending Grading - 2 columns */}
        <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Pending Submissions Review
              </h3>
              <p className="text-xs text-stone-500">
                Evaluate student coursework with Gemini Flash AI rubric suggestions
              </p>
            </div>
            <button
              onClick={() => onNavigate('assignments')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>View All Assignments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {pendingSubmissions.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-stone-50 border border-stone-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-stone-800">All submissions graded!</p>
                <p className="text-xs text-stone-500 mt-1">There are no pending submissions awaiting review right now.</p>
              </div>
            ) : (
              pendingSubmissions.map((sub) => {
                const parentAssign = assignments.find((a) => a.id === sub.assignmentId);
                return (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:border-amber-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-stone-900">{sub.studentName}</h4>
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase">
                          Pending Review
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-1">
                        {parentAssign?.title || 'Academic Assignment Submission'}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Submitted: {new Date(sub.submittedAt).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (onGradeSubmission) {
                          onGradeSubmission(sub);
                        } else {
                          onNavigate('assignments');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Grade with AI</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Tools & Academic Shortcuts - 1 column */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-3">
              Faculty AI Assistant Suite
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Accelerate curriculum preparation and grading with Gemini Flash AI.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('quizzes')}
                className="flex items-center justify-between w-full p-3 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all text-left"
              >
                <div>
                  <p className="text-xs font-bold text-stone-900">Quiz Generator</p>
                  <p className="text-[11px] text-stone-500">Topic, difficulty & question count</p>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>

              <button
                onClick={() => onNavigate('teacher_assistant')}
                className="flex items-center justify-between w-full p-3 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all text-left"
              >
                <div>
                  <p className="text-xs font-bold text-stone-900">Lesson Plan Generator</p>
                  <p className="text-[11px] text-stone-500">Syllabus breakdown & time pacing</p>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>

              <button
                onClick={() => onNavigate('teacher_assistant')}
                className="flex items-center justify-between w-full p-3 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all text-left"
              >
                <div>
                  <p className="text-xs font-bold text-stone-900">Grading Rubric Architect</p>
                  <p className="text-[11px] text-stone-500">Structured evaluation matrix</p>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>

              <button
                onClick={() => onNavigate('attendance')}
                className="flex items-center justify-between w-full p-3 rounded-xl border border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all text-left"
              >
                <div>
                  <p className="text-xs font-bold text-stone-900">Attendance Register</p>
                  <p className="text-[11px] text-stone-500">Mark Present / Absent / Late</p>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
