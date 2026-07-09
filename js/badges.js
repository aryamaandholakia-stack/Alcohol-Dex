/* =========================================================
   Badges — each has an id, icon, name, description, and a
   test(stats) function. To add a badge, append to this list.
   stats = { total, countries, legendaries, byCat: {cat: n},
             catTotals: {cat: n} }
   ========================================================= */

const BADGES = [
  { id: "first",     icon: "🥃", name: "First Pour",     desc: "Log your first bottle",              test: s => s.total >= 1 },
  { id: "ten",       icon: "🍸", name: "Regular",        desc: "Log 10 bottles",                     test: s => s.total >= 10 },
  { id: "fifty",     icon: "🍷", name: "Half Century",   desc: "Log 50 bottles",                     test: s => s.total >= 50 },
  { id: "hundred",   icon: "🏆", name: "Century Club",   desc: "Log 100 bottles",                    test: s => s.total >= 100 },
  { id: "twohund",   icon: "👑", name: "Grand Collector",desc: "Log 200 bottles",                    test: s => s.total >= 200 },
  { id: "complete",  icon: "💎", name: "The Full Cellar",desc: "Log all 350 bottles",                test: s => s.total >= s.catalogTotal },
  { id: "globe5",    icon: "🌍", name: "Globetrotter",   desc: "Bottles from 5 countries",           test: s => s.countries >= 5 },
  { id: "globe15",   icon: "🧭", name: "World Tour",     desc: "Bottles from 15 countries",          test: s => s.countries >= 15 },
  { id: "spec25",    icon: "🎓", name: "Specialist",     desc: "25 bottles in one category",         test: s => Object.values(s.byCat).some(n => n >= 25) },
  { id: "catfull",   icon: "📜", name: "Connoisseur",    desc: "Complete an entire category",        test: s => Object.keys(s.catTotals).some(c => (s.byCat[c] || 0) >= s.catTotals[c]) },
  { id: "leg1",      icon: "⭐", name: "Legendary Find", desc: "Discover your first legendary",      test: s => s.legendaries >= 1 },
  { id: "leg5",      icon: "🌟", name: "Legend Hunter",  desc: "Discover 5 legendaries",             test: s => s.legendaries >= 5 },
  { id: "leg10",     icon: "✨", name: "Mythic Taste",   desc: "Discover 10 legendaries",            test: s => s.legendaries >= 10 },
  { id: "leg20",     icon: "🔱", name: "The Pantheon",   desc: "Discover all 20 legendaries",        test: s => s.legendaries >= 20 }
];
