(function () {
  var WHATSAPP = "https://wa.me/12462613007";

  var ICONS = {
    house: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
    beach: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c3-2 6-2 9 0s6 2 9 0"/><path d="M12 3v9"/><path d="M8 7l4-4 4 4"/></svg>',
    food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M17 2c-2 2-2 6-2 8s0 2 2 2 2 0 2-2-0-6-2-8z"/><path d="M17 14v8"/></svg>',
    essentials: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h16l-1.5 11H5.5z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>',
    explore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M14.5 9.5l-2 5-5 2 2-5z"/></svg>',
    transport: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l19-9-9 19-2-8z"/></svg>'
  };

  var CATS = [
    { id: "beach", label: "Beaches", varname: "--cat-beach", hex: "#3E7691", hexDark: "#6FB0CE" },
    { id: "food", label: "Food & drink", varname: "--cat-food", hex: "#55619E", hexDark: "#9AA3D9" },
    { id: "essentials", label: "Essentials", varname: "--cat-essentials", hex: "#9C7245", hexDark: "#D1A574" },
    { id: "explore", label: "Things to do", varname: "--cat-explore", hex: "#3F8F6C", hexDark: "#7FCBA4" },
    { id: "transport", label: "Getting around", varname: "--cat-transport", hex: "#6E7180", hexDark: "#A6A9BE" }
  ];

  // Directory categories (OpenStreetMap contributors, via Jordan's Sept 2026 extract,
  // ODbL 1.0 — public database facts, freely reusable with attribution) map onto the
  // same categories used for Host picks.
  var DIR_CAT_MAP = {
    "Beaches": "beach",
    "Food & drink": "food",
    "Essentials": "essentials",
    "Things to do": "explore"
  };

  var filtersEl = document.getElementById("filters");
  var picksEl = document.getElementById("picks");
  var nearbyEl = document.getElementById("nearby");
  var panel = document.getElementById("panel");
  var mapLabel = document.getElementById("mapLabel");
  var fullMapLink = document.getElementById("fullMapLink");
  var activeCat = "all";
  var openId = null;
  var house, picks = [];
  var map, markers = {};
  var galleryIndex = 0;
  var directoryPlaces = [];     // full OpenStreetMap directory (Essentials, Food & drink, Beaches, Things to do)
  var directoryById = {};
  var directoryLoaded = false;

  // Free vector-tile basemap (no API key, no billing) — OpenStreetMap data
  // served by OpenFreeMap, the same free engine Jordan's site uses.
  var MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

  // Straight-line distance in km from Dover Haven.
  function distanceFromHouse(lat, lng) {
    var r = Math.PI / 180,
      a = Math.sin(((lat - house.lat) * r) / 2) ** 2 +
        Math.cos(house.lat * r) * Math.cos(lat * r) * Math.sin(((lng - house.lng) * r) / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function distanceLabel(km) {
    return km < 1 ? Math.round(km * 1000) + " m away" : km.toFixed(1) + " km away";
  }
  function directionsUrl(lat, lng) {
    return "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lng;
  }

  function markerEl(cat, isHouse) {
    var el = document.createElement("div");
    el.className = "map-pin" + (isHouse ? " map-pin--house" : "");
    el.style.setProperty("--cat", catColorVar(cat));
    if (isHouse && house.photos && house.photos[0]) {
      el.innerHTML = '<img src="' + house.photos[0] + '" alt="" />';
    } else {
      el.innerHTML = ICONS[cat] || ICONS.essentials;
    }
    return el;
  }

  function directoryGeoJSON(places) {
    return {
      type: "FeatureCollection",
      features: places.map(function (p) {
        return {
          type: "Feature",
          id: p.id,
          geometry: { type: "Point", coordinates: [p.lng, p.lat] },
          properties: { id: p.id, name: p.name, category: DIR_CAT_MAP[p.category] || "explore" }
        };
      })
    };
  }

  function addDirectoryLayer() {
    map.addSource("directory", {
      type: "geojson",
      data: directoryGeoJSON(directoryPlaces),
      cluster: true,
      clusterMaxZoom: 16,
      clusterRadius: 56
    });

    map.addLayer({
      id: "dir-clusters",
      type: "circle",
      source: "directory",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#3A362E",
        "circle-opacity": 0.88,
        "circle-radius": ["step", ["get", "point_count"], 14, 10, 17, 30, 20, 100, 24]
      }
    });
    map.addLayer({
      id: "dir-cluster-count",
      type: "symbol",
      source: "directory",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["Noto Sans Bold"],
        "text-size": 12
      },
      paint: { "text-color": "#FBF7EF" }
    });

    var catColorExpr = ["match", ["get", "category"]];
    CATS.forEach(function (c) { catColorExpr.push(c.id, c.hex); });
    catColorExpr.push("#8A806E");

    map.addLayer({
      id: "dir-points",
      type: "circle",
      source: "directory",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": catColorExpr,
        "circle-radius": 6,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#ffffff"
      }
    });

    map.on("click", "dir-clusters", function (e) {
      var features = map.queryRenderedFeatures(e.point, { layers: ["dir-clusters"] });
      var clusterId = features[0].properties.cluster_id;
      map.getSource("directory").getClusterExpansionZoom(clusterId).then(function (zoom) {
        map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom });
      }).catch(function () {});
    });
    map.on("click", "dir-points", function (e) {
      var f = e.features[0];
      var place = directoryById[f.properties.id];
      if (!place) return;
      showDirectoryPopup(place, f.properties.category);
    });
    ["dir-clusters", "dir-points"].forEach(function (layerId) {
      map.on("mouseenter", layerId, function () { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", layerId, function () { map.getCanvas().style.cursor = ""; });
    });

    directoryLoaded = true;
    applyDirectoryFilter();
  }

  function applyDirectoryFilter() {
    if (!directoryLoaded) return;
    var places = activeCat === "all"
      ? directoryPlaces
      : directoryPlaces.filter(function (p) { return (DIR_CAT_MAP[p.category] || "explore") === activeCat; });
    map.getSource("directory").setData(directoryGeoJSON(places));
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

    if (map.isStyleLoaded()) addDirectoryLayer();
    else map.once("load", addDirectoryLayer);
  }

  function setMarkerVisibility() {
    picks.forEach(function (p) {
      var show = activeCat === "all" || p.category === activeCat;
      var el = markers[p.id] && markers[p.id].getElement();
      if (el) el.style.display = show ? "" : "none";
    });
    applyDirectoryFilter();
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
      var thumb = (p.photos && p.photos[0])
        ? '<img src="' + p.photos[0] + '" alt="" />'
        : (ICONS[p.category] || ICONS.essentials);
      return '<button class="pick-card" data-id="' + p.id + '" aria-pressed="' + (p.id === openId) + '">' +
        '<span class="pick-icon" style="--cat:' + catColorVar(p.category) + '">' + thumb + '</span>' +
        '<span class="pick-body">' +
          '<span class="pick-name">' + p.name + '</span>' +
          '<span class="pick-time">' + p.timeLabel + '</span>' +
        '</span>' +
      '</button>';
    }).join("");
  }

  // "Nearby places" — swipeable strip pulled from the full OpenStreetMap directory
  // (not Host picks), nearest first, matching Jordan's footer layout.
  var NEARBY_LIMIT = 40;
  function renderNearby() {
    if (!nearbyEl) return;
    var withDist = directoryPlaces.map(function (p) {
      return { p: p, km: distanceFromHouse(p.lat, p.lng), cat: DIR_CAT_MAP[p.category] || "explore" };
    }).filter(function (x) {
      return activeCat === "all" || x.cat === activeCat;
    }).sort(function (a, b) { return a.km - b.km; }).slice(0, NEARBY_LIMIT);

    nearbyEl.innerHTML = withDist.map(function (x) {
      return '<button class="nearby-card" data-id="' + x.p.id + '">' +
        '<span class="nearby-thumb" style="--cat:' + catColorVar(x.cat) + '">' + (ICONS[x.cat] || ICONS.essentials) + '</span>' +
        '<span class="nearby-body">' +
          '<span class="nearby-name">' + x.p.name + '</span>' +
          '<span class="nearby-dist">' + distanceLabel(x.km) + '</span>' +
        '</span>' +
      '</button>';
    }).join("");
  }

  function showDirectoryPopup(place, catId) {
    var km = distanceFromHouse(place.lat, place.lng);
    var catInfo = CATS.filter(function (c) { return c.id === catId; })[0];
    var html =
      '<div class="dir-popup">' +
        '<div class="dir-popup-cat">' + (catInfo ? catInfo.label : "") + '</div>' +
        '<h3>' + place.name + '</h3>' +
        '<p>' + distanceLabel(km) + '</p>' +
        '<a class="cta ghost sm" href="' + directionsUrl(place.lat, place.lng) + '" target="_blank" rel="noopener">Directions &rarr;</a>' +
      '</div>';
    new maplibregl.Popup({ closeButton: true, maxWidth: "220px" })
      .setLngLat([place.lng, place.lat])
      .setHTML(html)
      .addTo(map);
  }

  function openDirectoryPlace(id) {
    var place = directoryById[id];
    if (!place || !map) return;
    map.flyTo({ center: [place.lng, place.lat], zoom: 17, essential: true });
    mapLabel.textContent = "Showing: " + place.name;
    fullMapLink.href = mapsSearchUrl(place);
    showDirectoryPopup(place, DIR_CAT_MAP[place.category] || "explore");
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

  // Builds the photo/gallery block reused by both the house panel and a pick's panel:
  // real swipeable photos when any exist, otherwise the old icon placeholder.
  function galleryHtml(photos, catStyle, iconHtml) {
    photos = photos || [];
    if (!photos.length) {
      return '<div class="photo" style="' + catStyle + '">' + iconHtml + '<span class="ph-tag">Add a photo in /assets</span></div>';
    }
    var i = ((galleryIndex % photos.length) + photos.length) % photos.length;
    var navBtns = photos.length > 1
      ? '<button class="gal-nav gal-prev" aria-label="Previous photo">&larr;</button>' +
        '<button class="gal-nav gal-next" aria-label="Next photo">&rarr;</button>' +
        '<span class="gal-count">' + (i + 1) + ' / ' + photos.length + '</span>'
      : "";
    return '<div class="photo photo--house" style="' + catStyle + '"><img src="' + photos[i] + '" alt="" />' + navBtns + '</div>';
  }

  function renderHousePanel() {
    panel.innerHTML =
      galleryHtml(house.photos, "--cat:var(--mark)", ICONS.house) +
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
      galleryHtml(p.photos, "--cat:" + catColorVar(p.category), ICONS[p.category] || ICONS.essentials) +
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
    galleryIndex = 0;
    if (id === "house") {
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
    if (e.target.closest(".gal-prev")) { galleryIndex--; renderPanel(); }
    if (e.target.closest(".gal-next")) { galleryIndex++; renderPanel(); }
  });

  filtersEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".chip");
    if (!btn) return;
    activeCat = btn.getAttribute("data-cat");
    renderFilters();
    renderPicks();
    renderNearby();
    setMarkerVisibility();
  });
  picksEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".pick-card");
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    if (openId === id) closePanel(); else openPick(id);
  });
  if (nearbyEl) {
    nearbyEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".nearby-card");
      if (!btn) return;
      openDirectoryPlace(btn.getAttribute("data-id"));
    });
  }
  panel.addEventListener("click", function (e) {
    if (e.target.closest(".close-btn")) closePanel();
  });

  Promise.all([
    fetch("data/pois.json").then(function (r) { return r.json(); }),
    fetch("data/directory.json").then(function (r) { return r.json(); }).catch(function () { return { places: [] }; })
  ])
    .then(function (results) {
      var data = results[0];
      var dir = results[1];
      house = data.house;
      picks = data.picks;
      directoryPlaces = dir.places || [];
      directoryById = {};
      directoryPlaces.forEach(function (p) { directoryById[p.id] = p; });
      renderFilters();
      renderPicks();
      renderNearby();
      try {
        initMap();
      } catch (mapErr) {
        console.error("Map failed to load:", mapErr);
        document.getElementById("map").innerHTML =
          '<p style="padding:16px;color:var(--muted);font-size:13px">The interactive map couldn\'t load (check your connection) — use "Open in Google Maps" above, or the Host picks below still work.</p>';
      }
    })
    .catch(function (err) {
      picksEl.innerHTML = '<p style="padding:8px;color:var(--muted)">Could not load data/pois.json — if opening this file directly (file://), run a local server instead (see README).</p>';
      console.error(err);
    });
})();
