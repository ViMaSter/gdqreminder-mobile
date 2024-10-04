import * as firebase from "firebase/app";
import { getFirestore } from "firebase/firestore";

const config = {
  apiKey: "AIzaSyBObrxXsoQhgnFlK1uDAI-jdg9GeTyyJmA",
  authDomain: "gdqreminder.firebaseapp.com",
  projectId: "gdqreminder",
  storageBucket: "gdqreminder.appspot.com",
  messagingSenderId: "358208879608",
  appId: "1:358208879608:web:c853a88295d758b888f40d",
  measurementId: "G-KHR0FKNFFQ",
};
firebase.initializeApp(config);

const store = getFirestore();

export { store };
