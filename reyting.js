import { app } from "./firebase-config.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const auth = getAuth(app), db = getFirestore(app);
const $ = (id) => document.getElementById(id);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
let uid, all = [];
$("out").addEventListener("click", async () => { await signOut(auth); location.replace("login.html"); });

const ymName = (k) => { const [y, m] = k.split("-"); return MONTHS[Number(m) - 1] + " " + y; };
const score = (x, per) => (per === "all" ? x.points || 0 : (x.monthly || {})[per] || 0);

function fillPeriods() {
  const set = new Set();
  all.forEach((x) => Object.keys(x.monthly || {}).forEach((k) => set.add(k)));
  const keys = [...set].sort().reverse();
  const sel = $("per"); sel.replaceChildren();
  const add = (v, t) => { const o = el("option", "", t); o.value = v; sel.append(o); };
  add("all", "Umumiy reyting");
  keys.forEach((k) => add(k, "Oylik: " + ymName(k)));
}

function render() {
  const per = $("per").value, q = $("q").value.trim().toLowerCase();
  const ranked = all.map((x) => ({ ...x, s: score(x, per) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  let last = null, rank = 0;
  ranked.forEach((x, i) => { if (x.s !== last) { rank = i + 1; last = x.s; } x.rank = rank; });
  const me = ranked.find((x) => x.uid === uid);
  $("mine").hidden = !me;
  if (me) $("mine").textContent = "Sizning o'rningiz: " + me.rank + " · " + me.s + " ball";
  const shown = ranked.filter((x) => !q || (x.name || "").toLowerCase().includes(q));
  const box = $("rows"); box.replaceChildren();
  $("empty").hidden = shown.length > 0;
  shown.forEach((x) => {
    const r = el("div", "r" + (x.uid === uid ? " me" : ""));
    const n = el("div"); n.append(el("div", "nm", x.name || "Talaba"), el("div", "sub", "Tasdiqlangan xulosalar: " + (x.approved || 0)));
    const p = el("div", "pt", String(x.s)); p.append(el("small", "", "ball"));
    r.append(el("div", "pos", String(x.rank)), n, p); box.append(r);
  });
}

onAuthStateChanged(auth, async (u) => {
  if (!u) { location.replace("login.html"); return; }
  uid = u.uid;
  try {
    const p = await getDoc(doc(db, "users", uid));
    if (!p.exists() || !p.data().firstName) { location.replace("login.html"); return; }
    const s = await getDocs(query(collection(db, "leaderboard"), orderBy("points", "desc"), limit(500)));
    all = s.docs.map((d) => d.data());
    $("load").hidden = true; $("main").hidden = false;
    fillPeriods(); render();
    $("per").addEventListener("change", render);
    $("q").addEventListener("input", render);
  } catch (e) {
    $("load").hidden = true; $("main").hidden = false;
    $("msg").hidden = false; $("msg").textContent = "Reytingni yuklab bo'lmadi: " + (e.code || e.message);
  }
});
