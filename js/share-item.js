/* Per-item share card — 1080x1350 dark portrait of one collectible. */
async function shareItem(b) {
  const cv = document.getElementById("share-canvas");
  const ctx = cv.getContext("2d");
  const W = 1080, H = 1350;
  cv.width = W; cv.height = H;
  const d = DEX_BY_ID[b.dex];
  try {
    await document.fonts.load('400 100px "Fraunces"');
    await document.fonts.load('500 26px "Figtree"');
  } catch (e) {}
  const SERIF = '"Fraunces", Georgia, serif';
  const SANS = '"Figtree", sans-serif';

  ctx.fillStyle = "#050403"; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, 560, 40, W / 2, 560, 700);
  g.addColorStop(0, b.leg ? "rgba(246,216,137,0.22)" : "rgba(212,150,52,0.16)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(230,190,110,${Math.random() * 0.4 + 0.05})`;
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2 + 0.5, 0, 6.28);
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#C9A45C"; ctx.font = `500 30px ${SANS}`;
  ctx.fillText(d.name.toUpperCase().split("").join(" "), W / 2, 110);

  // Rasterize the item's SVG art
  const svg = itemArt(b, true).replace(/currentColor/g, "#C9A45C");
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  await new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const isStamp = d.art === "stamp";
      const w = isStamp ? 460 : 300, h = isStamp ? 460 : 720;
      ctx.drawImage(img, (W - w) / 2, isStamp ? 260 : 170, w, h);
      URL.revokeObjectURL(url); res();
    };
    img.onerror = () => { URL.revokeObjectURL(url); res(); };
    img.src = url;
  });

  const V = d.verb.toUpperCase();
  ctx.fillStyle = b.leg ? "#F6D889" : (b.tier === "r" ? "#C9A45C" : "#8B8070");
  ctx.font = `500 32px ${SANS}`;
  const tierTag = b.tier === "r" ? "  ·  RARE" : b.tier === "u" ? "  ·  UNCOMMON" : "";
  ctx.fillText(b.leg ? `◆  ONE OF ${d.legName.toUpperCase()}  ◆` : V + tierTag, W / 2, 990);

  ctx.fillStyle = "#EDE6D4"; ctx.font = `400 ${b.name.length > 24 ? 58 : 74}px ${SERIF}`;
  ctx.fillText(b.name, W / 2, 1080);

  ctx.fillStyle = "#8B8070"; ctx.font = `italic 400 34px ${SERIF}`;
  const when = state.metAt[b.id] ? new Date(state.metAt[b.id]) : null;
  const whenTxt = when ? ` · ${MONTHS[when.getMonth()]} ${when.getFullYear()}` : "";
  ctx.fillText(`${b.country}${whenTxt}`, W / 2, 1150);

  const r = state.ratings[b.id];
  if (r) { ctx.fillStyle = "#C9A45C"; ctx.font = `400 34px ${SERIF}`; ctx.fillText("★".repeat(r) + "☆".repeat(5 - r), W / 2, 1210); }

  ctx.fillStyle = "#5A5245"; ctx.font = `500 22px ${SANS}`;
  ctx.fillText("A L C O H O L D E X . N E T L I F Y . A P P", W / 2, 1300);

  await shareCanvasOut(cv, `${b.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.png`, `${V.toLowerCase()}: ${b.name}`);
  cv.width = 1080; cv.height = 1920;
}

// Shared output pipeline (native share sheet, PNG fallback)
async function shareCanvasOut(cv, filename, text) {
  const blob = await new Promise(res => cv.toBlob(res, "image/png"));
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text }); return; } catch (e) {}
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  URL.revokeObjectURL(a.href);
}
