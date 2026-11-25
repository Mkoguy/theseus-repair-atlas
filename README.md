# Theseus

Theseus is a free, public repair atlas. Visitors can browse repair guides, track steps, and write their own guides without creating an account. My Guides supports photos, parts lists, and a five-star difficulty scale. Its search, categories, and editor use the guides saved in the browser.

## Open in WebStorm

1. In WebStorm, choose **Open** and select this `Theseus` folder.
2. Open `dist/index.html` with WebStorm's built-in browser preview or a run configuration that serves the `dist` folder. ES modules need an HTTP preview rather than opening the file directly.
3. Edit the files under `dist`. The public deployment uses that folder.

## Where things live

- `dist/index.html` — page structure, accessible navigation, search, filters, and guide containers.
- `dist/styles.css` — the responsive visual system: Aegean blue, clay, cream, repair seams, and large type.
- `dist/app.js` — search, filtering, saved guides, guide views, video playback, and local step progress.
- `dist/guides.js` — the curated guide data. Add new repair paths here.
- `dist/my-guides.js` — the personal guide library, reader, and editor.
- `dist/workspace.css` — the personal guide screens, dark mode, and desktop banner slots.
- `dist/assets/repair-still-life.png` — original hero artwork.

## Content and safety

The eight starter guides are short original overviews, each linked to a detailed expert source. Electronics repairs are explicitly model-specific. Parts buttons open searches, not guaranteed compatible listings; visitors should check the exact model and seller. Videos are credited to their creators and embedded only after a visitor presses Play.

Saved guides, personal guides, step progress, and settings live in the visitor's browser storage. Personal guides stay on that browser and can be lost if its site data is cleared. Guide maker requests go to Gemini when the host has configured `GEMINI_API_KEY` as a server secret. External video, source, font, and parts sites have their own policies.

## Presentation constraint

The website uses written instructions so it remains useful and accessible. A separate slideshow or video for the presentation should communicate through images, actions, and narration, with no on-screen words as required by the assignment.
