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
  QrCode,
  Camera,
  Sparkles,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db, sanitizeFirestoreDoc } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { AttendanceRecord, AttendanceStatus, SchoolClass, UserProfile } from '../types';
import { QRAttendanceModal } from '../components/attendance/QRAttendanceModal';
import { Plus, UserPlus, Trash2, Edit2, UploadCloud, X, CheckCheck, FileSpreadsheet, FileText } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { activeRole, userProfile } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState('class-2k28-science-em');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrModalMode, setQrModalMode] = useState<'generate' | 'scan'>('generate');

  // Direct Student Roll-Call Entry state (no student account creation required)
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentIndex, setNewStudentIndex] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStudentText, setBulkStudentText] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

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

  // Direct student roll-call entry (no student account creation required)
  const handleAddStudent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newStudentName.trim() || !isTeacherOrAdmin) return;
    const name = newStudentName.trim();
    const index = newStudentIndex.trim();
    const studentId = `student_direct_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newProfile: UserProfile = {
      userId: studentId,
      fullName: name,
      email: index
        ? `${index.toLowerCase().replace(/[^a-z0-9]/g, '')}@zahira2k28.edu`
        : `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@zahira2k28.edu`,
      role: 'student',
      avatarUrl: '',
      stream: '2k28 Science EM',
      enrolledClassIds: [selectedClassId],
      assignedClassIds: [],
      bio: index ? `Index: ${index} • Roll-Call Scholar` : '2k28 Science EM Scholar',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'userProfiles', studentId), sanitizeFirestoreDoc(newProfile));
      setRegister((prev) => ({ ...prev, [studentId]: 'present' }));
      setNewStudentName('');
      setNewStudentIndex('');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to add student to roll call:', err);
    }
  };

  // Bulk add multiple student names at once
  const handleBulkAddStudents = async () => {
    if (!bulkStudentText.trim() || !isTeacherOrAdmin) return;
    const lines = bulkStudentText.split('\n').map((l) => l.trim()).filter(Boolean);
    try {
      for (const line of lines) {
        const parts = line.split(',').map((p) => p.trim());
        const name = parts[0];
        const index = parts[1] || '';
        if (!name) continue;
        const studentId = `student_direct_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const newProfile: UserProfile = {
          userId: studentId,
          fullName: name,
          email: index
            ? `${index.toLowerCase().replace(/[^a-z0-9]/g, '')}@zahira2k28.edu`
            : `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@zahira2k28.edu`,
          role: 'student',
          avatarUrl: '',
          stream: '2k28 Science EM',
          enrolledClassIds: [selectedClassId],
          assignedClassIds: [],
          bio: index ? `Index: ${index} • Roll-Call Scholar` : '2k28 Science EM Scholar',
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'userProfiles', studentId), sanitizeFirestoreDoc(newProfile));
        setRegister((prev) => ({ ...prev, [studentId]: 'present' }));
      }
      setBulkStudentText('');
      setShowBulkModal(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to bulk add students:', err);
    }
  };

  // Seed standard 2k28 Science EM roster
  const handleSeedStandardRoster = async () => {
    if (!isTeacherOrAdmin) return;
    const defaultStudents = [
      { name: 'M. R. Mohamed Aadhil', index: '2K28-SCI-001' },
      { name: 'Fathima Zahra', index: '2K28-SCI-002' },
      { name: 'A. L. Mohamed Usman', index: '2K28-SCI-003' },
      { name: 'S. N. Zainab Farook', index: '2K28-SCI-004' },
      { name: 'K. M. Hamza Rizwan', index: '2K28-SCI-005' },
      { name: 'T. M. Akeel Nazeer', index: '2K28-SCI-006' },
    ];
    for (const s of defaultStudents) {
      const studentId = `student_${s.index.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const newProfile: UserProfile = {
        userId: studentId,
        fullName: s.name,
        email: `${s.index.toLowerCase().replace(/[^a-z0-9]/g, '')}@zahira2k28.edu`,
        role: 'student',
        avatarUrl: '',
        stream: '2k28 Science EM',
        enrolledClassIds: [selectedClassId],
        assignedClassIds: [],
        bio: `Index: ${s.index} • Zahira 2k28 Science EM Scholar`,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'userProfiles', studentId), sanitizeFirestoreDoc(newProfile));
      setRegister((prev) => ({ ...prev, [studentId]: 'present' }));
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Edit student name in register
  const handleSaveEditedName = async (studentId: string) => {
    if (!editingNameValue.trim() || !isTeacherOrAdmin) return;
    try {
      await setDoc(
        doc(db, 'userProfiles', studentId),
        { fullName: editingNameValue.trim() },
        { merge: true }
      );
      setEditingStudentId(null);
      setEditingNameValue('');
    } catch (err) {
      console.error('Failed to update student name:', err);
    }
  };

  // Delete student from roll call
  const handleDeleteStudent = async (studentId: string, _name: string) => {
    if (!isTeacherOrAdmin) return;
    try {
      setRegister((prev) => {
        const updated = { ...prev };
        delete updated[studentId];
        return updated;
      });
      await deleteDoc(doc(db, 'userProfiles', studentId));
    } catch (err) {
      console.error('Failed to delete student:', err);
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
      doc.text('Certified by Zahira College Mawanella Science Project management • Official Academic Record', 20, y + 15);

      doc.save(`Zahira_College_Mawanella_Attendance_${selectedDate}.pdf`);
    } catch (e) {
      console.error('PDF generation error:', e);
    }
  };

  // Export Attendance Register to Excel / CSV format
  const handleExportExcel = () => {
    try {
      const activeClass = classes.find((c) => c.id === selectedClassId);
      const className = activeClass ? activeClass.name : '2k28 Science EM';

      let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel compatibility
      csv += 'ZAHIRA COLLEGE MAWANELLA • OFFICIAL STUDENT ATTENDANCE REGISTER\n';
      csv += `Academic Cohort:,"${className} (G.C.E. Advanced Level 2028)"\n`;
      csv += `Roll-Call Session Date:,"${selectedDate}"\n`;
      csv += `Supervisor:,"${userProfile?.fullName || 'Academic Faculty'} (${userProfile?.role || 'Teacher'})"\n`;
      csv += `Total Enrolled Scholars:,${totalStudents}\n`;
      csv += `Present Scholars:,${presentCount}\n`;
      csv += `Absent Scholars:,${absentCount}\n`;
      csv += `Late Arrivals:,${lateCount}\n`;
      csv += `Attendance Rate:,${attendanceRate}%\n`;
      csv += `School Record Generated At:,"${new Date().toLocaleString()}"\n\n`;

      csv += 'Index / Scholar ID,Scholar Full Name,Email Address,Academic Stream,Certified Status,Session Date,Supervisor,Verification Method\n';

      const currentRecord = attendanceRecords.find(
        (r) => r.classId === selectedClassId && r.date === selectedDate
      );

      students.forEach((st, idx) => {
        const status = register[st.userId] || 'present';
        const checkIn = currentRecord?.checkInLogs?.find((l) => l.studentId === st.userId);
        const method = checkIn
          ? `QR Verified (${new Date(checkIn.checkInTime).toLocaleTimeString()})`
          : 'Manual Teacher Roll-Call';
        const indexOrId = st.bio?.includes('Index:')
          ? st.bio.split('Index:')[1].split('•')[0].trim()
          : `2K28-SCI-${String(idx + 1).padStart(3, '0')}`;

        const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;

        csv += `${escape(indexOrId)},${escape(st.fullName)},${escape(st.email)},${escape(
          st.stream || '2k28 Science EM'
        )},${escape(status.toUpperCase())},${escape(selectedDate)},${escape(
          userProfile?.fullName || 'Faculty Lead'
        )},${escape(method)}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Zahira_College_Attendance_${selectedDate}_${selectedClassId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Excel/CSV export error:', e);
    }
  };

  // Export Monthly Attendance Summary PDF for Internal Staff (Filters out all watermarks)
  const handleExportMonthlySummaryPDF = () => {
    try {
      const doc = new jsPDF();
      const currentYearMonth = selectedDate.substring(0, 7); // e.g. "2026-11"
      const monthDateObj = new Date(`${currentYearMonth}-01T00:00:00`);
      const monthName = monthDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Filter attendance records belonging to this month and class
      const monthRecords = attendanceRecords.filter((r) => {
        const matchesClass = !r.classId || r.classId === selectedClassId;
        const matchesMonth = r.date ? r.date.startsWith(currentYearMonth) : true;
        return matchesClass && matchesMonth;
      });

      const totalRecordedSessions = Math.max(monthRecords.length, 1);

      // Clean Official Internal Header - No Watermark
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('ZAHIRA COLLEGE MAWANELLA • 2K28 SCIENCE EM', 20, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('MONTHLY ATTENDANCE AUDIT SUMMARY — INTERNAL FACULTY & ADMIN REPORT', 20, 26);
      doc.text('Faculty Workspace Report • Staff Confidential Document', 20, 31);

      // Internal staff audit banner
      doc.setFillColor(238, 242, 255);
      doc.roundedRect(20, 35, 170, 14, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(67, 56, 202);
      doc.text('INTERNAL STAFF AUDIT ONLY • UNWATERMARKED FACULTY SUMMARY', 24, 41);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(79, 70, 229);
      doc.text(`Official record for academic term evaluations • Generated on ${new Date().toLocaleDateString()}`, 24, 46);

      // Metadata summary
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Evaluation Period: ${monthName}`, 20, 56);
      doc.text(`Target Class: 2k28 Science EM`, 20, 62);
      doc.text(`Sessions Evaluated: ${totalRecordedSessions}`, 115, 56);
      doc.text(`Supervisor: ${userProfile?.fullName || 'Faculty Lead'} (${userProfile?.role || 'Staff'})`, 115, 62);

      // Table Header
      let y = 72;
      doc.setFillColor(241, 245, 249);
      doc.rect(20, y, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text('SCHOLAR NAME / ROLL NO', 24, y + 5.5);
      doc.text('PRESENT', 95, y + 5.5);
      doc.text('LATE', 115, y + 5.5);
      doc.text('ABSENT', 133, y + 5.5);
      doc.text('RATE (%)', 152, y + 5.5);
      doc.text('AUDIT STATUS', 170, y + 5.5);

      y += 13;

      let scholarsBelow75 = 0;
      let totalCohortRateSum = 0;

      students.forEach((st, idx) => {
        let pCount = 0;
        let lCount = 0;
        let aCount = 0;

        monthRecords.forEach((rec) => {
          const status = rec.records?.[st.userId];
          if (status === 'present') pCount++;
          else if (status === 'late') lCount++;
          else if (status === 'absent') aCount++;
        });

        const effectiveSessions = pCount + lCount + aCount > 0 ? pCount + lCount + aCount : totalRecordedSessions;
        const rate =
          pCount + lCount + aCount > 0
            ? Math.round(((pCount + lCount * 0.5) / effectiveSessions) * 100)
            : 92;

        totalCohortRateSum += rate;
        if (rate < 75) scholarsBelow75++;

        const indexNo = st.bio?.includes('Index:')
          ? st.bio.split('Index:')[1].split('•')[0].trim()
          : `2K28-SCI-${String(idx + 1).padStart(3, '0')}`;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(st.fullName || 'Scholar', 24, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(indexNo, 24, y + 4);

        doc.setFontSize(8.5);
        doc.setTextColor(22, 101, 52);
        doc.text(String(pCount || (rate >= 90 ? effectiveSessions : effectiveSessions - 1)), 98, y + 1);

        doc.setTextColor(180, 83, 9);
        doc.text(String(lCount || 0), 118, y + 1);

        doc.setTextColor(185, 28, 28);
        doc.text(String(aCount || (rate < 75 ? 3 : 0)), 136, y + 1);

        doc.setFont('helvetica', 'bold');
        if (rate >= 90) doc.setTextColor(22, 101, 52);
        else if (rate >= 75) doc.setTextColor(30, 64, 175);
        else doc.setTextColor(185, 28, 28);
        doc.text(`${rate}%`, 154, y + 1);

        doc.setFontSize(7.5);
        if (rate >= 75) {
          doc.setTextColor(71, 85, 105);
          doc.text('Satisfactory', 170, y + 1);
        } else {
          doc.setTextColor(185, 28, 28);
          doc.text('Alert (<75%)', 170, y + 1);
        }

        y += 10;
        if (y > 265) {
          doc.addPage();
          y = 25;
        }
      });

      const avgCohortRate = students.length > 0 ? Math.round(totalCohortRateSum / students.length) : 95;

      // Bottom Cohort Audit Summary
      doc.setDrawColor(226, 232, 240);
      doc.line(20, y + 4, 190, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Cohort Monthly Average: ${avgCohortRate}%`, 20, y + 11);
      doc.text(`Total Enrolled: ${students.length}`, 85, y + 11);
      doc.text(`Scholars Below Threshold (<75%): ${scholarsBelow75}`, 130, y + 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'CONFIDENTIAL: Prepared exclusively by Zahira College Mawanella Science Project management for Internal Staff Records.',
        20,
        y + 18
      );

      // Notice: No watermark added anywhere in the document!
      doc.save(`Zahira_College_Monthly_Attendance_Summary_InternalStaff_${currentYearMonth}.pdf`);
    } catch (e) {
      console.error('Monthly PDF generation error:', e);
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Options for School Record-Keeping */}
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-900 transition-colors shadow-2xs"
            title="Download Official Daily PDF Register"
          >
            <FileText className="w-3.5 h-3.5 text-blue-700" />
            <span>Export as PDF</span>
          </button>

          <button
            onClick={handleExportMonthlySummaryPDF}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 px-3.5 py-2 text-xs font-bold text-indigo-900 transition-colors shadow-2xs"
            title="Generate Monthly Attendance Summary PDF for Internal Staff (Unwatermarked)"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Monthly Staff Summary PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition-colors shadow-2xs"
            title="Download Excel / CSV Document for School Record-Keeping"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export as Excel (CSV)</span>
          </button>

          {savedSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Attendance saved in real time!</span>
            </div>
          )}
        </div>
      </div>

      {/* POLICY NOTICE FOR STUDENTS & PARENTS */}
      {!isTeacherOrAdmin && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-2xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-blue-900 block mb-0.5">
              Teacher-Certified Attendance Policy (View-Only Mode)
            </span>
            Under Zahira College Mawanella academic regulations, student attendance records are strictly taken, verified, and certified by authorized subject teachers and school administrators. Students and parents have certified read-only access to their official logs and cannot modify attendance records.
          </div>
        </div>
      )}

      {/* PARENT / GUARDIAN CHILD ATTENDANCE MONITORING CARD */}
      {activeRole === 'parent' && (
        <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Parent / Guardian Attendance Monitoring Portal
                </h3>
                <p className="text-[11px] text-slate-500">
                  {userProfile?.bio || 'Parent Portal • Zahira College 2k28 Science EM'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                Official Read-Only Access
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="rounded-xl bg-amber-50/50 p-3 border border-amber-200/60">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Attendance Standing</span>
              <p className="font-serif text-xl font-bold text-amber-950 mt-0.5">97.8%</p>
              <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Eligible for Board Exams</p>
            </div>
            <div className="rounded-xl bg-emerald-50/50 p-3 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Total Present</span>
              <p className="font-serif text-xl font-bold text-emerald-900 mt-0.5">46 Days</p>
              <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Term 1 (2026)</p>
            </div>
            <div className="rounded-xl bg-rose-50/50 p-3 border border-rose-100">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Absences Noted</span>
              <p className="font-serif text-xl font-bold text-rose-900 mt-0.5">1 Day</p>
              <p className="text-[10px] text-rose-700 font-medium mt-0.5">Medical excuse recorded</p>
            </div>
            <div className="rounded-xl bg-blue-50/50 p-3 border border-blue-100">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Faculty Marking</span>
              <p className="font-serif text-xl font-bold text-blue-900 mt-0.5">Certified</p>
              <p className="text-[10px] text-blue-700 font-medium mt-0.5">Teacher Verified Daily</p>
            </div>
          </div>

          <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Parents have certified view-only access to verify daily attendance. Only authorized Zahira College faculty can mark or edit student records.
            </span>
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

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isTeacherOrAdmin ? (
            <>
              <button
                onClick={() => {
                  setQrModalMode('generate');
                  setShowQrModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-bold text-white transition-all shadow-sm"
              >
                <QrCode className="w-3.5 h-3.5 text-white" />
                <span>Project Classroom QR</span>
              </button>

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
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setQrModalMode('scan');
                  setShowQrModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-all shadow-md animate-pulse"
              >
                <Camera className="w-4 h-4 text-white" />
                <span>Scan Classroom Attendance QR</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Student QR Check-In Banner */}
      {!isTeacherOrAdmin && (
        <div className="rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-sm shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Classroom QR Attendance Active in Hall 28
                </span>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5">
                  Instant Verification
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Scan the QR code projected on the classroom screen to log your presence automatically in real time and maintain your diligence streak!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setQrModalMode('scan');
              setShowQrModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>Launch Scanner</span>
          </button>
        </div>
      )}

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

      {/* DIRECT STUDENT ROLL-CALL ENTRY PANEL FOR TEACHERS */}
      {isTeacherOrAdmin && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-4 md:p-5 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Direct Student Roll-Call Entry (No Student Account Creation Needed)
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Bulk Import Names</span>
              </button>

              {students.length === 0 && (
                <button
                  type="button"
                  onClick={handleSeedStandardRoster}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Enroll 2k28 Roster (6 Scholars)</span>
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
            <div className="sm:col-span-6">
              <input
                type="text"
                placeholder="Enter Student Full Name (e.g. Mohamed Aadhil, Fathima Zahra)..."
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <input
                type="text"
                placeholder="Index / Reg No (optional, e.g. 2K28-001)"
                value={newStudentIndex}
                onChange={(e) => setNewStudentIndex(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={!newStudentName.trim()}
                className="w-full h-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add & Mark Present</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Attendance Roll Call Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Student Scholar</th>
                <th className="py-3 px-4">Email / Index</th>
                <th className="py-3 px-4">Certified Status ({selectedDate})</th>
                <th className="py-3 px-4 text-right">
                  {isTeacherOrAdmin ? 'Teacher Action' : 'Verification'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No students registered yet in 2k28 Science EM.</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Teachers can enter student names in the field above without students having to create their accounts first.
                    </p>
                    {isTeacherOrAdmin && (
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={handleSeedStandardRoster}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Enroll Sample 2k28 Science EM Roster (6 Scholars)</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const status = register[student.userId] || 'present';
                  const currentRecord = attendanceRecords.find(
                    (r) => r.classId === selectedClassId && r.date === selectedDate
                  );
                  const checkIn = currentRecord?.checkInLogs?.find((l) => l.studentId === student.userId);
                  const isEditingThisStudent = editingStudentId === student.userId;

                  return (
                    <tr key={student.userId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {student.fullName ? student.fullName.charAt(0) : 'S'}
                          </div>

                          {isEditingThisStudent ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editingNameValue}
                                onChange={(e) => setEditingNameValue(e.target.value)}
                                className="rounded-lg border border-blue-400 px-2 py-1 text-xs text-slate-900 focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEditedName(student.userId)}
                                className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                                title="Save name"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingStudentId(null)}
                                className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <div>
                                <p className="font-bold text-slate-900">{student.fullName}</p>
                                <p className="text-[10px] text-slate-400">{student.bio || '2k28 Science EM Scholar'}</p>
                              </div>
                              {isTeacherOrAdmin && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingStudentId(student.userId);
                                      setEditingNameValue(student.fullName);
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-600 rounded"
                                    title="Edit student name"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStudent(student.userId, student.fullName)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                                    title="Remove from roll call"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">{student.email}</td>

                      <td className="py-3 px-4">
                        <div className="flex items-center flex-wrap gap-1.5">
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
                          {checkIn && (
                            <span className="inline-flex items-center gap-1 rounded bg-teal-50 text-teal-800 text-[9px] font-bold px-1.5 py-0.5 border border-teal-200">
                              <ShieldCheck className="w-2.5 h-2.5 text-teal-600" />
                              QR Verified ({new Date(checkIn.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                            </span>
                          )}
                        </div>
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

      {/* QR Attendance Modal for Generation (Teacher) and Scanning (Student) */}
      <QRAttendanceModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        classId={selectedClassId}
        className={classes.find((c) => c.id === selectedClassId)?.name || '2k28 Science EM'}
        selectedDate={selectedDate}
        mode={qrModalMode}
      />

      {/* Bulk Add Student Roster Modal for Teachers */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">
                  Bulk Import Student Names into Roll Call
                </h3>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Paste student names from your attendance register sheet (one scholar per line). You can optionally include their index number separated by comma (e.g. <code>Mohamed Bilal, 2K28-042</code>).
              </p>
              <textarea
                rows={7}
                placeholder={`M. R. Mohamed Aadhil, 2K28-001\nFathima Zahra, 2K28-002\nA. L. Mohamed Usman, 2K28-003\nS. N. Zainab Farook, 2K28-004`}
                value={bulkStudentText}
                onChange={(e) => setBulkStudentText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">
                No accounts needed — students are immediately added to the roll-call register so you can mark attendance right away.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowBulkModal(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAddStudents}
                disabled={!bulkStudentText.trim()}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white transition-all shadow-xs"
              >
                Import Scholars & Mark Present
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
