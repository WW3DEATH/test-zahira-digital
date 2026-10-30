import React, { useState } from 'react';
import { User, Mail, Shield, Save, CheckCircle2, Phone, BookOpen, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const ProfilePage: React.FC = () => {
  const { userProfile, activeRole } = useAuth();
  const [fullName, setFullName] = useState(userProfile?.fullName || 'Zahira Academic Member');
  const [bio, setBio] = useState(userProfile?.bio || 'Academic scholar at Zahira College 2k28 Science EM.');
  const [phone, setPhone] = useState(userProfile?.phone || '+94 77 123 4567');
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = async () => {
    if (!userProfile?.userId) return;
    try {
      await setDoc(
        doc(db, 'userProfiles', userProfile.userId),
        {
          fullName,
          bio,
          phone,
          avatarUrl,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
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
            Manage your personal academic identity and communication details
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
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-xl font-bold text-stone-900">{fullName}</h3>
              <span className="rounded bg-amber-100 text-amber-800 font-bold px-2 py-0.5 text-[10px] uppercase">
                {activeRole}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-mono mt-0.5">{userProfile?.email}</p>
            <p className="text-xs text-stone-600 mt-1.5 max-w-md">{bio}</p>
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
