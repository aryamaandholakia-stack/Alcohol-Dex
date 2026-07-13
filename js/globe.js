/* Your Globe — vanilla port of the Globe3D spec.
   Textured earth + bump, #4da6ff atmosphere glow, auto-rotate 0.3, drag with
   inertia, markers with hover labels + click. Pins = everything marked done
   on the ACTIVE ledger (personal passport or an open circle).
   window.renderGlobe() rebuilds markers; render loop pauses off-tab. */
(function () {
  // ---- Coordinates: country centroids + cities that appear in the catalogs ----
  const GEO = {
    // cities (bars, xp, thrills anchors)
    "new york":[40.71,-74.01],"london":[51.51,-0.13],"tokyo":[35.68,139.65],"paris":[48.86,2.35],
    "mexico city":[19.43,-99.13],"barcelona":[41.39,2.17],"madrid":[40.42,-3.70],"rome":[41.90,12.50],
    "athens":[37.98,23.73],"edinburgh":[55.95,-3.19],"singapore":[1.35,103.82],"hong kong":[22.32,114.17],
    "buenos aires":[-34.60,-58.38],"cartagena":[10.39,-75.51],"venice":[45.44,12.32],"dubai":[25.20,55.27],
    "hanoi":[21.03,105.85],"saigon":[10.82,106.63],"ho chi minh":[10.82,106.63],"kyoto":[35.01,135.77],
    "osaka":[34.69,135.50],"varanasi":[25.32,83.01],"vrindavan":[27.58,77.70],"mumbai":[19.08,72.88],
    "old delhi":[28.66,77.23],"delhi":[28.61,77.21],"bangkok":[13.76,100.50],"xi'an":[34.34,108.94],
    "istanbul":[41.01,28.98],"granada":[37.18,-3.60],"lisbon":[38.72,-9.14],"porto":[41.16,-8.63],
    "havana":[23.11,-82.37],"oaxaca":[17.07,-96.72],"kingston":[17.97,-76.79],"beirut":[33.89,35.50],
    "cairo":[30.04,31.24],"marrakech":[31.63,-7.99],"cape town":[-33.92,18.42],"nairobi":[-1.29,36.82],
    "sydney":[-33.87,151.21],"melbourne":[-37.81,144.96],"queenstown":[-45.03,168.66],"reykjavik":[64.15,-21.94],
    "prague":[50.08,14.44],"vienna":[48.21,16.37],"berlin":[52.52,13.40],"munich":[48.14,11.58],
    "amsterdam":[52.37,4.90],"brussels":[50.85,4.35],"dublin":[53.35,-6.26],"san francisco":[37.77,-122.42],
    "new orleans":[29.95,-90.07],"chicago":[41.88,-87.63],"los angeles":[34.05,-118.24],"las vegas":[36.17,-115.14],
    "kathmandu":[27.72,85.32],"pokhara":[28.21,83.99],"bir":[32.05,76.72],"rishikesh":[30.09,78.27],
    "ladakh":[34.15,77.58],"goa":[15.30,74.12],"kerala":[10.85,76.27],"alleppey":[9.49,76.33],
    "darjeeling":[27.04,88.26],"munnar":[10.09,77.06],"jaipur":[26.91,75.79],"udaipur":[24.58,73.71],
    "seoul":[37.57,126.98],"shanghai":[31.23,121.47],"beijing":[39.90,116.41],"taipei":[25.03,121.57],
    "bali":[-8.34,115.09],"phuket":[7.88,98.39],"siem reap":[13.36,103.86],"luang prabang":[19.89,102.14],
    "interlaken":[46.69,7.86],"chamonix":[45.92,6.87],"zermatt":[46.02,7.75],"wadi rum":[29.58,35.42],
    "petra":[30.33,35.44],"cusco":[-13.53,-71.97],"rio de janeiro":[-22.91,-43.17],"rio":[-22.91,-43.17],
    "kabini":[11.94,76.35],"ranthambore":[26.02,76.50],"hermanus":[-34.42,19.23],"mirissa":[5.95,80.46],
    "ningaloo":[-22.57,113.81],"velas":[17.96,73.03],"bhandardara":[19.54,73.75],"igatpuri":[19.70,73.56],
    "alba":[44.70,8.04],"tuscany":[43.77,11.25],"rioja":[42.29,-2.54],"nashik":[19.99,73.79],
    "brittany":[48.20,-2.93],"mauna kea":[19.82,-155.47],"cape canaveral":[28.39,-80.60],"sriharikota":[13.72,80.23],
    "campbeltown":[55.42,-5.60],"islay":[55.73,-6.15],"speyside":[57.48,-3.20],"jerez":[36.68,-6.14],
    "kentucky":[37.84,-84.27],"lynchburg":[35.28,-86.37],"jalisco":[20.66,-103.35],"tequila":[20.88,-103.84],
    "cognac":[45.70,-0.33],"champagne":[49.04,3.96],"bordeaux":[44.84,-0.58],"burgundy":[47.05,4.38],
    "provincetown":[42.06,-70.19],"cebu":[10.32,123.89],"waffle house":[33.75,-84.39],
    // countries — every CountryDex entry + producer nations
    "afghanistan":[33.9,67.7],"albania":[41.2,20.2],"algeria":[28.0,1.7],"andorra":[42.5,1.5],"angola":[-11.2,17.9],
    "antigua and barbuda":[17.1,-61.8],"argentina":[-38.4,-63.6],"armenia":[40.1,45.0],"australia":[-25.3,133.8],
    "austria":[47.5,14.6],"azerbaijan":[40.1,47.6],"bahrain":[26.0,50.5],"bangladesh":[23.7,90.4],"barbados":[13.2,-59.5],
    "belarus":[53.7,27.9],"belgium":[50.5,4.5],"belize":[17.2,-88.5],"benin":[9.3,2.3],"bhutan":[27.5,90.4],
    "bolivia":[-16.3,-63.6],"bosnia and herzegovina":[43.9,17.7],"botswana":[-22.3,24.7],"brazil":[-14.2,-51.9],
    "brunei":[4.5,114.7],"bulgaria":[42.7,25.5],"burkina faso":[12.2,-1.6],"burundi":[-3.4,29.9],"cambodia":[12.6,105.0],
    "cameroon":[7.4,12.4],"canada":[56.1,-106.3],"cape verde":[16.0,-24.0],"central african republic":[6.6,20.9],
    "chad":[15.5,18.7],"chile":[-35.7,-71.5],"china":[35.9,104.2],"colombia":[4.6,-74.3],"comoros":[-11.7,43.9],
    "costa rica":[9.7,-83.8],"croatia":[45.1,15.2],"cuba":[21.5,-77.8],"cyprus":[35.1,33.4],"czechia":[49.8,15.5],
    "denmark":[56.3,9.5],"djibouti":[11.8,42.6],"dominica":[15.4,-61.4],"dominican republic":[18.7,-70.2],
    "dr congo":[-4.0,21.8],"ecuador":[-1.8,-78.2],"egypt":[26.8,30.8],"el salvador":[13.8,-88.9],
    "equatorial guinea":[1.6,10.3],"eritrea":[15.2,39.8],"estonia":[58.6,25.0],"eswatini":[-26.5,31.5],
    "ethiopia":[9.1,40.5],"fiji":[-17.7,178.1],"finland":[61.9,25.7],"france":[46.2,2.2],"gabon":[-0.8,11.6],
    "georgia":[42.3,43.4],"germany":[51.2,10.5],"ghana":[7.9,-1.0],"greece":[39.1,21.8],"grenada":[12.1,-61.7],
    "guatemala":[15.8,-90.2],"guinea":[9.9,-9.7],"guinea-bissau":[11.8,-15.2],"guyana":[4.9,-58.9],"haiti":[19.0,-72.3],
    "honduras":[15.2,-86.2],"hungary":[47.2,19.5],"iceland":[64.96,-19.0],"india":[20.6,79.0],"indonesia":[-0.8,113.9],
    "iran":[32.4,53.7],"iraq":[33.2,43.7],"ireland":[53.4,-8.2],"israel & palestine":[31.5,34.9],"israel":[31.0,34.9],
    "italy":[41.9,12.6],"jamaica":[18.1,-77.3],"japan":[36.2,138.3],"jordan":[30.6,36.2],"kazakhstan":[48.0,66.9],
    "kenya":[-0.02,37.9],"kiribati":[1.9,-157.4],"kosovo":[42.6,20.9],"kuwait":[29.3,47.5],"kyrgyzstan":[41.2,74.8],
    "laos":[19.9,102.5],"latvia":[56.9,24.6],"lebanon":[33.9,35.9],"lesotho":[-29.6,28.2],"liberia":[6.4,-9.4],
    "libya":[26.3,17.2],"liechtenstein":[47.2,9.6],"lithuania":[55.2,23.9],"luxembourg":[49.8,6.1],
    "madagascar":[-18.8,47.0],"malawi":[-13.3,34.3],"malaysia":[4.2,102.0],"maldives":[3.2,73.2],"mali":[17.6,-4.0],
    "malta":[35.9,14.4],"marshall islands":[7.1,171.2],"mauritania":[21.0,-10.9],"mauritius":[-20.3,57.6],
    "mexico":[23.6,-102.6],"micronesia":[6.9,158.2],"moldova":[47.4,28.4],"monaco":[43.7,7.4],"mongolia":[46.9,103.8],
    "montenegro":[42.7,19.4],"morocco":[31.8,-7.1],"mozambique":[-18.7,35.5],"myanmar":[21.9,96.0],
    "namibia":[-22.9,18.5],"nauru":[-0.5,166.9],"nepal":[28.4,84.1],"netherlands":[52.1,5.3],"new zealand":[-40.9,174.9],
    "nicaragua":[12.9,-85.2],"niger":[17.6,8.1],"nigeria":[9.1,8.7],"north korea":[40.3,127.5],
    "north macedonia":[41.6,21.7],"norway":[60.5,8.5],"oman":[21.5,55.9],"pakistan":[30.4,69.3],"palau":[7.5,134.6],
    "panama":[8.5,-80.8],"papua new guinea":[-6.3,143.9],"paraguay":[-23.4,-58.4],"peru":[-9.2,-75.0],
    "philippines":[12.9,121.8],"poland":[51.9,19.1],"portugal":[39.4,-8.2],"qatar":[25.4,51.2],
    "republic of the congo":[-0.2,15.8],"romania":[45.9,25.0],"russia":[61.5,105.3],"rwanda":[-1.9,29.9],
    "saint kitts and nevis":[17.4,-62.8],"saint lucia":[13.9,-61.0],"saint vincent and the grenadines":[13.3,-61.2],
    "samoa":[-13.8,-172.1],"san marino":[43.9,12.5],"são tomé and príncipe":[0.2,6.6],"saudi arabia":[23.9,45.1],
    "scotland":[56.5,-4.2],"senegal":[14.5,-14.5],"serbia":[44.0,21.0],"seychelles":[-4.7,55.5],
    "sierra leone":[8.5,-11.8],"slovakia":[48.7,19.7],"slovenia":[46.2,15.0],"solomon islands":[-9.6,160.2],
    "somalia":[5.2,46.2],"south africa":[-30.6,22.9],"south korea":[35.9,127.8],"south sudan":[6.9,31.3],
    "spain":[40.5,-3.7],"sri lanka":[7.9,80.8],"sudan":[12.9,30.2],"suriname":[3.9,-56.0],"sweden":[60.1,18.6],
    "switzerland":[46.8,8.2],"syria":[34.8,38.5],"taiwan":[23.7,121.0],"tajikistan":[38.9,71.3],"tanzania":[-6.4,34.9],
    "thailand":[15.9,100.99],"the bahamas":[25.0,-77.4],"the gambia":[13.4,-15.3],"timor-leste":[-8.9,125.7],
    "togo":[8.6,0.8],"tonga":[-21.2,-175.2],"trinidad and tobago":[10.7,-61.2],"tunisia":[33.9,9.5],
    "türkiye":[38.96,35.2],"turkmenistan":[38.97,59.6],"tuvalu":[-7.1,177.6],"uganda":[1.4,32.3],"ukraine":[48.4,31.2],
    "united arab emirates":[23.4,53.8],"united kingdom":[55.4,-3.4],"england":[52.4,-1.5],"united states":[37.1,-95.7],
    "usa":[37.1,-95.7],"uruguay":[-32.5,-55.8],"uzbekistan":[41.4,64.6],"vanuatu":[-15.4,166.9],
    "vatican city":[41.9,12.45],"venezuela":[6.4,-66.6],"vietnam":[14.1,108.3],"yemen":[15.6,48.5],
    "zambia & zimbabwe":[-17.9,27.8],"zambia":[-13.1,27.8],"zimbabwe":[-19.0,29.2],"antarctica":[-75.3,-0.07],"wales":[52.1,-3.8],"bermuda":[32.3,-64.8],"british virgin islands":[18.4,-64.6],
    "sarawak":[2.5,113.0],"borneo":[0.96,114.6],"patagonia":[-41.8,-68.9],"andamans":[11.7,92.7],"red sea":[20.3,38.5],
    "arctic":[66.5,25.7],"boulders beach":[-34.2,18.45],"himalaya":[28.6,83.9],"alps":[46.5,9.8],"caribbean":[15.4,-68.0],
    "loire":[47.35,0.7],"alsace":[48.3,7.4],"jura":[46.7,5.9],"sicily":[37.6,14.0],"sardinia":[40.1,9.0],
    "okinawa":[26.3,127.8],"hokkaido":[43.2,142.8],"kagoshima":[31.6,130.6],"niigata":[37.5,138.9],"tasmania":[-42.0,146.6],
    "martinique":[14.6,-61.0],"guadeloupe":[16.3,-61.6],"puerto rico":[18.2,-66.6],"guam? no":[0,0]
  };
  delete GEO["guam? no"];

  function resolve(item) {
    const raw = (item.country || "").toLowerCase();
    if (!raw || /anywhere|your own|the path|auroral|world's ends|wherever|not your culture/.test(raw)) return null;
    const tryOne = seg => {
      seg = seg.trim().replace(/^the /, "");
      if (GEO[seg]) return { ll: GEO[seg], place: seg };
      return null;
    };
    // "City, Country" → city first, then country; "A / B" → first resolvable
    for (const part of raw.split("/")) {
      const segs = part.split(",").map(x => x.trim()).filter(Boolean);
      for (const s of segs) { const hit = tryOne(s); if (hit) return hit; }
      for (const s of segs) for (const w of Object.keys(GEO)) if (s.includes(w)) return { ll: GEO[w], place: w };
    }
    return null;
  }

  const R = 2;
  function toVec(lat, lng, r) {
    const phi = (90 - lat) * Math.PI / 180, theta = (lng + 180) * Math.PI / 180;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
  }

  let built = false, scene, camera, renderer, globeGroup, markerGroup, raycaster, pointer, labelEl, rotV = { x: 0, y: 0.3 * 0.016 }, dragging = false, last = { x: 0, y: 0 };
  const CFG = { atmosphereColor: "#4da6ff", autoRotateSpeed: 0.3, bumpScale: 5 };

  function build() {
    const mount = document.getElementById("globe-canvas");
    if (!mount || typeof THREE === "undefined") return false;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 6;
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);
    labelEl = document.getElementById("globe-label");

    globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    const tex = loader.load("https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg");
    const bump = loader.load("https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png");
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(R, 64, 64),
      new THREE.MeshPhongMaterial({ map: tex, bumpMap: bump, bumpScale: CFG.bumpScale / 100, specular: new THREE.Color("#1a2a3a"), shininess: 6 })
    );
    globeGroup.add(globe);

    // Atmosphere — back-side fresnel glow in the spec color
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.12, 64, 64),
      new THREE.ShaderMaterial({
        transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
        uniforms: { c: { value: new THREE.Color(CFG.atmosphereColor) } },
        vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: "uniform vec3 c; varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0,0,1.0)), 2.0); gl_FragColor = vec4(c, 1.0) * i; }"
      })
    );
    scene.add(atmo);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 0.7); sun.position.set(5, 3, 5); scene.add(sun);

    markerGroup = new THREE.Group();
    globeGroup.add(markerGroup);

    raycaster = new THREE.Raycaster(); pointer = new THREE.Vector2(10, 10);

    const el = renderer.domElement;
    const pos = e => { const r2 = el.getBoundingClientRect(); const cx = (e.touches ? e.touches[0].clientX : e.clientX), cy = (e.touches ? e.touches[0].clientY : e.clientY); return { x: cx - r2.left, y: cy - r2.top, w: r2.width, h: r2.height }; };
    const down = e => { dragging = true; const p = pos(e); last = p; };
    const move = e => {
      const p = pos(e);
      pointer.x = (p.x / p.w) * 2 - 1; pointer.y = -(p.y / p.h) * 2 + 1;
      if (dragging) {
        rotV.y = (p.x - last.x) * 0.0035; rotV.x = (p.y - last.y) * 0.0035;
        globeGroup.rotation.y += rotV.y; globeGroup.rotation.x = Math.max(-1.2, Math.min(1.2, globeGroup.rotation.x + rotV.x));
        last = p;
      }
    };
    const up = () => { dragging = false; };
    el.addEventListener("mousedown", down); el.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    el.addEventListener("touchstart", down, { passive: true }); el.addEventListener("touchmove", move, { passive: true }); el.addEventListener("touchend", up);
    el.addEventListener("click", () => { if (hovered) clickMarker(hovered); });

    function size() {
      const w = mount.clientWidth, h = mount.clientHeight || Math.min(640, Math.round(w * 0.9));
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
    }
    size(); window.addEventListener("resize", size);

    let hovered = null;
    function clickMarker(m) {
      const names = m.userData.items.slice(0, 3).map(x => x.name).join(" · ");
      const extra = m.userData.items.length > 3 ? ` +${m.userData.items.length - 3} more` : "";
      if (window.toast) toast(`${m.userData.label}: ${names}${extra}`);
    }

    const page = document.getElementById("page-globe");
    const clock = new THREE.Clock();
    (function animate() {
      requestAnimationFrame(animate);
      if (document.hidden || (page && page.classList.contains("hidden"))) return;
      const dt = clock.getDelta();
      if (!dragging) {
        globeGroup.rotation.y += CFG.autoRotateSpeed * dt * (Math.abs(rotV.y) > 0.0006 ? 0 : 1) + (rotV.y *= 0.94);
        globeGroup.rotation.x += (rotV.x *= 0.94);
      }
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(markerGroup.children);
      const h = hits.length ? hits[0].object : null;
      if (h !== hovered) {
        if (hovered) hovered.scale.setScalar(1);
        hovered = h;
        if (h) { h.scale.setScalar(1.6); el.style.cursor = "pointer"; }
        else { el.style.cursor = "grab"; }
      }
      if (hovered && labelEl) {
        labelEl.textContent = hovered.userData.label + " — " + hovered.userData.items.length + " " + (hovered.userData.items.length === 1 ? "memory" : "memories");
        labelEl.classList.add("on");
      } else if (labelEl) labelEl.classList.remove("on");
      renderer.render(scene, camera);
    })();
    built = true;
    return true;
  }

  window.renderGlobe = function () {
    if (!built && !build()) return;
    while (markerGroup.children.length) markerGroup.remove(markerGroup.children[0]);
    // group done items by resolved place
    const buckets = {};
    let placed = 0, skipped = 0;
    [...state.logged].forEach(id => {
      const b = byId[id]; if (!b) return;
      const hit = resolve(b);
      if (!hit) { skipped++; return; }
      const key = hit.place;
      (buckets[key] = buckets[key] || { ll: hit.ll, items: [], dexes: {} }).items.push(b);
      buckets[key].dexes[b.dex] = (buckets[key].dexes[b.dex] || 0) + 1;
      placed++;
    });
    Object.entries(buckets).forEach(([place, o]) => {
      const domDex = Object.entries(o.dexes).sort((a, z) => z[1] - a[1])[0][0];
      const color = new THREE.Color((DEX_BY_ID[domDex] || {}).accent || "#C9911F");
      const size = 0.035 + Math.min(0.06, o.items.length * 0.006);
      const m = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 12),
        new THREE.MeshBasicMaterial({ color }));
      m.position.copy(toVec(o.ll[0], o.ll[1], R + 0.01));
      m.userData = { label: place.replace(/\b\w/g, c => c.toUpperCase()), items: o.items };
      markerGroup.add(m);
      // halo ring
      const halo = new THREE.Mesh(new THREE.RingGeometry(size * 1.4, size * 2.0, 24),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
      halo.position.copy(m.position.clone().multiplyScalar(1.002));
      halo.lookAt(new THREE.Vector3(0, 0, 0));
      markerGroup.add(halo);
      halo.userData = m.userData; // hover on halo counts too
    });
    const line = document.getElementById("globe-line");
    if (line) {
      const who = state.ledger ? "◍ " + state.ledger.name : "you";
      line.innerHTML = placed
        ? `${Object.keys(buckets).length} places hold what ${who === "you" ? "you've" : who + " has"} lived — ${placed} pins on the map${skipped ? `, ${skipped} unpinnable (the "anywhere" kind)` : ""}.`
        : `Nothing pinned yet${state.ledger ? " for " + who : ""}. Go live something, then come see it glow.`;
    }
  };
})();
