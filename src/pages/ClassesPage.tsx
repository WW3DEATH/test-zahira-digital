import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  BookOpen,
  Plus,
  ArrowRight,
  X,
  School,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { SchoolClass, UserProfile } from '../types';
import { SEED_CLASSES } from '../services/dataService';

export const ClassesPage: React.FC = () => {
  const { activeRole, userProfile } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Class Delete Confirmation Modal State
  const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);
  const [isDeletingClass, setIsDeletingClass] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Add Class Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('A/L Batch 2028');
  const [newYear, setNewYear] = useState('2026-2028');
  const [newRoom, setNewRoom] = useState('Science Complex - Hall 28');
  const [newDesc, setNewDesc] = useState('');

  // Real-time listener for classes
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'classes'),
      (snap) => {
        const list: SchoolClass[] = [];
        snap.forEach((d) => list.push(d.data() as SchoolClass));
        setClasses(list);
        if (list.length > 0) {
          if (!selectedClass || !list.some((c) => c.id === selectedClass.id)) {
            setSelectedClass(list[0]);
          }
        } else {
          setSelectedClass(null);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Real-time classes error:', error);
        setClasses([]);
        setSelectedClass(null);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [selectedClass]);

  // Real-time listener for user profiles to display real teachers & students
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'userProfiles'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push(d.data() as UserProfile));
      setAllUsers(list);
    });
    return () => unsub();
  }, []);

  const canManageClasses = activeRole === 'admin' || activeRole === 'teacher';

  const handleAddClass = async () => {
    if (!newName.trim()) return;
    try {
      const id = `class-${Date.now()}`;
      const newClass: SchoolClass = {
        id,
        name: newName.trim(),
        grade: newGrade.trim(),
        academicYear: newYear.trim(),
        description: newDesc.trim() || 'Zahira College Science Cohort',
        room: newRoom.trim() || 'Science Complex - Hall 28',
        teacherIds: [userProfile?.userId || 'faculty_lead'],
        studentIds: [],
        subjectIds: ['sub-cmath', 'sub-phys', 'sub-chem', 'sub-bio', 'sub-ict', 'sub-eng'],
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'classes', id), newClass);
      setShowAddModal(false);
      setNewName('');
      setNewDesc('');
      setSelectedClass(newClass);
      setFeedbackNotice(`Created class cohort "${newClass.name}".`);
      setTimeout(() => setFeedbackNotice(null), 3000);
    } catch (e: any) {
      console.error('Failed to add class:', e);
      setFeedbackNotice(`Error adding class: ${e.message}`);
      setTimeout(() => setFeedbackNotice(null), 4000);
    }
  };

  const confirmDeleteClass = async () => {
    if (!classToDelete || !canManageClasses) return;
    const targetId = classToDelete.id;
    const targetName = classToDelete.name;
    setIsDeletingClass(true);

    try {
      // Optimistically remove from state
      setClasses((prev) => prev.filter((c) => c.id !== targetId));
      if (selectedClass?.id === targetId) {
        const remaining = classes.filter((c) => c.id !== targetId);
        setSelectedClass(remaining.length > 0 ? remaining[0] : null);
      }
      // Delete from Firebase Firestore
      await deleteDoc(doc(db, 'classes', targetId));
      setClassToDelete(null);
      setFeedbackNotice(`Class cohort "${targetName}" permanently removed.`);
      setTimeout(() => setFeedbackNotice(null), 3500);
    } catch (e: any) {
      console.error('Failed to remove class:', e);
      setFeedbackNotice(`Error removing class: ${e.message}`);
      setTimeout(() => setFeedbackNotice(null), 4000);
    } finally {
      setIsDeletingClass(false);
    }
  };

  const studentUsers = allUsers.filter((u) => u.role === 'student');
  const teacherUsers = allUsers.filter((u) => u.role === 'teacher');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
            Classes & Academic Cohorts
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Zahira College 2k28 Science EM class rosters, assigned lead teachers, and timetabled rooms
          </p>
        </div>

        {canManageClasses && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Academic Class</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-1">
            Active Cohorts ({classes.length})
          </h3>
          {classes.map((c) => {
            const isSelected = selectedClass?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedClass(c)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold text-stone-700 uppercase mb-1.5">
                      {c.grade}
                    </span>
                    <h4 className="font-serif text-base font-bold text-stone-900">{c.name}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">{c.room}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManageClasses && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setClassToDelete(c);
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title={`Remove ${c.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <GraduationCap className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-stone-400'}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-stone-500 pt-3 border-t border-stone-100">
                  <span>Year: {c.academicYear}</span>
                  <span className="font-semibold text-stone-800">{studentUsers.length} Enrolled Scholars</span>
                </div>
              </div>
            );
          })}

          {classes.length === 0 && (
            <div className="p-8 rounded-2xl border border-dashed border-stone-200 bg-white text-center text-xs text-stone-500 space-y-2">
              <GraduationCap className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="font-semibold text-stone-700">No active class cohorts found.</p>
              <p className="text-[11px] text-stone-400">
                {canManageClasses ? 'Click "Create Academic Class" above to set up a new cohort.' : 'Classes will appear here once created by faculty.'}
              </p>
            </div>
          )}
        </div>

        {/* Selected Class Detail */}
        {selectedClass ? (
          <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {selectedClass.grade}
                </span>
                <h3 className="font-serif text-2xl font-bold text-stone-900 mt-2">
                  {selectedClass.name}
                </h3>
                <p className="text-xs text-stone-500 mt-1">{selectedClass.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">Room Location</span>
                  <span className="text-sm font-bold text-stone-800">{selectedClass.room}</span>
                </div>
                {canManageClasses && (
                  <button
                    type="button"
                    onClick={() => setClassToDelete(selectedClass)}
                    className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors shadow-2xs"
                    title={`Delete ${selectedClass.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Faculty Instructors */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-stone-400" />
                <span>Assigned Faculty Instructors</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teacherUsers.length > 0 ? (
                  teacherUsers.map((t) => {
                    const cleanName = (t.fullName || 'Faculty Instructor')
                      .replace(/\s*\(Admin.*?\)/gi, '')
                      .replace(/M\.\s*N\.\s*M\.\s*Jaasim/gi, 'Science Faculty Lead');
                    return (
                      <div key={t.userId} className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 bg-stone-50">
                        <div className="h-9 w-9 rounded-full bg-stone-900 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {cleanName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-900">{cleanName}</p>
                          <p className="text-[10px] text-stone-500">{t.email}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-xs text-stone-600 font-semibold bg-stone-50 rounded-xl border border-stone-100">
                    Faculty Lead • Science & Combined Mathematics Department
                  </div>
                )}
              </div>
            </div>

            {/* Enrolled Students Roster */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-stone-400" />
                <span>Enrolled 2k28 Science EM Scholars ({studentUsers.length})</span>
              </h4>
              {studentUsers.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-stone-50 border border-stone-100 text-stone-500 text-xs">
                  No students have signed up yet. When students register with their account, they will automatically appear in this cohort roster in real time.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {studentUsers.map((st) => (
                    <div key={st.userId} className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 bg-stone-50">
                      <div className="h-8 w-8 rounded-full bg-stone-900 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {st.fullName ? st.fullName.charAt(0) : 'S'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-900">{st.fullName}</p>
                        <p className="text-[10px] text-stone-500">{st.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center flex flex-col items-center justify-center text-xs text-stone-500">
            <GraduationCap className="w-12 h-12 text-stone-300 mb-3" />
            <h4 className="font-serif text-base font-bold text-stone-800">No Class Selected</h4>
            <p className="text-stone-500 mt-1 max-w-sm leading-relaxed">
              {classes.length > 0
                ? 'Select a class cohort from the list on the left to view detailed rosters, faculty instructors, and syllabi.'
                : 'No classes currently registered. Use the "Create Academic Class" button above to add a new cohort.'}
            </p>
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-stone-900">Create Academic Cohort</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 hover:bg-stone-100 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Class Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. 2k28 Science EM (Bio Stream)"
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                    Cohort Batch
                  </label>
                  <input
                    type="text"
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    placeholder="A/L Batch 2028"
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="2026-2028"
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Room / Lecture Hall
                </label>
                <input
                  type="text"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  placeholder="Science Complex - Hall 28"
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Official cohort description..."
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClass}
                className="rounded-lg bg-stone-900 px-5 py-2 text-xs font-bold text-white hover:bg-stone-800 shadow-xs"
              >
                Create Cohort
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Deletion Confirmation Modal (Reliable in IFrames) */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">Remove Class Cohort?</h3>
                <p className="text-[11px] text-stone-500">Authorized Action (Faculty & Directorate)</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to permanently remove <strong className="text-stone-900">"{classToDelete.name}"</strong> ({classToDelete.grade})? This will delete the cohort from Firebase Firestore and unassign all enrolled schedules.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                disabled={isDeletingClass}
                onClick={() => setClassToDelete(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingClass}
                onClick={confirmDeleteClass}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-xs font-bold text-white transition-colors shadow-sm"
              >
                {isDeletingClass ? 'Removing...' : 'Yes, Delete Cohort'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating feedback toast */}
      {feedbackNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}
    </div>
  );
};
