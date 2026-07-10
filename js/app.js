/* =========================================================
   The Pokédex v4 — multi-dex app logic (AlcoholDex + 6 dexes)
   Sections: state → data layer → auth → views → dex grid →
   bartender → modal/reveal → badges/passport → init
   ========================================================= */

// ------------------------- STATE -------------------------
const state = {
  user: null,
  logged: new Set(),      // bottle ids met
  metAt: {},              // bottle id → ISO date met
  ratings: {},            // bottle id → 1..5
  filterCat: "All",
  search: "",
  hideDiscovered: false,
  earnedBadges: new Set(),
  dex: "alcohol"
};

// Global pool across every dex (ids are globally unique)
const ALL_ITEMS = Object.values(CATALOGS).flat();
const byId = Object.fromEntries(ALL_ITEMS.map(b => [b.id, b]));
const ALL_LEG_TOTAL = ALL_ITEMS.filter(b => b.leg).length;

// Per-dex derived state, recomputed by setDex()
let dItems = [], dCats = [], dCatTotals = {}, dLegTotal = 0, dIndex = {};
function curDex() { return DEX_BY_ID[state.dex]; }
function computeDexDerived() {
  dItems = CATALOGS[state.dex] || [];
  dCats = [...new Set(dItems.map(b => b.cat))];
  dCatTotals = {};
  dItems.forEach(b => dCatTotals[b.cat] = (dCatTotals[b.cat] || 0) + 1);
  dLegTotal = dItems.filter(b => b.leg).length;
  dIndex = {}; dItems.forEach((b, i) => dIndex[b.id] = i + 1);
}
computeDexDerived();

function revealOn() {
  return !curDex().hunt && localStorage.getItem("adex_reveal_" + state.dex) === "1";
}
function setReveal(on) {
  localStorage.setItem("adex_reveal_" + state.dex, on ? "1" : "0");
  renderGrid();
}

function setDex(id) {
  if (!DEX_BY_ID[id]) return;
  state.dex = id;
  state.filterCat = "All";
  state.search = "";
  state.hideDiscovered = false;
  computeDexDerived();
  const d = curDex();
  $("nav-dex").textContent = d.name;
  $("dex-title").textContent = d.name;
  $("bartender-label").textContent = d.ask;
  $("bartender-input").placeholder = d.placeholder || "Name it, roughly is fine…";
  $("btn-log").textContent = d.logLabel || `I've ${d.verb} this — log it`;
  $("search").value = ""; $("bartender-input").value = ""; $("bartender-results").innerHTML = "";
  const fu = $("filter-undiscovered"); if (fu) fu.checked = false;
  const note = $("dex-note"); if (note) note.textContent = d.note || "";
  const rw = $("reveal-wrap");
  if (rw) {
    rw.style.display = d.hunt ? "none" : "";
    const fr = $("filter-reveal"); if (fr) fr.checked = revealOn();
  }
  buildChips();
  renderGrid();
  updateCounter();
  renderDexGems();
}

const $ = id => document.getElementById(id);
let sb = null;
if (!DEMO_MODE) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function metPhrase(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return `Met in ${MONTHS[d.getMonth()]} ${d.getFullYear()}.`;
}

// --------------------- DATA LAYER ------------------------
const store = {
  async loadLogs() {
    if (DEMO_MODE) {
      const raw = localStorage.getItem("adex_logs_" + state.user.id);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(id => ({ bottle_id: id, logged_at: null, rating: null })); // v1
      return Object.entries(parsed).map(([id, v]) =>
        typeof v === "string" ? { bottle_id: id, logged_at: v, rating: null }                                  // v2
                              : { bottle_id: id, logged_at: v.at, rating: v.r || null });                      // v3
    }
    const { data, error } = await sb.from("alcoholdex_logs").select("bottle_id, logged_at, rating").eq("user_id", state.user.id);
    if (error) { console.error(error); return []; }
    return data;
  },
  saveDemo() {
    const obj = {};
    state.logged.forEach(id => obj[id] = { at: state.metAt[id] || new Date().toISOString(), r: state.ratings[id] || null });
    localStorage.setItem("adex_logs_" + state.user.id, JSON.stringify(obj));
  },
  async addLog(bottleId) {
    if (DEMO_MODE) { this.saveDemo(); return true; }
    const item = byId[bottleId];
    const { error } = await sb.from("alcoholdex_logs").insert({ user_id: state.user.id, bottle_id: bottleId, dex_id: item ? item.dex : "alcohol" });
    if (error) console.error(error);
    return !error;
  },
  async removeLog(bottleId) {
    if (DEMO_MODE) { this.saveDemo(); return true; }
    const { error } = await sb.from("alcoholdex_logs").delete().eq("user_id", state.user.id).eq("bottle_id", bottleId);
    if (error) console.error(error);
    return !error;
  }
};

