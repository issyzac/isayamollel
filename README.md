# isayamollel.com

A one-page site written in TypeScript and built with Vite. The build gives plain static files,
so any static host works.

## Layout

    index.html          the page and all its text (English in the markup, Kiswahili in data-sw attributes)
    src/main.ts         starts the two switches
    src/lang.ts         English / Kiswahili switch
    src/theme.ts        light / dark switch
    src/storage.ts      safe localStorage helpers
    src/dom.ts          typed element lookup
    src/styles.css      light and dark themes, set in Lato
    public/             copied as-is: fonts/ (Lato), images/ (your photo), favicon.svg
    vite.config.ts      build settings and the placeholder check
    server.mjs          tiny web server for the built site (listens on the PORT variable, 8080 on Cloud Run)
    Dockerfile          builds the site and runs server.mjs

## Commands

Needs Node 20.19 or newer. Run these once in this folder:

    npm install

Then:

    npm run dev             live preview at http://localhost:5173 (reloads as you edit)
    npm run typecheck       TypeScript check only
    npm run build           typecheck, then build into dist/ (warns about placeholders)
    npm run build:release   same, but fails while any placeholder is left
    npm run preview         serve dist/ to check the built site
    npm start               run the production server on dist/ (after a build)

## Before you publish

1. Replace or delete every yellow placeholder. Swahili text for a placeholder is in its
   `data-sw` attribute, so change both:

       grep -n 'class="tbc"' index.html

2. The CV buttons download `public/Isaya-Mollel-CV.pdf`. To update your CV, replace that file and keep the name.
3. Check the CV before it goes live: it is public once the site is, so anything in it (phone number, email) can be read by anyone.
4. Run `npm run build:release`. It stops with an error until every placeholder is gone.

## Publish on Google Cloud Run

Cloud Run needs a program that listens on port 8080, so the site is served by `server.mjs`.
Both ways of building work: with the Dockerfile, or with Cloud Run's automatic Node.js build
(it runs `npm run build`, then `npm start`).

From this folder:

    gcloud run deploy isayamollel --source . --project isayamolleldotcom --region YOUR_REGION --allow-unauthenticated

To test the container on your computer first:

    docker build -t isayamollel .
    docker run --rm -p 8080:8080 isayamollel

Then open http://localhost:8080. The Dockerfile uses `npm run build:release`, so a deploy stops with a clear
error if a yellow placeholder is left in `index.html`.

## Publish somewhere else

Upload the contents of `dist/` to any static host (GitHub Pages, Cloudflare Pages, Netlify).
Point the isayamollel.com DNS at the host.
