# HTTPS publication

The application can be published through GitHub Pages in `diaquealejandro-hub/Chatgpt`.

- The `main` branch contains the complete source and regression tests.
- The `gh-pages` branch contains only the static application files and `.nojekyll`.
- In the repository's **Settings → Pages**, choose **Deploy from a branch**, then **gh-pages**, then **/ (root)**, and save.
- GitHub provides the actual HTTPS URL after its Pages build succeeds. Check that URL before sharing it as a live application.

If Pages is unavailable for the repository's visibility or account plan, publish the same static files to another HTTPS static host. Do not change repository visibility automatically.

On iPhone: open the published URL in Safari, choose Share → Add to Home Screen, and launch once online to prepare the offline cache.

A cloud environment snapshot does not publish a public website. Access to `api.github.com` is needed to activate and monitor GitHub Pages programmatically. The domain `diaquealejandro-hub.github.io` is needed to verify the deployed site.

For updates, increment the cache name in `service-worker.js` and the matching offline-readiness check in `js/app.js` before publishing new cached assets.
