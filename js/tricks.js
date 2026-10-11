import {fmt} from './generators.js';
const method=(title,rule,steps)=>({title,rule,steps});
export function multiplicationMethod(a,b) {
  if(a===b && Number.isInteger(a) && a%10===5) {
    const t=Math.floor(a/10);
    return method('Square a number ending in 5','Multiply the leading number by its successor. Append 25.',[`${t} × ${t+1} = ${t*(t+1)}`,`Append 25 → ${fmt(a*b)}`]);
  }
  if(a===b&&Number.isInteger(a)) {
    const base=[10,50,100,200,500,1000].reduce((c,x)=>Math.abs(x-a)<Math.abs(c-a)?x:c,10),d=a-base;
    if(d!==0&&Math.abs(d)<=5)return method('Square near a round base','(base + d)² = base² + 2 × base × d + d²',[`(${base} ${d<0?'−':'+'} ${Math.abs(d)})²`,`${fmt(base*base)} ${d<0?'−':'+'} ${fmt(Math.abs(2*base*d))} + ${fmt(d*d)} = ${fmt(a*a)}`]);
  }
  const special={5:['Halve, then ×10','÷ 2 × 10',n=>[`${fmt(n)} ÷ 2 = ${fmt(n/2)}`,`${fmt(n/2)} × 10 = ${fmt(n*5)}`]],9:['One less than ×10','× 10 − the original',n=>[`${fmt(n)} × 10 = ${fmt(n*10)}`,`${fmt(n*10)} − ${fmt(n)} = ${fmt(n*9)}`]],11:['One more than ×10','× 10 + the original',n=>[`${fmt(n*10)} + ${fmt(n)} = ${fmt(n*11)}`]],15:['Ten plus five','× 10 + half of ×10',n=>[`${fmt(n*10)} + ${fmt(n*5)} = ${fmt(n*15)}`]],25:['Quarter of ×100','× 100 ÷ 4',n=>[`${fmt(n)} × 100 = ${fmt(n*100)}`,`${fmt(n*100)} ÷ 4 = ${fmt(n*25)}`]],50:['Half of ×100','× 100 ÷ 2',n=>[`${fmt(n*100)} ÷ 2 = ${fmt(n*50)}`]],99:['One less than ×100','× 100 − the original',n=>[`${fmt(n*100)} − ${fmt(n)} = ${fmt(n*99)}`]],101:['One more than ×100','× 100 + the original',n=>[`${fmt(n*100)} + ${fmt(n)} = ${fmt(n*101)}`]]};
  for(const [factor,other] of [[b,a],[a,b]])if(special[factor]) {
    const [title,rule,fn]=special[factor];return method(title,rule,fn(other));
  }
  const midpoint=(a+b)/2,distance=Math.abs(a-b)/2;
  if(Number.isInteger(midpoint)&&midpoint%10===0&&distance<=10&&distance>0)return method('Difference of squares','(m − d)(m + d) = m² − d²',[`${midpoint}² − ${distance}²`,`${fmt(midpoint*midpoint)} − ${fmt(distance*distance)} = ${fmt(a*b)}`]);
  for(const [factor,other] of [[b,a],[a,b]]) {
    const base=[10,50,100,200,500,1000].reduce((closest,n)=>Math.abs(n-factor)<Math.abs(closest-factor)?n:closest,10);
    const delta=factor-base;
    if(Math.abs(delta)<=Math.max(2,base*.04) && delta!==0) return method('Use a nearby round number','Multiply by the base, then compensate.',[`${fmt(other)} × (${base} ${delta<0?'−':'+'} ${Math.abs(delta)})`,`${fmt(other*base)} ${delta<0?'−':'+'} ${fmt(other*Math.abs(delta))} = ${fmt(a*b)}`]);
  }
  if(!Number.isInteger(b))return method('Split the decimal factor','Separate the whole and fractional parts.',[`${fmt(a)} × ${Math.floor(b)} + ${fmt(a)} × ${fmt(b%1)}`,`${fmt(a*Math.floor(b))} + ${fmt(a*(b%1))} = ${fmt(a*b)}`]);
  if(b<10&&a<10)return method('Recall the multiplication fact','Use a known fact as an anchor.',[`${a} × ${b-1} = ${a*(b-1)}`,`Add ${a} → ${a*b}`]);
  if(b<10)[a,b]=[b,a];
  const base=10**Math.floor(Math.log10(b)),high=Math.floor(b/base)*base,low=b-high;
  return method('Split into friendly parts','Distribute multiplication across place values.',[`${fmt(a)} × (${fmt(high)} + ${fmt(low)})`,`${fmt(a*high)} + ${fmt(a*low)} = ${fmt(a*b)}`]);
}
export function divisionMethod(a,b) {
  if([5,25,50].includes(b)) {
    const factor=b===25?4:2,divisor=b===5?10:100;
    return method(`Divide by ${b}`,`Multiply by ${factor}, then divide by ${divisor}.`,[`${fmt(a)} × ${factor} = ${fmt(a*factor)}`,`${fmt(a*factor)} ÷ ${divisor} = ${fmt(a/b)}`]);
  }
  if(Number.isInteger(b)&&b>1&&Number.isInteger(Math.log2(b))) {
    const steps=[fmt(a)];let v=a;for(let i=0;i<Math.log2(b);i++){v/=2;steps.push(fmt(v));}
    return method('Repeated halving',`Divide by 2, ${Math.log2(b)} times.`,[steps.join(' → ')]);
  }
  if(b%10===0)return method('Cancel a factor of ten','Simplify the numerator and denominator together.',[`${fmt(a/10)} ÷ ${fmt(b/10)} = ${fmt(a/b)}`]);
  const tens=Math.floor((a/b)/10)*10,remaining=a-tens*b;
  return method('Think in multiplication','Find a nearby multiple, then solve the remainder.',[`${fmt(b)} × ${tens} = ${fmt(b*tens)}`,`Remainder: ${fmt(remaining)} ÷ ${fmt(b)} = ${fmt(remaining/b)}`,`${tens} + ${fmt(remaining/b)} = ${fmt(a/b)}`]);
}
export function percentageMethod(n,rate) {
  const divisors={50:2,25:4,20:5,12.5:8,6.25:16};
  if(divisors[rate])return method('Use the fraction equivalent',`${rate}% = 1/${divisors[rate]}`,[`${fmt(n)} ÷ ${divisors[rate]} = ${fmt(n*rate/100)}`]);
  if(rate===75)return method('Three quarters','75% = 3/4',[`${fmt(n)} ÷ 4 × 3 = ${fmt(n*.75)}`]);
  if(rate===10||rate===1)return method('Shift the decimal',`Divide by ${rate===10?10:100}.`,[`${fmt(n)} ÷ ${rate===10?10:100} = ${fmt(n*rate/100)}`]);
  if(rate===5)return method('Half of ten percent','Find 10%, then halve it.',[`${fmt(n/10)} ÷ 2 = ${fmt(n*.05)}`]);
  if(rate===15)return method('Ten plus five percent','10% + 5%',[`${fmt(n*.1)} + ${fmt(n*.05)} = ${fmt(n*.15)}`]);
  const base=[10,20,25,50,75,100].reduce((c,x)=>Math.abs(x-rate)<Math.abs(c-rate)?x:c,10),delta=rate-base;
  if(Math.abs(delta)<=3)return method('Build from a nearby percentage',`${base}% ${delta<0?'−':'+'} ${fmt(Math.abs(delta))}%`,[`${fmt(n*base/100)} ${delta<0?'−':'+'} ${fmt(n*Math.abs(delta)/100)} = ${fmt(n*rate/100)}`]);
  const tens=Math.floor(rate/10)*10,rest=rate-tens;
  if(rest>=5){const units=rest-5;return method('Build from ten, five & one percent',`${tens}% + 5%${units?` + ${fmt(units)}%`:''}`,[`${fmt(n*tens/100)} + ${fmt(n*.05)}${units?` + ${fmt(n*units/100)}`:''} = ${fmt(n*rate/100)}`]);}
  return method('Build from ten & one percent',`${tens}% + ${fmt(rest)}%`,[`${fmt(n*tens/100)} + ${fmt(n*rest/100)} = ${fmt(n*rate/100)}`]);
}
export function getMethod(p) {
  const {a,b}=p;
  if(p.kind==='multiply')return multiplicationMethod(a,b);
  if(p.kind==='divide')return divisionMethod(a,b);
  if(p.kind==='percent')return percentageMethod(a,b);
  if(p.kind==='percent-adjust'){
    const m=percentageMethod(a,b);return {...m,title:`${p.direction===1?'Add':'Subtract'} the percentage change`,steps:[...m.steps,`${fmt(a)} ${p.direction===1?'+':'−'} ${fmt(a*b/100)} = ${fmt(p.answer)}`]};
  }
  if(p.kind==='fraction')return method('Know the fraction family',`1/${b} is your anchor. Scale by the numerator.`,[`${a}/${b} = ${fmt(a/b)}`,`${fmt(a/b)} × 100 = ${fmt(a/b*100)}%`,...(b===3||b===6?['This is a recurring decimal. Round only at the end.']:[])]);
  if(p.kind==='change')return method('Change over the original','(New − original) ÷ original × 100',[`Change: ${fmt(b)} − ${fmt(a)} = ${fmt(b-a)}`,`${fmt(b-a)} ÷ ${fmt(a)} × 100 = ${fmt(p.answer)}%`]);
  if(p.kind==='margin')return method('Part over the whole','EBITDA ÷ revenue × 100',[`${fmt(b)} ÷ ${fmt(a)} × 100 = ${fmt(p.answer)}%`]);
  if(p.kind==='reverse-percent')return method('Undo the percentage','Whole = part × 100 ÷ percentage',[`${fmt(a)} × 100 ÷ ${fmt(b)} = ${fmt(p.answer)}`]);
  if(p.kind==='power'){
    if(b===2)return multiplicationMethod(a,a);
    return method('Build from a known power','Multiply in small, reusable steps.',[`${a}² = ${fmt(a*a)}`,`${a}^${b} = ${fmt(a**b)}`]);
  }
  if(p.kind==='reverse-power')return method('Recognize a memorized power','Use your square or cube table.',[`${a}${b===2?'²':'³'} = ${fmt(a**b)}`]);
  if(p.kind==='root') {
    const low=Math.floor(Math.sqrt(a));
    if(low*low===a)return method('Recognize the square','Recall the inverse of your square table.',[`${low}² = ${fmt(a)}`,`√${fmt(a)} = ${low}`]);
    return method('Bracket with known squares','Use the closest square and a small linear adjustment.',[`${low}² = ${low*low} · ${low+1}² = ${(low+1)**2}`,`√${a} is between ${low} and ${low+1}`,`Near ${low}: ${low} + (${a} − ${low*low}) ÷ ${2*low} ≈ ${fmt(low+(a-low*low)/(2*low))}`,`Exact value ≈ ${fmt(Math.sqrt(a))}. A sensible estimate is enough.`]);
  }
  if(p.kind.startsWith('estimate-')){
    const round=x=>Math.round(x/(10**Math.max(0,Math.floor(Math.log10(Math.abs(x)))-1)))*(10**Math.max(0,Math.floor(Math.log10(Math.abs(x)))-1));
    const x=round(a),y=round(b),result=p.kind==='estimate-multiply'?x*y:p.kind==='estimate-divide'?x/y:x*y/100;
    const symbol=p.kind==='estimate-multiply'?'×':p.kind==='estimate-divide'?'÷':'% of';
    return method('Round, calculate, sanity-check','Keep two useful significant digits, then check the error.',[p.kind==='estimate-percent'?`${y}% of ${fmt(x)} ≈ ${fmt(result)}`:`${fmt(x)} ${symbol} ${fmt(y)} ≈ ${fmt(result)}`,`Exact value: ${fmt(p.answer)} · accepted range ±${Math.round(p.tolerance*100)}%`,...(Math.abs(result-p.answer)>Math.abs(p.answer)*p.tolerance?['This first estimate is outside the target range. Retain another digit or compensate toward the exact value.']:[])]);
  }
  const rounded=Math.round(b/10)*10,delta=b-rounded;
  return method('Round and compensate','Move one operand to a round number, then adjust.',p.kind==='add'?[`${fmt(a)} + ${fmt(rounded)} ${delta>=0?'+':'−'} ${Math.abs(delta)} = ${fmt(p.answer)}`]:[`${fmt(a)} − ${fmt(rounded)} ${delta>=0?'−':'+'} ${Math.abs(delta)} = ${fmt(p.answer)}`]);
}
export const PLAYBOOK = [
  ...[5,9,11,15,25,50,99,101].map(f=>({section:'Multiplication',title:`Multiply by ${f}`,category:'multiplication',subcategory:'2x2',shortcut:String(f),example:generateExample(48,f)})),
  {section:'Multiplication',title:'Difference of squares',category:'multiplication',subcategory:'2x2',shortcut:'difference',example:multiplicationMethod(48,52)},
  {section:'Multiplication',title:'Near a round base',category:'multiplication',subcategory:'2x2',shortcut:'near',example:multiplicationMethod(98,37)},
  {section:'Powers',title:'Squares ending in 5',category:'powers',subcategory:'squares',shortcut:'square5',example:multiplicationMethod(35,35)},
  ...[5,25,50,16].map(b=>({section:'Division',title:`Divide by ${b}`,category:'division',subcategory:'exact',shortcut:String(b),example:divisionMethod(b*48,b)})),
  {section:'Division',title:'Multiplication in reverse',category:'division',subcategory:'exact',example:divisionMethod(840,35)},
  ...[1,5,10,15,20,25,50,75,12.5,6.25,17,18].map(rate=>({section:'Percentages',title:`Find ${rate}%`,category:'percentages',subcategory:'of',shortcut:String(rate),example:percentageMethod(320,rate)})),
  {section:'Fractions',title:'Eighths & sixteenths',family:'eighths',category:'division',subcategory:'fractions',example:method('Memorize the anchors','1/8 = .125; 1/16 = .0625',['3/8 = .375 = 37.5%','7/8 = .875 = 87.5%'])},
  {section:'Fractions',title:'Thirds & sixths',family:'thirds',category:'division',subcategory:'fractions',example:method('Recurring decimals','1/3 ≈ 33.3%; 2/3 ≈ 66.7%',['1/6 ≈ 16.7% · 5/6 ≈ 83.3%','These percentages are rounded, not exact.'])},
  {section:'Powers',title:'Build useful powers',category:'powers',subcategory:'other',example:method('Double from a known anchor','2⁴ = 16. Double for the next power.',['2⁵ = 32 → 2⁶ = 64 → 2⁷ = 128 → 2⁸ = 256'])},
  {section:'Square roots',title:'Nearby perfect squares',category:'roots',subcategory:'approx',example:getMethod({kind:'root',a:170})},
  {section:'Estimation',title:'Round with intent',category:'estimation',subcategory:'multiply',example:method('Keep the useful digits','Round one factor up and the other down when possible.',['198 × 51 ≈ 200 × 50 = 10,000','Exact: 10,098. Error: under 1%.'])}
];
function generateExample(a,b){return multiplicationMethod(a,b);}
