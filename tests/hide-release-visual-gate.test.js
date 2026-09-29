const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const yml=fs.readFileSync(path.join(root,'.github/workflows/pages.yml'),'utf8');
const steps=[
 'node tools/verify-approved-mossfall.js --require-asset',
 'node tools/verify-v2-offline-dependencies.js',
 'actions/upload-pages-artifact@v3',
 'actions/deploy-pages@v4'
].map(x=>({name:x,offset:yml.indexOf(x)}));
assert(steps.every(x=>x.offset>=0),'Missing Pages release validation or deploy action');
assert(steps.every((x,i)=>!i||x.offset>steps[i-1].offset),
 'Pages must check original art and offline cache BEFORE upload and deploy');
const sw=fs.readFileSync(path.join(root,'sw-v2.js'),'utf8');
assert(sw.includes("const APPROVED_ART='./assets/visual/hide_seek_forest_asset.png'"),'Offline art path missing');
const artCheck=fs.readFileSync(path.join(root,'tools/verify-approved-mossfall.js'),'utf8');
assert(artCheck.includes("process.argv.includes('--require-asset')"),'Strict art release mode must not be removed');
assert(artCheck.includes('sha256'),'Original artwork checksum authority missing');
console.log('PASS: Pages deployment refuses missing or changed approved art and checks offline PWA before upload');