// ------------------------- AUTH --------------------------
let authMode = "signin";

function setAuthMode(mode) {
  authMode = mode;
  $("tab-signin").classList.toggle("active", mode === "signin");
  $("tab-signup").classList.toggle("active", mode === "signup");
  $("auth-submit").textContent = mode === "signin" ? "Enter" : "Sign the book";
  $("auth-msg").textContent = "";
}

async function handleAuth(e) {
  e.preventDefault();
  const email = $("auth-email").value.trim();
  const password = $("auth-password").value;
  const msg = $("auth-msg");
  msg.className = "auth-msg";
  msg.textContent = "…";

  if (DEMO_MODE) {
    const users = JSON.parse(localStorage.getItem("adex_users") || "{}");
    if (authMode === "signup") {
      if (users[email]) { msg.textContent = "That name is already in the book."; return; }
      users[email] = { pw: password, id: "demo_" + btoa(email).replace(/[^a-z0-9]/gi, "") };
      localStorage.setItem("adex_users", JSON.stringify(users));
    } else {
      if (!users[email] || users[email].pw !== password) { msg.textContent = "The book doesn't recognize you. Check the details."; return; }
    }
    localStorage.setItem("adex_session", email);
    await enterApp({ id: users[email].id, email });
    return;
  }

  if (authMode === "signup") {
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) { msg.textContent = error.message; return; }
    if (data.user && !data.session) {
      msg.className = "auth-msg ok";
      msg.textContent = "Check your inbox to confirm, then return.";
      return;
    }
    await enterApp({ id: data.user.id, email });
  } else {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { msg.textContent = error.message; return; }
    await enterApp({ id: data.user.id, email });
  }
}

async function signOut() {
  if (DEMO_MODE) localStorage.removeItem("adex_session");
  else await sb.auth.signOut();
  state.user = null;
  state.logged = new Set();
  state.metAt = {};
  state.ratings = {};
  show("view-auth");
}

async function restoreSession() {
  if (DEMO_MODE) {
    const email = localStorage.getItem("adex_session");
    if (email) {
      const users = JSON.parse(localStorage.getItem("adex_users") || "{}");
      if (users[email]) { await enterApp({ id: users[email].id, email }); return true; }
    }
    return false;
  }
  const { data } = await sb.auth.getSession();
  if (data.session) { await enterApp({ id: data.session.user.id, email: data.session.user.email }); return true; }
  return false;
}

async function enterApp(user) {
  state.user = user;
  const rows = await store.loadLogs();
  state.logged = new Set();
  state.metAt = {};
  rows.forEach(r => { if (byId[r.bottle_id]) { state.logged.add(r.bottle_id); if (r.logged_at) state.metAt[r.bottle_id] = r.logged_at; if (r.rating) state.ratings[r.bottle_id] = r.rating; } });
  circle.loadProfile();   // background — the Passport re-renders on open
  rarity.load();
  state.earnedBadges = new Set(BADGES.filter(b => b.test(computeStats())).map(b => b.id));
  show("view-app");
  setDex(state.dex);
  showPage("home");
}

// ---------------------- VIEW SWITCH ----------------------
function show(viewId) {
  ["view-agegate", "view-auth", "view-app"].forEach(v => $(v).classList.toggle("hidden", v !== viewId));
  if (window.armRise) armRise();
}
function showPage(page) {
  ["home", "dex", "profile"].forEach(p => {
    $("page-" + p).classList.toggle("hidden", p !== page);
    $("nav-" + p).classList.toggle("active", p === page);
  });
  if (page === "profile") renderProfile();
  if (page === "home") renderDexHome();
  if (window.armRise) armRise();
  window.scrollTo({ top: 0 });
}

// --------------------- HOME: THE ARCHIVE -------------------
function dexCount(dexId) {
  const items = CATALOGS[dexId] || [];
  let n = 0; items.forEach(b => { if (state.logged.has(b.id)) n++; });
  return { n, total: items.length };
}

