// Google Apps Script iframe transport: requests are accepted only from the configured frontend origin.
export const GAS_URL = import.meta.env.VITE_GAS_URL || '';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SESSION_KEY = 'darkovnik_session_v1';
const CACHE_KEY = 'darkovnik_live_dashboard_v1_';
let frame: HTMLIFrameElement | null = null;
let bridgeWindow: Window | null = null;
let origin = '';
let ready = false;
let serial = 0;
const waiting = new Map<string, {resolve:(v:any)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
const readyWaiters: (()=>void)[] = [];
export function initBridge() {
  if (frame || !GAS_URL) return;
  window.addEventListener('message', event => {
    let hostname = '';
    try { hostname = new URL(event.origin).hostname; } catch { return; }
    if (!hostname.endsWith('.googleusercontent.com') || event.data?.app !== 'darkovnik') return;
    if (event.data.type === 'ready') {
      if (event.source !== frame?.contentWindow) return;
      bridgeWindow = event.source as Window; origin = event.origin; ready = true;
      readyWaiters.splice(0).forEach(fn=>fn()); return;
    }
    if (event.source !== bridgeWindow || event.origin !== origin) return;
    if (event.data.type === 'result') {
      const request = waiting.get(event.data.id);
      if (!request) return;
      waiting.delete(event.data.id); clearTimeout(request.timer);
      event.data.ok ? request.resolve(event.data.result) : request.reject(new Error(event.data.error || 'Chyba serveru'));
    }
  });
  frame = document.createElement('iframe');
  frame.src = GAS_URL;
  frame.setAttribute('aria-hidden','true'); frame.title = 'Datové připojení';
  frame.style.cssText='position:absolute;width:1px;height:1px;opacity:0;pointer-events:none';
  document.body.appendChild(frame);
}
export function call<T=any>(method:string,...args:any[]):Promise<T> {
  if (!GAS_URL) return Promise.reject(Error('Není nastavena adresa Google Apps Scriptu (VITE_GAS_URL).'));
  initBridge();
  return new Promise((resolve,reject)=>{
    const send=()=>{
      const id=String(++serial);
      const timer=setTimeout(()=>{waiting.delete(id);reject(Error('Apps Script neodpovídá.'));},35000);
      waiting.set(id,{resolve,reject,timer});
      bridgeWindow!.postMessage({app:'darkovnik',type:'call',id,method,args},origin);
    };
    if (ready) send();
    else {
      const cb=()=>{clearTimeout(timer);send();};
      const timer=setTimeout(()=>{const i=readyWaiters.indexOf(cb);if(i>=0)readyWaiters.splice(i,1);reject(Error('Nepodařilo se připojit k Apps Scriptu.'));},12000);
      readyWaiters.push(cb);
    }
  });
}
export const session = () => {try{return localStorage.getItem(SESSION_KEY)||'';}catch{return '';}};
export function setSession(v:string) {try{if(v)localStorage.setItem(SESSION_KEY,v);else localStorage.removeItem(SESSION_KEY);}catch{}}
function hash(token:string){let n=2166136261;for(const char of token)n=Math.imul(n^char.charCodeAt(0),16777619)>>>0;return n.toString(36);}
export function readCached(token:string) {try {const v=JSON.parse(localStorage.getItem(CACHE_KEY+hash(token))||'null');return v && Date.now()-v.time<86400000 && v.data?.profile?v.data:null;}catch{return null;}}
export function writeCached(token:string,data:any){if(!token||!data?.profile)return;try{const json=JSON.stringify(data,(k,v)=>typeof v==='string'&&v.startsWith('data:image/')?'':v);if(json.length<2000000)localStorage.setItem(CACHE_KEY+hash(token),JSON.stringify({time:Date.now(),data:JSON.parse(json)}));}catch{}}
export function clearCached(token:string){try{localStorage.removeItem(CACHE_KEY+hash(token));}catch{}}
export const money=(value:any)=>{const n=Number(String(value??'').replace(',','.'));return value===null||value===undefined||String(value).trim()===''?'Cena neuvedena':Number.isFinite(n)?new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:n%1?2:0}).format(n):'Cena neuvedena';};
export const shortDate=(iso:string)=>{if(!iso)return '';const d=new Date(iso.slice(0,10)+'T12:00:00');return Number.isNaN(d.getTime())?iso:d.toLocaleDateString('cs-CZ',{day:'numeric',month:'short',year:'numeric'});};
export async function uploadWebP(token:string,file:File){
  let bitmap:ImageBitmap;
  try {bitmap=await createImageBitmap(file);} catch {throw Error('Tento obrázek nelze otevřít.');}
  let side=Math.min(2400,Math.max(bitmap.width,bitmap.height)),encoded='';
  try {for(let attempt=0;attempt<14;attempt++){
    const scale=Math.min(1,side/Math.max(bitmap.width,bitmap.height));
    const c=document.createElement('canvas');c.width=Math.max(1,Math.round(bitmap.width*scale));c.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=c.getContext('2d');if(!ctx)throw Error('Prohlížeč nepodporuje zpracování obrázku.');ctx.drawImage(bitmap,0,0,c.width,c.height);
    encoded=c.toDataURL('image/webp',Math.max(.38,.9-attempt*.045));
    if(!encoded.startsWith('data:image/webp'))throw Error('Prohlížeč nepodporuje WebP.');
    if(encoded.length<Math.floor(8*1024*1024*4/3))break;
    side=Math.max(320,Math.floor(side*.78));
  }} finally {bitmap.close();}
  if(encoded.length>=Math.floor(8*1024*1024*4/3))throw Error('Obrázek se nepodařilo zmenšit na 8 MB.');
  const saved=await call<{url:string}>('uploadImage',token,encoded);
  return saved.url;
}
