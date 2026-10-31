import React, { useState } from 'react';
import {
  Flame,
  Zap,
  Crown,
  Sparkles,
  Target,
  Award,
  Trophy,
  Brain,
  CalendarCheck,
  ShieldCheck,
  Medal,
  CheckCircle2,
  FileText,
  Star,
  CheckCheck,
  Lock,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';
import { StudentBadge, StudentBadgeSummary, BadgeCategory, BadgeTier } from '../../types';

interface StudentBadgeSectionProps {
  summary: StudentBadgeSummary;
}

export const StudentBadgeSection: React.FC<StudentBadgeSectionProps> = ({ summary }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | BadgeCategory>('all');
  const [activeModalBadge, setActiveModalBadge] = useState<StudentBadge | null>(null);

  const filteredBadges = summary.badges.filter(
    (b) => selectedCategory === 'all' || b.category === selectedCategory
  );

  const getBadgeIcon = (iconName: string, isUnlocked: boolean, tier: BadgeTier) => {
    const className = `w-6 h-6 ${
      isUnlocked
        ? tier === 'gold'
          ? 'text-amber-500 dark:text-amber-400'
          : tier === 'platinum'
          ? 'text-cyan-500 dark:text-cyan-400'
          : tier === 'silver'
          ? 'text-slate-600 dark:text-slate-300'
          : 'text-orange-600 dark:text-orange-400'
        : 'text-slate-400 dark:text-slate-600'
    }`;

    switch (iconName) {
      case 'Flame':
        return <Flame className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Crown':
        return <Crown className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Target':
        return <Target className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Brain':
        return <Brain className={className} />;
      case 'CalendarCheck':
        return <CalendarCheck className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'Medal':
        return <Medal className={className} />;
      case 'CheckCircle2':
        return <CheckCircle2 className={className} />;
      case 'FileText':
        return <FileText className={className} />;
      case 'Star':
        return <Star className={className} />;
      case 'CheckCheck':
        return <CheckCheck className={className} />;
      default:
        return <Award className={className} />;
    }
  };

  const getTierBadgeStyle = (tier: BadgeTier, isUnlocked: boolean) => {
    if (!isUnlocked) {
      return 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 opacity-75';
    }
    switch (tier) {
      case 'gold':
        return 'border-amber-400 dark:border-amber-500/60 bg-gradient-to-br from-amber-500/15 via-yellow-500/5 to-transparent shadow-xs hover:border-amber-500';
      case 'platinum':
        return 'border-cyan-400 dark:border-cyan-500/60 bg-gradient-to-br from-cyan-500/15 via-sky-500/5 to-transparent shadow-xs hover:border-cyan-500';
      case 'silver':
        return 'border-slate-300 dark:border-slate-700 bg-gradient-to-br from-slate-200/30 via-slate-100/10 to-transparent shadow-xs hover:border-slate-400';
      case 'bronze':
      default:
        return 'border-orange-300 dark:border-orange-500/50 bg-gradient-to-br from-orange-400/15 via-amber-600/5 to-transparent shadow-xs hover:border-orange-400';
    }
  };

  const getTierPill = (tier: BadgeTier) => {
    switch (tier) {
      case 'gold':
        return 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'platinum':
        return 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800';
      case 'silver':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      case 'bronze':
      default:
        return 'bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800';
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs">
      {/* 1. Header & Level Summary Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80">
              <Trophy className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Digital Badges & Engagement Honours
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Earn verifiable scholastic honours for study streaks, high quiz scores, and consistent attendance.
              </p>
            </div>
          </div>
        </div>

        {/* Level and Streak Summary Stats */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Streak indicator */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/70 text-orange-700 dark:text-orange-300">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold tracking-wider leading-none">Study Streak</div>
              <div className="text-xs font-bold leading-tight">{summary.currentStreakDays} Days Active 🔥</div>
            </div>
          </div>

          {/* Level indicator */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/70 text-blue-700 dark:text-blue-300">
            <Award className="w-4 h-4 text-blue-500" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold tracking-wider leading-none">Level {summary.level}</div>
              <div className="text-xs font-bold leading-tight">{summary.levelTitle}</div>
            </div>
          </div>

          {/* XP Total */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{summary.totalXp} XP</span>
          </div>

          {/* Progress badge count */}
          <div className="px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
            {summary.unlockedCount} / {summary.totalCount} Unlocked
          </div>
        </div>
      </div>

      {/* 2. Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 mt-5 mb-5">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          All Badges ({summary.totalCount})
        </button>
        <button
          onClick={() => setSelectedCategory('streak')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedCategory === 'streak'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Flame className="w-3 h-3 text-orange-500" />
          Streaks
        </button>
        <button
          onClick={() => setSelectedCategory('quiz')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedCategory === 'quiz'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Target className="w-3 h-3 text-amber-500" />
          Quiz Mastery
        </button>
        <button
          onClick={() => setSelectedCategory('attendance')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedCategory === 'attendance'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarCheck className="w-3 h-3 text-emerald-500" />
          Attendance
        </button>
        <button
          onClick={() => setSelectedCategory('assignment')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedCategory === 'assignment'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3 h-3 text-indigo-500" />
          Assignments
        </button>
      </div>

      {/* 3. Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredBadges.map((badge) => {
          return (
            <div
              key={badge.id}
              onClick={() => setActiveModalBadge(badge)}
              className={`group relative rounded-2xl border p-4.5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${getTierBadgeStyle(
                badge.tier,
                badge.isUnlocked
              )}`}
            >
              <div>
                {/* Top row: Icon + Tier Pill + Lock/Unlock Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="relative">
                    <div
                      className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-inner ${
                        badge.isUnlocked
                          ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                          : 'bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {getBadgeIcon(badge.iconName, badge.isUnlocked, badge.tier)}
                    </div>
                    {badge.isUnlocked && (
                      <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
                        <CheckCheck className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getTierPill(
                        badge.tier
                      )}`}
                    >
                      {badge.tier}
                    </span>

                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3" />
                      +{badge.xpBonus} XP
                    </span>
                  </div>
                </div>

                {/* Badge Details */}
                <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {badge.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Bottom State: Progress bar or Unlocked Tag */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                {badge.isUnlocked ? (
                  <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Unlocked
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                      {badge.unlockedAt || 'Achieved'}
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        In Progress
                      </span>
                      <span>
                        {badge.currentValue} / {badge.targetValue} ({badge.progressPercent}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${badge.progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Interactive Badge Modal */}
      {activeModalBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 text-center">
            {/* Close Button */}
            <button
              onClick={() => setActiveModalBadge(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Emblem Glow */}
            <div className="relative mx-auto w-24 h-24 mb-4 flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-3xl blur-xl opacity-40 ${
                  activeModalBadge.isUnlocked
                    ? activeModalBadge.tier === 'gold'
                      ? 'bg-amber-400'
                      : activeModalBadge.tier === 'platinum'
                      ? 'bg-cyan-400'
                      : activeModalBadge.tier === 'silver'
                      ? 'bg-slate-400'
                      : 'bg-orange-400'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
              <div
                className={`relative w-20 h-20 rounded-3xl border-2 flex items-center justify-center shadow-lg ${
                  activeModalBadge.isUnlocked
                    ? activeModalBadge.tier === 'gold'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400'
                      : activeModalBadge.tier === 'platinum'
                      ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-400'
                      : activeModalBadge.tier === 'silver'
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-300'
                      : 'bg-orange-50 dark:bg-orange-950/60 border-orange-400'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                }`}
              >
                {getBadgeIcon(activeModalBadge.iconName, activeModalBadge.isUnlocked, activeModalBadge.tier)}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${getTierPill(
                  activeModalBadge.tier
                )}`}
              >
                {activeModalBadge.tier} Tier
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                +{activeModalBadge.xpBonus} Scholastic XP
              </span>
            </div>

            <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100">
              {activeModalBadge.title}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {activeModalBadge.description}
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-left text-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold mb-1">
                <span>Unlock Criteria:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{activeModalBadge.requirement}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold">
                <span>Current Progress:</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {activeModalBadge.currentValue} / {activeModalBadge.targetValue} ({activeModalBadge.progressPercent}%)
                </span>
              </div>

              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${activeModalBadge.progressPercent}%` }}
                />
              </div>
            </div>

            {activeModalBadge.isUnlocked ? (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Honour Achieved! {activeModalBadge.unlockedAt ? `• ${activeModalBadge.unlockedAt}` : ''}</span>
              </div>
            ) : (
              <div className="mt-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span>Keep studying daily or complete upcoming quizzes to earn this honour!</span>
              </div>
            )}

            <button
              onClick={() => setActiveModalBadge(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
