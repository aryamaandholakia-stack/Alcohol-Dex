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
const TIER_NAMES = { c: "Common", u: "Uncommon", r: "Rare", l: "Legendary" };
const INDEX_IN_DEX = {};
Object.keys(CATALOGS).forEach(k => CATALOGS[k].forEach((b, i) => INDEX_IN_DEX[b.id] = { no: i + 1, of: CATALOGS[k].length }));

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

function editorsOn() { return localStorage.getItem("adex_mode") === "editors"; }
function setEditors(on) {
  localStorage.setItem("adex_mode", on ? "editors" : "house");
  document.body.classList.toggle("editors", on);
  if (window.wovenSetMode) window.wovenSetMode(on);
  const b = $("btn-mode");
  if (b) b.textContent = on ? "House mode" : "Editor's mode";
}

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
  const q = $("dex-quote"); if (q) q.innerHTML = `“${bourdainQuote()}” <span class="q-attr">— Anthony Bourdain</span>`;
  const rw = $("reveal-wrap");
  if (rw) {
    rw.style.display = d.hunt ? "none" : "";
    const fr = $("filter-reveal"); if (fr) fr.checked = revealOn();
  }
  buildChips();
  renderGrid();
  updateCounter();
  renderDexGems();
  renderIntake();
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
  DEXES.forEach(d => { const ds = dexBadgeStats(d.id); DEX_BADGES.filter(b => b.dex === d.id).forEach(b => { if (b.test(ds)) state.earnedBadges.add(b.id); }); });
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
  state.page = page;
  ["home", "dex", "globe", "profile"].forEach(p => {
    $("page-" + p).classList.toggle("hidden", p !== page);
    $("nav-" + p).classList.toggle("active", p === page);
  });
  if (page === "profile") renderProfile();
  if (page === "globe" && window.renderGlobe) renderGlobe();
  if (page === "home") renderDexHome();
  const hq = $("home-quote");
  if (page === "home" && hq) hq.innerHTML = `“${bourdainQuote()}” <span class="q-attr">— Anthony Bourdain</span>`;
  if (window.armRise) armRise();
  window.scrollTo({ top: 0 });
}

// --------------------- TRIP MODE ---------------------------
function tripSearch(q) {
  q = q.trim().toLowerCase();
  if (q.length < 3) return [];
  const toks = q.split(/\s+/);
  const hits = ALL_ITEMS.filter(b => {
    const hay = (b.country + " " + b.name + " " + b.style + " " + (b.tags || []).join(" ")).toLowerCase();
    return toks.every(t => hay.includes(t));
  });
  const byDex = {};
  hits.forEach(b => { (byDex[b.dex] = byDex[b.dex] || []).push(b); });
  return DEXES.filter(d => byDex[d.id]).map(d => ({ dex: d, items: byDex[d.id].sort((a, b) => (state.logged.has(a.id) ? 1 : 0) - (state.logged.has(b.id) ? 1 : 0)) }));
}

