const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const babelParser=require('@babel/parser');
const source=fs.readFileSync('src/main.jsx','utf8');const chat=fs.readFileSync('src/Messages.jsx','utf8');const gs=fs.readFileSync('apps-script/Code.gs','utf8');const bridge=fs.readFileSync('apps-script/Bridge.html','utf8');const css=fs.readFileSync('src/style.css','utf8');
let checks=0;function check(name,fn){fn();checks++;process.stdout.write('PASS '+name+'\n')}
check('Apps Script parses',()=>new vm.Script(gs,{filename:'Code.gs'}));
check('Main JSX parses/transpiles',()=>{babelParser.parse(source,{sourceType:'module',plugins:['jsx']})});
check('Messages JSX parses/transpiles',()=>{babelParser.parse(chat,{sourceType:'module',plugins:['jsx']})});
check('Bridge exposes called methods implemented by backend',()=>{
 const calls=[...source.matchAll(/call\('([A-Za-z0-9_]+)'/g),...chat.matchAll(/call\('([A-Za-z0-9_]+)'/g)].map(m=>m[1]);const methods=new Set([...bridge.matchAll(/'([A-Za-z0-9_]+)'/g)].map(m=>m[1]));
 for(const m of new Set(calls)){assert(methods.has(m),'not exposed: '+m);assert(new RegExp('function '+m+'\\s*\\(').test(gs),'not implemented: '+m)}
});
check('Required server authorization paths present',()=>{
 for(const m of ['createConversation','conversationMessages','sendMessage','reportConversation','reserveGift','updateReservation','ownGiftStatuses','resendInvite'])assert(new RegExp('function '+m+'\\s*\\(').test(gs));
 assert(gs.includes('member_(u.id,groupId)&&member_(recipientId,groupId)'));
 assert(gs.includes('require_(gift.ownerId===recipientId'));
 assert(gs.includes('require_(c.recipientId===u.id'));
});
check('User-selected constraints present',()=>{
 for(const t of ['priority','receivedQuantity','holidaysSelected','Conversations','Messages','MessageReports'])assert(gs.includes(t));
 assert(source.includes('showOwnStatus&&'));assert(source.includes('maxLength={1000}'));
 assert(source.includes('onEdit={openEvent}'));
 assert(source.includes('image/webp'));
});
check('Figma-inspired light/dark and responsive styles',()=>{
 assert(css.includes('--brand:#3e6553'));assert(css.includes('[data-theme="dark"]'));assert(css.includes('@media(max-width:640px)'));
});
console.log(`${checks} static and contract checks passed.`)
