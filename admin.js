import { app } from "./firebase-config.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, addDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { bookCard } from "./ui.js";

const auth = getAuth(app), db = getFirestore(app);
const $ = (id) => document.getElementById(id);
let uid = null;

function msg(t, type) { const m = $("msg"); m.hidden = !t; m.textContent = t || ""; m.className = "msg " + (type || "info"); }
$("out").addEventListener("click", async () => { await signOut(auth); location.replace("login.html"); });

async function loadBooks() {
  const s = await getDocs(collection(db, "books"));
  const list = s.docs.map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  const box = $("books"); box.replaceChildren();
  $("empty").hidden = list.length > 0;
  list.forEach((b) => {
    const c = bookCard(b);
    const arch = b.status === "archived";
    if (arch) { const bd = document.createElement("span"); bd.className = "badge"; bd.textContent = "Arxivda"; c.insertBefore(bd, c.children[1]); }
    const btn = document.createElement("button");
    btn.className = "btn ghost sm"; btn.type = "button";
    btn.textContent = arch ? "Qaytarish" : "Arxivlash";
    btn.addEventListener("click", async () => {
      const q = arch ? "Kitob talabalarga yana ko'rinadi. Davom etasizmi?" : "Kitob talabalardan yashiriladi (natijalar saqlanadi). Davom etasizmi?";
      if (!confirm(q)) return;
      btn.disabled = true;
      try { await updateDoc(doc(db, "books", b.id), { status: arch ? "active" : "archived" }); await loadBooks(); }
      catch (e) { msg("Amal bajarilmadi: " + (e.code || e.message), "err"); btn.disabled = false; }
    });
    c.append(btn); box.append(c);
  });
}

$("f").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const title = $("t").value.trim(), author = $("a").value.trim(), description = $("d").value.trim(), coverURL = $("c").value.trim();
  if (title.length < 2 || author.length < 2) { msg("Kitob nomi va muallif kamida 2 ta harfdan iborat bo'lsin.", "err"); return; }
  if (coverURL && !coverURL.startsWith("https://")) { msg("Muqova manzili https:// bilan boshlansin.", "err"); return; }
  const b = $("save"); b.disabled = true;
  try {
    await addDoc(collection(db, "books"), { title, author, description, coverURL, status: "active", createdAt: serverTimestamp(), createdBy: uid });
    $("f").reset(); msg("Kitob qo'shildi.", "ok"); await loadBooks();
  } catch (e) { msg("Saqlanmadi: " + (e.code === "permission-denied" ? "ruxsat yo'q" : (e.code || e.message)), "err"); }
  b.disabled = false;
});

onAuthStateChanged(auth, async (u) => {
  if (!u) { location.replace("login.html"); return; }
  uid = u.uid;
  try {
    const a = await getDoc(doc(db, "admins", u.uid));
    const d = a.exists() ? a.data() : null;
    const ok = d && (d.role === "main" || d.perms?.books === true);
    $("load").hidden = true;
    if (!ok) { $("denied").hidden = false; return; }
    $("who").textContent = d.role === "main" ? "Siz asosiy administratorsiz." : "Siz administratorsiz.";
    $("main").hidden = false;
    await loadBooks();
  } catch (e) { $("load").textContent = "Xatolik: " + (e.code || e.message); }
});
