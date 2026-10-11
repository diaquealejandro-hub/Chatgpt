import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const {default:AxeBuilder}=await import(process.env.AXE_MODULE||'@axe-core/playwright');
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();
await page.goto(process.env.BASE_URL||'http://127.0.0.1:8080/');
async function audit(name){await page.waitForTimeout(400);const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(result.violations,[],name);console.log(name,JSON.stringify(result.violations.map(v=>({id:v.id,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))));}
await audit('Onboarding');await page.locator('[data-action="onboard-skip"]').click();await audit('Dark home');
await page.locator('[data-action="quick-start"]').first().click();
await audit('Training');
for(const width of [320,375,390,430]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);console.log('training width',width,'PASS');}
await page.evaluate(()=>window._originalAnswer=document.querySelector('#answer'));
const d=await page.evaluate(()=>JSON.parse(localStorage.getItem('ib-mental-math-v1')));await page.locator('#answer').fill(String(d.active.question.answer));await page.locator('#answer-form button[type="submit"]').click();
assert.equal(await page.evaluate(()=>window._originalAnswer===document.querySelector('#answer')),true);
await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>window._originalAnswer===document.querySelector('#answer')),true);console.log('Answer node retained through feedback and auto-next');
await page.locator('[data-action="pause"]').click();await page.locator('[data-action="finish"]').click();await audit('Summary');
await page.setViewportSize({width:1440,height:1100});await page.locator('.sidebar .nav-item[data-page="settings"]').click();await audit('Dark settings');await page.locator('[data-setting="theme"]').selectOption('light');await audit('Light settings');
await page.locator('.sidebar .nav-item[data-page="home"]').click();await audit('Light home');
await browser.close();
