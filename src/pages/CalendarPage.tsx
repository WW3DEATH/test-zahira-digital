import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Award,
  Sparkles,
  Sun,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Check,
  X,
  Users,
  CalendarCheck2,
  Save,
  BookOpen,
  Filter,
} from 'lucide-react';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { SchoolEvent, SchoolEventType, AttendanceRecord, AttendanceStatus, UserProfile, SchoolClass } from '../types';
import {
  syncGoogleCalendarToFirestore,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from '../services/googleCalendarService';

export const CalendarPage: React.FC = () => {
  const { activeRole, userProfile, googleAccessToken, connectGoogleCalendar } = useAuth();

  // Active view tab: 'events' | 'attendance'
  const [activeTab, setActiveTab] = useState<'events' | 'attendance'>('events');

  // Calendar date state (for browsing months)
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => new Date().toISOString().split('T')[0]);

  // Firestore real-time collections
  const [schoolEvents, setSchoolEvents] = useState<SchoolEvent[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  // Filtering
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  // Modals & operations
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<SchoolEvent | null>(null);

  // New Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventType, setEventType] = useState<SchoolEventType>('exam');
  const [eventStartDate, setEventStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventTime, setEventTime] = useState('08:30');
  const [eventLocation, setEventLocation] = useState('Science Complex Hall 28');
  const [pushToGoogle, setPushToGoogle] = useState(true);
  const [savingEvent, setSavingEvent] = useState(false);

  // Attendance Register State
  const [selectedClassId, setSelectedClassId] = useState('class-2k28-science-em');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [register, setRegister] = useState<Record<string, AttendanceStatus>>({});
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  const isTeacherOrAdmin = activeRole === 'admin' || activeRole === 'teacher';

  // 1. Real-time listener for school events
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'schoolEvents'), (snapshot) => {
      const list: SchoolEvent[] = [];
      snapshot.forEach((d) => list.push(d.data() as SchoolEvent));
      // Sort chronologically by startDate
      list.sort((a, b) => a.startDate.localeCompare(b.startDate));
      setSchoolEvents(list);
    });
    return () => unsub();
  }, []);

  // 2. Real-time listener for attendance
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      const list: AttendanceRecord[] = [];
      snapshot.forEach((d) => list.push(d.data() as AttendanceRecord));
      setAttendanceRecords(list);

      const existing = list.find((r) => r.classId === selectedClassId && r.date === attendanceDate);
      if (existing) {
        setRegister(existing.records);
      }
    });
    return () => unsub();
  }, [selectedClassId, attendanceDate]);

  // 3. Real-time listener for student users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'userProfiles'), (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((d) => {
        const u = d.data() as UserProfile;
        if (u.role === 'student') list.push(u);
      });
      setStudents(list);

      setRegister((prev) => {
        const updated = { ...prev };
        list.forEach((s) => {
          if (!updated[s.userId]) {
            updated[s.userId] = 'present';
          }
        });
        return updated;
      });
    });
    return () => unsub();
  }, []);

  // 4. Real-time listener for classes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const list: SchoolClass[] = [];
      snapshot.forEach((d) => list.push(d.data() as SchoolClass));
      if (list.length > 0) {
        setClasses(list);
        if (!list.some((c) => c.id === selectedClassId)) {
          setSelectedClassId(list[0].id);
        }
      }
    });
    return () => unsub();
  }, [selectedClassId]);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().split('T')[0]);
    setAttendanceDate(now.toISOString().split('T')[0]);
  };

  // Google Calendar Synchronization
  const handleSyncGoogleCalendar = async () => {
    setSyncingGoogle(true);
    setSyncMessage(null);
    try {
      let token = googleAccessToken;
      if (!token) {
        token = await connectGoogleCalendar();
      }

      if (!token) {
        throw new Error('Google authorization was not completed.');
      }

      const res = await syncGoogleCalendarToFirestore(
        token,
        userProfile?.userId || 'faculty',
        userProfile?.fullName || 'Zahira Faculty'
      );
      setSyncMessage(res.message);
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      setSyncMessage(err.message || 'Failed to sync with Google Calendar');
      setTimeout(() => setSyncMessage(null), 6000);
    } finally {
      setSyncingGoogle(false);
    }
  };

  // Create School Event (Holiday, Exam, or Academic)
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventStartDate) return;

    setSavingEvent(true);
    try {
      const eventId = `ev-${Date.now()}`;
      let googleEventId: string | undefined = undefined;

      // Push to Google Calendar if requested and token is present
      if (pushToGoogle && googleAccessToken) {
        try {
          const gcalRes = await createGoogleCalendarEvent(googleAccessToken, {
            title: eventTitle,
            description: eventDesc,
            startDate: eventStartDate,
            endDate: eventEndDate || eventStartDate,
            time: eventTime || undefined,
            type: eventType,
            location: eventLocation,
          });
          googleEventId = gcalRes.googleEventId;
        } catch (gcalErr) {
          console.warn('Could not sync directly to Google Calendar:', gcalErr);
        }
      }

      const newEvent: SchoolEvent = {
        id: eventId,
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        startDate: eventStartDate,
        endDate: eventEndDate || undefined,
        time: eventTime || undefined,
        type: eventType,
        classId: 'class-2k28-science-em',
        location: eventLocation.trim() || 'Zahira College Mawanella',
        createdBy: userProfile?.userId || 'faculty',
        createdByName: userProfile?.fullName || 'Zahira Faculty',
        googleEventId,
        isSyncedWithGoogle: !!googleEventId,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'schoolEvents', eventId), newEvent);

      // Reset form and close
      setEventTitle('');
      setEventDesc('');
      setIsAddModalOpen(false);
      setSyncMessage(`Marked "${newEvent.title}" on the school calendar.`);
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      console.error('Error creating event:', err);
      alert('Failed to save event: ' + err.message);
    } finally {
      setSavingEvent(false);
    }
  };

  // Delete School Event (with confirmation dialog per Workspace guidelines)
  const executeDeleteEvent = async () => {
    if (!deleteConfirmEvent) return;
    const target = deleteConfirmEvent;
    setDeleteConfirmEvent(null);

    try {
      // If linked to Google Calendar, remove it there too
      if (target.googleEventId && googleAccessToken) {
        try {
          await deleteGoogleCalendarEvent(googleAccessToken, target.googleEventId);
        } catch (gErr) {
          console.warn('Could not remove from Google Calendar:', gErr);
        }
      }

      await deleteDoc(doc(db, 'schoolEvents', target.id));
      setSyncMessage(`Deleted "${target.title}" from school events.`);
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event: ' + err.message);
    }
  };

  // Attendance Handlers
  const handleAttendanceStatusChange = (studentId: string, status: AttendanceStatus) => {
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
      const recordId = `att-${attendanceDate}-${selectedClassId}`;
      const record: AttendanceRecord = {
        id: recordId,
        classId: selectedClassId,
        date: attendanceDate,
        teacherId: userProfile?.userId || 'faculty_lead',
        records: register,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'attendance', recordId), record);
      setAttendanceSaved(true);
      setTimeout(() => setAttendanceSaved(false), 3000);
    } catch (err: any) {
      console.error('Failed to save attendance:', err);
      alert('Error saving attendance: ' + err.message);
    }
  };

  // Build calendar matrix
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Filtered events
  const filteredEvents = schoolEvents.filter((ev) => {
    if (eventTypeFilter === 'all') return true;
    return ev.type === eventTypeFilter;
  });

  const getEventsForDate = (dateStr: string) => {
    return filteredEvents.filter((ev) => {
      if (ev.startDate === dateStr) return true;
      if (ev.endDate && dateStr >= ev.startDate && dateStr <= ev.endDate) return true;
      return false;
    });
  };

  const getAttendanceSummaryForDate = (dateStr: string) => {
    const rec = attendanceRecords.find((r) => r.date === dateStr && r.classId === selectedClassId);
    if (!rec) return null;
    const values = Object.values(rec.records);
    const present = values.filter((v) => v === 'present').length;
    return {
      present,
      total: values.length,
      rate: values.length > 0 ? Math.round((present / values.length) * 100) : 0,
    };
  };

  // Stats for the active attendance date
  const totalStudents = students.length;
  const presentCount = Object.values(register).filter((s) => s === 'present').length;
  const absentCount = Object.values(register).filter((s) => s === 'absent').length;
  const lateCount = Object.values(register).filter((s) => s === 'late').length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-stone-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              2k28 Science EM
            </span>
            <span className="text-xs font-semibold text-stone-500">Zahira College Mawanella</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-stone-900 mt-1">
            Academic Calendar & Student Attendance
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage school holidays, examination timetables, Google Calendar synchronization, and student roll calls.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Google Calendar Sync Button */}
          <button
            onClick={handleSyncGoogleCalendar}
            disabled={syncingGoogle}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
              googleAccessToken
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
            }`}
            title="Synchronize Google Calendar events with Firestore in real time"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingGoogle ? 'animate-spin text-emerald-600' : 'text-stone-500'}`} />
            <span>
              {syncingGoogle
                ? 'Syncing...'
                : googleAccessToken
                ? 'Sync Google Calendar'
                : 'Connect & Sync Google Calendar'}
            </span>
          </button>

          {/* Mark Holiday or Exam Button (Teachers & Admins) */}
          {isTeacherOrAdmin && (
            <button
              onClick={() => {
                setEventStartDate(selectedDateStr);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Mark Holiday or Exam</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncMessage && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
          <button onClick={() => setSyncMessage(null)} className="text-stone-400 hover:text-stone-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 border-b-2 py-3 px-5 text-xs font-bold transition-colors ${
            activeTab === 'events'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>School Events & Holidays</span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-700 font-semibold">
            {schoolEvents.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('attendance');
            setAttendanceDate(selectedDateStr);
          }}
          className={`flex items-center gap-2 border-b-2 py-3 px-5 text-xs font-bold transition-colors ${
            activeTab === 'attendance'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <CalendarCheck2 className="w-4 h-4" />
          <span>Student Attendance Calendar & Roll-Call</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800 font-semibold">
            {totalStudents} Scholars
          </span>
        </button>
      </div>

      {/* TAB 1: SCHOOL EVENTS & EXAM TIMETABLES */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Monthly Calendar View */}
          <div className="lg:col-span-2 space-y-4">
            {/* Calendar Controls */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-stone-900">{monthName}</h3>
                  <button
                    onClick={handleToday}
                    className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
                  >
                    Today
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Event Type Filter */}
                  <div className="flex items-center gap-1 rounded-lg border border-stone-200 p-0.5 text-[11px] font-semibold">
                    <button
                      onClick={() => setEventTypeFilter('all')}
                      className={`rounded px-2 py-1 ${
                        eventTypeFilter === 'all' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setEventTypeFilter('holiday')}
                      className={`rounded px-2 py-1 ${
                        eventTypeFilter === 'holiday' ? 'bg-emerald-700 text-white' : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      Holidays
                    </button>
                    <button
                      onClick={() => setEventTypeFilter('exam')}
                      className={`rounded px-2 py-1 ${
                        eventTypeFilter === 'exam' ? 'bg-rose-700 text-white' : 'text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      Exams
                    </button>
                    <button
                      onClick={() => setEventTypeFilter('academic')}
                      className={`rounded px-2 py-1 ${
                        eventTypeFilter === 'academic' ? 'bg-sky-700 text-white' : 'text-sky-700 hover:bg-sky-50'
                      }`}
                    >
                      Academic
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevMonth}
                      className="rounded-lg border border-stone-200 p-1.5 text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="rounded-lg border border-stone-200 p-1.5 text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Day of week headers */}
              <div className="grid grid-cols-7 gap-1 pt-3 text-center text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Calendar Days Matrix */}
              <div className="grid grid-cols-7 gap-1 pt-2">
                {/* Empty offset days */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-20 sm:h-24 rounded-xl bg-stone-50/40 p-1" />
                ))}

                {/* Month Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isSelected = selectedDateStr === dateStr;
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;
                  const dayEvents = getEventsForDate(dateStr);
                  const attSummary = getAttendanceSummaryForDate(dateStr);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDateStr(dateStr)}
                      className={`h-20 sm:h-24 rounded-xl border p-1.5 flex flex-col justify-between transition-all cursor-pointer overflow-hidden ${
                        isSelected
                          ? 'border-stone-900 bg-amber-50/40 shadow-xs ring-1 ring-stone-900'
                          : isToday
                          ? 'border-amber-400 bg-amber-50/20'
                          : 'border-stone-100 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold inline-flex h-5 w-5 items-center justify-center rounded-full ${
                            isToday
                              ? 'bg-amber-400 text-stone-900 font-extrabold'
                              : isSelected
                              ? 'bg-stone-900 text-white'
                              : 'text-stone-700'
                          }`}
                        >
                          {dayNum}
                        </span>

                        {attSummary && (
                          <span
                            className={`h-2 w-2 rounded-full ${
                              attSummary.rate >= 80
                                ? 'bg-emerald-500'
                                : attSummary.rate >= 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            title={`Attendance on ${dateStr}: ${attSummary.rate}% (${attSummary.present}/${attSummary.total})`}
                          />
                        )}
                      </div>

                      {/* Event Chips */}
                      <div className="space-y-1 overflow-y-auto max-h-12 text-[10px]">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className={`truncate rounded px-1 py-0.5 font-semibold text-[9px] border leading-tight ${
                              ev.type === 'holiday'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : ev.type === 'exam'
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : ev.type === 'academic'
                                ? 'bg-sky-100 text-sky-800 border-sky-200'
                                : 'bg-stone-100 text-stone-700 border-stone-200'
                            }`}
                            title={`${ev.title} (${ev.type.toUpperCase()})`}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[9px] font-bold text-stone-400 block text-right">
                            +{dayEvents.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 bg-white rounded-xl border border-stone-200 p-3">
              <span className="font-bold uppercase tracking-wider text-[10px] text-stone-400">Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Holiday / College Closure</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span>Examination / Test Date</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                <span>Academic Lab & Lecture</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                <span>Meeting / General</span>
              </div>
            </div>
          </div>

          {/* Right Col: Selected Date Events & Actions */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                    Selected Date Schedule
                  </span>
                  <h4 className="font-serif text-lg font-bold text-stone-900 mt-0.5">
                    {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h4>
                </div>

                {isTeacherOrAdmin && (
                  <button
                    onClick={() => {
                      setEventStartDate(selectedDateStr);
                      setIsAddModalOpen(true);
                    }}
                    className="rounded-lg bg-stone-900 p-1.5 text-amber-400 hover:bg-stone-800 transition-colors"
                    title="Add Event on this date"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Events on selected date */}
              <div className="mt-4 space-y-3">
                {getEventsForDate(selectedDateStr).length === 0 ? (
                  <div className="text-center py-8 text-stone-400">
                    <CalendarIcon className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                    <p className="text-xs font-semibold text-stone-600">No events scheduled for this day.</p>
                    {isTeacherOrAdmin && (
                      <p className="text-[11px] text-stone-400 mt-1">
                        Click "Mark Holiday or Exam" to schedule a date.
                      </p>
                    )}
                  </div>
                ) : (
                  getEventsForDate(selectedDateStr).map((ev) => (
                    <div
                      key={ev.id}
                      className={`rounded-xl border p-3.5 space-y-2 transition-all ${
                        ev.type === 'holiday'
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : ev.type === 'exam'
                          ? 'border-rose-200 bg-rose-50/40'
                          : ev.type === 'academic'
                          ? 'border-sky-200 bg-sky-50/40'
                          : 'border-stone-200 bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              ev.type === 'holiday'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ev.type === 'exam'
                                ? 'bg-rose-100 text-rose-800'
                                : ev.type === 'academic'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-stone-200 text-stone-800'
                            }`}
                          >
                            {ev.type}
                          </span>
                          <h5 className="font-bold text-stone-900 text-sm mt-1">{ev.title}</h5>
                        </div>

                        {isTeacherOrAdmin && (
                          <button
                            onClick={() => setDeleteConfirmEvent(ev)}
                            className="rounded p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {ev.description && (
                        <p className="text-xs text-stone-600 leading-relaxed">{ev.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 pt-1 border-t border-stone-200/50">
                        {ev.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-400" />
                            {ev.time}
                          </span>
                        )}
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            {ev.location}
                          </span>
                        )}
                        {ev.isSyncedWithGoogle && (
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            Google Calendar
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Jump to Attendance for this Date */}
              <div className="mt-5 pt-4 border-t border-stone-100">
                <button
                  onClick={() => {
                    setAttendanceDate(selectedDateStr);
                    setActiveTab('attendance');
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-stone-200 hover:bg-stone-50 py-2.5 px-3 text-xs font-bold text-stone-800 transition-colors"
                >
                  <CalendarCheck2 className="w-4 h-4 text-amber-600" />
                  <span>Mark Attendance for {selectedDateStr}</span>
                </button>
              </div>
            </div>

            {/* Upcoming Academic Milestones List */}
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
              <h4 className="font-serif text-sm font-bold text-stone-900 mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Upcoming Milestones & Exams</span>
              </h4>

              <div className="space-y-2.5">
                {schoolEvents
                  .filter((e) => e.type === 'exam' || e.type === 'holiday')
                  .slice(0, 4)
                  .map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedDateStr(ev.startDate)}
                      className="group cursor-pointer rounded-xl border border-stone-100 hover:border-stone-300 p-2.5 transition-all hover:bg-stone-50/50"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-800 group-hover:text-stone-900 truncate">
                          {ev.title}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase shrink-0 ${
                            ev.type === 'holiday'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ev.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-0.5">{ev.startDate}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT ATTENDANCE CALENDAR & QUICK REGISTER */}
      {activeTab === 'attendance' && (
        <div className="space-y-5">
          {/* Controls Bar */}
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
                  Roll-Call Session Date
                </label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-stone-800 font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {attendanceSaved && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Saved to Firestore in real time!</span>
                </div>
              )}

              {isTeacherOrAdmin && (
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

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Total Scholars
              </span>
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

          {/* Student Roster & Live Status Marker */}
          <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Student Scholar</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Status on {attendanceDate}</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-stone-500">
                        <Users className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                        <p className="font-semibold text-stone-700">No students registered in 2k28 Science EM yet.</p>
                        <p className="text-xs text-stone-400 mt-1">
                          When users sign up as students, they appear here automatically.
                        </p>
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
                                <p className="text-[10px] text-stone-400">
                                  {student.bio || '2k28 Science EM Scholar'}
                                </p>
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
                                  : status === 'late'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            {isTeacherOrAdmin ? (
                              <div className="inline-flex items-center rounded-lg border border-stone-200 bg-white p-0.5 shadow-2xs">
                                <button
                                  onClick={() => handleAttendanceStatusChange(student.userId, 'present')}
                                  className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                                    status === 'present'
                                      ? 'bg-emerald-600 text-white'
                                      : 'text-stone-600 hover:bg-stone-100'
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  onClick={() => handleAttendanceStatusChange(student.userId, 'absent')}
                                  className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                                    status === 'absent'
                                      ? 'bg-rose-600 text-white'
                                      : 'text-stone-600 hover:bg-stone-100'
                                  }`}
                                >
                                  Absent
                                </button>
                                <button
                                  onClick={() => handleAttendanceStatusChange(student.userId, 'late')}
                                  className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                                    status === 'late'
                                      ? 'bg-amber-500 text-white'
                                      : 'text-stone-600 hover:bg-stone-100'
                                  }`}
                                >
                                  Late
                                </button>
                                <button
                                  onClick={() => handleAttendanceStatusChange(student.userId, 'excused')}
                                  className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                                    status === 'excused'
                                      ? 'bg-sky-600 text-white'
                                      : 'text-stone-600 hover:bg-stone-100'
                                  }`}
                                >
                                  Excused
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
      )}

      {/* MODAL: MARK HOLIDAY OR EXAM DATE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h3 className="font-serif text-xl font-bold text-stone-900">Mark Holiday or Exam Date</h3>
              <p className="text-xs text-stone-500 mt-1">
                Add an official date to Zahira College 2k28 Science EM calendar.
              </p>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              {/* Event Type Selector */}
              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[10px]">
                  Category / Event Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEventType('holiday')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 font-bold border transition-all ${
                      eventType === 'holiday'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Holiday</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventType('exam')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 font-bold border transition-all ${
                      eventType === 'exam'
                        ? 'bg-rose-800 text-white border-rose-800 shadow-xs'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Exam Date</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventType('academic')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 font-bold border transition-all ${
                      eventType === 'academic'
                        ? 'bg-sky-800 text-white border-sky-800 shadow-xs'
                        : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Academic Lab</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[10px]">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder={
                    eventType === 'holiday'
                      ? 'e.g. National Poya Day Holiday'
                      : eventType === 'exam'
                      ? 'e.g. Combined Mathematics Mid-Term Paper'
                      : 'e.g. Physics Mechanics Practical Lab'
                  }
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[10px]">
                    Date (Start)
                  </label>
                  <input
                    type="date"
                    required
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[10px]">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Time & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[10px]">
                    Time (e.g. 08:30)
                  </label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="08:30"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[10px]">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Science Complex Hall 28"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[10px]">
                  Description & Syllabus Scope
                </label>
                <textarea
                  rows={2}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Details for scholars and teachers..."
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Push to Google Calendar Toggle */}
              {googleAccessToken && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <input
                    type="checkbox"
                    id="pushGCal"
                    checked={pushToGoogle}
                    onChange={(e) => setPushToGoogle(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600"
                  />
                  <label htmlFor="pushGCal" className="font-semibold text-emerald-900 cursor-pointer text-xs">
                    Also synchronize this date into connected Google Calendar
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEvent}
                  className="rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold px-5 py-2 transition-colors disabled:opacity-50 shadow-xs"
                >
                  {savingEvent ? 'Saving...' : 'Publish to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXPLICIT CONFIRMATION FOR DELETION (Workspace Integration Rule) */}
      {deleteConfirmEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-serif text-lg font-bold text-stone-900">Remove School Event</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-stone-900">"{deleteConfirmEvent.title}"</strong> scheduled for {deleteConfirmEvent.startDate}?
              {deleteConfirmEvent.isSyncedWithGoogle && ' This will also remove the entry from your Google Calendar.'}
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setDeleteConfirmEvent(null)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteEvent}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 shadow-xs transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