function renderDexHome() {
  const grid = $("dex-grid-home");
  if (!grid) return;
  const box = (d, cls) => {
    const { n, total } = dexCount(d.id);
    const pct = total ? Math.round((n / total) * 100) : 0;
    const legFound = (CATALOGS[d.id] || []).filter(b => b.leg && state.logged.has(b.id)).length;
    const legTotal = (CATALOGS[d.id] || []).filter(b => b.leg).length;
    const flag = d.flagship;
    return `<div class="dexbox ${cls} rise" data-dex="${d.id}" tabindex="0" role="button" style="--dexac:${d.accent}" aria-label="${d.name}, ${n} of ${total}">
      <div class="dexbox-top"><span class="dexbox-glyph">${d.glyph}</span><span class="dexbox-count">${n} / ${total}</span></div>
      <div class="dexbox-name">${d.name}</div>
      <div class="dexbox-tag">${flag ? "The treasure hunt. Pokémon rules: every bottle stays a silhouette until you meet it in the wild — no peeking, no lists, only the hunt." : d.tagline}</div>
      ${flag ? `<div class="dexbox-legline">${d.legName}: ${legFound} of ${legTotal} found</div>` : ""}
      <div class="dexbox-bar"><div class="dexbox-fill" style="width:${pct}%"></div></div>
      <div class="dexbox-enter">${flag ? "Enter the hunt →" : "Enter →"}</div>
    </div>`;
  };
  const flagship = DEXES.filter(d => d.flagship);
  const addons = DEXES.filter(d => !d.flagship);
  grid.innerHTML =
    `<div class="dex-section-label rise">The main attraction</div>` +
    flagship.map(d => box(d, "dexbox-flagship")).join("") +
    `<div class="dex-section-label rise" style="margin-top:1.6rem">The add-ons — field lists, revealable</div>` +
    addons.map(d => box(d, "")).join("");
  grid.querySelectorAll(".dexbox").forEach(el => {
    const go = () => { setDex(el.dataset.dex); showPage("dex"); };
    el.addEventListener("click", go);
    el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
  const gTotal = $("global-count");
  if (gTotal) gTotal.textContent = state.logged.size;
  if (window.armRise) armRise();
}

function renderDexGems() {
  const box = $("dex-gems");
  if (!box) return;
  const found = dItems.filter(b => b.leg && state.logged.has(b.id)).length;
  let s = `<span class="eyebrow" style="margin-right:0.8rem">${curDex().legName}</span>`;
  for (let i = 0; i < dLegTotal; i++) s += `<span class="gem ${i < found ? "lit-g" : "unlit"}">${i < found ? "◆" : "◇"}</span>`;
  box.innerHTML = s;
}

// ------------------------ DEX GRID -----------------------
function buildChips() {
  const chips = ["All", ...dCats];
  $("category-chips").innerHTML = chips.map(c =>
    `<button class="chip ${state.filterCat === c ? "active" : ""}" data-cat="${c}">${c}</button>`
  ).join("");
  $("category-chips").querySelectorAll(".chip").forEach(el =>
    el.addEventListener("click", () => { state.filterCat = el.dataset.cat; buildChips(); renderGrid(); })
  );
}

function visibleBottles() {
  const q = state.search.toLowerCase();
  return dItems.filter(b => {
    if (state.filterCat !== "All" && b.cat !== state.filterCat) return false;
    if (state.hideDiscovered && state.logged.has(b.id)) return false;
    if (q) {
      const hay = (b.name + " " + b.country + " " + b.style + " " + b.tags.join(" ")).toLowerCase();
      const found = (state.logged.has(b.id) || revealOn()) ? hay.includes(q) : (b.cat + " " + b.country + " " + b.style).toLowerCase().includes(q);
      if (!found) return false;
    }
    return true;
  });
}

function renderGrid() {
  const bottles = visibleBottles();
  const peekAll = revealOn();
  $("bottle-grid").innerHTML = bottles.map(b => {
    const found = state.logged.has(b.id);
    const peek = !found && peekAll;
    return `<div class="card ${found ? "" : "locked"} ${peek ? "peek" : ""} ${b.leg ? "legendary" : ""}" data-id="${b.id}" tabindex="0" role="button" aria-label="${found || peek ? b.name : "A stranger — " + b.cat}">
      <div class="bottle-wrap" style="position:relative"><div class="bottle-svg ${curDex().art === "stamp" ? "stamp-svg" : ""} ${peek ? "ghost" : ""}">${itemArt(b, found || peek)}</div>${(found || peek) ? "" : '<div class="shimmer"></div>'}</div>
      <div class="card-name">${found || peek ? b.name : "— — —"}</div>
      <div class="card-sub">${found ? b.country : peek ? b.country + " · not yet " + curDex().verb : "A stranger · " + b.cat}</div>
    </div>`;
  }).join("") || `<p style="color:var(--dim);grid-column:1/-1;text-align:center;padding:3rem 0;font-family:var(--serif);font-style:italic">The shelf is empty. Adjust your filters.</p>`;

  $("bottle-grid").querySelectorAll(".card").forEach(el => {
    el.addEventListener("click", () => openModal(el.dataset.id));
    el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(el.dataset.id); } });
  });
}

