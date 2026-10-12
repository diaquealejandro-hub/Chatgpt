const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
const BASE_URL=process.env.BASE_URL||'http://127.0.0.1:8080/';
const ARTIFACT_DIR=process.env.ARTIFACT_DIR||'/tmp';
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:1100}});
const page=await context.newPage(),errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
await page.goto(BASE_URL);
await page.locator('[data-action="onboard-next"]').click();
await page.locator('[data-action="onboard-priority"][data-value="division"]').click();
await page.locator('[data-action="onboard-priority"][data-value="division"]').click();
await page.locator('[data-action="onboard-next"]').click();
await page.locator('[data-action="onboard-level"][data-level="1"]').click();
await page.locator('[data-action="onboard-next"]').click();
assert.equal(await page.locator('dialog').isVisible(),false);
await page.screenshot({path:`${ARTIFACT_DIR}/ib-math-desktop.png`,fullPage:true});
await page.locator('[data-action="quick-start"]').first().click();
await page.locator('#answer').fill('not a number');await page.locator('#answer-form button[type="submit"]').click();
assert.match(await page.locator('#feedback').innerText(),/valid number/);
const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ib-mental-math-v1')));
const answer=async()=>{
 const p=(await snapshot()).active.question;
 await page.locator('#answer').fill(p.format==='fraction'?p.fraction:String(p.answer));
 await page.locator('#answer-form button[type="submit"]').click();
};
await answer();assert.match(await page.locator('#feedback').innerText(),/Correct/);
await page.locator('[data-action="method"]').click();
assert.ok((await page.locator('.method-panel').innerText()).length>20);
await page.waitForTimeout(1200);assert.equal(await page.locator('.method-panel').count(),1);
await page.locator('[data-action="next"]').click();
await page.locator('#answer').fill('999999999');await page.locator('#answer-form button[type="submit"]').click();
assert.match(await page.locator('#feedback').innerText(),/Incorrect/);
await page.locator('[data-action="method"]').click();await page.locator('[data-action="retry"]').click();
await page.locator('[data-action="skip"]').click();assert.match(await page.locator('#feedback').innerText(),/Skipped/);
await page.locator('[data-action="next"]').click();await page.locator('[data-action="pause"]').click();
const paused=(await snapshot()).active.elapsed;await page.waitForTimeout(400);assert.equal((await snapshot()).active.elapsed,paused);
await page.locator('[data-action="save-home"]').click();await page.reload();await page.locator('[data-action="resume"]').click();
assert.equal(await page.locator('#answer').isVisible(),true);
await page.locator('[data-action="quit"]').click();await page.locator('[data-action="finish"]').last().click();
assert.match(await page.locator('main').innerText(),/Another step forward/);
assert.equal((await snapshot()).sessions.at(-1).total,3);assert.equal((await snapshot()).mistakes.length,1);
console.log('PASS onboarding, answers, incorrect feedback, shortcuts, skip, pause/resume, persistence, summary');
async function goNav(p){await page.locator(`.sidebar .nav-item[data-action="nav"][data-page="${p}"]`).click();}
await goNav('train');await page.locator('[data-action="mode-setup"][data-mode="custom"]').click();
await page.locator('#modal input[data-type]').evaluateAll(inputs=>{for(const i of inputs)if(i.checked){i.checked=false;i.dispatchEvent(new Event('change',{bubbles:true}));}});
await page.locator('#modal details').first().evaluate(el=>el.open=true);
await page.locator('#modal input[data-category="multiplication"][data-type="2x2"]').check();
await page.locator('[data-action="begin-setup"]').click();
assert.deepEqual((await snapshot()).active.config.selection,{multiplication:['2x2']});
for(let i=0;i<3;i++){const p=(await snapshot()).active.question;assert.equal(p.subcategory,'2x2');await answer();await page.locator('[data-action="next"]').click();}
await page.locator('[data-action="pause"]').click();await page.locator('[data-action="finish"]').click();
console.log('PASS exact custom selection');
for(const duration of [60,120,300,600]){
 await goNav('train');await page.locator('[data-action="mode-setup"][data-mode="speed"]').click();
 await page.locator(`[data-action="setup-duration"][data-duration="${duration}"]`).click();
 await page.locator('[data-action="begin-setup"]').click();assert.equal((await snapshot()).active.config.duration,duration);
 await answer();await page.locator('[data-action="pause"]').click();await page.locator('[data-action="save-home"]').click();
 await page.evaluate(duration=>{const d=JSON.parse(localStorage.getItem('ib-mental-math-v1'));d.active.elapsed=duration-.3;localStorage.setItem('ib-mental-math-v1',JSON.stringify(d));},duration);
 await page.reload();await page.locator('[data-action="resume"]').click();await page.locator('.summary-top').waitFor();
 assert.equal((await snapshot()).sessions.at(-1).elapsed,duration);
}
console.log('PASS all four speed durations and timed expiry');
for(const mode of ['daily','mixed','mistakes']){
 await goNav('train');await page.locator(`[data-action="mode-setup"][data-mode="${mode}"]`).click();await page.locator('[data-action="begin-setup"]').click();
 assert.equal((await snapshot()).active.config.mode,mode);await answer();await page.locator('[data-action="pause"]').click();await page.locator('[data-action="finish"]').click();
}
console.log('PASS daily, mixed, mistakes sessions');
await goNav('train');await page.locator('[data-action="mode-setup"][data-mode="adaptive"]').click();await page.locator('[data-action="setup-level"][data-level="0"]').click();
await page.locator('#modal input[data-type]').evaluateAll(inputs=>{for(const i of inputs)if(i.checked){i.checked=false;i.dispatchEvent(new Event('change',{bubbles:true}));}});
await page.locator('#modal details').first().evaluate(el=>el.open=true);await page.locator('#modal input[data-category="multiplication"][data-type="1x1"]').check();
await page.locator('[data-action="begin-setup"]').click();
for(let i=0;i<10;i++){await answer();if(i<9)await page.locator('[data-action="next"]').click();}
assert.equal((await snapshot()).active.levels.multiplication,1);
await page.locator('[data-action="pause"]').click();await page.locator('[data-action="finish"]').click();
console.log('PASS adaptive difficulty after ten fast accurate answers');
await goNav('playbook');
for(const tab of ['Multiplication','Division','Percentages','Fractions','Powers','Square roots','Estimation']){await page.locator(`[data-action="playbook-tab"][data-tab="${tab}"]`).click();assert.ok(await page.locator('.technique-card').count());}
await page.locator('[data-action="playbook-tab"][data-tab="Multiplication"]').click();await page.locator('[data-action="try-technique"][data-index="0"]').click();
for(let i=0;i<5;i++){assert.equal((await snapshot()).active.question.b,5);await answer();await page.locator('[data-action="next"]').click();}
assert.equal(await page.locator('.summary-top').count(),1);assert.equal((await snapshot()).sessions.at(-1).total,5);
console.log('PASS playbook filters and complete five-question shortcut set');
await goNav('sheets');
for(const [tab,count]of [['squares',100],['cubes',15],['roots',100],['roots-exact',100],['fractions',17]]){
 await page.locator(`[data-action="sheet-tab"][data-tab="${tab}"]`).click();assert.equal(await page.locator('.sheet-card').count(),count);
 await page.locator('[data-action="sheet-hide"]').click();assert.equal(await page.locator('.sheet-answer').first().innerText(),'?');
 await page.locator('.sheet-card').first().click();assert.notEqual(await page.locator('.sheet-answer').first().innerText(),'?');
 await page.locator('[data-action="sheet-hide"]').click();await page.locator('[data-action="sheet-flash"]').click();await page.locator('[data-action="flash-reveal"]').click();await page.locator('[data-action="flash-next"]').click();await page.locator('[data-action="flash-prev"]').click();await page.locator('[data-action="flash-shuffle"]').click();await page.locator('[data-action="sheet-flash"]').click();
}
await page.locator('[data-action="sheet-tab"][data-tab="roots-exact"]').click();await page.locator('[data-action="sheet-reverse"]').click();
assert.equal((await snapshot()).active.question.subcategory,'reverse');await page.locator('[data-action="pause"]').click();await page.locator('[data-action="finish"]').click();
console.log('PASS all cheat sheets, hide/reveal, flashcards and reverse quiz');
await goNav('stats');assert.ok(await page.locator('.weakness-row').count());await page.screenshot({path:`${ARTIFACT_DIR}/ib-math-stats.png`,fullPage:true});
await goNav('settings');await page.locator('[data-setting="theme"]').selectOption('light');assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'light');
await page.locator('[data-setting="precision"]').selectOption('3');await page.reload();assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'light');
await goNav('settings');assert.equal(await page.locator('[data-setting="precision"]').inputValue(),'3');
await page.locator('[data-action="priorities"]').click();await page.locator('[data-priority="roots"]').check();await page.locator('[data-action="save-priorities"]').click();assert.ok((await snapshot()).settings.priorities.includes('roots'));
await page.locator('[data-action="confirm-reset-stats"]').click();await page.locator('[data-action="close-modal"]').click();assert.ok((await snapshot()).answers.length>0);
const download=page.waitForEvent('download');await page.locator('[data-action="export"]').first().click();assert.ok((await download).suggestedFilename().endsWith('.json'));
console.log('PASS statistics, light theme, settings persistence, priorities, export and reset confirmation');
await goNav('home');
for(const width of [320,375,390,430,768,1440]){
 await page.setViewportSize({width,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow ${width}`);
 if(width===390)await page.screenshot({path:`${ARTIFACT_DIR}/ib-math-mobile-light.png`,fullPage:true});
}
await page.locator('[data-action="theme"]').click();await page.setViewportSize({width:390,height:844});await page.screenshot({path:`${ARTIFACT_DIR}/ib-math-mobile.png`,fullPage:true});
await page.locator('[data-action="quick-start"]').first().click();await page.screenshot({path:`${ARTIFACT_DIR}/ib-math-training-mobile.png`,fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
await page.locator('[data-action="pause"]').click();await page.locator('[data-action="finish"]').click();
console.log('PASS responsive layouts at 320, 375, 390, 430, 768 and 1440 pixels');
await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await context.setOffline(true);await page.reload();assert.ok(await page.locator('.summary-top, .hero').count());
await page.locator('[data-action="quick-start"]').first().click();await answer();assert.match(await page.locator('#feedback').innerText(),/Correct/);
await page.locator('[data-action="pause"]').click();await page.locator('[data-action="finish"]').click();
console.log('PASS offline reload, exercise generation, answer submission and summary');
await context.setOffline(false);await page.setViewportSize({width:1440,height:1100});await goNav('settings');
await page.locator('[data-action="confirm-reset-stats"]').click();await page.locator('[data-action="reset-data"]').click();assert.equal((await snapshot()).answers.length,0);assert.equal((await snapshot()).settings.precision,3);
await page.locator('[data-action="confirm-reset-all"]').click();await page.locator('[data-action="reset-data"]').click();assert.equal((await snapshot()).onboarded,false);assert.equal(await page.locator('[data-action="onboard-next"]').count(),1);
console.log('PASS confirmed reset statistics and reset all');
assert.deepEqual(errors,[]);console.log('PASS no browser errors');
await browser.close();