function renderTrip() {
  const q = $("trip-input").value;
  const out = $("trip-results");
  const groups = tripSearch(q);
  if (q.trim().length < 3) { out.innerHTML = ""; return; }
  if (!groups.length) {
    out.innerHTML = `<div class="bartender-miss">Nothing on the shelves for "${q}" yet — try the country name, or a city like Tokyo, Hanoi, Lisbon.</div>`;
    return;
  }
  const open = groups.reduce((n, g) => n + g.items.filter(b => !state.logged.has(b.id)).length, 0);
  out.innerHTML = `<p class="lede" style="margin:1rem 0 1.2rem">${open} still uncollected here. A decent itinerary writes itself.</p>` +
    groups.map(g => `
    <div class="trip-group" style="--dexac:${g.dex.accent}">
      <div class="trip-group-head"><span class="dex-row-glyph">${g.dex.glyph}</span>${g.dex.name}<span class="trip-count">${g.items.filter(b => state.logged.has(b.id)).length} / ${g.items.length}</span></div>
      <div class="trip-items">${g.items.map(b => {
        const got = state.logged.has(b.id);
        const hunt = DEX_BY_ID[b.dex].hunt;
        const label = got || !hunt ? b.name : "— — —";
        return `<button class="trip-item ${got ? "got" : ""}" data-id="${b.id}">${got ? "◆ " : "◇ "}${label}<span class="trip-sub">${got ? DEX_BY_ID[b.dex].verb : b.cat}</span></button>`;
      }).join("")}</div>
    </div>`).join("");
  out.querySelectorAll(".trip-item").forEach(el => el.addEventListener("click", () => {
    const b = byId[el.dataset.id];
    if (b && !DEX_BY_ID[b.dex].hunt && !state.logged.has(b.id)) b._trip = true;   // allow full peek from trip planning
    openModal(el.dataset.id);
  }));
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
  const dexes = DEXES.filter(d => d.group === "dex");
  const lists = DEXES.filter(d => d.group === "list");
  grid.innerHTML =
    `<div class="dex-section-label rise">The Collector's Dex — what you hunt and keep</div>` +
    dexes.map(d => box(d, "dexbox-flagship")).join("") +
    `<div class="dex-section-label rise" style="margin-top:1.6rem">The List — everything to live before it's over</div>` +
    lists.map(d => box(d, "")).join("");
  grid.querySelectorAll(".dexbox").forEach(el => {
    const go = () => { setDex(el.dataset.dex); showPage("dex"); };
    el.addEventListener("click", go);
    el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
  const gTotal = $("global-count");
  if (gTotal) gTotal.textContent = state.logged.size;
  if (window.armRise) armRise();
}

function intakeDone() { return localStorage.getItem("adex_intake_" + state.dex) === "1"; }
function dexCollectedCount() { return dItems.reduce((n, b) => n + (state.logged.has(b.id) ? 1 : 0), 0); }

function renderIntake() {
  const box = $("intake");
  if (!box) return;
  const d = curDex();
  const ids = (typeof DEX_INTAKE !== "undefined" && DEX_INTAKE[d.id]) || [];
  const show = !state.ledger && !d.hunt && ids.length && !intakeDone() && dexCollectedCount() === 0;
  box.classList.toggle("hidden", !show);
  if (!show) { box.innerHTML = ""; return; }
  box.innerHTML = `
    <div class="intake-head"><span class="eyebrow">${d.character} asks</span>
    <h3 class="intake-q">Before we start — any of these already ${d.verb}?</h3></div>
    <div class="intake-chips">${ids.map(id => byId[id]).filter(Boolean).map(b =>
      `<button class="intake-chip" data-id="${b.id}">${b.name}</button>`).join("")}</div>
    <div class="intake-actions">
      <button class="btn" id="intake-log" disabled>Log 0</button>
      <button class="navbtn" id="intake-skip">Fresh start — skip</button>
    </div>`;
  const picked = new Set();
  const logBtn = box.querySelector("#intake-log");
  box.querySelectorAll(".intake-chip").forEach(ch => ch.addEventListener("click", () => {
    const id = ch.dataset.id;
    picked.has(id) ? picked.delete(id) : picked.add(id);
    ch.classList.toggle("on", picked.has(id));
    logBtn.disabled = !picked.size;
    logBtn.textContent = "Log " + picked.size;
  }));
  logBtn.addEventListener("click", async () => {
    for (const id of picked) {
      state.logged.add(id);
      state.metAt[id] = new Date().toISOString();
      await store.addLog(id);
    }
    localStorage.setItem("adex_intake_" + state.dex, "1");
    playClink(false);
    toast(`${picked.size} logged. The ledger opens well.`);
    updateCounter(); renderGrid(); renderDexGems(); renderIntake(); checkNewBadges();
  });
  box.querySelector("#intake-skip").addEventListener("click", () => {
    localStorage.setItem("adex_intake_" + state.dex, "1");
    renderIntake();
  });
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
    const tcls = b.tier ? "tier-" + b.tier : "";
    return `<div class="card ${found ? "" : "locked"} ${peek ? "peek" : ""} ${b.leg ? "legendary" : ""} ${tcls}" data-id="${b.id}" tabindex="0" role="button" aria-label="${found || peek ? b.name : "A stranger — " + b.cat}">
      <div class="card-media bottle-wrap">
        <div class="bottle-svg ${curDex().art === "stamp" ? "stamp-svg" : ""} ${peek ? "ghost" : ""}">${itemArt(b, found || peek)}</div>
        ${(found || peek) ? "" : '<div class="shimmer"></div>'}
        ${found ? `<div class="card-badges">${b.tags.slice(0, 2).map(t => `<span class="fbadge">${t}</span>`).join("")}</div>` : ""}
        ${found && !state.ledger && state.ratings[b.id] ? `<span class="fbadge fbadge-rate">★ ${state.ratings[b.id]}</span>` : found && b.leg ? `<span class="fbadge fbadge-rate gold">◆</span>` : ""}
      </div>
      <div class="card-body">
        <div class="card-toprow"><span class="card-name">${found || peek ? b.name : "— — —"}</span>${b.leg && (found || peek) ? '<span class="fbadge fbadge-outline">One of ' + curDex().legName + "</span>" : ""}</div>
        <div class="card-sub">${found ? b.country : peek ? b.country + " · not yet " + curDex().verb : (b.tier && b.tier !== "l" ? "A " + TIER_NAMES[b.tier].toLowerCase() + " stranger · " : "A stranger · ") + b.cat}</div>
        <div class="card-meta"><span class="card-no">№ ${String((INDEX_IN_DEX[b.id] || {no:0}).no).padStart(3, "0")}<span class="card-tiermark ${b.tier ? "tm-" + b.tier : ""}" style="margin-left:8px">${b.leg ? "◆" : b.tier === "r" ? "●●●" : b.tier === "u" ? "●●○" : b.tier === "c" ? "●○○" : ""}</span></span><span class="card-open">${found ? "Revisit" : "Open"} <span class="card-arrow">→</span></span></div>
      </div>
    </div>`;
  }).join("") || `<p style="color:var(--dim);grid-column:1/-1;text-align:center;padding:3rem 0;font-family:var(--serif);font-style:italic">The shelf is empty. Adjust your filters.</p>`;

  const io = ("IntersectionObserver" in window) ? new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }) : null;
  $("bottle-grid").querySelectorAll(".card").forEach((el, i) => {
    el.style.setProperty("--stagger", (i % 8) * 60 + "ms");
    if (io) io.observe(el); else el.classList.add("in");
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
  const peek = !found && !d.hunt && (localStorage.getItem("adex_reveal_" + b.dex) === "1" || b._trip === true);
  const card = $("modal-card");
  card.classList.remove("revealing", "revealed", "legend-reveal");

  const ix = INDEX_IN_DEX[b.id] || { no: 0, of: dItems.length };
  const no = String(ix.no).padStart(3, "0");
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
  const shareBtn = $("m-share");
  if (shareBtn) { shareBtn.classList.toggle("hidden", !found); shareBtn.onclick = () => shareItem(b); }
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
  if (state.ledger) circles.log(state.ledger.id, b.id, b.dex); else store.addLog(b.id);

  const d = DEX_BY_ID[b.dex];
  const card = $("modal-card");
  $("modal-bottle").innerHTML = itemArt(b, true, true);
  card.classList.add("revealing", "revealed");
  if (b.leg) card.classList.add("legend-reveal");

  setTimeout(() => {
    const ix2 = INDEX_IN_DEX[b.id] || { no: 0, of: dItems.length };
    const tW = b.tier && b.tier !== "l" ? TIER_NAMES[b.tier] + " · " : "";
    $("m-eyebrow").textContent = b.leg ? `◆ One of ${d.legName} · ${b.style}` : `${tW}${b.cat} · ${b.style} · No. ${ix2.no} of ${ix2.of}`;
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
  checkNewBadges(b.dex);
}

async function unlogBottle() {
  if (!modalBottle) return;
  state.logged.delete(modalBottle.id);
  delete state.metAt[modalBottle.id];
  if (state.ledger) circles.unlog(state.ledger.id, modalBottle.id, modalBottle.dex); else store.removeLog(modalBottle.id);
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

let passScope = "all";   // "all" | dexId
// Active ledger: null = personal, or {id, name, code, members} = a circle
let personal = { logged: null, metAt: null };
function ledgerActive() { return !!state.ledger; }
async function switchLedger(circle) {
  if (!circle) {
    state.ledger = null;
    if (personal.logged) { state.logged = personal.logged; state.metAt = personal.metAt; }
  } else {
    if (!state.ledger && !personal.logged) { personal.logged = state.logged; personal.metAt = state.metAt; }
    else if (!state.ledger) { personal.logged = state.logged; personal.metAt = state.metAt; }
    state.ledger = circle;
    const rows = await circles.logs(circle.id);
    state.logged = new Set(rows.map(r => r.bottle_id).filter(id => byId[id]));
    state.metAt = {};
    rows.forEach(r => { if (byId[r.bottle_id]) state.metAt[r.bottle_id] = r.logged_at; });
  }
  updateCounter();
  renderLedgerSelect();
  if (state.page === "dex") { renderGrid(); renderDexGems(); renderIntake(); }
  if (state.page === "profile") renderProfile();
  if (state.page === "globe" && window.renderGlobe) renderGlobe();
  toast(circle ? `Ledger: ${circle.name} — ticks count for everyone.` : "Ledger: your own passport.");
}

function renderLedgerSelect() {
  document.querySelectorAll(".ledger-select").forEach(sel => {
    const opts = [`<option value="">My passport</option>`]
      .concat((circles.mine || []).map(c => `<option value="${c.id}" ${state.ledger && state.ledger.id === c.id ? "selected" : ""}>◍ ${c.name}</option>`));
    sel.innerHTML = opts.join("");
    sel.onchange = () => {
      const c = (circles.mine || []).find(x => x.id === sel.value) || null;
      switchLedger(c);
    };
    if (!state.ledger) sel.value = "";
  });
}
function dexBadgeStats(dexId) {
  const pool = CATALOGS[dexId] || [];
  let total = 0, legs = 0;
  pool.forEach(b => { if (state.logged.has(b.id)) { total++; if (b.leg) legs++; } });
  return { total, legs, catalogTotal: pool.length, legTotal: pool.filter(b => b.leg).length };
}
function scopedStats(scope) {
  const pool = scope === "all" ? ALL_ITEMS : (CATALOGS[scope] || []);
  const ids = new Set(pool.map(b => b.id));
  const logged = [...state.logged].filter(id => ids.has(id));
  const countries = new Set(logged.map(id => byId[id] && byId[id].country).filter(Boolean));
  const legendaries = logged.filter(id => byId[id] && byId[id].leg).length;
  return { total: logged.length, countries: countries.size, legendaries,
           legTotal: pool.filter(b => b.leg).length, catalogTotal: pool.length, loggedIds: logged };
}

function renderProfile() {
  const s = computeStats();
  const sc = scopedStats(passScope);
  const scopeDex = passScope === "all" ? null : DEX_BY_ID[passScope];
  const led = state.ledger;
  const ph = document.querySelector(".passport-head .eyebrow");
  if (ph) ph.textContent = led ? "The Circle Passport — ◍ " + led.name : "The Passport";
  const pe = $("profile-email");
  if (pe) pe.textContent = led ? `Circle code ${led.code} · ${(led.members || []).join(", ")}` : ((state.user && state.user.email) || "");
  const yb = $("btn-year"); if (yb) yb.classList.toggle("hidden", !!led);

  // scope chips
  const chipsBox = $("pass-scope");
  if (chipsBox) {
    chipsBox.innerHTML = [`<button class="chip ${passScope === "all" ? "on" : ""}" data-s="all">One Passport</button>`]
      .concat(DEXES.map(d => `<button class="chip ${passScope === d.id ? "on" : ""}" data-s="${d.id}" style="--dexac:${d.accent}">${d.glyph} ${d.name}</button>`)).join("");
    chipsBox.querySelectorAll(".chip").forEach(c => c.addEventListener("click", () => { passScope = c.dataset.s; renderProfile(); }));
  }
  $("profile-email").textContent = state.user.email + (DEMO_MODE ? " · demo" : "");
  $("stat-total").textContent = sc.total;
  $("stat-countries").textContent = sc.countries;
  $("stat-legendaries").innerHTML = sc.legendaries + `<span class="stat-frac">/${sc.legTotal}</span>`;
  $("stat-pct").textContent = sc.catalogTotal ? Math.round((sc.total / sc.catalogTotal) * 100) + "%" : "0%";
  document.querySelectorAll(".pass-total").forEach(el => el.textContent = sc.catalogTotal);
  const passSub = document.querySelector(".pass-sub");
  if (passSub) passSub.textContent = scopeDex ? `${scopeDex.verb} in ${scopeDex.name}` : "collected, across every dex";
  $("pass-quote").textContent = PASS_QUOTES[Math.min(PASS_QUOTES.length - 1, Math.floor(s.total / 100))];
  const pq = $("pass-bourdain"); if (pq) pq.innerHTML = `“${bourdainQuote()}” <span class="q-attr">— Anthony Bourdain</span>`;

  const alcoholLogged = new Set([...state.logged].filter(id => byId[id] && byId[id].dex === "alcohol"));
  const taste = (!state.ledger && (passScope === "all" || passScope === "alcohol")) ? tasteProfile(alcoholLogged) : null;
  $("taste-section").classList.toggle("hidden", !taste);
  if (taste) {
    $("taste-line").innerHTML = `Your palate leans <em>${taste.topTags.join(" · ")}</em>. Home shelf: ${taste.homeCat} (${taste.homeN} met). You favor ${taste.strength} — averaging ${taste.avgAbv}%.` +
      (taste.favorite ? ` Highest verdict: <em>${taste.favorite.name}</em>.` : "");
  }
  renderCircle();
  circles.list().then(renderLedgerSelect);
  $("btn-sound").textContent = "The clink: " + (clink.on ? "on" : "off");

  $("ledger-section").classList.toggle("hidden", passScope !== "all");
  $("badges-section").classList.remove("hidden");
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

  if (passScope !== "all") {
    const ds = dexBadgeStats(passScope);
    $("badge-grid").innerHTML = DEX_BADGES.filter(b => b.dex === passScope).map(b => {
      const earned = b.test(ds);
      return `<div class="badge ${earned ? "earned" : ""}" title="${b.desc}">
        <span class="badge-icon">${earned ? "◆" : "◇"}</span>
        <span><span class="badge-name">${b.name}</span><div class="badge-desc">${b.desc}</div></span></div>`;
    }).join("");
    return;
  }
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
  if (DEMO_MODE || !sb) { box.innerHTML = '<p class="circle-note">Circles open with a live account.</p>'; return; }
  await circle.loadProfile();
  const mine = await circles.list();
  renderLedgerSelect();
  let html = `<p class="circle-note">A circle is a shared passport — one tick counts for everyone in it. Three per person, like the good things.</p>`;
  html += mine.map(c => `
    <div class="cat-row circle-row" style="align-items:center">
      <span class="cat-name">◍ ${c.name}<span class="circle-meta"> · ${c.members.length} ${c.members.length === 1 ? "member" : "members"} · ${c.members.join(", ")}</span></span>
      <span class="circle-actions">
        <span class="code" title="Share this code">${c.code}</span>
        <button class="navbtn c-open" data-id="${c.id}">Open</button>
        <button class="navbtn c-leave" data-id="${c.id}">Leave</button>
      </span>
    </div>`).join("");
  if (mine.length < 3) {
    html += `<div class="circle-add">
      <input type="text" id="circle-name" placeholder="New circle name…" maxlength="40" autocomplete="off" />
      <button id="btn-create-circle" class="btn btn-quiet">Create</button>
    </div>
    <div class="circle-add">
      <input type="text" id="circle-code" placeholder="Join with a code…" maxlength="6" autocomplete="off" />
      <button id="btn-join-circle" class="btn btn-quiet">Join</button>
    </div>`;
  } else {
    html += `<p class="circle-note">You're at three circles — the house limit.</p>`;
  }
  html += `<p class="circle-note" id="circle-msg"></p>`;
  box.innerHTML = html;

  const msg = t => { const m = $("circle-msg"); if (m) m.textContent = t; };
  box.querySelectorAll(".c-open").forEach(b => b.addEventListener("click", () => {
    const c = mine.find(x => x.id === b.dataset.id);
    if (c) { switchLedger(c); renderProfile(); }
  }));
  box.querySelectorAll(".c-leave").forEach(b => b.addEventListener("click", async () => {
    await circles.leave(b.dataset.id);
    if (state.ledger && state.ledger.id === b.dataset.id) await switchLedger(null);
    renderCircle();
  }));
  const bc = $("btn-create-circle");
  if (bc) bc.addEventListener("click", async () => {
    const name = ($("circle-name").value || "").trim();
    if (!name) { msg("A circle needs a name."); return; }
    const res = await circles.create(name);
    if (!res.ok) { msg(res.msg); return; }
    msg(`${res.circle.name} is open — share code ${res.circle.code}.`);
    setTimeout(renderCircle, 900);
  });
  const bj = $("btn-join-circle");
  if (bj) bj.addEventListener("click", async () => {
    const res = await circles.join($("circle-code").value || "");
    if (!res.ok) { msg(res.msg); return; }
    msg(`Welcome to ${res.circle.name}.`);
    setTimeout(renderCircle, 900);
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

// ---------------------- YEAR IN THE REAL WORLD --------------
function yearStats(year) {
  const ids = [...state.logged].filter(id => {
    const at = state.metAt[id];
    return at && new Date(at).getFullYear() === year && byId[id];
  });
  const countries = new Set(ids.map(id => byId[id].country));
  const legendaries = ids.filter(id => byId[id].leg).length;
  const byDex = {};
  ids.forEach(id => byDex[byId[id].dex] = (byDex[byId[id].dex] || 0) + 1);
  const topDex = Object.entries(byDex).sort((a, b) => b[1] - a[1])[0];
  return { total: ids.length, countries: countries.size, legendaries,
           legTotal: ALL_LEG_TOTAL, catalogTotal: ALL_ITEMS.length,
           topDex: topDex ? DEX_BY_ID[topDex[0]].name : null, ids };
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
  $("nav-globe").addEventListener("click", () => showPage("globe"));
  $("cta-enter").addEventListener("click", () => {
    const grid = $("dex-grid-home");
    if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
    else showPage("dex");
  });
  $("btn-signout").addEventListener("click", signOut);
  $("btn-share").addEventListener("click", () => {
    const gstats = computeStats();
    const sc = scopedStats(passScope);
    const scopeDex = passScope === "all" ? null : DEX_BY_ID[passScope];
    const dates = Object.values(state.metAt).filter(Boolean).sort();
    const memberSince = dates.length ? (d => MONTHS[d.getMonth()] + " " + d.getFullYear())(new Date(dates[0])) : null;
    sharePassport({ ...gstats, ...sc }, {
      title: scopeDex ? scopeDex.name.toUpperCase().split("").join(" ") : "T H E   P O K É D E X",
      subtitle: "T H E   P A S S P O R T",
      legLabel: scopeDex ? scopeDex.legName.toUpperCase() : "LEGENDARIES",
      handle: state.ledger ? "◍ " + state.ledger.name : (circle.profile ? circle.profile.handle : (state.user.email || "").split("@")[0]),
      memberSince,
      taste: (passScope === "all" || passScope === "alcohol") ? tasteProfile(new Set([...state.logged].filter(id => byId[id] && byId[id].dex === "alcohol"))) : null,
      prize: passScope === "all" ? prizeFind() : null,
      honorsEarned: BADGES.filter(b => b.test(gstats)).length,
      honorsTotal: BADGES.length
    });
  });
  $("btn-year").addEventListener("click", () => {
    const year = new Date().getFullYear();
    const ys = yearStats(year);
    if (!ys.total) { toast("Nothing in the ledger for " + year + " yet."); return; }
    const rare = ys.ids.map(id => byId[id]).filter(b => b.leg)[0] || byId[ys.ids[ys.ids.length - 1]];
    sharePassport(ys, {
      title: String(year).split("").join(" "),
      subtitle: "A   Y E A R   I N   T H E   R E A L   W O R L D",
      legLabel: "LEGENDARIES THIS YEAR",
      handle: circle.profile ? circle.profile.handle : (state.user.email || "").split("@")[0],
      sinceLine: ys.topDex ? "MOST LIVED: " + ys.topDex : null,
      taste: null,
      prize: rare ? { label: "find of the year", name: rare.name, leg: !!rare.leg } : null,
      honorsEarned: BADGES.filter(b => b.test(computeStats())).length,
      honorsTotal: BADGES.length
    });
  });
  $("btn-sound").addEventListener("click", () => { clink.toggle(); $("btn-sound").textContent = "The clink: " + (clink.on ? "on" : "off"); });
  $("btn-mode").addEventListener("click", () => setEditors(!editorsOn()));
  setEditors(editorsOn());
  $("search").addEventListener("input", e => { state.search = e.target.value; renderGrid(); });
  const ti = $("trip-input");
  if (ti) { ti.addEventListener("input", renderTrip); ti.addEventListener("keydown", e => { if (e.key === "Enter") renderTrip(); }); }
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
