// firebaseConfig.js
// Import required Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsDkmjUv0RnzEzHo88aI3YI-OUlTbFxQI",
  authDomain: "bayleaf-e58ac.firebaseapp.com",
  projectId: "bayleaf-e58ac",
  storageBucket: "bayleaf-e58ac.appspot.com",
  messagingSenderId: "636689020882",
  appId: "1:636689020882:web:8399e682b002cd7296fa0b",
  clientEmail: "firebase-adminsdk-lrfxs@bayleaf-e58ac.iam.gserviceaccount.com",
  clientSecret: "your-client-secret",  // Remove this if not necessary
};


// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
