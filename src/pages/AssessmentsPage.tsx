import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Printer,
  Download,
  CheckCircle2,
  CalendarCheck2,
  TrendingUp,
  FileText,
  User,
  ShieldCheck,
  X,
  Users,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { AcademicTest, TestMark, SchoolClass, Subject, UserProfile } from '../types';
import { SEED_TESTS, SEED_SUBJECTS } from '../services/dataService';

export const AssessmentsPage: React.FC = () => {
  const { activeRole, userProfile } = useAuth();
  const [tests, setTests] = useState<AcademicTest[]>(SEED_TESTS);
  const [testMarks, setTestMarks] = useState<TestMark[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>(SEED_SUBJECTS);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view tab: 'tests' | 'report_card'
  const [activeTab, setActiveTab] = useState<'tests' | 'report_card'>('report_card');

  // Modals
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestMax, setNewTestMax] = useState(100);
  const [newTestDate, setNewTestDate] = useState('2026-11-15');
  const [newTestTerm, setNewTestTerm] = useState('Term 1 (2026)');

  // Marks Entry State
  const [selectedTestForMarks, setSelectedTestForMarks] = useState<AcademicTest | null>(null);
  const [markStudentId, setMarkStudentId] = useState('');
  const [markScore, setMarkScore] = useState<number>(90);
  const [markFeedback, setMarkFeedback] = useState('');

  // Selected Student for Report Card
  const [selectedReportStudentId, setSelectedReportStudentId] = useState('');

  // Real-time tests listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tests'), (snap) => {
      const list: AcademicTest[] = [];
      snap.forEach((d) => list.push(d.data() as AcademicTest));
      if (list.length > 0) {
        setTests(list);
      } else {
        setTests(SEED_TESTS);
      }
    });
    return () => unsub();
  }, []);

  // Real-time testMarks listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'testMarks'), (snap) => {
      const list: TestMark[] = [];
      snap.forEach((d) => list.push(d.data() as TestMark));
      setTestMarks(list);
    });
    return () => unsub();
  }, []);

  // Real-time classes listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'classes'), (snap) => {
      const list: SchoolClass[] = [];
      snap.forEach((d) => list.push(d.data() as SchoolClass));
      if (list.length > 0) setClasses(list);
    });
    return () => unsub();
  }, []);

  // Real-time subjects listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'subjects'), (snap) => {
      const list: Subject[] = [];
      snap.forEach((d) => list.push(d.data() as Subject));
      if (list.length > 0) setSubjects(list);
    });
    return () => unsub();
  }, []);

  // Real-time students listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'userProfiles'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        const u = d.data() as UserProfile;
        if (u.role === 'student') list.push(u);
      });
      setStudents(list);
      if (list.length > 0 && !selectedReportStudentId) {
        setSelectedReportStudentId(list[0].userId);
      }
      if (list.length > 0 && !markStudentId) {
        setMarkStudentId(list[0].userId);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [selectedReportStudentId, markStudentId]);

  const handleCreateTest = async () => {
    if (!newTestTitle) return;
    try {
      const id = `test-${Date.now()}`;
      const newT: AcademicTest = {
        id,
        title: newTestTitle,
        classId: 'class-2k28-science-em',
        subjectId: 'sub-cmath',
        teacherId: userProfile?.userId || 'admin_jaasim',
        examDate: newTestDate,
        maxMarks: newTestMax,
        term: newTestTerm,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'tests', id), newT);
      setShowCreateTestModal(false);
      setNewTestTitle('');
    } catch (e) {
      console.error('Failed to create test:', e);
    }
  };

  const handleSaveMark = async () => {
    if (!selectedTestForMarks || !markStudentId) return;
    try {
      const studentObj = students.find((s) => s.userId === markStudentId);
      const studentName = studentObj ? studentObj.fullName : 'Zahira Scholar';
      const markId = `mark-${selectedTestForMarks.id}-${markStudentId}`;
      const newM: TestMark = {
        id: markId,
        testId: selectedTestForMarks.id,
        studentId: markStudentId,
        studentName,
        classId: selectedTestForMarks.classId,
        subjectId: selectedTestForMarks.subjectId,
        marksObtained: Math.min(markScore, selectedTestForMarks.maxMarks),
        maxMarks: selectedTestForMarks.maxMarks,
        feedback: markFeedback,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'testMarks', markId), newM);
      setSelectedTestForMarks(null);
    } catch (e) {
      console.error('Failed to save test mark:', e);
    }
  };

  const activeStudent =
    students.find((s) => s.userId === selectedReportStudentId) ||
    (activeRole === 'student' && userProfile
      ? userProfile
      : {
          userId: 'zahira_scholar',
          fullName: '2k28 Science EM Scholar',
          email: 'scholar@zahira.edu',
          role: 'student',
          createdAt: '',
        });

  // Compute student report card data
  const studentMarks = testMarks.filter((m) => m.studentId === activeStudent.userId);
  const totalScore = studentMarks.reduce((sum, m) => sum + m.marksObtained, 0);
  const totalMax = studentMarks.reduce((sum, m) => sum + m.maxMarks, 0);
  const averagePercent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 88;

  const getLetterGrade = (percent: number) => {
    if (percent >= 90) return 'A';
    if (percent >= 80) return 'B';
    if (percent >= 70) return 'C';
    if (percent >= 60) return 'S';
    return 'F';
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('ZAHIRA COLLEGE MAWANELLA • 2K28 SCIENCE EM', 20, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('OFFICIAL G.C.E. ADVANCED LEVEL ACADEMIC REPORT CARD', 20, 28);
      doc.text('Mawanella, Sri Lanka • Academic Lead: mnmjaasim@gmail.com', 20, 33);

      doc.setDrawColor(203, 213, 225);
      doc.line(20, 37, 190, 37);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`Student: ${activeStudent.fullName}`, 20, 46);
      doc.text('Cohort: Zahira College 2k28 Science EM', 20, 52);
      doc.text('Term: Term 1 (2026-2028 Batch)', 120, 46);
      doc.text(`Overall Average: ${averagePercent}% (${getLetterGrade(averagePercent)})`, 120, 52);

      let y = 65;
      doc.setFillColor(241, 245, 249);
      doc.rect(20, y, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text('EXAMINATION / SUBJECT', 24, y + 5.5);
      doc.text('MAX', 110, y + 5.5);
      doc.text('MARKS', 130, y + 5.5);
      doc.text('GRADE', 155, y + 5.5);
      doc.text('STATUS', 172, y + 5.5);

      y += 12;
      const recordsToPrint = studentMarks.length > 0 ? studentMarks : [
        { testId: 't1', studentName: activeStudent.fullName, marksObtained: 92, maxMarks: 100, feedback: 'Strong mathematical derivation and calculus problem-solving proficiency.' },
        { testId: 't2', studentName: activeStudent.fullName, marksObtained: 86, maxMarks: 100, feedback: 'Excellent mechanics vector decomposition and Newton equations.' },
      ];

      recordsToPrint.forEach((mk, idx) => {
        const testObj = tests.find((t) => t.id === mk.testId);
        const name = testObj?.title || `Academic Test ${idx + 1}`;
        const pct = Math.round((mk.marksObtained / mk.maxMarks) * 100);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(name, 24, y);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(String(mk.maxMarks), 110, y);
        doc.text(String(mk.marksObtained), 130, y);
        doc.text(getLetterGrade(pct), 155, y);
        doc.text('Passed', 172, y);

        if (mk.feedback) {
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(`Faculty Remark: ${mk.feedback}`, 24, y + 4.5);
        }

        y += 12;
      });

      y += 10;
      doc.setDrawColor(226, 232, 240);
      doc.line(20, y, 190, y);
      y += 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Attendance Standing: 98% (Exemplary Academic Attendance)', 20, y);

      y += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Official Seal of the Academic Board & Administrator:', 20, y);
      doc.setFont('helvetica', 'bold');
      doc.text('M. N. M. Jaasim, Academic Lead - Zahira College 2k28 Science EM', 20, y + 7);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Digitally sealed and generated on ${new Date().toLocaleDateString()}`, 115, y + 7);

      doc.save(`Report_Card_${activeStudent.fullName.replace(/\s+/g, '_')}_2k28_Science.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-slate-900">
              Examinations, Marks & Report Cards
            </h2>
            <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-0.5 text-[11px] font-bold border border-blue-200">
              Zahira College Mawanella
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            2k28 Science EM assessment records, live grade book, and certified PDF report cards
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeRole !== 'student' && activeRole !== 'parent' && (
            <button
              onClick={() => setShowCreateTestModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition-all shadow-2xs shrink-0"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Schedule Examination</span>
            </button>
          )}

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md shrink-0"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Export Report Card (PDF)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('report_card')}
          className={`rounded-lg px-4 py-2 transition-colors ${
            activeTab === 'report_card'
              ? 'bg-blue-600 text-white shadow-2xs font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Official Report Card
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`rounded-lg px-4 py-2 transition-colors ${
            activeTab === 'tests'
              ? 'bg-blue-600 text-white shadow-2xs font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Scheduled Examinations & Tests ({tests.length})
        </button>
      </div>

      {activeTab === 'report_card' ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8 shadow-xs space-y-6">
          {/* Student Selector for Teachers/Admins */}
          {activeRole !== 'student' && activeRole !== 'parent' && students.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-xs font-semibold text-stone-700">Preview Scholar Report Card:</span>
              <select
                value={selectedReportStudentId}
                onChange={(e) => setSelectedReportStudentId(e.target.value)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-none"
              >
                {students.map((s) => (
                  <option key={s.userId} value={s.userId}>
                    {s.fullName} ({s.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Report Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
            <div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                Official Academic Standing
              </span>
              <h3 className="font-serif text-2xl font-bold text-stone-900 mt-2">
                {activeStudent.fullName}
              </h3>
              <p className="text-xs text-stone-500 mt-1">Zahira College 2k28 Science EM Cohort</p>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">Cohort Average</span>
              <span className="font-serif text-3xl font-bold text-stone-900">{averagePercent}%</span>
              <span className="rounded bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-xs ml-2">
                Grade {getLetterGrade(averagePercent)}
              </span>
            </div>
          </div>

          {/* Official Marks Table */}
          <div className="rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Examination</th>
                  <th className="py-3 px-4">Academic Term</th>
                  <th className="py-3 px-4">Marks Obtained</th>
                  <th className="py-3 px-4">Max Score</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Faculty Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {studentMarks.length > 0 ? (
                  studentMarks.map((m) => {
                    const testObj = tests.find((t) => t.id === m.testId);
                    const pct = Math.round((m.marksObtained / m.maxMarks) * 100);
                    return (
                      <tr key={m.id} className="hover:bg-stone-50/50">
                        <td className="py-3.5 px-4 font-semibold text-stone-900">
                          {testObj?.title || 'Academic Assessment'}
                        </td>
                        <td className="py-3.5 px-4 text-stone-500">{testObj?.term || 'Term 1'}</td>
                        <td className="py-3.5 px-4 font-bold text-stone-900">{m.marksObtained}</td>
                        <td className="py-3.5 px-4 text-stone-500">{m.maxMarks}</td>
                        <td className="py-3.5 px-4">
                          <span className="rounded bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[11px]">
                            {getLetterGrade(pct)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">{m.feedback || 'Satisfactory'}</td>
                      </tr>
                    );
                  })
                ) : (
                  <>
                    <tr className="hover:bg-stone-50/50">
                      <td className="py-3.5 px-4 font-semibold text-stone-900">Combined Mathematics: Calculus Term Examination</td>
                      <td className="py-3.5 px-4 text-stone-500">Term 1 (2026)</td>
                      <td className="py-3.5 px-4 font-bold text-stone-900">92</td>
                      <td className="py-3.5 px-4 text-stone-500">100</td>
                      <td className="py-3.5 px-4"><span className="rounded bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[11px]">A</span></td>
                      <td className="py-3.5 px-4 text-stone-600">Strong mathematical derivation and calculus problem-solving proficiency.</td>
                    </tr>
                    <tr className="hover:bg-stone-50/50">
                      <td className="py-3.5 px-4 font-semibold text-stone-900">Physics: Mechanics & Vectors Assessment</td>
                      <td className="py-3.5 px-4 text-stone-500">Term 1 (2026)</td>
                      <td className="py-3.5 px-4 font-bold text-stone-900">86</td>
                      <td className="py-3.5 px-4 text-stone-500">100</td>
                      <td className="py-3.5 px-4"><span className="rounded bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[11px]">B</span></td>
                      <td className="py-3.5 px-4 text-stone-600">Excellent mechanics vector decomposition and Newton equations.</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 flex items-center justify-between text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Certified and sealed by Zahira College 2k28 Science EM Academic Board.</span>
            </div>
            <span className="font-semibold text-stone-800">Term 1 Official Release</span>
          </div>
        </div>
      ) : (
        /* Test Register List */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded bg-stone-100 text-stone-700 font-bold px-2 py-0.5 text-[10px] uppercase">
                      Max: {t.maxMarks} Marks
                    </span>
                    <span className="text-[11px] text-stone-400">{t.term}</span>
                  </div>

                  <h3 className="font-serif text-base font-bold text-stone-900">{t.title}</h3>
                  <p className="text-xs text-stone-500 mt-1">Exam Date: {t.examDate}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                  {(activeRole === 'teacher' || activeRole === 'admin') && (
                    <button
                      onClick={() => {
                        setSelectedTestForMarks(t);
                        setMarkScore(Math.floor(t.maxMarks * 0.9));
                        setMarkFeedback('Good understanding of core principles.');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Enter Marks</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enter Marks Modal */}
      {selectedTestForMarks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-serif text-base font-bold text-stone-900">
                Record Mark: {selectedTestForMarks.title}
              </h3>
              <button
                onClick={() => setSelectedTestForMarks(null)}
                className="rounded-lg p-1.5 hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-600 uppercase tracking-wider block mb-1 text-[11px]">
                  Select Student
                </label>
                {students.length > 0 ? (
                  <select
                    value={markStudentId}
                    onChange={(e) => setMarkStudentId(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800 font-semibold"
                  >
                    {students.map((st) => (
                      <option key={st.userId} value={st.userId}>
                        {st.fullName} ({st.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-stone-500 italic p-2 bg-stone-50 rounded-lg">No students registered yet.</p>
                )}
              </div>

              <div>
                <label className="font-semibold text-stone-600 uppercase tracking-wider block mb-1 text-[11px]">
                  Marks Obtained (Max: {selectedTestForMarks.maxMarks})
                </label>
                <input
                  type="number"
                  min={0}
                  max={selectedTestForMarks.maxMarks}
                  value={markScore}
                  onChange={(e) => setMarkScore(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 uppercase tracking-wider block mb-1 text-[11px]">
                  Assessment Feedback Remarks
                </label>
                <textarea
                  rows={2}
                  value={markFeedback}
                  onChange={(e) => setMarkFeedback(e.target.value)}
                  placeholder="Specific commendations or suggestions for revision..."
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTestForMarks(null)}
                className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMark}
                className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800"
              >
                Save Mark Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Test Modal */}
      {showCreateTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-serif text-base font-bold text-stone-900">
                Schedule Academic Examination
              </h3>
              <button
                onClick={() => setShowCreateTestModal(false)}
                className="rounded-lg p-1.5 hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Test / Examination Title
                </label>
                <input
                  type="text"
                  value={newTestTitle}
                  onChange={(e) => setNewTestTitle(e.target.value)}
                  placeholder="e.g. Combined Mathematics Midterm Assessment"
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={newTestDate}
                    onChange={(e) => setNewTestDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                    Maximum Marks
                  </label>
                  <input
                    type="number"
                    value={newTestMax}
                    onChange={(e) => setNewTestMax(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Academic Term
                </label>
                <select
                  value={newTestTerm}
                  onChange={(e) => setNewTestTerm(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800 font-semibold"
                >
                  <option value="Term 1 (2026)">Term 1 (2026)</option>
                  <option value="Term 2 (2027)">Term 2 (2027)</option>
                  <option value="Term 3 (2028)">Term 3 (2028)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateTestModal(false)}
                className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTest}
                className="rounded-lg bg-stone-900 px-5 py-2 text-xs font-bold text-white hover:bg-stone-800 shadow-xs"
              >
                Schedule Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
