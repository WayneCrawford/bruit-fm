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
  const CATEGORICAL = { light: ["#2a78d6", "#eb6834", "#1baf7a"], dark: ["#3987e5", "#d95926", "#199e70"] };
  const ORDINAL = { light: ["#3987e5", "#256abf", "#184f95", "#0d366b"], dark: ["#1c5cab", "#3987e5", "#86b6ef", "#cde2fb"] };

  const SENSORS = ["Seismometer + pressure", "Seismometer only", "Pressure only"];
  const ACCESS = {
    open: "Open, data verified", no_data: "No data found",
    on_request: "On request (not on FDSN)", unverified: "Not verified",
  };
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
    s.y0 = start ? start.getUTCFullYear() : null;
    s.y1 = end ? end.getUTCFullYear() : NOW.getUTCFullYear();
    s.days = start ? Math.round(((end || NOW) - start) / DAY) : null;
    s.bins = {
      fs: binOf(BINS.fs.edges, s.fs), duration: binOf(BINS.duration.edges, s.days),
      depth: binOf(BINS.depth.edges, s.depth), year: binOf(BINS.year.edges, s.y0),
    };
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
    sensor: new Set([0, 1, 2]), fs: new Set([0, 1, 2, 3, -1]), duration: new Set([0, 1, 2, 3, -1]),
    access: new Set(Object.keys(ACCESS)),
  };

  const $ = sel => document.querySelector(sel);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = d => d ? d.toISOString().slice(0, 10) : "present";
  const fmtYears = (a, b) => { const y0 = a ? a.slice(0, 4) : "?", y1 = b ? b.slice(0, 4) : "now"; return y0 === y1 ? y0 : `${y0}–${y1}`; };
  const fdsnUrl = n => `https://www.fdsn.org/networks/detail/${encodeURIComponent(n.id)}/`;

  // ---------- carte ----------
  const map = L.map("map", { preferCanvas: true, worldCopyJump: true, minZoom: 2 });
  const esri = (path, attribution, maxZoom) => L.tileLayer(
    `https://server.arcgisonline.com/ArcGIS/rest/services/${path}/MapServer/tile/{z}/{y}/{x}`, { attribution, maxZoom });
  const base = {
    "Light": esri("Canvas/World_Light_Gray_Base", "Tiles &copy; Esri — Esri, HERE, Garmin, OpenStreetMap contributors", 16),
    "Dark": esri("Canvas/World_Dark_Gray_Base", "Tiles &copy; Esri — Esri, HERE, Garmin, OpenStreetMap contributors", 16),
    "Ocean (Esri)": esri("Ocean/World_Ocean_Base", "Tiles &copy; Esri — GEBCO, NOAA, Garmin, HERE", 13),
    "Bathymetry (GEBCO)": L.tileLayer.wms("https://wms.gebco.net/mapserv?", { layers: "GEBCO_LATEST", format: "image/png", attribution: "GEBCO Compilation Group" }),
  };
  (isDark() ? base.Dark : base.Light).addTo(map);
  L.control.layers(base, null, { position: "topright" }).addTo(map);
  L.control.scale({ imperial: false }).addTo(map);
  const layer = L.layerGroup().addTo(map);

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
      Data access: ${esc(ACCESS[n.access].toLowerCase())}</p>
      <p><b>Channels</b><br>${esc(s.channels).replace(/; /g, "<br>")}</p>
      ${s.sensors ? `<p class="small muted">${esc(s.sensors)}</p>` : ""}
      <p class="small">Data centre: ${esc(s.dc)}</p>
      <a href="#net=${encodeURIComponent(n.id)}">Network details →</a>`;
  }

  // ---------- filtres ----------
  function passes(s, ignoreSelection) {
    if (!ignoreSelection && state.selected && s.net.id !== state.selected) return false;
    if (!state.access.has(s.net.access)) return false;
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
      <label class="chip"><input type="checkbox" data-key="${key}" value="${value}" checked>
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
      const bins = BINS[state.colorBy];
      items = bins.labels.map((l, i) => [ORDINAL[mode][i], l, visible.filter(s => s.bins[state.colorBy] === i).length]);
      const unknown = visible.filter(s => s.bins[state.colorBy] < 0).length;
      if (unknown) items.push(["#898781", "unknown", unknown]);
    }
    $("#legend").innerHTML = items.map(([c, l, n]) =>
      `<li><span class="swatch" style="background:${c}"></span>${esc(l)} <span class="n">${n}</span></li>`).join("");
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
        const n = pool.filter(s => key === "access" ? s.net.access === v
          : key === "sensor" ? s.sensor === Number(v) : s.bins[key] === Number(v)).length;
        el.textContent = n;
        // « inconnu » / « non vérifié » seulement s'ils existent
        el.closest(".chip").hidden = (v === "-1" || v === "unverified") && n === 0;
      });
    }
  }

  // ---------- rendu ----------
  let markers = new Map();

  function renderMarkers(visible) {
    layer.clearLayers();
    markers = new Map();
    const ring = getComputedStyle(document.documentElement).getPropertyValue("--marker-ring").trim();
    const big = state.selected != null;
    for (const s of visible) {
      const m = L.circleMarker([s.lat, s.lon], {
        radius: big ? 7 : 5, weight: 1.5, color: ring, fillColor: colorOf(s), fillOpacity: 1,
      }).bindPopup(() => popupHtml(s), { maxWidth: 320 })
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
        <span class="meta">${fmtYears(n.start, n.end)} · ${count}${count !== n.n ? "/" + n.n : ""} sta.</span>
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
        <dt>Data access</dt><dd>${esc(ACCESS[n.access])}</dd>
        <dt>Stations</dt><dd>${sts.length === all.length ? all.length : `${sts.length} shown of ${all.length}`}</dd>
        <dt>Data centre</dt><dd>${esc(n.dcs)}</dd>
        ${n.source === "fdsn" ? `<dt>FDSN</dt><dd><a href="${fdsnUrl(n)}" target="_blank" rel="noopener">network page</a></dd>` : `<dt>Source</dt><dd>curated addition (not on FDSN)</dd>`}
      </dl>
      <table class="stations">
        <thead><tr><th>Station</th><th>Start</th><th>End</th><th class="num">Depth</th><th>Channels</th></tr></thead>
        <tbody>${sts.sort((a, b) => a.code.localeCompare(b.code) || (a.start - b.start)).map(s => `
          <tr data-i="${s.i}"><td>${esc(s.code)}</td><td>${fmtDate(s.start)}</td><td>${fmtDate(s.end)}</td>
          <td class="num">${s.depth.toLocaleString("en")}</td><td>${esc(s.channels).replace(/; /g, "<br>")}</td></tr>`).join("")}
        </tbody>
      </table>`;
  }

  function renderTable(visible) {
    const rows = networkStats(visible);
    $("#table-title").textContent = `${rows.length} networks · ${visible.length} stations`;
    const cols = [
      ["Network", r => r.n.id], ["Name", r => r.n.name], ["Operator", r => r.n.operator || ""],
      ["Start", r => r.n.start || ""], ["End", r => r.n.end || "present"], ["Stations", r => r.count, true],
      ["Sensors", r => SENSORS[r.n.sensor]], ["Max rate (Hz)", r => r.n.fs ?? "", true],
      ["Data centres", r => r.n.dcs], ["Access", r => ACCESS[r.n.access]], ["DOI", r => r.n.doi || ""],
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
    $("#summary").textContent = `${visible.length.toLocaleString("en")} stations · ${nNets} networks shown`;
    $("#year-label").textContent = `${state.from} and ${state.to}`;
    $("#list-view").hidden = !!state.selected;
    $("#detail-view").hidden = !state.selected;
    if (state.selected) renderDetail(); else renderList(visible);
    if (fit && state.selected) $("#detail-view").scrollIntoView({ block: "start" });
    if (!$("#table-view").hidden) renderTable(stations.filter(s => passes(s, true)));
    if (fit && visible.length) {
      map.fitBounds(L.latLngBounds(visible.map(s => [s.lat, s.lon])).pad(0.15), { maxZoom: 9 });
    }
  }

  // ---------- navigation (#net=ID) ----------
  function route() {
    const m = location.hash.match(/net=([^&]+)/);
    const id = m ? decodeURIComponent(m[1]) : null;
    state.selected = id && byNet.has(id) ? id : null;
    $("#table-view").hidden = true;
    update(!!state.selected || first);
    first = false;
  }
  let first = true;

  $("#network-list").addEventListener("click", e => {
    const li = e.target.closest("li[data-id]");
    if (li) location.hash = "net=" + encodeURIComponent(li.dataset.id);
  });
  $("#network-list").addEventListener("keydown", e => {
    if (e.key === "Enter") e.target.closest("li[data-id]")?.click();
  });
  $("#detail-view").addEventListener("click", e => {
    if (e.target.id === "back") { history.pushState("", "", location.pathname); route(); return; }
    const tr = e.target.closest("tr[data-i]");
    if (tr) {
      const s = stations[Number(tr.dataset.i)];
      map.setView([s.lat, s.lon], Math.max(map.getZoom(), 8));
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
