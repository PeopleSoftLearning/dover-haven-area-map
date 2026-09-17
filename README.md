# Dover Haven — Area Map

An interactive map of Dover Haven (Unit 4, Dover Mews) and everything nearby — beach, restaurants,
shops, transport — built like Snap Maps / IG Maps: pins on a map, tap a pin to see a photo, distance,
description, and a button to ask a question.

Two versions of this exist:

- **This repo** — a real, literal map using [Leaflet](https://leafletjs.com/) + free
  [OpenStreetMap](https://www.openstreetmap.org/) tiles. No API key, no billing. This is the one to
  keep developing (add pins, swap in real photos, change categories).
- A quick **illustrated preview** (no real map tiles, just a styled graphic) was published as a Claude
  artifact for a fast first look — ask Lena for the link if you want to see it, but this repo is the
  one to build on.

## Running it locally

This needs a local web server (not just double-clicking `index.html`), because the browser blocks
`fetch()` of local files otherwise. From this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

or, with Node installed:

```bash
npx serve .
```

## Deploying it for free (GitHub Pages)

1. Push this repo to GitHub (see below).
2. In the repo on GitHub: **Settings → Pages → Source → Deploy from a branch → `main` / `(root)`**.
3. GitHub gives you a live URL in a minute or two, e.g. `https://<username>.github.io/dover-haven-area-map/`.

That URL can later be linked from — or embedded via `<iframe>` in — the main Dover Haven site.

## Project structure

```
index.html        the page itself
styles.css         Dover Haven brand styling (colours, fonts, cards)
app.js             all the map/pin/filter logic — reads data/pois.json
data/pois.json     every pin: name, category, coordinates, distance/time, description, photos
assets/            drop real photos here (see below)
```

## Adding or editing a pin

Open `data/pois.json`. Each entry looks like this:

```json
{
  "id": "dover-beach",
  "name": "Dover Beach",
  "category": "beach",
  "lat": 13.0755,
  "lng": -59.5989,
  "timeLabel": "4 min walk · 300 m",
  "description": "Calm, swimmable water with a lifeguard on duty...",
  "photos": ["assets/dover-beach.jpg"]
}
```

- `category` must be one of: `beach`, `food`, `shop`, `transport` (or `house` — only the property itself uses that one).
  Add a new category by adding it to the `CATS` array near the top of `app.js` and giving it a colour
  variable in `styles.css` (copy the `--cat-*` pattern).
- `lat` / `lng` — right-click any spot on [Google Maps](https://maps.google.com) or
  [OpenStreetMap](https://www.openstreetmap.org) and copy the coordinates it shows.
- `photos` — an array of image paths. Right now they point at files that don't exist yet, so the map
  shows a coloured placeholder card instead. Add a real image to `assets/`, e.g. `assets/dover-beach.jpg`,
  and it'll show up automatically — no code changes needed.

**The house pin's coordinates in `data/pois.json` are an estimate** (Dover Mews, 2nd Avenue). Worth
dropping an exact pin on Google Maps once you're on-site and updating `lat`/`lng` for `house` — every
other distance/time label is copied from the confirmed listing copy, but the pin position itself hasn't
been GPS-verified.

## Upgrading to Google Maps / Street View later

If you want the literal Street View look, swap the Leaflet tile layer in `app.js` for the
[Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/overview) —
it needs a Google Cloud project, an API key, and billing enabled (Google gives a monthly free credit
that comfortably covers a single-property site, but a card has to be on file). Everything else —
`data/pois.json`, the filter chips, the pin cards, the WhatsApp button — carries over unchanged.

## Ask-a-question button

Every pin's card links to WhatsApp (`https://wa.me/12462613007`) with the place's name pre-filled in
the message, same number as the "WhatsApp Alison" link on the main site's footer. Change the number in
`app.js` (search for `WHATSAPP`) if that should be a different contact.

## Optional: an on-site "ask about the area" assistant

The idea Jordan raised of an LLM that answers guest questions about the property and area is a
separate, larger piece of work (needs a backend to hold an API key and answer safely) — not something
this static map includes yet. Worth a separate conversation once the map itself is live.
