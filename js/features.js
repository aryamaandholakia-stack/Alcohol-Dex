/* =========================================================
   v3 features — taste profile, bartender recommendations,
   rarity, the clink, and The Circle (friends + leaderboard).
   Pure functions here; app.js wires them to the DOM.
   ========================================================= */

// ------------------ TASTE PROFILE ------------------------
// Reads the tags/categories/ABVs of met bottles and writes
// one editorial line about the drinker.
function tasteProfile(loggedIds) {
  const met = [...loggedIds].map(id => byId[id]).filter(Boolean);
  if (met.length < 3) return null;

  const tagCount = {};
  met.forEach(b => b.tags.forEach(t => tagCount[t] = (tagCount[t] || 0) + 1));
  const topTags = Object.entries(tagCount).sort((a, z) => z[1] - a[1]).slice(0, 3).map(e => e[0]);

  const catCount = {};
  met.forEach(b => catCount[b.cat] = (catCount[b.cat] || 0) + 1);
  const [homeCat, homeN] = Object.entries(catCount).sort((a, z) => z[1] - a[1])[0];

  const avgAbv = met.reduce((s, b) => s + b.abv, 0) / met.length;
  const strength = avgAbv < 12 ? "a gentle pour" : avgAbv < 25 ? "the middle shelf" : avgAbv < 42 ? "a proper spirit" : "the strong stuff";

  const rated = met.filter(b => state.ratings[b.id] >= 4);
  const favorite = rated.sort((a, z) => (state.ratings[z.id] || 0) - (state.ratings[a.id] || 0))[0] || null;

  return { topTags, homeCat, homeN, avgAbv: Math.round(avgAbv), strength, favorite,
    line: `Your palate leans ${topTags.join(" · ")}. Home shelf: ${homeCat}. You favor ${strength}.` };
}

// ---------------- RECOMMENDATIONS ------------------------
// Tag-similarity between a just-met bottle and the strangers.
function recommendFrom(bottle, loggedIds, n = 3) {
  const want = new Set(bottle.tags.map(t => t.toLowerCase()));
  const pool = (typeof CATALOGS !== "undefined" && CATALOGS[bottle.dex]) ? CATALOGS[bottle.dex] : CATALOG;
  return pool
    .filter(b => b.id !== bottle.id && !loggedIds.has(b.id))
    .map(b => {
      let score = 0;
      b.tags.forEach(t => { if (want.has(t.toLowerCase())) score += 3; });
      if (b.cat === bottle.cat) score += 2;
      if (b.style === bottle.style) score += 3;
      if (b.country === bottle.country) score += 1;
      return { b, score };
    })
    .filter(m => m.score >= 3)
    .sort((a, z) => z.score - a.score)
    .slice(0, n)
    .map(m => m.b);
}

// ----------------------- RARITY --------------------------
// Global aggregates from Supabase: how many collectors have
// met each bottle. Fetched once per session, fails silent.
const rarity = { map: null, collectors: 0,
  async load() {
    if (DEMO_MODE || !sb || this.map) return;
    try {
      const { data, error } = await sb.rpc("alcoholdex_rarity");
      if (error || !data) return;
      this.map = {};
      data.forEach(r => { this.map[r.bottle_id] = r.holders; this.collectors = r.collectors; });
    } catch (e) { /* rarity is decoration; never block the app */ }
  },
  line(bottleId) {
    if (!this.map || this.collectors < 2) return "";
    const holders = this.map[bottleId] || 0;
    const pct = Math.round((holders / this.collectors) * 100);
    if (pct === 0) return "You are the first collector to meet this bottle.";
    if (pct <= 10) return `Met by only ${pct}% of collectors.`;
    return `Met by ${pct}% of collectors.`;
  }
};

// --------------------- THE CLINK -------------------------
// WebAudio glass clink, synthesized — no audio files. A short
// bright ping with fast decay; legendaries get a tiny arpeggio.
const clink = {
  ctx: null,
  get on() { return localStorage.getItem("adex_sound") !== "off"; },
  toggle() { localStorage.setItem("adex_sound", this.on ? "off" : "on"); return this.on; },
  ping(freq, when, gain = 0.22, dur = 0.6) {
    const c = this.ctx, t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain(), o2 = c.createOscillator();
    o.type = "sine"; o.frequency.value = freq;
    o2.type = "sine"; o2.frequency.value = freq * 2.76; // glassy inharmonic partial
    const g2 = c.createGain(); g2.gain.value = 0.35;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(c.destination);
    o.start(t); o2.start(t); o.stop(t + dur); o2.stop(t + dur);
  },
  play(legendary = false) {
    if (!this.on) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.ping(1975, 0);                     // the clink
      this.ping(2637, 0.02, 0.1, 0.35);       // its shimmer
      if (legendary) { this.ping(1568, 0.18, 0.14); this.ping(1975, 0.3, 0.14); this.ping(2637, 0.42, 0.16, 0.9); }
    } catch (e) { /* sound is a garnish */ }
  }
};

// ------------------- THE CIRCLE --------------------------
// Friends + leaderboard via SECURITY DEFINER functions.
const circle = {
  profile: null,
  async loadProfile() {
    if (DEMO_MODE || !sb) return null;
    let { data } = await sb.from("alcoholdex_profiles").select("handle, friend_code").eq("user_id", state.user.id).maybeSingle();
    if (!data) {
      const handle = (state.user.email || "Collector").split("@")[0];
      const ins = await sb.from("alcoholdex_profiles").insert({ user_id: state.user.id, handle }).select("handle, friend_code").single();
      data = ins.data;
    }
    this.profile = data;
    return data;
  },
  async setHandle(handle) {
    if (DEMO_MODE || !sb || !handle.trim()) return false;
    const { error } = await sb.from("alcoholdex_profiles").update({ handle: handle.trim().slice(0, 24) }).eq("user_id", state.user.id);
    if (!error) this.profile.handle = handle.trim().slice(0, 24);
    return !error;
  },
  async addFriend(code) {
    if (DEMO_MODE || !sb) return { ok: false, msg: "The Circle needs a live account." };
    const { data, error } = await sb.rpc("alcoholdex_add_friend", { code });
    if (error) return { ok: false, msg: "The room didn't catch that." };
    if (!data || !data.length) return { ok: false, msg: "No collector answers to that code." };
    return { ok: true, handle: data[0].handle };
  },
  async leaderboard() {
    if (DEMO_MODE || !sb) return null;
    const legIds = (typeof ALL_ITEMS !== "undefined" ? ALL_ITEMS : CATALOG).filter(b => b.leg).map(b => b.id);
    const { data, error } = await sb.rpc("alcoholdex_leaderboard", { leg_ids: legIds });
    if (error) return null;
    return data;
  }
};
