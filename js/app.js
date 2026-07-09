/* =========================================================
   AlcoholDex v2 — app logic
   Sections: state → data layer → auth → views → dex grid →
   bartender → modal/reveal → badges/passport → init
   ========================================================= */

// ------------------------- STATE -------------------------
const state = {
  user: null,
  logged: new Set(),      // bottle ids met
  metAt: {},              // bottle id → ISO date met
  filterCat: "All",
  search: "",
  hideDiscovered: false,
  earnedBadges: new Set()
};

const CATS = [...new Set(CATALOG.map(b => b.cat))];
const CAT_TOTALS = {};
CATALOG.forEach(b => CAT_TOTALS[b.cat] = (CAT_TOTALS[b.cat] || 0) + 1);
const byId = Object.fromEntries(CATALOG.map(b => [b.id, b]));
const LEG_TOTAL = CATALOG.filter(b => b.leg).length;
const DEX_INDEX = {}; CATALOG.forEach((b, i) => DEX_INDEX[b.id] = i + 1);

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
      if (Array.isArray(parsed)) return parsed.map(id => ({ bottle_id: id, logged_at: null })); // v1 format
      return Object.entries(parsed).map(([id, at]) => ({ bottle_id: id, logged_at: at }));
    }
    const { data, error } = await sb.from("alcoholdex_logs").select("bottle_id, logged_at").eq("user_id", state.user.id);
    if (error) { console.error(error); return []; }
    return data;
  },
  saveDemo() {
    const obj = {};
    state.logged.forEach(id => obj[id] = state.metAt[id] || new Date().toISOString());
    localStorage.setItem("adex_logs_" + state.user.id, JSON.stringify(obj));
  },
  async addLog(bottleId) {
    if (DEMO_MODE) { this.saveDemo(); return true; }
    const { error } = await sb.from("alcoholdex_logs").insert({ user_id: state.user.id, bottle_id: bottleId });
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
  rows.forEach(r => { if (byId[r.bottle_id]) { state.logged.add(r.bottle_id); if (r.logged_at) state.metAt[r.bottle_id] = r.logged_at; } });
  state.earnedBadges = new Set(BADGES.filter(b => b.test(computeStats())).map(b => b.id));
  show("view-app");
  buildChips();
  renderGrid();
  updateCounter();
  renderHomeTwenty();
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
  if (window.armRise) armRise();
  window.scrollTo({ top: 0 });
}

// --------------------- HOME EXTRAS ------------------------
function renderHomeTwenty() {
  const found = CATALOG.filter(b => b.leg && state.logged.has(b.id)).length;
  let s = "";
  for (let i = 0; i < LEG_TOTAL; i++) s += `<span class="gem ${i < found ? "lit-g" : "unlit"}">${i < found ? "◆" : "◇"}</span>`;
  s += `<span class="eyebrow" style="margin-left:0.8rem">${found} of ${LEG_TOTAL}</span>`;
  $("home-twenty").innerHTML = s;
}

// ------------------------ DEX GRID -----------------------
function buildChips() {
  const chips = ["All", ...CATS];
  $("category-chips").innerHTML = chips.map(c =>
    `<button class="chip ${state.filterCat === c ? "active" : ""}" data-cat="${c}">${c}</button>`
  ).join("");
  $("category-chips").querySelectorAll(".chip").forEach(el =>
    el.addEventListener("click", () => { state.filterCat = el.dataset.cat; buildChips(); renderGrid(); })
  );
}

function visibleBottles() {
  const q = state.search.toLowerCase();
  return CATALOG.filter(b => {
    if (state.filterCat !== "All" && b.cat !== state.filterCat) return false;
    if (state.hideDiscovered && state.logged.has(b.id)) return false;
    if (q) {
      const hay = (b.name + " " + b.country + " " + b.style + " " + b.tags.join(" ")).toLowerCase();
      const found = state.logged.has(b.id) ? hay.includes(q) : (b.cat + " " + b.country + " " + b.style).toLowerCase().includes(q);
      if (!found) return false;
    }
    return true;
  });
}

