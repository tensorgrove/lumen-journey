"use client";

/** Golden sparks bursting up from an element. */
export function sparkBurst(el: Element | null, n = 22) {
  if (!el) return;
  let box = document.getElementById("sparks");
  if (!box) {
    box = document.createElement("div");
    box.id = "sparks";
    box.className = "sparks";
    document.body.appendChild(box);
  }
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height * 0.3;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("div");
    s.className = "spk";
    box.appendChild(s);
    const a = ((-90 + (Math.random() - 0.5) * 150) * Math.PI) / 180;
    const d = 60 + Math.random() * 150;
    const sz = 5 + Math.random() * 8;
    s.style.width = s.style.height = sz + "px";
    s.style.left = cx + "px";
    s.style.top = cy + "px";
    s.animate(
      [
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        { transform: `translate(${Math.cos(a) * d - sz / 2}px,${Math.sin(a) * d - 40}px) scale(.3)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 600, easing: "cubic-bezier(.2,.7,.3,1)" },
    ).onfinish = () => s.remove();
  }
}

/** Shake the lantern, flash and spark. */
export function pop(wrap: HTMLElement | null, flash: HTMLElement | null) {
  if (wrap) {
    wrap.classList.remove("shake");
    void wrap.offsetWidth;
    wrap.classList.add("shake");
  }
  if (flash) {
    flash.classList.remove("go");
    void flash.offsetWidth;
    flash.classList.add("go");
  }
  setTimeout(() => sparkBurst(wrap), 180);
}
