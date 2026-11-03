import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Search,
  CheckCheck,
  Plus,
  Shield,
  GraduationCap,
  Users,
  Check,
  X,
  Clock,
  AlertCircle,
  UserCheck,
  Lock,
} from 'lucide-react';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, sanitizeFirestoreDoc } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Conversation, DirectMessage, UserProfile } from '../types';
import { sendDirectNotification } from '../services/notificationService';

export const MessagesPage: React.FC = () => {
  const { userProfile, activeRole } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv-zahira-lead');
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchContact, setSearchContact] = useState('');

  // New Chat Modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [modalSearch, setModalSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time user profiles for initiating direct consultations
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'userProfiles'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        const u = d.data() as UserProfile;
        if (u.userId !== userProfile?.userId) {
          list.push(u);
        }
      });
      setAvailableUsers(list);
    });
    return () => unsub();
  }, [userProfile?.userId]);

  // Real-time conversations listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'conversations'),
      (snap) => {
        const list: Conversation[] = [];
        snap.forEach((d) => {
          const conv = d.data() as Conversation;
          // Non-admin users only view conversations they are part of
          if (
            activeRole === 'admin' ||
            (conv.participantIds && conv.participantIds.includes(userProfile?.userId || ''))
          ) {
            list.push(conv);
          }
        });

        if (list.length > 0) {
          setConversations(list);
          if (!list.some((c) => c.id === activeConversationId)) {
            setActiveConversationId(list[0].id);
          }
        } else {
          // Initialize default Zahira 2k28 academic conversation
          const defaultConv: Conversation = {
            id: 'conv-zahira-lead',
            participantIds: ['admin_jaasim', userProfile?.userId || 'student_user'],
            participantNames: {
              admin_jaasim: 'M. N. M. Jaasim (Admin)',
              [userProfile?.userId || 'student_user']: userProfile?.fullName || 'Scholar',
            },
            requestStatus: 'accepted',
            requestedBy: 'admin_jaasim',
            requestedTo: userProfile?.userId || 'student_user',
            lastMessage: 'Welcome to Zahira College 2k28 Science EM academic messaging.',
            lastMessageAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setDoc(doc(db, 'conversations', defaultConv.id), sanitizeFirestoreDoc(defaultConv)).catch(() => {});
          setConversations([defaultConv]);
          setActiveConversationId(defaultConv.id);
        }
      },
      (error) => {
        console.warn('Real-time conversations note:', error);
      }
    );
    return () => unsub();
  }, [userProfile?.userId, userProfile?.fullName, activeRole, activeConversationId]);

  // Listen to messages for active conversation in real time
  useEffect(() => {
    if (!activeConversationId) return;

    try {
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', activeConversationId)
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const msgs: DirectMessage[] = [];
        snapshot.forEach((d) => msgs.push(d.data() as DirectMessage));
        setMessages(msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      });

      return () => unsub();
    } catch (e) {
      console.warn('Messages snapshot listener note:', e);
    }
  }, [activeConversationId]);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const otherParticipantEntry = activeConv
    ? Object.entries(activeConv.participantNames || {}).find(([id]) => id !== userProfile?.userId)
    : null;
  const otherParticipantId = otherParticipantEntry ? otherParticipantEntry[0] : null;
  const otherParticipantName = otherParticipantEntry ? otherParticipantEntry[1] : 'Academic Contact';

  // Request status check
  const requestStatus = activeConv?.requestStatus || 'accepted';
  const isSenderOfRequest = activeConv?.requestedBy === userProfile?.userId;
  const isReceiverOfRequest = activeConv?.requestedTo === userProfile?.userId || (!isSenderOfRequest && requestStatus === 'pending');
  const isChatUnlocked = requestStatus === 'accepted';

  // Accept direct message request
  const handleAcceptRequest = async () => {
    if (!activeConv || !activeConversationId) return;
    try {
      await setDoc(
        doc(db, 'conversations', activeConversationId),
        {
          requestStatus: 'accepted',
          updatedAt: new Date().toISOString(),
          lastMessage: `${userProfile?.fullName || 'User'} accepted the consultation request.`,
          lastMessageAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Notify the requester directly that their request was accepted
      if (activeConv.requestedBy && activeConv.requestedBy !== userProfile?.userId) {
        await sendDirectNotification({
          recipientId: activeConv.requestedBy,
          title: `✅ Academic Chat Request Accepted`,
          message: `${userProfile?.fullName || 'Academic member'} has accepted your consultation request. You can now chat in 1-on-1 messages!`,
          link: 'messages',
          type: 'message',
        });
      }
    } catch (e) {
      console.error('Failed to accept chat request:', e);
    }
  };

  // Decline direct message request
  const handleDeclineRequest = async () => {
    if (!activeConv || !activeConversationId) return;
    try {
      await setDoc(
        doc(db, 'conversations', activeConversationId),
        {
          requestStatus: 'declined',
          updatedAt: new Date().toISOString(),
          lastMessage: `Consultation request declined by ${userProfile?.fullName || 'user'}.`,
          lastMessageAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Failed to decline chat request:', e);
    }
  };

  // Start new direct consultation request with a user
  const handleStartConsultation = async (targetUser: UserProfile) => {
    setShowNewChatModal(false);
    const myId = userProfile?.userId || 'user_anon';
    const myName = userProfile?.fullName || 'Scholar';

    // Check if conversation already exists with this user
    const existing = conversations.find(
      (c) => c.participantIds?.includes(myId) && c.participantIds?.includes(targetUser.userId)
    );

    if (existing) {
      setActiveConversationId(existing.id);
      return;
    }

    // Create new pending conversation
    const newConvId = `conv-${myId}-${targetUser.userId}`;
    const newConv: Conversation = {
      id: newConvId,
      participantIds: [myId, targetUser.userId],
      participantNames: {
        [myId]: myName,
        [targetUser.userId]: targetUser.fullName || 'Academic Member',
      },
      requestStatus: 'pending',
      requestedBy: myId,
      requestedTo: targetUser.userId,
      lastMessage: 'Consultation request sent. Awaiting acceptance.',
      lastMessageAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'conversations', newConvId), sanitizeFirestoreDoc(newConv));
      setActiveConversationId(newConvId);

      // Send direct notification ONLY to the recipient in Notification Center
      await sendDirectNotification({
        recipientId: targetUser.userId,
        title: `💬 New Academic Consultation Request`,
        message: `${myName} (${userProfile?.role || 'scholar'}) has requested a 1-on-1 academic consultation with you. Please accept or decline in Messages.`,
        link: 'messages',
        type: 'message',
      });
    } catch (e) {
      console.error('Failed to create new conversation:', e);
    }
  };

  // Send message in accepted chat
  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeConversationId || !isChatUnlocked) return;
    const text = inputText.trim();
    setInputText('');

    try {
      const msgId = `msg-${Date.now()}`;
      const newMsg: DirectMessage = {
        id: msgId,
        conversationId: activeConversationId,
        senderId: userProfile?.userId || 'zahira_user',
        senderName: userProfile?.fullName || 'Zahira Member',
        text,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'messages', msgId), sanitizeFirestoreDoc(newMsg));

      // Update conversation lastMessage
      await setDoc(
        doc(db, 'conversations', activeConversationId),
        {
          lastMessage: text,
          lastMessageAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Direct message notification sent EXCLUSIVELY to the other participant
      if (otherParticipantId) {
        sendDirectNotification({
          recipientId: otherParticipantId,
          title: `💬 Direct Message from ${userProfile?.fullName || 'Academic Contact'}`,
          message: text.length > 90 ? text.substring(0, 90) + '...' : text,
          link: 'messages',
          type: 'message',
        });
      }
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const otherName =
      Object.entries(c.participantNames || {}).find(([id]) => id !== userProfile?.userId)?.[1] || '';
    return otherName.toLowerCase().includes(searchContact.toLowerCase());
  });

  const filteredAvailableUsers = availableUsers.filter((u) => {
    const q = modalSearch.toLowerCase();
    return (
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
              Academic Direct Messaging
            </h2>
            <span className="rounded-full bg-amber-100 text-amber-900 px-3 py-0.5 text-[11px] font-bold border border-amber-200">
              Private 1-on-1 Consultations
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Secure consultations for Zahira College 2k28 Science EM students, faculty, and administration with Accept/Decline request approval
          </p>
        </div>

        <button
          onClick={() => setShowNewChatModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-900 hover:bg-blue-950 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Direct Consultation</span>
        </button>
      </div>

      {/* Main Messaging Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden h-[670px]">
        {/* Left: Conversation Channels */}
        <div className="border-r border-stone-200 flex flex-col bg-stone-50/50">
          <div className="p-4 border-b border-stone-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white py-1.5 pl-8 pr-3 text-xs text-stone-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No active conversations found.</p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="mt-2 text-blue-700 font-bold hover:underline"
                >
                  Start a consultation
                </button>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const otherName =
                  Object.entries(c.participantNames || {}).find(([id]) => id !== userProfile?.userId)?.[1] ||
                  'Faculty / Scholar';
                const isSelected = c.id === activeConversationId;
                const status = c.requestStatus || 'accepted';

                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConversationId(c.id)}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 ${
                      isSelected ? 'bg-amber-50/80 border-l-4 border-amber-600' : 'hover:bg-stone-100/60'
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-900 text-amber-400 text-xs font-bold">
                      {otherName.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-stone-900 truncate">{otherName}</p>
                        {status === 'pending' && (
                          <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[9px] font-bold shrink-0">
                            Pending
                          </span>
                        )}
                        {status === 'declined' && (
                          <span className="rounded bg-rose-100 text-rose-800 px-1.5 py-0.2 text-[9px] font-bold shrink-0">
                            Declined
                          </span>
                        )}
                        {status === 'accepted' && c.lastMessageAt && (
                          <span className="text-[10px] text-stone-400 shrink-0">
                            {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">
                        {c.lastMessage || 'Start conversation...'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Stream & Action Panel */}
        <div className="md:col-span-2 flex flex-col h-full bg-white">
          {/* Active Contact Header */}
          <div className="flex items-center justify-between border-b border-stone-200 p-4 bg-stone-50/60">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-amber-400 text-xs font-bold">
                {otherParticipantName.charAt(0)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">{otherParticipantName}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {requestStatus === 'accepted' && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Consultation Active • Private 1-on-1
                    </span>
                  )}
                  {requestStatus === 'pending' && (
                    <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Request Pending Acceptance
                    </span>
                  )}
                  {requestStatus === 'declined' && (
                    <span className="text-[10px] text-rose-700 font-semibold flex items-center gap-1">
                      <X className="w-3 h-3 text-rose-600" />
                      Consultation Declined
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* REQUEST ACCEPT / DECLINE PROMPT */}
          {requestStatus === 'pending' && (
            <div className="p-4 border-b border-amber-200 bg-amber-50/90">
              {isReceiverOfRequest ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-950">
                        Academic Consultation Request Received
                      </h4>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        <strong>{otherParticipantName}</strong> would like to connect in private direct messaging. Accept to begin chatting or decline.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={handleAcceptRequest}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white transition-colors shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Request</span>
                    </button>
                    <button
                      onClick={handleDeclineRequest}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-700 transition-colors shadow-2xs"
                    >
                      <X className="w-3.5 h-3.5 text-rose-600" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-900">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <p>
                    <strong>Consultation Request Sent:</strong> Awaiting approval from{' '}
                    <strong>{otherParticipantName}</strong>. Messaging will unlock automatically once accepted.
                  </p>
                </div>
              )}
            </div>
          )}

          {requestStatus === 'declined' && (
            <div className="p-4 border-b border-rose-200 bg-rose-50/80 flex items-center gap-2.5 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <p>
                This academic consultation request was declined. Private messaging is locked for this channel.
              </p>
            </div>
          )}

          {/* Messages Bubble Box */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5 bg-[#fcfbfa]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-stone-400">
                <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-stone-600" />
                <p className="text-xs font-semibold text-stone-600">
                  {requestStatus === 'pending'
                    ? 'Consultation request awaiting approval'
                    : 'No messages yet in this consultation'}
                </p>
                <p className="text-[11px] text-stone-400 mt-1 max-w-sm">
                  {requestStatus === 'accepted'
                    ? 'Send a message below. Notifications are delivered exclusively to the receiver in their Notification Center.'
                    : 'Messaging will unlock once the recipient accepts this academic consultation request.'}
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMine = m.senderId === userProfile?.userId || m.senderName === userProfile?.fullName;

                return (
                  <div
                    key={m.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl p-3.5 text-xs shadow-2xs leading-relaxed ${
                        isMine
                          ? 'bg-blue-900 text-white rounded-br-none'
                          : 'bg-white border border-stone-200 text-stone-800 rounded-bl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span className={`text-[10px] font-bold ${isMine ? 'text-amber-300' : 'text-stone-500'}`}>
                          {m.senderName}
                        </span>
                        <span className="text-[9px] opacity-60">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <div className="border-t border-stone-200 p-3.5 bg-white">
            {isChatUnlocked ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={`Message ${otherParticipantName}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs text-stone-800 focus:bg-white focus:outline-none focus:border-blue-900 transition-all shadow-xs"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="rounded-xl bg-blue-900 p-2.5 text-white hover:bg-blue-950 disabled:opacity-40 transition-colors shadow-xs"
                  title="Send message (Notifies recipient only)"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                </button>
              </form>
            ) : (
              <div className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-stone-400" />
                <span>
                  {requestStatus === 'declined'
                    ? 'Direct messaging is closed because the request was declined.'
                    : isReceiverOfRequest
                    ? 'Please accept or decline the consultation request above to unlock messaging.'
                    : 'Messaging locked while waiting for the recipient to accept the consultation request.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NEW CONSULTATION / USER PICKER MODAL */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  New Direct Consultation
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Select a student, teacher, parent, or admin to send a direct message request
                </p>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="rounded-lg p-1.5 hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by name, role, or email..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 rounded-xl border border-stone-100">
              {filteredAvailableUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">
                  No academic users found matching your search.
                </div>
              ) : (
                filteredAvailableUsers.map((u) => (
                  <div
                    key={u.userId}
                    className="p-3 flex items-center justify-between hover:bg-stone-50 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-stone-900 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {u.fullName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-stone-900">{u.fullName}</p>
                          <span
                            className={`rounded px-2 py-0.2 text-[9px] font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-rose-100 text-rose-800'
                                : u.role === 'teacher'
                                ? 'bg-blue-100 text-blue-900'
                                : u.role === 'parent'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {u.email} {u.stream ? `• ${u.stream}` : u.subject ? `• ${u.subject}` : ''}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartConsultation(u)}
                      className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white font-bold text-[11px] transition-colors shrink-0 shadow-2xs"
                    >
                      Request Chat
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
              <span>A notification will be sent solely to the recipient.</span>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="font-bold text-stone-600 hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
