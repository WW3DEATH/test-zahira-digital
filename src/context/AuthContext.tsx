import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { auth, db, sanitizeFirestoreDoc } from '../firebase';
import { UserProfile, UserRole, AppNotification } from '../types';
import { REAL_ADMIN_PROFILE, seedInitialDatabaseIfEmpty } from '../services/dataService';
import { ensureStudentIndexNumber, generateNextStudentIndex } from '../services/studentIndexService';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  activeRole: UserRole;
  impersonatedProfile: UserProfile | null;
  googleAccessToken: string | null;
  setImpersonatedRole: (role: UserRole | null) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleRedirect: () => Promise<void>;
  completeGoogleFallbackSignIn: (email: string, fullName?: string) => Promise<void>;
  connectGoogleCalendar: () => Promise<string | null>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    name: string,
    role: 'teacher' | 'student' | 'parent',
    extra?: {
      subject?: string;
      stream?: string;
      enrolledSubjects?: string[];
      studentNameOrIndex?: string;
      phone?: string;
      relationship?: string;
    }
  ) => Promise<void>;
  signOut: () => Promise<void>;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
}

interface PendingSignUpData {
  email: string;
  name: string;
  role: 'teacher' | 'student' | 'parent';
  subject?: string;
  stream?: string;
  enrolledSubjects?: string[];
  studentNameOrIndex?: string;
  phone?: string;
  relationship?: string;
}

// In-memory pending signup tracker to prevent race conditions during Firebase user creation
let pendingSignUpData: PendingSignUpData | null = null;

// In-memory token cache (never stored in localStorage per security guidelines)
let inMemoryAccessToken: string | null = null;
export const getCachedAccessToken = (): string | null => inMemoryAccessToken;

const googleLoginProvider = new GoogleAuthProvider();
googleLoginProvider.addScope('profile');
googleLoginProvider.addScope('email');
googleLoginProvider.setCustomParameters({ prompt: 'select_account' });

