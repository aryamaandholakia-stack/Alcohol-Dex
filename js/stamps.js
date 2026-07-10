/* =========================================================
   Stamp art — non-alcohol dexes render as passport stamps.
   Locked: dark embossed blank. Revealed: inked in the dex
   accent with the item's monogram. Legendary: gold seal.
   Shapes rotate by category hash so shelves feel varied.
   ========================================================= */

const STAMP_SHAPES = ["circle", "octagon", "shield", "square"];
function stampShapePath(kind) {
  if (kind === "octagon") return "M35 6 L85 6 L114 35 L114 85 L85 114 L35 114 L6 85 L6 35 Z";
  if (kind === "shield")  return "M60 6 L112 22 L112 66 C112 92 90 108 60 116 C30 108 8 92 8 66 L8 22 Z";
  if (kind === "square")  return "M12 12 H108 V108 H12 Z";
  return "M60 6 A54 54 0 1 1 59.9 6 Z";
}
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

function monogram(name) {
  const words = name.replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter(w => w.length > 1);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function stampSVG(item, found, pouring = false) {
  const dex = DEX_BY_ID[item.dex] || DEXES[0];
  const shape = STAMP_SHAPES[hashStr(item.cat || item.id) % STAMP_SHAPES.length];
  const p = stampShapePath(shape);
  const ink = item.leg ? "#F6D889" : dex.accent;
  const uid = "st" + item.id;
  if (!found) {
    return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="${p}" fill="#0B0906" stroke="#1A1610" stroke-width="2"/>
      <path d="${p}" fill="none" stroke="#241E14" stroke-width="1" stroke-dasharray="3 4" transform="translate(60 60) scale(0.82) translate(-60 -60)"/>
      <text x="60" y="67" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="#241E14">— —</text>
    </svg>`;
  }
  const cls = pouring ? ' class="pour"' : "";
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g${cls}>
    <path d="${p}" fill="${ink}" opacity="0.09"/>
    <path d="${p}" fill="none" stroke="${ink}" stroke-width="2.5" opacity="0.9"/>
    <path d="${p}" fill="none" stroke="${ink}" stroke-width="1" stroke-dasharray="3 4" opacity="0.7" transform="translate(60 60) scale(0.82) translate(-60 -60)"/>
    <text x="60" y="56" text-anchor="middle" font-family="Georgia,serif" font-size="26" fill="${ink}" letter-spacing="2">${esc(monogram(item.name))}</text>
    <text x="60" y="76" text-anchor="middle" font-family="Georgia,serif" font-size="9" fill="${ink}" opacity="0.85" letter-spacing="1.5">${esc((item.country || "").slice(0, 16).toUpperCase())}</text>
    ${item.leg ? `<text x="60" y="97" text-anchor="middle" font-size="12" fill="#F6D889">◆</text>` : ""}
  </g></svg>`;
}

// Router: bottles for alcohol, stamps for everything else.
function itemArt(item, found, pouring = false) {
  const dex = DEX_BY_ID[item.dex];
  if (!dex || dex.art === "bottle") return bottleSVG(item, found, pouring);
  return stampSVG(item, found, pouring);
}
