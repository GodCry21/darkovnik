# Dárkovník – frontend + backend (vývojové předání)

**Zdroj:** skutečný backend Dárkovníku V6 + UX schválené v konverzaci + barevný a typografický systém z dodané Figmy. `design-reference/figma-make-source.zip` uchovává původní Figma Make export. Složky `src/` a `apps-script/` jsou skutečné zdrojové soubory, nikoli Figma mockup.

## Obsah

- `src/`: React frontend se skutečným voláním Apps Scriptu.
- `apps-script/Code.gs`: Google Apps Script backend.
- `apps-script/Bridge.html`: zabezpečený postMessage bridge s povolenými API metodami.
- `apps-script/appsscript.json`: manifest.
- `apps-script/Index.html`: vytvořený samostatný HTML build frontendu.
- `dist/`: samostatný HTML build + manifest + ikony.
- `tests/`: statické, backendové a browser smoke testy.
- `design-reference/`: původní Figma návrh.
- `NameDays-template.csv`: podklady pro kalendář.

## Postup prvního nasazení

1. Rozbal balíček do **nové** složky a zachovej zálohu původní aplikace. Vytvoř nebo otevři Google Cloud OAuth 2.0 Web Client ID. Mezi *Authorized JavaScript origins* přidej **přesný origin** hostovaného frontendu (např. `https://uzivatel.github.io`; bez cesty do repozitáře).
2. V novém Google Apps Script projektu vlož `Code.gs`, `Bridge.html`, `appsscript.json`. V *Project Settings → Script Properties* vytvoř `GOOGLE_CLIENT_ID` a `FRONTEND_ORIGIN` (např. `https://uzivatel.github.io`, nikoli celou adresu stránky). `FRONTEND_ORIGIN` musí odpovídat URL hostované aplikace.
3. V editoru Apps Script **jednou** spusť `createFreshDatabaseV6()`. Vytvoří nový Google Sheets sešit a nastaví `SHEET_ID`. **Původní sešit nesmaže.** Na automatické události můžeš doplnit jména a svátky v listu `NameDays` podle CSV.
4. Spusť `setupTriggers()` pro e-mailová upozornění a připomínky; vyžádá Google autorizaci. Ujisti se, že má Apps Script přístup ke Google Sheets, Drive a Mail.
5. V Apps Script nasazení vyber **Web app**, spouštěnou **jako vlastník (Execute as me)**; přístup musí umožnit použití iframe veřejně autentizovaným klientům. Pro autentizaci je na serveru ověřovaný Google ID token, další volání používají náhodný krátkodobě omezený session token. Zkopíruj URL `/exec`.
6. Ve složce frontendu vytvoř `.env` podle `.env.example` a nastav:

   ```env
   VITE_GOOGLE_CLIENT_ID=tvuj-web-oauth-client-id.apps.googleusercontent.com
   VITE_GAS_URL=https://script.google.com/macros/s/TVE_DEPLOYMENT_ID/exec
   ```

7. Na počítači s Node.js a npm spusť `npm ci`, `npm test` a `npm run build`. Publikuj obsah `dist/` (například přes GitHub Pages), nikoli zdrojové `.env`. **Samotný Apps Script `Index.html` není hlavní stránka aplikace**: `doGet` servíruje soubor `Bridge.html`; frontend běží na samostatném hostingu. Po změně `Code.gs` aktualizuj také nasazení Apps Scriptu novou verzí.
8. Ověř na **dvou různých Google účtech** vytvoření skupiny, pozvánky, sdílení, rezervace a anonymní zprávy. Potom otestuj třetí účet, který není členem skupiny (odmítnutí přístupu).

## Již vytvořený HTML build

V `dist/index.html` a `apps-script/Index.html` je skutečně sestavený samostatný HTML výstup (React, ReactDOM, ikony a CSS jsou vloženy přímo). **Není předvyplněn tvým OAuth Client ID ani URL nasazení.** Build slouží k ověření UI; bez těchto hodnot se úmyslně nepřihlásí. Pro ostré nasazení vždy preferuj vlastní `npm run build` po doplnění `.env`.

## Schválené chování

- Rezervace vlastních přání skryté, agregovaný stav se odhaluje pouze po výslovném kliknutí.
- Volitelná priorita přání, nepovinná číselná cena s `Kč` a českým formátováním.
- Zakladatel volí roli při pozvánce, pozvánka platí 30 dní, lze ji znovu odeslat.
- Automatické narozeniny/jmeniny/svátky; ruční pouze vlastní události (včetně editace).
- Bez internetu se dají prohlížet poslední uložená data, ne provádět zápisy.
- Poznámka nejvýše 1 000 znaků. Obrázky z lokálního souboru se komprimují na WebP maximálně 8 MB a nahrávají do Drive; vstupní velikost formulář pevně neomezuje.
- Anonymní zprávy ke konkrétním přáním i obecné; dvousměrné konverzace, blokování, nahlášení, limity spamu. Nepřečtené zprávy se kontrolují na pozadí.

## Testy skutečně provedené zde

- `node tests/verify.cjs` – **7 kontrol prošlo** (syntaxe Apps Script + React JSX, soulad API, požadavky a CSS).
- `node tests/backend.integration.cjs` – **12 integračních scénářů prošlo** na simulovaném Google Sheets backendu v paměti (skupiny, role, pozvánky, ceny, rezervace, anonymita, blokování, hlášení).
- `python tests/browser_smoke.py` – **UI prošlo v Chromium** na šířkách 320 px, 390 px a 1366 px s fiktivními daty, navigací, formulářem přání a bez horizontálního overflow. Test používá mockované úložiště, nikoli Google účty.
- `node scripts/portable-build.cjs` – **samostatný HTML build vytvořen**; odlišný postup od standardního Vite build. Standardní `npm run build` na tomto linuxovém stroji nedoběhl kvůli chybějícím nativním Rollup závislostem dodaného Windows `node_modules` a zablokovanému přístupu k npm registry.

## Známá omezení – důležité před veřejným spuštěním

1. **Živé Google OAuth, GAS, MailApp, DriveApp a Sheets nebyly dostupné k otestování.** Simulace není produkční bezpečnostní či zátěžový audit.
2. **Nejde o pixelově přesný převod všech obrazovek Figmy.** Frontend má její barevnou/typografickou identitu, ale vlastní funkční komponenty – část rozložení je odlišná od původního Figma mockupu.
3. Nahlášení zpráv se ukládají do `MessageReports`, **chybí moderátorský administrační panel pro jejich vyřizování**. Nejde o úplný proces moderace.
4. Příjemce zpráv nezjišťuje odesílatele z API, ale **anonymita nelze zaručit proti uhodnutí podle textu, kontextu nebo času**.
5. Google Drive obrázky jsou veřejně čitelné komukoliv s URL. V některých Workspace doménách je sdílení odkazem zakázané. Velké WebP mohou narazit na přenosové limity Apps Script iframe/`google.script.run` i pod 8 MB.
6. Google Sheets/Apps Script je stále omezení při vyšším počtu současných uživatelů a zpráv. 100 registrací samo o sobě není problém, 100 souběžných operací nelze bez zátěžových testů slíbit.
7. Frontend cache není plná offline synchronizační fronta. Při ztrátě připojení se zápisy blokují.

**Závěr:** Toto je spustitelný a částečně integračně ověřený zdrojový balíček FE+BE pro samostatné nasazení do vývojového prostředí. **Neoznačuj jej za produkčně ověřený** bez závěrečných živých E2E testů v Google prostředí.
