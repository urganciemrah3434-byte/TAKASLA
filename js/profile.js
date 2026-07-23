import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert("Profilinizi görmek için giriş yapmalısınız.");
        window.location.href = "login.html";
        return;
    }

    document.getElementById("user-email-display").innerText = `E-posta: ${user.email}`;

    await loadOffers(user.email);
});

// Teklifleri Yükleme Fonksiyonu
async function loadOffers(userEmail) {
    const incomingContainer = document.getElementById("incoming-offers");
    const outgoingContainer = document.getElementById("outgoing-offers");

    try {
        const querySnapshot = await getDocs(collection(db, "offers"));

        if (querySnapshot.empty) {
            incomingContainer.innerHTML = "<p>Henüz size gelen bir takas teklifi yok.</p>";
            outgoingContainer.innerHTML = "<p>Henüz kimseye takas teklifi göndermediniz.</p>";
            return;
        }

        let incomingCount = 0;
        let outgoingCount = 0;

        incomingContainer.innerHTML = "";
        outgoingContainer.innerHTML = "";

        for (const offerDoc of querySnapshot.docs) {
            const offer = offerDoc.data();
            const offerId = offerDoc.id;

            // İlan detaylarını çek
            let targetTitle = "Bilinmeyen İlan";
            let offeredTitle = "Bilinmeyen İlan";

            try {
                if (offer.targetListingId) {
                    const targetSnap = await getDoc(doc(db, "listings", offer.targetListingId));
                    if (targetSnap.exists()) targetTitle = targetSnap.data().title;
                }
                if (offer.offeredListingId) {
                    const offeredSnap = await getDoc(doc(db, "listings", offer.offeredListingId));
                    if (offeredSnap.exists()) offeredTitle = offeredSnap.data().title;
                }
            } catch (err) {
                console.log("İlan başlığı alınamadı:", err);
            }

            // Gelen Teklifler (Bana Gelen)
            if (offer.toUser === userEmail) {
                incomingCount++;
                const card = document.createElement("div");
                card.className = "offer-card";

                let actionButtons = "";
                if (offer.status === "beklemede") {
                    actionButtons = `
                        <div>
                            <button class="btn-action btn-accept" onclick="updateOfferStatus('${offerId}', 'kabul edildi')">Kabul Et</button>
                            <button class="btn-action btn-reject" onclick="updateOfferStatus('${offerId}', 'reddedildi')">Reddet</button>
                        </div>
                    `;
                } else {
                    const badgeClass = offer.status === 'kabul edildi' ? 'badge-accepted' : 'badge-rejected';
                    actionButtons = `<span class="badge ${badgeClass}">${offer.status.toUpperCase()}</span>`;
                }

                card.innerHTML = `
                    <div>
                        <p style="margin:0 0 5px 0;"><strong>${offer.fromUser ? offer.fromUser.split('@')[0] : 'Kullanıcı'}***</strong> sizin <strong>"${targetTitle}"</strong> ürününüze <strong>"${offeredTitle}"</strong> ürününü teklif etti.</p>
                        <small style="color:#888;">Durum: ${offer.status}</small>
                    </div>
                    ${actionButtons}
                `;
                incomingContainer.appendChild(card);
            }

            // Gönderilen Teklifler (Benim Gönderdiğim)
            if (offer.fromUser === userEmail) {
                outgoingCount++;
                let badgeClass = "badge-pending";
                if (offer.status === "kabul edildi") badgeClass = "badge-accepted";
                if (offer.status === "reddedildi") badgeClass = "badge-rejected";

                const card = document.createElement("div");
                card.className = "offer-card";
                card.innerHTML = `
                    <div>
                        <p style="margin:0 0 5px 0;"><strong>"${targetTitle}"</strong> ürünü için kendi <strong>"${offeredTitle}"</strong> ürününüzü teklif ettiniz.</p>
                        <small style="color:#888;">Alıcı: ${offer.toUser ? offer.toUser.split('@')[0] : 'Kullanıcı'}***</small>
                    </div>
                    <span class="badge ${badgeClass}">${offer.status.toUpperCase()}</span>
                `;
                outgoingContainer.appendChild(card);
            }
        }

        if (incomingCount === 0) {
            incomingContainer.innerHTML = "<p>Henüz size gelen bir takas teklifi yok.</p>";
        }
        if (outgoingCount === 0) {
            outgoingContainer.innerHTML = "<p>Henüz kimseye takas teklifi göndermediniz.</p>";
        }

    } catch (error) {
        console.error("Teklifler çekilemedi:", error);
        incomingContainer.innerHTML = "<p>Gelen teklifler yüklenirken bir hata oluştu.</p>";
        outgoingContainer.innerHTML = "<p>Giden teklifler yüklenirken bir hata oluştu.</p>";
    }
}

// Global Fonksiyon: Teklif Onay / Red İşlemi
window.updateOfferStatus = async (offerId, newStatus) => {
    try {
        await updateDoc(doc(db, "offers", offerId), {
            status: newStatus
        });
        alert(`Teklif ${newStatus}!`);
        location.reload();
    } catch (error) {
        console.error("Güncelleme hatası:", error);
        alert("İşlem sırasında bir hata oluştu.");
    }
};
