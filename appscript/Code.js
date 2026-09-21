const PROGRAM_SHEET = 'Program';
const LOGG_SHEET = 'Logg';
const SESSIONS_SHEET = 'Sessions';
const SESSION_HEADERS = ['Pass-ID', 'Pass', 'Datum', 'Start-tid', 'Slut-tid', 'Notering', 'Program', 'Vecka', 'Cykel', 'Ändringar'];
const TZ = Session.getScriptTimeZone();

// Flera program = en flik per program. En flik är ett program om den heter exakt
// 'Program' (legacy-default, visas som "Tungt") eller matchar 'Program: <Namn>'.
const PROGRAM_PREFIX = 'Program:';
const DEFAULT_PROGRAM_NAME = 'Tungt';
const ACTIVE_PROGRAM_KEY = 'activeProgram';
// Vecko-progression: programflikar kan ha en valfri 'Vecka'-kolumn (1..N).
// Aktiv vecka per program lagras som 'week:<programnamn>' i DocumentProperties.
const WEEK_KEY_PREFIX = 'week:';
// Cykelräknare per program ('cycle:<programnamn>'): ökas när veckan wrappar från
// sista till första — via auto-avancering eller manuell stegning förbi sista veckan.
const CYCLE_KEY_PREFIX = 'cycle:';

