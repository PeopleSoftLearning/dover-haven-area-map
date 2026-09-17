(function () {
  var WHATSAPP = "https://wa.me/12462613007";

  var ICONS = {
    house: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
    beach: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c3-2 6-2 9 0s6 2 9 0"/><path d="M12 3v9"/><path d="M8 7l4-4 4 4"/></svg>',
    food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M17 2c-2 2-2 6-2 8s0 2 2 2 2 0 2-2-0-6-2-8z"/><path d="M17 14v8"/></svg>',
    shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h16l-1.5 11H5.5z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>',
    transport: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l19-9-9 19-2-8z"/></svg>'
  };

  var CATS = [
    { id: "beach", label: "Beach & boardwalk", varname: "--cat-beach" },
    { id: "food", label: "Food & nightlife", varname: "--cat-food" },
    { id: "shop", label: "Shopping & essentials", varname: "--cat-shop" },
    { id: "transport", label: "Getting around", varname: "--cat-transport" }
  ];

  var filtersEl = document.getElementById("filters");
  var panel = document.getElementById("panel");
  var activeCat = "all";
  var openId = null;
  var photoIndex = {};
  var map, markers = {}, allPois = [], house;

  function catColorVar(cat) {
    if (cat === "house") return "var(--mark)";
    var c = CATS.filter(function (c) { return c.id === cat; })[0];
    return c ? "var(" + c.varname + ")" : "var(--accent)";
  }

  function renderFilters() {
    var chips = [{ id: "all", label: "All" }].concat(CATS);
    filtersEl.innerHTML = chips.map(function (c) {
      var dotStyle = c.id === "all" ? "" : ' style="--dot:var(' + c.varname + ')"';
      return '<button class="chip" data-cat="' + c.id + '" aria-pressed="' + (c.id === activeCat) + '"' + dotStyle + '>' +
        (c.id !== "all" ? '<span class="dot"></span>' : '') + c.label + '</button>';
    }).join("");
  }

  function pinIcon(poi) {
    var isHouse = poi.category === "house";
    return L.divIcon({
      className: "",
      html: '<div class="divpin ' + (isHouse ? "house" : "") + '"><div class="bubble" style="--cat:' + catColorVar(poi.category) + '">' + ICONS[poi.category] + '</div></div>',
      iconSize: isHouse ? [44, 44] : [34, 34],
      iconAnchor: isHouse ? [22, 44] : [17, 34]
    });
  }

  function applyFilter() {
    Object.keys(markers).forEach(function (id) {
      var poi = allPois.filter(function (p) { return p.id === id; })[0];
      var visible = activeCat === "all" || poi.category === activeCat || poi.category === "house";
      var m = markers[id];
      if (visible && !map.hasLayer(m)) m.addTo(map);
      if (!visible && map.hasLayer(m)) map.removeLayer(m);
    });
  }

  function renderPanel() {
    if (!openId) { panel.innerHTML = ""; panel.style.display = "none"; return; }
    panel.style.display = "";
    var p = allPois.filter(function (x) { return x.id === openId; })[0];
    if (!p) return;
    var catInfo = CATS.filter(function (c) { return c.id === p.category; })[0];
    var catLabel = p.category === "house" ? "Dover Haven" : (catInfo ? catInfo.label : "");
    panel.innerHTML =
      '<div class="photo" style="--cat:' + catColorVar(p.category) + '">' +
        ICONS[p.category] +
        '<span class="ph-tag">' + p.photos.length + (p.photos.length === 1 ? " photo" : " photos") + ' · drop files in /assets</span>' +
      '</div>' +
      '<div class="body">' +
        '<div class="row1">' +
          '<div><div class="cat-tag" style="--cat:' + catColorVar(p.category) + '">' + catLabel + '</div><h2>' + p.name + '</h2></div>' +
          '<button class="close-btn" aria-label="Close">&times;</button>' +
        '</div>' +
        '<span class="time-badge">' + p.timeLabel + '</span>' +
        '<p class="desc">' + p.description + '</p>' +
        '<a class="cta" href="' + WHATSAPP + '?text=' + encodeURIComponent("Hi! I had a question about " + p.name + " near Dover Haven.") + '" target="_blank" rel="noopener">' +
          '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1s-.6.8-.7.9c-.1.1-.3.2-.5.1a6.5 6.5 0 0 1-1.9-1.2 7.1 7.1 0 0 1-1.3-1.6c-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4a.5.5 0 0 0 0-.5c-.1-.1-.5-1.3-.7-1.7-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.9 2 4.7 4.7 0 0 0 1 2.5 10.7 10.7 0 0 0 4.1 3.6c.6.2 1 .4 1.4.5a3.4 3.4 0 0 0 1.5.1 2.5 2.5 0 0 0 1.6-1.1 1.9 1.9 0 0 0 .1-1.1c-.1-.1-.2-.2-.4-.3z"/></svg>' +
          'Ask about ' + p.name +
        '</a>' +
      '</div>';
  }

  function openPin(id) {
    openId = id;
    renderPanel();
    var m = markers[id];
    if (m) map.panTo(m.getLatLng());
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function closePanel() { openId = null; renderPanel(); }

  filtersEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".chip");
    if (!btn) return;
    activeCat = btn.getAttribute("data-cat");
    renderFilters();
    applyFilter();
  });
  panel.addEventListener("click", function (e) {
    if (e.target.closest(".close-btn")) closePanel();
  });

  fetch("data/pois.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      house = data.house;
      allPois = [house].concat(data.pois);

      map = L.map("map", { zoomControl: true, scrollWheelZoom: false }).setView([house.lat, house.lng], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      allPois.forEach(function (poi) {
        var marker = L.marker([poi.lat, poi.lng], { icon: pinIcon(poi) });
        marker.on("click", function () {
          if (openId === poi.id) closePanel(); else openPin(poi.id);
        });
        markers[poi.id] = marker;
        marker.addTo(map);
      });

      renderFilters();
      applyFilter();
      openPin("house");
    })
    .catch(function (err) {
      document.getElementById("map").innerHTML =
        '<p style="padding:16px;color:var(--muted)">Could not load data/pois.json — if you are opening this file directly (file://), run a local server instead (see README).</p>';
      console.error(err);
    });
})();
