/* =========================================================
   The shareable passport — draws a 1080×1920 story card
   (black room, gold dust, big serif count) and shares it
   via the native share sheet, or downloads a PNG.
   ========================================================= */

async function sharePassport(stats) {
  const cv = document.getElementById("share-canvas");
  const ctx = cv.getContext("2d");
  const W = 1080, H = 1920;

  try { await document.fonts.load('400 100px "Fraunces"'); await document.fonts.load('italic 400 52px "Fraunces"'); } catch (e) {}
  const SERIF = '"Fraunces", Georgia, serif';
  const SANS = '"Figtree", sans-serif';

  // The room
  ctx.fillStyle = "#050403";
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W * 0.6, H * 0.42, 40, W * 0.6, H * 0.42, W * 0.85);
  g.addColorStop(0, "rgba(212,150,52,0.20)");
  g.addColorStop(0.5, "rgba(140,85,25,0.07)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Gold dust
  for (let i = 0; i < 90; i++) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(230,190,110,${Math.random() * 0.5 + 0.06})`;
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2.4 + 0.6, 0, 6.28);
    ctx.fill();
  }
  // Vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.8)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);

  // Wordmark
  ctx.fillStyle = "#EDE6D4";
  ctx.font = `400 34px ${SERIF}`;
  ctx.textAlign = "center";
  ctx.fillText("A L C O H O L D E X", W / 2, 170);

  ctx.fillStyle = "#8A7452";
  ctx.font = `500 24px ${SANS}`;
  ctx.fillText("T H E   P A S S P O R T", W / 2, 240);

  // Hairline
  ctx.strokeStyle = "rgba(237,230,214,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(140, 300); ctx.lineTo(W - 140, 300); ctx.stroke();

  // The count
  ctx.fillStyle = "#EDE6D4";
  ctx.font = `400 300px ${SERIF}`;
  ctx.fillText(String(stats.total), W / 2, 730);
  ctx.fillStyle = "#3A362C";
  ctx.font = `400 90px ${SERIF}`;
  ctx.fillText(`of ${stats.catalogTotal}`, W / 2, 840);
  ctx.fillStyle = "#C9A45C";
  ctx.font = `italic 400 58px ${SERIF}`;
  ctx.fillText("bottles met", W / 2, 940);

  // Stats row
  const rowY = 1130;
  const cols = [
    [String(stats.countries), "COUNTRIES"],
    [`${stats.legendaries}/${stats.legTotal}`, "THE TWENTY"],
    [`${Math.round((stats.total / stats.catalogTotal) * 100)}%`, "COMPLETE"]
  ];
  cols.forEach((c, i) => {
    const x = W / 2 + (i - 1) * 300;
    ctx.fillStyle = i === 1 ? "#F6D889" : "#EDE6D4";
    ctx.font = `400 64px ${SERIF}`;
    ctx.fillText(c[0], x, rowY);
    ctx.fillStyle = "#7A7261";
    ctx.font = `500 20px ${SANS}`;
    ctx.fillText(c[1], x, rowY + 52);
  });

  // The Twenty gems
  ctx.font = `400 40px ${SERIF}`;
  const gemsPerRow = 10, gw = 62;
  for (let i = 0; i < stats.legTotal; i++) {
    const r = Math.floor(i / gemsPerRow), c = i % gemsPerRow;
    const x = W / 2 + (c - (gemsPerRow - 1) / 2) * gw;
    const y = 1330 + r * 70;
    const lit = i < stats.legendaries;
    ctx.fillStyle = lit ? "#F6D889" : "#2E2A20";
    ctx.fillText(lit ? "◆" : "◇", x, y);
  }

  // Signature line
  ctx.strokeStyle = "rgba(237,230,214,0.15)";
  ctx.beginPath(); ctx.moveTo(140, 1540); ctx.lineTo(W - 140, 1540); ctx.stroke();
  ctx.fillStyle = "#8A8272";
  ctx.font = `italic 400 40px ${SERIF}`;
  ctx.fillText("The room remembers every one.", W / 2, 1630);
  ctx.fillStyle = "#C9A45C";
  ctx.font = `500 26px ${SANS}`;
  ctx.fillText("A L C O H O L D E X . N E T L I F Y . A P P", W / 2, 1760);

  // Share or download
  cv.toBlob(async blob => {
    if (!blob) return;
    const file = new File([blob], "alcoholdex-passport.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "My AlcoholDex Passport" });
        return;
      } catch (e) { /* user cancelled — fall through to download */ }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "alcoholdex-passport.png";
    a.click();
    URL.revokeObjectURL(a.href);
  }, "image/png");
}
