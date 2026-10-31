import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, AlertCircle, GraduationCap, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>('student');
  const [selectedSubject, setSelectedSubject] = useState('Combined Mathematics');
  const [customSubject, setCustomSubject] = useState('');
  const [studentStream, setStudentStream] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (e: any) {
      console.warn(e);
      setError(e.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const finalSubject = selectedSubject === 'Other' ? customSubject.trim() : selectedSubject;
        await signUpWithEmail(email, password, name, selectedRole, {
          subject: selectedRole === 'teacher' ? finalSubject : undefined,
          stream: selectedRole === 'student' ? studentStream.trim() : undefined,
        });
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (e: any) {
      console.warn(e);
      setError(e.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-6 md:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-900 text-red-500 mb-3 shadow-md">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-blue-950">
            {isSignUp ? 'Create Scholar / Faculty Account' : 'Sign in to Zahira College 2k28 Science EM'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Official portal for Zahira College 2k28 Science EM
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold block">
                {error.includes('operation-not-allowed')
                  ? 'Authentication Provider Disabled in Firebase'
                  : error}
              </span>
              {error.includes('operation-not-allowed') && (
                <p className="text-[11px] text-rose-700 mt-1">
                  Email/Password sign-in is disabled in your Firebase project. In the Firebase Console, go to <strong>Authentication &rarr; Sign-in method</strong>, click <strong>Email/Password</strong>, and toggle <strong>Enable</strong>.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white py-2.5 px-4 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition-all shadow-xs mb-3"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-[10px] uppercase font-bold text-stone-400">or with email</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {!isSignUp && (
            <div className="mb-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                Quick Access Profiles:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setEmail('mnmjaasim@gmail.com');
                    setPassword('jaasim2010');
                    try {
                      setLoading(true);
                      await signInWithEmail('mnmjaasim@gmail.com', 'jaasim2010');
                      onClose();
                    } catch (e: any) {
                      setError(e.message || 'Quick login failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="p-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 text-[11px] font-bold text-left transition-all flex items-center justify-between shadow-2xs"
                >
                  <span className="truncate">M. N. M. Jaasim</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-red-600 text-white font-extrabold shrink-0">Admin</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setEmail('scholar@zahira.lk');
                    setPassword('zahira2028');
                    try {
                      setLoading(true);
                      await signInWithEmail('scholar@zahira.lk', 'zahira2028');
                      onClose();
                    } catch (e: any) {
                      setError(e.message || 'Quick login failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="p-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 text-[11px] font-bold text-left transition-all flex items-center justify-between shadow-2xs"
                >
                  <span className="truncate">Science Scholar</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-blue-600 text-white font-extrabold shrink-0">Student</span>
                </button>
              </div>
            </div>
          )}

          {isSignUp && (
            <>
              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Sign Up As (Choose Role)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('student')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 font-bold border transition-all ${
                      selectedRole === 'student'
                        ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-red-400" />
                    <span>Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('teacher')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 font-bold border transition-all ${
                      selectedRole === 'teacher'
                        ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-blue-300" />
                    <span>Teacher / Faculty</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. M. N. M. Jaasim"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
                />
              </div>

              {selectedRole === 'teacher' && (
                <div>
                  <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px] flex items-center justify-between">
                    <span>Teaching Subject</span>
                    <span className="text-[10px] text-amber-700 font-normal">Science EM Curriculum</span>
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
                  >
                    <option value="Combined Mathematics">Combined Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Information & Communication Technology (ICT)">Information & Communication Technology (ICT)</option>
                    <option value="General English">General English</option>
                    <option value="Agricultural Science">Agricultural Science</option>
                    <option value="Other">Other Subject...</option>
                  </select>
                  {selectedSubject === 'Other' && (
                    <input
                      type="text"
                      required
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="Specify your teaching subject"
                      className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
                    />
                  )}
                </div>
              )}

              {selectedRole === 'student' && (
                <div>
                  <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px] flex items-center justify-between">
                    <span>Academic Stream</span>
                    <span className="text-[10px] text-stone-400 font-normal">Zahira 2k28 Science EM</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentStream}
                    onChange={(e) => setStudentStream(e.target.value)}
                    placeholder="e.g. Biological Science or Physical Science"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      'Biological Science',
                      'Physical Science (Maths)',
                      'ICT Stream',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setStudentStream(tag)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                          studentStream === tag
                            ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                            : 'bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold py-2.5 text-xs transition-colors shadow-md mt-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isSignUp ? `Sign Up as ${selectedRole.toUpperCase()}` : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500">
          {isSignUp ? (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="font-bold text-stone-900 hover:underline"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New scholar or faculty member?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="font-bold text-stone-900 hover:underline"
              >
                Create Account (Choose Teacher/Student)
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
