import { app } from "./firebase-config.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const $ = (id) => document.getElementById(id);
const SCREENS = ["s-load", "s-login", "s-profile", "s-done"];
const show = (id) => SCREENS.forEach((s) => ($(s).hidden = s !== id));
function msg(text, type) {
  const m = $("msg");
  m.hidden = !text;
  m.textContent = text || "";
  m.className = "msg " + (type || "info");
}
const ERRORS = {
  "auth/popup-closed-by-user": "Google oynasi yopildi. Qaytadan urinib ko'ring.",
  "auth/cancelled-popup-request": "Kirish bekor qilindi. Qaytadan urinib ko'ring.",
  "auth/popup-blocked": "Brauzer oynani blokladi. Qalqib chiquvchi oynalarga ruxsat bering va qayta urining.",
  "auth/unauthorized-domain": "Bu sayt manzili Firebase'da ruxsat etilmagan. Authentication → Settings → Authorized domains ga qo'shing.",
  "auth/operation-not-allowed": "Firebase'da Google bilan kirish yoqilmagan.",
  "auth/network-request-failed": "Internet aloqasi yo'q yoki uzilgan.",
  "permission-denied": "Ma'lumotni saqlashga ruxsat yo'q. Firestore qoidalari to'g'ri joylanganini tekshiring."
};
const errText = (e) => ERRORS[e.code] || "Xatolik yuz berdi: " + (e.code || e.message);

let currentUser = null;
let profileExists = false;

async function route(user) {
  msg("");
  if (!user) { show("s-login"); return; }
  currentUser = user;
  show("s-load");
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    profileExists = snap.exists();
    const d = snap.exists() ? snap.data() : {};
    if (d.firstName && d.lastName) { showDone(user, d); return; }
    const parts = (user.displayName || "").trim().split(/\s+/);
    $("fn").value = d.firstName || parts[0] || "";
    $("ln").value = d.lastName || parts.slice(1).join(" ") || "";
    show("s-profile");
  } catch (e) {
    show("s-login");
    msg(errText(e), "err");
  }
}

function showDone(user, d) {
  $("hello").textContent = "Xush kelibsiz, " + d.firstName + "!";
  $("mail").textContent = user.email || "";
  $("uid").textContent = user.uid;
  show("s-done");
}

$("btn-google").addEventListener("click", async () => {
  const b = $("btn-google");
  b.disabled = true;
  msg("");
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e) {
    msg(errText(e), "err");
  }
  b.disabled = false;
});

$("s-profile").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const fn = $("fn").value.trim();
  const ln = $("ln").value.trim();
  if (fn.length < 2 || ln.length < 2) { msg("Ism va familiya kamida 2 ta harfdan iborat bo'lsin.", "err"); return; }
  const b = $("btn-save");
  b.disabled = true;
  try {
    const ref = doc(db, "users", currentUser.uid);
    const base = { firstName: fn, lastName: ln, displayName: fn + " " + ln, updatedAt: serverTimestamp() };
    if (profileExists) {
      await updateDoc(ref, base);
    } else {
      await setDoc(ref, { ...base, email: currentUser.email || "", photoURL: currentUser.photoURL || "", createdAt: serverTimestamp() });
    }
    showDone(currentUser, base);
  } catch (e) {
    msg(errText(e), "err");
  }
  b.disabled = false;
});

$("btn-copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("uid").textContent); msg("UID nusxalandi.", "ok"); }
  catch { msg("Nusxalab bo'lmadi. UID ni qo'lda belgilab nusxalang.", "err"); }
});
$("btn-out").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, route);
