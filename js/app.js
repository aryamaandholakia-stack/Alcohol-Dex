/* =========================================================
   AlcoholDex — main app logic
   Sections: state → data layer (Supabase/demo) → auth →
   dex grid → modal & reveal → badges/profile → confetti
   ========================================================= */

// ------------------------- STATE -------------------------
const state = {
  user: null,            // { id, email }
  logged: new Set(),     // bottle ids the user has logged
  filterCat: "All",
  search: "",
  hideDiscovered: false,
  earnedBadges: new Set()
};

const CATS = [...new Set(CATALOG.map(b => b.cat))];
const CAT_TOTALS = {};
CATALOG.forEach(b => CAT_TOTALS[b.cat] = (CAT_TOTALS[b.cat] || 0) + 1);
const byId = Object.fromEntries(CATALOG.map(b => [b.id, b]));

const $ = id => document.getElementById(id);
let sb = null;
if (!DEMO_MODE) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --------------------- DATA LAYER ------------------------
// Demo mode → localStorage. Real mode → Supabase "logs" table.
const store = {
  async loadLogs() {
    if (DEMO_MODE) {
      const raw = localStorage.getItem("adex_logs_" + state.user.id);
      return raw ? JSON.parse(raw) : [];
    }
    const { data, error } = await sb.from("alcoholdex_logs").select("bottle_id").eq("user_id", state.user.id);
    if (error) { console.error(error); return []; }
    return data.map(r => r.bottle_id);
  },
  async addLog(bottleId) {
    if (DEMO_MODE) {
      localStorage.setItem("adex_logs_" + state.user.id, JSON.stringify([...state.logged]));
      return true;
    }
    const { error } = await sb.from("alcoholdex_logs").insert({ user_id: state.user.id, bottle_id: bottleId });
    if (error) console.error(error);
    return !error;
  },
  async removeLog(bottleId) {
    if (DEMO_MODE) {
      localStorage.setItem("adex_logs_" + state.user.id, JSON.stringify([...state.logged]));
      return true;
    }
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
  $("auth-submit").textContent = mode === "signin" ? "Sign in" : "Create account";
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
    // Local demo accounts (device-only). Not secure — for previewing.
    const users = JSON.parse(localStorage.getItem("adex_users") || "{}");
    if (authMode === "signup") {
      if (users[email]) { msg.textContent = "That email already has a demo account here."; return; }
      users[email] = { pw: password, id: "demo_" + btoa(email).replace(/[^a-z0-9]/gi, "") };
      localStorage.setItem("adex_users", JSON.stringify(users));
    } else {
      if (!users[email] || users[email].pw !== password) { msg.textContent = "No match. Check email and password, or create an account."; return; }
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
      msg.textContent = "Check your inbox to confirm your email, then sign in.";
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
  const logs = await store.loadLogs();
  state.logged = new Set(logs.filter(id => byId[id]));
  // Pre-mark already-earned badges so they don't re-toast
  state.earnedBadges = new Set(BADGES.filter(b => b.test(computeStats())).map(b => b.id));
  show("view-app");
  buildChips();
  renderGrid();
  updateCounter();
  showPage("dex");
}

// ---------------------- VIEW SWITCH ----------------------
function show(viewId) {
  ["view-agegate", "view-auth", "view-app"].forEach(v => $(v).classList.toggle("hidden", v !== viewId));
}
function showPage(page) {
  $("page-dex").classList.toggle("hidden", page !== "dex");
  $("page-profile").classList.toggle("hidden", page !== "profile");
  $("nav-dex").classList.toggle("active", page === "dex");
  $("nav-profile").classList.toggle("active", page === "profile");
  if (page === "profile") renderProfile();
}

// ------------------------ DEX GRID -----------------------
function buildChips() {
  const chips = ["All", ...CATS];
  $("category-chips").innerHTML = chips.map(c => {
    const count = c === "All" ? CATALOG.length : CAT_TOTALS[c];
    return `<button class="chip ${state.filterCat === c ? "active" : ""}" data-cat="${c}">${c}<span class="chip-count">${count}</span></button>`;
  }).join("");
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
      // Undiscovered bottles hide their name — only match on category/country basics to avoid spoilers
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
    return `<div class="card ${found ? "" : "locked"} ${b.leg ? "legendary" : ""}" data-id="${b.id}" tabindex="0" role="button" aria-label="${found ? b.name : "Undiscovered " + b.cat + " bottle"}">
      <div class="bottle-wrap"><div class="bottle-svg">${bottleSVG(b, found)}</div>${found ? "" : '<div class="shimmer"></div>'}</div>
      <div class="card-name">${found ? b.name : "? ? ?"}</div>
      <div class="card-sub">${found ? b.country : b.cat}</div>
    </div>`;
  }).join("") || `<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:3rem 0">Nothing here — adjust your filters.</p>`;

  $("bottle-grid").querySelectorAll(".card").forEach(el => {
    el.addEventListener("click", () => openModal(el.dataset.id));
    el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(el.dataset.id); } });
  });
}

