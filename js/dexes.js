/* =========================================================
   The Pokédex — dex registry. Every dex declares its copy
   voice here; the whole app parameterizes off this object.
   To add a dex: add a row + a catalog file that calls
   registerCatalog(id, [...items]).
   ========================================================= */

const DEXES = [
  { id:"alcohol", hunt:true, flagship:true, group:"flagship", note:"A treasure hunt, Pok\u00e9mon rules \u2014 every bottle stays hidden until you meet it in the wild. No peeking.", placeholder:"Lagavulin 16, Old Monk, Sula Rasa…", name:"AlcoholDex", noun:"bottle",     verb:"met",     character:"the bartender",      ask:"Just tried something? Tell the bartender.",
    legName:"The Twenty", tagline:"Bottles met in the real world", accent:"#C9A45C", glyph:"◆", art:"bottle", statLabel:"Strength", serveLabel:"Serve" },
  { id:"bars", hunt:false, group:"field", note:"Rooms to drink a Bourdain-shaped life in \u2014 his verified stops on The Bourdain Trail, plus the dives, ghosts, and rituals he taught us to look for. Reveal it and start the pilgrimage.", placeholder:"Truth, Attaboy, the bar behind the pastrami shop…", name:"BarDex",     noun:"room",       verb:"entered", character:"the doorman",        ask:"Been somewhere? Tell the doorman.",
    legName:"The Seven Doors", tagline:"Drink a Bourdain-shaped life", accent:"#B4593A", glyph:"⬖", art:"stamp", statLabel:"Since", serveLabel:"The order" },
  { id:"thrills", hunt:false, group:"field", note:"A field list of adventures. Reveal it to build courage, or let each one ambush you.", placeholder:"Skydive, Bir paragliding, Rishikesh rafting…", name:"ThrillDex",  noun:"thrill",     verb:"survived",character:"the instructor",     ask:"Made it back? Tell the instructor.",
    legName:"The Edge", tagline:"Adventures survived", accent:"#4C8C6A", glyph:"▲", art:"stamp", statLabel:"The number", serveLabel:"The move" },
  { id:"xp", hunt:false, group:"field", note:"A field list of once-in-a-lifetimes. Reveal it and start scheming.", placeholder:"Aurora, Holi in Vrindavan, a truffle hunt…", name:"ExperienceDex", noun:"experience", verb:"lived", character:"the concierge",     ask:"Lived something? Tell the concierge.",
    legName:"The Once", tagline:"Once-in-a-lifetime, collected", accent:"#7D6BAF", glyph:"✦", art:"stamp", statLabel:"The window", serveLabel:"Do it right" },
  { id:"friends", hunt:false, group:"field", note:"A field list of bonds. Reveal it — some friendships need to be sought.", placeholder:"Japan, a friend made on a plane…", name:"FriendDex",  noun:"friendship", verb:"made",    character:"the host",           ask:"Met someone? Tell the host.",
    legName:"The Rare Bonds", tagline:"Friendships made across the world", accent:"#C4788A", glyph:"❖", art:"stamp", statLabel:"Tongue", serveLabel:"Keep it alive" },
  { id:"countries", hunt:false, group:"field", note:"A field list of the world. Reveal it and count what's left.", placeholder:"Georgia, Oman, Bhutan…", name:"CountryDex", noun:"country",  verb:"stamped", character:"the border officer", ask:"Crossed a border? Tell the officer.",
    legName:"The Far Ends", tagline:"Countries stood in", accent:"#5B87A6", glyph:"◉", art:"stamp", statLabel:"Capital", serveLabel:"First stop" },
  { id:"books", hunt:false, group:"field", note:"A field list of books actually read \u2014 tiers run common to legendary, and the summits are legendary for a reason. Reveal it and see what you're missing.", placeholder:"Ulysses, Sapiens, The God of Small Things\u2026", name:"BookDex",  noun:"book",       verb:"read",    character:"the librarian",      ask:"Finished something? Tell the librarian.",
    legName:"The Summits", tagline:"Books actually read", accent:"#8C6A4C", glyph:"\u2766", art:"stamp", statLabel:"Published", serveLabel:"The way in" },
  { id:"dubai", hunt:false, group:"city", note:"A field list of the hidden city. Reveal it — residents only.", placeholder:"The abra, Ravi, dune bashing…", name:"DubaiDex",   noun:"ritual",     verb:"done",    character:"the old concierge",  ask:"Done it? Tell the concierge.",
    legName:"The Keys to the City", tagline:"Dubai, done properly", accent:"#C9A45C", glyph:"✧", art:"stamp", statLabel:"The detail", serveLabel:"Do it right" }
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
  bars: ["br031","br032","br008","br042","br043","br048","br016","br036"],
  thrills: ["th006","th013","th015","th007","th008","th021","th027","th040","th036"],
  xp: ["xp036","xp032","xp020","xp008","xp017","xp033","xp043","xp048"],
  friends: ["fr040","fr022","fr036","fr006","fr055","fr056","fr057","fr059","fr060"],
  countries: ["co008","co028","co072","co042","co038","co017","co020","co014","co035","co030","co048","co040"],
  books: ["bk001","bk002","bk003","bk004","bk005","bk006","bk007","bk008","bk009","bk010","bk011","bk012"],
  dubai: ["du001","du019","du021","du020","du014","du031","du007","du033"]
};
