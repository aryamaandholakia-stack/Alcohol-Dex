/* Woven Light hero — vanilla port of the torus-knot particle silk.
   Brass-and-amber palette in house mode; hushed graphite in editors mode.
   Pauses when home is hidden. window.wovenSetMode(light) retints live. */
(function () {
  const mount = document.getElementById("woven-canvas");
  if (!mount || typeof THREE === "undefined") return;
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 5;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  mount.appendChild(renderer.domElement);

  const isMobile = Math.min(window.innerWidth, window.innerHeight) < 700;
  const COUNT = reduced ? 6000 : isMobile ? 14000 : 30000;

  const positions = new Float32Array(COUNT * 3);
  const original = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const vel = new Float32Array(COUNT * 3);

  const knot = new THREE.TorusKnotGeometry(1.5, 0.5, 220, 36);
  const src = knot.attributes.position;
  const tmp = new THREE.Color();

  // Accent hues drawn from the house: brass, whisky amber, and the dex glyph colors.
  const ACCENTS_DARK = [0.10, 0.09, 0.12, 0.075, 0.11];         // ambers & brass
  const RARE_DARK = [0.72, 0.58, 0.02, 0.47];                     // ✦ purple, ◉ blue, ember, jade
  function paint(light) {
    for (let i = 0; i < COUNT; i++) {
      if (light) {
        // Editors: near-monochrome graphite with the faintest warmth
        tmp.setHSL(0.09, 0.12 + Math.random() * 0.08, 0.28 + Math.random() * 0.18);
      } else {
        const rare = Math.random() < 0.06;
        const h = rare ? RARE_DARK[(Math.random() * RARE_DARK.length) | 0] : ACCENTS_DARK[(Math.random() * ACCENTS_DARK.length) | 0];
        tmp.setHSL(h + (Math.random() - 0.5) * 0.02, rare ? 0.55 : 0.75, 0.42 + Math.random() * 0.22);
      }
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    geometry.attributes.color.needsUpdate = true;
    material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    material.opacity = light ? 0.35 : 0.85;
    material.needsUpdate = true;
  }

  for (let i = 0; i < COUNT; i++) {
    const v = i % src.count;
    const x = src.getX(v), y = src.getY(v), z = src.getZ(v);
    positions[i * 3] = original[i * 3] = x;
    positions[i * 3 + 1] = original[i * 3 + 1] = y;
    positions[i * 3 + 2] = original[i * 3 + 2] = z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: 0.02, vertexColors: true, transparent: true, depthWrite: false });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  paint(document.body.classList.contains("editors"));

  const mouse = { x: 10, y: 10 }; // offscreen until first move
  window.addEventListener("mousemove", e => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });
  window.addEventListener("touchmove", e => {
    if (!e.touches[0]) return;
    mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  function size() {
    const w = mount.clientWidth || window.innerWidth;
    const h = mount.clientHeight || window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  size();
  window.addEventListener("resize", size);

  const clock = new THREE.Clock();
  const home = document.getElementById("page-home");
  function animate() {
    requestAnimationFrame(animate);
    if (document.hidden || (home && home.classList.contains("hidden"))) return;
    const t = clock.getElapsedTime();
    const mx = mouse.x * 3, my = mouse.y * 3;
    if (!reduced) {
      for (let i = 0; i < COUNT; i++) {
        const ix = i * 3, iy = ix + 1, iz = ix + 2;
        const px = positions[ix], py = positions[iy], pz = positions[iz];
        const dx = px - mx, dy = py - my, dz = pz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.5 && dist > 0.0001) {
          const f = (1.5 - dist) * 0.01 / dist;
          vel[ix] += dx * f; vel[iy] += dy * f; vel[iz] += dz * f;
        }
        vel[ix] = (vel[ix] + (original[ix] - px) * 0.001) * 0.95;
        vel[iy] = (vel[iy] + (original[iy] - py) * 0.001) * 0.95;
        vel[iz] = (vel[iz] + (original[iz] - pz) * 0.001) * 0.95;
        positions[ix] += vel[ix]; positions[iy] += vel[iy]; positions[iz] += vel[iz];
      }
      geometry.attributes.position.needsUpdate = true;
    }
    points.rotation.y = t * 0.05;
    points.rotation.x = Math.sin(t * 0.1) * 0.08;
    renderer.render(scene, camera);
  }
  animate();

  window.wovenSetMode = light => paint(!!light);

  /* Staggered serif headline — per-letter rise, per the Woven spec */
  const h = document.querySelector(".hero .headline");
  if (h && !h.dataset.woven) {
    h.dataset.woven = "1";
    const words = h.textContent.split(" ");
    let k = 0;
    h.innerHTML = words.map(w =>
      `<span class="w-word">` + w.split("").map(ch =>
        `<span class="w-ch" style="transition-delay:${(1.2 + (k++) * 0.018).toFixed(3)}s">${ch}</span>`).join("") + `</span>`
    ).join(" ");
    requestAnimationFrame(() => requestAnimationFrame(() => h.classList.add("lit")));
  }
})();
