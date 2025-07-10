// 🔥 Firebase Setup
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

// 🎯 Capture Referral from URL
const urlParams = new URLSearchParams(window.location.search);
const referrerId = urlParams.get("ref");
if (referrerId) {
  localStorage.setItem("referrer", referrerId);
  console.log("🔗 Referral ID captured:", referrerId);
}

// 📝 Sign Up
const signupBtn = document.getElementById("signupBtn");
if (signupBtn) {
  signupBtn.addEventListener("click", () => {
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const userId = userCredential.user.uid;
        const ref = localStorage.getItem("referrer");

        db.collection("users").doc(userId).set({
          referrer: ref || null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("✅ Account created!");
        window.location.href = "watch-ads.html";
      })
      .catch(error => {
        alert("❌ Signup error: " + error.message);
      });
  });
}

// 🔓 Login
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = loginForm["login-email"].value;
    const password = loginForm["login-password"].value;

    auth.signInWithEmailAndPassword(email, password)
      .then((cred) => {
        window.location.href = "watch-ads.html";
      })
      .catch(err => {
        alert(err.message);
      });
  });
}

// 💰 Watch Ads and Earnings Logic
document.addEventListener("DOMContentLoaded", () => {
  const watchBtn = document.getElementById("watchAdBtn");
  const balanceText = document.getElementById("fake-balance");
  const dailyEarned = document.getElementById("today-earned");

  const today = new Date().toLocaleDateString();
  const storedDate = localStorage.getItem("earnDate");

  if (storedDate !== today) {
    localStorage.setItem("dailyClicks", "0");
    localStorage.setItem("earnDate", today);
  }

  let dailyClicks = parseInt(localStorage.getItem("dailyClicks") || "0");
  let totalEarned = parseFloat(localStorage.getItem("totalEarned") || "0");

  if (balanceText) balanceText.innerText = `$${totalEarned.toFixed(2)}`;
  if (dailyEarned) dailyEarned.innerText = `$${(dailyClicks * 0.20).toFixed(2)}`;

  if (watchBtn) {
    watchBtn.addEventListener("click", () => {
      if (dailyClicks < 50) {
        dailyClicks++;
        totalEarned += 0.20;
        localStorage.setItem("dailyClicks", dailyClicks.toString());
        localStorage.setItem("totalEarned", totalEarned.toString());

        if (balanceText) balanceText.innerText = `$${totalEarned.toFixed(2)}`;
        if (dailyEarned) dailyEarned.innerText = `$${(dailyClicks * 0.20).toFixed(2)}`;

        window.location.href = "https://ouo.io/qs/XqyC3LLx?s=https://bitcoin.org";
      } else {
        alert("✅ You’ve reached today’s ad limit!");
      }
    });
  }
});

// 🎁 Referral Bonus Logic
auth.onAuthStateChanged(user => {
  if (!user) return;
  const userId = user.uid;
  const referrer = localStorage.getItem("referrer");
  const earningToday = 10;

  db.collection("users").doc(userId).set({ earnedToday: earningToday }, { merge: true });

  if (referrer) {
    const referrerRef = db.collection("users").doc(referrer);
    const refBonus = earningToday * 0.05;

    referrerRef.get().then(doc => {
      const currentBonus = (doc.exists && doc.data().refBonus) || 0;
      const currentCount = (doc.exists && doc.data().refCount) || 0;

      referrerRef.set({
        refBonus: currentBonus + refBonus,
        refCount: currentCount + 1
      }, { merge: true });
    });
  }

  // Display referral stats
  db.collection("users").doc(userId).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      const bonus = data.refBonus || 0;
      const referrals = data.refCount || 0;
      const refStats = document.getElementById("ref-stats");
      if (refStats) {
        refStats.innerText = `Referrals: ${referrals}, Bonus: $${bonus.toFixed(2)}`;
      }
    }
  });

  // Generate referral link
  const referralInput = document.getElementById("referralLink");
  if (referralInput) {
    referralInput.value = `${window.location.origin}/signup.html?ref=${userId}`;
  }

  const copyBtn = document.getElementById("copyReferralBtn");
  const copyMsg = document.getElementById("copyMessage");
  if (copyBtn && referralInput) {
    copyBtn.onclick = () => {
      referralInput.select();
      document.execCommand("copy");
      if (copyMsg) copyMsg.innerText = "✅ Link copied!";
    };
  }
});

// 💼 Withdrawal System
const withdrawForm = document.getElementById("withdrawForm");
if (withdrawForm) {
  withdrawForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("amount").value);
    const eversendEmail = document.getElementById("eversendEmail").value;
    const user = auth.currentUser;

    if (!user) {
      document.getElementById("withdrawMessage").innerText = "Please log in first.";
      return;
    }

    rtdb.ref("withdrawals/" + user.uid).push({
      amount,
      method: "eversend",
      eversendEmail,
      status: "pending",
      requestedAt: new Date().toISOString()
    }).then(() => {
      document.getElementById("withdrawMessage").innerText = "✅ Withdrawal request sent!";
      withdrawForm.reset();
    }).catch(error => {
      document.getElementById("withdrawMessage").innerText = "Error: " + error.message;
    });
  });
}

