import {CATEGORIES} from './generators.js';
import {localDay} from './storage.js';
export function aggregate(answers) {
  const total=answers.length,correct=answers.filter(a=>a.correct).length,seconds=answers.reduce((s,a)=>s+a.seconds,0);
  let streak=0,best=0;for(const a of answers){streak=a.correct?streak+1:0;best=Math.max(best,streak);}
  const correctTimes=answers.filter(a=>a.correct).map(a=>a.seconds);
  return {total,correct,incorrect:total-correct,accuracy:total?correct/total*100:0,seconds,average:total?seconds/total:0,fastest:correctTimes.length?Math.min(...correctTimes):0,streak,best};
}
export function breakdown(answers,by='category') {
  const groups={};for(const a of answers){const key=by==='subcategory'?`${a.category}/${a.subcategory}`:a.category;(groups[key]||=[]).push(a);}
  return Object.entries(groups).map(([key,records])=>({key,...aggregate(records)}));
}
export function weaknesses(answers) {
  return breakdown(answers.slice(-500),'subcategory').filter(g=>g.total>=5).map(g=>({...g,weakness:(100-g.accuracy)*.7+Math.min(g.average/12,1)*30})).sort((a,b)=>b.weakness-a.weakness);
}
export function labelFor(key) {
  const [cat,type]=key.split('/');return type?`${CATEGORIES[cat]?.name || cat} · ${CATEGORIES[cat]?.types[type] || type}`:CATEGORIES[cat]?.name||cat;
}
export function trainingScore(answers) {
  const recent=answers.slice(-100),s=aggregate(recent);
  if(!s.total)return 0;
  const breadth=new Set(recent.map(a=>a.category)).size/9;
  const days=new Set(answers.filter(a=>a.date>Date.now()-7*86400000).map(a=>localDay(a.date))).size/7;
  return Math.round(s.accuracy*.55+Math.max(0,1-s.average/20)*25+days*10+breadth*10);
}
export function scoreTrend(answers) {
  const values=[];
  for(let d=6;d>=0;d--){const date=new Date();date.setDate(date.getDate()-d);date.setHours(23,59,59,999);values.push({day:date.toLocaleDateString('en',{weekday:'short'}),score:trainingScore(answers.filter(a=>a.date<=date.getTime()))});}
  return values;
}
export function recordAnswer(data,p,raw,correct,seconds,sessionId,level,skipped=false) {
  ensureLifetime(data);
  const record={id:p.id,category:p.category,subcategory:p.subcategory,correct,seconds:Math.max(0,seconds),date:Date.now(),sessionId,level,skipped};
  addLifetimeRecord(data,record);
  data.answers.push(record);
  if(data.answers.length>5000)data.answers.splice(0,data.answers.length-5000);
  if(!correct){
    const existing=data.mistakes.find(m=>m.problem.prompt===p.prompt&&m.problem.category===p.category);
    if(existing){existing.count++;existing.userAnswer=raw;existing.date=record.date;existing.seconds=seconds;existing.resolved=false;}
    else data.mistakes.push({problem:{...p},userAnswer:raw,correctAnswer:p.answer,date:record.date,seconds,count:1,resolved:false});
    if(data.mistakes.length>1000)data.mistakes.shift();
  }else {
    const existing=data.mistakes.find(m=>m.problem.prompt===p.prompt&&m.problem.category===p.category);
    if(existing)existing.resolved=true;
  }
  return record;
}
export function adaptiveLevel(records,current,category) {
  const recent=records.filter(r=>r.category===category).slice(-10);
  if(recent.length<10)return current;
  const s=aggregate(recent);
  if(s.accuracy>=90&&s.average<([4,7,12][current])&&s.streak>=3)return Math.min(2,current+1);
  if(s.accuracy<65||s.average>[14,22,35][current])return Math.max(0,current-1);
  return current;
}
export function dailyWeights(answers) {
  const weights={multiplication:40,division:25,percentages:20,addition:2.5,subtraction:2.5,powers:2.5,roots:2.5,estimation:5};
  for(const weak of weaknesses(answers).slice(0,3)){const cat=weak.key.split('/')[0];weights[cat]=(weights[cat]||5)+weak.weakness/5;}
  return weights;
}
// Keep lifetime totals separately from the bounded detail log, so long-term practice stays lightweight.
export function ensureLifetime(data) {
  if(data.lifetime)return;
  data.lifetime={overall:aggregate(data.answers),categories:Object.fromEntries(breakdown(data.answers).map(g=>[g.key,g])),subcategories:Object.fromEntries(breakdown(data.answers,'subcategory').map(g=>[g.key,g])),days:{}};
  for(const r of data.answers){const day=localDay(r.date);data.lifetime.days[day]=(data.lifetime.days[day]||0)+1;}
  data.trainingSeconds??=data.sessions?.reduce((n,s)=>n+s.elapsed,0)||0;
  data.sessionDays??={};
  for(const s of data.sessions||[]){const day=localDay(s.date);data.sessionDays[day]=(data.sessionDays[day]||0)+1;}
}
export function accumulate(stats,r) {
  const s=stats||aggregate([]);s.total++;s.correct+=r.correct?1:0;s.incorrect+=r.correct?0:1;s.seconds+=r.seconds;s.average=s.seconds/s.total;s.accuracy=s.correct/s.total*100;
  s.streak=r.correct?s.streak+1:0;s.best=Math.max(s.best,s.streak);if(r.correct)s.fastest=s.fastest?Math.min(s.fastest,r.seconds):r.seconds;
  return s;
}
export function addLifetimeRecord(data,r) {
  const l=data.lifetime;l.overall=accumulate(l.overall,r);
  l.categories[r.category]=accumulate(l.categories[r.category],r);
  const key=`${r.category}/${r.subcategory}`;l.subcategories[key]=accumulate(l.subcategories[key],r);
  const day=localDay(r.date);l.days[day]=(l.days[day]||0)+1;
}
export function lifetimeStats(data){return data.lifetime?.overall||aggregate(data.answers);}
export function lifetimeBreakdown(data){return data.lifetime?Object.entries(data.lifetime.categories).map(([key,s])=>({key,...s})):breakdown(data.answers);}

export function sessionStats(session){return session.stats||aggregate(session.records);}
export function appendSessionRecord(session,record){
  session.stats=accumulate(session.stats||aggregate(session.records),record);
  session.categoryStats??=Object.fromEntries(breakdown(session.records).map(s=>[s.key,s]));
  session.categoryStats[record.category]=accumulate(session.categoryStats[record.category],record);
  session.records.push(record);if(session.records.length>500)session.records.shift();
}
