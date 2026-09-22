# Programhistorik

Varför programmen ser ut som de gör. Sammanställd 2026-09-21 ur källor som
riskerade att skiljas åt: Apps Script-versionshistoriken (67 versioner, fanns
bara i Google-molnet), de daterade resonemangen i `appscript/Code.js`,
`Bank_Chins_Block1.md` och träningsloggen.

Siffrorna är räknade ur loggen, inte hämtade ur planeringen. Där de bekräftar
eller motsäger ett påstående i koden står det. "Vad loggen faktiskt visar" bygger
på `SwoleSheet-20260813.xlsx` (869 set, 2026-04-13 → 2026-08-12); "Utfallet av
cykel 1" på 337 set hämtade live 2026-09-21 via `?export=Logg`.

---

## Grundvalar

| | |
|---|---|
| Längd / kroppsvikt | 196 cm / 92 kg |
| Bänk träningsmax | **137,5 kg** sedan 2026-09-21 (var 130) |
| Chins 1RM | systemvikt **~154 kg** vid 92 kg kroppsvikt (var ~152) |
| 1RM-test | inget förrän *skattat* max passerat 160 |
| Tävlar | nej |
| Begränsning | rygg (knäböj/marklyft körs submaximalt), höger axel |

Båda maxen är härledda ur loggen och satta **medvetet i underkant** — *Josefs
regel: hellre för lågt inmatat max än för högt.* Konsekvensen är att alla
procentsatser i programmen är något konservativa med flit.

Bänkens 130 bekräftades 2026-08-14 mot tre loggpunkter kring 133-134, och låg
alltså 2-4 kg under skattningen precis som avsett. **Det maxet föll 2026-09-21**
när cykel 1:s mätpunkt gav 10 reps på 112,5 — se Utfallet av cykel 1. Nya
träningsmaxet 137,5 är satt på samma konservativa princip och ligger 8-12 kg
under formlernas 145-150.

---

## Programkedjan

### Tungt / Bänkfokus (april–maj)
Utgångsläget. Fyra pass, bänk på tre av dem. Loggen börjar 2026-04-13 med
120 kg × 3.

### Bänk & Chins, Block 1 (4 veckor)
Dokumenterat i sin helhet i `Bank_Chins_Block1.md`. Tre bänkpass med olika
fokus — volym (P1) → pump (P2) → intensitet (P3) — och chins på tre av fyra
pass. v1-v3 progressiv ökning, v4 deload.

### Bänk & Chins, Cykel 2 (designad 2026-07-10)
`importBankChinsCykel2()`. Byggd ur cykel 1-loggen. Nedskuren till ~14-16 set
per pass för att passa 60-minuterspass: dips struken ur Pass 1, superset B =
spidercurl + reverse flyes. Superset A (militärpress + sidolyft) ströks
2026-07-26 — *David vill inte superset:a samma muskelgrupp.*

