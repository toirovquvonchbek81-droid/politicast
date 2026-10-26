import { app } from "./firebase-config.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { taskCard } from "./dates.js";

const auth = getAuth(app), db = getFirestore(app);
const $ = (id) => document.getElementById(id);
$("out").addEventListener("click", async () => { await signOut(auth); location.replace("login.html"); });

onAuthStateChanged(auth, async (u) => {
  if (!u) { location.replace("login.html"); return; }
  try {
    const p = await getDoc(doc(db, "users", u.uid));
    if (!p.exists() || !p.data().firstName) { location.replace("login.html"); return; }
    const s = await getDocs(query(collection(db, "assignments"), where("status", "==", "active")));
    const list = s.docs.map((d) => d.data()).sort((a, b) => a.dueAt.seconds - b.dueAt.seconds);
    $("load").hidden = true; $("main").hidden = false;
    $("empty").hidden = list.length > 0;
    list.forEach((a) => $("list").append(taskCard(a)));
  } catch (e) {
    $("load").hidden = true; $("main").hidden = false;
    $("msg").hidden = false; $("msg").textContent = "Yuklab bo'lmadi: " + (e.code || e.message);
  }
});
