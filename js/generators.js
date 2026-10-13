export const LEVELS = ['Beginner', 'Interview', 'Advanced'];
export const CATEGORIES = {
  multiplication: { name: 'Multiplication', icon: '×', description: 'Build speed. Spot the shortcut.', types: {'1x1':'1 digit × 1 digit','1x2':'1 digit × 2 digits','1x3':'1 digit × 3 digits','2x2':'2 digits × 2 digits','2x3':'2 digits × 3 digits','3x3':'3 digits × 3 digits'} },
  division: { name: 'Division', icon: '÷', description: 'Fractions, decimals & exact division.', types: {reciprocals:'1/n · denominators 1–16',proper:'Fractions below 1',fractions:'Fraction → decimal / %',reverse:'Decimal / % → fraction',exact:'Exact division',decimal:'Decimal division',large:'Larger numbers'} },
  percentages: { name: 'Percentages', icon: '%', description: 'Growth, margins & reverse percentages.', types: {of:'Percentage of a number',increase:'Percentage increase',decrease:'Percentage decrease',change:'Percentage change',reverse:'Reverse percentages',margin:'EBITDA margins',equivalents:'Percentage ↔ fraction'} },
  addition: { name: 'Addition', icon: '+', description: 'Precision with carries & round numbers.', types: {'1x1':'1 + 1 digit','1x2':'1 + 2 digits','2x2':'2 + 2 digits','2x3':'2 + 3 digits','3x3':'3 + 3 digits','3x4':'3 + 4 digits','4x4':'4 + 4 digits'} },
  subtraction: { name: 'Subtraction', icon: '−', description: 'Borrowing & quick compensation.', types: {'1x1':'1 digit','2x2':'2 digits','3x3':'3 digits','4x4':'4 digits','2x3':'Mixed 2 / 3 digits','3x4':'Mixed 3 / 4 digits'} },
  powers: { name: 'Powers', icon: 'x²', description: 'Squares, cubes & useful powers.', types: {squares:'Squares 1–100',cubes:'Cubes 1–15',other:'Useful powers',reverse:'Reverse powers'} },
  roots: { name: 'Square roots', icon: '√', description: 'Exact recognition & estimation.', types: {exact:'Exact roots',reverse:'Reverse recognition',approx:'Approximate roots'} },
  estimation: { name: 'Estimation', icon: '≈', description: 'Round smart. Calculate faster.', types: {multiply:'Estimate products',divide:'Estimate quotients',percent:'Estimate percentages'} },
  interview: { name: 'Interview math', icon: '↗', description: 'Multiples, EBITDA, growth & valuation.', types: {margin:'Revenue & EBITDA',multiple:'EV / EBITDA multiples',reverse:'Reverse multiples',growth:'Revenue growth',valuation:'Valuation',estimate:'Estimate valuation'} }
};
export const SQUARES = Array.from({length:100},(_,i)=>i+1);
export const RECIPROCALS = Array.from({length:16},(_,i)=>[1,i+1]);
export const PROPER_FRACTIONS = Array.from({length:15},(_,i)=>Array.from({length:i+1},(_,j)=>[j+1,i+2])).flat();
export const FRACTIONS = [[1,2],[1,3],[2,3],[1,4],[3,4],[1,5],[2,5],[3,5],[4,5],[1,6],[5,6],[1,8],[3,8],[5,8],[7,8],[1,10],[1,16]];
const ri = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
export const pick = list => list[ri(0,list.length-1)];
export const fmt = n => new Intl.NumberFormat('en-US',{maximumFractionDigits:4}).format(n);
const digits = (d,level) => {
  const min=d===1?2:10**(d-1), max=10**d-1;

  let n=ri(min,max);
  if(level>0 && n%10===0) n+=ri(1,9);
  return Math.min(n,max);
};
export function defaultSelection(level=1) {
  return {
    multiplication: level===0?['1x1','1x2']:level===1?['1x2','2x2']:['2x2','2x3','3x3'],
    division: level===0?['fractions','exact']:['fractions','reverse','exact','decimal',...(level===2?['large']:[])],
    percentages: level===0?['of','increase','decrease']:Object.keys(CATEGORIES.percentages.types),
    addition: level===0?['1x2','2x2']:level===1?['2x2','2x3','3x3']:['3x3','3x4','4x4'],
    subtraction: level===0?['2x2']:level===1?['2x2','3x3']:['3x3','4x4','3x4'],
    powers:['squares','cubes','reverse',...(level===2?['other']:[])],
    roots:level===0?['exact']:['exact','reverse','approx'],
    estimation:['multiply','divide','percent'],
    interview:Object.keys(CATEGORIES.interview.types)
  };
}
function problem(category,subcategory,prompt,answer,extra={}) {
  return {id:globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,category,subcategory,prompt,answer,format:'number',unit:'',...extra};
}
const percent = level => pick(level===0?[5,10,20,25,50,75]:level===1?[5,10,12.5,15,17,18,20,22,25,35,40,60,72,75]:[6.25,12.5,17,19,22,28,33,37,65,72,85]);
export function generate(category,subcategory,level=1,options={}) {
  if(!CATEGORIES[category]) throw new Error(`Unknown category: ${category}`);
  subcategory ||= pick(Object.keys(CATEGORIES[category].types));
  if(!CATEGORIES[category].types[subcategory]) throw new Error(`Unknown type: ${category}/${subcategory}`);
  const p=(prompt,answer,extra={})=>problem(category,subcategory,prompt,answer,extra);
  if (['multiplication','addition','subtraction'].includes(category)) {
    const [d,e]=subcategory.split('x').map(Number);
    let a=digits(d,level),b=digits(e,level);
    if(category==='multiplication' && options.shortcut) {
      const factor=Number(options.shortcut);
      if(Number.isFinite(factor)) b=factor;
      else if(options.shortcut==='difference'){a=pick([10,50,100,200])-ri(1,4);b=a+2*(Math.round(a/10)*10-a);}
      else if(options.shortcut==='near'){b=pick([49,51,98,102,199,201]);}
      else if(options.shortcut==='square5'){a=pick([15,25,35,45,55,65,75,85,95]);b=a;}
    }
    if(category==='multiplication') return p(`${fmt(a)} × ${fmt(b)}`,a*b,{kind:'multiply',a,b});
    if(category==='addition') return p(`${fmt(a)} + ${fmt(b)}`,a+b,{kind:'add',a,b});
    if(!options.negative && a<b) [a,b]=[b,a];
    return p(`${fmt(a)} − ${fmt(b)}`,a-b,{kind:'subtract',a,b});
  }
  if(category==='division' || (category==='percentages' && subcategory==='equivalents')) {
    if(['reciprocals','proper','fractions','reverse','equivalents'].includes(subcategory)) {
      const fractionPool=options.family==='thirds'?FRACTIONS.filter(([,b])=>[3,6].includes(b)):options.family==='eighths'?FRACTIONS.filter(([,b])=>[8,16].includes(b)):subcategory==='reciprocals'?RECIPROCALS:subcategory==='proper'?PROPER_FRACTIONS:FRACTIONS;
      const [a,b]=drawFromDeck(fractionPool,options.decks,`${subcategory}/${options.family||'all'}`),value=a/b;
      const reverse=subcategory==='reverse'||(subcategory==='equivalents'&&Math.random()<.5);
      if(reverse) return p(`${fmt(value*100)}% = ? fraction`,value,{kind:'fraction',a,b,format:'fraction',fraction:`${a}/${b}`,unit:'fraction'});
      const asPercent=!['proper','reciprocals'].includes(subcategory)&&(subcategory==='equivalents'||Math.random()<.5);
      return p(`${a}/${b} = ? ${asPercent?'percent':'decimal'}`,asPercent?value*100:value,{kind:'fraction',a,b,format:asPercent?'percent':'decimal',unit:asPercent?'%':'',fractionValue:value,equivalentFraction:true});
    }
    let b=Number(options.shortcut)||pick(subcategory==='large'?[24,27,32,48,75,125]:level===0?[2,4,5,8,10]:[5,8,12,15,16,18,20,24,25,32,35,50]);
    let q=subcategory==='large'?ri(30,200):ri(level===0?2:12,level===2?150:65);
    if(subcategory==='decimal') q=ri(21,199)/pick([2,4]);
    const a=q*b;
    return p(`${fmt(a)} ÷ ${fmt(b)}`,q,{kind:'divide',a,b,format:subcategory==='decimal'?'decimal':'number'});
  }
  if(category==='percentages') {
    const rate=Number(options.shortcut)||percent(level),n=ri(4,level===2?150:80)*10,part=n*rate/100;
    const extra={kind:'percent',a:n,b:rate};
    if(subcategory==='of') return p(`${fmt(rate)}% of ${fmt(n)}`,part,extra);
    if(subcategory==='increase'||subcategory==='decrease') {
      const direction=subcategory==='increase'?1:-1;
      return p(`${fmt(n)} ${direction===1?'increases':'decreases'} by ${fmt(rate)}%`,n+direction*part,{...extra,direction,kind:'percent-adjust'});
    }
    if(subcategory==='change') {
      const direction=Math.random()<.5?1:-1;
      const end=n+direction*part;
      return p(`${fmt(n)} → ${fmt(end)}\nPercentage change?`,direction*rate,{kind:'change',a:n,b:end,format:'percent',unit:'%'});
    }
    if(subcategory==='reverse') return p(`${fmt(part)} is ${fmt(rate)}% of what?`,n,{kind:'reverse-percent',a:part,b:rate});
    if(subcategory==='margin') {
      if(Math.random()<.5) return p(`Revenue ${fmt(n)} · EBITDA ${fmt(part)}\nEBITDA margin?`,rate,{kind:'margin',a:n,b:part,unit:'%',format:'percent'});
      return p(`Revenue ${fmt(n)} · Margin ${fmt(rate)}%\nEBITDA?`,part,extra);
    }
  }
  if(category==='powers') {
    let a,b;
    if(subcategory==='other'){[a,b]=pick([[2,4],[2,5],[2,6],[2,7],[2,8],[3,4],[4,4],[5,4]]);}
    else {b=subcategory==='cubes'?3:subcategory==='reverse'?pick([2,3]):2;a=b===3?ri(1,15):pick(SQUARES);}
    if(options.shortcut==='square5'){a=pick([15,25,35,45,55,65,75,85,95]);b=2;}
    if(subcategory==='reverse')return p(`${fmt(a**b)} = ?${b===2?'²':'³'}`,a,{kind:'reverse-power',a,b});
    return p(`${a}${b===2?'²':b===3?'³':`^${b}`}`,a**b,{kind:'power',a,b});
  }
  if(category==='roots') {
    let a=pick(SQUARES);
    if(subcategory==='approx'){
      const n=options.rootTable?ri(1,100):pick([50,170,200,500,80,120,300,650,1000]);
      return p(`√${fmt(n)} ≈ ?`,Math.sqrt(n),{kind:'root',a:n,format:'estimate',tolerance:[.06,.03,.015][level],unit:'≈'});
    }
    return p(subcategory==='reverse'?`Which number squared equals ${fmt(a*a)}?`:`√${fmt(a*a)}`,a,{kind:'root',a:a*a});
  }
  if(category==='estimation') {
    const a=pick([198,397,510,980,1980,2400])+ri(-3,3),b=pick([19,21,49,51,99,101]);
    const tolerance=[.15,.08,.04][level];
    if(subcategory==='multiply')return p(`${fmt(a)} × ${b} ≈ ?`,a*b,{kind:'estimate-multiply',a,b,format:'estimate',tolerance});
    if(subcategory==='divide')return p(`${fmt(a)} ÷ ${b} ≈ ?`,a/b,{kind:'estimate-divide',a,b,format:'estimate',tolerance});
    const rate=pick([9,19,21,29,49]);
    return p(`${rate}% of ${fmt(a)} ≈ ?`,rate*a/100,{kind:'estimate-percent',a,b:rate,format:'estimate',tolerance});
  }
  if(category==='interview') {
    const ebitda=ri(4,60)*10,multiple=pick([5,6,7,8,8.5,9,10,12,12.5]),ev=ebitda*multiple;
    if(subcategory==='multiple')return p(`EV €${fmt(ev)}m · EBITDA €${fmt(ebitda)}m\nEV / EBITDA?`,multiple,{kind:'divide',a:ev,b:ebitda,unit:'x'});
    if(subcategory==='reverse')return p(`EV €${fmt(ev)}m · Multiple ${multiple}x\nEBITDA?`,ebitda,{kind:'divide',a:ev,b:multiple,unit:'€m'});
    if(subcategory==='valuation'||subcategory==='estimate')return p(`EBITDA €${fmt(ebitda)}m × ${multiple}x\nEnterprise value?`,ev,{kind:subcategory==='estimate'?'estimate-multiply':'multiply',a:ebitda,b:multiple,unit:'€m',format:subcategory==='estimate'?'estimate':'number',...(subcategory==='estimate'?{tolerance:[.15,.08,.04][level]}:{})});
    if(subcategory==='margin') {
      const revenue=ri(10,120)*10,rate=percent(level);
      return p(`Revenue €${fmt(revenue)}m · EBITDA margin ${rate}%\nEBITDA?`,revenue*rate/100,{kind:'percent',a:revenue,b:rate,unit:'€m'});
    }
    const revenue=ri(10,100)*10,rate=percent(level),end=revenue*(1+rate/100);
    return p(`Revenue ${fmt(revenue)} → ${fmt(end)}\nGrowth?`,rate,{kind:'change',a:revenue,b:end,unit:'%',format:'percent'});
  }
  throw new Error('Unsupported generator');
}
export function parseAnswer(raw) {
  const text=String(raw).trim().replace(/−/g,'-').replace(/\s/g,'');
  if(!text) return null;
  const hasPercent=text.endsWith('%');
  const valueText=hasPercent?text.slice(0,-1):text.replace(/x$/i,'');
  if(valueText.includes('/')) {
    const parts=valueText.split('/');
    if(parts.length!==2 || !parts.every(s=>/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)))return null;
    const [a,b]=parts.map(Number);
    return b!==0?{value:a/b,fraction:true,percent:hasPercent}:null;
  }
  // A single comma with 1–2 digits after it is a decimal separator; otherwise commas are grouping separators.
  let normalized=valueText;
  if(valueText.includes(',')) {
    if(/^[+-]?(?:\d+,\d{1,2}|0,\d+)$/.test(valueText))normalized=valueText.replace(',','.');
    else if(/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d*)?$/.test(valueText))normalized=valueText.replace(/,/g,'');
    else return null;
  }
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized))return null;
  const value=Number(normalized);
  return Number.isFinite(value)?{value,percent:hasPercent,fraction:false}:null;
}
export function validateAnswer(p,raw,precision=2) {
  const parsed=parseAnswer(raw);
  if(!parsed)return {valid:false,correct:false};
  let value=parsed.value;
  if(p.equivalentFraction) {
    if(p.format==='percent'&&parsed.fraction)value*=100;
    else if(p.format!=='percent'&&parsed.percent)value/=100;
  } else if(p.format==='fraction' && parsed.percent) value/=100;
  else if(parsed.percent && p.format!=='percent') return {valid:false,correct:false};
  // Fraction answers accept a fraction, its decimal, or a percent. Percent prompts use percentage points.
  const tolerance=p.format==='estimate'?Math.abs(p.answer)*p.tolerance:Number.isInteger(p.answer)&&!['decimal','fraction'].includes(p.format)?1e-8:Math.max(1e-8,.5*10**(-precision));
  return {valid:true,correct:Math.abs(value-p.answer)<=tolerance+1e-9,value,tolerance};
}
export function answerLabel(p,precision=2) {
  if(p.format==='fraction')return p.fraction;
  return `${new Intl.NumberFormat('en-US',{maximumFractionDigits:p.kind==='fraction'?Math.max(precision,4):precision}).format(p.answer)}${p.unit==='%'?'%':p.unit==='x'?'x':p.unit==='€m'?'m':''}`;
}
export function answerHint(p,precision=2) {
  if(p.format==='fraction')return 'Enter a fraction (e.g. 1/4), decimal, or percent.';
  if(p.format==='estimate')return `Estimate within ±${Math.round(p.tolerance*100)}% of the exact value.`;
  if(p.equivalentFraction&&p.format==='percent')return `Enter percentage points (e.g. 12.5 or 12.5%), or a fraction. Round to ${precision} decimals.`;
  if(p.equivalentFraction)return `Enter a decimal (e.g. .5), fraction, or percent. Round to ${precision} decimals.`;
  if(p.format==='percent')return `Enter percentage points (e.g. 25 or 25%). Round to ${precision} decimals.`;
  return `Round to ${precision} decimals if needed.${p.unit==='€m'?' Answer in millions.':p.unit==='x'?' Answer as a multiple.':''}`;
}

// A shuffled bag covers the full pool before repeating; session state survives pause/resume.
export function drawFromDeck(pool,decks,key) {
  if(!decks)return pick(pool);
  if(!decks[key]?.length){
    const previous=decks[`${key}:last`];
    const bag=pool.map(v=>[...v]);
    for(let i=bag.length-1;i>0;i--){const j=ri(0,i);[bag[i],bag[j]]=[bag[j],bag[i]];}
    if(bag.length>1&&JSON.stringify(bag.at(-1))===JSON.stringify(previous))[bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]];
    decks[key]=bag;
  }
  const value=decks[key].pop();decks[`${key}:last`]=value;return value;
}
export function automaticAnswerReady(p,raw,precision=2) {
  // Trailing separators and signs are still being edited, even if parseable.
  if(/[.,/+-]$/.test(String(raw).trim()))return false;
  return validateAnswer(p,raw,precision).correct;
}