function doGet(e) {
  // ?export=<flik> → hela fliken som JSON i stället för appen. Läsning ENDAST.
  // Finns för att kunna analysera loggen utanför appen (blockutvärdering) utan
  // manuell xlsx-export. Skyddet är webbappens eget: deployen har access MYSELF,
  // så anropet kräver en OAuth-token för ägarens konto. Datum serialiseras till
  // ISO av JSON.stringify; klienten får tolka dem.
  const exportSheet = e && e.parameter && e.parameter.export;
  if (exportSheet) {
    let body;
    try {
      const r = _readSheet(String(exportSheet));
      body = { sheet: String(exportSheet), headers: r.headers, rows: r.rows };
    } catch (err) {
      body = { error: String(err && err.message || err) };
    }
    return ContentService.createTextOutput(JSON.stringify(body))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // createTemplateFromFile + evaluate krävs för att <?!= include(...) ?> ska köras
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('SwoleSheet')
    .setFaviconUrl('https://traidmill.github.io/SwoleSheet/icon-192-v4.png')
    // Tillåt iframe-inbäddning (Google Sites) — döljer Apps Script-bannern
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

// Server-side include av HTML-partial (Stylesheet.html, JavaScript.html).
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
// TILLFÄLLIG: återskapar fliken "Program: Bänk & Chins" med CYKEL 2 (designad
// 2026-07-10 ur cykel 1-loggen, se plan/artifact). Flera set med olika vikter =
// separata segment-rader (samma Ordning + Övning → grupperas i appen).
// Cykel 2-ändringar: ~14–16 set/pass för 60-min-pass (dips struken från Pass 1,
// superset B = spidercurl+reverse flyes; övrigt raka set med kort vila — superset A
// militär+sidolyft ströks 2026-07-26, david vill inte superset:a samma muskelgrupp),
// pump-bänk progressas via vikt i
// 15–18-repsfönstret, spidercurl på reps (fast stång 30 kg), marklyft med
// viktprogression. V1 försiktig återinkörning, V3 toppar över cykel 1.
//
// ÄNDRAT 2026-08-13 — vecka 3 och 4 skrivna om, veckorna 1–2 orörda:
// Blocket kördes på RIR 0 från vecka 2 (loggen: "Rir 0-1", "0 rir", "inte en
// chans till 8", arg högeraxel) och benpasset kraschade 8/8. V3 nedsatt så
// blocket kan AVSLUTAS i stället för testas: bänkens 122,5-trea struken —
// AMRAP:en på 112,5 körs färsk och blir mätpunkten som sätter nästa program;
// knäböj 112,5→102,5 och marklyft 137,5→127,5 på RIR 3.
// V4-deloaden vänd rätt enligt Helms (TMaSP s. 65–66): tidigare sänktes VIKTEN
// ~12 % medan repsen behölls. Nu tvärtom — vikten står kvar, ett till två set
// bort per övning och repsmålet ner två. Undantaget är knäböj och marklyft,
// där vikten sänks mer än Helms skulle: där är ryggen begränsningen och
// deloadens jobb är återhämtning, inte stimulans.
function importBankChinsCykel2() {
  const SHEET = 'Program: Bänk & Chins';
  const headers = ['Vecka', 'Pass', 'Ordning', 'Övning', 'Set', 'Reps', 'Målvikt', 'RIR', 'Notering'];
  // wk[i] = veckans segment (array). Segment = [Set, Reps, Målvikt(null=tom), RIR(null=tom), Notering].
  // null som vecka = hoppa över (t.ex. ingen utfall i deload).
  const PROGRAM = [
    // --- Pass 1 — Tryck + chins (volym) · raka set (superset A struken 2026-07-26) ---
    { pass: 'Pass 1', ord: 1, övn: 'Bänkpress', wk: [
      [[4, '10', 97.5, 3, 'Volym, touch-and-go']],
      [[4, '10', 100, 2, 'Volym']],
      [[4, '10', 102.5, 1, 'Volym, tungt — reps får falla till 8–9']],
      [[2, '6', 100, 4, 'Deload: vikten kvar, volymen halverad. Ska kännas lätt']] ] },
    { pass: 'Pass 1', ord: 2, övn: 'Viktade chins', wk: [
      [[1, '5', 27.5, 2, 'Top-set'], [3, '8', 17.5, 2, 'Back-off']],
      [[1, '4', 32.5, 2, 'Top-set'], [3, '8', 17.5, 2, 'Back-off']],
      [[1, '4', 35, 1, 'Top-set'], [3, '8', 20, 1, 'Back-off']],
      [[1, '3', 30, 4, 'Deload top-set'], [2, '5', 17.5, 4, 'Deload back-off']] ] },
    { pass: 'Pass 1', ord: 3, övn: 'Militärpress', wk: [
      [[3, '6', 55, 2, 'Raka set, vila ~2 min']],
      [[3, '6', 57.5, 2, 'Raka set, vila ~2 min']],
      [[4, '5', 57.5, 1, 'Raka set, vila ~2 min']],
      [[2, '4', 55, 4, 'Deload: vikten kvar, färre set och reps']] ] },
    { pass: 'Pass 1', ord: 4, övn: 'Sidolyft', wk: [
      [[3, '15', 12, 1, 'Kort vila. Sista set myo-reps']],
      [[3, '12', 14, 1, 'Kort vila. Sista set myo-reps']],
      [[3, '12', 14, 0, 'Kort vila. RIR 0, sista set myo-reps']],
      [[2, '10', 12, 3, 'Deload. Inga myo-reps']] ] },

    // --- Pass 2 — Pump · vila 60–90 s · superset B = spidercurl + reverse flyes ---
    { pass: 'Pass 2', ord: 1, övn: 'Bänkpress', wk: [
      [[4, '15', 85, 2, 'Pump — vikt i 15–18-repsfönstret, reps får falla set för set']],
      [[4, '16', 85, 2, 'Pump — RIR styr, reps får falla set för set']],
      [[4, '15', 87.5, 1, 'Pump — håll RIR 1, reps får falla set för set']],
      [[2, '10', 85, 4, 'Deload: vikten kvar, volymen halverad']] ] },
    { pass: 'Pass 2', ord: 2, övn: 'Viktade chins', wk: [
      [[4, '8', 15, 3, '']], [[4, '9', 15, 2, '']], [[4, '8', 17.5, 2, '']], [[2, '6', 17.5, 4, 'Deload: vikten kvar']] ] },
    { pass: 'Pass 2', ord: 3, övn: 'Maskinrodd', wk: [
      [[3, '10', null, 2, 'Ställ vikt mot RIR (ca 103)']],
      [[4, '8', null, 2, 'Ställ vikt mot RIR (ca 105)']],
      [[4, '8', null, 2, 'Ställ vikt mot RIR (ca 108)']],
      [[2, '6', null, 4, 'Deload: samma vikt som v3, färre set och reps']] ] },
    { pass: 'Pass 2', ord: 4, övn: 'Spidercurl', wk: [
      [[3, '15', 30, 1, 'Superset B. Fast stång 30 kg — progression på reps. Sista set myo-reps']],
      [[3, '16', 30, 1, 'Superset B. Sista set myo-reps']],
      [[3, '18', 30, 0, 'Superset B. RIR 0, sista set myo-reps']],
      [[2, '12', 30, 3, 'Deload. Inga myo-reps']] ] },
    { pass: 'Pass 2', ord: 5, övn: 'Reverse flyes', wk: [
      [[3, '15', 10, 1, 'Superset B. Sista set myo-reps']],
      [[3, '13', 11, 1, 'Superset B. Sista set myo-reps']],
      [[3, '12', 11, 0, 'Superset B. RIR 0, sista set myo-reps']],
      [[2, '10', 10, 3, 'Deload. Inga myo-reps']] ] },

    // --- Pass 3 — Tung bänk + rygg · superset C = stångrodd + pushdown ---
    { pass: 'Pass 3', ord: 1, övn: 'Bänkpress', wk: [
      [[1, '5', 112.5, 2, 'Topp, touch-and-go'], [3, '8', 100, 2, 'Back-off']],
      [[1, '4', 117.5, 2, 'Topp'], [3, '8', 102.5, 2, 'Back-off']],
      [[1, 'AMRAP', 112.5, null, 'MÄTPUNKT — färsk, direkt efter uppvärmning. Höften kvar, avbryt vid TEKNIKFÖRFALL. 122,5-toppen struken'],
       [2, '8', 100, 2, 'Back-off (nedsatt från 105)']],
      [[1, '3', 105, 4, 'Deload topp: vikten nära v3, volymen halverad'], [1, '5', 95, 4, 'Deload back-off']] ] },
    { pass: 'Pass 3', ord: 2, övn: 'Viktade chins', wk: [
      [[5, '5', 25, 2, 'Medeltung']], [[5, '5', 27.5, 2, 'Medeltung']],
      [[3, '4', 30, 2, 'Nedskuret — blocket ska avslutas, inte testas']],
      [[2, '3', 27.5, 4, 'Deload: vikten kvar']] ] },
    { pass: 'Pass 3', ord: 3, övn: 'Viktade dips', wk: [
      [[3, '8', 20, 2, '']], [[3, '7', 22.5, 2, '']],
      [[3, '6', 22.5, 2, 'Nedskuret från 4×6 @ 27,5']],
      [[2, '5', 20, 4, 'Deload']] ] },
    { pass: 'Pass 3', ord: 4, övn: 'Stångrodd', wk: [
      [[3, '12', 65, 2, 'Kort vila, ~90 s']],
      [[3, '12', 67.5, 2, 'Kort vila, ~90 s']],
      [[3, '10', 65, 2, 'Kort vila, ~90 s']],
      [[2, '8', 62.5, 4, 'Deload']] ] },
    { pass: 'Pass 3', ord: 5, övn: 'Triceps-pushdown', wk: [
      [[3, '12', 40, 1, 'Sista set myo-reps']],
      [[3, '12', 42.5, 1, 'Sista set myo-reps']],
      [[2, '12', 40, 1, 'Inga myo-reps']],
      [[2, '10', 37.5, 3, 'Deload']] ] },

    // --- Pass 4 — Ben (submaximalt, diskbråck) · superset D = lårcurl + mage ---
    { pass: 'Pass 4', ord: 1, övn: 'Knäböj', wk: [
      [[3, '6', 105, 3, 'Submax'], [1, '12', 85, 3, 'Back-off']],
      [[4, '5', 110, 2, 'Submax'], [1, '12', 85, 2, 'Back-off']],
      [[3, '5', 102.5, 3, 'Submax — nedsatt från 112,5. RIR 3, avsluta blocket'], [1, '12', 80, 3, 'Back-off, lätt']],
      [[2, '5', 95, 4, 'Deload']] ] },
    { pass: 'Pass 4', ord: 2, övn: 'Marklyft', wk: [
      [[3, '6', 132.5, 3, 'Kontrollerat']], [[3, '6', 135, 2, 'Kontrollerat']],
      [[3, '5', 127.5, 3, 'Nedsatt från 137,5. RIR 3 — inget att trycka igenom']],
      [[2, '5', 115, 4, 'Deload']] ] },
    { pass: 'Pass 4', ord: 3, övn: 'Utfallssteg', wk: [
      [[2, '10', 65, 2, '']], [[2, '10', 70, 2, '']], [[2, '10', 60, 3, 'Nedskuret']], null ] },
    { pass: 'Pass 4', ord: 4, övn: 'Lårcurl', wk: [
      [[3, '12', 82.5, 2, 'Ställ vikt mot RIR. Kort vila']],
      [[3, '12', 85, 2, 'Ställ vikt mot RIR. Kort vila']],
      [[3, '10', 82.5, 2, 'Kort vila']],
      [[2, '10', 75, 4, 'Deload']] ] },
    { pass: 'Pass 4', ord: 5, övn: 'Cable crunch / Ab-wheel', wk: [
      [[3, '15', 36, 2, 'Bål']], [[3, '12', 38, 2, 'Bål']], [[2, '12', 36, 2, 'Bål']], [[2, '12', 36, 3, 'Deload']] ] }
  ];

  const rows = [];
  let idx = 0;
  PROGRAM.forEach(function (ex) {
    ex.wk.forEach(function (segs, i) {
      if (!segs) return;
      segs.forEach(function (s) {
        rows.push([i + 1, ex.pass, ex.ord, ex.övn, s[0], s[1],
          (s[2] === null ? '' : s[2]), (s[3] === null || s[3] === undefined ? '' : s[3]), s[4] || '', idx++]);
      });
    });
  });
  // Vecka → pass → ordning → insättningsordning (sista nyckeln bevarar segmentordning, t.ex. topp före back-off).
  rows.sort(function (a, b) {
    return (a[0] - b[0]) || String(a[1]).localeCompare(String(b[1])) || (a[2] - b[2]) || (a[9] - b[9]);
  });
  const out = rows.map(function (r) { return r.slice(0, 9); });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) sh = ss.insertSheet(SHEET);
  sh.clear();
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  // Formatera Reps som text så fritext (t.ex. "AMRAP") inte tolkas som datum/tal.
  sh.getRange(2, headers.indexOf('Reps') + 1, out.length, 1).setNumberFormat('@');
  sh.getRange(2, 1, out.length, headers.length).setValues(out);
  sh.setFrozenRows(1);
  return out.length;
}

// Skapar fliken "Program: Bänk & Chins v2" — efterföljaren till "Bänk & Chins",
// designad 2026-08-13 ur cykel 1–2-loggen. Skrivs till EGEN flik så att det
// gamla programmets sista pass + deload kan köras klart först.
//
// Grundval: kontrollerat 1RM bänk 130 kg, chins systemvikt-1RM ~152 (+60 adderat)
// vid 92 kg kroppsvikt. Båda härledda ur loggen, medvetet i underkant (Josefs
// regel: hellre för lågt inmatat max än för högt).
//
// BÄNKENS GRUNDVAL BEKRÄFTAD 2026-08-14. Cykel 2:s mätpunkt (AMRAP 112,5 i
// vecka 3) gav 5 reps, avbrutet med ~1 rep kvar för att inte tappa formen.
// Tre punkter ur loggen pekar nu åt samma håll: 5 @112,5 RIR 1-2 (30/7) ->
// ~134, 4 @117,5 RIR 0-1 (7/8) -> ~133, AMRAP 5 @112,5 (14/8) -> ~133.
// 130 ligger alltså 2-4 kg under skattningen, precis som avsett. INGA vikter
// ändrade - v2 körs som skriven. Notera att 14/8-mätningen togs i vecka 3 av
// ett block som gått på RIR 0, alltså trött; v2:s vecka 5 kommer efter en
// bättre uppbyggd fyra. Talen är jämförbara bara om stoppregeln är densamma,
// därav baslinjen inskriven i vecka 5:s AMRAP-notering.
//
// Designen i tre meningar: tre OLIKA bänkpass i stället för tre likadana
// (undulering är värd ~27 %/v på bänk hos tränade), bänkvolymen ner ~60 % men
// andelen arbete över 80 % upp från 0,8 till ~6 set/vecka, och EN tung
// chinsexponering i stället för tre. Vecka 6 = deload enligt Helms: volymen
// halveras, vikten står kvar.
//
// Passfördelning: Pass 1 = måndag (bänk lätt/teknik), Pass 2 = onsdag
// (bänk tungt), Pass 3 = fredag (chins tungt), Pass 4 = lör/sön (ben).
//
// REVIDERAT 2026-08-13 efter två externa coachgenomgångar:
//  - Måndagens breda chins -> viktade chins 4x3. Måndagsprincipen "tung stång,
//    lätta set" gällde bara bänken; nu gäller den båda huvudlyften. Sänker
//    dessutom måndagens dragreps från 24-36 till 12.
//  - Breda chins flyttade till onsdagen, 2 set. Onsdag och inte fredag för att
//    greppet ska vara utvilat till lördagens marklyft.
//  - Incline hantelcurl på måndagen: 2 -> 5 direkta bicepsset/vecka, och det
//    sträckta läget täcks (spidercurl tränar bara det förkortade).
//  - Primer-singel i toppsetens noteringar vecka 1-4. Singeln ligger ALDRIG
//    över dagens toppsetvikt - båda coacherna ville ha 90 %, vilket hade gjort
//    primern till dagens tyngsta stång och stulit från toppsetet. Vecka 5 körs
//    utan primer: mätpunkten måste vara protokollidentisk för att vara jämförbar.
//  - Dips: bytesvillkoret dokumenterat i förväg i vecka 1:s notering.
//
// GREPPET 2026-08-14 (efter axeldiagnosen nedan): David är 196 cm med långt
// vingspann och kör pekfingrarna på ringarna, dvs MAXIMALT TILLÅTET
// TÄVLINGSGREPP, med bulldog-grepp. Han uppger att dipsen går BETYDLIGT djupare
// än bänken utan att axeln känns - vilket avfärdar bottenläget/ROM som orsak.
// Kvar som skillnad mellan bänk och dips: abduktionsvinkeln. Ringgrepp på hans
// längd ställer överarmarna nästan rakt ut från bålen i botten; dipsen håller
// dem intill kroppen. Ringgreppet är optimerat för kortast bana och högst total
// i tävling - han tävlar inte, så han betalar axelkostnaden utan att få
// vinsten. Därför grepptest i vecka 1 (6x3 @ 100 RIR 5 är blockets bästa
// tekniktvätt-slot; att ändra grepp i vecka 4 före teknikprovet vore sämre).
// Cue: underarmarna lodräta i botten - skalar mot hans egna armlängder, till
// skillnad från centimetermått. Bulldog-greppet lämnas orört: en variabel i
// taget. KONSEKVENS: smalnas greppet är vecka 5:s AMRAP inte längre jämförbar
// med 14/8-baslinjen på 5 reps - noterat i det setets notering.
//
// AXEL 2026-08-14: höger axel strular fortfarande, men ENBART i bänkpressen -
// inte i chins, dips, lutande hantelpress eller rodd. Alltså inte en trasig
// axel utan något positionsspecifikt för bänken. Därför förtydligad cue i
// vecka 1:s bänknoteringar: "höften kvar" är en tävlingsregel och betyder INTE
// platt rygg - överryggen ska vara välvd med skulderbladen ihop och ner, annars
// hamnar axeln i djup extension i botten av varje rep. Dips lämnas KVAR trots
// bytesvillkoret: symtomet är bänkspecifikt, och att ta bort en symtomfri
// övning är att gissa. v2 avlastar dessutom redan axeln kraftigt - pumpbänken
// (4x15-16 @ 87,5, blockets repsmässigt tyngsta post) finns inte alls i v2,
// och face pull tillkommer.
// Accessoarernas ordning är satt så att den som stryks vid tidsbrist (bakifrån)
// är den som betyder minst för bänk och chins - därav sidolyft sist i alla pass.
function importBankChinsV2() {
  const SHEET = 'Program: Bänk & Chins v2';
  // 'Cykel' och 'Vila' är valfria kolumner — äldre programflikar saknar dem och
  // läses som förr. Cykeln låter EN flik bära flera varv av samma program med
  // olika vikter: cykel 1 är blocket som kördes 17 aug–18 sep 2026, cykel 2 är
  // progressionen skriven ur dess logg. Ny flik behövs först vid strukturändring.
  const headers = ['Vecka', 'Cykel', 'Pass', 'Ordning', 'Övning', 'Set', 'Reps', 'Målvikt', 'RIR', 'Vila', 'Notering'];
  // wk[i] = veckans segment (array). Segment = [Set, Reps, Målvikt(null=tom), RIR(null=tom), Notering].
  // ord = fast siffra ELLER array med en ordning per vecka (benpassets A/B-växling
  // byter plats på knäböj och marklyft varannan vecka).
  const CYKEL1 = [

    // ===== Pass 1 — MÅNDAG · bänk lätt/teknik =====
    // Tung stång, lätta set. Primar onsdagen 48 h senare. Ska aldrig trötta ut.
    { pass: 'Pass 1', ord: 1, övn: 'Bänkpress', vila: '2-3 min', wk: [
      [[6, '3', 100, 5, 'GREPPTEST denna vecka: in 1-2 fingrar från ringarna. Cue: UNDERARMARNA LODRÄTA i botten sett framifrån. Sex lätta set = blockets bästa tekniktvätt. Rör INTE bulldog-greppet - en variabel i taget. Överryggen välvd, skulderbladen ihop och ner; höften kvar betyder INTE platt rygg']],
      [[6, '3', 102.5, 5, 'Kontrollerad nedgång utan studs, explosiv press. Höften kvar']],
      [[6, '3', 105, 4, 'Ska fortfarande kännas lätt. Kvalitet före allt']],
      [[6, '3', 105, 4, 'Primar onsdagens tunga pass. Höften kvar']],
      [[5, '3', 102.5, 5, 'Ett set mindre - onsdag är testdag']],
      [[4, '3', 102.5, 5, 'Deload: vikten kvar, volymen halverad']] ] },
    // Samma princip som bänken ovan, applicerad på chinsen: belastad stång, lätta
    // set. +25 = systemvikt 117 = 77 % av systemmax 152, alltså RIR 4-5 på en trea
    // - exakt samma relativa position som bänkens 105 kg (81 % av 130).
    { pass: 'Pass 1', ord: 2, övn: 'Viktade chins (lätt)', vila: '2-3 min', wk: [
      [[4, '3', 20, 5, 'Tung stång, LÄTTA set - chinsversionen. Explosiv uppgång, kontrollerad ner. ALDRIG till failure']],
      [[4, '3', 22.5, 5, 'Ska kännas lätt. Kvalitet före allt']],
      [[4, '3', 25, 4, 'Primar fredagens tunga set']],
      [[4, '3', 25, 4, 'Aldrig en kamp - då är vikten fel']],
      [[3, '3', 22.5, 5, 'Ett set mindre - fredag är mätdag']],
      [[2, '3', 17.5, 5, 'Deload: vikten kvar, volymen halverad']] ] },
    { pass: 'Pass 1', ord: 3, övn: 'Maskinrodd', vila: '2 min', wk: [
      [[3, '10-12', null, 3, 'Brett grepp, HÖGA armbågar. Mellersta/nedre trapezius + romboider']],
      [[3, '10-12', null, 2, 'Brett grepp, höga armbågar']],
      [[3, '10-12', null, 2, '']],
      [[3, '10-12', null, 1, '']],
      [[3, '10-12', null, 1, '']],
      [[2, '8-10', null, 3, 'Deload']] ] },
    { pass: 'Pass 1', ord: 4, övn: 'Overhead tricepsextension', vila: '60-90 s', wk: [
      [[3, '10-15', null, 3, 'Långa tricepshuvudet - enda stället det tränas sträckt. Djup stretch']],
      [[3, '10-15', null, 2, 'Djup stretch i botten']],
      [[3, '10-15', null, 2, '']],
      [[3, '10-15', null, 1, '']],
      [[3, '10-15', null, 0, 'Isolation - failure är billigt här']],
      [[2, '8-13', null, 3, 'Deload']] ] },
    { pass: 'Pass 1', ord: 5, övn: 'Incline hantelcurl', vila: '60-90 s', wk: [
      [[3, '8-12', null, 3, 'Armen bakom bålen = sträckt läge. Spidercurl på fredag täcker bara det förkortade']],
      [[3, '8-12', null, 2, 'Full stretch i botten, ingen svikt']],
      [[3, '8-12', null, 2, '']],
      [[3, '8-12', null, 1, '']],
      [[3, '8-12', null, 0, 'Isolation - failure är billigt här']],
      [[2, '8-10', null, 3, 'Deload']] ] },
    { pass: 'Pass 1', ord: 6, övn: 'Reverse flyes', vila: '60-90 s', wk: [
      [[3, '12-20', null, 3, 'Hantel. Kör från samma bänk som triceps + sidolyft, kort vila']],
      [[3, '12-20', null, 2, '']],
      [[3, '12-20', null, 2, '']],
      [[3, '12-20', null, 1, '']],
      [[3, '12-20', null, 0, '']],
      [[2, '10-18', null, 3, 'Deload']] ] },
    { pass: 'Pass 1', ord: 7, övn: 'Sidolyft', vila: '60-90 s', wk: [
      [[3, '12-20', null, 3, 'Största symmetrivinsten - mediala delten får inget av bänk eller chins']],
      [[3, '12-20', null, 2, '']],
      [[3, '12-20', null, 2, '']],
      [[3, '12-20', null, 1, '']],
      [[3, '12-20', null, 0, '']],
      [[2, '10-18', null, 3, 'Deload']] ] },

    // ===== Pass 2 — ONSDAG · bänk tungt =====
    // Blockets enda tunga bänkexponering. Topp-set + back-off, Micha-modell:
    // repsen faller 5-4-3-2 medan vikten stiger. Back-off 2-5 % under toppen.
    { pass: 'Pass 2', ord: 1, övn: 'Bänkpress', vilaSeg: ['4-5 min', '3 min'], wk: [
      [[1, '5', 102.5, 3, 'TOPPSET. Sista uppvärmningen = 1 SINGEL på 102,5. Höften kvar = godkänt set. Överryggen välvd, skulderbladen ihop och ner - axelskyddet ligger där, inte i höften'],
       [3, '5', 100, 3, 'Back-off. TAK: sista setet max 1 RPE över första - annars är övningen slut']],
      [[1, '4', 107.5, 2, 'TOPPSET. Sista uppvärmningen = 1 SINGEL på 107,5. Höften kvar'],
       [4, '4', 105, 3, 'Back-off. Sista setet max 1 RPE över första']],
      [[1, '3', 112.5, 2, 'TOPPSET. Sista uppvärmningen = 1 SINGEL på 112,5. Höften kvar'],
       [4, '3', 107.5, 3, 'Back-off. Sista setet max 1 RPE över första']],
      [[1, '2', 117.5, 1, 'TOPPSET 90% - BLOCKETS TEKNIKPROV. Primer: 1 singel på 112,5 (UNDER toppsetet - testet ska vara färskt). Lyfter höften = underkänt, vikten står kvar'],
       [3, '3', 112.5, 2, 'Back-off. Blockets tyngsta post - stanna vid taket']],
      [[1, 'AMRAP', 112.5, null, 'MÄTPUNKT. BASLINJE 14/8: 5 reps, avbrutet med ~1 kvar. Samma stoppregel: avbryt vid TEKNIKFÖRFALL, INTE failure - annars mäter du stoppregeln, inte styrkan. OBS: har greppet smalnats sedan 14/8 är 5-repsbaslinjen INTE jämförbar - då är detta en NY nollpunkt och färre reps betyder inte tillbakagång. Tabellen gäller ändå. 5 reps=130, 6=132,5, 7=135, 8+=137,5'],
       [2, '4', 105, 3, 'Back-off']],
      [[1, '3', 100, 4, 'Deload: vikten ner, repsen ner, volymen halverad'],
       [2, '3', 92.5, 4, 'Deload']] ] },
    // Flyttade hit från måndagen när måndagens chins blev viktade. Enda breda
    // pronerade greppet i programmet - rodden ersätter det inte. Ligger på onsdag
    // och inte fredag för att greppet ska vara helt utvilat till lördagens marklyft.
    { pass: 'Pass 2', ord: 2, övn: 'Breda chins', vila: '2 min', wk: [
      [[2, '8-12', null, 3, 'Pronerat brett grepp, kroppsvikt. ALDRIG till failure']],
      [[2, '8-12', null, 3, 'Dubbelprogression: 12 reps på båda set -> lägg på 2,5-5 kg']],
      [[2, '8-12', null, 3, 'Stanna på RIR 3 - detta skyddar fredagens tunga set']],
      [[2, '8-12', null, 3, 'Stanna på RIR 3 även om det känns lätt']],
      [[2, '8-12', null, 3, 'Sista veckan före deload']],
      [[2, '8', null, 4, 'Deload']] ] },
    { pass: 'Pass 2', ord: 3, övn: 'Sälrodd', vila: '2 min', wk: [
      [[3, '10-12', null, 3, 'Brett grepp, höga armbågar. Noll ryggbelastning - bålen helt avlastad']],
      [[3, '10-12', null, 2, '']],
      [[3, '10-12', null, 2, '']],
      [[3, '10-12', null, 1, '']],
      [[3, '10-12', null, 1, '']],
      [[2, '8-10', null, 3, 'Deload']] ] },
    { pass: 'Pass 2', ord: 4, övn: 'Lutande hantelpress', vila: '2 min', wk: [
      [[3, '8-10', null, 3, 'Övre bröstet - regionen plan bänk underförsörjer']],
      [[3, '8-10', null, 2, '']],
      [[3, '8-10', null, 2, '']],
      [[3, '8-10', null, 1, '']],
      [[3, '8-10', null, 1, '']],
      [[2, '6-8', null, 3, 'Deload']] ] },
    { pass: 'Pass 2', ord: 5, övn: 'Face pull', vila: '60-90 s', wk: [
      [[2, '15-20', null, 3, 'Bakre delt + utåtrotation. Axelförsäkring']],
      [[2, '15-20', null, 2, '']], [[2, '15-20', null, 2, '']],
      [[2, '15-20', null, 1, '']], [[2, '15-20', null, 1, '']], [[2, '15-20', null, 3, 'Deload']] ] },
    { pass: 'Pass 2', ord: 6, övn: 'Sidolyft', vila: '60-90 s', wk: [
      [[3, '12-20', null, 3, '']], [[3, '12-20', null, 2, '']], [[3, '12-20', null, 2, '']],
      [[3, '12-20', null, 1, '']], [[3, '12-20', null, 0, '']], [[2, '10-18', null, 3, 'Deload']] ] },

    // ===== Pass 3 — FREDAG · chins tungt =====
    // Veckans enda tunga dragexponering. Vikterna satta mot loggen, inte mot tabell.
    // Måste gå att köra med benpasset dagen efter: ett set nära max, ingen tung
    // stångpress, ingen ryggbelastning (chins avlastar ryggraden).
    { pass: 'Pass 3', ord: 1, övn: 'Viktade chins', vilaSeg: ['4-5 min', '3 min'], wk: [
      [[1, '5', 27.5, 3, 'TOPPSET. Först i passet, färsk. Sista uppvärmningen = 1 SINGEL på +27,5. (Du gjorde detta 26/7 på RIR 2-3)'],
       [3, '6', 17.5, 3, 'Back-off. AVBRYT när farten tydligt sjunker - reps efter det försämrar utfallet']],
      [[1, '4', 32.5, 2, 'TOPPSET. Sista uppvärmningen = 1 SINGEL på +32,5. (Du gjorde detta 3/8)'],
       [3, '6', 20, 3, 'Back-off. Avbryt vid tydligt fartapp']],
      [[1, '3', 35, 2, 'TOPPSET. Sista uppvärmningen = 1 SINGEL på +35. (Du tog 5 reps här 10/8 - trean ska sitta)'],
       [3, '5', 22.5, 2, 'Back-off. Avbryt vid tydligt fartapp']],
      [[1, '2', 40, 1, 'TOPPSET - blockets nya mark. Systemvikt 132 kg. Primer: 1 singel på +35 (UNDER toppsetet)'],
       [3, '5', 25, 2, 'Back-off']],
      [[1, 'AMRAP', 32.5, null, 'MÄTPUNKT. 5 reps=+30 nästa block, 6=+32,5, 7=+35, 8+=+37,5'],
       [2, '6', 20, 2, 'Back-off']],
      [[1, '4', 22.5, 4, 'Deload'],
       [2, '5', 12.5, 3, 'Deload']] ] },
    // Ersatte bänkpress smalt grepp 2026-08-14. Smalbänken var en uttalad
    // platshållare ("finns för stångkontakt och triceps", "pressas aldrig
    // framåt"); militärpressen är det enda pressandet som gått framåt i loggen
    // och den som axeln inte reagerar på (10/8: "arg högeraxel" på bänken,
    // militärpress 57,5 samma pass utan kommentar). Taket ankrat mot hans
    // FAKTISKA rep-max, inte mot senaste veckan: 65x5/5/4 den 15/6 i det gamla
    // programmet. Restarten på 50 den 22/6 var ett programbyte, inte en
    // styrkeförlust - därför är 57,5 ett golv att bygga från, inte ett tak.
    // 62,5x6 i vecka 5 motsvarar ~65x5, dvs tillbaka till juniformen.
    { pass: 'Pass 3', ord: 2, övn: 'Militärpress', vila: '2-3 min', wk: [
      [[3, '6', 55, 3, 'Tillbaka i programmet. Ligger på fredag, inte måndag - måndagens enda jobb är att förbereda onsdagens tunga bänk. Stående, ingen ryggfjäder']],
      [[3, '6', 57.5, 3, 'Din bästa rena serie (3/8). Ska INTE vara en kamp']],
      [[3, '6', 60, 2, 'Förbi golvet. Klarar du inte 6 på alla tre set står 60 kvar även v4']],
      [[3, '5', 62.5, 2, 'Ny mark sedan juni. Faller repsen under 5 står vikten kvar']],
      [[3, '6', 62.5, 1, 'BLOCKETS MÅL: 62,5x6 ~ 65x5, dvs tillbaka på juninivån']],
      [[2, '5', 62.5, 4, 'Deload: vikten kvar, volymen halverad']] ] },
    { pass: 'Pass 3', ord: 3, övn: 'Viktade dips', vila: '2 min', wk: [
      [[3, '8', 15, 3, 'Kontrollerad ROM för axeln. BYT till kabelflyes/hantelpress om axeln gnäller ELLER om onsdagens toppset tappar kvalitet två veckor i rad']],
      [[3, '8', 17.5, 2, '']],
      [[3, '7', 20, 2, '']],
      [[3, '6', 22.5, 1, 'Stannar på RIR 1 - flerledsövning, aldrig failure (Helms)']],
      [[3, '8', 17.5, 1, '']],
      [[2, '8', 10, 3, 'Deload']] ] },
    { pass: 'Pass 3', ord: 4, övn: 'Spidercurl', vila: '60-90 s', wk: [
      [[2, '10-15', null, 3, 'Förkortat läge - incline curl på måndagen täcker det sträckta']],
      [[2, '10-15', null, 2, '']], [[2, '10-15', null, 2, '']],
      [[2, '10-15', null, 1, '']], [[2, '10-15', null, 0, 'Isolation - failure är billigt här']],
      [[2, '8-13', null, 3, 'Deload']] ] },
    { pass: 'Pass 3', ord: 5, övn: 'Sidolyft', vila: '60-90 s', wk: [
      [[3, '12-20', null, 3, '']], [[3, '12-20', null, 2, '']], [[3, '12-20', null, 2, '']],
      [[3, '12-20', null, 1, '']], [[3, '12-20', null, 0, '']], [[2, '10-18', null, 3, 'Deload']] ] },

    // ===== Pass 4 — LÖR/SÖN · ben =====
    // A/B-växling: knäböj och marklyft är ALDRIG tunga samma dag. Den primära
    // lyften går först (därav ordning-arrayen). Allt på RIR 3 - passet får
    // aldrig köras trött, och det är därför vikterna ligger under vad du klarar.
    { pass: 'Pass 4', ord: [1, 2, 1, 2, 1, 1], övn: 'Knäböj', vila: '3 min', wk: [
      [[4, '6', 100, 3, 'A-VECKA: primär, går först. ALLT på RIR 3. Värm upp: 5 min cykel + 2x15-20 lätta bensparkar']],
      [[3, '8', 90, 3, 'B-vecka: stödjande. RIR 3']],
      [[4, '6', 102.5, 3, 'A-VECKA: primär, går först']],
      [[3, '8', 92.5, 3, 'B-vecka: stödjande']],
      [[4, '5', 105, 3, 'A-VECKA: primär, går först']],
      [[2, '6', 90, 4, 'Deload']] ] },
    { pass: 'Pass 4', ord: [2, 1, 2, 1, 2, 2], övn: 'Marklyft', vila: '3 min', wk: [
      [[3, '5', 115, 3, 'Stödjande. Utan remmar: fler set, färre reps - greppet nollställs mellan seten']],
      [[5, '5', 122.5, 3, 'PRIMÄR - går först. Ta SÖNDAG om du kan, greppet behöver vila från fredagens chins']],
      [[3, '5', 117.5, 3, 'Stödjande']],
      [[5, '5', 127.5, 3, 'PRIMÄR - går först. Söndag om möjligt']],
      [[3, '5', 120, 3, 'Stödjande']],
      [[2, '5', 105, 4, 'Deload']] ] },
    { pass: 'Pass 4', ord: 3, övn: 'Gående utfall', vila: '2 min', wk: [
      [[3, '10-12/ben', null, 3, 'HANTLAR i händerna, inte stång på ryggen - bråkdel av kompressionen']],
      [[3, '10-12/ben', null, 3, 'Hantlar i händerna']],
      [[3, '10-12/ben', null, 2, '']],
      [[3, '10-12/ben', null, 2, '']],
      [[3, '10-12/ben', null, 2, '']],
      [[2, '8-10/ben', null, 3, 'Deload']] ] },
    { pass: 'Pass 4', ord: 4, övn: 'Cable crunch', vila: '60-90 s', wk: [
      [[3, '12-15', null, 3, 'Bål']], [[3, '12-15', null, 2, '']], [[3, '12-15', null, 2, '']],
      [[3, '12-15', null, 1, '']], [[3, '12-15', null, 1, '']], [[2, '10-13', null, 3, 'Deload']] ] }
  ];

// Skapar fliken "Program: Bänk & Chins v3" — efterföljaren till v2, designad
// 2026-09-21 ur v2:s femveckorslogg (337 set, 19 av 19 planerade pass körda).
//
// GRUNDVALEN FLYTTAD: BÄNK 130 -> 137,5. v2:s mätpunkt gav 10 reps på 112,5
// mot en baslinje på 5 den 14/8. Greppet var bekräftat oförändrat (maximal
// bredd) hela blocket, så mätningen är protokollidentisk och jämförbar - det
// är en äkta fördubbling, inte en ny nollpunkt. Epley ger 150 på tio reps,
// 146 på nio (noteringen sa "kanske tveksamt utförande på sista").
// 137,5 ligger 8-12 kg UNDER formlerna, av två skäl: 14/8-baslinjen togs i
// vecka 3 av ett block som gått på RIR 0, alltså trött, vilket överdriver
// förbättringen; och David tränar aldrig singlar, så neural vana vid maximal
// last saknas och ett testat max underpresterar regelmässigt mot formeln.
// Josefs regel avgör resten: hellre för lågt inmatat max än för högt.
// Kontroll på att 137,5 är konservativt: mot det maxet förutsäger Epley 6,7
// reps på 112,5. Han gjorde 10. Modellen slås alltså med tre reps.
//
// INGA SINGLAR. Davids beslut 2026-09-21: inget 1RM-test förrän det SKATTADE
// maxet passerat 160. Därför är AMRAP:en blockets enda mätinstrument, och
// därför måste protokollet vara identiskt mellan block - samma grepp, samma
// stoppregel vid teknikförfall, ingen primer i mätveckan.
//
// GREPPHYPOTESEN ÄR FALSIFIERAD. v2 föreskrev ett grepptest i vecka 1 på
// resonemanget att ringgreppet på 196 cm ger för stor abduktion och att David
// betalar tävlingsgreppets axelkostnad utan att tävla. Han körde maxbredd hela
// blocket ändå - och höger axel var HELT symtomfri i fem veckor, mot
// återkommande besvär i föregående block. Greppet var alltså inte orsaken.
// Det som löste axeln var det övriga v2 gjorde, och det rörs inte här:
// bänkvolymen ner ~73 % (133 -> 36 reps/vecka), cuen att "höften kvar" INTE
// betyder platt rygg, pumpbänken borttagen, face pull kvar. Inget grepptest
// i v3 - David kör maximal bredd och trivs med det.
//
// STRUKTUREN ÄR VALIDERAD OCH ORÖRD. v2 skar bänkvolymen 73 % och femdubblade
// arbetet över 80 % (1,2 -> 6,1 set/vecka) medan tonnaget föll från 12,2 till
// 3,8 ton. Mätpunkten steg ändå kraftigt, och varenda accessoar progresserade.
// Procentsatserna är identiska med v2:s - v3 är samma block mot ett rättat max:
//   toppset v1-v4 = 80 / 84 / 87 / 91 %   (v2 låg på 79 / 83 / 87 / 90 %)
//
// MÄTPUNKTEN FLYTTAD 112,5 -> 117,5. Tio reps mäter uthållighet snarare än
// styrka, och davids egen notering sa att tionde repet var tveksamt - står
// vikten kvar siktar nästa mätning på 12-13 reps, alltså fler reps i zonen
// där tekniken glider. 117,5 är 85 % och landar i 7-8-repsfönstret. Steget
// är +5 och inte +7,5 på Davids invändning att 120 kändes stressat; han möter
// dessutom mätdagen på en vikt han redan dragit tyngre (120x3 i vecka 3).
//
// ÄNDRINGAR UR v2:S LOGG, var och en med sin orsak:
//  - Knäböj -5 % OCH angiven vikt omskriven till ett TAK. Han träffade varje
//    set men noterade "0-1 rir", "1-2 rir" och "Snarare rir 1-2 på alla set"
//    där planen sa RIR 3. Benpasset ska vara återhämtningsneutralt - körs det
//    på RIR 0-1 gör det motsatsen, och ryggen är begränsningen. Maxet går inte
//    att härleda ur tre RIR-kommentarer (A-veckan pekar på 128, B-veckan på
//    116, och den senare hade "glömde benvärmare"), därför en rak sänkning
//    plus instruktionen att sänka hellre än att kämpa.
//  - Marklyft: planerad vikt är ett TAK. Vecka 3 togs 120 när planen sa 117,5,
//    och det var precis där ryggen sa ifrån ("Läskigt med ryggen, skärpning").
//    Veckan efter gick 5x5 @ 127,5 rent, så vikten i sig är inte farlig -
//    mönstret att överskrida planen på just marklyft är det som är dyrt.
//  - Spidercurl 10-15 -> 15-25 reps. Stången är fast på 30 kg och han har
//    progresserat på reps tills övningen inte längre gör det den var skriven
//    för: 24-25 reps med rest-pause i vecka 4-5. Intervallet matchar nu
//    verkligheten i stället för att beskriva en övning som inte körs.
//  - Gående utfall 3 -> 2 set. Han körde två redan i vecka 1 ("Körde bara två
//    set") och säger att tre är svårt att förmå sig till. Ett program som följs
//    slår ett som inte följs, och benpassets tyngd ligger i knäböj och marklyft.
//    Hantlar kvar som förstahandsval - han bedömer inte att stången påverkade
//    ryggen, men hantlar är fortfarande lägre kompression och han trivs med dem.
//  - Militärpressen är blockets försiktigaste post. 62,5x6 på ärlig RIR 1 ger
//    e1RM ~77, och då är 65x6 INTE möjligt i vecka 1. Rampen går därför
//    60 -> 62,5 -> 65 -> 65 -> 65 med REPSEN sist: vecka 5:s 3x6 @ 65 blir
//    blockets mål, ~e1RM 82. v2 gav +13 på militären, men det var återerövrad
//    mark efter juni-omstarten; härifrån går det långsammare.
//  - Deloadens chins rättad. v2 skrev "vikten kvar, volymen halverad" men
//    sänkte i praktiken +22,5 -> +17,5 på måndagen. Nu står vikten kvar.
//
// Passfördelning oförändrad: Pass 1 = måndag (bänk lätt/teknik), Pass 2 =
// onsdag (bänk tungt), Pass 3 = fredag (chins tungt), Pass 4 = lör/sön (ben).
// Inget pass växer - Pass 1 låg på 79 min median och Pass 3 på 92, och David
// bedömer att tiden går att hantera men inte att den tål mer.
// Accessoarernas ordning är satt så att den som stryks vid tidsbrist (bakifrån)
// betyder minst för bänk och chins - därav sidolyft sist i alla pass.
  const CYKEL2 = [

    // ===== Pass 1 — MÅNDAG · bänk lätt/teknik =====
    // Tung stång, lätta set. Primar onsdagen 48 h senare. Ska aldrig trötta ut.
    // 78-82 % av 137,5 — samma relativa position som v2:s 77-81 % av 130.
    { pass: 'Pass 1', ord: 1, övn: 'Bänkpress', vila: '2-3 min', wk: [
      [[6, '3', 107.5, 5, 'Tung stång, LÄTTA set. Max pressintention i varje rep. Överryggen välvd, skulderbladen ihop och ner - höften kvar betyder INTE platt rygg. Det var den cuen plus den sänkta volymen som tystade axeln i v2, inte greppet']],
      [[6, '3', 110, 5, 'Kontrollerad nedgång utan studs, explosiv press. Höften kvar']],
      [[6, '3', 112.5, 4, 'RIR 4 och inte 5 är en ärlig etikett, inte en skärpning - en trea här lämnar 3-4 reps, inte 5']],
      [[6, '3', 112.5, 4, 'Primar onsdagens tunga pass. Höften kvar']],
      [[5, '3', 110, 5, 'Ett set mindre - onsdag är mätdag']],
      [[4, '3', 110, 5, 'Deload: vikten kvar, volymen ner']] ] },
    // Måndagsprincipen gäller båda huvudlyften. +30 för en trea när han tog
    // +40x3 i v2:s vecka 4 - det ska kännas löjligt lätt.
    { pass: 'Pass 1', ord: 2, övn: 'Viktade chins (lätt)', vila: '2-3 min', wk: [
      [[4, '3', 25, 5, 'Tung stång, LÄTTA set - chinsversionen. Explosiv uppgång, kontrollerad ner. ALDRIG till failure']],
      [[4, '3', 27.5, 5, 'Ska kännas lätt. Kvalitet före allt']],
      [[4, '3', 30, 4, 'Primar fredagens tunga set']],
      [[4, '3', 30, 4, 'Aldrig en kamp - då är vikten fel']],
      [[3, '3', 27.5, 5, 'Ett set mindre - fredag är mätdag']],
      [[2, '3', 27.5, 5, 'Deload: vikten kvar, volymen ner. (v2 sänkte vikten här trots att texten sa annat - rättat)']] ] },
    { pass: 'Pass 1', ord: 3, övn: 'Maskinrodd', vila: '2 min', wk: [
      [[3, '10-12', null, 3, 'Brett grepp, HÖGA armbågar. Mellersta/nedre trapezius + romboider']],
      [[3, '10-12', null, 2, 'Brett grepp, höga armbågar']],
      [[3, '10-12', null, 2, '']],
      [[3, '10-12', null, 1, '']],
      [[3, '10-12', null, 1, '']],
      [[2, '8-10', null, 3, 'Deload']] ] },
    { pass: 'Pass 1', ord: 4, övn: 'Overhead tricepsextension', vila: '60-90 s', wk: [
      [[3, '10-15', null, 3, 'Långa tricepshuvudet - enda stället det tränas sträckt. Djup stretch']],
      [[3, '10-15', null, 2, 'Djup stretch i botten']],
      [[3, '10-15', null, 2, '']],
      [[3, '10-15', null, 1, '']],
      [[3, '10-15', null, 0, 'Isolation - failure är billigt här']],
      [[2, '8-13', null, 3, 'Deload']] ] },
    { pass: 'Pass 1', ord: 5, övn: 'Incline hantelcurl', vila: '60-90 s', wk: [
      [[3, '8-12', null, 3, 'Armen bakom bålen = sträckt läge. Här kan du lägga på vikt - gjorde 12 -> 14 kg under v2 utan problem']],
      [[3, '8-12', null, 2, 'Full stretch i botten, ingen svikt']],
      [[3, '8-12', null, 2, '']],
      [[3, '8-12', null, 1, '']],
      [[3, '8-12', null, 0, 'Isolation - failure är billigt här']],
      [[2, '8-10', null, 3, 'Deload']] ] },
    { pass: 'Pass 1', ord: 6, övn: 'Reverse flyes', vila: '60-90 s', wk: [
      [[3, '12-20', null, 3, 'Hantel. Kör från samma bänk som triceps + sidolyft, kort vila']],
      [[3, '12-20', null, 2, '']],
      [[3, '12-20', null, 2, '']],
      [[3, '12-20', null, 1, '']],
      [[3, '12-20', null, 0, '']],
      [[2, '10-18', null, 3, 'Deload']] ] },
    { pass: 'Pass 1', ord: 7, övn: 'Sidolyft', vila: '60-90 s', wk: [
      [[3, '12-20', null, 3, 'Största symmetrivinsten - mediala delten får inget av bänk eller chins']],
      [[3, '12-20', null, 2, '']],
      [[3, '12-20', null, 2, '']],
      [[3, '12-20', null, 1, '']],
      [[3, '12-20', null, 0, '']],
      [[2, '10-18', null, 3, 'Deload']] ] },

    // ===== Pass 2 — ONSDAG · bänk tungt =====
    // Blockets enda tunga bänkexponering. Topp-set + back-off, Micha-modell:
    // repsen faller 5-4-3-2 medan vikten stiger. Back-off 2-4 % under toppen.
    { pass: 'Pass 2', ord: 1, övn: 'Bänkpress', vilaSeg: ['4-5 min', '3 min'], wk: [
      [[1, '5', 110, 3, 'TOPPSET 80 %. Sista uppvärmningen = 1 SINGEL på 110. Höften kvar = godkänt set. Överryggen välvd, skulderbladen ihop och ner'],
       [3, '5', 107.5, 3, 'Back-off. TAK: sista setet max 1 RPE över första - annars är övningen slut']],
      [[1, '4', 115, 2, 'TOPPSET 84 %. Sista uppvärmningen = 1 SINGEL på 115. Höften kvar'],
       [4, '4', 112.5, 3, 'Back-off. Sista setet max 1 RPE över första']],
      [[1, '3', 120, 2, 'TOPPSET 87 %. Sista uppvärmningen = 1 SINGEL på 120. Höften kvar'],
       [4, '3', 115, 3, 'Back-off. Sista setet max 1 RPE över första']],
      [[1, '2', 125, 1, 'TOPPSET 91 % - blockets tyngsta stång. Primer: 1 singel på 120 (UNDER toppsetet). Lyfter höften = underkänt, vikten står kvar'],
       [3, '3', 120, 2, 'Back-off. Blockets tyngsta post räknat över 85 % - stanna vid taket']],
      [[1, 'AMRAP', 117.5, null, 'MÄTPUNKT, 85 %. INGEN primer - protokollet måste vara identiskt med förra blockets för att vara jämförbart. Avbryt vid TEKNIKFÖRFALL, inte failure - annars mäter du stoppregeln och inte styrkan. Du har dragit 120x3 i vecka 3, så vikten är känd mark. Omräkning: 4 reps=133, 5=137,5, 6=141, 7=145, 8=151, 9=153, 10=157'],
       [2, '4', 112.5, 3, 'Back-off']],
      [[1, '3', 105, 4, 'Deload: vikten ner, repsen ner, volymen halverad. Tunga dagen behöver mer avlastning än teknikdagen'],
       [2, '3', 97.5, 4, 'Deload']] ] },
    // Enda breda pronerade greppet i programmet - rodden ersätter det inte.
    // Ligger på onsdag för att greppet ska vara utvilat till helgens marklyft.
    { pass: 'Pass 2', ord: 2, övn: 'Breda chins', vila: '2 min', wk: [
      [[2, '8-12', null, 3, 'Pronerat brett grepp. Du la på +10 kg under v2 - fortsätt dubbelprogressionen därifrån. ALDRIG till failure']],
      [[2, '8-12', null, 3, 'Dubbelprogression: 12 reps på båda set -> lägg på 2,5-5 kg']],
      [[2, '8-12', null, 3, 'Stanna på RIR 3 - detta skyddar fredagens tunga set']],
      [[2, '8-12', null, 3, 'Stanna på RIR 3 även om det känns lätt']],
      [[2, '8-12', null, 3, 'Sista veckan före deload']],
      [[2, '8', null, 4, 'Deload']] ] },
    { pass: 'Pass 2', ord: 3, övn: 'Sälrodd', vila: '2 min', wk: [
      [[3, '10-12', null, 3, 'Brett grepp, höga armbågar. Noll ryggbelastning - bålen helt avlastad. Gick 40 -> 53 kg i v2, starta där du slutade']],
      [[3, '10-12', null, 2, '']],
      [[3, '10-12', null, 2, '']],
      [[3, '10-12', null, 1, '']],
      [[3, '10-12', null, 1, '']],
      [[2, '8-10', null, 3, 'Deload']] ] },
    { pass: 'Pass 2', ord: 4, övn: 'Lutande hantelpress', vila: '2 min', wk: [
      [[3, '8-10', null, 3, 'Övre bröstet - regionen plan bänk underförsörjer. VÄNSTER axel gav ifrån sig här i v2 vecka 2; höll du igen veckan efter gick det bra. Backa hellre ett steg än att jaga vikten']],
      [[3, '8-10', null, 2, '']],
      [[3, '8-10', null, 2, '']],
      [[3, '8-10', null, 1, '']],
      [[3, '8-10', null, 1, '']],
      [[2, '6-8', null, 3, 'Deload']] ] },
    { pass: 'Pass 2', ord: 5, övn: 'Face pull', vila: '60-90 s', wk: [
      [[2, '15-20', null, 3, 'Bakre delt + utåtrotation. Axelförsäkring - en av de fyra sakerna som tystade höger axel i v2. Stryks aldrig']],
      [[2, '15-20', null, 2, '']], [[2, '15-20', null, 2, '']],
      [[2, '15-20', null, 1, '']], [[2, '15-20', null, 1, '']], [[2, '15-20', null, 3, 'Deload']] ] },
    { pass: 'Pass 2', ord: 6, övn: 'Sidolyft', vila: '60-90 s', wk: [
      [[3, '12-20', null, 3, '']], [[3, '12-20', null, 2, '']], [[3, '12-20', null, 2, '']],
      [[3, '12-20', null, 1, '']], [[3, '12-20', null, 0, '']], [[2, '10-18', null, 3, 'Deload']] ] },

    // ===== Pass 3 — FREDAG · chins tungt =====
    // Veckans enda tunga dragexponering. Måste gå att köra med benpasset dagen
    // efter: ett set nära max, ingen tung stångpress, ingen ryggbelastning.
    // Räknat mot systemvikt-1RM ~154 kg (92 kg kroppsvikt + tillagt), härlett
    // ur v2:s AMRAP: +32,5 x 7 -> 124,5 x (1+7/30) = 153,6.
    { pass: 'Pass 3', ord: 1, övn: 'Viktade chins', vilaSeg: ['4-5 min', '3 min'], wk: [
      [[1, '5', 30, 3, 'TOPPSET. Först i passet, färsk. Sista uppvärmningen = 1 SINGEL på +30. Systemvikt 122 = 79 % av 154'],
       [3, '6', 20, 3, 'Back-off. AVBRYT när farten tydligt sjunker - reps efter det försämrar utfallet']],
      [[1, '4', 35, 2, 'TOPPSET. Sista uppvärmningen = 1 SINGEL på +35'],
       [3, '6', 22.5, 3, 'Back-off. Avbryt vid tydligt fartapp']],
      [[1, '3', 37.5, 2, 'TOPPSET. Sista uppvärmningen = 1 SINGEL på +37,5'],
       [3, '5', 25, 2, 'Back-off. Avbryt vid tydligt fartapp']],
      [[1, '2', 42.5, 1, 'TOPPSET - blockets nya mark. Systemvikt 134,5 = 87 %, exakt samma relativa position som +40 hade mot förra maxet. Du tog +40x3 när planen sa 2. Primer: 1 singel på +37,5 (UNDER toppsetet)'],
       [3, '5', 27.5, 2, 'Back-off']],
      [[1, 'AMRAP', 35, null, 'MÄTPUNKT. Ingen primer. Avbryt vid TEKNIKFÖRFALL, inte failure. Omräkning till nästa blocks referens: 5 reps=+32,5, 6=+35, 7=+37,5, 8+=+40'],
       [2, '6', 22.5, 2, 'Back-off']],
      [[1, '4', 25, 4, 'Deload'],
       [2, '5', 15, 3, 'Deload']] ] },
    // Blockets försiktigaste post. 62,5x6 på ärlig RIR 1 i v2 ger e1RM ~77,
    // och då är 65x6 inte möjligt i vecka 1. Repsen stiger sist.
    { pass: 'Pass 3', ord: 2, övn: 'Militärpress', vila: '2-3 min', wk: [
      [[3, '6', 60, 3, 'Stående, ingen ryggfjäder. Startar under där du slutade - rampen behöver utrymme, och v2:s 62,5x6 gick på ärlig RIR 1']],
      [[3, '6', 62.5, 2, 'Tillbaka på v2:s slutvikt, nu tidigt i blocket']],
      [[3, '5', 65, 2, 'Ny mark. Klarar du inte 5 på alla tre set står 65 kvar även v4']],
      [[3, '5', 65, 1, 'Samma vikt, hårdare. Repsen kommer i vecka 5']],
      [[3, '6', 65, 1, 'BLOCKETS MÅL: 65x6 ~ e1RM 82. Det är +5 på skattningen över sex veckor - v2 gav +13, men det var återerövrad mark efter juni-omstarten']],
      [[2, '5', 62.5, 4, 'Deload: volymen halverad']] ] },
    { pass: 'Pass 3', ord: 3, övn: 'Viktade dips', vila: '2 min', wk: [
      [[3, '8', 17.5, 3, 'Kontrollerad ROM. BYT till kabelflyes/hantelpress om axeln gnäller ELLER om onsdagens toppset tappar kvalitet två veckor i rad. Villkoret stod i v2 och behövde aldrig användas']],
      [[3, '8', 20, 2, '']],
      [[3, '7', 22.5, 2, '']],
      [[3, '6', 25, 1, 'Stannar på RIR 1 - flerledsövning, aldrig failure (Helms)']],
      [[3, '8', 20, 1, '']],
      [[2, '8', 12.5, 3, 'Deload']] ] },
    { pass: 'Pass 3', ord: 4, övn: 'Spidercurl', vila: '60-90 s', wk: [
      [[2, '15-25', null, 3, 'Förkortat läge - incline curl på måndagen täcker det sträckta. Intervallet höjt från 10-15: stången är fast på 30 kg och du gjorde 24-25 reps med rest-pause i v2. Det är en pumpavslutning, kör den som en sådan']],
      [[2, '15-25', null, 2, '']], [[2, '15-25', null, 2, '']],
      [[2, '15-25', null, 1, '']], [[2, '15-25', null, 0, 'Isolation - failure är billigt här']],
      [[2, '12-20', null, 3, 'Deload']] ] },
    { pass: 'Pass 3', ord: 5, övn: 'Sidolyft', vila: '60-90 s', wk: [
      [[3, '12-20', null, 3, '']], [[3, '12-20', null, 2, '']], [[3, '12-20', null, 2, '']],
      [[3, '12-20', null, 1, '']], [[3, '12-20', null, 0, '']], [[2, '10-18', null, 3, 'Deload']] ] },

    // ===== Pass 4 — LÖR/SÖN · ben =====
    // A/B-växling: knäböj och marklyft är ALDRIG tunga samma dag. Den primära
    // lyften går först (därav ordning-arrayen). Allt på RIR 3 - passet får
    // aldrig köras trött, för det är förutsättningen för att bänk och chins
    // ska kunna vara tunga. Angivna vikter är TAK, inte mål.
    { pass: 'Pass 4', ord: [1, 2, 1, 2, 1, 1], övn: 'Knäböj', vila: '3 min', wk: [
      [[4, '6', 95, 3, 'A-VECKA: primär, går först. Vikten är ett TAK - går inte RIR 3 på alla set, SÄNK. I v2 träffade du varje set men noterade RIR 0-2 där planen sa 3, och då gör benpasset motsatsen till vad det är till för. Värm upp: 5 min cykel + 2x15-20 lätta bensparkar']],
      [[3, '8', 85, 3, 'B-vecka: stödjande. RIR 3 på riktigt - sänk hellre']],
      [[4, '6', 97.5, 3, 'A-VECKA: primär, går först. Taket gäller']],
      [[3, '8', 87.5, 3, 'B-vecka: stödjande']],
      [[4, '5', 100, 3, 'A-VECKA: primär, går först']],
      [[2, '6', 85, 4, 'Deload']] ] },
    { pass: 'Pass 4', ord: [2, 1, 2, 1, 2, 2], övn: 'Marklyft', vila: '3 min', wk: [
      [[3, '5', 117.5, 3, 'Stödjande. ANGIVEN VIKT ÄR ETT TAK. I v2 togs 120 när planen sa 117,5 och det var precis där ryggen sa ifrån. Utan remmar: fler set, färre reps - greppet nollställs mellan seten']],
      [[5, '5', 125, 3, 'PRIMÄR - går först. Ta SÖNDAG om du kan, greppet behöver vila från fredagens chins']],
      [[3, '5', 120, 3, 'Stödjande. Taket gäller - ingen improviserad påökning']],
      [[5, '5', 130, 3, 'PRIMÄR - går först. Ny mark, +2,5 mot v2:s topp som gick rent. Söndag om möjligt']],
      [[3, '5', 122.5, 3, 'Stödjande']],
      [[2, '5', 107.5, 4, 'Deload']] ] },
    { pass: 'Pass 4', ord: 3, övn: 'Gående utfall', vila: '2 min', wk: [
      [[2, '10-12/ben', null, 3, 'HANTLAR i händerna, inte stång på ryggen - bråkdel av kompressionen. Nedskuret till 2 set: du körde två redan i v2 vecka 1, och ett program som följs slår ett som inte följs']],
      [[2, '10-12/ben', null, 3, 'Hantlar i händerna']],
      [[2, '10-12/ben', null, 2, '']],
      [[2, '10-12/ben', null, 2, '']],
      [[2, '10-12/ben', null, 2, '']],
      [[2, '8-10/ben', null, 3, 'Deload']] ] },
    { pass: 'Pass 4', ord: 4, övn: 'Cable crunch', vila: '60-90 s', wk: [
      [[3, '12-15', null, 3, 'Bål']], [[3, '12-15', null, 2, '']], [[3, '12-15', null, 2, '']],
      [[3, '12-15', null, 1, '']], [[3, '12-15', null, 1, '']], [[2, '10-13', null, 3, 'Deload']] ] }
  ];

  const CYKLER = [{ cykel: 1, program: CYKEL1 }, { cykel: 2, program: CYKEL2 }];

  const rows = [];
  let idx = 0;
  CYKLER.forEach(function (c) {
    c.program.forEach(function (ex) {
      ex.wk.forEach(function (segs, i) {
        if (!segs) return;
        // ord får vara en siffra (samma alla veckor) eller en array (en per vecka).
        const ord = Array.isArray(ex.ord) ? ex.ord[i] : ex.ord;
        segs.forEach(function (s, si) {
          // Vila sätts per ÖVNING (ex.vila) eller per SEGMENT (ex.vilaSeg) - toppsetet
          // vilar 4-5 min medan back-off-seten vilar 3, på samma övning.
          const vila = (ex.vilaSeg && ex.vilaSeg[si]) || ex.vila || '';
          rows.push([i + 1, c.cykel, ex.pass, ord, ex.övn, s[0], s[1],
            (s[2] === null ? '' : s[2]), (s[3] === null || s[3] === undefined ? '' : s[3]),
            vila, s[4] || '', idx++]);
        });
      });
    });
  });
  // Cykel → vecka → pass → ordning → insättningsordning (sista nyckeln bevarar
  // segmentordningen, topp före back-off).
  rows.sort(function (a, b) {
    return (a[1] - b[1]) || (a[0] - b[0]) || String(a[2]).localeCompare(String(b[2]))
      || (a[3] - b[3]) || (a[11] - b[11]);
  });
  const out = rows.map(function (r) { return r.slice(0, 11); });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) sh = ss.insertSheet(SHEET);
  sh.clear();
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  // Formatera Reps som text så fritext (t.ex. "AMRAP", "10-12/ben") inte tolkas som datum/tal.
  sh.getRange(2, headers.indexOf('Reps') + 1, out.length, 1).setNumberFormat('@');
  sh.getRange(2, 1, out.length, headers.length).setValues(out);
  sh.setFrozenRows(1);
  return out.length;
}