function updateCounter() {
  const d = curDex();
  const total = dItems.length;
  const met = dItems.reduce((n, b) => n + (state.logged.has(b.id) ? 1 : 0), 0);
  $("counter-found").textContent = met;
  document.querySelectorAll(".counter-total").forEach(el => el.textContent = total);
  document.querySelectorAll(".pass-total").forEach(el => el.textContent = ALL_ITEMS.length);
  const heroTotal = $("hero-total"); if (heroTotal) heroTotal.textContent = ALL_ITEMS.length;
  const authTotal = $("auth-total"); if (authTotal) authTotal.textContent = ALL_ITEMS.length;
  const strangers = total - met;
  const verb = d.verb;
  $("dex-line").innerHTML = met === 0
    ? `${total} ${d.noun}s. Every one a <em>stranger.</em>`
    : `You have ${verb} ${met}. The other ${strangers} remain <em>strangers.</em>`;
}

// --------------------- MODAL & REVEAL --------------------
let modalBottle = null;

function fillStats(b) {
  const d = DEX_BY_ID[b.dex] || curDex();
  const stat = b.stat !== undefined ? b.stat : (b.abv !== undefined ? b.abv + "%" : "—");
  $("m-stats").innerHTML = `
    <div class="mstat"><div class="mstat-v">${stat}</div><div class="mstat-k">${d.statLabel}</div></div>
    <div class="mstat"><div class="mstat-v">${b.country}</div><div class="mstat-k">Origin</div></div>
    <div class="mstat"><div class="mstat-v gold">${b.serve.split(/[.,—]/)[0]}</div><div class="mstat-k">${d.serveLabel}</div></div>`;
}

function openModal(id) {
  modalBottle = byId[id];
  const b = modalBottle;
  const found = state.logged.has(id);
  const d = DEX_BY_ID[b.dex];
  const peek = !found && !d.hunt && revealOn();
  const card = $("modal-card");
  card.classList.remove("revealing", "revealed", "legend-reveal");

  const no = String(dIndex[b.id] || 0).padStart(3, "0");
  $("modal-bottle").innerHTML = `<div class="${peek ? "ghost" : ""}">${itemArt(b, found || peek)}</div>`;
  $("m-eyebrow").textContent = (found || peek)
    ? (b.leg ? `◆ One of ${d.legName} · ${b.style}` : `${b.cat} · ${b.style} · No. ${no} of ${dItems.length}`)
    : `${b.cat} · No. ${no} of ${dItems.length}`;
  $("m-eyebrow").classList.toggle("legend", (found || peek) && !!b.leg);

  $("m-name").textContent = (found || peek) ? b.name : "— — —";
  $("m-name").classList.toggle("mystery", !(found || peek));
  $("m-stats").innerHTML = "";
  if (found || peek) fillStats(b);
  $("m-tags").innerHTML = (found || peek) ? b.tags.map(t => `<span class="tag">${t}</span>`).join("") : "";
  $("m-mix").innerHTML = (found && d.art === "bottle") ? '<span class="mix-label">Mix it</span>' + getCocktails(b).map(x => `<span class="tag mix">${x}</span>`).join("") : "";
  $("m-fact").textContent = (found || peek) ? b.fact : "";
  $("m-fact").style.display = (found || peek) ? "" : "none";
  $("m-met").textContent = found ? metPhrase(state.metAt[b.id]) : (peek ? `Not yet ${d.verb}.` : "");
  $("m-rarity").textContent = found ? rarity.line(b.id) : "";
  renderRating(found ? b.id : null);
  renderRecos(found ? b : null);
  $("m-hint").textContent = found ? "" : (peek ? "" : bartenderHint(b));
  $("m-hint").style.display = (found || peek) ? "none" : "";

  $("btn-log").classList.toggle("hidden", found);
  $("btn-unlog").classList.toggle("hidden", !found);
  if (found) card.classList.add("revealed");
  $("modal").classList.remove("hidden");
}

