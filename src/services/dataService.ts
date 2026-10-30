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

export const SEED_CLASSES: SchoolClass[] = [
  {
    id: 'class-2k28-science-em',
    name: '2k28 Science EM',
    grade: 'A/L Batch 2028',
    academicYear: '2026-2028',
    description: 'Zahira College 2028 Advanced Level Science Stream - English Medium Cohort.',
    room: 'Science Complex - Hall 28',
    teacherIds: ['admin_jaasim'],
    studentIds: [],
    subjectIds: ['sub-cmath', 'sub-phys', 'sub-chem', 'sub-bio', 'sub-ict', 'sub-eng'],
    createdAt: new Date().toISOString(),
  },
];

export const SEED_SUBJECTS: Subject[] = [
  {
    id: 'sub-cmath',
    code: 'CMATH-28',
    name: 'Combined Mathematics',
    description: 'Pure and Applied Mathematics: Functions, Differentiation, Integration, Vectors, Statics and Dynamics.',
    color: '#2563eb',
    teacherIds: ['admin_jaasim'],
    classIds: ['class-2k28-science-em'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-phys',
    code: 'PHYS-28',
    name: 'Physics',
    description: 'Units & Measurements, Mechanics, Oscillations and Waves, Thermal Physics, Gravitational & Electric Fields, Electronics.',
    color: '#059669',
    teacherIds: ['admin_jaasim'],
    classIds: ['class-2k28-science-em'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-chem',
    code: 'CHEM-28',
    name: 'Chemistry',
    description: 'General Chemistry, Chemical Calculations, Inorganic Chemistry, Physical Chemistry, and Organic Reaction Mechanisms.',
    color: '#d97706',
    teacherIds: ['admin_jaasim'],
    classIds: ['class-2k28-science-em'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-bio',
    code: 'BIO-28',
    name: 'Biology',
    description: 'Cell Biology, Chemical Basis of Life, Evolution, Diversity of Organisms, Plant and Animal Form and Function.',
    color: '#16a34a',
    teacherIds: ['admin_jaasim'],
    classIds: ['class-2k28-science-em'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-ict',
    code: 'ICT-28',
    name: 'Information & Communication Technology',
    description: 'Data Representation, Computer Architecture, Operating Systems, Algorithm Design, Python Programming, and Networking.',
    color: '#7c3aed',
    teacherIds: ['admin_jaasim'],
    classIds: ['class-2k28-science-em'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-eng',
    code: 'ENG-28',
    name: 'General English',
    description: 'Academic Writing, Technical Reading Comprehension, Scientific Terminology, and Formal Communication.',
    color: '#dc2626',
    teacherIds: ['admin_jaasim'],
    classIds: ['class-2k28-science-em'],
    createdAt: new Date().toISOString(),
  },
];

// Single real admin account
export const REAL_ADMIN_PROFILE: UserProfile = {
  userId: 'admin_jaasim',
  email: 'mnmjaasim@gmail.com',
  fullName: 'M. N. M. Jaasim',
  role: 'admin',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  bio: 'Administrator & Academic Lead - Zahira College 2k28 Science EM',
  phone: '+94 77 123 4567',
  assignedClassIds: ['class-2k28-science-em'],
  createdAt: new Date().toISOString(),
};

export const SEED_MATERIALS: LearningMaterial[] = [
  {
    id: 'mat-cmath-1',
    title: 'Combined Mathematics: Differential Calculus & Real Functions Guide',
    description: 'Fundamentals of functions, limits, first principles differentiation, and composite function rules for 2k28 Science EM.',
    classId: 'class-2k28-science-em',
    subjectId: 'sub-cmath',
    teacherId: 'admin_jaasim',
    teacherName: 'M. N. M. Jaasim',
    fileType: 'pdf',
    fileUrl: 'https://cdn.example.org/materials/combined-maths-calculus.pdf',
    fileSize: '3.8 MB',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mat-phys-1',
    title: 'Physics: Mechanics & Vector Resolution Formula Booklet',
    description: 'Complete breakdown of Newton’s Laws, friction, momentum conservation, and projectile motion equations.',
    classId: 'class-2k28-science-em',
    subjectId: 'sub-phys',
    teacherId: 'admin_jaasim',
    teacherName: 'M. N. M. Jaasim',
    fileType: 'pdf',
    fileUrl: 'https://cdn.example.org/materials/physics-mechanics.pdf',
    fileSize: '4.1 MB',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mat-chem-1',
    title: 'Chemistry: Chemical Calculations & Mole Concept Revision Notes',
    description: 'Worked titration problems, stoichiometry, balancing redox reactions, and molar volume derivations.',
    classId: 'class-2k28-science-em',
    subjectId: 'sub-chem',
    teacherId: 'admin_jaasim',
    teacherName: 'M. N. M. Jaasim',
    fileType: 'document',
    fileUrl: 'https://cdn.example.org/materials/chemistry-calculations.docx',
    fileSize: '2.4 MB',
    createdAt: new Date().toISOString(),
  },
];

export const SEED_ASSIGNMENTS: Assignment[] = [
  {
    id: 'assign-cmath-1',
    title: 'Combined Mathematics: Calculus Limits & Continuity Problem Set 1',
    description: 'Evaluate the 5 analytical limit problems and test for continuity at specified branch points.',
    instructions: '1. Show complete algebraic manipulation.\n2. State L’Hôpital’s rule conditions where applied.\n3. Verify limits approaching from left and right.',
    classId: 'class-2k28-science-em',
    subjectId: 'sub-cmath',
    teacherId: 'admin_jaasim',
    dueDate: '2026-11-15T23:59:00.000Z',
    maxMarks: 50,
    rubric: 'Mathematical rigor (20 pts), Accuracy (20 pts), Methodological clarity (10 pts)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'assign-phys-1',
    title: 'Physics: Kinematics & Linear Dynamics Laboratory Assignment',
    description: 'Calculate velocity profiles and acceleration vectors for motion along an inclined plane with non-zero friction.',
    instructions: '1. Formulate free-body diagram.\n2. Derive equation of motion.\n3. Solve for acceleration and final velocity.',
    classId: 'class-2k28-science-em',
    subjectId: 'sub-phys',
    teacherId: 'admin_jaasim',
    dueDate: '2026-11-20T23:59:00.000Z',
    maxMarks: 50,
    rubric: 'Free body diagram accuracy (15 pts), Vector decomposition (20 pts), Discussion (15 pts)',
    createdAt: new Date().toISOString(),
  },
];

export const SEED_SUBMISSIONS: Submission[] = [];

export const SEED_TESTS: AcademicTest[] = [
  {
    id: 'test-1',
    title: 'Term 1 Midterm: Mechanics & Differentiation Assessment',
    classId: 'class-2k28-science-em',
    subjectId: 'sub-cmath',
    teacherId: 'admin_jaasim',
    examDate: '2026-11-10',
    maxMarks: 100,
    term: 'Term 1 (2026)',
    createdAt: new Date().toISOString(),
  },
];

export const SEED_MARKS: TestMark[] = [];

export const SEED_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-initial-2k28',
    classId: 'class-2k28-science-em',
    date: '2026-10-28',
    teacherId: 'admin_jaasim',
    records: {},
    createdAt: new Date().toISOString(),
  },
];

export const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Welcome to Zahira College 2k28 Science EM Learning Portal',
    content: 'Welcome to the official 2k28 Science EM portal for Zahira College. All lecture materials, assignment submissions, daily attendance, examination reports, and the Gemini AI Academic Tutor are now active for the 2026-2028 Advanced Level cohort.',
    authorId: 'admin_jaasim',
    authorName: 'M. N. M. Jaasim',
    authorRole: 'admin',
    audience: 'all',
    isPinned: true,
    createdAt: new Date().toISOString(),
  },
];

export const SEED_QUIZZES: Quiz[] = [
  {
    id: 'quiz-phys-1',
    title: 'Physics: Fundamentals of Dynamics & Vectors Quiz',
    description: 'Initial conceptual assessment for Zahira College 2k28 Science EM students.',
    classId: 'class-2k28-science-em',
    subjectId: 'sub-phys',
    teacherId: 'admin_jaasim',
    durationMinutes: 15,
    totalMarks: 20,
    isPublished: true,
    questions: [
      {
        id: 'q1',
        questionText: 'An object is accelerated uniformly from rest with acceleration a over time t. What is its displacement?',
        type: 'multiple_choice',
        options: ['s = (1/2) a t²', 's = a t', 's = 2 a t²', 's = (1/2) a² t'],
        correctAnswer: 's = (1/2) a t²',
        explanation: 'From kinematics equation: s = ut + (1/2)at², since u = 0, s = (1/2)at².',
        marks: 5,
        difficulty: 'easy',
      },
      {
        id: 'q2',
        questionText: 'The acceleration due to gravity on Earth is independent of the mass of the falling body in a vacuum.',
        type: 'true_false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'F = mg = G M m / r², hence g = G M / r², which does not depend on the mass m of the object.',
        marks: 5,
        difficulty: 'easy',
      },
      {
        id: 'q3',
        questionText: 'Which law of motion establishes the concept of inertia?',
        type: 'multiple_choice',
        options: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", 'Law of Universal Gravitation'],
        correctAnswer: "Newton's First Law",
        explanation: "Newton's First Law states an object remains at rest or in uniform motion unless acted upon by a net external force.",
        marks: 5,
        difficulty: 'easy',
      },
      {
        id: 'q4',
        questionText: 'What is the SI unit of momentum?',
        type: 'short_answer',
        options: [],
        correctAnswer: 'kg m/s',
        explanation: 'Momentum p = mv, with units kg · m/s (or N · s).',
        marks: 5,
        difficulty: 'easy',
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

export const SEED_DISCUSSIONS: Discussion[] = [
  {
    id: 'disc-1',
    title: '2k28 Science EM: Combined Maths & Physics Discussion Hub',
    content: 'Scholars of 2k28 Science EM, share questions, homework inquiries, and study notes here. You can also use the Socrates Gemini AI Tutor for instant explanations.',
    authorId: 'admin_jaasim',
    authorName: 'M. N. M. Jaasim',
    authorRole: 'admin',
    category: 'general',
    classId: 'class-2k28-science-em',
    tags: ['zahira-college', 'science-em', 'academic-hub'],
    repliesCount: 0,
    isPinned: true,
    createdAt: new Date().toISOString(),
  },
];

export const SEED_DISCUSSION_REPLIES: DiscussionReply[] = [];

export const SEED_SCHOOL_EVENTS: SchoolEvent[] = [
  {
    id: 'event-term1-commence',
    title: 'Term 1 Academic Session Commencement',
    description: 'Beginning of Term 1 syllabus for A/L 2028 Science English Medium batch at Zahira College.',
    startDate: '2026-11-02',
    endDate: '2026-11-02',
    time: '07:45',
    type: 'academic',
    classId: 'class-2k28-science-em',
    location: 'Main College Auditorium & Hall 28',
    createdBy: 'admin_jaasim',
    createdByName: 'M. N. M. Jaasim',
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
    classId: 'class-2k28-science-em',
    subjectId: 'sub-cmath',
    location: 'Science Complex - Exam Hall A',
    createdBy: 'admin_jaasim',
    createdByName: 'M. N. M. Jaasim',
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
    classId: 'class-2k28-science-em',
    location: 'College Advanced Science Laboratories',
    createdBy: 'admin_jaasim',
    createdByName: 'M. N. M. Jaasim',
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
    createdBy: 'admin_jaasim',
    createdByName: 'M. N. M. Jaasim',
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
    classId: 'class-2k28-science-em',
    subjectId: 'sub-phys',
    location: 'Hall 28',
    createdBy: 'admin_jaasim',
    createdByName: 'M. N. M. Jaasim',
    createdAt: new Date().toISOString(),
  },
];

export const SEED_SETTING: SchoolSetting = {
  id: 'main-settings',
  schoolName: 'Zahira College Mawanella',
  cohortName: '2k28 Science EM',
  academicYear: '2026-2028',
  terms: ['Term 1 (2026)', 'Term 2 (2027)', 'Term 3 (2028)'],
  contactEmail: 'mnmjaasim@gmail.com',
  contactPhone: '+94 35 224 6214',
  address: 'Zahira College, Mawanella, Kegalle District, Sri Lanka',
  room: 'Science Complex - Hall 28',
  motto: 'Excellence in Science, Knowledge, and Discipline',
  marqueeNotice: 'Welcome to Zahira College 2k28 Science EM • Term 1 Lecture Schedule Active • Lab Practicals in Session',
  showMarquee: true,
  logoUrl: '',
  primaryColor: '#1e3a8a', // Royal Navy Blue
  accentColor: '#dc2626',  // Crimson Red
};

// Seeding engine to populate Firestore on initial boot with Zahira College data
export async function seedInitialDatabaseIfEmpty() {
  try {
    const settingsSnap = await getDoc(doc(db, 'schoolSettings', 'main-settings'));
    const eventsSnap = await getDocs(collection(db, 'schoolEvents'));
    
    // Seed events if not already present
    if (eventsSnap.empty) {
      for (const ev of SEED_SCHOOL_EVENTS) {
        await setDoc(doc(db, 'schoolEvents', ev.id), ev, { merge: true });
      }
    }

    if (settingsSnap.exists() && settingsSnap.data()?.schoolName === 'Zahira College 2k28 Science EM') {
      return; // Already up to date
    }

    console.log('Synchronizing Zahira College 2k28 Science EM Firestore records...');

    // Classes
    for (const c of SEED_CLASSES) {
      await setDoc(doc(db, 'classes', c.id), c, { merge: true });
    }

    // Subjects
    for (const s of SEED_SUBJECTS) {
      await setDoc(doc(db, 'subjects', s.id), s, { merge: true });
    }

    // Real Admin Profile
    await setDoc(doc(db, 'userProfiles', REAL_ADMIN_PROFILE.userId), REAL_ADMIN_PROFILE, { merge: true });

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