// --- helpers ---

function _readSheet(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Fliken "' + name + '" hittades inte.');
  const data = sheet.getDataRange().getValues();
  if (data.length < 1) return { headers: [], colMap: {}, rows: [], sheet: sheet };
  const headers = data[0].map(function (h) { return String(h).trim(); });
  const colMap = {};
  headers.forEach(function (h, i) { colMap[h] = i; });
  return { headers: headers, colMap: colMap, rows: data.slice(1), sheet: sheet };
}

function _col(colMap, name, sheetName) {
  const i = colMap[name];
  if (i === undefined) throw new Error('Kolumn "' + name + '" saknas i ' + sheetName + '-fliken.');
  return i;
}

function _dateKey(d) {
  return d instanceof Date ? Utilities.formatDate(d, TZ, 'yyyy-MM-dd') : String(d);
}

function _parseDate(str) {
  if (!str) return new Date();
  const parts = String(str).split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
}

function _passIdFromDate(d) {
  return Utilities.formatDate(d, TZ, 'yyyy-MM-dd HH:mm');
}

function _normalizePassId(v) {
  if (v === null || v === undefined || v === '') return '';
  if (v instanceof Date) return _passIdFromDate(v);
  // Sheets autokonverterar ibland id-strängen till ett datum trots '@'-format.
  // Ett tal är då en datumserie (dagar sedan 1899-12-30) — återskapa väggklockan
  // genom att tolka serien som UTC och formatera i UTC (tidszonsneutralt).
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    const ms = Math.round((v - 25569) * 1440) * 60000; // närmaste minut
    return Utilities.formatDate(new Date(ms), 'UTC', 'yyyy-MM-dd HH:mm');
  }
  // När en datumkonverterad cell formateras om till text skriver Sheets timmen
  // utan inledande nolla ("2026-08-03 9:38") medan _passIdFromDate ger "09:38".
  // Padda så att alla varianter landar i samma kanoniska form.
  const s = String(v).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2}) (\d):(\d{2})$/);
  if (m) return m[1] + ' 0' + m[2] + ':' + m[3];
  return s;
}

