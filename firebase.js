// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBcS-O5gxbvS4yyZBp2nl36h7EoVwQ09qA",
  authDomain: "inventory-app-b68a1.firebaseapp.com",
  projectId: "inventory-app-b68a1",
  storageBucket: "inventory-app-b68a1.appspot.com",
  messagingSenderId: "205018847997",
  appId: "1:205018847997:web:5f3b0580a26f6915f4fc94",
  measurementId: "G-99F50QS99J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app)

export {firestore}