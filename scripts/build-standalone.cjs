const fs=require('fs'),path=require('path');
let ts;try{ts=require('typescript')}catch{try{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}catch{throw Error('Portable build vyžaduje TypeScript. Nainstalujte jej přes npm.')}}
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const iconsSource=read('src/Icon.tsx');
const strip=s=>s.replace(/^import[^\n]*\n/gm,'').replace(/\bexport default function LiveApp\(/,'function LiveApp(').replace(/\bexport\s*\{[^}]*\}\s*;?/g,'').replace(/\bexport (const|function|class|type|interface|async)\b/g,'$1').replaceAll('import.meta.env.VITE_GAS_URL',"(window.DARKOVNIK_CONFIG?.gasUrl||'')").replaceAll('import.meta.env.VITE_GOOGLE_CLIENT_ID',"(window.DARKOVNIK_CONFIG?.clientId||'')");
const transpile=(source,file)=>ts.transpileModule(strip(source),{fileName:file,compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.None,removeComments:true},reportDiagnostics:true}).outputText;
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
const scriptJS=`const React=window.React;const {useCallback,useEffect,useMemo,useRef,useState}=React;\n${transpile(iconsSource,'Icon.tsx')}\n${transpile(read('src/api.ts'),'api.ts')}\n${transpile(read('src/LiveApp.tsx'),'LiveApp.tsx')}\nwindow.ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(LiveApp));`;
if(/\bimport\.meta\b|\bexport\s+(const|function|default)\b/.test(scriptJS))throw Error('Untransformed module syntax');
const react=read('node_modules/react/umd/react.production.min.js'),reactDOM=read('node_modules/react-dom/umd/react-dom.production.min.js');
const css=read('src/index.css');
const config={gasUrl:process.env.VITE_GAS_URL||'',clientId:process.env.VITE_GOOGLE_CLIENT_ID||''};
const html=`<!doctype html><html lang="cs"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#3e6553"><title>Dárkovník</title><link rel="icon" href="./favicon.png"><style>${css}</style></head><body><div id="root"></div>${script('window.DARKOVNIK_CONFIG='+JSON.stringify(config)+';')}${script(react)}${script(reactDOM)}${script(scriptJS)}</body></html>`;
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'dist/index.html'),html);
fs.copyFileSync(path.join(root,'public/favicon.png'),path.join(root,'dist/favicon.png'));
console.log('Standalone build',Math.round(Buffer.byteLength(html)/1024),'KiB');
