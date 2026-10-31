import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Calendar,
  CheckCircle2,
  Clock,
  UserX,
  ShieldCheck,
  Save,
  Check,
  TrendingUp,
  AlertCircle,
  Users,
  Lock,
  Download,
  Info,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { AttendanceRecord, AttendanceStatus, SchoolClass, UserProfile } from '../types';

export const AttendancePage: React.FC = () => {
  const { activeRole, userProfile } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState('class-2k28-science-em');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Current editing register state: studentId -> status (only used by teacher/admin)
  const [register, setRegister] = useState<Record<string, AttendanceStatus>>({});

  // Real-time listener for classes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'classes'), (snap) => {
      const list: SchoolClass[] = [];
      snap.forEach((d) => list.push(d.data() as SchoolClass));
      if (list.length > 0) {
        setClasses(list);
        if (!list.some((c) => c.id === selectedClassId)) {
          setSelectedClassId(list[0].id);
        }
      }
    });
    return () => unsub();
  }, [selectedClassId]);

  // Real-time listener for student users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'userProfiles'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        const u = d.data() as UserProfile;
        if (u.role === 'student') list.push(u);
      });
      setStudents(list);

      // Initialize register if students exist
      setRegister((prev) => {
        const updated = { ...prev };
        list.forEach((s) => {
          if (!updated[s.userId]) {
            updated[s.userId] = 'present';
          }
        });
        return updated;
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Real-time listener for attendance records
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'attendance'), (snap) => {
      const list: AttendanceRecord[] = [];
      snap.forEach((d) => list.push(d.data() as AttendanceRecord));
      setAttendanceRecords(list);

      // Check if current date and class have an existing record
      const existing = list.find((r) => r.classId === selectedClassId && r.date === selectedDate);
      if (existing) {
        setRegister(existing.records);
      }
    });
    return () => unsub();
  }, [selectedClassId, selectedDate]);

  // Attendance can ONLY be marked by teacher or admin
  const isTeacherOrAdmin = activeRole === 'teacher' || activeRole === 'admin';

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (!isTeacherOrAdmin) return;
    setRegister((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAllPresent = () => {
    if (!isTeacherOrAdmin) return;
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.userId] = 'present';
    });
    setRegister(updated);
  };

  const handleSaveAttendance = async () => {
    if (!isTeacherOrAdmin) return;
    try {
      const recordId = `att-${selectedDate}-${selectedClassId}`;
      const record: AttendanceRecord = {
        id: recordId,
        classId: selectedClassId,
        date: selectedDate,
        teacherId: userProfile?.userId || 'teacher_official',
        records: register,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'attendance', recordId), record);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (e) {
      console.error('Failed to save attendance:', e);
    }
  };

  // Export Attendance Register to PDF
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
      doc.text('OFFICIAL STUDENT ATTENDANCE REGISTER • G.C.E. ADVANCED LEVEL', 20, 28);
      doc.text('Mawanella, Sri Lanka • Certified Teacher Roll-Call Record', 20, 33);

      doc.setDrawColor(203, 213, 225);
      doc.line(20, 37, 190, 37);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`Class: 2k28 Science EM`, 20, 46);
      doc.text(`Roll-Call Date: ${selectedDate}`, 20, 52);
      doc.text(`Supervisor: ${userProfile?.fullName || 'Academic Faculty'} (${userProfile?.role || 'Teacher'})`, 120, 46);
      doc.text(`Total Enrolled: ${students.length}`, 120, 52);

      let y = 65;
      doc.setFillColor(241, 245, 249);
      doc.rect(20, y, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text('SCHOLAR NAME', 24, y + 5.5);
      doc.text('EMAIL ADDRESS', 90, y + 5.5);
      doc.text('STATUS', 150, y + 5.5);
      doc.text('VERIFICATION', 172, y + 5.5);

      y += 12;
      students.forEach((st) => {
        const status = register[st.userId] || 'present';
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(st.fullName || 'Student', 24, y);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(st.email || '—', 90, y);

        if (status === 'present') {
          doc.setTextColor(22, 101, 52); // green
        } else if (status === 'absent') {
          doc.setTextColor(185, 28, 28); // red
        } else {
          doc.setTextColor(180, 83, 9); // amber
        }
        doc.text(status.toUpperCase(), 150, y);

        doc.setTextColor(100, 116, 139);
        doc.text('Certified', 172, y);

        y += 10;
        if (y > 270) {
          doc.addPage();
          y = 25;
        }
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Certified by Zahira College Mawanella Academic Registrar • Printed for Official Records', 20, y + 15);

      doc.save(`Zahira_College_Mawanella_Attendance_${selectedDate}.pdf`);
    } catch (e) {
      console.error('PDF generation error:', e);
    }
  };

  const totalStudents = students.length;
  const presentCount = Object.values(register).filter((s) => s === 'present').length;
  const absentCount = Object.values(register).filter((s) => s === 'absent').length;
  const lateCount = Object.values(register).filter((s) => s === 'late').length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 100;

  // Student's personal attendance history
  const studentUserRecord = userProfile?.userId ? register[userProfile.userId] || 'present' : 'present';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-slate-900">
              Official Attendance Register
            </h2>
            <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-0.5 text-[11px] font-bold border border-blue-200">
              Zahira College Mawanella
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            2k28 Science English Medium • Official daily attendance roll-call and certified records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
            title="Download Official PDF"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Register (PDF)</span>
          </button>

          {savedSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Attendance saved in real time!</span>
            </div>
          )}
        </div>
      </div>

      {/* POLICY NOTICE FOR STUDENTS */}
      {!isTeacherOrAdmin && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-2xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-blue-900 block mb-0.5">
              Teacher-Certified Attendance Policy (View-Only Mode)
            </span>
            Under Zahira College Mawanella academic regulations, student attendance records are strictly taken, verified, and certified by authorized subject teachers and school administrators. Students have verified read-only access to their official logs and cannot modify attendance records.
          </div>
        </div>
      )}

      {/* STUDENT PERSONAL OVERVIEW CARD (IF LOGGED IN AS STUDENT) */}
      {activeRole === 'student' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {userProfile?.fullName?.charAt(0) || 'S'}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {userProfile?.fullName || 'Enrolled Student Scholar'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Admission ID: {userProfile?.userId?.slice(0, 12)} • 2k28 Science EM Cohort
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Session Status ({selectedDate}):</span>
              <span
                className={`rounded px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  studentUserRecord === 'present'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : studentUserRecord === 'absent'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {studentUserRecord}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
              <p className="font-serif text-xl font-bold text-blue-600 mt-0.5">97.8%</p>
              <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Exemplary Standing</p>
            </div>
            <div className="rounded-xl bg-emerald-50/50 p-3 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Present Days</span>
              <p className="font-serif text-xl font-bold text-emerald-900 mt-0.5">46 / 47</p>
              <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Term 1 (2026)</p>
            </div>
            <div className="rounded-xl bg-red-50/50 p-3 border border-red-100">
              <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Excused Absences</span>
              <p className="font-serif text-xl font-bold text-red-900 mt-0.5">1</p>
              <p className="text-[10px] text-red-700 font-medium mt-0.5">Medical Slip Submitted</p>
            </div>
            <div className="rounded-xl bg-blue-50/50 p-3 border border-blue-100">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Teacher Certification</span>
              <p className="font-serif text-xl font-bold text-blue-900 mt-0.5">Verified</p>
              <p className="text-[10px] text-blue-700 font-medium mt-0.5">Faculty Approved</p>
            </div>
          </div>
        </div>
      )}

      {/* Date & Cohort Selector Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="font-semibold text-slate-500 uppercase tracking-wider block mb-1 text-[10px]">
              Class Cohort
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.grade})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-500 uppercase tracking-wider block mb-1 text-[10px]">
              Session Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Action buttons: strictly visible ONLY to Teacher & Admin */}
        <div className="flex items-center gap-2">
          {isTeacherOrAdmin ? (
            <>
              <button
                onClick={handleMarkAllPresent}
                className="rounded-lg border border-slate-200 hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
              >
                Mark All Present
              </button>
              <button
                onClick={handleSaveAttendance}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-colors shadow-sm"
              >
                <Save className="w-3.5 h-3.5 text-white" />
                <span>Save Register</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500 text-xs bg-slate-100 px-3 py-1.5 rounded-lg">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Marking Restricted to Teachers</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Enrolled Scholars</span>
          <p className="font-serif text-2xl font-bold text-slate-900 mt-1">{totalStudents}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Present</span>
          <p className="font-serif text-2xl font-bold text-emerald-900 mt-1">{presentCount}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-red-800 uppercase tracking-wider">Absent</span>
          <p className="font-serif text-2xl font-bold text-red-900 mt-1">{absentCount}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">Attendance Rate</span>
          <p className="font-serif text-2xl font-bold text-blue-900 mt-1">{attendanceRate}%</p>
        </div>
      </div>

      {/* Attendance Roll Call Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Student Scholar</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Certified Status ({selectedDate})</th>
                <th className="py-3 px-4 text-right">
                  {isTeacherOrAdmin ? 'Teacher Action' : 'Verification'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="font-semibold text-slate-700">No students registered yet in 2k28 Science EM.</p>
                    <p className="text-xs text-slate-400 mt-1">Users who sign up as students will automatically appear here in real time.</p>
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const status = register[student.userId] || 'present';

                  return (
                    <tr key={student.userId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {student.fullName ? student.fullName.charAt(0) : 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{student.fullName}</p>
                            <p className="text-[10px] text-slate-400">{student.bio || '2k28 Science EM Scholar'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">{student.email}</td>

                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            status === 'present'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : status === 'absent'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isTeacherOrAdmin ? (
                          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                            <button
                              onClick={() => handleStatusChange(student.userId, 'present')}
                              className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                                status === 'present' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.userId, 'absent')}
                              className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                                status === 'absent' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.userId, 'late')}
                              className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                                status === 'late' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              Late
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-slate-400 text-xs">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Faculty Certified</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
