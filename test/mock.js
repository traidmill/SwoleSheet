// Mock av google.script.run för lokal testning av Index.html.
// Speglar serverfunktionerna i Code.js. Två program så "Dina program"-startskärmen
// och per-program-filtreringen går att verifiera lokalt.
(function () {
  const TUNGT = [
    { pass: 'Pass 1', exercises: [
      { övning: 'Bänkpress', set: 4, reps: '3-5', målvikt: 120, notering: 'RPE 8-9. Fokus toppstyrka.' },
      { övning: 'Militärpress', set: 3, reps: '5', målvikt: 60, notering: 'strikt' },
      { övning: 'Chins', set: 4, reps: 'Max', målvikt: null, notering: '' },
      { övning: 'Stångrodd (Pendlay)', set: 4, reps: '8', målvikt: 80, notering: '' },
      { övning: 'JM-Press', set: 3, reps: '8-10', målvikt: 47.5, notering: '' }
    ]},
    { pass: 'Pass 2', exercises: [
      { övning: 'Bänkpress', set: 3, reps: '15-20', målvikt: 80, notering: 'RPE 7-8. Fokus kontakt/pump.' },
      { övning: 'Press bakom nacken (sitt)', set: 3, reps: '12-15', målvikt: 37.5, notering: 'Lättare vikt, strikt utförande.' },
      { övning: 'Liggande tricepspress', set: 3, reps: '12-15', målvikt: 45, notering: '' },
      { övning: 'Chins', set: 4, reps: 'Max', målvikt: null, notering: '' },
      { övning: 'Biceps', set: 3, reps: '10-12', målvikt: 30, notering: 'Spiders smala' }
    ]},
    { pass: 'Pass 3', exercises: [
      { övning: 'Bänkpress (2s paus)', set: 4, reps: '5-8', målvikt: 110, notering: 'Stoppa distinkt på bröstet.' },
      { övning: 'Chins', set: 4, reps: 'Max', målvikt: null, notering: '' },
      { övning: 'Stångrodd', set: 4, reps: '10', målvikt: 35, notering: '' },
      { övning: 'Rullande extensioner', set: 3, reps: '10-12', målvikt: 22.5, notering: '' },
      { övning: 'Biceps', set: 3, reps: '12', målvikt: 30, notering: 'Spider' }
    ]},
    { pass: 'Pass 4', exercises: [
      { övning: 'Knäböj', set: 4, reps: '4-5', målvikt: 108, notering: 'Använd tempo (t.ex. 3s ner)' },
      { övning: 'Raka marklyft', set: 4, reps: '10-12', målvikt: 100, notering: 'Fokus stretch i baksida lår.' },
      { övning: 'Utfallssteg med stång', set: 3, reps: '10/ben', målvikt: 50.6, notering: 'Stabilitet och kontroll.' },
      { övning: 'Ab-wheel / Plankan', set: 3, reps: 'Max', målvikt: null, notering: 'Bål: Fokus antiextension.' }
    ]}
  ];

  // Andra programmet — andra passnamn så per-program-filtrering syns tydligt.
  const VOLYM = [
    { pass: 'Push', exercises: [
      { övning: 'Lutande hantelpress', set: 4, reps: '8-12', målvikt: 32, notering: '' },
      { övning: 'Sittande press', set: 3, reps: '10-12', målvikt: 40, notering: '' },
      { övning: 'Kabelflyes', set: 3, reps: '12-15', målvikt: 15, notering: '' },
      { övning: 'Triceps pushdown', set: 3, reps: '12-15', målvikt: 35, notering: '' }
    ]},
    { pass: 'Pull', exercises: [
      { övning: 'Latsdrag', set: 4, reps: '10-12', målvikt: 70, notering: '' },
      { övning: 'Sittande rodd', set: 3, reps: '10-12', målvikt: 65, notering: '' },
      { övning: 'Facepull', set: 3, reps: '15', målvikt: 25, notering: '' },
      { övning: 'Hammercurl', set: 3, reps: '12', målvikt: 14, notering: '' }
    ]},
    { pass: 'Ben', exercises: [
      { övning: 'Benpress', set: 4, reps: '10-12', målvikt: 180, notering: '' },
      { övning: 'Rumänska marklyft', set: 3, reps: '10', målvikt: 90, notering: '' },
      { övning: 'Benspark', set: 3, reps: '12-15', målvikt: 55, notering: '' },
      { övning: 'Vadpress', set: 4, reps: '15', målvikt: 120, notering: '' }
    ]}
  ];

  // Tredje programmet med vecko-progression (testar veckoväljaren + segment/RIR).
  // Chins viktad har TVÅ segment (top-set + back-off) för att testa segment-rendering.
  function benchWeek(bankVikt, chinsTop, chinsBack) {
    return [
      { pass: 'Pass 1', exercises: [
        { övning: 'Bänkpress', set: 10, reps: '10', målvikt: bankVikt, rir: 2, vila: '2 min', notering: 'Volym (junk volume)',
          segments: [{ set: 10, reps: '10', målvikt: bankVikt, rir: 2, vila: '2 min', notering: 'Volym (junk volume)' }] },
        // Olika vila per segment - toppsetet vilar längre än back-off-seten.
        { övning: 'Chins viktad', set: 3, reps: '5', målvikt: chinsTop, rir: 3, vila: '4-5 min', notering: 'Top-set',
          segments: [
            { set: 1, reps: '5', målvikt: chinsTop, rir: 3, vila: '4-5 min', notering: 'Top-set' },
            { set: 2, reps: '8', målvikt: chinsBack, rir: 3, vila: '3 min', notering: 'Back-off' }
          ] }
      ]},
      { pass: 'Pass 2', exercises: [
        // Utan vila-fält = programflik som saknar Vila-kolumnen (bakåtkompatibilitet).
        { övning: 'Bänkpress', set: 4, reps: '18-22', målvikt: 80, rir: 2, notering: 'Pump' },
        { övning: 'Chins viktad', set: 4, reps: '7', målvikt: 15, rir: 3, notering: 'Sekundär volym' }
      ]}
    ];
  }
  const BANKCHINS_WEEKS = { 1: benchWeek(82.5, 27.5, 15), 2: benchWeek(85, 30, 17.5), 3: benchWeek(87.5, 32.5, 20) };

  const PROGRAMS = {
    'Tungt': { sheetName: 'Program', passes: TUNGT },
    'Volymblock': { sheetName: 'Program: Volymblock', passes: VOLYM },
    'Bänktest': { sheetName: 'Program: Bänktest', weeks: BANKCHINS_WEEKS }
  };
  const PROGRAM_NAMES = ['Tungt', 'Volymblock', 'Bänktest'];

  // Passlista för ett program i en given vecka. Program utan veckor ignorerar vecka.
  function passesFor(name, week) {
    const p = PROGRAMS[name] || PROGRAMS[srv.activeProgram];
    if (p.weeks) return p.weeks[week || currentWeekOf(name)] || p.weeks[programWeeks(name)[0]];
    return p.passes;
  }
  function programWeeks(name) {
    const p = PROGRAMS[name];
    return (p && p.weeks) ? Object.keys(p.weeks).map(Number).sort(function (a, b) { return a - b; }) : [1];
  }
  function currentWeekOf(name) {
    const wks = programWeeks(name);
    const stored = srv.weekByProgram[name];
    return (stored && wks.indexOf(stored) >= 0) ? stored : wks[0];
  }

  const STATS = {
    'Tungt': { lastDateByPass: { 'Pass 1': '2026-06-10' }, weekVolume: 4500, weekStart: '2026-06-08' },
    'Volymblock': { lastDateByPass: { 'Push': '2026-06-12' }, weekVolume: 2100, weekStart: '2026-06-08' },
    'Bänktest': { lastDateByPass: {}, weekVolume: 0, weekStart: '2026-06-08' }
  };

  const HISTORY = {
    'Tungt': [
      { passId: 'M-3', pass: 'Pass 1', date: '2026-06-10',
        startTime: '2026-06-10T17:32:00Z', endTime: '2026-06-10T18:34:00Z',
        setCount: 17, volume: 5210, legacy: false },
      { passId: 'M-2', pass: 'Pass 4', date: '2026-06-05',
        startTime: '2026-06-05T16:05:00Z', endTime: '2026-06-05T17:01:00Z',
        setCount: 14, volume: 6120, legacy: false },
      { passId: 'M-1', pass: 'Pass 2', date: '2026-06-03',
        startTime: '2026-06-03T17:10:00Z', endTime: '2026-06-03T18:02:00Z',
        setCount: 16, volume: 4480, legacy: false },
      // Legacy (importerade, utan Pass-ID): ingen tid/duration
      { passId: null, pass: 'Pass 2', date: '2026-04-15',
        startTime: null, endTime: null, setCount: 16, volume: 4200, legacy: true },
      { passId: null, pass: 'Pass 1', date: '2026-04-13',
        startTime: null, endTime: null, setCount: 16, volume: 4800, legacy: true }
    ],
    'Volymblock': [
      { passId: 'V-2', pass: 'Push', date: '2026-06-12',
        startTime: '2026-06-12T17:00:00Z', endTime: '2026-06-12T17:48:00Z',
        setCount: 13, volume: 3120, legacy: false },
      { passId: 'V-1', pass: 'Pull', date: '2026-06-09',
        startTime: '2026-06-09T17:05:00Z', endTime: '2026-06-09T17:55:00Z',
        setCount: 13, volume: 2980, legacy: false }
    ]
  };

  // Serverstate i minnet
  const srv = {
    activeProgram: 'Tungt',
    activeSession: null,
    weekByProgram: {}, // {programnamn: vecka}
    loggedSets: [] // {passId, övning, setNr, reps, vikt, kommentar, program}
  };

  // Styr startläge via query-param: ?active=1 ger en pågående session vid load
  const params = new URLSearchParams(location.search);
  if (params.get('active') === '1') {
    const now = new Date();
    const prog = params.get('program') || 'Tungt';
    srv.activeProgram = prog;
    srv.activeSession = {
      passId: 'TEST-' + now.getTime(),
      pass: params.get('pass') || (prog === 'Volymblock' ? 'Push' : 'Pass 2'),
      date: now.toISOString().slice(0, 10),
      startTime: new Date(now - 35 * 60000).toISOString(),
      program: prog,
      mods: (params.get('mods') === '1')
        ? { subs: { 'Bänkpress': 'Hammerpress' }, added: ['Pec deck'] }
        : { subs: {}, added: [] }
    };
  }

  function programsMeta() {
    return PROGRAM_NAMES.map(function (name) {
      return { name: name, sheetName: PROGRAMS[name].sheetName, passCount: passesFor(name).length };
    });
  }
  function completedForActive() {
    const completed = {};
    srv.loggedSets.forEach(function (s) {
      if (!completed[s.övning]) completed[s.övning] = [];
      completed[s.övning].push({ setNr: s.setNr, reps: s.reps, vikt: s.vikt, kommentar: s.kommentar, pr: null });
    });
    return completed;
  }

  const fns = {
    getInitData: function () {
      const ap = (srv.activeSession && srv.activeSession.program) ? srv.activeSession.program : srv.activeProgram;
      const cw = currentWeekOf(ap);
      return {
        programs: programsMeta(),
        activeProgram: ap,
        program: passesFor(ap, cw),
        activeSession: srv.activeSession,
        completedSets: srv.activeSession ? completedForActive() : {},
        listStats: STATS[ap] || { lastDateByPass: {}, weekVolume: 0, weekStart: '2026-06-08' },
        weeks: programWeeks(ap),
        currentWeek: cw
      };
    },
    setActiveProgram: function (name) {
      if (PROGRAMS[name]) srv.activeProgram = name;
      const cw = currentWeekOf(srv.activeProgram);
      return {
        activeProgram: srv.activeProgram,
        program: passesFor(srv.activeProgram, cw),
        listStats: STATS[srv.activeProgram] || { lastDateByPass: {}, weekVolume: 0, weekStart: '2026-06-08' },
        activeSession: srv.activeSession,
        weeks: programWeeks(srv.activeProgram),
        currentWeek: cw
      };
    },
    getProgram: function (name, vecka) { return passesFor(name || srv.activeProgram, vecka); },
    setCurrentWeek: function (name, vecka) {
      const prog = name || srv.activeProgram;
      const wks = programWeeks(prog);
      const v = (wks.indexOf(Number(vecka)) >= 0) ? Number(vecka) : wks[0];
      srv.weekByProgram[prog] = v;
      return { week: v, weeks: wks, program: passesFor(prog, v) };
    },
    getListStats: function (name) {
      return STATS[name || srv.activeProgram] || { lastDateByPass: {}, weekVolume: 0, weekStart: '2026-06-08' };
    },
    getLastSessionForPass: function () { return false; },
    getPrevSessionsForPass: function () { return {}; },
    getHistory: function (limit, name) { return HISTORY[name || srv.activeProgram] || []; },
    getSessionDetail: function (key) {
      const id = key.passId || (key.datum + '|' + key.pass);
      const details = {
        'M-3': {
          // Nyckelordning = loggordning (Chins kördes först) — vyn ska ändå
          // visa programordningen: Bänkpress, Militärpress, Chins.
          setsByExercise: {
            'Chins': [
              { setNr: 1, reps: 13, vikt: null, kommentar: '' },
              { setNr: 2, reps: 11, vikt: null, kommentar: '' }
            ],
            'Bänkpress': [
              { setNr: 1, reps: 3, vikt: 122.5, kommentar: '' },
              { setNr: 2, reps: 3, vikt: 122.5, kommentar: 'tungt men rent' },
              { setNr: 3, reps: 3, vikt: 122.5, kommentar: '' },
              { setNr: 4, reps: 2, vikt: 122.5, kommentar: '' }
            ],
            'Militärpress': [
              { setNr: 1, reps: 5, vikt: 60, kommentar: '' },
              { setNr: 2, reps: 5, vikt: 60, kommentar: '' },
              { setNr: 3, reps: 4, vikt: 60, kommentar: '' }
            ]
          },
          prs: [{ övning: 'Bänkpress', setNr: 1, reps: 3, vikt: 122.5, weightPR: true, repPR: false }]
        },
        '2026-04-13|Pass 1': {
          setsByExercise: {
            'Bänkpress': [
              { setNr: 1, reps: 3, vikt: 120, kommentar: '' },
              { setNr: 2, reps: 3, vikt: 120, kommentar: '' },
              { setNr: 3, reps: 3, vikt: 120, kommentar: '' },
              { setNr: 4, reps: 3, vikt: 120, kommentar: '' }
            ],
            'Chins': [
              { setNr: 1, reps: 13, vikt: null, kommentar: '' },
              { setNr: 2, reps: 12, vikt: null, kommentar: '' },
              { setNr: 3, reps: 10, vikt: null, kommentar: 'grepproblem, lite rest pause' }
            ]
          },
          prs: []
        }
      };
      return details[id] || { setsByExercise: {}, prs: [] };
    },
    startPass: function (passName, programName) {
      const now = new Date();
      const prog = programName || srv.activeProgram;
      srv.activeProgram = prog;
      srv.activeSession = {
        passId: 'TEST-' + now.getTime(),
        pass: passName,
        date: now.toISOString().slice(0, 10),
        startTime: now.toISOString(),
        program: prog,
        mods: { subs: {}, added: [] }
      };
      return srv.activeSession;
    },
    setSessionMods: function (passId, mods) {
      const clean = {
        subs: (mods && mods.subs) || {},
        added: (mods && Array.isArray(mods.added)) ? mods.added : []
      };
      if (srv.activeSession) srv.activeSession.mods = clean;
      return clean;
    },
    getKnownExercises: function () {
      const names = {};
      PROGRAM_NAMES.forEach(function (n) {
        (PROGRAMS[n].passes || []).forEach(function (p) {
          p.exercises.forEach(function (ex) { names[ex.övning] = true; });
        });
      });
      ['Hammerpress', 'Pec deck', 'Sidolyft', 'Benspark', 'Kabeltriceps'].forEach(function (n) { names[n] = true; });
      return Object.keys(names).sort();
    },
    logSet: function (entry) { srv.loggedSets.push(entry); return { pr: null }; },
    updateSet: function (entry) {
      const m = srv.loggedSets.find(function (s) {
        return String(s.passId) === String(entry.passId) && s.övning === entry.övning && Number(s.setNr) === Number(entry.setNr);
      });
      if (!m) throw new Error('Hittade inte setet att uppdatera.');
      m.reps = entry.reps; m.vikt = entry.vikt; m.kommentar = entry.kommentar;
      return { ok: true };
    },
    deleteSet: function (entry) {
      const idx = srv.loggedSets.findIndex(function (s) {
        return String(s.passId) === String(entry.passId) && s.övning === entry.övning && Number(s.setNr) === Number(entry.setNr);
      });
      if (idx === -1) throw new Error('Hittade inte setet att ta bort.');
      srv.loggedSets.splice(idx, 1);
      srv.loggedSets.forEach(function (s) {
        if (String(s.passId) === String(entry.passId) && s.övning === entry.övning && Number(s.setNr) > Number(entry.setNr)) {
          s.setNr = Number(s.setNr) - 1;
        }
      });
      return { ok: true };
    },
    endPass: function () { srv.activeSession = null; return { ok: true }; },
    analyzeSession: function () { return []; },
    deleteSession: function () { srv.activeSession = null; srv.loggedSets = []; return { ok: true }; }
  };

  function makeRunner() {
    let onOk = function () {}, onFail = function () {};
    const runner = {
      withSuccessHandler: function (f) { onOk = f; return runner; },
      withFailureHandler: function (f) { onFail = f; return runner; }
    };
    Object.keys(fns).forEach(function (name) {
      runner[name] = function () {
        const args = arguments;
        setTimeout(function () {
          try { onOk(fns[name].apply(null, args)); }
          catch (e) { onFail(e); }
        }, 150);
      };
    });
    return runner;
  }

  window.google = { script: { get run() { return makeRunner(); } } };
})();