function _ensureTextColumn(sheet, columnName) {
  _ensureColumn(sheet, columnName);
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function (h) { return String(h).trim(); });
  const idx = headers.indexOf(columnName);
  if (idx < 0) return;
  // Format the entire data range of the column as plain text so date-like
  // strings (e.g. "2026-04-26 09:00") aren't auto-converted to Date numbers.
  const totalRows = sheet.getMaxRows();
  if (totalRows > 1) {
    sheet.getRange(2, idx + 1, totalRows - 1, 1).setNumberFormat('@');
  }
  // Repair already-corrupted rows: Date-värden, datumserietal (Date som lästs
  // genom '@'-format) och opaddade timmar — allt kanoniseras via _normalizePassId.
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const range = sheet.getRange(2, idx + 1, lastRow - 1, 1);
    const values = range.getValues();
    let needsRewrite = false;
    const newValues = values.map(function (row) {
      const v = row[0];
      if (v === '' || v === null) return [v];
      const norm = _normalizePassId(v);
      if (norm !== v) { needsRewrite = true; return [norm]; }
      return [v];
    });
    if (needsRewrite) range.setValues(newValues);
  }
}

function _ensureSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function _ensureColumn(sheet, columnName) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    sheet.getRange(1, 1).setValue(columnName).setFontWeight('bold');
    return;
  }
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function (h) { return String(h).trim(); });
  if (headers.indexOf(columnName) >= 0) return;
  sheet.getRange(1, lastCol + 1).setValue(columnName).setFontWeight('bold');
}

