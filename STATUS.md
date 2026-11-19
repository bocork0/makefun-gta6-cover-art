# Vice Coast Cover Studio — gta6-cover-art-01 — STATUS

Competition: **gta6-cover-art-01** ("Make GTA 6 Cover Art"), $250, deadline
Fri 21 Nov 2026 10:30 UTC (17:30 WIB). Strict transcripts — no bundle upload;
the sealed recording is the transcript.

## What was built

An offline web app that turns photos + a caption into multi-panel GTA-style
cover art and exports PNGs in 1080×1080, 1080×1350 and 1920×1080.

- **Layouts** (4): Hero + 3, Four panels (2×2), Full bleed, tilted Snapshots.
- **Grades** (5): Sunset, Neon Nights, Palm Dusk, Teal Heat, Noir — each a
  photo filter plus a gradient wash, with film grain and vignette.
- **Photos**: up to 4 slots (file upload or bundled samples), per-panel crop
  via drag-to-pan and scroll-to-zoom plus a zoom slider; "one photo fills
  all panels" toggle.
- **Caption**: Anton title (white / sunset / neon / gold fill, bold outline),
  Pacifico subtitle, letterspaced tagline. Both fonts vendored under
  `app/fonts/` under the SIL Open Font License (`OFL.txt` included).
- **Samples**: three original photos made with an image model for this app
  (fictional people, no text/logos): boulevard, rooftop, neon.
- **Originality**: no Rockstar logo, artwork or fonts anywhere. All art,
  lettering and sample photos are original work made for this entry.

## Verification (19 Nov 2026, ~19:30–20:00 WIB)

- Served from `serve.ts` and exercised in Xvfb-headed Chromium 157 over CDP
  (note: this VM's Chromium needs `--hatch-webgl-allowed-domains-file` +
  `--hatch-webgl-allowed-domains-sha256` pointing at the canonical policy
  file `/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt`,
  and `--allow-file-access-from-files` to load the app over `file://`;
  plain `http://127.0.0.1:8080` is blocked by Local Network Access checks).
- Editor scene: boots, 3 sample photos loaded, zero console errors, zero
  failed requests.
- Real exports via the app's own export path (`__vc.exportPngDataUrl`, same
  render code as the Export button): valid PNGs — wide 1920×1080
  (4,240,321 B), square 1080×1080 (2,436,316 B), portrait 1080×1350
  (3,002,530 B). All three byte-valid, correct dimensions.
- Screenshots (4, all within gate caps: ≤256 KiB, long side ≤1280, short
  side ≥480): `1-cover.jpg` 1280×720, `2-editor.jpg` 1280×800,
  `3-cover-square.jpg` 1080×1080, `4-cover-portrait.jpg` 1024×1280.
  All are real renders / real exported PNGs scaled down, visually inspected.
- `main.ts` run twice: outputs byte-identical. `dossier.json` 1,161,820 B
  (cap 1,500,000).
- No external references in `app/` (grep for `http://`, `https://` empty).
- Kit check (`cli/makefun.mjs check --worktree`): **4 passed, 0 failed**,
  17 skipped (transcript gate checks run server-side on the sealed
  recording), 5 deferred to submission (repo public / owner / created-after-
  open / commit-in-repo / duplicate-snapshot — all need the GitHub repo).

## Bundle status

**N/A — no bundle.** This is a strict-transcripts competition
(`strict_transcripts: true`, `transcripts_required: true`): no transcript
bundle is uploaded; transcripts come from the sealed recording
`01a1f3c7-85a3-70ce-93cf-10eed1421f17` (node PID 2143, still running at build
end — do NOT kill; the parent seals it).

## Commits

- `86dd2a4` Vice Coast Cover Studio: app, fonts, samples, entry program
- `ee9a9a1` Shot scenes use one photo per panel; tagline fits the strip
- (final) screenshots + this STATUS.md — see `git log`

## Remaining steps for the parent (NOT done here)

1. Create the public GitHub repo under **bocork0** (after the 10:30 UTC
   opening — the repo must be created after the opening) and push this
   commit; add the 3 live badges + About (website make.fun) + topic
   `makefun` to the README at submit time.
2. Seal the recording (`kill "$(cat ~/.makefun/record-gta6-cover-art-01.pid)"`
   and wait for the "sealed" line) and write the Muse usage rows to
   `~/.makefun/muse-usage-gta6-cover-art-01.jsonl` before sealing (per the
   record log's note).
3. Submit via CLI with the recording id, repo URL, commit SHA and the
   FK49 keypair (payout wallet FK49, as approved for earlier entries).
   No signature step on Dhoni's phone is needed unless the competition is
   escrowed and FK49 cannot be used.
