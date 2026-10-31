import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const customDbId = (firebaseConfig as any).firestoreDatabaseId;

let firestoreDb;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true,
    },
    customDbId && customDbId !== '(default)' ? customDbId : undefined
  );
} catch (e) {
  firestoreDb = customDbId && customDbId !== '(default)'
    ? getFirestore(app, customDbId)
    : getFirestore(app);
}

/**
 * Recursively strips undefined values from an object or array so Firestore operations never reject data with "Unsupported field value: undefined".
 */
export function sanitizeFirestoreDoc<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj
      .map((item) => sanitizeFirestoreDoc(item))
      .filter((x) => x !== undefined) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj as Record<string, any>)) {
      if (val !== undefined) {
        sanitized[key] = sanitizeFirestoreDoc(val);
      }
    }
    return sanitized as T;
  }
  return obj;
}

export const db = firestoreDb;
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