function renderGrid() {
  const bottles = visibleBottles();
  $("bottle-grid").innerHTML = bottles.map(b => {
    const found = state.logged.has(b.id);
    return `<div class="card ${found ? "" : "locked"} ${b.leg ? "legendary" : ""}" data-id="${b.id}" tabindex="0" role="button" aria-label="${found ? b.name : "A stranger — " + b.cat}">
      <div class="bottle-wrap" style="position:relative"><div class="bottle-svg">${bottleSVG(b, found)}</div>${found ? "" : '<div class="shimmer"></div>'}</div>
      <div class="card-name">${found ? b.name : "— — —"}</div>
      <div class="card-sub">${found ? b.country : "A stranger · " + b.cat}</div>
    </div>`;
  }).join("") || `<p style="color:var(--dim);grid-column:1/-1;text-align:center;padding:3rem 0;font-family:var(--serif);font-style:italic">The shelf is empty. Adjust your filters.</p>`;

  $("bottle-grid").querySelectorAll(".card").forEach(el => {
    el.addEventListener("click", () => openModal(el.dataset.id));
    el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(el.dataset.id); } });
  });
}

function updateCounter() {
  const total = CATALOG.length, met = state.logged.size;
  $("counter-found").textContent = met;
  document.querySelectorAll(".counter-total, .pass-total").forEach(el => el.textContent = total);
  const heroTotal = $("hero-total"); if (heroTotal) heroTotal.textContent = total;
  const authTotal = $("auth-total"); if (authTotal) authTotal.textContent = total;
  const strangers = total - met;
  $("dex-line").innerHTML = met === 0
    ? `${total} bottles. Every one a <em>stranger.</em>`
    : `You have met ${met}. The other ${strangers} remain <em>strangers.</em>`;
}

// --------------------- MODAL & REVEAL --------------------
let modalBottle = null;

function fillStats(b) {
  $("m-stats").innerHTML = `
    <div class="mstat"><div class="mstat-v">${b.abv}%</div><div class="mstat-k">Strength</div></div>
    <div class="mstat"><div class="mstat-v">${b.country}</div><div class="mstat-k">Origin</div></div>
    <div class="mstat"><div class="mstat-v gold">${b.serve.split(/[.,—]/)[0]}</div><div class="mstat-k">Serve</div></div>`;
}

function openModal(id) {
  modalBottle = byId[id];
  const b = modalBottle;
  const found = state.logged.has(id);
  const card = $("modal-card");
  card.classList.remove("revealing", "revealed", "legend-reveal");

  const no = String(DEX_INDEX[b.id]).padStart(3, "0");
  $("modal-bottle").innerHTML = bottleSVG(b, found);
  $("m-eyebrow").textContent = found
    ? (b.leg ? `◆ One of The Twenty · ${b.style}` : `${b.cat} · ${b.style} · No. ${no} of ${CATALOG.length}`)
    : `${b.cat} · No. ${no} of ${CATALOG.length}`;
  $("m-eyebrow").classList.toggle("legend", found && !!b.leg);

  $("m-name").textContent = found ? b.name : "— — —";
  $("m-name").classList.toggle("mystery", !found);
  $("m-stats").innerHTML = "";
  if (found) fillStats(b);
  $("m-tags").innerHTML = found ? b.tags.map(t => `<span class="tag">${t}</span>`).join("") : "";
  $("m-mix").innerHTML = found ? '<span class="mix-label">Mix it</span>' + getCocktails(b).map(d => `<span class="tag mix">${d}</span>`).join("") : "";
  $("m-fact").textContent = found ? b.fact : "";
  $("m-fact").style.display = found ? "" : "none";
  $("m-met").textContent = found ? metPhrase(state.metAt[b.id]) : "";
  $("m-hint").textContent = found ? "" : bartenderHint(b);
  $("m-hint").style.display = found ? "none" : "";

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

  const card = $("modal-card");
  $("modal-bottle").innerHTML = bottleSVG(b, true, true);
  card.classList.add("revealing", "revealed");
  if (b.leg) card.classList.add("legend-reveal");

  setTimeout(() => {
    const no = String(DEX_INDEX[b.id]).padStart(3, "0");
    $("m-eyebrow").textContent = b.leg ? `◆ One of The Twenty · ${b.style}` : `${b.cat} · ${b.style} · No. ${no} of ${CATALOG.length}`;
    $("m-eyebrow").classList.toggle("legend", !!b.leg);
    $("m-name").textContent = b.name;
    $("m-name").classList.remove("mystery");
    $("m-name").classList.add("reveal-fade");
    fillStats(b);
    $("m-tags").innerHTML = b.tags.map(t => `<span class="tag">${t}</span>`).join("");
    $("m-mix").innerHTML = '<span class="mix-label">Mix it</span>' + getCocktails(b).map(d => `<span class="tag mix">${d}</span>`).join("");
    $("m-fact").textContent = b.fact;
    $("m-fact").style.display = "";
    $("m-met").textContent = metPhrase(state.metAt[b.id]);
    $("m-hint").style.display = "none";
    ["m-stats", "m-tags", "m-mix", "m-fact", "m-met"].forEach(id => $(id).classList.add("reveal-fade"));
  }, 800);

  $("btn-log").classList.add("hidden");
  $("btn-unlog").classList.remove("hidden");

  if (b.leg) { confettiBurst(); toast("◆ ONE OF THE TWENTY — " + b.name, true); }
  else toast("Met: " + b.name);

  updateCounter();
  renderGrid();
  renderHomeTwenty();
  checkNewBadges();
}

