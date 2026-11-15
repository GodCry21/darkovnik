/** DÁRKOVNÍK – Google Apps Script backend. Deployment: Execute as me. */
const HEADERS = {
  Users: ['id','email','name','birthday','createdAt','googleSub'],
  Groups: ['id','name','ownerId','createdAt'],
  Members: ['id','groupId','userId','role','createdAt'],
  Invites: ['id','groupId','email','invitedBy','role','expiresAt','acceptedAt'],
  Gifts: ['id','ownerId','name','url','image','price','quantity','receivedQuantity','notes','createdAt'],
  Shares: ['id','giftId','groupId'],
  Reservations: ['id','giftId','groupId','buyerId','quantity','status','createdAt'],
  Events: ['id','groupId','name','date','repeatYearly','userId','createdBy'],
  Notices: ['id','key','sentAt'],
  Sessions: ['id','userId','tokenHash','expiresAt','createdAt']
};
const ROLE = ['member','admin'];
const ID_RE = /^[a-zA-Z0-9_-]{8,100}$/;
function setup() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SHEET_ID');
  if (!id) { const ss = SpreadsheetApp.create('Dárkovník – data'); id = ss.getId(); props.setProperty('SHEET_ID',id); }
  const ss = SpreadsheetApp.openById(id);
  Object.entries(HEADERS).forEach(([name,head]) => {
    let s=ss.getSheetByName(name); if(!s) s=ss.insertSheet(name);
    if (s.getLastRow()===0) { s.appendRow(head); s.setFrozenRows(1); }
    else { const old=s.getRange(1,1,1,s.getLastColumn()).getDisplayValues()[0]; head.forEach((h,i)=>{if(old[i]!==h) s.getRange(1,i+1).setValue(h);}); }
  });
  if (!props.getProperty('GOOGLE_CLIENT_ID')) Logger.log('Doplňte GOOGLE_CLIENT_ID v Script Properties.');
  Logger.log('Datový sešit: '+ss.getUrl());
  Logger.log('HOTOVO – nasaďte webovou aplikaci.');
}
function doGet() {
  const t=HtmlService.createTemplateFromFile('Bridge');
  const origin=PropertiesService.getScriptProperties().getProperty('FRONTEND_ORIGIN');
  require_(origin && /^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(origin),'Nastavte FRONTEND_ORIGIN na přesný původ webu (bez cesty).');
  t.allowedOrigin=origin;
  return t.evaluate().setTitle('Dárkovník API')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function sheet_(name) {
  const id=PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw Error('Nejprve spusťte setup().');
  const s=SpreadsheetApp.openById(id).getSheetByName(name);
  if (!s) throw Error('Chybí list '+name); return s;
}
function records_(name) {
  const s=sheet_(name), v=s.getDataRange().getDisplayValues();
  if(v.length<2) return [];
  const head=HEADERS[name]; return v.slice(1).map((r,i)=>Object.fromEntries([...head.map((h,j)=>[h,r[j]||'']),['_row',i+2]]));
}
function add_(name, obj) { const v=HEADERS[name].map(k=>obj[k]===undefined?'':String(obj[k])); sheet_(name).appendRow(v); return obj; }
function update_(name, r, patch) { const s=sheet_(name), v={...r,...patch}; s.getRange(r._row,1,1,HEADERS[name].length).setValues([HEADERS[name].map(k=>v[k]===undefined?'':String(v[k]))]); return v; }
function remove_(name,r) { sheet_(name).deleteRow(r._row); }
function uid_(){ return Utilities.getUuid(); }
function now_(){ return new Date().toISOString(); }
function require_(ok,msg='Nemáte oprávnění.'){ if(!ok) throw Error(msg); }
function str_(v,max=250){ return String(v||'').trim().slice(0,max); }
function email_(e){ e=str_(e,254).toLowerCase(); require_(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),'Neplatný e-mail.'); return e; }
function int_(v,min,max){ const n=Number(v); require_(Number.isInteger(n)&&n>=min&&n<=max,'Neplatné množství.');return n; }
function url_(v){ const u=str_(v,1200); if(!u)return '';require_(/^https:\/\/[a-z0-9][a-z0-9.-]+(?::443)?(?:[/?#]|$)/i.test(u),'Použijte veřejnou HTTPS adresu.');return u; }
function withLock_(fn){ const l=LockService.getScriptLock();require_(l.tryLock(20000),'Aplikace je právě zaneprázdněná. Zkuste to znovu.');try{return fn();}finally{l.releaseLock();}}
function clean_(r){ if(!r)return null;const {_row,...rest}=r;return rest; }
/** Google ID token musí být ověřen proti Google (signature, aud, iss, exp a email_verified).
 * tokeninfo ověřuje JWT na straně Google. Krátká cache šetří kvóty, platnost cache
 * však nikdy nepřekročí platnost samotného tokenu. 
 */
function identity_(token){
  require_(typeof token==='string' && token.length>100 && token.length<6000, 'Nejste přihlášení.');
  const clientId=PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
  require_(clientId,'Chybí GOOGLE_CLIENT_ID v nastavení Apps Script.');
  const cache=CacheService.getScriptCache();
  const key=Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,token));
  let data; const cached=cache.get(key);
  if(cached) data=JSON.parse(cached);
  else {
    const r=UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(token),{muteHttpExceptions:true});
    require_(r.getResponseCode()===200,'Google přihlášení vypršelo. Přihlaste se znovu.');
    data=JSON.parse(r.getContentText());
  }
  require_(data.aud===clientId,'Neplatné OAuth Client ID.');
  require_(data.iss==='accounts.google.com'||data.iss==='https://accounts.google.com','Neplatný vydavatel tokenu.');
  require_(Number(data.exp)*1000>Date.now(),'Přihlášení vypršelo.');
  require_(data.email_verified===true||data.email_verified==='true','E-mail účtu není ověřený.');
  require_(data.sub&&data.email,'Chybí ověřená identita.');
  if(!cached)cache.put(key,JSON.stringify(data),Math.max(1,Math.min(90,Math.floor(Number(data.exp)-Date.now()/1000))));
  return data;
}
/** Dlouhodobá relace: prohlížeč drží pouze náhodný opaque token, Sheets jen SHA-256 hash.
 * Google ID token se používá výhradně při prvním přihlášení / novém přihlášení.
 * Platnost je pevně 30 dní; žádné OAuth credentials se do localStorage neukládají.
 */
const SESSION_DAYS = 30;
function sessionHash_(token){
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,token));
}
function user_(token){
  require_(typeof token==='string' && /^ds_[0-9a-f-]{36}_[0-9a-f-]{36}$/.test(token),'Neplatná relace. Přihlaste se znovu.');
  const hash=sessionHash_(token);
  const session=records_('Sessions').find(s=>s.tokenHash===hash);
  require_(session && Date.parse(session.expiresAt)>Date.now(),'Relace vypršela. Přihlaste se znovu.');
  const user=records_('Users').find(u=>u.id===session.userId);
  require_(user,'Uživatelský účet není dostupný.');
  return user;
}
function signInWithGoogle(token){return withLock_(()=>{
  const identity=identity_(token), email=email_(identity.email);
  let u=records_('Users').find(x=>x.googleSub===identity.sub);
  if(!u){
    const conflict=records_('Users').find(x=>x.email===email&&x.googleSub&&x.googleSub!==identity.sub);
    require_(!conflict,'Tento e-mail je již propojený s jiným Google účtem.');
    u=records_('Users').find(x=>x.email===email&&!x.googleSub);
    if(u)u=update_('Users',u,{googleSub:identity.sub});
    else u=add_('Users',{id:uid_(),email,name:str_(identity.name,80)||email.split('@')[0],birthday:'',googleSub:identity.sub,createdAt:now_()});
  }
  const invitations=records_('Invites').filter(x=>x.email===email&&!x.acceptedAt&&Date.parse(x.expiresAt)>Date.now());
  invitations.forEach(i=>{if(!member_(u.id,i.groupId))add_('Members',{id:uid_(),groupId:i.groupId,userId:u.id,role:i.role,createdAt:now_()});update_('Invites',i,{acceptedAt:now_()});});
  // Dvě nezávislá UUID; token není odvoditelný z identity uživatele.
  const sessionToken='ds_'+uid_()+'_'+uid_();
  const expiresAt=new Date(Date.now()+SESSION_DAYS*86400000).toISOString();
  add_('Sessions',{id:uid_(),userId:u.id,tokenHash:sessionHash_(sessionToken),expiresAt,createdAt:now_()});
  return {profile:clean_(u),sessionToken,expiresAt};
});}
function logoutSession(token){return withLock_(()=>{
  const hash=sessionHash_(String(token||''));
  const session=records_('Sessions').find(s=>s.tokenHash===hash);
  if(session)remove_('Sessions',session);
  return {ok:true};
});}
function config(){return {clientId:PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID')||''};}
function member_(uid,gid){return records_('Members').find(x=>x.userId===uid&&x.groupId===gid);}
function canAdmin_(uid,gid){let m=member_(uid,gid);return m&&m.role==='admin';}
function gift_(id){const g=records_('Gifts').find(x=>x.id===id);require_(g,'Dárek nenalezen.');return g;}
function group_(id){const g=records_('Groups').find(x=>x.id===id);require_(g,'Skupina nenalezena.');return g;}
function send_(to,subject,body){MailApp.sendEmail({to,subject,body,name:'Dárkovník'});}
function link_(){return PropertiesService.getScriptProperties().getProperty('APP_URL')||'odkaz na aplikaci vám předá správce skupiny';}
function dashboard(token){const u=user_(token),members=records_('Members'),groups=records_('Groups'),users=records_('Users'),gifts=records_('Gifts'),shares=records_('Shares'),res=records_('Reservations'),events=records_('Events');
  const myGroups=members.filter(m=>m.userId===u.id).map(m=>({ ...clean_(groups.find(g=>g.id===m.groupId)), role:m.role, members:members.filter(y=>y.groupId===m.groupId).map(y=>{const x=users.find(z=>z.id===y.userId);return {id:x.id,name:x.name,email:x.email,birthday:x.birthday,role:y.role};})}));
  const myGifts=gifts.filter(g=>g.ownerId===u.id).map(g=>({...clean_(g),groupIds:shares.filter(s=>s.giftId===g.id).map(s=>s.groupId)}));
  const groupsIds=new Set(myGroups.map(g=>g.id));const visibleGifts=gifts.filter(g=>g.ownerId!==u.id && shares.some(s=>s.giftId===g.id&&groupsIds.has(s.groupId))).map(g=>{
     const r=res.filter(x=>x.giftId===g.id), taken=r.reduce((a,x)=>a+Number(x.quantity),0), purchased=r.filter(x=>x.status==='purchased').reduce((a,x)=>a+Number(x.quantity),0);
     return {...clean_(g),groupIds:shares.filter(s=>s.giftId===g.id&&groupsIds.has(s.groupId)).map(s=>s.groupId),available:Math.max(0,Number(g.quantity)-taken),reserved:taken,purchased,ownerName:(users.find(x=>x.id===g.ownerId)||{}).name||'',mine:r.filter(x=>x.buyerId===u.id).map(x=>clean_(x))};
  });
  const myReservations=res.filter(r=>r.buyerId===u.id&&groupsIds.has(r.groupId)).map(r=>{const g=gifts.find(x=>x.id===r.giftId);const person=users.find(x=>x.id===g?.ownerId);return {...clean_(r),giftName:g?.name||'Smazaný dárek',giftUrl:g?.url||'',personName:person?.name||'',image:g?.image||''};});
  return {profile:clean_(u),groups:myGroups,myGifts,visibleGifts,myReservations,events:events.filter(e=>groupsIds.has(e.groupId)).map(clean_)};
}
function saveProfile(token,data){return withLock_(()=>{const u=user_(token),name=str_(data.name,80),birthday=str_(data.birthday,10);require_(name,'Vyplňte jméno.');require_(!birthday||/^\d{4}-\d{2}-\d{2}$/.test(birthday),'Nesprávné datum.');update_('Users',u,{name,birthday});return {ok:true};});}
function createGroup(token,name){return withLock_(()=>{const u=user_(token);name=str_(name,100);require_(name.length>=2,'Vyplňte název skupiny.');const id=uid_();add_('Groups',{id,name,ownerId:u.id,createdAt:now_()});add_('Members',{id:uid_(),groupId:id,userId:u.id,role:'admin',createdAt:now_()});return {id};});}
function inviteMember(token,groupId,address){return withLock_(()=>{const u=user_(token);group_(groupId);require_(canAdmin_(u.id,groupId));const email=email_(address);require_(email!==u.email,'Sebe už máte ve skupině.');const existing=records_('Users').find(x=>x.email===email);require_(!existing||!member_(existing.id,groupId),'Uživatel už je členem.');
  const prev=records_('Invites').find(x=>x.groupId===groupId&&x.email===email&&!x.acceptedAt&&Date.parse(x.expiresAt)>Date.now());require_(!prev,'Pozvánka už byla odeslána.');
  add_('Invites',{id:uid_(),groupId,email,invitedBy:u.id,role:'member',expiresAt:new Date(Date.now()+30*86400000).toISOString(),acceptedAt:''});
  send_(email,'Pozvánka do skupiny – Dárkovník','Byli jste pozváni do skupiny „'+group_(groupId).name+'“.\nOtevřete Dárkovník: '+link_()+'\nPřihlaste se pod e-mailem '+email+'. Pozvánka se automaticky přijme. Platí 30 dní.');return {ok:true};
});}
function setRole(token,groupId,userId,role){return withLock_(()=>{const u=user_(token),g=group_(groupId);require_(g.ownerId===u.id,'Role může upravovat zakladatel skupiny.');require_(ROLE.includes(role),'Neplatná role.');require_(userId!==u.id,'Nemůžete změnit svoji roli.');const m=member_(userId,groupId);require_(m,'Člen nenalezen.');update_('Members',m,{role});return {ok:true};});}
function saveGift(token,data){return withLock_(()=>{const u=user_(token),name=str_(data.name,160),quantity=int_(data.quantity||1,1,999),url=url_(data.url),image=url_(data.image),price=str_(data.price,90),notes=str_(data.notes,1000);require_(name,'Název dárku je povinný.');let gift;
  if(data.id){gift=gift_(data.id);require_(gift.ownerId===u.id,'Tento dárek není váš.');const reserved=records_('Reservations').filter(r=>r.giftId===gift.id).reduce((a,r)=>a+Number(r.quantity),0);require_(quantity>=reserved,'Množství nelze snížit pod počet rezervovaných kusů.');require_(quantity>=Number(gift.receivedQuantity),'Množství nelze snížit pod počet obdržených kusů.');update_('Gifts',gift,{name,quantity,url,image,price,notes});}
  else {gift=add_('Gifts',{id:uid_(),ownerId:u.id,name,quantity,url,image,price,notes,receivedQuantity:0,createdAt:now_()});}
  const allowed=new Set(records_('Members').filter(m=>m.userId===u.id).map(m=>m.groupId));const newGroups=(Array.isArray(data.groupIds)?data.groupIds:[]).filter(id=>allowed.has(id));
  const old=records_('Shares').filter(x=>x.giftId===gift.id);old.filter(x=>!newGroups.includes(x.groupId)).reverse().forEach(x=>remove_('Shares',x));newGroups.filter(id=>!old.some(x=>x.groupId===id)).forEach(groupId=>add_('Shares',{id:uid_(),giftId:gift.id,groupId}));return {id:gift.id};
});}
function deleteGift(token,id){return withLock_(()=>{const u=user_(token),g=gift_(id);require_(g.ownerId===u.id);require_(!records_('Reservations').some(x=>x.giftId===id),'Dárek už někdo rezervoval. Nelze jej smazat.');records_('Shares').filter(x=>x.giftId===id).reverse().forEach(x=>remove_('Shares',x));remove_('Gifts',g);return {ok:true};});}
function reserveGift(token,giftId,groupId,quantity){return withLock_(()=>{const u=user_(token),g=gift_(giftId);require_(g.ownerId!==u.id,'Svůj dárek nemůžete rezervovat.');require_(member_(u.id,groupId),'Nejste členem skupiny.');require_(records_('Shares').some(s=>s.groupId===groupId&&s.giftId===giftId),'Dárek není sdílen do této skupiny.');quantity=int_(quantity,1,999);const used=records_('Reservations').filter(r=>r.giftId===giftId).reduce((a,r)=>a+Number(r.quantity),0);require_(quantity<=Number(g.quantity)-used,'Tolik kusů již není volných.');add_('Reservations',{id:uid_(),giftId,groupId,buyerId:u.id,quantity,status:'reserved',createdAt:now_()});return {ok:true};});}
function updateReservation(token,id,status){return withLock_(()=>{const u=user_(token),r=records_('Reservations').find(x=>x.id===id);require_(r&&r.buyerId===u.id,'Rezervace nenalezena.');require_(['reserved','purchased','cancel'].includes(status),'Nesprávný stav.');if(status==='cancel'){remove_('Reservations',r);}else update_('Reservations',r,{status});return {ok:true};});}
function markReceived(token,giftId,quantity){return withLock_(()=>{const u=user_(token),g=gift_(giftId);require_(g.ownerId===u.id,'Dárek není váš.');quantity=int_(quantity,0,Number(g.quantity));update_('Gifts',g,{receivedQuantity:quantity});return {ok:true};});}
function saveEvent(token,data){return withLock_(()=>{const u=user_(token),gid=str_(data.groupId,100);require_(canAdmin_(u.id,gid),'Události spravují administrátoři.');const name=str_(data.name,110),date=str_(data.date,10),repeatYearly=!!data.repeatYearly,personId=str_(data.userId,100);require_(name,'Název události je povinný.');require_(/^\d{4}-\d{2}-\d{2}$/.test(date)&&!isNaN(new Date(date+'T12:00:00Z').getTime()),'Nesprávné datum.');require_(!personId||member_(personId,gid),'Vybraná osoba není členem.');const v={groupId:gid,name,date,repeatYearly:repeatYearly?'true':'false',userId:personId,createdBy:u.id};if(data.id){const e=records_('Events').find(x=>x.id===data.id&&x.groupId===gid);require_(e,'Událost nenalezena.');update_('Events',e,v);}else add_('Events',{id:uid_(),...v});return {ok:true};});}
function deleteEvent(token,id){return withLock_(()=>{const u=user_(token),e=records_('Events').find(x=>x.id===id);require_(e&&canAdmin_(u.id,e.groupId));remove_('Events',e);return {ok:true};});}
/** Volitelné načtení produktu – podporujeme jen vybrané e-shopy (mohou blokovat boty). */
function fetchProduct(token,raw){user_(token);const url=url_(raw),host=url.match(/^https:\/\/([^/?#]+)/i)?.[1]?.toLowerCase();require_(['alza.cz','www.alza.cz','datart.cz','www.datart.cz'].includes(host),'Automatické načtení podporuje zatím pouze Alzu a Datart.');
  const response=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:true,headers:{'User-Agent':'Mozilla/5.0 (compatible; GiftWishlist/1.0)'},timeout:15000});require_(response.getResponseCode()===200,'E-shop neposkytl data. Vyplňte produkt ručně.');const html=response.getContentText().slice(0,500000);
  const meta=(key)=>{const esc=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const re1=new RegExp('<meta[^>]+(?:property|name)=["\\\']'+esc+'["\\\'][^>]+content=["\\\']([^"\\\']+)["\\\']','i');const re2=new RegExp('<meta[^>]+content=["\\\']([^"\\\']+)["\\\'][^>]+(?:property|name)=["\\\']'+esc+'["\\\']','i');return (html.match(re1)||html.match(re2)||[])[1]||'';};
  const decode=(s)=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  return {name:decode(meta('og:title')).slice(0,160),image:decode(meta('og:image')).slice(0,1200),price:decode(meta('product:price:amount')||meta('og:price:amount')).slice(0,90)};
}
/** Nastavte hodinový / denní trigger na sendReminders. Události s adresátem připomínají nákup 7 dnů předem a potvrzení obdržení den poté. */
function sendReminders(){return withLock_(()=>{
  const events=records_('Events'),members=records_('Members'),users=records_('Users'),gifts=records_('Gifts'),shares=records_('Shares'),rs=records_('Reservations'),notices=records_('Notices');
  const tz='Europe/Prague',today=Utilities.formatDate(new Date(),tz,'yyyy-MM-dd');let sent=0;
  for(const e of events){const eventDate=e.repeatYearly==='true'?today.slice(0,4)+e.date.slice(4):e.date;let date=new Date(eventDate+'T12:00:00Z');if(Number.isNaN(date.getTime()))continue;
    const delta=Math.round((date-new Date(today+'T12:00:00Z'))/86400000);if(delta!==7&&delta!==-1)continue;
    const target=users.find(x=>x.id===e.userId);const matching=gifts.filter(g=>g.ownerId===e.userId&&shares.some(s=>s.giftId===g.id&&s.groupId===e.groupId));
    if(delta===7){for(const r of rs.filter(r=>r.groupId===e.groupId&&r.status==='reserved'&&matching.some(g=>g.id===r.giftId))){const person=users.find(x=>x.id===r.buyerId),gift=gifts.find(g=>g.id===r.giftId);if(!person)continue;
      const key='before:'+e.id+':'+eventDate+':'+r.id;if(notices.some(n=>n.key===key))continue;send_(person.email,'Připomínka dárku – '+e.name,'Za 7 dní je událost '+e.name+' ('+eventDate+').\nNezapomeňte koupit '+gift.name+' ('+r.quantity+' ks) a označit rezervaci jako Nakoupeno.\n'+link_());add_('Notices',{id:uid_(),key,sentAt:now_()});sent++;}}
    if(delta===-1&&target&&matching.length){const key='after:'+e.id+':'+eventDate+':'+target.id;if(notices.some(n=>n.key===key))continue;send_(target.email,'Potvrzení dárků – '+e.name,'Včera proběhla událost '+e.name+'. Pokud jste některé dárky dostali, otevřete svůj seznam a nastavte u nich obdržené množství.\n'+link_());add_('Notices',{id:uid_(),key,sentAt:now_()});sent++;}
  }
  return {sent};
});}
