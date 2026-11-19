# Dárkovník V5 — změny a nasazení

## Připravené změny
- Nový design systém pro světlý/tmavý režim. Přepínač v záhlaví i na přihlašovací obrazovce, respektování systémového režimu při prvním spuštění.
- Kompaktnější responzivní layout pro telefony, tablety a desktop, změněné karty přání, barevné plochy a navigační prvky.
- Texty na hlavních obrazovkách zjednodušeny; cena vyžaduje nezáporné číslo, používá numerickou klávesnici, formát v kartách je v Kč.
- Neoznačitelný statický text, ale zachovaný výběr obsahu textových polí pro editaci.
- Dashboard se okamžitě obnoví z lokální cache pro dosavadní relaci a revaliduje se na pozadí. Na návrat na kartu a obnovené internetové spojení se data synchronizují, pokud od poslední úspěšné synchronizace uplynula minuta.
- Cache nejvýše 24 h, datový strop 2 MB; ukládání chráněné proti překročené kvótě; z cache se vynechávají vložené data:image obrázky. Při odhlášení se smaže cache relace. Stav odhalených rezervací vlastních přání se neukládá.
- Backend dashboard vytváří mapy uživatelů, přání, členů, sdílení a rezervací namísto opakovaných lineárních průchodů. Souběžné rezervace nadále kontroluje Apps Script s LockService.

## Nasazení (důležité)
1. V prostředí s Node.js spusťte `npm ci` a `npm run build`.
2. Nasadit vygenerovaný `apps-script/Index.html` a upravený `apps-script/Code.gs` (plus Bridge.html a manifest dle dosavadního návodu).
3. `apps-script/Index.html` z předchozí verze byl ze ZIPu odstraněn, aby se omylem nenasadilo staré UI. Soubor se vytváří build skriptem.
4. Pro Vite je potřeba VITE_GAS_URL a VITE_GOOGLE_CLIENT_ID podle `.env.example`.
5. Po nasazení otestujte na testovacích účtech přihlášení, pozvánky, nové přání, rezervaci, notifikace, mobilní přepínač režimů a případ bez připojení.

## Limity a další optimalizace
Toto není otestované produkční nasazení. V tomto prostředí nebylo možné spustit Vite/Rollup build, protože archiv obsahuje nekompletní platformní binárky a instalace závislostí nebyla dostupná. Byla úspěšně ověřena syntaxe JSX a Apps Scriptu.

Při 100 uživatelích je rychlost opakovaných návštěv s lokální cache dobrá, ale Apps Script `dashboard` nadále načítá kompletní jednotlivé tabulky. Pro větší množství darů a záznamů je vhodné přidat serverovou inkrementální synchronizaci, měření odezvy Apps Scriptu, paginační endpointy a případně přejít z Sheets na skutečnou databázi. Cache nesmí rozhodovat o dostupnosti dárku ani obcházet oprávnění.

Známá omezení: žádný automatický end-to-end test na různých prohlížečích; bez produkčních dat nelze garantovat přesný čas načítání, bez auditů přístupnosti nelze potvrdit plnou WCAG shodu. Lokální cache přání na sdíleném zařízení je soukromá jen v rámci zabezpečení profilu prohlížeče; bezpečnostní opatření mají vycházet z požadovaného modelu hrozeb.
