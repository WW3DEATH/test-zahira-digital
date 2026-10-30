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
} from 'lucide-react';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Conversation, DirectMessage } from '../types';

export const MessagesPage: React.FC = () => {
  const { userProfile, activeRole } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv-general');
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchContact, setSearchContact] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time conversations listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'conversations'),
      (snap) => {
        const list: Conversation[] = [];
        snap.forEach((d) => list.push(d.data() as Conversation));
        if (list.length > 0) {
          setConversations(list);
          if (!list.some((c) => c.id === activeConversationId)) {
            setActiveConversationId(list[0].id);
          }
        } else {
          // Initialize default Zahira 2k28 conversation
          const defaultConv: Conversation = {
            id: 'conv-zahira-lead',
            participantIds: ['admin_jaasim', userProfile?.userId || 'student_user'],
            participantNames: {
              admin_jaasim: 'M. N. M. Jaasim (Admin)',
              [userProfile?.userId || 'student_user']: userProfile?.fullName || 'Scholar',
            },
            lastMessage: 'Welcome to Zahira College 2k28 Science EM academic messaging.',
            lastMessageAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setDoc(doc(db, 'conversations', defaultConv.id), defaultConv).catch(() => {});
          setConversations([defaultConv]);
          setActiveConversationId(defaultConv.id);
        }
      },
      (error) => {
        console.warn('Real-time conversations note:', error);
      }
    );
    return () => unsub();
  }, [userProfile?.userId, userProfile?.fullName]);

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

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeConversationId) return;
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

      await setDoc(doc(db, 'messages', msgId), newMsg);

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
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const otherParticipantName = activeConv
    ? Object.entries(activeConv.participantNames).find(([id]) => id !== userProfile?.userId)?.[1] || 'Academic Faculty'
    : 'Conversation';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
            Academic Direct Messaging
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Private 1-on-1 consultations for Zahira College 2k28 Science EM students, faculty, and administration
          </p>
        </div>
      </div>

      {/* Main Messaging Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden h-[650px]">
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
            {conversations.map((c) => {
              const otherName =
                Object.entries(c.participantNames).find(([id]) => id !== userProfile?.userId)?.[1] ||
                'Faculty / Scholar';
              const isSelected = c.id === activeConversationId;

              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConversationId(c.id)}
                  className={`w-full p-4 text-left transition-colors flex items-start gap-3 ${
                    isSelected ? 'bg-amber-50/70 border-l-4 border-amber-500' : 'hover:bg-stone-100/60'
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-900 text-amber-400 text-xs font-bold">
                    {otherName.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-stone-900 truncate">{otherName}</p>
                      {c.lastMessageAt && (
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
            })}
          </div>
        </div>

        {/* Right: Message Stream */}
        <div className="md:col-span-2 flex flex-col h-full bg-white">
          {/* Active Contact Header */}
          <div className="flex items-center justify-between border-b border-stone-200 p-4 bg-stone-50/40">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-amber-400 text-xs font-bold">
                {otherParticipantName.charAt(0)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">{otherParticipantName}</h4>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Academic Channel Active
                </span>
              </div>
            </div>
          </div>

          {/* Messages Bubble Box */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5 bg-[#fcfbfa]">
            {messages.map((m) => {
              const isMine = m.senderId === userProfile?.userId || m.senderName === userProfile?.fullName;

              return (
                <div
                  key={m.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl p-3.5 text-xs shadow-2xs leading-relaxed ${
                      isMine
                        ? 'bg-stone-900 text-white rounded-br-none'
                        : 'bg-white border border-stone-200 text-stone-800 rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className={`text-[10px] font-bold ${isMine ? 'text-amber-400' : 'text-stone-400'}`}>
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
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <div className="border-t border-stone-200 p-3.5 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs text-stone-800 focus:bg-white focus:outline-none focus:border-stone-400 transition-all shadow-xs"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="rounded-xl bg-stone-900 p-2.5 text-white hover:bg-stone-800 disabled:opacity-40 transition-colors shadow-xs"
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
