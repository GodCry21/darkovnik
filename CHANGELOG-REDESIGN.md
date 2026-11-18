# Dárkovník – první optimalizační a vizuální průchod

## Upraveno
- Sjednocené české formátování cen v Kč v kartách a sdílení (oddělovače tisíců, volitelné desetiny).
- Odstranění velké dekorativní ilustrace z úvodního přehledu a zkrácení redundantního textu.
- Umírněný vizuální systém: jemnější stíny, střídmější navigace, kompaktnější karty, sjednocené rádiusy a kontrasty.
- Čitelnější ovládání množství a jednoduchý indikátor načítání s konkrétním textem.
- Deduplicita souběžných dashboard požadavků; po mutaci vždy vynucené nové načtení.
- Backend čte u tabulek jen skutečně obsazené řádky a potřebné sloupce místo celého `getDataRange()`.

## Důležitá omezení
- Nejde o kompletní přepsání informační architektury ani plný audit výkonu v produkci.
- Není provedeno měření reálné odezvy Apps Scriptu ani E2E testy s přihlášeným účtem.
- Produkční build v tomto prostředí blokuje neúplný přibalený node_modules (chybí nativní modul Rollup); po rozbalení proveď `npm ci && npm run build`.
- U cen se předpokládá CZK; pokud budou podporovány další měny, přidej explicitní pole currency.
