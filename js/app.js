import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

// Oturum Kontrolü
onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

// 1. İLAN EKLEME FORMU
const addForm = document.getElementById("add-listing-form");
if (addForm) {
    addForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!currentUser) {
            alert("İlan eklemek için önce giriş yapmalısınız!");
            window.location.href = "login.html";
            return;
        }

        const submitBtn = document.getElementById("submit-btn");
        submitBtn.disabled = true;
        submitBtn.innerText = "Yayınlanıyor...";

        const title = document.getElementById("item-title").value;
        const desc = document.getElementById("item-desc").value;
        const target = document.getElementById("item-target").value;
        const imageUrl = document.getElementById("item-image-url").value;

        try {
            // Veritabanına kaydet
            await addDoc(collection(db, "listings"), {
                title: title,
                description: desc,
                target: target,
                imageUrl: imageUrl,
                userEmail: currentUser.email,
                createdAt: new Date()
            });

            alert("Tebrikler! İlanınız başarıyla yayınlandı.");
            window.location.href = "index.html";
        } catch (error) {
            console.error("Hata:", error);
            alert("İlan eklenirken bir hata oluştu: " + error.message);
            submitBtn.disabled = false;
            submitBtn.innerText = "İLAN YAYINLA";
        }
    });
}

// 2. ANA SAYFADA İLANLARI LİSTELEME
const container = document.getElementById("listings-container");
if (container) {
    async function loadListings() {
        try {
            const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            
            container.innerHTML = ""; 

            if (querySnapshot.empty) {
                container.innerHTML = "<p>Henüz ilan eklenmemiş. İlk ilanı sen ekle!</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const card = document.createElement("div");
                card.className = "card";
                card.style.cssText = "width:280px; padding:15px; border:1px solid #ddd; border-radius:8px; background:#fff; text-align:left; display:flex; flex-direction:column; justify-content:space-between;";

                // Fotoğraf varsa görsel alanını oluştur
                let imageHTML = data.imageUrl 
                    ? `<img src="${data.imageUrl}" alt="${data.title}" style="width:100%; height:180px; object-fit:cover; border-radius:5px; margin-bottom:10px;" onerror="this.onerror=null; this.src='https://via.placeholder.com/280x180?text=Gorsel+Yuklenemedi';">`
                    : `<div style="width:100%; height:150px; background:#eee; display:flex; align-items:center; justify-content:center; color:#888; border-radius:5px; margin-bottom:10px;">Fotoğraf Yok</div>`;

                card.innerHTML = `
                    <div>
                        ${imageHTML}
                        <h3 style="margin:5px 0; color:#333;">${data.title}</h3>
                        <p style="font-size:14px; color:#666; margin-bottom:10px;">${data.description}</p>
                    </div>
                    <div>
                        <p style="font-size:13px; background:#eef; padding:8px; border-radius:4px; margin-bottom:5px;">
                            <strong>🔄 Takas İsteği:</strong> ${data.target}
                        </p>
                        <p style="font-size:11px; color:#888; text-align:right; margin:0;">
                            İlan Sahibi: ${data.userEmail.split('@')[0]}***
                        </p>
                    </div>
                `;
                container.appendChild(card);
            });
        } catch (error) {
            console.error("İlan çekme hatası:", error);
            container.innerHTML = "<p>İlanlar yüklenirken bir hata oluştu.</p>";
        }
    }

    loadListings();
}
