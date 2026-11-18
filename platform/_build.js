const fs=require('fs'),path=require('path');
const T={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webmanifest':'application/manifest+json; charset=utf-8','.json':'application/json'};
const files={};
(function walk(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory())walk(p);else{const rel='/'+path.relative('public',p).split(path.sep).join('/');const ext=path.extname(p);const bin=ext==='.png';files[rel]={t:T[ext]||'application/octet-stream',b:bin?1:0,d:bin?fs.readFileSync(p).toString('base64'):fs.readFileSync(p,'utf8')}}}})('public');
const api=fs.readFileSync('functions/api/[[path]].js','utf8');
const out=`${api}
const FILES=${JSON.stringify(files)};
function asset(p){let f=FILES[p];if(!f&&p.endsWith('/'))f=FILES[p+'index.html'];if(!f)return null;
  const body=f.b?Uint8Array.from(atob(f.d),c=>c.charCodeAt(0)):f.d;
  const cc=/\\.(html)$/.test(p)||p.endsWith('/')||p.endsWith('sw.js')||p.endsWith('.webmanifest')?'no-cache':(p.endsWith('.png')?'public, max-age=604800':'public, max-age=300');
  return new Response(body,{headers:{'content-type':f.t,'cache-control':cc,'x-content-type-options':'nosniff'}})}
export default {async fetch(request,env,ctx){const url=new URL(request.url);let p=url.pathname;
  if(p.startsWith('/api/'))return onRequest({request,env,params:{path:p.slice(5).split('/').filter(Boolean)}});
  if(p==='/app'||p==='/admin')return Response.redirect(url.origin+p+'/'+url.search,301);
  const r=asset(p);if(r)return r;
  return new Response('الصفحة مش موجودة',{status:404,headers:{'content-type':'text/plain; charset=utf-8'}})}};
`;
fs.writeFileSync('worker/index.js',out);console.log('files',Object.keys(files).length,'bytes',out.length);
