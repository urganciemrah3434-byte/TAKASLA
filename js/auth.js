import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase Konfigürasyonu
const firebaseConfig = {
  apiKey: "AIzaSyDiEf4SXghJpXUiHIrflLk8lnvaAk7LnUI",
  authDomain: "takasla-e2013.firebaseapp.com",
  projectId: "takasla-e2013",
  storageBucket: "takasla-e2013.firebasestorage.app",
  messagingSenderId: "324778736339",
  appId: "1:324778736339:web:d1c25d9aff143c35833226",
  measurementId: "G-CX29N06BZ7"
};

// Firebase'i Başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Kayıt Formunu Dinle
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
            console.error("Firebase Hatası:", error);
            alert("Hata oluştu: " + error.message);
        }
    });
}

// Giriş Formunu Dinle
const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            alert("Hoş geldin! Giriş başarılı: " + userCredential.user.email);
            window.location.href = "index.html";
        } catch (error) {
            console.error("Giriş Hatası:", error);
            alert("Giriş başarısız: " + error.message);
        }
    });
}

// Oturum Durumunu Dinle ve Ana Sayfa Görünümünü Güncelle
onAuthStateChanged(auth, (user) => {
    const authNav = document.getElementById("auth-nav");
    
    if (authNav) {
        if (user) {
            // Kullanıcı giriş yapmışsa
            authNav.innerHTML = `
                <span style="color:#a8ffb2; font-weight:bold;">👤 ${user.email}</span> 
                <a href="#" id="logout-btn" style="color:#ff6b6b; font-weight:bold; margin-left:15px; text-decoration:none;">[Çıkış Yap]</a>
            `;
            
            const logoutBtn = document.getElementById("logout-btn");
            if (logoutBtn) {
                logoutBtn.addEventListener("click", async (e) => {
                    e.preventDefault();
                    await signOut(auth);
                    alert("Çıkış yapıldı.");
                    window.location.reload();
                });
            }
        } else {
            // Kullanıcı giriş yapmamışsa
            authNav.innerHTML = `
                <a href="login.html" style="color:white; margin-right:10px;">Giriş Yap</a>
                <a href="register.html" style="color:white;">Üye Ol</a>
            `;
        }
    }
});