function _appendRowByHeader(sheet, valueByName) {
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const row = headers.map(function (h) {
    const key = String(h).trim();
    return key in valueByName ? valueByName[key] : '';
  });
  sheet.appendRow(row);
}

function _readLoggCols() {
  const r = _readSheet(LOGG_SHEET);
  return {
    r: r,
    cDatum: _col(r.colMap, 'Datum', LOGG_SHEET),
    cPass: _col(r.colMap, 'Pass', LOGG_SHEET),
    cÖvn: _col(r.colMap, 'Övning', LOGG_SHEET),
    cSetNr: _col(r.colMap, 'Set nr', LOGG_SHEET),
    cReps: _col(r.colMap, 'Reps', LOGG_SHEET),
    cVikt: _col(r.colMap, 'Vikt', LOGG_SHEET),
    cKomm: _col(r.colMap, 'Kommentar', LOGG_SHEET),
    cPassId: r.colMap['Pass-ID'],
    cProgram: r.colMap['Program']
  };
}

// Tillhör en Logg-rad det angivna programmet? Tom Program-cell (legacy) = default-programmet.
function _rowMatchesProgram(row, c, programName, defaultProgram) {
  const rowProg = (c.cProgram === undefined) ? '' : row[c.cProgram];
  return _normalizeProgram(rowProg, defaultProgram) === programName;
}

function _rowToSet(row, c) {
  return {
    setNr: Number(row[c.cSetNr]),
    reps: row[c.cReps],
    vikt: (row[c.cVikt] === '' || row[c.cVikt] === null) ? null : row[c.cVikt],
    kommentar: String(row[c.cKomm] || '')
  };
}

// Volympoäng för en uppsättning set: reps × vikt (kroppsvikt räknas som 1).
// Matchar sessionScore() i frontend så trendjämförelser blir konsekventa.
function _sessionScore(sets) {
  if (!sets || sets.length === 0) return 0;
  return sets.reduce(function (sum, s) {
    const w = (s.vikt === null || s.vikt === undefined || s.vikt === '') ? 1 : (Number(s.vikt) || 1);
    return sum + (Number(s.reps) || 0) * w;
  }, 0);
}

function _readSessionsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SESSIONS_SHEET);
  if (!sheet) return null;
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return { sheet: sheet, headers: [], colMap: {}, rows: [] };
  const lastCol = sheet.getLastColumn();
  const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = data[0].map(function (h) { return String(h).trim(); });
  const colMap = {};
  headers.forEach(function (h, i) { colMap[h] = i; });
  return { sheet: sheet, headers: headers, colMap: colMap, rows: data.slice(1) };
}

// --- helpers: program (flera program, en flik per program) ---

// Visningsnamn för en programflik. Bara 'Program' → DEFAULT_PROGRAM_NAME ("Tungt");
// 'Program: X' → 'X'. Returnerar null om bladet inte är en programflik.
function _programNameFromSheet(sheetName) {
  const name = String(sheetName).trim();
  if (name === PROGRAM_SHEET) return DEFAULT_PROGRAM_NAME;
  if (name.indexOf(PROGRAM_PREFIX) === 0) {
    const label = name.slice(PROGRAM_PREFIX.length).trim();
    return label || DEFAULT_PROGRAM_NAME;
  }
  return null;
}

// Alla programflikar i bladets flikordning: [{ name, sheetName }].
function _listPrograms() {
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  const result = [];
  sheets.forEach(function (sh) {
    const sheetName = sh.getName();
    const progName = _programNameFromSheet(sheetName);
    if (progName !== null) result.push({ name: progName, sheetName: sheetName });
  });
  return result;
}

// Programmet som tomma Program-celler (legacy-rader) tillhör: den bara 'Program'-fliken
// om den finns, annars första programflikens namn, annars DEFAULT_PROGRAM_NAME.
function _defaultProgramName() {
  const programs = _listPrograms();
  for (let i = 0; i < programs.length; i++) {
    if (programs[i].sheetName === PROGRAM_SHEET) return programs[i].name;
  }
  return programs.length ? programs[0].name : DEFAULT_PROGRAM_NAME;
}

// Visningsnamn → bladnamn. Faller tillbaka på PROGRAM_SHEET om namnet inte hittas.
function _programSheetName(programName) {
  const target = String(programName || '').trim();
  const programs = _listPrograms();
  for (let i = 0; i < programs.length; i++) {
    if (programs[i].name === target) return programs[i].sheetName;
  }
  return PROGRAM_SHEET;
}

// Normaliserar en Program-cell till ett visningsnamn. Tom cell (legacy) → default-programmet.
function _normalizeProgram(v, fallback) {
  const s = (v === null || v === undefined) ? '' : String(v).trim();
  return s === '' ? (fallback || _defaultProgramName()) : s;
}

function _getActiveProgram() {
  const props = PropertiesService.getDocumentProperties();
  const stored = props.getProperty(ACTIVE_PROGRAM_KEY);
  const programs = _listPrograms();
  // Bekräfta att lagrat program fortfarande finns; annars fall tillbaka på default.
  if (stored) {
    for (let i = 0; i < programs.length; i++) {
      if (programs[i].name === stored) return stored;
    }
  }
  return _defaultProgramName();
}

function setActiveProgram(programName) {
  const programs = _listPrograms();
  let name = _defaultProgramName();
  for (let i = 0; i < programs.length; i++) {
    if (programs[i].name === programName) { name = programName; break; }
  }
  PropertiesService.getDocumentProperties().setProperty(ACTIVE_PROGRAM_KEY, name);
  const bundle = _programBundle(name); // en läsning ger program + weeks + currentWeek
  return {
    activeProgram: name,
    program: bundle.program,
    listStats: _listStatsFromCols(_readLoggCols(), name, _weekStatsFor(name, bundle)),
    activeSession: getActiveSession(),
    weeks: bundle.weeks,
    currentWeek: bundle.currentWeek,
    currentCycle: _getCycle(name)
  };
}

// --- helpers: vecko-progression ---

// Distinkta veckonummer i en programflik (sorterade). [1] om ingen 'Vecka'-kolumn
// eller inga veckovärden — programmet beter sig då som "en-vecka" (dagens beteende).
// Delegerar till _programBundle så veckoutvinningen bara finns på ett ställe.
function _getProgramWeeks(programName, cykel) {
  return _programBundle(programName, null, cykel).weeks;
}

