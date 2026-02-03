import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyD5Q0vFkUVzDAFBA8nU8K-YMmGH0sfUShw',
  authDomain: 'playsense-d8026.firebaseapp.com',
  projectId: 'playsense-d8026',
  storageBucket: 'playsense-d8026.firebasestorage.app',
  messagingSenderId: '17570785732',
  appId: '1:17570785732:web:ebfce125280695a1aedc91',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

export default app;
