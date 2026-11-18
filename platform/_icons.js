const {chromium}=require('playwright');
const bolt='<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>';
const board='<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h3"/>';
function html(kind,size,mask){const bg=kind==='app'?'#0c2440':'#ffb020',fg=kind==='app'?'#ffb020':'#0c2440',g=kind==='app'?bolt:board;
 const pad=mask?size*0.2:size*0.16, r=mask?0:size*0.22;
 return `<html><body style="margin:0"><div style="width:${size}px;height:${size}px;background:${bg};border-radius:${r}px;display:grid;place-items:center;position:relative;overflow:hidden">
 <div style="position:absolute;inset:0;background-image:linear-gradient(${kind==='app'?'rgba(255,255,255,.07)':'rgba(12,36,64,.08)'} 1px,transparent 1px),linear-gradient(90deg,${kind==='app'?'rgba(255,255,255,.07)':'rgba(12,36,64,.08)'} 1px,transparent 1px);background-size:${size/12}px ${size/12}px"></div>
 <svg style="position:relative" width="${size-2*pad}" height="${size-2*pad}" viewBox="0 0 24 24" fill="${kind==='app'?fg:'none'}" stroke="${fg}" stroke-width="${kind==='app'?1.2:2}" stroke-linejoin="round" stroke-linecap="round">${g}</svg></div></body></html>`}
(async()=>{const b=await chromium.launch();const p=await b.newPage();
for(const k of ['app','admin'])for(const [name,size,mask,transparent] of [['icon-192',192,false,true],['icon-512',512,false,true],['icon-maskable-512',512,true,false],['apple-touch-icon',180,true,false]]){
 await p.setViewportSize({width:size,height:size});await p.setContent(html(k,size,mask));await p.screenshot({path:`public/${k}/${name}.png`,omitBackground:transparent});}
await b.close()})();
