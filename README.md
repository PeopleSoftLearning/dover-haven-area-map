# Dover Haven — Area Map

An area guide for Dover Haven (Unit 4, Dover Mews): a real, live, drag-and-zoom map — plus a small
"Host picks" strip of hand-picked favourites, each with a description, a walk/drive time, an "Ask
about this" WhatsApp button, and a Street View link.

The map itself runs on **MapLibre GL + OpenFreeMap** — the same free, no-API-key mapping engine
Jordan used on his `doverhavenbarbados.space` build — styled in Dover Haven's own colours instead of
his. No Google Cloud billing, no key to manage, nothing to renew.

## Running it locally

Needs a local web server (not just double-clicking `index.html`), because the browser blocks
`fetch()` of local files otherwise. From this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

or, with Node installed: `npx serve .`

## Deploying it for free (GitHub Pages)

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In the repo: **Settings → Pages → Source → Deploy from a branch → `main` / `(root)`**.
3. GitHub gives you a live URL in a minute or two, e.g. `https://<username>.github.io/dover-haven-area-map/`.

That URL can be linked from — or later embedded via `<iframe>` in — the main Dover Haven site
(doverhavenbarbados.com). Linking to it (a plain "Explore the area" button/link on the site) is the
simpler and safer option to start with; embedding is a Lovable change and worth doing carefully.

## Project structure

```
index.html        the page — has the Google Map iframe and the picks strip
styles.css         Dover Haven brand styling
app.js             picks/filter logic, and re-centers the map when a pick is clicked
data/pois.json     the house + every "host pick": name, category, coordinates, time, description, photos
assets/            drop real photos here
```

## Why MapLibre + OpenFreeMap instead of custom pins for everything

Lena's call, deliberately: the map is the zero-maintenance part — it's a real, draggable, zoomable map
of the area, so guests can look up any restaurant, pharmacy or shop themselves without anyone
maintaining a list of them. The custom part of this page is a short list of the host's own favourites
(the "picks" in `data/pois.json`), each with a personal note and a way to ask a question.

**Why not the Google iframe this page used before:** Google's free embed can't be recoloured or have
custom pins added — it's the same anywhere it's used. Switching to OpenFreeMap gives a live map that's
styled in Dover Haven's own colours and can show the "Host picks" as real pins on it (Jordan's approach
on his own site), for the same zero cost and zero API key. An "Open in Google Maps →" link stays next
to the map for guests who want Google's own business listings, reviews or turn-by-turn directions.

## Adding, editing or removing a "pick"

Open `data/pois.json`. Each entry under `"picks"` looks like this:

```json
{
  "id": "dover-market",
  "name": "The Dover Market",
  "category": "shop",
  "lat": 13.065869,
  "lng": -59.565622,
  "timeLabel": "A couple of minutes' walk",
  "description": "Lena's go-to for small groceries...",
  "photos": ["assets/dover-market.jpg"]
}
```

- `category` must be one of: `beach`, `food`, `shop`, `transport`. Add a new one by adding it to the
  `CATS` array near the top of `app.js` and giving it a colour variable in `styles.css` (copy the
  `--cat-*` pattern).
- `lat` / `lng` — used for the Street View link and to re-center the map when this pick is clicked.
  Right-click any spot on [Google Maps](https://maps.google.com) and copy the coordinates it shows.
- `photos` — points at a file in `assets/` that doesn't exist yet, so the card shows a coloured
  placeholder. Add the real image with that exact filename and it'll show up — no code change needed.

**On coordinate accuracy:** The Dover Market's coordinates are exact, decoded from a Google Plus Code
Lena confirmed. The house's coordinates are derived from that confirmed point plus Lena's own measured
220 m walking distance to it — accurate to within roughly the width of the block, not survey-precise
(Dover Haven isn't yet a listed business on Google, so there's no official pin to read directly). Every
other pick (Dover Beach, St Lawrence Gap, Oistins, the airport, ZR vans) was re-anchored to keep the
same position *relative to* the corrected house — their absolute coordinates are still estimates,
though their distance/time labels are all confirmed from Lena's listing copy. Good enough for the
Street View links and map re-centering this page uses them for; worth tightening later if it matters
more (e.g. a proper embedded Street View feature).

**Removed, unconfirmed:** an earlier draft of this data included a "South Coast Boardwalk" pick,
pulled from old listing-copy notes. Lena wasn't sure it's something to send guests to from here, so
it's been taken out. Add it back into `data/pois.json` if it turns out to be real and relevant.

## Street View

Each pick's "Street View →" button opens Google's own Street View at that pin's coordinates, in a new
tab — free, no API key. An embedded Street View panel directly on the page (so guests never leave it)
is also possible, but needs the Google Maps JavaScript API — a Google Cloud project, an API key, and
billing enabled (there's a monthly free credit that easily covers a single-property site, but a card
has to be on file). Worth doing once the simple version proves useful.

## Ask-a-question button

Every pick's card links to WhatsApp (`https://wa.me/12462613007`) with the place's name pre-filled,
same number as the "WhatsApp Alison" link on the main site's footer. Change the number in `app.js`
(search for `WHATSAPP`) if that should be a different contact.

## Optional: an on-site "ask about the area" assistant

Jordan's idea of an LLM that answers guest questions about the property and area directly is a
separate, larger piece of work (needs a backend to hold an API key and answer safely) — not included
here. Worth a separate conversation once the map itself is live and settled.

## What was deliberately left out of Jordan's build

Jordan's `barbadosrental` repo (private, shared for reference — nothing in it was copied verbatim or
committed here) is a much bigger, separate application: React/Vite/Express, a 953-place OpenStreetMap
business directory with clustering and photo pins, a three-step custom booking flow with its own
calendar, and a server-side Gemini AI concierge. Left out of this hybrid, on purpose:

- **The 953-place directory overlay.** Genuinely useful, but a lot more surface area to keep working
  (photo credits, licensing, a refresh script). This page's map already shows everything nearby via the
  live basemap; his dataset is worth revisiting later only if the "Host picks" list starts to feel too
  thin.
- **His custom booking flow.** It's presented as an enquiry, not a live reservation, and by his own
  README it does **not** two-way sync with any channel — exactly the kind of second, disconnected
  booking surface that caused the past double-booking. Lodgify stays the one and only source of truth
  for availability.
- **The Gemini AI concierge.** Needs its own API key and hosting; a separate project if wanted later.

What *was* brought over: the mapping approach itself (MapLibre + OpenFreeMap, free, no key), applied to
this page's own simpler picks-based content model and Dover Haven's branding.
