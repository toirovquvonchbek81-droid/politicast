import { app } from "./firebase-config.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { bookCard } from "./ui.js";

const auth = getAuth(app), db = getFirestore(app);
const $ = (id) => document.getElementById(id);
$("out").addEventListener("click", async () => { await signOut(auth); location.replace("login.html"); });

onAuthStateChanged(auth, async (u) => {
  if (!u) { location.replace("login.html"); return; }
  try {
    const p = await getDoc(doc(db, "users", u.uid));
    if (!p.exists() || !p.data().firstName) { location.replace("login.html"); return; }
    $("hi").textContent = "Salom, " + p.data().firstName + "!";
    $("load").hidden = true; $("main").hidden = false;
    getDoc(doc(db, "admins", u.uid)).then((a) => { if (a.exists()) $("adm").hidden = false; }).catch(() => {});
    const s = await getDocs(query(collection(db, "books"), where("status", "==", "active")));
    const list = s.docs.map((d) => d.data()).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    $("empty").hidden = list.length > 0;
    list.forEach((b) => $("books").append(bookCard(b)));
  } catch (e) {
    $("load").hidden = true; $("main").hidden = false;
    $("msg").hidden = false;
    $("msg").textContent = "Ma'lumotni yuklab bo'lmadi: " + (e.code || e.message);
  }
});
