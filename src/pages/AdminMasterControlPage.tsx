import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  School,
  BookOpen,
  GraduationCap,
  Users,
  Bell,
  Calendar,
  BookMarked,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  X,
  Search,
  Sparkles,
  AlertCircle,
  Megaphone,
  Layers,
  Phone,
  Mail,
  MapPin,
  Clock,
} from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  addDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useSiteConfig } from '../context/SiteConfigContext';
import {
  SchoolSetting,
  Subject,
  SchoolClass,
  UserProfile,
  Announcement,
  SchoolEvent,
  LearningMaterial,
  UserRole,
} from '../types';

type AdminTab =
  | 'branding'
  | 'subjects'
  | 'classes'
  | 'users'
  | 'announcements'
  | 'calendar'
  | 'materials';

export const AdminMasterControlPage: React.FC = () => {
  const { siteConfig, updateSiteConfig } = useSiteConfig();
  const [activeTab, setActiveTab] = useState<AdminTab>('branding');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Form state for Site Branding
  const [brandingForm, setBrandingForm] = useState<SchoolSetting>(siteConfig);

  // Firestore real-time collections
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);

  // Modals & temporary editing states
  const [editingSubject, setEditingSubject] = useState<Partial<Subject> | null>(null);
  const [editingClass, setEditingClass] = useState<Partial<SchoolClass> | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<UserProfile> | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<Announcement> | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<SchoolEvent> | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Partial<LearningMaterial> | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    setBrandingForm(siteConfig);
  }, [siteConfig]);

  // Real-time synchronization for all entities
  useEffect(() => {
    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snap) => {
      const list: Subject[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Subject));
      setSubjects(list);
    });

    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      const list: SchoolClass[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as SchoolClass));
      setClasses(list);
    });

    const unsubUsers = onSnapshot(collection(db, 'userProfiles'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push({ userId: d.id, ...d.data() } as UserProfile));
      setUsers(list);
    });

    const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snap) => {
      const list: Announcement[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Announcement));
      setAnnouncements(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });

    const unsubEvents = onSnapshot(collection(db, 'schoolEvents'), (snap) => {
      const list: SchoolEvent[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as SchoolEvent));
      setEvents(list.sort((a, b) => a.startDate.localeCompare(b.startDate)));
    });

    const unsubMaterials = onSnapshot(collection(db, 'learningMaterials'), (snap) => {
      const list: LearningMaterial[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as LearningMaterial));
      setMaterials(list);
    });

    return () => {
      unsubSubjects();
      unsubClasses();
      unsubUsers();
      unsubAnnouncements();
      unsubEvents();
      unsubMaterials();
    };
  }, []);

  const triggerNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  // 1. Save Branding
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSiteConfig(brandingForm);
      triggerNotice('Institutional website details updated live!');
    } catch (err: any) {
      alert('Error updating branding: ' + err.message);
    }
  };

  // 2. Subject Actions
  const handleSaveSubject = async () => {
    if (!editingSubject?.name || !editingSubject?.code) return;
    const id = editingSubject.id || `sub-${Date.now()}`;
    const payload: Subject = {
      id,
      name: editingSubject.name,
      code: editingSubject.code,
      description: editingSubject.description || '',
      color: editingSubject.color || '#1e3a8a',
      teacherIds: editingSubject.teacherIds || ['admin_jaasim'],
      classIds: editingSubject.classIds || ['class-2k28-science-em'],
      createdAt: editingSubject.createdAt || new Date().toISOString(),
    };
    await setDoc(doc(db, 'subjects', id), payload, { merge: true });
    setEditingSubject(null);
    triggerNotice(`Subject "${payload.name}" saved!`);
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (window.confirm(`Delete subject "${name}"?`)) {
      await deleteDoc(doc(db, 'subjects', id));
      triggerNotice(`Subject "${name}" deleted.`);
    }
  };

  // 3. Class Actions
  const handleSaveClass = async () => {
    if (!editingClass?.name) return;
    const id = editingClass.id || `class-${Date.now()}`;
    const payload: SchoolClass = {
      id,
      name: editingClass.name,
      grade: editingClass.grade || 'A/L Batch 2028',
      academicYear: editingClass.academicYear || '2026-2028',
      description: editingClass.description || '',
      room: editingClass.room || 'Science Complex - Hall 28',
      teacherIds: editingClass.teacherIds || [],
      studentIds: editingClass.studentIds || [],
      subjectIds: editingClass.subjectIds || [],
      createdAt: editingClass.createdAt || new Date().toISOString(),
    };
    await setDoc(doc(db, 'classes', id), payload, { merge: true });
    setEditingClass(null);
    triggerNotice(`Class "${payload.name}" saved!`);
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (window.confirm(`Delete class "${name}"?`)) {
      await deleteDoc(doc(db, 'classes', id));
      triggerNotice(`Class "${name}" deleted.`);
    }
  };

  // 4. User Actions
  const handleSaveUser = async () => {
    if (!editingUser?.userId || !editingUser?.email) return;
    const payload = {
      ...editingUser,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'userProfiles', editingUser.userId), payload, { merge: true });
    setEditingUser(null);
    triggerNotice(`User "${editingUser.fullName}" updated!`);
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (window.confirm(`Delete user "${name}" from directory?`)) {
      await deleteDoc(doc(db, 'userProfiles', userId));
      triggerNotice(`User "${name}" removed.`);
    }
  };

  // 5. Announcement Actions
  const handleSaveAnnouncement = async () => {
    if (!editingAnnouncement?.title || !editingAnnouncement?.content) return;
    const id = editingAnnouncement.id || `ann-${Date.now()}`;
    const payload: Announcement = {
      id,
      title: editingAnnouncement.title,
      content: editingAnnouncement.content,
      authorId: 'admin_jaasim',
      authorName: 'M. N. M. Jaasim (Admin)',
      authorRole: 'admin',
      audience: (editingAnnouncement.audience as any) || 'all',
      isPinned: !!editingAnnouncement.isPinned,
      createdAt: editingAnnouncement.createdAt || new Date().toISOString(),
    };
    await setDoc(doc(db, 'announcements', id), payload, { merge: true });
    setEditingAnnouncement(null);
    triggerNotice('Announcement published live!');
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm('Delete this announcement?')) {
      await deleteDoc(doc(db, 'announcements', id));
      triggerNotice('Announcement removed.');
    }
  };

  // 6. Calendar Event Actions
  const handleSaveEvent = async () => {
    if (!editingEvent?.title || !editingEvent?.startDate) return;
    const id = editingEvent.id || `event-${Date.now()}`;
    const payload: SchoolEvent = {
      id,
      title: editingEvent.title,
      description: editingEvent.description || '',
      startDate: editingEvent.startDate,
      endDate: editingEvent.endDate || editingEvent.startDate,
      time: editingEvent.time || '08:00 AM',
      type: editingEvent.type || 'academic',
      location: editingEvent.location || 'Science Complex',
      createdBy: 'admin_jaasim',
      createdByName: 'M. N. M. Jaasim (Admin)',
      createdAt: editingEvent.createdAt || new Date().toISOString(),
    };
    await setDoc(doc(db, 'schoolEvents', id), payload, { merge: true });
    setEditingEvent(null);
    triggerNotice(`Event "${payload.title}" saved to calendar!`);
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (window.confirm(`Delete event "${title}"?`)) {
      await deleteDoc(doc(db, 'schoolEvents', id));
      triggerNotice(`Event "${title}" removed.`);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      (u.fullName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner - Royal Blue & Crimson Red Theme */}
      <div className="rounded-2xl border border-blue-900 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Zahira College Mawanella • Master Admin Control</span>
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-white mt-2">
              Website & School Administration Panel
            </h1>
            <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-2xl">
              Complete real-time control center for Zahira College 2k28 Science EM. Edit site branding, curriculum subjects, class cohorts, user permissions, announcements, calendar dates, and resources.
            </p>
          </div>

          {savedNotice && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-blue-950 shadow-lg border border-blue-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedNotice}</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-6 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
          {[
            { id: 'branding', label: 'Website Identity', icon: School },
            { id: 'subjects', label: `Subjects (${subjects.length})`, icon: BookOpen },
            { id: 'classes', label: `Classes (${classes.length})`, icon: GraduationCap },
            { id: 'users', label: `Users & Roles (${users.length})`, icon: Users },
            { id: 'announcements', label: `Notices (${announcements.length})`, icon: Bell },
            { id: 'calendar', label: `Calendar Events (${events.length})`, icon: Calendar },
            { id: 'materials', label: `Materials (${materials.length})`, icon: BookMarked },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-blue-950 shadow-md font-bold'
                    : 'bg-white/10 text-white/90 hover:bg-white/20'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-blue-200'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: WEBSITE BRANDING & IDENTITY */}
      {activeTab === 'branding' && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-blue-50">
            <div>
              <h2 className="font-serif text-xl font-bold text-blue-950">
                Institutional Brand & Website Information
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Changes saved here update headers, footers, page titles, and announcement marquees across the entire website live.
              </p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
              Live Real-Time Sync
            </span>
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  School Name
                </label>
                <input
                  type="text"
                  required
                  value={brandingForm.schoolName}
                  onChange={(e) => setBrandingForm({ ...brandingForm, schoolName: e.target.value })}
                  placeholder="e.g. Zahira College Mawanella"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Cohort / Batch Subtitle
                </label>
                <input
                  type="text"
                  required
                  value={brandingForm.cohortName}
                  onChange={(e) => setBrandingForm({ ...brandingForm, cohortName: e.target.value })}
                  placeholder="e.g. 2k28 Science EM"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Academic Year Period
                </label>
                <input
                  type="text"
                  required
                  value={brandingForm.academicYear}
                  onChange={(e) => setBrandingForm({ ...brandingForm, academicYear: e.target.value })}
                  placeholder="e.g. 2026-2028"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Academic Motto
                </label>
                <input
                  type="text"
                  value={brandingForm.motto || ''}
                  onChange={(e) => setBrandingForm({ ...brandingForm, motto: e.target.value })}
                  placeholder="e.g. Excellence in Science, Knowledge, and Discipline"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Administrative Email
                </label>
                <input
                  type="email"
                  required
                  value={brandingForm.contactEmail}
                  onChange={(e) => setBrandingForm({ ...brandingForm, contactEmail: e.target.value })}
                  placeholder="e.g. mnmjaasim@gmail.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Campus Phone
                </label>
                <input
                  type="text"
                  value={brandingForm.contactPhone || ''}
                  onChange={(e) => setBrandingForm({ ...brandingForm, contactPhone: e.target.value })}
                  placeholder="e.g. +94 11 269 4151"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Campus Location / Address
                </label>
                <input
                  type="text"
                  value={brandingForm.address}
                  onChange={(e) => setBrandingForm({ ...brandingForm, address: e.target.value })}
                  placeholder="e.g. Zahira College, Mawanella, Sri Lanka"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Science Hall / Room Designation
                </label>
                <input
                  type="text"
                  value={brandingForm.room || ''}
                  onChange={(e) => setBrandingForm({ ...brandingForm, room: e.target.value })}
                  placeholder="e.g. Science Complex - Hall 28"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Top Marquee Announcement Ticker */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-red-600" />
                  <span className="font-bold text-blue-950">Top Website Marquee Announcement Banner</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-900">
                  <input
                    type="checkbox"
                    checked={brandingForm.showMarquee !== false}
                    onChange={(e) => setBrandingForm({ ...brandingForm, showMarquee: e.target.checked })}
                    className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                  />
                  <span>Show Ticker at Top of Website</span>
                </label>
              </div>
              <input
                type="text"
                value={brandingForm.marqueeNotice || ''}
                onChange={(e) => setBrandingForm({ ...brandingForm, marqueeNotice: e.target.value })}
                placeholder="e.g. Welcome to Zahira College 2k28 Science EM • Term 1 Lecture Schedule Active"
                className="w-full rounded-xl border border-blue-200 bg-white p-2.5 text-slate-900 font-medium focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold px-6 py-3 text-xs shadow-md transition-colors"
              >
                <Save className="w-4 h-4 text-red-500" />
                <span>Save & Apply Website Identity</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SUBJECTS MANAGER */}
      {activeTab === 'subjects' && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-50">
            <div>
              <h2 className="font-serif text-xl font-bold text-blue-950">
                Curriculum Subjects Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add, edit codes, syllabus descriptions, and colors for all Advanced Level subjects.
              </p>
            </div>
            <button
              onClick={() =>
                setEditingSubject({
                  name: '',
                  code: '',
                  description: '',
                  color: '#1e3a8a',
                })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 text-xs shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Subject</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="px-2.5 py-0.5 rounded-md text-[10px] font-bold text-white uppercase tracking-wider"
                      style={{ backgroundColor: sub.color || '#1e3a8a' }}
                    >
                      {sub.code}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingSubject(sub)}
                        className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-slate-100"
                        title="Edit Subject"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(sub.id, sub.name)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-serif text-base font-bold text-blue-950">{sub.name}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-3">
                    {sub.description || 'Core Zahira College Science EM Subject.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Class: 2k28 Science EM</span>
                  <span className="font-semibold text-blue-900">Active Syllabus</span>
                </div>
              </div>
            ))}
          </div>

          {/* Subject Edit Modal */}
          {editingSubject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-blue-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-serif text-lg font-bold text-blue-950">
                    {editingSubject.id ? 'Edit Subject' : 'Add Subject'}
                  </h3>
                  <button onClick={() => setEditingSubject(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Subject Name</label>
                    <input
                      type="text"
                      value={editingSubject.name || ''}
                      onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                      placeholder="e.g. Combined Mathematics"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Subject Code</label>
                    <input
                      type="text"
                      value={editingSubject.code || ''}
                      onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })}
                      placeholder="e.g. CMATH-28"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Description / Syllabus</label>
                    <textarea
                      rows={3}
                      value={editingSubject.description || ''}
                      onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
                      placeholder="Topics covered, practical components..."
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Badge Color Hex</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingSubject.color || '#1e3a8a'}
                        onChange={(e) => setEditingSubject({ ...editingSubject, color: e.target.value })}
                        className="h-9 w-12 rounded cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={editingSubject.color || '#1e3a8a'}
                        onChange={(e) => setEditingSubject({ ...editingSubject, color: e.target.value })}
                        className="flex-1 rounded-xl border border-slate-200 p-2 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingSubject(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSubject}
                    className="px-5 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950"
                  >
                    Save Subject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CLASSES & COHORTS */}
      {activeTab === 'classes' && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-50">
            <div>
              <h2 className="font-serif text-xl font-bold text-blue-950">
                School Classes & Cohorts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure classroom sections, rooms, and academic year designations.
              </p>
            </div>
            <button
              onClick={() =>
                setEditingClass({
                  name: '',
                  grade: 'A/L Batch 2028',
                  academicYear: '2026-2028',
                  room: 'Science Complex - Hall 28',
                  description: '',
                })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 text-xs shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Class</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold text-[10px] uppercase">
                      {c.grade}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingClass(c)}
                        className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(c.id, c.name)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-blue-950">{c.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">{c.description || 'Zahira Science EM Cohort'}</p>
                  <p className="text-xs font-semibold text-red-600 mt-2">Room: {c.room || 'Main Hall'}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
                  <span>Year: {c.academicYear}</span>
                  <span className="font-mono text-slate-500">ID: {c.id}</span>
                </div>
              </div>
            ))}
          </div>

          {editingClass && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-blue-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-serif text-lg font-bold text-blue-950">
                    {editingClass.id ? 'Edit Class' : 'Add Class'}
                  </h3>
                  <button onClick={() => setEditingClass(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Class Name</label>
                    <input
                      type="text"
                      value={editingClass.name || ''}
                      onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                      placeholder="e.g. 2k28 Science EM"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Grade / Level</label>
                    <input
                      type="text"
                      value={editingClass.grade || ''}
                      onChange={(e) => setEditingClass({ ...editingClass, grade: e.target.value })}
                      placeholder="e.g. A/L Batch 2028"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Room / Hall</label>
                    <input
                      type="text"
                      value={editingClass.room || ''}
                      onChange={(e) => setEditingClass({ ...editingClass, room: e.target.value })}
                      placeholder="e.g. Science Complex - Hall 28"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Description</label>
                    <input
                      type="text"
                      value={editingClass.description || ''}
                      onChange={(e) => setEditingClass({ ...editingClass, description: e.target.value })}
                      placeholder="e.g. English Medium Advanced Level Cohort"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingClass(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveClass}
                    className="px-5 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950"
                  >
                    Save Class
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-50">
            <div>
              <h2 className="font-serif text-xl font-bold text-blue-950">
                User Accounts & Permission Roles
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage registered faculty, students, and administrators. Promote or adjust their academic stream and subject.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-700"
            >
              <option value="all">All Roles ({users.length})</option>
              <option value="admin">Administrators</option>
              <option value="teacher">Teachers / Faculty</option>
              <option value="student">Students / Scholars</option>
              <option value="parent">Parents</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.userId} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                          {u.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-blue-950">{u.fullName || 'User'}</p>
                          <p className="text-[10px] text-slate-400">{u.bio || 'Zahira Academic Member'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : u.role === 'teacher'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.role === 'teacher' && (
                        <span className="text-blue-900 font-medium">Subject: {u.subject || 'Faculty'}</span>
                      )}
                      {u.role === 'student' && (
                        <span className="text-emerald-800 font-medium">Stream: {u.stream || 'Science EM'}</span>
                      )}
                      {u.role === 'admin' && (
                        <span className="text-red-700 font-semibold">Chief Academic Lead</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-100 font-bold text-[11px]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.userId, u.fullName)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* User Edit Modal */}
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-blue-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-serif text-lg font-bold text-blue-950">Edit User Details</h3>
                  <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editingUser.fullName || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Permission Role</label>
                    <select
                      value={editingUser.role || 'student'}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-blue-900"
                    >
                      <option value="student">Student / Scholar</option>
                      <option value="teacher">Teacher / Faculty</option>
                      <option value="admin">Administrator</option>
                      <option value="parent">Parent / Guardian</option>
                    </select>
                  </div>
                  {editingUser.role === 'teacher' && (
                    <div>
                      <label className="font-bold text-blue-950 block mb-1">Teaching Subject</label>
                      <input
                        type="text"
                        value={editingUser.subject || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, subject: e.target.value })}
                        placeholder="e.g. Combined Mathematics"
                        className="w-full rounded-xl border border-slate-200 p-2.5"
                      />
                    </div>
                  )}
                  {editingUser.role === 'student' && (
                    <div>
                      <label className="font-bold text-blue-950 block mb-1">Academic Stream</label>
                      <input
                        type="text"
                        value={editingUser.stream || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, stream: e.target.value })}
                        placeholder="e.g. Biological Science"
                        className="w-full rounded-xl border border-slate-200 p-2.5"
                      />
                    </div>
                  )}
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Bio / Designation</label>
                    <input
                      type="text"
                      value={editingUser.bio || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUser}
                    className="px-5 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-50">
            <div>
              <h2 className="font-serif text-xl font-bold text-blue-950">
                School Notice Board & Announcements
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Broadcast official circulars to all students, teachers, or parents instantly.
              </p>
            </div>
            <button
              onClick={() =>
                setEditingAnnouncement({
                  title: '',
                  content: '',
                  audience: 'all',
                  isPinned: false,
                })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 text-xs shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Notice</span>
            </button>
          </div>

          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {a.isPinned && (
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold uppercase">
                        Pinned Notice
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold uppercase">
                      Audience: {a.audience}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-serif text-base font-bold text-blue-950">{a.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{a.content}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingAnnouncement(a)}
                    className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-slate-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAnnouncement(a.id)}
                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editingAnnouncement && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-blue-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-serif text-lg font-bold text-blue-950">
                    {editingAnnouncement.id ? 'Edit Notice' : 'Post Notice'}
                  </h3>
                  <button onClick={() => setEditingAnnouncement(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Notice Title</label>
                    <input
                      type="text"
                      value={editingAnnouncement.title || ''}
                      onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                      placeholder="e.g. Science EM Term 1 Examinations Schedule"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Target Audience</label>
                    <select
                      value={editingAnnouncement.audience || 'all'}
                      onChange={(e) =>
                        setEditingAnnouncement({ ...editingAnnouncement, audience: e.target.value as any })
                      }
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                    >
                      <option value="all">Entire School Community (All)</option>
                      <option value="students">Students Only</option>
                      <option value="teachers">Faculty Only</option>
                      <option value="parents">Parents Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Notice Content</label>
                    <textarea
                      rows={4}
                      value={editingAnnouncement.content || ''}
                      onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                      placeholder="Details of the announcement..."
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-950 pt-1">
                    <input
                      type="checkbox"
                      checked={!!editingAnnouncement.isPinned}
                      onChange={(e) =>
                        setEditingAnnouncement({ ...editingAnnouncement, isPinned: e.target.checked })
                      }
                      className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                    />
                    <span>Pin notice to the top of notice boards</span>
                  </label>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingAnnouncement(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAnnouncement}
                    className="px-5 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950"
                  >
                    Publish Notice
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: ACADEMIC CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-50">
            <div>
              <h2 className="font-serif text-xl font-bold text-blue-950">
                Academic Calendar & Exam Schedule
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mark official school holidays, practical sessions, and examination periods.
              </p>
            </div>
            <button
              onClick={() =>
                setEditingEvent({
                  title: '',
                  startDate: new Date().toISOString().split('T')[0],
                  type: 'exam',
                  time: '08:30 AM',
                  location: 'Science Complex - Hall 28',
                })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 text-xs shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event / Date</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ev.type === 'holiday'
                          ? 'bg-amber-100 text-amber-800'
                          : ev.type === 'exam'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-900'
                      }`}
                    >
                      {ev.type}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingEvent(ev)}
                        className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev.id, ev.title)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-serif text-base font-bold text-blue-950">{ev.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{ev.description || 'Institutional Academic Schedule.'}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>📅 {ev.startDate}</span>
                  <span>📍 {ev.location || 'Campus'}</span>
                </div>
              </div>
            ))}
          </div>

          {editingEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-blue-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-serif text-lg font-bold text-blue-950">
                    {editingEvent.id ? 'Edit Event' : 'Add Calendar Date'}
                  </h3>
                  <button onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Event Title</label>
                    <input
                      type="text"
                      value={editingEvent.title || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                      placeholder="e.g. Chemistry Practical Assessment"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Date</label>
                    <input
                      type="date"
                      value={editingEvent.startDate || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, startDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Category</label>
                    <select
                      value={editingEvent.type || 'exam'}
                      onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                    >
                      <option value="exam">Examination / Test</option>
                      <option value="holiday">School Holiday</option>
                      <option value="academic">Academic Lecture / Practicals</option>
                      <option value="meeting">Faculty / Parent Meeting</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Location / Venue</label>
                    <input
                      type="text"
                      value={editingEvent.location || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                      placeholder="e.g. Science Complex - Hall 28"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingEvent(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEvent}
                    className="px-5 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950"
                  >
                    Save Event
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: LEARNING MATERIALS */}
      {activeTab === 'materials' && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-50">
            <div>
              <h2 className="font-serif text-xl font-bold text-blue-950">
                Curriculum Learning Materials & Syllabi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage uploaded revision notes, formula sheets, and PDF course guides.
              </p>
            </div>
            <button
              onClick={() =>
                setEditingMaterial({
                  title: '',
                  description: '',
                  fileType: 'pdf',
                  fileUrl: 'https://cdn.example.org/materials/guide.pdf',
                  fileSize: '3.5 MB',
                  subjectId: 'sub-cmath',
                })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 text-xs shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Learning Material</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-start justify-between gap-3"
              >
                <div>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold uppercase">
                    {m.fileType} • {m.fileSize || 'Doc'}
                  </span>
                  <h3 className="font-serif text-base font-bold text-blue-950 mt-1">{m.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{m.description}</p>
                  <a
                    href={m.fileUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-blue-700 hover:underline mt-2 inline-block"
                  >
                    View Resource Link →
                  </a>
                </div>
                <button
                  onClick={async () => {
                    if (window.confirm(`Delete material "${m.title}"?`)) {
                      await deleteDoc(doc(db, 'learningMaterials', m.id));
                      triggerNotice('Material removed.');
                    }
                  }}
                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {editingMaterial && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-blue-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-serif text-lg font-bold text-blue-950">Add Learning Material</h3>
                  <button onClick={() => setEditingMaterial(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Title</label>
                    <input
                      type="text"
                      value={editingMaterial.title || ''}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
                      placeholder="e.g. Physics Mechanics Notes"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Description</label>
                    <input
                      type="text"
                      value={editingMaterial.description || ''}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value })}
                      placeholder="e.g. Formulas and worked examples"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">File URL</label>
                    <input
                      type="text"
                      value={editingMaterial.fileUrl || ''}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, fileUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingMaterial(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!editingMaterial.title) return;
                      const id = `mat-${Date.now()}`;
                      const payload: LearningMaterial = {
                        id,
                        title: editingMaterial.title,
                        description: editingMaterial.description || '',
                        classId: 'class-2k28-science-em',
                        subjectId: editingMaterial.subjectId || 'sub-cmath',
                        teacherId: 'admin_jaasim',
                        teacherName: 'M. N. M. Jaasim',
                        fileType: 'pdf',
                        fileUrl: editingMaterial.fileUrl || '',
                        fileSize: editingMaterial.fileSize || '3.2 MB',
                        createdAt: new Date().toISOString(),
                      };
                      await setDoc(doc(db, 'learningMaterials', id), payload, { merge: true });
                      setEditingMaterial(null);
                      triggerNotice(`Material "${payload.title}" added!`);
                    }}
                    className="px-5 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950"
                  >
                    Save Resource
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
