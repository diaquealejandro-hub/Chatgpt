# IB Mental Math Trainer

A mobile-first, offline-capable mental arithmetic trainer for investment banking interviews. Built with HTML, CSS, and modular vanilla JavaScript. No account, backend, external fonts, analytics, runtime packages, or build step.

## Run locally

From this checkout:

```sh
cd /workspace/Chatgpt
npm start
```

This serves static files on port **8080** using Python 3. You can also run `python3 -m http.server 8080 --bind 0.0.0.0` directly; Node is only needed for the test runner and npm command shortcuts. Serve over HTTP rather than opening `index.html` as a file, because browser modules and service workers require an HTTP origin.

## Practice

- **Endless:** immediate questions; correct answers advance automatically. Correct answers are accepted automatically after 850 ms without typing. Partial or incorrect input never records a miss automatically; only Enter / Check answer explicitly submits a wrong attempt. Incorrect answers stay on the same question: edit the input or tap Retry until correct. Enter / Check answer remain optional manual controls. Enter during incorrect feedback retries; Enter during correct feedback moves on.
- **Speed drill:** 1, 2, 5, or 10 minutes, with an animated countdown ring and session summary.
- **Custom:** independently select every category and exercise subtype, including exact multiplication digit combinations.
- **Adaptive:** starting presets move one level at a time after each block of ten answers in a category. Manual subtype selections are preserved; only applicable number distributions and tolerances change.
- **Mistakes:** repeat saved misses and similar exercises, weighted by recurrence, speed, and whether an original miss has been solved.
- **Daily workout:** ten minutes with the documented interview-focused mix. Proven weaknesses increase category and subtype weights.
- **Mixed:** mix selected categories.
- **Playbook / reference quiz:** five completed-question practice sets, including exact-factor shortcuts and fraction families. Retries do not consume the set.
- **1/n:** dedicated practice for every reciprocal from 1/1 through 1/16, in shuffled rounds without repeats.
- **Fractions below 1:** a dedicated Home / Training entry for proper fractions with all 120 numerator/denominator combinations up to denominator 16, in shuffled rounds. All prompts ask for decimals below one.
- **Reference tables:** all squares n² from 1 to 100, square roots of every integer 1–100, and inverse perfect-square roots from √1 to √10,000.

Pause and finish controls are always available. Backgrounding the app automatically pauses the clock. A paused session is saved and can be resumed after reopening. One practice session is active at a time; starting another offers to finish the previous one first.

Methods are revealed only after an attempt or skip. Opening a method holds automatic advancement. The recommendation threshold is configurable and scales with difficulty.

## Answer formats

Prompts explain the expected format. Percent questions use percentage points: `25` and `25%` mean 25%. Fraction-to-decimal questions accept `.5`, `0.5`, `1/2`, and `50%`. Fraction-to-percent questions also accept fractional input. Reverse conversion accepts a fraction, equivalent decimal, or percent. Comma-grouped thousands, decimal commas with one or two decimal places, and small leading-zero decimal commas are supported. Ambiguous `1,234` means 1,234, so use a decimal point for three decimal places.

Decimal precision controls acceptance of correctly rounded answers. Integer arithmetic requires an exact numeric answer. Estimation tolerance is displayed per question (15/8/4% by preset; approximate roots use 6/3/1.5%). Skips count as incorrect for performance analysis and are labelled separately in the detail log.

## Persistence and privacy

Data lives in this browser's LocalStorage, under `ib-mental-math-v1`. There are no outgoing API requests. Lifetime statistics remain intact while detailed logs are bounded to keep the app fast: the latest 5,000 answers, 1,000 mistakes, 500 completed-session summaries, and 500 detailed answers in a resumable active session. Lifetime category/subcategory totals, daily counts, training time, and streaks are retained separately. Recent weakness analysis uses the last 500 answers, with a minimum of five per skill.

Export progress as JSON in Settings. Resets require explicit confirmation. If browser storage is unavailable or full, an on-screen message explains that persistence is not guaranteed. Browser/device cleanup can remove local data; exported JSON preserves a readable copy. No automatic cross-device synchronization is provided.

The training score is a motivational metric, combining recent accuracy, speed, consistency, and breadth. It is not an interview assessment.

## Deploy and install on iPhone

Publish this directory to any **HTTPS static host**. There is no build output; upload `index.html`, `css/`, `js/`, `icons/`, `manifest.json`, and `service-worker.js`. Relative paths support hosting at the root or a subdirectory. For GitHub Pages, the root source directory can be served directly. Do not deploy `tests/` or developer tooling unless desired.

