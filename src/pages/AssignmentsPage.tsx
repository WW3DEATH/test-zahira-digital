import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  Eye,
  X,
  FileCheck2,
  User,
  ArrowRight,
  Download,
  Upload,
  Paperclip,
  File,
  Loader2,
  Check,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Assignment, Submission, SubmissionStatus } from '../types';
import { SEED_ASSIGNMENTS, SEED_SUBMISSIONS } from '../services/dataService';
import { broadcastSystemNotification } from '../services/notificationService';

export const AssignmentsPage: React.FC = () => {
  const { activeRole, userProfile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>(SEED_ASSIGNMENTS);
  const [submissions, setSubmissions] = useState<Submission[]>(SEED_SUBMISSIONS);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignmentForSubmit, setSelectedAssignmentForSubmit] = useState<Assignment | null>(null);
  const [studentContent, setStudentContent] = useState('');
  
  // Student PDF Coursework Upload
  const [submissionPdfFile, setSubmissionPdfFile] = useState<File | null>(null);
  const [submissionPdfBase64, setSubmissionPdfBase64] = useState<string | null>(null);
  const [submissionPdfError, setSubmissionPdfError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Teacher Assignment Question Paper PDF Upload
  const [assignmentPdfFile, setAssignmentPdfFile] = useState<File | null>(null);
  const [assignmentPdfBase64, setAssignmentPdfBase64] = useState<string | null>(null);
  const [assignmentPdfError, setAssignmentPdfError] = useState<string | null>(null);
  const [isPublishingAssignment, setIsPublishingAssignment] = useState(false);

  // Grading Modal
  const [gradingSubmission, setGradingSubmission] = useState<{
    submission: Submission;
    assignment: Assignment;
  } | null>(null);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [finalFeedback, setFinalFeedback] = useState<string>('');
  const [aiSuggestions, setAiSuggestions] = useState<{
    strengths?: string[];
    weaknesses?: string[];
    suggestedImprovements?: string[];
    recommendedScore?: number;
    reasoning?: string;
    feedbackDraft?: string;
  } | null>(null);
  const [aiGradingLoading, setAiGradingLoading] = useState(false);

  // Create Assignment Form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newDueDate, setNewDueDate] = useState('2026-11-20');
  const [newMaxMarks, setNewMaxMarks] = useState(100);
  const [newRubric, setNewRubric] = useState('Accuracy (40 pts), Conceptual Depth (30 pts), Clarity & Methodology (30 pts)');

  // Real-time listener for assignments
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'assignments'),
      (snap) => {
        const aList: Assignment[] = [];
        snap.forEach((d) => aList.push(d.data() as Assignment));
        if (aList.length > 0) {
          setAssignments(aList);
        } else {
          setAssignments(SEED_ASSIGNMENTS);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Real-time assignments note:', error);
        setAssignments(SEED_ASSIGNMENTS);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Real-time listener for submissions
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'submissions'),
      (snap) => {
        const sList: Submission[] = [];
        snap.forEach((d) => sList.push(d.data() as Submission));
        setSubmissions(sList);
      },
      (error) => {
        console.warn('Real-time submissions note:', error);
      }
    );
    return () => unsub();
  }, []);

  const handleStudentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmissionPdfError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_SIZE) {
      setSubmissionPdfError(
        `File exceeds the 10 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a PDF smaller than 10 MB.`
      );
      setSubmissionPdfFile(null);
      setSubmissionPdfBase64(null);
      return;
    }

    setSubmissionPdfFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setSubmissionPdfBase64(reader.result as string);
    };
    reader.onerror = () => {
      setSubmissionPdfError('Failed to read document from your device. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleAssignmentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAssignmentPdfError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_SIZE) {
      setAssignmentPdfError(
        `File exceeds the 10 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a PDF smaller than 10 MB.`
      );
      setAssignmentPdfFile(null);
      setAssignmentPdfBase64(null);
      return;
    }

    setAssignmentPdfFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAssignmentPdfBase64(reader.result as string);
    };
    reader.onerror = () => {
      setAssignmentPdfError('Failed to read document from your device. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleCreateAssignment = async () => {
    if (!newTitle.trim()) return;
    try {
      setIsPublishingAssignment(true);
      setAssignmentPdfError(null);

      let finalFileUrl: string | undefined = undefined;
      let finalFileName: string | undefined = undefined;
      let finalFileSize: string | undefined = undefined;

      if (assignmentPdfFile && assignmentPdfBase64) {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: assignmentPdfFile.name,
              fileData: assignmentPdfBase64,
              fileType: assignmentPdfFile.type || 'application/pdf',
            }),
          });
          if (res.ok) {
            const data = await res.json();
            finalFileUrl = data.url;
            finalFileName = data.filename || assignmentPdfFile.name;
            finalFileSize = data.size || `${(assignmentPdfFile.size / (1024 * 1024)).toFixed(2)} MB`;
          } else {
            finalFileUrl = assignmentPdfBase64;
            finalFileName = assignmentPdfFile.name;
            finalFileSize = `${(assignmentPdfFile.size / (1024 * 1024)).toFixed(2)} MB`;
          }
        } catch (uploadErr) {
          console.warn('Backend assignment upload fallback to dataUrl:', uploadErr);
          finalFileUrl = assignmentPdfBase64;
          finalFileName = assignmentPdfFile.name;
          finalFileSize = `${(assignmentPdfFile.size / (1024 * 1024)).toFixed(2)} MB`;
        }
      }

      const id = `assign-${Date.now()}`;
      const newAssign: Assignment = {
        id,
        title: newTitle.trim(),
        description: newDesc.trim(),
        instructions: newInstructions.trim(),
        classId: 'class-2k28-science-em',
        subjectId: 'sub-phys',
        teacherId: userProfile?.userId || 'admin_jaasim',
        dueDate: `${newDueDate}T23:59:00.000Z`,
        maxMarks: newMaxMarks,
        rubric: newRubric,
        fileUrl: finalFileUrl,
        fileName: finalFileName,
        fileSize: finalFileSize,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'assignments', id), newAssign);
      await broadcastSystemNotification({
        title: 'New Coursework Assignment',
        message: `"${newAssign.title}" is published for 2k28 Science EM. Due: ${new Date(newAssign.dueDate).toLocaleDateString()}.`,
        type: 'assignment',
        link: 'assignments',
      });

      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewInstructions('');
      setAssignmentPdfFile(null);
      setAssignmentPdfBase64(null);
      setAssignmentPdfError(null);
    } catch (e: any) {
      console.error('Failed to create assignment:', e);
      setAssignmentPdfError(e.message || 'Failed to create assignment.');
    } finally {
      setIsPublishingAssignment(false);
    }
  };

  const handleStudentSubmit = async () => {
    if (!selectedAssignmentForSubmit) return;
    if (!studentContent.trim() && !submissionPdfFile) {
      setSubmissionPdfError('Please provide either written coursework text or attach a PDF file from your device.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmissionPdfError(null);

      let finalFileUrl: string | undefined = undefined;
      let finalFileName: string | undefined = undefined;
      let finalFileSize: string | undefined = undefined;

      if (submissionPdfFile && submissionPdfBase64) {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: submissionPdfFile.name,
              fileData: submissionPdfBase64,
              fileType: submissionPdfFile.type || 'application/pdf',
            }),
          });
          if (res.ok) {
            const data = await res.json();
            finalFileUrl = data.url;
            finalFileName = data.filename || submissionPdfFile.name;
            finalFileSize = data.size || `${(submissionPdfFile.size / (1024 * 1024)).toFixed(2)} MB`;
          } else {
            finalFileUrl = submissionPdfBase64;
            finalFileName = submissionPdfFile.name;
            finalFileSize = `${(submissionPdfFile.size / (1024 * 1024)).toFixed(2)} MB`;
          }
        } catch (uploadErr) {
          console.warn('Backend student submission fallback to dataUrl:', uploadErr);
          finalFileUrl = submissionPdfBase64;
          finalFileName = submissionPdfFile.name;
          finalFileSize = `${(submissionPdfFile.size / (1024 * 1024)).toFixed(2)} MB`;
        }
      }

      const subId = `subm-${Date.now()}`;
      const newSub: Submission = {
        id: subId,
        assignmentId: selectedAssignmentForSubmit.id,
        studentId: userProfile?.userId || 'student_user',
        studentName: userProfile?.fullName || 'Zahira Student Scholar',
        classId: selectedAssignmentForSubmit.classId,
        content: studentContent.trim() || `Coursework submitted via PDF document: ${finalFileName || 'Coursework Solution.pdf'}`,
        fileUrl: finalFileUrl,
        fileName: finalFileName,
        fileSize: finalFileSize,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'submissions', subId), newSub);
      await broadcastSystemNotification({
        title: 'New Student Submission Received',
        message: `${newSub.studentName} submitted coursework for "${selectedAssignmentForSubmit.title}".`,
        type: 'assignment',
        link: 'assignments',
        audience: 'teachers',
      });

      setSelectedAssignmentForSubmit(null);
      setStudentContent('');
      setSubmissionPdfFile(null);
      setSubmissionPdfBase64(null);
      setSubmissionPdfError(null);
    } catch (e: any) {
      console.error('Failed to submit assignment:', e);
      setSubmissionPdfError(e.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenGradingModal = (sub: Submission) => {
    const parentAssignment = assignments.find((a) => a.id === sub.assignmentId) || assignments[0];
    setGradingSubmission({ submission: sub, assignment: parentAssignment });
    setFinalScore(sub.marksObtained || 0);
    setFinalFeedback(sub.feedback || '');
    setAiSuggestions(null);
  };

  const handleRunAIGrading = async () => {
    if (!gradingSubmission) return;
    setAiGradingLoading(true);

    try {
      const response = await fetch('/api/gemini/grade-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentTitle: gradingSubmission.assignment.title,
          instructions: gradingSubmission.assignment.instructions,
          rubric: gradingSubmission.assignment.rubric,
          studentSubmission: gradingSubmission.submission.content,
          maxMarks: gradingSubmission.assignment.maxMarks,
        }),
      });

      const data = await response.json();
      setAiSuggestions(data);
      if (data.recommendedScore !== undefined) {
        setFinalScore(data.recommendedScore);
      }
      if (data.feedbackDraft) {
        setFinalFeedback(data.feedbackDraft);
      }
    } catch (e) {
      console.error('AI grading error:', e);
    } finally {
      setAiGradingLoading(false);
    }
  };

  const handleSaveOfficialGrade = async () => {
    if (!gradingSubmission) return;
    try {
      const subRef = doc(db, 'submissions', gradingSubmission.submission.id);
      const updateData = {
        status: 'graded' as SubmissionStatus,
        marksObtained: finalScore,
        feedback: finalFeedback,
        gradedAt: new Date().toISOString(),
      };
      await updateDoc(subRef, updateData);
      setGradingSubmission(null);
    } catch (e) {
      console.error('Failed to save grade:', e);
    }
  };

  // Export all coursework assignments to PDF
  const handleExportAllPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('ZAHIRA COLLEGE MAWANELLA • 2K28 SCIENCE EM', 20, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('OFFICIAL ACADEMIC COURSEWORK & ASSIGNMENTS DIRECTORY', 20, 28);
      doc.text('Mawanella, Sri Lanka • G.C.E. Advanced Level Academic Oversight', 20, 33);

      doc.setDrawColor(203, 213, 225);
      doc.line(20, 37, 190, 37);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Cohort: Zahira College 2k28 Science EM', 20, 46);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 52);
      doc.text(`Total Coursework Items: ${assignments.length}`, 120, 46);
      doc.text('Project Oversight: Zahira College Mawanella Science Project management', 105, 52);

      let y = 62;
      assignments.forEach((assign, index) => {
        if (y > 230) {
          doc.addPage();
          y = 25;
        }

        const assignSubs = submissions.filter((s) => s.assignmentId === assign.id);
        const mySub = assignSubs.find((s) => s.studentId === userProfile?.userId);

        doc.setFillColor(239, 246, 255); // soft blue
        doc.roundedRect(20, y, 170, 7.5, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 64, 175); // blue-800
        doc.text(`${index + 1}. ${assign.title}`, 24, y + 5.2);

        y += 13;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`Due Date: ${assign.dueDate}`, 24, y);
        doc.text(`Max Marks: ${assign.maxMarks} Pts`, 85, y);
        doc.text(`Submissions Logged: ${assignSubs.length}`, 135, y);

        y += 6;
        doc.setTextColor(100, 116, 139);
        const descLines = doc.splitTextToSize(`Description: ${assign.description}`, 162);
        doc.text(descLines, 24, y);
        y += descLines.length * 4.5;

        if (assign.instructions) {
          y += 2;
          doc.setTextColor(51, 65, 85);
          const instLines = doc.splitTextToSize(`Instructions: ${assign.instructions}`, 162);
          doc.text(instLines, 24, y);
          y += instLines.length * 4.5;
        }

        if (assign.rubric) {
          y += 2;
          doc.setTextColor(180, 83, 9);
          const rubLines = doc.splitTextToSize(`Rubric: ${assign.rubric}`, 162);
          doc.text(rubLines, 24, y);
          y += rubLines.length * 4.5;
        }

        if (mySub) {
          y += 2;
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(22, 101, 52);
          doc.text(`My Submission: ${mySub.status.toUpperCase()} • Marks: ${mySub.marksObtained ?? 'Pending'}/${assign.maxMarks}`, 24, y);
          y += 5;
          if (mySub.feedback) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(71, 85, 105);
            doc.text(`Faculty Remarks: ${mySub.feedback}`, 24, y);
            y += 5;
          }
        }

        y += 5;
        doc.setDrawColor(226, 232, 240);
        doc.line(20, y, 190, y);
        y += 8;
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Zahira College Mawanella • Official Academic Record • Confidential', 20, 285);

      doc.save(`Zahira_College_Mawanella_Assignments_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('Assignments PDF error:', e);
    }
  };

  // Export single assignment worksheet or task brief to PDF
  const handleExportSingleAssignmentPDF = (assign: Assignment) => {
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('ZAHIRA COLLEGE MAWANELLA • 2K28 SCIENCE EM', 20, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('OFFICIAL COURSEWORK TASK SHEET & SUBMISSION BRIEF', 20, 28);
      doc.text('Mawanella, Sri Lanka • G.C.E. Advanced Level Science Stream', 20, 33);

      doc.setDrawColor(203, 213, 225);
      doc.line(20, 37, 190, 37);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text(assign.title, 20, 48);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Due Date: ${assign.dueDate}`, 20, 56);
      doc.text(`Maximum Marks: ${assign.maxMarks} Points`, 85, 56);
      doc.text('Target: Zahira College 2k28 Science EM', 135, 56);

      let y = 68;
      doc.setFillColor(241, 245, 249);
      doc.rect(20, y, 170, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text('COURSEWORK INSTRUCTIONS & GUIDELINES', 24, y + 5);

      y += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const instLines = doc.splitTextToSize(assign.instructions || assign.description, 165);
      doc.text(instLines, 24, y);
      y += instLines.length * 5 + 6;

      if (assign.rubric) {
        doc.setFillColor(254, 243, 199);
        doc.rect(20, y, 170, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(146, 64, 14);
        doc.text('EVALUATION RUBRIC & CRITERIA', 24, y + 5);

        y += 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const rubLines = doc.splitTextToSize(assign.rubric, 165);
        doc.text(rubLines, 24, y);
        y += rubLines.length * 5 + 8;
      }

      // Check student submission
      const assignSubs = submissions.filter((s) => s.assignmentId === assign.id);
      const mySub = assignSubs.find((s) => s.studentId === userProfile?.userId);

      if (mySub) {
        doc.setFillColor(236, 253, 245);
        doc.rect(20, y, 170, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(6, 95, 70);
        doc.text(`STUDENT SUBMISSION RECORD (${mySub.status.toUpperCase()})`, 24, y + 5);

        y += 12;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(`Student: ${mySub.studentName}`, 24, y);
        doc.text(`Submitted At: ${new Date(mySub.submittedAt).toLocaleString()}`, 110, y);

        y += 6;
        if (mySub.marksObtained !== undefined) {
          doc.setTextColor(22, 101, 52);
          doc.text(`Final Certified Score: ${mySub.marksObtained} / ${assign.maxMarks}`, 24, y);
          y += 6;
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const subContentLines = doc.splitTextToSize(`Work / Solution: ${mySub.content}`, 165);
        doc.text(subContentLines, 24, y);
        y += subContentLines.length * 4.5 + 4;

        if (mySub.feedback) {
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(30, 58, 138);
          const feedbackLines = doc.splitTextToSize(`Teacher Feedback: ${mySub.feedback}`, 165);
          doc.text(feedbackLines, 24, y);
          y += feedbackLines.length * 4.5;
        }
      } else {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, y, 170, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('STUDENT WORKING & SOLUTION SPACE (OFFLINE WORKSHEET)', 24, y + 5);

        y += 14;
        doc.setDrawColor(226, 232, 240);
        for (let i = 0; i < 5; i++) {
          doc.line(24, y, 186, y);
          y += 9;
        }
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Zahira College Mawanella Science Project management • Official Academic Document', 20, 285);

      doc.save(`Zahira_College_Mawanella_Assignment_${assign.id}.pdf`);
    } catch (e) {
      console.error('Single assignment PDF error:', e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-slate-900">
              Coursework Assignments & Submissions
            </h2>
            <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-0.5 text-[11px] font-bold border border-blue-200">
              Zahira College Mawanella
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            2k28 Science EM coursework briefs, live student submissions, and Gemini Flash rubric evaluation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAllPDF}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition-colors shadow-2xs shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export to PDF</span>
          </button>

          {(activeRole === 'teacher' || activeRole === 'admin') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assignment</span>
            </button>
          )}
        </div>
      </div>

      {/* Assignment List */}
      <div className="space-y-6">
        {assignments.map((assign) => {
          const assignSubmissions = submissions.filter((s) => s.assignmentId === assign.id);
          const userSub = assignSubmissions.find(
            (s) => s.studentId === userProfile?.userId
          );

          return (
            <div
              key={assign.id}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs hover:border-stone-300 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-stone-100 text-stone-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      2k28 Science EM
                    </span>
                    <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                      Max Marks: {assign.maxMarks}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    {assign.title}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">{assign.description}</p>

                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs text-stone-700">
                    <p className="font-semibold text-stone-800 mb-1">Instructions & Guidelines:</p>
                    <p className="whitespace-pre-line text-stone-600">{assign.instructions}</p>
                    {assign.rubric && (
                      <p className="mt-2 text-[11px] text-amber-900/80 font-medium pt-2 border-t border-stone-200">
                        <span className="font-bold">Grading Rubric:</span> {assign.rubric}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start lg:items-end justify-between gap-4 shrink-0">
                  <div className="text-left lg:text-right text-xs">
                    <span className="flex items-center gap-1.5 text-stone-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Due: {new Date(assign.dueDate).toLocaleDateString()}
                    </span>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {assignSubmissions.length} live submission(s) recorded
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {assign.fileUrl && (
                      <a
                        href={assign.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/90 hover:bg-blue-100 px-3 py-1.5 text-[11px] font-bold text-blue-800 transition-colors shadow-2xs"
                        title="Open / Download Teacher's Question Paper PDF"
                      >
                        <Paperclip className="w-3 h-3 text-blue-700" />
                        <span>Question Paper ({assign.fileSize || 'PDF'})</span>
                      </a>
                    )}

                    <button
                      onClick={() => handleExportSingleAssignmentPDF(assign)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700 transition-colors shadow-2xs"
                      title="Download PDF Coursework Brief"
                    >
                      <Download className="w-3 h-3 text-blue-600" />
                      <span>PDF Document</span>
                    </button>

                    {activeRole === 'student' && (
                      <div>
                        {userSub ? (
                          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-800 font-semibold flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Status: {userSub.status.toUpperCase()}</span>
                              {userSub.marksObtained !== undefined && (
                                <span className="ml-1 text-emerald-950 font-bold">
                                  ({userSub.marksObtained}/{assign.maxMarks})
                                </span>
                              )}
                            </span>

                            {userSub.fileUrl && (
                              <a
                                href={userSub.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 underline hover:text-emerald-950 ml-1 bg-emerald-100/70 px-2 py-0.5 rounded"
                                title="View your uploaded PDF submission"
                              >
                                <Paperclip className="w-3 h-3 text-emerald-700" />
                                <span>View Uploaded PDF ({userSub.fileSize || 'Attached'})</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedAssignmentForSubmit(assign);
                              setSubmissionPdfFile(null);
                              setSubmissionPdfBase64(null);
                              setSubmissionPdfError(null);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5 text-white" />
                            <span>Submit Solution</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submissions List for Teachers/Admin */}
              {(activeRole === 'teacher' || activeRole === 'admin') && assignSubmissions.length > 0 && (
                <div className="mt-6 pt-5 border-t border-stone-100">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
                    Student Submissions ({assignSubmissions.length})
                  </h4>

                  <div className="divide-y divide-stone-100 border border-stone-100 rounded-xl overflow-hidden">
                    {assignSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3.5 bg-stone-50/50 hover:bg-stone-50 transition-colors flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-stone-400" />
                          <div>
                            <p className="font-bold text-stone-900">{sub.studentName}</p>
                            <p className="text-[11px] text-stone-400">
                              Submitted: {new Date(sub.submittedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap">
                          {sub.fileUrl && (
                            <a
                              href={sub.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-800 hover:bg-blue-100 transition-colors"
                              title="View student's uploaded PDF file"
                            >
                              <Paperclip className="w-3 h-3 text-blue-700" />
                              <span>Student PDF ({sub.fileSize || 'Attached'})</span>
                            </a>
                          )}

                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              sub.status === 'graded'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {sub.status} {sub.marksObtained !== undefined && `(${sub.marksObtained}/${assign.maxMarks})`}
                          </span>

                          <button
                            onClick={() => handleOpenGradingModal(sub)}
                            className="inline-flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-stone-800 transition-colors"
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>{sub.status === 'graded' ? 'Review & Edit' : 'Grade with Gemini AI'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Teacher Grading & AI Assistant Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-stone-200 bg-white p-6 md:p-8 shadow-2xl relative my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-5">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  Faculty Grading Studio
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-900 mt-0.5">
                  Grading: {gradingSubmission.submission.studentName}
                </h3>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="rounded-lg p-1.5 hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {/* Student Submission Content */}
              <div>
                <label className="font-bold text-stone-700 uppercase tracking-wider block mb-1.5 text-[11px]">
                  Student&apos;s Submitted Solution
                </label>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 whitespace-pre-wrap font-mono text-[11px] text-stone-800 leading-relaxed">
                  {gradingSubmission.submission.content}
                </div>

                {gradingSubmission.submission.fileUrl && (
                  <div className="mt-3 p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-blue-950 text-xs">
                          {gradingSubmission.submission.fileName || 'Student Coursework Submission.pdf'}
                        </p>
                        <p className="text-[11px] text-blue-700">
                          {gradingSubmission.submission.fileSize || 'PDF Document'} • Uploaded directly from student device
                        </p>
                      </div>
                    </div>
                    <a
                      href={gradingSubmission.submission.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold transition-colors shadow-2xs shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View PDF</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Gemini AI Grading Suggestions Section */}
              <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h4 className="font-serif text-sm font-bold text-stone-900">
                      Gemini Flash Rubric Evaluation
                    </h4>
                  </div>
                  <button
                    onClick={handleRunAIGrading}
                    disabled={aiGradingLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{aiGradingLoading ? 'Evaluating via Gemini Flash...' : 'Run Gemini Flash Evaluation'}</span>
                  </button>
                </div>

                {aiSuggestions ? (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-stone-700">Recommended Score:</span>
                      <span className="rounded-full bg-amber-500 text-stone-950 font-bold px-2.5 py-0.5 text-xs">
                        {aiSuggestions.recommendedScore} / {gradingSubmission.assignment.maxMarks} marks
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600 italic">
                      AI Reasoning: {aiSuggestions.reasoning}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                        <span className="font-bold text-emerald-900 text-[10px] uppercase">Identified Strengths:</span>
                        <ul className="mt-1 space-y-1 text-emerald-950 text-[11px]">
                          {aiSuggestions.strengths?.map((s, i) => (
                            <li key={i}>• {s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-100">
                        <span className="font-bold text-rose-900 text-[10px] uppercase">Areas for Growth:</span>
                        <ul className="mt-1 space-y-1 text-rose-950 text-[11px]">
                          {aiSuggestions.weaknesses?.map((w, i) => (
                            <li key={i}>• {w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-500">
                    Click &quot;Run Gemini Flash Evaluation&quot; to have Gemini analyze the submission against the assignment rubric and draft constructive written feedback.
                  </p>
                )}
              </div>

              {/* Teacher Approval & Overrides */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="font-bold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                    Approved Score (Out of {gradingSubmission.assignment.maxMarks})
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={gradingSubmission.assignment.maxMarks}
                    value={finalScore}
                    onChange={(e) => setFinalScore(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-stone-300 p-2.5 text-sm font-bold text-stone-900 focus:border-stone-900 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-bold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                    Teacher Written Feedback
                  </label>
                  <textarea
                    rows={3}
                    value={finalFeedback}
                    onChange={(e) => setFinalFeedback(e.target.value)}
                    placeholder="Enter written feedback for the student..."
                    className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-stone-100 pt-4">
              <button
                onClick={() => setGradingSubmission(null)}
                className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOfficialGrade}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Save Grade</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Submission Modal */}
      {selectedAssignmentForSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Submit: {selectedAssignmentForSubmit.title}
              </h3>
              <button
                onClick={() => setSelectedAssignmentForSubmit(null)}
                className="rounded-lg p-1.5 hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="rounded-lg bg-stone-50 p-3 border border-stone-200 text-stone-600">
                <span className="font-bold text-stone-800">Prompt Guidelines: </span>
                {selectedAssignmentForSubmit.instructions}
              </div>

              {/* Direct PDF Upload from Device (Max 10 MB) */}
              <div>
                <label className="font-semibold text-stone-800 uppercase tracking-wider block mb-1.5 text-[11px] flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Upload Solution PDF From Device (Max 10 MB)</span>
                </label>

                <label
                  htmlFor="student-pdf-upload"
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    submissionPdfFile
                      ? 'border-emerald-300 bg-emerald-50/50'
                      : 'border-stone-300 bg-stone-50/70 hover:bg-stone-100 hover:border-stone-400'
                  }`}
                >
                  <input
                    id="student-pdf-upload"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleStudentFileSelect}
                    className="hidden"
                  />

                  {submissionPdfFile ? (
                    <div className="flex items-center gap-3 text-left w-full">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <File className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-emerald-950 text-xs truncate">{submissionPdfFile.name}</p>
                        <p className="text-[11px] text-emerald-700">
                          {(submissionPdfFile.size / (1024 * 1024)).toFixed(2)} MB • Verified under 10 MB limit
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSubmissionPdfFile(null);
                          setSubmissionPdfBase64(null);
                        }}
                        className="p-1 rounded-lg hover:bg-emerald-200 text-emerald-800"
                        title="Remove attached file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-1">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="font-bold text-stone-900 text-xs">
                        Select PDF coursework from your device
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Direct upload without external URLs • Maximum file size: 10 MB
                      </p>
                    </div>
                  )}
                </label>

                {submissionPdfError && (
                  <div className="mt-2 p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 text-[11px]">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{submissionPdfError}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1.5 text-[11px]">
                  Written Solution / Analytical Comments (Optional if PDF is attached)
                </label>
                <textarea
                  rows={4}
                  value={studentContent}
                  onChange={(e) => setStudentContent(e.target.value)}
                  placeholder="Type notes, formulas, or explanation accompanying your submission..."
                  className="w-full rounded-xl border border-stone-300 p-3 text-xs text-stone-900 font-mono focus:border-stone-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                disabled={isSubmitting}
                onClick={() => {
                  setSelectedAssignmentForSubmit(null);
                  setSubmissionPdfFile(null);
                  setSubmissionPdfBase64(null);
                  setSubmissionPdfError(null);
                }}
                className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStudentSubmit}
                disabled={isSubmitting || (!studentContent.trim() && !submissionPdfFile)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50 shadow-xs transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Uploading (Max 10MB)...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                    <span>Submit Solution</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-stone-900">Create Coursework Assignment</h3>
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1.5 hover:bg-stone-100 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Assignment Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Combined Mathematics: Calculus Limits & Continuity Problem Set 1"
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief summary of the coursework..."
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Detailed Instructions & Question Prompts
                </label>
                <textarea
                  rows={3}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="Numbered questions, mathematical equations, or research requirements..."
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Rubric & Evaluation Criteria
                </label>
                <textarea
                  rows={2}
                  value={newRubric}
                  onChange={(e) => setNewRubric(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                    Maximum Marks
                  </label>
                  <input
                    type="number"
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                  />
                </div>
              </div>

              {/* Attach Question Paper PDF (Device Upload, Max 10 MB) */}
              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1.5 text-[11px] flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Attach Question Paper PDF (Optional • Max 10 MB limit)</span>
                </label>

                <label
                  htmlFor="assignment-pdf-upload"
                  className={`border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    assignmentPdfFile
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-stone-300 bg-stone-50/70 hover:bg-stone-100 hover:border-stone-400'
                  }`}
                >
                  <input
                    id="assignment-pdf-upload"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleAssignmentFileSelect}
                    className="hidden"
                  />

                  {assignmentPdfFile ? (
                    <div className="flex items-center gap-3 text-left w-full">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <File className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-blue-950 text-xs truncate">{assignmentPdfFile.name}</p>
                        <p className="text-[11px] text-blue-700">
                          {(assignmentPdfFile.size / (1024 * 1024)).toFixed(2)} MB • Verified under 10 MB limit
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAssignmentPdfFile(null);
                          setAssignmentPdfBase64(null);
                        }}
                        className="p-1 rounded-lg hover:bg-blue-200 text-blue-800"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="font-bold text-stone-800 text-xs flex items-center justify-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Select PDF question paper from your device</span>
                      </p>
                      <p className="text-[10px] text-stone-500">
                        Uploads directly without requiring URL • Maximum size: 10 MB
                      </p>
                    </div>
                  )}
                </label>

                {assignmentPdfError && (
                  <div className="mt-2 p-2 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 text-[11px]">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{assignmentPdfError}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                disabled={isPublishingAssignment}
                onClick={() => {
                  setShowCreateModal(false);
                  setAssignmentPdfFile(null);
                  setAssignmentPdfBase64(null);
                  setAssignmentPdfError(null);
                }}
                className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAssignment}
                disabled={isPublishingAssignment || !newTitle.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50 shadow-xs transition-colors"
              >
                {isPublishingAssignment ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Publishing & Uploading PDF...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                    <span>Publish Assignment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
