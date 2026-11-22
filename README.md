# Dárkovník – FE + BE

Kompletní vývojový zdrojový projekt React/Vite + Google Apps Script/Sheets s anonymními zprávami a nový responzivním UI inspirovaným dodanou Figmou.

**Začni dokumentem [PREDANI-A-NASAZENI.md](PREDANI-A-NASAZENI.md).** Obsahuje nastavení OAuth, přípravu nové databáze, postup nasazení, reálně provedené testy a omezení.

## Příkazy

```bash
npm ci
node tests/verify.cjs
node tests/backend.integration.cjs
npm run build
```

`dist/` obsahuje už připravený alternativní jednosouborový build bez nakonfigurovaného Google OAuth. Pro skutečné nasazení nastav `.env` podle `.env.example` a aplikaci znovu sestav.

## Struktura

- `src/` – funkční frontend napojený na API
- `apps-script/` – backend a HTML bridge
- `dist/` – HTML build a statické soubory
- `tests/` – automatizované kontroly a browser smoke testy
- `design-reference/` – původní export Figmy