// 👑 Admin Detection
const adminUID = "jehgHsMHHpcQpR7Cdryn91BFJ8u1";
auth.onAuthStateChanged(user => {
  if (user && user.uid === adminUID) {
    console.log("👑 Admin logged in");

    const container = document.getElementById("admin-link-container");
    if (container) {
      const adminBtn = document.createElement("a");
      adminBtn.href = "admin-withdrawal.html";
      adminBtn.innerText = "🔐 Admin Withdrawal Panel";
      adminBtn.style.cssText = "display:block; margin:10px 0; padding:10px; background:#000; color:#fff;";
      container.appendChild(adminBtn);
    }
  }
});
// === Watch Ad System v2 ===
document.addEventListener("DOMContentLoaded", function () {
const watchAdBtn = document.getElementById("watchAdBtn");
const todayEarned = document.getElementById("today-earned");
const totalBalance = document.getElementById("fake-balance");

let today = new Date().toLocaleDateString();
let storedDate = localStorage.getItem("watchDate");

// Reset daily clicks if it's a new day
if (storedDate !== today) {
localStorage.setItem("watchDate", today);
localStorage.setItem("dailyAdClicks", "0");
}

let dailyAdClicks = parseInt(localStorage.getItem("dailyAdClicks") || "0");
let totalEarned = parseFloat(localStorage.getItem("totalEarned") || "0");

if (todayEarned) todayEarned.innerText = `$${(dailyAdClicks * 0.20).toFixed(2)}`;
if (totalBalance) totalBalance.innerText = `$${totalEarned.toFixed(2)}`;

if (watchAdBtn) {
watchAdBtn.addEventListener("click", function () {
if (dailyAdClicks < 50) {
dailyAdClicks++;
totalEarned += 0.20;
localStorage.setItem("dailyAdClicks", dailyAdClicks.toString());
localStorage.setItem("totalEarned", totalEarned.toString());

// Update display
if (todayEarned) todayEarned.innerText = `$${(dailyAdClicks * 0.20).toFixed(2)}`;
if (totalBalance) totalBalance.innerText = `$${totalEarned.toFixed(2)}`;
  }
  });
  auth.onAuthStateChanged(user => {
  if (user) {
    const uid = user.uid;
    const referralLinkInput = document.getElementById("referralLink");
    if (referralLinkInput) {
      referralLinkInput.value = `${window.location.origin}/signup.html?ref=${uid}`;
    }
  }
});
  // === Firebase Config === console.log("✅ Firebase and script.js loaded!"); const firebaseConfig = { apiKey: "AIzaSyBBOKQ6mH3WBUfx-CpZQCrw9xRHeXTMi_I", authDomain: "watch2earn-28ca3.firebaseapp.com", projectId: "watch2earn-28ca3", storageBucket: "watch2earn-28ca3.appspot.com", messagingSenderId: "566681383488", appId: "1:566681383488:web:bc913e85b0beca1b2ae5a5", measurementId: "G-YE13WV835N" };

// === Initialize Firebase === firebase.initializeApp(firebaseConfig); const auth = firebase.auth(); const db = firebase.firestore();

// === Referral Capture === document.addEventListener("DOMContentLoaded", () => { const urlParams = new URLSearchParams(window.location.search); const referrerId = urlParams.get("ref"); if (referrerId) { localStorage.setItem("referrer", referrerId); console.log("🔗 Referrer ID captured:", referrerId); }

const copyBtn = document.getElementById("copyReferralBtn"); const referralInput = document.getElementById("referralLink"); const copyMessage = document.getElementById("copyMessage");

auth.onAuthStateChanged((user) => { if (user && referralInput) { const link = ${window.location.origin}/signup.html?ref=${user.uid}; referralInput.value = link; } });

if (copyBtn && referralInput) { copyBtn.addEventListener("click", () => { navigator.clipboard.writeText(referralInput.value).then(() => { if (copyMessage) copyMessage.innerText = "Copied!"; }); }); } });

// === Earnings Tracking === auth.onAuthStateChanged(async (user) => { if (!user) return; const userId = user.uid; const referrer = localStorage.getItem("referrer");

const today = new Date().toLocaleDateString(); const earningsRef = db.collection("users").doc(userId); const docSnap = await earningsRef.get(); const userData = docSnap.exists ? docSnap.data() : {};

const storedDate = userData.date || ""; let earnedToday = storedDate === today ? userData.earnedToday || 0 : 0;

// Display values if elements exist const dailyEarned = document.getElementById("today-earned"); const fakeBalance = document.getElementById("fake-balance"); if (dailyEarned) dailyEarned.innerText = $${earnedToday.toFixed(2)}; if (fakeBalance) fakeBalance.innerText = $${(userData.totalEarned || 0).toFixed(2)};

const watchAdBtn = document.getElementById("watchAdBtn"); if (watchAdBtn) { watchAdBtn.addEventListener("click", async () => { if (earnedToday >= 10) { alert("✅ You've reached today's limit!"); return; } earnedToday += 0.20; const totalEarned = (userData.totalEarned || 0) + 0.20;

await earningsRef.set({
    date: today,
    earnedToday,
    totalEarned,
  }, { merge: true });

  if (dailyEarned) dailyEarned.innerText = `$${earnedToday.toFixed(2)}`;
  if (fakeBalance) fakeBalance.innerText = `$${totalEarned.toFixed(2)}`;

  // Referral Bonus
  if (referrer) {
    const refBonus = 0.20 * 0.05;
    const refDoc = await db.collection("users").doc(referrer).get();
    const refData = refDoc.exists ? refDoc.data() : {};
    await db.collection("users").doc(referrer).set({
      refBonus: (refData.refBonus || 0) + refBonus,
      refCount: (refData.refCount || 0) + 1,
    }, { merge: true });
  }
});

} });


