# SwoleSheet

Personlig träningslogg som Google Apps Script-webapp med Google Sheets som
databas. All kod, alla data och all UI-text är på **svenska** — inklusive
fältnamn (`övning`, `målvikt`, `vila`, `notering`) och commit-meddelanden.

## Struktur

```
appscript/          ← ENDA levande koden
  Code.js           backend: Sheets-läsning, sessioner, PR-detektion, programimport
  JavaScript.html   frontend: all klientlogik i ett <script>-block (~2000 rader)
  Stylesheet.html   CSS
  Index.html        skal; drar in de två ovan via <?!= include('...') ?>
  appsscript.json   V8, tidszon Europe/Berlin, webapp access MYSELF
  .clasp.json       scriptId 1JgIUgXQKe6ihRvd8pc9sL8k6dloK5UdzzUNVjNmwFML3U6yIr7KcvBoi
test/
  backend_test.js   offline-svit mot Code.js (npm test)
  mock.js           fejkar window.google.script.run för frontend
  build-local.js    bygger test/app.html ur appscript/ (npm run local)
index.html          PWA-wrapper: iframe runt Apps Script-deployen, portrait-låst
manifest.webmanifest, sw.js, icon-*   ← PWA, hostas på GitHub Pages
```

Utanför repot, i förälderkatalogen, ligger `material/` (träningslitteratur som
underlag för programdesign). Filerna direkt i
`/Users/david/dev/swolesheet/` — `Code.js`, `Index.html`, `appsscript.json`,
`*.xlsx`, `*.csv` — är **arkiv från juni 2026**, före uppdelningen i
`appscript/`. Redigera dem aldrig.

## Programmens historik

`PROGRAMHISTORIK.md` samlar **varför** programmen ser ut som de gör: kedjan
Tungt → Block 1 → Cykel 2 → Bänk & Chins v2, besluten med datum och motiv,
verifierad progression ur loggen, öppna spår (axeln, greppet, mätpunkten i
vecka 5), materialet, och tidslinjen över alla Apps Script-versioner. Läs den
innan du föreslår programändringar — resonemangen är täta och ofta
kontraintuitiva (t.ex. varför primer-singeln ligger UNDER toppsetet).

Den rikaste kronologin är `clasp list-versions` från `appscript/`, inte git:
67 versioner mot 33 commits.

## Datamodell (Google Sheets)

| Flik | Roll |
|---|---|
| `Program` eller `Program: <Namn>` | ett program per flik. Bara `Program` heter "Tungt" (legacy-default) |
| `Logg` | ett set per rad |
| `Sessions` | ett pass per rad: `Pass-ID, Pass, Datum, Start-tid, Slut-tid, Notering, Program, Vecka, Cykel, Ändringar` |

Programflikens kolumner: `Vecka, Pass, Ordning, Övning, Set, Reps, Målvikt,
RIR, Vila, Notering`. **`RIR` och `Vila` är valfria** — `_programBundle` läser
dem via `r.colMap[...]` i stället för `_col()` och faller tillbaka på `''`, så
äldre flikar (t.ex. Cykel 2, som saknar `Vila`) fungerar oförändrat. Håll nya
kolumner valfria på samma sätt.

Vila sätts i importfunktionerna antingen per övning (`ex.vila`) eller per
segment (`ex.vilaSeg`), så ett toppset kan vila 4-5 min medan back-off-seten
på samma övning vilar 3.

Flera rader med samma `Ordning` + `Övning` blir **segment** av samma övning
(toppset + back-off med olika vikt). Frontend hanterar dem via `exSegments()`,
`segForSet()` och `segTarget()` i `JavaScript.html`.

Aktivt program, aktuell vecka (`week:<program>`) och cykelräknare
(`cycle:<program>`) ligger i `DocumentProperties`. Cykeln ökar när veckan
wrappar från sista till första.

## Konventioner

Kommentarerna förklarar **varför**, inte vad. Programimport-funktionerna
(`importBankChinsV2` m.fl.) bär långa daterade resonemang med loggdata och
motiveringar ur litteraturen — matcha den stilen, skriv inte kortfattade
engelska kommentarer.

Frontend har inget ramverk och inget byggsteg: `render()` i `JavaScript.html`
väljer vy och `render*`-funktionerna bygger DOM direkt. Serveranrop går via
`google.script.run`.

## Testning

```sh
npm test      # backend: stubbar Apps Script-globalerna, kör Code.js offline
npm run check # syntaxkoll av Code.js
npm run local # bygger test/app.html ur appscript/ och öppnar den
```

`test/backend_test.js` fejkar Sheets, `DocumentProperties` och `Session`, laddar
`appscript/Code.js` med `eval` och kör backend-vägarna: programlistning,
veckor/cykler, segmentgruppering, A/B-växlingen i benpasset, deload, sessioner
och PR-detektering. Radantalen från `importBankChinsCykel2`/`importBankChinsV2`
är medvetna regressionsvakter — ändrar du ett program ska siffran uppdateras
i samma commit, inte glida.

`test/app.html` är ett **byggartefakt** (gitignorerad). `test/build-local.js`
genererar den ur `appscript/Index.html` + `Stylesheet.html` + `JavaScript.html`
och skjuter in `test/mock.js`, som fejkar `window.google.script.run`. Bygg alltid
om i stället för att redigera `app.html` — den tidigare versionen var en
handkopia som tyst blev fyra månader gammal.

## Läsa livedata

`doGet` svarar med JSON i stället för appen när den anropas med `?export=<flik>`:

```sh
curl -H "Authorization: Bearer $TOKEN" \
  "https://script.google.com/macros/s/<@HEAD-deployment>/exec?export=Logg"
```

Token tas ur `~/.clasprc.json` (clasp-inloggningen; refresha mot
`oauth2.googleapis.com/token` när `expiry_date` passerat). Skyddet är
webbappens eget — deployen har `access: MYSELF`, så anropet kräver en
OAuth-token för ägarens konto. **Endast läsning**; skrivningar till
programflikarna går genom kod som pushas, aldrig genom en URL.

Använd `@HEAD`-deploymenten, inte den versionsfästa som PWA:n pekar på.

## Deploy

Apps Script pushas med `clasp push` från `appscript/`. Kräver
`npm i -g @google/clasp` + `clasp login`. PWA-wrappern hostas på GitHub Pages
(`traidmill.github.io/SwoleSheet`); `index.html` pekar på Apps Script-deployens
`/exec`-URL, så den måste uppdateras vid ny deploy-version.

Repot ägs av GitHub-kontot **`traidmill`**. Radslut ska vara **LF**
(`.gitattributes`) — repot kom från Windows och allt hade CRLF.
