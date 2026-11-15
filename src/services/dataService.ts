import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  SchoolClass,
  Subject,
  LearningMaterial,
  Assignment,
  Submission,
  AcademicTest,
  TestMark,
  AttendanceRecord,
  Announcement,
  Quiz,
  QuizAttempt,
  Conversation,
  DirectMessage,
  Discussion,
  DiscussionReply,
  TutorSession,
  AppNotification,
  SchoolSetting,
  UserProfile,
  SchoolEvent,
} from '../types';

export const SEED_CLASSES: SchoolClass[] = [];

export const SEED_SUBJECTS: Subject[] = [
  {
    id: 'sub-cmath',
    code: 'CMATH-28',
    name: 'Combined Mathematics',
    description: 'Pure and Applied Mathematics: Functions, Differentiation, Integration, Vectors, Statics and Dynamics.',
    color: '#2563eb',
    teacherIds: [],
    classIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-phys',
    code: 'PHYS-28',
    name: 'Physics',
    description: 'Units & Measurements, Mechanics, Oscillations and Waves, Thermal Physics, Gravitational & Electric Fields, Electronics.',
    color: '#059669',
    teacherIds: [],
    classIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-chem',
    code: 'CHEM-28',
    name: 'Chemistry',
    description: 'General Chemistry, Chemical Calculations, Inorganic Chemistry, Physical Chemistry, and Organic Reaction Mechanisms.',
    color: '#d97706',
    teacherIds: [],
    classIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-bio',
    code: 'BIO-28',
    name: 'Biology',
    description: 'Cell Biology, Chemical Basis of Life, Evolution, Diversity of Organisms, Plant and Animal Form and Function.',
    color: '#16a34a',
    teacherIds: [],
    classIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-ict',
    code: 'ICT-28',
    name: 'Information & Communication Technology',
    description: 'Data Representation, Computer Architecture, Operating Systems, Algorithm Design, Python Programming, and Networking.',
    color: '#7c3aed',
    teacherIds: [],
    classIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-eng',
    code: 'ENG-28',
    name: 'General English',
    description: 'Academic Writing, Technical Reading Comprehension, Scientific Terminology, and Formal Communication.',
    color: '#dc2626',
    teacherIds: [],
    classIds: [],
    createdAt: new Date().toISOString(),
  },
];

// Single real admin account
export const REAL_ADMIN_PROFILE: UserProfile = {
  userId: 'admin_directorate',
  email: 'directorate@zahira.lk',
  fullName: 'Zahira College Science Project Management',
  role: 'admin',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  bio: 'Academic Oversight - Zahira College Science Project Management',
  phone: '+94 77 123 4567',
  assignedClassIds: [],
  createdAt: new Date().toISOString(),
};

// Initial faculty, scholar, and guardian directory (Clean - No dummy profiles)
export const SEED_INITIAL_USERS: UserProfile[] = [];

export const SEED_MATERIALS: LearningMaterial[] = [];

export const SEED_ASSIGNMENTS: Assignment[] = [];

export const SEED_SUBMISSIONS: Submission[] = [];

export const SEED_TESTS: AcademicTest[] = [];

export const SEED_MARKS: TestMark[] = [];

export const SEED_ATTENDANCE: AttendanceRecord[] = [];

export const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Welcome to Zahira College Science Learning Portal',
    content: 'Welcome to the official Science learning portal for Zahira College Mawanella. All practical laboratory guides, single-day attendance registers, and academic resources are available.',
    authorId: 'admin_directorate',
    authorName: 'Faculty Directorate',
    authorRole: 'admin',
    audience: 'all',
    isPinned: true,
    createdAt: new Date().toISOString(),
  },
];

export const SEED_QUIZZES: Quiz[] = [];

export const SEED_DISCUSSIONS: Discussion[] = [];

export const SEED_DISCUSSION_REPLIES: DiscussionReply[] = [];

