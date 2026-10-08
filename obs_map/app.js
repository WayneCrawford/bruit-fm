/* Open OBS networks — carte interactive. Données : window.OBS (data/obs.js). */
(function () {
  "use strict";

  const D = window.OBS;
  const F = Object.fromEntries(D.fields.map((f, i) => [f, i]));
  const NOW = new Date();
  const DAY = 86400000;
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const isDark = () => document.documentElement.dataset.theme === "dark" ||
    (document.documentElement.dataset.theme !== "light" && darkQuery.matches);

  // ---------- palettes (validées : catégoriel all-pairs, ordinal sur fond carte) ----------
  const CATEGORICAL = { light: ["#2a78d6", "#eb6834", "#1baf7a", "#c2407e"], dark: ["#3987e5", "#d95926", "#199e70", "#d45fb0"] };
  // Classes ordonnées (fréquence, durée, profondeur, année) : 4 teintes bien distinctes,
  // bleu → vert → jaune → rouge du plus petit au plus grand. Validées toutes paires
  // (vision normale et daltonisme) sur les fonds de carte clair et sombre.
  const ORDINAL = { light: ["#2a78d6", "#1baf7a", "#c9b000", "#d62728"], dark: ["#3987e5", "#0f9d8a", "#9c9600", "#e0405c"] };

  const SENSORS = ["Seismometer + pressure", "Seismometer only", "Pressure only", "DAS (fibre optic)"];
  const DAS = 3;
  // points DAS individuels visibles à partir de ce zoom (sinon : tracé du câble seul)
  const DAS_POINTS_ZOOM = { world: 12, polar: 7 };
  const ACCESS = {
    open: "Open, data verified", open_external: "Open, outside FDSN", no_data: "No data found",
    on_request: "On request (data not public)", unverified: "Not verified",
    restricted: "Restricted / embargo",
  };
  // Tous les statuts sont affichés par défaut ; les stations restreintes se distinguent
  // par un marqueur creux et semi-transparent.
  const ACCESS_DEFAULT = Object.keys(ACCESS);
  const RESTRICTED_ALPHA = 0.55;
  const BINS = {
    fs: { edges: [5, 25, 100], labels: ["< 5 Hz", "5–25 Hz", "25–100 Hz", "≥ 100 Hz"] },
    duration: { edges: [30, 120, 365], labels: ["< 30 days", "30–120 days", "120 days–1 yr", "≥ 1 year"] },
    depth: { edges: [1000, 3000, 5000], labels: ["< 1000 m", "1000–3000 m", "3000–5000 m", "≥ 5000 m"] },
    year: { edges: [2005, 2013, 2020], labels: ["before 2005", "2005–2012", "2013–2019", "2020 onwards"] },
  };
  const binOf = (edges, v) => (v == null || Number.isNaN(v)) ? -1 : edges.filter(e => v >= e).length;

  // ---------- préparation des stations ----------
  const nets = D.networks;
  const stations = D.stations.map((r, i) => {
    const start = r[F.start] ? new Date(r[F.start]) : null;
    const end = r[F.end] ? new Date(r[F.end]) : null;
    const s = {
      i, net: nets[r[F.net]], code: r[F.code], lat: r[F.lat], lon: r[F.lon], depth: r[F.depth],
      start, end, channels: r[F.channels], fs: r[F.fs], sensor: r[F.sensor], sensors: r[F.sensors], dc: r[F.dc],
    };
    s.access = r[F.restricted] ? "restricted" : s.net.access;
    s.y0 = start ? start.getUTCFullYear() : null;
    s.y1 = end ? end.getUTCFullYear() : NOW.getUTCFullYear();
    s.days = start ? Math.round(((end || NOW) - start) / DAY) : null;
    s.bins = {
      fs: binOf(BINS.fs.edges, s.fs), duration: binOf(BINS.duration.edges, s.days),
      depth: binOf(BINS.depth.edges, s.depth), year: binOf(BINS.year.edges, s.y0),
    };
    s.das = s.sensor === DAS;
    s.cable = r[F.cable]; s.pos = r[F.pos];
    s.text = (s.code + " " + s.net.id + " " + s.net.name + " " + (s.net.operator || "")).toLowerCase();
    return s;
  });
  const byNet = new Map(nets.map(n => [n.id, []]));
  stations.forEach(s => byNet.get(s.net.id).push(s));

  // ---------- état ----------
  const years = stations.map(s => s.y0).filter(Boolean);
  const YMIN = Math.min(...years), YMAX = NOW.getUTCFullYear();
  const state = {
    q: "", from: YMIN, to: YMAX, colorBy: "sensor", selected: null,
    sensor: new Set([0, 1, 2, 3]), fs: new Set([0, 1, 2, 3, -1]), duration: new Set([0, 1, 2, 3, -1]),
    access: new Set(ACCESS_DEFAULT),
  };

  const $ = sel => document.querySelector(sel);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = d => d ? d.toISOString().slice(0, 10) : "present";
  const fmtYears = (a, b) => { const y0 = a ? a.slice(0, 4) : "?", y1 = b ? b.slice(0, 4) : "now"; return y0 === y1 ? y0 : `${y0}–${y1}`; };
  const fdsnUrl = n => `https://www.fdsn.org/networks/detail/${encodeURIComponent(n.fdsn)}/`;

  // ---------- carte : vue Monde (Mercator) et vues polaires (stéréographiques) ----------
  const ESRI_WORLD = "https://server.arcgisonline.com/ArcGIS/rest/services";
  const ATTR_ESRI = "Tiles &copy; Esri — Esri, HERE, Garmin, OpenStreetMap contributors";
  const ATTR_ESRI_OCEAN = "Tiles &copy; Esri — GEBCO, NOAA, Garmin, HERE";
  const ATTR_GIBS = 'Imagery: <a href="https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api">NASA GIBS</a> — Blue Marble';
  // GIBS : 5 niveaux natifs (8192 → 512 m/px). Deux niveaux plus larges sont ajoutés devant
  // (zoomOffset -2) pour voir le disque polaire entier, et le zoom au-delà agrandit les tuiles.
  const GIBS_RES = [32768, 16384, 8192, 4096, 2048, 1024, 512, 256, 128, 64];
  const PROJ = {
    "EPSG:3413": "+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
    "EPSG:3031": "+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
  };
  const polarCrs = (code, origin, resolutions) => new L.Proj.CRS(code, PROJ[code], { origin, resolutions });
  const gibs = (epsg, maxZoom) => L.tileLayer(
    `https://gibs.earthdata.nasa.gov/wmts/epsg${epsg}/best/BlueMarble_ShadedRelief_Bathymetry/default/500m/{z}/{y}/{x}.jpeg`,
    { attribution: ATTR_GIBS, tileSize: 512, zoomOffset: -2, minNativeZoom: 2, maxNativeZoom: 6, maxZoom });
  const esriWorld = (path, attribution, maxZoom) => L.tileLayer(
    `${ESRI_WORLD}/${path}/MapServer/tile/{z}/{y}/{x}`, { attribution, maxZoom });
  // Limites des vues polaires : les fonds GIBS couvrent jusqu'à ~52° au milieu des bords
  const NORTH = s => s.lat >= 55, SOUTH = s => s.lat <= -55;

  const VIEWS = {
    world: {
      label: "World", note: "", inView: () => true,
      make: () => ({
        crs: L.CRS.EPSG3857, center: [15, -150], zoom: 2, minZoom: 2, maxZoom: 16,
        layers: {
          "Light": esriWorld("Canvas/World_Light_Gray_Base", ATTR_ESRI, 16),
          "Dark": esriWorld("Canvas/World_Dark_Gray_Base", ATTR_ESRI, 16),
          "Ocean (Esri)": esriWorld("Ocean/World_Ocean_Base", ATTR_ESRI_OCEAN, 13),
          "Bathymetry (GEBCO)": L.tileLayer.wms("https://wms.gebco.net/mapserv?", { layers: "GEBCO_LATEST", format: "image/png", attribution: "GEBCO Compilation Group" }),
        },
        default: isDark() ? "Dark" : "Light",
      }),
    },
    antarctic: {
      label: "Antarctic", note: "south of 55°S", inView: SOUTH,
      make: () => ({
        crs: polarCrs("EPSG:3031", [-4194304, 4194304], GIBS_RES),
        center: [-90, 0], zoom: 2, minZoom: 0, maxZoom: 9,
        layers: { "Blue Marble bathymetry (NASA)": gibs(3031, 9) },
      }),
    },
    arctic: {
      label: "Arctic", note: "north of 55°N", inView: NORTH,
      make: () => ({
        crs: polarCrs("EPSG:3413", [-4194304, 4194304], GIBS_RES),
        center: [90, 0], zoom: 2, minZoom: 0, maxZoom: 9,
        layers: { "Blue Marble bathymetry (NASA)": gibs(3413, 9) },
      }),
    },
  };

  const ViewSwitch = L.Control.extend({
    options: { position: "topleft" },
    onAdd() {
      const div = L.DomUtil.create("div", "view-switch leaflet-bar");
      for (const key of ["world", "arctic", "antarctic"]) {
        const v = VIEWS[key];
        const b = L.DomUtil.create("button", key === view ? "active" : "", div);
        b.type = "button"; b.textContent = v.label; b.setAttribute("aria-pressed", String(key === view));
        b.addEventListener("click", () => { location.hash = hashFor(state.selected, key); });
      }
      L.DomEvent.disableClickPropagation(div);
      return div;
    },
  });

  let map, layer, dasPoints, view = null;
  function createMap(key) {
    if (map) map.remove();
    view = key;
    const c = VIEWS[key].make();
    map = L.map("map", { crs: c.crs, preferCanvas: true, worldCopyJump: key === "world",
                         minZoom: c.minZoom, maxZoom: c.maxZoom, zoomSnap: key === "world" ? 1 : 0.25 });
    const names = Object.keys(c.layers);
    c.layers[c.default || names[0]].addTo(map);
    if (names.length > 1) L.control.layers(c.layers, null, { position: "topright" }).addTo(map);
    new ViewSwitch().addTo(map);
    L.control.scale({ imperial: false }).addTo(map);
    layer = L.layerGroup().addTo(map);
    dasPoints = L.layerGroup();
    map.on("zoomend", toggleDasPoints);
    map.setView(c.center, c.zoom);
  }

  // Cadrage sur des points. En projection polaire, une emprise lat/lon n'est pas un rectangle :
  // on calcule l'emprise en pixels projetés pour chaque niveau de zoom.
  function fitPoints(latlngs, maxZoom = 9) {
    if (view === "world") {
      map.fitBounds(L.latLngBounds(latlngs).pad(0.15), { maxZoom });
      return;
    }
    const crs = map.options.crs, room = map.getSize().multiplyBy(0.8);
    const boundsAt = z => L.bounds(latlngs.map(ll => crs.latLngToPoint(L.latLng(ll), z)));
    let z = Math.min(maxZoom, 6);  // au-delà, les tuiles GIBS (500 m/px) sont juste agrandies
    while (z > map.getMinZoom()) {
      const d = boundsAt(z).getSize();
      if (d.x <= room.x && d.y <= room.y) break;
      z -= map.options.zoomSnap;
    }
    map.setView(crs.pointToLatLng(boundsAt(z).getCenter(), z), z, { animate: false });
  }

  function colorOf(s) {
    const mode = isDark() ? "dark" : "light";
    if (state.colorBy === "sensor") return CATEGORICAL[mode][s.sensor];
    const b = s.bins[state.colorBy];
    return b < 0 ? "#898781" : ORDINAL[mode][b];
  }

  function popupHtml(s) {
    const n = s.net;
    return `<h3>${esc(n.code)}.${esc(s.code)}</h3>
      <div class="muted">${esc(n.name)}</div>
      <p>${fmtDate(s.start)} → ${fmtDate(s.end)}<br>
      Water depth: ${s.depth.toLocaleString("en")} m<br>
      Sensors: ${esc(SENSORS[s.sensor].toLowerCase())}<br>
      Data access: ${esc(ACCESS[s.access].toLowerCase())}</p>
      <p><b>Channels</b><br>${esc(s.channels).replace(/; /g, "<br>")}</p>
      ${s.sensors ? `<p class="small muted">${esc(s.sensors)}</p>` : ""}
      <p class="small">Data centre: ${s.net.source === "curated" ? "— (curated addition)" : esc(s.dc)}</p>
      <a href="#net=${encodeURIComponent(n.id)}">Network details →</a>`;
  }

  // ---------- filtres ----------
  function passes(s, ignoreSelection) {
    if (!ignoreSelection && state.selected && s.net.id !== state.selected) return false;
    if (!VIEWS[view].inView(s)) return false;
    if (!state.access.has(s.access)) return false;
    if (!state.sensor.has(s.sensor)) return false;
    if (!state.fs.has(s.bins.fs)) return false;
    if (!state.duration.has(s.bins.duration)) return false;
    if (s.y0 != null && (s.y0 > state.to || s.y1 < state.from)) return false;
    if (state.q && !s.text.includes(state.q)) return false;
    return true;
  }

  function buildChips(container, key, items) {
    const el = $(container);
    el.innerHTML = items.map(([value, label, color]) => `
      <label class="chip"><input type="checkbox" data-key="${key}" value="${value}"
        ${state[key].has(key === "access" ? value : Number(value)) ? "checked" : ""}>
      ${color ? `<span class="swatch" style="background:${color}"></span>` : ""}${esc(label)}
      <span class="n" data-count="${key}:${value}"></span></label>`).join("");
    el.addEventListener("change", e => {
      const v = e.target.value, set = state[key];
      const parsed = key === "access" ? v : Number(v);
      e.target.checked ? set.add(parsed) : set.delete(parsed);
      update();
    });
  }

  function initFilters() {
    const mode = isDark() ? "dark" : "light";
    buildChips("#f-sensor", "sensor", SENSORS.map((l, i) => [i, l, CATEGORICAL[mode][i]]));
    buildChips("#f-fs", "fs", BINS.fs.labels.map((l, i) => [i, l]).concat([[-1, "unknown"]]));
    buildChips("#f-duration", "duration", BINS.duration.labels.map((l, i) => [i, l]));
    buildChips("#f-access", "access", Object.entries(ACCESS));
    const ranges = [["#year-from", "from"], ["#year-to", "to"]];
    for (const [sel, key] of ranges) {
      const input = $(sel);
      Object.assign(input, { min: YMIN, max: YMAX, step: 1, value: state[key] });
      input.addEventListener("input", () => {
        state[key] = Number(input.value);
        if (state.from > state.to) { // les poignées ne se croisent pas
          if (key === "from") state.to = state.from; else state.from = state.to;
          $("#year-from").value = state.from; $("#year-to").value = state.to;
        }
        update();
      });
    }
    let timer;
    $("#search").addEventListener("input", e => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); update(); }, 150);
    });
    $("#color-by").addEventListener("change", e => { state.colorBy = e.target.value; update(); });
  }

  function renderLegend(visible) {
    const mode = isDark() ? "dark" : "light";
    let items;
    if (state.colorBy === "sensor") {
      items = SENSORS.map((l, i) => [CATEGORICAL[mode][i], l, visible.filter(s => s.sensor === i).length]);
    } else {
      // les points DAS ne comptent pas comme stations : les câbles ont leur propre ligne
      const bins = BINS[state.colorBy], obs = visible.filter(s => !s.das);
      items = bins.labels.map((l, i) => [ORDINAL[mode][i], l, obs.filter(s => s.bins[state.colorBy] === i).length]);
      const unknown = obs.filter(s => s.bins[state.colorBy] < 0).length;
      if (unknown) items.push(["#898781", "unknown", unknown]);
    }
    const nr = visible.filter(s => s.access === "restricted" && !s.das).length;
    const nCables = cablesOf(visible).length;
    $("#legend").innerHTML = items.map(([c, l, n], i) =>
      state.colorBy === "sensor" && i === DAS
        ? (nCables ? `<li><span class="swatch line" style="background:${c}"></span>${esc(l)} <span class="n">${nCables} cable${nCables > 1 ? "s" : ""}</span></li>` : "")
        : `<li><span class="swatch" style="background:${c}"></span>${esc(l)} <span class="n">${n}</span></li>`).join("")
      + (state.colorBy !== "sensor" && nCables ? `<li><span class="swatch line"></span>DAS cable <span class="n">${nCables}</span></li>` : "")
      + (nr ? `<li><span class="swatch hollow"></span>Restricted / embargo <span class="n">${nr}</span></li>` : "");
  }

  function updateCounts() {
    // compte de chaque chip à filtres courants, hors filtre de la dimension elle-même
    for (const key of ["sensor", "fs", "duration", "access"]) {
      const saved = state[key];
      state[key] = { has: () => true };
      const pool = stations.filter(s => passes(s, false));
      state[key] = saved;
      document.querySelectorAll(`[data-count^="${key}:"]`).forEach(el => {
        const v = el.dataset.count.split(":")[1];
        const match = pool.filter(s => key === "access" ? s.access === v
          : key === "sensor" ? s.sensor === Number(v) : s.bins[key] === Number(v));
        // la puce DAS compte des câbles, pas les centaines de points le long de la fibre
        const n = key === "sensor" && Number(v) === DAS ? cablesOf(match).length : match.length;
        el.textContent = n;
        // « inconnu » / « non vérifié » seulement s'ils existent
        el.closest(".chip").hidden = (v === "-1" || v === "unverified") && n === 0;
      });
    }
  }

  // ---------- rendu ----------
  let markers = new Map();

  // Câbles DAS : points regroupés par réseau + câble, triés le long de la fibre
  function cablesOf(sts) {
    const groups = new Map();
    for (const s of sts) {
      if (!s.das) continue;
      const key = s.net.id + "|" + (s.cable || s.code);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s);
    }
    return [...groups.values()].map(pts => pts.sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0)));
  }

  function lengthKm(pts) {
    let d = 0;
    for (let i = 1; i < pts.length; i++) d += L.latLng(pts[i - 1].lat, pts[i - 1].lon).distanceTo([pts[i].lat, pts[i].lon]);
    return d / 1000;
  }

  function cableHtml(pts) {
    const s = pts[0], n = s.net, depths = pts.map(p => p.depth);
    const start = new Date(Math.min(...pts.map(p => p.start))), ends = pts.map(p => p.end);
    const end = ends.some(e => !e) ? null : new Date(Math.max(...ends));
    return `<h3>${esc(n.code)} · cable ${esc(s.cable || s.code)}</h3>
      <div class="muted">${esc(n.name)}</div>
      <p>${fmtDate(start)} → ${fmtDate(end)}<br>
      DAS channels: ${pts.length}${pts.length > 1 ? ` · ${lengthKm(pts).toFixed(1)} km of fibre` : ""}<br>
      Water depth: ${Math.max(0, Math.min(...depths)).toLocaleString("en")}–${Math.max(...depths).toLocaleString("en")} m<br>
      Data access: ${esc(ACCESS[s.access].toLowerCase())}</p>
      <p><b>Channels</b><br>${esc(s.channels).replace(/; /g, "<br>")}</p>
      ${s.sensors ? `<p class="small muted">${esc(s.sensors)}</p>` : ""}
      <p class="small">Data centre: ${s.net.source === "curated" ? "— (curated addition)" : esc(s.dc)}</p>
      <a href="#net=${encodeURIComponent(n.id)}">Network details →</a>`;
  }

  function toggleDasPoints() {
    const minZoom = view === "world" ? DAS_POINTS_ZOOM.world : DAS_POINTS_ZOOM.polar;
    if (map.getZoom() >= minZoom) dasPoints.addTo(map); else dasPoints.remove();
  }

  function renderCables(visible, ring) {
    dasPoints.clearLayers();
    const popupOpts = { maxWidth: 320, autoPanPaddingTopLeft: L.point(20, 100) };
    for (const pts of cablesOf(visible)) {
      const s = pts[0], color = colorOf(s), restricted = s.access === "restricted";
      const alpha = restricted ? RESTRICTED_ALPHA : 1;
      if (pts.length > 1) {
        const line = pts.map(p => [p.lat, p.lon]);
        // liseré couleur de fond sous le tracé, pour le détacher du fond de carte
        L.polyline(line, { color: ring, weight: 6, opacity: 0.8 * alpha, interactive: false }).addTo(layer);
        const cable = L.polyline(line, { color, weight: 3.5, opacity: alpha, dashArray: restricted ? "6 5" : null })
          .bindPopup(() => cableHtml(pts), popupOpts)
          .bindTooltip(`${s.net.code} · DAS cable ${s.cable || s.code} (${pts.length} ch.)`, { sticky: true });
        cable.addTo(layer);
        for (const p of pts) markers.set(p.i, cable);
      }
      // points le long de la fibre : seulement en zoom rapproché (ou câble d'un seul point)
      for (const p of pts) {
        const m = L.circleMarker([p.lat, p.lon], { radius: pts.length > 1 ? 3 : 5, weight: 1, color: ring,
          fillColor: color, fillOpacity: alpha, opacity: alpha })
          .bindPopup(() => popupHtml(p), popupOpts)
          .bindTooltip(`${p.net.code}.${p.code}`, { direction: "top", offset: [0, -4] });
        if (pts.length > 1) { m.addTo(dasPoints); } else { m.addTo(layer); markers.set(p.i, m); }
      }
    }
    toggleDasPoints();
  }

  function renderMarkers(visible) {
    layer.clearLayers();
    markers = new Map();
    // contour couleur de fond en vue Monde ; blanc sur l'imagerie sombre des vues polaires
    const ring = view === "world"
      ? getComputedStyle(document.documentElement).getPropertyValue("--marker-ring").trim() : "#ffffff";
    const big = state.selected != null;
    // stations restreintes dessinées d'abord : les stations ouvertes restent au-dessus
    renderCables(visible, ring);
    const obs = visible.filter(s => !s.das);
    const ordered = obs.filter(s => s.access === "restricted")
      .concat(obs.filter(s => s.access !== "restricted"));
    for (const s of ordered) {
      const restricted = s.access === "restricted";
      const m = L.circleMarker([s.lat, s.lon], restricted
        // creux : contour à la couleur de la catégorie, intérieur couleur de fond
        ? { radius: big ? 6 : 4.5, weight: 2, color: colorOf(s), opacity: RESTRICTED_ALPHA,
            fillColor: ring, fillOpacity: RESTRICTED_ALPHA * 0.6 }
        : { radius: big ? 7 : 5, weight: 1.5, color: ring, fillColor: colorOf(s), fillOpacity: 1 }).bindPopup(() => popupHtml(s), { maxWidth: 320, autoPanPaddingTopLeft: L.point(20, 100) })
        .bindTooltip(`${s.net.code}.${s.code}`, { direction: "top", offset: [0, -6] });
      m.addTo(layer);
      markers.set(s.i, m);
    }
  }

  function networkStats(visible) {
    const counts = new Map();
    visible.forEach(s => counts.set(s.net.id, (counts.get(s.net.id) || 0) + 1));
    return nets.filter(n => counts.has(n.id)).map(n => ({ n, count: counts.get(n.id) }))
      .sort((a, b) => (b.n.start || "").localeCompare(a.n.start || "") || a.n.id.localeCompare(b.n.id));
  }

  function renderList(visible) {
    const rows = networkStats(visible);
    $("#list-title").textContent = `${rows.length} network${rows.length === 1 ? "" : "s"}`;
    $("#network-list").innerHTML = rows.length ? rows.map(({ n, count }) => `
      <li tabindex="0" data-id="${esc(n.id)}">
        <span class="id">${esc(n.id)}</span>
        <span class="meta">${fmtYears(n.start, n.end)} · ${n.nd === n.n
          ? `DAS, ${count} ch.` : `${count}${count !== n.n ? "/" + n.n : ""} sta.`}</span>
        <span class="name" title="${esc(n.name)}">${esc(n.name)}</span>
      </li>`).join("") : `<li class="empty">No network matches these filters.</li>`;
  }

  function renderDetail() {
    const n = nets.find(x => x.id === state.selected);
    const sts = byNet.get(n.id).filter(s => passes(s, false));
    const all = byNet.get(n.id);
    $("#detail-view").innerHTML = `
      <button class="link-btn" id="back">← All networks</button>
      <h2>${esc(n.id)}</h2>
      <div class="muted">${esc(n.name)}</div>
      <dl>
        <dt>Period</dt><dd>${esc(n.start || "?")} → ${esc(n.end || "present")}</dd>
        <dt>Operator</dt><dd>${esc(n.operator || "—")}</dd>
        <dt>DOI</dt><dd>${n.doi ? `<a href="${esc(n.doi)}" target="_blank" rel="noopener">${esc(n.doi.replace("https://doi.org/", ""))}</a>` : "—"}</dd>
        <dt>Data access</dt><dd>${esc(ACCESS[n.access])}${n.nr && n.access !== "restricted" ? ` (${n.nr} restricted station${n.nr > 1 ? "s" : ""})` : ""}</dd>
        ${n.nr ? `<dt></dt><dd class="small muted">No public embargo end date in the metadata; contact the network operator (see FDSN page).</dd>` : ""}
        <dt>${n.nd === n.n ? "DAS channels" : "Stations"}</dt><dd>${sts.length === all.length ? all.length : `${sts.length} shown of ${all.length}`}</dd>
        <dt>Data centre</dt><dd>${n.source === "curated" ? "—" : esc(n.dcs)}</dd>
        ${n.url ? `<dt>Data</dt><dd><a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.url)}</a></dd>` : ""}
        ${n.note ? `<dt>Note</dt><dd class="small">${esc(n.note)}</dd>` : ""}
        ${n.fdsn ? `<dt>FDSN</dt><dd><a href="${fdsnUrl(n)}" target="_blank" rel="noopener">network page</a></dd>` : `<dt>Source</dt><dd>curated addition (not on FDSN)</dd>`}
      </dl>
      ${n.nd ? dasTable(sts) : ""}
      ${sts.some(s => !s.das) ? `<table class="stations">
        <thead><tr><th>Station</th><th>Start</th><th>End</th><th class="num">Depth</th><th>Channels</th></tr></thead>
        <tbody>${sts.filter(s => !s.das).sort((a, b) => a.code.localeCompare(b.code) || (a.start - b.start)).map(s => `
          <tr data-i="${s.i}"><td>${esc(s.code)}${s.access === "restricted" ? ' <span class="muted" title="Restricted / embargo">🔒</span>' : ""}</td><td>${fmtDate(s.start)}</td><td>${fmtDate(s.end)}</td>
          <td class="num">${s.depth.toLocaleString("en")}</td><td>${esc(s.channels).replace(/; /g, "<br>")}</td></tr>`).join("")}
        </tbody>
      </table>` : ""}`;
  }

  function dasTable(sts) {
    const rows = cablesOf(sts).map(pts => {
      const depths = pts.map(p => p.depth), first = pts[0], last = pts[pts.length - 1];
      return `<tr data-cable="${esc(first.net.id + "|" + (first.cable || first.code))}">
        <td>${esc(first.cable || first.code)}</td><td class="num">${pts.length}</td>
        <td>${pts.length > 1 ? `${esc(first.code)}–${esc(last.code)}` : esc(first.code)}</td>
        <td class="num">${pts.length > 1 ? lengthKm(pts).toFixed(1) : "—"}</td>
        <td class="num">${Math.max(0, Math.min(...depths)).toLocaleString("en")}–${Math.max(...depths).toLocaleString("en")}</td></tr>`;
    }).join("");
    return `<p class="small muted">Distributed acoustic sensing: each channel is a point along the fibre,
      ordered by its station code. Length is measured along the plotted channel positions.</p>
      <table class="stations">
        <thead><tr><th>Cable</th><th class="num">Channels</th><th>Channel codes</th><th class="num">Length (km)</th><th class="num">Depth (m)</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  function renderTable(visible) {
    const rows = networkStats(visible);
    $("#table-title").textContent = `${rows.length} networks · ${visible.length} stations`;
    const cols = [
      ["Network", r => r.n.id], ["Name", r => r.n.name], ["Operator", r => r.n.operator || ""],
      ["Start", r => r.n.start || ""], ["End", r => r.n.end || "present"], ["Stations", r => r.count, true], ["Type", r => r.n.nd === r.n.n ? "DAS" : "OBS"],
      ["Sensors", r => SENSORS[r.n.sensor]], ["Max rate (Hz)", r => r.n.fs ?? "", true],
      ["Data centres", r => r.n.source === "curated" ? "—" : r.n.dcs], ["Access", r => ACCESS[r.n.access] + (r.n.nr && r.n.access !== "restricted" ? ` (${r.n.nr} restricted)` : "")], ["DOI", r => r.n.doi || ""],
    ];
    const table = $("#network-table");
    const sort = table._sort || { col: 3, dir: -1 };
    rows.sort((a, b) => {
      const va = cols[sort.col][1](a), vb = cols[sort.col][1](b);
      return (typeof va === "number" ? va - vb : String(va).localeCompare(String(vb))) * sort.dir;
    });
    table.innerHTML = `<thead><tr>${cols.map(([h], i) =>
      `<th data-col="${i}" ${i === sort.col ? `aria-sort="${sort.dir > 0 ? "ascending" : "descending"}"` : ""}>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(r => `<tr>${cols.map(([h, f, num]) => {
        const v = f(r);
        if (h === "Network") return `<td><a href="#net=${encodeURIComponent(v)}" data-close>${esc(v)}</a></td>`;
        if (h === "DOI") return `<td>${v ? `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(v.replace("https://doi.org/", ""))}</a>` : ""}</td>`;
        return `<td${num ? ' class="num"' : ""}>${esc(v)}</td>`;
      }).join("")}</tr>`).join("")}</tbody>`;
    table._sort = sort;
  }

  function update(fit) {
    const visible = stations.filter(s => passes(s, false));
    renderMarkers(visible);
    renderLegend(visible);
    updateCounts();
    const nNets = new Set(visible.map(s => s.net.id)).size;
    const note = VIEWS[view].note ? ` · ${VIEWS[view].label} view (${VIEWS[view].note})` : "";
    const nObs = visible.filter(s => !s.das).length, nCables = cablesOf(visible).length;
    const parts = [];
    if (nObs || !nCables) parts.push(`${nObs.toLocaleString("en")} stations`);
    if (nCables) parts.push(`${nCables} DAS cable${nCables > 1 ? "s" : ""}`);
    $("#summary").textContent = `${parts.join(" · ")} · ${nNets} networks shown${note}`;
    $("#year-label").textContent = `${state.from} and ${state.to}`;
    $("#list-view").hidden = !!state.selected;
    $("#detail-view").hidden = !state.selected;
    if (state.selected) renderDetail(); else renderList(visible);
    if (fit && state.selected) $("#detail-view").scrollIntoView({ block: "start" });
    if (!$("#table-view").hidden) renderTable(stations.filter(s => passes(s, true)));
    if (fit && visible.length) {
      fitPoints(visible.map(s => [s.lat, s.lon]));
    }
  }

  // ---------- navigation (#net=ID&view=arctic) ----------
  function hashFor(net, v) {
    const parts = [];
    if (net) parts.push("net=" + encodeURIComponent(net));
    if (v && v !== "world") parts.push("view=" + v);
    return parts.join("&");
  }

  // Vue adaptée à un réseau : on garde la vue polaire courante si elle le contient,
  // on bascule en vue polaire si toutes ses stations sont au-delà de 60°, sinon Monde.
  function chooseView(id) {
    const sts = byNet.get(id);
    // au premier chargement aucune vue n'existe encore (view === null)
    if (view && view !== "world" && sts.every(VIEWS[view].inView)) return view;
    if (sts.every(s => s.lat >= 60)) return "arctic";
    if (sts.every(s => s.lat <= -60)) return "antarctic";
    return "world";
  }

  function route() {
    const params = new URLSearchParams(location.hash.slice(1));
    const id = params.get("net");
    state.selected = id && byNet.has(id) ? id : null;
    // lien direct vers un réseau restreint : on active le filtre plutôt que d'afficher une carte vide
    if (state.selected && !state.access.has("restricted") &&
        byNet.get(state.selected).every(s => s.access === "restricted")) {
      state.access.add("restricted");
      document.querySelector('input[data-key="access"][value="restricted"]').checked = true;
    }
    const asked = params.get("view");
    const want = asked in VIEWS ? asked : (state.selected ? chooseView(state.selected) : "world");
    const switched = want !== view;
    if (switched) createMap(want);
    $("#table-view").hidden = true;
    update(!!state.selected || first || switched);
    first = false;
  }
  let first = true;

  $("#network-list").addEventListener("click", e => {
    const li = e.target.closest("li[data-id]");
    if (li) location.hash = hashFor(li.dataset.id, chooseView(li.dataset.id));
  });
  $("#network-list").addEventListener("keydown", e => {
    if (e.key === "Enter") e.target.closest("li[data-id]")?.click();
  });
  $("#detail-view").addEventListener("click", e => {
    if (e.target.id === "back") {
      if (view === "world") { history.pushState("", "", location.pathname); route(); }
      else location.hash = hashFor(null, view);
      return;
    }
    const trc = e.target.closest("tr[data-cable]");
    if (trc) {
      const pts = cablesOf(byNet.get(state.selected)).find(p => p[0].net.id + "|" + (p[0].cable || p[0].code) === trc.dataset.cable);
      if (pts) fitPoints(pts.map(p => [p.lat, p.lon]), 13);
      return;
    }
    const tr = e.target.closest("tr[data-i]");
    if (tr) {
      const s = stations[Number(tr.dataset.i)];
      // fonds polaires GIBS : 500 m/pixel au mieux, inutile de zoomer plus près
      map.setView([s.lat, s.lon], Math.max(map.getZoom(), view === "world" ? 8 : 5));
      markers.get(s.i)?.openPopup();
    }
  });
  $("#open-table").addEventListener("click", () => {
    $("#table-view").hidden = false;
    renderTable(stations.filter(s => passes(s, true)));
  });
  $("#close-table").addEventListener("click", () => { $("#table-view").hidden = true; });
  $("#network-table").addEventListener("click", e => {
    const th = e.target.closest("th[data-col]");
    if (th) {
      const t = $("#network-table"), col = Number(th.dataset.col);
      t._sort = { col, dir: t._sort && t._sort.col === col ? -t._sort.dir : 1 };
      renderTable(stations.filter(s => passes(s, true)));
    }
    if (e.target.matches("[data-close]")) $("#table-view").hidden = true;
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") $("#table-view").hidden = true; });
  $("#panel-toggle").addEventListener("click", () => {
    const collapsed = $("#panel").classList.toggle("collapsed");
    $("#panel-toggle").setAttribute("aria-expanded", String(!collapsed));
    $("#panel-toggle").textContent = collapsed ? "▴" : "▾";
    setTimeout(() => map.invalidateSize(), 50);
  });
  darkQuery.addEventListener("change", () => update());
  window.addEventListener("hashchange", route);

  $("#generated").textContent = D.generated;
  initFilters();
  route();
})();
