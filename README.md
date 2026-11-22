# Dárkovník – nový frontend podle Figmy

React + Vite frontend propojený přes iframe bridge s Google Apps Script a Google Sheets. Frontend používá strukturu, ikony a styly dodané Figmy; ukázková data původního Figma prototypu se nepoužívají.

**Nasazení, testy a omezení:** [NASAZENI-A-TESTY.md](./NASAZENI-A-TESTY.md)

## Lokálně

```bash
npm ci
cp .env.example .env
# vyplnit VITE_GAS_URL a VITE_GOOGLE_CLIENT_ID
npm run dev
```

## GitHub Pages

GitHub Actions workflow `.github/workflows/deploy.yml` používá `npm ci`, `npm run build` a publikuje `dist/`. Ve **Settings → Secrets and variables → Actions → Variables** vyplň `VITE_GAS_URL` a `VITE_GOOGLE_CLIENT_ID`.

## Apps Script

Nasaď `apps-script/Code.gs` jako aktualizaci existujícího deploymentu. Sešit databáze může zůstat stávající. `Bridge.html` přeposílá pouze povolené API metody z odpovídajícího původu.
