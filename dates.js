// Sanalar Toshkent vaqti (UTC+5) bo'yicha ko'rsatiladi va saqlanadi
const f = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", year: "numeric" });
export const fmt = (ts) => (ts ? f.format(ts.toDate()) : "");
export const startOf = (s) => new Date(s + "T00:00:00+05:00");
export const endOf = (s) => new Date(s + "T23:59:59+05:00");
export function state(a, now = new Date()) {
  if (a.status === "closed") return ["Yopilgan", "muted"];
  if (now < a.startAt.toDate()) return ["Hali boshlanmagan", "muted"];
  if (now > a.dueAt.toDate()) return ["Muddati o'tgan", "err"];
  return ["Faol", "ok"];
}
export function badge(text, kind) {
  const b = document.createElement("span");
  b.className = "badge";
  const c = { ok: "var(--ok)", err: "var(--err)", muted: "var(--muted)" }[kind] || "var(--warn)";
  b.style.color = c; b.style.borderColor = c; b.textContent = text;
  return b;
}
export function taskCard(a) {
  const c = document.createElement("article");
  c.className = "book";
  const [txt, kind] = state(a);
  const t = document.createElement("h3"); t.textContent = a.title;
  const bk = document.createElement("p"); bk.className = "by"; bk.textContent = a.bookTitle + " — " + a.bookAuthor;
  const d = document.createElement("p"); d.className = "desc"; d.style.webkitLineClamp = "unset"; d.textContent = a.description || "";
  const dt = document.createElement("p"); dt.className = "muted"; dt.style.fontSize = ".88rem";
  dt.textContent = fmt(a.startAt) + " — " + fmt(a.dueAt) + " · " + a.points + " ball";
  c.append(badge(txt, kind), t, bk, d, dt);
  return c;
}
