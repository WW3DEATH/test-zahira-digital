import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { OFFICIAL_STUDENT_SUBJECTS } from '../types';

export const ProfilePage: React.FC = () => {
  const { userProfile, activeRole } = useAuth();
  const [fullName, setFullName] = useState(userProfile?.fullName || 'Zahira Academic Member');
  const [bio, setBio] = useState(userProfile?.bio || 'Academic scholar at Zahira College 2k28 Science EM.');
  const [phone, setPhone] = useState(userProfile?.phone || '+94 77 123 4567');
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || '');
  const [enrolledSubjects, setEnrolledSubjects] = useState<string[]>(
    userProfile?.enrolledSubjects && userProfile.enrolledSubjects.length > 0
      ? userProfile.enrolledSubjects
      : []
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || 'Zahira Academic Member');
      setBio(userProfile.bio || 'Academic scholar at Zahira College 2k28 Science EM.');
      setPhone(userProfile.phone || '+94 77 123 4567');
      setAvatarUrl(userProfile.avatarUrl || '');
      setEnrolledSubjects(userProfile.enrolledSubjects || []);
    }
  }, [userProfile]);

  const toggleSubject = (subj: string) => {
    setEnrolledSubjects((prev) =>
      prev.includes(subj) ? prev.filter((s) => s !== subj) : [...prev, subj]
    );
  };

  const handleSaveProfile = async () => {
    if (!userProfile?.userId) return;
    const updatedAt = new Date().toISOString();
    try {
      await setDoc(
        doc(db, 'userProfiles', userProfile.userId),
        {
          fullName,
          bio,
          phone,
          avatarUrl,
          enrolledSubjects,
          updatedAt,
        },
        { merge: true }
      );
      if (activeRole === 'student') {
        await setDoc(
          doc(db, 'students', userProfile.userId),
          {
            fullName,
            enrolledSubjects,
          },
          { merge: true }
        ).catch(() => {});
      }
      try {
        const stored = localStorage.getItem('zahira_auth_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem(
            'zahira_auth_session',
            JSON.stringify({ ...parsed, fullName, bio, phone, avatarUrl, enrolledSubjects, updatedAt })
          );
        }
      } catch {}
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save profile:', e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
            User Profile & Academic Credentials
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Manage your personal academic identity, joined subjects, and communication details
          </p>
        </div>

        {savedSuccess && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile updated successfully!</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8 shadow-xs space-y-6">
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-stone-100">
          <img
            src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0f172a&color=fff`}
            alt={fullName}
            className="w-20 h-20 rounded-2xl border-2 border-amber-300 object-cover shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-xl font-bold text-stone-900">{fullName}</h3>
              <span className="rounded bg-amber-100 text-amber-800 font-bold px-2 py-0.5 text-[10px] uppercase">
                {activeRole}
              </span>
              {(userProfile?.indexNumber || activeRole === 'student' || userProfile?.email?.toLowerCase().trim() === 'mnmjaasim@gmail.com') && (
                <span className="rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold px-2.5 py-0.5 text-[11px]">
                  Index: {userProfile?.indexNumber || '2860003'}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 font-mono mt-0.5">{userProfile?.email}</p>
            <p className="text-xs text-stone-600 mt-1.5 max-w-md">{bio}</p>
            {enrolledSubjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {enrolledSubjects.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-900"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
              Full Legal Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
              Institutional Email (Read Only)
            </label>
            <input
              type="text"
              disabled
              value={userProfile?.email || 'user@academia.edu'}
              className="w-full rounded-xl border border-stone-200 bg-stone-100 p-2.5 text-stone-500 font-mono cursor-not-allowed"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
              Official Student Index Number (ZNC 2k28 Science)
            </label>
            <input
              type="text"
              disabled
              value={userProfile?.indexNumber || (userProfile?.email?.toLowerCase().trim() === 'mnmjaasim@gmail.com' ? '2860003' : '2860003')}
              className="w-full rounded-xl border border-blue-200 bg-blue-50/50 p-2.5 text-blue-800 font-mono font-bold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
              Direct Contact Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
              Profile Avatar Image URL
            </label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Joined Subjects Selection for 50-Question PvP Quizzes */}
          <div className="md:col-span-2 rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="font-bold text-blue-950 uppercase tracking-wider text-[11px]">
                Joined Subjects (Used in 50-Question PvP Quizzes)
              </label>
              <span className="text-[11px] font-bold text-blue-700 tabular-nums">
                {enrolledSubjects.length} / {OFFICIAL_STUDENT_SUBJECTS.length} selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {OFFICIAL_STUDENT_SUBJECTS.map((subj, idx) => {
                const isSelected = enrolledSubjects.includes(subj);
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => toggleSubject(subj)}
                    className={`min-h-[42px] flex items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-blue-300'
                    }`}
                  >
                    <span className="truncate">
                      {idx + 1}) {subj}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
              Academic Bio & Specialization
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            onClick={handleSaveProfile}
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-stone-800 transition-colors shadow-xs"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>Update Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