function closeModal() { $("modal").classList.add("hidden"); modalBottle = null; }

async function logBottle() {
  if (!modalBottle || state.logged.has(modalBottle.id)) return;
  const b = modalBottle;
  state.logged.add(b.id);
  state.metAt[b.id] = new Date().toISOString();
  store.addLog(b.id);

  const d = DEX_BY_ID[b.dex];
  const card = $("modal-card");
  $("modal-bottle").innerHTML = itemArt(b, true, true);
  card.classList.add("revealing", "revealed");
  if (b.leg) card.classList.add("legend-reveal");

  setTimeout(() => {
    const no = String(dIndex[b.id] || 0).padStart(3, "0");
    $("m-eyebrow").textContent = b.leg ? `◆ One of ${d.legName} · ${b.style}` : `${b.cat} · ${b.style} · No. ${no} of ${dItems.length}`;
    $("m-eyebrow").classList.toggle("legend", !!b.leg);
    $("m-name").textContent = b.name;
    $("m-name").classList.remove("mystery");
    $("m-name").classList.add("reveal-fade");
    fillStats(b);
    $("m-tags").innerHTML = b.tags.map(t => `<span class="tag">${t}</span>`).join("");
    $("m-mix").innerHTML = d.art === "bottle" ? '<span class="mix-label">Mix it</span>' + getCocktails(b).map(x => `<span class="tag mix">${x}</span>`).join("") : "";
    $("m-fact").textContent = b.fact;
    $("m-fact").style.display = "";
    $("m-met").textContent = metPhrase(state.metAt[b.id]);
    $("m-rarity").textContent = rarity.line(b.id);
    renderRating(b.id);
    renderRecos(b);
    $("m-hint").style.display = "none";
    ["m-stats", "m-tags", "m-mix", "m-fact", "m-met", "m-rate", "m-reco"].forEach(id => $(id).classList.add("reveal-fade"));
  }, 800);
  clink.play(!!b.leg);

  $("btn-log").classList.add("hidden");
  $("btn-unlog").classList.remove("hidden");

  const V = d.verb.charAt(0).toUpperCase() + d.verb.slice(1);
  if (b.leg) { confettiBurst(); toast(`◆ ONE OF ${d.legName.toUpperCase()} — ` + b.name, true); }
  else toast(`${V}: ` + b.name);

  updateCounter();
  renderGrid();
  renderDexGems();
  checkNewBadges();
}

async function unlogBottle() {
  if (!modalBottle) return;
  state.logged.delete(modalBottle.id);
  delete state.metAt[modalBottle.id];
  store.removeLog(modalBottle.id);
  updateCounter();
  renderGrid();
  renderDexGems();
  openModal(modalBottle.id);
}

// ------------------ TELL THE BARTENDER -------------------
function bartenderHint(b) {
  if (b.abv !== undefined) {
    const band = b.abv < 10 ? "a light pour" : b.abv < 25 ? "medium strength" : b.abv < 45 ? "a proper spirit" : "high proof";
    return `From ${b.country}. ${band}. Notes of ${b.tags[0]}.`;
  }
  return `${b.country}. Think: ${b.tags[0]}.`;
}

function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function dice(a, b) {
  if (a.length < 2 || b.length < 2) return 0;
  const grams = str => { const g = new Map(); for (let i = 0; i < str.length - 1; i++) { const bg = str.slice(i, i + 2); g.set(bg, (g.get(bg) || 0) + 1); } return g; };
  const ga = grams(a), gb = grams(b);
  let hits = 0;
  ga.forEach((n, bg) => { if (gb.has(bg)) hits += Math.min(n, gb.get(bg)); });
  return (2 * hits) / (a.length - 1 + b.length - 1);
}

