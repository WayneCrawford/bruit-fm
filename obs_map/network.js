/* Page dédiée d'un réseau : instruments et canaux par station. Données : window.OBS + data/net/<id>.json */
(function () {
  "use strict";

  const D = window.OBS;
  const F = Object.fromEntries(D.fields.map((f, i) => [f, i]));
  const ACCESS = {
    open: "Open, data verified", open_external: "Open, outside FDSN", no_data: "No data found",
    on_request: "On request (data not public)", unverified: "Not verified",
    restricted: "Restricted / embargo",
  };
  const $ = sel => document.querySelector(sel);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtRate = r => r == null ? "?" : Number(r).toLocaleString("en", { maximumFractionDigits: 3 });
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  // même suffixe de version que les scripts de la page : le JSON du réseau suit les mises à jour
  const version = (document.querySelector('script[src^="network.js"]').src.match(/\?v=(\w+)/) || [])[1] || "";

  let rows = [], net = null, map = null;

  function load() {
    const id = decodeURIComponent(location.hash.slice(1));
    const index = D.networks.findIndex(n => n.id === id);
    net = D.networks[index];
    if (!net) {
      $("#net-id").textContent = "Network not found";
      $("#net-name").textContent = id ? `No network “${id}” in the catalogue.` : "No network selected.";
      document.querySelectorAll("section").forEach(s => { s.hidden = true; });
      return;
    }
    document.title = `${net.id} – OBS network`;
    $("#back-to-map").href = `index.html#net=${encodeURIComponent(net.id)}`;
    $("#net-id").textContent = net.id;
    $("#net-name").textContent = net.name;
    renderMeta();
    renderMap(index);
    fetch(`data/net/${encodeURIComponent(net.id)}.json?v=${version}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { rows = data; renderInstruments(); renderChannels(); })
      .catch(() => { $("#channels-note").textContent = "Channel details could not be loaded."; });
    $("#page-footer").innerHTML = `Catalogue updated ${esc(D.generated)}. Sensor names are cleaned from the
      FDSN station metadata (serial numbers and data loggers removed).`;
  }

  function renderMeta() {
    const n = net;
    const items = [
      ["Period", `${esc(n.start || "?")} → ${esc(n.end || "present")}`],
      ["Operator", esc(n.operator || "—")],
      ["DOI", n.doi ? `<a href="${esc(n.doi)}" target="_blank" rel="noopener">${esc(n.doi.replace("https://doi.org/", ""))}</a>` : "—"],
      ["Data access", esc(ACCESS[n.access] || n.access) +
        (n.nr && n.access !== "restricted" ? ` (${n.nr} restricted station${n.nr > 1 ? "s" : ""})` : "")],
      [n.nd === n.n ? "DAS channels" : "Stations", n.n.toLocaleString("en")],
      ["Data centre", n.source === "curated" ? "—" : esc(n.dcs)],
    ];
    if (n.fdsn) items.push(["FDSN", `<a href="https://www.fdsn.org/networks/detail/${encodeURIComponent(n.fdsn)}/" target="_blank" rel="noopener">network page</a>`]);
    if (n.url) items.push(["Data", `<a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.url)}</a>`]);
    if (n.note) items.push(["Note", esc(n.note)]);
    $("#net-meta").innerHTML = items.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  }

  function renderMap(index) {
    if (map) map.remove();
    const dark = darkQuery.matches;
    map = L.map("mini-map", { preferCanvas: true, scrollWheelZoom: false });
    L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${dark ? "Dark" : "Light"}_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
      { attribution: "Tiles &copy; Esri — Esri, HERE, Garmin, OpenStreetMap contributors", maxZoom: 16 }).addTo(map);
    const css = getComputedStyle(document.documentElement);
    const accent = css.getPropertyValue("--accent").trim(), ring = css.getPropertyValue("--marker-ring").trim();
    const sts = D.stations.filter(r => r[F.net] === index);
    const cables = new Map();
    for (const r of sts) {
      if (r[F.cable] != null) {
        if (!cables.has(r[F.cable])) cables.set(r[F.cable], []);
        cables.get(r[F.cable]).push(r);
        continue;
      }
      const restricted = r[F.restricted] === 1;
      L.circleMarker([r[F.lat], r[F.lon]], restricted
        ? { radius: 4.5, weight: 2, color: accent, opacity: 0.55, fillColor: ring, fillOpacity: 0.3 }
        : { radius: 5, weight: 1.5, color: ring, fillColor: accent, fillOpacity: 1 })
        .bindTooltip(r[F.code], { direction: "top", offset: [0, -6] }).addTo(map);
    }
    for (const [cable, pts] of cables) {
      pts.sort((a, b) => (a[F.pos] ?? 0) - (b[F.pos] ?? 0));
      L.polyline(pts.map(p => [p[F.lat], p[F.lon]]), { color: accent, weight: 3.5 })
        .bindTooltip(`DAS cable ${cable} (${pts.length} ch.)`, { sticky: true }).addTo(map);
    }
    const ll = sts.map(r => [r[F.lat], r[F.lon]]);
    if (ll.length) map.fitBounds(L.latLngBounds(ll).pad(0.2), { maxZoom: 10 });
    L.control.scale({ imperial: false }).addTo(map);
  }

  // Synthèse par configuration : même capteur, mêmes canaux, même fréquence
  function renderInstruments() {
    const groups = new Map();
    for (const r of rows) {
      for (const [chans, rate, sensor] of r.inst) {
        const key = `${sensor}|${chans}|${rate}`;
        if (!groups.has(key)) groups.set(key, { sensor, chans, rate, stations: new Set() });
        groups.get(key).stations.add(r.sta);
      }
    }
    const list = [...groups.values()].sort((a, b) => b.stations.size - a.stations.size || a.sensor.localeCompare(b.sensor));
    const das = net.nd === net.n;
    $("#instruments").innerHTML = `<thead><tr><th>Sensor</th><th>Channels</th><th class="num">Rate (Hz)</th>
      <th class="num">${das ? "DAS channels" : "Stations"}</th>${das ? "" : "<th>Station codes</th>"}</tr></thead>
      <tbody>${list.map(g => {
        const codes = [...g.stations].sort();
        const shown = codes.length > 12 ? codes.slice(0, 12).join(" ") + " …" : codes.join(" ");
        return `<tr><td>${esc(g.sensor)}</td><td class="mono">${esc(g.chans)}</td><td class="num">${fmtRate(g.rate)}</td>
          <td class="num">${codes.length}</td>${das ? "" : `<td class="mono small" title="${esc(codes.join(" "))}">${esc(shown)}</td>`}</tr>`;
      }).join("")}</tbody>`;
  }

  function renderChannels() {
    const das = net.nd === net.n;
    if (das) {
      $("#channels-section").hidden = true;
      return;
    }
    const q = $("#filter").value.trim().toLowerCase();
    const shown = rows.filter(r => !r.das && (!q || r.sta.toLowerCase().includes(q)
      || r.inst.some(i => i[2].toLowerCase().includes(q) || i[0].toLowerCase().includes(q))));
    const total = rows.filter(r => !r.das).length;
    $("#channels-note").textContent = shown.length === total
      ? `${total} deployment${total > 1 ? "s" : ""}; one line per sensor. A station redeployed at another position appears twice.`
      : `${shown.length} of ${total} deployments match the filter.`;
    $("#channels").innerHTML = `<thead><tr><th>Station</th><th>Channels</th><th class="num">Rate (Hz)</th>
      <th>Sensor</th><th>Start</th><th>End</th><th class="num">Depth (m)</th></tr></thead>
      <tbody>${shown.map(r => r.inst.map((i, k) => {
        const span = r.inst.length > 1 ? ` rowspan="${r.inst.length}"` : "";
        const first = k === 0;
        return `<tr class="${first ? "group-start" : ""}">
          ${first ? `<th scope="row"${span}>${esc(r.sta)}${r.restricted ? ' <span title="Restricted / embargo">🔒</span>' : ""}</th>` : ""}
          <td class="mono">${esc(i[0])}</td><td class="num">${fmtRate(i[1])}</td><td>${esc(i[2])}</td>
          ${first ? `<td${span}>${esc(r.start || "?")}</td><td${span}>${esc(r.end || "present")}</td>
            <td class="num"${span}>${r.depth.toLocaleString("en")}</td>` : ""}
        </tr>`;
      }).join("")).join("")}</tbody>`;
  }

  function downloadCsv() {
    const quote = v => /[",\n]/.test(String(v ?? "")) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? "");
    const lines = [["network", "station", "start", "end", "depth_m", "channels", "sample_rate_hz", "sensor", "restricted"].join(",")];
    for (const r of rows) for (const [chans, rate, sensor] of r.inst) {
      lines.push([net.id, r.sta, r.start, r.end || "", r.depth, chans, rate ?? "", sensor, r.restricted].map(quote).join(","));
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n") + "\n"], { type: "text/csv" }));
    a.download = `${net.id}_channels.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // « Back to the map » : retour exact à la page d'origine si l'on vient de la carte
  // (même vue, mêmes filtres) ; sinon, la carte avec ce réseau sélectionné.
  function cameFromMap() {
    if (!document.referrer || history.length < 2) return false;
    try {
      const ref = new URL(document.referrer);
      const map = new URL("index.html", location.href);
      return ref.origin === location.origin &&
        (ref.pathname === map.pathname || ref.pathname === map.pathname.replace(/index\.html$/, ""));
    } catch (e) { return false; }
  }
  let hops = 0;  // changements de réseau sur cette page (#id), chacun ajoute une entrée d'historique
  window.addEventListener("hashchange", () => { hops++; });
  $("#back-to-map").addEventListener("click", e => {
    if (cameFromMap()) { e.preventDefault(); history.go(-(hops + 1)); }
  });

  let timer;
  $("#filter").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(renderChannels, 120); });
  $("#download").addEventListener("click", downloadCsv);
  window.addEventListener("hashchange", load);
  darkQuery.addEventListener("change", () => net && renderMap(D.networks.indexOf(net)));
  load();
})();
