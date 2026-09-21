# Programhistorik

Varför programmen ser ut som de gör. Sammanställd 2026-09-21 ur källor som
riskerade att skiljas åt: Apps Script-versionshistoriken (67 versioner, fanns
bara i Google-molnet), de daterade resonemangen i `appscript/Code.js`,
`Bank_Chins_Block1.md` och träningsloggen.

Sifforna under "Vad loggen visar" är räknade ur `SwoleSheet-20260813.xlsx`
(869 loggade set, 51 träningsdagar, 2026-04-13 → 2026-08-12), inte hämtade ur
planeringen. Där de bekräftar eller motsäger ett påstående i koden står det.

---

## Grundvalar

| | |
|---|---|
| Längd / kroppsvikt | 196 cm / 92 kg |
| Bänk 1RM | **130 kg**, kontrollerat |
| Chins 1RM | systemvikt **~152 kg** (+60 adderat vid 92 kg kroppsvikt) |
| Tävlar | nej |
| Begränsning | rygg (knäböj/marklyft körs submaximalt), höger axel |

Båda maxen är härledda ur loggen och satta **medvetet i underkant** — *Josefs
regel: hellre för lågt inmatat max än för högt.* Konsekvensen är att alla
procentsatser i programmen är något konservativa med flit.

Bänkens 130 bekräftades 2026-08-14 mot tre loggpunkter som alla pekade åt samma
håll: 5 @112,5 RIR 1-2 (30/7), 4 @117,5 RIR 0-1 (7/8), AMRAP 5 @112,5 (14/8) —
skattningar kring 133-134. 130 ligger alltså 2-4 kg under, precis som avsett.
Inga vikter ändrades.

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

### Bänk & Chins v2 (designad 2026-08-13, 6 veckor) — nuvarande
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

**Greppet.** Pekfingrarna på ringarna = maximalt tillåtet tävlingsgrepp, med
bulldog-grepp. Dipsen går betydligt djupare än bänken utan att axeln känns,
vilket avfärdar bottenläget/ROM som orsak. Kvar som skillnad: abduktionsvinkeln.
Ringgrepp på 196 cm ställer överarmarna nästan rakt ut från bålen i botten;
dipsen håller dem intill kroppen. **Ringgreppet är optimerat för tävling — han
tävlar inte, så han betalar axelkostnaden utan att få vinsten.** Därför grepptest
i vecka 1. Cue: underarmarna lodräta i botten (skalar mot hans egna armlängder,
till skillnad från centimetermått). Bulldog-greppet lämnas orört — en variabel i
taget.

**Mätpunkten i vecka 5.** AMRAP 112,5 med baslinje 5 reps från 14/8 och samma
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
| **v67** | **grepptest v1 + militärpress ersätter smalbänk** — nuvarande deploy |
