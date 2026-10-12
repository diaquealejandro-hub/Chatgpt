import {CATEGORIES,LEVELS,SQUARES,FRACTIONS,defaultSelection,generate,pick,fmt,validateAnswer,answerLabel,answerHint} from './generators.js';
import {getMethod,PLAYBOOK} from './tricks.js';
import {load,save,reset,localDay,storageAvailable} from './storage.js';
import {aggregate,breakdown,weaknesses,labelFor,trainingScore,scoreTrend,recordAnswer,adaptiveLevel,dailyWeights,ensureLifetime,lifetimeStats,lifetimeBreakdown,sessionStats,appendSessionRecord} from './stats.js';
import {escapeHTML as esc,icon,button as btn,time,methodHTML,heading,metric} from './ui.js';
const root=document.querySelector('#app'),modal=document.querySelector('#modal');
let data=load(),page='home',session=null,summary=null,nextTimeout=null,lastTick=Date.now(),lastSaved=Date.now(),toastTimeout;
let playbookTab='All',sheetTab='squares',hideSheet=false,flashMode=false,flashIndex=0,flashRevealed=false,mistakeFilter='unresolved';
let setupDraft=null,onboardStep=0,onboardValues={objective:data.settings.objective,priorities:[...data.settings.priorities],level:data.settings.level};
let installPrompt=null,offlineReady=false,answerTimeout=null;
ensureLifetime(data);
const sessionNames={endless:'Endless practice',speed:'Speed drill',custom:'Custom practice',adaptive:'Adaptive training',mistakes:'Mistakes practice',daily:'Daily workout',mixed:'Mixed practice',mini:'Shortcut practice'};
const navs=[['home','home','Overview'],['train','train','Training'],['playbook','book','Playbook'],['sheets','sheets','Cheat sheets'],['stats','stats','Statistics']];
const secs=n=>`${n.toFixed(1)}s`,pct=n=>`${Math.round(n)}%`,today=()=>localDay(),questionsToday=()=>data.lifetime?.days[today()]||0;
function persist(){const ok=save(data);document.querySelector('#storage-warning')?.remove();if(!ok&&!document.querySelector('#storage-warning')){const p=document.createElement('p');p.id='storage-warning';p.className='notice';p.textContent='Local storage is unavailable or full. This session works, but changes may not survive closing the app. Export your data in Settings.';document.querySelector('main')?.prepend(p);}return ok;}
function notify(message){const t=document.querySelector('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>t.classList.remove('show'),3500);}
function applyTheme(){let theme=data.settings.theme;if(theme==='system')theme=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=theme;document.body.classList.toggle('no-animation',data.settings.animations==='off');document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#101114':'#f6f6f9';}
function render(){
  const active=page==='training';document.body.classList.toggle('training-active',active);
  updateKeyboardLayout();
  if(active&&!session.paused&&document.querySelector('.training .answer-form')){updateTraining();return;}
  const current=active?'train':page;
  root.innerHTML=`<div class="shell"><aside class="sidebar"><a href="#home" class="brand" data-action="nav" data-page="home"><div class="brand-mark">IB</div><div class="brand-name">Mental Math<small><br>THE INTERVIEW EDGE</small></div></a><div class="nav-label">WORKSPACE</div><nav aria-label="Main navigation">${navs.map(([id,i,label])=>`<button class="nav-item ${current===id?'active':''}" data-action="nav" data-page="${id}" ${current===id?'aria-current="page"':''}>${icon(i)}<span>${label}</span>${id==='train'?'<span class="nav-badge">∞</span>':''}</button>`).join('')}<button class="nav-item ${current==='mistakes'?'active':''}" data-action="nav" data-page="mistakes">${icon('reset')}<span>Mistakes</span><span class="nav-badge">${data.mistakes.filter(m=>!m.resolved).length}</span></button></nav><div class="sidebar-bottom"><button class="nav-item ${current==='settings'?'active':''}" data-action="nav" data-page="settings">${icon('settings')}<span>Settings</span></button><div class="offline-label"><span class="status-dot"></span><span data-offline-label>${offlineReady?'Offline ready':'Local & private'}</span></div></div></aside><div class="workspace"><header class="topbar"><span class="topbar-title">${page==='home'?'Your training workspace':page==='training'?'Focused training':page==='sheets'?'Cheat sheets':page==='playbook'?'Mental Math Playbook':page==='stats'?'Your progress':page==='settings'?'Preferences':page==='summary'?'Session complete':page==='mistakes'?'Learn from your mistakes':'Build your interview edge'}</span><div class="topbar-right"><span class="tag">${icon('shield')} On-device. Always private.</span><button class="icon-btn" data-action="theme" aria-label="Switch color theme">${icon('moon')}</button><button class="avatar" data-action="nav" data-page="settings" aria-label="Open settings">IB</button><button class="icon-btn" data-action="nav" data-page="settings" aria-label="Settings">${icon('settings')}</button></div></header><main id="main" tabindex="-1">${content()}</main></div><nav class="mobile-nav" aria-label="Mobile navigation">${navs.map(([id,i,label])=>`<button class="${current===id?'active':''}" data-action="nav" data-page="${id}" ${current===id?'aria-current="page"':''}>${icon(i)}<span>${id==='home'?'Home':label}</span></button>`).join('')}</nav></div>`;
  if(active&&!session.paused&&!session.feedback)focusAnswer();
  if(!storageAvailable)persist();
}
function content(){return page==='home'?homeHTML():page==='train'?trainHTML():page==='training'?trainingHTML():page==='summary'?summaryHTML():page==='playbook'?playbookHTML():page==='sheets'?sheetsHTML():page==='stats'?statsHTML():page==='mistakes'?mistakesHTML():settingsHTML();}
function homeHTML(){
  const s=lifetimeStats(data),recent=aggregate(data.answers.slice(-100)),weak=weaknesses(data.answers)[0],daily=questionsToday(),goal=50;
  const focus=weak?labelFor(weak.key):'Find your baseline';
  return `${heading('Sharper math. Stronger interviews.','A little practice today. A real advantage tomorrow.',`<span class="date-label">${new Date().toLocaleDateString('en',{weekday:'long',month:'short',day:'numeric'})}</span>`)}${data.active?`<div class="resume-banner"><p><strong>Your practice is waiting.</strong><br><span class="muted">${esc(sessionNames[data.active.config.mode])} · ${sessionStats(data.active).total} answered</span></p>${btn('Resume →','resume','primary')}</div>`:''}<section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><div class="eyebrow">${icon('train')} BUILT FOR YOUR NEXT INTERVIEW</div><h2 id="hero-title">Think faster.<br>Calculate with confidence.</h2><p>Focused practice. Smarter shortcuts.<br>The numbers are yours to master.</p><div class="hero-actions">${btn(`${icon('play')} Start training`,'quick-start','primary')}${btn(`${icon('clock')} Daily workout`,'daily','ghost')}</div></div><div class="hero-art" aria-hidden="true"><div class="orbit"></div><div class="orbit two"></div><div class="orbit three"></div><div class="math-tile one">48 × 25</div><div class="math-tile two">1,200<span style="font-size:15px;margin-left:12px;color:#a8d6b8">✓</span></div><div class="math-tile three">A little faster. Every day.</div></div></section><section class="stats-strip" aria-label="Your training snapshot">${metric('Best streak',s.best||'—',s.total?'correct in a row':'Build your first streak','flame')}${metric('Accuracy',recent.total?`${Math.round(recent.accuracy)}<small>%</small>`:'—','last 100 answers','target')}${metric('Average time',recent.total?`${recent.average.toFixed(1)}<small>s</small>`:'—','last 100 answers','clock')}${metric('Training score',s.total?`${trainingScore(data.answers)}<small>/100</small>`:'—','your personal benchmark','stats')}</section><div class="section-head"><h2>Choose your practice</h2><button class="link-btn" data-action="setup" data-category="all">Customize ${icon('arrow')}</button></div><section class="practice-grid" aria-label="Practice categories">${Object.entries(CATEGORIES).map(([key,c])=>{const cs=data.lifetime?.categories[key]||aggregate([]);return `<button class="practice-card" data-action="setup" data-category="${key}"><div class="category-icon">${key==='interview'?icon('stats'):c.icon}</div><span class="card-arrow">${icon('arrow')}</span><h3>${c.name}</h3><p>${c.description}</p><div class="card-meta"><span>${key==='multiplication'||key==='division'||key==='percentages'?'INTERVIEW ESSENTIAL':`${Object.keys(c.types).length} EXERCISE TYPES`}</span><span>${cs.total?`${pct(cs.accuracy)} accuracy`:'Start →'}</span></div></button>`;}).join('')}</section><section class="panel" style="margin-bottom:20px"><div class="section-head"><div><h2>Fractions below 1</h2><p class="field-help">Only proper fractions: 1/4, 1/8, 1/16, 5/8 and more. Answer as a decimal.</p></div>${btn('Practice →','proper-practice','primary')}</div></section><div class="bottom-grid"><section class="panel focus-panel"><div class="focus-icon">${icon('focus')}</div><div class="focus-content"><div class="eyebrow">TODAY’S FOCUS</div><h3>${esc(focus)}</h3><p>${weak?`${pct(weak.accuracy)} accuracy · ${secs(weak.average)} average. A focused set will help.`:'Start with multiplication, division and percentages. We’ll find your focus after five answers per skill.'}</p><button class="link-btn" data-action="focus">${weak?'Train this skill':'Build my baseline'} ${icon('arrow')}</button></div></section><section class="panel"><div class="daily-row">${icon('target')}<div><h3>Small steps. Compounding returns.</h3><p>Your daily target: ${goal} questions.</p></div></div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100,daily/goal*100)}%"></div></div><div class="daily-footer"><span>${daily} / ${goal} questions today</span><span>${Math.min(100,Math.round(daily/goal*100))}%</span></div></section></div><footer class="footer-note"><span>No account. No distractions. Just progress.</span><span>IB Mental Math Trainer · ${offlineReady?'Ready for offline practice':'Made for daily practice'}</span></footer>`;
}
function trainHTML(){return `${heading('Make every minute count.','Choose a rhythm. We’ll take care of the next question.')}<div class="practice-grid">${Object.entries(sessionNames).filter(([k])=>k!=='mini').map(([key,name])=>`<button class="practice-card" data-action="mode-setup" data-mode="${key}"><div class="category-icon">${{endless:'∞',speed:'◷',custom:'⚙',adaptive:'↗',mistakes:'↺',daily:'10',mixed:'±'}[key]}</div><span class="card-arrow">${icon('arrow')}</span><h3>${name}</h3><p>${{endless:'No finish line. Find your flow.',speed:'1, 2, 5 or 10 minutes against the clock.',custom:'Select exactly the skills you want.',adaptive:'Difficulty that grows with your progress.',mistakes:'Revisit misses and their patterns.',daily:'10 minutes, weighted to your weak areas.',mixed:'A balanced mix of your selected skills.'}[key]}</p></button>`).join('')}</div><section class="panel" style="margin-bottom:20px"><h2>Fractions below 1</h2><p class="field-help">1/4, 1/8, 1/16, 5/8… Only divisions whose answer is less than 1.</p>${btn('Practice fractions','proper-practice','primary')}</section><div class="notice"><strong>Precision, then pace.</strong> Shortcuts appear only after an attempt. Every answer builds your personal training history.</div>${data.active?btn('Resume previous session','resume','primary'):''}`;}
function setup(category='all',mode='custom',selection=null){
  if(mode==='mistakes'&&!data.mistakes.length){notify('No mistakes yet. Start a session to build your practice history.');return;}
  const presets=defaultSelection(data.settings.level);
  let categories=category==='all'?[...data.settings.priorities]:[category];
  if(mode==='daily')categories=Object.keys(dailyWeights(data.answers));
  if(mode==='mixed')categories=Object.keys(CATEGORIES);
  if(mode==='mistakes')categories=[...new Set(data.mistakes.filter(m=>!m.resolved).map(m=>m.problem.category))];
  if(!categories.length)categories=['multiplication','division','percentages'];
  if(mode==='daily'&&!selection)selection=dailySelection(data.settings.level);
  setupDraft={mode,level:data.settings.level,duration:mode==='daily'?600:120,selection:selection||Object.fromEntries(categories.map(k=>[k,[...presets[k]]])),explicit:mode==='custom'};
  renderSetup();
}
function renderSetup(){
  const d=setupDraft;
  modal.innerHTML=`<div class="modal-header"><div><h2 id="modal-title">Your practice, your way.</h2><p>Choose the details. Get straight to the numbers.</p></div><button class="icon-btn" data-action="close-modal" aria-label="Close practice setup">${icon('close')}</button></div><div class="form-group"><label class="field-label" for="setup-mode">Training mode</label><select class="select" id="setup-mode">${Object.entries(sessionNames).filter(([k])=>k!=='mini').map(([key,name])=>`<option value="${key}" ${d.mode===key?'selected':''}>${name}</option>`).join('')}</select></div><div class="form-group"><span class="field-label">Starting level</span><div class="chips">${LEVELS.map((name,i)=>`<button class="chip ${d.level===i?'active':''}" data-action="setup-level" data-level="${i}" aria-pressed="${d.level===i}">${name}</button>`).join('')}</div><p class="field-help">Presets update the types below. You can fine-tune every selection.</p></div>${d.mode==='speed'?`<div class="form-group"><span class="field-label">Duration</span><div class="chips">${[60,120,300,600].map(n=>`<button class="chip ${n===d.duration?'active':''}" data-action="setup-duration" data-duration="${n}" aria-pressed="${n===d.duration}">${n/60} min</button>`).join('')}</div></div>`:d.mode==='daily'?'<div class="notice">10 minutes · 40% multiplication, 25% division, 20% percentages, plus supporting skills. Your weak areas receive more weight.</div>':''}<div class="form-group"><span class="field-label">Exercise types</span><p class="field-help">${d.mode==='adaptive'?'Adaptive presets progress gradually. Your custom types remain selected.':d.mode==='mistakes'?'Previously missed questions are mixed with similar problems. Selected types filter both.':'Select at least one type. Multiple selections are mixed.'}</p>${Object.entries(CATEGORIES).map(([key,c])=>`<details class="type-group" ${d.selection[key]?.length?'open':''}><summary>${c.icon} &nbsp; ${c.name} <small class="muted" id="count-${key}">${d.selection[key]?.length||0} selected</small></summary><div class="chips">${Object.entries(c.types).map(([type,label])=>`<label class="chip"><input type="checkbox" data-category="${key}" data-type="${type}" ${d.selection[key]?.includes(type)?'checked':''}>${label}</label>`).join('')}</div></details>`).join('')}</div><div id="setup-error" class="inline-error" role="alert"></div><div class="modal-footer">${btn('Cancel','close-modal')}${btn(`${icon('play')} Let’s train`,'begin-setup','primary')}</div>`;
  openModal();
}
function openModal(){if(!modal.open)modal.showModal();}
function closeModal(){modal.close();}
function focusAnswer(){document.querySelector('#answer')?.focus({preventScroll:true});}
function updateTraining(){
  const template=document.createElement('template');template.innerHTML=trainingHTML();
  for(const selector of ['.training-top','.session-stats','.question-meta','.question-actions','#feedback','#answer-submit','#answer-help','#question-method','#session-notice','.session-note']){
    const target=document.querySelector(selector),source=template.content.querySelector(selector);if(target&&source){target.innerHTML=source.innerHTML;target.className=source.className;}
  }
  const source=template.content.querySelector('#problem'),problem=document.querySelector('#problem');problem.textContent=source.textContent;problem.className=source.className;
  document.querySelector('.question-card').className=template.content.querySelector('.question-card').className;
  const input=document.querySelector('#answer');input.value=session.feedback?.raw||'';input.setAttribute('aria-readonly',String(!!session.feedback&&(session.feedback.correct||session.feedback.skipped)));input.removeAttribute('aria-invalid');
  document.querySelector('.answer-form label').textContent=`Your answer to ${session.question.prompt}`;
  document.querySelector('.answer-unit').textContent=template.content.querySelector('.answer-unit').textContent;
  document.querySelector('.answer-special')?.remove();const special=template.content.querySelector('.answer-special');if(special)document.querySelector('.answer-wrap').append(special);
  if(!session.feedback)focusAnswer();
}
function quickStart(){
  if(data.active){resume();return;}
  const mode=data.settings.mode;
  if(mode==='custom'||mode==='mistakes'){setup('all',mode);return;}
  const cats=mode==='mixed'?Object.keys(CATEGORIES):data.settings.priorities;
  const defaults=defaultSelection(data.settings.level);
  startSession({mode,level:data.settings.level,duration:mode==='daily'?600:120,selection:Object.fromEntries(cats.filter(c=>CATEGORIES[c]).map(c=>[c,defaults[c]])),explicit:false});
}
function startSession(config){
  if(data.active && !session){modal.innerHTML=`<div class="modal-header"><h2 id="modal-title">A session is already saved</h2></div><p class="muted">Resume it, or finish it before starting this practice. Your recorded answers will be kept.</p><div class="modal-footer">${btn('Resume','resume')}${btn('Finish & start new','replace-session','primary')}</div>`;setupDraft=config;openModal();return;}
  clearTimeout(answerTimeout);clearTimeout(nextTimeout);closeModal();
  const selection=Object.fromEntries(Object.entries(config.selection||{}).filter(([k,v])=>CATEGORIES[k]&&v.length));
  if(!Object.keys(selection).length){notify('Select at least one exercise type.');return;}
  config={...config,selection};
  session={id:crypto.randomUUID(),config,records:[],levels:Object.fromEntries(Object.keys(CATEGORIES).map(c=>[c,config.level])),adaptiveCounts:{},seen:[],elapsed:0,questionElapsed:0,paused:false,feedback:null,shownMethod:false,question:null,startDate:Date.now(),lastMilestone:0};
  nextQuestion();page='training';lastTick=Date.now();saveActive();render();
}
function dailySelection(level){
  const defaults=defaultSelection(level),result=Object.fromEntries(Object.keys(dailyWeights(data.answers)).map(c=>[c,[...defaults[c]]]));
  for(const w of weaknesses(data.answers).slice(0,3)){const[c,t]=w.key.split('/');if(result[c]&&!result[c].includes(t))result[c].push(t);}
  return result;
}
function weightedPick(weights){const entries=Object.entries(weights);let n=Math.random()*entries.reduce((s,[,w])=>s+w,0);for(const [key,w]of entries){n-=w;if(n<=0)return key;}return entries[entries.length-1][0];}
function nextQuestion(){
  if(!session)return;
  clearTimeout(answerTimeout);clearTimeout(nextTimeout);
  if(session.config.target && (session.completed??session.records.filter(r=>r.correct||r.skipped).length)>=session.config.target){finishSession();return;}
  const cfg=session.config;
  let p,category,sub;
  if(cfg.mode==='mistakes') {
    const mistakes=data.mistakes.filter(m=>cfg.selection[m.problem.category]?.includes(m.problem.subcategory));
    if(mistakes.length){
      const chosen=weightedPick(Object.fromEntries(mistakes.map((m,i)=>[i,(m.resolved?.4:1)*m.count*(1+Math.min(m.seconds/20,2))])));
      const m=mistakes[Number(chosen)];category=m.problem.category;sub=m.problem.subcategory;
      if(Math.random()<.65)p={...m.problem,id:crypto.randomUUID()};
    }
  }
  if(!category) {
    if(cfg.mode==='daily'){
      const all=dailyWeights(data.answers);const weights=Object.fromEntries(Object.keys(cfg.selection).map(c=>[c,all[c]||5]));category=weightedPick(weights);
    }else category=pick(Object.keys(cfg.selection));
    sub=cfg.mode==='daily'?weightedPick(Object.fromEntries(cfg.selection[category].map(t=>[t,1+(weaknesses(data.answers).find(w=>w.key===`${category}/${t}`)?.weakness||0)/15]))):pick(cfg.selection[category]);
  }
  let level=session.levels[category]??cfg.level;
  if(cfg.mode==='adaptive'&&!cfg.explicit&&!cfg.shortcut) {
    const choices=defaultSelection(level)[category];sub=pick(choices);
  }
  if(!p){for(let i=0;i<12;i++){p=generate(category,sub,level,{negative:data.settings.negative,...cfg});if(!session.seen.includes(p.prompt))break;}}
  session.seen.push(p.prompt);session.seen=session.seen.slice(-25);
  session.question=p;session.questionElapsed=0;session.feedback=null;session.shownMethod=false;session.notice=null;lastTick=Date.now();
}
function saveActive(){if(session){data.active=structuredClone(session);data.active.paused=true;persist();}}
function resume(){
  if(!data.active)return;
  clearTimeout(answerTimeout);clearTimeout(nextTimeout);session=structuredClone(data.active);session.paused=false;page='training';closeModal();lastTick=Date.now();render();
  if(session.feedback?.correct&&!session.shownMethod){focusAnswer();scheduleNext();}
}
function pause(){clearTimeout(answerTimeout);if(!session)return;tick();if(!session)return;session.paused=true;clearTimeout(nextTimeout);saveActive();render();}
function unpause(){session.paused=false;lastTick=Date.now();render();if(session.feedback?.correct&&!session.shownMethod){focusAnswer();scheduleNext();}}
function finishSession(){
  if(!session)return;
  clearTimeout(answerTimeout);clearTimeout(nextTimeout);closeModal();
  const s=sessionStats(session),cats=session.categoryStats?Object.entries(session.categoryStats).map(([key,s])=>({key,...s})):breakdown(session.records),previous=aggregate(data.answers.filter(a=>a.sessionId!==session.id).slice(-100));
  summary={id:session.id,mode:session.config.mode,date:Date.now(),elapsed:session.elapsed,records:session.records,stats:s,categories:cats,score:trainingScore(data.answers),previousAverage:previous.total?previous.average:null};
  data.trainingSeconds+=summary.elapsed;data.sessionDays[today()]=(data.sessionDays[today()]||0)+1;
  data.sessions.push({id:summary.id,date:summary.date,mode:summary.mode,elapsed:summary.elapsed,...s,score:summary.score});
  if(data.sessions.length>500)data.sessions.shift();
  data.active=null;session=null;page='summary';persist();render();window.scrollTo(0,0);
}
function trainingHTML(){
  if(!session)return '';
  const s=sessionStats(session),cfg=session.config,p=session.question,f=session.feedback;
  if(session.paused)return `<section class="pause-view"><div class="score-orb">${icon('pause')}</div><h1>Take a breath.</h1><p>Your session and timer are paused.<br>${s.total} questions answered. Pick up where you left off.</p><div class="row wrap" style="justify-content:center">${btn(`${icon('play')} Resume training`,'unpause','primary')}${btn('Finish session','finish')}${btn('Save & go home','save-home')}</div></section>`;
  const timed=['speed','daily'].includes(cfg.mode),level=session.levels[p.category];
  return `<section class="training"><div class="training-top"><div class="training-title"><div class="eyebrow">${esc(sessionNames[cfg.mode])}${cfg.target?` · ${(session.completed??session.records.filter(r=>r.correct||r.skipped).length)+1} / ${cfg.target}`:''}</div><h2>${CATEGORIES[p.category].name}</h2></div><div class="training-tools"><span class="tag purple">${LEVELS[level]}</span>${timed?`<div class="timer-ring" id="timer-ring" style="--progress:${Math.max(0,(1-session.elapsed/cfg.duration)*100)}%"><span>${icon('clock')}</span></div>`:''}<button class="icon-btn" data-action="pause" aria-label="Pause session">${icon('pause')}</button><button class="icon-btn" data-action="quit" aria-label="Finish session">${icon('close')}</button></div></div><div class="session-stats"><div class="session-stat"><small>${timed?'TIME LEFT':'ELAPSED'}</small><strong id="session-time">${time(timed?cfg.duration-session.elapsed:session.elapsed)}</strong></div><div class="session-stat"><small>ATTEMPTS</small><strong id="session-count">${s.total}</strong></div><div class="session-stat"><small>ACCURACY</small><strong>${s.total?pct(s.accuracy):'—'}</strong></div><div class="session-stat"><small>STREAK</small><strong class="${s.streak>=5?'accent':''}">${s.streak} ${icon('arrow')}</strong></div></div><div class="question-card ${f?f.correct?'correct':'incorrect':''}"><div class="question-meta"><span>${esc(CATEGORIES[p.category].types[p.subcategory])}</span><span class="question-timer">${icon('clock')} <span id="question-time">${session.questionElapsed.toFixed(1)}s</span></span></div><h1 class="question-prompt ${p.prompt.length>26?'wordy':''}" id="problem">${esc(p.prompt)}</h1><form class="answer-form" id="answer-form" autocomplete="off"><label class="sr-only" for="answer">Your answer to ${esc(p.prompt)}</label><div class="answer-wrap"><input class="answer-input" id="answer" type="text" inputmode="decimal" autocapitalize="off" spellcheck="false" aria-describedby="answer-help feedback" placeholder="Your answer" aria-readonly="${!!f&&(f.correct||f.skipped)}" value="${esc(f?.raw||'')}"><span class="answer-unit">${p.unit==='%'?'%':p.unit==='x'?'x':p.unit==='€m'?'m':''}</span>${p.format==='fraction'?'<button type="button" class="answer-special" data-action="insert-slash" aria-label="Insert fraction slash">/</button>':p.answer<0?'<button type="button" class="answer-special" data-action="insert-minus" aria-label="Toggle negative sign">−</button>':''}</div><div id="answer-submit">${f&&!f.correct&&!f.skipped?btn('Retry — same question','retry','primary wide'):f?btn(f.correct&&!session.shownMethod?'Next question →':'Continue →','next','primary wide'):'<button class="btn primary wide" type="submit">Check answer <span class="muted" style="color:inherit;opacity:.65">↵</span></button>'}</div><p class="answer-help" id="answer-help">${esc(answerHint(p,data.settings.precision))}</p></form><div class="feedback ${f?f.correct?'good':'bad':''}" id="feedback" role="status" aria-live="polite">${f?`${icon(f.correct?'check':'close')} <strong>${f.skipped?'Skipped':f.correct?'Correct':'Incorrect'}</strong> ${f.correct?`· ${secs(f.seconds)}`:f.skipped?`· Answer: ${esc(answerLabel(p,data.settings.precision))}`:'· Try again'}`:''}</div><div class="question-actions">${f?`<button class="link-btn ${!f.correct||f.seconds>threshold(level)?'accent':''}" data-action="method">${icon('train')} ${session.shownMethod?'Hide method':!f.correct||f.seconds>threshold(level)?'Shortcut worth learning':'Show fastest method'}</button>`:'<span class="link-btn dim">Answers check automatically after you stop typing.</span>'}${!f?'<button class="link-btn" data-action="skip">Skip →</button>':''}</div><div id="question-method">${session.shownMethod?methodHTML(getMethod(p)):''}</div></div><div id="session-notice">${session.notice?`<div class="notice" style="margin-top:15px">${esc(session.notice)}</div>`:''}</div><p class="session-note">${cfg.mode==='adaptive'?'Difficulty adjusts after every 10 answers in a category.':cfg.mode==='daily'?'Your workout mix adapts to skills that need more attention.':cfg.mode==='mistakes'?'Original misses + similar questions. Recurring patterns come first.':'Stay in the flow. Accuracy first, speed follows.'} ${f&&f.correct&&!session.shownMethod?'Click the method to hold the next question.':''}</p></section>`;
}
function threshold(level){return data.settings.shortcutThreshold*[.7,1,1.6][level];}
function submitAnswer(raw,skipped=false){
  clearTimeout(answerTimeout);
  if(!session||session.paused||session.feedback)return;
  tick();if(!session)return;
  const p=session.question,result=skipped?{valid:true,correct:false}:validateAnswer(p,raw,data.settings.precision);
  if(!result.valid){const el=document.querySelector('#feedback');el.className='feedback bad';el.textContent='Enter a valid number, decimal, or fraction in the format shown.';document.querySelector('#answer').setAttribute('aria-invalid','true');focusAnswer();return;}
  focusAnswer();
  const level=session.levels[p.category],seconds=session.questionElapsed;
  session.completed??=session.records.filter(r=>r.correct||r.skipped).length;
  const r=recordAnswer(data,p,raw,result.correct,seconds,session.id,level,skipped);appendSessionRecord(session,r);if(result.correct||skipped)session.completed++;
  session.feedback={correct:result.correct,seconds,raw,skipped};
  if(session.config.mode==='adaptive') {
    const count=(session.adaptiveCounts[p.category]||0)+1;session.adaptiveCounts[p.category]=count;
    if(count%10===0){const newLevel=adaptiveLevel(session.records,level,p.category);if(newLevel!==level){session.levels[p.category]=newLevel;session.notice=`${CATEGORIES[p.category].name} moved to ${LEVELS[newLevel]}. ${newLevel>level?'You’re ready for a little more challenge.':'Let’s rebuild speed and confidence.'}`;}}
  }
  const streak=sessionStats(session).streak;
  if(result.correct&&streak>0&&streak%10===0)notify(`${streak} correct in a row. Keep the momentum.`);
  saveActive();render();if(result.correct)scheduleNext();
}
function scheduleNext(){clearTimeout(nextTimeout);nextTimeout=setTimeout(()=>{if(session&&!session.paused&&!session.shownMethod){tick();if(session){nextQuestion();if(session){saveActive();render();}}}},data.settings.delay);}
function tick(){
  const now=Date.now(),delta=(now-lastTick)/1000;lastTick=now;
  if(!session||session.paused||page!=='training')return;
  session.elapsed+=delta;
  if(!session.feedback)session.questionElapsed+=delta;
  const timed=['speed','daily'].includes(session.config.mode);
  if(timed&&session.elapsed>=session.config.duration){session.elapsed=session.config.duration;finishSession();return;}
  const st=document.querySelector('#session-time'),qt=document.querySelector('#question-time'),ring=document.querySelector('#timer-ring');
  if(st)st.textContent=time(timed?session.config.duration-session.elapsed:session.elapsed);
  if(qt)qt.textContent=`${session.questionElapsed.toFixed(1)}s`;
  if(ring)ring.style.setProperty('--progress',`${(1-session.elapsed/session.config.duration)*100}%`);
  if(now-lastSaved>5000){lastSaved=now;saveActive();}
}
function summaryHTML(){
  if(!summary)return homeHTML();
  const {stats:s,categories:cats}=summary,ranked=[...cats].sort((a,b)=>b.accuracy-a.accuracy||a.average-b.average),strong=ranked[0],weak=ranked.at(-1);
  const improvement=summary.previousAverage&&s.total?(summary.previousAverage-s.average)/summary.previousAverage*100:null;
  return `<section class="training"><div class="summary-top"><div class="score-orb"><strong>${summary.score}</strong><small>TRAINING SCORE</small></div><div class="eyebrow">${esc(sessionNames[summary.mode])} · ${time(summary.elapsed)}</div><h1 style="margin-top:10px">Another step forward.</h1><p class="muted">${s.total?s.accuracy>=90?'Accuracy looks sharp. Keep building your pace.':'Every attempt is useful. Turn today’s misses into tomorrow’s strengths.':'Your session ended before any answers were recorded.'}</p></div><div class="summary-stats">${[['Questions',s.total],['Correct',s.correct],['Incorrect',s.incorrect],['Accuracy',s.total?pct(s.accuracy):'—'],['Average time',s.total?secs(s.average):'—'],['Fastest correct',s.fastest?secs(s.fastest):'—']].map(([label,v])=>`<div class="summary-stat"><strong class="number">${v}</strong><small>${label}</small></div>`).join('')}</div><div class="panel"><div class="data-row"><span>Best streak</span><strong>${s.best} correct</strong></div><div class="data-row"><span>Strongest category</span><strong>${strong?`${labelFor(strong.key)} · ${pct(strong.accuracy)}`:'—'}</strong></div><div class="data-row"><span>Focus next</span><strong>${weak?`${labelFor(weak.key)} · ${pct(weak.accuracy)}`:'Build your baseline'}</strong></div><div class="data-row"><span>Speed vs previous 100 answers</span><strong class="${improvement>0?'good':''}">${improvement!==null?`${Math.abs(improvement).toFixed(0)}% ${improvement>=0?'faster':'slower'}`:'Available after more practice'}</strong></div><div class="divider"></div><h3>Category breakdown</h3>${cats.length?cats.map(c=>`<div class="data-row"><span>${labelFor(c.key)} · ${c.total} questions</span><strong>${pct(c.accuracy)} · ${secs(c.average)}</strong></div>`).join(''):'<p class="muted" style="margin-top:10px">No answered questions in this session.</p>'}</div><div class="row wrap" style="margin-top:20px">${btn('Train weak areas','summary-weak','primary')}${btn('Back to overview','nav','','data-page="home"')}${btn('Train again','quick-start')}</div><p class="session-note">Training score is a motivational benchmark, not an interview assessment.</p></section>`;
}
function playbookHTML(){
  const tabs=['All',...new Set(PLAYBOOK.map(p=>p.section))];
  return `${heading('Mental Math Playbook','Fewer steps. Better patterns. A faster way to the answer.')}<div class="tabs" aria-label="Technique filters">${tabs.map(t=>`<button class="chip ${playbookTab===t?'active':''}" data-action="playbook-tab" data-tab="${t}" aria-pressed="${playbookTab===t}">${t}</button>`).join('')}</div><div class="playbook-grid">${PLAYBOOK.map((p,i)=>({...p,index:i})).filter(p=>playbookTab==='All'||p.section===playbookTab).map(p=>`<article class="panel technique-card"><div class="eyebrow">${p.section}</div><h3>${esc(p.title)}</h3><p class="rule">${esc(p.example.rule)}</p><div class="example">${p.example.steps.map(s=>esc(s)).join('<br>')}</div>${btn(`Try it ${icon('arrow')}`,'try-technique','','data-index="'+p.index+'"')}</article>`).join('')}</div>`;
}
function sheetItems(){
  if(sheetTab==='squares')return SQUARES.map(n=>({question:`${n}²`,answer:fmt(n*n)}));
  if(sheetTab==='cubes')return Array.from({length:15},(_,i)=>({question:`${i+1}³`,answer:fmt((i+1)**3)}));
  if(sheetTab==='roots')return SQUARES.map(n=>({question:`√${n}`,answer:fmt(Math.sqrt(n)),recurring:!Number.isInteger(Math.sqrt(n))}));
  if(sheetTab==='roots-exact')return SQUARES.map(n=>({question:`√${fmt(n*n)}`,answer:String(n)}));
  return FRACTIONS.map(([a,b])=>({question:`${a}/${b}`,answer:fmt(a/b),sub:`${fmt(a/b*100)}%`,recurring:[3,6].includes(b)}));
}
function sheetsHTML(){
  const items=sheetItems(),current=items[flashIndex%items.length];
  return `${heading('The numbers worth knowing.','Build your recall. Turn useful facts into second nature.')}<div class="tabs" aria-label="Reference tables">${[['squares','Squares 1–100'],['cubes','Cubes'],['roots','Roots 1–100'],['roots-exact','Perfect-square roots'],['fractions','Fractions & percentages']].map(([key,label])=>`<button class="chip ${sheetTab===key?'active':''}" data-action="sheet-tab" data-tab="${key}" aria-pressed="${sheetTab===key}">${label}</button>`).join('')}</div><div class="sheets-toolbar"><span class="muted" style="font-size:12px">${items.length} essential facts${sheetTab==='fractions'?' · recurring decimals are rounded':''}</span><div class="row wrap">${btn(hideSheet?'Show answers':'Hide answers','sheet-hide')}${btn(flashMode?'Show grid':'Flashcards','sheet-flash')}${btn('Random quiz','sheet-quiz','primary')}${sheetTab==='roots-exact'?btn('Reverse quiz','sheet-reverse'):''}</div></div>${flashMode?`<div class="flashcard"><p>Card ${flashIndex%items.length+1} of ${items.length} · tap to reveal</p><button class="card" data-action="flash-reveal" aria-label="${flashRevealed?'Hide':'Reveal'} flashcard answer">${flashRevealed?`${current.answer}${current.sub?`<span style="font-size:20px;display:block;color:var(--accent)">${current.sub}</span>`:''}`:current.question}</button><p>${flashRevealed?'Recall it once more, then move on.':'Picture the answer before you tap.'}</p><div class="row" style="justify-content:center">${btn('← Previous','flash-prev')}${btn('Shuffle','flash-shuffle')}${btn('Next →','flash-next')}</div></div>`:`<div class="sheet-grid">${items.map((item,i)=>`<button class="sheet-card" data-action="sheet-reveal" data-index="${i}" aria-label="${esc(item.question)}, ${hideSheet?'reveal answer':esc(item.answer)}"><span class="sheet-question">${item.question}</span><span class="sheet-answer">${hideSheet?'?':item.recurring?'≈ '+item.answer:item.answer}</span>${item.sub?`<span class="sheet-sub">${hideSheet?'tap to reveal':`${item.recurring?'≈ ':''}${item.sub}`}</span>`:''}</button>`).join('')}</div>`}`;
}
function statsHTML(){
  const s=lifetimeStats(data),recent=aggregate(data.answers.slice(-100)),weak=weaknesses(data.answers),cats=lifetimeBreakdown(data),trend=scoreTrend(data.answers),todaySessions=data.sessionDays[today()]||0;
  return `${heading('Proof of practice.','Your progress, measured in better answers and faster thinking.',btn(`${icon('download')} Export`,'export'))}<div class="stats-strip">${metric('Total questions',fmt(s.total),`${s.correct} correct · ${s.incorrect} incorrect`)}${metric('Accuracy',s.total?`${pct(s.accuracy)}`:'—','all recorded answers')}${metric('Average time',s.total?`${s.average.toFixed(1)}<small>s</small>`:'—','all recorded answers')}${metric('Training score',s.total?`${trainingScore(data.answers)}<small>/100</small>`:'—','motivational benchmark')}</div>${!s.total?`<div class="panel empty"><h3>Your baseline starts here.</h3><p>Complete a few questions to see your accuracy, speed and strongest patterns. Weaknesses need at least five answers per skill.</p>${btn('Start training','quick-start','primary')}</div>`:''}<div class="stats-grid"><section class="panel"><div class="section-head"><h2>Accuracy by category</h2><span>All time</span></div>${cats.length?cats.map(c=>`<div class="bar-row"><span>${labelFor(c.key)}</span><div class="progress-track"><div class="progress-fill" style="width:${c.accuracy}%"></div></div><strong>${pct(c.accuracy)}</strong></div><div class="muted" style="font-size:10px;margin:4px 0 0">${c.total} answers · ${secs(c.average)} average</div>`).join(''):'<p class="muted">Your first session will bring this to life.</p>'}</section><section class="panel"><div class="section-head"><h2>Training score trend</h2><span>7 days</span></div><div class="trend-chart" aria-label="Training score over seven days">${trend.map(d=>`<div class="trend-column"><span>${s.total?d.score:'—'}</span><div class="trend-bar" style="height:${d.score}%"></div><span>${d.day}</span></div>`).join('')}</div><p class="field-help">Recent accuracy (55%), speed (25%), active days (10%) and practice breadth (10%). Personal motivation, not a scientific rating.</p></section><section class="panel"><div class="section-head"><h2>Weakest Areas</h2><span>Accuracy + speed</span></div>${weak.length?weak.slice(0,4).map(w=>`<div class="weakness-row"><div class="row between"><h3>${esc(labelFor(w.key))}</h3><button class="link-btn accent" data-action="weak-skill" data-key="${w.key}">Train →</button></div><p>${pct(w.accuracy)} accuracy · ${secs(w.average)} average · ${w.total} recent answers</p></div>`).join(''):'<p class="muted" style="font-size:12px">We need at least five recent answers per skill before recommending a focus.</p>'}</section><section class="panel"><h2 style="font-size:17px;margin-bottom:10px">Your practice at a glance</h2>${[['Questions today',questionsToday()],['Completed sessions today',todaySessions],['Total training time',time(data.trainingSeconds+(data.active?.elapsed||0))],['Fastest correct answer',s.fastest?secs(s.fastest):'—'],['Current / best streak',`${s.streak} / ${s.best}`],['Recent accuracy',recent.total?pct(recent.accuracy):'—']].map(([l,v])=>`<div class="data-row"><span>${l}</span><strong>${v}</strong></div>`).join('')}</section></div>${Object.keys(data.lifetime.subcategories).length?`<section class="panel" style="margin-top:16px"><h2 style="font-size:17px">Skill breakdown</h2><p class="field-help">Lifetime accuracy and speed for every practiced exercise type.</p>${Object.entries(CATEGORIES).filter(([key])=>Object.keys(data.lifetime.subcategories).some(k=>k.startsWith(key+'/'))).map(([key,c])=>`<details class="type-group"><summary>${c.name}</summary>${Object.entries(data.lifetime.subcategories).filter(([k])=>k.startsWith(key+'/')).map(([k,s])=>`<div class="data-row"><span>${esc(CATEGORIES[key].types[k.split('/')[1]])}<br><small>${s.total} answers</small></span><strong>${pct(s.accuracy)} · ${secs(s.average)}</strong></div>`).join('')}</details>`).join('')}</section>`:''}${data.sessions.length?`<section class="panel" style="margin-top:16px"><h2 style="font-size:17px">Recent sessions</h2>${data.sessions.slice(-5).reverse().map(s=>`<div class="data-row"><span>${sessionNames[s.mode]}<br><small>${new Date(s.date).toLocaleString()}</small></span><strong>${s.total} questions · ${pct(s.accuracy)}<br><small class="muted">${time(s.elapsed)} · score ${s.score}</small></strong></div>`).join('')}</section>`:''}`;
}
function mistakesHTML(){
  const unresolved=data.mistakes.filter(m=>!m.resolved),list=(mistakeFilter==='all'?data.mistakes:unresolved).slice().sort((a,b)=>b.count-a.count||b.date-a.date);
  return `${heading('Turn misses into muscle memory.','Revisit the question. Learn the pattern. Make it stick.',data.mistakes.length?btn('Practice mistakes','mistakes-start','primary'):'')}<div class="tabs">${[['unresolved',`To revisit (${unresolved.length})`],['all',`All mistakes (${data.mistakes.length})`]].map(([key,label])=>`<button class="chip ${mistakeFilter===key?'active':''}" data-action="mistake-filter" data-filter="${key}" aria-pressed="${mistakeFilter===key}">${label}</button>`).join('')}</div><div class="stack">${list.length?list.slice(0,50).map(m=>`<article class="panel mistake-card"><div><div class="eyebrow">${CATEGORIES[m.problem.category].name} · ${m.resolved?'REVISITED ✓':`${m.count} ${m.count===1?'MISS':'MISSES'}`}</div><h3>${esc(m.problem.prompt)}</h3><p>Your answer: ${esc(m.userAnswer||'Skipped')} · Correct: <span class="good">${esc(answerLabel(m.problem,data.settings.precision))}</span></p><p>${new Date(m.date).toLocaleDateString()} · ${secs(m.seconds)} · ${esc(CATEGORIES[m.problem.category].types[m.problem.subcategory])}</p></div>${btn('Review','review-mistake','','data-id="'+m.problem.id+'"')}</article>`).join(''):`<div class="panel empty"><h3>${data.mistakes.length?'All caught up.':'A clean slate.'}</h3><p>${data.mistakes.length?'You’ve answered your saved misses correctly. Keep practicing to strengthen those patterns.':'Incorrect and skipped answers will appear here. A miss is simply your next opportunity to improve.'}</p>${btn('Start training','quick-start','primary')}</div>`}</div>${list.length>50?'<p class="field-help">Showing the 50 highest-priority mistakes. Practice includes all saved mistakes.</p>':''}`;
}
function settingsHTML(){const s=data.settings;
 const select=(id,values)=>`<select class="select" id="setting-${id}" data-setting="${id}">${values.map(([v,label])=>`<option value="${v}" ${String(s[id])===String(v)?'selected':''}>${label}</option>`).join('')}</select>`;
 const row=(key,title,help,control)=>`<div class="settings-row"><div><label for="setting-${key}">${title}</label><p>${help}</p></div>${control}</div>`;
 return `${heading('Make it feel like yours.','A focused workspace, tuned to how you train.')}<section class="panel settings-panel">${row('theme','Appearance','Dark, light, or follow your device.',select('theme',[['dark','Dark'],['light','Light'],['system','System']]))}${row('animations','Animations','Subtle feedback. System reduced-motion is respected.',select('animations',[['subtle','Subtle'],['off','Off']]))}${row('delay','Auto-next delay','Correct answers advance automatically.',select('delay',[[600,'0.6 seconds'],[1000,'1 second'],[1800,'1.8 seconds'],[3000,'3 seconds']]))}${row('precision','Decimal precision','Accepted rounding for decimal answers.',select('precision',[[0,'0 decimals'],[1,'1 decimal'],[2,'2 decimals'],[3,'3 decimals'],[4,'4 decimals']]))}${row('level','Preferred difficulty','Detailed exercise types are available in practice setup.',select('level',LEVELS.map((l,i)=>[i,l])))}${row('mode','Default training mode','Used by the Start training button.',select('mode',Object.entries(sessionNames).filter(([k])=>!['mini','daily'].includes(k))))}${row('shortcutThreshold','Shortcut recommendation','Base time in seconds. Adjusted by difficulty.',`<input type="number" id="setting-shortcutThreshold" data-setting="shortcutThreshold" value="${s.shortcutThreshold}" min="2" max="60">`)}${row('negative','Negative subtraction','Allow subtraction problems with negative results.',`<input id="setting-negative" data-setting="negative" type="checkbox" ${s.negative?'checked':''}>`)}<div class="settings-row"><div><h3>Priority areas</h3><p>Your quick-start mix.</p></div>${btn('Change','priorities')}</div><div class="settings-row"><div><h3>Your local data</h3><p>Saved only in this browser. Export for a backup.</p></div>${btn('Export JSON','export')}</div><div class="settings-row"><div><h3>Reset statistics</h3><p>Clear answers, mistakes, sessions and saved practice.</p></div>${btn('Reset','confirm-reset-stats','danger')}</div><div class="settings-row"><div><h3>Reset all data</h3><p>Also clear preferences and onboarding.</p></div>${btn('Reset all','confirm-reset-all','danger')}</div></section><section class="install-block settings-panel"><h3>Take your trainer with you.</h3><p><strong>On iPhone:</strong> open this app in Safari, tap Share, then “Add to Home Screen”. On newer iOS versions, Share may be in the More menu. Launch once while connected to prepare offline practice.</p><p>A published HTTPS address is required for installation and offline caching. Browser storage can be removed by your device; export progress periodically.</p><p id="offline-status">${offlineReady?'✓ The app shell is cached for offline use.':'Offline cache is being prepared. Open over HTTPS or localhost.'}</p>${installPrompt?btn('Install app','install','primary'):''}</section>`;
}
function onboarding(){
  const titles=['What are you training for?','Where do you want your edge?','Find your starting point.'];
  const subtitles=['A little context helps tailor your practice.','Pick one or more priorities. Change these anytime.','You can adjust every exercise type later.'];
  const objectives=['Interview prep','General mental math','Speed training'];
  modal.innerHTML=`<div class="onboard-progress" role="img" aria-label="Step ${onboardStep+1} of 3">${[0,1,2].map(i=>`<span class="${i<=onboardStep?'active':''}"></span>`).join('')}</div><div class="modal-header"><div><div class="eyebrow accent" style="margin-bottom:12px">WELCOME TO YOUR INTERVIEW EDGE</div><h2 id="modal-title">${titles[onboardStep]}</h2><p>${subtitles[onboardStep]}</p></div></div><div style="margin:24px 0">${onboardStep===0?objectives.map((v,i)=>`<button class="onboard-option ${onboardValues.objective===v?'selected':''}" data-action="onboard-objective" data-value="${v}">${icon(['target','book','train'][i])}${v}<span>${onboardValues.objective===v?'✓':''}</span></button>`).join(''):onboardStep===1?['multiplication','division','percentages','mixed'].map(v=>`<button class="onboard-option ${onboardValues.priorities.includes(v)?'selected':''}" data-action="onboard-priority" data-value="${v}">${v==='mixed'?'±':CATEGORIES[v].icon} &nbsp; ${v==='mixed'?'Mixed — all categories':CATEGORIES[v].name}<span>${onboardValues.priorities.includes(v)?'✓':''}</span></button>`).join(''):['Beginner','Intermediate','Strong'].map((v,i)=>`<button class="onboard-option ${onboardValues.level===i?'selected':''}" data-action="onboard-level" data-level="${i}"><div>${v}<p class="field-help">${['Build a confident foundation.','Comfortable with everyday calculations.','Ready for larger numbers and tighter estimates.'][i]}</p></div><span>${onboardValues.level===i?'✓':''}</span></button>`).join('')}</div><div class="modal-footer">${btn(onboardStep?'← Back':'Skip for now',onboardStep?'onboard-back':'onboard-skip')}${btn(onboardStep===2?'Let’s get started →':'Continue →','onboard-next','primary')}</div><p class="field-help" style="text-align:center;margin-top:18px">No sign-up. Your progress stays on your device.</p>`;
  openModal();
}
function finishOnboarding(skip=false){if(!skip){data.settings.objective=onboardValues.objective;data.settings.level=onboardValues.level;data.settings.priorities=onboardValues.priorities.includes('mixed')?Object.keys(CATEGORIES):onboardValues.priorities.length?onboardValues.priorities:['multiplication','division','percentages'];}data.onboarded=true;persist();closeModal();render();}
function navigate(destination){
  clearTimeout(answerTimeout);
  if(page==='training'&&session){tick();if(session){session.paused=true;saveActive();clearTimeout(nextTimeout);session=null;}}
  page=destination;render();window.scrollTo(0,0);document.querySelector('#main')?.focus({preventScroll:true});
}
function trainWeak(key){const [category,type]=key.split('/');setup(category,'custom',{[category]:[type]});}
function exportData(){
  saveActive();const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`ib-math-progress-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Your progress export is ready.');
}
function confirmReset(all){
  modal.innerHTML=`<div class="modal-header"><h2 id="modal-title">${all?'Reset everything?':'Reset your training history?'}</h2></div><p class="muted">${all?'This removes preferences, progress, mistakes, sessions and onboarding from this browser.':'This removes answers, mistakes, sessions and saved practice. Your preferences stay.'} This cannot be undone. Export your data first if you want a copy.</p><div class="modal-footer">${btn('Keep my data','close-modal')}${btn('Yes, reset','reset-data','danger',`data-all="${all}"`)}</div>`;openModal();
}
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&page==='training'&&session?.feedback&&!session.paused&&!modal.open){if(!session.feedback.correct&&!session.feedback.skipped){e.preventDefault();retryAnswer();return;}e.preventDefault();clearTimeout(nextTimeout);tick();if(session){nextQuestion();if(session){saveActive();render();}}}});
function retryAnswer(raw=''){
  if(!session?.feedback||session.feedback.correct||session.feedback.skipped)return;
  session.feedback=null;session.shownMethod=false;session.questionElapsed=0;lastTick=Date.now();render();
  const input=document.querySelector('#answer');input.value=raw;focusAnswer();saveActive();
}
function queueAnswer(){
  clearTimeout(answerTimeout);
  if(!session||session.paused||session.feedback||page!=='training')return;
  const input=document.querySelector('#answer'),raw=input.value,id=session.question.id;
  answerTimeout=setTimeout(()=>{
    if(session&&!session.paused&&!session.feedback&&page==='training'&&session.question.id===id&&document.querySelector('#answer')?.value===raw&&validateAnswer(session.question,raw,data.settings.precision).valid)submitAnswer(raw);
  },850);
}
document.addEventListener('input',e=>{
  if(e.target.id!=='answer'||!session)return;
  if(session.feedback){
    if(session.feedback.correct||session.feedback.skipped){e.target.value=session.feedback.raw||'';return;}
    const raw=e.target.value,caret=e.target.selectionStart;retryAnswer(raw);e.target.setSelectionRange(caret,caret);
  }
  if(!e.isComposing)queueAnswer();
});
document.addEventListener('compositionend',e=>{if(e.target.id==='answer')queueAnswer();});
document.addEventListener('submit',e=>{if(e.target.id==='answer-form'){e.preventDefault();submitAnswer(document.querySelector('#answer').value);}});
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-action]');if(!el)return;
  const a=el.dataset.action;e.preventDefault();
  if(a==='nav')navigate(el.dataset.page);
  else if(a==='theme'){data.settings.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';applyTheme();persist();if(page==='settings')render();}
  else if(a==='quick-start')quickStart();
  else if(a==='daily'){startSession({mode:'daily',level:data.settings.level,duration:600,selection:dailySelection(data.settings.level),explicit:false});}
  else if(a==='setup')setup(el.dataset.category,'custom');
  else if(a==='mode-setup')setup('all',el.dataset.mode);
  else if(a==='close-modal')closeModal();
  else if(a==='setup-level'){
    setupDraft.level=Number(el.dataset.level);const preset=defaultSelection(setupDraft.level);
    for(const c of Object.keys(setupDraft.selection))setupDraft.selection[c]=[...preset[c]];
    renderSetup();
  }
  else if(a==='setup-duration'){setupDraft.duration=Number(el.dataset.duration);renderSetup();}
  else if(a==='begin-setup'){
    if(!Object.values(setupDraft.selection).some(v=>v.length)){document.querySelector('#setup-error').textContent='Select at least one exercise type.';return;}
    if(setupDraft.mode==='mistakes'&&!data.mistakes.some(m=>setupDraft.selection[m.problem.category]?.includes(m.problem.subcategory))){document.querySelector('#setup-error').textContent='Select a type with a saved mistake, or choose another training mode.';return;}
    startSession({...setupDraft,duration:setupDraft.mode==='daily'?600:setupDraft.duration});
  }
  else if(a==='replace-session'){
    const config=structuredClone(setupDraft);session=structuredClone(data.active);finishSession();startSession(config);
  }
  else if(a==='resume')resume();
  else if(a==='pause')pause();
  else if(a==='unpause')unpause();
  else if(a==='save-home'){saveActive();session=null;page='home';render();}
  else if(a==='quit'){
    pause();if(!session)return;modal.innerHTML=`<div class="modal-header"><h2 id="modal-title">Finish this session?</h2></div><p class="muted">Your answers are already saved. View your summary, or keep the practice going.</p><div class="modal-footer">${btn('Keep training','cancel-quit')}${btn('Finish & see summary','finish','primary')}</div>`;openModal();
  }
  else if(a==='cancel-quit'){closeModal();unpause();}
  else if(a==='finish')finishSession();
  else if(a==='retry')retryAnswer();
  else if(a==='proper-practice')setup('division','endless',{division:['proper']});
  else if(a==='next'){if(session&&!session.paused){tick();if(session){nextQuestion();if(session){saveActive();render();}}}}
  else if(a==='skip')submitAnswer('',true);
  else if(a==='method'){
    if(session?.feedback){clearTimeout(nextTimeout);session.shownMethod=!session.shownMethod;saveActive();render();if(!session.shownMethod&&session.feedback.correct)scheduleNext();}
  }
  else if(a==='insert-slash'||a==='insert-minus'){
    const input=document.querySelector('#answer');if(!input||input.disabled)return;input.value=a==='insert-slash'?input.value.includes('/')?input.value:input.value+'/':input.value.startsWith('-')?input.value.slice(1):'-'+input.value;input.focus();input.dispatchEvent(new Event('input',{bubbles:true}));
  }
  else if(a==='focus'){const weak=weaknesses(data.answers)[0];if(weak)trainWeak(weak.key);else quickStart();}
  else if(a==='weak-skill')trainWeak(el.dataset.key);
  else if(a==='summary-weak'){const weak=weaknesses(data.answers)[0];if(weak)trainWeak(weak.key);else if(summary?.categories.length)setup([...summary.categories].sort((a,b)=>a.accuracy-b.accuracy||b.average-a.average)[0].key,'custom');else quickStart();}
  else if(a==='playbook-tab'){playbookTab=el.dataset.tab;render();}
  else if(a==='try-technique'){
    const t=PLAYBOOK[Number(el.dataset.index)];startSession({mode:'mini',level:data.settings.level,target:5,selection:{[t.category]:[t.subcategory]},shortcut:t.shortcut,family:t.family,explicit:true});
  }
  else if(a==='sheet-tab'){sheetTab=el.dataset.tab;flashIndex=0;flashRevealed=false;render();}
  else if(a==='sheet-hide'){hideSheet=!hideSheet;flashMode=false;render();}
  else if(a==='sheet-flash'){flashMode=!flashMode;flashRevealed=false;render();}
  else if(a==='flash-reveal'){flashRevealed=!flashRevealed;render();}
  else if(a==='flash-next'||a==='flash-prev'){flashIndex=(flashIndex+(a==='flash-next'?1:-1)+sheetItems().length)%sheetItems().length;flashRevealed=false;render();}
  else if(a==='flash-shuffle'){flashIndex=Math.floor(Math.random()*sheetItems().length);flashRevealed=false;render();}
  else if(a==='sheet-reveal'){
    const item=sheetItems()[Number(el.dataset.index)];if(hideSheet){const answer=el.querySelector('.sheet-answer'),hidden=answer.textContent==='?';answer.textContent=hidden?(item.recurring?'≈ ':'')+item.answer:'?';const sub=el.querySelector('.sheet-sub');if(sub)sub.textContent=hidden?(item.recurring?'≈ ':'')+item.sub:'tap to reveal';el.setAttribute('aria-label',hidden?`${item.question}, ${item.answer}`:`${item.question}, reveal answer`);}
  }
  else if(a==='sheet-quiz'||a==='sheet-reverse'){
    const category=sheetTab==='squares'||sheetTab==='cubes'?'powers':['roots','roots-exact'].includes(sheetTab)?'roots':'division';
    const sub=sheetTab==='squares'?'squares':sheetTab==='cubes'?'cubes':sheetTab==='roots'?'approx':sheetTab==='roots-exact'?a==='sheet-reverse'?'reverse':'exact':'fractions';
    startSession({mode:'mini',level:data.settings.level,target:5,selection:{[category]:[sub]},rootTable:sheetTab==='roots',explicit:true});
  }
  else if(a==='mistake-filter'){mistakeFilter=el.dataset.filter;render();}
  else if(a==='mistakes-start')setup('all','mistakes');
  else if(a==='review-mistake'){
    const m=data.mistakes.find(m=>m.problem.id===el.dataset.id);if(m){modal.innerHTML=`<div class="modal-header"><h2 id="modal-title">${esc(m.problem.prompt)}</h2><button class="icon-btn" data-action="close-modal" aria-label="Close review">${icon('close')}</button></div><p class="muted">Answer: ${esc(answerLabel(m.problem,data.settings.precision))}</p>${methodHTML(getMethod(m.problem))}<div class="modal-footer">${btn('Practice this pattern','weak-skill','primary',`data-key="${m.problem.category}/${m.problem.subcategory}"`)}</div>`;openModal();}
  }
  else if(a==='export')exportData();
  else if(a==='confirm-reset-stats'||a==='confirm-reset-all')confirmReset(a==='confirm-reset-all');
  else if(a==='reset-data'){
    clearTimeout(answerTimeout);clearTimeout(nextTimeout);session=null;const all=el.dataset.all==='true';
    if(all){data=reset();ensureLifetime(data);}else {data.answers=[];data.mistakes=[];data.sessions=[];data.active=null;data.lifetime=null;data.trainingSeconds=0;data.sessionDays={};ensureLifetime(data);persist();}
    closeModal();applyTheme();render();notify('Local data reset.');if(all){onboardStep=0;onboardValues={objective:data.settings.objective,priorities:[...data.settings.priorities],level:data.settings.level};onboarding();}
  }
  else if(a==='priorities'){
    modal.innerHTML=`<div class="modal-header"><h2 id="modal-title">Your priority areas</h2><button class="icon-btn" data-action="close-modal" aria-label="Close priorities">${icon('close')}</button></div><p class="field-help">Choose the mix for quick-start practice.</p><div class="chips" style="margin-top:20px">${Object.entries(CATEGORIES).map(([key,c])=>`<label class="chip"><input type="checkbox" data-priority="${key}" ${data.settings.priorities.includes(key)?'checked':''}>${c.name}</label>`).join('')}</div><div class="modal-footer">${btn('Save priorities','save-priorities','primary')}</div>`;openModal();
  }
  else if(a==='save-priorities'){
    const priorities=[...modal.querySelectorAll('[data-priority]:checked')].map(i=>i.dataset.priority);if(!priorities.length){notify('Choose at least one priority.');return;}data.settings.priorities=priorities;persist();closeModal();notify('Priority areas saved.');
  }
  else if(a==='onboard-objective'){onboardValues.objective=el.dataset.value;onboarding();}
  else if(a==='onboard-priority'){const v=el.dataset.value;onboardValues.priorities=onboardValues.priorities.includes(v)?onboardValues.priorities.filter(p=>p!==v):[...onboardValues.priorities,v];onboarding();}
  else if(a==='onboard-level'){onboardValues.level=Number(el.dataset.level);onboarding();}
  else if(a==='onboard-back'){onboardStep--;onboarding();}
  else if(a==='onboard-skip')finishOnboarding(true);
  else if(a==='onboard-next'){if(onboardStep===1&&!onboardValues.priorities.length){notify('Choose at least one priority area.');return;}if(onboardStep<2){onboardStep++;onboarding();}else finishOnboarding();}
  else if(a==='install'&&installPrompt){installPrompt.prompt();installPrompt.userChoice.then(()=>{installPrompt=null;if(page==='settings')render();});}
});
document.addEventListener('change',e=>{
  const el=e.target;
  if(el.id==='setup-mode'){
    setupDraft.mode=el.value;
    if(el.value==='daily')setupDraft.selection=dailySelection(setupDraft.level);
    if(el.value==='mistakes'){setupDraft.selection={};for(const m of data.mistakes){const c=m.problem.category,t=m.problem.subcategory;(setupDraft.selection[c]||=[]);if(!setupDraft.selection[c].includes(t))setupDraft.selection[c].push(t);}}
    setupDraft.explicit=el.value==='custom';renderSetup();
  }
  if(el.dataset.type){const c=el.dataset.category,t=el.dataset.type;const types=setupDraft.selection[c]||[];setupDraft.selection[c]=el.checked?[...new Set([...types,t])]:types.filter(v=>v!==t);setupDraft.explicit=true;document.querySelector(`#count-${c}`).textContent=`${setupDraft.selection[c].length} selected`;}
  if(el.dataset.setting){
    const k=el.dataset.setting;let value=el.type==='checkbox'?el.checked:el.value;
    if(['delay','precision','level','shortcutThreshold'].includes(k))value=Number(value);
    if(k==='shortcutThreshold'){value=Math.max(2,Math.min(60,value||8));el.value=value;}
    data.settings[k]=value;persist();applyTheme();notify('Preference saved.');
  }
});
modal.addEventListener('cancel',()=>{if(!data.onboarded){data.onboarded=true;persist();}if(session?.paused&&page==='training')setTimeout(()=>unpause(),0);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&session&&!session.paused&&page==='training')pause();});
window.addEventListener('pagehide',()=>{if(session){tick();saveActive();}});
matchMedia('(prefers-color-scheme: light)').addEventListener('change',()=>{if(data.settings.theme==='system')applyTheme();});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;if(page==='settings')render();});
window.addEventListener('online',()=>notify('Back online. Your training stays on this device.'));
window.addEventListener('offline',()=>notify(offlineReady?'You’re offline. Keep training.':'You’re offline. This open session still works.'));
function updateKeyboardLayout(){const height=window.visualViewport?.height||innerHeight;document.body.classList.toggle('keyboard-open',page==='training'&&innerHeight-height>120);}
window.visualViewport?.addEventListener('resize',updateKeyboardLayout);
applyTheme();render();if(!data.onboarded)onboarding();
setInterval(tick,200);
if('serviceWorker'in navigator){
  navigator.serviceWorker.register('./service-worker.js').then(async registration=>{
    await navigator.serviceWorker.ready;
    const cache=await caches.open('ib-math-v2');offlineReady=!!await cache.match(new URL('./index.html',location.href).href);
    document.querySelectorAll('[data-offline-label]').forEach(el=>el.textContent=offlineReady?'Offline ready':'Local & private');
    if(page==='settings'){const el=document.querySelector('#offline-status');if(el)el.textContent=offlineReady?'✓ The app shell is cached for offline use.':'Offline cache is still preparing.';}
    registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)notify('An update is ready. Close all trainer tabs and reopen to apply.');});});
  }).catch(()=>{offlineReady=false;});
}
