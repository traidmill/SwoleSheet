// Offline-test av Code.js: stubbar Apps Script-globaler och kör multi-program-vägarna.
// Körs med: node test/backend_test.js
const fs = require('fs');
const path = require('path');

// --- minimal fake av Sheets/Properties ---
function pad(n) { return String(n).padStart(2, '0'); }
function fmt(d, p) {
  const base = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  if (p === 'yyyy-MM-dd HH:mm') return base + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  return base;
}

class Range {
  constructor(sheet, r, c, nr, nc) { this.sheet = sheet; this.r = r; this.c = c; this.nr = nr; this.nc = nc; }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const row = [];
      for (let j = 0; j < this.nc; j++) {
        const rr = this.sheet.data[this.r - 1 + i] || [];
        row.push(rr[this.c - 1 + j] === undefined ? '' : rr[this.c - 1 + j]);
      }
      out.push(row);
    }
    return out;
  }
  setValue(v) {
    while (this.sheet.data.length < this.r) this.sheet.data.push([]);
    this.sheet.data[this.r - 1][this.c - 1] = v;
    return this;
  }
  setValues(vals) {
    for (let i = 0; i < vals.length; i++) {
      while (this.sheet.data.length < this.r + i) this.sheet.data.push([]);
      for (let j = 0; j < vals[i].length; j++) this.sheet.data[this.r - 1 + i][this.c - 1 + j] = vals[i][j];
    }
    return this;
  }
  setNumberFormat() { return this; }
  setFontWeight() { return this; }
}
class Sheet {
  constructor(name, data) { this.name = name; this.data = data; }
  getName() { return this.name; }
  getDataRange() { return new Range(this, 1, 1, this.data.length, this.getLastColumn()); }
  getLastRow() { return this.data.length; }
  getLastColumn() { return this.data.reduce((m, r) => Math.max(m, r.length), 0); }
  getMaxRows() { return this.data.length; }
  getRange(r, c, nr, nc) { return new Range(this, r, c, nr === undefined ? 1 : nr, nc === undefined ? 1 : nc); }
  appendRow(arr) { this.data.push(arr.slice()); }
  setFrozenRows() {}
  clear() { this.data = []; return this; }
}
class Spreadsheet {
  constructor(sheets) { this.sheets = sheets; }
  getSheets() { return this.sheets; }
  getSheetByName(n) { return this.sheets.find(s => s.name === n) || null; }
  insertSheet(n) { const s = new Sheet(n, []); this.sheets.push(s); return s; }
}

// --- testdata: två program + Logg + Sessions ---
const programTungt = new Sheet('Program', [
  ['Pass', 'Ordning', 'Övning', 'Set', 'Reps', 'Målvikt', 'Notering'],
  ['Pass 1', 1, 'Bänkpress', 4, '3-5', 120, ''],
  ['Pass 1', 2, 'Chins', 4, 'Max', '', ''],
  ['Pass 2', 1, 'Bänkpress', 3, '15-20', 80, '']
]);
const programVolym = new Sheet('Program: Volymblock', [
  ['Pass', 'Ordning', 'Övning', 'Set', 'Reps', 'Målvikt', 'Notering'],
  ['Push', 1, 'Lutande hantelpress', 4, '8-12', 32, ''],
  ['Pull', 1, 'Latsdrag', 4, '10-12', 70, '']
]);
const logg = new Sheet('Logg', [
  ['Datum', 'Pass', 'Övning', 'Set nr', 'Reps', 'Vikt', 'Kommentar', 'Pass-ID', 'Program'],
  // Legacy-rad (tom Program) → ska tillhöra default-programmet "Tungt"
  ['2026-04-13', 'Pass 1', 'Bänkpress', 1, 3, 120, '', '', ''],
  // Tungt med Pass-ID + Program
  ['2026-06-10', 'Pass 1', 'Bänkpress', 1, 3, 122.5, '', '2026-06-10 17:32', 'Tungt'],
  // Volymblock-rad
  ['2026-06-12', 'Push', 'Lutande hantelpress', 1, 10, 32, '', '2026-06-12 17:00', 'Volymblock']
]);
const sessions = new Sheet('Sessions', [
  ['Pass-ID', 'Pass', 'Datum', 'Start-tid', 'Slut-tid', 'Notering', 'Program'],
  ['2026-06-10 17:32', 'Pass 1', '2026-06-10', '2026-06-10', '2026-06-10', '', 'Tungt'],
  ['2026-06-12 17:00', 'Push', '2026-06-12', '2026-06-12', '2026-06-12', '', 'Volymblock']
]);
// Vecko-program (Vecka-kolumn). Olika målvikt per vecka + en gemensam rad (tom Vecka).
const programBank = new Sheet('Program: Bänkfokus', [
  ['Vecka', 'Pass', 'Ordning', 'Övning', 'Set', 'Reps', 'Målvikt', 'RIR', 'Notering'],
  [1, 'Pass 1', 1, 'Bänkpress', 10, '10', 82.5, 2, ''],
  // Chins viktad = två segment (top-set + back-off) under samma övning
  [1, 'Pass 1', 2, 'Chins viktad', 1, '5', 27.5, 3, 'Top-set'],
  [1, 'Pass 1', 2, 'Chins viktad', 2, '8', 17.5, 3, 'Back-off'],
  [2, 'Pass 1', 1, 'Bänkpress', 10, '10', 85, 2, ''],
  [2, 'Pass 1', 2, 'Chins viktad', 1, '5', 30, 1, 'Top-set'],
  ['', 'Pass 1', 3, 'Plankan', 3, 'Max', '', '', 'gäller alla veckor']
]);
const ss = new Spreadsheet([programTungt, programVolym, programBank, logg, sessions]);

