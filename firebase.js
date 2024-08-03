import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
 apiKey: "AIzaSyBcS-O5gxbvS4yyZBp2nl36h7EoVwQ09qA",
 authDomain: "inventory-app-b68a1.firebaseapp.com",
 projectId: "inventory-app-b68a1",
 storageBucket: "inventory-app-b68a1.appspot.com",
 messagingSenderId: "205018847997",
 appId: "1:205018847997:web:5f3b0580a26f6915f4fc94"
 };
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export { firestore };