export const SEED_SCHOOL_EVENTS: SchoolEvent[] = [
  {
    id: 'event-term1-commence',
    title: 'Term 1 Academic Session Commencement',
    description: 'Beginning of Term 1 syllabus for A/L Science batch at Zahira College.',
    startDate: '2026-11-02',
    endDate: '2026-11-02',
    time: '07:45',
    type: 'academic',
    location: 'Main College Auditorium & Hall 28',
    createdBy: 'faculty_lead',
    createdByName: 'Zahira College Science Project Management',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'event-cmath-midterm',
    title: 'Combined Mathematics Mid-Term Examination',
    description: 'Assessment on Pure Mathematics (Functions & Limits) and Applied Statics.',
    startDate: '2026-11-10',
    endDate: '2026-11-10',
    time: '08:30',
    type: 'exam',
    subjectId: 'sub-cmath',
    location: 'Science Complex - Exam Hall A',
    createdBy: 'teacher_kareem',
    createdByName: 'Dr. A. Kareem',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'event-science-lab',
    title: 'Science Practical Laboratory Session (Physics & Chemistry)',
    description: 'Mandatory practical workshop on Mechanics apparatus, Titrations, and Chemical kinetics.',
    startDate: '2026-11-14',
    endDate: '2026-11-14',
    time: '09:00',
    type: 'academic',
    location: 'College Advanced Science Laboratories',
    createdBy: 'teacher_nusrath',
    createdByName: 'Mrs. F. Nusrath',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'event-deepavali-holiday',
    title: 'College Holiday - Mid-Term Break',
    description: 'Official school holiday declared for all faculty and scholars of Zahira College.',
    startDate: '2026-11-18',
    endDate: '2026-11-18',
    type: 'holiday',
    location: 'All Island',
    createdBy: 'faculty_lead',
    createdByName: 'Zahira College Science Project Management',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'event-phys-exam',
    title: 'Physics Mechanics & Dynamics Term Examination',
    description: 'Comprehensive evaluation covering Newton laws, momentum conservation, and energy dynamics.',
    startDate: '2026-11-25',
    endDate: '2026-11-25',
    time: '08:30',
    type: 'exam',
    subjectId: 'sub-phys',
    location: 'Hall 28',
    createdBy: 'teacher_nusrath',
    createdByName: 'Mrs. F. Nusrath',
    createdAt: new Date().toISOString(),
  },
];

export const SEED_SETTING: SchoolSetting = {
  id: 'main-settings',
  schoolName: 'Zahira College Science Project Management',
  cohortName: 'Advanced Level Science',
  academicYear: '2026-2028',
  terms: ['Term 1 (2026)', 'Term 2 (2027)', 'Term 3 (2028)'],
  contactEmail: 'science@zahiracollegemw.lk',
  contactPhone: '+94 35 224 6214',
  address: 'Zahira College, Mawanella, Kegalle District, Sri Lanka',
  room: 'Science Complex - Hall 28',
  motto: 'Excellence in Science, Knowledge, and Discipline',
  marqueeNotice: 'Welcome to Zahira College Science Project Management • Term 1 Lecture Schedule Active • Lab Practicals in Session',
  showMarquee: true,
  logoUrl: '',
  primaryColor: '#1e3a8a', // Royal Navy Blue
  accentColor: '#dc2626',  // Crimson Red
};

export const FAKE_ATTENDANCE_ROSTER_IDS = new Set([
  'roster_2860001',
  'roster_2860002',
  'roster_2860003',
  'roster_2860004',
  'roster_2860005',
  'roster_2860006',
]);

export const FAKE_ATTENDANCE_ROSTER_NAMES = new Set([
  'm. r. mohamed aadhil',
  'fathima zahra',
  'a. l. mohamed usman',
  's. n. zainab farook',
  'k. m. hamza rizwan',
  't. m. akeel nazeer',
]);

export function isFakeSeedRosterStudent(docId?: string, fullName?: string): boolean {
  const cleanId = (docId || '').trim();
  const cleanName = (fullName || '').trim().toLowerCase();
  if (FAKE_ATTENDANCE_ROSTER_IDS.has(cleanId)) return true;
  if (cleanId.startsWith('roster_') && FAKE_ATTENDANCE_ROSTER_NAMES.has(cleanName)) return true;
  return false;
}

