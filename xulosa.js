import { app } from "./firebase-config.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, collection, query, where, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { taskCard, badge, fmt } from "./dates.js";

const auth = getAuth(app), db = getFirestore(app);
const root = document.getElementById("app");
const MIN = 100, MAX = 10000;
const LABEL = { pending: ["Tekshirilmoqda", "warn"], approved: ["Tasdiqlandi", "ok"], revision: ["Qayta ishlash kerak", "err"] };
let uid, me, tasks = [], subs = {};
document.getElementById("out").addEventListener("click", async () => { await signOut(auth); location.replace("login.html"); });

const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const subBadge = (s) => (s ? badge(...LABEL[s.status]) : badge("Yuborilmagan", "muted"));

function list() {
  root.replaceChildren(el("h1", "", "Xulosa yuborish"), el("p", "muted", "Topshiriqni tanlang va xulosangizni yozing."));
  const g = el("div", "books"); g.style.marginTop = "20px";
  if (!tasks.length) root.append(el("p", "empty", "Hozircha faol topshiriq yo'q."));
  tasks.forEach((a) => {
    const c = taskCard(a), s = subs[a.id];
    c.prepend(subBadge(s));
    const l = el("a", "btn sm", s ? "Ochish" : "Xulosa yozish"); l.href = "#" + a.id; l.style.marginTop = "6px";
    c.append(l); g.append(c);
  });
  root.append(g);
}

function form(id) {
  const a = tasks.find((t) => t.id === id);
  if (!a) { location.hash = ""; return; }
  const s = subs[id], now = new Date();
  const late = now > a.dueAt.toDate(), early = now < a.startAt.toDate();
  const editable = !late && !early && (!s || s.status === "revision");
  root.replaceChildren();
  const back = el("a", "btn ghost sm", "← Orqaga"); back.href = "#";
  root.append(back, el("h1", "", a.title), el("p", "by", a.bookTitle + " — " + a.bookAuthor), el("p", "muted", "Muddat: " + fmt(a.dueAt) + " (Toshkent vaqti)"));
  root.lastChild.style.marginBottom = "12px";
  root.append(subBadge(s));
  if (s?.comment) { const m = el("div", "msg " + (s.status === "approved" ? "ok" : "err"), "Administrator izohi: " + s.comment); root.append(m); }
  if (early) root.append(el("div", "msg info", "Topshiriq hali boshlanmagan."));
  if (late && !s) root.append(el("div", "msg err", "Muddat o'tgan. Muddat uzaytirilishi uchun administratorga murojaat qiling."));
  const msg = el("div", "msg"); msg.hidden = true;
  const f = el("form", "form"); f.style.maxWidth = "720px"; f.style.marginTop = "16px";
  const ta = el("textarea"); ta.style.minHeight = "260px"; ta.maxLength = MAX; ta.value = s?.text || ""; ta.readOnly = !editable;
  const cnt = el("p", "muted"); cnt.style.fontSize = ".85rem";
  const upd = () => { cnt.textContent = ta.value.trim().length + " / kamida " + MIN + " belgi"; };
  ta.addEventListener("input", upd); upd();
  const prev = el("div", "desc"); prev.style.cssText = "white-space:pre-wrap;display:block;margin-top:12px;padding:14px;border:1px dashed var(--gold);border-radius:10px"; prev.hidden = true;
  f.append(el("label", "", "Kitob bo'yicha xulosangiz"), ta, cnt, prev);
  if (editable) {
    const pb = el("button", "btn ghost", "Ko'rib chiqish"); pb.type = "button";
    pb.addEventListener("click", () => { prev.hidden = !prev.hidden; prev.textContent = ta.value; pb.textContent = prev.hidden ? "Ko'rib chiqish" : "Yopish"; });
    const sb = el("button", "btn", s ? "Qayta yuborish" : "Yuborish"); sb.type = "submit";
    f.append(pb, sb);
  }
  f.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const text = ta.value.trim();
    if (text.length < MIN) { show("Xulosa kamida " + MIN + " belgidan iborat bo'lsin.", "err"); return; }
    if (!confirm("Xulosani yuborasizmi? Tekshiruv paytida o'zgartirib bo'lmaydi.")) return;
    const b = f.querySelector("button[type=submit]"); b.disabled = true;
    try {
      if (s) await updateDoc(doc(db, "submissions", uid + "_" + id), { text, status: "pending", updatedAt: serverTimestamp() });
      else await setDoc(doc(db, "submissions", uid + "_" + id), { uid, assignmentId: id, assignmentTitle: a.title, bookId: a.bookId, bookTitle: a.bookTitle, userName: me.displayName || "", text, status: "pending", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await load(); location.hash = "";
    } catch (e) { show("Yuborilmadi: " + (e.code === "permission-denied" ? "ruxsat yo'q (xulosa allaqachon yuborilgan bo'lishi mumkin)" : (e.code || e.message)), "err"); b.disabled = false; }
  });
  function show(t, type) { msg.hidden = false; msg.className = "msg " + type; msg.textContent = t; }
  root.append(f, msg);
}

const route = () => { const id = location.hash.slice(1); id ? form(id) : list(); };
window.addEventListener("hashchange", route);

async function load() {
  const [t, s] = await Promise.all([
    getDocs(query(collection(db, "assignments"), where("status", "==", "active"))),
    getDocs(query(collection(db, "submissions"), where("uid", "==", uid)))
  ]);
  tasks = t.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.dueAt.seconds - b.dueAt.seconds);
  subs = {}; s.docs.forEach((d) => { subs[d.data().assignmentId] = d.data(); });
}

onAuthStateChanged(auth, async (u) => {
  if (!u) { location.replace("login.html"); return; }
  uid = u.uid;
  try {
    const p = await getDoc(doc(db, "users", uid));
    if (!p.exists() || !p.data().firstName) { location.replace("login.html"); return; }
    me = p.data(); await load(); route();
  } catch (e) { root.replaceChildren(el("div", "msg err", "Yuklab bo'lmadi: " + (e.code || e.message))); }
});
