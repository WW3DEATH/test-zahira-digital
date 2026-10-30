export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'guest';

export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  subject?: string; // For teachers: primary subject
  stream?: string;  // For students: academic stream (e.g., Biological Science, Physical Science)
  assignedClassIds?: string[]; // For teachers
  enrolledClassIds?: string[]; // For students
  linkedStudentIds?: string[]; // For parents
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: string;
  academicYear: string;
  description: string;
  room?: string;
  teacherIds: string[];
  studentIds: string[];
  subjectIds: string[];
  createdAt?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  teacherIds: string[];
  classIds: string[];
  createdAt?: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  teacherName?: string;
  fileType: 'pdf' | 'document' | 'presentation' | 'image' | 'link';
  fileUrl?: string;
  fileSize?: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dueDate: string;
  maxMarks: number;
  rubric?: string;
  createdAt: string;
}

export type SubmissionStatus = 'draft' | 'submitted' | 'late' | 'under_review' | 'graded' | 'revision';

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  classId: string;
  content: string;
  fileUrl?: string;
  status: SubmissionStatus;
  marksObtained?: number;
  feedback?: string;
  aiFeedbackSuggestion?: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface AcademicTest {
  id: string;
  title: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  examDate: string;
  maxMarks: number;
  term: string;
  createdAt: string;
}

export interface TestMark {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  classId: string;
  subjectId: string;
  marksObtained: number;
  maxMarks: number;
  feedback?: string;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  teacherId: string;
  records: Record<string, AttendanceStatus>; // studentId -> status
  createdAt: string;
}

export type SchoolEventType = 'holiday' | 'exam' | 'academic' | 'meeting' | 'sports' | 'general';

export interface SchoolEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  time?: string;      // e.g. "08:30"
  type: SchoolEventType;
  classId?: string;
  subjectId?: string;
  location?: string;
  createdBy: string;
  createdByName?: string;
  googleEventId?: string;
  isSyncedWithGoogle?: boolean;
  createdAt: string;
}

export type AnnouncementAudience = 'all' | 'teachers' | 'students' | 'parents' | 'class';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  audience: AnnouncementAudience;
  classId?: string;
  isPinned?: boolean;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correctAnswer: string;
  explanation: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  durationMinutes: number;
  totalMarks: number;
  isPublished: boolean;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  classId: string;
  answers: Record<string, string>; // questionId -> selectedAnswer
  score: number;
  maxScore: number;
  status: 'completed' | 'in_progress';
  completedAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  lastMessage?: string;
  lastMessageAt?: string;
  updatedAt: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export type DiscussionCategory = 'class' | 'subject' | 'study_group' | 'general';

export interface Discussion {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  category: DiscussionCategory;
  classId?: string;
  subjectId?: string;
  tags: string[];
  repliesCount: number;
  isPinned?: boolean;
  isLocked?: boolean;
  createdAt: string;
}

export interface DiscussionReply {
  id: string;
  discussionId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
}

export interface TutorChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface TutorSession {
  id: string;
  studentId: string;
  subject: string;
  topic: string;
  style: string;
  messages: TutorChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  type: 'assignment' | 'grade' | 'announcement' | 'message' | 'quiz' | 'attendance';
  read: boolean;
  createdAt: string;
}

export interface SchoolSetting {
  id: string;
  schoolName: string;
  cohortName: string;
  academicYear: string;
  terms: string[];
  contactEmail: string;
  contactPhone?: string;
  address: string;
  room?: string;
  motto?: string;
  marqueeNotice?: string;
  showMarquee?: boolean;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}
