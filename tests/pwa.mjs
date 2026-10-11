const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
const context=await chromium.launchPersistentContext('/tmp/ib-pwa-install-'+Date.now(),{...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox'],viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();await page.goto(process.env.BASE_URL||'http://127.0.0.1:8080/');await page.locator('[data-action="onboard-skip"]').click();
await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
const cdp=await context.newCDPSession(page);const manifest=await cdp.send('Page.getAppManifest');assert.equal(manifest.errors.length,0);console.log('Manifest parsed without errors');
try{const result=await cdp.send('Page.getInstallabilityErrors');assert.deepEqual(result.installabilityErrors,[]);console.log('Chromium installability checks passed');}catch(e){if(e.code===-32601)console.log('Installability protocol unavailable');else throw e;}
assert.equal(await page.evaluate(()=>navigator.serviceWorker.controller!==null),true);
const assets=await page.evaluate(async()=>{const c=await caches.open('ib-math-v1');return(await c.keys()).map(r=>new URL(r.url).pathname);});assert.equal(assets.length,14);console.log('All 14 PWA assets cached');
await page.locator('[data-action="quick-start"]').first().click();const p=await page.evaluate(()=>JSON.parse(localStorage.getItem('ib-mental-math-v1')).active.question);await page.locator('#answer').fill(String(p.answer));await page.locator('#answer').press('Enter');assert.match(await page.locator('#feedback').innerText(),/Correct/);await page.locator('#answer').press('Enter');assert.equal(await page.locator('#feedback').innerText(),'');assert.equal(await page.evaluate(()=>document.activeElement.id),'answer');
console.log('Touch mobile context, numeric input, Enter submit/next and automatic focus passed');await context.close();
