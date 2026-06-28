const PROGRAM_SHEET = 'Program';
const LOGG_SHEET = 'Logg';
const SESSIONS_SHEET = 'Sessions';
const SESSION_HEADERS = ['Pass-ID', 'Pass', 'Datum', 'Start-tid', 'Slut-tid', 'Notering', 'Program', 'Vecka', 'Ändringar'];
const TZ = Session.getScriptTimeZone();

// Flera program = en flik per program. En flik är ett program om den heter exakt
// 'Program' (legacy-default, visas som "Tungt") eller matchar 'Program: <Namn>'.
const PROGRAM_PREFIX = 'Program:';
const DEFAULT_PROGRAM_NAME = 'Tungt';
const ACTIVE_PROGRAM_KEY = 'activeProgram';
// Vecko-progression: programflikar kan ha en valfri 'Vecka'-kolumn (1..N).
// Aktiv vecka per program lagras som 'week:<programnamn>' i DocumentProperties.
const WEEK_KEY_PREFIX = 'week:';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('SwoleSheet')
    .setFaviconUrl('https://traidmill.github.io/SwoleSheet/icon-192-v4.png')
    // Tillåt iframe-inbäddning (Google Sites) — döljer Apps Script-bannern
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

// TILLFÄLLIG: skapar/återskapar fliken "Program: Bänk & Chins" med vecko-progression
// (Block 1, 4 veckor) + RIR-kolumn. Flera set med olika vikter = separata segment-rader
// (samma Ordning + Övning → grupperas till en övning i appen). Kalibrerat mot bänk-1RM
// ~135 (ankare ur logg: 80kg~22RM, 100kg~12RM, 120kg~5RM) och viktade chins ~+50
// (adderad vikt). Knäböj/mark submaximalt (diskbråck).
function importBankChinsProgram() {
  const SHEET = 'Program: Bänk & Chins';
  const headers = ['Vecka', 'Pass', 'Ordning', 'Övning', 'Set', 'Reps', 'Målvikt', 'RIR', 'Notering'];
  // wk[i] = veckans segment (array). Segment = [Set, Reps, Målvikt(null=tom), RIR(null=tom), Notering].
  // null som vecka = hoppa över (t.ex. ingen utfall i deload).
  const PROGRAM = [
    // --- Pass 1 (Mån) — Volym + primär chins ---
    { pass: 'Pass 1', ord: 1, övn: 'Bänkpress', wk: [
      [[4, '10', 95, 3, 'Volym, touch-and-go']],
      [[4, '10', 97.5, 2, 'Volym']],
      [[4, '10', 100, 1, 'Volym, tungt – reps får falla till 8–9']],
      [[3, '8', 85, null, 'Deload, lätt']] ] },
    { pass: 'Pass 1', ord: 2, övn: 'Viktade chins', wk: [
      [[1, '5', 25, 3, 'Top-set'], [3, '8', 15, 3, 'Back-off, +volym']],
      [[1, '5', 27.5, 3, 'Top-set'], [3, '8', 15, 3, 'Back-off, +volym']],
      [[1, '4', 32.5, 1, 'Top-set'], [3, '8', 17.5, 1, 'Back-off']],
      [[1, '5', 20, 3, 'Deload top-set'], [2, '6', 12.5, 3, 'Back-off']] ] },
    { pass: 'Pass 1', ord: 3, övn: 'Viktade dips', wk: [
      [[3, '10', 12.5, 2, 'Volym, kontrollerad ROM']],
      [[3, '10', 15, 2, '']],
      [[4, '8', 15, 2, '']],
      [[2, '10', 10, 3, 'Deload']] ] },
    { pass: 'Pass 1', ord: 4, övn: 'Militärpress', wk: [
      [[3, '6', 50, 2, '']], [[3, '6', 52.5, 2, '']], [[4, '5', 55, 2, '']], [[2, '6', 45, 3, 'Deload']] ] },
    { pass: 'Pass 1', ord: 5, övn: 'Sidolyft', wk: [
      [[3, '15', null, 1, 'Sidodelt, RIR 1. Sista set myo-reps: aktivering till RIR 0, sedan 3–4 miniset à 3–5 rep']],
      [[3, '15', null, 1, 'RIR 1, sista set myo-reps']],
      [[3, '12', null, 0, 'RIR 0, sista set myo-reps']],
      [[2, '15', null, 3, 'Deload']] ] },

    // --- Pass 2 (Ons) — Pump + sekundär chins ---
    { pass: 'Pass 2', ord: 1, övn: 'Bänkpress', wk: [
      [[3, '18', 80, 2, 'Pump']], [[4, '20', 80, 2, 'Pump']], [[4, '22', 80, 1, 'Pump']], [[3, '15', 75, 3, 'Deload']] ] },
    { pass: 'Pass 2', ord: 2, övn: 'Viktade chins', wk: [
      [[4, '7', 12.5, 3, '']], [[4, '8', 12.5, 3, '']], [[4, '8', 15, 2, '']], [[3, '8', 10, 3, 'Deload']] ] },
    { pass: 'Pass 2', ord: 3, övn: 'Maskinrodd', wk: [
      [[3, '10', null, 2, 'Ställ vikt mot RIR 2']], [[4, '10', null, 2, '']], [[4, '8', null, 2, '']], [[3, '10', null, 3, 'Deload']] ] },
    { pass: 'Pass 2', ord: 4, övn: 'Spidercurl', wk: [
      [[3, '12', 30, 1, 'RIR 1. Sista set myo-reps: aktivering till RIR 0, sedan 3–4 miniset à 3–5 rep']],
      [[3, '14', 30, 1, 'RIR 1, sista set myo-reps']],
      [[3, '12', 32.5, 0, 'RIR 0, sista set myo-reps']],
      [[3, '12', 30, 3, 'Deload']] ] },
    { pass: 'Pass 2', ord: 5, övn: 'Reverse flyes', wk: [
      [[3, '15', null, 1, 'Bakre delt, RIR 1. Sista set myo-reps: aktivering till RIR 0, sedan 3–4 miniset à 3–5 rep']],
      [[3, '15', null, 1, 'RIR 1, sista set myo-reps']],
      [[3, '12', null, 0, 'RIR 0, sista set myo-reps']],
      [[2, '15', null, 3, 'Deload']] ] },

    // --- Pass 3 (Fre) — Intensitet + sekundär chins ---
    { pass: 'Pass 3', ord: 1, övn: 'Bänkpress', wk: [
      [[1, '5', 110, 2, 'Topp, touch-and-go'], [4, '8', 95, 2, 'Back-off, +volym (reps får krypa mot 10)']],
      [[1, '4', 115, 2, 'Topp'], [4, '8', 100, 2, 'Back-off, +volym']],
      [[1, '3', 120, 1, 'Topp'], [1, 'AMRAP', 110, null, 'Maxreps'], [3, '8', 100, 1, 'Back-off, +volym']],
      [[1, '3', 105, 3, 'Deload topp'], [2, '6', 90, 3, 'Back-off']] ] },
    { pass: 'Pass 3', ord: 2, övn: 'Viktade chins', wk: [
      [[5, '5', 22.5, 2, 'Medeltung']], [[5, '5', 25, 2, '']], [[6, '4', 27.5, 1, '']], [[3, '5', 20, 3, 'Deload']] ] },
    { pass: 'Pass 3', ord: 3, övn: 'Viktade dips', wk: [
      [[3, '8', 17.5, 2, 'Tyngre']], [[3, '8', 20, 2, '']], [[4, '6', 25, 1, '']], [[2, '8', 15, 3, 'Deload']] ] },
    { pass: 'Pass 3', ord: 4, övn: 'Stångrodd', wk: [
      [[3, '12', 60, 2, '']], [[3, '12', 65, 2, '']], [[4, '10', 65, 2, '']], [[3, '12', 55, 3, 'Deload']] ] },
    { pass: 'Pass 3', ord: 5, övn: 'Triceps-pushdown', wk: [
      [[3, '12', null, 1, 'RIR 1. Sista set myo-reps: aktivering till RIR 0, sedan 3–4 miniset à 3–5 rep']],
      [[3, '12', null, 1, 'RIR 1, sista set myo-reps']],
      [[4, '10', null, 0, 'RIR 0, sista set myo-reps']],
      [[2, '12', null, 3, 'Deload']] ] },

    // --- Pass 4 (Lör) — Ben (submaximalt, diskbråck) ---
    { pass: 'Pass 4', ord: 1, övn: 'Knäböj', wk: [
      [[3, '6', 100, 3, 'Submax'], [1, '12', 80, 3, 'Back-off']],
      [[4, '5', 105, 3, 'Submax'], [1, '12', 82.5, 3, 'Back-off']],
      [[4, '5', 107.5, 2, 'Submax'], [1, '15', 82.5, 3, 'Back-off']],
      [[3, '5', 90, 3, 'Deload']] ] },
    { pass: 'Pass 4', ord: 2, övn: 'Marklyft', wk: [
      [[3, '6', 120, 3, 'Kontrollerat']], [[3, '6', 125, 3, '']], [[3, '6', 130, 2, '']], [[2, '6', 110, 3, 'Deload']] ] },
    { pass: 'Pass 4', ord: 3, övn: 'Utfallssteg', wk: [
      [[2, '10', 60, 2, '']], [[2, '10', 65, 2, '']], [[3, '8', 70, 2, '']], null ] },
    { pass: 'Pass 4', ord: 4, övn: 'Lårcurl', wk: [
      [[3, '12', null, 2, 'Valfri – baksida lår, ryggsnällt']],
      [[3, '12', null, 2, 'Valfri']],
      [[4, '10', null, 1, 'Valfri']],
      [[2, '12', null, 3, 'Deload']] ] },
    { pass: 'Pass 4', ord: 5, övn: 'Cable crunch / Ab-wheel', wk: [
      [[3, '12', null, 2, 'Bål']], [[3, '15', null, 2, '']], [[3, '12', null, 2, '']], [[3, '12', null, 3, 'Deload']] ] }
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
  return String(v).trim();
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
  // Repair already-corrupted rows (Date values written before formatting was set)
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const range = sheet.getRange(2, idx + 1, lastRow - 1, 1);
    const values = range.getValues();
    let needsRewrite = false;
    const newValues = values.map(function (row) {
      const v = row[0];
      if (v instanceof Date) {
        needsRewrite = true;
        return [_passIdFromDate(v)];
      }
      return [row[0]];
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
    listStats: getListStats(name),
    activeSession: getActiveSession(),
    weeks: bundle.weeks,
    currentWeek: bundle.currentWeek
  };
}

// --- helpers: vecko-progression ---

// Distinkta veckonummer i en programflik (sorterade). [1] om ingen 'Vecka'-kolumn
// eller inga veckovärden — programmet beter sig då som "en-vecka" (dagens beteende).
// Delegerar till _programBundle så veckoutvinningen bara finns på ett ställe.
function _getProgramWeeks(programName) {
  return _programBundle(programName).weeks;
}

function _getCurrentWeek(programName) {
  return _programBundle(programName).currentWeek;
}

function setCurrentWeek(programName, vecka) {
  const name = programName || _getActiveProgram();
  // En läsning för att validera veckan och hämta veckolistan + rätt veckas program.
  const probe = _programBundle(name, vecka);
  const v = (probe.weeks.indexOf(Number(vecka)) >= 0) ? Number(vecka) : probe.weeks[0];
  PropertiesService.getDocumentProperties().setProperty(WEEK_KEY_PREFIX + name, String(v));
  // Om veckan justerades (ogiltig) behöver vi rätt veckas rader.
  const bundle = (v === Number(vecka)) ? probe : _programBundle(name, v);
  return { week: v, weeks: bundle.weeks, program: bundle.program };
}

// --- public API: program ---

// Läser ett program EN gång och returnerar { program, weeks, currentWeek }.
// Perf: tidigare läste getProgram + _getProgramWeeks + _getCurrentWeek bladet 3 ggr;
// detta gör allt i en enda _readSheet. Hela hot-pathen (getInitData/setActiveProgram/
// setCurrentWeek) bygger på denna.
function _programBundle(programName, vecka) {
  const name = programName ? programName : _getActiveProgram();
  const sheetName = _programSheetName(name);
  const r = _readSheet(sheetName);

  // Veckor + vald vecka — härleds ur den redan lästa datan (ingen extra läsning).
  const cVecka = r.colMap['Vecka'];
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
  const cRir = r.colMap['RIR']; // valfri kolumn

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
        notering: s0.notering,
        segments: ex.segments
      };
    });
    exercises.sort(function (a, b) { return a.ordning - b.ordning; });
    return { pass: p, exercises: exercises };
  });
  return { program: program, weeks: weeks, currentWeek: wk };
}

