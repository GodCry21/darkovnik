/** In-memory Google Apps Script service emulation: no Google account/network needed. */
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),assert=require('node:assert/strict');
const source=fs.readFileSync('apps-script/Code.gs','utf8');
let counter=0;const db=new Map(), props=new Map([['SHEET_ID','dev-sheet'],['GOOGLE_CLIENT_ID','test-client']]);
class Sheet{
 constructor(name){this.name=name;this.rows=[];}
 getLastRow(){return this.rows.length;}
 getLastColumn(){return Math.max(0,...this.rows.map(r=>r.length));}
 appendRow(row){this.rows.push([...row]);}
 deleteRow(r){this.rows.splice(r-1,1);}
 setFrozenRows(){}
 getRange(row,col,nrow=1,ncol=1){let self=this;return {
  getDisplayValues(){return Array.from({length:nrow},(_,i)=>Array.from({length:ncol},(_,j)=>String(self.rows[row+i-1]?.[col+j-1]??'')));},
  setValues(values){values.forEach((v,i)=>{const y=row+i-1;self.rows[y]??=[];v.forEach((z,j)=>self.rows[y][col+j-1]=z);});},
  setValue(v){self.rows[row-1]??=[];self.rows[row-1][col-1]=v;}
 }}
}
const ss={getId:()=> 'dev-sheet',getUrl:()=> 'https://sheets.example/dev', getSheetByName:name=>db.get(name),insertSheet(name){const x=new Sheet(name);db.set(name,x);return x;}};
const ctx={console,Map,Set,Date,JSON,Math,Number,String,RegExp,Object,Array,Error,URL,encodeURIComponent,
 SpreadsheetApp:{openById:()=>ss,create:()=>ss},
 PropertiesService:{getScriptProperties:()=>({getProperty:key=>props.get(key)||'',setProperty:(key,v)=>props.set(key,v)})},
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
 Utilities:{getUuid:()=>`00000000-0000-4000-8000-${String(++counter).padStart(12,'0')}`,formatDate:(d,tz,fmt)=>`${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`,computeDigest:(_,token)=>[...crypto.createHash('sha256').update(token).digest()],base64EncodeWebSafe:x=>Buffer.from(x).toString('base64url'),DigestAlgorithm:{SHA_256:'SHA_256'},base64Decode:x=>[...Buffer.from(x,'base64')]},
 Logger:{log:()=>{}},MailApp:{sendEmail:()=>{}},
};
vm.createContext(ctx);vm.runInContext(source,ctx);
const invoke=(name,...args)=>vm.runInContext(`${name}.apply(null,__args__)`,Object.assign(ctx,{__args__:args}));
const expectReject=(fn,pattern)=>assert.throws(fn,pattern);
let tests=0;const check=(name,fn)=>{fn();tests++;console.log('PASS '+name)};
check('creates Sheets schema incl. messages and invitations',()=>{invoke('setup');for(const t of ['Users','Groups','Members','Invites','Gifts','Reservations','Conversations','Messages','MessageReports'])assert(db.has(t),t)});
// bootstrap two verified local sessions; authentication itself must be checked against live Google
const uuid=()=>ctx.Utilities.getUuid();
const alice=uuid(),bob=uuid(),mallory=uuid();
for(const [id,name,email] of [[alice,'Alice','alice@example.com'],[bob,'Bob','bob@example.com'],[mallory,'Mallory','mallory@example.com']])invoke('add_','Users',{id,name,email,googleSub:id,createdAt:new Date().toISOString()});
const tokens={};for(const [id,name] of [[alice,'alice'],[bob,'bob'],[mallory,'mallory']]){const t=`ds_${uuid()}_${uuid()}`;tokens[name]=t;invoke('add_','Sessions',{id:uuid(),userId:id,tokenHash:invoke('sessionHash_',t),expiresAt:new Date(Date.now()+86400000).toISOString(),createdAt:new Date().toISOString()});}
let group,inviteId,gift,thread;
check('group owner is admin',()=>{group=invoke('createGroup',tokens.alice,'Rodina').id;assert.equal(invoke('member_',alice,group).role,'admin')});
check('only founder may issue admin invitation',()=>{
 invoke('inviteMember',tokens.alice,group,'bob@example.com','admin');const invites=invoke('records_','Invites');assert.equal(invites[0].role,'admin');inviteId=invites[0].id;
});
check('valid invitation is re-sendable',()=>assert.equal(invoke('resendInvite',tokens.alice,inviteId).ok,true));
check('member of unrelated group cannot join chat',()=>expectReject(()=>invoke('createConversation',tokens.mallory,alice,group,'','Ahoj'),/členy stejné skupiny/));
// simulate invitation acceptance; actual Google token verification occurs separately
invoke('add_','Members',{id:uuid(),groupId:group,userId:bob,role:'admin',createdAt:new Date().toISOString()});
check('priority is persisted; empty price accepted',()=>{
 const x=invoke('saveGift',tokens.alice,{name:'Sluchátka',quantity:2,price:'',priority:'high',groupIds:[group]});gift=x.id;
 assert.equal(invoke('records_','Gifts').find(g=>g.id===gift).priority,'high');
});
check('invalid price blocked',()=>expectReject(()=>invoke('saveGift',tokens.alice,{name:'Chyba',quantity:1,price:'123abc',groupIds:[]}),/Cena/));
check('gift booking belongs to other member',()=>{
 invoke('reserveGift',tokens.bob,gift,group,1);
 expectReject(()=>invoke('reserveGift',tokens.alice,gift,group,1),/vlastní|svůj|vlastní dárek/i);
});
check('own dashboard does not disclose buyers',()=>{
 const x=invoke('dashboard',tokens.alice);
 assert(!JSON.stringify(x.myGifts).includes(bob));
 assert.equal(x.myGifts[0].name,'Sluchátka');
});
check('anonymous conversation hides sender identity from recipient',()=>{
 thread=invoke('createConversation',tokens.bob,alice,group,gift,'Vyhovují bílé?').id;
 const view=invoke('conversations',tokens.alice);
 assert.equal(view[0].recipientName,'Anonymní člen');assert(!JSON.stringify(view).includes('bob@example.com'));
 const history=invoke('conversationMessages',tokens.alice,thread,50,0);
 assert.equal(history.messages[0].body,'Vyhovují bílé?');assert.equal(history.messages[0].mine,false);
 assert(!JSON.stringify(history).includes(bob));
});
check('receiver can reply and then block, sender cannot bypass block',()=>{
 invoke('sendMessage',tokens.alice,thread,'Ano');invoke('setConversationState',tokens.alice,thread,'block');
 expectReject(()=>invoke('sendMessage',tokens.bob,thread,'Díky'),/uzavřená/);
 expectReject(()=>invoke('createConversation',tokens.bob,alice,group,'','Nový dotaz'),/nepřeje/);
});
check('reporting is saved once',()=>{
 invoke('reportConversation',tokens.alice,thread,'Nevhodné');
 expectReject(()=>invoke('reportConversation',tokens.alice,thread,'Znovu'),/nahlášena/);
 assert.equal(invoke('records_','MessageReports').length,1)
});
console.log(`${tests} backend integration tests passed (in-memory Google Sheets mock).`);
