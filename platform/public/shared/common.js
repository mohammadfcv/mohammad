/* Shared code for the customer and admin apps */
const $=s=>document.querySelector(s);
const P=(d)=>`<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ART={
 bullet:P('<rect x="8" y="16" width="26" height="14" rx="5"/><circle cx="34" cy="23" r="4"/><path d="M14 30v6h-5M20 30l-2 10"/>'),
 dome:P('<path d="M8 20h32"/><path d="M12 20a12 12 0 0 0 24 0"/><circle cx="24" cy="25" r="4.5"/><path d="M10 14h28v6H10z"/>'),
 wifi:P('<rect x="13" y="16" width="22" height="22" rx="11"/><circle cx="24" cy="27" r="4.5"/><path d="M17 10a10 10 0 0 1 14 0M20 13a5 5 0 0 1 8 0"/><path d="M16 38l-3 4h22l-3-4"/>'),
 ip:P('<rect x="6" y="15" width="28" height="14" rx="4"/><circle cx="34" cy="22" r="4.5"/><path d="M12 29v9M8 38h8"/><text x="11" y="25" font-size="7" fill="currentColor" stroke="none" font-weight="700">IP</text>'),
 dvr:P('<rect x="5" y="16" width="38" height="16" rx="3"/><circle cx="11" cy="24" r="1.6" fill="currentColor"/><circle cx="16" cy="24" r="1.6" fill="currentColor"/><path d="M24 22h14M24 26h10"/><path d="M10 32v3M38 32v3"/>'),
 hdd:P('<rect x="11" y="6" width="26" height="36" rx="3"/><circle cx="24" cy="20" r="8"/><circle cx="24" cy="20" r="2"/><path d="M17 36h6"/>'),
 cable:P('<circle cx="22" cy="24" r="14"/><circle cx="22" cy="24" r="5"/><path d="M36 24c4 0 6 3 6 8"/>'),
 psu:P('<rect x="8" y="12" width="32" height="22" rx="3"/><path d="M26 17l-5 7h6l-5 7"/><path d="M14 34v5M34 34v5"/>'),
 bnc:P('<path d="M10 24h10M20 18h10v12H20zM30 21h8v6h-8"/><path d="M16 18v12"/>'),
 breaker:P('<rect x="14" y="6" width="20" height="36" rx="3"/><rect x="20" y="16" width="8" height="12" rx="2"/><path d="M24 16v-4M20 36h8"/>'),
 inverter:P('<rect x="8" y="8" width="32" height="32" rx="4"/><rect x="14" y="14" width="20" height="10" rx="2"/><path d="M16 32c2-3 4 3 6 0s4 3 6 0"/>'),
 battery:P('<rect x="8" y="12" width="32" height="28" rx="4"/><path d="M15 12V8h6v4M27 12V8h6v4"/><path d="M15 26h6M30 23v6M27 26h6"/>'),
 solar:P('<path d="M6 34l6-22h28l-6 22z"/><path d="M9 23h28M18 12l-3 22M28 12l-3 22"/><path d="M22 34v6M16 40h12"/>'),
 wire:P('<path d="M6 30c8 0 8-12 18-12s10 12 18 12"/><path d="M6 36c8 0 8-12 18-12s10 12 18 12"/>'),
 panel:P('<rect x="8" y="6" width="32" height="36" rx="4"/><rect x="14" y="12" width="20" height="10" rx="2"/><circle cx="17" cy="30" r="2"/><circle cx="24" cy="30" r="2"/><circle cx="31" cy="30" r="2"/><path d="M17 36h14"/>'),
 motion:P('<path d="M14 10h20v14a10 10 0 0 1-20 0z"/><circle cx="24" cy="22" r="4"/><path d="M8 38a22 22 0 0 0 32 0"/>'),
 door:P('<rect x="10" y="12" width="12" height="24" rx="2"/><rect x="26" y="16" width="12" height="16" rx="2"/><path d="M22 24h4"/>'),
 smoke:P('<circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="8"/><path d="M24 16v-2M24 34v-2M16 24h-2M34 24h-2"/>'),
 siren:P('<path d="M14 34V24a10 10 0 0 1 20 0v10"/><path d="M10 34h28v6H10z"/><path d="M24 8v4M10 14l3 3M38 14l-3 3"/>'),
 speaker:P('<circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="9"/><circle cx="24" cy="24" r="3"/>'),
 amp:P('<rect x="5" y="14" width="38" height="20" rx="3"/><circle cx="13" cy="24" r="4"/><circle cx="24" cy="24" r="4"/><path d="M32 21h7M32 27h7"/>'),
 mic:P('<rect x="18" y="6" width="12" height="20" rx="6"/><path d="M12 22a12 12 0 0 0 24 0M24 34v8M18 42h12"/>'),
 horn:P('<path d="M8 20h8l18-10v28L16 28H8z"/><path d="M12 28l2 10"/>')
};
const IC={
 elec:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
 cam:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 7h12l4 3v4l-4 3H3z"/><circle cx="9" cy="12" r="2.5"/></svg>',
 alarm:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 8v5M12 16v.5"/></svg>',
 sound:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
 home:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/></svg>',
 orders:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
 chat:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
 tag:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8" r="1.5"/></svg>',
 bag:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 8h14l-1 13H6z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
 bell:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/></svg>',
 pin:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
 search:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
 back:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>',
 send:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M20 4 3 11l7 2 2 7z"/></svg>',
 wa:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.4z"/></svg>',
 phone:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M5 3h4l2 5-3 2a11 11 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
 cam2:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
 wrench:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M14 7a4 4 0 0 0 5 5l-8 8a2.1 2.1 0 0 1-3-3l8-8a4 4 0 0 1 5-5l-3 3 1 2 2 1z"/></svg>',
 plus:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
 check:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>'
};


const CATDEF=[{"id":"elec","name":"كهرباء","sub":"تمديدات · لوحات · طاقة شمسية","issues":[["انقطاع أو ماس كهربائي","breaker"],["تمديد جديد","wire"],["تركيب طاقة شمسية","solar"],["تركيب لوحة كهرباء","panel"],["صيانة إنفرتر وبطاريات","inverter"],["فحص عام للبيت","psu"]]},{"id":"cam","name":"كاميرات","sub":"Hikvision · Dahua · واي فاي · IP","issues":[["كاميرا ما عم تطلع صورة","bullet"],["مشكلة بالتسجيل أو الهارد","hdd"],["ربط الكاميرات عالجوال","wifi"],["إضافة أو نقل كاميرا","dome"],["الجهاز ما عم يشتغل","dvr"],["تمديدات وكبلات","cable"]]},{"id":"alarm","name":"أنظمة إنذار","sub":"إنذار سرقة · إنذار حريق","issues":[["الإنذار يصفّر بدون سبب","siren"],["تركيب إنذار سرقة","motion"],["تركيب إنذار حريق","smoke"],["تبديل حساسات","door"],["برمجة اللوحة","panel"],["بطارية اللوحة","battery"]]},{"id":"sound","name":"أنظمة صوت","sub":"محلات · مساجد · قاعات","issues":[["صوت ضعيف أو تشويش","speaker"],["تركيب نظام لمحل","amp"],["تركيب نظام لمسجد","horn"],["صيانة مكبّر","amp"],["مشكلة بالمايك","mic"],["تمديد سماعات","wire"]]}];
const STATUSES=["استلمنا الطلب","تم التواصل","الفني بالطريق","تم التنفيذ"];
const PALETTE=["#0f4c81","#9a4a00","#7a1f2b","#3b2a7a","#0d5c4a"];
const OFFSET=1000;

const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const cat=id=>CATDEF.find(c=>c.id===id)||CATDEF[0];
const money=n=>(+n||0).toLocaleString("en-US")+"$";
const ago=t=>{const m=Math.round((Date.now()-t)/60e3);if(m<1)return"الآن";if(m<60)return`قبل ${m} د`;const h=Math.round(m/60);if(h<24)return`قبل ${h} س`;return`قبل ${Math.round(h/24)} يوم`};
const first=n=>{const w=String(n||"").trim().split(/\s+/);return /^(أبو|ابو|أم|ام)$/.test(w[0])&&w[1]?w[0]+" "+w[1]:w[0]};
const hm=t=>{const d=new Date(t),h=d.getHours();return (h%12||12)+":"+String(d.getMinutes()).padStart(2,"0")+(h<12?" ص":" م")};
const waLink=(num,text)=>"https://wa.me/"+String(num).replace(/\D/g,"")+(text?"?text="+encodeURIComponent(text):"");
const localToWa=p=>String(p).replace(/\D/g,"").replace(/^00/,"").replace(/^0/,"963");
const tap=()=>{try{navigator.vibrate&&navigator.vibrate(8)}catch(e){}};
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};

async function api(path,{method="GET",body,admin}={}){
  const h={"content-type":"application/json"};if(admin)h["x-admin-key"]=admin;
  const r=await fetch("/api/"+path,{method,headers:h,body:body?JSON.stringify(body):undefined,cache:"no-store"});
  const d=await r.json().catch(()=>({error:"تعذّر قراءة الرد"}));
  if(!r.ok){const e=new Error(d.error||("خطأ "+r.status));e.status=r.status;throw e}
  return d;
}

let toastT;
function toast(title,sub,icon=IC.bell){const t=$("#toast");t.innerHTML=`<span class="ti">${icon}</span><span style="flex:1"><b>${esc(title)}</b><span>${esc(sub||"")}</span></span>`;t.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("on"),3600)}
function openSheet(html){$("#sheet").innerHTML=`<div class="grab"></div>`+html;$("#sheet").classList.add("on");$("#scrim").classList.add("on")}
function closeSheet(){$("#sheet").classList.remove("on");$("#scrim").classList.remove("on")}

function tick(){document.querySelectorAll("[data-ends]").forEach(el=>{let s=Math.max(0,Math.floor((+el.dataset.ends-Date.now())/1000));if(!s){el.textContent="انتهى";return}const d=Math.floor(s/86400);s%=86400;const h=String(Math.floor(s/3600)).padStart(2,"0"),m=String(Math.floor(s%3600/60)).padStart(2,"0"),x=String(s%60).padStart(2,"0");el.textContent=(d?d+"d ":"")+`${h}:${m}:${x}`+(el.closest(".offer")?" ⏱":"")})}
setInterval(tick,1000);

function drawGrid(cv){const r=cv.getBoundingClientRect(),d=devicePixelRatio||1;cv.width=r.width*d;cv.height=r.height*d;const x=cv.getContext("2d");x.scale(d,d);x.strokeStyle="rgba(255,255,255,.09)";
 for(let i=0;i<r.width;i+=22){x.beginPath();x.moveTo(i,0);x.lineTo(i,r.height);x.stroke()}for(let j=0;j<r.height;j+=22){x.beginPath();x.moveTo(0,j);x.lineTo(r.width,j);x.stroke()}
 x.strokeStyle="rgba(255,176,32,.55)";x.lineWidth=2;x.beginPath();x.moveTo(r.width,44);x.lineTo(r.width-88,44);x.lineTo(r.width-88,110);x.lineTo(r.width-176,110);x.stroke();x.fillStyle="#ffb020";[[r.width-88,44],[r.width-176,110]].forEach(([a,b])=>{x.beginPath();x.arc(a,b,3.5,0,7);x.fill()})}
function confetti(cv){if(matchMedia("(prefers-reduced-motion:reduce)").matches)return;const r=cv.getBoundingClientRect(),x=cv.getContext("2d");cv.width=r.width;cv.height=r.height;const cols=["#ffb020","#1857b8","#14915a","#c13a2e","#6b3fc4"];
 const ps=Array.from({length:90},()=>({x:r.width/2,y:r.height*.32,vx:(Math.random()-.5)*9,vy:-Math.random()*9-3,s:Math.random()*6+4,c:cols[Math.random()*5|0],a:Math.random()*6,va:(Math.random()-.5)*.3}));let f=0;
 (function loop(){x.clearRect(0,0,r.width,r.height);ps.forEach(p=>{p.vy+=.28;p.x+=p.vx;p.y+=p.vy;p.a+=p.va;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()});if(++f<130&&cv.isConnected)requestAnimationFrame(loop);else x.clearRect(0,0,r.width,r.height)})()}

/* ---------- install (PWA) ---------- */
let deferredPrompt=null;
const isStandalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;window.dispatchEvent(new Event("installable"))});
window.addEventListener("appinstalled",()=>{deferredPrompt=null;toast("تم تثبيت التطبيق","صار عندك أيقونة على الشاشة الرئيسية",IC.check.replace('stroke="#fff"','stroke="currentColor"'))});
const canOfferInstall=()=>!isStandalone()&&(deferredPrompt||isIOS());
function installCard(){return canOfferInstall()?`<button class="install" data-act="install"><span class="avatar" style="width:38px;height:38px;border-radius:12px">${IC.plus}</span><span style="flex:1"><b>ثبّت التطبيق على جوالك</b><span>بيفتح أسرع ومتل أي تطبيق، بدون متجر</span></span></button>`:""}
async function doInstall(){
  if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice.catch(()=>{});deferredPrompt=null;return}
  openSheet(`<h2 style="font-size:20px">تثبيت على الآيفون</h2><p class="muted small" style="margin-top:4px">لازم تفتح الرابط من Safari.</p>
   <div class="ios-steps"><div><i>1</i><span>اضغط زر <b>المشاركة</b> <svg style="display:inline;vertical-align:-4px" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v8h14v-8"/></svg> تحت الشاشة</span></div>
   <div><i>2</i><span>اختار <b>إضافة إلى الشاشة الرئيسية</b></span></div><div><i>3</i><span>اضغط <b>إضافة</b>، وبيطلع التطبيق بين تطبيقاتك</span></div></div>
   <button class="btn ink" data-act="close-sheet">تمام</button>`)}

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}
function setBadge(n){try{if(navigator.setAppBadge){n?navigator.setAppBadge(n):navigator.clearAppBadge()}}catch(e){}}
