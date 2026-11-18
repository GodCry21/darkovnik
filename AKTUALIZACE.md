# Dárkovník v4.2 – nasazení a změny

Tento balíček nahrazuje čistou v4. Jde o vývojovou verzi; data se nemažou automaticky.

## Před změnou

Použij adresář stávajícího Git repozitáře (`darkovnik`), **ponech `.git` a případný `.env`**. Přepiš `src`, `public`, `apps-script`, `index.html` a konfigurační soubory z tohoto balíčku. `node_modules` ani `dist` nekopíruj, vytvoří se při instalaci a buildu.

## Apps Script

1. Vlož **oba soubory** `apps-script/Code.gs` a `apps-script/Bridge.html` do existujícího Apps Script projektu. `Bridge.html` je nezbytné, protože rozšiřuje seznam povolených metod (`ownGiftStatuses`, `cancelInvite`).
2. Struktura listů se nemění. Funkce `createFreshDatabaseV4` a `setup()` **nejsou potřeba**, pokud již máš čisté tabulky v4.
3. Otevři Deploy → Manage deployments → tužka → New version → Deploy. Zůstává stejné `/exec` URL.
4. Zkontroluj funkci `setupTriggers()` (pro odesílání upozornění) a Script Properties `APP_URL`, `SHEET_ID`, `GOOGLE_CLIENT_ID`, `FRONTEND_ORIGIN`.

## Frontend

V terminálu v kořeni svého Git repozitáře:

```powershell
npm install
npm run build
git status
git add .
git commit -m "Darkovnik v4.2 - UX a pozvanky"
git pull --rebase origin main
git push origin main
```

Pokud build nebo rebase selže, nepokračuj `push --force`.

## Co vyzkoušet

1. Založit skupinu → rovnou se otevře nastavení; pokud nemáš žádná přání, dialog sdílení se neotevře.
2. Pozvat nový i už existující Google účet → administrátor vidí čekající pozvánku; přijetí proběhne po obnovení přihlášené aplikace pozvaného nebo po jeho OAuth přihlášení. Pokud MailApp selže, zobrazí se varování.
3. Přidat přání → vybrat skupiny přes aktivní tlačítka; změnit množství přes + / −.
4. Přidat odkaz z Alzy nebo Datartu a kliknout „Načíst“. Některé obchody odpověď blokují, ruční zadání zůstává dostupné.
5. Moje přání → ověřit filtr již obdržených a vědomé odhalení souhrnného počtu rezervovaných / nakoupených kusů. Nezobrazují se jména kupujících.
6. Kalendář → přejít na libovolný rok a ověřit Velikonoční pondělí.
7. Zvon → ověřit malé výsuvné okno, kliknutí mimo něj a označení jako přečtené.
8. Na mobilu ověřit spodní navigaci a PWA po nové instalaci či obnovení cache.

## Omezení a bezpečnost

- Čtení produktových informací je best-effort HTML/JSON-LD metadata, není to partnerské API žádného e-shopu a nelze garantovat cenu či fotografii.
- Přihlášený vlastník může **výslovně odhalit** agregované počty kusů rezervováno / koupeno. Nikdy nevidí identitu kupujících. Rozhodnutí odkrýt může pokazit překvapení.
- Apps Script + Google Sheets zůstává hlavním faktorem odezvy. Změny vzhledu samy o sobě neodstraní latenci API; nedoporučujeme neověřeně cacheovat osobní rezervace napříč účty.
- Přímé prohlížečové push-notifikace nejsou součástí této verze; zvonek zobrazuje zprávy načtené z backendu.
