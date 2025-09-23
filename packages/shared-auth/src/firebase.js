import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCvj_S64YkmGR2tFsN_iAFW68QRnUILYQc",
  authDomain: "elearning-eb29e.firebaseapp.com",
  projectId: "elearning-eb29e",
  storageBucket: "elearning-eb29e.firebasestorage.app",
  messagingSenderId: "440488503575",
  appId: "1:440488503575:web:9346fd8b199f1e130caf52"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { auth, googleProvider };