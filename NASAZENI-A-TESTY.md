# Dárkovník – Figma frontend + existující Apps Script backend

## Co je v balíčku

- `src/LiveApp.tsx` – nové React rozhraní založené na Figma návrhu a skutečných datech.
- `src/api.ts` – komunikace s Google Apps Script, lokální uživatelská cache, WebP upload.
- `src/index.css` – převzatý design Figmy a doplňkové responzivní styly.
- `src/Icon.tsx` – původní SVG ikony z návrhu Figmy.
- `apps-script/Code.gs` – stávající backend s aktualizací cachování dashboardu.
- `apps-script/Bridge.html`, `apps-script/appsscript.json` – serverový komunikační most a manifest.
- `.github/workflows/deploy.yml` – automatické nasazení GitHub Pages z větve main.
- `design-reference/FigmaPrototype.tsx` – původní nepřipojený prototyp, není používán aplikací.
- `dist/index.html` – samostatný HTML soubor sestavený pro lokální smoke test (bez produkčních konfiguračních proměnných).

## Nasazení – zachování stávajícího GitHub projektu

1. Zálohuj původní projekt. Složku `.git` zachovej.
2. Překopíruj zdroje z tohoto ZIPu do repozitáře, **nepřekopírovávej `node_modules`**.
3. Zachovej současné GitHub Actions variables `VITE_GOOGLE_CLIENT_ID` a `VITE_GAS_URL`.
4. Ověř, že v GitHub Settings → Pages je zdroj **GitHub Actions**.
5. V terminálu spusť `npm ci`, `npm run build` a následně `git add . && git commit -m "Dárkovník – Figma frontend" && git push origin main`.
6. Na GitHubu ověř úspěšný workflow `Deploy Darkovnik Figma`.
7. **V Google Apps Scriptu aktualizuj `Code.gs`** z ZIPu a nasaď novou verzi existujícího deploymentu. `Bridge.html` a `appsscript.json` zůstávají kompatibilní; při jakékoliv odlišnosti je synchronizuj také.
8. Stávající Google Sheets sešit ponech beze změny; není nutný reset ani migrace tabulek.
9. Ověř aplikaci se dvěma skutečnými Google účty: přidání přání, sdílení, rezervaci, anonymní zprávu a odpověď, uzavření/blokování, pozvánku, kalendář.

**Pozor:** Automatický push na GitHub nasazuje jen frontend. Backend se musí nasadit samostatně v Apps Scriptu. Nepřenášej do repozitáře soubor `.env` s případnými soukromými údaji ani OAuth Client Secret.

## Build

- Pro běžné lokální sestavení: `npm ci && npm run build` (Vite).
- Pro automatizované backendové testy: `npm test`.
- `npm run build:standalone` je pomocný build pro testování bez Vite. Vyžaduje lokálně nainstalované React UMD soubory a TypeScript; **nepoužívej jeho nepřekonfigurovaný výstup jako produkční deploy**.

## Výkon a filtrování dat

Google Sheets nepodporuje automaticky indexované dotazy `WHERE userId = ...` jako relační databáze. `dashboard()` už nyní filtruje viditelná data podle členství a vlastníka ještě na serveru, ale při cache miss čte několik celých listů.

Nově backend po ověření uživatele zkusí serverovou `CacheService` pro odpověď dashboardu konkrétního uživatele, s TTL 90 sekund. Klíč obsahuje ID uživatele a globální verzi dat. Při změně relevantních tabulek se verze změní a stará cache se nepoužije. Odpovědi nad 90 kB se nekacheují. Rezervace zůstávají ověřované atomicky na serveru.

Frontend rovněž používá lokální cache při opakovaném otevření. Historie zpráv se načítá až při otevření konverzace; nepřenáší se v dashboardu. Nepřečtené zprávy se aktualizují samostatně.

Pro větší provoz se doporučuje měřit latenci `dashboard()`, počet přečtených řádků a dobu souběžných rezervací. Při výrazném růstu `Messages`, `Reservations` a `Shares` může být vhodnější databáze s indexy (např. Firestore nebo PostgreSQL). Sto zaregistrovaných uživatelů samo o sobě problém nepředstavuje, ale sto současných požadavků nelze bez zátěžového testu garantovat.

## Co bylo otestováno

- 12 integračních testů backendu na simulovaném Google Sheets úložišti – PASS.
- Vlastní sestavení HTML z React zdrojů pomocí TypeScript transpileru – PASS.
- Prohlížeč Chromium: rozložení 390 px a 1366 px, průchody hlavní navigací – PASS bez JavaScriptových chyb.
- Otevření a zavření formuláře přání na mobilu i desktopu – PASS.
- Standardní Vite produkční build v tomto izolovaném prostředí nešel dokončit kvůli chybějící platformní závislosti Rollupu; GitHub Actions jej musí ověřit po `npm ci` na Linuxu.
- Živé Google OAuth, Sheets, Drive a e-maily nebyly v tomto prostředí otestovány.

## Známá omezení

- Administrační zpracování nahlášených konverzací zatím není samostatnou obrazovkou; hlášení se ukládá do `MessageReports`.
- Načítání a ukládání obrázků až 8 MB podléhá paměti zařízení a skutečným limitům Apps Scriptu; extrémně velký vstupní soubor může skončit chybou při dekódování.
- Design respektuje hlavní strukturu původní Figmy, ale nejde o pixelově přesnou kopii každého detailu a interakčního stavu.
- Žádná offline fronta zápisů; offline jsou dostupná jen naposledy uložená data.
