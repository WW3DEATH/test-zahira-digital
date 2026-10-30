import React, { useState, useEffect } from 'react';
import { Settings, School, Save, CheckCircle2, ShieldCheck, Mail, MapPin } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SchoolSetting } from '../types';
import { SEED_SETTING } from '../services/dataService';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SchoolSetting>(SEED_SETTING);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const snap = await getDoc(doc(db, 'schoolSettings', 'main-settings'));
        if (snap.exists()) {
          setSettings(snap.data() as SchoolSetting);
        }
      } catch (e) {
        console.error('Error fetching settings:', e);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'schoolSettings', 'main-settings'), settings, { merge: true });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
            Institutional School Settings
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Global school identity, academic calendars, and administrative parameters
          </p>
        </div>

        {savedSuccess && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-5 border-b border-stone-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-amber-400 shadow-sm">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900">{settings.schoolName}</h3>
            <p className="text-xs text-stone-500">Accredited Secondary Institution • Academic Year {settings.academicYear}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
              School Legal Name
            </label>
            <input
              type="text"
              value={settings.schoolName}
              onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
              Active Academic Year
            </label>
            <input
              type="text"
              value={settings.academicYear}
              onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
              Admissions & Contact Email
            </label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
              Physical Campus Address
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-stone-800 transition-colors shadow-xs"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>Save School Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
