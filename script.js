// ✅ Firebase Setup
const firebaseConfig = {
  apiKey: "AIzaSyBBOKQ6mH3WBUfx-CpZQCrw9xRHeXTMi_I",
  authDomain: "watch2earn-28ca3.firebaseapp.com",
  projectId: "watch2earn-28ca3",
  storageBucket: "watch2earn-28ca3.appspot.com",
  messagingSenderId: "566681383488",
  appId: "1:566681383488:web:bc913e85b0beca1b2ae5a5",
  measurementId: "G-YE13WV835N"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const rtdb = firebase.database();

console.log("✅ Firebase initialized");

// 🌐 Referral Tracking
const urlParams = new URLSearchParams(window.location.search);
const referrerId = urlParams.get("ref");
if (referrerId) localStorage.setItem("referrer", referrerId);

// 👤 Signup Handler
const signupBtn = document.getElementById("signupBtn");
if (signupBtn) {
  signupBtn.onclick = async () => {
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await db.collection("users").doc(cred.user.uid).set({
        referrer: localStorage.getItem("referrer") || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert("✅ Account created!");
      window.location.href = "watch-ads.html";
    } catch (err) {
      alert("❌ Signup Error: " + err.message);
    }
  };
}

// 🔐 Login Handler
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = loginForm["login-email"].value;
    const password = loginForm["login-password"].value;
    try {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = "watch-ads.html";
    } catch (err) {
      alert("❌ Login Error: " + err.message);
    }
  };
}

// 💼 Withdraw Request
const withdrawForm = document.getElementById("withdrawForm");
if (withdrawForm) {
  withdrawForm.onsubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("amount").value);
    const eversendEmail = document.getElementById("eversendEmail").value;
    const user = auth.currentUser;
    if (!user) return alert("Please log in.");
    try {
      await rtdb.ref(`withdrawals/${user.uid}`).push({
        amount,
        method: "eversend",
        eversendEmail,
        status: "pending",
        requestedAt: new Date().toISOString()
      });
      document.getElementById("withdrawMessage").innerText = "✅ Withdrawal request sent!";
      withdrawForm.reset();
    } catch (err) {
      document.getElementById("withdrawMessage").innerText = "❌ Error: " + err.message;
    }
  };
}

// 🎥 Watch Ads Logic
function setupAdTracking() {
  const watchBtn = document.getElementById("watchAdBtn");
  const today = new Date().toLocaleDateString();
  const user = auth.currentUser;
  if (!watchBtn || !user) return;

  const userDoc = db.collection("users").doc(user.uid);

  watchBtn.onclick = async () => {
    const doc = await userDoc.get();
    const data = doc.data() || {};
    const lastDate = data.date || "";
    let earnedToday = (lastDate === today) ? data.earnedToday || 0 : 0;
    let totalEarned = data.totalEarned || 0;

    if (earnedToday >= 10) return alert("✅ Daily limit reached!");
    earnedToday += 0.20;
    totalEarned += 0.20;

    await userDoc.set({
      date: today,
      earnedToday,
      totalEarned
    }, { merge: true });

    const dailyEarned = document.getElementById("today-earned");
    const fakeBalance = document.getElementById("fake-balance");
    if (dailyEarned) dailyEarned.innerText = `$${earnedToday.toFixed(2)}`;
    if (fakeBalance) fakeBalance.innerText = `$${totalEarned.toFixed(2)}`;

    // Referral bonus
    const referrer = data.referrer;
    if (referrer) {
      const refDoc = await db.collection("users").doc(referrer).get();
      const refData = refDoc.data() || {};
      const refBonus = 0.01;
      await db.collection("users").doc(referrer).set({
        refBonus: (refData.refBonus || 0) + refBonus,
        refCount: (refData.refCount || 0) + 1
      }, { merge: true });
    }
  };
}

auth.onAuthStateChanged(user => {
  if (!user) return;
  setupAdTracking();

  // 🔗 Referral Link Generator
  const refInput = document.getElementById("referralLink");
  const copyBtn = document.getElementById("copyReferralBtn");
  const copyMsg = document.getElementById("copyMessage");
  if (refInput) refInput.value = `${window.location.origin}/signup.html?ref=${user.uid}`;
  if (copyBtn && refInput) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(refInput.value).then(() => {
        if (copyMsg) copyMsg.innerText = "✅ Link copied!";
      });
    };
  }

  // 🧠 Admin Section
  const adminUID = "jehgHsMHHpcQpR7Cdryn91BFJ8u1";
  if (user.uid === adminUID) {
    const container = document.getElementById("admin-link-container");
    if (container) {
      const adminBtn = document.createElement("a");
      adminBtn.href = "admin-withdrawal.html";
      adminBtn.innerText = "🔐 Admin Panel";
      adminBtn.style = "display:block; margin:10px 0; padding:10px; background:#000; color:#fff; text-align:center; border-radius:6px;";
      container.appendChild(adminBtn);
    }
  }
});
  
