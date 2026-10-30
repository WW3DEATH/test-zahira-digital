import React from 'react';
import {
  School,
  Lock,
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BookMarked,
  Layers,
} from 'lucide-react';
import { useSiteConfig } from '../../context/SiteConfigContext';

interface GuestPortalLandingProps {
  onOpenAuthModal: () => void;
  onNavigate: (page: string) => void;
}

export const GuestPortalLanding: React.FC<GuestPortalLandingProps> = ({
  onOpenAuthModal,
  onNavigate,
}) => {
  const { siteConfig } = useSiteConfig();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Light Collegiate Welcome Banner */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 p-6 md:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3.5 py-1 text-xs font-bold text-white shadow-xs">
              <School className="w-3.5 h-3.5" />
              <span>{siteConfig.schoolName}</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-white mt-3 leading-tight">
              {siteConfig.cohortName} Academic Portal
            </h1>
            <p className="text-blue-100 text-sm md:text-base mt-2 leading-relaxed">
              Welcome to the official Learning Management System for the 2026-2028 Advanced Level Science (English Medium) batch. Please sign in to access personalized class timetables, AI tutors, exam evaluations, and faculty coursework.
            </p>
            <p className="text-blue-200 text-xs italic mt-2">
              "{siteConfig.motto || 'Excellence in Science, Knowledge, and Discipline'}"
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={onOpenAuthModal}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-white hover:bg-slate-50 px-6 py-3.5 text-xs font-bold text-blue-950 transition-all shadow-md hover:shadow-lg"
            >
              <User className="w-4 h-4 text-red-600" />
              <span>Sign In to Access Portal</span>
            </button>
            <button
              onClick={() => onNavigate('materials')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900/40 hover:bg-blue-900/60 border border-blue-300/30 px-5 py-3 text-xs font-semibold text-white transition-colors"
            >
              <BookMarked className="w-4 h-4 text-blue-200" />
              <span>Explore Study Materials</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sign-in Callout Card */}
      <div className="rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
              <Lock className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-blue-950">
                Authentication Required
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                All accounts and records are protected. Faculty instructors, enrolled scholars, and administrators must log in with their credentials to view private cohort rosters, grades, and communication channels.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAuthModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-3 text-xs font-bold text-white transition-all shadow-md shrink-0"
          >
            <span>Log In or Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Portal Roles Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-xs hover:border-blue-300 transition-all">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-4">
            <GraduationCap className="w-5 h-5 text-blue-700" />
          </div>
          <h3 className="font-serif text-lg font-bold text-blue-950">Student Scholars</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Access past papers, lecture slides, interactive quizzes, attendance tracking, and 24/7 Socrates Gemini Flash AI tutoring tailored to your science stream.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-xs hover:border-blue-300 transition-all">
          <div className="h-10 w-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center mb-4">
            <BookOpen className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="font-serif text-lg font-bold text-blue-950">Faculty & Teachers</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Publish lesson materials, generate AI-assisted science quizzes, review student assignments, and record classroom attendance roll-calls.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-xs hover:border-blue-300 transition-all">
          <div className="h-10 w-10 rounded-xl bg-slate-100 text-blue-950 flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5 text-blue-900" />
          </div>
          <h3 className="font-serif text-lg font-bold text-blue-950">Academic Leadership</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Manage institutional settings, curriculum syllabi, user permissions, examination schedules, and official school circulars via the Master Admin Panel.
          </p>
        </div>
      </div>
    </div>
  );
};