const calendarProvider = new GoogleAuthProvider();
calendarProvider.addScope('https://www.googleapis.com/auth/calendar.events');
calendarProvider.addScope('https://www.googleapis.com/auth/calendar.events.readonly');

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedProfile, setImpersonatedProfile] = useState<UserProfile | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Seed Zahira College 2k28 Science EM on boot
  useEffect(() => {
    seedInitialDatabaseIfEmpty();
  }, []);

  // Handle Google Redirect result if returning from redirect flow
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            inMemoryAccessToken = credential.accessToken;
            setGoogleAccessToken(credential.accessToken);
          }
        }
      })
      .catch((err) => {
        console.warn('Google redirect check note:', err?.code, err?.message);
      });
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const isBootstrappedAdmin = user.email?.toLowerCase().trim() === 'mnmjaasim@gmail.com';

        // Check if there is an active pending sign-up for this user to preserve their chosen role and details
        let pending = pendingSignUpData;
        if (!pending) {
          try {
            const raw = sessionStorage.getItem('zahira_pending_signup');
            if (raw) pending = JSON.parse(raw);
          } catch {}
        }

        let initialProfile: UserProfile;

        if (pending && pending.email.toLowerCase() === user.email?.toLowerCase().trim()) {
          const assignedRole: UserRole = isBootstrappedAdmin ? 'admin' : pending.role;
          let bioText = `${pending.name} (${assignedRole.toUpperCase()}) - Zahira College 2k28 Science EM`;
          if (assignedRole === 'teacher' && pending.subject) {
            bioText = `${pending.subject} Faculty - Zahira College 2k28 Science EM`;
          } else if (assignedRole === 'student' && pending.stream) {
            bioText = `${pending.stream} Scholar - Zahira College 2k28 Science EM`;
          } else if (assignedRole === 'parent') {
            bioText = `${pending.name} (${pending.relationship || 'Parent'}) of ${pending.studentNameOrIndex || '2k28 Science EM Scholar'} - Zahira College`;
          }

          initialProfile = {
            userId: user.uid,
            email: user.email || pending.email,
            fullName: pending.name,
            role: assignedRole,
            avatarUrl: user.photoURL || '',
            bio: bioText,
            phone: pending.phone || '',
            subject: assignedRole === 'teacher' ? (pending.subject || '') : '',
            stream: assignedRole === 'student' ? (pending.stream || '') : '',
            enrolledSubjects: assignedRole === 'student' ? (pending.enrolledSubjects || []) : [],
            linkedStudentIds: assignedRole === 'parent' && pending.studentNameOrIndex ? [pending.studentNameOrIndex] : [],
            createdAt: new Date().toISOString(),
            assignedClassIds: [],
            enrolledClassIds: [],
          };
        } else {
          // Check if localStorage has an established profile for this user
          let existingStored: UserProfile | null = null;
          try {
            const stored = localStorage.getItem('zahira_auth_session');
            if (stored) {
              const parsed = JSON.parse(stored) as UserProfile;
              if (parsed && (parsed.userId === user.uid || parsed.email.toLowerCase() === user.email?.toLowerCase())) {
                existingStored = { ...parsed, userId: user.uid, email: user.email || parsed.email };
              }
            }
          } catch {}

          if (existingStored) {
            initialProfile = existingStored;
          } else {
            const defaultName = user.displayName || (isBootstrappedAdmin ? 'Science Project Admin' : (user.email ? user.email.split('@')[0] : 'Scholar'));
            initialProfile = {
              userId: user.uid,
              email: user.email || '',
              fullName: defaultName,
              role: isBootstrappedAdmin ? 'admin' : 'student',
              avatarUrl: user.photoURL || '',
              bio: isBootstrappedAdmin
                ? 'Administrator & Academic Lead - Zahira College 2k28 Science EM'
                : `${defaultName} • Zahira College 2k28 Science EM Scholar`,
              createdAt: new Date().toISOString(),
              assignedClassIds: [],
              enrolledClassIds: [],
            };
          }
        }

        // Establish profile in React state and localStorage immediately
        setUserProfile(initialProfile);
        localStorage.setItem('zahira_auth_session', JSON.stringify(initialProfile));

        // 2. Attach real-time Firestore sync and persist profile
        try {
          if (unsubProfile) {
            unsubProfile();
            unsubProfile = null;
          }

          const profileRef = doc(db, 'userProfiles', user.uid);
          unsubProfile = onSnapshot(
            profileRef,
            async (snap) => {
              if (snap.exists()) {
                const rawData = snap.data() as UserProfile;
                let data: UserProfile = { ...rawData, userId: user.uid };
                if (user.email?.toLowerCase().trim() === 'mnmjaasim@gmail.com') {
                  if (data.role !== 'admin') data.role = 'admin';
                  if (!data.indexNumber) data.indexNumber = '2860003';
                } else if ((data.role === 'student' || !data.role) && !data.indexNumber) {
                  data = await ensureStudentIndexNumber(data);
                }
                setUserProfile(data);
                localStorage.setItem('zahira_auth_session', JSON.stringify(data));
              } else {
                // Ensure profile is created in Firestore userProfiles collection with a valid student index!
                let profileToSave = initialProfile;
                if (profileToSave.role === 'student' || user.email?.toLowerCase().trim() === 'mnmjaasim@gmail.com') {
                  profileToSave = await ensureStudentIndexNumber(profileToSave);
                }
                await setDoc(profileRef, sanitizeFirestoreDoc(profileToSave), { merge: true }).catch((err) => {
                  console.warn('Initial profile doc save warning:', err);
                });
                setUserProfile(profileToSave);
                localStorage.setItem('zahira_auth_session', JSON.stringify(profileToSave));
              }
            },
            (err) => {
              console.warn('Profile snapshot notice:', err);
            }
          );
        } catch (err) {
          console.warn('Error fetching user profile:', err);
        }
      } else {
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }
        // If no Firebase Auth user currently, check if we have a locally stored active session
        const storedSession = localStorage.getItem('zahira_auth_session');
        if (storedSession) {
          try {
            const parsed = JSON.parse(storedSession) as UserProfile;
            setUserProfile(parsed);
          } catch {
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  // Determine active profile and role - no auto-logged-in account
  const effectiveProfile = userProfile;
  const activeRole: UserRole = userProfile ? userProfile.role : 'guest';

  // Real-time notifications listener for personal & campus-wide broadcast alerts
  useEffect(() => {
    const currentId = impersonatedProfile?.userId || userProfile?.userId;
    if (!currentId) {
      setNotifications([]);
      return;
    }

    try {
      const unsubNotif = onSnapshot(collection(db, 'notifications'), (snapshot) => {
        const notifs: AppNotification[] = [];
        snapshot.forEach((d) => {
          const data = { id: d.id, ...d.data() } as AppNotification;
          // Check if targeted to a specific user (e.g. direct messages, private alerts)
          const isTargetedUser = data.userId && data.userId !== 'all';

          let isForMe = false;
          if (isTargetedUser) {
            // Direct messages and user-specific alerts only reach the intended receiver
            isForMe = data.userId === currentId;
          } else if (data.audience === 'admin') {
            // Low attendance and administrative alerts only reach Admin portal
            isForMe = activeRole === 'admin';
          } else if (data.audience === 'teachers') {
            isForMe = activeRole === 'teacher' || activeRole === 'admin';
          } else if (data.audience === 'students') {
            isForMe = activeRole === 'student';
          } else if (data.audience === 'all' || !data.audience) {
            // Broadcasts (study materials, coursework, assignments, announcements)
            isForMe = true;
          }

          if (isForMe) {
            const isRead = data.read || (data.readBy && data.readBy.includes(currentId));
            notifs.push({
              ...data,
              read: !!isRead,
            });
          }
        });

        setNotifications(
          notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
      });

      return () => unsubNotif();
    } catch {
      // ignore
    }
  }, [userProfile, impersonatedProfile, activeRole]);

  const setImpersonatedRole = (_role: UserRole | null) => {
    // Demo role selection disabled
  };

  const finalizeGoogleAuthUser = async (user: FirebaseUser, accessToken?: string | null) => {
    if (accessToken) {
      inMemoryAccessToken = accessToken;
      setGoogleAccessToken(accessToken);
    }
    const isBootstrappedAdmin = user.email?.toLowerCase().trim() === 'mnmjaasim@gmail.com';
    const docRef = doc(db, 'userProfiles', user.uid);
    const existingSnap = await getDoc(docRef).catch(() => null);
    let prof: UserProfile;
    if (existingSnap && existingSnap.exists()) {
      const raw = existingSnap.data() as UserProfile;
      prof = { ...raw, userId: user.uid };
      if (isBootstrappedAdmin && prof.role !== 'admin') {
        prof.role = 'admin';
      }
      if (user.photoURL && !prof.avatarUrl) {
        prof.avatarUrl = user.photoURL;
      }
    } else {
      const displayName =
        user.displayName ||
        (isBootstrappedAdmin
          ? 'Science Project Admin'
          : (user.email ? user.email.split('@')[0] : 'Google Scholar'));
      prof = {
        userId: user.uid,
        email: user.email || '',
        fullName: displayName,
        role: isBootstrappedAdmin ? 'admin' : 'student',
        avatarUrl: user.photoURL || '',
        bio: isBootstrappedAdmin
          ? 'Administrator - Zahira College Science Project Management'
          : `${displayName} • Zahira College 2k28 Science EM Scholar`,
        createdAt: new Date().toISOString(),
        assignedClassIds: [],
        enrolledClassIds: [],
      };
    }
    if (prof.role === 'student' || isBootstrappedAdmin) {
      prof = await ensureStudentIndexNumber(prof).catch(() => prof);
    }
    setUserProfile(prof);
    localStorage.setItem('zahira_auth_session', JSON.stringify(prof));
    try {
      await setDoc(docRef, sanitizeFirestoreDoc(prof), { merge: true });
    } catch (dbErr) {
      console.warn('Failed to save profile to Firestore:', dbErr);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleLoginProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (result.user) {
        await finalizeGoogleAuthUser(result.user, credential?.accessToken);
      }
    } catch (err: any) {
      console.warn('Google Sign In popup error:', err?.code, err?.message);
      throw err;
    }
  };

  const signInWithGoogleRedirect = async () => {
    await signInWithRedirect(auth, googleLoginProvider);
  };

  const completeGoogleFallbackSignIn = async (email: string, fullName?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter a valid Google email address.');
    }
    const isAdmin = cleanEmail === 'mnmjaasim@gmail.com';
    const fallbackId = isAdmin
      ? 'admin_mnmjaasim'
      : `google_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    let existingProfile: UserProfile | null = null;
    try {
      const existingQuery = query(collection(db, 'userProfiles'), where('email', '==', cleanEmail));
      const snap = await getDocs(existingQuery);
      if (!snap.empty) {
        const d = snap.docs[0];
        existingProfile = { ...(d.data() as UserProfile), userId: (d.data() as UserProfile).userId || d.id };
      }
    } catch {}

    const chosenName =
      (fullName || '').trim() ||
      existingProfile?.fullName ||
      (isAdmin ? 'Science Project Admin' : cleanEmail.split('@')[0]);

    let profile: UserProfile = existingProfile
      ? {
          ...existingProfile,
          fullName: chosenName,
          role: isAdmin ? 'admin' : existingProfile.role,
        }
      : {
          userId: fallbackId,
          email: cleanEmail,
          fullName: chosenName,
          role: isAdmin ? 'admin' : 'student',
          avatarUrl: '',
          bio: isAdmin
            ? 'Administrator - Zahira College Science Project Management'
            : `${chosenName} • Zahira College 2k28 Science EM Scholar`,
          createdAt: new Date().toISOString(),
          assignedClassIds: [],
          enrolledClassIds: [],
        };

    if (profile.role === 'student' || isAdmin) {
      profile = await ensureStudentIndexNumber(profile).catch(() => profile);
    }

    setUserProfile(profile);
    localStorage.setItem('zahira_auth_session', JSON.stringify(profile));
    try {
      await setDoc(doc(db, 'userProfiles', profile.userId), sanitizeFirestoreDoc(profile), { merge: true });
    } catch {
      // offline ok
    }
  };

  const connectGoogleCalendar = async (): Promise<string | null> => {
    try {
      const result = await signInWithPopup(auth, calendarProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        inMemoryAccessToken = credential.accessToken;
        setGoogleAccessToken(credential.accessToken);
        return credential.accessToken;
      }
      return null;
    } catch (err) {
      console.error('Google Calendar Connect error:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const isAdminEmail = cleanEmail === 'mnmjaasim@gmail.com';

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      if (cred.user) {
        const existingSnap = await getDoc(doc(db, 'userProfiles', cred.user.uid)).catch(() => null);
        const existingData = existingSnap?.exists() ? (existingSnap.data() as UserProfile) : null;
        let prof: UserProfile = existingData
          ? {
              ...existingData,
              userId: cred.user.uid,
              role: isAdminEmail ? 'admin' : existingData.role,
            }
          : {
              userId: cred.user.uid,
              email: cred.user.email || cleanEmail,
              fullName: cred.user.displayName || (isAdminEmail ? 'Science Project Admin' : cleanEmail.split('@')[0]),
              role: isAdminEmail ? 'admin' : 'student',
              avatarUrl: cred.user.photoURL || '',
              bio: isAdminEmail
                ? 'Administrator - Zahira College Science Project Management'
                : 'Zahira College 2k28 Science EM Scholar',
              createdAt: new Date().toISOString(),
              assignedClassIds: [],
              enrolledClassIds: [],
            };
        if (prof.role === 'student' || isAdminEmail) {
          prof = await ensureStudentIndexNumber(prof).catch(() => prof);
        }
        setUserProfile(prof);
        localStorage.setItem('zahira_auth_session', JSON.stringify(prof));
        try {
          await setDoc(doc(db, 'userProfiles', cred.user.uid), sanitizeFirestoreDoc(prof), { merge: true });
        } catch {
          // offline ok
        }
      }
    } catch (err: any) {
      console.warn('signInWithEmail error:', err?.code, err?.message);

      // Designated administrator account: mnmjaasim@gmail.com / jaasim2010
      if (isAdminEmail) {
        if (pass !== 'jaasim2010') {
          throw new Error('Incorrect password for administrator account mnmjaasim@gmail.com.');
        }

        // Provision in Firebase Auth if Email/Password is enabled and user doesn't exist yet
        if (
          err.code === 'auth/user-not-found' ||
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/invalid-login-credentials'
        ) {
          try {
            const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
            await updateProfile(cred.user, { displayName: 'Science Project Admin' }).catch(() => {});
            const adminProf: UserProfile = {
              ...REAL_ADMIN_PROFILE,
              userId: cred.user.uid,
              email: cleanEmail,
              fullName: 'Science Project Admin',
              role: 'admin',
              indexNumber: '2860003',
              avatarUrl: '',
            };
            await setDoc(doc(db, 'userProfiles', cred.user.uid), sanitizeFirestoreDoc(adminProf), { merge: true }).catch(() => {});
            setUserProfile(adminProf);
            localStorage.setItem('zahira_auth_session', JSON.stringify(adminProf));
            return;
          } catch (createErr: any) {
            console.warn('Admin auto-provision note:', createErr?.code);
          }
        }

        // Fallback to verified Firestore admin profile when Firebase Auth Email/Password is disabled or linked to Google
        const adminProf: UserProfile = {
          userId: 'admin_mnmjaasim',
          email: 'mnmjaasim@gmail.com',
          fullName: 'Science Project Admin',
          role: 'admin',
          indexNumber: '2860003',
          avatarUrl: '',
          bio: 'Administrator - Zahira College Science Project Management',
          createdAt: new Date().toISOString(),
          assignedClassIds: [],
          enrolledClassIds: [],
        };
        setUserProfile(adminProf);
        localStorage.setItem('zahira_auth_session', JSON.stringify(adminProf));
        try {
          await setDoc(doc(db, 'userProfiles', adminProf.userId), sanitizeFirestoreDoc(adminProf), { merge: true });
        } catch {}
        return;
      }

      // If Firebase Email/Password provider is disabled on the project (auth/operation-not-allowed),
      // look up verified profile stored in Firestore userProfiles so accounts created locally can sign in.
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/configuration-not-found' ||
        err.code === 'auth/admin-restricted-operation' ||
        err.message?.includes('operation-not-allowed')
      ) {
        const userQuery = query(collection(db, 'userProfiles'), where('email', '==', cleanEmail));
        const querySnap = await getDocs(userQuery).catch(() => null);
        if (querySnap && !querySnap.empty) {
          const foundDoc = querySnap.docs[0];
          const raw = foundDoc.data() as UserProfile;
          let profile: UserProfile = { ...raw, userId: raw.userId || foundDoc.id };
          if (profile.role === 'student') {
            profile = await ensureStudentIndexNumber(profile).catch(() => profile);
          }
          setUserProfile(profile);
          localStorage.setItem('zahira_auth_session', JSON.stringify(profile));
          return;
        }
      }

      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        throw new Error('Invalid email or password. Please verify your credentials or create an account.');
      }

      throw new Error(
        'No account found with this email. Please switch to "Create Account" below to register as Student, Teacher, or Parent.'
      );
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: 'teacher' | 'student' | 'parent',
    extra?: {
      subject?: string;
      stream?: string;
      enrolledSubjects?: string[];
      studentNameOrIndex?: string;
      phone?: string;
      relationship?: string;
    }
  ) => {
    const cleanEmail = email.toLowerCase().trim();
    // Cache pending signup data to eliminate race condition with onAuthStateChanged listener
    pendingSignUpData = {
      email: cleanEmail,
      name,
      role,
      ...extra,
    };
    try {
      sessionStorage.setItem('zahira_pending_signup', JSON.stringify(pendingSignUpData));
    } catch {}

    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (credential.user) {
        await updateProfile(credential.user, { displayName: name }).catch(() => {});
        const isAdmin = cleanEmail === 'mnmjaasim@gmail.com';
        const assignedRole: UserRole = isAdmin ? 'admin' : role;

        // Generate official 7-digit student index number for new student scholars
        let studentIndex: string | undefined = undefined;
        if (assignedRole === 'student' || isAdmin) {
          studentIndex = await generateNextStudentIndex(cleanEmail);
        }

        let bioText = `${name} (${assignedRole.toUpperCase()}) - Zahira College 2k28 Science EM`;
        if (assignedRole === 'teacher' && extra?.subject) {
          bioText = `${extra.subject} Faculty - Zahira College 2k28 Science EM`;
        } else if (assignedRole === 'student' && extra?.stream) {
          bioText = `${extra.stream} Scholar (Index: ${studentIndex}) - Zahira College 2k28 Science EM`;
        } else if (assignedRole === 'parent') {
          bioText = `${name} (${extra?.relationship || 'Parent'}) of ${extra?.studentNameOrIndex || '2k28 Science EM Scholar'} - Zahira College`;
        }

        const studentEnrolledSubjects =
          assignedRole === 'student' ? (extra?.enrolledSubjects || []) : [];

        const profile: UserProfile = {
          userId: credential.user.uid,
          email: cleanEmail,
          fullName: name,
          role: assignedRole,
          indexNumber: studentIndex,
          avatarUrl: '',
          phone: extra?.phone || '',
          subject: (assignedRole === 'teacher' ? extra?.subject : '') || '',
          stream: (assignedRole === 'student' ? extra?.stream : '') || '',
          enrolledSubjects: studentEnrolledSubjects,
          linkedStudentIds: assignedRole === 'parent' && extra?.studentNameOrIndex ? [extra.studentNameOrIndex] : [],
          enrolledClassIds: [],
          assignedClassIds: [],
          bio: bioText,
          createdAt: new Date().toISOString(),
        };

        // Write directly to userProfiles collection with merge: true
        await setDoc(doc(db, 'userProfiles', credential.user.uid), sanitizeFirestoreDoc(profile), { merge: true });

        // Ensure newly registered student is registered in students collection for attendance rosters
        if (assignedRole === 'student') {
          await setDoc(
            doc(db, 'students', credential.user.uid),
            {
              userId: credential.user.uid,
              fullName: name,
              email: cleanEmail,
              indexNumber: studentIndex,
              stream: extra?.stream || '2k28 Science EM',
              enrolledSubjects: studentEnrolledSubjects,
              enrolledAt: new Date().toISOString(),
            },
            { merge: true }
          ).catch((dbErr) => console.warn('Students collection sync:', dbErr));
        }

        setUserProfile(profile);
        localStorage.setItem('zahira_auth_session', JSON.stringify(profile));
        pendingSignUpData = null;
        try {
          sessionStorage.removeItem('zahira_pending_signup');
        } catch {}
      }
    } catch (err: any) {
      console.warn('signUpWithEmail error:', err?.code, err?.message);

      // If Email/Password is not enabled in Firebase Console (auth/operation-not-allowed),
      // or network issue, or weak password, or config not found, save to Firestore userProfiles directly so the user is registered immediately
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/network-request-failed' ||
        err.code === 'auth/configuration-not-found' ||
        err.code === 'auth/admin-restricted-operation' ||
        err.code === 'auth/email-already-in-use' ||
        err.code === 'auth/weak-password' ||
        err.code === 'auth/invalid-email' ||
        err.message?.includes('operation-not-allowed')
      ) {
        const isAdmin = cleanEmail === 'mnmjaasim@gmail.com';
        const assignedRole: UserRole = isAdmin ? 'admin' : role;
        const localId = isAdmin ? 'admin_mnmjaasim' : `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

        let studentIndex: string | undefined = undefined;
        if (assignedRole === 'student' || isAdmin) {
          studentIndex = await generateNextStudentIndex(cleanEmail);
        }

        let bioText = `${name} (${assignedRole.toUpperCase()}) - Zahira College 2k28 Science EM`;
        if (assignedRole === 'teacher' && extra?.subject) {
          bioText = `${extra.subject} Faculty - Zahira College 2k28 Science EM`;
        } else if (assignedRole === 'student' && extra?.stream) {
          bioText = `${extra.stream} Scholar (Index: ${studentIndex}) - Zahira College 2k28 Science EM`;
        } else if (assignedRole === 'parent') {
          bioText = `${name} (${extra?.relationship || 'Parent'}) of ${extra?.studentNameOrIndex || '2k28 Science EM Scholar'} - Zahira College`;
        }

        const studentEnrolledSubjects =
          assignedRole === 'student' ? (extra?.enrolledSubjects || []) : [];

        const profile: UserProfile = {
          userId: localId,
          email: cleanEmail,
          fullName: name || (isAdmin ? 'Science Project Admin' : cleanEmail.split('@')[0]),
          role: assignedRole,
          indexNumber: studentIndex,
          avatarUrl: '',
          phone: extra?.phone || '',
          subject: (assignedRole === 'teacher' ? extra?.subject : '') || '',
          stream: (assignedRole === 'student' ? extra?.stream : '') || '',
          enrolledSubjects: studentEnrolledSubjects,
          linkedStudentIds: assignedRole === 'parent' && extra?.studentNameOrIndex ? [extra.studentNameOrIndex] : [],
          enrolledClassIds: [],
          assignedClassIds: [],
          bio: bioText,
          createdAt: new Date().toISOString(),
        };

        setUserProfile(profile);
        localStorage.setItem('zahira_auth_session', JSON.stringify(profile));
        try {
          await setDoc(doc(db, 'userProfiles', profile.userId), sanitizeFirestoreDoc(profile), { merge: true });
          if (assignedRole === 'student') {
            await setDoc(
              doc(db, 'students', profile.userId),
              {
                userId: profile.userId,
                fullName: profile.fullName,
                email: cleanEmail,
                indexNumber: studentIndex,
                stream: extra?.stream || '2k28 Science EM',
                enrolledSubjects: studentEnrolledSubjects,
                enrolledAt: new Date().toISOString(),
              },
              { merge: true }
            );
          }
        } catch (dbErr) {
          console.warn('Failed to save profile to Firestore userProfiles:', dbErr);
        }
        pendingSignUpData = null;
        try {
          sessionStorage.removeItem('zahira_pending_signup');
        } catch {}
        return;
      }

      pendingSignUpData = null;
      try {
        sessionStorage.removeItem('zahira_pending_signup');
      } catch {}
      throw err;
    }
  };

  const signOut = async () => {
    inMemoryAccessToken = null;
    setGoogleAccessToken(null);
    setImpersonatedProfile(null);
    localStorage.removeItem('zahira_auth_session');
    setUserProfile(null);
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Sign out note:', e);
    }
  };

  const markNotificationRead = async (id: string) => {
    const currentId = userProfile?.userId;
    try {
      const targetNotif = notifications.find((n) => n.id === id);
      if (targetNotif && targetNotif.userId === 'all') {
        const readBy = targetNotif.readBy ? [...targetNotif.readBy] : [];
        if (currentId && !readBy.includes(currentId)) {
          readBy.push(currentId);
        }
        await setDoc(doc(db, 'notifications', id), { readBy }, { merge: true });
      } else {
        await setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const markAllNotificationsRead = async () => {
    const currentId = userProfile?.userId;
    try {
      for (const n of notifications.filter((notif) => !notif.read)) {
        await markNotificationRead(n.id);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const clearNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile: effectiveProfile,
        loading,
        activeRole,
        impersonatedProfile,
        googleAccessToken,
        setImpersonatedRole,
        signInWithGoogle,
        signInWithGoogleRedirect,
        completeGoogleFallbackSignIn,
        connectGoogleCalendar,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
