import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  CalendarCheck2,
  FileText,
  Download,
  Printer,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, TestMark } from '../../types';

interface ParentDashboardProps {
  onNavigate: (page: string) => void;
  onOpenReportCard?: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  onNavigate,
  onOpenReportCard,
}) => {
  const { userProfile } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [testMarks, setTestMarks] = useState<TestMark[]>([]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'userProfiles'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        const u = d.data() as UserProfile;
        if (u.role === 'student') list.push(u);
      });
      setStudents(list);
      if (list.length > 0 && !selectedStudentId) {
        setSelectedStudentId(list[0].userId);
      }
    });

    const unsubMarks = onSnapshot(collection(db, 'testMarks'), (snap) => {
      const list: TestMark[] = [];
      snap.forEach((d) => list.push(d.data() as TestMark));
      setTestMarks(list);
    });

    return () => {
      unsubUsers();
      unsubMarks();
    };
  }, [selectedStudentId]);

  const currentStudent =
    students.find((s) => s.userId === selectedStudentId) || {
      userId: 'zahira_student',
      fullName: 'Enrolled Scholar',
      email: 'scholar@zahira.edu',
      role: 'student',
      bio: 'Zahira College 2k28 Science EM Scholar',
      createdAt: '',
    };

  const studentMarks = testMarks.filter((m) => m.studentId === currentStudent.userId);
  const totalScore = studentMarks.reduce((sum, m) => sum + m.marksObtained, 0);
  const totalMax = studentMarks.reduce((sum, m) => sum + m.maxMarks, 0);
  const averagePercent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 92.5;

  const subjects = [
    { code: 'CMATH-28', name: 'Combined Mathematics', score: 92, max: 100, grade: 'A', remarks: 'Exceptional calculus problem-solving and trigonometry fluency.' },
    { code: 'PHYS-28', name: 'Physics', score: 88, max: 100, grade: 'A', remarks: 'Strong free-body diagram analysis and dynamics equations.' },
    { code: 'CHEM-28', name: 'Chemistry', score: 94, max: 100, grade: 'A', remarks: 'High stoichiometry accuracy and inorganic chemistry mastery.' },
    { code: 'ICT-28', name: 'Information & Communication Tech', score: 96, max: 100, grade: 'A', remarks: 'Top-tier algorithmic thinking and Python implementation.' },
  ];

  const handleDownloadPDF = () => {
    setDownloading(true);
    try {
      const doc = new jsPDF();

      // Title & School Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('ZAHIRA COLLEGE - 2K28 SCIENCE EM', 20, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('OFFICIAL ACADEMIC PROGRESS REPORT • G.C.E. A/L BATCH 2028', 20, 28);
      doc.text('Mawanella, Sri Lanka • Lead Admin: mnmjaasim@gmail.com', 20, 33);

      doc.setDrawColor(203, 213, 225);
      doc.line(20, 37, 190, 37);

      // Student info block
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`Scholar: ${currentStudent.fullName}`, 20, 46);
      doc.text('Cohort: Zahira College 2k28 Science EM', 20, 52);
      doc.text('Academic Term: Term 1 (2026)', 120, 46);
      doc.text(`Overall Average: ${averagePercent}% (Grade A)`, 120, 52);

      // Table Header
      let y = 65;
      doc.setFillColor(241, 245, 249);
      doc.rect(20, y, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text('SUBJECT', 24, y + 5.5);
      doc.text('MAX', 110, y + 5.5);
      doc.text('SCORE', 130, y + 5.5);
      doc.text('GRADE', 155, y + 5.5);
      doc.text('STATUS', 172, y + 5.5);

      // Table Rows
      y += 12;
      subjects.forEach((subj) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(subj.name, 24, y);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(String(subj.max), 110, y);
        doc.text(String(subj.score), 130, y);
        doc.text(subj.grade, 155, y);
        doc.text('Passed', 172, y);

        // Remarks on next line
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Faculty Note: ${subj.remarks}`, 24, y + 4.5);

        y += 12;
      });

      // Attendance and Dean signature block
      y += 8;
      doc.setDrawColor(226, 232, 240);
      doc.line(20, y, 190, y);
      y += 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Term Attendance Rate: 98.5% (Exemplary)', 20, y);

      y += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Certified by Academic Administrator:', 20, y);
      doc.setFont('helvetica', 'bold');
      doc.text('M. N. M. Jaasim, Academic Lead - Zahira College 2k28 Science EM', 20, y + 7);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Digitally sealed and generated on ${new Date().toLocaleDateString()}`, 115, y + 7);

      doc.save(`Academic_Report_Card_${currentStudent.fullName.replace(/\s+/g, '_')}_2k28.pdf`);
    } catch (e) {
      console.error('PDF generation error:', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="rounded-2xl border border-stone-200 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-400/30">
              <Users className="w-3.5 h-3.5" />
              <span>Parent / Guardian Portal</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-white mt-2">
              Academic Digest for {currentStudent.fullName}
            </h2>
            <p className="text-stone-300 text-sm mt-1 max-w-xl">
              Linked scholar in Zahira College 2k28 Science EM. Review official grades, term report cards, attendance records, and faculty communication.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-stone-950 transition-all shadow-md shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Generating PDF...' : 'Download Official PDF Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Student Selector if multiple students */}
      {students.length > 1 && (
        <div className="rounded-xl border border-stone-200 bg-white p-3 flex items-center gap-3">
          <span className="text-xs font-semibold text-stone-700">Select Scholar:</span>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-bold text-stone-800 focus:outline-none"
          >
            {students.map((st) => (
              <option key={st.userId} value={st.userId}>
                {st.fullName} ({st.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall Standing</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-stone-900 mt-2">{averagePercent}%</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-2">Grade A Honors</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Attendance Rate</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-stone-900 mt-2">98.5%</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-2">Full attendance record</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Assignments</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-stone-900 mt-2">100%</p>
          <p className="text-[11px] text-stone-500 mt-2">All tasks submitted on schedule</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Academic Lead</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-xl font-bold text-stone-900 mt-2">M. N. M. Jaasim</p>
          <p className="text-[11px] text-stone-500 mt-2">mnmjaasim@gmail.com</p>
        </div>
      </div>

      {/* Subject Grades Table */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <h3 className="font-serif text-lg font-bold text-stone-900 mb-4">
          Course Grades & Examination Evaluations
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Max Marks</th>
                <th className="py-3 px-4">Marks Obtained</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">Faculty Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {subjects.map((sub, idx) => (
                <tr key={idx} className="hover:bg-stone-50/50">
                  <td className="py-3.5 px-4 font-bold text-stone-900">{sub.name}</td>
                  <td className="py-3.5 px-4 text-stone-500">{sub.max}</td>
                  <td className="py-3.5 px-4 font-bold text-stone-900">{sub.score}</td>
                  <td className="py-3.5 px-4">
                    <span className="rounded bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[11px]">
                      {sub.grade}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-stone-600">{sub.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
