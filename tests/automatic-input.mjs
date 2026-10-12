import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.BASE_URL||'http://127.0.0.1:8080/');await page.locator('[data-action="onboard-skip"]').click();
await page.locator('[data-action="quick-start"]').first().click();await page.locator('[data-action="pause"]').click();await page.locator('[data-action="save-home"]').click();
await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('ib-mental-math-v1'));d.active.question={id:'retry-test',category:'multiplication',subcategory:'2x2',prompt:'12 × 25',answer:300,a:12,b:25,kind:'multiply',format:'number',unit:''};d.active.questionElapsed=0;localStorage.setItem('ib-mental-math-v1',JSON.stringify(d));});
await page.reload();await page.locator('[data-action="resume"]').click();
const snap=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ib-mental-math-v1')));
await page.locator('#answer').fill('3');await page.waitForTimeout(350);assert.equal((await snap()).answers.length,0);
await page.locator('#answer').fill('301');await page.locator('[data-action="retry"]').waitFor();assert.equal((await snap()).answers.length,1);assert.equal((await snap()).active.question.id,'retry-test');
await page.waitForTimeout(1300);assert.equal((await snap()).active.question.id,'retry-test');assert.equal(await page.locator('#answer').getAttribute('aria-readonly'),'false');
await page.locator('#answer').fill('300');await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('Correct'));
assert.equal((await snap()).answers.length,2);assert.equal((await snap()).mistakes[0].resolved,true);
await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ib-mental-math-v1')).active.question.id!=='retry-test');
console.log('PASS no Enter required, partial input debounce, wrong-answer hold, editable retry, correct auto-advance, resolved mistake');
const id=(await snap()).active.question.id;await page.locator('#answer').fill(String((await snap()).active.question.answer));await page.locator('[data-action="pause"]').click();await page.waitForTimeout(1100);assert.equal((await snap()).answers.length,2);
await page.locator('[data-action="finish"]').click();await page.locator('[data-action="nav"][data-page="home"]').last().click();await page.locator('[data-action="proper-practice"]').click();await page.locator('[data-action="begin-setup"]').click();
for(let i=0;i<4;i++){const p=(await snap()).active.question;assert.equal(p.subcategory,'proper');assert.ok(p.answer>0&&p.answer<1);await page.locator('#answer').fill(String(p.answer));await page.waitForFunction(id=>JSON.parse(localStorage.getItem('ib-mental-math-v1')).active.question.id!==id,p.id);}
await page.locator('[data-action="pause"]').click();await page.locator('[data-action="finish"]').click();await page.locator('.mobile-nav [data-page="sheets"]').click();
for(const tab of ['squares','roots','roots-exact']){await page.locator(`[data-action="sheet-tab"][data-tab="${tab}"]`).click();assert.equal(await page.locator('.sheet-card').count(),100);}
await page.locator('[data-action="sheet-tab"][data-tab="squares"]').click();assert.equal(await page.locator('.sheet-question').last().textContent(),'100²');assert.equal(await page.locator('.sheet-answer').last().textContent(),'10,000');
await page.locator('[data-action="sheet-tab"][data-tab="roots"]').click();assert.equal(await page.locator('.sheet-question').last().textContent(),'√100');assert.equal(await page.locator('.sheet-answer').last().textContent(),'10');
await page.locator('[data-action="sheet-tab"][data-tab="roots-exact"]').click();assert.equal(await page.locator('.sheet-question').last().textContent(),'√10,000');assert.equal(await page.locator('.sheet-answer').last().textContent(),'100');
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
console.log('PASS pause cancels pending input, dedicated proper-fraction practice, complete tables and mobile layout');await browser.close();
