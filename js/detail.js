import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs 
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
const urlParams = new URLSearchParams(window.location.search);
const listingId = urlParams.get('id');

// Oturum ve İlan Yükleme
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (listingId) {
        await loadListingDetail();
    } else {
        document.getElementById("listing-detail").innerHTML = "<h2>İlan bulunamadı!</h2>";
    }
});

async function loadListingDetail() {
    const detailContainer = document.getElementById("listing-detail");
    try {
        const docRef = doc(db, "listings", listingId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            detailContainer.innerHTML = "<h2>İlan bulunamadı veya silinmiş.</h2>";
            return;
        }

        const data = docSnap.data();
        let imageHTML = data.imageUrl 
            ? `<img src="${data.imageUrl}" class="detail-img" alt="${data.title}">`
            : `<div style="width:100%; height:200px; background:#eee; display:flex; align-items:center; justify-content:center; color:#888; border-radius:8px; margin-bottom:20px;">Fotoğraf Yok</div>`;

        let offerSectionHTML = "";

        if (!currentUser) {
            offerSectionHTML = `<div class="offer-box"><p>Takas teklifi vermek için lütfen <a href="login.html">giriş yapın</a>.</p></div>`;
        } else if (currentUser.email === data.userEmail) {
            offerSectionHTML = `<div class="offer-box" style="border-color:#ffc107;"><p><strong>📌 Bu sizin kendi ilanınız.</strong> Başkalarının teklif vermesini bekleyin.</p></div>`;
        } else {
            offerSectionHTML = `
                <div class="offer-box">
                    <h3>🔄 Bu Ürün İçin Takas Teklif Et</h3>
                    <p>Kendi eklediğin ilanlardan birini seçerek teklif gönder:</p>
                    <select id="my-listings-select">
                        <option value="">İlanlarınız yükleniyor...</option>
                    </select>
                    <button id="send-offer-btn" class="offer-btn">TAKAS TEKLİFİ GÖNDER</button>
                </div>
            `;
        }

        detailContainer.innerHTML = `
            ${imageHTML}
            <h1 style="color:#333; margin-top:0;">${data.title}</h1>
            <p style="font-size:16px; color:#555; line-height:1.6;">${data.description}</p>
            
            <div style="background:#eef; padding:15px; border-radius:8px; margin:20px 0;">
                <h4 style="margin:0 0 5px 0; color:#0056b3;">🔄 İlan Sahibinin Takas İsteği:</h4>
                <p style="margin:0; font-weight:bold; font-size:16px; color:#333;">${data.target}</p>
            </div>

            <p style="color:#888; font-size:13px; text-align:right;">İlan Sahibi: <strong>${data.userEmail.split('@')[0]}***</strong></p>
            
            ${offerSectionHTML}
        `;

        if (currentUser && currentUser.email !== data.userEmail) {
            loadUserListingsForOffer(data.userEmail);
        }

    } catch (error) {
        console.error("Detay hatası:", error);
        detailContainer.innerHTML = "<h2>İlan yüklenirken bir hata oluştu.</h2>";
    }
}

// Kullanıcının teklif yapabileceği kendi ilanlarını çek
async function loadUserListingsForOffer(ownerEmail) {
    const select = document.getElementById("my-listings-select");
    try {
        const q = query(collection(db, "listings"), where("userEmail", "==", currentUser.email));
        const querySnapshot = await getDocs(q);

        select.innerHTML = "";

        if (querySnapshot.empty) {
            select.innerHTML = `<option value="">Henüz ilanınız yok! Önce ilan ekleyin.</option>`;
            document.getElementById("send-offer-btn").disabled = true;
            return;
        }

        querySnapshot.forEach((doc) => {
            const item = doc.data();
            const option = document.createElement("option");
            option.value = doc.id;
            option.text = item.title;
            select.appendChild(option);
        });

        // Teklif Gönderme Butonu Olayı
        document.getElementById("send-offer-btn").addEventListener("click", () => sendOffer(ownerEmail));

    } catch (error) {
        console.error("Kullanıcı ilanları çekilemedi:", error);
    }
}

// Teklifi Firestore'a Kaydet
async function sendOffer(ownerEmail) {
    const select = document.getElementById("my-listings-select");
    const offeredListingId = select.value;

    if (!offeredListingId) {
        alert("Lütfen teklif etmek için bir ürününüzü seçin!");
        return;
    }

    const btn = document.getElementById("send-offer-btn");
    btn.disabled = true;
    btn.innerText = "Teklif Gönderiliyor...";

    try {
        await addDoc(collection(db, "offers"), {
            targetListingId: listingId,
            offeredListingId: offeredListingId,
            fromUser: currentUser.email,
            toUser: ownerEmail,
            status: "beklemede",
            createdAt: new Date()
        });

        alert("🎉 Takas teklifiniz ilan sahibine başarıyla iletildi!");
        btn.disabled = false;
        btn.innerText = "TAKAS TEKLİFİ GÖNDER";
    } catch (error) {
        console.error("Teklif hatası:", error);
        alert("Teklif gönderilirken bir hata oluştu.");
        btn.disabled = false;
        btn.innerText = "TAKAS TEKLİFİ GÖNDER";
    }
}
