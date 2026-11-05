import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  School,
  BookOpen,
  GraduationCap,
  Users,
  Bell,
  Calendar,
  BookMarked,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  X,
  Search,
  Sparkles,
  AlertCircle,
  Megaphone,
  Layers,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  MessageCircle,
  Send,
  ShieldAlert,
  FileText,
  Download,
  UserCheck,
  Eye,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  addDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, sanitizeFirestoreDoc } from '../firebase';
import { useSiteConfig } from '../context/SiteConfigContext';
import {
  SchoolSetting,
  Subject,
  SchoolClass,
  UserProfile,
  Announcement,
  SchoolEvent,
  LearningMaterial,
  UserRole,
  Conversation,
  DirectMessage,
} from '../types';
import { REAL_ADMIN_PROFILE, SEED_INITIAL_USERS } from '../services/dataService';

type AdminTab =
  | 'branding'
  | 'subjects'
  | 'classes'
  | 'users'
  | 'chats'
  | 'announcements'
  | 'calendar'
  | 'materials';

interface AdminMasterControlPageProps {
  initialTab?: AdminTab;
  onNavigate?: (page: string) => void;
}

export const AdminMasterControlPage: React.FC<AdminMasterControlPageProps> = ({
  initialTab = 'branding',
  onNavigate,
}) => {
  const { siteConfig, updateSiteConfig } = useSiteConfig();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const tabsContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -260 : 260,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Form state for Site Branding
  const [brandingForm, setBrandingForm] = useState<SchoolSetting>(siteConfig);

  // Firestore real-time collections
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);

  // Personal Chats Oversight State (Admin view of private 1-to-1 conversations)
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [convMessages, setConvMessages] = useState<DirectMessage[]>([]);
  const [chatSearch, setChatSearch] = useState<string>('');
  const [chatRoleFilter, setChatRoleFilter] = useState<'all' | 'students' | 'teachers' | 'parents'>('all');
  const [adminReplyText, setAdminReplyText] = useState<string>('');

  // Modals & temporary editing states
  const [editingSubject, setEditingSubject] = useState<Partial<Subject> | null>(null);
  const [editingClass, setEditingClass] = useState<Partial<SchoolClass> | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<UserProfile> | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<Announcement> | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<SchoolEvent> | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Partial<LearningMaterial> | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Appoint User Role Modal State
  const [showAppointModal, setShowAppointModal] = useState(false);
  const [appointName, setAppointName] = useState('');
  const [appointEmail, setAppointEmail] = useState('');
  const [appointRole, setAppointRole] = useState<UserRole>('student');
  const [appointDetail, setAppointDetail] = useState('');

  useEffect(() => {
    setBrandingForm(siteConfig);
  }, [siteConfig]);

  // Helper to seed realistic academic demo conversations if none exist in Firestore
  const seedAuditConversations = async (): Promise<Conversation[]> => {
    const defaultConvs: { conv: Conversation; messages: DirectMessage[] }[] = [
      {
        conv: {
          id: 'conv-audit-bio-1',
          participantIds: ['student_aadhil', 'teacher_kareem'],
          participantNames: {
            student_aadhil: 'M. R. Mohamed Aadhil (Student - 2K28-SCI-001)',
            teacher_kareem: 'Dr. A. Kareem (Faculty - Biology Department)',
          },
          lastMessage: 'Sir, could you please verify the DNA extraction lab report hypothesis before submission?',
          lastMessageAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        },
        messages: [
          {
            id: 'msg-audit-1',
            conversationId: 'conv-audit-bio-1',
            senderId: 'student_aadhil',
            senderName: 'M. R. Mohamed Aadhil (Student)',
            text: 'Assalamu Alaikum Dr. Kareem, for the Biology practical report on DNA Extraction from Onion Cells, should we include standard deviations in Table 2?',
            createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          },
          {
            id: 'msg-audit-2',
            conversationId: 'conv-audit-bio-1',
            senderId: 'teacher_kareem',
            senderName: 'Dr. A. Kareem (Teacher)',
            text: 'Wa Alaikum Assalam Aadhil. Yes, standard deviations and error bars are required as per Cambridge/GCE Advanced Level bio-science specifications.',
            createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
          },
          {
            id: 'msg-audit-3',
            conversationId: 'conv-audit-bio-1',
            senderId: 'student_aadhil',
            senderName: 'M. R. Mohamed Aadhil (Student)',
            text: 'Sir, could you please verify the DNA extraction lab report hypothesis before submission?',
            createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
          },
        ],
      },
      {
        conv: {
          id: 'conv-audit-math-2',
          participantIds: ['student_zahra', 'teacher_fazil'],
          participantNames: {
            student_zahra: 'Fathima Zahra (Student - 2K28-SCI-002)',
            teacher_fazil: 'Eng. M. Fazil (Faculty - Combined Mathematics)',
          },
          lastMessage: 'Understood sir, I will complete the trigonometric differentiation problem set by Friday.',
          lastMessageAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        },
        messages: [
          {
            id: 'msg-audit-4',
            conversationId: 'conv-audit-math-2',
            senderId: 'student_zahra',
            senderName: 'Fathima Zahra (Student)',
            text: 'Good afternoon Sir Fazil, should we solve Question 8 in Calculus using integration by parts or trigonometric substitution?',
            createdAt: new Date(Date.now() - 1000 * 60 * 135).toISOString(),
          },
          {
            id: 'msg-audit-5',
            conversationId: 'conv-audit-math-2',
            senderId: 'teacher_fazil',
            senderName: 'Eng. M. Fazil (Teacher)',
            text: 'Substitute x = a*tan(theta) first; that transforms the radical into a standard secant integral.',
            createdAt: new Date(Date.now() - 1000 * 60 * 128).toISOString(),
          },
          {
            id: 'msg-audit-6',
            conversationId: 'conv-audit-math-2',
            senderId: 'student_zahra',
            senderName: 'Fathima Zahra (Student)',
            text: 'Understood sir, I will complete the trigonometric differentiation problem set by Friday.',
            createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          },
        ],
      },
      {
        conv: {
          id: 'conv-audit-parent-3',
          participantIds: ['parent_rizwan', 'admin_jaasim'],
          participantNames: {
            parent_rizwan: 'Rizwan Hamza (Parent of Hamza Rizwan)',
            admin_jaasim: 'M. N. M. Jaasim (Admin)',
          },
          lastMessage: 'Thank you for the update on the 2k28 Science EM term schedule and mock exam dates.',
          lastMessageAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        },
        messages: [
          {
            id: 'msg-audit-7',
            conversationId: 'conv-audit-parent-3',
            senderId: 'parent_rizwan',
            senderName: 'Rizwan Hamza (Parent)',
            text: 'Respected Administrator Jaasim, Hamza mentioned the 2k28 Science batch has supplementary physics revision sessions on Saturdays. Is attendance mandatory?',
            createdAt: new Date(Date.now() - 1000 * 60 * 260).toISOString(),
          },
          {
            id: 'msg-audit-8',
            conversationId: 'conv-audit-parent-3',
            senderId: 'admin_jaasim',
            senderName: 'M. N. M. Jaasim (Admin)',
            text: 'Dear Mr. Rizwan, Saturday sessions cover advanced mechanics problem-solving. While strongly recommended for high A* targets, attendance records are tracked in the portal.',
            createdAt: new Date(Date.now() - 1000 * 60 * 248).toISOString(),
          },
          {
            id: 'msg-audit-9',
            conversationId: 'conv-audit-parent-3',
            senderId: 'parent_rizwan',
            senderName: 'Rizwan Hamza (Parent)',
            text: 'Thank you for the update on the 2k28 Science EM term schedule and mock exam dates.',
            createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
          },
        ],
      },
    ];

    const list: Conversation[] = [];
    try {
      for (const item of defaultConvs) {
        await setDoc(doc(db, 'conversations', item.conv.id), sanitizeFirestoreDoc(item.conv));
        for (const m of item.messages) {
          await setDoc(doc(db, 'messages', m.id), sanitizeFirestoreDoc(m));
        }
        list.push(item.conv);
      }
    } catch (e) {
      console.warn('Seeding audit conversations note:', e);
    }
    return list;
  };

  // Real-time synchronization for all entities
  useEffect(() => {
    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snap) => {
      const list: Subject[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Subject));
      setSubjects(list);
    });

    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      const list: SchoolClass[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as SchoolClass));
      setClasses(list);
    });

    const unsubUsers = onSnapshot(collection(db, 'userProfiles'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as UserProfile), userId: d.id }));
      if (list.length > 0) {
        if (!list.some((u) => u.email?.toLowerCase() === 'mnmjaasim@gmail.com')) {
          list.unshift(REAL_ADMIN_PROFILE);
        }
        setUsers(list);
      } else {
        setUsers([REAL_ADMIN_PROFILE, ...SEED_INITIAL_USERS]);
      }
    });

    const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snap) => {
      const list: Announcement[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Announcement));
      setAnnouncements(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });

    const unsubEvents = onSnapshot(collection(db, 'schoolEvents'), (snap) => {
      const list: SchoolEvent[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as SchoolEvent));
      setEvents(list.sort((a, b) => a.startDate.localeCompare(b.startDate)));
    });

    const unsubMaterials = onSnapshot(collection(db, 'learningMaterials'), (snap) => {
      const list: LearningMaterial[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as LearningMaterial));
      setMaterials(list);
    });

    const unsubConversations = onSnapshot(collection(db, 'conversations'), async (snap) => {
      const list: Conversation[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Conversation));
      if (list.length > 0) {
        const sorted = list.sort(
          (a, b) =>
            new Date(b.updatedAt || b.lastMessageAt || 0).getTime() -
            new Date(a.updatedAt || a.lastMessageAt || 0).getTime()
        );
        setConversations(sorted);
        setSelectedConvId((prev) => (prev && sorted.some((c) => c.id === prev) ? prev : sorted[0].id));
      } else {
        const seeded = await seedAuditConversations();
        setConversations(seeded);
        if (seeded.length > 0) setSelectedConvId(seeded[0].id);
      }
    });

    return () => {
      unsubSubjects();
      unsubClasses();
      unsubUsers();
      unsubAnnouncements();
      unsubEvents();
      unsubMaterials();
      unsubConversations();
    };
  }, []);

  // Real-time messages listener for the selected conversation
  useEffect(() => {
    if (!selectedConvId) {
      setConvMessages([]);
      return;
    }

    try {
      const q = query(collection(db, 'messages'), where('conversationId', '==', selectedConvId));
      const unsub = onSnapshot(q, (snapshot) => {
        const msgs: DirectMessage[] = [];
        snapshot.forEach((d) => msgs.push({ id: d.id, ...d.data() } as DirectMessage));
        setConvMessages(msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      });
      return () => unsub();
    } catch (e) {
      console.warn('Real-time messages listener note:', e);
    }
  }, [selectedConvId]);

  // Chat Audit Action Handlers
  const handleAdminSendDirective = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminReplyText.trim() || !selectedConvId) return;
    const text = adminReplyText.trim();
    setAdminReplyText('');

    const msgId = `msg-admin-directive-${Date.now()}`;
    const newMsg: DirectMessage = {
      id: msgId,
      conversationId: selectedConvId,
      senderId: 'admin_jaasim',
      senderName: 'M. N. M. Jaasim (Admin Oversight)',
      text: `[OFFICIAL ADMIN DIRECTIVE]: ${text}`,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'messages', msgId), sanitizeFirestoreDoc(newMsg));
      await setDoc(
        doc(db, 'conversations', selectedConvId),
        {
          lastMessage: `[Admin Directive]: ${text}`,
          lastMessageAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      triggerNotice('Official administrative directive dispatched to conversation.');
    } catch (err: any) {
      alert('Error sending admin intervention: ' + err.message);
    }
  };

  const handleExportTranscript = (conv: Conversation, msgs: DirectMessage[]) => {
    const participants = Object.values(conv.participantNames).join(' & ');
    let output = `========================================================\n`;
    output += `ZAHIRA COLLEGE 2K28 SCIENCE EM - OFFICIAL CHAT AUDIT\n`;
    output += `CONVERSATION ID: ${conv.id}\n`;
    output += `PARTICIPANTS: ${participants}\n`;
    output += `AUDIT EXPORTED AT: ${new Date().toLocaleString()}\n`;
    output += `TOTAL MESSAGES: ${msgs.length}\n`;
    output += `========================================================\n\n`;

    msgs.forEach((m, idx) => {
      output += `[${idx + 1}] ${new Date(m.createdAt).toLocaleString()} | From: ${m.senderName}\n`;
      output += `    ${m.text}\n\n`;
    });

    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit_Chat_${conv.id}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    triggerNotice('Chat transcript downloaded successfully!');
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (selectedConvId === convId) setSelectedConvId(null);
      await deleteDoc(doc(db, 'conversations', convId));
      triggerNotice('Conversation permanently deleted from Firebase.');
    } catch (err: any) {
      triggerNotice('Error removing conversation: ' + err.message);
    }
  };

  const triggerNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  // 1. Save Branding
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSiteConfig(brandingForm);
      triggerNotice('Institutional website details updated live!');
    } catch (err: any) {
      triggerNotice('Error updating branding: ' + err.message);
    }
  };

  // 2. Subject Actions
  const handleSaveSubject = async () => {
    if (!editingSubject?.name || !editingSubject?.code) return;
    const id = editingSubject.id || `sub-${Date.now()}`;
    const payload: Subject = {
      id,
      name: editingSubject.name,
      code: editingSubject.code,
      description: editingSubject.description || '',
      color: editingSubject.color || '#1e3a8a',
      teacherIds: editingSubject.teacherIds || ['admin_jaasim'],
      classIds: editingSubject.classIds || ['class-2k28-science-em'],
      createdAt: editingSubject.createdAt || new Date().toISOString(),
    };
    await setDoc(doc(db, 'subjects', id), payload, { merge: true });
    setEditingSubject(null);
    triggerNotice(`Subject "${payload.name}" saved!`);
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    try {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      await deleteDoc(doc(db, 'subjects', id));
      triggerNotice(`Subject "${name}" deleted from Firebase.`);
    } catch (err: any) {
      triggerNotice(`Failed to delete subject: ${err.message}`);
    }
  };

  // 3. Class Actions
  const handleSaveClass = async () => {
    if (!editingClass?.name) return;
    const id = editingClass.id || `class-${Date.now()}`;
    const payload: SchoolClass = {
      id,
      name: editingClass.name,
      grade: editingClass.grade || 'A/L Batch 2028',
      academicYear: editingClass.academicYear || '2026-2028',
      description: editingClass.description || '',
      room: editingClass.room || 'Science Complex - Hall 28',
      teacherIds: editingClass.teacherIds || [],
      studentIds: editingClass.studentIds || [],
      subjectIds: editingClass.subjectIds || [],
      createdAt: editingClass.createdAt || new Date().toISOString(),
    };
    await setDoc(doc(db, 'classes', id), payload, { merge: true });
    setEditingClass(null);
    triggerNotice(`Class "${payload.name}" saved!`);
  };

  const handleDeleteClass = async (id: string, name: string) => {
    try {
      setClasses((prev) => prev.filter((c) => c.id !== id));
      await deleteDoc(doc(db, 'classes', id));
      triggerNotice(`Class "${name}" deleted from Firebase.`);
    } catch (err: any) {
      triggerNotice(`Failed to delete class: ${err.message}`);
    }
  };

  // 4. User Actions
  const handleSaveUser = async () => {
    if (!editingUser?.userId || !editingUser?.email) return;
    const payload = sanitizeFirestoreDoc({
      ...editingUser,
      avatarUrl: editingUser.avatarUrl || '',
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'userProfiles', editingUser.userId), payload, { merge: true });
    setEditingUser(null);
    triggerNotice(`User "${editingUser.fullName}" updated!`);
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (userId === 'admin_jaasim' || userId === 'admin_jaasim_official') {
      triggerNotice('Cannot delete primary administrator account.');
      return;
    }
    try {
      setUsers((prev) => prev.filter((u) => u.userId !== userId));
      await deleteDoc(doc(db, 'userProfiles', userId));
      triggerNotice(`User "${name}" deleted from Firebase database.`);
    } catch (err: any) {
      triggerNotice(`Failed to delete user: ${err.message}`);
    }
  };

  const handleQuickAppointRole = async (userId: string, newRole: UserRole, userName?: string) => {
    try {
      await setDoc(
        doc(db, 'userProfiles', userId),
        { role: newRole, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      triggerNotice(`Role for "${userName || 'User'}" appointed to ${newRole.toUpperCase()} successfully!`);
    } catch (err: any) {
      alert('Error updating user role: ' + err.message);
    }
  };

  const handleCreateAndAppointUser = async () => {
    if (!appointName.trim() || !appointEmail.trim()) {
      alert('Please enter user full name and email address.');
      return;
    }
    const newId = `user-${Date.now()}`;
    const newProfile: UserProfile = {
      userId: newId,
      fullName: appointName.trim(),
      email: appointEmail.trim().toLowerCase(),
      role: appointRole,
      bio: appointDetail.trim() || `${appointRole.toUpperCase()} • Zahira College 2k28 Science EM`,
      subject: appointRole === 'teacher' ? (appointDetail.trim() || 'General Science') : undefined,
      stream: appointRole === 'student' ? (appointDetail.trim() || '2k28 Science EM') : undefined,
      avatarUrl: '',
      assignedClassIds: ['class-2k28-science-em'],
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'userProfiles', newId), sanitizeFirestoreDoc(newProfile));
      setShowAppointModal(false);
      setAppointName('');
      setAppointEmail('');
      setAppointDetail('');
      setAppointRole('student');
      triggerNotice(`User "${newProfile.fullName}" appointed as ${appointRole.toUpperCase()} successfully!`);
    } catch (err: any) {
      alert('Error appointing user role: ' + err.message);
    }
  };

  // 5. Announcement Actions
  const handleSaveAnnouncement = async () => {
    if (!editingAnnouncement?.title || !editingAnnouncement?.content) return;
    const id = editingAnnouncement.id || `ann-${Date.now()}`;
    const payload: Announcement = {
      id,
      title: editingAnnouncement.title,
      content: editingAnnouncement.content,
      authorId: 'admin_jaasim',
      authorName: 'M. N. M. Jaasim (Admin)',
      authorRole: 'admin',
      audience: (editingAnnouncement.audience as any) || 'all',
      isPinned: !!editingAnnouncement.isPinned,
      createdAt: editingAnnouncement.createdAt || new Date().toISOString(),
    };
    await setDoc(doc(db, 'announcements', id), payload, { merge: true });
    setEditingAnnouncement(null);
    triggerNotice('Announcement published live!');
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      await deleteDoc(doc(db, 'announcements', id));
      triggerNotice('Announcement deleted from Firebase.');
    } catch (err: any) {
      triggerNotice(`Failed to delete announcement: ${err.message}`);
    }
  };

  // 6. Calendar Event Actions
  const handleSaveEvent = async () => {
    if (!editingEvent?.title || !editingEvent?.startDate) return;
    const id = editingEvent.id || `event-${Date.now()}`;
    const payload: SchoolEvent = {
      id,
      title: editingEvent.title,
      description: editingEvent.description || '',
      startDate: editingEvent.startDate,
      endDate: editingEvent.endDate || editingEvent.startDate,
      time: editingEvent.time || '08:00 AM',
      type: editingEvent.type || 'academic',
      location: editingEvent.location || 'Science Complex',
      createdBy: 'admin_jaasim',
      createdByName: 'M. N. M. Jaasim (Admin)',
      createdAt: editingEvent.createdAt || new Date().toISOString(),
    };
    await setDoc(doc(db, 'schoolEvents', id), payload, { merge: true });
    setEditingEvent(null);
    triggerNotice(`Event "${payload.title}" saved to calendar!`);
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    try {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      await deleteDoc(doc(db, 'schoolEvents', id));
      triggerNotice(`Event "${title}" deleted from Firebase.`);
    } catch (err: any) {
      triggerNotice(`Failed to delete event: ${err.message}`);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      (u.fullName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Filtered personal conversations for Admin oversight
  const filteredConversations = conversations.filter((c) => {
    const participantText = Object.values(c.participantNames || {}).join(' ').toLowerCase();
    const lastMsgText = (c.lastMessage || '').toLowerCase();
    const query = chatSearch.toLowerCase();
    const matchesSearch =
      !query || participantText.includes(query) || lastMsgText.includes(query) || c.id.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (chatRoleFilter === 'all') return true;
    if (chatRoleFilter === 'students') {
      return (
        participantText.includes('student') ||
        participantText.includes('scholar') ||
        participantText.includes('2k28') ||
        c.participantIds.some((id) => id.includes('student'))
      );
    }
    if (chatRoleFilter === 'teachers') {
      return (
        participantText.includes('faculty') ||
        participantText.includes('dr.') ||
        participantText.includes('eng.') ||
        participantText.includes('teacher') ||
        c.participantIds.some((id) => id.includes('teacher'))
      );
    }
    if (chatRoleFilter === 'parents') {
      return (
        participantText.includes('parent') ||
        c.participantIds.some((id) => id.includes('parent'))
      );
    }
    return true;
  });

  const currentSelectedConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner - Royal Blue & Crimson Red Theme */}
      <div className="rounded-2xl border border-blue-900 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Zahira College Mawanella • Master Admin Control</span>
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-white mt-2">
              Website & School Administration Panel
            </h1>
            <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-2xl">
              Complete real-time control center for Zahira College 2k28 Science EM. Edit site branding, curriculum subjects, class cohorts, user permissions, announcements, calendar dates, and resources.
            </p>
          </div>

          {savedNotice && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-blue-950 shadow-lg border border-blue-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedNotice}</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs with Horizontal Scroll Bar & Arrows */}
        <div className="mt-6 relative">
          <div className="flex items-center gap-2">
            {/* Scroll Left Button */}
            <button
              type="button"
              onClick={() => scrollTabs('left')}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white shrink-0 transition-all shadow-xs border border-white/20"
              title="Scroll options left"
              aria-label="Scroll options left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Horizontal Scrollable Tabs Container */}
            <div
              ref={tabsContainerRef}
              className="flex-1 flex items-center gap-2 admin-horizontal-scrollbar pb-3 pt-1 text-xs font-semibold scroll-smooth"
            >
              {[
                { id: 'branding', label: 'Website Identity', icon: School },
                { id: 'subjects', label: `Subjects (${subjects.length})`, icon: BookOpen },
                { id: 'classes', label: `Classes (${classes.length})`, icon: GraduationCap },
                { id: 'users', label: `Users & Roles (${users.length})`, icon: Users },
                { id: 'chats', label: `Personal Chats (${conversations.length})`, icon: MessageSquare },
                { id: 'announcements', label: `Notices (${announcements.length})`, icon: Bell },
                { id: 'calendar', label: `Calendar Events (${events.length})`, icon: Calendar },
                { id: 'materials', label: `Materials (${materials.length})`, icon: BookMarked },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as AdminTab)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 whitespace-nowrap transition-all shrink-0 ${
                      isActive
                        ? 'bg-white text-blue-950 shadow-md font-bold ring-2 ring-red-500'
                        : 'bg-white/10 text-white/90 hover:bg-white/20 hover:text-white border border-white/10'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-blue-200'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scroll Right Button */}
            <button
              type="button"
              onClick={() => scrollTabs('right')}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white shrink-0 transition-all shadow-xs border border-white/20"
              title="Scroll options right"
              aria-label="Scroll options right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Horizontal Scroll Helper & Status */}
          <div className="flex items-center justify-between text-[11px] text-blue-200 mt-1 px-1">
            <span className="flex items-center gap-1.5 opacity-90">
              <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span>Scroll horizontally or use arrow buttons to access all 8 administration modules</span>
            </span>
            <span className="font-mono text-[10px] bg-blue-900/80 border border-blue-400/30 px-2.5 py-0.5 rounded-full text-blue-100">
              Active: {activeTab.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: WEBSITE BRANDING & IDENTITY */}
      {activeTab === 'branding' && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-blue-50">
            <div>
              <h2 className="font-serif text-xl font-bold text-blue-950">
                Institutional Brand & Website Information
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Changes saved here update headers, footers, page titles, and announcement marquees across the entire website live.
              </p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
              Live Real-Time Sync
            </span>
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  School Name
                </label>
                <input
                  type="text"
                  required
                  value={brandingForm.schoolName}
                  onChange={(e) => setBrandingForm({ ...brandingForm, schoolName: e.target.value })}
                  placeholder="e.g. Zahira College Mawanella"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Cohort / Batch Subtitle
                </label>
                <input
                  type="text"
                  required
                  value={brandingForm.cohortName}
                  onChange={(e) => setBrandingForm({ ...brandingForm, cohortName: e.target.value })}
                  placeholder="e.g. 2k28 Science EM"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Academic Year Period
                </label>
                <input
                  type="text"
                  required
                  value={brandingForm.academicYear}
                  onChange={(e) => setBrandingForm({ ...brandingForm, academicYear: e.target.value })}
                  placeholder="e.g. 2026-2028"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Academic Motto
                </label>
                <input
                  type="text"
                  value={brandingForm.motto || ''}
                  onChange={(e) => setBrandingForm({ ...brandingForm, motto: e.target.value })}
                  placeholder="e.g. Excellence in Science, Knowledge, and Discipline"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Administrative Email
                </label>
                <input
                  type="email"
                  required
                  value={brandingForm.contactEmail}
                  onChange={(e) => setBrandingForm({ ...brandingForm, contactEmail: e.target.value })}
                  placeholder="e.g. mnmjaasim@gmail.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Campus Phone
                </label>
                <input
                  type="text"
                  value={brandingForm.contactPhone || ''}
                  onChange={(e) => setBrandingForm({ ...brandingForm, contactPhone: e.target.value })}
                  placeholder="e.g. +94 11 269 4151"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Campus Location / Address
                </label>
                <input
                  type="text"
                  value={brandingForm.address}
                  onChange={(e) => setBrandingForm({ ...brandingForm, address: e.target.value })}
                  placeholder="e.g. Zahira College, Mawanella, Sri Lanka"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-blue-950 uppercase tracking-wider block mb-1 text-[11px]">
                  Science Hall / Room Designation
                </label>
                <input
                  type="text"
                  value={brandingForm.room || ''}
                  onChange={(e) => setBrandingForm({ ...brandingForm, room: e.target.value })}
                  placeholder="e.g. Science Complex - Hall 28"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Top Marquee Announcement Ticker */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-red-600" />
                  <span className="font-bold text-blue-950">Top Website Marquee Announcement Banner</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-900">
                  <input
                    type="checkbox"
                    checked={brandingForm.showMarquee !== false}
                    onChange={(e) => setBrandingForm({ ...brandingForm, showMarquee: e.target.checked })}
                    className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                  />
                  <span>Show Ticker at Top of Website</span>
                </label>
              </div>
              <input
                type="text"
                value={brandingForm.marqueeNotice || ''}
                onChange={(e) => setBrandingForm({ ...brandingForm, marqueeNotice: e.target.value })}
                placeholder="e.g. Welcome to Zahira College 2k28 Science EM • Term 1 Lecture Schedule Active"
                className="w-full rounded-xl border border-blue-200 bg-white p-2.5 text-slate-900 font-medium focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold px-6 py-3 text-xs shadow-md transition-colors"
              >
                <Save className="w-4 h-4 text-red-500" />
                <span>Save & Apply Website Identity</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SUBJECTS MANAGER */}
      {activeTab === 'subjects' && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-50">
            <div>
              <h2 className="font-serif text-xl font-bold text-blue-950">
                Curriculum Subjects Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add, edit codes, syllabus descriptions, and colors for all Advanced Level subjects.
              </p>
            </div>
            <button
              onClick={() =>
                setEditingSubject({
                  name: '',
                  code: '',
                  description: '',
                  color: '#1e3a8a',
                })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 text-xs shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Subject</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="px-2.5 py-0.5 rounded-md text-[10px] font-bold text-white uppercase tracking-wider"
                      style={{ backgroundColor: sub.color || '#1e3a8a' }}
                    >
                      {sub.code}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingSubject(sub)}
                        className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-slate-100"
                        title="Edit Subject"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(sub.id, sub.name)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-serif text-base font-bold text-blue-950">{sub.name}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-3">
                    {sub.description || 'Core Zahira College Science EM Subject.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Class: 2k28 Science EM</span>
                  <span className="font-semibold text-blue-900">Active Syllabus</span>
                </div>
              </div>
            ))}
          </div>

          {/* Subject Edit Modal */}
          {editingSubject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-blue-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-serif text-lg font-bold text-blue-950">
                    {editingSubject.id ? 'Edit Subject' : 'Add Subject'}
                  </h3>
                  <button onClick={() => setEditingSubject(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Subject Name</label>
                    <input
                      type="text"
                      value={editingSubject.name || ''}
                      onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                      placeholder="e.g. Combined Mathematics"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Subject Code</label>
                    <input
                      type="text"
                      value={editingSubject.code || ''}
                      onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })}
                      placeholder="e.g. CMATH-28"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Description / Syllabus</label>
                    <textarea
                      rows={3}
                      value={editingSubject.description || ''}
                      onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
                      placeholder="Topics covered, practical components..."
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Badge Color Hex</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingSubject.color || '#1e3a8a'}
                        onChange={(e) => setEditingSubject({ ...editingSubject, color: e.target.value })}
                        className="h-9 w-12 rounded cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={editingSubject.color || '#1e3a8a'}
                        onChange={(e) => setEditingSubject({ ...editingSubject, color: e.target.value })}
                        className="flex-1 rounded-xl border border-slate-200 p-2 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingSubject(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSubject}
                    className="px-5 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950"
                  >
                    Save Subject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CLASSES & COHORTS */}
      {activeTab === 'classes' && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-50">
            <div>
              <h2 className="font-serif text-xl font-bold text-blue-950">
                School Classes & Cohorts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure classroom sections, rooms, and academic year designations.
              </p>
            </div>
            <button
              onClick={() =>
                setEditingClass({
                  name: '',
                  grade: 'A/L Batch 2028',
                  academicYear: '2026-2028',
                  room: 'Science Complex - Hall 28',
                  description: '',
                })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 text-xs shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Class</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold text-[10px] uppercase">
                      {c.grade}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingClass(c)}
                        className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(c.id, c.name)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-blue-950">{c.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">{c.description || 'Zahira Science EM Cohort'}</p>
                  <p className="text-xs font-semibold text-red-600 mt-2">Room: {c.room || 'Main Hall'}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
                  <span>Year: {c.academicYear}</span>
                  <span className="font-mono text-slate-500">ID: {c.id}</span>
                </div>
              </div>
            ))}
          </div>

          {editingClass && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-blue-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-serif text-lg font-bold text-blue-950">
                    {editingClass.id ? 'Edit Class' : 'Add Class'}
                  </h3>
                  <button onClick={() => setEditingClass(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Class Name</label>
                    <input
                      type="text"
                      value={editingClass.name || ''}
                      onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                      placeholder="e.g. 2k28 Science EM"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Grade / Level</label>
                    <input
                      type="text"
                      value={editingClass.grade || ''}
                      onChange={(e) => setEditingClass({ ...editingClass, grade: e.target.value })}
                      placeholder="e.g. A/L Batch 2028"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Room / Hall</label>
                    <input
                      type="text"
                      value={editingClass.room || ''}
                      onChange={(e) => setEditingClass({ ...editingClass, room: e.target.value })}
                      placeholder="e.g. Science Complex - Hall 28"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Description</label>
                    <input
                      type="text"
                      value={editingClass.description || ''}
                      onChange={(e) => setEditingClass({ ...editingClass, description: e.target.value })}
                      placeholder="e.g. English Medium Advanced Level Cohort"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingClass(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveClass}
                    className="px-5 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950"
                  >
                    Save Class
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-50">
            <div>
              <h2 className="font-serif text-xl font-bold text-blue-950">
                User Accounts & Permission Roles
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage registered faculty, students, parents, and administrators. Appoint or adjust permission roles instantly in real time.
              </p>
            </div>

            <button
              onClick={() => setShowAppointModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-900 hover:bg-blue-950 px-4 py-2 text-xs font-bold text-white transition-all shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Appoint / Provision User Role</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-700"
            >
              <option value="all">All Roles ({users.length})</option>
              <option value="admin">Administrators</option>
              <option value="teacher">Teachers / Faculty</option>
              <option value="student">Students / Scholars</option>
              <option value="parent">Parents / Guardians</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Appoint Role</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.userId} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                          {u.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-blue-950">{u.fullName || 'User'}</p>
                          <p className="text-[10px] text-slate-400">{u.bio || 'Zahira Academic Member'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : u.role === 'teacher'
                            ? 'bg-blue-100 text-blue-900'
                            : u.role === 'parent'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleQuickAppointRole(u.userId, e.target.value as UserRole, u.fullName)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-900 shadow-2xs"
                        title="Appoint a new role to this user"
                      >
                        <option value="student">Student (Scholar)</option>
                        <option value="teacher">Teacher (Faculty)</option>
                        <option value="parent">Parent (Guardian)</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      {u.role === 'teacher' && (
                        <span className="text-blue-900 font-medium">Subject: {u.subject || 'Faculty'}</span>
                      )}
                      {u.role === 'student' && (
                        <span className="text-emerald-800 font-medium">Stream: {u.stream || 'Science EM'}</span>
                      )}
                      {u.role === 'admin' && (
                        <span className="text-red-700 font-semibold">Chief Academic Lead</span>
                      )}
                      {u.role === 'parent' && (
                        <span className="text-amber-800 font-medium">Guardian Account</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-100 font-bold text-[11px]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.userId, u.fullName)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* User Edit Modal */}
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-blue-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-serif text-lg font-bold text-blue-950">Edit User & Appoint Role</h3>
                  <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editingUser.fullName || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Appointed Permission Role</label>
                    <select
                      value={editingUser.role || 'student'}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-blue-900"
                    >
                      <option value="student">Student / Scholar</option>
                      <option value="teacher">Teacher / Faculty</option>
                      <option value="admin">Administrator</option>
                      <option value="parent">Parent / Guardian</option>
                    </select>
                  </div>
                  {editingUser.role === 'teacher' && (
                    <div>
                      <label className="font-bold text-blue-950 block mb-1">Teaching Subject</label>
                      <input
                        type="text"
                        value={editingUser.subject || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, subject: e.target.value })}
                        placeholder="e.g. Combined Mathematics"
                        className="w-full rounded-xl border border-slate-200 p-2.5"
                      />
                    </div>
                  )}
                  {editingUser.role === 'student' && (
                    <div>
                      <label className="font-bold text-blue-950 block mb-1">Academic Stream</label>
                      <input
                        type="text"
                        value={editingUser.stream || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, stream: e.target.value })}
                        placeholder="e.g. Biological Science"
                        className="w-full rounded-xl border border-slate-200 p-2.5"
                      />
                    </div>
                  )}
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Bio / Designation</label>
                    <input
                      type="text"
                      value={editingUser.bio || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUser}
                    className="px-5 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Provision & Appoint New User Role Modal */}
          {showAppointModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-blue-200 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-blue-950">Appoint User Role</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Provision a new user account with student, teacher, parent, or admin permissions
                    </p>
                  </div>
                  <button onClick={() => setShowAppointModal(false)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3.5 mt-4 text-xs">
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. M. F. Farook (Teacher) or A. R. Rameez (Parent)"
                      value={appointName}
                      onChange={(e) => setAppointName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. farook@zahira.lk"
                      value={appointEmail}
                      onChange={(e) => setAppointEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Appoint Permission Role</label>
                    <select
                      value={appointRole}
                      onChange={(e) => setAppointRole(e.target.value as UserRole)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-blue-900 bg-blue-50/50 focus:border-blue-900 focus:outline-none"
                    >
                      <option value="student">Student (Scholar) - Access to Courses, AI Planner & Quizzes</option>
                      <option value="teacher">Teacher (Faculty) - Access to Roll-Call, Grading & Materials</option>
                      <option value="parent">Parent (Guardian) - Access to Scholar Progress & Attendance Reports</option>
                      <option value="admin">Administrator - Full Master Control & Oversight Access</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-blue-950 block mb-1">
                      {appointRole === 'teacher'
                        ? 'Subject Specialization'
                        : appointRole === 'student'
                        ? 'Academic Stream'
                        : appointRole === 'parent'
                        ? 'Student Index / Linked Scholar'
                        : 'Administrative Title'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        appointRole === 'teacher'
                          ? 'e.g. Biology & Genetics'
                          : appointRole === 'student'
                          ? 'e.g. 2k28 Science EM'
                          : appointRole === 'parent'
                          ? 'e.g. Parent of 2K28-SCI-001'
                          : 'e.g. Academic Leadership'
                      }
                      value={appointDetail}
                      onChange={(e) => setAppointDetail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setShowAppointModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAndAppointUser}
                    className="px-5 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950 transition-colors shadow-sm"
                  >
                    Appoint Role
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: PERSONAL CHATS & COMMUNICATIONS AUDIT */}
      {activeTab === 'chats' && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-50">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-900 border border-blue-200 mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                <span>Safeguarding & Institutional Oversight</span>
              </div>
              <h2 className="font-serif text-xl font-bold text-blue-950">
                Personal Academic Chats & Communications Oversight
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full administrative transparency into all 1-to-1 direct messaging threads between students, faculty, and parents. Inspect conversations, audit transcripts, and dispatch directives.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={async () => {
                  const seeded = await seedAuditConversations();
                  setConversations(seeded);
                  if (seeded.length > 0) setSelectedConvId(seeded[0].id);
                  triggerNotice('Seeded 3 realistic student-teacher demo conversations.');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold px-3 py-2 text-xs transition-colors"
                title="Seed student and faculty demonstration chats"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset / Seed Demo Chats</span>
              </button>
            </div>
          </div>

          {/* Search & Participant Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                placeholder="Search by participant name, role, or message text..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-600 text-xs font-medium"
              />
              {chatSearch && (
                <button
                  onClick={() => setChatSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Filter:
              </span>
              {[
                { id: 'all', label: `All (${conversations.length})` },
                { id: 'students', label: 'Students' },
                { id: 'teachers', label: 'Teachers' },
                { id: 'parents', label: 'Parents' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setChatRoleFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    chatRoleFilter === f.id
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Split Pane: Conversations List & Message Inspector */}
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No matching conversations found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No conversations match your current search query or filter. Click &quot;Reset / Seed Demo Chats&quot; above to initialize academic threads.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
              {/* Left Column: Conversation Directory (5 cols) */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col shadow-xs">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-900" />
                    <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                      Conversations ({filteredConversations.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">Live Firestore Feed</span>
                </div>

                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[560px]">
                  {filteredConversations.map((conv) => {
                    const isSelected = selectedConvId === conv.id;
                    const participants = Object.entries(conv.participantNames || {});
                    const participantDisplay = participants.map(([, name]) => name).join(' • ');

                    return (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`p-4 transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-blue-50/80 border-l-4 border-blue-900'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              {participants.map(([id, name]) => {
                                const isTeacher =
                                  id.includes('teacher') ||
                                  name.toLowerCase().includes('faculty') ||
                                  name.toLowerCase().includes('dr.') ||
                                  name.toLowerCase().includes('eng.');
                                const isStudent =
                                  id.includes('student') ||
                                  name.toLowerCase().includes('student') ||
                                  name.toLowerCase().includes('scholar') ||
                                  name.toLowerCase().includes('2k28');
                                const isParent = id.includes('parent') || name.toLowerCase().includes('parent');
                                const isAdmin = id.includes('admin') || name.toLowerCase().includes('admin');

                                let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                                let roleLabel = 'User';
                                if (isAdmin) {
                                  badgeClass = 'bg-red-50 text-red-700 border-red-200';
                                  roleLabel = 'Admin';
                                } else if (isTeacher) {
                                  badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                                  roleLabel = 'Faculty';
                                } else if (isStudent) {
                                  badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                  roleLabel = 'Student';
                                } else if (isParent) {
                                  badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                                  roleLabel = 'Parent';
                                }

                                return (
                                  <span
                                    key={id}
                                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}
                                  >
                                    {roleLabel}: {name.split('(')[0].trim()}
                                  </span>
                                );
                              })}
                            </div>
                            <h4 className="text-xs font-bold text-blue-950 truncate">{participantDisplay}</h4>
                            <p className="text-xs text-slate-600 line-clamp-2 mt-1 font-normal">
                              {conv.lastMessage || 'No recent messages'}
                            </p>
                          </div>

                          <div className="flex flex-col items-end shrink-0 gap-2">
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {conv.lastMessageAt
                                ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : ''}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(conv.id);
                              }}
                              className="p-1 rounded text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete conversation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Live Message Transcript & Admin Directive Panel (7 cols) */}
              <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white flex flex-col shadow-xs overflow-hidden">
                {currentSelectedConv ? (
                  <>
                    {/* Transcript Header */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-blue-900" />
                          <h3 className="text-sm font-bold text-blue-950 font-serif">
                            Live Transcript Inspector
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
                          Participants: {Object.values(currentSelectedConv.participantNames || {}).join(' & ')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleExportTranscript(currentSelectedConv, convMessages)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-1.5 text-xs shadow-xs transition-colors"
                          title="Download complete chat log as text audit file"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-900" />
                          <span>Export Transcript</span>
                        </button>
                      </div>
                    </div>

                    {/* Chat Messages Body */}
                    <div className="flex-1 p-5 overflow-y-auto max-h-[420px] min-h-[300px] space-y-4 bg-slate-50/30">
                      {convMessages.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-xs">
                          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p>No messages recorded in this thread yet.</p>
                        </div>
                      ) : (
                        convMessages.map((msg) => {
                          const isAdminDirective =
                            msg.senderId === 'admin_jaasim' ||
                            msg.text.includes('[OFFICIAL ADMIN DIRECTIVE]') ||
                            msg.senderName.toLowerCase().includes('admin');
                          const isFaculty =
                            msg.senderId.includes('teacher') ||
                            msg.senderName.toLowerCase().includes('dr.') ||
                            msg.senderName.toLowerCase().includes('eng.') ||
                            msg.senderName.toLowerCase().includes('faculty') ||
                            msg.senderName.toLowerCase().includes('teacher');
                          const isParent =
                            msg.senderId.includes('parent') ||
                            msg.senderName.toLowerCase().includes('parent');

                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${
                                isAdminDirective
                                  ? 'items-center my-3'
                                  : isFaculty
                                  ? 'items-end'
                                  : 'items-start'
                              }`}
                            >
                              {isAdminDirective ? (
                                <div className="w-full max-w-lg rounded-xl border-2 border-red-500 bg-red-50/90 p-3 shadow-xs text-xs">
                                  <div className="flex items-center justify-between gap-2 border-b border-red-200 pb-1 mb-1.5">
                                    <span className="font-bold text-red-900 flex items-center gap-1">
                                      <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                                      {msg.senderName}
                                    </span>
                                    <span className="text-[10px] text-red-700">
                                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-red-950 font-medium leading-relaxed">{msg.text}</p>
                                </div>
                              ) : (
                                <div
                                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs ${
                                    isFaculty
                                      ? 'bg-blue-900 text-white rounded-br-xs'
                                      : isParent
                                      ? 'bg-amber-100 text-amber-950 border border-amber-200 rounded-bl-xs'
                                      : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-4 mb-1">
                                    <span
                                      className={`font-bold text-[11px] ${
                                        isFaculty ? 'text-blue-100' : isParent ? 'text-amber-900' : 'text-blue-950'
                                      }`}
                                    >
                                      {msg.senderName}
                                    </span>
                                    <span
                                      className={`text-[10px] ${
                                        isFaculty ? 'text-blue-200' : 'text-slate-400'
                                      }`}
                                    >
                                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="leading-relaxed font-normal">{msg.text}</p>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Admin Oversight Directive Input */}
                    <div className="p-4 bg-white border-t border-slate-200">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-red-800 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                          Administrative Intervention & Directive Dispatch
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Dispatches an official notice into this thread
                        </span>
                      </div>
                      <form onSubmit={handleAdminSendDirective} className="flex gap-2">
                        <input
                          type="text"
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          placeholder="Type administrative intervention or directive (e.g. Guidance on exam protocol)..."
                          className="flex-1 rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        />
                        <button
                          type="submit"
                          disabled={!adminReplyText.trim()}
                          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Dispatch</span>
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                    <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Select a Conversation</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Choose any private chat from the list on the left to inspect its messages, verify safeguarding, or dispatch directives.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-50">
            <div>
              <h2 className="font-serif text-xl font-bold text-blue-950">
                School Notice Board & Announcements
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Broadcast official circulars to all students, teachers, or parents instantly.
              </p>
            </div>
            <button
              onClick={() =>
                setEditingAnnouncement({
                  title: '',
                  content: '',
                  audience: 'all',
                  isPinned: false,
                })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 text-xs shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Notice</span>
            </button>
          </div>

          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {a.isPinned && (
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold uppercase">
                        Pinned Notice
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold uppercase">
                      Audience: {a.audience}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-serif text-base font-bold text-blue-950">{a.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{a.content}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingAnnouncement(a)}
                    className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-slate-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAnnouncement(a.id)}
                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editingAnnouncement && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-blue-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-serif text-lg font-bold text-blue-950">
                    {editingAnnouncement.id ? 'Edit Notice' : 'Post Notice'}
                  </h3>
                  <button onClick={() => setEditingAnnouncement(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Notice Title</label>
                    <input
                      type="text"
                      value={editingAnnouncement.title || ''}
                      onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                      placeholder="e.g. Science EM Term 1 Examinations Schedule"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Target Audience</label>
                    <select
                      value={editingAnnouncement.audience || 'all'}
                      onChange={(e) =>
                        setEditingAnnouncement({ ...editingAnnouncement, audience: e.target.value as any })
                      }
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                    >
                      <option value="all">Entire School Community (All)</option>
                      <option value="students">Students Only</option>
                      <option value="teachers">Faculty Only</option>
                      <option value="parents">Parents Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Notice Content</label>
                    <textarea
                      rows={4}
                      value={editingAnnouncement.content || ''}
                      onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                      placeholder="Details of the announcement..."
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-950 pt-1">
                    <input
                      type="checkbox"
                      checked={!!editingAnnouncement.isPinned}
                      onChange={(e) =>
                        setEditingAnnouncement({ ...editingAnnouncement, isPinned: e.target.checked })
                      }
                      className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                    />
                    <span>Pin notice to the top of notice boards</span>
                  </label>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingAnnouncement(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAnnouncement}
                    className="px-5 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950"
                  >
                    Publish Notice
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: ACADEMIC CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-50">
            <div>
              <h2 className="font-serif text-xl font-bold text-blue-950">
                Academic Calendar & Exam Schedule
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mark official school holidays, practical sessions, and examination periods.
              </p>
            </div>
            <button
              onClick={() =>
                setEditingEvent({
                  title: '',
                  startDate: new Date().toISOString().split('T')[0],
                  type: 'exam',
                  time: '08:30 AM',
                  location: 'Science Complex - Hall 28',
                })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 text-xs shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event / Date</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ev.type === 'holiday'
                          ? 'bg-amber-100 text-amber-800'
                          : ev.type === 'exam'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-900'
                      }`}
                    >
                      {ev.type}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingEvent(ev)}
                        className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev.id, ev.title)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-serif text-base font-bold text-blue-950">{ev.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{ev.description || 'Institutional Academic Schedule.'}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>📅 {ev.startDate}</span>
                  <span>📍 {ev.location || 'Campus'}</span>
                </div>
              </div>
            ))}
          </div>

          {editingEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-blue-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-serif text-lg font-bold text-blue-950">
                    {editingEvent.id ? 'Edit Event' : 'Add Calendar Date'}
                  </h3>
                  <button onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Event Title</label>
                    <input
                      type="text"
                      value={editingEvent.title || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                      placeholder="e.g. Chemistry Practical Assessment"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Date</label>
                    <input
                      type="date"
                      value={editingEvent.startDate || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, startDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Category</label>
                    <select
                      value={editingEvent.type || 'exam'}
                      onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                    >
                      <option value="exam">Examination / Test</option>
                      <option value="holiday">School Holiday</option>
                      <option value="academic">Academic Lecture / Practicals</option>
                      <option value="meeting">Faculty / Parent Meeting</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Location / Venue</label>
                    <input
                      type="text"
                      value={editingEvent.location || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                      placeholder="e.g. Science Complex - Hall 28"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingEvent(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEvent}
                    className="px-5 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950"
                  >
                    Save Event
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: LEARNING MATERIALS */}
      {activeTab === 'materials' && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-50">
            <div>
              <h2 className="font-serif text-xl font-bold text-blue-950">
                Curriculum Learning Materials & Syllabi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage uploaded revision notes, formula sheets, and PDF course guides.
              </p>
            </div>
            <button
              onClick={() =>
                setEditingMaterial({
                  title: '',
                  description: '',
                  fileType: 'pdf',
                  fileUrl: 'https://cdn.example.org/materials/guide.pdf',
                  fileSize: '3.5 MB',
                  subjectId: 'sub-cmath',
                })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 text-xs shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Learning Material</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-start justify-between gap-3"
              >
                <div>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold uppercase">
                    {m.fileType} • {m.fileSize || 'Doc'}
                  </span>
                  <h3 className="font-serif text-base font-bold text-blue-950 mt-1">{m.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{m.description}</p>
                  <a
                    href={m.fileUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-blue-700 hover:underline mt-2 inline-block"
                  >
                    View Resource Link →
                  </a>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingMaterial(m)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit Material"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        setMaterials((prev) => prev.filter((mat) => mat.id !== m.id));
                        await deleteDoc(doc(db, 'learningMaterials', m.id));
                        triggerNotice(`Material "${m.title}" deleted from Firebase.`);
                      } catch (err: any) {
                        triggerNotice(`Failed to delete material: ${err.message}`);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Material"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editingMaterial && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-blue-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-serif text-lg font-bold text-blue-950">
                    {editingMaterial.id ? 'Edit Learning Material' : 'Add Learning Material'}
                  </h3>
                  <button onClick={() => setEditingMaterial(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Title</label>
                    <input
                      type="text"
                      value={editingMaterial.title || ''}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
                      placeholder="e.g. Physics Mechanics Notes"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Description</label>
                    <input
                      type="text"
                      value={editingMaterial.description || ''}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value })}
                      placeholder="e.g. Formulas and worked examples"
                      className="w-full rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-blue-950 block mb-1">
                      Upload PDF From Device (Max 10 MB limit)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) {
                          alert(`File size exceeds 10 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a file under 10 MB.`);
                          e.target.value = '';
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = async () => {
                          try {
                            const res = await fetch('/api/upload', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                filename: file.name,
                                fileData: reader.result,
                                fileType: file.type || 'application/pdf',
                              }),
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setEditingMaterial((prev) => ({
                                ...(prev || {}),
                                title: prev?.title || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
                                fileUrl: data.url,
                                fileSize: data.size,
                              }));
                              triggerNotice(`PDF uploaded successfully: ${file.name}`);
                            } else {
                              setEditingMaterial((prev) => ({
                                ...(prev || {}),
                                fileUrl: reader.result as string,
                                fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                              }));
                            }
                          } catch (err) {
                            console.warn('Admin upload fallback to dataUrl:', err);
                            setEditingMaterial((prev) => ({
                              ...(prev || {}),
                              fileUrl: reader.result as string,
                              fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                            }));
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="w-full text-xs text-slate-700 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Direct device upload without URL • Strict 10 MB maximum limit
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-blue-950 block mb-1">Or File Resource URL</label>
                    <input
                      type="text"
                      value={editingMaterial.fileUrl || ''}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, fileUrl: e.target.value })}
                      placeholder="https://... or uploaded file path"
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingMaterial(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!editingMaterial.title) return;
                      const id = editingMaterial.id || `mat-${Date.now()}`;
                      const payload: LearningMaterial = {
                        id,
                        title: editingMaterial.title,
                        description: editingMaterial.description || '',
                        classId: editingMaterial.classId || 'class-2k28-science-em',
                        subjectId: editingMaterial.subjectId || 'sub-cmath',
                        teacherId: editingMaterial.teacherId || 'admin_jaasim',
                        teacherName: editingMaterial.teacherName || 'M. N. M. Jaasim',
                        fileType: (editingMaterial.fileType as 'pdf' | 'document' | 'presentation' | 'image' | 'link') || 'pdf',
                        fileUrl: editingMaterial.fileUrl || '',
                        fileSize: editingMaterial.fileSize || '3.2 MB',
                        createdAt: editingMaterial.createdAt || new Date().toISOString(),
                      };
                      await setDoc(doc(db, 'learningMaterials', id), sanitizeFirestoreDoc(payload), { merge: true });
                      setEditingMaterial(null);
                      triggerNotice(`Material "${payload.title}" saved successfully!`);
                    }}
                    className="px-5 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950"
                  >
                    Save Resource
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