**Blocket sprack.** Loggen visar RIR 0 från vecka 2 ("Rir 0-1", "0 rir", "inte
en chans till 8", arg högeraxel), och benpasset kraschade 8/8: knäböj gick
5-5-5-**1** på 110 kg, marklyft 6-**4** på 135.

Därför skrevs vecka 3-4 om 2026-08-13 så blocket kunde **avslutas** i stället
för testas: bänkens 122,5-trea ströks så AMRAP:en på 112,5 kunde köras färsk och
bli mätpunkten som satte nästa program. Knäböj 112,5→102,5 och marklyft
137,5→127,5 på RIR 3.

Deloaden vändes samtidigt rätt enligt Helms (TMaSP s. 65-66): tidigare sänktes
*vikten* ~12 % medan repsen behölls — nu tvärtom, vikten står kvar och ett till
två set faller bort. Undantaget är knäböj och marklyft, där vikten sänks mer än
Helms skulle: där är ryggen begränsningen och deloadens jobb är återhämtning,
inte stimulans.

### Bänk & Chins v2 (designad 2026-08-13, 6 veckor) — cykel 1
`importBankChinsV2()`. Egen flik, så det gamla blocket kunde köras klart först.

Designen i tre meningar: **tre OLIKA bänkpass i stället för tre likadana**
(undulering är värd ~27 %/v på bänk hos tränade), **bänkvolymen ner ~60 %** men
andelen arbete över 80 % upp från 0,8 till ~6 set/vecka, och **EN tung
chinsexponering** i stället för tre. Vecka 6 = deload, volymen halveras och
vikten står kvar.

Passfördelning: Pass 1 måndag (bänk lätt/teknik), Pass 2 onsdag (bänk tungt),
Pass 3 fredag (chins tungt), Pass 4 lör/sön (ben).

#### Revidering 2026-08-13, efter två externa coachgenomgångar
- Måndagens breda chins → **viktade chins 4×3**. Måndagsprincipen "tung stång,
  lätta set" gällde bara bänken; nu gäller den båda huvudlyften. Sänker
  måndagens dragreps från 24-36 till 12.
- **Breda chins flyttade till onsdagen**, 2 set. Onsdag och inte fredag för att
  greppet ska vara utvilat till lördagens marklyft.
- **Incline hantelcurl på måndagen**: 2 → 5 direkta bicepsset/vecka, och det
  sträckta läget täcks (spidercurl tränar bara det förkortade).
- **Primer-singel** i toppsetens noteringar vecka 1-4. Singeln ligger ALDRIG
  över dagens toppsetvikt — båda coacherna ville ha 90 %, vilket hade gjort
  primern till dagens tyngsta stång och stulit från toppsetet. Vecka 5 körs utan
  primer: mätpunkten måste vara protokollidentisk för att vara jämförbar.
- Dips: bytesvillkoret dokumenterat i förväg i vecka 1:s notering.

#### Revidering 2026-08-14
- **Militärpressen ersatte bänkpress smalt grepp** i Pass 3. Smalbänken var en
  uttalad platshållare ("finns för stångkontakt och triceps", "pressas aldrig
  framåt"). Militärpressen är det enda pressandet som gått framåt i loggen och
  den axeln inte reagerar på.
- **Grepptest i vecka 1** (se Öppna spår).
- Accessoarernas ordning satt så att den som stryks vid tidsbrist (bakifrån) är
  den som betyder minst för bänk och chins — därav sidolyft sist i alla pass.

#### Planerad vila (v56-v57)
Vila blev en egen valfri kolumn i programschemat, satt per övning eller per
segment, så ett toppset kan vila 4-5 min medan back-off-seten på samma övning
vilar 3.

---

### Bänk & Chins v2, cykel 2 (designad 2026-09-21) — nuvarande

Första blocket som INTE fick en egen flik. `Cykel`-kolumnen infördes 2026-09-22
så samma flik bär flera varv av samma struktur: **cykel 1 är blocket ovan,
cykel 2 är progressionen skriven ur dess logg.** Ny flik behövs först vid
strukturändring — löpande progression är en ny cykel.

Strukturen är oförändrad. Procentsatserna är identiska (80/84/87/91 % mot
cykel 1:s 79/83/87/90), så det är samma block mot ett rättat max.

**Grundvalen flyttad: bänk 130 → 137,5.** Se nedan för mätningen som motiverar
det. Chins får +35 som ny referens, systemvikt-1RM ≈ 154.

Ändringar, var och en ur loggen:

- **Mätpunkten 112,5 → 117,5.** Tio reps mäter uthållighet snarare än styrka,
  och noteringen sa att tionde repet var tveksamt. Ligger under vecka 3:s
  toppset (120), så mätdagen möts på känd mark.
- **Grepptestet struket.** Hypotesen föll — se Öppna spår.
- **Knäböj −5 %, och vikten omskriven till ett tak.** Han träffade varje set men
  noterade RIR 0–2 där planen sa 3.
- **Marklyftets vikt likaså ett tak.** Vecka 3 togs 120 mot planens 117,5, och
  det var precis där ryggen sa ifrån.
- **Spidercurl 10–15 → 15–25 reps.** Fast stång 30 kg; han gjorde 24–25 reps
  med rest-pause. Intervallet beskriver nu övningen som den faktiskt körs.
- **Gående utfall 3 → 2 set.** Han körde två ändå.
- **Militärpressen försiktig.** 62,5×6 på ärlig RIR 1 ger e1RM ~77, så 65×6 är
  inte möjligt i vecka 1. Repsen stiger sist; vecka 5:s 3×6 @ 65 är målet.
- **Inga singlar.** Davids beslut: inget 1RM-test förrän skattat max passerat
  160. AMRAP är därmed enda instrumentet, och protokollet hålls identiskt.

## Utfallet av cykel 1 (17 aug – 18 sep 2026)

Räknat ur 337 loggade set över 20 pass. Full genomgång med diagram:
`claude.ai/artifact/3vdTpxPbN46pZg2Lf4QWHQ`

**Mätpunkten: AMRAP 112,5 gav 10 reps** mot en baslinje på 5 den 14 aug.
Greppet var bekräftat oförändrat (maximal bredd), så mätningen är
protokollidentisk och jämförbar. Epley ger 150 på tio reps, 146 på nio —
noteringen sa *"Kanske tveksamt utförande på sista"*. Programmets egen
omräkningstabell slutade vid `8+ = 137,5` och räckte alltså inte.

Att 137,5 ändå valdes som nytt träningsmax har två skäl: baslinjen togs i
vecka 3 av ett block som gått på RIR 0, alltså trött, vilket överdriver
förbättringen; och David tränar aldrig singlar, så neural vana vid maximal
last saknas och ett testat max underpresterar regelmässigt mot formeln.
Kontroll på att det är konservativt: mot 137,5 förutsäger Epley 6,7 reps på
112,5 — han gjorde 10.

**Chins AMRAP +32,5 gav 7 reps** → systemvikt-1RM ≈ 154, ny referens +35.

**Designhypotesen höll.** Bänkreps/vecka 133 → 36 (−73 %), set ≥ 80 % av 1RM
1,2 → 6,1 per vecka (5×), tonnage 12,2 → 3,8 ton. Mätpunkten steg ändå
kraftigt — stimulansen låg aldrig i tonnaget.

**20 av 20 planerade pass genomförda**, inte ett missat set. Och progressionen
var inte koncentrerad till huvudlyften: sälrodd +33 %, maskinrodd +28 %, breda
chins från kroppsvikt till +10 kg, spidercurl 15 → 25 reps, sidolyft +40 %.

**Militärpressen nådde blockets mål**: 62,5 × 6, vilket motsvarar juniformens
65 × 5. Raset i juni var ett programbyte, inte en styrkeförlust — nu bevisat.

Signaler ur noteringarna: höger axel **helt tyst** i fem veckor (se Öppna spår);
vänster axel gav ifrån sig en gång i lutande hantelpress vecka 2 och hanterades
genom att han höll igen; ryggen sa ifrån på marklyft vecka 3 vid en vikt tagen
över plan. Passen drog 81 min i median mot 60-målet, Pass 3 upp mot 92 — David
bedömer att tiden går att hantera men inte tål mer.

## Vad loggen faktiskt visar

Räknat ur exporten 2026-08-13. **Estimerade 1RM använder Epley** och är grova.

### Bänkpress — 153 set över 37 pass
Toppsetet har legat platt kring e1RM 130-136 hela perioden. Det som ändrats är
*hur* volymen fördelats, inte styrkenivån.

| Månad | Set | Reps | Tonnage |
|---|---|---|---|
| april | 14 | 123 | 10,8 t |
| maj | 35 | 429 | 37,6 t |
| juni | 50 | 524 | 47,4 t |
| juli | 34 | 389 | 35,2 t |
| augusti (t.o.m. 12/8) | 20 | 212 | 19,8 t |

Junitoppen på 524 reps är den volym v2 medvetet skär ~60 % ifrån.

### Militärpress — bekräftar kommentaren exakt
Kommentaren i `Code.js` motiverar v2:s vikter med att 57,5 är *ett golv att
bygga från, inte ett tak*. Loggen bekräftar påståendet rad för rad:

| Datum | Toppset | e1RM |
|---|---|---|
| 2026-06-15 | 65 × 5 | ~76 |
| 2026-06-22 | **50** × 6 | ~60 |
| 2026-08-03 | 57,5 × 6 | ~69 |
| 2026-08-10 | 57,5 × 6 | ~69 |

Raset 15/6 → 22/6 var ett **programbyte, inte en styrkeförlust**. Därför siktar
v2 på 62,5 × 6 i vecka 5 ≈ 65 × 5, alltså tillbaka till juniformen.

### Viktade chins — den tydligaste progressionen
Systemvikt (kroppsvikt + tillagd) e1RM från ~136 i juli till **~148 den 10/8**
(+35 × 5). Det bekräftar kommentaren *"Du tog 5 reps här 10/8 - trean ska
sitta"*. Chinsen är det lyft som faktiskt rört sig.

### Knäböj och marklyft
Knäböj pendlar 120-128 e1RM, marklyft 156-162 med en långsam klättring
130 → 135 kg × 6. Båda hålls submaximalt med flit.

---

## Öppna spår

**Axeln.** Höger axel strular ENBART i bänkpressen — inte i chins, dips, lutande
hantelpress eller rodd. Alltså inte en trasig axel utan något positionsspecifikt.
Åtgärd: förtydligad cue i vecka 1 — "höften kvar" är en tävlingsregel och betyder
INTE platt rygg; överryggen ska vara välvd med skulderbladen ihop och ner, annars
hamnar axeln i djup extension i botten av varje rep. Dips lämnades kvar trots
bytesvillkoret: symtomet är bänkspecifikt, och att ta bort en symtomfri övning är
att gissa.

**Greppet — AVGJORT 2026-09-21.** Hypotesen nedan föll. David körde maximal
bredd hela cykel 1 utan att göra grepptestet, och höger axel var **symtomfri i
fem veckor** mot återkommande besvär i föregående block. Greppvidden var alltså
inte orsaken; det som löste axeln var den sänkta bänkvolymen, cuen om välvd
överrygg, den borttagna pumpbänken och face pull. Grepptestet är struket ur
cykel 2 och de fyra åtgärderna behålls. Resonemanget bevaras nedan som historik.

**Greppet (ursprunglig hypotes, falsifierad).** Pekfingrarna på ringarna = maximalt tillåtet tävlingsgrepp, med
bulldog-grepp. Dipsen går betydligt djupare än bänken utan att axeln känns,
vilket avfärdar bottenläget/ROM som orsak. Kvar som skillnad: abduktionsvinkeln.
Ringgrepp på 196 cm ställer överarmarna nästan rakt ut från bålen i botten;
dipsen håller dem intill kroppen. **Ringgreppet är optimerat för tävling — han
tävlar inte, så han betalar axelkostnaden utan att få vinsten.** Därför grepptest
i vecka 1. Cue: underarmarna lodräta i botten (skalar mot hans egna armlängder,
till skillnad från centimetermått). Bulldog-greppet lämnas orört — en variabel i
taget.

**Mätpunkten — utfall 10 reps, se Utfallet av cykel 1.** Nästa mätning är AMRAP
117,5 i vecka 5 av cykel 2. Omräkning: 4 reps=133, 5=137,5, 6=141, 7=145,
8=151, 9=153, 10=157.

**Mätpunkten i cykel 1 (historik).** AMRAP 112,5 med baslinje 5 reps från 14/8 och samma
stoppregel: avbryt vid teknikförfall, INTE failure — annars mäts stoppregeln och
inte styrkan. **Varning:** har greppet smalnats sedan 14/8 är baslinjen inte
längre jämförbar; då är mätningen en ny nollpunkt och färre reps betyder inte
tillbakagång. Tabellen gäller ändå: 5 reps=130, 6=132,5, 7=135, 8+=137,5.

---

## Materialet

Ligger i `/Users/david/dev/swolesheet/material/` (utanför repot, ~170 MB).

| Källa | Vad den använts till |
|---|---|
| Eric Helms — *TMaSP Training v1.0.4* | Deload-doktrinen (vikten kvar, volymen ner, s. 65-66), RIR-ankare, "flerledsövning aldrig till failure" |
| *Bench Press Junk Volume Kings & Queens* (+ xlsx, `jv.txt`) | Bänkramverket: tre olika pass/vecka, 7-veckorscykel, uppvärmningsprotokoll |
| Israetel/Hoffman/Smith — *Scientific Principles of Strength Training* | Volymlandmärken |
| RP — *Hypertrophy Volume Mini-eBook*, *How Much Should I Train*, *Recovering From Training* | MEV/MRV, återhämtning |
| Jeff Nippard — *All Books* | Övningsval, regional hypertrofi (sträckt vs förkortat läge) |
| Jim Wendler *5-3-1*, *StrongLifts 5×5* | Referensramar |

Utöver litteraturen: **två externa coachgenomgångar** 2026-08-13, och **Josefs
regel** om konservativa max. Båda finns bara bevarade som kodkommentarer.

---

## Tidslinje — Apps Script-versioner

Fanns bara i Google-molnet. Bevarad här eftersom den är projektets egentliga
logg; git har bara 33 commits och började sent.

| Ver | |
|---|---|
| v1-v12 | grunduppsättning: set-nr, målvikt, fler set, samlat senaste-passet-kort, avbryt pass, iframe-stöd |
| v13-v21 | Tungt-design (mörkt tema, neongrön accent), historik, redigera och ta bort loggat set |
| **v22** | **flera program** — ett program per flik |
| **v23** | **progressionsmotor** — veckodimension + veckoväljare |
| v24-v27 | import Bänk & Chins, prestanda (en läsning per program) |
| **v28** | **segmenterade övningar** — toppset/back-off som egna rader + RIR-fält |
| v29-v34 | kalibrering: ärlig RIR på Pass 1, valfria övningar, byt/lägg till övning per pass |
| v35-v40 | veckoprogression + MÅL-kolumn, stabil passöversikt, uppdelad frontend, PWA-signal |
| **v41** | **cykelräknare + veckowrap** |
| v42-v45 | cykel 2-import, spidercurl repsprogression, superset A slopat |
| v46-v51 | spökrader ("Ej idag"), passummering med PR per övning, Pass-ID-normalisering, idempotent logSet |
| **v52** | **Bänk & Chins v2** — nytt 6-veckorsprogram |
| v53 | avslutning + omvänd deload för gamla Bänk & Chins |
| v54-v55 | v2 reviderat efter coachgenomgångarna (v55 = återställning efter felaktig push från repo-roten) |
| **v56-v57** | **planerad vila** per övning och segment, egen Vila-kolumn |
| v65 | mätpunkt 14/8 inskriven: baslinje 5 @112,5 + stoppregel |
| v66 | axelcue: höften kvar betyder inte platt rygg |
| v67 | grepptest v1 + militärpress ersätter smalbänk |
| **v68** | **cykelstöd i programfliken** — en flik bär flera varv; nuvarande deploy |
