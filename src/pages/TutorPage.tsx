import React, { useState, useEffect, useRef } from 'react';
import {
  Lightbulb,
  Send,
  Sparkles,
  BrainCircuit,
  RotateCcw,
  BookOpen,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  Clock,
  History,
} from 'lucide-react';
import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { TutorChatMessage, TutorSession } from '../types';

interface TutorPageProps {
  initialTopic?: string;
}

export const TutorPage: React.FC<TutorPageProps> = ({ initialTopic = '' }) => {
  const { userProfile } = useAuth();
  const [subject, setSubject] = useState('Physics & Classical Mechanics');
  const [topic, setTopic] = useState(initialTopic || 'Newtonian Dynamics & Energy Conservation');
  const [style, setStyle] = useState<'step_by_step' | 'simple' | 'socratic' | 'detailed'>('step_by_step');
  const [enableThinking, setEnableThinking] = useState(true);

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<TutorChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello ${userProfile?.fullName || 'scholar'}! I'm your Socrates AI Tutor.
I'm here to help you truly master **${subject}**, explore difficult problems, or prepare for upcoming assessments.

What concept or problem would you like to explore today?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [savedSessions, setSavedSessions] = useState<TutorSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(`session-${Date.now()}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load prior tutor sessions for this student
  useEffect(() => {
    async function loadSessions() {
      try {
        const studentId = userProfile?.userId || 'student_marcus';
        const q = query(collection(db, 'tutorSessions'), where('studentId', '==', studentId));
        const snap = await getDocs(q);
        const list: TutorSession[] = [];
        snap.forEach((d) => list.push(d.data() as TutorSession));
        setSavedSessions(list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      } catch (e) {
        console.error('Error loading tutor sessions:', e);
      }
    }
    loadSessions();
  }, [userProfile]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || loading) return;

    const userMsg: TutorChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          style,
          enableThinking,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      const assistantMsg: TutorChatMessage = {
        role: 'assistant',
        content: data.reply || 'I ran into a momentary issue formulating that response. Please try again.',
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);

      // Persist session to Firestore
      const sessionDoc: TutorSession = {
        id: currentSessionId,
        studentId: userProfile?.userId || 'student_marcus',
        subject,
        topic,
        style,
        messages: finalMessages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'tutorSessions', currentSessionId), sessionDoc, { merge: true });
    } catch (error) {
      console.error('Tutor Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered a communication error with the Gemini tutoring service. Please check your network or try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewSession = () => {
    const newId = `session-${Date.now()}`;
    setCurrentSessionId(newId);
    setMessages([
      {
        role: 'assistant',
        content: `Ready for a new session on **${subject}**! What would you like to investigate?`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleResumeSession = (session: TutorSession) => {
    setCurrentSessionId(session.id);
    setSubject(session.subject);
    setTopic(session.topic);
    setStyle((session.style as any) || 'step_by_step');
    setMessages(session.messages || []);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-400/30">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Socrates AI Personalized Study Tutor</span>
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-white mt-2">
            Interactive Academic Tutoring Studio
          </h2>
          <p className="text-stone-300 text-xs mt-1">
            Powered by Google Gemini 3.8 Flash with High Reasoning mode. Guides you through concepts with step-by-step logic.
          </p>
        </div>

        <button
          onClick={handleStartNewSession}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-stone-950 transition-all shadow-md shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Study Session</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Settings Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Controls Box */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="font-serif text-sm font-bold text-stone-900">
              Tutor Configuration
            </h3>

            <div>
              <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                Academic Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-xs text-stone-800 focus:bg-white focus:outline-none"
              >
                <option value="Combined Mathematics">Combined Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Information & Communication Technology">Information & Communication Technology</option>
                <option value="General English">General English</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                Current Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Kinematics, Derivatives"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-xs text-stone-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                Explanation Style
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'step_by_step', label: 'Step-by-Step' },
                  { id: 'simple', label: 'Simple' },
                  { id: 'socratic', label: 'Socratic' },
                  { id: 'detailed', label: 'Detailed' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id as any)}
                    className={`rounded-lg py-1.5 px-2 text-[11px] font-semibold border transition-all ${
                      style === s.id
                        ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* High Reasoning Toggle */}
            <div className="pt-2 border-t border-stone-100">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5 text-amber-600" />
                    High Thinking
                  </span>
                  <span className="text-[10px] text-stone-500 block">
                    Deep multi-step reasoning
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={enableThinking}
                  onChange={(e) => setEnableThinking(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Suggested Inquiries
            </h4>
            <div className="space-y-1.5">
              {[
                'Derive the kinetic energy equation step-by-step',
                'What is the difference between speed and velocity in vectors?',
                'Give me a real-world calculus optimization problem to solve together',
                'Quiz me on Newton’s 3 laws with instant feedback',
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="w-full text-left p-2 rounded-lg bg-stone-50 hover:bg-amber-50 hover:border-amber-300 border border-stone-100 text-[11px] text-stone-700 transition-colors line-clamp-2"
                >
                  &quot;{p}&quot;
                </button>
              ))}
            </div>
          </div>

          {/* Previous Sessions */}
          {savedSessions.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-stone-400" />
                Previous Sessions
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {savedSessions.slice(0, 5).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleResumeSession(s)}
                    className="w-full text-left p-2 rounded-lg hover:bg-stone-100 text-[11px] text-stone-600 transition-colors truncate"
                  >
                    <p className="font-semibold text-stone-800 truncate">{s.topic || s.subject}</p>
                    <p className="text-[10px] text-stone-400">{new Date(s.updatedAt).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat Conversation Box */}
        <div className="lg:col-span-3 rounded-2xl border border-stone-200 bg-white shadow-xs flex flex-col h-[650px] overflow-hidden">
          {/* Chat Header Bar */}
          <div className="flex items-center justify-between border-b border-stone-100 px-6 py-3 bg-stone-50/70">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-stone-800">
                Socrates AI Tutor • {subject}
              </span>
            </div>
            {enableThinking && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                <BrainCircuit className="w-3 h-3" />
                Thinking Mode Active
              </span>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-stone-900 text-white rounded-br-none'
                        : 'bg-[#fbfaf8] border border-stone-200 text-stone-800 rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className={`font-bold text-[10px] uppercase tracking-wider ${isUser ? 'text-amber-400' : 'text-stone-500'}`}>
                        {isUser ? userProfile?.fullName || 'You' : 'Socrates AI Tutor'}
                      </span>
                      <span className="text-[10px] opacity-60">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="whitespace-pre-wrap leading-relaxed font-sans prose-sm">
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="rounded-2xl rounded-bl-none border border-amber-200 bg-amber-50/50 p-4 text-xs text-stone-700 shadow-xs flex items-center gap-3">
                  <BrainCircuit className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Socrates AI is reasoning through the concept...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="border-t border-stone-200 p-4 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Socrates a question, paste homework problem, or ask for an explanation..."
                className="flex-1 rounded-xl border border-stone-200 bg-stone-50 py-2.5 px-4 text-xs text-stone-800 placeholder-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none transition-all shadow-xs"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="inline-flex items-center justify-center rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white p-2.5 transition-colors shadow-xs"
              >
                <Send className="w-4 h-4 text-amber-400" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
