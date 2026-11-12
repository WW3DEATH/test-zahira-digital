import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';

const BASELINE_INDEX = 2860003; // Zahira College 2k28 Science EM baseline index (28 = 2k28, 6 = Science)

/**
 * Scans Firestore and local storage to determine the next sequential
 * 7-digit student index number for Zahira College 2k28 Science EM.
 * Format: 286XXXX (e.g. 2860003, 2860004, 2860005...)
 */
export async function generateNextStudentIndex(email?: string): Promise<string> {
  // Primary scholar M.N.M. Jaasim is index 2860003
  if (email && email.toLowerCase().trim() === 'mnmjaasim@gmail.com') {
    return '2860003';
  }

  let highest = BASELINE_INDEX;

  try {
    // 1. Scan userProfiles collection
    const profilesSnap = await getDocs(collection(db, 'userProfiles'));
    profilesSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.indexNumber) {
        const num = parseInt(String(data.indexNumber).replace(/\D/g, ''), 10);
        if (!isNaN(num) && num >= 2860000 && num < 2870000) {
          if (num > highest) highest = num;
        }
      }
    });

    // 2. Scan students collection
    const studentsSnap = await getDocs(collection(db, 'students'));
    studentsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const rawIndex = data.indexNumber || data.studentIndex || data.index;
      if (rawIndex) {
        const num = parseInt(String(rawIndex).replace(/\D/g, ''), 10);
        if (!isNaN(num) && num >= 2860000 && num < 2870000) {
          if (num > highest) highest = num;
        }
      }
    });
  } catch (err) {
    console.warn('Could not query Firestore for highest index, using local fallback:', err);
  }

  // 3. Check local storage counter to avoid collisions during rapid signups
  try {
    const localLast = localStorage.getItem('zahira_highest_index');
    if (localLast) {
      const num = parseInt(localLast, 10);
      if (!isNaN(num) && num > highest) {
        highest = num;
      }
    }
  } catch {}

  const nextIndexNum = highest + 1;
  const nextIndexStr = String(nextIndexNum);

  try {
    localStorage.setItem('zahira_highest_index', nextIndexStr);
  } catch {}

  return nextIndexStr;
}

/**
 * Checks if a user profile requires a student index number (e.g. role is student or bootstrapped scholar)
 * and generates & persists one if missing.
 */
export async function ensureStudentIndexNumber(profile: UserProfile): Promise<UserProfile> {
  // If already has an index number, return as is
  if (profile.indexNumber && /^286\d{4}$/.test(profile.indexNumber.trim())) {
    return profile;
  }

  // M.N.M. Jaasim is 2860003
  if (profile.email?.toLowerCase().trim() === 'mnmjaasim@gmail.com') {
    const updated = { ...profile, indexNumber: '2860003' };
    try {
      await setDoc(doc(db, 'userProfiles', profile.userId), { indexNumber: '2860003' }, { merge: true });
      localStorage.setItem('zahira_auth_session', JSON.stringify(updated));
    } catch {}
    return updated;
  }

  // Generate for student accounts
  if (profile.role === 'student' || !profile.role) {
    const nextIndex = await generateNextStudentIndex(profile.email);
    const updated: UserProfile = { ...profile, indexNumber: nextIndex };

    try {
      // Save strictly to userProfiles
      await setDoc(doc(db, 'userProfiles', profile.userId), { indexNumber: nextIndex }, { merge: true });
      localStorage.setItem('zahira_auth_session', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist student index number:', e);
    }

    return updated;
  }

  return profile;
}
