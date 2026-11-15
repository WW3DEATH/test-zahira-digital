import React, { useState, useEffect, useMemo } from 'react';
import {
  Swords,
  Trophy,
  Sparkles,
  Clock,
  Users,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Award,
  Flame,
  Target,
  Zap,
  ArrowRight,
  RotateCcw,
  Crown,
  Medal,
  Hash,
  UserCheck,
  Lock,
  Radio,
  Flag,
  KeyRound,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, sanitizeFirestoreDoc } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  OFFICIAL_STUDENT_SUBJECTS,
  PvPMatch,
  PvPMode,
  PvPPlayerState,
  QuizAttempt,
  QuizQuestion,
  QuizScoreEvent,
  UserProfile,
} from '../types';
import { AIMarkdownMath } from '../components/common/AIMarkdownMath';
import { sendDirectNotification } from '../services/notificationService';

interface PvPQuizArenaPageProps {
  initialTab?: 'arena' | 'leaderboard';
  onOpenAuthModal?: () => void;
}

type LeaderboardMetric = 'most_points' | 'most_quizzes';
type LeaderboardPeriod = 'week' | 'month' | 'year';

interface AggregatedRankRow {
  userId: string;
  userName: string;
  userRole: string;
  indexNumber?: string;
  totalPoints: number;
  quizzesDone: number;
  pvpWins: number;
  pvpMatches: number;
  totalCorrect: number;
  totalQuestions: number;
  accuracyPercent: number;
}

const QUESTION_TIME_LIMIT = 25; // seconds per question

function getWeekStart(ref: Date): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon
  const diffToMon = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMon);
  return d;
}

function getMonthStart(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
}

