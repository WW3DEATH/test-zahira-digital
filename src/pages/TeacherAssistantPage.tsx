import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  FileText,
  FileCheck2,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  BrainCircuit,
  Sliders,
  Eye,
  Edit3,
} from 'lucide-react';
import { AIMarkdownMath } from '../components/common/AIMarkdownMath';

export const TeacherAssistantPage: React.FC = () => {
  const [taskType, setTaskType] = useState<string>('lesson_plan');
  const [subject, setSubject] = useState('Combined Mathematics');
  const [gradeLevel, setGradeLevel] = useState('Zahira College 2k28 Science EM');
  const [topic, setTopic] = useState('Differential Calculus: First Principles & Composite Limits');
  const [additionalNotes, setAdditionalNotes] = useState('Include 1 worked past-paper problem and an exit ticket question.');

  const [generatedOutput, setGeneratedOutput] = useState('');
  const [outputViewMode, setOutputViewMode] = useState<'formatted' | 'edit'>('formatted');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setCopied(false);

    try {
      const response = await fetch('/api/gemini/teacher-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType,
          subject,
          gradeLevel,
          topic,
          additionalNotes,
        }),
      });

      const data = await response.json();
      setGeneratedOutput(data.content || 'Unable to generate curriculum content.');
    } catch (e) {
      console.error('Teacher Assistant Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="rounded-2xl border border-stone-200 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Faculty Curriculum & Pedagogy Assistant</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-white mt-2">
            Gemini AI Teaching Assistant
          </h2>
          <p className="text-stone-300 text-xs mt-1 max-w-xl">
            Draft standards-aligned 45-minute lesson plans, student study guides, analytical question banks, and multi-tier rubrics in seconds.
          </p>
        </div>
      </div>

      {/* Main Grid: Form Left, Output Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Controls */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>Curriculum Generator Controls</span>
          </h3>

          <div>
            <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
              Select Task Output
            </label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-xs text-stone-800 font-semibold focus:bg-white focus:outline-none"
            >
              <option value="lesson_plan">45-Minute Lesson Plan</option>
              <option value="revision_notes">High-Yield Revision Notes</option>
              <option value="question_bank">10-Question Assessment Bank</option>
              <option value="rubric_creator">4-Tier Grading Rubric</option>
              <option value="announcement_draft">Draft Class Bulletin</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-xs text-stone-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
              Cohort Level
            </label>
            <input
              type="text"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-xs text-stone-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
              Topic / Unit
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Thermodynamics, Macbeth Act 3"
              className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-xs text-stone-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
              Pedagogical Preferences / Notes
            </label>
            <textarea
              rows={3}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Specify requirements, Bloom's Taxonomy targets, or timing..."
              className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-xs text-stone-800 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !topic}
            className="w-full rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{loading ? 'Synthesizing Curriculum...' : 'Generate with Gemini'}</span>
          </button>
        </div>

        {/* Output Area */}
        <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white shadow-xs flex flex-col min-h-[420px] h-[65dvh] lg:h-[650px] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-4 sm:px-6 py-3 bg-stone-50/70">
            <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Generated Material Output
            </span>

            {generatedOutput && (
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setOutputViewMode('formatted')}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${
                      outputViewMode === 'formatted'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Formatted</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutputViewMode('edit')}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${
                      outputViewMode === 'edit'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
                  <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <BrainCircuit className="w-10 h-10 text-amber-500 animate-spin mb-3" />
                <p className="text-sm font-bold text-stone-800">Drafting Academic Materials...</p>
                <p className="text-xs text-stone-500 mt-1">Applying curriculum pacing and academic rubrics.</p>
              </div>
            ) : generatedOutput ? (
              outputViewMode === 'formatted' ? (
                <div className="rounded-xl bg-[#1c1d20] text-[#e5e7eb] p-4 sm:p-6 shadow-inner">
                  <AIMarkdownMath content={generatedOutput} />
                </div>
              ) : (
                <textarea
                  value={generatedOutput}
                  onChange={(e) => setGeneratedOutput(e.target.value)}
                  className="w-full h-full p-4 font-mono text-xs text-stone-800 bg-stone-50/40 rounded-xl border border-stone-200 focus:outline-none focus:bg-white resize-none leading-relaxed"
                />
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-stone-400">
                <Sparkles className="w-12 h-12 text-stone-300 mb-2" />
                <p className="text-sm font-semibold text-stone-700">No Teaching Material Generated Yet</p>
                <p className="text-xs text-stone-500 max-w-sm mt-1">
                  Configure your subject, topic, and task type, then click &quot;Generate with Gemini&quot; to build classroom-ready content.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