On iPhone, open the published HTTPS site in Safari, then Share → **Add to Home Screen**. On recent iOS versions, Share may be inside the More menu. Open it once online; Settings reports when the offline cache is ready. The manifest includes standalone display, app identity, theme/background colors, and normal/maskable PNG icons. The Apple touch icon and safe-area handling are included. Native launch-screen appearance depends on iOS version.

Service workers require HTTPS (localhost is allowed for development). An ordinary LAN HTTP address can display the application but will not enable installable offline operation. Installation and the iOS software keyboard still require a final check on an actual iPhone; desktop mobile emulation does not replace that check.

### Release updates

Increment the `CACHE` name in `service-worker.js` for each release that changes cached files, and use the same cache name in the readiness check in `js/app.js`. The service worker precaches the complete app shell. A new version waits for all existing app tabs to close, then activates and removes only this app's older caches. Version-consistent cached files serve both online and offline, avoiding mixed-module releases. Update notifications tell the user to close and reopen the app.

## Validation

Run the dependency-free arithmetic and persistence tests:

```sh
npm test
```

The suite tests every subtype at all three levels (14,400 generated problems per run), independently verifies expected arithmetic, checks shortcut examples, rounding/equivalent formats, adaptive thresholds, mistake tracking, persistence, and lifetime totals after log rollover.

A browser regression suite is in `tests/browser.mjs`. Playwright is **optional developer tooling**, not an application dependency. With Chromium installed, one way to run it without adding packages to the app is:

```sh
npm install --prefix /tmp/ib-math-check --cache /tmp/ib-math-npm-cache --no-audit --no-fund playwright
PLAYWRIGHT_MODULE=/tmp/ib-math-check/node_modules/playwright/index.mjs CHROMIUM_PATH=/usr/bin/chromium node tests/browser.mjs
```

Start the static server first. The suite uses an isolated browser profile, exercises all modes, controls, storage, themes, exports, confirmations, responsiveness, and offline reloads. Timed-expiry tests advance a saved session clock so they do not take 18 minutes. Screenshots are written to `/tmp`. `BASE_URL`, `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, and `ARTIFACT_DIR` can override the defaults.

## Structure

```text
index.html              App shell and iOS/PWA metadata
css/styles.css          Responsive design, themes and motion controls
js/app.js               Views, interaction, session lifecycle and timers
js/generators.js        Exercise catalog, generators and answer validation
js/tricks.js            Pattern-aware methods and playbook
js/stats.js             Performance analysis and lifetime accumulators
js/storage.js           Versioned local persistence and safe defaults
js/ui.js                Shared rendering, number/time and icon helpers
manifest.json           Installable web app identity
service-worker.js       Versioned offline app shell
icons/                  PNG app, maskable and Apple touch icons
tests/                  Engine and optional browser regression tests
```

Optional PWA and accessibility regression checks use the same external developer-tool installation:

```sh
PLAYWRIGHT_MODULE=/tmp/ib-math-check/node_modules/playwright/index.mjs CHROMIUM_PATH=/usr/bin/chromium node tests/pwa.mjs
npm install --prefix /tmp/ib-math-check --cache /tmp/ib-math-npm-cache --no-audit --no-fund @axe-core/playwright
PLAYWRIGHT_MODULE=/tmp/ib-math-check/node_modules/playwright/index.mjs AXE_MODULE=/tmp/ib-math-check/node_modules/@axe-core/playwright/dist/index.mjs CHROMIUM_PATH=/usr/bin/chromium node tests/accessibility.mjs
```

The PWA check uses a temporary normal Chromium profile (private browsing deliberately disables installation). It checks manifest parsing, installability, all 14 cached assets, touch-screen emulation, Enter submission, and input focus. The accessibility check asserts no automated WCAG A/AA violations on onboarding, dark/light home, training, summary, and dark/light settings, and checks that the answer input survives feedback and automatic advancement. Automated checks supplement manual accessibility and actual iPhone testing.

Automatic-answer regression: `PLAYWRIGHT_MODULE=/tmp/ib-math-check/node_modules/playwright/index.mjs CHROMIUM_PATH=/usr/bin/chromium node tests/automatic-input.mjs`. Statistics count attempts, including incorrect retries, while reference mini-practice counts completed questions. The offline cache was advanced to `ib-math-v3`; the LocalStorage key stays unchanged so existing progress survives this update.