// Purge all legacy dummy profiles, classes, and fake attendance roster entries from Firestore
export async function purgeDummyProfilesAndClasses() {
  const dummyUserIds = [
    'student_aadhil',
    'student_nuha',
    'student_faris',
    'parent_rifky',
    'admin_jaasim',
  ];
  for (const uid of dummyUserIds) {
    try {
      await deleteDoc(doc(db, 'userProfiles', uid));
    } catch (e) {
      // ignore if non-existent
    }
  }

  const dummyClassIds = ['class-2k28-science-em'];
  for (const cid of dummyClassIds) {
    try {
      await deleteDoc(doc(db, 'classes', cid));
    } catch (e) {
      // ignore
    }
  }

  // Purge seeded fake students from attendanceRoster
  for (const fakeRosterId of FAKE_ATTENDANCE_ROSTER_IDS) {
    try {
      await deleteDoc(doc(db, 'attendanceRoster', fakeRosterId));
    } catch {
      // ignore
    }
  }
  try {
    const rosterSnap = await getDocs(collection(db, 'attendanceRoster'));
    await Promise.all(
      rosterSnap.docs
        .filter((d) => isFakeSeedRosterStudent(d.id, d.data()?.fullName))
        .map((d) => deleteDoc(doc(db, 'attendanceRoster', d.id)))
    );
  } catch {
    // ignore if unavailable
  }
}

// Seeding engine to populate Firestore on initial boot with Zahira College data
export async function seedInitialDatabaseIfEmpty() {
  try {
    // Purge legacy dummy accounts and classes
    await purgeDummyProfilesAndClasses();

    // Ensure requested administrator account (mnmjaasim@gmail.com) exists in Firestore userProfiles
    const adminRef = doc(db, 'userProfiles', 'admin_mnmjaasim');
    const adminSnap = await getDoc(adminRef).catch(() => null);
    if (!adminSnap || !adminSnap.exists()) {
      await setDoc(
        adminRef,
        {
          userId: 'admin_mnmjaasim',
          email: 'mnmjaasim@gmail.com',
          fullName: 'Science Project Admin',
          role: 'admin',
          indexNumber: '2860003',
          avatarUrl: '',
          bio: 'Administrator - Zahira College Science Project Management',
          assignedClassIds: [],
          enrolledClassIds: [],
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    }

    const settingsSnap = await getDoc(doc(db, 'schoolSettings', 'main-settings'));
    const eventsSnap = await getDocs(collection(db, 'schoolEvents'));
    
    // Seed events if not already present
    if (eventsSnap.empty) {
      for (const ev of SEED_SCHOOL_EVENTS) {
        await setDoc(doc(db, 'schoolEvents', ev.id), ev, { merge: true });
      }
    }

    if (settingsSnap.exists() && settingsSnap.data()?.schoolName === 'Zahira College 2k28 Science EM') {
      return; // Core metadata already up to date
    }

    console.log('Synchronizing Zahira College 2k28 Science EM Firestore records...');

    // Subjects
    for (const s of SEED_SUBJECTS) {
      await setDoc(doc(db, 'subjects', s.id), s, { merge: true });
    }

    // Learning Materials
    for (const m of SEED_MATERIALS) {
      await setDoc(doc(db, 'learningMaterials', m.id), m, { merge: true });
    }

    // Assignments
    for (const a of SEED_ASSIGNMENTS) {
      await setDoc(doc(db, 'assignments', a.id), a, { merge: true });
    }

    // Tests
    for (const t of SEED_TESTS) {
      await setDoc(doc(db, 'tests', t.id), t, { merge: true });
    }

    // Announcements
    for (const an of SEED_ANNOUNCEMENTS) {
      await setDoc(doc(db, 'announcements', an.id), an, { merge: true });
    }

    // Quizzes
    for (const q of SEED_QUIZZES) {
      await setDoc(doc(db, 'quizzes', q.id), q, { merge: true });
    }

    // Discussions
    for (const d of SEED_DISCUSSIONS) {
      await setDoc(doc(db, 'discussions', d.id), d, { merge: true });
    }

    // School Settings
    await setDoc(doc(db, 'schoolSettings', SEED_SETTING.id), SEED_SETTING, { merge: true });

    console.log('Zahira College 2k28 Science EM records synced to Firestore.');
  } catch (error) {
    console.warn('Initial Firestore seeding note:', error);
  }
}