// --- globala stubbar ---
const props = {};
// flush() är en no-op här: fejken skriver synkront till minnet, så det finns
// inget att tömma. Stubben behövs för att endPass ska gå att köra offline.
global.SpreadsheetApp = { getActiveSpreadsheet: () => ss, flush: () => {} };
global.Session = { getScriptTimeZone: () => 'Europe/Stockholm' };
global.Utilities = { formatDate: (d, tz, p) => fmt(d, p) };
global.PropertiesService = {
  getDocumentProperties: () => ({
    getProperty: (k) => (k in props ? props[k] : null),
    setProperty: (k, v) => { props[k] = v; }
  })
};
global.HtmlService = {
  createHtmlOutputFromFile: () => ({ setTitle: () => ({}) }),
  XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' },
  // Kedjan i doGet: evaluate().setTitle().setFaviconUrl().setXFrameOptionsMode().addMetaTag()
  createTemplateFromFile: (name) => {
    const chain = { _html: name };
    ['evaluate','setTitle','setFaviconUrl','setXFrameOptionsMode','addMetaTag']
      .forEach(m => { chain[m] = () => chain; });
    return chain;
  }
};
global.ContentService = {
  MimeType: { JSON: 'application/json' },
  createTextOutput: (t) => ({ _text: t, setMimeType(m) { this._mime = m; return this; } })
};

// --- ladda Code.js i denna scope ---
const src = fs.readFileSync(path.join(__dirname, '..', 'appscript', 'Code.js'), 'utf8');
eval(src);

// --- assertions ---
let failed = 0;
function eq(label, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) { console.error('FAIL: ' + label + '\n  fick:      ' + a + '\n  förväntat: ' + e); failed++; }
  else console.log('ok: ' + label);
}

eq('_programNameFromSheet(Program)', _programNameFromSheet('Program'), 'Tungt');
eq('_programNameFromSheet(Program: Volymblock)', _programNameFromSheet('Program: Volymblock'), 'Volymblock');
eq('_programNameFromSheet(Logg) = null', _programNameFromSheet('Logg'), null);
eq('_listPrograms namn', _listPrograms().map(p => p.name), ['Tungt', 'Volymblock', 'Bänkfokus']);
eq('_defaultProgramName', _defaultProgramName(), 'Tungt');

eq('getProgram(Tungt) pass', getProgram('Tungt').map(p => p.pass), ['Pass 1', 'Pass 2']);
eq('getProgram(Volymblock) pass', getProgram('Volymblock').map(p => p.pass), ['Push', 'Pull']);

// Tungt: legacy-rad (tom Program) + Tungt-rad räknas; Volymblock-raden ska INTE.
const statsTungt = getListStats('Tungt');
eq('listStats Tungt lastDateByPass', statsTungt.lastDateByPass, { 'Pass 1': '2026-06-10' });
const statsVolym = getListStats('Volymblock');
eq('listStats Volymblock lastDateByPass', statsVolym.lastDateByPass, { 'Push': '2026-06-12' });

