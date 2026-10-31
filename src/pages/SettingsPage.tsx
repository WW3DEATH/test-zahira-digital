import React, { useState, useEffect } from 'react';
import {
  Settings,
  School,
  Save,
  CheckCircle2,
  ShieldCheck,
  Mail,
  MapPin,
  Sun,
  Moon,
  Eye,
  Check,
  Sparkles,
  Palette,
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SchoolSetting } from '../types';
import { SEED_SETTING } from '../services/dataService';
import { useTheme } from '../context/ThemeContext';

export const SettingsPage: React.FC = () => {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Platform & Institutional Settings
            </h2>
            <span className="rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-3 py-0.5 text-[11px] font-bold border border-blue-200 dark:border-blue-900">
              Zahira College Mawanella
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global theme appearance, accessibility preferences, and school parameters
          </p>
        </div>

        {savedSuccess && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-4 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* CARD 1: GLOBAL THEME & ACCESSIBILITY CONTROLS */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xs">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                Display Theme & Accessibility
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tailwind CSS dark mode switch for visual comfort and reduced eye strain
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Active: {isDark ? 'Dark Theme' : 'Light Theme'}</span>
          </span>
        </div>

        {/* Theme Picker Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Light Mode Option */}
          <div
            onClick={() => setTheme('light')}
            className={`cursor-pointer rounded-2xl border-2 p-5 transition-all relative flex flex-col justify-between gap-4 ${
              !isDark
                ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-2xs">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Daylight Mode (Light)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Crisp white background, royal blue crests & high legibility
                  </p>
                </div>
              </div>

              {!isDark && (
                <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-700 shadow-2xs">
              <div className="flex items-center justify-between font-semibold">
                <span>Class Schedule: Combined Maths</span>
                <span className="text-blue-600 font-bold">08:00 AM</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Recommended for bright classroom & daylight study environments.</p>
            </div>
          </div>

          {/* Dark Mode Option */}
          <div
            onClick={() => setTheme('dark')}
            className={`cursor-pointer rounded-2xl border-2 p-5 transition-all relative flex flex-col justify-between gap-4 ${
              isDark
                ? 'border-blue-500 bg-blue-950/40 dark:bg-slate-800 shadow-md ring-2 ring-blue-400/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center shadow-2xs">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Night Study Mode (Dark)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Deep slate-950 obsidian, soft lighting & low blue-light emissions
                  </p>
                </div>
              </div>

              {isDark && (
                <div className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-[11px] text-slate-200 shadow-2xs">
              <div className="flex items-center justify-between font-semibold">
                <span>Coursework: Wave Optics Simulation</span>
                <span className="text-emerald-400 font-bold">Due Nov 18</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Optimized for late-night exam prep, reduced glare & battery saving.</p>
            </div>
          </div>
        </div>

        {/* Quick Toggle Button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
              Persistent Preference
            </span>
            Your theme choice is stored in local storage and persists across all views and subsequent visits.
          </div>

          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-all shadow-xs shrink-0"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-300" />
                <span>Switch to Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-white" />
                <span>Switch to Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CARD 2: INSTITUTIONAL SCHOOL DETAILS */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 dark:bg-slate-800 text-amber-400 shadow-sm">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
              {settings.schoolName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Accredited Secondary Institution • Academic Year {settings.academicYear}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1 text-[11px]">
              School Legal Name
            </label>
            <input
              type="text"
              value={settings.schoolName}
              onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1 text-[11px]">
              Active Academic Year
            </label>
            <input
              type="text"
              value={settings.academicYear}
              onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1 text-[11px]">
              Admissions & Contact Email
            </label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1 text-[11px]">
              Physical Campus Address
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition-colors shadow-xs"
          >
            <Save className="w-4 h-4 text-white" />
            <span>Save School Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
