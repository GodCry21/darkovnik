# Dárkovník

React + Vite web pro GitHub Pages, Google OAuth přes Google Identity Services a Google Apps Script backend s Google Sheets.

## Trvalé přihlášení

- Při prvním vstupu uživatel klikne na Google přihlášení. Google vydá krátkodobý ID token, který Apps Script ověří přes `oauth2.googleapis.com/tokeninfo` včetně audience, issuer, expiration a ověření e-mailu.
- Apps Script vytvoří náhodný **30denní aplikační session token**. Do listu `Sessions` uloží jen SHA-256 hash, uživatele a vypršení.
- Prohlížeč uloží session token do `localStorage` pod klíčem `darkovnik_session_v1`. Po obnovení stránky automaticky zavolá `dashboard` a pokračuje bez nového Google přihlášení.
- Odhlášení smaže `localStorage` a zneplatní relaci v `Sessions`.
- Token je přístupný JavaScriptu. Pro veřejnou aplikaci je důležitá ochrana proti XSS, HTTPS a bezpečné zacházení s přístupem k Apps Scriptu. Nelze zde použít skutečné `HttpOnly` cookie z GitHub Pages bez dalšího serveru. Při sdíleném počítači se odhlašujte.

## 1. Google Sheets + Apps Script

1. Založte projekt na https://script.google.com/ a vložte obsah `apps-script/Code.gs` do `Code.gs`.
2. Vytvořte HTML soubor s názvem `Bridge` a vložte do něj `apps-script/Bridge.html`.
3. Projekt nastavení → **Script properties**:
   - `GOOGLE_CLIENT_ID` = vaše OAuth webové Client ID (např. `123...apps.googleusercontent.com`).
   - `FRONTEND_ORIGIN` = přesný origin frontendové stránky, např. `https://uzivatel.github.io` (bez lomítka a cesty repozitáře).
   - `APP_URL` = úplná URL aplikace, např. `https://uzivatel.github.io/darkovnik/`.
4. Ručně spusťte funkci `setup()` a potvrďte potřebná oprávnění. V protokolu se objeví odkaz na vytvořený Google Sheets dokument. Stávající sešit se při opakovaném spuštění nevymaže.
5. Nasadit → Nové nasazení → **Webová aplikace** → Spouštět jako **já** → Kdo má přístup: **kdokoli**. Zkopírujte `/exec` URL.
6. V editoru **Apps Script** po každé změně serverové části nasaďte **novou verzi** webové aplikace.

⚠️ Apps Script poběží vaším oprávněním. Backend musí ověřit relaci a kontrolovat oprávnění ke každé operaci; nikdy nevydávejte adresu Sheets ani tokeny v klientské aplikaci.

## 2. Google Cloud OAuth

1. Google Cloud Console → APIs & Services → Credentials → vytvořte nebo použijte existující OAuth 2.0 **Web application** Client ID.
2. Do *Authorized JavaScript origins* přidejte origin GitHub Pages, např. `https://uzivatel.github.io`. Při lokálním testu i `http://localhost:5173`.
3. Příslušnou OAuth consent screen nastavte na publikovanou, nebo přidejte testovací uživatele. Používáme Google Identity Services ID token, ne přístup ke Gmailu uživatele.
4. Stejné Client ID vložte do Apps Script Script properties i do `VITE_GOOGLE_CLIENT_ID`.

## 3. React

Vyžaduje Node.js 20+.

```bash
npm install
cp .env.example .env
# nastavte VITE_GOOGLE_CLIENT_ID a VITE_GAS_URL
npm run dev
```

V souboru `.env`:

```
VITE_GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
VITE_GAS_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

Pro GitHub Pages vytvořte repozitář, nahrajte projekt a v `vite.config.js` zkontrolujte `base` odpovídající názvu repozitáře. Sestavte `npm run build` a zveřejněte adresář `dist` přes GitHub Pages / GitHub Actions. Do GitHub Actions konfigurace sestavení nastavte dvě veřejné build proměnné `VITE_GOOGLE_CLIENT_ID` a `VITE_GAS_URL`. **VITE_ proměnné jsou veřejné**, nevkládejte do nich tajné klíče.

## 4. Připomínky

V Apps Script vytvořte časově spouštěný trigger funkce `sendReminders` (např. každý den dopoledne). Trigger se spouští oprávněním vlastníka Apps Scriptu a používá kvóty služby MailApp.

## Technická omezení a testy

- Apps Script webová aplikace běží jako iframe. Některé prohlížeče / blokátory mohou iframe nebo přístup k Google službám blokovat. Před použitím v rodině otestujte Chrome, Safari na iOS a Android.
- Při testování nelze spoléhat na to, že Google Apps Script a GitHub Pages poběží na stejné doméně. Komunikace je provedena omezeným `postMessage` bridge s kontrolou originu.
- `localStorage` není synchronizováno mezi zařízeními ani prohlížeči; na každém zařízení proběhne jedno přihlášení zvlášť.
- Automatické získání obrázku/ceny z e-shopů je jen best effort (stránky mohou scraping blokovat).
- Google Sheets a Apps Script mají kvóty; pro velký veřejný provoz je vhodnější databáze a standardní backend.
- Lokální `npm run build` a end-to-end nasazení je nutno ještě ověřit; v prostředí, kde byl balíček vytvořen, nebylo možné instalovat npm závislosti.
