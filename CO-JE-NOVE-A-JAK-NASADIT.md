# Dárkovník – aktualizace podle Figmy, listopad 2026

## Co je změněné
- **Formuláře:** oprava ztrácení fokusu při psaní. Dialog už při každé aktualizaci React state nevolá `.focus()` na svůj kontejner.
- **Přání:** široký dvousloupcový formulář na desktopu, celoobrazovkový mobilní formulář, náhled obrázku, skupiny, priority, numerická cena, množství, poznámka 1 000 znaků. Vstupní fotografie se zpracovává na WebP do 8 MB (příliš velké nebo nečitelné vstupy mohou selhat kvůli limitům zařízení).
- **Profil:** předělaná struktura podle Figmy, karta uživatele se statistikami, samostatné osobní údaje, volba světlého/tmavého/systémového režimu, změna fotografie, odhlášení.
- **Kalendář:** odlišení narozenin, jmenin, běžných svátků, dárkových svátků a vlastních událostí. Barvy se používají také u blížících se událostí; na mobilu jsou v mřížce tečky.
- **Zprávy:** při nové anonymní zprávě i při odpovědi se zapisuje oznámení do Alerts a zařadí se e-mail k odeslání. Zprávy neprozrazují příjemci identitu odesílatele.
- **Přihlášení:** indikátor mezi přihlášením a prvním dashboardem.
- **Nový účet:** jednoduchý jednorázový průvodce pro účet bez přání a skupin.
- **Oslovení:** známá česká jména se zobrazují v 5. pádu; u nerozpoznaných jmen se používá neutrální „Ahoj!“.

## Nasazení bez ztráty databáze
1. **Zálohujte** původní projekt a Sheets. V novém ZIPu jsou zdroje FE i BE; databázi neměňte.
2. **GitHub frontend:** do původní projektové složky zkopírujte nové soubory kromě `.git` (ten ponechte ze svého projektu). Ujistěte se, že GitHub Actions variables `VITE_GAS_URL` a `VITE_GOOGLE_CLIENT_ID` zůstaly nastavené. Spusťte `git add .`, `git commit -m "UI opravy a kalendar"`, `git push origin main`.
3. **Apps Script backend:** v existujícím Apps Script projektu nahraďte `Code.gs` z `apps-script/Code.gs`. Ověřte beze změny `Bridge.html` a manifest `appsscript.json` proti aktuálnímu nasazení. Při změně souborů použijte **Nasadit → Spravovat nasazení → Upravit → Nová verze → Nasadit** (zachová původní `/exec` URL).
4. **Vlastnosti skriptu:** zkontrolujte `SHEET_ID`, `GOOGLE_CLIENT_ID`, `FRONTEND_ORIGIN` a přidejte `APP_URL` = plná adresa vaší GitHub Pages aplikace (včetně cesty repozitáře).
5. **E-mailová fronta:** jednou spusťte `setupTriggers()` a autorizujte vyžadovaná oprávnění. `sendQueuedAlerts()` odesílá čekající e-maily v dávkách, takže oznámení na e-mail není okamžité. Ověřte ve správě Triggerů, zda běží.
6. Obnovte stránku tvrdým refreshem (`Ctrl+Shift+R`) a otestujte s **dvěma skutečnými účty** rezervaci, anonymní zprávu, příjem e-mailu a oznámení v aplikaci. E-mail zkontrolujte i ve spamu.

## Ověřené testy v tomto balíčku
- `npm test`: **13 backendových integračních testů** s in-memory emulací Google Sheets, včetně založení anonymní zprávy, vytvoření oznámení a zpracování e-mailové fronty.
- `npm run build:standalone`: úspěšná tvorba samostatného HTML souboru v `dist/index.html`.
- TypeScript/JSX transpilační diagnostika: 0 chyb, syntaktická kontrola Apps Scriptu: OK.

## Co zatím NENÍ živě ověřeno
- V tomto prostředí nelze testovat reálné Google OAuth/Sheets/Drive/MailApp proti vašemu účtu.
- Prohlížečové testy vykreslení byly blokovány zásadami testovacího prostředí; mobilní rozložení nebylo možné interaktivně ověřit. Vizuální kontrolu po nasazení je proto potřeba provést na telefonu a desktopu.
- Standardní `npm run build` je v dodaném `node_modules` blokován chybějící linuxovou nativní závislostí Rollupu. GitHub Actions provádí čisté `npm ci` a je nutné zkontrolovat výsledek.
- E-mailové doručení závisí na oprávněních a kvótách MailApp; upozornění se nemusí odeslat, pokud trigger není nastaven nebo kvóta nestačí.

## Struktura balíčku
- `src/` – React frontend.
- `apps-script/` – Google Apps Script backend.
- `.github/workflows/deploy.yml` – automatické nasazení GitHub Pages.
- `tests/` – testy backendu.
- `dist/` – samostatné sestavené HTML pro lokální ověření (GitHub Actions sestavuje znovu).

**Poznámka:** Starý `src/main.jsx` je v projektu historický soubor. Aktivní frontend je `src/LiveApp.tsx` přes `src/main.tsx`.
