# For Laasya ♥

A proposal website in **one single file** — `index.html`.

**Live:** https://sreeharipraneeth16-cell.github.io/laasya-proposal/

Open it, and that's the whole thing. No server, no install, no internet needed
(the fonts upgrade themselves if you're online).

---

## Folder

```
laasya-proposal/
├── index.html        ← THE site. Send / host / open this one file.
├── assets/
│   └── best-moment.jpg   ← the original photo (already embedded inside index.html)
├── source/           ← optional, for editing
│   ├── index.html        (editable text/markup)
│   ├── styles.css        (all the styling)
│   ├── script.js         (all the animation + logic)
│   └── build.js          (bundles source/ back into ../index.html)
└── README.md
```

**To share it: send only `index.html`.** Everything — CSS, JavaScript, and her
photo — is inside it.

---

## What's inside

- **Loader** — beating heart + her name, then it lifts away
- **Hero** — "Laasya" rises letter by letter over a starfield with drifting hearts and shooting stars
- **Typewriter** — cycling lines about her
- **Reasons cards** — tilt in 3D, glow follows your cursor
- **Timeline** — a glowing line fills as you scroll
- **"The best moment of my life"** — taped polaroid with her photo, hover lift and zoom
- **The letter** — sealed envelope; click it and the seal breaks, flap opens, letter unfolds
- **The question** — "Laasya, will you be mine?" The **No** button dodges, shrinks, and gives up
- **Yes** — heart rain, confetti, fireworks, flash, a victory chime, and the title becomes **"She said YES ♥"**
- **Music** — bottom-right pill, a soft melody synthesized live in the browser
- Custom cursor, scroll progress, click sparkles, fully responsive,
  and it respects reduced-motion settings

---

## Change the text

Easiest way: edit **`source/index.html`** (plain text), then rebuild:

```
node source/build.js
```

That regenerates the single `index.html` with your changes inside.

Where things live in `source/index.html`:

| What | Look for |
| --- | --- |
| Four "reasons" cards | `<div class="cards">` |
| Timeline moments | `<ol class="timeline__list">` |
| The love letter | `<div class="letter-card__inner">` |
| The question + subtext | `<div class="ask__inner">` |
| The celebration message | `<div class="said">` |
| Photo caption | `<p class="polaroid__script">` |

Animation / behaviour lives in `source/script.js`:

| What | Variable |
| --- | --- |
| "No" button labels | `noLabels` / `noLabelsShort` |
| Typewriter lines | `phrases` |
| Music melody | `melody` (MIDI note numbers) |

> Prefer editing `index.html` directly? You can — the text is all there.
> Just don't edit `source/` afterwards without rebuilding.

---

## Change the photo

1. Replace `assets/best-moment.jpg` with your photo (keep the same filename)
2. Run:

```
node source/build.js
```

Portrait (4:5) looks best. If the photo is ever missing, the site shows a
glowing heart instead of a broken image.

---

## Put it online (free)

It's already live on **GitHub Pages**:

**https://sreeharipraneeth16-cell.github.io/laasya-proposal/**

The repo is `sreeharipraneeth16-cell/laasya-proposal` (public, branch `main`,
Pages serving the repo root). Any time you change the site, rebuild and push:

```
node source/build.js
git add index.html
git commit -m "Update the site"
git push
```

Pages redeploys automatically in under a minute.

Other free options: Netlify Drop, Vercel, or Cloudflare Pages — just drag
`index.html` in.

Or hand her your laptop and open `index.html`.

---

*Made with ♥, nervous energy, and far too much CSS.*
