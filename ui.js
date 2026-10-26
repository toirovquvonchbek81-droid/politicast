// Kitob kartochkasi (talaba kutubxonasi va admin ro'yxati uchun umumiy)
export function bookCard(b) {
  const c = document.createElement("article");
  c.className = "book";
  const cv = document.createElement("div");
  cv.className = "cover";
  const letter = (b.title || "?").slice(0, 1);
  if (typeof b.coverURL === "string" && b.coverURL.startsWith("https://")) {
    const i = document.createElement("img");
    i.src = b.coverURL; i.alt = ""; i.loading = "lazy";
    i.onerror = () => { i.remove(); cv.textContent = letter; };
    cv.append(i);
  } else { cv.textContent = letter; }
  const t = document.createElement("h3"); t.textContent = b.title || "";
  const a = document.createElement("p"); a.className = "by"; a.textContent = b.author || "";
  const d = document.createElement("p"); d.className = "desc"; d.textContent = b.description || "";
  c.append(cv, t, a, d);
  return c;
}
