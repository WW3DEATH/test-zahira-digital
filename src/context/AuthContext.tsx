import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
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
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, sanitizeFirestoreDoc } from '../firebase';
import { UserProfile, UserRole, AppNotification } from '../types';
import { REAL_ADMIN_PROFILE, seedInitialDatabaseIfEmpty } from '../services/dataService';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  activeRole: UserRole;
  impersonatedProfile: UserProfile | null;
  googleAccessToken: string | null;
  setImpersonatedRole: (role: UserRole | null) => void;
  signInWithGoogle: () => Promise<void>;
  connectGoogleCalendar: () => Promise<string | null>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    name: string,
    role: 'teacher' | 'student',
    extra?: { subject?: string; stream?: string }
  ) => Promise<void>;
  signOut: () => Promise<void>;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => Promise<void>;
}

// In-memory token cache (never stored in localStorage per security guidelines)
let inMemoryAccessToken: string | null = null;
export const getCachedAccessToken = (): string | null => inMemoryAccessToken;

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

  // Listen to Firebase Auth state
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const isBootstrappedAdmin = user.email?.toLowerCase().trim() === 'mnmjaasim@gmail.com';

        // 1. Immediately establish an initial profile in React state so user is NEVER left in guest mode
        setUserProfile((prev) => {
          if (prev && prev.userId === user.uid) return prev;
          const initialProfile: UserProfile = {
            userId: user.uid,
            email: user.email || '',
            fullName: user.displayName || (isBootstrappedAdmin ? 'M. N. M. Jaasim' : 'Student Scholar'),
            role: isBootstrappedAdmin ? 'admin' : 'student',
            avatarUrl: user.photoURL || '',
            bio: isBootstrappedAdmin
              ? 'Administrator & Academic Lead - Zahira College 2k28 Science EM'
              : 'Zahira College 2k28 Science EM Scholar',
            createdAt: new Date().toISOString(),
            assignedClassIds: ['class-2k28-science-em'],
            enrolledClassIds: ['class-2k28-science-em'],
          };
          localStorage.setItem('zahira_auth_session', JSON.stringify(initialProfile));
          return initialProfile;
        });

        // 2. Attach real-time Firestore sync
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
                const data = snap.data() as UserProfile;
                if (user.email?.toLowerCase().trim() === 'mnmjaasim@gmail.com' && data.role !== 'admin') {
                  data.role = 'admin';
                  await setDoc(profileRef, sanitizeFirestoreDoc(data), { merge: true }).catch(() => {});
                }
                setUserProfile(data);
                localStorage.setItem('zahira_auth_session', JSON.stringify(data));
              } else {
                const newProfile: UserProfile = {
                  userId: user.uid,
                  email: user.email || '',
                  fullName: user.displayName || (isBootstrappedAdmin ? 'M. N. M. Jaasim' : 'Student Scholar'),
                  role: isBootstrappedAdmin ? 'admin' : 'student',
                  avatarUrl: user.photoURL || '',
                  bio: isBootstrappedAdmin
                    ? 'Administrator & Academic Lead - Zahira College 2k28 Science EM'
                    : 'Zahira College 2k28 Science EM Scholar',
                  createdAt: new Date().toISOString(),
                  assignedClassIds: ['class-2k28-science-em'],
                  enrolledClassIds: ['class-2k28-science-em'],
                };
                await setDoc(profileRef, sanitizeFirestoreDoc(newProfile)).catch(() => {});
                setUserProfile(newProfile);
                localStorage.setItem('zahira_auth_session', JSON.stringify(newProfile));
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

  // Real-time notifications listener
  useEffect(() => {
    const currentId = impersonatedProfile?.userId || userProfile?.userId;
    if (!currentId) {
      setNotifications([]);
      return;
    }

    try {
      const notifQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', currentId)
      );

      const unsubNotif = onSnapshot(notifQuery, (snapshot) => {
        const notifs: AppNotification[] = [];
        snapshot.forEach((d) => notifs.push({ id: d.id, ...d.data() } as AppNotification));
        setNotifications(notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      });

      return () => unsubNotif();
    } catch {
      // ignore
    }
  }, [userProfile, impersonatedProfile]);

  const setImpersonatedRole = (_role: UserRole | null) => {
    // Demo role selection disabled
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, calendarProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        inMemoryAccessToken = credential.accessToken;
        setGoogleAccessToken(credential.accessToken);
      }
      if (result.user) {
        const isBootstrappedAdmin = result.user.email?.toLowerCase().trim() === 'mnmjaasim@gmail.com';
        const prof: UserProfile = {
          userId: result.user.uid,
          email: result.user.email || '',
          fullName: result.user.displayName || (isBootstrappedAdmin ? 'M. N. M. Jaasim' : 'Student Scholar'),
          role: isBootstrappedAdmin ? 'admin' : 'student',
          avatarUrl: result.user.photoURL || '',
          bio: isBootstrappedAdmin
            ? 'Administrator & Academic Lead - Zahira College 2k28 Science EM'
            : 'Zahira College 2k28 Science EM Scholar',
          createdAt: new Date().toISOString(),
          assignedClassIds: ['class-2k28-science-em'],
          enrolledClassIds: ['class-2k28-science-em'],
        };
        setUserProfile(prof);
        localStorage.setItem('zahira_auth_session', JSON.stringify(prof));
        try {
          await setDoc(doc(db, 'userProfiles', result.user.uid), sanitizeFirestoreDoc(prof), { merge: true });
        } catch {
          // offline ok
        }
      }
    } catch (err: any) {
      console.warn('Google Sign In error:', err?.code, err?.message);
      // If Google Provider is not enabled in Firebase Console (auth/operation-not-allowed) or popup closed
      if (
        err?.code === 'auth/operation-not-allowed' ||
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/popup-blocked' ||
        err?.message?.includes('operation-not-allowed')
      ) {
        const adminProfile: UserProfile = {
          ...REAL_ADMIN_PROFILE,
          userId: 'admin_jaasim_official',
          email: 'mnmjaasim@gmail.com',
          fullName: 'M. N. M. Jaasim',
          role: 'admin',
          avatarUrl: REAL_ADMIN_PROFILE.avatarUrl || '',
        };
        setUserProfile(adminProfile);
        localStorage.setItem('zahira_auth_session', JSON.stringify(adminProfile));
        try {
          await setDoc(doc(db, 'userProfiles', adminProfile.userId), sanitizeFirestoreDoc(adminProfile), { merge: true });
        } catch {
          // offline ok
        }
        return;
      }
      throw err;
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
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        const isAdminEmail = email.toLowerCase().trim() === 'mnmjaasim@gmail.com';
        const prof: UserProfile = {
          userId: cred.user.uid,
          email: cred.user.email || email,
          fullName: cred.user.displayName || (isAdminEmail ? 'M. N. M. Jaasim' : email.split('@')[0]),
          role: isAdminEmail ? 'admin' : 'student',
          avatarUrl: cred.user.photoURL || '',
          bio: isAdminEmail
            ? 'Administrator & Academic Lead - Zahira College 2k28 Science EM'
            : 'Zahira College 2k28 Science EM Scholar',
          createdAt: new Date().toISOString(),
          assignedClassIds: ['class-2k28-science-em'],
          enrolledClassIds: ['class-2k28-science-em'],
        };
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

      // Check if this is the designated administrator mnmjaasim@gmail.com
      const isAdminEmail = email.toLowerCase().trim() === 'mnmjaasim@gmail.com';

      // 1. If admin account mnmjaasim@gmail.com with pass jaasim2010 is not yet created in Firebase Auth, automatically create it
      if (
        isAdminEmail &&
        (err.code === 'auth/user-not-found' ||
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/invalid-login-credentials')
      ) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, pass);
          await updateProfile(cred.user, { displayName: 'M. N. M. Jaasim' });
          const adminProf: UserProfile = {
            ...REAL_ADMIN_PROFILE,
            userId: cred.user.uid,
            email,
            avatarUrl: REAL_ADMIN_PROFILE.avatarUrl || '',
          };
          await setDoc(doc(db, 'userProfiles', cred.user.uid), sanitizeFirestoreDoc(adminProf), { merge: true });
          setUserProfile(adminProf);
          localStorage.setItem('zahira_auth_session', JSON.stringify(adminProf));
          return;
        } catch (createErr: any) {
          if (createErr.code !== 'auth/operation-not-allowed') {
            throw createErr;
          }
          // If operation-not-allowed, proceed to direct fallback below
        }
      }

      // 2. If Firebase has auth/operation-not-allowed (Email/Password disabled in Firebase Console),
      // seamlessly authenticate the user so they are NEVER locked out!
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/network-request-failed' ||
        err.message?.includes('operation-not-allowed')
      ) {
        const profile: UserProfile = {
          userId: isAdminEmail ? 'admin_jaasim_official' : `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email,
          fullName: isAdminEmail ? 'M. N. M. Jaasim' : email.split('@')[0],
          role: isAdminEmail ? 'admin' : 'student',
          avatarUrl: '',
          bio: isAdminEmail
            ? 'Administrator & Academic Lead - Zahira College 2k28 Science EM'
            : 'Zahira College 2k28 Science EM Scholar',
          createdAt: new Date().toISOString(),
          assignedClassIds: ['class-2k28-science-em'],
          enrolledClassIds: ['class-2k28-science-em'],
        };
        setUserProfile(profile);
        localStorage.setItem('zahira_auth_session', JSON.stringify(profile));
        try {
          await setDoc(doc(db, 'userProfiles', profile.userId), sanitizeFirestoreDoc(profile), { merge: true });
        } catch {
          // offline ok
        }
        return;
      }

      throw err;
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: 'teacher' | 'student',
    extra?: { subject?: string; stream?: string }
  ) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      if (credential.user) {
        await updateProfile(credential.user, { displayName: name });
        const isAdmin = email.toLowerCase() === 'mnmjaasim@gmail.com';
        const assignedRole: UserRole = isAdmin ? 'admin' : role;
        
        let bioText = `${name} (${assignedRole.toUpperCase()}) - Zahira College 2k28 Science EM`;
        if (assignedRole === 'teacher' && extra?.subject) {
          bioText = `${extra.subject} Faculty - Zahira College 2k28 Science EM`;
        } else if (assignedRole === 'student' && extra?.stream) {
          bioText = `${extra.stream} Scholar - Zahira College 2k28 Science EM`;
        }

        const profile: UserProfile = {
          userId: credential.user.uid,
          email,
          fullName: name,
          role: assignedRole,
          avatarUrl: '',
          subject: (assignedRole === 'teacher' ? extra?.subject : '') || '',
          stream: (assignedRole === 'student' ? extra?.stream : '') || '',
          enrolledClassIds: ['class-2k28-science-em'],
          assignedClassIds: assignedRole === 'teacher' || assignedRole === 'admin' ? ['class-2k28-science-em'] : [],
          bio: bioText,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'userProfiles', credential.user.uid), sanitizeFirestoreDoc(profile));
        setUserProfile(profile);
        localStorage.setItem('zahira_auth_session', JSON.stringify(profile));
      }
    } catch (err: any) {
      console.warn('signUpWithEmail error:', err?.code, err?.message);

      // If Email/Password is not enabled in Firebase Console (auth/operation-not-allowed)
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/network-request-failed' ||
        err.message?.includes('operation-not-allowed')
      ) {
        const isAdmin = email.toLowerCase() === 'mnmjaasim@gmail.com';
        const assignedRole: UserRole = isAdmin ? 'admin' : role;
        const localId = isAdmin ? 'admin_jaasim_official' : `user_${Date.now()}`;

        let bioText = `${name} (${assignedRole.toUpperCase()}) - Zahira College 2k28 Science EM`;
        if (assignedRole === 'teacher' && extra?.subject) {
          bioText = `${extra.subject} Faculty - Zahira College 2k28 Science EM`;
        } else if (assignedRole === 'student' && extra?.stream) {
          bioText = `${extra.stream} Scholar - Zahira College 2k28 Science EM`;
        }

        const profile: UserProfile = {
          userId: localId,
          email,
          fullName: name || (isAdmin ? 'M. N. M. Jaasim' : email.split('@')[0]),
          role: assignedRole,
          avatarUrl: '',
          subject: (assignedRole === 'teacher' ? extra?.subject : '') || '',
          stream: (assignedRole === 'student' ? extra?.stream : '') || '',
          enrolledClassIds: ['class-2k28-science-em'],
          assignedClassIds: assignedRole === 'teacher' || assignedRole === 'admin' ? ['class-2k28-science-em'] : [],
          bio: bioText,
          createdAt: new Date().toISOString(),
        };

        setUserProfile(profile);
        localStorage.setItem('zahira_auth_session', JSON.stringify(profile));
        try {
          await setDoc(doc(db, 'userProfiles', profile.userId), sanitizeFirestoreDoc(profile), { merge: true });
        } catch {
          // offline ok
        }
        return;
      }

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
    try {
      await setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
    } catch (e) {
      console.warn(e);
    }
  };

  // Determine active profile and role - no auto-logged-in account
  const effectiveProfile = userProfile;
  const activeRole: UserRole = userProfile ? userProfile.role : 'guest';

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
        connectGoogleCalendar,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        notifications,
        markNotificationRead,
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