// vecka = valfri. Om fliken har en 'Vecka'-kolumn returneras bara den veckans rader
// (plus rader med tom Vecka). Saknas kolumnen ignoreras vecka.
function getProgram(programName, vecka) {
  return _programBundle(programName, vecka).program;
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
    listStats: _listStatsFromCols(loggCols, activeProgram),
    weeks: bundle.weeks,
    currentWeek: bundle.currentWeek
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
// veckans loggade volym (måndag–söndag, kroppsviktsset räknas ej i kg).
function getListStats(programName) {
  return _listStatsFromCols(_readLoggCols(), programName);
}

// Som getListStats men mot en redan inläst Logg — delas i getInitData.
function _listStatsFromCols(c, programName) {
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
    if (dStr >= weekStart) {
      const set = _rowToSet(row, c);
      if (set.vikt !== null && set.vikt !== undefined && set.vikt !== '') {
        weekVolume += (Number(set.reps) || 0) * Number(set.vikt);
      }
    }
  });
  return { lastDateByPass: lastDateByPass, weekVolume: weekVolume, weekStart: weekStart };
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
    'Ändringar': ''
  });

  return {
    passId: passId,
    pass: passName,
    date: _dateKey(now),
    startTime: now.toISOString(),
    program: program,
    vecka: vecka
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
  const target = _normalizePassId(passId);

  for (let i = 0; i < s.rows.length; i++) {
    if (_normalizePassId(s.rows[i][cId]) === target) {
      s.sheet.getRange(i + 2, cSlut + 1).setValue(new Date());
      // Auto-avancera programveckan när alla pass i veckan är avslutade.
      let advancedWeek = null;
      if (cVecka !== undefined) {
        const program = _normalizeProgram(cProg === undefined ? '' : s.rows[i][cProg], _defaultProgramName());
        const week = Number(s.rows[i][cVecka]);
        if (week) {
          SpreadsheetApp.flush(); // säkerställ att slut-tiden syns vid omläsningen nedan
          try { advancedWeek = _maybeAdvanceWeek(program, week); } catch (e) { advancedWeek = null; }
        }
      }
      return { ok: true, advancedWeek: advancedWeek };
    }
  }
  throw new Error('Sessionen hittades inte.');
}