// Historik scopad per program
eq('getHistory(Tungt) pass', getHistory(50, 'Tungt').map(h => h.pass).sort(), ['Pass 1', 'Pass 1']);
eq('getHistory(Volymblock) pass', getHistory(50, 'Volymblock').map(h => h.pass), ['Push']);

// Aktivt program + byte
eq('default activeProgram', _getActiveProgram(), 'Tungt');
const sw = setActiveProgram('Volymblock');
eq('setActiveProgram returnerar program', sw.activeProgram, 'Volymblock');
eq('setActiveProgram pass', sw.program.map(p => p.pass), ['Push', 'Pull']);
eq('activeProgram persisterat', _getActiveProgram(), 'Volymblock');

// getInitData speglar aktivt program
const init = getInitData();
eq('getInitData programs', init.programs.map(p => p.name), ['Tungt', 'Volymblock', 'Bänkfokus']);
eq('getInitData passCount', init.programs.map(p => p.passCount), [2, 2, 1]);
eq('getInitData weeks (Volymblock, ingen Vecka-kol)', init.weeks, [1]);

// --- Vecko-progression ---
eq('_getProgramWeeks(Bänkfokus)', _getProgramWeeks('Bänkfokus'), [1, 2]);
eq('_getProgramWeeks(Tungt) utan Vecka-kol', _getProgramWeeks('Tungt'), [1]);
eq('default currentWeek = första veckan', _getCurrentWeek('Bänkfokus'), 1);

// Vecka 1: Bänkpress 82.5, + gemensam rad (Plankan) gäller alla veckor
const bf1 = getProgram('Bänkfokus', 1);
const ex1 = bf1[0].exercises;
eq('Bänkfokus v1 Bänkpress målvikt', ex1.find(e => e.övning === 'Bänkpress').målvikt, 82.5);
eq('Bänkfokus v1 har gemensam Plankan', ex1.some(e => e.övning === 'Plankan'), true);
eq('Bänkfokus v1 Chins viktad målvikt (segment[0])', ex1.find(e => e.övning === 'Chins viktad').målvikt, 27.5);

// Segment: Chins viktad har 2 segment (top-set + back-off), set = summa, RIR parsad
const chins1 = ex1.find(e => e.övning === 'Chins viktad');
eq('Chins viktad har 2 segment', chins1.segments.length, 2);
eq('Chins viktad set = summa (1+2)', chins1.set, 3);
eq('Chins viktad segment[0] RIR', chins1.segments[0].rir, 3);
eq('Chins viktad segment[1] back-off vikt', chins1.segments[1].målvikt, 17.5);
eq('Bänkpress (en rad) → ett segment', ex1.find(e => e.övning === 'Bänkpress').segments.length, 1);
eq('Bänkpress segment RIR', ex1.find(e => e.övning === 'Bänkpress').segments[0].rir, 2);
// Bakåtkompat: Tungt utan RIR-kolumn → segment med rir null
eq('Tungt segment rir null (ingen RIR-kol)', getProgram('Tungt')[0].exercises[0].segments[0].rir, null);

// Vecka 2: tyngre + samma gemensamma rad
const bf2 = getProgram('Bänkfokus', 2);
const ex2 = bf2[0].exercises;
eq('Bänkfokus v2 Bänkpress målvikt', ex2.find(e => e.övning === 'Bänkpress').målvikt, 85);
eq('Bänkfokus v2 har gemensam Plankan', ex2.some(e => e.övning === 'Plankan'), true);

// setCurrentWeek persisterar och styr default-veckan
const scw = setCurrentWeek('Bänkfokus', 2);
eq('setCurrentWeek returnerar vecka', scw.week, 2);
eq('setCurrentWeek program = v2', scw.program[0].exercises.find(e => e.övning === 'Bänkpress').målvikt, 85);
eq('currentWeek persisterat', _getCurrentWeek('Bänkfokus'), 2);
eq('getProgram(Bänkfokus) utan vecka = aktuell vecka (2)', getProgram('Bänkfokus')[0].exercises.find(e => e.övning === 'Bänkpress').målvikt, 85);
// Ogiltig vecka faller tillbaka på en giltig
eq('setCurrentWeek ogiltig → giltig', setCurrentWeek('Bänkfokus', 99).week, 1);