// Cyklerna som faktiskt finns definierade i programfliken (tom lista = fliken
// saknar Cykel-kolumn och har alltså bara en uppsättning vikter).
function _getProgramCycles(programName) {
  return _programBundle(programName).cycles;
}

function _getCurrentWeek(programName) {
  return _programBundle(programName).currentWeek;
}

function _getCycle(programName) {
  const v = Number(PropertiesService.getDocumentProperties().getProperty(CYCLE_KEY_PREFIX + programName));
  return (v && v >= 1) ? v : 1;
}

function _setCycle(programName, cykel) {
  const v = Math.max(1, Math.round(Number(cykel) || 1));
  PropertiesService.getDocumentProperties().setProperty(CYCLE_KEY_PREFIX + programName, String(v));
  return v;
}

// cykel = valfri. Sätts när frontend wrappar manuellt (förbi sista veckan = ny cykel,
// bakåt förbi första = tillbaka till förra cykeln) eller korrigerar cykelräknaren.
function setCurrentWeek(programName, vecka, cykel) {
  const name = programName || _getActiveProgram();
  // Cykeln sätts FÖRE programmet läses. Wrappar man förbi sista veckan till en ny
  // cykel måste den nya cykelns vikter tillbaka i svaret — läser man först får man
  // förra cykelns, och appen visar fel vikter tills nästa omladdning.
  if (cykel !== undefined && cykel !== null && cykel !== '') _setCycle(name, cykel);
  const cyk = _getCycle(name);
  // En läsning för att validera veckan och hämta veckolistan + rätt veckas program.
  const probe = _programBundle(name, vecka, cyk);
  const v = (probe.weeks.indexOf(Number(vecka)) >= 0) ? Number(vecka) : probe.weeks[0];
  PropertiesService.getDocumentProperties().setProperty(WEEK_KEY_PREFIX + name, String(v));
  // Om veckan justerades (ogiltig) behöver vi rätt veckas rader.
  const bundle = (v === Number(vecka)) ? probe : _programBundle(name, v, cyk);
  // Ny vecka → ny klart-status; skickas med så listvyn slipper ett extra anrop.
  const weekStats = (bundle.weeks && bundle.weeks.length > 1) ? _weekSessionStats(name, v, cyk) : null;
  return {
    week: v,
    cycle: cyk,
    // Vilken cykels vikter som faktiskt körs. Skiljer sig från 'cycle' när
    // räknaren gått förbi sista definierade cykeln i fliken.
    cycleUsed: bundle.cycle,
    cycles: bundle.cycles,
    weeks: bundle.weeks,
    program: bundle.program,
    listStats: _listStatsFromCols(_readLoggCols(), name, weekStats)
  };
}

// --- public API: program ---

// Läser ett program EN gång och returnerar { program, weeks, currentWeek }.
// Perf: tidigare läste getProgram + _getProgramWeeks + _getCurrentWeek bladet 3 ggr;
// detta gör allt i en enda _readSheet. Hela hot-pathen (getInitData/setActiveProgram/
// setCurrentWeek) bygger på denna.
function _programBundle(programName, vecka, cykel) {
  const name = programName ? programName : _getActiveProgram();
  const sheetName = _programSheetName(name);
  const r = _readSheet(sheetName);
  const cVecka = r.colMap['Vecka'];

  // --- Cykel: valfri kolumn. Låter EN programflik bära flera varv av samma
  // program med olika vikter, så en ny flik bara behövs vid strukturändring
  // och inte vid löpande progression. Måste filtreras FÖRE veckan, eftersom
  // vilka veckor som finns beror på cykeln. Flikar utan kolumnen läses som förr.
  const cCykel = r.colMap['Cykel'];
  let cycles = [];
  let cyk = 1;
  if (cCykel !== undefined) {
    const seenC = {};
    r.rows.forEach(function (row) {
      const v = Number(row[cCykel]);
      if (v && !seenC[v]) { seenC[v] = true; cycles.push(v); }
    });
    cycles.sort(function (a, b) { return a - b; });
    const önskad = (cykel !== undefined && cykel !== null && cykel !== '')
      ? Number(cykel) : _getCycle(name);
    // Högsta definierade cykel som inte överstiger den önskade. Ligger räknaren
    // före flikens sista cykel körs den sista vidare i stället för att falla
    // tillbaka till de lättaste vikterna; bundlens 'cycle' säger vilken som gäller.
    cyk = cycles.length ? cycles[0] : 1;
    cycles.forEach(function (c) { if (c <= önskad) cyk = c; });

    // Tom Cykel = raden gäller alla cykler (bas), så oförändrade accessoarer kan
    // skrivas en gång. En cykelspecifik rad för samma övning tar över basen —
    // annars skulle de två slås ihop till segment av samma övning.
    const kPass = r.colMap['Pass'], kOrd = r.colMap['Ordning'], kÖvn = r.colMap['Övning'];
    const nyckel = function (row) {
      return String(row[kPass]) + '|' + String(row[kOrd]) + '|' + String(row[kÖvn]) +
        '|' + (cVecka === undefined ? '' : String(row[cVecka]));
    };
    const harEgen = {};
    r.rows.forEach(function (row) {
      if (Number(row[cCykel]) === cyk) harEgen[nyckel(row)] = true;
    });
    r.rows = r.rows.filter(function (row) {
      const c = Number(row[cCykel]);
      return c ? (c === cyk) : !harEgen[nyckel(row)];
    });
  }

  // Veckor + vald vecka — härleds ur den redan cykelfiltrerade datan.
  let weeks = [1];
  let wk = 1;
  if (cVecka !== undefined) {
    const seen = {};
    weeks = [];
    r.rows.forEach(function (row) {
      const v = Number(row[cVecka]);
      if (v && !seen[v]) { seen[v] = true; weeks.push(v); }
    });
    weeks.sort(function (a, b) { return a - b; });
    if (!weeks.length) weeks = [1];
    if (vecka) {
      wk = Number(vecka);
    } else {
      const stored = Number(PropertiesService.getDocumentProperties().getProperty(WEEK_KEY_PREFIX + name));
      wk = (stored && weeks.indexOf(stored) >= 0) ? stored : weeks[0];
    }
    r.rows = r.rows.filter(function (row) {
      const v = Number(row[cVecka]);
      return !v || v === wk; // tom Vecka = gäller alla veckor
    });
  }

  const cPass = _col(r.colMap, 'Pass', sheetName);
  const cOrd = _col(r.colMap, 'Ordning', sheetName);
  const cÖvn = _col(r.colMap, 'Övning', sheetName);
  const cSet = _col(r.colMap, 'Set', sheetName);
  const cReps = _col(r.colMap, 'Reps', sheetName);
  const cVikt = _col(r.colMap, 'Målvikt', sheetName);
  const cNot = _col(r.colMap, 'Notering', sheetName);
  const cRir = r.colMap['RIR'];   // valfri kolumn
  const cVila = r.colMap['Vila']; // valfri kolumn — äldre programflikar saknar den

  const valid = r.rows.filter(function (row) {
    return String(row[cPass]).trim() !== '' && String(row[cÖvn]).trim() !== '';
  });

  // Flera rader med samma (pass, övning) = segment (t.ex. top-set + back-off).
  // Gruppera dem under EN övning så loggning/PR förblir namnbaserat och enat.
  const passOrder = [];
  const byPass = {}; // pass -> { order: [övn], map: {övn: {övning, ordning, segments}} }
  valid.forEach(function (row) {
    const pass = String(row[cPass]).trim();
    if (!byPass[pass]) { byPass[pass] = { order: [], map: {} }; passOrder.push(pass); }
    const grp = byPass[pass];
    const övn = String(row[cÖvn]).trim();
    const målvikt = (row[cVikt] === '' || row[cVikt] === null) ? null : row[cVikt];
    let repsRaw = row[cReps];
    // Sheets autoformaterar fritext som "3-5" till ett datum — återskapa "month-day".
    if (repsRaw instanceof Date) {
      repsRaw = (repsRaw.getMonth() + 1) + '-' + repsRaw.getDate();
    }
    const rir = (cRir === undefined || row[cRir] === '' || row[cRir] === null) ? null : row[cRir];
    const seg = {
      set: Number(row[cSet]) || 0,
      reps: String(repsRaw).trim(),
      målvikt: målvikt,
      rir: rir,
      vila: (cVila === undefined) ? '' : String(row[cVila] || '').trim(),
      notering: String(row[cNot] || '').trim()
    };
    const ord = Number(row[cOrd]) || 0;
    if (!grp.map[övn]) {
      grp.map[övn] = { övning: övn, ordning: ord, segments: [] };
      grp.order.push(övn);
    } else if (ord < grp.map[övn].ordning) {
      grp.map[övn].ordning = ord;
    }
    grp.map[övn].segments.push(seg);
  });

  const program = passOrder.map(function (p) {
    const grp = byPass[p];
    const exercises = grp.order.map(function (övn) {
      const ex = grp.map[övn];
      const s0 = ex.segments[0];
      const totalSet = ex.segments.reduce(function (a, sg) { return a + (sg.set || 0); }, 0);
      // segment[0]-fälten behålls på toppnivå för bakåtkompatibilitet (enradiga övningar
      // beter sig precis som förr); 'set' = summan för räkningar/etiketter.
      return {
        övning: ex.övning,
        ordning: ex.ordning,
        set: totalSet,
        reps: s0.reps,
        målvikt: s0.målvikt,
        rir: s0.rir,
        vila: s0.vila,
        notering: s0.notering,
        segments: ex.segments
      };
    });
    exercises.sort(function (a, b) { return a.ordning - b.ordning; });
    return { pass: p, exercises: exercises };
  });
  return { program: program, weeks: weeks, currentWeek: wk, cycles: cycles, cycle: cyk };
}

// vecka = valfri. Om fliken har en 'Vecka'-kolumn returneras bara den veckans rader
// (plus rader med tom Vecka). Saknas kolumnen ignoreras vecka.
function getProgram(programName, vecka, cykel) {
  return _programBundle(programName, vecka, cykel).program;
}

// --- public API: history & lookups ---

// Allt uppstartsdata i ett anrop — varje google.script.run-anrop kostar en
// kallstart (~0,5–2 s), så frontend ska bara behöva ett vid init.
function getInitData() {
  const activeSession = getActiveSession();
  // En aktiv session styr vilket program som är aktivt.
  const activeProgram = (activeSession && activeSession.program)
    ? activeSession.program : _getActiveProgram();
  // En enda läsning ger program + weeks + currentWeek (tidigare 3 läsningar).
  const bundle = _programBundle(activeProgram);
  // En enda Logg-läsning delas mellan listStats och completedSets (Logg är största bladet).
  const loggCols = _readLoggCols();
  return {
    programs: _listProgramsWithMeta(),
    activeProgram: activeProgram,
    program: bundle.program,
    activeSession: activeSession,
    completedSets: activeSession ? _completedSetsFromCols(loggCols, activeSession.passId) : null,
    listStats: _listStatsFromCols(loggCols, activeProgram, _weekStatsFor(activeProgram, bundle)),
    weeks: bundle.weeks,
    currentWeek: bundle.currentWeek,
    currentCycle: _getCycle(activeProgram),
    // Cyklerna som finns i fliken, och vilken som faktiskt körs. cycleUsed <
    // currentCycle betyder att räknaren gått förbi sista skrivna cykeln.
    cycles: bundle.cycles,
    cycleUsed: bundle.cycle
  };
}

// Programlista med antal pass per program (för startskärmen "Dina program").
function _listProgramsWithMeta() {
  return _listPrograms().map(function (p) {
    let passCount = 0;
    try {
      const passes = getProgram(p.name);
      passCount = passes.length;
    } catch (e) { passCount = 0; }
    return { name: p.name, sheetName: p.sheetName, passCount: passCount };
  });
}

// Listvyns data i en enda Logg-läsning: senaste datum per pass +
// veckans loggade volym (kroppsviktsset räknas ej i kg). För program med
// veckoprogression räknas "klart" och volym per PROGRAMVECKA (via Sessions),
// annars per kalendervecka (måndag–söndag).
function getListStats(programName) {
  const program = programName || _getActiveProgram();
  return _listStatsFromCols(_readLoggCols(), program, _weekStatsFor(program));
}

// Som getListStats men mot en redan inläst Logg — delas i getInitData.
// weekStats (valfri, från _weekStatsFor) växlar veckosemantiken till programvecka.
function _listStatsFromCols(c, programName, weekStats) {
  const now = new Date();
  const dayIdx = (now.getDay() + 6) % 7; // 0 = måndag
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayIdx);
  const weekStart = _dateKey(monday);

  const defaultProgram = _defaultProgramName();
  const program = programName || _getActiveProgram();
  const lastDateByPass = {};
  let weekVolume = 0;
  c.r.rows.forEach(function (row) {
    if (!row[c.cDatum] || !row[c.cPass]) return;
    if (!_rowMatchesProgram(row, c, program, defaultProgram)) return;
    const pass = String(row[c.cPass]).trim();
    const dStr = _dateKey(row[c.cDatum]);
    if (!lastDateByPass[pass] || dStr > lastDateByPass[pass]) lastDateByPass[pass] = dStr;
    const inWeek = weekStats
      ? (c.cPassId !== undefined && weekStats.passIds[_normalizePassId(row[c.cPassId])])
      : dStr >= weekStart;
    if (inWeek) {
      const set = _rowToSet(row, c);
      if (set.vikt !== null && set.vikt !== undefined && set.vikt !== '') {
        weekVolume += (Number(set.reps) || 0) * Number(set.vikt);
      }
    }
  });
  return {
    lastDateByPass: lastDateByPass,
    weekVolume: weekVolume,
    weekStart: weekStart,
    weekDoneByPass: weekStats ? weekStats.doneByPass : null
  };
}

// Programveckans status om programmet har veckoprogression, annars null (kalender-
// veckans logik gäller då). bundle = valfri redan inläst _programBundle (sparar en läsning).
function _weekStatsFor(programName, bundle) {
  const b = bundle || _programBundle(programName);
  if (!b.weeks || b.weeks.length <= 1) return null;
  return _weekSessionStats(programName, b.currentWeek, _getCycle(programName));
}

// Klart-status per pass för en programvecka. Sessions är sanningen (samma semantik
// som _maybeAdvanceWeek): pass → true om minst en AVSLUTAD session finns för
// programmet + veckan + CYKELN — utan cykelmatch räknas förra cykelns "vecka 2"
// som klar i nästa cykels vecka 2. passIds = veckans sessions-ID:n, så volymen
// kan räknas ur Logg. Sessioner loggade innan Vecka-kolumnen fanns räknas aldrig
// som klara; rader utan Cykel (innan kolumnen fanns) räknas som cykel 1.
function _weekSessionStats(programName, week, cycle) {
  const out = { doneByPass: {}, passIds: {} };
  const s = _readSessionsSheet();
  if (!s) return out;
  const cPass = s.colMap['Pass'];
  const cProg = s.colMap['Program'];
  const cSlut = s.colMap['Slut-tid'];
  const cVecka = s.colMap['Vecka'];
  const cCykel = s.colMap['Cykel'];
  const cId = s.colMap['Pass-ID'];
  if (cVecka === undefined || cPass === undefined || cSlut === undefined) return out;
  const defaultProgram = _defaultProgramName();
  s.rows.forEach(function (row) {
    if (_normalizeProgram(cProg === undefined ? '' : row[cProg], defaultProgram) !== programName) return;
    if (Number(row[cVecka]) !== Number(week)) return;
    if (cCykel !== undefined && cycle && (Number(row[cCykel]) || 1) !== Number(cycle)) return;
    if (row[cSlut] === '' || row[cSlut] === null) return; // ej avslutad
    out.doneByPass[String(row[cPass]).trim()] = true;
    if (cId !== undefined) {
      const id = _normalizePassId(row[cId]);
      if (id) out.passIds[id] = true;
    }
  });
  return out;
}

