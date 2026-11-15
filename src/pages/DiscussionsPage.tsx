import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessagesSquare,
  Sparkles,
  Plus,
  Send,
  X,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Trash2,
  Hash,
  Users,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  MessageSquareText,
} from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db, sanitizeFirestoreDoc } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  Discussion,
  DiscussionReply,
  DiscussionCategory,
  DiscussionRoomMessage,
} from '../types';
import { broadcastSystemNotification } from '../services/notificationService';
import { AIMarkdownMath } from '../components/common/AIMarkdownMath';

interface DiscussionsPageProps {
  onOpenAuthModal?: () => void;
}

interface RoomChannel {
  id: string;
  name: string;
  shortName: string;
  description: string;
}

const DISCUSSION_ROOMS: RoomChannel[] = [
  {
    id: 'general',
    name: 'General Science EM',
    shortName: 'General',
    description: '2k28 batch announcements, past-paper sharing, and collaborative study',
  },
  {
    id: 'cmath',
    name: 'Combined Mathematics',
    shortName: 'C.Maths',
    description: 'Calculus, vectors, mechanics, trigonometry & Pure/Applied problem sets',
  },
  {
    id: 'bio',
    name: 'Biology',
    shortName: 'Bio',
    description: 'Cellular respiration, genetics, physiology diagrams & lab notes',
  },
  {
    id: 'physics',
    name: 'Physics',
    shortName: 'Physics',
    description: 'Mechanics, fields, waves, optics & past-paper derivations',
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    shortName: 'Chemistry',
    description: 'Organic mechanisms, equilibrium, energetics & practical titrations',
  },
  {
    id: 'ict',
    name: 'ICT',
    shortName: 'ICT',
    description: 'Programming, Boolean logic, networking, databases & web systems',
  },
];

interface PendingAttachment {
  file: File;
  base64: string;
  previewUrl?: string;
}

function isImageAttachment(type?: string, url?: string, name?: string): boolean {
  if (type && type.startsWith('image/')) return true;
  const target = `${name || ''} ${url || ''}`.toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(target) || target.startsWith('data:image/');
}

function formatRoleLabel(role?: string): string {
  if (role === 'admin') return 'Admin';
  if (role === 'teacher') return 'Teacher';
  if (role === 'student') return 'Student';
  return role || 'Member';
}

