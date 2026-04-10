"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initFirebase = initFirebase;
exports.getFirestore = getFirestore;
exports.getRTDB = getRTDB;
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const admin = __importStar(require("firebase-admin"));
const Logger_1 = require("./Logger");
let isInitialized = false;
function initFirebase() {
    if (isInitialized)
        return;
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
            }
            else {
                // Fallback for development where strict credentials aren't provided yet
                admin.initializeApp({
                    projectId: 'demo-agentclaw',
                    databaseURL: 'https://demo-agentclaw.firebaseio.com',
                });
            }
        }
        isInitialized = true;
        Logger_1.logger.info('Firebase Admin (Firestore & RTDB) initialized successfully.');
    }
    catch (error) {
        Logger_1.logger.error(`Failed to initialize Firebase Admin: ${error.message}`);
        throw error;
    }
}
function getFirestore() {
    if (!isInitialized)
        initFirebase();
    const db = admin.firestore();
    // Using demo project might require additional config; ignoring for now
    return db;
}
function getRTDB() {
    if (!isInitialized)
        initFirebase();
    return admin.database();
}
/**
 * Compatibility exports
 */
async function connectDB() {
    initFirebase();
}
async function disconnectDB() {
    Logger_1.logger.info('Firebase connections do not require explicit disconnect.');
}
// Ensure PrismaClient type export is no longer used, so remove it.
// Types should now come from @agentclaw/db or standard Firebase interfaces.
//# sourceMappingURL=Database.js.map