// Skriv-vägar: startPass + logSet ska stämpla aktivt program.
// Aktivt program är "Volymblock" efter setActiveProgram ovan.
const started = startPass('Push');
eq('startPass stämplar program', started.program, 'Volymblock');
const sCols = sessions.data[0];
const newSessRow = sessions.data[sessions.data.length - 1];
eq('Sessions-rad fick Program', newSessRow[sCols.indexOf('Program')], 'Volymblock');

const act = getActiveSession();
eq('getActiveSession returnerar program', act && act.program, 'Volymblock');
eq('getActiveSession tomma mods', act && act.mods, { subs: {}, added: [] });

// Per-pass-ändringar (byt/lägg till övning) round-trip via Sessions-fliken.
setSessionMods(started.passId, { subs: { 'Latsdrag': 'Pulldown' }, added: ['Pec deck'] });
const act2 = getActiveSession();
eq('setSessionMods → subs persisterat', act2.mods.subs.Latsdrag, 'Pulldown');
eq('setSessionMods → added persisterat', act2.mods.added, ['Pec deck']);

logSet({ datum: '2026-06-17', pass: 'Push', övning: 'Latsdrag', setNr: 1, reps: 10, vikt: 70, passId: started.passId, program: 'Volymblock' });
const lCols = logg.data[0];
const newLogRow = logg.data[logg.data.length - 1];
eq('Logg-rad fick Program', newLogRow[lCols.indexOf('Program')], 'Volymblock');

// --- programimport: båda importfunktionerna bygger sin flik och läses tillbaka ---
// Radantalen är regressionsvakter: ändrar man ett program ska siffran uppdateras
// medvetet, inte råka glida. Ett segment = en rad, så summan fångar både
// borttagna övningar och ändrad segmentstruktur.
const V1 = 'Bänk & Chins', V2 = 'Bänk & Chins v2';
eq('importBankChinsCykel2 radantal', importBankChinsCykel2(), 86);
// 288 = två cykler à 144 rader i EN flik.
eq('importBankChinsV2 radantal', importBankChinsV2(), 288);
eq('båda programmen syns i _listPrograms',
  _listPrograms().map(p => p.name).filter(n => n.indexOf('Bänk & Chins') === 0), [V1, V2]);
eq('Bänk & Chins veckor', _getProgramWeeks(V1), [1, 2, 3, 4]);
eq('Bänk & Chins v2 veckor', _getProgramWeeks(V2), [1, 2, 3, 4, 5, 6]);

// Hjälpare: plocka en övning ur ett visst pass (0-indexerat), vecka och cykel.
function ex(prog, vecka, passIdx, namn, cykel) {
  return getProgram(prog, vecka, cykel)[passIdx].exercises
    .find(function (e) { return e.övning === namn; });
}

// ══════════ CYKELMEKANIKEN ══════════
// En flik bär flera varv av samma program med olika vikter, så en ny flik bara
// behövs vid strukturändring och inte vid löpande progression.
eq('v2-fliken har två cykler', _getProgramCycles(V2), [1, 2]);
eq('båda cyklerna har sex veckor', [_getProgramWeeks(V2, 1), _getProgramWeeks(V2, 2)],
  [[1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6]]);
// Cyklerna är olika program — samma struktur, olika vikter.
eq('cykel 1 och 2 har olika bänkvikter',
  [ex(V2, 1, 1, 'Bänkpress', 1).segments[0].målvikt,
   ex(V2, 1, 1, 'Bänkpress', 2).segments[0].målvikt], [102.5, 110]);
eq('samma övningar i båda cyklerna',
  getProgram(V2, 1, 1).map(p => p.exercises.length),
  getProgram(V2, 1, 2).map(p => p.exercises.length));
// Räknaren kan gå förbi sista skrivna cykeln — då körs den sista vidare i
// stället för att falla tillbaka till de lättaste vikterna.
const b5 = _programBundle(V2, 1, 5);
eq('cykel bortom fliken faller till högsta definierade', b5.cycle, 2);
eq('fallbacken ger cykel 2:s vikter', b5.program[1].exercises[0].segments[0].målvikt, 110);
// Program utan Cykel-kolumn läses precis som förr.
eq('flik utan Cykel-kolumn påverkas inte', _programBundle(V1, 1).cycle, 1);
eq('flik utan Cykel-kolumn har inga cykler', _getProgramCycles(V1), []);

