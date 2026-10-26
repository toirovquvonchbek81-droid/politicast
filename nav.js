// Yagona menyu: firebase-config.js orqali barcha sahifaga ulanadi.
import { getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const STU = [["Kabinet", "app.html"], ["Topshiriqlar", "tasks.html"], ["Xulosa", "xulosa.html"], ["Reyting", "reyting.html"], ["Profil", "profil.html"]];
const ADM = [["Kitoblar", "admin.html"], ["Topshiriqlar", "admin-tasks.html"], ["Tekshirish", "admin-review.html"]];
const PUB = [["Bosh sahifa", "index.html"], ["Kirish", "login.html"]];
const here = location.pathname.split("/").pop() || "index.html";

const css = `header.nav{display:none!important}
.pcnav{position:sticky;top:0;z-index:50;background:rgba(6,17,38,.95);backdrop-filter:blur(10px);border-bottom:1px solid rgba(214,173,85,.25);padding-top:env(safe-area-inset-top,0px)}
.pcw{width:min(1180px,100% - 24px);margin-inline:auto;display:flex;align-items:center;justify-content:space-between;min-height:60px;gap:12px;position:relative}
.pcb{font:700 1.4rem Georgia,serif;color:#F5F7FB;text-decoration:none}.pcb b{color:#D6AD55}
.pcm{display:none;width:46px;height:46px;border-radius:12px;border:1px solid #D6AD55;background:transparent;color:#D6AD55;font-size:1.4rem;cursor:pointer}
.pcl{display:flex;align-items:center;gap:4px;flex-wrap:wrap;justify-content:flex-end}
.pcl a,.pcl button{min-height:40px;display:inline-flex;align-items:center;padding:0 12px;border-radius:10px;color:#AAB5C8;text-decoration:none;font:500 .95rem system-ui,sans-serif;background:none;border:0;cursor:pointer}
.pcl a:hover,.pcl button:hover{color:#F5F7FB}
.pcl a.on{color:#D6AD55;background:rgba(214,173,85,.12)}
.pcl .sep{color:#D6AD55;font:600 .7rem system-ui,sans-serif;letter-spacing:.15em;padding:0 6px 0 10px}
@media(max-width:1000px){.pcm{display:block}.pcl{display:none;position:absolute;top:62px;left:0;right:0;flex-direction:column;align-items:stretch;background:#0B1730;border:1px solid rgba(214,173,85,.25);border-radius:14px;padding:8px;box-shadow:0 18px 40px rgba(0,0,0,.5)}.pcl.open{display:flex}.pcl a,.pcl button{min-height:48px;font-size:1rem}.pcl .sep{padding:10px 12px 4px}}`;

function build() {
  const st = document.createElement("style"); st.textContent = css; document.head.append(st);
  const h = document.createElement("header"); h.className = "pcnav";
  const w = document.createElement("div"); w.className = "pcw";
  const brand = document.createElement("a"); brand.className = "pcb"; brand.href = "index.html";
  brand.append("Politi"); const b = document.createElement("b"); b.textContent = "Cast"; brand.append(b);
  const m = document.createElement("button"); m.className = "pcm"; m.type = "button"; m.textContent = "☰";
  m.setAttribute("aria-label", "Menyu"); m.setAttribute("aria-expanded", "false");
  const nav = document.createElement("nav"); nav.className = "pcl";
  m.addEventListener("click", () => { const o = nav.classList.toggle("open"); m.setAttribute("aria-expanded", String(o)); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { nav.classList.remove("open"); m.setAttribute("aria-expanded", "false"); } });
  w.append(brand, m, nav); h.append(w); document.body.prepend(h);

  const link = ([t, u]) => { const a = document.createElement("a"); a.href = u; a.textContent = t; if (u === here) a.className = "on"; return a; };
  const fill = (items, admin, out) => {
    nav.replaceChildren(...items.map(link));
    if (admin) { const s = document.createElement("span"); s.className = "sep"; s.textContent = "ADMIN"; nav.append(s, ...ADM.map(link)); }
    if (out) { const x = document.createElement("button"); x.type = "button"; x.textContent = "Chiqish"; x.addEventListener("click", async () => { await signOut(getAuth(getApp())); location.replace("login.html"); }); nav.append(x); }
  };
  fill(PUB, false, false);
  const auth = getAuth(getApp());
  onAuthStateChanged(auth, async (u) => {
    if (!u) { brand.href = "index.html"; fill(PUB, false, false); return; }
    brand.href = "app.html";
    fill(STU, false, true);
    try { const a = await getDoc(doc(getFirestore(getApp()), "admins", u.uid)); if (a.exists()) fill(STU, true, true); } catch (e) { /* admin emas */ }
  });
}
if (document.body) build(); else document.addEventListener("DOMContentLoaded", build);
