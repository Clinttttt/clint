# Clint Villanueva — Portfolio

A light, interactive single-page portfolio for Clint Villanueva, full-stack .NET developer
and 4th-year CS student. Built with vanilla HTML, CSS, and JavaScript — no build step,
deploys directly to GitHub Pages.

## Structure

```
index.html                     Markup (semantic, accessible)
styles.css                     Light theme, fluid responsive layout
script.js                      Nav, scroll-spy, filters, toolkit tabs, cert lightbox
assets/images/                 Profile photo
assets/images/certificates/    Full certificate images (gallery + lightbox)
```

## Sections

Hero · Signal strip · About · Selected builds · Engineering range (toolkit explorer) ·
Approach · Certifications gallery · Contact.

## Preview locally

Open `index.html` directly, or serve it:

```bash
python -m http.server 8000
# visit http://localhost:8000
```

## Deploy

Push to the `main` branch. GitHub Pages serves the site at `https://clinttttt.github.io`.