// ══════════ CYKEL 1 — blocket som kördes 17 aug–18 sep 2026 ══════════
// Bevaras oförändrat så plan kan jämföras mot utfall för de 19 loggade passen.
const v2w1 = getProgram(V2, 1, 1);
eq('v2 pass-ordning', v2w1.map(p => p.pass), ['Pass 1', 'Pass 2', 'Pass 3', 'Pass 4']);
eq('v2 Pass 1 övningar', v2w1[0].exercises.map(e => e.övning),
  ['Bänkpress', 'Viktade chins (lätt)', 'Maskinrodd', 'Overhead tricepsextension',
   'Incline hantelcurl', 'Reverse flyes', 'Sidolyft']);
eq('v2 Pass 3 leds av tunga chins, inte bänk', v2w1[2].exercises[0].övning, 'Viktade chins');
eq('breda chins ligger på onsdagen', v2w1[1].exercises.some(e => e.övning === 'Breda chins'), true);
eq('militärpress ersatte smalbänken', v2w1[2].exercises.some(e => e.övning === 'Militärpress'), true);
eq('bänkpress smalt grepp borta', v2w1[2].exercises.some(e => e.övning === 'Bänkpress smalt grepp'), false);

// Segmentgruppering: toppset + back-off blir EN övning med två segment,
// och .set är summan av segmentens set (1 + 3 = 4).
const v2bänk = ex(V2, 1, 1, 'Bänkpress', 1);
eq('v2 onsdagsbänk 2 segment', v2bänk.segments.length, 2);
eq('v2 onsdagsbänk toppset 102,5', v2bänk.segments[0].målvikt, 102.5);
eq('v2 onsdagsbänk .set = summan', v2bänk.set, 4);

// Vila per övning och per segment.
eq('vila per övning: måndagsbänken', ex(V2, 1, 0, 'Bänkpress', 1).vila, '2-3 min');
eq('vila per segment: toppset vilar längre', v2bänk.segments.map(s => s.vila), ['4-5 min', '3 min']);
eq('program utan Vila-kolumn ger tom sträng', ex(V1, 1, 0, 'Bänkpress').vila, '');

// AMRAP är fritext i Reps-kolumnen och får inte tolkas som tal.
eq('v2 vecka 5 mätpunkt är AMRAP', ex(V2, 5, 1, 'Bänkpress', 1).segments[0].reps, 'AMRAP');
eq('v2 vecka 5 AMRAP på 112,5', ex(V2, 5, 1, 'Bänkpress', 1).segments[0].målvikt, 112.5);

// Benpassets A/B-växling: knäböj och marklyft byter plats varannan vecka.
eq('v2 benpass vecka 1 leds av knäböj', getProgram(V2, 1, 1)[3].exercises[0].övning, 'Knäböj');
eq('v2 benpass vecka 2 leds av marklyft', getProgram(V2, 2, 1)[3].exercises[0].övning, 'Marklyft');

// Deload enligt Helms: vikten står kvar, volymen ner.
eq('v2 deload sänker volymen', ex(V2, 6, 0, 'Bänkpress', 1).set, 4);
eq('v2 deload behåller vikten', ex(V2, 6, 0, 'Bänkpress', 1).målvikt, 102.5);

// ══════════ CYKEL 2 — progressionen skriven ur cykel 1:s logg ══════════
// Bänkmax 130 -> 137,5 efter AMRAP:en. Procentsatserna är identiska med
// cykel 1:s, så det är samma block mot ett rättat max.
eq('cykel 2 inget pass har växt',
  getProgram(V2, 1, 2).map(p => p.exercises.length), [7, 6, 5, 4]);
eq('cykel 2 bänk toppset v1-v4',
  [1, 2, 3, 4].map(w => ex(V2, w, 1, 'Bänkpress', 2).segments[0].målvikt), [110, 115, 120, 125]);
eq('cykel 2 bänk back-off ligger under toppen',
  [1, 2, 3, 4].map(w => ex(V2, w, 1, 'Bänkpress', 2).segments[1].målvikt), [107.5, 112.5, 115, 120]);