function updateCounter() {
  $("counter-found").textContent = state.logged.size;
  document.querySelector(".counter-total").textContent = CATALOG.length;
}

// --------------------- MODAL & REVEAL --------------------
let modalBottle = null;

function openModal(id) {
  modalBottle = byId[id];
  const b = modalBottle;
  const found = state.logged.has(id);
  const card = $("modal-card");
  card.classList.remove("revealing", "revealed", "legend-reveal");

  $("modal-bottle").innerHTML = bottleSVG(b, found);
  $("m-eyebrow").textContent = found ? `${b.cat} · ${b.style}` : b.cat;
  $("m-eyebrow").classList.toggle("legend", found && !!b.leg);
  if (found && b.leg) $("m-eyebrow").textContent = "★ Legendary · " + b.style;

  $("m-name").textContent = found ? b.name : "? ? ?";
  $("m-name").classList.toggle("mystery", !found);
  $("m-meta").innerHTML = found
    ? `<span><strong>${b.country}</strong></span><span><strong>${b.abv}%</strong> ABV</span>`
    : `<span>Origin unknown</span><span>ABV hidden</span>`;
  $("m-tags").innerHTML = found ? b.tags.map(t => `<span class="tag">${t}</span>`).join("") : "";
  $("m-fact").textContent = found ? b.fact : "";
  $("m-fact").style.display = found ? "" : "none";
  $("m-serve").textContent = found ? "Serve: " + b.serve : "Tried it in real life? Log it to reveal everything.";
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
  store.addLog(b.id); // fire and continue — optimistic UI

  // The reveal
  const card = $("modal-card");
  $("modal-bottle").innerHTML = bottleSVG(b, true, true);
  card.classList.add("revealing", "revealed");
  if (b.leg) card.classList.add("legend-reveal");

  setTimeout(() => {
    $("m-eyebrow").textContent = b.leg ? "★ Legendary · " + b.style : `${b.cat} · ${b.style}`;
    $("m-eyebrow").classList.toggle("legend", !!b.leg);
    $("m-name").textContent = b.name;
    $("m-name").classList.remove("mystery");
    $("m-name").classList.add("reveal-fade");
    $("m-meta").innerHTML = `<span><strong>${b.country}</strong></span><span><strong>${b.abv}%</strong> ABV</span>`;
    $("m-tags").innerHTML = b.tags.map(t => `<span class="tag">${t}</span>`).join("");
    $("m-fact").textContent = b.fact;
    $("m-fact").style.display = "";
    $("m-serve").textContent = "Serve: " + b.serve;
    $("m-hint").style.display = "none";
    ["m-meta", "m-tags", "m-fact", "m-serve"].forEach(id => $(id).classList.add("reveal-fade"));
  }, 700);

  $("btn-log").classList.add("hidden");
  $("btn-unlog").classList.remove("hidden");

  if (b.leg) { confettiBurst(); toast("★ LEGENDARY FIND! " + b.name, true); }
  else toast("Logged: " + b.name);

  updateCounter();
  renderGrid();
  checkNewBadges();
}

async function unlogBottle() {
  if (!modalBottle) return;
  state.logged.delete(modalBottle.id);
  store.removeLog(modalBottle.id);
  updateCounter();
  renderGrid();
  openModal(modalBottle.id); // re-render modal as undiscovered
}


// ------------------ TELL THE BARTENDER -------------------
// Users can't identify silhouettes among thousands of real-world
// bottles — so they don't have to. They name what they drank and
// the bartender finds it on the shelf (like a Pokémon encounter
// registering itself). Fuzzy match, top 3 candidates, one tap to
// open and log.

function bartenderHint(b) {
  const band = b.abv < 10 ? "a light pour" : b.abv < 25 ? "medium strength" : b.abv < 45 ? "a proper spirit" : "high proof";
  return `From ${b.country}. ${band}. Notes of ${b.tags[0]}.`;
}

function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}


