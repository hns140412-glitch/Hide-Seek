'use strict';
// User-invoked local preview. Loopback only; static assets only; never serves .local,
// .git, tools, source manuals, family records or arbitrary PC paths.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),port=44771,started=Date.now();
const dirAllowed=new Set(['assets','characters','data','vendor','explorer-crew-voice','audio']);
const exts=new Set(['.html','.css','.js','.mjs','.json','.webmanifest','.svg','.png','.jpg','.jpeg','.webp','.ico','.woff2','.mp3','.wav','.ogg','.wasm']);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.wasm':'application/wasm'};
let lastRequest=Date.now(),served=0;
const server=http.createServer((req,res)=>{
 lastRequest=Date.now();
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Cache-Control','no-store');
 res.setHeader('Referrer-Policy','no-referrer');
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end()}
 const u=new URL(req.url,'http://127.0.0.1:'+port);
 if(u.pathname==='/__hide_preview_status'){
  res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});
  return res.end(JSON.stringify({service:'HIDE_SEEK_LOCAL_PREVIEW_V1',port,up_s:Math.floor((Date.now()-started)/1000),files_served:served}));
 }
 let relative;
 try{relative=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html'}catch{res.writeHead(400);return res.end()}
 const segments=relative.split(/[\\/]/);
 if(segments.some(s=>!s||s==='.'||s==='..'||s.startsWith('.'))){res.writeHead(403);return res.end()}
 if(segments.length>1&&!dirAllowed.has(segments[0])){res.writeHead(404);return res.end()}
 const ext=path.extname(relative).toLowerCase();
 if(!exts.has(ext)){res.writeHead(404);return res.end()}
 const full=path.resolve(root,relative);
 if(!full.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 let stat;try{stat=fs.statSync(full)}catch{res.writeHead(404);return res.end()}
 if(!stat.isFile()){res.writeHead(404);return res.end()}
 res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream'});
 served++;
 if(req.method==='HEAD')return res.end();
 fs.createReadStream(full).on('error',()=>res.destroy()).pipe(res);
});
server.listen(port,'127.0.0.1',()=>console.log('HIDE_LOCAL_PREVIEW_READY http://127.0.0.1:'+port));
server.on('error',e=>{console.error('HIDE_LOCAL_PREVIEW_SERVER_ERROR',e.message);process.exitCode=1});
const watchdog=setInterval(()=>{if(Date.now()-lastRequest>3*60*60*1000)server.close()},15*60*1000);watchdog.unref();