// Mätpunkten flyttad 112,5 -> 117,5 och ligger UNDER vecka 3:s toppset,
// så den möts på känd mark.
const c2amrap = ex(V2, 5, 1, 'Bänkpress', 2).segments[0];
eq('cykel 2 mätpunkt är AMRAP', c2amrap.reps, 'AMRAP');
eq('cykel 2 mätpunkt på 117,5', c2amrap.målvikt, 117.5);
eq('cykel 2 mätvikt under vecka 3:s toppset',
  c2amrap.målvikt < ex(V2, 3, 1, 'Bänkpress', 2).segments[0].målvikt, true);

eq('cykel 2 chins toppset v1-v4',
  [1, 2, 3, 4].map(w => ex(V2, w, 2, 'Viktade chins', 2).segments[0].målvikt), [30, 35, 37.5, 42.5]);
eq('cykel 2 militärpress vikter',
  [1, 2, 3, 4, 5].map(w => ex(V2, w, 2, 'Militärpress', 2).målvikt), [60, 62.5, 65, 65, 65]);
eq('cykel 2 militärpress reps stiger sist',
  [1, 2, 3, 4, 5].map(w => ex(V2, w, 2, 'Militärpress', 2).reps), ['6', '6', '5', '5', '6']);

// Ändringar ur cykel 1:s logg — var och en vaktad.
eq('cykel 2 knäböj sänkt 5 %',
  [1, 3, 5].map(w => ex(V2, w, 3, 'Knäböj', 2).målvikt), [95, 97.5, 100]);
eq('cykel 2 gående utfall nedskuret till 2 set', ex(V2, 1, 3, 'Gående utfall', 2).set, 2);
eq('cykel 1 hade 3 set utfall', ex(V2, 1, 3, 'Gående utfall', 1).set, 3);
eq('cykel 2 spidercurl matchar hur den körs', ex(V2, 1, 2, 'Spidercurl', 2).reps, '15-25');
// Cykel 1 sa "vikten kvar" i deloaden men sänkte måndagschinsen ändå. Rättat i cykel 2.
eq('cykel 2 deload behåller måndagschinsens vikt',
  ex(V2, 6, 0, 'Viktade chins (lätt)', 2).målvikt,
  ex(V2, 5, 0, 'Viktade chins (lätt)', 2).målvikt);
eq('cykel 2 benpass växlar A/B',
  [getProgram(V2, 1, 2)[3].exercises[0].övning, getProgram(V2, 2, 2)[3].exercises[0].övning],
  ['Knäböj', 'Marklyft']);

// Cykel 2-programmet (Cykel 2-fliken, äldre block) läses fortfarande.
eq('v1 Pass 1 bänkpress 4x10 @ 97,5',
  [ex(V1, 1, 0, 'Bänkpress').set, ex(V1, 1, 0, 'Bänkpress').reps, ex(V1, 1, 0, 'Bänkpress').målvikt],
  [4, '10', 97.5]);
eq('v1 vecka 3 AMRAP-text bevarad', ex(V1, 3, 2, 'Bänkpress').segments[0].reps, 'AMRAP');

// --- setCurrentWeek måste byta cykel FÖRE den läser programmet ---
// Wrappar man förbi sista veckan till en ny cykel ska svaret bära den NYA
// cykelns vikter. Läser man programmet först får man förra cykelns, och appen
// visar fel vikter tills nästa omladdning. Det var en bugg fram till 2026-09-21.
const wrap = setCurrentWeek(V2, 1, 2);
eq('wrap returnerar nya cykeln', wrap.cycle, 2);
eq('wrap returnerar nya cykelns vikter',
  wrap.program[1].exercises.find(e => e.övning === 'Bänkpress').segments[0].målvikt, 110);
eq('wrap rapporterar vilken cykel som körs', wrap.cycleUsed, 2);
eq('wrap listar flikens cykler', wrap.cycles, [1, 2]);
// Tillbaka till cykel 1 ska ge cykel 1:s vikter igen.
const tillbaka = setCurrentWeek(V2, 1, 1);
eq('tillbaka till cykel 1 ger cykel 1:s vikter',
  tillbaka.program[1].exercises.find(e => e.övning === 'Bänkpress').segments[0].målvikt, 102.5);
