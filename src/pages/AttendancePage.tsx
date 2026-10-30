import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Calendar,
  CheckCircle2,
  Clock,
  UserX,
  ShieldAlert,
  Save,
  Check,
  TrendingUp,
  AlertCircle,
  Users,
} from 'lucide-react';
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

  // Current editing register state: studentId -> status
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

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRegister((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.userId] = 'present';
    });
    setRegister(updated);
  };

  const handleSaveAttendance = async () => {
    try {
      const recordId = `att-${selectedDate}-${selectedClassId}`;
      const record: AttendanceRecord = {
        id: recordId,
        classId: selectedClassId,
        date: selectedDate,
        teacherId: userProfile?.userId || 'admin_jaasim',
        records: register,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'attendance', recordId), record);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save attendance:', e);
    }
  };

  const currentClass = classes.find((c) => c.id === selectedClassId) || {
    id: 'class-2k28-science-em',
    name: '2k28 Science EM',
    grade: 'A/L Batch 2028',
  };

  const totalStudents = students.length;
  const presentCount = Object.values(register).filter((s) => s === 'present').length;
  const absentCount = Object.values(register).filter((s) => s === 'absent').length;
  const lateCount = Object.values(register).filter((s) => s === 'late').length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
            Attendance Register
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Zahira College 2k28 Science EM daily roll-call and live session records
          </p>
        </div>

        {savedSuccess && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Attendance saved in real time!</span>
          </div>
        )}
      </div>

      {/* Date & Cohort Selector Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="font-semibold text-stone-500 uppercase tracking-wider block mb-1 text-[10px]">
              Class Cohort
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-stone-800 font-semibold focus:outline-none"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.grade})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-stone-500 uppercase tracking-wider block mb-1 text-[10px]">
              Session Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-stone-800 font-semibold focus:outline-none"
            >
            </input>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeRole !== 'student' && activeRole !== 'parent' && (
            <>
              <button
                onClick={handleMarkAllPresent}
                className="rounded-lg border border-stone-200 hover:bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors"
              >
                Mark All Present
              </button>
              <button
                onClick={handleSaveAttendance}
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-stone-800 transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Register</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Enrolled Scholars</span>
          <p className="font-serif text-2xl font-bold text-stone-900 mt-1">{totalStudents}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Present</span>
          <p className="font-serif text-2xl font-bold text-emerald-900 mt-1">{presentCount}</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">Absent</span>
          <p className="font-serif text-2xl font-bold text-rose-900 mt-1">{absentCount}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Rate</span>
          <p className="font-serif text-2xl font-bold text-amber-900 mt-1">{attendanceRate}%</p>
        </div>
      </div>

      {/* Attendance Roll Call Table */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Student Scholar</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Attendance Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-stone-500">
                    <Users className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                    <p className="font-semibold text-stone-700">No students registered yet in 2k28 Science EM.</p>
                    <p className="text-xs text-stone-400 mt-1">Users who sign up as students will automatically appear here in real time.</p>
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const status = register[student.userId] || 'present';

                  return (
                    <tr key={student.userId} className="hover:bg-stone-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-stone-900 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {student.fullName ? student.fullName.charAt(0) : 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900">{student.fullName}</p>
                            <p className="text-[10px] text-stone-400">{student.bio || '2k28 Science EM Scholar'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-stone-600">{student.email}</td>

                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'absent'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {activeRole !== 'student' && activeRole !== 'parent' ? (
                          <div className="inline-flex items-center rounded-lg border border-stone-200 bg-white p-0.5 shadow-2xs">
                            <button
                              onClick={() => handleStatusChange(student.userId, 'present')}
                              className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                                status === 'present' ? 'bg-emerald-600 text-white' : 'text-stone-600 hover:bg-stone-100'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.userId, 'absent')}
                              className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                                status === 'absent' ? 'bg-rose-600 text-white' : 'text-stone-600 hover:bg-stone-100'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.userId, 'late')}
                              className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                                status === 'late' ? 'bg-amber-500 text-white' : 'text-stone-600 hover:bg-stone-100'
                              }`}
                            >
                              Late
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400">View only</span>
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
