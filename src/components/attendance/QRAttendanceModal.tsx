import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  X,
  Volume2,
  Users,
  ShieldCheck,
  Building,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { collection, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db, sanitizeFirestoreDoc } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { AttendanceCheckInLog, AttendanceRecord, QRAttendanceSession } from '../../types';
import { broadcastSystemNotification } from '../../services/notificationService';

interface QRAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId?: string;
  className?: string;
  selectedDate?: string;
  mode: 'generate' | 'scan'; // 'generate' for teacher/admin, 'scan' for student
}

export const QRAttendanceModal: React.FC<QRAttendanceModalProps> = ({
  isOpen,
  onClose,
  classId = 'class-2k28-science-em',
  className = '2k28 Science EM',
  selectedDate = new Date().toISOString().split('T')[0],
  mode,
}) => {
  const { userProfile, activeRole } = useAuth();
  const isTeacherOrAdmin = activeRole === 'teacher' || activeRole === 'admin';

  // Teacher generator state
  const [selectedSubject, setSelectedSubject] = useState('Combined Mathematics');
  const [selectedRoom, setSelectedRoom] = useState('Science Complex - Hall 28');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recentScans, setRecentScans] = useState<AttendanceCheckInLog[]>([]);

  // Student scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState<string>('');
  const [manualCode, setManualCode] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const recordId = `att-${selectedDate}-${classId}`;

  // 1. Listen for real-time check-in logs for this record
  useEffect(() => {
    if (!isOpen) return;

    const unsub = onSnapshot(doc(db, 'attendance', recordId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AttendanceRecord;
        if (data.checkInLogs) {
          setRecentScans(
            [...data.checkInLogs].sort(
              (a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
            )
          );
        }
        if (data.activeSession && mode === 'generate') {
          setSessionToken(data.activeSession.secretToken);
        }
      }
    });

    return () => unsub();
  }, [isOpen, recordId, mode]);

  // 2. Generate or refresh classroom QR code (Teacher mode)
  const generateNewSession = async () => {
    const rawToken = `ZAH-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const expiresAt = new Date(Date.now() + 90 * 60 * 1000).toISOString(); // 90 min validity for the lecture

    const payload = JSON.stringify({
      school: 'Zahira College Mawanella',
      cohort: '2k28 Science EM',
      classId,
      date: selectedDate,
      subject: selectedSubject,
      room: selectedRoom,
      token: rawToken,
      expiresAt,
    });

    try {
      const url = await QRCode.toDataURL(payload, {
        width: 380,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });

      setQrDataUrl(url);
      setSessionToken(rawToken);

      const sessionObj: QRAttendanceSession = {
        sessionId: `sess-${Date.now()}`,
        classId,
        className,
        date: selectedDate,
        subjectName: selectedSubject,
        room: selectedRoom,
        generatedBy: userProfile?.userId || 'teacher_lead',
        teacherName: userProfile?.fullName || 'Faculty Lead',
        secretToken: rawToken,
        validUntil: expiresAt,
        isActive: true,
        qrPayload: payload,
        createdAt: new Date().toISOString(),
      };

      // Save to attendance record in Firestore
      await setDoc(
        doc(db, 'attendance', recordId),
        sanitizeFirestoreDoc({
          id: recordId,
          classId,
          date: selectedDate,
          teacherId: userProfile?.userId || 'teacher_lead',
          activeSession: sessionObj,
        }),
        { merge: true }
      );
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  useEffect(() => {
    if (isOpen && mode === 'generate') {
      generateNewSession();
    }
  }, [isOpen, mode, selectedSubject, selectedRoom]);

  // 3. Web Camera Live QR Scanning for Students
  const startCamera = async () => {
    setScanStatus('scanning');
    setScanMessage('Position the classroom projector QR code within camera frame...');
    setCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraActive(false);
      setScanStatus('idle');
      setScanMessage('Camera permission not available. You can enter the classroom code manually below.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setCameraActive(false);
  };

  const tickScan = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.height = videoRef.current.videoHeight;
          canvas.width = videoRef.current.videoWidth;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            handleProcessScannedPayload(code.data);
            return;
          }
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(tickScan);
  };

  // 4. Process Attendance Check-In from QR code or manual token
  const handleProcessScannedPayload = async (payloadString: string) => {
    stopCamera();
    setScanStatus('scanning');
    setScanMessage('Validating Zahira College lecture session credentials...');

    try {
      let parsedPayload: any = null;
      let token = payloadString.trim();

      try {
        parsedPayload = JSON.parse(payloadString);
        token = parsedPayload.token || token;
      } catch {
        // Plain string token fallback
      }

      const targetStudentId = userProfile?.userId;
      if (!targetStudentId) {
        setScanStatus('error');
        setScanMessage('Please sign in to register your attendance.');
        return;
      }

      // Read current attendance doc from Firestore
      const attRef = doc(db, 'attendance', recordId);
      const snap = await getDoc(attRef);

      const existingRecord = snap.exists() ? (snap.data() as AttendanceRecord) : null;
      const currentRecords = existingRecord?.records || {};
      const currentLogs = existingRecord?.checkInLogs || [];

      // Verify token matches active session if present
      const activeSess = existingRecord?.activeSession;
      if (activeSess && activeSess.secretToken) {
        const isMatch =
          token.toUpperCase().includes(activeSess.secretToken.toUpperCase()) ||
          activeSess.secretToken.toUpperCase().includes(token.toUpperCase());
        if (!isMatch) {
          setScanStatus('error');
          setScanMessage('Invalid lecture QR code for today’s session. Please scan the current code on the classroom screen.');
          return;
        }
      }

      // Mark student as present
      currentRecords[targetStudentId] = 'present';

      const newLog: AttendanceCheckInLog = {
        id: `log-${Date.now()}-${targetStudentId}`,
        recordId,
        classId,
        date: selectedDate,
        studentId: targetStudentId,
        studentName: userProfile?.fullName || 'Student Scholar',
        studentEmail: userProfile?.email || '',
        status: 'present',
        checkInTime: new Date().toISOString(),
        method: 'qr_scan',
        sessionToken: token,
      };

      const updatedLogs = [newLog, ...currentLogs.filter((l) => l.studentId !== targetStudentId)];

      await setDoc(
        attRef,
        sanitizeFirestoreDoc({
          id: recordId,
          classId,
          date: selectedDate,
          teacherId: existingRecord?.teacherId || 'faculty_lead',
          records: currentRecords,
          checkInLogs: updatedLogs,
          createdAt: existingRecord?.createdAt || new Date().toISOString(),
        }),
        { merge: true }
      );

      // Record daily streak locally
      const streakKey = `zahira_streak_${targetStudentId}`;
      const curStreak = parseInt(localStorage.getItem(streakKey) || '5', 10);
      localStorage.setItem(streakKey, String(curStreak + 1));

      // Note: Attendance check-in is logged in class registers and does not broadcast globally
      setScanStatus('success');
      setScanMessage(`Assalamu Alaikum, ${userProfile?.fullName}! Attendance verified for Hall 28 (${new Date().toLocaleTimeString()}). +50 XP Diligence Streak Bonus awarded.`);
    } catch (err: any) {
      console.error('Check-in error:', err);
      setScanStatus('error');
      setScanMessage(err?.message || 'Check-in failed. Please retry or inform the lecturer.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessScannedPayload(manualCode.trim());
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 w-full ${
          isFullscreen ? 'max-w-5xl h-[92vh] flex flex-col justify-between' : 'max-w-2xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base">
                {mode === 'generate' ? 'Classroom Session QR Code Generator' : 'Scan Classroom Attendance QR Code'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Zahira College Mawanella • 2k28 Science EM (Hall 28)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'generate' && (
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={isFullscreen ? 'Exit Presentation Mode' : 'Projector Presentation Mode'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[78vh] space-y-6">
          {mode === 'generate' ? (
            /* TEACHER/ADMIN GENERATE MODE */
            <div className="space-y-6">
              {/* Lecture Settings bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lecture Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Combined Mathematics">Combined Mathematics (Pure & Applied)</option>
                    <option value="Physics">Physics (Mechanics & Waves)</option>
                    <option value="Chemistry">Chemistry (Inorganic & Physical)</option>
                    <option value="Biology / Bioscience">Biology / Bioscience (Cell & Genetics)</option>
                    <option value="ICT / Computer Science">ICT (Information & Communication Tech)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hall & Classroom Location
                  </label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Science Complex - Hall 28">Science Complex - Hall 28</option>
                    <option value="Main College Auditorium">Main College Auditorium</option>
                    <option value="Physics Laboratory">Physics Laboratory</option>
                    <option value="Chemistry Laboratory">Chemistry Laboratory</option>
                  </select>
                </div>
              </div>

              {/* QR Code Card */}
              <div className="rounded-2xl border-2 border-dashed border-blue-400 dark:border-blue-600/60 bg-blue-50/40 dark:bg-blue-950/20 p-6 flex flex-col items-center justify-center text-center">
                {qrDataUrl ? (
                  <div className="relative group p-3 bg-white rounded-2xl shadow-lg border border-slate-200">
                    <img
                      src={qrDataUrl}
                      alt="Classroom Attendance QR Code"
                      className={`mx-auto rounded-xl transition-all ${
                        isFullscreen ? 'w-80 h-80' : 'w-56 h-56'
                      }`}
                    />
                    <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-mono font-bold text-slate-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>{sessionToken}</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                    Generating secure QR token...
                  </div>
                )}

                <div className="mt-4 max-w-md">
                  <h4 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                    {selectedSubject} • {selectedRoom}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Project this QR code onto the lecture screen or whiteboard. Students scan using their devices to verify classroom attendance in real time.
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={generateNewSession}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    <span>Rotate Session Token</span>
                  </button>

                  <div className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-3 py-1.5 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Active Valid Lecture Period</span>
                  </div>
                </div>
              </div>

              {/* Real-Time Check-In Stream */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Live Classroom Check-Ins ({recentScans.length})
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                    Real-Time Firestore Listener
                  </span>
                </div>

                {recentScans.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    Waiting for students to scan the classroom QR code...
                  </p>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {recentScans.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                            ✓
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {log.studentName}
                            </span>
                            <span className="text-slate-400 text-[10px] ml-1.5">
                              {log.studentEmail}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* STUDENT SCAN MODE */
            <div className="space-y-6">
              {/* Camera Scanner View */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-blue-500/80 shadow-md aspect-video max-h-72 flex items-center justify-center">
                {cameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Scanning Reticle Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-red-500 rounded-2xl relative animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-red-500 rounded-tl -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-red-500 rounded-tr -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-red-500 rounded-bl -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-red-500 rounded-br -mb-1 -mr-1"></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center text-white space-y-3">
                    <div className="h-14 w-14 rounded-2xl bg-blue-600/30 border border-blue-400 flex items-center justify-center mx-auto text-blue-400">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Classroom Webcam Scanner</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Activate your camera to scan the Zahira College lecture QR code on the classroom board.
                      </p>
                    </div>

                    <button
                      onClick={startCamera}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Camera Scanner</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Status Message */}
              {scanMessage && (
                <div
                  className={`p-4 rounded-xl text-xs font-medium flex items-start gap-2.5 ${
                    scanStatus === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                      : scanStatus === 'error'
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800'
                      : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800'
                  }`}
                >
                  {scanStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : scanStatus === 'error' ? (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <span>{scanMessage}</span>
                </div>
              )}

              {/* Manual Code Input or Instant Demo Check-In */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Enter classroom code (e.g. ZAH-XXXX-XXXX)"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-colors"
                  >
                    Verify Code
                  </button>
                </form>

                {/* Instant Simulation button for testing classroom check-in */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Simulate Classroom Lecture Check-In
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Test instant real-time check-in without scanning physical webcam
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleProcessScannedPayload(
                        JSON.stringify({
                          school: 'Zahira College Mawanella',
                          classId,
                          date: selectedDate,
                          token: 'ZAH-SIM-2K28-TEST',
                        })
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Quick Check-In</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span>Zahira College Science Complex • G.C.E. Advanced Level 2028</span>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
