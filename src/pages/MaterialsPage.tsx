import React, { useState, useEffect } from 'react';
import {
  BookMarked,
  FileText,
  FileCode,
  Download,
  Plus,
  Search,
  Filter,
  ExternalLink,
  X,
  Eye,
  CheckCircle2,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { LearningMaterial, Subject } from '../types';
import { SEED_MATERIALS, SEED_SUBJECTS } from '../services/dataService';

export const MaterialsPage: React.FC = () => {
  const { activeRole, userProfile } = useAuth();
  const [materials, setMaterials] = useState<LearningMaterial[]>(SEED_MATERIALS);
  const [subjects, setSubjects] = useState<Subject[]>(SEED_SUBJECTS);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Material Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubjectId, setNewSubjectId] = useState('sub-cmath');
  const [newType, setNewType] = useState<'pdf' | 'document' | 'presentation' | 'image' | 'link'>('pdf');
  const [newLink, setNewLink] = useState('https://cdn.example.org/materials/lecture-notes.pdf');

  // Real-time listener for materials
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'learningMaterials'),
      (snap) => {
        const list: LearningMaterial[] = [];
        snap.forEach((d) => list.push(d.data() as LearningMaterial));
        if (list.length > 0) {
          setMaterials(list);
        } else {
          setMaterials(SEED_MATERIALS);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Real-time materials note:', error);
        setMaterials(SEED_MATERIALS);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Real-time listener for subjects
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'subjects'), (snap) => {
      const list: Subject[] = [];
      snap.forEach((d) => list.push(d.data() as Subject));
      if (list.length > 0) setSubjects(list);
    });
    return () => unsub();
  }, []);

  const handleUploadMaterial = async () => {
    if (!newTitle.trim()) return;
    try {
      const id = `mat-${Date.now()}`;
      const mat: LearningMaterial = {
        id,
        title: newTitle.trim(),
        description: newDesc.trim(),
        classId: 'class-2k28-science-em',
        subjectId: newSubjectId,
        teacherId: userProfile?.userId || 'admin_jaasim',
        teacherName: userProfile?.fullName || 'M. N. M. Jaasim',
        fileType: newType,
        fileUrl: newLink,
        fileSize: '3.2 MB',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'learningMaterials', id), mat);
      setShowUploadModal(false);
      setNewTitle('');
      setNewDesc('');
    } catch (e) {
      console.error('Failed to publish material:', e);
    }
  };

  const filtered = materials.filter((m) => {
    const subj = subjects.find((s) => s.id === m.subjectId);
    const matchesType = filterType === 'all' || m.fileType === filterType;
    const matchesSubject = filterSubject === 'all' || m.subjectId === filterSubject;
    
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesType && matchesSubject;

    const matchesSearch =
      m.title.toLowerCase().includes(query) ||
      (m.description || '').toLowerCase().includes(query) ||
      (subj?.name || '').toLowerCase().includes(query) ||
      (subj?.code || '').toLowerCase().includes(query) ||
      (m.teacherName || '').toLowerCase().includes(query) ||
      m.fileType.toLowerCase().includes(query);

    return matchesType && matchesSubject && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner - Light Royal Blue with Red Accents */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
              <BookMarked className="w-3.5 h-3.5" />
              <span>Zahira College Mawanella • 2k28 Science EM</span>
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-white mt-2">
              Curriculum & Study Materials
            </h1>
            <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-xl">
              Access lecture notes, worked tutorials, laboratory guides, and formula booklets for Advanced Level Science EM.
            </p>
          </div>

          {activeRole !== 'student' && activeRole !== 'parent' && activeRole !== 'guest' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Learning Material</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Search and Filter Section */}
      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-xs space-y-4">
        {/* Full-width Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
          <input
            type="text"
            placeholder="Search study materials by title, topic, subject (Physics, Chemistry...), or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Badges & Subject Selectors */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          {/* Format Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0">
              Format:
            </span>
            {['all', 'pdf', 'document', 'presentation', 'link'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-all shrink-0 ${
                  filterType === type
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type === 'all' ? 'All Types' : `${type.toUpperCase()}s`}
              </button>
            ))}
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
              Subject:
            </span>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="all">All Subjects ({subjects.length})</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Counter and Active Filter Pill */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <p>
            Showing <span className="font-bold text-blue-950">{filtered.length}</span> of{' '}
            <span className="font-bold text-blue-950">{materials.length}</span> materials
          </p>
          {(searchQuery || filterType !== 'all' || filterSubject !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterSubject('all');
              }}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Materials Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-blue-100 bg-white p-12 text-center shadow-xs">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-blue-950">No study materials found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No materials matched your search query "{searchQuery}". Try searching for another topic or clear filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
              setFilterSubject('all');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950 transition-colors"
          >
            Clear Search & Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((mat) => {
            const subj = subjects.find((s) => s.id === mat.subjectId);
            return (
              <div
                key={mat.id}
                className="rounded-2xl border border-blue-100 bg-white p-6 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="rounded-md px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-2xs"
                      style={{ backgroundColor: subj?.color || '#1e3a8a' }}
                    >
                      {subj?.code || 'SCI-28'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {mat.fileSize || '3.5 MB'}
                    </span>
                  </div>

                  <h3 className="font-serif text-base font-bold text-blue-950 mb-2 leading-snug">
                    {mat.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {mat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-blue-900">{subj?.name || 'Science Stream'}</p>
                    <p className="text-[10px] text-slate-400">Faculty: {mat.teacherName || 'M. N. M. Jaasim'}</p>
                  </div>
                  <a
                    href={mat.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-blue-900 hover:bg-blue-950 text-white p-2.5 transition-colors shadow-2xs group"
                    title="View / Download Resource"
                  >
                    <Download className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-blue-200 bg-white p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-blue-950">Publish Learning Material</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Material Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Physics Mechanics Chapter 1 Handout"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                    Subject
                  </label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-800 font-semibold focus:bg-white focus:outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                    File Format
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-800 font-semibold uppercase focus:bg-white focus:outline-none"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="document">Word Doc</option>
                    <option value="presentation">Slide Deck</option>
                    <option value="link">Web Resource</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Description / Topics Covered
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Key concepts, equations, and examination focus..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Resource URL
                </label>
                <input
                  type="text"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-800 font-mono text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadMaterial}
                  className="px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950 shadow-xs"
                >
                  Publish Material
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