// Senaste sessionerna för ALLA övningar i ett pass i ett anrop —
// förladdas när passvyn öppnas så övningsvyn slipper vänta på nätet.
function getPrevSessionsForPass(passName, limit, programName) {
  limit = limit || 5;
  const c = _readLoggCols();
  if (c.r.rows.length === 0) return {};
  const defaultProgram = _defaultProgramName();
  const program = programName || _getActiveProgram();

  const byExDate = {};
  c.r.rows.forEach(function (row) {
    if (String(row[c.cPass]).trim() !== passName || !row[c.cDatum]) return;
    if (!_rowMatchesProgram(row, c, program, defaultProgram)) return;
    const övn = String(row[c.cÖvn]).trim();
    const dStr = _dateKey(row[c.cDatum]);
    if (!byExDate[övn]) byExDate[övn] = {};
    if (!byExDate[övn][dStr]) byExDate[övn][dStr] = [];
    byExDate[övn][dStr].push(_rowToSet(row, c));
  });

  const result = {};
  Object.keys(byExDate).forEach(function (övn) {
    const dates = Object.keys(byExDate[övn]).sort().reverse().slice(0, limit);
    result[övn] = dates.map(function (d) {
      return {
        datum: d,
        sets: byExDate[övn][d].sort(function (a, b) { return a.setNr - b.setNr; })
      };
    });
  });
  return result;
}

// Alla avslutade pass (Sessions + legacy-rader i Logg utan Pass-ID) i en
// läsning per blad. PR beräknas INTE här (analyzeSession är dyr) — bara i detaljvyn.
function getHistory(limit, programName) {
  limit = limit || 200;
  const defaultProgram = _defaultProgramName();
  const program = programName || _getActiveProgram();

  // 1) Avslutade sessioner ur Sessions (Slut-tid satt). Aktiv session utesluts.
  const byId = {};
  const s = _readSessionsSheet();
  if (s && s.colMap['Pass-ID'] !== undefined) {
    const cId = s.colMap['Pass-ID'], cPass = s.colMap['Pass'], cDatum = s.colMap['Datum'],
          cStart = s.colMap['Start-tid'], cSlut = s.colMap['Slut-tid'], cProg = s.colMap['Program'];
    s.rows.forEach(function (row) {
      if (row[cSlut] === '' || row[cSlut] === null) return;
      const rowProg = (cProg === undefined) ? '' : row[cProg];
      if (_normalizeProgram(rowProg, defaultProgram) !== program) return;
      const id = _normalizePassId(row[cId]);
      if (!id) return;
      byId[id] = {
        passId: id,
        pass: String(row[cPass]).trim(),
        date: _dateKey(row[cDatum]),
        startTime: row[cStart] instanceof Date ? row[cStart].toISOString() : (row[cStart] ? String(row[cStart]) : null),
        endTime: row[cSlut] instanceof Date ? row[cSlut].toISOString() : String(row[cSlut]),
        setCount: 0, volume: 0, legacy: false
      };
    });
  }

  // 2) En Logg-läsning: set + volym per session; rader UTAN Pass-ID
  //    grupperas som syntetiska legacy-sessioner på (Datum, Pass).
  const legacy = {};
  const c = _readLoggCols();
  c.r.rows.forEach(function (row) {
    if (!row[c.cDatum] || !row[c.cPass]) return;
    const reps = Number(row[c.cReps]) || 0;
    const vikt = (row[c.cVikt] === '' || row[c.cVikt] === null) ? null : Number(row[c.cVikt]);
    const vol = vikt !== null ? reps * vikt : 0;
    const id = (c.cPassId === undefined) ? '' : _normalizePassId(row[c.cPassId]);
    if (id) {
      // Rad med Pass-ID: räknas bara om sessionen är avslutad
      // (aktiv session visas redan på startsidan; föräldralösa ID:n ignoreras).
      if (byId[id]) { byId[id].setCount++; byId[id].volume += vol; }
      return;
    }
    // Legacy-rad utan Pass-ID: tom Program (eller matchande) räknas som default-programmet.
    if (!_rowMatchesProgram(row, c, program, defaultProgram)) return;
    const dStr = _dateKey(row[c.cDatum]);
    const pass = String(row[c.cPass]).trim();
    const key = dStr + '|' + pass;
    if (!legacy[key]) {
      legacy[key] = { passId: null, pass: pass, date: dStr,
                      startTime: null, endTime: null, setCount: 0, volume: 0, legacy: true };
    }
    legacy[key].setCount++; legacy[key].volume += vol;
  });

  // 3) Slå ihop, filtrera tomma, sortera nyast först.
  const items = Object.keys(byId).map(function (k) { return byId[k]; })
    .concat(Object.keys(legacy).map(function (k) { return legacy[k]; }))
    .filter(function (it) { return it.setCount > 0; });
  items.sort(function (a, b) {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return String(b.startTime || '').localeCompare(String(a.startTime || ''));
  });
  return items.slice(0, limit);
}

// --- public API: sessions ---

function getActiveSession() {
  // Perf: ingen _ensureTextColumn här (det är en kolumn-formatskrivning per anrop).
  // _normalizePassId hanterar Date-värden vid läsning; reparation sker i skriv-vägarna
  // (startPass/endPass/logSet/deleteSession) som ändå kallar _ensureTextColumn.
  const s = _readSessionsSheet();
  if (!s) return null;
  const cId = s.colMap['Pass-ID'];
  const cPass = s.colMap['Pass'];
  const cDatum = s.colMap['Datum'];
  const cStart = s.colMap['Start-tid'];
  const cSlut = s.colMap['Slut-tid'];
  const cProg = s.colMap['Program'];
  const cMods = s.colMap['Ändringar'];
  if (cId === undefined || cSlut === undefined) return null;

  for (let i = s.rows.length - 1; i >= 0; i--) {
    const row = s.rows[i];
    if (row[cSlut] === '' || row[cSlut] === null) {
      return {
        passId: _normalizePassId(row[cId]),
        pass: String(row[cPass]).trim(),
        date: _dateKey(row[cDatum]),
        startTime: row[cStart] instanceof Date ? row[cStart].toISOString() : String(row[cStart]),
        program: _normalizeProgram(cProg === undefined ? '' : row[cProg], _defaultProgramName()),
        mods: _parseMods(cMods === undefined ? '' : row[cMods])
      };
    }
  }
  return null;
}

// Per-pass-ändringar (byt/lägg-till-övning för enstaka session). Lagras som JSON
// i Sessions-flikens 'Ändringar'-kolumn, kopplat till Pass-ID. { subs:{plan→ny}, added:[namn] }.
function _parseMods(v) {
  const empty = { subs: {}, added: [] };
  if (!v) return empty;
  try {
    const o = JSON.parse(String(v));
    return {
      subs: (o && o.subs && typeof o.subs === 'object') ? o.subs : {},
      added: (o && Array.isArray(o.added)) ? o.added : []
    };
  } catch (e) { return empty; }
}

// Sparar hela mods-objektet för ett pass (frontend äger objektet). Returnerar det normaliserat.
function setSessionMods(passId, mods) {
  const sessSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SESSIONS_SHEET);
  if (!sessSheet) throw new Error('Inga sessioner registrerade.');
  _ensureTextColumn(sessSheet, 'Pass-ID');
  _ensureTextColumn(sessSheet, 'Ändringar');
  const s = _readSessionsSheet();
  const cId = _col(s.colMap, 'Pass-ID', SESSIONS_SHEET);
  const cMods = _col(s.colMap, 'Ändringar', SESSIONS_SHEET);
  const target = _normalizePassId(passId);
  const clean = _parseMods(JSON.stringify(mods || {}));
  for (let i = 0; i < s.rows.length; i++) {
    if (_normalizePassId(s.rows[i][cId]) === target) {
      s.sheet.getRange(i + 2, cMods + 1).setValue(JSON.stringify(clean));
      return clean;
    }
  }
  throw new Error('Sessionen hittades inte.');
}

// Distinkta övningsnamn ur Logg + aktivt program — för snabb inmatning (autocomplete).
function getKnownExercises() {
  const names = {};
  try {
    const c = _readLoggCols();
    c.r.rows.forEach(function (row) {
      const n = String(row[c.cÖvn]).trim();
      if (n) names[n] = true;
    });
  } catch (e) { /* Logg kan saknas */ }
  try {
    _programBundle(_getActiveProgram()).program.forEach(function (p) {
      p.exercises.forEach(function (ex) { if (ex.övning) names[ex.övning] = true; });
    });
  } catch (e) { /* program kan saknas */ }
  return Object.keys(names).sort(function (a, b) { return a.localeCompare(b, 'sv'); });
}

function startPass(passName, programName) {
  const sessions = _ensureSheet(SESSIONS_SHEET, SESSION_HEADERS);
  _ensureTextColumn(sessions, 'Pass-ID');
  _ensureColumn(sessions, 'Program');
  _ensureColumn(sessions, 'Vecka');
  _ensureColumn(sessions, 'Cykel');
  _ensureTextColumn(sessions, 'Ändringar');
  const logg = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOGG_SHEET);
  if (!logg) throw new Error('Fliken "' + LOGG_SHEET + '" hittades inte.');
  _ensureTextColumn(logg, 'Pass-ID');
  _ensureColumn(logg, 'Program');

  const active = getActiveSession();
  if (active) {
    throw new Error('Det finns redan ett aktivt pass (' + active.pass + '). Avsluta det först.');
  }

  const program = programName || _getActiveProgram();
  const vecka = _getCurrentWeek(program); // veckan passet tillhör — fryses vid start
  const cykel = _getCycle(program);       // dito för cykeln
  const now = new Date();
  const passId = _passIdFromDate(now);

  _appendRowByHeader(sessions, {
    'Pass-ID': passId,
    'Pass': passName,
    'Datum': now,
    'Start-tid': now,
    'Slut-tid': '',
    'Notering': '',
    'Program': program,
    'Vecka': vecka,
    'Cykel': cykel,
    'Ändringar': ''
  });

  return {
    passId: passId,
    pass: passName,
    date: _dateKey(now),
    startTime: now.toISOString(),
    program: program,
    vecka: vecka,
    cykel: cykel
  };
}

function endPass(passId) {
  const sessSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SESSIONS_SHEET);
  if (sessSheet) _ensureTextColumn(sessSheet, 'Pass-ID');
  const s = _readSessionsSheet();
  if (!s) throw new Error('Inga sessioner registrerade.');
  const cId = _col(s.colMap, 'Pass-ID', SESSIONS_SHEET);
  const cSlut = _col(s.colMap, 'Slut-tid', SESSIONS_SHEET);
  const cProg = s.colMap['Program'];
  const cVecka = s.colMap['Vecka'];
  const cCykel = s.colMap['Cykel'];
  const target = _normalizePassId(passId);

  for (let i = 0; i < s.rows.length; i++) {
    if (_normalizePassId(s.rows[i][cId]) === target) {
      s.sheet.getRange(i + 2, cSlut + 1).setValue(new Date());
      // Auto-avancera programveckan när alla pass i veckan är avslutade.
      let advancedWeek = null;
      if (cVecka !== undefined) {
        const program = _normalizeProgram(cProg === undefined ? '' : s.rows[i][cProg], _defaultProgramName());
        const week = Number(s.rows[i][cVecka]);
        // Sessionens egen cykel styr (frusen vid start, som veckan); saknas den
        // används den aktuella cykelräknaren.
        const cykel = (cCykel !== undefined && Number(s.rows[i][cCykel])) ? Number(s.rows[i][cCykel]) : _getCycle(program);
        if (week) {
          SpreadsheetApp.flush(); // säkerställ att slut-tiden syns vid omläsningen nedan
          try { advancedWeek = _maybeAdvanceWeek(program, week, cykel); } catch (e) { advancedWeek = null; }
        }
      }
      return { ok: true, advancedWeek: advancedWeek };
    }
  }
  throw new Error('Sessionen hittades inte.');
}

// Avancerar programveckan om varje pass i den angivna veckan har minst en avslutad
// session (för det programmet, just den veckan, i just den CYKELN — annars räknas
// förra cykelns sessioner och veckan hoppas över i förtid). Wrappar till första
// veckan efter sista (ny cykel). Returnerar nya veckan, eller null om inget skedde.
// Kräver 'Vecka'-kolumnen i Sessions — gamla rader utan vecka räknas aldrig som
// klara; rader utan Cykel (innan kolumnen fanns) räknas som cykel 1.
function _maybeAdvanceWeek(programName, week, cycle) {
  const bundle = _programBundle(programName, week);
  const weeks = bundle.weeks;
  if (!weeks || weeks.length <= 1) return null; // enveckas-program → inget att avancera
  const weekPasses = bundle.program.map(function (p) { return p.pass; });
  if (!weekPasses.length) return null;

  const s = _readSessionsSheet();
  if (!s) return null;
  const cPass = s.colMap['Pass'];
  const cProg = s.colMap['Program'];
  const cSlut = s.colMap['Slut-tid'];
  const cVecka = s.colMap['Vecka'];
  const cCykel = s.colMap['Cykel'];
  if (cVecka === undefined || cPass === undefined || cSlut === undefined) return null;
  const defaultProgram = _defaultProgramName();

  const done = {};
  s.rows.forEach(function (row) {
    if (_normalizeProgram(cProg === undefined ? '' : row[cProg], defaultProgram) !== programName) return;
    if (Number(row[cVecka]) !== Number(week)) return;
    if (cCykel !== undefined && cycle && (Number(row[cCykel]) || 1) !== Number(cycle)) return;
    if (row[cSlut] === '' || row[cSlut] === null) return; // ej avslutad
    done[String(row[cPass]).trim()] = true;
  });
  const allDone = weekPasses.every(function (p) { return done[p]; });
  if (!allDone) return null;

  const idx = weeks.indexOf(Number(week));
  const wrapped = !(idx >= 0 && idx < weeks.length - 1);
  const nextWeek = wrapped ? weeks[0] : weeks[idx + 1];
  PropertiesService.getDocumentProperties().setProperty(WEEK_KEY_PREFIX + programName, String(nextWeek));
  if (wrapped) _setCycle(programName, _getCycle(programName) + 1); // sista veckan klar → ny cykel
  return nextWeek;
}

