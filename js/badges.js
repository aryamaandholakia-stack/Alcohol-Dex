/* =========================================================
   Badges — id, icon (brass line-art SVG), name, desc, test.
   stats = { total, countries, legendaries, byCat, catTotals,
             catalogTotal, legTotal }
   To add a badge: add an icon to BADGE_ICONS + a row to BADGES.
   ========================================================= */

const I = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

const BADGE_ICONS = {
  first:   I('<path d="M7 4h10l-1 9a4 4 0 0 1-8 0z"/><path d="M12 17v3M9 20h6"/><path d="M7.5 8.5h9"/>'),
  ten:     I('<path d="M5 5h14l-6 7v5"/><path d="M9 20h6M13 12v5"/><path d="M7 7.5h10"/>'),
  fifty:   I('<path d="M8 4h8c0 5-1 8-4 8s-4-3-4-8z"/><path d="M12 12v6M9 20h6"/>'),
  hundred: I('<path d="M8 4h8v6a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 14v4M9 20h6"/>'),
  twohund: I('<path d="M4 17l1.5-9L9 12l3-6 3 6 3.5-4L20 17z"/><path d="M5 20h14"/>'),
  complete:I('<path d="M12 3l6 6-6 12L6 9z"/><path d="M6 9h12M12 3l-2.5 6L12 21l2.5-12z"/>'),
  globe5:  I('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 2.5 3 14.5 0 17-3-2.5-3-14.5 0-17z"/>'),
  globe15: I('<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/><path d="M12 3.5v1.5M12 19v1.5M3.5 12H5M19 12h1.5"/>'),
  spec25:  I('<path d="M12 5c-2-1.5-5-1.5-7 0v13c2-1.5 5-1.5 7 0 2-1.5 5-1.5 7 0V5c-2-1.5-5-1.5-7 0z"/><path d="M12 5v13"/>'),
  catfull: I('<path d="M7 4h11v14a2 2 0 0 1-2 2H7"/><path d="M7 4a2 2 0 0 0-2 2v1h4"/><path d="M7 4v14a2 2 0 0 1-2 2h11"/><path d="M10 9h5M10 12.5h5"/>'),
  leg1:    I('<path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z"/>'),
  leg5:    I('<path d="M7 5l1.2 3.3L11.5 9.5 8.2 10.7 7 14l-1.2-3.3L2.5 9.5l3.3-1.2z"/><path d="M17 10l1 2.7 2.7 1-2.7 1-1 2.7-1-2.7-2.7-1 2.7-1z"/><path d="M13 3.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z"/>'),
  leg10:   I('<path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3L6.3 17.7"/><circle cx="12" cy="12" r="2.6"/>'),
  leg20:   I('<path d="M12 3v18M8 21h8"/><path d="M6 6c0 4 2.5 6 6 6s6-2 6-6"/><path d="M6 6V4M18 6V4M12 3l-1.5 2h3z"/>')
};

const BADGES = [
  { id: "first",     name: "First Pour",      desc: "Log your first collectible",         test: s => s.total >= 1 },
  { id: "ten",       name: "Regular",         desc: "Collect 10 across any dex",                test: s => s.total >= 10 },
  { id: "fifty",     name: "Half Century",    desc: "Collect 50 across any dex",                test: s => s.total >= 50 },
  { id: "hundred",   name: "Century Club",    desc: "Collect 100 across any dex",               test: s => s.total >= 100 },
  { id: "twohund",   name: "Grand Collector", desc: "Collect 200 across any dex",               test: s => s.total >= 200 },
  { id: "complete",  name: "The Full Cellar", desc: "Complete every collection",   test: s => s.total >= s.catalogTotal },
  { id: "globe5",    name: "Globetrotter",    desc: "Collect from 5 countries",      test: s => s.countries >= 5 },
  { id: "globe15",   name: "World Tour",      desc: "Collect from 15 countries",     test: s => s.countries >= 15 },
  { id: "spec25",    name: "Specialist",      desc: "25 in a single shelf",    test: s => Object.values(s.byCat).some(n => n >= 25) },
  { id: "catfull",   name: "Connoisseur",     desc: "Complete an entire shelf",   test: s => Object.keys(s.catTotals).some(c => (s.byCat[c] || 0) >= s.catTotals[c]) },
  { id: "leg1",      name: "Legendary Find",  desc: "Discover your first legendary", test: s => s.legendaries >= 1 },
  { id: "leg5",      name: "Legend Hunter",   desc: "Discover 5 legendaries",        test: s => s.legendaries >= 5 },
  { id: "leg10",     name: "Mythic Taste",    desc: "Discover 10 legendaries",       test: s => s.legendaries >= 10 },
  { id: "leg20",     name: "The Pantheon",    desc: "Discover every legendary",      test: s => s.legendaries >= s.legTotal }
];
