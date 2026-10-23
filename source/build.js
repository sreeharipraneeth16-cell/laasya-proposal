/* ------------------------------------------------------------
   build.js — bundles source/ into a single self-contained
   ../index.html (CSS + JS + photo embedded)

   usage:  node source/build.js
   ------------------------------------------------------------ */
const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const rootDir = path.join(__dirname, '..');

// strip a UTF-8 BOM if an editor added one
const read = (file) => fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');

let html = read(path.join(srcDir, 'index.html'));
const css = read(path.join(srcDir, 'styles.css'));
const js = read(path.join(srcDir, 'script.js'));

// inline CSS
const linkTag = '<link rel="stylesheet" href="styles.css" />';
if (!html.includes(linkTag)) throw new Error('Could not find the stylesheet <link> in source/index.html');
html = html.replace(linkTag, () => '<style>\n' + css + '\n</style>');

// inline JS
const scriptTag = '<script src="script.js"></script>';
if (!html.includes(scriptTag)) throw new Error('Could not find the <script> tag in source/index.html');
html = html.replace(scriptTag, () => '<script>\n' + js + '\n</script>');

// embed the photo (all occurrences — hero portrait + polaroid)
const imgTag = 'src="../assets/best-moment.jpg"';
const photo = path.join(rootDir, 'assets', 'best-moment.jpg');
if (fs.existsSync(photo)) {
  const b64 = fs.readFileSync(photo).toString('base64');
  const occurrences = html.split(imgTag).length - 1;
  if (!occurrences) throw new Error('Could not find the photo <img> in source/index.html');
  html = html.split(imgTag).join('src="data:image/jpeg;base64,' + b64 + '"');
  console.log('photo: embedded (' + occurrences + ' place(s), ' + Math.round(fs.statSync(photo).size / 1024) + ' KB)');
} else {
  console.warn('photo: assets/best-moment.jpg not found — keeping the heart placeholder');
}

if (html.includes('__STYLES__') || html.includes('styles.css') || html.includes('script.js')) {
  console.warn('warning: a stylesheet/script reference may still be in the output');
}

const out = path.join(rootDir, 'index.html');
fs.writeFileSync(out, html, 'utf8');
console.log('built: index.html (' + Math.round(Buffer.byteLength(html, 'utf8') / 1024) + ' KB)');
