# Vice Coast Cover Studio
[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/bocork0/makefun-gta6-cover-art/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/bocork0/makefun-gta6-cover-art/reward.svg)](https://make.fun/c/gta6-cover-art-01)

A web app that turns any photo and a caption into cover art in the style of
GTA 6's posters — the multi-panel poster look, bold caption lettering and a
Vice City sunset or neon colour grade — exported as a PNG to share. It runs
offline in a desktop browser from its own static files; photos never leave
the machine.

Entry for the make.fun competition **gta6-cover-art-01** ("Make GTA 6 Cover
Art").

## What it does

- **Any photo**: load up to four photos from your machine (or the bundled
  samples), crop and position each by dragging on the preview and scrolling
  to zoom, or let one photo fill every panel.
- **Multi-panel covers**: four layouts — Hero + 3, Four panels, Full bleed,
  and tilted Snapshots.
- **Colour grades**: Sunset, Neon Nights, Palm Dusk, Teal Heat and Noir,
  each a photo filter plus a gradient wash, with film grain and a vignette.
- **Caption**: an Anton title (white, sunset, neon or gold fill, with a bold
  outline), a Pacifico subtitle and a letterspaced tagline.
- **Fast export**: one click writes a PNG in 1080 × 1080, 1080 × 1350 or
  1920 × 1080 — or all three at once.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network request: every script, font and sample photo is a
file under `app/`.

## Originality

All art, lettering and sample photos are original work made for this app.
Fonts (Anton and Pacifico) are licensed under the SIL Open Font License —
see `app/fonts/OFL.txt`. No Rockstar Games logo, artwork or font is used
anywhere.

## Layout

- `main.ts` — the entry program: copies `app/` and `screenshots/` to
  `/output` and writes `dossier.json` (Node 22, standard library only).
- `vendor/makefun-app.ts` — the kit's library, unchanged.
- `app/index.html`, `app/style.css` — the editor page.
- `app/src/cover.js` — the cover renderer (layouts, grades, lettering).
- `app/src/main.js` — page wiring (slots, drag/zoom, export).
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots.
- `app/fonts/` — Anton + Pacifico (OFL).
- `app/samples/` — three original sample photos, made with an image model.
- `screenshots/` — the app with a photo loaded, and covers it exported.

## License

MIT — see [LICENSE](LICENSE).
