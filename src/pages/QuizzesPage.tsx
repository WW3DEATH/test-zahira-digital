import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Sparkles,
  Clock,
  Award,
  Plus,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Quiz, QuizQuestion, QuizAttempt } from '../types';
import { SEED_QUIZZES } from '../services/dataService';

export const QuizzesPage: React.FC = () => {
  const { activeRole, userProfile } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Generator Modal state
  const [showGenerator, setShowGenerator] = useState(false);
  const [genSubject, setGenSubject] = useState('Physics & Classical Mechanics');
  const [genTopic, setGenTopic] = useState('Rotational Dynamics & Angular Momentum');
  const [genDifficulty, setGenDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [genNumQuestions, setGenNumQuestions] = useState(5);
  const [generating, setGenerating] = useState(false);

  // Active Quiz Taking State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(1200); // 20 mins
  const [quizResult, setQuizResult] = useState<{
    score: number;
    maxScore: number;
    percent: number;
    details: { question: QuizQuestion; userAnswer: string; isCorrect: boolean }[];
  } | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'quizzes'),
      (snap) => {
        const list: Quiz[] = [];
        snap.forEach((d) => list.push(d.data() as Quiz));
        if (list.length > 0) {
          setQuizzes(list);
        } else {
          setQuizzes(SEED_QUIZZES);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Real-time quizzes note:', error);
        setQuizzes(SEED_QUIZZES);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Timer countdown when taking quiz
  useEffect(() => {
    if (!activeQuiz || quizResult) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQuiz, quizResult]);

  const handleStartQuiz = (q: Quiz) => {
    setActiveQuiz(q);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeLeftSeconds(q.durationMinutes * 60 || 1200);
    setQuizResult(null);
  };

  const handleSelectAnswer = (qId: string, ans: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: ans }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    let score = 0;
    let maxScore = 0;
    const details = activeQuiz.questions.map((q) => {
      const userAns = (answers[q.id] || '').trim();
      const isCorrect = userAns.toLowerCase() === q.correctAnswer.toLowerCase();
      const marks = q.marks || 5;
      maxScore += marks;
      if (isCorrect) score += marks;

      return {
        question: q,
        userAnswer: userAns,
        isCorrect,
      };
    });

    const percent = Math.round((score / (maxScore || 1)) * 100);

    const result = {
      score,
      maxScore,
      percent,
      details,
    };
    setQuizResult(result);

    // Save attempt in Firestore
    try {
      const attemptId = `attempt-${Date.now()}`;
      const attemptDoc: QuizAttempt = {
        id: attemptId,
        quizId: activeQuiz.id,
        studentId: userProfile?.userId || 'zahira_student',
        studentName: userProfile?.fullName || 'Zahira Student Scholar',
        classId: activeQuiz.classId,
        answers,
        score,
        maxScore,
        status: 'completed',
        completedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'quizAttempts', attemptId), attemptDoc);
    } catch (e) {
      console.error('Failed to save quiz attempt:', e);
    }
  };

  const handleGenerateAIQuiz = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/gemini/quiz-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: genSubject,
          topic: genTopic,
          difficulty: genDifficulty,
          numQuestions: genNumQuestions,
          classLevel: '2k28 Science EM',
          questionTypes: ['multiple_choice', 'true_false'],
        }),
      });

      const data = await response.json();
      const questions: QuizQuestion[] = data.questions || [];

      if (questions.length > 0) {
        const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 5), 0);
        const newQuiz: Quiz = {
          id: `quiz-${Date.now()}`,
          title: `${genSubject}: ${genTopic} Master Assessment`,
          description: `Zahira College 2k28 Science EM assessment for ${genTopic}. Difficulty: ${genDifficulty.toUpperCase()}.`,
          classId: 'class-2k28-science-em',
          subjectId: 'sub-phys',
          teacherId: userProfile?.userId || 'admin_jaasim',
          durationMinutes: 15,
          totalMarks,
          isPublished: true,
          questions,
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'quizzes', newQuiz.id), newQuiz);
        setQuizzes((prev) => [newQuiz, ...prev]);
        setShowGenerator(false);
      }
    } catch (e) {
      console.error('AI Quiz Generation failed:', e);
    } finally {
      setGenerating(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Quiz taking active overlay view */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-stone-200 bg-white p-6 md:p-8 shadow-2xl relative my-8 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-6">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  Academic Assessment Studio
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-900 mt-0.5">
                  {activeQuiz.title}
                </h3>
              </div>

              {!quizResult && (
                <div className="flex items-center gap-2 rounded-xl bg-stone-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{formatTime(timeLeftSeconds)}</span>
                </div>
              )}

              {quizResult && (
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="rounded-lg p-1.5 hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Quiz Result View */}
            {quizResult ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center">
                  <Award className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                  <h4 className="font-serif text-2xl font-bold text-emerald-950">
                    Quiz Completed!
                  </h4>
                  <p className="text-sm font-semibold text-emerald-800 mt-1">
                    Score: {quizResult.score} / {quizResult.maxScore} marks ({quizResult.percent}%)
                  </p>
                  <span className="inline-block mt-3 rounded-full bg-emerald-600 px-4 py-1 text-xs font-bold text-white shadow-xs">
                    {quizResult.percent >= 90
                      ? 'Distinction (A)'
                      : quizResult.percent >= 75
                      ? 'Proficient (B)'
                      : 'Needs Revision'}
                  </span>
                </div>

                {/* Question Review Breakdown */}
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  <h5 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Question Analysis & Explanations
                  </h5>
                  {quizResult.details.map((d, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border text-xs ${
                        d.isCorrect
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-rose-200 bg-rose-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-bold text-stone-900">
                          {idx + 1}. {d.question.questionText}
                        </p>
                        {d.isCorrect ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-bold shrink-0">
                            <CheckCircle2 className="w-4 h-4" /> Correct (+{d.question.marks})
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-700 font-bold shrink-0">
                            <XCircle className="w-4 h-4" /> Incorrect (0/{d.question.marks})
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1 text-stone-700">
                        <p>
                          <span className="font-semibold text-stone-500">Your Answer: </span>
                          <span className={d.isCorrect ? 'text-emerald-800 font-bold' : 'text-rose-800 font-bold line-through'}>
                            {d.userAnswer || 'No answer provided'}
                          </span>
                        </p>
                        {!d.isCorrect && (
                          <p>
                            <span className="font-semibold text-stone-500">Correct Answer: </span>
                            <span className="text-emerald-700 font-bold">{d.question.correctAnswer}</span>
                          </p>
                        )}
                        <p className="text-[11px] text-stone-500 italic mt-1.5 pt-1.5 border-t border-stone-200/50">
                          Explanation: {d.question.explanation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-stone-100">
                  <button
                    onClick={() => setActiveQuiz(null)}
                    className="rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-stone-800 transition-colors shadow-xs"
                  >
                    Close Review & Return
                  </button>
                </div>
              </div>
            ) : (
              /* Active Questions Workflow */
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-400">
                  <span>
                    Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                  </span>
                  <span>{activeQuiz.questions[currentQuestionIndex].marks} marks</span>
                </div>

                {/* Question Text */}
                <div className="rounded-xl bg-stone-50 p-4 border border-stone-200">
                  <p className="text-sm font-bold text-stone-900 leading-relaxed">
                    {activeQuiz.questions[currentQuestionIndex].questionText}
                  </p>
                </div>

                {/* Question Answers */}
                <div className="space-y-2">
                  {activeQuiz.questions[currentQuestionIndex].type === 'short_answer' ? (
                    <div>
                      <input
                        type="text"
                        placeholder="Type your exact answer here..."
                        value={answers[activeQuiz.questions[currentQuestionIndex].id] || ''}
                        onChange={(e) =>
                          handleSelectAnswer(activeQuiz.questions[currentQuestionIndex].id, e.target.value)
                        }
                        className="w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-stone-900 focus:outline-none"
                      />
                    </div>
                  ) : (
                    activeQuiz.questions[currentQuestionIndex].options.map((opt, oIdx) => {
                      const isSelected =
                        answers[activeQuiz.questions[currentQuestionIndex].id] === opt;
                      return (
                        <button
                          key={oIdx}
                          onClick={() =>
                            handleSelectAnswer(activeQuiz.questions[currentQuestionIndex].id, opt)
                          }
                          className={`w-full p-3.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                              : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50'
                          }`}
                        >
                          <span>{opt}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Question Navigation Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((i) => i - 1)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 disabled:opacity-40 hover:bg-stone-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex((i) => i + 1)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitQuiz}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md"
                    >
                      <span>Submit Answers</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Quiz Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Gemini AI Quiz Architect
                </h3>
              </div>
              <button
                onClick={() => setShowGenerator(false)}
                className="rounded-lg p-1.5 hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-600 uppercase tracking-wider block mb-1 text-[11px]">
                  Subject
                </label>
                <input
                  type="text"
                  value={genSubject}
                  onChange={(e) => setGenSubject(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 uppercase tracking-wider block mb-1 text-[11px]">
                  Topic / Conceptual Unit
                </label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Thermodynamics, Projectile Vectors"
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-600 uppercase tracking-wider block mb-1 text-[11px]">
                    Difficulty Level
                  </label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value as any)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                  >
                    <option value="easy">Easy (Foundational)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="hard">Hard (Advanced Honors)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-600 uppercase tracking-wider block mb-1 text-[11px]">
                    Question Count
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={10}
                    value={genNumQuestions}
                    onChange={(e) => setGenNumQuestions(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3 text-stone-700 text-[11px] leading-relaxed">
                Gemini will format objective multiple-choice and true/false questions complete with correct answers, explanations, and marks. Teachers can preview and adjust questions before publishing.
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowGenerator(false)}
                className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAIQuiz}
                disabled={generating || !genTopic}
                className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{generating ? 'Drafting Questions with Gemini...' : 'Generate & Publish Quiz'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
            Interactive Quizzes & Assessments
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Automated assessments, objective scoring, and AI question authoring
          </p>
        </div>

        {(activeRole === 'teacher' || activeRole === 'admin') && (
          <button
            onClick={() => setShowGenerator(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-stone-950 transition-all shadow-md shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Quiz with AI</span>
          </button>
        )}
      </div>

      {/* Quizzes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="rounded bg-sky-100 text-sky-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {quiz.questions.length} Questions
                </span>
                <span className="text-xs text-stone-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {quiz.durationMinutes || 20}m
                </span>
              </div>

              <h3 className="font-serif text-base font-bold text-stone-900 line-clamp-2">
                {quiz.title}
              </h3>
              <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">
                {quiz.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-semibold">Total Score</span>
                <p className="text-xs font-bold text-stone-800">{quiz.totalMarks} Marks</p>
              </div>

              <button
                onClick={() => handleStartQuiz(quiz)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>Take Quiz</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
