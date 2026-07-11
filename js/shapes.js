/* =========================================================
   Bottle silhouettes — one SVG path per category.
   viewBox is 0 0 100 240 for every shape.
   To add a new shape: add a key + path, then reference the
   key from a bottle's category mapping in CAT_SHAPE below.
   ========================================================= */

const SHAPES = {
  // Broad-shouldered whisky bottle
  whisky: "M38 8 h24 v10 c0 4 2 6 2 10 v14 c0 6 10 12 12 22 v150 c0 12 -8 18 -20 18 h-12 c-12 0 -20 -6 -20 -18 v-150 c2 -10 12 -16 12 -22 v-14 c0 -4 2 -6 2 -10 z",
  // Tall Bordeaux wine bottle
  wine: "M42 4 h16 v34 c0 8 1 10 3 14 c6 12 9 18 9 30 v130 c0 14 -8 20 -20 20 h-0 c-12 0 -20 -6 -20 -20 v-130 c0 -12 3 -18 9 -30 c2 -4 3 -6 3 -14 z",
  // Champagne / sparkling — sloped shoulders, wide base
  champagne: "M41 4 h18 v26 c0 8 2 12 5 17 c8 13 14 24 14 40 v125 c0 16 -10 22 -28 22 c-18 0 -28 -6 -28 -22 v-125 c0 -16 6 -27 14 -40 c3 -5 5 -9 5 -17 z",
  // Longneck beer bottle
  beer: "M43 6 h14 v44 c0 6 1 8 4 13 c7 11 10 17 10 28 v121 c0 12 -7 20 -21 20 c-14 0 -21 -8 -21 -20 v-121 c0 -11 3 -17 10 -28 c3 -5 4 -7 4 -13 z",
  // Tall straight gin / vodka bottle
  gin: "M40 6 h20 v16 c0 5 3 7 6 11 c3 4 4 7 4 12 v165 c0 14 -9 22 -20 22 c-11 0 -20 -8 -20 -22 v-165 c0 -5 1 -8 4 -12 c3 -4 6 -6 6 -11 z",
  // Rounded-shoulder rum bottle
  rum: "M40 8 h20 v14 c0 6 4 8 8 14 c6 9 10 20 10 34 v130 c0 16 -12 24 -28 24 c-16 0 -28 -8 -28 -24 v-130 c0 -14 4 -25 10 -34 c4 -6 8 -8 8 -14 z",
  // Squat agave / tequila bottle
  agave: "M40 14 h20 v18 c0 6 6 8 12 14 c8 8 12 18 12 30 v110 c0 18 -14 26 -34 26 c-20 0 -34 -8 -34 -26 v-110 c0 -12 4 -22 12 -30 c6 -6 12 -8 12 -14 z",
  // Round liqueur flask
  liqueur: "M42 6 h16 v26 c0 6 2 8 6 12 c14 12 22 28 22 50 v96 c0 26 -16 40 -36 40 c-20 0 -36 -14 -36 -40 v-96 c0 -22 8 -38 22 -50 c4 -4 6 -6 6 -12 z",
  // Bulbous brandy / cognac decanter
  brandy: "M42 6 h16 v30 c0 6 2 9 6 13 c16 16 26 32 26 58 v70 c0 34 -18 53 -40 53 c-22 0 -40 -19 -40 -53 v-70 c0 -26 10 -42 26 -58 c4 -4 6 -7 6 -13 z",
  // Sake tokkuri flask
  sake: "M44 10 h12 v22 c0 8 -6 12 -6 20 c0 6 8 8 14 14 c10 10 16 24 16 42 v92 c0 24 -16 36 -30 36 c-14 0 -30 -12 -30 -36 v-92 c0 -18 6 -32 16 -42 c6 -6 14 -8 14 -14 c0 -8 -6 -12 -6 -20 z"
};

// category name (as used in catalog.js) → shape key
const CAT_SHAPE = {
  "Whisky": "whisky",
  "Wine": "wine",
  "Beer": "beer",
  "Gin": "gin",
  "Vodka": "gin",
  "Rum": "rum",
  "Agave": "agave",
  "Liqueur": "liqueur",
  "Brandy & Cognac": "brandy",
  "Sake & Asian": "sake"
};

/** Pick a shape by style first, then category */
function shapeFor(bottle) {
  if (/champagne|sparkling|cava|franciacorta|prosecco/i.test(bottle.style + " " + bottle.name)) return SHAPES.champagne;
  return SHAPES[CAT_SHAPE[bottle.cat]] || SHAPES.whisky;
}

