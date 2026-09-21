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
global.SpreadsheetApp = { getActiveSpreadsheet: () => ss };
global.Session = { getScriptTimeZone: () => 'Europe/Stockholm' };
global.Utilities = { formatDate: (d, tz, p) => fmt(d, p) };
global.PropertiesService = {
  getDocumentProperties: () => ({
    getProperty: (k) => (k in props ? props[k] : null),
    setProperty: (k, v) => { props[k] = v; }
  })
};
global.HtmlService = { createHtmlOutputFromFile: () => ({ setTitle: () => ({}) }) };

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
eq('importBankChinsV2 radantal', importBankChinsV2(), 144);
eq('båda programmen syns i _listPrograms',
  _listPrograms().map(p => p.name).filter(n => n.indexOf('Bänk & Chins') === 0), [V1, V2]);
eq('Bänk & Chins veckor', _getProgramWeeks(V1), [1, 2, 3, 4]);
eq('Bänk & Chins v2 veckor', _getProgramWeeks(V2), [1, 2, 3, 4, 5, 6]);

// Hjälpare: plocka en övning ur ett visst pass (0-indexerat) en viss vecka.
function ex(prog, vecka, passIdx, namn) {
  return getProgram(prog, vecka)[passIdx].exercises.find(function (e) { return e.övning === namn; });
}

// v2:s passupplägg: måndag bänk lätt, onsdag bänk tungt, fredag chins tungt, helg ben.
const v2w1 = getProgram(V2, 1);
eq('v2 pass-ordning', v2w1.map(p => p.pass), ['Pass 1', 'Pass 2', 'Pass 3', 'Pass 4']);
eq('v2 Pass 1 övningar', v2w1[0].exercises.map(e => e.övning),
  ['Bänkpress', 'Viktade chins (lätt)', 'Maskinrodd', 'Overhead tricepsextension',
   'Incline hantelcurl', 'Reverse flyes', 'Sidolyft']);
eq('v2 Pass 3 leds av tunga chins, inte bänk', v2w1[2].exercises[0].övning, 'Viktade chins');

// Revisionen 2026-08-13/14: måndagens breda chins blev viktade (måndagsprincipen
// "tung stång, lätta set" gäller båda huvudlyften), breda chins flyttade till
// onsdagen, och militärpressen ersatte bänkpress smalt grepp på fredagen.
eq('breda chins ligger på onsdagen', v2w1[1].exercises.some(e => e.övning === 'Breda chins'), true);
eq('breda chins INTE kvar på måndagen', v2w1[0].exercises.some(e => e.övning === 'Breda chins'), false);
eq('militärpress ersatte smalbänken', v2w1[2].exercises.map(e => e.övning).indexOf('Militärpress') >= 0, true);
eq('bänkpress smalt grepp borta', v2w1[2].exercises.some(e => e.övning === 'Bänkpress smalt grepp'), false);
eq('incline hantelcurl tillagd på måndagen', ex(V2, 1, 0, 'Incline hantelcurl') !== undefined, true);

// Segmentgruppering: toppset + back-off blir EN övning med två segment,
// och .set är summan av segmentens set (1 + 3 = 4).
const v2bänk = ex(V2, 1, 1, 'Bänkpress');
eq('v2 onsdagsbänk 2 segment', v2bänk.segments.length, 2);
eq('v2 onsdagsbänk toppset 102,5', v2bänk.segments[0].målvikt, 102.5);
eq('v2 onsdagsbänk back-off 100', v2bänk.segments[1].målvikt, 100);
eq('v2 onsdagsbänk .set = summan', v2bänk.set, 4);
const v2chins = ex(V2, 1, 2, 'Viktade chins');
eq('v2 fredagschins 2 segment', v2chins.segments.length, 2);
eq('v2 fredagschins toppset +27,5', v2chins.segments[0].målvikt, 27.5);

// Vila-kolumnen. Sätts antingen per ÖVNING (ex.vila) eller per SEGMENT
// (ex.vilaSeg) — toppsetet vilar längre än back-off på samma övning.
eq('vila per övning: måndagsbänken', ex(V2, 1, 0, 'Bänkpress').vila, '2-3 min');
eq('vila per övning: sidolyft', ex(V2, 1, 0, 'Sidolyft').vila, '60-90 s');
eq('vila per segment: toppset vilar längre',
  v2bänk.segments.map(s => s.vila), ['4-5 min', '3 min']);
eq('övningens vila = första segmentets', v2bänk.vila, '4-5 min');
// Bakåtkompatibilitet: Vila är en VALFRI kolumn. Cykel 2-fliken saknar den helt
// och ska läsas som förr, med tom sträng i stället för undefined.
eq('program utan Vila-kolumn ger tom sträng', ex(V1, 1, 0, 'Bänkpress').vila, '');

// AMRAP är fritext i Reps-kolumnen och får inte tolkas som tal.
const v2amrap = ex(V2, 5, 1, 'Bänkpress');
eq('v2 vecka 5 mätpunkt är AMRAP', v2amrap.segments[0].reps, 'AMRAP');
eq('v2 vecka 5 AMRAP på 112,5', v2amrap.segments[0].målvikt, 112.5);

// Benpassets A/B-växling: knäböj och marklyft byter plats varannan vecka så de
// aldrig är tunga samma dag. Drivs av en ordning-ARRAY i stället för en siffra.
eq('v2 benpass vecka 1 leds av knäböj', getProgram(V2, 1)[3].exercises[0].övning, 'Knäböj');
eq('v2 benpass vecka 2 leds av marklyft', getProgram(V2, 2)[3].exercises[0].övning, 'Marklyft');
eq('v2 benpass vecka 3 tillbaka till knäböj', getProgram(V2, 3)[3].exercises[0].övning, 'Knäböj');

// Deload (vecka 6) enligt Helms: vikten står kvar, volymen ner. Måndagsbänken
// går 6→4 set på samma 102,5 kg som vecka 5.
const v2deload = ex(V2, 6, 0, 'Bänkpress');
eq('v2 deload sänker volymen', v2deload.set, 4);
eq('v2 deload behåller vikten', v2deload.målvikt, 102.5);

// Cykel 2-programmet läses fortfarande, inklusive dess AMRAP i vecka 3.
eq('v1 Pass 1 bänkpress 4x10 @ 97,5',
  [ex(V1, 1, 0, 'Bänkpress').set, ex(V1, 1, 0, 'Bänkpress').reps, ex(V1, 1, 0, 'Bänkpress').målvikt],
  [4, '10', 97.5]);
eq('v1 vecka 3 AMRAP-text bevarad', ex(V1, 3, 2, 'Bänkpress').segments[0].reps, 'AMRAP');

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

console.log(failed === 0 ? '\nALLA TESTER OK' : '\n' + failed + ' TESTER MISSLYCKADES');
process.exit(failed === 0 ? 0 : 1);