function bartenderMatch(query) {
  const q = normalize(query);
  if (q.length < 2) return [];
  const qTokens = q.split(" ");
  return dItems.map(b => {
    const name = normalize(b.name);
    const full = name + " " + normalize(b.style) + " " + normalize(b.country) + " " + normalize(b.cat);
    let score = 0;
    if (name === q) score += 100;
    if (name.includes(q)) score += 50;
    const fullWords = full.split(" ");
    qTokens.forEach(t => {
      if (t.length < 2) return;
      if (name.split(" ").includes(t)) score += 18;
      else if (name.includes(t)) score += 10;
      else if (fullWords.includes(t)) score += 12;
      else if (full.includes(t)) score += 3;
    });
    score += Math.round(dice(q, name) * 34);
    return { b, score };
  }).filter(m => m.score >= 10).sort((a, z) => z.score - a.score).slice(0, 3);
}

function runBartender() {
  const q = $("bartender-input").value;
  const box = $("bartender-results");
  const hits = bartenderMatch(q);
  if (!q.trim()) { box.innerHTML = ""; return; }
  if (!hits.length) {
    box.innerHTML = `<div class="bartender-miss">Not in this collection — ${curDex().name} keeps ${dItems.length} ${curDex().noun}s. Try another name, or browse the strangers for a hint.</div>`;
    return;
  }
  box.innerHTML = hits.map(({ b }) => {
    const logged = state.logged.has(b.id);
    return `<button class="bartender-hit ${logged ? "already" : ""}" data-id="${b.id}">
      <span>${b.name}<div class="hit-sub">${b.cat} · ${b.style} · ${b.country}</div></span>
      <span class="hit-state">${logged ? "Already met" : "This one →"}</span>
    </button>`;
  }).join("");
  box.querySelectorAll(".bartender-hit").forEach(el => el.addEventListener("click", () => {
    openModal(el.dataset.id);
    box.innerHTML = ""; $("bartender-input").value = "";
  }));
}

// ----------------- RATING & RECOMMENDATIONS --------------
async function setRating(bottleId, n) {
  state.ratings[bottleId] = n;
  renderRating(bottleId);
  if (DEMO_MODE) { store.saveDemo(); return; }
  await sb.from("alcoholdex_logs").update({ rating: n }).eq("user_id", state.user.id).eq("bottle_id", bottleId);
}

function renderRating(bottleId) {
  const box = $("m-rate");
  if (!bottleId) { box.innerHTML = ""; return; }
  const r = state.ratings[bottleId] || 0;
  box.innerHTML = '<span class="mix-label">Your verdict</span>' +
    [1,2,3,4,5].map(n => `<button class="star ${n <= r ? "lit" : ""}" data-n="${n}" aria-label="${n} stars">${n <= r ? "★" : "☆"}</button>`).join("");
  box.querySelectorAll(".star").forEach(el =>
    el.addEventListener("click", () => setRating(bottleId, Number(el.dataset.n))));
}

function renderRecos(bottle) {
  const box = $("m-reco");
  if (!bottle) { box.innerHTML = ""; return; }
  const recos = recommendFrom(bottle, state.logged);
  if (!recos.length) { box.innerHTML = ""; return; }
  box.innerHTML = '<span class="mix-label">The bartender suggests hunting</span>' +
    recos.map(b => `<button class="reco-chip" data-id="${b.id}">${state.logged.has(b.id) ? b.name : "a " + b.style.toLowerCase() + " from " + b.country}</button>`).join("");
  box.querySelectorAll(".reco-chip").forEach(el =>
    el.addEventListener("click", () => openModal(el.dataset.id)));
}

// ---------------------- BADGES & STATS -------------------
function computeStats() {
  const byCat = {};
  const countries = new Set();
  let legendaries = 0;
  state.logged.forEach(id => {
    const b = byId[id];
    if (!b) return;
    byCat[b.dex + "·" + b.cat] = (byCat[b.dex + "·" + b.cat] || 0) + 1;
    countries.add(b.country);
    if (b.leg) legendaries++;
  });
  const catTotals = {};
  ALL_ITEMS.forEach(b => catTotals[b.dex + "·" + b.cat] = (catTotals[b.dex + "·" + b.cat] || 0) + 1);
  return { total: state.logged.size, countries: countries.size, legendaries, byCat, catTotals, catalogTotal: ALL_ITEMS.length, legTotal: ALL_LEG_TOTAL };
}

