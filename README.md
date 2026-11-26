# Theseus

Theseus is a free, public repair atlas. Visitors can browse repair guides, track steps, and write their own guides without creating an account. My Guides includes a document editor with a reader preview, numbered steps, purchase links, photos, attachments, and a five-star difficulty scale.

## Open in WebStorm

1. In WebStorm, choose **Open** and select this `Theseus` folder.
2. Select **Theseus Desktop and Mobile** from the run configuration menu. It requires a local Node.js interpreter and has no package dependencies.
3. Run the configuration to open the regular site at `http://127.0.0.1:4178/` and a phone-width frame at `http://127.0.0.1:4178/mobile`. Both previews use the same local site and browser data.
4. In **Settings → Tools → Startup Tasks**, add the run configuration to open both previews when this project starts.

Edit the application files under `dist`. The public deployment packages that folder. The mobile frame is available only from the local preview server.

## Where things live

- `dist/index.html` — page structure, accessible navigation, search, filters, and guide containers.
- `dist/styles.css` — the responsive visual system: Aegean blue, clay, cream, repair seams, and large type.
- `dist/app.js` — search, filtering, saved guides, guide views, video playback, and local step progress.
- `dist/guides.js` — the curated guide data. Add new repair paths here.
- `dist/my-guides.js` — the personal guide library, reader, and editor.
- `dist/model-viewer.js` and `dist/mesh-geometry.js` — the local STL and OBJ geometry preview.
- `dist/parts-tools.js` — the manufacturer request draft.
- `dist/workspace.css` — the personal guide screens, dark mode, and desktop banner slots.
- `dist/assets/repair-still-life.png` — original hero artwork.

## Content and safety

The eight starter guides are short original overviews, each linked to a detailed expert source. Electronics repairs are explicitly model-specific. Parts buttons open searches, not guaranteed compatible listings; visitors should check the exact model and seller. Videos are credited to their creators and embedded only after a visitor presses Play.

Saved guides, personal guides, step progress, and settings live in the visitor's browser storage. Personal guides stay on that browser and can be lost if its site data is cleared. Guide maker requests go to Gemini when the host has configured `GEMINI_API_KEY` as a server secret. External video, source, font, and parts sites have their own policies.

The 3D viewer opens STL and OBJ files locally. The spare-parts agent card describes planned manufacturer outreach. The current request tool prepares an editable draft for the visitor to review and send.

## Presentation constraint

The website uses written instructions so it remains useful and accessible. A separate slideshow or video for the presentation should communicate through images, actions, and narration, with no on-screen words as required by the assignment.
