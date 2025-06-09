import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, onMessage, getToken } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
 apiKey: "AIzaSyDmKBa-JLJlg81yRlnttnji3RkLPBEGP-g",
  authDomain: "fir-setup-3286f.firebaseapp.com",
  projectId: "fir-setup-3286f",
  storageBucket: "fir-setup-3286f.appspot.com",
  messagingSenderId: "1037243626226",
  appId: "1:1037243626226:web:718bca97daf5e8195d166b",
  measurementId: "G-JC536RPSMT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

export { auth, db, messaging, onMessage, getToken };
