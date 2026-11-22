/** Build an entirely self-contained HTML bundle for offline CI environments.
 * This fallback uses local React/Lucide UMD assets from npm packages and
 * the TypeScript transpiler. Normal builds should still use Vite.
 */
const fs=require('node:fs');const path=require('node:path');
let ts;try{ts=require('typescript')}catch{try{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}catch{throw Error('Portable build vyžaduje balíček typescript.')} }
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const react=read('node_modules/react/umd/react.production.min.js');
const reactDOM=read('node_modules/react-dom/umd/react-dom.production.min.js');
const lucide=read('node_modules/lucide-react/dist/umd/lucide-react.min.js');
const css=read('src/style.css');
const main=read('src/main.jsx');const messages=read('src/Messages.jsx');
const named=(code,pkg)=>{const m=code.match(new RegExp("import\\s*\\{([^}]+)\\}\\s*from\\s*['\\\"]"+pkg.replace('/','\\/')+"['\\\"]"));return m?m[1].split(',').map(x=>x.trim()).filter(Boolean):[]};
const icons=[...new Set([...named(main,'lucide-react'),...named(messages,'lucide-react')])];
let m=main.replace(/^import[^\n]+;\s*$/gm,'').replaceAll('import.meta.env.VITE_GAS_URL',"(window.DARKOVNIK_CONFIG?.gasUrl||'')").replaceAll('import.meta.env.VITE_GOOGLE_CLIENT_ID',"(window.DARKOVNIK_CONFIG?.clientId||'')").replaceAll('import.meta.env.BASE_URL',"'./'").replaceAll('import.meta.env.PROD',"(location.protocol==='https:')");
let c=messages.replace(/^import[^\n]+;\s*$/gm,'').replace(/export default function Messages\(/,'function Messages(');
const transform=s=>ts.transpileModule(s,{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.None,removeComments:true},fileName:'App.jsx'}).outputText;
const code=`const React=window.React;\nconst {useEffect,useRef,useState,useCallback,useMemo}=React;\nconst {createRoot}=window.ReactDOM;\nconst {${icons.join(',')}}=window.LucideReact;\n${transform(c)}\n${transform(m)}`
.replaceAll('import.meta.env.VITE_GAS_URL','(window.DARKOVNIK_CONFIG?.gasUrl||\'\')')
.replaceAll('import.meta.env.VITE_GOOGLE_CLIENT_ID','(window.DARKOVNIK_CONFIG?.clientId||\'\')')
.replaceAll('import.meta.env.BASE_URL',"'./'")
.replaceAll('import.meta.env.PROD',"(location.protocol==='https:')");
if(code.includes('import.meta')||/\bexport\s+(default|const|function)/.test(code))throw Error('Untransformed ES module syntax');
const script=s=>`<script>${s.replace(/<script/gi,'\\x3cscript').replace(/<\/script/gi,'<\\/script')}</script>`;
const config={gasUrl:process.env.VITE_GAS_URL||'',clientId:process.env.VITE_GOOGLE_CLIENT_ID||''};
const html=`<!doctype html><html lang="cs"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#3e6553"><title>Dárkovník</title><link rel="icon" href="./icons/icon.svg"><link rel="manifest" href="./manifest.webmanifest"><style>${css}</style></head><body><div id="root"></div>${script(`window.DARKOVNIK_CONFIG=${JSON.stringify(config)};`)}${script(react)}${script('window.react=window.React;')}${script(reactDOM)}${script(lucide)}${script(code)}</body></html>`;
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.cpSync(path.join(root,'public'),path.join(root,'dist'),{recursive:true,force:true});
fs.writeFileSync(path.join(root,'dist/index.html'),html);
fs.writeFileSync(path.join(root,'apps-script/Index.html'),html);
console.log(`OK – vytvořen dist/index.html a apps-script/Index.html (${Math.round(Buffer.byteLength(html)/1024)} KiB).`);
