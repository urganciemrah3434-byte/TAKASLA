import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
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

    await loadIncomingOffers(user.email);
    await loadOutgoingOffers(user.email);
});

// Gelen Teklifleri Yükle
async function loadIncomingOffers(userEmail) {
    const container = document.getElementById("incoming-offers");
    try {
        const q = query(collection(db, "offers"), where("toUser", "==", userEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = "<p>Henüz size gelen bir takas teklifi yok.</p>";
            return;
        }

        container.innerHTML = "";

        for (const offerDoc of querySnapshot.docs) {
            const offer = offerDoc.data();
            const offerId = offerDoc.id;

            // İlan detaylarını çek
            const targetSnap = await getDoc(doc(db, "listings", offer.targetListingId));
            const offeredSnap = await getDoc(doc(db, "listings", offer.offeredListingId));

            const targetTitle = targetSnap.exists() ? targetSnap.data().title : "Silinmiş İlan";
            const offeredTitle = offeredSnap.exists() ? offeredSnap.data().title : "Silinmiş İlan";

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
                actionButtons = `<span class="badge badge-${offer.status === 'kabul edildi' ? 'accepted' : 'rejected'}">${offer.status.toUpperCase()}</span>`;
            }

            card.innerHTML = `
                <div>
                    <p style="margin:0 0 5px 0;"><strong>${offer.fromUser.split('@')[0]}***</strong> sizin <strong>"${targetTitle}"</strong> ürününüze <strong>"${offeredTitle}"</strong> ürününü teklif etti.</p>
                    <small style="color:#888;">Durum: ${offer.status}</small>
                </div>
                ${actionButtons}
            `;
            container.appendChild(card);
        }

    } catch (error) {
        console.error("Gelen teklifler çekilemedi:", error);
        container.innerHTML = "<p>Gelen teklifler yüklenirken bir hata oluştu.</p>";
    }
}

// Gönderilen Teklifleri Yükle
async function loadOutgoingOffers(userEmail) {
    const container = document.getElementById("outgoing-offers");
    try {
        const q = query(collection(db, "offers"), where("fromUser", "==", userEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = "<p>Henüz kimseye takas teklifi göndermediniz.</p>";
            return;
        }

        container.innerHTML = "";

        for (const offerDoc of querySnapshot.docs) {
            const offer = offerDoc.data();

            const targetSnap = await getDoc(doc(db, "listings", offer.targetListingId));
            const offeredSnap = await getDoc(doc(db, "listings", offer.offeredListingId));

            const targetTitle = targetSnap.exists() ? targetSnap.data().title : "Silinmiş İlan";
            const offeredTitle = offeredSnap.exists() ? offeredSnap.data().title : "Silinmiş İlan";

            let badgeClass = "badge-pending";
            if (offer.status === "kabul edildi") badgeClass = "badge-accepted";
            if (offer.status === "reddedildi") badgeClass = "badge-rejected";

            const card = document.createElement("div");
            card.className = "offer-card";
            card.innerHTML = `
                <div>
                    <p style="margin:0 0 5px 0;"><strong>"${targetTitle}"</strong> ürünü için kendi <strong>"${offeredTitle}"</strong> ürününüzü teklif ettiniz.</p>
                    <small style="color:#888;">Alıcı: ${offer.toUser.split('@')[0]}***</small>
                </div>
                <span class="badge ${badgeClass}">${offer.status.toUpperCase()}</span>
            `;
            container.appendChild(card);
        }

    } catch (error) {
        console.error("Giden teklifler çekilemedi:", error);
        container.innerHTML = "<p>Giden teklifler yüklenirken bir hata oluştu.</p>";
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