export const DiscussionsPage: React.FC<DiscussionsPageProps> = ({ onOpenAuthModal }) => {
  const { activeRole, userProfile } = useAuth();

  // Top View Mode: Live Chat Room vs Structured Topic Threads
  const [viewMode, setViewMode] = useState<'room' | 'threads'>('room');

  // =========================================================================
  // LIVE DISCUSSION ROOM STATE
  // =========================================================================
  const [activeRoomId, setActiveRoomId] = useState<string>('general');
  const [roomMessages, setRoomMessages] = useState<DiscussionRoomMessage[]>([]);
  const [roomLoading, setRoomLoading] = useState(true);
  const [chatText, setChatText] = useState('');
  const [pendingRoomFile, setPendingRoomFile] = useState<PendingAttachment | null>(null);
  const [roomFileError, setRoomFileError] = useState<string | null>(null);
  const [sendingRoomMsg, setSendingRoomMsg] = useState(false);
  const [confirmDeleteRoomMsgId, setConfirmDeleteRoomMsgId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);

  const roomFileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // =========================================================================
  // STRUCTURED FORUM TOPICS STATE
  // =========================================================================
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Reply input + attachment
  const [replyContent, setReplyContent] = useState('');
  const [pendingReplyFile, setPendingReplyFile] = useState<PendingAttachment | null>(null);
  const [replyUploading, setReplyUploading] = useState(false);
  const [confirmDeleteReplyId, setConfirmDeleteReplyId] = useState<string | null>(null);
  const [confirmDeleteTopicId, setConfirmDeleteTopicId] = useState<string | null>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  // Create Topic Modal + attachment
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<DiscussionCategory>('study_group');
  const [newTags, setNewTags] = useState('science-em, study-group');
  const [pendingTopicFile, setPendingTopicFile] = useState<PendingAttachment | null>(null);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [creatingTopic, setCreatingTopic] = useState(false);
  const topicFileInputRef = useRef<HTMLInputElement>(null);

  // Gemini Discussion Assistant state
  const [aiSummary, setAiSummary] = useState<{
    summary?: string;
    keyConcepts?: string[];
    unansweredQuestions?: string[];
    studyQuestions?: string[];
  } | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  // Real-time Firestore subscriptions
  useEffect(() => {
    const unsubRoom = onSnapshot(
      collection(db, 'discussionRoomMessages'),
      (snap) => {
        const list: DiscussionRoomMessage[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as DiscussionRoomMessage), id: d.id }));
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setRoomMessages(list);
        setRoomLoading(false);
      },
      (err) => {
        console.warn('Room messages listener note:', err);
        setRoomLoading(false);
      }
    );

    const unsubDisc = onSnapshot(
      collection(db, 'discussions'),
      (snap) => {
        const dList: Discussion[] = [];
        snap.forEach((d) => dList.push({ ...(d.data() as Discussion), id: d.id }));
        const sorted = dList.sort((a, b) => {
          if ((b.isPinned ? 1 : 0) !== (a.isPinned ? 1 : 0)) {
            return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setDiscussions(sorted);
        setSelectedDiscussionId((prev) => prev || sorted[0]?.id || null);
      },
      (err) => console.warn('Discussions listener note:', err)
    );

    const unsubRep = onSnapshot(
      collection(db, 'discussionReplies'),
      (snap) => {
        const rList: DiscussionReply[] = [];
        snap.forEach((d) => rList.push({ ...(d.data() as DiscussionReply), id: d.id }));
        rList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setReplies(rList);
      },
      (err) => console.warn('Replies listener note:', err)
    );

    return () => {
      unsubRoom();
      unsubDisc();
      unsubRep();
    };
  }, []);

  const currentRoom = useMemo(
    () => DISCUSSION_ROOMS.find((r) => r.id === activeRoomId) || DISCUSSION_ROOMS[0],
    [activeRoomId]
  );

  const activeRoomMessages = useMemo(
    () => roomMessages.filter((m) => (m.roomId || 'general') === activeRoomId),
    [roomMessages, activeRoomId]
  );

  const roomCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    roomMessages.forEach((m) => {
      const rid = m.roomId || 'general';
      counts[rid] = (counts[rid] || 0) + 1;
    });
    return counts;
  }, [roomMessages]);

  // Auto-scroll room messages to bottom when entering room or receiving new message
  useEffect(() => {
    if (viewMode === 'room') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [viewMode, activeRoomId, activeRoomMessages.length]);

  const selectedDiscussion = useMemo(
    () => discussions.find((d) => d.id === selectedDiscussionId) || null,
    [discussions, selectedDiscussionId]
  );

  const activeThreadReplies = useMemo(
    () =>
      selectedDiscussion
        ? replies.filter((r) => r.discussionId === selectedDiscussion.id)
        : [],
    [replies, selectedDiscussion]
  );

  const filteredTopics = useMemo(
    () =>
      discussions.filter(
        (d) => activeCategory === 'all' || d.category === activeCategory
      ),
    [discussions, activeCategory]
  );

  // Shared File Reader helper (enforces 10 MB limit)
  const readPendingFile = (
    file: File | undefined,
    onLoaded: (att: PendingAttachment) => void,
    onError: (msg: string) => void
  ) => {
    if (!file) return;
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_SIZE) {
      onError(
        `File exceeds 10 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please pick a smaller file.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onLoaded({
        file,
        base64,
        previewUrl: file.type.startsWith('image/') ? base64 : undefined,
      });
    };
    reader.onerror = () => {
      onError('Could not read the selected file from your device.');
    };
    reader.readAsDataURL(file);
  };

  // Upload helper calling backend /api/upload cleanly so Firestore stays lean
  const uploadAttachmentToServer = async (
    att: PendingAttachment
  ): Promise<{ url: string; name: string; size: string; type: string }> => {
    const sizeLabel =
      att.file.size >= 1024 * 1024
        ? `${(att.file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.max(1, Math.round(att.file.size / 1024))} KB`;

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: att.file.name,
        fileData: att.base64,
        fileType: att.file.type || 'application/octet-stream',
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'File upload to server failed.');
    }

    const data = await res.json();
    return {
      url: data.url,
      name: data.filename || att.file.name,
      size: data.size || sizeLabel,
      type: data.fileType || att.file.type || 'application/octet-stream',
    };
  };

  // Send message / file in Live Discussion Room
  const handleSendRoomMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userProfile) {
      onOpenAuthModal?.();
      return;
    }
    const cleanText = chatText.trim();
    if (!cleanText && !pendingRoomFile) return;

    setSendingRoomMsg(true);
    setRoomFileError(null);

    try {
      let attachmentFields: Partial<DiscussionRoomMessage> = {};

      if (pendingRoomFile) {
        const uploaded = await uploadAttachmentToServer(pendingRoomFile);
        attachmentFields = {
          attachmentUrl: uploaded.url,
          attachmentName: uploaded.name,
          attachmentSize: uploaded.size,
          attachmentType: uploaded.type,
        };
      }

      const id = `dmsg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const msgDoc: DiscussionRoomMessage = {
        id,
        roomId: activeRoomId,
        roomName: currentRoom.name,
        authorId: userProfile.userId,
        authorName: userProfile.fullName,
        authorRole: activeRole,
        indexNumber: userProfile.indexNumber,
        text: cleanText,
        ...attachmentFields,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'discussionRoomMessages', id), sanitizeFirestoreDoc(msgDoc));
      setChatText('');
      setPendingRoomFile(null);
      if (roomFileInputRef.current) roomFileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Failed to send room message:', err);
      setRoomFileError(err?.message || 'Failed to send message or upload file. Please try again.');
    } finally {
      setSendingRoomMsg(false);
    }
  };

  const handleDeleteRoomMessage = async (msgId: string) => {
    setRoomMessages((prev) => prev.filter((m) => m.id !== msgId));
    setConfirmDeleteRoomMsgId(null);
    setRoomFileError(null);
    try {
      await deleteDoc(doc(db, 'discussionRoomMessages', msgId));
    } catch (err: any) {
      console.error('Failed to delete message:', err);
      setRoomFileError(err?.message || 'Failed to delete message from database.');
    }
  };

  // Create Forum Topic (with optional file upload)
  const handleCreateTopic = async () => {
    if (!userProfile) {
      onOpenAuthModal?.();
      return;
    }
    if (!newTitle.trim() || (!newContent.trim() && !pendingTopicFile)) {
      setTopicError('Please enter a topic title and discussion details.');
      return;
    }

    setCreatingTopic(true);
    setTopicError(null);
    try {
      let attachmentFields: Partial<Discussion> = {};
      if (pendingTopicFile) {
        const uploaded = await uploadAttachmentToServer(pendingTopicFile);
        attachmentFields = {
          attachmentUrl: uploaded.url,
          attachmentName: uploaded.name,
          attachmentSize: uploaded.size,
          attachmentType: uploaded.type,
        };
      }

      const id = `disc-${Date.now()}`;
      const topic: Discussion = {
        id,
        title: newTitle.trim(),
        content: newContent.trim() || 'Shared an attached file for discussion.',
        authorId: userProfile.userId,
        authorName: userProfile.fullName,
        authorRole: activeRole,
        category: newCategory,
        classId: 'general',
        subjectId: 'sub-cmath',
        tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
        repliesCount: 0,
        isPinned: false,
        ...attachmentFields,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'discussions', id), sanitizeFirestoreDoc(topic));
      await broadcastSystemNotification({
        title: 'New Discussion Thread',
        message: `${topic.authorName} started a discussion: "${topic.title}".`,
        type: 'discussion',
        link: 'discussions',
      }).catch(() => {});

      setSelectedDiscussionId(id);
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
      setPendingTopicFile(null);
      if (topicFileInputRef.current) topicFileInputRef.current.value = '';
    } catch (e: any) {
      console.error('Failed to create topic:', e);
      setTopicError(e?.message || 'Failed to post discussion topic.');
    } finally {
      setCreatingTopic(false);
    }
  };

  // Post Thread Reply (with optional file upload)
  const handlePostReply = async () => {
    if (!userProfile) {
      onOpenAuthModal?.();
      return;
    }
    if (!selectedDiscussion || (!replyContent.trim() && !pendingReplyFile)) return;

    setReplyUploading(true);
    try {
      let attachmentFields: Partial<DiscussionReply> = {};
      if (pendingReplyFile) {
        const uploaded = await uploadAttachmentToServer(pendingReplyFile);
        attachmentFields = {
          attachmentUrl: uploaded.url,
          attachmentName: uploaded.name,
          attachmentSize: uploaded.size,
          attachmentType: uploaded.type,
        };
      }

      const repId = `rep-${Date.now()}`;
      const newRep: DiscussionReply = {
        id: repId,
        discussionId: selectedDiscussion.id,
        authorId: userProfile.userId,
        authorName: userProfile.fullName,
        authorRole: activeRole,
        content: replyContent.trim() || 'Attached a file:',
        ...attachmentFields,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'discussionReplies', repId), sanitizeFirestoreDoc(newRep));
      setReplyContent('');
      setPendingReplyFile(null);
      if (replyFileInputRef.current) replyFileInputRef.current.value = '';

      await setDoc(
        doc(db, 'discussions', selectedDiscussion.id),
        { repliesCount: (selectedDiscussion.repliesCount || 0) + 1 },
        { merge: true }
      );
      await broadcastSystemNotification({
        title: `Reply in: ${selectedDiscussion.title}`,
        message: `${newRep.authorName} shared: "${newRep.content.slice(0, 80)}"`,
        type: 'discussion',
        link: 'discussions',
      }).catch(() => {});
    } catch (e) {
      console.error('Failed to post reply:', e);
    } finally {
      setReplyUploading(false);
    }
  };

  const handleDeleteReply = async (replyId: string, discussionId: string) => {
    setReplies((prev) => prev.filter((r) => r.id !== replyId));
    setConfirmDeleteReplyId(null);
    try {
      await deleteDoc(doc(db, 'discussionReplies', replyId));
      const parentDisc = discussions.find((d) => d.id === discussionId);
      if (parentDisc) {
        const nextCount = Math.max(0, (parentDisc.repliesCount || 1) - 1);
        await setDoc(doc(db, 'discussions', discussionId), { repliesCount: nextCount }, { merge: true });
      }
    } catch (err) {
      console.error('Failed to delete reply:', err);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    setDiscussions((prev) => prev.filter((d) => d.id !== topicId));
    setReplies((prev) => prev.filter((r) => r.discussionId !== topicId));
    setConfirmDeleteTopicId(null);
    if (selectedDiscussionId === topicId) {
      setSelectedDiscussionId(null);
    }
    try {
      const repSnap = await getDocs(
        query(collection(db, 'discussionReplies'), where('discussionId', '==', topicId))
      );
      await Promise.all(repSnap.docs.map((d) => deleteDoc(doc(db, 'discussionReplies', d.id))));
      await deleteDoc(doc(db, 'discussions', topicId));
    } catch (err) {
      console.error('Failed to delete topic:', err);
    }
  };

  const handleRunAISummary = async () => {
    if (!selectedDiscussion) return;
    setAiSummaryLoading(true);

    const threadReplies = replies.filter((r) => r.discussionId === selectedDiscussion.id);
    const postPayload = [
      {
        authorName: selectedDiscussion.authorName,
        authorRole: selectedDiscussion.authorRole,
        content: selectedDiscussion.content,
      },
      ...threadReplies.map((r) => ({
        authorName: r.authorName,
        authorRole: r.authorRole,
        content: r.content,
      })),
    ];

    try {
      let customApiKey = '';
      try {
        customApiKey = localStorage.getItem('znc_custom_gemini_api_key') || '';
      } catch {}

      const res = await fetch('/api/gemini/discussion-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-gemini-api-key': customApiKey } : {}),
        },
        body: JSON.stringify({
          topicTitle: selectedDiscussion.title,
          category: selectedDiscussion.category,
          posts: postPayload,
          apiKey: customApiKey || undefined,
        }),
      });

      const data = await res.json();
      setAiSummary(data);
    } catch (e) {
      console.error('AI Summary Error:', e);
    } finally {
      setAiSummaryLoading(false);
    }
  };

  // Shared Attachment Renderer (Images + Documents)
  const renderAttachment = (
    url?: string,
    name?: string,
    size?: string,
    type?: string,
    isOwnBubble = false
  ) => {
    if (!url) return null;
    const isImg = isImageAttachment(type, url, name);
    const safeName = name || 'Shared File';

    if (isImg) {
      return (
        <div className="mt-2 space-y-1.5">
          <button
            type="button"
            onClick={() => setLightboxImage({ url, name: safeName })}
            className="block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 max-w-xs sm:max-w-sm hover:opacity-95 transition-opacity text-left"
          >
            <img
              src={url}
              alt={safeName}
              className="max-h-60 w-auto object-contain rounded-xl"
            />
          </button>
          <div className="flex items-center gap-3 text-[11px]">
            <span className={`truncate max-w-[180px] ${isOwnBubble ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
              {safeName} {size ? `(${size})` : ''}
            </span>
            <a
              href={url}
              download={safeName}
              className={`inline-flex items-center gap-1 font-bold hover:underline ${
                isOwnBubble ? 'text-amber-300' : 'text-blue-700 dark:text-blue-400'
              }`}
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </a>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`mt-2 flex items-center justify-between gap-3 rounded-xl border p-2.5 text-xs ${
          isOwnBubble
            ? 'border-white/20 bg-white/10 text-white'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isOwnBubble
                ? 'bg-white/15 text-amber-300'
                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
            }`}
          >
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-bold truncate">{safeName}</p>
            <p className={`text-[10px] ${isOwnBubble ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
              {size || 'Document'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
              isOwnBubble
                ? 'bg-white/15 hover:bg-white/25 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            title="Open File"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Open</span>
          </a>
          <a
            href={url}
            download={safeName}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
              isOwnBubble
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                : 'bg-blue-900 hover:bg-blue-950 text-white'
            }`}
            title="Download File"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Save</span>
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Header & Mode Switcher */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <MessagesSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Zahira Study Discussion Room
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time group chat, device file uploads (PDFs, notes, images & slides), and Q&A discussion threads
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('room')}
                className={`min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  viewMode === 'room'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Live Chat Room</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('threads')}
                className={`min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  viewMode === 'threads'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MessageSquareText className="w-4 h-4" />
                <span>Topic Threads ({discussions.length})</span>
              </button>
            </div>

            {viewMode === 'threads' && (
              <button
                type="button"
                onClick={() => {
                  if (!userProfile) {
                    onOpenAuthModal?.();
                    return;
                  }
                  setShowCreateModal(true);
                }}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-stone-950 transition-all shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New Topic</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Guest Sign-In Prompt */}
      {!userProfile && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Sign in to chat & share study files in the Discussion Room
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                You can read messages and download shared resources right now. Sign in to post messages or upload files.
              </p>
            </div>
          </div>
          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white px-5 py-2.5 text-xs font-bold shrink-0 shadow-xs transition-colors"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* VIEW 1: REAL-TIME DISCUSSION ROOM (CHAT + FILE UPLOADS)           */}
      {/* ================================================================= */}
      {viewMode === 'room' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Subject Channels Sidebar (Desktop) & Horizontal Strip (Mobile) */}
          <div className="lg:col-span-3 space-y-2">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs">
              <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Study Channels
              </p>
              <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
                {DISCUSSION_ROOMS.map((room) => {
                  const isActive = room.id === activeRoomId;
                  const count = roomCounts[room.id] || 0;
                  return (
                    <button
                      type="button"
                      key={room.id}
                      onClick={() => setActiveRoomId(room.id)}
                      className={`min-h-[44px] flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition-all shrink-0 lg:w-full ${
                        isActive
                          ? 'bg-blue-900 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Hash
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-amber-300' : 'text-slate-400'
                          }`}
                        />
                        <span className="lg:hidden whitespace-nowrap">{room.shortName}</span>
                        <span className="hidden lg:inline truncate">{room.name}</span>
                      </span>
                      {count > 0 && (
                        <span
                          className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hidden lg:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-4 text-xs space-y-2">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Allowed File Uploads
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Upload PDFs, images (PNG/JPG/WebP), Word docs, PowerPoint slides, spreadsheets, ZIP archives, or text files up to 10 MB per upload.
              </p>
            </div>
          </div>

          {/* Main Real-Time Chat Area */}
          <div className="lg:col-span-9 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden min-h-[540px] max-h-[75vh]">
            {/* Channel Banner */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                  <h3 className="font-serif text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                    {currentRoom.name}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {currentRoom.description}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 tabular-nums">
                {activeRoomMessages.length} messages
              </span>
            </div>

            {/* Messages Scroll Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {roomLoading ? (
                <div className="flex items-center justify-center h-40 text-xs text-slate-500 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to live discussion room...</span>
                </div>
              ) : activeRoomMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-3">
                    <MessagesSquare className="w-6 h-6" />
                  </div>
                  <p className="font-serif text-base font-bold text-slate-800 dark:text-slate-200">
                    Welcome to #{currentRoom.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
                    No messages here yet. Ask a question, start a discussion, or upload notes/past papers to collaborate with classmates and faculty!
                  </p>
                </div>
              ) : (
                activeRoomMessages.map((msg) => {
                  const isMine = userProfile?.userId === msg.authorId;
                  const canDelete =
                    isMine || activeRole === 'admin' || activeRole === 'teacher';
                  const confirmingDelete = confirmDeleteRoomMsgId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[90%] sm:max-w-[78%] rounded-2xl px-4 py-3 shadow-2xs ${
                          isMine
                            ? 'bg-blue-900 text-white rounded-br-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-bl-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`text-xs font-bold truncate ${
                                isMine ? 'text-amber-300' : 'text-blue-900 dark:text-blue-300'
                              }`}
                            >
                              {isMine ? 'You' : msg.authorName}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${
                                isMine
                                  ? 'bg-white/15 text-blue-100'
                                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {formatRoleLabel(msg.authorRole)}
                              {msg.indexNumber ? ` · ${msg.indexNumber}` : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-[10px] ${
                                isMine ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            {canDelete && (
                              confirmingDelete ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRoomMessage(msg.id)}
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white hover:bg-rose-700"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteRoomMsgId(null)}
                                    className={`text-[10px] font-semibold px-1 py-0.5 rounded ${
                                      isMine ? 'text-blue-100 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteRoomMsgId(msg.id)}
                                  className={`p-1 rounded transition-colors ${
                                    isMine
                                      ? 'text-blue-200 hover:text-white hover:bg-white/10'
                                      : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                  }`}
                                  title="Delete message"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {msg.text && (
                          <div className={`text-xs sm:text-sm leading-relaxed ${isMine ? 'text-white [&_p]:text-white [&_strong]:text-amber-200' : ''}`}>
                            <AIMarkdownMath content={msg.text} />
                          </div>
                        )}

                        {renderAttachment(
                          msg.attachmentUrl,
                          msg.attachmentName,
                          msg.attachmentSize,
                          msg.attachmentType,
                          isMine
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Composer Bar */}
            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3 sm:p-4 space-y-2.5">
              {roomFileError && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{roomFileError}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setRoomFileError(null)}
                    className="font-bold hover:underline shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {pendingRoomFile && (
                <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 p-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {pendingRoomFile.previewUrl ? (
                      <img
                        src={pendingRoomFile.previewUrl}
                        alt={pendingRoomFile.file.name}
                        className="w-10 h-10 rounded-lg object-cover border border-blue-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-900 text-amber-300 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 text-xs">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {pendingRoomFile.file.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {pendingRoomFile.file.size >= 1024 * 1024
                          ? `${(pendingRoomFile.file.size / (1024 * 1024)).toFixed(2)} MB`
                          : `${Math.max(1, Math.round(pendingRoomFile.file.size / 1024))} KB`}{' '}
                        · Ready to upload
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingRoomFile(null);
                      if (roomFileInputRef.current) roomFileInputRef.current.value = '';
                    }}
                    className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 text-slate-500 dark:text-slate-300"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendRoomMessage} className="flex items-center gap-2">
                <input
                  ref={roomFileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.csv"
                  className="hidden"
                  onChange={(e) => {
                    setRoomFileError(null);
                    readPendingFile(
                      e.target.files?.[0],
                      (att) => setPendingRoomFile(att),
                      (msg) => setRoomFileError(msg)
                    );
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!userProfile) {
                      onOpenAuthModal?.();
                      return;
                    }
                    roomFileInputRef.current?.click();
                  }}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shrink-0"
                  title="Upload file or image (Max 10 MB)"
                >
                  <Paperclip className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span className="hidden sm:inline">Upload File</span>
                </button>

                <input
                  type="text"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder={
                    userProfile
                      ? `Message #${currentRoom.shortName} or attach a file...`
                      : 'Sign in to join the discussion...'
                  }
                  className="flex-1 min-w-0 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />

                <button
                  type="submit"
                  disabled={sendingRoomMsg || (!chatText.trim() && !pendingRoomFile)}
                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-900 hover:bg-blue-950 disabled:opacity-50 px-4 sm:px-5 text-xs font-bold text-white shadow-xs transition-colors shrink-0"
                >
                  {sendingRoomMsg ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{sendingRoomMsg ? 'Uploading...' : 'Send'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* VIEW 2: STRUCTURED TOPIC THREADS + FILE ATTACHMENTS + AI SUMMARY  */}
      {/* ================================================================= */}
      {viewMode === 'threads' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Topics List */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['all', 'study_group', 'class', 'subject', 'general'].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`min-h-[34px] rounded-lg px-3 py-1 text-[11px] font-semibold capitalize whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-blue-900 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="space-y-2.5">
              {filteredTopics.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No topics yet in this category. Click &quot;New Topic&quot; to start one.
                </div>
              ) : (
                filteredTopics.map((topic) => {
                  const isSelected = selectedDiscussion?.id === topic.id;
                  return (
                    <div
                      key={topic.id}
                      onClick={() => {
                        setSelectedDiscussionId(topic.id);
                        setAiSummary(null);
                      }}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-900 bg-blue-900 text-white shadow-md'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              isSelected
                                ? 'bg-amber-400 text-stone-950'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {topic.category.replace('_', ' ')}
                          </span>
                          {topic.attachmentUrl && (
                            <Paperclip
                              className={`w-3 h-3 ${isSelected ? 'text-amber-300' : 'text-blue-600 dark:text-blue-400'}`}
                            />
                          )}
                        </div>
                        <span
                          className={`text-[10px] ${
                            isSelected ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {topic.repliesCount || 0} replies
                        </span>
                      </div>

                      <h4 className="font-serif text-sm font-bold line-clamp-1">
                        {topic.title}
                      </h4>
                      <p
                        className={`text-xs line-clamp-2 mt-1 leading-relaxed ${
                          isSelected ? 'text-blue-100' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {topic.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Selected Topic & Thread */}
          <div className="lg:col-span-2 space-y-6">
            {selectedDiscussion ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-6">
                {/* Topic Header */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {selectedDiscussion.isPinned && (
                          <span className="rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5">
                            PINNED
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 dark:text-slate-400">
                          Posted by{' '}
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {selectedDiscussion.authorName}
                          </span>{' '}
                          ({formatRoleLabel(selectedDiscussion.authorRole)}) ·{' '}
                          {new Date(selectedDiscussion.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100">
                        {selectedDiscussion.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleRunAISummary}
                        disabled={aiSummaryLoading}
                        className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 px-3.5 py-2 text-xs font-bold transition-all shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{aiSummaryLoading ? 'Analyzing...' : 'AI Summary'}</span>
                      </button>

                      {(userProfile?.userId === selectedDiscussion.authorId ||
                        activeRole === 'admin' ||
                        activeRole === 'teacher') && (
                        confirmDeleteTopicId === selectedDiscussion.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteTopic(selectedDiscussion.id)}
                              className="min-h-[38px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-bold"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteTopicId(null)}
                              className="min-h-[38px] rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteTopicId(selectedDiscussion.id)}
                            className="min-h-[38px] rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-2"
                            title="Delete Topic"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 mt-4 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <AIMarkdownMath content={selectedDiscussion.content} />
                    {renderAttachment(
                      selectedDiscussion.attachmentUrl,
                      selectedDiscussion.attachmentName,
                      selectedDiscussion.attachmentSize,
                      selectedDiscussion.attachmentType
                    )}
                  </div>
                </div>

                {/* Gemini AI Discussion Assistant Output */}
                {aiSummary && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/30 p-5 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h4 className="font-serif text-sm font-bold text-slate-900 dark:text-slate-100">
                        Gemini Discussion Executive Summary
                      </h4>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {aiSummary.summary}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/40">
                        <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                          Key Concepts:
                        </span>
                        <ul className="mt-1 space-y-1 text-xs text-slate-800 dark:text-slate-200">
                          {aiSummary.keyConcepts?.map((kc, i) => (
                            <li key={i}>• {kc}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/40">
                        <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                          Suggested Review Questions:
                        </span>
                        <ul className="mt-1 space-y-1 text-xs text-slate-800 dark:text-slate-200">
                          {aiSummary.studyQuestions?.map((sq, i) => (
                            <li key={i}>• {sq}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Replies Thread */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Thread Responses ({activeThreadReplies.length})
                  </h4>

                  <div className="space-y-3">
                    {activeThreadReplies.map((r) => {
                      const canDeleteReply =
                        userProfile?.userId === r.authorId ||
                        activeRole === 'admin' ||
                        activeRole === 'teacher';
                      const confirmingReply = confirmDeleteReplyId === r.id;

                      return (
                        <div
                          key={r.id}
                          className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {r.authorName}{' '}
                              <span className="text-[10px] font-normal text-slate-400 capitalize">
                                ({formatRoleLabel(r.authorRole)})
                              </span>
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-slate-400">
                                {new Date(r.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {canDeleteReply && (
                                confirmingReply ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteReply(r.id, r.discussionId)}
                                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white hover:bg-rose-700"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteReplyId(null)}
                                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteReplyId(r.id)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                    title="Delete reply"
                                    aria-label="Delete reply"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                          <div className="text-slate-700 dark:text-slate-200 leading-relaxed">
                            <AIMarkdownMath content={r.content} />
                          </div>
                          {renderAttachment(
                            r.attachmentUrl,
                            r.attachmentName,
                            r.attachmentSize,
                            r.attachmentType
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reply Input with File Attachment */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  {pendingReplyFile && (
                    <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-3 py-2 flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        Attached: {pendingReplyFile.file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingReplyFile(null);
                          if (replyFileInputRef.current) replyFileInputRef.current.value = '';
                        }}
                        className="text-slate-500 hover:text-rose-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handlePostReply();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      ref={replyFileInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.csv"
                      className="hidden"
                      onChange={(e) =>
                        readPendingFile(
                          e.target.files?.[0],
                          (att) => setPendingReplyFile(att),
                          (msg) => console.warn(msg)
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!userProfile) {
                          onOpenAuthModal?.();
                          return;
                        }
                        replyFileInputRef.current?.click();
                      }}
                      className="min-h-[42px] min-w-[42px] inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0"
                      title="Attach file to reply"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Contribute your thought, solution, or attach notes..."
                      className="flex-1 min-w-0 min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={replyUploading || (!replyContent.trim() && !pendingReplyFile)}
                      className="min-h-[42px] rounded-xl bg-blue-900 hover:bg-blue-950 px-4 py-2 text-xs font-bold text-white disabled:opacity-50 shadow-xs shrink-0"
                    >
                      {replyUploading ? 'Sending...' : 'Reply'}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-xs text-slate-500 dark:text-slate-400">
                Select a topic from the left or create a new discussion topic.
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Topic Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                Start Collaborative Topic
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {topicError && (
              <div className="mb-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                {topicError}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1 text-[11px]">
                  Topic Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Hints for C.Maths Integration Sheet 3"
                  className="w-full min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1 text-[11px]">
                  Forum Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100"
                >
                  <option value="study_group">Peer Study Group</option>
                  <option value="class">Class Discussion</option>
                  <option value="subject">Subject Academic Forum</option>
                  <option value="general">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1 text-[11px]">
                  Discussion Details / Inquiry
                </label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Explain the concept or question you want to discuss with peers and teachers..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1 text-[11px]">
                  Attach Study File or Image (Optional, Max 10 MB)
                </label>
                <input
                  ref={topicFileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.csv"
                  className="hidden"
                  onChange={(e) => {
                    setTopicError(null);
                    readPendingFile(
                      e.target.files?.[0],
                      (att) => setPendingTopicFile(att),
                      (msg) => setTopicError(msg)
                    );
                  }}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => topicFileInputRef.current?.click()}
                    className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                    <span>{pendingTopicFile ? 'Change File' : 'Choose File'}</span>
                  </button>
                  {pendingTopicFile && (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                        {pendingTopicFile.file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingTopicFile(null);
                          if (topicFileInputRef.current) topicFileInputRef.current.value = '';
                        }}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creatingTopic}
                onClick={handleCreateTopic}
                className="min-h-[40px] rounded-lg bg-blue-900 hover:bg-blue-950 disabled:opacity-60 px-5 py-2 text-xs font-bold text-white shadow-xs"
              >
                {creatingTopic ? 'Posting...' : 'Post Topic'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Preview Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl w-full rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 text-white text-xs">
              <span className="font-bold truncate flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
                {lightboxImage.name}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage.url}
                  download={lightboxImage.name}
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/40 max-h-[80vh] overflow-auto">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.name}
                className="max-h-[72vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
