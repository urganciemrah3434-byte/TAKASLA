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
let selectedFile = null;

// Oturum Kontrolü
onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

// SÜRÜKLE-BIRAK VE DOSYA SEÇİM MANTIĞI
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("item-image-file");
const previewImg = document.getElementById("image-preview");
const dropText = document.getElementById("drop-zone-text");

if (dropZone) {
    dropZone.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
}

function handleFile(file) {
    if (!file.type.startsWith("image/")) {
        alert("Lütfen sadece resim dosyası seçin!");
        return;
    }
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewImg.style.display = "block";
        dropText.style.display = "none";
    };
    reader.readAsDataURL(file);
}

// Görseli Sıkıştırıp Base64 Formatına Dönüştüren Fonksiyon
function compressImage(file, maxWidth = 600, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const base64Url = canvas.toDataURL("image/jpeg", quality);
                resolve(base64Url);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}

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
        submitBtn.innerText = "İlan Hazırlanıyor ve Kaydediliyor...";

        const title = document.getElementById("item-title").value;
        const desc = document.getElementById("item-desc").value;
        const target = document.getElementById("item-target").value;

        let imageUrl = "";

        try {
            // Eğer resim seçildiyse yerel olarak sıkıştır ve Base64 al
            if (selectedFile) {
                imageUrl = await compressImage(selectedFile);
            }

            // Firestore Veritabanına Kaydet
            await addDoc(collection(db, "listings"), {
                title: title,
                description: desc,
                target: target,
                imageUrl: imageUrl,
                userEmail: currentUser.email,
                createdAt: new Date()
            });

            alert("Tebrikler! Fotoğraflı ilanınız başarıyla yayınlandı.");
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

                let imageHTML = data.imageUrl 
                    ? `<img src="${data.imageUrl}" alt="${data.title}" style="width:100%; height:180px; object-fit:cover; border-radius:5px; margin-bottom:10px;">`
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
