/* =========================================================
   The shareable passport v3 — 1080×1920 story card.
   Now carries: handle, member-since, the count, stats,
   taste profile line, top shelf bar, prize find, honors,
   The Twenty gems. Native share sheet or PNG download.
   extra = { handle, memberSince, taste, prize, honorsEarned, honorsTotal }
   ========================================================= */

async function sharePassport(stats, extra = {}) {
  const cv = document.getElementById("share-canvas");
  const ctx = cv.getContext("2d");
  const W = 1080, H = 1920;

  try {
    await document.fonts.load('400 100px "Fraunces"');
    await document.fonts.load('italic 400 52px "Fraunces"');
    await document.fonts.load('500 26px "Figtree"');
  } catch (e) {}
  const SERIF = '"Fraunces", Georgia, serif';
  const SANS = '"Figtree", sans-serif';

  // The room
  ctx.fillStyle = "#050403";
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W * 0.6, H * 0.4, 40, W * 0.6, H * 0.4, W * 0.85);
  g.addColorStop(0, "rgba(212,150,52,0.20)");
  g.addColorStop(0.5, "rgba(140,85,25,0.07)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(230,190,110,${Math.random() * 0.5 + 0.06})`;
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2.4 + 0.6, 0, 6.28);
    ctx.fill();
  }
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.8)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);

  const hairline = y => {
    ctx.strokeStyle = "rgba(237,230,214,0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(120, y); ctx.lineTo(W - 120, y); ctx.stroke();
  };
  ctx.textAlign = "center";

  // Identity
  ctx.fillStyle = "#EDE6D4";
  ctx.font = `400 32px ${SERIF}`;
  ctx.fillText(extra.title || "T H E   P O K \u00c9 D E X", W / 2, 130);
  ctx.fillStyle = "#8A7452";
  ctx.font = `500 22px ${SANS}`;
  ctx.fillText(extra.subtitle || "T H E   P A S S P O R T", W / 2, 188);

  if (extra.handle) {
    ctx.fillStyle = "#C9A45C";
    ctx.font = `italic 400 54px ${SERIF}`;
    ctx.fillText(extra.handle, W / 2, 292);
    ctx.fillStyle = "#7A7261";
    ctx.font = `500 21px ${SANS}`;
    ctx.fillText(extra.sinceLine ? extra.sinceLine.toUpperCase() : (extra.memberSince ? `IN THE ROOM SINCE ${extra.memberSince.toUpperCase()}` : ""), W / 2, 338);
  }
  hairline(388);

  // The count
  ctx.fillStyle = "#EDE6D4";
  ctx.font = `400 260px ${SERIF}`;
  ctx.fillText(String(stats.total), W / 2, 700);
  ctx.fillStyle = "#3A362C";
  ctx.font = `400 74px ${SERIF}`;
  ctx.fillText(`of ${stats.catalogTotal}`, W / 2, 792);
  ctx.fillStyle = "#C9A45C";
  ctx.font = `italic 400 50px ${SERIF}`;
  ctx.fillText("collected", W / 2, 872);

  // Stats row
  const rowY = 1020;
  [[String(stats.countries), "COUNTRIES"],
   [`${stats.legendaries}/${stats.legTotal}`, (extra.legLabel || "LEGENDARIES")],
   [`${extra.honorsEarned ?? 0}/${extra.honorsTotal ?? 14}`, "HONORS"],
   [`${Math.round((stats.total / stats.catalogTotal) * 100)}%`, "COMPLETE"]
  ].forEach((c, i) => {
    const x = W / 2 + (i - 1.5) * 235;
    ctx.fillStyle = i === 1 ? "#F6D889" : "#EDE6D4";
    ctx.font = `400 56px ${SERIF}`;
    ctx.fillText(c[0], x, rowY);
    ctx.fillStyle = "#7A7261";
    ctx.font = `500 18px ${SANS}`;
    ctx.fillText(c[1], x, rowY + 46);
  });
  hairline(1122);

  // Taste profile
  let y = 1210;
  if (extra.taste) {
    ctx.fillStyle = "#8A7452";
    ctx.font = `500 20px ${SANS}`;
    ctx.fillText("T H E   P A L A T E", W / 2, y - 46);
    ctx.fillStyle = "#D8CBA8";
    ctx.font = `italic 400 40px ${SERIF}`;
    ctx.fillText(extra.taste.topTags.join("  ·  "), W / 2, y + 8);
    ctx.fillStyle = "#8A8272";
    ctx.font = `400 28px ${SERIF}`;
    ctx.fillText(`Home shelf: ${extra.taste.homeCat} (${extra.taste.homeN})  ·  favors ${extra.taste.strength}`, W / 2, y + 62);
    y += 130;
  }

  // Prize find
  if (extra.prize) {
    ctx.fillStyle = "#8A7452";
    ctx.font = `500 20px ${SANS}`;
    ctx.fillText(extra.prize.label.toUpperCase(), W / 2, y);
    ctx.fillStyle = "#F6D889";
    ctx.font = `400 44px ${SERIF}`;
    ctx.fillText((extra.prize.leg ? "◆ " : "") + extra.prize.name, W / 2, y + 58);
    y += 130;
  }

  // Legendary gems — scales to any count (currently 55 across 7 dexes)
  const perRow = stats.legTotal > 24 ? 14 : 10;
  const gw = stats.legTotal > 24 ? 46 : 58;
  const rowH = stats.legTotal > 24 ? 50 : 62;
  ctx.font = `400 ${stats.legTotal > 24 ? 28 : 36}px ${SERIF}`;
  for (let i = 0; i < stats.legTotal; i++) {
    const r = Math.floor(i / perRow), c = i % perRow;
    const x = W / 2 + (c - (perRow - 1) / 2) * gw;
    const lit = i < stats.legendaries;
    ctx.fillStyle = lit ? "#F6D889" : "#2E2A20";
    ctx.fillText(lit ? "◆" : "◇", x, y + 20 + r * rowH);
  }
  y += 20 + Math.ceil(stats.legTotal / perRow) * rowH;

  // Sign-off
  hairline(Math.min(y + 30, 1710));
  ctx.fillStyle = "#8A8272";
  ctx.font = `italic 400 36px ${SERIF}`;
  ctx.fillText('"The room remembers every one."', W / 2, 1790);
  ctx.fillStyle = "#C9A45C";
  ctx.font = `500 24px ${SANS}`;
  ctx.fillText("A L C O H O L D E X . N E T L I F Y . A P P", W / 2, 1856);

  cv.toBlob(async blob => {
    if (!blob) return;
    const file = new File([blob], "alcoholdex-passport.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "My AlcoholDex Passport" }); return; }
      catch (e) { /* cancelled — fall through */ }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "alcoholdex-passport.png";
    a.click();
    URL.revokeObjectURL(a.href);
  }, "image/png");
}
