export const KEY='ib-mental-math-v1';
export const DEFAULT_SETTINGS={theme:'dark',animations:'subtle',delay:1000,precision:2,level:1,mode:'endless',negative:false,shortcutThreshold:8,objective:'Interview prep',priorities:['multiplication','division','percentages']};
const blank=()=>({version:1,onboarded:false,settings:{...DEFAULT_SETTINGS},answers:[],mistakes:[],sessions:[],active:null,lifetime:null,trainingSeconds:0,sessionDays:{}});
let memory=null;
export let storageAvailable=true;
export function load() {
  try {
    const raw=localStorage.getItem(KEY);
    if(!raw)return blank();
    const data=JSON.parse(raw);
    if(data.version!==1||!Array.isArray(data.answers)||!Array.isArray(data.mistakes)||!Array.isArray(data.sessions))return blank();
    const settings={...DEFAULT_SETTINGS,...data.settings};
    if(![0,1,2].includes(settings.level))settings.level=1;
    if(![0,1,2,3,4].includes(settings.precision))settings.precision=2;
    settings.delay=Math.min(5000,Math.max(400,Number(settings.delay)||1000));
    return {...blank(),...data,settings};
  } catch {storageAvailable=false;return memory||blank();}
}
export function save(data) {
  memory=data;
  try{localStorage.setItem(KEY,JSON.stringify(data));storageAvailable=true;return true;}
  catch{storageAvailable=false;return false;}
}
export function reset(){const data=blank();save(data);return data;}
export function localDay(date=Date.now()){
  const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