function esc(str) { return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

/**
 * Build a bottle SVG.
 * revealed=false → pure black silhouette with gold trace.
 * revealed=true  → colored glass, foil cap, printed label with the
 *                  bottle's name, wax seal for legendaries.
 * pourAnim=true  → wraps the color layer in a .pour clip for the reveal.
 */
function bottleSVG(bottle, revealed, pourAnim = false) {
  const path = shapeFor(bottle);
  const uid = "g" + bottle.id + (pourAnim ? "p" : "");
  if (!revealed) {
    return `<svg viewBox="0 0 100 240" xmlns="http://www.w3.org/2000/svg" aria-label="Undiscovered bottle">
      <path d="${path}" class="sil"/>
      <path d="${path}" fill="none" stroke="rgba(212,175,106,0.18)" stroke-width="1.5"/>
    </svg>`;
  }
  const c = bottle.color;
  const leg = !!bottle.leg;
  const foil = leg ? "#D4AF6A" : "#241608";
  // Split long names across two label lines
  const name = bottle.name;
  let line1 = name, line2 = "";
  if (name.length > 14) {
    const words = name.split(" ");
    let acc = "";
    for (const w of words) {
      if ((acc + " " + w).trim().length <= 14) acc = (acc + " " + w).trim();
      else { line2 += (line2 ? " " : "") + w; }
    }
    line1 = acc || name.slice(0, 14);
    if (line2.length > 15) line2 = line2.slice(0, 14) + "…";
  }
  return `<svg viewBox="0 0 100 240" xmlns="http://www.w3.org/2000/svg" aria-label="${esc(name)}">
    <defs>
      <linearGradient id="${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${c}" stop-opacity="0.5"/>
        <stop offset="0.35" stop-color="${c}"/>
        <stop offset="0.62" stop-color="${c}" stop-opacity="0.85"/>
        <stop offset="1" stop-color="${c}" stop-opacity="0.45"/>
      </linearGradient>
      <linearGradient id="${uid}f" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${foil}"/>
        <stop offset="1" stop-color="${leg ? "#B7791E" : "#0E0803"}"/>
      </linearGradient>
      <clipPath id="${uid}c"><path d="${path}"/></clipPath>
    </defs>
    <path d="${path}" fill="#0A0704"/>
    <g clip-path="url(#${uid}c)" class="${pourAnim ? "pour" : ""}">
      <path d="${path}" fill="url(#${uid})"/>
      <rect x="20" y="0" width="60" height="34" fill="url(#${uid}f)"/>
      <rect x="20" y="33" width="60" height="2.5" fill="${leg ? "#F6D889" : "rgba(212,175,106,0.55)"}"/>
      <g>
        <rect x="17" y="142" width="66" height="54" rx="3" fill="#F3E9D7"/>
        <rect x="17" y="142" width="66" height="54" rx="3" fill="none" stroke="${c}" stroke-opacity="0.55" stroke-width="1"/>
        <rect x="22" y="148" width="56" height="1.4" fill="${c}" opacity="0.75"/>
        <text x="50" y="${line2 ? 163 : 168}" text-anchor="middle" font-family="Georgia, serif" font-size="8.2" fill="#241608" font-weight="bold">${esc(line1)}</text>
        ${line2 ? `<text x="50" y="173" text-anchor="middle" font-family="Georgia, serif" font-size="7.4" fill="#241608">${esc(line2)}</text>` : ""}
        <text x="50" y="${line2 ? 184 : 180}" text-anchor="middle" font-family="Georgia, serif" font-size="5.4" fill="#7A6547" font-style="italic">${esc(bottle.country)} · ${bottle.abv}%</text>
        <rect x="22" y="189" width="56" height="1.4" fill="${c}" opacity="0.75"/>
        ${leg ? `<circle cx="50" cy="207" r="8" fill="#B7791E"/><circle cx="50" cy="207" r="8" fill="none" stroke="#F6D889" stroke-width="1"/><text x="50" y="210.5" text-anchor="middle" font-size="9" fill="#F6D889">★</text>` : ""}
      </g>
      <rect x="29" y="0" width="7" height="240" fill="rgba(255,255,255,0.20)"/>
      <rect x="66" y="0" width="3" height="240" fill="rgba(255,255,255,0.10)"/>
    </g>
    <path d="${path}" fill="none" stroke="${leg ? "rgba(246,216,137,0.85)" : "rgba(212,175,106,0.35)"}" stroke-width="1.5"/>
  </svg>`;
}
