import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';

export const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
};

export const app = initializeApp(firebaseConfig);
