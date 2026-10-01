// js/firebase.js

const firebaseConfig = {
  apiKey: "AIzaSyAFR7niH8vjC91e7EFfmkB3WS_EcCHhj_c",
  authDomain: "mjm-associates.firebaseapp.com",
  projectId: "mjm-associates",
  storageBucket: "mjm-associates.firebasestorage.app",
  messagingSenderId: "979424991861",
  appId: "1:979424991861:web:2ce13671207d21b338363c",
  measurementId: "G-GMKVZTFFQM"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();