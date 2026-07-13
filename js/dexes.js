/* =========================================================
   The Pokédex — dex registry. Every dex declares its copy
   voice here; the whole app parameterizes off this object.
   To add a dex: add a row + a catalog file that calls
   registerCatalog(id, [...items]).
   ========================================================= */

const DEXES = [
  { id:"alcohol", hunt:true, flagship:true, group:"dex", note:"A treasure hunt, Pok\u00e9mon rules \u2014 every bottle stays hidden until you meet it in the wild. No peeking.", placeholder:"Lagavulin 16, Old Monk, Sula Rasa…", name:"AlcoholDex", noun:"bottle",     verb:"met",     character:"the bartender",      ask:"Just tried something? Tell the bartender.",
    legName:"The Twenty", tagline:"Bottles met in the real world", accent:"#C9A45C", glyph:"◆", art:"bottle", statLabel:"Strength", serveLabel:"Serve" },
  { id:"bars", hunt:false, group:"list", note:"Rooms to drink a Bourdain-shaped life in \u2014 his verified stops on The Bourdain Trail, plus the dives, ghosts, and rituals he taught us to look for. Reveal it and start the pilgrimage.", placeholder:"Truth, Attaboy, the bar behind the pastrami shop…", name:"BarDex",     noun:"room",       verb:"entered", character:"the doorman",        ask:"Been somewhere? Tell the doorman.",
    legName:"The Seven Doors", tagline:"Drink a Bourdain-shaped life", accent:"#B4593A", glyph:"⬖", art:"stamp", statLabel:"Since", serveLabel:"The order" },
  { id:"xp", hunt:false, group:"list", note:"Once-in-a-lifetime experiences, Bourdain-inspired \u2014 the table, the road, the rituals, the strangers. Reveal the list and start living it.", placeholder:"Aarti, aurora, b\u00fan ch\u1ea3, omakase\u2026", name:"ExperienceDex", noun:"experience", verb:"lived", character:"the fixer", ask:"Lived one? Tell the fixer.",
    legName:"The Once", tagline:"Live like Tony taught", accent:"#7D6BAF", glyph:"\u2726", art:"stamp", statLabel:"The window", serveLabel:"Do it right" },
  { id:"thrills", hunt:false, group:"list", note:"A field list of adventures. Reveal it to build courage, or let each one ambush you.", placeholder:"Skydive, Bir paragliding, Rishikesh rafting…", name:"ThrillDex",  noun:"thrill",     verb:"survived",character:"the instructor",     ask:"Made it back? Tell the instructor.",
    legName:"The Edge", tagline:"Seek discomfort, survive it", accent:"#4C8C6A", glyph:"▲", art:"stamp", statLabel:"The number", serveLabel:"The move" },
  { id:"friends", hunt:false, group:"list", note:"A field list of bonds. Reveal it — some friendships need to be sought.", placeholder:"Japan, a friend made on a plane…", name:"FriendDex",  noun:"friendship", verb:"made",    character:"the host",           ask:"Met someone? Tell the host.",
    legName:"The Rare Bonds", tagline:"The people are the destination", accent:"#C4788A", glyph:"❖", art:"stamp", statLabel:"Tongue", serveLabel:"Keep it alive" },
  { id:"countries", hunt:false, group:"list", note:"A field list of the world. Reveal it and count what's left.", placeholder:"Georgia, Oman, Bhutan…", name:"CountryDex", noun:"country",  verb:"stamped", character:"the border officer", ask:"Crossed a border? Tell the officer.",
    legName:"The Far Ends", tagline:"Parts known and unknown", accent:"#5B87A6", glyph:"◉", art:"stamp", statLabel:"Capital", serveLabel:"First stop" }
];
const DEX_BY_ID = Object.fromEntries(DEXES.map(d => [d.id, d]));

// Catalog registration — files below push into this.
const CATALOGS = { alcohol: (typeof CATALOG !== "undefined") ? CATALOG : [] };
function registerCatalog(dexId, items) {
  items.forEach(i => i.dex = dexId);
  CATALOGS[dexId] = items;
}
if (CATALOGS.alcohol) CATALOGS.alcohol.forEach(i => i.dex = "alcohol");

// First-visit intake — the keeper's quick questions (field lists only; the hunt never reveals)
const DEX_INTAKE = {
  xp: ["xp036","xp032","xp020","xp008","xp017","xp033","xp043","xp048"],
  bars: ["br031","br032","br008","br042","br043","br048","br016","br036"],
  thrills: ["th006","th013","th015","th007","th008","th021","th027","th040","th036"],
  friends: ["fr040","fr022","fr036","fr006","fr055","fr056","fr057","fr059","fr060"],
  countries: ["co008","co028","co072","co042","co038","co017","co020","co014","co035","co030","co048","co040"],
};

// Short Bourdain aphorisms, attributed in UI. Keep each under 15 words.
const BOURDAIN_QUOTES = [
  "Your body is not a temple, it's an amusement park. Enjoy the ride.",
  "If I'm an advocate for anything, it's to move.",
  "Travel is about the gorgeous feeling of teetering in the unknown.",
  "Drink heavily with locals whenever possible.",
  "Travel changes you.",
  "Context and memory play powerful roles in all the truly great meals.",
  "Low plastic stool, cheap but delicious noodles, cold beer.",
  "Skills can be taught. Character you either have or you don't.",
  "I'm a big believer in winging it.",
  "The way you make an omelet reveals your character.",
  "Good food is very often, even most often, simple food.",
  "Food is everything we are.",
  "Meals make the society.",
  "Be a traveler, not a tourist."
];
function bourdainQuote() { return BOURDAIN_QUOTES[Math.floor(Math.random() * BOURDAIN_QUOTES.length)]; }
