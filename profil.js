import { app } from "./firebase-config.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const auth = getAuth(app), db = getFirestore(app);
const $ = (id) => document.getElementById(id);
const msg = (t, type) => { const m = $("msg"); m.hidden = !t; m.textContent = t || ""; m.className = "msg " + (type || "info"); };
let uid;

$("f").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const fn = $("fn").value.trim(), ln = $("ln").value.trim();
  if (fn.length < 2 || ln.length < 2) { msg("Ism va familiya kamida 2 ta harfdan iborat bo'lsin.", "err"); return; }
  const b = $("save"); b.disabled = true;
  try {
    await updateDoc(doc(db, "users", uid), { firstName: fn, lastName: ln, displayName: fn + " " + ln, updatedAt: serverTimestamp() });
    msg("Saqlandi. Reytingdagi ism keyingi tasdiqlangan xulosadan keyin yangilanadi.", "ok");
  } catch (e) { msg("Saqlanmadi: " + (e.code === "permission-denied" ? "ruxsat yo'q" : (e.code || e.message)), "err"); }
  b.disabled = false;
});

onAuthStateChanged(auth, async (u) => {
  if (!u) { location.replace("login.html"); return; }
  uid = u.uid;
  try {
    const s = await getDoc(doc(db, "users", uid));
    if (!s.exists() || !s.data().firstName) { location.replace("login.html"); return; }
    const d = s.data();
    $("fn").value = d.firstName; $("ln").value = d.lastName; $("em").value = d.email || u.email || "";
    $("load").hidden = true; $("main").hidden = false;
  } catch (e) { $("load").textContent = "Yuklab bo'lmadi: " + (e.code || e.message); }
});
