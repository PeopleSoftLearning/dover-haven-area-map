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
    { id: "beach", label: "Beach", varname: "--cat-beach" },
    { id: "food", label: "Food & nightlife", varname: "--cat-food" },
    { id: "shop", label: "Shopping", varname: "--cat-shop" },
    { id: "transport", label: "Getting around", varname: "--cat-transport" }
  ];

  var filtersEl = document.getElementById("filters");
  var picksEl = document.getElementById("picks");
  var panel = document.getElementById("panel");
  var mapLabel = document.getElementById("mapLabel");
  var fullMapLink = document.getElementById("fullMapLink");
  var activeCat = "all";
  var openId = null;
  var house, picks = [];
  var map, markers = {};
  var houseGalleryIndex = 0;

  // Free vector-tile basemap (no API key, no billing) — OpenStreetMap data
  // served by OpenFreeMap, the same free engine Jordan's site uses.
  var MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

  function markerEl(cat, isHouse) {
    var el = document.createElement("div");
    el.className = "map-pin" + (isHouse ? " map-pin--house" : "");
    el.style.setProperty("--cat", catColorVar(cat));
    if (isHouse && house.photos && house.photos[0]) {
      el.innerHTML = '<img src="' + house.photos[0] + '" alt="" />';
    } else {
      el.innerHTML = ICONS[cat] || ICONS.shop;
    }
    return el;
  }

  function initMap() {
    map = new maplibregl.Map({
      container: "map",
      style: MAP_STYLE,
      center: [house.lng, house.lat],
      zoom: 15,
      attributionControl: false
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    var houseEl = markerEl("house", true);
    houseEl.title = "Dover Haven — you are here";
    houseEl.addEventListener("click", function () {
      if (openId === "house") closePanel(); else openPick("house");
    });
    markers.house = new maplibregl.Marker({ element: houseEl })
      .setLngLat([house.lng, house.lat])
      .addTo(map);

    picks.forEach(function (p) {
      var el = markerEl(p.category, false);
      el.addEventListener("click", function () {
        if (openId === p.id) closePanel(); else openPick(p.id);
      });
      markers[p.id] = new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
    });
  }

  function setMarkerVisibility() {
    picks.forEach(function (p) {
      var show = activeCat === "all" || p.category === activeCat;
      var el = markers[p.id] && markers[p.id].getElement();
      if (el) el.style.display = show ? "" : "none";
    });
  }

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

  function renderPicks() {
    picksEl.innerHTML = picks.filter(function (p) {
      return activeCat === "all" || p.category === activeCat;
    }).map(function (p) {
      var catInfo = CATS.filter(function (c) { return c.id === p.category; })[0];
      return '<button class="pick-card" data-id="' + p.id + '" aria-pressed="' + (p.id === openId) + '">' +
        '<span class="pick-icon" style="--cat:' + catColorVar(p.category) + '">' + ICONS[p.category] + '</span>' +
        '<span class="pick-body">' +
          '<span class="pick-name">' + p.name + '</span>' +
          '<span class="pick-time">' + p.timeLabel + '</span>' +
        '</span>' +
      '</button>';
    }).join("");
  }

  function streetViewUrl(p) {
    return "https://www.google.com/maps?layer=c&cbll=" + p.lat + "," + p.lng;
  }
  function mapsSearchUrl(p) {
    return "https://www.google.com/maps?q=" + p.lat + "," + p.lng;
  }

  function whatsappUrl(text) {
    return WHATSAPP + "?text=" + encodeURIComponent(text);
  }
  var WHATSAPP_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1s-.6.8-.7.9c-.1.1-.3.2-.5.1a6.5 6.5 0 0 1-1.9-1.2 7.1 7.1 0 0 1-1.3-1.6c-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4a.5.5 0 0 0 0-.5c-.1-.1-.5-1.3-.7-1.7-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.9 2 4.7 4.7 0 0 0 1 2.5 10.7 10.7 0 0 0 4.1 3.6c.6.2 1 .4 1.4.5a3.4 3.4 0 0 0 1.5.1 2.5 2.5 0 0 0 1.6-1.1 1.9 1.9 0 0 0 .1-1.1c-.1-.1-.2-.2-.4-.3z"/></svg>';

  function renderHousePanel() {
    var photos = house.photos || [];
    var i = photos.length ? (((houseGalleryIndex % photos.length) + photos.length) % photos.length) : 0;
    var navBtns = photos.length > 1
      ? '<button class="gal-nav gal-prev" aria-label="Previous photo">&larr;</button>' +
        '<button class="gal-nav gal-next" aria-label="Next photo">&rarr;</button>' +
        '<span class="gal-count">' + (i + 1) + ' / ' + photos.length + '</span>'
      : "";
    panel.innerHTML =
      '<div class="photo photo--house" style="--cat:var(--mark)">' +
        (photos[i] ? '<img src="' + photos[i] + '" alt="' + house.name + '" />' : ICONS.house) +
        navBtns +
      '</div>' +
      '<div class="body">' +
        '<div class="row1">' +
          '<div><div class="cat-tag" style="--cat:var(--mark)">Your stay</div><h2>' + house.name + '</h2></div>' +
          '<button class="close-btn" aria-label="Close">&times;</button>' +
        '</div>' +
        '<span class="time-badge">You are here</span>' +
        '<p class="desc">' + house.description + '</p>' +
        '<div class="btn-row">' +
          '<a class="cta" href="' + whatsappUrl("Hi! I had a question about Dover Haven.") + '" target="_blank" rel="noopener">' +
            WHATSAPP_ICON + 'Ask a question' +
          '</a>' +
        '</div>' +
      '</div>';
  }

  function renderPanel() {
    if (!openId) { panel.innerHTML = ""; panel.style.display = "none"; return; }
    panel.style.display = "";
    if (openId === "house") { renderHousePanel(); return; }
    var p = picks.filter(function (x) { return x.id === openId; })[0];
    if (!p) return;
    var catInfo = CATS.filter(function (c) { return c.id === p.category; })[0];
    panel.innerHTML =
      '<div class="photo" style="--cat:' + catColorVar(p.category) + '">' +
        ICONS[p.category] +
        '<span class="ph-tag">Add a photo in /assets</span>' +
      '</div>' +
      '<div class="body">' +
        '<div class="row1">' +
          '<div><div class="cat-tag" style="--cat:' + catColorVar(p.category) + '">' + (catInfo ? catInfo.label : "") + '</div><h2>' + p.name + '</h2></div>' +
          '<button class="close-btn" aria-label="Close">&times;</button>' +
        '</div>' +
        '<span class="time-badge">' + p.timeLabel + '</span>' +
        '<p class="desc">' + p.description + '</p>' +
        '<div class="btn-row">' +
          '<a class="cta" href="' + whatsappUrl("Hi! I had a question about " + p.name + " near Dover Haven.") + '" target="_blank" rel="noopener">' +
            WHATSAPP_ICON + 'Ask about ' + p.name +
          '</a>' +
          '<a class="cta ghost" href="' + streetViewUrl(p) + '" target="_blank" rel="noopener">Street View &rarr;</a>' +
        '</div>' +
      '</div>';
  }

  function focusOnMap(p) {
    if (map) map.flyTo({ center: [p.lng, p.lat], zoom: 17, essential: true });
    mapLabel.textContent = "Showing: " + p.name;
    fullMapLink.href = mapsSearchUrl(p);
  }
  function focusOnHouse() {
    if (map) map.flyTo({ center: [house.lng, house.lat], zoom: 15, essential: true });
    mapLabel.textContent = "Showing: Dover Haven";
    fullMapLink.href = "https://www.google.com/maps?q=" + encodeURIComponent(house.address);
  }

  function markActiveMarker() {
    Object.keys(markers).forEach(function (id) {
      var el = markers[id].getElement();
      if (el) el.classList.toggle("map-pin--active", id === openId);
    });
  }

  function openPick(id) {
    openId = id;
    if (id === "house") {
      houseGalleryIndex = 0;
      focusOnHouse();
    } else {
      var p = picks.filter(function (x) { return x.id === id; })[0];
      if (p) focusOnMap(p);
    }
    renderPicks();
    renderPanel();
    markActiveMarker();
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function closePanel() {
    openId = null;
    focusOnHouse();
    renderPicks();
    renderPanel();
    markActiveMarker();
  }

  panel.addEventListener("click", function (e) {
    if (e.target.closest(".gal-prev")) { houseGalleryIndex--; renderHousePanel(); }
    if (e.target.closest(".gal-next")) { houseGalleryIndex++; renderHousePanel(); }
  });

  filtersEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".chip");
    if (!btn) return;
    activeCat = btn.getAttribute("data-cat");
    renderFilters();
    renderPicks();
    setMarkerVisibility();
  });
  picksEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".pick-card");
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    if (openId === id) closePanel(); else openPick(id);
  });
  panel.addEventListener("click", function (e) {
    if (e.target.closest(".close-btn")) closePanel();
  });

  fetch("data/pois.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      house = data.house;
      picks = data.picks;
      renderFilters();
      renderPicks();
      initMap();
    })
    .catch(function (err) {
      picksEl.innerHTML = '<p style="padding:8px;color:var(--muted)">Could not load data/pois.json — if opening this file directly (file://), run a local server instead (see README).</p>';
      console.error(err);
    });
})();
