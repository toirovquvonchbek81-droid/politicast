import { app } from "./firebase-config.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, collection, query, where, updateDoc, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { badge, fmt } from "./dates.js";

const auth = getAuth(app), db = getFirestore(app);
const $ = (id) => document.getElementById(id);
const TABS = [["pending", "Tekshirilmoqda"], ["revision", "Qaytarilgan"], ["approved", "Tasdiqlangan"]];
let uid, tab = "pending";
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
function msg(t, type) { const m = $("msg"); m.hidden = !t; m.textContent = t || ""; m.className = "msg " + (type || "info"); }
$("out").addEventListener("click", async () => { await signOut(auth); location.replace("login.html"); });

function drawTabs() {
  $("tabs").replaceChildren();
  TABS.forEach(([k, n]) => {
    const b = el("button", "btn sm" + (k === tab ? "" : " ghost"), n); b.type = "button";
    b.addEventListener("click", () => { tab = k; msg(""); drawTabs(); render(); });
    $("tabs").append(b);
  });
}

async function approve(id, comment) {
  await runTransaction(db, async (tx) => {
    const sRef = doc(db, "submissions", id), s = await tx.get(sRef);
    if (!s.exists()) throw new Error("Xulosa topilmadi.");
    const sd = s.data();
    if (sd.status === "approved") throw new Error("Bu xulosa allaqachon tasdiqlangan.");
    const a = await tx.get(doc(db, "assignments", sd.assignmentId));
    const pts = a.data().points;
    const lRef = doc(db, "leaderboard", sd.uid), l = await tx.get(lRef);
    const ld = l.exists() ? l.data() : { points: 0, approved: 0, monthly: {} };
    const ym = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tashkent" }).slice(0, 7);
    tx.update(sRef, { status: "approved", comment, points: pts, reviewedBy: uid, reviewedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    tx.set(doc(db, "pointsLog", "sub_" + id), { uid: sd.uid, submissionId: id, points: pts, reason: "Xulosa tasdiqlandi: " + sd.assignmentTitle, by: uid, createdAt: serverTimestamp() });
    tx.set(lRef, { uid: sd.uid, name: sd.userName || "", points: (ld.points || 0) + pts, approved: (ld.approved || 0) + 1, monthly: { ...(ld.monthly || {}), [ym]: ((ld.monthly || {})[ym] || 0) + pts }, updatedAt: serverTimestamp() });
  });
}

async function render() {
  const box = $("list"); box.replaceChildren(); $("empty").hidden = true;
  const s = await getDocs(query(collection(db, "submissions"), where("status", "==", tab)));
  const items = s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.updatedAt?.seconds || 0) - (b.updatedAt?.seconds || 0));
  $("empty").hidden = items.length > 0;
  items.forEach((x) => {
    const c = el("article", "book");
    c.append(badge(TABS.find((t) => t[0] === tab)[1], tab === "approved" ? "ok" : tab === "revision" ? "err" : "warn"), el("h3", "", x.userName || "Talaba"), el("p", "by", x.assignmentTitle + " · " + x.bookTitle));
    const t = el("div", "desc", x.text); t.style.cssText = "white-space:pre-wrap;display:block;color:var(--text);overflow:visible;max-height:none";
    c.append(t);
    if (tab === "approved") { c.append(el("p", "muted", "Berilgan ball: " + (x.points ?? "") + (x.comment ? " · Izoh: " + x.comment : ""))); box.append(c); return; }
    if (tab === "revision") c.append(el("p", "muted", "Oldingi izoh: " + (x.comment || "")));
    const ta = el("textarea"); ta.placeholder = "Izoh (qaytarishda majburiy)"; ta.maxLength = 1000; ta.style.minHeight = "70px";
    const row = el("div", "row");
    const ok = el("button", "btn sm", "Tasdiqlash"), no = el("button", "btn ghost sm", "Qaytarish");
    ok.type = no.type = "button";
    ok.addEventListener("click", async () => {
      if (!confirm("Xulosa tasdiqlanadi va talabaga ball qo'shiladi. Davom etasizmi?")) return;
      ok.disabled = no.disabled = true;
      try { await approve(x.id, ta.value.trim()); msg("Tasdiqlandi, ball qo'shildi.", "ok"); await render(); }
      catch (e) { msg("Bajarilmadi: " + (e.code || e.message), "err"); ok.disabled = no.disabled = false; }
    });
    no.addEventListener("click", async () => {
      const cm = ta.value.trim();
      if (cm.length < 3) { msg("Qaytarish uchun izoh yozing.", "err"); return; }
      if (!confirm("Xulosa izoh bilan talabaga qaytariladi. Davom etasizmi?")) return;
      ok.disabled = no.disabled = true;
      try { await updateDoc(doc(db, "submissions", x.id), { status: "revision", comment: cm, reviewedBy: uid, reviewedAt: serverTimestamp(), updatedAt: serverTimestamp() }); msg("Qaytarildi.", "ok"); await render(); }
      catch (e) { msg("Bajarilmadi: " + (e.code || e.message), "err"); ok.disabled = no.disabled = false; }
    });
    row.append(ok, no); c.append(ta, row); box.append(c);
  });
}

onAuthStateChanged(auth, async (u) => {
  if (!u) { location.replace("login.html"); return; }
  uid = u.uid;
  try {
    const a = await getDoc(doc(db, "admins", uid)), d = a.exists() ? a.data() : null;
    $("load").hidden = true;
    if (!d || !(d.role === "main" || d.perms?.review === true)) { $("denied").hidden = false; return; }
    $("main").hidden = false; drawTabs(); await render();
  } catch (e) { $("load").hidden = false; $("load").textContent = "Xatolik: " + (e.code || e.message); }
});
