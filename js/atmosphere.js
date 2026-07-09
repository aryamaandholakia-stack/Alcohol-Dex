/* =========================================================
   The living room — candlelight, gold dust, smoke.
   Runs on a fixed full-screen canvas behind everything.
   Tune AMBIENCE below to adjust the room.
   ========================================================= */

const AMBIENCE = {
  dust: 55,          // particles of gold dust
  smoke: 3,          // wisps of smoke
  glowX: 0.62,       // candle position (fraction of width)
  glowY: 0.5,
  glowStrength: 0.16 // 0–1: how bright the candle burns
};

(function room() {
  const cv = document.getElementById("atmosphere");
  if (!cv) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = cv.getContext("2d");

  function size() { cv.width = innerWidth; cv.height = innerHeight; }
  size();
  addEventListener("resize", size);

  const dust = Array.from({ length: AMBIENCE.dust }, () => ({
    x: Math.random(), y: Math.random(),
    s: Math.random() * 1.5 + 0.4,
    vx: (Math.random() - 0.5) * 0.05,
    vy: -Math.random() * 0.045 - 0.008,
    a: Math.random() * 0.4 + 0.08,
    ph: Math.random() * Math.PI * 2
  }));
  const wisps = Array.from({ length: AMBIENCE.smoke }, (_, i) => ({
    x: 0.18 + i * 0.3 + Math.random() * 0.1,
    ph: Math.random() * Math.PI * 2
  }));

  let t = 0;
  function draw() {
    t += 0.016;
    const w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);

    // Candlelight — layered sines make an organic flicker
    const fl = 0.85 + Math.sin(t * 2.1) * 0.06 + Math.sin(t * 5.7) * 0.05 + Math.sin(t * 11.3) * 0.04;
    const gx = w * AMBIENCE.glowX, gy = h * AMBIENCE.glowY;
    const g = ctx.createRadialGradient(gx, gy, 10, gx, gy, w * 0.55);
    g.addColorStop(0, `rgba(212,150,52,${AMBIENCE.glowStrength * fl})`);
    g.addColorStop(0.45, `rgba(140,85,25,${AMBIENCE.glowStrength * 0.45 * fl})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    if (reduced) return; // still room: glow only, no motion

    // Smoke
    ctx.save();
    for (const s of wisps) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(200,170,120,0.045)";
      ctx.lineWidth = 16;
      const bx = s.x * w;
      ctx.moveTo(bx, h);
      for (let y = h; y > -30; y -= 14) {
        const x = bx + Math.sin(y * 0.011 + t * 0.45 + s.ph) * 30 * (1 - y / h + 0.3);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Gold dust
    for (const p of dust) {
      p.x += p.vx / 100; p.y += p.vy / 60;
      if (p.y < -0.02 || p.x < -0.02 || p.x > 1.02) { p.y = 1.05; p.x = Math.random(); }
      const tw = p.a * (0.6 + 0.4 * Math.sin(t * 1.4 + p.ph));
      ctx.beginPath();
      ctx.fillStyle = `rgba(230,190,110,${tw})`;
      ctx.arc(p.x * w, p.y * h, p.s, 0, 6.28);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  if (reduced) { draw(); } else { requestAnimationFrame(draw); }
})();

/* Reveal-on-scroll: .rise elements light up as they enter view */
(function riser() {
  const io = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add("lit"), (i % 4) * 160);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  function arm() { document.querySelectorAll(".rise:not(.lit)").forEach(el => io.observe(el)); }
  document.addEventListener("DOMContentLoaded", arm);
  window.armRise = arm; // app.js re-arms when switching views
})();
