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

/**
 * Build a bottle SVG.
 * revealed=false → pure black silhouette.
 * revealed=true  → colored body with glass highlight and label band.
 * pourAnim=true  → wraps the color layer in a .pour clip for the reveal animation.
 */
function bottleSVG(bottle, revealed, pourAnim = false) {
  const path = SHAPES[CAT_SHAPE[bottle.cat]] || SHAPES.whisky;
  const uid = "g" + bottle.id + (pourAnim ? "p" : "");
  if (!revealed) {
    return `<svg viewBox="0 0 100 240" xmlns="http://www.w3.org/2000/svg" aria-label="Undiscovered bottle">
      <path d="${path}" class="sil"/>
      <path d="${path}" fill="none" stroke="rgba(212,175,106,0.18)" stroke-width="1.5"/>
    </svg>`;
  }
  const c = bottle.color;
  return `<svg viewBox="0 0 100 240" xmlns="http://www.w3.org/2000/svg" aria-label="${bottle.name}">
    <defs>
      <linearGradient id="${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${c}" stop-opacity="0.55"/>
        <stop offset="0.35" stop-color="${c}"/>
        <stop offset="0.6" stop-color="${c}" stop-opacity="0.85"/>
        <stop offset="1" stop-color="${c}" stop-opacity="0.5"/>
      </linearGradient>
      <clipPath id="${uid}c"><path d="${path}"/></clipPath>
    </defs>
    <path d="${path}" fill="#0A0704"/>
    <g clip-path="url(#${uid}c)" class="${pourAnim ? "pour" : ""}">
      <path d="${path}" fill="url(#${uid})"/>
      <rect x="18" y="150" width="64" height="42" rx="4" fill="rgba(243,233,215,0.92)"/>
      <rect x="18" y="158" width="64" height="2" fill="${c}" opacity="0.7"/>
      <rect x="18" y="182" width="64" height="2" fill="${c}" opacity="0.7"/>
      <rect x="30" y="0" width="8" height="240" fill="rgba(255,255,255,0.22)"/>
    </g>
    <path d="${path}" fill="none" stroke="${bottle.leg ? "rgba(246,216,137,0.8)" : "rgba(212,175,106,0.35)"}" stroke-width="1.5"/>
  </svg>`;
}
