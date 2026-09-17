# Dover Haven — Area Map

An area guide for Dover Haven (Unit 4, Dover Mews): a real, live, embedded Google Map guests can drag
and zoom themselves — every restaurant, pharmacy and shop Google knows about shows up on its own, no
maintenance needed — plus a small "Lena's picks" strip of hand-picked favourites, each with a
description, a walk/drive time, a "Ask about this" WhatsApp button, and a Street View link.

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
data/pois.json     the house + every "Lena's pick": name, category, coordinates, time, description, photos
assets/            drop real photos here
```

## Why an embedded Google Map instead of custom pins for everything

Lena's call, deliberately: a live Google Map already has every restaurant, pharmacy, shop and hotel
nearby, kept up to date by Google — zero upkeep. The custom part of this page is now just a short list
of Lena's own favourites (the "picks" in `data/pois.json`), each with her own voice and a way to ask a
question. Less to maintain, and guests still get the full real map to explore on their own.

## Adding, editing or removing a "pick"

Open `data/pois.json`. Each entry under `"picks"` looks like this:

```json
{
  "id": "dover-market",
  "name": "The Dover Market",
  "category": "shop",
  "lat": 13.0765,
  "lng": -59.5972,
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

**Coordinates that are still estimates, not GPS-confirmed:** the house itself (`house` in
`pois.json`) and The Dover Market. Worth dropping exact pins via Google Maps once on-site and updating
the file — every other distance/time label is copied from Lena's confirmed listing copy.

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
