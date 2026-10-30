# Security Specification & Test Definitions

## 1. Data Invariants
- Admin email `mnmjaasim@gmail.com` is granted administrative access.
- User profiles can only be written by the authenticated user themselves (or admin) with bounded string lengths.
- Submissions can only be created by the student themselves. Teachers and admins can update marks and feedback.
- Test marks can only be recorded by teachers or admins.
- Attendance can only be marked by teachers or admins.
- Announcements can be created by teachers and admins.
- Quizzes can only be created and edited by teachers and admins; students can submit quiz attempts.
- Conversations & messages can only be read and created by authorized participants.
- Student tutor sessions are strictly private to the student and admin.
- Notifications can only be accessed by the target recipient.

## 2. The Dirty Dozen Payloads (Adversarial Test Vectors)
1. User Profile Privilege Escalation: Student attempts to update `role: "admin"` on their profile.
2. Submission Grade Forgery: Student attempts to directly write `marksObtained: 100` on their own pending submission.
3. Test Mark Unauthorized Insertion: Student attempts to insert a record into `/testMarks/mark123`.
4. Attendance Tampering: Student attempts to set their attendance to `present` on `/attendance/att123`.
5. Class Deletion: Non-admin user attempts to delete `/classes/grade-10`.
6. Private Chat Snooping: Unrelated user attempts to read `/conversations/conv456`.
7. Message Impersonation: User A attempts to write a message with `senderId: "userB"`.
8. Announcement Spoofing: Student attempts to post school-wide announcement to `/announcements/ann789`.
9. Quiz Answer Key Manipulation: Student attempts to update questions and correct answers in `/quizzes/quiz1`.
10. Tutor Session Snoop: Student A attempts to read Student B's `/tutorSessions/sess99`.
11. Notification Poisoning: User attempts to write spam notification into another user's inbox without sender verification.
12. Denial of Wallet Payload: Attacker attempts to write a 2MB junk string payload into user bio or discussion post.
