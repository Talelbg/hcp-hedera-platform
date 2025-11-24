import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

// Use environment variables if available, otherwise fallback to hardcoded (dev/demo)
const firebaseConfig = {
  apiKey: import.meta.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyD2reN4qvBhUnHdep9LxS8ppG5xruU8ePw",
  authDomain: import.meta.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "hcp-cmp-platform.firebaseapp.com",
  databaseURL: import.meta.env.REACT_APP_FIREBASE_DATABASE_URL || "https://hcp-cmp-platform-default-rtdb.firebaseio.com",
  projectId: import.meta.env.REACT_APP_FIREBASE_PROJECT_ID || "hcp-cmp-platform",
  storageBucket: import.meta.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "hcp-cmp-platform.firebasestorage.app",
  messagingSenderId: import.meta.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "505950551698",
  appId: import.meta.env.REACT_APP_FIREBASE_APP_ID || "1:505950551698:web:cf1dfb5399aa6ae080b04b",
  measurementId: "G-45NXTTJ5R9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // Changed to Firestore per instructions "collection 'users'"
export const rtdb = getDatabase(app); // Renamed Realtime Database