// Avancerar programveckan om varje pass i den angivna veckan har minst en avslutad
// session (för det programmet, just den veckan). Wrappar till första veckan efter
// sista (ny cykel). Returnerar nya veckan, eller null om inget skedde.
// Kräver 'Vecka'-kolumnen i Sessions — gamla rader utan vecka räknas aldrig som klara.
function _maybeAdvanceWeek(programName, week) {
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
  if (cVecka === undefined || cPass === undefined || cSlut === undefined) return null;
  const defaultProgram = _defaultProgramName();

  const done = {};
  s.rows.forEach(function (row) {
    if (_normalizeProgram(cProg === undefined ? '' : row[cProg], defaultProgram) !== programName) return;
    if (Number(row[cVecka]) !== Number(week)) return;
    if (row[cSlut] === '' || row[cSlut] === null) return; // ej avslutad
    done[String(row[cPass]).trim()] = true;
  });
  const allDone = weekPasses.every(function (p) { return done[p]; });
  if (!allDone) return null;

  const idx = weeks.indexOf(Number(week));
  const nextWeek = (idx >= 0 && idx < weeks.length - 1) ? weeks[idx + 1] : weeks[0];
  PropertiesService.getDocumentProperties().setProperty(WEEK_KEY_PREFIX + programName, String(nextWeek));
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