async function unlogBottle() {
  if (!modalBottle) return;
  state.logged.delete(modalBottle.id);
  delete state.metAt[modalBottle.id];
  store.removeLog(modalBottle.id);
  updateCounter();
  renderGrid();
  renderHomeTwenty();
  openModal(modalBottle.id);
}

// ------------------ TELL THE BARTENDER -------------------
function bartenderHint(b) {
  const band = b.abv < 10 ? "a light pour" : b.abv < 25 ? "medium strength" : b.abv < 45 ? "a proper spirit" : "high proof";
  return `From ${b.country}. ${band}. Notes of ${b.tags[0]}.`;
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
  return CATALOG.map(b => {
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
    box.innerHTML = `<div class="bartender-miss">Not on our shelves — the Dex keeps ${CATALOG.length} bottles. Try the brand name, or browse the strangers for a hint.</div>`;
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

// ---------------------- BADGES & STATS -------------------
function computeStats() {
  const byCat = {};
  const countries = new Set();
  let legendaries = 0;
  state.logged.forEach(id => {
    const b = byId[id];
    if (!b) return;
    byCat[b.cat] = (byCat[b.cat] || 0) + 1;
    countries.add(b.country);
    if (b.leg) legendaries++;
  });
  return { total: state.logged.size, countries: countries.size, legendaries, byCat, catTotals: CAT_TOTALS, catalogTotal: CATALOG.length, legTotal: LEG_TOTAL };
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
  $("stat-legendaries").innerHTML = s.legendaries + `<span class="stat-frac">/${LEG_TOTAL}</span>`;
  $("stat-pct").textContent = Math.round((s.total / CATALOG.length) * 100) + "%";
  $("pass-quote").textContent = PASS_QUOTES[Math.min(PASS_QUOTES.length - 1, Math.floor(s.total / 100))];

  $("category-progress").innerHTML = CATS.map(c => {
    const n = s.byCat[c] || 0, t = CAT_TOTALS[c];
    return `<div class="cat-row"><span class="cat-name">${c}</span><span class="cat-count">${n} <span class="of">/ ${t}</span></span></div>`;
  }).join("");

  $("badge-grid").innerHTML = BADGES.map(b => {
    const earned = b.test(s);
    return `<div class="badge ${earned ? "earned" : ""}">
      <span class="badge-icon">${earned ? "◆" : "◇"}</span>
      <span><span class="badge-name">${b.name}</span><div class="badge-desc">${b.desc}</div></span>
    </div>`;
  }).join("");
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
  $("cta-enter").addEventListener("click", () => showPage("dex"));
  $("btn-signout").addEventListener("click", signOut);
  $("btn-share").addEventListener("click", () => sharePassport(computeStats()));
  $("search").addEventListener("input", e => { state.search = e.target.value; renderGrid(); });
  $("bartender-go").addEventListener("click", runBartender);
  $("bartender-input").addEventListener("keydown", e => { if (e.key === "Enter") runBartender(); });
  $("bartender-input").addEventListener("input", runBartender);
  $("filter-undiscovered").addEventListener("change", e => { state.hideDiscovered = e.target.checked; renderGrid(); });
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
