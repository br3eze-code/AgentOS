import * as admin from 'firebase-admin';
import { logger } from './Logger';

let isInitialized = false;

export function initFirebase(): void {
  if (isInitialized) return;

  try {
    const { firebase } = require('./Config').config;
    if (!admin.apps.length) {
      if (firebase.projectId && firebase.projectId.length > 5) { // Ensure it's not empty or a short placeholder
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: firebase.projectId,
            clientEmail: firebase.clientEmail,
            privateKey: firebase.privateKey,
          }),
          databaseURL: firebase.databaseURL,
        });
      } else {
        // Fallback for development where strict credentials aren't provided yet
        admin.initializeApp({
          projectId: 'demo-agentclaw',
          databaseURL: 'https://demo-agentclaw.firebaseio.com',
        });
      }
    }
    isInitialized = true;
    logger.info('Firebase Admin (Firestore & RTDB) initialized successfully.');
  } catch (error) {
    logger.error(`Failed to initialize Firebase Admin: ${(error as Error).message}`);
    throw error;
  }
}

export function getFirestore(): admin.firestore.Firestore {
  if (!isInitialized) initFirebase();
  const db = admin.firestore();
  // Using demo project might require additional config; ignoring for now
  return db;
}

export function getRTDB(): admin.database.Database {
  if (!isInitialized) initFirebase();
  return admin.database();
}

/**
 * Compatibility exports
 */
export async function connectDB(): Promise<void> {
  initFirebase();
}

export async function disconnectDB(): Promise<void> {
  logger.info('Firebase connections do not require explicit disconnect.');
}

// Ensure PrismaClient type export is no longer used, so remove it.
// Types should now come from @agentclaw/db or standard Firebase interfaces.
