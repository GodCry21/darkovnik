# Dárkovník v4 – čistý vývojový projekt

React 18 + Vite + Google Identity Services + Google Apps Script + Google Sheets.

## Co aplikace umí
- Google OAuth a dlouhodobé relace bez ukládání Google tokenu do prohlížeče
- Skupiny, pozvánky, role admin/člen, obrázek a popis skupiny
- Přání, sdílení do skupin, rezervace a nákupy po kusech, vrácení rezervace
- Kalendář (měsíc a seznam): narozeniny z profilů, jmeniny a významné svátky z tabulky NameDays, ruční události a vypočítané Velikonoce
- Jmeniny s alternativami jmen, události `isHoliday`, zvýrazněné dárkové svátky `isGifted`
- Historie oznámení, připomínky e-mailem pomocí časových triggerů
- Responzivní rozhraní, instalovatelná PWA bez offline změn databáze

## Spuštění

Viz [INSTALACE-V4.md](INSTALACE-V4.md).

## Bezpečnost
- `GOOGLE_CLIENT_ID` a `FRONTEND_ORIGIN` jsou v Apps Script Properties.
- OAuth ID token ověřuje server; dlouhodobá relace se v Sheets ukládá jako SHA-256 hash.
- Neschovávejte bezpečnostní pravidla pouze do Reactu.
- Nevkládejte do GitHubu OAuth Client Secret, autentizační tokeny, obsah Google Sheets ani soukromé e-maily.
- Změny v Google Sheets nepodporují bezpečný offline zápis.

## GitHub Pages

Projekt používá Vite `base: './'`, takže funguje pod `/darkovnik/`. Nastavte GitHub Actions s proměnnými `VITE_GAS_URL` a `VITE_GOOGLE_CLIENT_ID`.
