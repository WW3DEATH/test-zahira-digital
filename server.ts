import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Shared Gemini AI client with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// 1. Gemini AI Study Tutor
app.post('/api/gemini/tutor', async (req, res) => {
  try {
    const { subject, topic, style, messages, enableThinking } = req.body;

    const styleInstructions: Record<string, string> = {
      simple: 'Explain in clear, simple terms suitable for beginners with easy analogies.',
      step_by_step: 'Break down the concept or problem systematically step-by-step with checkpoints.',
      socratic: 'Adopt the Socratic method: guide the student by asking thoughtful questions and giving clues.',
      detailed: 'Provide in-depth academic rigor, comprehensive explanations, and practical real-world applications.'
    };

    const chosenStyle = styleInstructions[style] || styleInstructions.step_by_step;

    const systemInstruction = `You are the AI Academic Tutor for "Zahira College 2k28 Science EM" (English Medium).
You specialize in A/L Science subjects: Combined Mathematics, Physics, Chemistry, Biology, and ICT.
Subject: ${subject || 'Science EM'}
Current Topic: ${topic || 'General Science'}
Tuning Style: ${chosenStyle}

Your rules:
1. Warm, encouraging, and academically rigorous for Zahira College 2k28 Science EM scholars.
2. If student asks a homework question, never provide just the raw answer; walk through how to solve it systematically.
3. Formulate equations or key formulas cleanly using markdown.
4. Conclude with a quick self-test question or interactive check for understanding.`;

    const contents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const config: any = {
      systemInstruction,
      temperature: 0.7,
    };

    if (enableThinking) {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH,
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config,
    });

    res.json({
      reply: response.text || 'I could not generate an explanation at this time.',
    });
  } catch (error: any) {
    console.error('Gemini Tutor Error:', error);
    res.status(500).json({ error: error.message || 'Tutor service error' });
  }
});

// 2. Gemini AI Quiz Generator
app.post('/api/gemini/quiz-generate', async (req, res) => {
  try {
    const { topic, subject, classLevel, difficulty, numQuestions, questionTypes } = req.body;

    const prompt = `Generate an academic quiz for ${classLevel || 'High School'} students.
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty || 'medium'}
Number of Questions: ${numQuestions || 5}
Allowed Question Types: ${(questionTypes || ['multiple_choice', 'true_false']).join(', ')}

Create balanced, high quality questions. Each question must have:
- questionText: clear, unambiguous question
- type: 'multiple_choice' | 'true_false' | 'short_answer'
- options: list of 4 choices for multiple_choice, or ["True", "False"] for true_false, empty array for short_answer
- correctAnswer: the exact string matching the correct option or expected short answer
- explanation: educational reasoning why this answer is correct
- marks: number of marks (default 1 to 5)
- difficulty: 'easy' | 'medium' | 'hard'`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              questionText: { type: Type.STRING },
              type: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              marks: { type: Type.NUMBER },
              difficulty: { type: Type.STRING },
            },
            required: ['id', 'questionText', 'type', 'options', 'correctAnswer', 'explanation', 'marks', 'difficulty'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    res.json({ questions: parsed });
  } catch (error: any) {
    console.error('Quiz Generation Error:', error);
    res.status(500).json({ error: error.message || 'Quiz generation failed' });
  }
});