function getYearStart(ref: Date): Date {
  return new Date(ref.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export const PvPQuizArenaPage: React.FC<PvPQuizArenaPageProps> = ({
  initialTab = 'arena',
  onOpenAuthModal,
}) => {
  const { userProfile, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'arena' | 'leaderboard'>(initialTab);

  // Sync tab when parent switches Sidebar item between pvp_quiz and leaderboard
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Firestore collections
  const [matches, setMatches] = useState<PvPMatch[]>([]);
  const [scoreEvents, setScoreEvents] = useState<QuizScoreEvent[]>([]);
  const [legacyAttempts, setLegacyAttempts] = useState<QuizAttempt[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<UserProfile[]>([]);

  // Active Match ID
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  // Create Match Form State
  const [matchMode, setMatchMode] = useState<PvPMode>('pvp');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(() =>
    userProfile?.enrolledSubjects && userProfile.enrolledSubjects.length > 0
      ? userProfile.enrolledSubjects
      : ['C.Maths', 'Physics', 'Chemistry']
  );
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState<number>(50);
  const [invitedUserId, setInvitedUserId] = useState<string>('');
  const [creatingMatch, setCreatingMatch] = useState(false);

  // Sync student's registered subjects automatically when user profile loads
  useEffect(() => {
    if (userProfile?.enrolledSubjects && userProfile.enrolledSubjects.length > 0) {
      setSelectedSubjects(userProfile.enrolledSubjects);
    }
  }, [userProfile?.userId, userProfile?.enrolledSubjects?.join(',')]);

  const toggleMatchSubject = (subj: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subj)
        ? prev.length > 1
          ? prev.filter((s) => s !== subj)
          : prev
        : [...prev, subj]
    );
  };

  // Join by Room Code State
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [arenaMessage, setArenaMessage] = useState<string | null>(null);

  // Live Gameplay Question State
  const [questionTimer, setQuestionTimer] = useState<number>(QUESTION_TIME_LIMIT);
  const [revealedAnswer, setRevealedAnswer] = useState<{
    selected: string;
    isCorrect: boolean;
    pointsAwarded: number;
  } | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [confirmEarlyFinish, setConfirmEarlyFinish] = useState<boolean>(false);

  // Leaderboard Controls
  const [lbMetric, setLbMetric] = useState<LeaderboardMetric>('most_points');
  const [lbPeriod, setLbPeriod] = useState<LeaderboardPeriod>('week');

  // Custom Gemini API Key Configuration (synced with TutorPage via localStorage)
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('znc_custom_gemini_api_key') || '';
    } catch {
      return '';
    }
  });
  const [apiKeyDraft, setApiKeyDraft] = useState<string>(() => {
    try {
      return localStorage.getItem('znc_custom_gemini_api_key') || '';
    } catch {
      return '';
    }
  });
  const [showApiKeyPanel, setShowApiKeyPanel] = useState(false);
  const [showApiKeyText, setShowApiKeyText] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<string | null>(null);

  const handleSaveApiKey = () => {
    const trimmed = apiKeyDraft.trim();
    setCustomApiKey(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem('znc_custom_gemini_api_key', trimmed);
        setApiKeyStatus('Gemini API key saved! New PvP & Solo rounds will generate live AI questions.');
      } else {
        localStorage.removeItem('znc_custom_gemini_api_key');
        setApiKeyStatus('Custom API key cleared; using server configuration if available.');
      }
    } catch {}
    setTimeout(() => setApiKeyStatus(null), 4000);
  };

  const handleClearApiKey = () => {
    setApiKeyDraft('');
    setCustomApiKey('');
    try {
      localStorage.removeItem('znc_custom_gemini_api_key');
    } catch {}
    setApiKeyStatus('Custom Gemini API key removed.');
    setTimeout(() => setApiKeyStatus(null), 3500);
  };

  const [confirmDeleteRoomId, setConfirmDeleteRoomId] = useState<string | null>(null);

  // Real-time listeners
  useEffect(() => {
    const unsubMatches = onSnapshot(collection(db, 'pvpMatches'), (snap) => {
      const list: PvPMatch[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as PvPMatch), id: d.id }));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMatches(list);
    });

    const unsubScores = onSnapshot(collection(db, 'quizScoreEvents'), (snap) => {
      const list: QuizScoreEvent[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as QuizScoreEvent), id: d.id }));
      setScoreEvents(list);
    });

    const unsubAttempts = onSnapshot(collection(db, 'quizAttempts'), (snap) => {
      const list: QuizAttempt[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as QuizAttempt), id: d.id }));
      setLegacyAttempts(list);
    });

    const unsubUsers = onSnapshot(collection(db, 'userProfiles'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as UserProfile), userId: d.id }));
      list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
      setDirectoryUsers(list);
    });

    return () => {
      unsubMatches();
      unsubScores();
      unsubAttempts();
      unsubUsers();
    };
  }, []);

  const currentMatch = useMemo(
    () => (activeMatchId ? matches.find((m) => m.id === activeMatchId) || null : null),
    [matches, activeMatchId]
  );

  const myUserId = userProfile?.userId || '';
  const myState = currentMatch && myUserId ? currentMatch.playerStates?.[myUserId] : undefined;

  const opponentState = useMemo(() => {
    if (!currentMatch || currentMatch.mode !== 'pvp' || !myUserId) return null;
    const oppId = currentMatch.hostId === myUserId ? currentMatch.guestId : currentMatch.hostId;
    if (!oppId) return null;
    return currentMatch.playerStates?.[oppId] || null;
  }, [currentMatch, myUserId]);

  const currentQuestion: QuizQuestion | null = useMemo(() => {
    if (!currentMatch || !myState || myState.finished) return null;
    return currentMatch.questions?.[myState.currentIndex] || null;
  }, [currentMatch, myState]);

  // Auto-reset local reveal state & timer when question index advances
  useEffect(() => {
    if (currentMatch?.status === 'active' && myState && !myState.finished) {
      setRevealedAnswer(null);
      setQuestionTimer(QUESTION_TIME_LIMIT);
      setConfirmEarlyFinish(false);
    }
  }, [currentMatch?.id, currentMatch?.status, myState?.currentIndex, myState?.finished]);

  // Countdown tick during active question before answering
  useEffect(() => {
    if (!currentMatch || currentMatch.status !== 'active' || !myState || myState.finished || revealedAnswer) {
      return;
    }
    const timer = setInterval(() => {
      setQuestionTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentMatch?.id, currentMatch?.status, myState?.currentIndex, myState?.finished, revealedAnswer]);

  // Trigger timeout submission cleanly when countdown reaches 0
  useEffect(() => {
    if (
      questionTimer === 0 &&
      currentMatch?.status === 'active' &&
      myState &&
      !myState.finished &&
      !revealedAnswer &&
      !submittingAnswer
    ) {
      handleSelectAnswer('');
    }
  }, [questionTimer, currentMatch?.status, myState?.finished, revealedAnswer, submittingAnswer]);

  // Smooth real-time auto-advance 1.8s after revealing answer (when enabled)
  useEffect(() => {
    if (!autoAdvance || !revealedAnswer || !currentMatch || currentMatch.status !== 'active' || myState?.finished) {
      return;
    }
    const advTimer = setTimeout(() => {
      handleAdvanceQuestion();
    }, 1800);
    return () => clearTimeout(advTimer);
  }, [autoAdvance, revealedAnswer, currentMatch?.id, myState?.currentIndex, myState?.finished]);

  // Automatically resolve PvP winner & update deterministic leaderboard log for BOTH players once both finish
  useEffect(() => {
    if (!currentMatch || !myUserId) return;
    if (currentMatch.mode === 'pvp' && currentMatch.status === 'active') {
      const hostState = currentMatch.playerStates?.[currentMatch.hostId];
      const guestState = currentMatch.guestId ? currentMatch.playerStates?.[currentMatch.guestId] : undefined;
      if (hostState?.finished && guestState?.finished) {
        let winnerId: string | null = null;
        let winnerName: string | null = null;

        if (hostState.score > guestState.score) {
          winnerId = hostState.userId;
          winnerName = hostState.userName;
        } else if (guestState.score > hostState.score) {
          winnerId = guestState.userId;
          winnerName = guestState.userName;
        } else if (hostState.correctCount > guestState.correctCount) {
          winnerId = hostState.userId;
          winnerName = hostState.userName;
        } else if (guestState.correctCount > hostState.correctCount) {
          winnerId = guestState.userId;
          winnerName = guestState.userName;
        }

        const completedAt = new Date().toISOString();
        updateDoc(doc(db, 'pvpMatches', currentMatch.id), {
          status: 'completed',
          winnerId,
          winnerName,
          completedAt,
        }).catch((err) => console.warn('Match finalize note:', err));

        // Write deterministic score events for BOTH host and guest so victory bonuses always sync
        [hostState, guestState].forEach((pState) => {
          const isWin = winnerId === pState.userId;
          const victoryBonus = isWin ? 100 : 0;
          const eventId = `score-${currentMatch.id}-${pState.userId}`;
          const scoreDoc: QuizScoreEvent = {
            id: eventId,
            userId: pState.userId,
            userName: pState.userName,
            userRole: pState.userRole,
            indexNumber: pState.indexNumber,
            mode: 'pvp',
            matchId: currentMatch.id,
            subject: currentMatch.subject,
            pointsEarned: pState.score + victoryBonus,
            correctCount: pState.correctCount,
            totalQuestions: currentMatch.questions.length,
            isWin,
            completedAt: pState.finishedAt || completedAt,
          };
          setDoc(doc(db, 'quizScoreEvents', eventId), sanitizeFirestoreDoc(scoreDoc), { merge: true }).catch(
            (err) => console.warn('Leaderboard log sync note:', err)
          );
        });
      }
    }
  }, [currentMatch, myUserId]);

  // Sync own deterministic leaderboard score event when match finishes / updates winnerId
  useEffect(() => {
    if (!currentMatch || !myUserId || !myState?.finished) return;
    const isWin = currentMatch.mode === 'pvp' ? currentMatch.winnerId === myUserId : false;
    const victoryBonus = isWin ? 100 : 0;
    const eventId = `score-${currentMatch.id}-${myUserId}`;

    const scoreDoc: QuizScoreEvent = {
      id: eventId,
      userId: myUserId,
      userName: myState.userName,
      userRole: myState.userRole,
      indexNumber: myState.indexNumber,
      mode: currentMatch.mode,
      matchId: currentMatch.id,
      subject: currentMatch.subject,
      pointsEarned: myState.score + victoryBonus,
      correctCount: myState.correctCount,
      totalQuestions: currentMatch.questions.length,
      isWin,
      completedAt: myState.finishedAt || currentMatch.completedAt || new Date().toISOString(),
    };

    setDoc(doc(db, 'quizScoreEvents', eventId), sanitizeFirestoreDoc(scoreDoc), { merge: true }).catch(
      (err) => console.warn('Leaderboard log sync note:', err)
    );
  }, [currentMatch?.id, currentMatch?.winnerId, currentMatch?.status, myUserId, myState?.finished, myState?.score]);

  const showToast = (msg: string) => {
    setArenaMessage(msg);
    setTimeout(() => setArenaMessage(null), 4500);
  };

  // Create New Match with Fresh Gemini AI Questions
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      onOpenAuthModal?.();
      return;
    }

    const activeSubjects = selectedSubjects.length > 0 ? selectedSubjects : ['C.Maths', 'Physics', 'Chemistry'];
    const subjectLabel = activeSubjects.join(', ');

    setCreatingMatch(true);
    try {
      let activeCustomKey = customApiKey.trim();
      if (!activeCustomKey) {
        try {
          activeCustomKey = (localStorage.getItem('znc_custom_gemini_api_key') || '').trim();
        } catch {}
      }

      const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const res = await fetch('/api/gemini/pvp-quiz-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeCustomKey ? { 'x-gemini-api-key': activeCustomKey } : {}),
        },
        body: JSON.stringify({
          subject: subjectLabel,
          subjects: activeSubjects,
          topic: topic.trim() || undefined,
          difficulty,
          numQuestions: questionCount,
          nonce,
          apiKey: activeCustomKey || undefined,
        }),
      });

      if (!res.ok) {
        showToast(`Question generator returned status ${res.status}. Please retry.`);
        setCreatingMatch(false);
        return;
      }

      const data = await res.json();
      const questions: QuizQuestion[] = data.questions || [];
      if (questions.length === 0) {
        showToast('Could not generate questions right now. Please try again.');
        setCreatingMatch(false);
        return;
      }

      if (data.aiError && activeCustomKey) {
        showToast(`Gemini API key notice (${data.aiError}). Loaded ${questions.length} backup STEM/ICT questions.`);
      } else if (data.source === 'gemini_ai') {
        showToast(`Live Gemini AI generated ${questions.length} fresh ${subjectLabel} questions!`);
      }

      const matchId = `pvp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const roomCode = `ZNC-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toISOString();

      const invitedUser = invitedUserId
        ? directoryUsers.find((u) => u.userId === invitedUserId)
        : undefined;

      const hostState: PvPPlayerState = {
        userId: userProfile.userId,
        userName: userProfile.fullName,
        userRole: activeRole,
        indexNumber: userProfile.indexNumber,
        score: 0,
        correctCount: 0,
        streak: 0,
        currentIndex: 0,
        finished: false,
        joinedAt: now,
        lastActiveAt: now,
        lastAnswerCorrect: null,
        answers: {},
      };

      const newMatch: PvPMatch = {
        id: matchId,
        roomCode,
        mode: matchMode,
        subject: subjectLabel,
        subjects: activeSubjects,
        topic: topic.trim() || `${subjectLabel} Challenge`,
        difficulty,
        questionCount: questions.length,
        status: matchMode === 'solo_ranked' ? 'active' : 'waiting',
        hostId: userProfile.userId,
        hostName: userProfile.fullName,
        hostRole: activeRole,
        hostIndexNumber: userProfile.indexNumber,
        invitedUserId: invitedUser?.userId,
        invitedUserName: invitedUser?.fullName,
        questions,
        questionSource: data.source || 'gemini_ai',
        playerStates: {
          [userProfile.userId]: hostState,
        },
        createdAt: now,
        startedAt: matchMode === 'solo_ranked' ? now : undefined,
      };

      await setDoc(doc(db, 'pvpMatches', matchId), sanitizeFirestoreDoc(newMatch));

      if (matchMode === 'pvp' && invitedUser) {
        await sendDirectNotification({
          recipientId: invitedUser.userId,
          title: 'PvP Quiz Challenge Invite',
          message: `${userProfile.fullName} challenged you to a ${questions.length}-question match in ${subjectLabel} (Room ${roomCode}).`,
          type: 'quiz',
          link: 'pvp_quiz',
        }).catch(() => {});
      }

      setActiveMatchId(matchId);
      setTopic('');
      setInvitedUserId('');
    } catch (err) {
      console.error('Failed to create PvP match:', err);
      showToast('Failed to start competition room. Please retry.');
    } finally {
      setCreatingMatch(false);
    }
  };

  // Join an existing PvP Waiting Room
  const handleJoinMatch = async (match: PvPMatch) => {
    if (!userProfile) {
      onOpenAuthModal?.();
      return;
    }

    // Re-enter own active/completed match seamlessly
    if (match.hostId === userProfile.userId || match.guestId === userProfile.userId) {
      setActiveMatchId(match.id);
      return;
    }

    if (match.status !== 'waiting' || match.guestId) {
      showToast('This match is already underway or completed.');
      return;
    }

    const now = new Date().toISOString();
    const guestState: PvPPlayerState = {
      userId: userProfile.userId,
      userName: userProfile.fullName,
      userRole: activeRole,
      indexNumber: userProfile.indexNumber,
      score: 0,
      correctCount: 0,
      streak: 0,
      currentIndex: 0,
      finished: false,
      joinedAt: now,
      lastActiveAt: now,
      lastAnswerCorrect: null,
      answers: {},
    };

    try {
      await updateDoc(doc(db, 'pvpMatches', match.id), {
        guestId: userProfile.userId,
        guestName: userProfile.fullName,
        guestRole: activeRole,
        guestIndexNumber: userProfile.indexNumber,
        status: 'active',
        startedAt: now,
        [`playerStates.${userProfile.userId}`]: sanitizeFirestoreDoc(guestState),
      });
      setActiveMatchId(match.id);
    } catch (err) {
      console.error('Failed to join match:', err);
      showToast('Could not join this PvP room.');
    }
  };

  const handleJoinByRoomCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomCodeInput.trim().toUpperCase();
    if (!clean) return;
    const found = matches.find(
      (m) => m.roomCode.toUpperCase() === clean && (m.status === 'waiting' || m.hostId === myUserId || m.guestId === myUserId)
    );
    if (!found) {
      showToast(`No active PvP room found with code "${clean}".`);
      return;
    }
    setRoomCodeInput('');
    await handleJoinMatch(found);
  };

  const handleCancelWaitingRoom = async () => {
    if (!currentMatch || (currentMatch.hostId !== myUserId && activeRole !== 'admin') || currentMatch.status !== 'waiting') return;
    try {
      await deleteDoc(doc(db, 'pvpMatches', currentMatch.id));
      setMatches((prev) => prev.filter((m) => m.id !== currentMatch.id));
      setActiveMatchId(null);
      showToast('Cancelled open PvP challenge.');
    } catch (err) {
      console.error('Failed to cancel room:', err);
      showToast('Could not cancel room. Please try again.');
    }
  };

  const handleDeleteLobbyMatch = async (matchId: string) => {
    try {
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
      setConfirmDeleteRoomId(null);
      await deleteDoc(doc(db, 'pvpMatches', matchId));
      showToast('Match removed from PvP lobby and database.');
    } catch (err) {
      console.error('Failed to delete match:', err);
      showToast('Could not delete room. Please try again.');
    }
  };

  // Submit Answer for Current Question
  const handleSelectAnswer = async (choice: string) => {
    if (!currentMatch || !myState || !currentQuestion || revealedAnswer || submittingAnswer || !myUserId) return;
    setSubmittingAnswer(true);

    const isCorrect =
      choice.trim() !== '' &&
      choice.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();

    const basePoints =
      currentQuestion.marks ? currentQuestion.marks * 10 : currentMatch.difficulty === 'hard' ? 150 : currentMatch.difficulty === 'medium' ? 120 : 100;
    const speedBonus = isCorrect ? Math.round((questionTimer / QUESTION_TIME_LIMIT) * 50) : 0;
    const nextStreak = isCorrect ? myState.streak + 1 : 0;
    const streakBonus = isCorrect && nextStreak > 1 ? Math.min((nextStreak - 1) * 25, 100) : 0;
    const pointsAwarded = isCorrect ? basePoints + speedBonus + streakBonus : 0;
    const newScore = myState.score + pointsAwarded;
    const newCorrectCount = myState.correctCount + (isCorrect ? 1 : 0);

    setRevealedAnswer({
      selected: choice || 'Time Expired',
      isCorrect,
      pointsAwarded,
    });

    try {
      const timeSpentSec = Math.max(0, QUESTION_TIME_LIMIT - questionTimer);
      const safeQuestionKey = String(currentQuestion.id || `q_${myState.currentIndex}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      await updateDoc(doc(db, 'pvpMatches', currentMatch.id), {
        [`playerStates.${myUserId}.score`]: newScore,
        [`playerStates.${myUserId}.correctCount`]: newCorrectCount,
        [`playerStates.${myUserId}.streak`]: nextStreak,
        [`playerStates.${myUserId}.lastAnswerCorrect`]: isCorrect,
        [`playerStates.${myUserId}.lastActiveAt`]: new Date().toISOString(),
        [`playerStates.${myUserId}.answers.${safeQuestionKey}`]: {
          selected: choice || 'Time Expired',
          isCorrect,
          pointsAwarded,
          timeSpentSec,
        },
      });
    } catch (err) {
      console.error('Failed to record answer:', err);
      showToast('Sync error recording answer. Check connection and retry.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Advance to Next Question or Finish Match
  const handleAdvanceQuestion = async () => {
    if (!currentMatch || !myState || !myUserId) return;
    const nextIdx = myState.currentIndex + 1;
    const isLast = nextIdx >= currentMatch.questions.length;
    const now = new Date().toISOString();

    try {
      if (isLast) {
        const updatePayload: Record<string, any> = {
          [`playerStates.${myUserId}.finished`]: true,
          [`playerStates.${myUserId}.finishedAt`]: now,
          [`playerStates.${myUserId}.lastActiveAt`]: now,
        };
        if (currentMatch.mode === 'solo_ranked') {
          updatePayload.status = 'completed';
          updatePayload.winnerId = myUserId;
          updatePayload.winnerName = myState.userName;
          updatePayload.completedAt = now;
        }
        await updateDoc(doc(db, 'pvpMatches', currentMatch.id), updatePayload);
      } else {
        await updateDoc(doc(db, 'pvpMatches', currentMatch.id), {
          [`playerStates.${myUserId}.currentIndex`]: nextIdx,
          [`playerStates.${myUserId}.lastActiveAt`]: now,
        });
      }
    } catch (err) {
      console.error('Failed to advance question:', err);
    }
  };

  // Early finish & bank already-earned points cleanly
  const handleFinishEarly = async () => {
    if (!currentMatch || !myState || !myUserId) return;
    const now = new Date().toISOString();
    try {
      const updatePayload: Record<string, any> = {
        [`playerStates.${myUserId}.finished`]: true,
        [`playerStates.${myUserId}.finishedAt`]: now,
        [`playerStates.${myUserId}.lastActiveAt`]: now,
      };
      if (currentMatch.mode === 'solo_ranked') {
        updatePayload.status = 'completed';
        updatePayload.winnerId = myUserId;
        updatePayload.winnerName = myState.userName;
        updatePayload.completedAt = now;
      }
      await updateDoc(doc(db, 'pvpMatches', currentMatch.id), updatePayload);
      setConfirmEarlyFinish(false);
    } catch (err) {
      console.error('Failed to finish early:', err);
    }
  };

  // Aggregated Top 20 Leaderboard for Selected Period (Week / Month / Year) & Metric
  const { top20, myRankEntry, myRankNumber, periodLabel } = useMemo(() => {
    const now = new Date();
    const startBoundary =
      lbPeriod === 'week'
        ? getWeekStart(now)
        : lbPeriod === 'month'
        ? getMonthStart(now)
        : getYearStart(now);

    const label =
      lbPeriod === 'week'
        ? `Week of ${startBoundary.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : lbPeriod === 'month'
        ? now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : `Year ${now.getFullYear()}`;

    // Combine quizScoreEvents + unlinked legacy quizAttempts
    const linkedMatchOrAttemptIds = new Set(scoreEvents.map((ev) => ev.id));
    const combinedEvents: QuizScoreEvent[] = [...scoreEvents];

    legacyAttempts.forEach((att) => {
      const syntheticId = `score-std-${att.id}`;
      if (!linkedMatchOrAttemptIds.has(syntheticId) && att.status === 'completed') {
        combinedEvents.push({
          id: syntheticId,
          userId: att.studentId,
          userName: att.studentName || 'Zahira Scholar',
          userRole: 'student',
          mode: 'standard_quiz',
          subject: 'Academic Quiz',
          pointsEarned: (att.score || 0) * 10,
          correctCount: Math.round(((att.score || 0) / Math.max(att.maxScore || 1, 1)) * 5),
          totalQuestions: 5,
          isWin: false,
          completedAt: att.completedAt,
        });
      }
    });

    const filtered = combinedEvents.filter((ev) => {
      if (!ev.completedAt) return false;
      const dt = new Date(ev.completedAt);
      return !isNaN(dt.getTime()) && dt >= startBoundary;
    });

    const byUser = new Map<string, AggregatedRankRow>();

    filtered.forEach((ev) => {
      const existing = byUser.get(ev.userId) || {
        userId: ev.userId,
        userName: ev.userName || 'Scholar',
        userRole: ev.userRole || 'student',
        indexNumber: ev.indexNumber,
        totalPoints: 0,
        quizzesDone: 0,
        pvpWins: 0,
        pvpMatches: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        accuracyPercent: 0,
      };

      existing.totalPoints += ev.pointsEarned || 0;
      existing.quizzesDone += 1;
      if (ev.mode === 'pvp') {
        existing.pvpMatches += 1;
        if (ev.isWin) existing.pvpWins += 1;
      }
      existing.totalCorrect += ev.correctCount || 0;
      existing.totalQuestions += ev.totalQuestions || 0;
      if (ev.indexNumber && !existing.indexNumber) {
        existing.indexNumber = ev.indexNumber;
      }

      byUser.set(ev.userId, existing);
    });

    const rows = Array.from(byUser.values()).map((r) => ({
      ...r,
      accuracyPercent: r.totalQuestions > 0 ? Math.min(100, Math.round((r.totalCorrect / r.totalQuestions) * 100)) : 0,
    }));

    rows.sort((a, b) => {
      if (lbMetric === 'most_quizzes') {
        if (b.quizzesDone !== a.quizzesDone) return b.quizzesDone - a.quizzesDone;
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return b.pvpWins - a.pvpWins;
      }
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.quizzesDone !== a.quizzesDone) return b.quizzesDone - a.quizzesDone;
      return b.pvpWins - a.pvpWins;
    });

    const top20List = rows.slice(0, 20);
    const myIdx = myUserId ? rows.findIndex((r) => r.userId === myUserId) : -1;

    return {
      top20: top20List,
      myRankEntry: myIdx >= 0 ? rows[myIdx] : null,
      myRankNumber: myIdx >= 0 ? myIdx + 1 : null,
      periodLabel: label,
    };
  }, [scoreEvents, legacyAttempts, lbPeriod, lbMetric, myUserId]);

  const waitingMatches = matches.filter((m) => m.status === 'waiting' && m.mode === 'pvp');
  const myOngoingMatches = myUserId
    ? matches.filter(
        (m) =>
          m.status === 'active' &&
          (m.hostId === myUserId || m.guestId === myUserId) &&
          !m.playerStates?.[myUserId]?.finished
      )
    : [];
  const recentMatches = matches.filter((m) => m.status === 'completed').slice(0, 6);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Hero Header & Section Switcher */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              {activeTab === 'arena' ? <Swords className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {activeTab === 'arena'
                  ? 'PvP Quiz Competition Arena'
                  : 'Official Top 20 Scholar Leaderboards'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activeTab === 'arena'
                  ? 'Real-time 1v1 duels & ranked sprints with brand-new Gemini AI questions generated every round'
                  : 'Track Most Points & Most Quizzes Done across Weekly, Monthly, and Yearly Top 20 rankings'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowApiKeyPanel((prev) => !prev)}
              className={`min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                customApiKey
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700'
              }`}
            >
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>{customApiKey ? 'AI Key Active' : 'Insert API Key'}</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('arena')}
                className={`min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'arena'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Swords className="w-4 h-4" />
                <span>PvP Quiz Arena</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('leaderboard')}
                className={`min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'leaderboard'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Top 20 Leaderboards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Insert Gemini API Key Configuration Panel */}
        {showApiKeyPanel && (
          <div className="mt-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/25 p-4 animate-in fade-in duration-150">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Gemini AI API Key for Real-Time PvP Question Generation</span>
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Paste your Google Gemini API key (e.g. AIza...) so Gemini generates 50 brand-new real-time questions every duel. Stored locally in your browser.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
                <div className="relative flex-1 min-w-[200px]">
                  <input
                    type={showApiKeyText ? 'text' : 'password'}
                    value={apiKeyDraft}
                    onChange={(e) => setApiKeyDraft(e.target.value)}
                    placeholder="Paste Gemini API key (AIza...)"
                    className="w-full min-h-[40px] rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 py-2 pl-3 pr-9 text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKeyText((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title={showApiKeyText ? 'Hide Key' : 'Show Key'}
                  >
                    {showApiKeyText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="min-h-[40px] rounded-xl bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 text-xs font-bold transition-colors"
                >
                  Save Key
                </button>
                {customApiKey && (
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    className="min-h-[40px] rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-3 py-2 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
            {apiKeyStatus && (
              <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{apiKeyStatus}</span>
              </p>
            )}
          </div>
        )}

        {arenaMessage && (
          <div className="mt-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-4 py-2.5 text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center justify-between gap-2">
            <span>{arenaMessage}</span>
            <button
              type="button"
              onClick={() => setArenaMessage(null)}
              className="text-blue-600 dark:text-blue-300 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Sign-in Prompt for Guests */}
      {!userProfile && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Sign in to compete & climb the Top 20 Leaderboard
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                You can browse live challenges and rankings right now. Sign in with your scholar or faculty account to join PvP duels and earn points.
              </p>
            </div>
          </div>
          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white px-5 py-2.5 text-xs font-bold shrink-0 shadow-xs transition-colors"
            >
              <span>Sign In to Compete</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 1: PVP COMPETITION ARENA                                      */}
      {/* ================================================================= */}
      {activeTab === 'arena' && (
        <>
          {currentMatch ? (
            /* ACTIVE / WAITING / COMPLETED MATCH VIEW */
            <div className="space-y-5">
              {/* Top Match Scoreboard Bar */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    {currentMatch.status === 'active' && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        <Radio className="w-3 h-3 animate-pulse" />
                        Live Sync
                      </span>
                    )}
                    <span className="font-mono font-bold text-blue-900 dark:text-blue-300">
                      Room {currentMatch.roomCode}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {currentMatch.subject}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{currentMatch.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {currentMatch.questions.length} Questions (
                      {currentMatch.questionSource === 'gemini_ai' ? 'Gemini AI' : 'Dynamic STEM/ICT'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentMatch.status === 'active' && myState && !myState.finished && (
                      <button
                        type="button"
                        onClick={() => setAutoAdvance((v) => !v)}
                        className={`min-h-[36px] rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                          autoAdvance
                            ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Auto-Next: {autoAdvance ? 'ON' : 'OFF'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveMatchId(null)}
                      className="min-h-[36px] rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Back to Lobby
                    </button>
                  </div>
                </div>

                {/* Players Live VS Scoreboard with Real-Time Progress Bars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* You */}
                  <div className="rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                          You {myState?.indexNumber ? `· ${myState.indexNumber}` : ''}
                        </p>
                        <p className="font-serif text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                          {myState?.userName || userProfile?.fullName}
                        </p>
                      </div>
                      <div className="text-right tabular-nums">
                        <p className="text-2xl font-black text-blue-900 dark:text-blue-200">
                          {myState?.score ?? 0}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          pts · {myState?.correctCount ?? 0}/{currentMatch.questions.length} right
                        </p>
                      </div>
                    </div>
                    <div className="mt-2.5 h-1.5 w-full rounded-full bg-blue-100 dark:bg-blue-900/50 overflow-hidden">
                      <div
                        className="h-full bg-blue-700 dark:bg-blue-400 transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (((myState?.finished ? currentMatch.questions.length : myState?.currentIndex ?? 0) +
                                (myState?.finished ? 0 : 0)) /
                                Math.max(currentMatch.questions.length, 1)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                      <span>
                        {myState?.finished
                          ? 'Completed round'
                          : `Question ${(myState?.currentIndex ?? 0) + 1} of ${currentMatch.questions.length}`}
                      </span>
                      {(myState?.streak ?? 0) > 1 && (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                          <Flame className="w-3.5 h-3.5" />
                          {myState?.streak}x Streak
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Opponent or Solo Mode Info */}
                  {currentMatch.mode === 'pvp' ? (
                    <div className="rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/25 p-4">
                      {opponentState ? (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                                  Opponent {opponentState.indexNumber ? `· ${opponentState.indexNumber}` : ''}
                                </p>
                                {opponentState.lastAnswerCorrect !== null && opponentState.lastAnswerCorrect !== undefined && (
                                  <span
                                    className={`text-[10px] font-bold ${
                                      opponentState.lastAnswerCorrect
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-rose-600 dark:text-rose-400'
                                    }`}
                                  >
                                    {opponentState.lastAnswerCorrect ? '· Hit!' : '· Miss'}
                                  </span>
                                )}
                              </div>
                              <p className="font-serif text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                                {opponentState.userName}
                              </p>
                            </div>
                            <div className="text-right tabular-nums">
                              <p className="text-2xl font-black text-rose-700 dark:text-rose-300">
                                {opponentState.score}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                pts · {opponentState.correctCount}/{currentMatch.questions.length} right
                              </p>
                            </div>
                          </div>
                          <div className="mt-2.5 h-1.5 w-full rounded-full bg-rose-100 dark:bg-rose-900/50 overflow-hidden">
                            <div
                              className="h-full bg-rose-600 dark:bg-rose-400 transition-all duration-300"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round(
                                    ((opponentState.finished
                                      ? currentMatch.questions.length
                                      : opponentState.currentIndex) /
                                      Math.max(currentMatch.questions.length, 1)) *
                                      100
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                            <span>
                              {opponentState.finished
                                ? 'Finished round'
                                : `Live on Q${opponentState.currentIndex + 1} of ${currentMatch.questions.length}`}
                            </span>
                            {opponentState.streak > 1 && (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                                <Flame className="w-3.5 h-3.5" />
                                {opponentState.streak}x Streak
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col justify-center items-start gap-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                            Waiting for Opponent
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {currentMatch.invitedUserName
                              ? `Invite sent to ${currentMatch.invitedUserName}. Match begins in real time once they join.`
                              : `Share room code ${currentMatch.roomCode} or wait for a classmate to accept from the Live Lobby.`}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 flex flex-col justify-center">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                        Ranked Solo Time-Trial ({currentMatch.questions.length} Qs)
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        Speed & Streak Multiplier Active
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Every right answer scores base marks + speed bonus + streak bonus directly to the Top 20 Leaderboard.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* WAITING FOR OPPONENT STATE */}
              {currentMatch.status === 'waiting' && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-5 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-800">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100">
                      {currentMatch.questions.length} Brand-New AI Questions Ready!
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                      Your 1v1 duel will begin automatically the moment an opponent accepts your challenge or enters your Room Code below.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-3">
                    <span className="font-mono text-lg font-black tracking-widest text-blue-900 dark:text-blue-300">
                      {currentMatch.roomCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(currentMatch.roomCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>

                  {currentMatch.hostId === myUserId && (
                    <div>
                      <button
                        type="button"
                        onClick={handleCancelWaitingRoom}
                        className="min-h-[40px] rounded-xl border border-rose-200 dark:border-rose-800 px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        Cancel Challenge Room
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* LIVE QUESTION STAGE */}
              {currentMatch.status === 'active' && myState && !myState.finished && currentQuestion && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xs space-y-5">
                  {/* Question Header + Timer */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        Question {myState.currentIndex + 1} / {currentMatch.questions.length}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{(currentQuestion.marks || 10) * 10} base pts + speed bonus</span>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black tabular-nums ${
                        questionTimer <= 6
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-900 dark:bg-slate-800 text-white'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{questionTimer}s</span>
                    </div>
                  </div>

                  {/* Timer Bar */}
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        questionTimer <= 6 ? 'bg-red-600' : 'bg-blue-700 dark:bg-blue-500'
                      }`}
                      style={{ width: `${Math.round((questionTimer / QUESTION_TIME_LIMIT) * 100)}%` }}
                    />
                  </div>

                  {/* Question Stem */}
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 p-4 sm:p-5">
                    <AIMarkdownMath
                      content={currentQuestion.questionText}
                      className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* 4 Multiple Choice Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQuestion.options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isChosen = revealedAnswer?.selected === opt;
                      const isCorrectOpt =
                        opt.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();

                      let btnStyle =
                        'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-slate-800 dark:text-slate-100';

                      if (revealedAnswer) {
                        if (isCorrectOpt) {
                          btnStyle =
                            'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500';
                        } else if (isChosen) {
                          btnStyle =
                            'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 ring-1 ring-rose-500';
                        } else {
                          btnStyle =
                            'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 opacity-75';
                        }
                      }

                      return (
                        <button
                          type="button"
                          key={idx}
                          disabled={Boolean(revealedAnswer) || submittingAnswer}
                          onClick={() => handleSelectAnswer(opt)}
                          className={`min-h-[54px] w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${btnStyle}`}
                        >
                          <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                            {letter}
                          </span>
                          <div className="flex-1 min-w-0">
                            <AIMarkdownMath content={opt} className="text-xs sm:text-sm font-medium" />
                          </div>
                          {revealedAnswer && isCorrectOpt && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          )}
                          {revealedAnswer && isChosen && !isCorrectOpt && (
                            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Post-Answer Explanation & Next Question Control */}
                  {revealedAnswer && (
                    <div
                      className={`rounded-xl border p-4 space-y-3 animate-in fade-in duration-150 ${
                        revealedAnswer.isCorrect
                          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30'
                          : 'border-rose-200 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/30'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`text-xs font-bold flex items-center gap-1.5 ${
                            revealedAnswer.isCorrect
                              ? 'text-emerald-800 dark:text-emerald-300'
                              : 'text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {revealedAnswer.isCorrect ? (
                            <>
                              <Zap className="w-4 h-4 text-amber-500" />
                              Correct! +{revealedAnswer.pointsAwarded} points earned
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              {revealedAnswer.selected === 'Time Expired'
                                ? 'Time Expired (0 pts)'
                                : 'Incorrect (0 pts)'}
                            </>
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={handleAdvanceQuestion}
                          className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-blue-900 hover:bg-blue-950 px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors"
                        >
                          <span>
                            {myState.currentIndex + 1 >= currentMatch.questions.length
                              ? 'Finish & View Score'
                              : 'Next Question'}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="font-bold block mb-1 text-slate-500 dark:text-slate-400">
                          Gemini AI Explanation {autoAdvance ? '· Advancing automatically...' : ''}:
                        </span>
                        <AIMarkdownMath content={currentQuestion.explanation || ''} />
                      </div>
                    </div>
                  )}

                  {/* Finish Early & Bank Points Option */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-400 dark:text-slate-500">
                      Live 50-question subject-matched session · Scores saved automatically after each answer
                    </span>
                    {!confirmEarlyFinish ? (
                      <button
                        type="button"
                        onClick={() => setConfirmEarlyFinish(true)}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-semibold transition-colors"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Finish Early & Bank Score</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-rose-700 dark:text-rose-300">
                          Bank {myState.score} pts and submit?
                        </span>
                        <button
                          type="button"
                          onClick={handleFinishEarly}
                          className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 font-bold"
                        >
                          Confirm Finish
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmEarlyFinish(false)}
                          className="rounded-lg border border-slate-300 dark:border-slate-600 px-2.5 py-1 font-semibold text-slate-600 dark:text-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MATCH FINISHED / WAITING FOR OPPONENT COMPLETION */}
              {myState?.finished && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                      {currentMatch.status === 'completed' ? (
                        <Trophy className="w-8 h-8" />
                      ) : (
                        <Clock className="w-8 h-8" />
                      )}
                    </div>

                    {currentMatch.status === 'completed' ? (
                      <>
                        <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {currentMatch.mode === 'solo_ranked'
                            ? 'Ranked Solo Sprint Complete!'
                            : currentMatch.winnerId === myUserId
                            ? 'Victory! You Won the PvP Duel!'
                            : currentMatch.winnerId === null
                            ? "It's a Tie Match!"
                            : `${currentMatch.winnerName || 'Opponent'} Won This Round`}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {currentMatch.mode === 'pvp' && currentMatch.winnerId === myUserId
                            ? `Final Score: ${myState.score} pts + 100 Victory Bonus = ${myState.score + 100} pts added to your Top 20 Leaderboard standing!`
                            : `Your Score: ${myState.score} pts (${myState.correctCount}/${currentMatch.questions.length} correct) recorded on the Official Leaderboard!`}
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-slate-100">
                          You Finished! ({myState.score} pts)
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Waiting for {opponentState?.userName || 'your opponent'} to complete their remaining questions. Your points are already safely logged, and a +100 Victory Bonus will be added automatically if you win!
                        </p>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveMatchId(null)}
                      className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Return to Arena Lobby</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMatchId(null);
                        setActiveTab('leaderboard');
                      }}
                      className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-blue-900 hover:bg-blue-950 px-5 py-2.5 text-xs font-bold text-white shadow-xs"
                    >
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>View Top 20 Leaderboard</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ARENA LOBBY VIEW */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT: CREATE FRESH GEMINI AI MATCH */}
              <form
                onSubmit={handleCreateMatch}
                className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4 h-fit"
              >
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                      Start New Competition
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Gemini AI generates unique questions each match
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowApiKeyPanel(true)}
                        className={`text-[11px] font-bold hover:underline inline-flex items-center gap-1 ${
                          customApiKey
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>{customApiKey ? 'Custom AI Key Active' : 'Insert API Key'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mode Switch */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMatchMode('pvp')}
                    className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      matchMode === 'pvp'
                        ? 'border-blue-900 bg-blue-900 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Swords className="w-4 h-4" />
                    <span>1v1 Live PvP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchMode('solo_ranked')}
                    className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      matchMode === 'solo_ranked'
                        ? 'border-blue-900 bg-blue-900 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Ranked Solo Sprint</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="font-semibold text-slate-600 dark:text-slate-300">
                        Selected Subjects ({selectedSubjects.length} chosen)
                      </label>
                      {userProfile?.enrolledSubjects && userProfile.enrolledSubjects.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedSubjects(userProfile.enrolledSubjects!)}
                          className="text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:underline"
                        >
                          Use My Joined Subjects
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {OFFICIAL_STUDENT_SUBJECTS.map((subj, idx) => {
                        const isPicked = selectedSubjects.includes(subj);
                        return (
                          <button
                            key={subj}
                            type="button"
                            onClick={() => toggleMatchSubject(subj)}
                            className={`min-h-[40px] flex items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                              isPicked
                                ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                            }`}
                          >
                            <span className="truncate">
                              {idx + 1}) {subj}
                            </span>
                            {isPicked && <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                      Questions in this live PvP round are generated exclusively from your selected subjects.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Specific Topic (Optional)
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Leave blank for full syllabus coverage across selected subjects"
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Difficulty
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100"
                      >
                        <option value="easy">Easy (100 pts)</option>
                        <option value="medium">Medium (120 pts)</option>
                        <option value="hard">Hard (150 pts)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Questions
                      </label>
                      <select
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100"
                      >
                        <option value={50}>50 Questions (Full Real-Time Match)</option>
                        <option value={25}>25 Questions (Half Round)</option>
                        <option value={10}>10 Questions (Quick Blitz)</option>
                      </select>
                    </div>
                  </div>

                  {matchMode === 'pvp' && (
                    <div>
                      <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Challenge Specific Player (Optional)
                      </label>
                      <select
                        value={invitedUserId}
                        onChange={(e) => setInvitedUserId(e.target.value)}
                        className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100"
                      >
                        <option value="">Open Lobby (Anyone can accept)</option>
                        {directoryUsers
                          .filter((u) => u.userId !== myUserId)
                          .map((u) => (
                            <option key={u.userId} value={u.userId}>
                              {u.fullName} ({u.role}{u.indexNumber ? ` · ${u.indexNumber}` : ''})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={creatingMatch}
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 px-5 py-3 text-xs font-bold text-white shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {creatingMatch
                      ? `Generating ${questionCount} Fresh Questions...`
                      : matchMode === 'pvp'
                      ? `Create ${questionCount}-Q Real-Time PvP Room`
                      : `Start ${questionCount}-Q Ranked Solo Sprint`}
                  </span>
                </button>
              </form>

              {/* RIGHT: JOIN ROOM CODE + LIVE OPEN CHALLENGES + RECENT DUELS */}
              <div className="lg:col-span-7 space-y-5">
                {/* Join by Room Code */}
                <form
                  onSubmit={handleJoinByRoomCode}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex items-center gap-2.5 flex-1">
                    <Hash className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0" />
                    <input
                      type="text"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value)}
                      placeholder="Have a Room Code? Enter e.g. ZNC-4821"
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono uppercase text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <button
                    type="submit"
                    className="min-h-[42px] rounded-xl bg-blue-900 hover:bg-blue-950 px-5 py-2 text-xs font-bold text-white shrink-0 transition-colors"
                  >
                    Join Room
                  </button>
                </form>

                {/* My Active Ongoing Competitions (Resume after navigating away) */}
                {myOngoingMatches.length > 0 && (
                  <div className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/30 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                        <h3 className="font-serif text-base font-bold text-slate-900 dark:text-slate-100">
                          Your Active Matches (Resume)
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {myOngoingMatches.length} in progress
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {myOngoingMatches.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                              {m.mode === 'pvp'
                                ? `${m.hostName} vs ${m.guestName || 'Opponent'}`
                                : `Ranked Solo Sprint · ${m.roomCode}`}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {m.subject} · Q{(m.playerStates?.[myUserId]?.currentIndex ?? 0) + 1}/{m.questions.length} · Score: {m.playerStates?.[myUserId]?.score ?? 0} pts
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setActiveMatchId(m.id)}
                              className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Resume Match</span>
                            </button>
                            {(m.hostId === myUserId || activeRole === 'admin') && (
                              confirmDeleteRoomId === m.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLobbyMatch(m.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-bold"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteRoomId(null)}
                                    className="px-2 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-semibold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteRoomId(m.id)}
                                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                                  title="Delete match"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Open PvP Challenges */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                      <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                        Open PvP Challenges
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                      {waitingMatches.length} waiting
                    </span>
                  </div>

                  {waitingMatches.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                      No open 1v1 rooms right now. Create a PvP Challenge Room on the left—or play a Ranked Solo Sprint to immediately score points for the Top 20 Leaderboard!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {waitingMatches.map((m) => {
                        const isMine = m.hostId === myUserId;
                        const isInvitedMe = m.invitedUserId && m.invitedUserId === myUserId;
                        return (
                          <div
                            key={m.id}
                            className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isInvitedMe
                                ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/25'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                  {m.hostName}
                                </span>
                                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                  {m.roomCode}
                                </span>
                                {isInvitedMe && (
                                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                                    · Challenged You!
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                {m.subject} · {m.difficulty} · {m.questionCount} questions
                                {m.invitedUserName && !isInvitedMe ? ` · For ${m.invitedUserName}` : ''}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleJoinMatch(m)}
                                className={`min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shrink-0 transition-colors ${
                                  isMine
                                    ? 'bg-slate-800 text-white hover:bg-slate-900'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                }`}
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>{isMine ? 'Re-enter Room' : 'Accept Duel'}</span>
                              </button>
                              {(isMine || activeRole === 'admin') && (
                                confirmDeleteRoomId === m.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLobbyMatch(m.id)}
                                      className="px-2.5 py-2 rounded-lg bg-red-600 text-white text-[11px] font-bold"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteRoomId(null)}
                                      className="px-2 py-2 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-semibold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteRoomId(m.id)}
                                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Cancel / Delete room"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Completed Competitions */}
                {recentMatches.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
                    <h3 className="font-serif text-base font-bold text-slate-900 dark:text-slate-100">
                      Recent Arena Results
                    </h3>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {recentMatches.map((m) => (
                        <div key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {m.mode === 'pvp'
                                ? `${m.hostName} vs ${m.guestName || 'Opponent'}`
                                : `${m.hostName} (Solo Sprint)`}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {m.subject} · {m.questionCount} Qs
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {m.winnerName ? `Winner: ${m.winnerName}` : 'Draw Match'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ================================================================= */}
      {/* TAB 2: OFFICIAL TOP 20 LEADERBOARDS (WEEK / MONTH / YEAR)         */}
      {/* ================================================================= */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-5">
          {/* Metric + Period Controls */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Most Points vs Most Quizzes Done */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
                Rank By:
              </span>
              <button
                type="button"
                onClick={() => setLbMetric('most_points')}
                className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  lbMetric === 'most_points'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>Most Points</span>
              </button>
              <button
                type="button"
                onClick={() => setLbMetric('most_quizzes')}
                className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  lbMetric === 'most_quizzes'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Target className="w-4 h-4 text-emerald-400" />
                <span>Most Quizzes Done</span>
              </button>
            </div>

            {/* Top 20 of the Week / Month / Year */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(
                [
                  { id: 'week', label: 'Top 20 · Week' },
                  { id: 'month', label: 'Top 20 · Month' },
                  { id: 'year', label: 'Top 20 · Year' },
                ] as const
              ).map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setLbPeriod(p.id)}
                  className={`min-h-[38px] px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    lbPeriod === p.id
                      ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Personal Standing Banner */}
          {userProfile && (
            <div className="rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-gradient-to-r from-blue-900 to-indigo-950 p-4 sm:p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center font-serif text-lg font-black text-amber-300 shrink-0 tabular-nums">
                  {myRankNumber ? `#${myRankNumber}` : '—'}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-bold text-blue-200">
                    Your Standing · {periodLabel}
                  </p>
                  <p className="font-serif text-base sm:text-lg font-bold">
                    {userProfile.fullName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center tabular-nums">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-blue-200">Points</p>
                  <p className="text-lg font-black text-amber-300">
                    {myRankEntry?.totalPoints ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-blue-200">Quizzes</p>
                  <p className="text-lg font-black">{myRankEntry?.quizzesDone ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-blue-200">PvP Wins</p>
                  <p className="text-lg font-black text-emerald-300">
                    {myRankEntry?.pvpWins ?? 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Top 3 Podium Cards */}
          {top20.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {top20.slice(0, 3).map((row, idx) => {
                const rank = idx + 1;
                const medalStyles =
                  rank === 1
                    ? 'border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                    : rank === 2
                    ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    : 'border-orange-300 dark:border-orange-800 bg-orange-50/60 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300';

                return (
                  <div
                    key={row.userId}
                    className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between gap-3 ${medalStyles}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                        {rank === 1 ? <Crown className="w-4 h-4" /> : <Medal className="w-4 h-4" />}
                        Rank #{rank}
                      </span>
                      <span className="text-[11px] font-semibold opacity-80 capitalize">
                        {row.userRole}{row.indexNumber ? ` · ${row.indexNumber}` : ''}
                      </span>
                    </div>

                    <div>
                      <p className="font-serif text-lg font-bold text-slate-900 dark:text-white truncate">
                        {row.userName}
                      </p>
                      <div className="mt-2 flex items-baseline gap-4 tabular-nums">
                        <div>
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {lbMetric === 'most_quizzes' ? row.quizzesDone : row.totalPoints}
                          </span>
                          <span className="text-xs font-semibold ml-1 opacity-75">
                            {lbMetric === 'most_quizzes' ? 'quizzes' : 'pts'}
                          </span>
                        </div>
                        <span className="text-xs opacity-80">
                          {lbMetric === 'most_quizzes'
                            ? `${row.totalPoints} pts`
                            : `${row.quizzesDone} quizzes`}
                          {' · '}
                          {row.pvpWins} wins
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Top 20 Standings Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-serif text-base font-bold text-slate-900 dark:text-slate-100">
                  Top 20 Rankings — {lbMetric === 'most_points' ? 'Most Points' : 'Most Quizzes Done'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Period: {periodLabel} · Showing top {Math.min(top20.length, 20)} of 20 slots
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('arena')}
                className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-3.5 py-1.5 text-xs font-bold text-white transition-colors"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Play Quiz to Climb</span>
              </button>
            </div>

            {top20.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No quiz competition scores recorded yet for {periodLabel}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Start a 1v1 PvP Duel or Ranked Solo Sprint with fresh Gemini AI questions to claim Rank #1 on the Top 20 Leaderboard!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('arena')}
                  className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-blue-900 hover:bg-blue-950 px-5 py-2.5 text-xs font-bold text-white"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Launch First Match</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4 font-bold">Rank</th>
                      <th className="py-3 px-4 font-bold">Competitor</th>
                      <th className="py-3 px-4 font-bold text-right">Points</th>
                      <th className="py-3 px-4 font-bold text-right">Quizzes Done</th>
                      <th className="py-3 px-4 font-bold text-right hidden sm:table-cell">PvP Wins</th>
                      <th className="py-3 px-4 font-bold text-right hidden sm:table-cell">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {top20.map((row, idx) => {
                      const rank = idx + 1;
                      const isMe = row.userId === myUserId;
                      return (
                        <tr
                          key={row.userId}
                          className={
                            isMe
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 font-semibold'
                              : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                          }
                        >
                          <td className="py-3.5 px-4 tabular-nums font-black text-slate-800 dark:text-slate-100">
                            #{rank}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                {row.userName}
                              </span>
                              {isMe && (
                                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                  (You)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                              {row.userRole}
                              {row.indexNumber ? ` · ID ${row.indexNumber}` : ''}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums font-black text-blue-900 dark:text-blue-300">
                            {row.totalPoints.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums font-bold text-slate-800 dark:text-slate-200">
                            {row.quizzesDone}
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold hidden sm:table-cell">
                            {row.pvpWins}
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                            {row.accuracyPercent}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
