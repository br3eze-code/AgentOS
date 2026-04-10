import * as admin from 'firebase-admin';
export declare function initFirebase(): void;
export declare function getFirestore(): admin.firestore.Firestore;
export declare function getRTDB(): admin.database.Database;
/**
 * Compatibility exports
 */
export declare function connectDB(): Promise<void>;
export declare function disconnectDB(): Promise<void>;
//# sourceMappingURL=Database.d.ts.map