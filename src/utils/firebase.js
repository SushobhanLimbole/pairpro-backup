import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyAk010uXVXNepp1n7w4chzfgaYz5Cjk5rA",
    authDomain: "webchat-4649c.firebaseapp.com",
    projectId: "webchat-4649c",
    storageBucket: "webchat-4649c.firebasestorage.app",
    messagingSenderId: "930289158859",
    appId: "1:930289158859:web:d17a3e07e6fcf6ec1ce94e"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

