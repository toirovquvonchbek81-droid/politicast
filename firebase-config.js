// PolitiCast - Firebase sozlamalari (veb-ilova uchun ochiq bo'lishi normal).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyAisH79bGQeNjkZ8yVVPYuHO_x1hukoTi0",
  authDomain: "politicast-b46b5.firebaseapp.com",
  projectId: "politicast-b46b5",
  storageBucket: "politicast-b46b5.firebasestorage.app",
  messagingSenderId: "526590989690",
  appId: "1:526590989690:web:149fffbfa08f6f0a0072c3"
};

export const app = initializeApp(firebaseConfig);

// Yagona menyuni yuklash
import("./nav.js").catch((e) => console.warn("Menyu yuklanmadi", e));