// getInitData ska rapportera samma sak — men ett aktivt pass styr vilket program
// som läses (avsiktligt: mitt i ett pass är det passets program som gäller), så
// sessionen från tidigare tester måste avslutas först.
const öppet = getActiveSession();
if (öppet) endPass(öppet.passId);
setActiveProgram(V2);
setCurrentWeek(V2, 1, 2);
const init2 = getInitData();
eq('getInitData rapporterar cykeln', init2.currentCycle, 2);
eq('getInitData rapporterar körd cykel', init2.cycleUsed, 2);
eq('getInitData listar cyklerna', init2.cycles, [1, 2]);

// --- PR-detektering: _detectPR (inline) + analyzeSession (auktoritativ) ---
// Bygg ett deterministiskt scenario direkt i Logg. Kolumner:
// Datum, Pass, Övning, Set nr, Reps, Vikt, Kommentar, Pass-ID, Program
// Session A (pA): Mark 100×5, 100×5.   Session B (pB): 100×5 (=), 105×3 (vikt-PR), 100×6 (rep-PR @100).
[
  ['2026-05-01', 'PR-test', 'Mark', 1, 5, 100, '', 'pA', 'Tungt'],
  ['2026-05-01', 'PR-test', 'Mark', 2, 5, 100, '', 'pA', 'Tungt'],
  ['2026-05-08', 'PR-test', 'Mark', 1, 5, 100, '', 'pB', 'Tungt'],
  ['2026-05-08', 'PR-test', 'Mark', 2, 3, 105, '', 'pB', 'Tungt'],
  ['2026-05-08', 'PR-test', 'Mark', 3, 6, 100, '', 'pB', 'Tungt'],
  // Kroppsvikt (tom Vikt): Chins 8 reps i pA → 10 reps blir rep-PR på kroppsvikt.
  ['2026-05-01', 'PR-test', 'Chins', 1, 8, '', '', 'pA', 'Tungt']
].forEach(function (r) { logg.data.push(r); });

eq('analyzeSession(pB) PR-set',
  analyzeSession('pB').map(p => p.setNr + ':' + (p.weightPR ? 'w' : '') + (p.repPR ? 'r' : '')).sort(),
  ['2:w', '3:r']);
eq('analyzeSession(pA) inga PR (första passet)', analyzeSession('pA'), []);
eq('_detectPR vikt-PR (110 > 105)', _detectPR('PR-test', 'Mark', 3, 110).weightPR, true);
eq('_detectPR ingen PR → null', _detectPR('PR-test', 'Mark', 5, 100), null);
eq('_detectPR kroppsvikt rep-PR (10 > 8)',
  _detectPR('PR-test', 'Chins', 10, null), { weightPR: false, repPR: true, weight: null, reps: 10 });

// --- doGet: JSON-export vs appen ---
// ?export=<flik> ska ge JSON; utan parametern ska den vanliga HTML-vägen gå som förr.
const expOut = doGet({ parameter: { export: 'Logg' } });
eq('doGet ?export sätter JSON-mimetype', expOut._mime, 'application/json');
const expJson = JSON.parse(expOut._text);
eq('doGet ?export returnerar rätt flik', expJson.sheet, 'Logg');
eq('doGet ?export ger Logg-rubrikerna', expJson.headers.slice(0, 3), ['Datum', 'Pass', 'Övning']);
eq('doGet ?export ger rader', expJson.rows.length > 0, true);
// Okänd flik ska ge ett fel i JSON, inte kasta ut ett stackspår till anroparen.
const expBad = JSON.parse(doGet({ parameter: { export: 'FinnsInte' } })._text);
eq('doGet ?export okänd flik ger error-fält', typeof expBad.error === 'string', true);
eq('doGet ?export okänd flik läcker inga rader', expBad.rows, undefined);
// Utan parameter: HTML-vägen, alltså INTE ett ContentService-svar.
eq('doGet utan parameter går HTML-vägen', doGet()._mime, undefined);
eq('doGet utan argument kraschar inte', typeof doGet(), 'object');

console.log(failed === 0 ? '\nALLA TESTER OK' : '\n' + failed + ' TESTER MISSLYCKADES');
process.exit(failed === 0 ? 0 : 1);
