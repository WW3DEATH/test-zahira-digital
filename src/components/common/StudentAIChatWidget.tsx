import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  MessageSquare,
  Clock,
  BookOpen,
  Calendar,
  CheckCircle2,
  Trash2,
  ChevronDown,
  Bot,
  ExternalLink,
  GraduationCap,
  HelpCircle,
  Calculator,
  Equal,
  RotateCcw,
  Sigma,
} from 'lucide-react';
import * as math from 'mathjs';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Assignment, Submission, SchoolEvent } from '../../types';
import { SEED_ASSIGNMENTS, SEED_SUBMISSIONS, SEED_SCHOOL_EVENTS } from '../../services/dataService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mathCalculation?: {
    expression: string;
    result: string;
  };
}

interface StudentAIChatWidgetProps {
  onNavigate?: (pageId: string) => void;
}

export const StudentAIChatWidget: React.FC<StudentAIChatWidgetProps> = ({ onNavigate }) => {
  const { userProfile, activeRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Math.js Interactive Calculator Drawer state
  const [showMathPanel, setShowMathPanel] = useState(false);
  const [mathExpression, setMathExpression] = useState('2 * sin(pi / 6) + sqrt(144)');
  const [mathResult, setMathResult] = useState<string>('');
  const [mathError, setMathError] = useState<string>('');

  // Real-time school context data
  const [assignments, setAssignments] = useState<Assignment[]>(SEED_ASSIGNMENTS);
  const [submissions, setSubmissions] = useState<Submission[]>(SEED_SUBMISSIONS);
  const [events, setEvents] = useState<SchoolEvent[]>(SEED_SCHOOL_EVENTS);

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Assalamu Alaikum & Welcome! I am **244 AI**, your personal academic assistant for **Zahira College Mawanella (2k28 Science EM)**.\n\nI am equipped with **Math.js** for exact scientific calculations and **Gemini 3.8 Flash** for academic explanations.\n\nYou can ask me:\n• *"What assignments are due this week?"*\n• *"What is our class schedule today or tomorrow?"*\n• *"What digital badges can I earn for streaks, high quiz scores, and attendance?"*\n• *"Evaluate 4.5 * 10^3 * 9.8 * sin(30 deg)"*\n• *"Calculate the derivative of x^3 + 4x^2"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Evaluate initial math expression on mount
  useEffect(() => {
    try {
      const res = math.evaluate('2 * sin(pi / 6) + sqrt(144)');
      setMathResult(String(res));
    } catch {
      // ignore
    }
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, showMathPanel]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !showMathPanel) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, showMathPanel]);

  // Real-time assignments listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'assignments'),
      (snap) => {
        const list: Assignment[] = [];
        snap.forEach((d) => list.push(d.data() as Assignment));
        if (list.length > 0) setAssignments(list);
      },
      () => {}
    );
    return () => unsub();
  }, []);

  // Real-time submissions listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'submissions'),
      (snap) => {
        const list: Submission[] = [];
        snap.forEach((d) => list.push(d.data() as Submission));
        if (list.length > 0) setSubmissions(list);
      },
      () => {}
    );
    return () => unsub();
  }, []);

  // Real-time events listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'events'),
      (snap) => {
        const list: SchoolEvent[] = [];
        snap.forEach((d) => list.push(d.data() as SchoolEvent));
        if (list.length > 0) setEvents(list);
      },
      () => {}
    );
    return () => unsub();
  }, []);

  // Run Math.js evaluation
  const runMathEvaluation = (customExpr?: string) => {
    const expr = (customExpr || mathExpression).trim();
    if (!expr) return;
    try {
      const evaluated = math.evaluate(expr);
      const formatted = math.format(evaluated, { precision: 12 });
      setMathResult(String(formatted));
      setMathError('');
      return String(formatted);
    } catch (e: any) {
      setMathError(e.message || 'Math.js syntax error');
      setMathResult('');
      return null;
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || inputMessage).trim();
    if (!queryText || loading) return;

    // Detect if the user's message contains an explicit math calculation request
    let localMathCalc: { expression: string; result: string } | undefined = undefined;
    const calcMatch = queryText.match(/(?:calc|calculate|evaluate|eval|compute|what is)\s+(.+)/i);
    if (calcMatch && calcMatch[1]) {
      const candidateExpr = calcMatch[1].replace(/[?.,!]+$/, '').trim();
      try {
        const res = math.evaluate(candidateExpr);
        const formatted = math.format(res, { precision: 12 });
        localMathCalc = {
          expression: candidateExpr,
          result: String(formatted),
        };
      } catch {
        // Not a direct math.js parseable string, leave to Gemini
      }
    }

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mathCalculation: localMathCalc,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      // Build dynamic context regarding the student's actual coursework & timetable
      const userSubs = submissions.filter((s) => s.studentId === userProfile?.userId);

      const mappedAssignments = assignments.map((a) => {
        const sub = userSubs.find((s) => s.assignmentId === a.id);
        return {
          title: a.title,
          dueDate: a.dueDate,
          maxMarks: a.maxMarks,
          description: a.description,
          instructions: a.instructions,
          subject: a.subjectId || '2k28 Science EM',
          isSubmitted: !!sub,
          status: sub ? sub.status : 'not_submitted',
          marksObtained: sub?.marksObtained,
          feedback: sub?.feedback,
        };
      });

      const timetable = [
        {
          day: 'Monday',
          periods: [
            { time: '08:00 - 09:30', subject: 'Combined Mathematics (Pure Maths - Calculus)', teacher: 'Mr. M. N. M. Jaasim', room: 'Hall Sci-1' },
            { time: '09:45 - 11:15', subject: 'Physics (Mechanics & Vectors)', teacher: 'Dr. A. H. Farook', room: 'Physics Lab' },
            { time: '11:30 - 13:00', subject: 'Chemistry (Physical Chemistry)', teacher: 'Mrs. S. Rizwan', room: 'Chemistry Lab' },
          ],
        },
        {
          day: 'Tuesday',
          periods: [
            { time: '08:00 - 09:30', subject: 'Chemistry (Inorganic Chemistry & Periodic Table)', teacher: 'Mrs. S. Rizwan', room: 'Room 204' },
            { time: '09:45 - 11:15', subject: 'Combined Mathematics (Applied Maths - Statics)', teacher: 'Mr. M. N. M. Jaasim', room: 'Hall Sci-1' },
            { time: '11:30 - 13:00', subject: 'ICT / General English', teacher: 'Eng. K. Perera', room: 'Computer Lab' },
          ],
        },
        {
          day: 'Wednesday',
          periods: [
            { time: '08:00 - 09:30', subject: 'Physics (Waves, Oscillations & Sound)', teacher: 'Dr. A. H. Farook', room: 'Physics Lab' },
            { time: '09:45 - 11:15', subject: 'Combined Mathematics (Calculus Problem Solving)', teacher: 'Mr. M. N. M. Jaasim', room: 'Hall Sci-1' },
            { time: '11:30 - 13:00', subject: 'Chemistry Laboratory Practical', teacher: 'Mrs. S. Rizwan', room: 'Chemistry Lab' },
          ],
        },
        {
          day: 'Thursday',
          periods: [
            { time: '08:00 - 09:30', subject: 'Physics Experimental Lab Practical', teacher: 'Dr. A. H. Farook', room: 'Physics Lab' },
            { time: '09:45 - 11:15', subject: 'Combined Mathematics (Trigonometry & Complex Numbers)', teacher: 'Mr. M. N. M. Jaasim', room: 'Hall Sci-1' },
            { time: '11:30 - 13:00', subject: 'Biology / General Science', teacher: 'Dr. M. Rifaz', room: 'Bio Hall' },
          ],
        },
        {
          day: 'Friday',
          periods: [
            { time: '08:00 - 09:30', subject: 'Combined Mathematics (Advanced Problem Seminar)', teacher: 'Mr. M. N. M. Jaasim', room: 'Auditorium' },
            { time: '09:45 - 11:00', subject: 'Weekly Model Exam Evaluation & Science Quiz', teacher: 'Faculty Panel', room: 'Auditorium' },
          ],
        },
      ];

      const conversationHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.mathCalculation
          ? `${m.content} [Math.js Verified Calculation: ${m.mathCalculation.expression} = ${m.mathCalculation.result}]`
          : m.content,
      }));

      const response = await fetch('/api/gemini/student-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          studentContext: {
            studentName: userProfile?.fullName || 'Scholar',
            role: activeRole,
            assignments: mappedAssignments,
            timetable,
            events: events.map((e) => ({
              title: e.title,
              date: e.startDate,
              time: e.time,
              type: e.type,
              description: e.description,
            })),
          },
        }),
      });

      const data = await response.json();
      const replyText = data.reply || data.error || 'Sorry, I could not process your query at this moment.';

      const botMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      console.error('Chat error:', e);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Unable to reach the Gemini assistant. Please ensure your network is connected and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        content: 'Chat history cleared. How can 244 AI assist you with your Zahira College assignments, schedule, digital badges, or Math.js calculations?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleInsertMathToChat = () => {
    if (!mathResult) return;
    const promptText = `Verify and explain this calculation step-by-step: ${mathExpression} = ${mathResult}`;
    setShowMathPanel(false);
    handleSendMessage(promptText);
  };

  const suggestionChips = [
    { label: '📋 Assignments Due', query: 'What assignments are currently due and what are their deadlines?' },
    { label: '⏰ Today\'s Schedule', query: 'What is our class schedule and timetable for today?' },
    { label: '📐 Solve: 15 * sin(pi/3)', query: 'calculate 15 * sin(pi/3)' },
    { label: '🔬 Practical Labs', query: 'When are our scheduled Physics and Chemistry laboratory practicals?' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden font-sans">
      {/* 1. EXPANDED CHAT WINDOW */}
      {isOpen && (
        <div className="mb-3 w-[350px] sm:w-[420px] h-[580px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-blue-200/80 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-red-400 shadow-inner">
                  <Bot className="w-5 h-5 text-amber-300" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-blue-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-serif font-bold text-sm tracking-wide text-white">
                    244 AI
                  </h3>
                  <span className="rounded bg-red-600/90 text-white text-[9px] font-bold px-1.5 py-0.2 uppercase tracking-wider">
                    Gemini + Math.js
                  </span>
                </div>
                <p className="text-[11px] text-blue-200">
                  Assignments, Schedule & Scientific Calculator
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Math.js Toggle Button */}
              <button
                onClick={() => setShowMathPanel(!showMathPanel)}
                className={`rounded-lg p-1.5 transition-colors flex items-center gap-1 text-xs font-bold ${
                  showMathPanel
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
                title="Toggle Math.js Scientific Solver"
              >
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline text-[10px]">Math.js</span>
              </button>

              <button
                onClick={handleClearChat}
                className="rounded-lg p-1.5 text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
                title="Minimize Window"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* MATH.JS SCIENTIFIC CALCULATOR DRAWER */}
          {showMathPanel && (
            <div className="bg-slate-900 text-white p-3.5 border-b border-blue-950 shadow-inner animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span>Math.js Scientific Evaluator</span>
                </span>
                <span className="text-[10px] text-slate-400">Exact Algebraic Engine</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={mathExpression}
                  onChange={(e) => setMathExpression(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      runMathEvaluation();
                    }
                  }}
                  placeholder="e.g. 50 * sin(pi / 4) + sqrt(144)"
                  className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => runMathEvaluation()}
                  className="rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 text-xs font-bold transition-all shadow-xs shrink-0"
                >
                  Evaluate
                </button>
              </div>

              {/* Math Result Box */}
              {mathResult && (
                <div className="mt-2.5 rounded-xl bg-slate-800/90 border border-emerald-500/40 p-2.5 flex items-center justify-between text-xs font-mono">
                  <div className="truncate mr-2">
                    <span className="text-slate-400 text-[10px] block font-sans">Math.js Solution:</span>
                    <span className="text-emerald-400 font-bold text-sm">{mathResult}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleInsertMathToChat}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 transition-colors shrink-0 font-sans"
                  >
                    Ask AI to Explain
                  </button>
                </div>
              )}

              {mathError && (
                <div className="mt-2 text-[11px] text-red-400 font-mono">
                  Error: {mathError}
                </div>
              )}

              {/* Math Quick Presets */}
              <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px]">
                <span className="text-slate-400 shrink-0">Presets:</span>
                {[
                  'sin(pi/6)',
                  'sqrt(256)',
                  'derivative("x^3 + 2x", "x")',
                  'simplify("2x + 3x - 4")',
                  '120 km/h to m/s',
                  'log(100, 10)',
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMathExpression(preset);
                      runMathEvaluation(preset);
                    }}
                    className="shrink-0 rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-slate-300 border border-slate-700 font-mono"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Shortcuts Bar */}
          <div className="px-3 py-2 bg-blue-50/70 dark:bg-slate-800/80 border-b border-blue-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-blue-900 dark:text-blue-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Direct Page Links:</span>
            </span>
            <div className="flex items-center gap-2">
              {onNavigate && (
                <>
                  <button
                    onClick={() => {
                      onNavigate('assignments');
                      setIsOpen(false);
                    }}
                    className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 hover:underline font-bold"
                  >
                    Assignments
                  </button>
                  <span className="text-blue-300 dark:text-slate-600">•</span>
                  <button
                    onClick={() => {
                      onNavigate('calendar');
                      setIsOpen(false);
                    }}
                    className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 hover:underline font-bold"
                  >
                    Calendar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/60 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-2xs whitespace-pre-line ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs font-medium'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 rounded-bl-xs'
                  }`}
                >
                  {m.content}

                  {/* Math.js Verified Result Card attached to message */}
                  {m.mathCalculation && (
                    <div className="mt-2 pt-2 border-t border-white/20 dark:border-slate-700 text-[11px] font-mono flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-amber-200">
                        <Calculator className="w-3.5 h-3.5 shrink-0" />
                        <span>Math.js Evaluator:</span>
                      </div>
                      <span className="font-bold bg-white/20 dark:bg-slate-900 px-2 py-0.5 rounded text-white">
                        {m.mathCalculation.expression} = {m.mathCalculation.result}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                  {m.timestamp}
                </span>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2 animate-in fade-in">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-xs px-4 py-3 shadow-2xs flex items-center gap-2 text-slate-500 dark:text-slate-300">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    Consulting Gemini with real-time academic records...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.query)}
                disabled={loading}
                className="shrink-0 rounded-full border border-blue-200 dark:border-slate-700 bg-blue-50/60 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 px-2.5 py-1 text-[10px] font-bold text-blue-900 dark:text-blue-300 transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Box Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setShowMathPanel(!showMathPanel)}
              className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 transition-colors"
              title="Open Math.js Evaluator"
            >
              <Calculator className="w-4 h-4 text-amber-500" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about assignments, schedule, or calc: 25 * sin(pi/4)..."
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* 2. FLOATING TRIGGER BUTTON (BOTTOM RIGHT) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle 244 AI Assistant"
        className={`group relative flex items-center gap-2.5 rounded-full p-3 sm:px-4 sm:py-3 shadow-xl transition-all duration-300 cursor-pointer ${
          isOpen
            ? 'bg-slate-900 text-white hover:bg-slate-800'
            : 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 text-white hover:scale-105 active:scale-95 shadow-blue-500/25 ring-4 ring-white/80'
        }`}
      >
        {isOpen ? (
          <>
            <X className="w-5 h-5 text-white" />
            <span className="hidden sm:inline text-xs font-bold">Close 244 AI</span>
          </>
        ) : (
          <>
            <div className="relative flex items-center justify-center">
              <Bot className="w-5 h-5 text-amber-300" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1">
                Ask 244 AI
                <Sparkles className="w-3 h-3 text-amber-300 inline" />
              </span>
              <span className="text-[10px] text-blue-100 font-medium leading-none">
                Assignments, Schedule & Math.js
              </span>
            </div>
          </>
        )}
      </button>
    </div>
  );
};
