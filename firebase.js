// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCsRBj1TWnHSMStAIQsfaBOUVO0ch0KnPc",
  authDomain: "pancakes-916bd.firebaseapp.com",
  projectId: "pancakes-916bd",
  storageBucket: "pancakes-916bd.firebasestorage.app",
  messagingSenderId: "1003482432218",
  appId: "1:1003482432218:web:8177f3e1c16029f7de1be3",
  measurementId: "G-RNP23NY41H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
