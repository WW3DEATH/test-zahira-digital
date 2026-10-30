import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Pin,
  Search,
  Users,
  GraduationCap,
  BookOpen,
  Filter,
  X,
  Send,
} from 'lucide-react';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Announcement, AnnouncementAudience } from '../types';

export const AnnouncementsPage: React.FC = () => {
  const { activeRole, userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAudience, setFilterAudience] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAudience, setNewAudience] = useState<AnnouncementAudience>('all');
  const [newClassId, setNewClassId] = useState('class-2k28-science-em');
  const [newIsPinned, setNewIsPinned] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'announcements'),
      (snap) => {
        const list: Announcement[] = [];
        snap.forEach((d) => list.push(d.data() as Announcement));
        setAnnouncements(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setLoading(false);
      },
      (error) => {
        console.warn('Real-time announcements note:', error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleCreateAnnouncement = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      const id = `ann-${Date.now()}`;
      const ann: Announcement = {
        id,
        title: newTitle.trim(),
        content: newContent.trim(),
        authorId: userProfile?.userId || 'admin_jaasim',
        authorName: userProfile?.fullName || 'M. N. M. Jaasim',
        authorRole: activeRole,
        audience: newAudience,
        classId: newAudience === 'class' ? newClassId : undefined,
        isPinned: newIsPinned,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'announcements', id), ann);
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
      setNewIsPinned(false);
    } catch (e) {
      console.error('Failed to create announcement:', e);
    }
  };

  const filtered = announcements.filter((a) => {
    const matchesAudience = filterAudience === 'all' || a.audience === filterAudience || a.audience === 'all';
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAudience && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
            School Notices & Bulletins
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Official communications, cohort updates, and institutional broadcasts
          </p>
        </div>

        {(activeRole === 'admin' || activeRole === 'teacher') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-stone-950 transition-all shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-stone-400 shrink-0" />
          {['all', 'class', 'teachers', 'students', 'parents'].map((aud) => (
            <button
              key={aud}
              onClick={() => setFilterAudience(aud)}
              className={`rounded-lg px-3 py-1.5 font-semibold capitalize transition-all shrink-0 ${
                filterAudience === aud
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {aud === 'all' ? 'All Bulletins' : aud}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search bulletins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-3 text-xs text-stone-800 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filtered.map((ann) => (
          <div
            key={ann.id}
            className={`rounded-2xl border p-6 transition-all ${
              ann.isPinned
                ? 'border-amber-300 bg-amber-50/30 shadow-xs'
                : 'border-stone-200 bg-white shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {ann.isPinned && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500 text-stone-950 font-bold px-2 py-0.5 text-[10px] uppercase">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  <span className="rounded bg-stone-100 text-stone-700 font-semibold px-2 py-0.5 text-[10px] uppercase">
                    Audience: {ann.audience}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-stone-900">{ann.title}</h3>
                <p className="text-xs text-stone-700 whitespace-pre-line leading-relaxed">
                  {ann.content}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
              <span>
                Published by <span className="font-semibold text-stone-700">{ann.authorName}</span> ({ann.authorRole})
              </span>
              <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Publish Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Publish School Announcement
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Notice Headline
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Schedule for Midterm Consultations"
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Target Audience
                </label>
                <select
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value as any)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                >
                  <option value="all">School-Wide (Everyone)</option>
                  <option value="class">Specific Class Cohort</option>
                  <option value="teachers">Faculty Only</option>
                  <option value="students">Students Only</option>
                  <option value="parents">Parents Only</option>
                </select>
              </div>

              {newAudience === 'class' && (
                <div>
                  <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                    Select Cohort
                  </label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                  >
                    <option value="class-10a">Grade 10-A (Advanced STEM)</option>
                    <option value="class-10b">Grade 10-B (Humanities & Arts)</option>
                    <option value="class-11a">Grade 11-A (Pre-Collegiate Science)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Announcement Body
                </label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Full bulletin content..."
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsPinned}
                    onChange={(e) => setNewIsPinned(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4"
                  />
                  <span className="font-semibold text-stone-800 text-xs">
                    Pin to top of school board
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAnnouncement}
                disabled={!newTitle.trim() || !newContent.trim()}
                className="rounded-lg bg-stone-900 px-5 py-2 text-xs font-bold text-white hover:bg-stone-800 shadow-xs"
              >
                Broadcast Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
