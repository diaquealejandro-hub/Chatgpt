import test from 'node:test';
import assert from 'node:assert/strict';
import {CATEGORIES,generate,validateAnswer,parseAnswer,defaultSelection,answerLabel,SQUARES} from '../js/generators.js';
import {getMethod,multiplicationMethod,divisionMethod,percentageMethod,PLAYBOOK} from '../js/tricks.js';
import {aggregate,weaknesses,adaptiveLevel,dailyWeights,recordAnswer,trainingScore} from '../js/stats.js';
import {load,save,reset,KEY} from '../js/storage.js';
function independentlyExpected(p){
  const {a,b}=p;
  switch(p.kind){
    case 'multiply':case 'estimate-multiply':return a*b;
    case 'add':return a+b;
    case 'subtract':return a-b;
    case 'divide':case 'estimate-divide':return a/b;
    case 'percent':case 'estimate-percent':return a/100*b;
    case 'percent-adjust':return a*(1+p.direction*b/100);
    case 'change':return (b-a)/a*100;
    case 'reverse-percent':return a/(b/100);
    case 'margin':return b/a*100;
    case 'power':return Math.pow(a,b);
    case 'reverse-power':return Math.pow(Math.pow(a,b),1/b);
    case 'root':return Math.sqrt(a);
    case 'fraction':return a/b*(p.format==='percent'?100:1);
    default:throw new Error(p.kind);
  }
}
for(const [category,c] of Object.entries(CATEGORIES))for(const subcategory of Object.keys(c.types)){
  test(`generator: ${category}/${subcategory} at all three levels`,()=>{
    for(let level=0;level<3;level++)for(let i=0;i<100;i++){
      const p=generate(category,subcategory,level),expected=independentlyExpected(p);
      assert.ok(Number.isFinite(p.answer));
      assert.ok(Math.abs(expected-p.answer)<1e-7,JSON.stringify(p));
      assert.equal(validateAnswer(p,String(p.answer)).correct,true);
      assert.equal(validateAnswer(p,String(p.answer+Math.max(2,Math.abs(p.answer)))).correct,false);
      const m=getMethod(p);assert.ok(m.title&&m.rule&&m.steps.length);
      assert.ok(!JSON.stringify(m).match(/NaN|Infinity|undefined/));
      if(category==='subtraction')assert.ok(p.answer>=0);
      if(p.format!=='estimate'&&!Number.isInteger(p.answer))assert.ok(validateAnswer(p,p.answer.toFixed(2),2).correct);
    }
  });
}
test('input formats: decimals, comma separators, fractions, percentages, negative signs and multiples',()=>{
  const decimal={answer:.5,format:'decimal',equivalentFraction:true};
  for(const raw of ['0.5','.5','50%','1/2','2/4','0,5'])assert.equal(validateAnswer(decimal,raw).correct,true,raw);
  const percent={answer:12.5,format:'percent',equivalentFraction:true};
  for(const raw of ['12.5','12.5%','1/8'])assert.equal(validateAnswer(percent,raw).correct,true,raw);
  const fraction={answer:1/3,format:'fraction'};
  for(const raw of ['1/3','2/6','.33','33.33%'])assert.equal(validateAnswer(fraction,raw).correct,true,raw);
  assert.equal(validateAnswer({answer:1200,format:'number'},'1,200').correct,true);
  assert.equal(validateAnswer({answer:8.5,format:'number'},'8.5x').correct,true);
  assert.equal(validateAnswer({answer:-25,format:'percent'},'−25%').correct,true);
  for(const raw of ['','hello','NaN','Infinity','1/0','1/2/3','50%%','--4','1e3'])assert.equal(parseAnswer(raw),null,raw);
  assert.equal(validateAnswer({answer:25,format:'number'},'25%').valid,false);
  assert.equal(validateAnswer({answer:10,format:'number'},'9.9',0).correct,false);
});
test('rounding boundaries and estimation tolerance are explicit',()=>{
  assert.equal(validateAnswer({answer:1/6,format:'decimal'},'.17',2).correct,true);
  assert.equal(validateAnswer({answer:1/6,format:'decimal'},'.18',2).correct,false);
  const p={answer:10000,format:'estimate',tolerance:.08};
  for(const raw of ['9200','10800'])assert.equal(validateAnswer(p,raw).correct,true);
  for(const raw of ['9199','10801'])assert.equal(validateAnswer(p,raw).correct,false);
});
test('granular multiplication digit combinations remain exact',()=>{
  for(const type of Object.keys(CATEGORIES.multiplication.types))for(let i=0;i<100;i++){
    const p=generate('multiplication',type,2),[d,e]=type.split('x').map(Number);
    assert.equal(String(p.a).length,d);assert.equal(String(p.b).length,e);
  }
});
test('shortcut mini-practice actually targets the selected factor or pattern',()=>{
  for(const technique of PLAYBOOK)for(let i=0;i<20;i++){
    const p=generate(technique.category,technique.subcategory,1,technique);
    assert.ok(Number.isFinite(p.answer));
    if(technique.shortcut&&!isNaN(Number(technique.shortcut)))assert.equal(p.b,Number(technique.shortcut));
    if(technique.shortcut==='square5'){assert.equal(p.a%10,5);assert.equal(p.kind==='power'?p.b: p.a, p.kind==='power'?2:p.b);}
    if(technique.shortcut==='difference'){assert.equal((p.a+p.b)/2%10,0);}
    if(technique.family==='thirds')assert.ok([3,6].includes(p.b));
    if(technique.family==='eighths')assert.ok([8,16].includes(p.b));
  }
});
test('specific fastest methods produce the expected result',()=>{
  const cases=[[48,5,240],[37,9,333],[64,15,960],[48,25,1200],[37,99,3663],[48,52,2496],[35,35,1225],[65,65,4225],[98,37,3626]];
  for(const [a,b,expected]of cases){assert.ok(multiplicationMethod(a,b).steps.at(-1).includes(expected.toLocaleString('en-US')));}
  assert.match(divisionMethod(1250,25).steps.at(-1),/50/);
  assert.match(divisionMethod(640,16).steps.at(-1),/640 → 320 → 160 → 80 → 40/);
  assert.match(percentageMethod(250,18).steps.at(-1),/50 − 5 = 45/);
  assert.match(percentageMethod(300,17).steps.at(-1),/60 − 9 = 51/);
});
const records=(n,correct=true,seconds=4)=>Array.from({length:n},(_,i)=>({id:String(i),category:'multiplication',subcategory:'2x2',correct,seconds,date:Date.now(),sessionId:'test'}));
test('statistics, meaningful sample sizes, score and streaks',()=>{
  const list=[...records(5),...records(1,false),...records(3,true,2)];
  const s=aggregate(list);assert.equal(s.total,9);assert.equal(s.correct,8);assert.equal(s.incorrect,1);assert.equal(s.best,5);assert.equal(s.streak,3);assert.equal(s.fastest,2);
  assert.equal(weaknesses(records(4,false)).length,0);assert.equal(weaknesses(records(5,false)).length,1);
  assert.ok(trainingScore(list)>=0&&trainingScore(list)<=100);assert.equal(trainingScore([]),0);
});
test('adaptive level moves gradually and only after enough evidence',()=>{
  assert.equal(adaptiveLevel(records(9,true,1),1,'multiplication'),1);
  assert.equal(adaptiveLevel(records(10,true,1),1,'multiplication'),2);
  assert.equal(adaptiveLevel(records(10,false,10),2,'multiplication'),1);
  assert.equal(adaptiveLevel(records(10,true,30),1,'multiplication'),0);
  assert.equal(adaptiveLevel(records(10,true,1),2,'multiplication'),2);
});
test('daily mix responds to demonstrated weaknesses',()=>{
  const baseline=dailyWeights([]);assert.equal(Object.values(baseline).reduce((s,n)=>s+n,0),100);
  const adjusted=dailyWeights(records(8,false,15));assert.ok(adjusted.multiplication>baseline.multiplication);
});
test('mistakes retain the original exercise, user answer and recurring pattern; correct retries resolve it',()=>{
  const data={answers:[],mistakes:[]},p=generate('multiplication','2x2');
  recordAnswer(data,p,'wrong',false,10,'s',1);recordAnswer(data,p,'wrong again',false,12,'s',1);
  assert.equal(data.mistakes.length,1);assert.equal(data.mistakes[0].count,2);assert.equal(data.mistakes[0].correctAnswer,p.answer);assert.equal(data.mistakes[0].userAnswer,'wrong again');
  recordAnswer(data,p,String(p.answer),true,3,'s',1);assert.equal(data.mistakes[0].resolved,true);
});
test('local persistence, settings defaults and corrupt-storage recovery',()=>{
  const cache=new Map();globalThis.localStorage={getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v)};
  const data=load();data.onboarded=true;data.settings.theme='light';save(data);
  assert.equal(load().onboarded,true);assert.equal(load().settings.theme,'light');
  cache.set(KEY,'{bad json');assert.equal(load().version,1);
  const fresh=reset();assert.equal(fresh.answers.length,0);assert.equal(fresh.onboarded,false);
});
test('reference facts and presets are internally complete',()=>{
  assert.equal(SQUARES.length,37);assert.ok(SQUARES.includes(30)&&SQUARES.includes(100));
  for(let l=0;l<3;l++)for(const[c,types]of Object.entries(defaultSelection(l)))for(const t of types)assert.ok(CATEGORIES[c].types[t]);
  assert.equal(answerLabel({answer:1/3,format:'fraction',fraction:'1/3'}),'1/3');
});
test('long practice preserves lifetime totals when the detail log rolls over',()=>{
  const data={answers:[],mistakes:[],sessions:[]},p={id:'long',category:'multiplication',subcategory:'2x2',prompt:'12 × 25',answer:300};
  for(let i=0;i<5010;i++)recordAnswer(data,{...p,id:String(i)},'300',true,2,'long',1);
  assert.equal(data.answers.length,5000);assert.equal(data.lifetime.overall.total,5010);assert.equal(data.lifetime.overall.correct,5010);assert.equal(data.lifetime.overall.best,5010);assert.equal(data.lifetime.categories.multiplication.total,5010);assert.equal(data.lifetime.subcategories['multiplication/2x2'].total,5010);
});
test('numeric parsing rejects malformed separators and accepts small comma decimals',()=>{
  for(const value of ['1,,,2','1,23,456','1,000,','1,000%5'])assert.equal(parseAnswer(value),null);
  assert.equal(parseAnswer('0,0625').value,.0625);assert.equal(parseAnswer('1,234.5').value,1234.5);
});
test('long sessions keep bounded detail without losing summary totals or category breakdown',async()=>{
  const {appendSessionRecord,sessionStats}=await import('../js/stats.js');
  const session={records:[]};
  for(let i=0;i<510;i++)appendSessionRecord(session,{category:'multiplication',subcategory:'2x2',correct:i!==500,seconds:2,date:Date.now()});
  assert.equal(session.records.length,500);assert.equal(sessionStats(session).total,510);assert.equal(sessionStats(session).correct,509);assert.equal(sessionStats(session).best,500);assert.equal(sessionStats(session).streak,9);assert.equal(session.categoryStats.multiplication.total,510);
});
