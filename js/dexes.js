/* =========================================================
   The Pokédex — dex registry. Every dex declares its copy
   voice here; the whole app parameterizes off this object.
   To add a dex: add a row + a catalog file that calls
   registerCatalog(id, [...items]).
   ========================================================= */

const DEXES = [
  { id:"alcohol", hunt:true, flagship:true, note:"A treasure hunt, Pok\u00e9mon rules \u2014 every bottle stays hidden until you meet it in the wild. No peeking.", placeholder:"Lagavulin 16, Old Monk, Sula Rasa…", name:"AlcoholDex", noun:"bottle",     verb:"met",     character:"the bartender",      ask:"Just tried something? Tell the bartender.",
    legName:"The Twenty", tagline:"Bottles met in the real world", accent:"#C9A45C", glyph:"◆", art:"bottle", statLabel:"Strength", serveLabel:"Serve" },
  { id:"bars", hunt:false, note:"A field list of rooms worth crossing the world for. Reveal it to plan a pilgrimage, or keep the mystery.", placeholder:"Truth, Attaboy, the bar behind the pastrami shop…", name:"BarDex",     noun:"room",       verb:"entered", character:"the doorman",        ask:"Been somewhere? Tell the doorman.",
    legName:"The Seven Doors", tagline:"Legendary rooms entered", accent:"#B4593A", glyph:"⬖", art:"stamp", statLabel:"Since", serveLabel:"The order" },
  { id:"thrills", hunt:false, note:"A field list of adventures. Reveal it to build courage, or let each one ambush you.", placeholder:"Skydive, Bir paragliding, Rishikesh rafting…", name:"ThrillDex",  noun:"thrill",     verb:"survived",character:"the instructor",     ask:"Made it back? Tell the instructor.",
    legName:"The Edge", tagline:"Adventures survived", accent:"#4C8C6A", glyph:"▲", art:"stamp", statLabel:"The number", serveLabel:"The move" },
  { id:"xp", hunt:false, note:"A field list of once-in-a-lifetimes. Reveal it and start scheming.", placeholder:"Aurora, Holi in Vrindavan, a truffle hunt…", name:"ExperienceDex", noun:"experience", verb:"lived", character:"the concierge",     ask:"Lived something? Tell the concierge.",
    legName:"The Once", tagline:"Once-in-a-lifetime, collected", accent:"#7D6BAF", glyph:"✦", art:"stamp", statLabel:"The window", serveLabel:"Do it right" },
  { id:"friends", hunt:false, note:"A field list of bonds. Reveal it — some friendships need to be sought.", placeholder:"Japan, a friend made on a plane…", name:"FriendDex",  noun:"friendship", verb:"made",    character:"the host",           ask:"Met someone? Tell the host.",
    legName:"The Rare Bonds", tagline:"Friendships made across the world", accent:"#C4788A", glyph:"❖", art:"stamp", statLabel:"Tongue", serveLabel:"Keep it alive" },
  { id:"countries", hunt:false, note:"A field list of the world. Reveal it and count what's left.", placeholder:"Georgia, Oman, Bhutan…", name:"CountryDex", noun:"country",  verb:"stamped", character:"the border officer", ask:"Crossed a border? Tell the officer.",
    legName:"The Far Ends", tagline:"Countries stood in", accent:"#5B87A6", glyph:"◉", art:"stamp", statLabel:"Capital", serveLabel:"First stop" },
  { id:"dubai", hunt:false, note:"A field list of the hidden city. Reveal it — residents only.", placeholder:"The abra, Ravi, dune bashing…", name:"DubaiDex",   noun:"ritual",     verb:"done",    character:"the old concierge",  ask:"Done it? Tell the concierge.",
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
