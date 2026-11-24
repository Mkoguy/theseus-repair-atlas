# Theseus

Theseus is a free, public repair atlas. Visitors can search and filter repair guides, watch linked expert videos, find parts, save guides, and track steps without creating an account. See the [live site](https://theseus-repair-atlas.yohguy.chatgpt.site).

## Open in WebStorm

1. In WebStorm, choose **Open** and select this `Theseus` folder.
2. Open `dist/index.html` with WebStorm's built-in browser preview or a run configuration that serves the `dist` folder. ES modules need an HTTP preview rather than opening the file directly.
3. Edit the files under `dist`. The public deployment uses that folder.

## Where things live

- `dist/index.html` — page structure, accessible navigation, search, filters, and guide containers.
- `dist/styles.css` — the responsive visual system: Aegean blue, clay, cream, repair seams, and large type.
- `dist/app.js` — search, filtering, saved guides, guide views, video playback, and local step progress.
- `dist/guides.js` — the curated guide data. Add new repair paths here.
- `dist/assets/repair-still-life.png` — original hero artwork.

## Content and safety

The eight starter guides are short original overviews, each linked to a detailed expert source. Electronics repairs are explicitly model-specific. Parts buttons open searches, not guaranteed compatible listings; visitors should check the exact model and seller. Videos are credited to their creators and embedded only after a visitor presses Play.

Saved guides, step progress, and larger text preference live in the visitor's browser storage. There is no account or server-side collection of visitor data in this version. External video, source, font, and parts sites have their own policies.

## Presentation constraint

The website uses written instructions so it remains useful and accessible. A separate slideshow or video for the presentation should communicate through images, actions, and narration, with no on-screen words as required by the assignment.