// Bigram (Dice) similarity for typo-tolerant matching
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
      if (name.split(" ").includes(t)) score += 18;        // exact word in name
      else if (name.includes(t)) score += 10;              // partial in name
      else if (fullWords.includes(t)) score += 12;         // exact word in style/country/category (e.g. "soju")
      else if (full.includes(t)) score += 3;               // loose partial
    });
    score += Math.round(dice(q, name) * 34);               // typo tolerance ("glenfidich" → Glenfiddich)
    return { b, score };
  }).filter(m => m.score >= 10).sort((a, z) => z.score - a.score).slice(0, 3);
}

function runBartender() {
  const q = $("bartender-input").value;
  const box = $("bartender-results");
  const hits = bartenderMatch(q);
  if (!q.trim()) { box.innerHTML = ""; return; }
  if (!hits.length) {
    box.innerHTML = `<div class="bartender-miss">Not on our shelves — the dex holds 350 iconic bottles. Try the brand name, or browse the silhouettes by category for a hint-guided hunt.</div>`;
    return;
  }
  box.innerHTML = hits.map(({ b }) => {
    const logged = state.logged.has(b.id);
    return `<button class="bartender-hit ${logged ? "already" : ""}" data-id="${b.id}">
      <span>${b.name}<div class="hit-sub">${b.cat} · ${b.style} · ${b.country}</div></span>
      <span class="hit-state">${logged ? "In your dex" : "Tap to log →"}</span>
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
  return { total: state.logged.size, countries: countries.size, legendaries, byCat, catTotals: CAT_TOTALS, catalogTotal: CATALOG.length };
}

function checkNewBadges() {
  const stats = computeStats();
  BADGES.forEach(badge => {
    if (!state.earnedBadges.has(badge.id) && badge.test(stats)) {
      state.earnedBadges.add(badge.id);
      setTimeout(() => toast(`${badge.icon} Badge earned: ${badge.name}`), 1600);
    }
  });
}

function renderProfile() {
  const s = computeStats();
  $("profile-email").textContent = state.user.email + (DEMO_MODE ? " (demo mode)" : "");
  $("stat-total").textContent = s.total;
  $("stat-countries").textContent = s.countries;
  $("stat-legendaries").innerHTML = s.legendaries + '<span class="stat-frac">/20</span>';
  $("stat-pct").textContent = Math.round((s.total / CATALOG.length) * 100) + "%";

  $("category-progress").innerHTML = CATS.map(c => {
    const n = s.byCat[c] || 0, t = CAT_TOTALS[c];
    return `<div class="cat-row">
      <div class="cat-name">${c}</div>
      <div class="bar"><div class="bar-fill" style="width:${(n / t) * 100}%"></div></div>
      <div class="cat-count">${n} / ${t}</div>
    </div>`;
  }).join("");

  $("badge-grid").innerHTML = BADGES.map(b => {
    const earned = b.test(s);
    return `<div class="badge ${earned ? "earned" : ""}">
      <div class="badge-icon">${b.icon}</div>
      <div><div class="badge-name">${b.name}</div><div class="badge-desc">${b.desc}</div></div>
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
  toastTimer = setTimeout(() => t.classList.add("hidden"), legend ? 4200 : 2600);
}

function confettiBurst() {
  const canvas = $("confetti");
  const ctx = canvas.getContext("2d");
  canvas.width = innerWidth; canvas.height = innerHeight;
  const colors = ["#F6D889", "#E39A2E", "#D4AF6A", "#FFF3D6", "#B7791E"];
  const parts = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 200,
    y: innerHeight / 2,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 14 - 4,
    size: Math.random() * 7 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3
  }));
  let frames = 0;
  (function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    if (++frames < 160) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  })();
}

// ------------------------- INIT --------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // Wiring
  $("age-yes").addEventListener("click", () => { localStorage.setItem("adex_age_ok", "1"); startAuthFlow(); });
  $("age-no").addEventListener("click", () => { document.body.innerHTML = '<div class="gate"><div class="gate-card"><div class="wordmark">Alcohol<span>Dex</span></div><p class="gate-line" style="margin-top:1.5rem">AlcoholDex is for adults 18 and over. See you in a few years.</p></div></div>'; });
  $("tab-signin").addEventListener("click", () => setAuthMode("signin"));
  $("tab-signup").addEventListener("click", () => setAuthMode("signup"));
  $("auth-form").addEventListener("submit", handleAuth);
  $("nav-dex").addEventListener("click", () => showPage("dex"));
  $("nav-profile").addEventListener("click", () => showPage("profile"));
  $("btn-signout").addEventListener("click", signOut);
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

  // Entry flow: age gate → session restore → auth
  if (!localStorage.getItem("adex_age_ok")) { show("view-agegate"); return; }
  startAuthFlow();
});

async function startAuthFlow() {
  const restored = await restoreSession();
  if (!restored) show("view-auth");
}