// 3. Gemini AI Grading Assistant
app.post('/api/gemini/grade-assistant', async (req, res) => {
  try {
    const { assignmentTitle, instructions, rubric, studentSubmission, maxMarks } = req.body;

    const prompt = `You are an expert academic evaluator assisting a teacher with grading student work.
Assignment: ${assignmentTitle}
Instructions: ${instructions || 'Follow assignment guidelines.'}
Teacher Rubric: ${rubric || 'Standard rubric: Accuracy, Clarity, Depth of Understanding.'}
Max Marks: ${maxMarks || 100}

Student Submission:
"""
${studentSubmission}
"""

Evaluate this student submission fairly. Provide:
1. strengths: bullet points of what the student did well
2. weaknesses: areas needing improvement or missing requirements
3. suggestedImprovements: actionable advice for the student
4. recommendedScore: suggested numeric score (between 0 and ${maxMarks || 100})
5. reasoning: brief justification for the teacher
6. feedbackDraft: a constructive, polite paragraph feedback for the student that the teacher can edit and approve.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedScore: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            feedbackDraft: { type: Type.STRING },
          },
          required: ['strengths', 'weaknesses', 'suggestedImprovements', 'recommendedScore', 'reasoning', 'feedbackDraft'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    res.json(result);
  } catch (error: any) {
    console.error('Grading Assistant Error:', error);
    res.status(500).json({ error: error.message || 'AI grading assistance failed' });
  }
});

// 4. Gemini AI Teacher Assistant (Lesson plans, rubrics, question banks)
app.post('/api/gemini/teacher-assistant', async (req, res) => {
  try {
    const { taskType, subject, gradeLevel, topic, additionalNotes } = req.body;

    const taskPrompts: Record<string, string> = {
      lesson_plan: `Create a comprehensive, 45-minute lesson plan for ${gradeLevel} students in ${subject} on the topic "${topic}". Include Learning Objectives (Bloom's Taxonomy), Warm-Up (5 min), Direct Instruction (15 min), Guided Practice (15 min), Independent Activity, and Assessment/Exit Ticket.`,
      revision_notes: `Generate clear, high-yield student revision study notes on "${topic}" for ${gradeLevel} ${subject}. Include Key Terms & Definitions, Core Principles, Common Misconceptions, and Quick Review Formulas/Facts.`,
      question_bank: `Create a diverse question bank of 10 assessment questions (conceptual, analytical, and applied) for "${topic}" in ${gradeLevel} ${subject} with model answers and scoring breakdown.`,
      announcement_draft: `Draft a professional, engaging school/class announcement regarding "${topic}" in ${gradeLevel} ${subject}. Include context, deadlines or action items, and teacher sign-off.`,
      rubric_creator: `Generate a 4-tier grading rubric (Exemplary 4, Proficient 3, Developing 2, Beginning 1) for an assessment on "${topic}" in ${subject}. Columns: Criteria, Levels, Descriptions.`
    };

    const taskInstruction = taskPrompts[taskType] || taskPrompts.lesson_plan;

    const prompt = `${taskInstruction}
Additional Context/Preferences: ${additionalNotes || 'Standard academic standards'}.
Provide output formatted in elegant Markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an educational curriculum and pedagogical expert aiding certified classroom teachers.',
        temperature: 0.7,
      },
    });

    res.json({
      content: response.text || 'Unable to generate teaching material at this time.',
    });
  } catch (error: any) {
    console.error('Teacher Assistant Error:', error);
    res.status(500).json({ error: error.message || 'Teacher assistant service failed' });
  }
});

// 5. Gemini AI Academic Performance Insights
app.post('/api/gemini/insights', async (req, res) => {
  try {
    const { role, academicData } = req.body;

    const prompt = `You are the Zahira College 2k28 Science EM Academic Analyst.
Analyze the following verified school performance metrics for role: "${role}".

Verified Data (DO NOT invent separate raw numbers, summarize and analyze these actual stats):
${JSON.stringify(academicData, null, 2)}

Provide a concise, highly insightful diagnostic:
1. "overview": 1-2 sentence executive summary of overall progress.
2. "strengths": Array of 2-3 specific accomplishments observed from data.
3. "growthAreas": Array of 2-3 specific items needing attention or revision.
4. "actionPlan": Array of 2-3 high-impact recommended actions for the upcoming week.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            growthAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['overview', 'strengths', 'growthAreas', 'actionPlan'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Insights Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate academic insights' });
  }
});

// 6. Gemini AI Discussion Assistant (Summarize threads & extract concepts)
app.post('/api/gemini/discussion-summary', async (req, res) => {
  try {
    const { topicTitle, category, posts } = req.body;

    const prompt = `Summarize the educational discussion thread "${topicTitle}" in category "${category}".
Discussion Posts:
${(posts || []).map((p: any) => `${p.authorName} (${p.authorRole}): ${p.content}`).join('\n')}

Provide:
1. summary: A clean paragraph synthesizing the conversation.
2. keyConcepts: List of important definitions or academic concepts discussed.
3. unansweredQuestions: Any unresolved questions or points of confusion.
4. studyQuestions: 2-3 follow-up review questions based on the discussion to deepen mastery.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
            unansweredQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            studyQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['summary', 'keyConcepts', 'unansweredQuestions', 'studyQuestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Discussion Summary Error:', error);
    res.status(500).json({ error: error.message || 'Discussion summarization failed' });
  }
});

// 7. Gemini AI Floating Student Assistant (Assignments, Deadlines & Class Schedules)
app.post('/api/gemini/student-assistant', async (req, res) => {
  try {
    const { messages, studentContext } = req.body;

    const studentName = studentContext?.studentName || 'Student';
    const role = studentContext?.role || 'student';
    const assignments = studentContext?.assignments || [];
    const events = studentContext?.events || [];
    const timetable = studentContext?.timetable || [];

    const assignmentsSummary = assignments.length > 0
      ? assignments.map((a: any, i: number) => {
          const statusStr = a.isSubmitted ? `Submitted (Grade: ${a.marksObtained ?? 'Pending'}/${a.maxMarks})` : 'Pending / Not yet submitted';
          return `${i + 1}. [${a.subject || 'Coursework'}] "${a.title}" - Due: ${a.dueDate} (Max Marks: ${a.maxMarks}) - Status: ${statusStr}. Description: ${a.description || 'N/A'}`;
        }).join('\n')
      : 'No assignments registered yet in the current term.';

    const scheduleSummary = timetable.length > 0
      ? timetable.map((day: any) => `${day.day}: ${day.periods?.map((p: any) => `${p.time}: ${p.subject} (Faculty: ${p.teacher}, Room: ${p.room})`).join(' | ')}`).join('\n')
      : `Weekly Timetable for Zahira College 2k28 Science EM:
- Monday: 08:00-09:30 Combined Mathematics (Pure Maths - Mr. M. N. M. Jaasim, Room Sci-1) | 09:45-11:15 Physics (Mechanics - Dr. A. H. Farook, Physics Lab) | 11:30-13:00 Chemistry (Physical Chemistry - Mrs. S. Rizwan, Chem Lab)
- Tuesday: 08:00-09:30 Chemistry (Inorganic - Mrs. S. Rizwan) | 09:45-11:15 Combined Mathematics (Applied Maths) | 11:30-13:00 ICT / English
- Wednesday: 08:00-09:30 Physics (Waves & Optics) | 09:45-11:15 Combined Mathematics (Calculus Problem Lab) | 11:30-13:00 Chemistry Practical
- Thursday: 08:00-09:30 Physics Practical Workshop | 09:45-11:15 Combined Mathematics (Trigonometry) | 11:30-13:00 Biology / ICT
- Friday: 08:00-09:30 General Science Seminar & Revision | 09:45-11:00 Weekly Model Paper Review`;

    const eventsSummary = events.length > 0
      ? events.map((e: any) => `- ${e.date} (${e.time || 'All Day'}): ${e.title} [${e.type || 'Event'}] - ${e.description || ''}`).join('\n')
      : 'Term 1 Mid-Term Assessments: Nov 20-25 | Annual Science Day: Dec 12.';

    const systemInstruction = `You are "244 AI", the official intelligent Academic Assistant for Zahira College Mawanella (2k28 Science English Medium batch).
You are speaking to ${studentName} (${role}).

Today's Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

Here is the real-time school academic records and schedule context:
### ACTIVE COURSEWORK & ASSIGNMENTS:
${assignmentsSummary}

### CLASS TIMETABLE & WEEKLY SCHEDULE:
${scheduleSummary}

### UPCOMING SCHOOL CALENDAR EVENTS & DEADLINES:
${eventsSummary}

YOUR MISSION:
1. Provide accurate, clear, and instant answers when the student asks about their current assignments, homework status, due dates, or teacher requirements.
2. Provide precise answers when they ask about class schedules, timetable periods, lecture rooms, faculty in charge, or today's/tomorrow's schedule.
3. Be warm, motivating, collegiate, and encouraging, embodying the proud tradition of Zahira College Mawanella.
4. When asked about honours, streaks, high quiz scores, or consistent attendance, explain how the 2k28 Digital Badge System works (tiers from Bronze to Platinum, XP rewards, and Level progression) to keep scholars engaged.
5. Format dates, periods, and deadlines clearly using bullet points and bold highlights.
6. The floating widget includes a built-in Math.js Scientific Solver (supporting derivatives, limits, integrals, trigonometry, vectors, unit conversions, and algebraic simplification). When discussing math or physics equations, explain the step-by-step reasoning clearly and affirm exact computational results.
7. Keep responses crisp and easy to scan in a floating chat window.`;

    const contents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    res.json({
      reply: response.text || 'I am ready to assist with your Zahira College assignments and schedule.',
    });
  } catch (error: any) {
    console.error('Student Assistant Error:', error);
    res.status(500).json({ error: error.message || 'Student Assistant service error' });
  }
});

// Start server with Vite middleware in development or static in production
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zahira College 2k28 Science EM portal server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
