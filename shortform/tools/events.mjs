// Print a film's sync events as JSON: the page's window.SYNC_EVENTS ([{ t, kind }]).
//   node shortform/tools/events.mjs --page films/x/src/index.html > films/x/out/events.json
import { chromium } from '../../films/tin-launch/tools/node_modules/playwright/index.mjs';
import { resolve } from 'node:path';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + resolve(arg('page', 'src/index.html')) + '?render=1');
await page.waitForFunction(() => window.FILM && window.SYNC_EVENTS);
console.log(JSON.stringify(await page.evaluate(() => window.SYNC_EVENTS)));
await browser.close();
