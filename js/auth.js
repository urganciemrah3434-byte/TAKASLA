import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

// Firebase Başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Formu Dinle
const registerForm = document.getElementById("register-form");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            alert("Tebrikler! Üyelik başarıyla oluşturuldu: " + userCredential.user.email);
            window.location.href = "index.html";
        } catch (error) {
            alert("Hata oluştu: " + error.message);
        }
    });
}
