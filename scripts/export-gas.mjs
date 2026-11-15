import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const html = readFileSync('dist/index.html','utf8');
mkdirSync('apps-script',{recursive:true});
writeFileSync('apps-script/Index.html', html);
console.log('✓ apps-script/Index.html připraven pro vložení do Google Apps Script');
