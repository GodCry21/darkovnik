# Nasazení čistého Dárkovníku v4

## 1. Zdrojový kód

Přepište soubory `src/main.jsx`, `src/style.css`, `index.html`, `apps-script/Code.gs`, `package.json`, `vite.config.js` a celý adresář `public/` ve svém stávajícím projektu. Soubor `apps-script/Bridge.html` ponechte nebo nahraďte touto funkční verzí. Zachovejte `.git`, `.github/workflows/` a své lokální `.env` (nepatří do GitHubu). Smažte nepoužívaný `src/v3.css` a staré migrační návody.

## 2. Backend a čistá databáze

1. V Google Apps Scriptu vložte nové `Code.gs` a ověřte `Bridge.html`.
2. V nastavení Script Properties zachovejte `GOOGLE_CLIENT_ID`, `FRONTEND_ORIGIN`, `APP_URL`.
3. **Pokud chcete začít s prázdnými daty**, spusťte v editoru ručně `createFreshDatabaseV4()`. Tato funkce vytvoří nový Spreadsheet a nastaví `SHEET_ID` na jeho ID. **Původní Google Sheets zůstane zachován**, ale veškeré staré relace, účty, skupiny i přání budou v aplikaci nedostupné.
4. Pokud nechcete resetovat, spusťte `setup()` – ten vytvoří nové listy a nedestruktivně zkontroluje hlavičky. Pozor, nekompatibilní staré sloupce vyvolají chybu; pro čistou v4 použijte bod 3.
5. V Apps Scriptu nastavte `Deploy > Manage deployments > Edit > New version > Deploy`. URL `/exec` zůstává stejné.
6. Ručně spusťte `setupTriggers()` pro upozornění a připomínky.

## 3. NameDays

Nový sešit obsahuje hlavičky `date | names | isHoliday | isGifted` a všech 366 dní jako prázdnou šablonu. Do `names` napište jména oddělená čárkou. Pro každý významný svátek vytvořte **samostatný řádek**, například:

| date | names | isHoliday | isGifted |
|---|---|---|---|
| 12-24 | Adam,Adámek,Áda,Eva,Evička | FALSE | FALSE |
| 12-24 | Vánoce | TRUE | TRUE |
| 07-26 | Anna,Anička,Anča | FALSE | FALSE |

Významný svátek se zobrazí v nabídce skupiny až když má `isHoliday=TRUE`. Hodnota `isGifted=TRUE` zvýrazní očekávání dárku. Vánoce se **nezapínají automaticky** – vyberte je mezi významnými svátky ve správě skupiny. Volba `Vybrat všechny svátky` vybere pouze svátky z NameDays, nikoliv jmeniny.

## 4. Frontend a GitHub Pages

```powershell
npm install
npm run build
git add .
git commit -m "Darkovnik v4 clean"
git pull --rebase origin main
git push origin main
```

Ve workflow GitHub Actions ponechte `VITE_GAS_URL` a `VITE_GOOGLE_CLIENT_ID`. `dist/` nasazujte přes GitHub Pages. Pokud PWA drží starý obsah, zavřete aplikaci, znovu ji otevřete online a případně v nástrojích prohlížeče odregistrujte starý service worker.

## 5. Základní testy

1. Přihlásit Google účtem, zavřít prohlížeč a znovu otevřít.
2. Založit skupinu, nastavit výběr svátků, obnovit stránku a ověřit uložení.
3. Ověřit narozeniny z profilů a jmeniny z NameDays.
4. Přidat přání, rezervovat několik kusů z druhého účtu, označit část jako nakoupenou, zbývající vrátit.
5. Změnit rezervovaný dárek a zkontrolovat historii oznámení a trigger pro e-mail.
6. Přepnout kalendář / seznam, ověřit barevné rozlišení a česká data bez nul.
7. Otestovat rozhraní na mobilu a instalaci PWA.

## Omezení

Google Apps Script může mít při prvním spuštění vyšší latenci (cold start). PWA neslouží k offline úpravám. Obecná PWA instalace na iOS závisí na podpoře prohlížeče. E-shop metadata nemusí být na všech stránkách dostupná.