function checkNewBadges() {
  const stats = computeStats();
  BADGES.forEach(badge => {
    if (!state.earnedBadges.has(badge.id) && badge.test(stats)) {
      state.earnedBadges.add(badge.id);
      setTimeout(() => toast(`Honor earned — ${badge.name}`), 1800);
    }
  });
}

const PASS_QUOTES = [
  '"The room remembers every one."',
  '"Filled only by living."',
  '"Some strangers are worth the wait."',
  '"Slowly, and with great attention."'
];

function renderProfile() {
  const s = computeStats();
  $("profile-email").textContent = state.user.email + (DEMO_MODE ? " · demo" : "");
  $("stat-total").textContent = s.total;
  $("stat-countries").textContent = s.countries;
  $("stat-legendaries").innerHTML = s.legendaries + `<span class="stat-frac">/${ALL_LEG_TOTAL}</span>`;
  $("stat-pct").textContent = Math.round((s.total / ALL_ITEMS.length) * 100) + "%";
  $("pass-quote").textContent = PASS_QUOTES[Math.min(PASS_QUOTES.length - 1, Math.floor(s.total / 100))];

  const alcoholLogged = new Set([...state.logged].filter(id => byId[id] && byId[id].dex === "alcohol"));
  const taste = tasteProfile(alcoholLogged);
  $("taste-section").classList.toggle("hidden", !taste);
  if (taste) {
    $("taste-line").innerHTML = `Your palate leans <em>${taste.topTags.join(" · ")}</em>. Home shelf: ${taste.homeCat} (${taste.homeN} met). You favor ${taste.strength} — averaging ${taste.avgAbv}%.` +
      (taste.favorite ? ` Highest verdict: <em>${taste.favorite.name}</em>.` : "");
  }
  renderCircle();
  $("btn-sound").textContent = "The clink: " + (clink.on ? "on" : "off");

  $("category-progress").innerHTML = DEXES.map(d => {
    const { n, total } = dexCount(d.id);
    return `<div class="cat-row dex-row" data-dex="${d.id}" role="button" tabindex="0" style="--dexac:${d.accent}">
      <span class="cat-name"><span class="dex-row-glyph">${d.glyph}</span> ${d.name}</span>
      <span class="cat-count">${n} <span class="of">/ ${total}</span></span>
    </div>`;
  }).join("");
  $("category-progress").querySelectorAll(".dex-row").forEach(el => {
    const go = () => { setDex(el.dataset.dex); showPage("dex"); };
    el.addEventListener("click", go);
    el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });

  $("badge-grid").innerHTML = BADGES.map(b => {
    const earned = b.test(s);
    return `<div class="badge ${earned ? "earned" : ""}">
      <span class="badge-icon">${BADGE_ICONS[b.id] || ""}</span>
      <span><span class="badge-name">${b.name}</span><div class="badge-desc">${b.desc}</div></span>
    </div>`;
  }).join("");
}

// ---------------------- THE CIRCLE ------------------------
async function renderCircle() {
  const box = $("circle-body");
  if (DEMO_MODE) { box.innerHTML = '<p class="circle-note">The Circle opens with a live account.</p>'; return; }
  const p = circle.profile || await circle.loadProfile();
  const rows = await circle.leaderboard();
  let html = `<p class="circle-note">Your code: <span class="code">${p ? p.friend_code : "…"}</span> — trade codes to compare passports.</p>`;
  if (rows && rows.length) {
    html += rows.map((r, i) => {
      const me = r.uid === state.user.id;
      return `<div class="cat-row ${me ? "me" : ""}">
        <span class="cat-name">${i + 1}. ${me ? (p.handle + " — you") : r.handle}</span>
        <span class="cat-count">${r.total} <span class="of">met</span> · <span class="gold">${r.legendaries}◆</span></span>
      </div>`;
    }).join("");
  }
  html += `<div class="circle-add"><input type="text" id="friend-code" placeholder="Friend's code…" maxlength="6" autocomplete="off" />
    <button id="btn-add-friend" class="btn btn-quiet">Add to circle</button></div>
    <p class="circle-note" id="circle-msg"></p>`;
  box.innerHTML = html;
  $("btn-add-friend").addEventListener("click", async () => {
    const res = await circle.addFriend($("friend-code").value);
    $("circle-msg").textContent = res.ok ? `${res.handle} joins your circle.` : res.msg;
    if (res.ok) setTimeout(renderCircle, 900);
  });
}

