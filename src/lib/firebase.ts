// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBF-y4XOpkwJmkLUyrIlx8bVPQgw_hOy_8",
  authDomain: "kabaddiscoremaster.firebaseapp.com",
  projectId: "kabaddiscoremaster",
  storageBucket: "kabaddiscoremaster.firebasestorage.app",
  messagingSenderId: "494022444365",
  appId: "1:494022444365:web:5371df0346f4fe9963e304",
  measurementId: "G-CLZJR1504C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);