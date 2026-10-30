import React, { useState, useEffect } from 'react';
import {
  MessagesSquare,
  Sparkles,
  Plus,
  MessageCircle,
  Tag,
  Pin,
  Send,
  HelpCircle,
  BrainCircuit,
  ArrowRight,
  X,
  BookOpen,
} from 'lucide-react';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Discussion, DiscussionReply, DiscussionCategory } from '../types';

export const DiscussionsPage: React.FC = () => {
  const { activeRole, userProfile } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // New Reply Input
  const [replyContent, setReplyContent] = useState('');

  // Create Topic Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<DiscussionCategory>('study_group');
  const [newTags, setNewTags] = useState('calculus, study-group');

  // Gemini Discussion Assistant state
  const [aiSummary, setAiSummary] = useState<{
    summary?: string;
    keyConcepts?: string[];
    unansweredQuestions?: string[];
    studyQuestions?: string[];
  } | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  useEffect(() => {
    const unsubDisc = onSnapshot(collection(db, 'discussions'), (snap) => {
      const dList: Discussion[] = [];
      snap.forEach((d) => dList.push(d.data() as Discussion));
      const sorted = dList.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      setDiscussions(sorted);
      if (sorted.length > 0 && !selectedDiscussion) {
        setSelectedDiscussion(sorted[0]);
      }
      setLoading(false);
    });

    const unsubRep = onSnapshot(collection(db, 'discussionReplies'), (snap) => {
      const rList: DiscussionReply[] = [];
      snap.forEach((d) => rList.push(d.data() as DiscussionReply));
      setReplies(rList);
    });

    return () => {
      unsubDisc();
      unsubRep();
    };
  }, [selectedDiscussion]);

  const handleCreateTopic = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      const id = `disc-${Date.now()}`;
      const topic: Discussion = {
        id,
        title: newTitle.trim(),
        content: newContent.trim(),
        authorId: userProfile?.userId || 'zahira_user',
        authorName: userProfile?.fullName || 'Zahira Member',
        authorRole: activeRole,
        category: newCategory,
        classId: 'class-2k28-science-em',
        subjectId: 'sub-cmath',
        tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
        repliesCount: 0,
        isPinned: false,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'discussions', id), topic);
      setSelectedDiscussion(topic);
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
    } catch (e) {
      console.error('Failed to create topic:', e);
    }
  };

  const handlePostReply = async () => {
    if (!selectedDiscussion || !replyContent.trim()) return;
    try {
      const repId = `rep-${Date.now()}`;
      const newRep: DiscussionReply = {
        id: repId,
        discussionId: selectedDiscussion.id,
        authorId: userProfile?.userId || 'zahira_user',
        authorName: userProfile?.fullName || 'Zahira Member',
        authorRole: activeRole,
        content: replyContent.trim(),
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'discussionReplies', repId), newRep);
      setReplyContent('');

      // Update reply count
      await setDoc(
        doc(db, 'discussions', selectedDiscussion.id),
        { repliesCount: (selectedDiscussion.repliesCount || 0) + 1 },
        { merge: true }
      );
    } catch (e) {
      console.error('Failed to post reply:', e);
    }
  };

  const handleRunAISummary = async () => {
    if (!selectedDiscussion) return;
    setAiSummaryLoading(true);

    const threadReplies = replies.filter((r) => r.discussionId === selectedDiscussion.id);
    const postPayload = [
      { authorName: selectedDiscussion.authorName, authorRole: selectedDiscussion.authorRole, content: selectedDiscussion.content },
      ...threadReplies.map((r) => ({ authorName: r.authorName, authorRole: r.authorRole, content: r.content })),
    ];

    try {
      const res = await fetch('/api/gemini/discussion-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicTitle: selectedDiscussion.title,
          category: selectedDiscussion.category,
          posts: postPayload,
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

  const activeThreadReplies = selectedDiscussion
    ? replies.filter((r) => r.discussionId === selectedDiscussion.id)
    : [];

  const filteredTopics = discussions.filter(
    (d) => activeCategory === 'all' || d.category === activeCategory
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
            Collaborative Academic Forums
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Peer study groups, question clarification, and Gemini AI discussion synthesis
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-stone-950 transition-all shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Discussion Topic</span>
        </button>
      </div>

      {/* Main Forum Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Topics List */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['all', 'study_group', 'class', 'general'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredTopics.map((topic) => {
              const isSelected = selectedDiscussion?.id === topic.id;
              return (
                <div
                  key={topic.id}
                  onClick={() => {
                    setSelectedDiscussion(topic);
                    setAiSummary(null);
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-stone-900 bg-stone-900 text-white shadow-md'
                      : 'border-stone-200 bg-white hover:border-stone-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        isSelected ? 'bg-amber-400 text-stone-950' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {topic.category.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                      {topic.repliesCount || 0} replies
                    </span>
                  </div>

                  <h4 className="font-serif text-sm font-bold line-clamp-1">{topic.title}</h4>
                  <p className={`text-xs line-clamp-2 mt-1 leading-relaxed ${isSelected ? 'text-stone-300' : 'text-stone-600'}`}>
                    {topic.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Topic & Thread */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDiscussion && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-6">
              {/* Topic Header */}
              <div className="border-b border-stone-100 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {selectedDiscussion.isPinned && (
                        <span className="rounded bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5">
                          PINNED
                        </span>
                      )}
                      <span className="text-[11px] text-stone-400">
                        Posted by <span className="font-bold text-stone-800">{selectedDiscussion.authorName}</span> ({selectedDiscussion.authorRole}) • {new Date(selectedDiscussion.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-stone-900">
                      {selectedDiscussion.title}
                    </h3>
                  </div>

                  <button
                    onClick={handleRunAISummary}
                    disabled={aiSummaryLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 px-3.5 py-2 text-xs font-bold transition-all shadow-xs shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiSummaryLoading ? 'Analyzing...' : 'Summarize Thread with AI'}</span>
                  </button>
                </div>

                <p className="text-xs text-stone-700 mt-4 leading-relaxed whitespace-pre-line bg-stone-50 p-4 rounded-xl border border-stone-100">
                  {selectedDiscussion.content}
                </p>
              </div>

              {/* Gemini AI Discussion Assistant Output */}
              {aiSummary && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <h4 className="font-serif text-sm font-bold text-stone-900">
                      Gemini Discussion Executive Summary
                    </h4>
                  </div>
                  <p className="text-xs text-stone-800 leading-relaxed font-medium">
                    {aiSummary.summary}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-white border border-amber-200/80">
                      <span className="text-[10px] font-bold uppercase text-stone-500">Key Concepts:</span>
                      <ul className="mt-1 space-y-1 text-xs text-stone-800">
                        {aiSummary.keyConcepts?.map((kc, i) => (
                          <li key={i}>• {kc}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-amber-200/80">
                      <span className="text-[10px] font-bold uppercase text-stone-500">Suggested Review Questions:</span>
                      <ul className="mt-1 space-y-1 text-xs text-stone-800">
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
                <h4 className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                  Thread Responses ({activeThreadReplies.length})
                </h4>

                <div className="space-y-3">
                  {activeThreadReplies.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl border border-stone-100 bg-stone-50/40 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-stone-900">
                          {r.authorName} <span className="text-[10px] font-normal text-stone-400 capitalize">({r.authorRole})</span>
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{r.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Input */}
              <div className="pt-4 border-t border-stone-100">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePostReply();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Contribute your thought or explanation..."
                    className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs text-stone-800 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!replyContent.trim()}
                    className="rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50 shadow-xs"
                  >
                    Reply
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Topic Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Start Collaborative Topic
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Topic Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Hints for Problem Set 3"
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Forum Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                >
                  <option value="study_group">Peer Study Group</option>
                  <option value="class">Class Discussion</option>
                  <option value="subject">Subject Academic Forum</option>
                  <option value="general">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Discussion Details / Inquiry
                </label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Explain the concept or question you want to discuss with peers and teachers..."
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTopic}
                className="rounded-lg bg-stone-900 px-5 py-2 text-xs font-bold text-white hover:bg-stone-800 shadow-xs"
              >
                Post Topic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