function prizeFind() {
  const legs = [...state.logged].map(id => byId[id]).filter(b => b && b.leg);
  if (legs.length) return { label: "Prize find", name: legs[0].name, leg: true };
  const rated = [...state.logged].filter(id => state.ratings[id] >= 4).sort((a, z) => state.ratings[z] - state.ratings[a]);
  if (rated.length) return { label: "Highest verdict", name: byId[rated[0]].name, leg: false };
  return null;
}

// --------------------- TOAST & CONFETTI -------------------
let toastTimer;
function toast(text, legend = false) {
  const t = $("toast");
  t.textContent = text;
  t.className = "toast" + (legend ? " legend" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), legend ? 4500 : 2800);
}

function confettiBurst() {
  const canvas = $("confetti");
  const ctx = canvas.getContext("2d");
  canvas.width = innerWidth; canvas.height = innerHeight;
  const colors = ["#F6D889", "#D49634", "#C9A45C", "#FFF3D6", "#B7791E"];
  const parts = Array.from({ length: 130 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 220,
    y: innerHeight / 2,
    vx: (Math.random() - 0.5) * 12,
    vy: -Math.random() * 13 - 3,
    size: Math.random() * 6 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.25
  }));
  let frames = 0;
  (function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    if (++frames < 170) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  })();
}

// ------------------------- INIT --------------------------
document.addEventListener("DOMContentLoaded", async () => {
  $("age-yes").addEventListener("click", () => { localStorage.setItem("adex_age_ok", "1"); startAuthFlow(); });
  $("age-no").addEventListener("click", () => {
    document.querySelector("#view-agegate .gate-inner").innerHTML =
      '<span class="wordmark">A l c o h o l D e x</span><p class="gate-line" style="margin-top:2.5rem">The door stays closed a little longer. See you at eighteen.</p>';
  });
  $("tab-signin").addEventListener("click", () => setAuthMode("signin"));
  $("tab-signup").addEventListener("click", () => setAuthMode("signup"));
  $("auth-form").addEventListener("submit", handleAuth);
  $("nav-home").addEventListener("click", () => showPage("home"));
  $("nav-dex").addEventListener("click", () => showPage("dex"));
  $("nav-profile").addEventListener("click", () => showPage("profile"));
  $("cta-enter").addEventListener("click", () => {
    const grid = $("dex-grid-home");
    if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
    else showPage("dex");
  });
  $("btn-signout").addEventListener("click", signOut);
  $("btn-share").addEventListener("click", () => {
    const stats = computeStats();
    const dates = Object.values(state.metAt).filter(Boolean).sort();
    const memberSince = dates.length ? (d => MONTHS[d.getMonth()] + " " + d.getFullYear())(new Date(dates[0])) : null;
    sharePassport(stats, {
      handle: circle.profile ? circle.profile.handle : (state.user.email || "").split("@")[0],
      memberSince,
      taste: tasteProfile(new Set([...state.logged].filter(id => byId[id] && byId[id].dex === "alcohol"))),
      prize: prizeFind(),
      honorsEarned: BADGES.filter(b => b.test(stats)).length,
      honorsTotal: BADGES.length
    });
  });
  $("btn-sound").addEventListener("click", () => { clink.toggle(); $("btn-sound").textContent = "The clink: " + (clink.on ? "on" : "off"); });
  $("search").addEventListener("input", e => { state.search = e.target.value; renderGrid(); });
  $("bartender-go").addEventListener("click", runBartender);
  $("bartender-input").addEventListener("keydown", e => { if (e.key === "Enter") runBartender(); });
  $("bartender-input").addEventListener("input", runBartender);
  $("filter-undiscovered").addEventListener("change", e => { state.hideDiscovered = e.target.checked; renderGrid(); });
  $("filter-reveal").addEventListener("change", e => setReveal(e.target.checked));
  $("modal-close").addEventListener("click", closeModal);
  $("modal-backdrop").addEventListener("click", closeModal);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
  $("btn-log").addEventListener("click", logBottle);
  $("btn-unlog").addEventListener("click", unlogBottle);
  if (DEMO_MODE) $("demo-note").hidden = false;

  if (!localStorage.getItem("adex_age_ok")) { show("view-agegate"); return; }
  startAuthFlow();
});

async function startAuthFlow() {
  const restored = await restoreSession();
  if (!restored) show("view-auth");
}
