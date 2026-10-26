import { app } from "./firebase-config.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { taskCard, startOf, endOf } from "./dates.js";

const auth = getAuth(app), db = getFirestore(app);
const $ = (id) => document.getElementById(id);
let uid = null, books = [];

function msg(t, type) { const m = $("msg"); m.hidden = !t; m.textContent = t || ""; m.className = "msg " + (type || "info"); }
$("out").addEventListener("click", async () => { await signOut(auth); location.replace("login.html"); });

async function loadAll() {
  const bs = await getDocs(query(collection(db, "books"), where("status", "==", "active")));
  books = bs.docs.map((d) => ({ id: d.id, ...d.data() }));
  const sel = $("b"); sel.replaceChildren();
  books.forEach((b) => { const o = document.createElement("option"); o.value = b.id; o.textContent = b.title + " — " + b.author; sel.append(o); });
  const as = await getDocs(collection(db, "assignments"));
  const list = as.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.dueAt.seconds - a.dueAt.seconds);
  const box = $("list"); box.replaceChildren();
  $("empty").hidden = list.length > 0;
  list.forEach((a) => {
    const c = taskCard(a);
    const closed = a.status === "closed";
    const btn = document.createElement("button");
    btn.className = "btn ghost sm"; btn.type = "button"; btn.textContent = closed ? "Qayta ochish" : "Yopish";
    btn.addEventListener("click", async () => {
      if (!confirm(closed ? "Topshiriq talabalarga yana ko'rinadi. Davom etasizmi?" : "Topshiriq talabalardan yashiriladi. Davom etasizmi?")) return;
      btn.disabled = true;
      try { await updateDoc(doc(db, "assignments", a.id), { status: closed ? "active" : "closed" }); await loadAll(); }
      catch (e) { msg("Bajarilmadi: " + (e.code || e.message), "err"); btn.disabled = false; }
    });
    c.append(btn); box.append(c);
  });
}

$("f").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const book = books.find((b) => b.id === $("b").value);
  const title = $("t").value.trim(), s = $("s").value, e = $("e").value, points = Number($("p").value);
  if (!book) { msg("Avval kitob qo'shing (Kitoblar bo'limida).", "err"); return; }
  if (title.length < 2) { msg("Topshiriq nomi kamida 2 ta harf bo'lsin.", "err"); return; }
  if (e < s) { msg("Tugash sanasi boshlanishdan oldin bo'lmasin.", "err"); return; }
  if (!Number.isInteger(points) || points < 1 || points > 1000) { msg("Ball 1 dan 1000 gacha butun son bo'lsin.", "err"); return; }
  const b = $("save"); b.disabled = true;
  try {
    await addDoc(collection(db, "assignments"), {
      bookId: book.id, bookTitle: book.title, bookAuthor: book.author, title, description: $("d").value.trim(),
      startAt: Timestamp.fromDate(startOf(s)), dueAt: Timestamp.fromDate(endOf(e)), points,
      status: "active", createdAt: serverTimestamp(), createdBy: uid
    });
    $("f").reset(); $("p").value = 10; msg("Topshiriq yaratildi.", "ok"); await loadAll();
  } catch (er) { msg("Saqlanmadi: " + (er.code === "permission-denied" ? "ruxsat yo'q" : (er.code || er.message)), "err"); }
  b.disabled = false;
});

onAuthStateChanged(auth, async (u) => {
  if (!u) { location.replace("login.html"); return; }
  uid = u.uid;
  try {
    const a = await getDoc(doc(db, "admins", u.uid));
    const d = a.exists() ? a.data() : null;
    $("load").hidden = true;
    if (!d || !(d.role === "main" || d.perms?.assignments === true)) { $("denied").hidden = false; return; }
    $("main").hidden = false;
    await loadAll();
  } catch (e) { $("load").hidden = false; $("load").textContent = "Xatolik: " + (e.code || e.message); }
});
