import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Code2,
  Compass,
  ExternalLink,
  FlaskConical,
  GraduationCap,
  Layers,
  Mail,
  MapPin,
  MessagesSquare,
  Phone,
  Sparkles,
  Swords,
  UserCheck,
} from 'lucide-react';
import { ZahiraLogo } from '../components/common/ZahiraLogo';
import { useSiteConfig } from '../context/SiteConfigContext';

interface AboutUsPageProps {
  onNavigate?: (page: string) => void;
}

type TopicView = 'all' | 'zahira' | 'developer';

export const AboutUsPage: React.FC<AboutUsPageProps> = ({ onNavigate }) => {
  const { siteConfig } = useSiteConfig();
  const [topicView, setTopicView] = useState<TopicView>('all');
  const currentYear = new Date().getFullYear();
  const linkedInUrl = 'https://www.linkedin.com/in/m-n-m-jaasim-9ab879380/';

  const projectHighlights = [
    {
      index: '01',
      title: 'Two Dedicated Teachers per Subject',
      description:
        'Every Advanced Level English Medium Science subject is guided by two specialist teachers—dividing Pure & Applied streams, Physical & Organic/Inorganic modules, or Theory & Practical mastery so students receive deeper clarity, faster doubt resolution, and attentive paper marking.',
      icon: UserCheck,
    },
    {
      index: '02',
      title: 'Structured G.C.E. A/L Science Excellence Since 2024',
      description:
        'Launched in 2024, the Zahira College Mawanella A/L English Medium Science Project has built a disciplined, high-achieving academic culture that empowers both Physical Science and Biological Science scholars with organized notes, past-paper banks, and continuous term tracking.',
      icon: Award,
    },
    {
      index: '03',
      title: 'Interactive Learning & Virtual Laboratories',
      description:
        'Students explore physics and chemistry simulations, revise structured syllabus modules, complete practice assessments, and review real-time performance analytics across all core A/L Science subjects.',
      icon: FlaskConical,
    },
    {
      index: '04',
      title: 'Collaborative Classrooms & Real-Time PvP Quizzes',
      description:
        'Subject Discussion Rooms allow scholars and teachers to exchange files and solve challenging questions together, complemented by daily attendance registers, AI study support, and live 50-question academic PvP challenges.',
      icon: Swords,
    },
  ];

  const subjectStreams = [
    {
      code: 'C.Maths',
      name: 'Combined Mathematics',
      facultyModel: '2 Teachers (Pure & Applied)',
      scope: 'Calculus, Algebra, Coordinate Geometry, Statics, Dynamics & Vectors',
    },
    {
      code: 'Physics',
      name: 'Physics',
      facultyModel: '2 Teachers (Theory & Practical)',
      scope: 'Mechanics, Oscillations & Waves, Thermal Physics, Fields & Electronics',
    },
    {
      code: 'Chemistry',
      name: 'Chemistry',
      facultyModel: '2 Teachers (Physical / Inorganic & Organic)',
      scope: 'Atomic Structure, Energetics, Kinetics, Equilibrium, Inorganic & Organic',
    },
    {
      code: 'Bio',
      name: 'Biology',
      facultyModel: '2 Teachers (Botany / Genetics & Zoology / Physiology)',
      scope: 'Cellular Biology, Genetics, Plant & Animal Physiology, Microbiology & Ecology',
    },
    {
      code: 'ICT',
      name: 'Information & Communication Technology',
      facultyModel: '2 Teachers (Systems & Programming)',
      scope: 'Logic Gates, Data Representation, Networking, SQL Databases & Python',
    },
  ];

  const developerFocusAreas = [
    {
      title: 'Purpose-Built Educational Engineering',
      detail:
        'Architected from the ground up with real-time Firebase Firestore synchronization, role-based access control for students, teachers, parents, and administrators, and responsive light/dark accessibility.',
    },
    {
      title: 'Interactive Study & Assessment Tools',
      detail:
        'Developed the subject Discussion Rooms with file sharing, real-time Player-vs-Player quiz engine, virtual laboratories, attendance management, and term mark analytics.',
    },
    {
      title: 'Resilient AI Integration',
      detail:
        'Engineered server-side Gemini AI tutoring for students, strictly role-gated AI academic tools for teachers and administrators, and custom API key support for live PvP quiz generation.',
    },
  ];

  const showZahira = topicView === 'all' || topicView === 'zahira';
  const showDeveloper = topicView === 'all' || topicView === 'developer';

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-300">
      {/* Page Overview Header & Topic Switcher */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Zahira College Mawanella</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">AL EM Science Project Since 2024</span>
            <span aria-hidden="true">·</span>
            <span>2 Topics</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
            About Us
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            Explore the story and academic standards of the Zahira College Mawanella AL EM Science Project alongside the developer behind this platform.
          </p>
        </div>

        {/* Interactive Topic Filter Tabs */}
        <div
          role="tablist"
          aria-label="About Us Topics"
          className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl shrink-0 self-start md:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={topicView === 'all'}
            onClick={() => setTopicView('all')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              topicView === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Both Topics
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={topicView === 'zahira'}
            onClick={() => setTopicView('zahira')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              topicView === 'zahira'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Zahira Project
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={topicView === 'developer'}
            onClick={() => setTopicView('developer')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              topicView === 'developer'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Developer
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* TOPIC 1: ZAHIRA PROJECT — ABOUT US                                    */}
      {/* ===================================================================== */}
      {showZahira && (
        <section aria-labelledby="topic-zahira-heading" className="space-y-8">
          {/* Topic 1 Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wider uppercase text-red-700 dark:text-red-400 tabular-nums">
                01. Zahira Project — About Us
              </p>
              <h2
                id="topic-zahira-heading"
                className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 text-balance"
              >
                Zahira College Mawanella · A/L EM Science Project (Since 2024)
              </h2>
            </div>
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 tabular-nums whitespace-nowrap shrink-0">
              Established 2024 · 2 Teachers per Subject
            </p>
          </div>

          {/* Institutional Hero & Story */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 px-6 py-8 sm:px-10 sm:py-10 text-white">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <ZahiraLogo size="lg" className="shrink-0 shadow-lg ring-2 ring-white/20" />
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-300 tabular-nums">
                    <span>Zahira College Mawanella</span>
                    <span aria-hidden="true">·</span>
                    <span>Since 2024</span>
                    <span aria-hidden="true">·</span>
                    <span>A/L English Medium Science</span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight text-balance">
                    Inspiring Scientific Excellence, Discipline &amp; Dual-Faculty Mentorship
                  </h3>
                  <p className="text-sm sm:text-base text-blue-100 leading-relaxed max-w-3xl">
                    Since 2024, the Zahira College Mawanella A/L English Medium Science Project ({siteConfig.academicYear || '2026–2028'}) has stood as a benchmark initiative—combining dedicated classroom guidance with a modern digital learning ecosystem.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Narrative & Section Details */}
            <div className="px-6 py-6 sm:px-10 sm:py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <h4 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0" />
                  <span>Why the Zahira AL EM Science Project Shines</span>
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Launched in <strong>2024</strong>, the <strong>Zahira College Mawanella AL EM Science Project</strong> was built on a proud commitment to uplift English Medium Advanced Level Science education in Mawanella. Within a supportive, respectful, and ambitious scholarly community, students consistently develop strong conceptual foundations, analytical confidence, and exemplary examination readiness.
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  One of the project&apos;s greatest strengths is its <strong>Two Teachers per Subject</strong> model: rather than leaving complex G.C.E. A/L syllabi to a single track, each core subject is entrusted to <strong>two dedicated teachers</strong> who collaborate closely across theory depth, practical experiments, past-paper drilling, and personal student mentoring. Combined with our motto <em>&ldquo;{siteConfig.motto || 'Excellence in Science, Knowledge, and Discipline'}&rdquo;</em>, every learner receives the attention needed to excel.
                </p>

                {/* Quick Metric Strip (Clean Typography, Zero Pills) */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-4">
                  <div>
                    <p className="font-mono text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      Since 2024
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Serving A/L EM Science
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-lg sm:text-xl font-bold text-blue-900 dark:text-blue-300 tabular-nums">
                      2 Teachers
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Dedicated per Subject
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-lg sm:text-xl font-bold text-red-700 dark:text-red-400 tabular-nums">
                      5 Core Subjects
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Physical &amp; Bio Streams
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 md:border-l md:border-slate-200 dark:md:border-slate-800 md:pl-6 text-xs text-slate-600 dark:text-slate-300">
                <h4 className="font-bold tracking-wide text-slate-900 dark:text-slate-100 text-xs">
                  Section Information
                </h4>
                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-2.5">
                    <GraduationCap className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        A/L Science (English Medium)
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 tabular-nums">
                        Established 2024 · {siteConfig.academicYear || '2026–2028'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {siteConfig.room || 'Science Complex - Hall 28'}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {siteConfig.address || 'Zahira College, Mawanella, Sri Lanka'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span className="break-all">
                      {siteConfig.contactEmail || 'science@zahiracollegemw.lk'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span className="tabular-nums">
                      {siteConfig.contactPhone || '+94 35 224 6214'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Strengths Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {projectHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.index}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400 tabular-nums">
                        {item.index}. Project Pillar
                      </p>
                      <h4 className="font-serif text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Covered Subjects & Dual-Teacher Model */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h4 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100">
                  A/L Science EM Subjects &amp; Dual-Teacher Mentorship
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Every subject is supported by two dedicated teachers for thorough syllabus coverage and individual guidance
                </p>
              </div>
              {onNavigate && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('subjects')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Browse Syllabus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('discussions')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-900 hover:bg-blue-950 px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
                  >
                    <MessagesSquare className="w-3.5 h-3.5" />
                    <span>Discussion Room</span>
                  </button>
                </div>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {subjectStreams.map((sub) => (
                <div
                  key={sub.code}
                  className="py-4 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center"
                >
                  <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-bold text-blue-900 dark:text-blue-300 w-20 shrink-0">
                      {sub.code}
                    </span>
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {sub.name}
                    </span>
                  </div>
                  <div className="md:col-span-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {sub.facultyModel}
                  </div>
                  <p className="md:col-span-5 text-xs text-slate-500 dark:text-slate-400 md:text-right">
                    {sub.scope}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TOPIC 2: DEVELOPER — ABOUT US                                         */}
      {/* ===================================================================== */}
      {showDeveloper && (
        <section aria-labelledby="topic-developer-heading" className="space-y-6">
          {/* Topic 2 Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wider uppercase text-blue-700 dark:text-blue-400 tabular-nums">
                02. Developer — About Us
              </p>
              <h2
                id="topic-developer-heading"
                className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 text-balance"
              >
                Meet the Platform Developer — M. N. M. Jaasim
              </h2>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
              Full-Stack Software Engineering &amp; Product Design
            </p>
          </div>

          {/* Developer Profile & Story Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white p-6 sm:p-10 shadow-md space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <Code2 className="w-4 h-4 shrink-0" />
                  <span>Creator &amp; Lead Developer · Zahira College Mawanella AL EM Science Portal</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
                  M. N. M. Jaasim
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  I designed and engineered this academic platform to support the <strong>Zahira College Mawanella Advanced Level English Medium Science Project</strong>—bringing together study resources, live teacher-student discussions, attendance tracking, competitive PvP learning, and AI-assisted study tools in one unified, fast, and dependable web application.
                </p>
              </div>

              <div className="shrink-0">
                <a
                  href={linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 text-xs font-bold transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 whitespace-nowrap shrink-0"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                  <span>Connect on LinkedIn</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-90" />
                </a>
              </div>
            </div>

            {/* Clean Hairline Grid of Developer Engineering Pillars (No Nested Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800">
              {developerFocusAreas.map((area, idx) => (
                <div key={area.title} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                    {idx === 0 && <Layers className="w-4 h-4 shrink-0" />}
                    {idx === 1 && <Swords className="w-4 h-4 shrink-0" />}
                    {idx === 2 && <Sparkles className="w-4 h-4 shrink-0" />}
                    <span>{area.title}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {area.detail}
                  </p>
                </div>
              ))}
            </div>

            {/* Copyright & Official Developer URL Row */}
            <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
              <div className="space-y-1">
                <p className="font-semibold text-slate-100 tabular-nums">
                  &copy; {currentYear} M. N. M. Jaasim · All Rights Reserved.
                </p>
                <p>
                  Built exclusively for the Zahira College Mawanella · A/L English Medium Science Project (Since 2024).
                </p>
              </div>

              <a
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-4 break-all"
              >
                {linkedInUrl}
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
