// Bygger test/app.html ur de RIKTIGA appscript-filerna, så den lokala
// frontend-testsidan aldrig kan glida ifrån produktionskoden igen.
// (Den gamla app.html var en handkopierad ögonblicksbild som tyst blev fyra
// månader gammal.) Körs med: node test/build-local.js
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'appscript');
const OUT = path.join(__dirname, 'app.html');

const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');

let html = read('Index.html');

// Apps Script kör <?!= include('X') ?> på servern; här ersätter vi dem med
// filernas innehåll. mock.js läggs FÖRE JavaScript-blocket eftersom det
// definierar window.google som klientkoden anropar direkt.
html = html.replace(/<\?!=\s*include\('Stylesheet'\);?\s*\?>/, () => read('Stylesheet.html'));
html = html.replace(/<\?!=\s*include\('JavaScript'\);?\s*\?>/,
  () => '<script src="mock.js"></script>\n' + read('JavaScript.html'));

if (/<\?!=/.test(html)) {
  console.error('FEL: kvarvarande <?!= ... ?> i Index.html — include-mönstret har ändrats');
  process.exit(1);
}

html = html.replace('<title>SwoleSheet</title>', '<title>SwoleSheet (lokal mock)</title>');

fs.writeFileSync(OUT, html, 'utf8');
console.log('skrev ' + path.relative(process.cwd(), OUT) + ' (' + html.length + ' tecken)');
console.log('öppna med: open test/app.html');
