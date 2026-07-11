/* =========================================================
   Cocktails — what to mix with each bottle.
   Rules are checked top-to-bottom; first match wins.
   Each rule: [test(bottle), [cocktail names]]
   To override one bottle, add a rule matching its id at the top.
   ========================================================= */

const COCKTAIL_RULES = [
  // --- specific bottles first ---
  [b => b.id === "n103", ["Chai White Russian", "On ice", "In filter coffee"]],
  [b => b.id === "n118", ["Ice-cold shot", "Jäger Mule", "Jägerita"]],
  [b => b.id === "n119", ["Piña Colada", "Malibu & Pineapple", "Malibu Sunset"]],
  [b => b.id === "n121", ["SoCo Lime Shot", "Alabama Slammer", "SoCo & Cola"]],
  [b => b.id === "n122", ["Pour over ice", "Add an orange slice", "Instant spritz"]],
  [b => b.id === "n220", ["Carajillo", "Barraquito", "43 & Milk"]],
  [b => b.id === "n221", ["On crushed ice", "Amarula Coffee", "Marula Colada"]],
  [b => b.id === "n222", ["The layered shot", "Over ice cream", "Coffee float"]],
  [b => b.id === "n223", ["Espresso Martini", "Tia & Coffee", "White Jamaican"]],
  [b => b.id === "n224", ["Pornstar Martini", "Passoã Spritz", "With lemonade"]],
  [b => b.id === "n225", ["Select Spritz", "Venetian Americano", "Soda & green olive"]],
  [b => b.id === "n226", ["Italicus Spritz", "Bergamot Gimlet", "With prosecco"]],
  [b => b.id === "n227", ["Pastis & cold water", "Mauresque", "Tomate"]],
  [b => b.id === "n228", ["Harvey Wallbanger", "Golden Cadillac", "Hot Shot"]],
  [b => b.id === "n230", ["With water & ice", "Lion's milk serve", "Alongside meze"]],
  [b => b.id === "n249", ["Drops on a sugar cube", "In herbal tea", "Respectfully"]],
  [b => b.id === "n250", ["Lychee Martini", "Lychee Spritz", "With soda"]],
  [b => b.id === "n251", ["Blue Lagoon", "Blue Hawaiian", "Blue Margarita"]],
  [b => b.id === "n252", ["Sex on the Beach", "Fuzzy Navel", "Peach iced tea"]],
  [b => b.id === "n253", ["Incredible Hulk", "Hpnotiq Breeze", "With champagne"]],
  [b => b.id === "n257", ["Lillet Rosé Spritz", "Rosé tonic", "On ice, aperitif hour"]],
  [b => b.id === "l01", ["Aperol Spritz", "Paper Plane", "Naked & Famous"]],
  [b => b.id === "l02", ["Negroni", "Americano", "Boulevardier"]],
  [b => b.id === "l03", ["Fernet con Coca", "Hanky Panky", "Toronto"]],
  [b => b.id === "l11" || b.id === "l12", ["Last Word", "Chartreuse Swizzle", "Bijou"]],
  [b => b.id === "l13", ["Vieux Carré", "Bobby Burns", "Singapore Sling"]],
  [b => b.id === "l14" || b.id === "l15", ["Margarita", "Sidecar", "Cosmopolitan"]],
  [b => b.id === "l16", ["Hugo Spritz", "Elderflower Collins", "St-Germain Fizz"]],
  [b => b.id === "l17", ["Kir", "Kir Royale", "El Diablo"]],
  [b => b.id === "l18", ["White Negroni", "Suze Tonic", "Suze Spritz"]],
  [b => b.id === "l19", ["Vesper Martini", "Corpse Reviver #2", "Lillet Spritz"]],
  [b => b.id === "l20", ["Baileys on Ice", "Irish Coffee (twist)", "Mudslide"]],
  [b => b.id === "l21", ["Rusty Nail", "Drambuie Sour", "Hot Toddy"]],
  [b => b.id === "l22" || b.id === "l23", ["Espresso Martini", "White Russian", "Revolver"]],
  [b => b.id === "l24", ["Spicy Margarita", "Ancho Old Fashioned", "Oaxacanite"]],
  [b => b.id === "l25", ["Aviation", "Martinez", "Hemingway Daiquiri"]],
  [b => b.id === "l26", ["French Martini", "Chambord Royale", "Bramble (twist)"]],
  [b => b.id === "l27", ["Midori Sour", "Japanese Slipper", "Melon Ball"]],
  [b => b.id === "l28", ["Snowball", "Flip", "Advocaat Affogato"]],
  [b => b.id === "l29", ["Pimm's Cup", "Pimm's Royale", "Pimm's Iced Tea"]],
  [b => b.id === "l30", ["Ouzo & Water", "Ouzo Lemonade", "Greek Mojito"]],
  [b => /amaro|cynar/i.test(b.style) || ["l04","l05","l06"].includes(b.id), ["Amaro & Soda", "Paper Plane", "Black Manhattan"]],
  [b => ["l07"].includes(b.id), ["Limoncello Spritz", "Lemon Drop", "Frozen Limoncello"]],
  [b => ["l08","l09"].includes(b.id), ["Amaretto Sour", "Godfather", "Toasted Almond"]],
  [b => ["l10"].includes(b.id), ["Sambuca con Mosca", "Café Corretto", "Freddo Shot"]],

  // --- whisky ---
  [b => b.cat === "Whisky" && /rye/i.test(b.style), ["Manhattan", "Sazerac", "Old Fashioned"]],
  [b => b.cat === "Whisky" && /bourbon|tennessee/i.test(b.style), ["Old Fashioned", "Whiskey Sour", "Mint Julep"]],
  [b => b.cat === "Whisky" && /irish/i.test(b.style), ["Irish Coffee", "Whiskey Ginger", "Tipperary"]],
  [b => b.cat === "Whisky" && /japanese/i.test(b.style), ["Japanese Highball", "Mizuwari", "Toki Sour"]],
  [b => b.cat === "Whisky" && /islay|smok/i.test(b.style + b.tags.join()), ["Penicillin", "Smoky Highball", "Islay Old Fashioned"]],
  [b => b.cat === "Whisky" && /blended/i.test(b.style), ["Rob Roy", "Whisky Highball", "Godfather"]],
  [b => b.cat === "Whisky", ["Rob Roy", "Whisky Highball", "Old Fashioned"]],

  // --- wine ---
  [b => b.cat === "Wine" && /champagne|sparkling/i.test(b.style), ["French 75", "Kir Royale", "Air Mail"]],
  [b => b.cat === "Wine" && /prosecco|moscato/i.test(b.style + b.name), ["Aperol Spritz", "Bellini", "Sgroppino"]],
  [b => b.cat === "Wine" && /rosé|rose/i.test(b.style), ["Frosé", "Rosé Spritz", "Rosé Sangria"]],
  [b => b.cat === "Wine" && /fino|sherry/i.test(b.style + b.name) && b.abv < 18, ["Rebujito", "Sherry Cobbler", "Adonis"]],
  [b => b.cat === "Wine" && /port|pedro|sweet|sauternes|tokaji|trockenbeeren/i.test(b.style + b.name), ["Port Tonic", "Sherry Flip", "Chip Shot"]],
  [b => b.cat === "Wine" && /white|riesling|blanc|grigio|albariño|grüner|assyrtiko|chenin|vinho/i.test(b.style + b.name), ["Wine Spritzer", "Kir", "White Sangria"]],
  [b => b.cat === "Wine", ["New York Sour (float)", "Sangria", "Kalimotxo"]],

  // --- beer ---
  [b => b.cat === "Beer" && /quadrupel|trappist|strong dark|extreme/i.test(b.style), ["Sacred — never mix", "Pair with aged cheese", "Chalice, cellar temp"]],
  [b => b.cat === "Beer" && /lambic|gueuze|saison|witbier|kölsch|kolsch/i.test(b.style), ["Serve like Champagne", "Beer Mimosa", "Farmhouse Spritz"]],
  [b => b.cat === "Beer" && /mexican|thai|chinese|indian lager|lager/i.test(b.style), ["Michelada", "Shandy", "Lager & Lime"]],
  [b => b.cat === "Beer" && /stout|porter/i.test(b.style), ["Black Velvet", "Beer Float", "Irish Car Bomb (retired name)"]],
  [b => b.cat === "Beer" && /ipa|pale/i.test(b.style), ["IPA Shandy", "Beer Margarita", "Hop Spritz"]],
  [b => b.cat === "Beer", ["Shandy", "Radler", "Beer Cocktail of choice"]],

  // --- gin ---
  [b => b.cat === "Gin" && /genever/i.test(b.style), ["Improved Holland Gin Cocktail", "Kopstoot", "Martinez"]],
  [b => b.cat === "Gin", ["Gin & Tonic", "Negroni", "Martini"]],

  // --- vodka ---
  [b => b.cat === "Vodka" && /flavored|bison/i.test(b.style), ["Tatanka (apple juice)", "Vodka Tonic", "Polish Mule"]],
  [b => b.cat === "Vodka", ["Martini", "Espresso Martini", "Moscow Mule"]],

  // --- rum ---
  [b => b.cat === "Rum" && /agricole/i.test(b.style), ["Ti' Punch", "Daiquiri Agricole", "Petite Punch"]],
  [b => b.cat === "Rum" && /overproof|navy strength/i.test(b.style), ["Zombie", "Jungle Bird", "Tiki float"]],
  [b => b.cat === "Rum" && /white|cuban white/i.test(b.style), ["Daiquiri", "Mojito", "Piña Colada"]],
  [b => b.cat === "Rum" && /spiced/i.test(b.style), ["Dark 'n Stormy", "Spiced Cuba Libre", "Hot Buttered Rum"]],
  [b => b.cat === "Rum" && /black|bermuda/i.test(b.style), ["Dark 'n Stormy", "Painkiller", "Corn 'n Oil"]],
  [b => b.cat === "Rum", ["Rum Old Fashioned", "Mai Tai", "Rum Manhattan"]],

  // --- agave ---
  [b => b.cat === "Agave" && /mezcal|raicilla|bacanora|sotol|pechuga/i.test(b.style), ["Mezcal Negroni", "Naked & Famous", "Oaxaca Old Fashioned"]],
  [b => b.cat === "Agave" && /blanco/i.test(b.style), ["Margarita", "Paloma", "Ranch Water"]],
  [b => b.cat === "Agave" && /añejo|anejo|extra/i.test(b.style), ["Añejo Old Fashioned", "Sipping Margarita", "Carajillo pairing"]],
  [b => b.cat === "Agave", ["Margarita", "Paloma", "Tequila Old Fashioned"]],

  // --- brandy & cognac ---
  [b => b.cat === "Brandy & Cognac" && /pisco/i.test(b.style), ["Pisco Sour", "Chilcano", "Piscola"]],
  [b => b.cat === "Brandy & Cognac" && /calvados/i.test(b.style), ["Calvados Sidecar", "Corpse Reviver #1", "Normandy Highball"]],
  [b => b.cat === "Brandy & Cognac" && /grappa/i.test(b.style), ["Caffè Corretto", "Grappa Sour", "Ve.n.to"]],
  [b => b.cat === "Brandy & Cognac" && /prestige|xo/i.test(b.style), ["Serve neat — mixing is a crime here", "…fine: Sidecar Royale", "Sazerac (original spec)"]],
  [b => b.cat === "Brandy & Cognac", ["Sidecar", "Sazerac", "Brandy Alexander"]],

  // --- sake & asian ---
  [b => b.cat === "Sake & Asian" && /soju/i.test(b.style), ["Somaek (beer bomb)", "Soju Yakult", "Soju Highball"]],
  [b => b.cat === "Sake & Asian" && /shochu|awamori/i.test(b.style), ["Chuhai", "Oyuwari (hot water)", "Shochu Highball"]],
  [b => b.cat === "Sake & Asian" && /plum/i.test(b.style), ["Umeshu Soda", "Umeshu Rock", "Plum Spritz"]],
  [b => b.cat === "Sake & Asian" && /baijiu|sorghum/i.test(b.style), ["Baijiu Sour", "Ganbei (neat toast)", "Baijiu Mule"]],
  [b => b.cat === "Sake & Asian" && /makgeolli/i.test(b.style), ["Makgeolli Bowl", "Makgeolli Slushie", "Honey Makgeolli"]],
  [b => b.cat === "Sake & Asian" && /rum/i.test(b.style), ["Old Monk & Cola", "Rum Chai Toddy", "Monk Mule"]],
  [b => b.cat === "Sake & Asian" && /arrack|feni/i.test(b.style), ["Arrack Punch", "Feni Lime Soda", "Colonial Punch"]],
  [b => b.cat === "Sake & Asian", ["Saketini", "Sake Bomb (if you must)", "Chilled pour"]]
];

function getCocktails(bottle) {
  for (const [test, drinks] of COCKTAIL_RULES) {
    try { if (test(bottle)) return drinks; } catch (e) { /* skip bad rule */ }
  }
  return ["Serve as suggested"];
}
