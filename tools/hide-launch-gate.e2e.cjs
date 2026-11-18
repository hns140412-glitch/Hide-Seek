/* Launch gate journey: after a new release is deployed, a returning learner must never see the cached older
   release and then have it swapped out. The cover stays up, the new release installs, the page reloads into it.
   Self-contained: copies the tracked files twice (release A, release B), serves them with always-revalidate
   headers like the production host, and swaps the served folder to simulate a deploy.
   Run: node tools/hide-launch-gate.e2e.cjs */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
const REPO = path.resolve(__dirname, '..');
const TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', json: 'application/json', png: 'image/png', jpg: 'image/jpeg', mp3: 'audio/mpeg', svg: 'image/svg+xml', webp: 'image/webp' };

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hide-gate-'));
  const files = cp.execSync('git ls-files -z', { cwd: REPO, maxBuffer: 1 << 26 }).toString().split('\0').filter(Boolean);
  const build = (name, id) => {
    const dir = path.join(tmp, name);
    for (const f of files) { const to = path.join(dir, f); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(path.join(REPO, f), to); }
    const rel = path.join(dir, 'hide-release-v01.js');
    fs.writeFileSync(rel, fs.readFileSync(rel, 'utf8').replace(/release_id:'[^']+'/, `release_id:'${id}'`));
    return dir;
  };
  const A = build('a', 'hide-seek-gate-test-a'), B = build('b', 'hide-seek-gate-test-b');
  let root = A;
  const server = http.createServer((q, r) => {
    let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith(path.sep)) f = path.join(f, 'index.html');
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TYPES[f.split('.').pop()] || 'application/octet-stream', 'Cache-Control': 'public, max-age=0, must-revalidate' }); r.end(d); });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const URL = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await chromium.launch();
  try {
    const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const look = () => page.evaluate(() => { const g = document.getElementById('hideLaunchGate'); return { id: globalThis.HideSeekReleaseDescriptor?.release_id || '', covered: !!g && g.style.opacity !== '0' }; }).catch(() => null);
    const untilOpen = async ms => { const t = Date.now(); for (;;) { const s = await look(); if (s && !s.covered) return Date.now() - t; if (Date.now() - t > ms) return -1; await page.waitForTimeout(25); } };

    // first visit: nothing cached, the app opens at once
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    const first = await untilOpen(3000); assert(first >= 0, 'first visit stayed covered');
    await page.evaluate(() => navigator.serviceWorker.ready); await page.waitForTimeout(3000);

    // same release reopened: one quick check, then the app
    await page.reload({ waitUntil: 'domcontentloaded' });
    const again = await untilOpen(3000); assert(again >= 0 && again < 2500, 'reopening the same release was slow or stayed covered: ' + again);
    assert((await look()).id.endsWith('-a'), 'wrong release after reopen');

    // deploy release B, reopen: release A must never be visible
    root = B;
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    let sawOld = false, landed = false; const t0 = Date.now();
    while (Date.now() - t0 < 20000) {
      const s = await look();
      if (s && !s.covered && s.id.endsWith('-a')) sawOld = true;
      if (s && !s.covered && s.id.endsWith('-b')) { landed = true; break; }
      await page.waitForTimeout(25);
    }
    assert(!sawOld, 'the older release was shown before the new one');
    assert(landed, 'the new release never opened');

    // offline with a cached release: the app still opens
    await page.context().setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    const off = await untilOpen(3000); assert(off >= 0, 'offline launch stayed covered');
    assert(!errors.length, 'page errors: ' + errors.join(' | '));
    console.log(`PASS launch gate: first ${first}ms, reopen ${again}ms, update in ${Date.now() - t0}ms without showing the old release, offline ${off}ms`);
  } finally { await browser.close(); server.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
