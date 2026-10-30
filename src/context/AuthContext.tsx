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
import { auth, db } from '../firebase';
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const profileRef = doc(db, 'userProfiles', user.uid);
          // Set real-time listener for the user profile
          const unsubProfile = onSnapshot(profileRef, async (snap) => {
            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              if (user.email === 'mnmjaasim@gmail.com' && data.role !== 'admin') {
                data.role = 'admin';
                await setDoc(profileRef, data, { merge: true });
              }
              setUserProfile(data);
            } else {
              const isBootstrappedAdmin = user.email === 'mnmjaasim@gmail.com';
              const newProfile: UserProfile = {
                userId: user.uid,
                email: user.email || '',
                fullName: user.displayName || (isBootstrappedAdmin ? 'M. N. M. Jaasim' : 'Student Scholar'),
                role: isBootstrappedAdmin ? 'admin' : 'student',
                avatarUrl: user.photoURL || undefined,
                bio: isBootstrappedAdmin
                  ? 'Administrator & Academic Lead - Zahira College 2k28 Science EM'
                  : 'Zahira College 2k28 Science EM Scholar',
                createdAt: new Date().toISOString(),
                assignedClassIds: ['class-2k28-science-em'],
                enrolledClassIds: ['class-2k28-science-em'],
              };
              await setDoc(profileRef, newProfile);
              setUserProfile(newProfile);
            }
          });

          return () => unsubProfile();
        } catch (err) {
          console.warn('Error fetching user profile:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
    } catch (err) {
      console.error('Google Sign In error:', err);
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
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      // If admin account mnmjaasim@gmail.com with pass jaasim2010 is not yet created in Firebase Auth, automatically create it!
      if (
        email.toLowerCase() === 'mnmjaasim@gmail.com' &&
        pass === 'jaasim2010' &&
        (err.code === 'auth/user-not-found' ||
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/invalid-login-credentials')
      ) {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(cred.user, { displayName: 'M. N. M. Jaasim' });
        const adminProf: UserProfile = {
          ...REAL_ADMIN_PROFILE,
          userId: cred.user.uid,
          email,
        };
        await setDoc(doc(db, 'userProfiles', cred.user.uid), adminProf, { merge: true });
        setUserProfile(adminProf);
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
        subject: assignedRole === 'teacher' ? extra?.subject : undefined,
        stream: assignedRole === 'student' ? extra?.stream : undefined,
        enrolledClassIds: ['class-2k28-science-em'],
        assignedClassIds: assignedRole === 'teacher' || assignedRole === 'admin' ? ['class-2k28-science-em'] : undefined,
        bio: bioText,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'userProfiles', credential.user.uid), profile);
      setUserProfile(profile);
    }
  };

  const signOut = async () => {
    inMemoryAccessToken = null;
    setGoogleAccessToken(null);
    setImpersonatedProfile(null);
    await firebaseSignOut(auth);
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