function getRecentSessionsForPass(passName, limit, programName) {
  limit = limit || 5;
  const s = _readSessionsSheet();
  if (!s) return [];
  const cId = s.colMap['Pass-ID'];
  const cPass = s.colMap['Pass'];
  const cDatum = s.colMap['Datum'];
  const cStart = s.colMap['Start-tid'];
  const cSlut = s.colMap['Slut-tid'];
  const cProg = s.colMap['Program'];
  if (cId === undefined) return [];
  const defaultProgram = _defaultProgramName();
  const program = programName || _getActiveProgram();

  const matches = [];
  s.rows.forEach(function (row) {
    if (String(row[cPass]).trim() !== passName) return;
    const rowProg = (cProg === undefined) ? '' : row[cProg];
    if (_normalizeProgram(rowProg, defaultProgram) !== program) return;
    matches.push({
      passId: _normalizePassId(row[cId]),
      date: _dateKey(row[cDatum]),
      startTime: row[cStart] instanceof Date ? row[cStart].toISOString() : String(row[cStart]),
      endTime: (row[cSlut] === '' || row[cSlut] === null) ? null
        : (row[cSlut] instanceof Date ? row[cSlut].toISOString() : String(row[cSlut])),
      active: row[cSlut] === '' || row[cSlut] === null
    });
  });

  matches.sort(function (a, b) { return b.startTime.localeCompare(a.startTime); });
  const recent = matches.slice(0, limit);

  const passIds = recent.map(function (s) { return s.passId; });
  const counts = _countSetsByPassIds(passIds);
  recent.forEach(function (s) { s.setCount = counts[s.passId] || 0; });

  return recent;
}

function getLastSessionForPass(passName, programName) {
  const recent = getRecentSessionsForPass(passName, 10, programName);

  // Senaste sessionen med faktiskt loggade set.
  let lastIdx = -1;
  for (let i = 0; i < recent.length; i++) {
    if (recent[i].setCount > 0) { lastIdx = i; break; }
  }
  if (lastIdx < 0) return null;

  const last = recent[lastIdx];
  const setsByExercise = getCompletedSetsForPassId(last.passId);

  // Föregående session (för trendjämförelse per övning).
  let prevSets = null;
  for (let i = lastIdx + 1; i < recent.length; i++) {
    if (recent[i].setCount > 0) { prevSets = getCompletedSetsForPassId(recent[i].passId); break; }
  }
  const prevScoreByExercise = {};
  if (prevSets) {
    Object.keys(prevSets).forEach(function (ex) {
      prevScoreByExercise[ex] = _sessionScore(prevSets[ex]);
    });
  }

  // Sammanfattande statistik.
  let totalSets = 0, totalVolume = 0;
  Object.keys(setsByExercise).forEach(function (ex) {
    setsByExercise[ex].forEach(function (s) {
      totalSets++;
      if (s.vikt !== null && s.vikt !== undefined && s.vikt !== '') {
        totalVolume += (Number(s.reps) || 0) * Number(s.vikt);
      }
    });
  });

  return {
    passId: last.passId,
    date: last.date,
    startTime: last.startTime,
    endTime: last.endTime,
    setsByExercise: setsByExercise,
    prevScoreByExercise: prevScoreByExercise,
    totalSets: totalSets,
    totalVolume: totalVolume,
    prCount: analyzeSession(last.passId).length
  };
}

function _countSetsByPassIds(passIds) {
  if (!passIds.length) return {};
  const c = _readLoggCols();
  if (c.cPassId === undefined) return {};
  const idSet = {};
  passIds.forEach(function (id) { idSet[_normalizePassId(id)] = 0; });
  c.r.rows.forEach(function (row) {
    const id = _normalizePassId(row[c.cPassId]);
    if (id in idSet) idSet[id]++;
  });
  // Re-key result by original passIds (in case of normalization differences)
  const result = {};
  passIds.forEach(function (id) { result[id] = idSet[_normalizePassId(id)] || 0; });
  return result;
}

function getCompletedSetsForPassId(passId) {
  return _completedSetsFromCols(_readLoggCols(), passId);
}

// Som ovan men mot en redan inläst Logg (c = _readLoggCols()) — låter getInitData
// dela en enda Logg-läsning mellan listStats och completedSets.
function _completedSetsFromCols(c, passId) {
  if (c.cPassId === undefined) return {};
  const target = _normalizePassId(passId);
  const result = {};
  c.r.rows.forEach(function (row) {
    if (_normalizePassId(row[c.cPassId]) !== target) return;
    const övn = String(row[c.cÖvn]).trim();
    if (!result[övn]) result[övn] = [];
    result[övn].push(_rowToSet(row, c));
  });
  Object.keys(result).forEach(function (ex) {
    result[ex].sort(function (a, b) { return a.setNr - b.setNr; });
  });
  return result;
}

// Detalj för ett avslutat pass. key = {passId: '...'} eller (legacy, utan
// Pass-ID) {datum: 'yyyy-MM-dd', pass: '...'}. En round-trip per detaljvy.
function getSessionDetail(key) {
  if (key && key.passId) {
    return {
      setsByExercise: getCompletedSetsForPassId(key.passId),
      prs: analyzeSession(key.passId)
    };
  }
  // Legacy: rader utan Pass-ID på (datum, pass). Inga PR (kräver Pass-ID-avgränsning).
  const c = _readLoggCols();
  const result = {};
  c.r.rows.forEach(function (row) {
    if (_dateKey(row[c.cDatum]) !== key.datum) return;
    if (String(row[c.cPass]).trim() !== key.pass) return;
    const id = (c.cPassId === undefined) ? '' : _normalizePassId(row[c.cPassId]);
    if (id) return;
    const övn = String(row[c.cÖvn]).trim();
    if (!result[övn]) result[övn] = [];
    result[övn].push(_rowToSet(row, c));
  });
  Object.keys(result).forEach(function (ex) {
    result[ex].sort(function (a, b) { return a.setNr - b.setNr; });
  });
  return { setsByExercise: result, prs: [] };
}

function deleteSession(passId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const target = _normalizePassId(passId);

  const logg = ss.getSheetByName(LOGG_SHEET);
  if (logg) {
    _ensureTextColumn(logg, 'Pass-ID');
    const c = _readLoggCols();
    if (c.cPassId !== undefined) {
      const rowsToDelete = [];
      c.r.rows.forEach(function (row, i) {
        if (_normalizePassId(row[c.cPassId]) === target) rowsToDelete.push(i + 2);
      });
      for (let i = rowsToDelete.length - 1; i >= 0; i--) {
        logg.deleteRow(rowsToDelete[i]);
      }
    }
  }

  const sessSheet = ss.getSheetByName(SESSIONS_SHEET);
  if (sessSheet) _ensureTextColumn(sessSheet, 'Pass-ID');
  const s = _readSessionsSheet();
  if (s) {
    const cId = s.colMap['Pass-ID'];
    if (cId !== undefined) {
      for (let i = s.rows.length - 1; i >= 0; i--) {
        if (_normalizePassId(s.rows[i][cId]) === target) s.sheet.deleteRow(i + 2);
      }
    }
  }

  return { ok: true };
}

// --- public API: logging ---

function logSet(entry) {
  const logg = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOGG_SHEET);
  if (!logg) throw new Error('Fliken "' + LOGG_SHEET + '" hittades inte.');
  _ensureTextColumn(logg, 'Pass-ID');
  _ensureColumn(logg, 'Program');

  const program = entry.program || _getActiveProgram();
  const date = _parseDate(entry.datum);
  const viktNum = (entry.vikt === '' || entry.vikt === null || entry.vikt === undefined) ? null : Number(entry.vikt);
  const repsNum = Number(entry.reps);

  // Detect PR BEFORE appending (so the just-logged set isn't compared to itself)
  const pr = _detectPR(String(entry.pass), String(entry.övning), repsNum, viktNum);

  _appendRowByHeader(logg, {
    'Datum': date,
    'Pass': String(entry.pass),
    'Övning': String(entry.övning),
    'Set nr': Number(entry.setNr),
    'Reps': repsNum,
    'Vikt': viktNum === null ? '' : viktNum,
    'Kommentar': String(entry.kommentar || ''),
    'Pass-ID': String(entry.passId || ''),
    'Program': program
  });

  return { ok: true, pr: pr };
}

// Uppdaterar ett redan loggat set (reps/vikt/kommentar) på rätt Logg-rad.
// Identifieras via Pass-ID + Övning + Set nr (unik kombination inom ett pass).
// PR räknas inte om här — analyzeSession(passId) vid avsluta är auktoritativ.
function updateSet(entry) {
  const logg = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOGG_SHEET);
  if (!logg) throw new Error('Fliken "' + LOGG_SHEET + '" hittades inte.');
  _ensureTextColumn(logg, 'Pass-ID');

  const c = _readLoggCols();
  if (c.cPassId === undefined) throw new Error('Pass-ID-kolumn saknas; kan inte redigera set.');

  const target = _normalizePassId(entry.passId);
  const övning = String(entry.övning).trim();
  const setNr = Number(entry.setNr);

  let rowNum = -1;
  c.r.rows.forEach(function (row, i) {
    if (_normalizePassId(row[c.cPassId]) === target &&
        String(row[c.cÖvn]).trim() === övning &&
        Number(row[c.cSetNr]) === setNr) {
      rowNum = i + 2; // +1 för rubrikraden, +1 för 1-baserat
    }
  });
  if (rowNum === -1) throw new Error('Hittade inte setet att uppdatera.');

  const viktNum = (entry.vikt === '' || entry.vikt === null || entry.vikt === undefined) ? null : Number(entry.vikt);
  const repsNum = Number(entry.reps);

  logg.getRange(rowNum, c.cReps + 1).setValue(repsNum);
  logg.getRange(rowNum, c.cVikt + 1).setValue(viktNum === null ? '' : viktNum);
  logg.getRange(rowNum, c.cKomm + 1).setValue(String(entry.kommentar || ''));

  return { ok: true };
}

// Tar bort ett loggat set och omnumrerar efterföljande set i samma övning
// så att Set nr förblir sammanhängande (1..n utan glapp). Identifieras via
// Pass-ID + Övning + Set nr. PR räknas om auktoritativt i analyzeSession vid avsluta.
function deleteSet(entry) {
  const logg = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOGG_SHEET);
  if (!logg) throw new Error('Fliken "' + LOGG_SHEET + '" hittades inte.');
  _ensureTextColumn(logg, 'Pass-ID');

  const c = _readLoggCols();
  if (c.cPassId === undefined) throw new Error('Pass-ID-kolumn saknas; kan inte ta bort set.');

  const target = _normalizePassId(entry.passId);
  const övning = String(entry.övning).trim();
  const setNr = Number(entry.setNr);

  let deleteRowNum = -1;
  const toDecrement = []; // {rowNum, newSetNr} för set efter det borttagna
  c.r.rows.forEach(function (row, i) {
    if (_normalizePassId(row[c.cPassId]) !== target || String(row[c.cÖvn]).trim() !== övning) return;
    const n = Number(row[c.cSetNr]);
    if (n === setNr) deleteRowNum = i + 2;
    else if (n > setNr) toDecrement.push({ rowNum: i + 2, newSetNr: n - 1 });
  });
  if (deleteRowNum === -1) throw new Error('Hittade inte setet att ta bort.');

  // Skriv om Set nr FÖRST (radindex oförändrade), radera sedan raden en gång.
  toDecrement.forEach(function (d) {
    logg.getRange(d.rowNum, c.cSetNr + 1).setValue(d.newSetNr);
  });
  logg.deleteRow(deleteRowNum);

  return { ok: true };
}

// PR-kärnan: är (vikt, reps) ett rekord jämfört med tidigare loggade set i `state`?
// state byggs löpande i radordning: { maxWeight, repsAtWeight{viktnyckel→max reps} }.
// Vikt-PR = tyngre än allt tidigare (kräver minst ett tidigare set MED vikt).
// Rep-PR = fler reps än tidigare bästa på exakt samma vikt (kroppsvikt = null = 'bw').
// Delas av _detectPR (inline vid loggning) och analyzeSession (auktoritativt vid avsluta)
// så att de två PR-vägarna inte kan glida isär.
function _prWeightKey(vikt) { return vikt === null ? 'bw' : String(vikt); }

function _prVsState(state, vikt, reps) {
  let weightPR = false;
  if (vikt !== null && state.maxWeight !== null && vikt > state.maxWeight) weightPR = true;
  const wKey = _prWeightKey(vikt);
  const repPR = (wKey in state.repsAtWeight) && reps > state.repsAtWeight[wKey];
  return { weightPR: weightPR, repPR: repPR };
}

function _prAddToState(state, vikt, reps) {
  if (vikt !== null && (state.maxWeight === null || vikt > state.maxWeight)) state.maxWeight = vikt;
  const wKey = _prWeightKey(vikt);
  if (!(wKey in state.repsAtWeight) || reps > state.repsAtWeight[wKey]) state.repsAtWeight[wKey] = reps;
}

function _newPrState() { return { maxWeight: null, repsAtWeight: {} }; }

function _detectPR(pass, övning, reps, vikt) {
  const c = _readLoggCols();
  if (c.r.rows.length === 0) return null;

  const state = _newPrState();
  let any = false;
  c.r.rows.forEach(function (row) {
    if (String(row[c.cPass]).trim() !== pass || String(row[c.cÖvn]).trim() !== övning) return;
    any = true;
    const w = (row[c.cVikt] === '' || row[c.cVikt] === null) ? null : Number(row[c.cVikt]);
    _prAddToState(state, w, Number(row[c.cReps]) || 0);
  });
  if (!any) return null;

  const pr = _prVsState(state, vikt, reps);
  if (!pr.weightPR && !pr.repPR) return null;
  return { weightPR: pr.weightPR, repPR: pr.repPR, weight: vikt, reps: reps };
}

// O(n): ett svep i radordning med löpande PR-state per (pass|övning) över HELA Logg:n.
// Tidigare slog detta upp alla tidigare rader per set (O(n²)).
function analyzeSession(passId) {
  const c = _readLoggCols();
  if (c.cPassId === undefined) return [];
  if (c.r.rows.length === 0) return [];
  const target = _normalizePassId(passId);

  const result = [];
  const stateByKey = {};
  c.r.rows.forEach(function (row) {
    const pass = String(row[c.cPass]).trim();
    const övning = String(row[c.cÖvn]).trim();
    const key = pass + '|' + övning;
    const reps = Number(row[c.cReps]) || 0;
    const vikt = (row[c.cVikt] === '' || row[c.cVikt] === null) ? null : Number(row[c.cVikt]);
    const state = stateByKey[key];

    // Utvärdera mot allt tidigare (state) INNAN denna rad räknas in — bara
    // för set i målsessionen, och bara om det fanns tidigare set (state finns).
    if (state && _normalizePassId(row[c.cPassId]) === target) {
      const pr = _prVsState(state, vikt, reps);
      if (pr.weightPR || pr.repPR) {
        result.push({
          övning: övning, setNr: Number(row[c.cSetNr]), reps: reps, vikt: vikt,
          weightPR: pr.weightPR, repPR: pr.repPR
        });
      }
    }

    _prAddToState(stateByKey[key] || (stateByKey[key] = _newPrState()), vikt, reps);
  });
  return result;
}
