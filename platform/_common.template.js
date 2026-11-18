/* Shared code for the customer and admin apps */
const $=s=>document.querySelector(s);
__ART__
const CATDEF=__CATDEF__;
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
