import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCeXUL8lPaQAiUGC3JC30Q57G97sSRoRgs',
  authDomain: 'pdfora-f23de.firebaseapp.com',
  projectId: 'pdfora-f23de',
  storageBucket: 'pdfora-f23de.firebasestorage.app',
  messagingSenderId: '426535694739',
  appId: '1:426535694739:web:640f8cdb755e1ba8097866',
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
