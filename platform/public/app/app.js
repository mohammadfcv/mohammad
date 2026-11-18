/* Customer app */
let CATALOG=LS.get("c_catalog",null);
let user=LS.get("c_user",null);
let token=LS.get("c_token",null);
if(!token){token=(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2));LS.set("c_token",token)}
let orders=LS.get("c_orders",[]);
let cart=LS.get("c_cart",{});
let pkgs=LS.get("c_pkgs",{});
let seenStatus=LS.get("c_seen",{});
let online=true;
function save(){LS.set("c_user",user);LS.set("c_orders",orders);LS.set("c_cart",cart);LS.set("c_pkgs",pkgs);LS.set("c_seen",seenStatus)}

const S=()=>CATALOG.settings, AREAS=()=>S().areas;
const products=()=>CATALOG.products.filter(p=>!p.off);
const prodById=id=>CATALOG.products.find(p=>p.id===id);

let st={route:user?{s:"home"}:{s:"ob",step:0},stack:[],ob:{name:user?.name||"",phone:user?.phone||"",area:user?.area||""},
  filter:"الكل",tab:"parts",fix:{issue:null,urgent:false,when:"أقرب وقت",note:"",photos:[]},
  b:{count:4,place:"mix",tech:"analog",brand:"Hikvision",res:"2MP",install:true},q:"",chatId:null,sending:false};
let lastKey="",dir="";

const cartList=()=>Object.entries(cart).filter(([,q])=>q>0).map(([k,q])=>{if(k.startsWith("pkg:")){const pk=pkgs[k];return pk?{...pk,key:k,q}:null}const p=prodById(k);return p&&!p.off?{...p,key:k,q}:null}).filter(Boolean);
const cartCount=()=>cartList().reduce((s,x)=>s+x.q,0);
const cartTotal=()=>cartList().reduce((s,x)=>s+x.p*x.q,0);
const unread=()=>orders.reduce((s,o)=>s+(o.chat||[]).filter(m=>m.from==="admin"&&!m.read).length,0);
const greet=()=>{const h=new Date().getHours();return h<12?"صباح الخير":h<18?"نهارك سعيد":"مسا الخير"};

function nav(route){st.stack.push(st.route);dir="";st.route=route;render(true)}
function back(){dir="back";st.route=st.stack.pop()||{s:"home"};render(true)}

/* ---------- data sync ---------- */
async function loadCatalog(){try{const c=await api("catalog");CATALOG=c;LS.set("c_catalog",c);online=true}catch(e){online=false}}
async function loadOrders(silent){
  try{const list=await api("my?token="+encodeURIComponent(token));online=true;
    if(silent){
      list.forEach(o=>{const old=orders.find(x=>x.id===o.id);
        if(old&&old.status!==o.status)toast(`تحديث على طلب #${o.id}`,STATUSES[o.status],IC.orders);
        const nOld=old?(old.chat||[]).length:0,nNew=(o.chat||[]).length;
        if(old&&nNew>nOld&&o.chat[nNew-1].from==="admin"&&!(st.route.s==="chat"&&st.chatId===o.id))toast("رسالة من المحل",o.chat[nNew-1].t,IC.chat)});
    }
    const changed=JSON.stringify(list)!==JSON.stringify(orders);orders=list;save();setBadge(unread());
    if(changed&&silent&&!document.querySelector("input:focus,textarea:focus"))render();
    else if(changed&&silent&&st.route.s==="chat")renderChatOnly();
  }catch(e){online=false}
}
setInterval(()=>{if(document.visibilityState==="visible"&&user)loadOrders(true)},8000);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&user){loadOrders(true);loadCatalog().then(()=>{if(!document.querySelector("input:focus,textarea:focus"))render()})}});

/* ---------- camera package builder ---------- */
function buildPackage(){
 const b=st.b,n=b.count,out=[],add=(n2,q,p)=>out.push({n:n2,q,p});
 const hik=b.brand==="Hikvision",hi=b.res==="4MP";
 const indoor=b.place==="in"?n:b.place==="out"?0:Math.floor(n/2),outdoor=n-indoor;
 if(b.tech==="wifi"){
   if(outdoor)add(`كاميرا واي فاي خارجية ${b.res}`,outdoor,hi?48:42);
   if(indoor)add(`كاميرا واي فاي داخلية متحركة ${b.res}`,indoor,hi?38:34);
   add("ذاكرة MicroSD 128GB",n,9);
 }else{
   const ip=b.tech==="ip",base=ip?(hi?48:40):(hi?29:(hik?22:19));
   if(outdoor)add(`كاميرا ${ip?"IP ":""}خارجية ${b.res} · ${b.brand}`,outdoor,base);
   if(indoor)add(`كاميرا ${ip?"IP ":""}قبة داخلية ${b.res} · ${b.brand}`,indoor,base-2);
   const ch=n<=4?4:n<=8?8:16;
   add(`جهاز ${ip?"NVR":"DVR"} ${ch} قنوات · ${b.brand}`,1,ip?{4:62,8:78,16:140}[ch]:{4:45,8:68,16:120}[ch]);
   const load=n*(hi?2:1),tb=load<=4?1:load<=8?2:4;
   add(`هارد مراقبة ${tb}TB`,1,{1:42,2:62,4:105}[tb]);
   const rolls=Math.ceil(n*25/100);
   if(ip){add("سويتش PoE "+(n<=4?4:n<=8?8:16)+" مخرج",1,n<=4?35:n<=8?55:95);add("كبل شبكة Cat6 · 100م",rolls,32);add("رؤوس RJ45 · 20 قطعة",1,4)}
   else{add("كبل كاميرات · 100م",rolls,18);add(`باور سبلاي ${n<=4?4:n<=8?8:16} مخارج`,1,n<=4?9:n<=8?15:26);add("رؤوس BNC · 10 قطع",Math.ceil(n*2/10),3)}
 }
 if(b.install)add("أجور التركيب والبرمجة (لكل كاميرا)",n,b.tech==="wifi"?5:8);
 return{lines:out,total:out.reduce((s,x)=>s+x.q*x.p,0)};
}

/* ---------- views ---------- */
const V={};
const chev=IC.back.replace("m9 6 6 6-6 6","m15 6-6 6 6 6");
V.ob=()=>{const s=st.route.step,o=st.ob;
 const body=s===0?`<h2>شو اسمك؟</h2><p class="muted small">ما في حساب ولا كلمة سر. بس لنعرف مين عم يطلب.</p>
   <input class="input big-input" id="ob-name" placeholder="مثلاً: أبو محمد" value="${esc(o.name)}" autocomplete="name">`
  :s===1?`<h2>رقم جوالك</h2><p class="muted small">على هاد الرقم بيتواصل معك الفني أو على الواتساب.</p>
   <input class="input big-input num" id="ob-phone" dir="ltr" inputmode="tel" placeholder="09xx xxx xxx" value="${esc(o.phone)}" autocomplete="tel">
   <div class="hint">${IC.wa.replace('width="20" height="20"','width="16" height="16"')} يفضّل يكون عليه واتساب</div>`
  :`<h2>وين منطقتك؟</h2><p class="muted small">لنبعتلك أقرب فني ونوريك العروض المتوفرة عندك.</p>
   <div class="areas">${AREAS().map(a=>`<button type="button" class="area" data-area="${esc(a)}" aria-pressed="${o.area===a}">${IC.pin}${esc(a)}</button>`).join("")}</div>`;
 const ok=s===0?o.name.trim().length>1:s===1?o.phone.replace(/\D/g,"").length>=9:!!o.area;
 return `<div class="ob">
  <div class="ob-hero"><canvas id="grid-cv"></canvas>
   <div class="row" style="justify-content:space-between">${s?`<button class="iconbtn" data-act="ob-back" style="background:rgba(255,255,255,.1);border-color:transparent;color:inherit" aria-label="رجوع">${IC.back}</button>`:`<span class="mark">${IC.elec}</span>`}<span class="small" style="opacity:.7">${s+1} من 3</span></div>
   ${s===0?`<span class="small" style="opacity:.8">${esc(S().shop)}</span><h1>كل شغلك بالكهرباء والكاميرات والإنذار بمكان واحد</h1><div class="ob-tags"><span>كهرباء</span><span>كاميرات</span><span>إنذار سرقة وحريق</span><span>أنظمة صوت</span></div>`:`<h1>${s===1?"أهلاً "+esc(first(o.name))+" 👋":"خطوة أخيرة"}</h1>`}
  </div>
  <form class="ob-card" id="f-ob"><div class="steps"><i class="on"></i><i class="${s>0?"on":""}"></i><i class="${s>1?"on":""}"></i></div>
   ${body}<div style="flex:1"></div>
   <button class="btn ink" id="ob-next" ${ok?"":"disabled"}>${s<2?"التالي":"ابدأ"}</button></form></div>`};

function prodCard(p){const q=cart[p.id]||0;
 return `<div class="card prod">${p.hot?`<span class="ribbon">مطلوب</span>`:""}<span class="img" style="color:var(--c-${p.cat})">${ART[p.a]||ART.psu}</span><span class="brand">${esc(p.b)}</span><b>${esc(p.n)}</b>
  <div class="foot"><span class="price num">${money(p.p)}</span>${q?`<span class="stepper"><button data-q="${p.id}" data-d="1" aria-label="زيادة">+</button><span class="num">${q}</span><button data-q="${p.id}" data-d="-1" aria-label="نقصان">−</button></span>`:`<button class="add" data-q="${p.id}" data-d="1" aria-label="أضف للسلة">+</button>`}</div></div>`}
function cartBar(){return `<div class="cartbar"><span class="count num" id="cc">${cartCount()}</span><span class="t"><small>السلة</small><b class="num">${money(cartTotal())}</b></span><button class="btn" data-act="cart">متابعة الطلب</button></div>`}
function topbar(title,extra=""){return `<div class="topbar"><button class="iconbtn" data-act="back" aria-label="رجوع">${IC.back}</button><h2>${title}</h2>${extra}</div>`}
const cartBtn=()=>`<button class="iconbtn" data-act="cart" aria-label="السلة">${IC.bag}${cartCount()?`<span class="badge num">${cartCount()}</span>`:""}</button>`;

V.home=()=>{const n=cartCount(),mo=orders.filter(o=>o.status<3)[0],q=st.q.trim().toLowerCase(),res=q?products().filter(p=>(p.n+" "+p.b+" "+p.g).toLowerCase().includes(q)):null,offers=CATALOG.offers.filter(o=>o.ends>Date.now());
 return `<div class="hello">
  <div class="between"><div><div class="loc">${IC.pin}<button data-act="area" style="color:inherit;font-weight:600">${esc(user.area)} ▾</button></div><h1>${greet()}، ${esc(first(user.name))}</h1></div>
   <button class="iconbtn" data-act="cart" aria-label="السلة">${IC.bag}${n?`<span class="badge num">${n}</span>`:""}</button></div>
  <label class="search">${IC.search}<input id="q" placeholder="دوّر على كاميرا، إنفرتر، حساس…" value="${esc(st.q)}" autocomplete="off" enterkeyhint="search"></label>
 </div>
 ${res?`<div class="pad stack" style="margin-top:-40px"><div class="card" style="padding:6px 0">${res.length?res.slice(0,12).map(p=>`<button class="row" data-goprod="${p.id}" style="padding:10px 14px;width:100%;text-align:start"><span class="prod" style="padding:0"><span class="img" style="width:44px;color:var(--c-${p.cat})">${ART[p.a]||ART.psu}</span></span><span style="flex:1"><b style="font-size:14px">${esc(p.n)}</b><br><span class="small muted">${esc(p.b)} · ${cat(p.cat).name}</span></span><b class="num">${money(p.p)}</b></button>`).join(""):`<p class="muted" style="padding:16px">ما لقينا شي بهالاسم. جرّب كلمة تانية أو اطلب صيانة.</p>`}</div></div>`:`
 ${offers.length?`<div class="offers-wrap"><div class="offers" id="offers">${offers.map(o=>`<button class="offer" data-offer="${o.id}" style="background:${PALETTE[(o.color||0)%PALETTE.length]}"><span class="art">${ART[o.art]||ART.bullet}</span><span class="tag">${esc(o.tag)}</span><b>${esc(o.t)}</b><span class="d">${esc(o.d)}</span><span class="cd num" data-ends="${o.ends}"></span><span class="p"><strong class="num">${money(o.p)}</strong>${o.old?`<s class="num">${money(o.old)}</s>`:""}</span></button>`).join("")}</div>
 <div class="dots" id="dots">${offers.map((o,i)=>`<i class="${i?"":"on"}"></i>`).join("")}</div></div>`:`<div style="height:0;margin-top:-40px"></div>`}
 ${installCard()}
 ${mo?`<div class="sec-h"><h3>طلبك الحالي</h3><button data-tabnav="orders">كل الطلبات</button></div><button class="card mini-order" data-tabnav="orders"><span class="avatar">${IC[mo.cat]||IC.orders}</span><span style="flex:1"><b>طلب #${mo.id}</b><br><span class="small muted">${ago(mo.at)}</span></span><span class="status s${mo.status}">${STATUSES[mo.status]}</span></button>`:""}
 <div class="sec-h"><h3>شو بتحتاج؟</h3></div>
 <div class="cats">${CATDEF.map(c=>`<button class="cat" data-c="${c.id}" data-cat="${c.id}"><span class="ci">${IC[c.id]}</span><b>${c.name}</b><span>${c.sub}</span></button>`).join("")}</div>
 <button class="sos" data-act="sos"><span class="pulse"></span><span style="flex:1">عندك عطل طارئ؟<small>اطلب فني صيانة بضغطة وحدة</small></span>${chev}</button>
 <div class="sec-h"><h3>صمّم منظومتك</h3></div>
 <button class="builder-cta" data-act="builder"><span class="ci">${IC.cam}</span><span style="flex:1"><b>منظومة كاميرات على مقاسك</b><span>اختار عدد الكاميرات والنوع، ومنحسبلك كل القطع والسعر فوراً</span></span>${chev}</button>
 ${products().some(p=>p.hot)?`<div class="sec-h"><h3>الأكثر طلباً</h3></div><div class="pgrid">${products().filter(p=>p.hot).slice(0,6).map(prodCard).join("")}</div>`:""}
 <div class="sec-h"><h3>تواصل معنا</h3></div>
 <div class="pad"><a class="btn wa" target="_blank" rel="noopener" href="${waLink(S().wa,"مرحبا، عندي استفسار")}">${IC.wa} احكينا عالواتساب</a></div>
 <div style="height:24px"></div>`}
 ${n?cartBar():""}`};

V.cat=()=>{const c=cat(st.route.cat),list=products().filter(p=>p.cat===c.id),groups=["الكل",...new Set(list.map(p=>p.g))],F=st.fix;
 const parts=`<div class="pad"><div class="chips scroll">${groups.map(g=>`<button class="chip" data-filter="${esc(g)}" aria-pressed="${st.filter===g}">${esc(g)}</button>`).join("")}</div></div>
  ${c.id==="cam"?`<div style="height:12px"></div><button class="builder-cta" data-act="builder" style="padding:14px"><span class="ci" style="width:42px;height:42px">${IC.cam}</span><span style="flex:1"><b>ما بتعرف شو بدك؟</b><span>صمّم منظومتك ومنحسبلك القطع</span></span></button>`:""}
  <div style="height:14px"></div>${list.length?`<div class="pgrid">${list.filter(p=>st.filter==="الكل"||p.g===st.filter).map(prodCard).join("")}</div>`:`<div class="empty"><b style="color:var(--fg)">ما في قطع معروضة هون حالياً</b><p class="small">اطلب صيانة أو احكينا عالواتساب ومنأمّنلك اللي بدك ياه.</p></div>`}`;
 const fix=`<div class="sec-h" style="margin-top:4px"><h3>شو المشكلة أو الشغل؟</h3></div>
  <div class="issues">${c.issues.map(([t,a])=>`<button class="issue" data-issue="${esc(t)}" aria-pressed="${F.issue===t}"><span class="ii">${ART[a].replace('stroke-width="2.2"','stroke-width="3" width="22" height="22"')}</span>${t}</button>`).join("")}</div>
  <div class="pad stack" style="margin-top:18px">
   <div class="urg"><button data-urg="0" aria-pressed="${!F.urgent}"><b>عادي</b><small>خلال يوم أو يومين</small></button><button class="red" data-urg="1" aria-pressed="${F.urgent}"><b>مستعجل</b><small>بنفس اليوم</small></button></div>
   <div class="field"><span>وقت الزيارة المناسب</span><div class="chips">${["أقرب وقت","الصبح","الظهر","المسا"].map(w=>`<button class="chip" data-when="${w}" aria-pressed="${F.when===w}">${w}</button>`).join("")}</div></div>
   <label class="field"><span>احكيلنا أكتر (اختياري)</span><textarea class="input" id="fix-note" placeholder="مثلاً: الكاميرا التانية ما عم تطلع صورة من يومين">${esc(F.note)}</textarea></label>
   <label class="upload"><input type="file" accept="image/*" multiple id="photos">${IC.cam2}<span><b class="small">صوّر المشكلة</b><br><span class="small muted">بتساعد الفني يجيب القطعة الصح من أول مرة</span></span></label>
   ${F.photos.length?`<div class="thumbs">${F.photos.map(u=>`<img src="${u}" alt="صورة مرفقة">`).join("")}</div>`:""}
   <button class="btn ink" data-act="fix-go" ${F.issue?"":"disabled"}>متابعة</button><div style="height:10px"></div></div>`;
 return topbar(c.name,cartBtn())+
  `<div class="cat-head"><div class="seg" role="tablist"><button role="tab" data-tab="parts" aria-selected="${st.tab==="parts"}">قطع ومعدات</button><button role="tab" data-tab="fix" aria-selected="${st.tab==="fix"}">صيانة وتصليح</button></div></div>
  ${st.tab==="parts"?parts:fix}${st.tab==="parts"&&cartCount()?cartBar():'<div style="height:16px"></div>'}`};

V.builder=()=>{const b=st.b,pk=buildPackage();
 const o=(k,v,l,s)=>`<button class="opt" data-b="${k}" data-v="${v}" aria-pressed="${b[k]===v}">${l}${s?`<small>${s}</small>`:""}</button>`;
 return topbar("صمّم منظومة كاميرات",cartBtn())+`<div class="pad stack">
  <div class="card bstep"><h4><i>1</i>كم كاميرا بدك؟</h4>
   <div class="counter"><button data-cnt="1" aria-label="زيادة">+</button><div class="v"><strong class="num">${b.count}</strong><span class="small muted">كاميرات</span></div><button data-cnt="-1" aria-label="نقصان">−</button></div>
   <div class="camdots">${"<i></i>".repeat(b.count)}</div></div>
  <div class="card bstep"><h4><i>2</i>وين رح تنركّب؟</h4><div class="opts">${o("place","in","داخلي","جوا البيت")}${o("place","out","خارجي","برا ومداخل")}${o("place","mix","مختلط","نص ونص")}</div></div>
  <div class="card bstep"><h4><i>3</i>نوع النظام</h4><div class="opts">${o("tech","analog","سلكي","الأوفر")}${o("tech","ip","IP","أعلى جودة")}${o("tech","wifi","واي فاي","بدون تمديد")}</div></div>
  ${b.tech!=="wifi"?`<div class="card bstep"><h4><i>4</i>الماركة والدقة</h4><div class="opts two">${o("brand","Hikvision","Hikvision")}${o("brand","Dahua","Dahua")}</div><div class="opts two">${o("res","2MP","2MP","Full HD")}${o("res","4MP","4MP","2K أوضح")}</div></div>`:`<div class="card bstep"><h4><i>4</i>الدقة</h4><div class="opts two">${o("res","2MP","2MP","Full HD")}${o("res","4MP","4MP","2K أوضح")}</div></div>`}
  <div class="card bstep"><div class="toggle"><span><b>بدك تركيب وبرمجة؟</b><br><span class="small muted">الفني بيركّب وبيربط الكاميرات على جوالك</span></span><button class="sw" role="switch" aria-checked="${b.install}" data-act="install-sw" aria-label="تركيب"></button></div></div>
  <div class="card bom"><div class="between"><h4 style="font-size:15.5px">قائمة القطع</h4><span class="small muted">محسوبة تلقائياً</span></div>
   ${pk.lines.map(l=>`<div class="bom-line"><span class="q num">${l.q}×</span><span class="n">${esc(l.n)}</span><span class="num muted">${money(l.p*l.q)}</span></div>`).join("")}
   <div class="bom-total"><span>المجموع التقريبي</span><strong class="num">${money(pk.total)}</strong></div></div>
  <button class="btn" data-act="pkg-add">أضف المنظومة للسلة</button><div style="height:14px"></div></div>`};

V.success=()=>{const o=orders.find(x=>x.id===st.route.id)||{id:st.route.id,phone:user.phone};
 return `<div class="success"><canvas id="confetti"></canvas>
  <div class="check"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg></div>
  <h1>وصل طلبك!</h1><p class="muted">${o.urgent?"طلبك مستعجل، رح نتصل فيك خلال ساعة.":"رح نتواصل معك على "+esc(o.phone)+" بأقرب وقت."}</p>
  <span class="ticket">رقم الطلب <span class="num">#${o.id}</span></span>
  <div class="btns"><button class="btn ink" data-tabnav="orders">تتبّع الطلب</button>
   <a class="btn wa" target="_blank" rel="noopener" href="${waLink(S().wa,`مرحبا، بخصوص طلبي رقم ${o.id}`)}">${IC.wa} احكينا عالواتساب</a>
   <button class="btn soft" data-act="chat" data-id="${o.id}">راسلنا من التطبيق</button></div></div>`};

function trackHTML(o){return `<div class="track">${STATUSES.map((s,i)=>`<div class="${i<=o.status?"on":""} ${i===o.status?"cur":""}"><i>${i<=o.status?IC.check:""}</i>${s}</div>`).join("")}</div>`}
function orderSummary(o){return o.kind==="fix"?`${esc(o.issue)}${o.urgent?" · <b style='color:var(--bad)'>مستعجل</b>":""}`:(o.items||[]).map(i=>`${esc(i.n)} × ${i.q}`).join("، ")}
V.orders=()=>`<div class="topbar"><h2>طلباتي</h2></div>`+(orders.length?orders.map(o=>{const un=(o.chat||[]).filter(m=>m.from==="admin"&&!m.read).length;return `<div class="card order"><div class="between"><span><b>طلب #${o.id}</b><br><span class="small muted">${cat(o.cat).name} · ${o.kind==="fix"?"صيانة":"قطع"} · ${ago(o.at)}</span></span><span class="status s${o.status}">${STATUSES[o.status]}</span></div>
   ${trackHTML(o)}<p class="small muted">${orderSummary(o)}</p>${o.total?`<div class="between"><span class="small muted">المجموع التقريبي</span><b class="num">${money(o.total)}</b></div>`:""}
   <div class="row"><button class="btn soft sm" data-act="chat" data-id="${o.id}" style="position:relative">${IC.chat} محادثة${un?`<span class="badge num">${un}</span>`:""}</button><a class="btn wa sm" target="_blank" rel="noopener" href="${waLink(S().wa,`مرحبا، بخصوص طلبي رقم ${o.id}`)}">${IC.wa} واتساب</a></div></div>`}).join("")
  :`<div class="empty"><span class="ei">${IC.orders}</span><b style="color:var(--fg)">ما عندك طلبات لسا</b><p class="small">اختار قسم من الرئيسية وابعت أول طلب، ورح تقدر تتبّعه من هون.</p><button class="btn ink sm" style="width:auto" data-tabnav="home">تصفّح الأقسام</button></div>`);

function chatMsgs(o){return `<div class="msg sys">طلب #${o.id} · ${orderSummary(o)}</div>${(o.chat||[]).map(m=>`<div class="msg ${m.from==="user"?"me":"them"}">${esc(m.t)}<time class="num">${hm(m.at)}</time></div>`).join("")}`}
V.chat=()=>{let o=orders.find(x=>x.id===st.chatId)||orders[0];
 if(!o)return `<div class="topbar"><h2>المحادثة</h2></div><div class="empty"><span class="ei">${IC.chat}</span><b style="color:var(--fg)">ابعت طلب لتبلّش المحادثة</b><p class="small">المحادثة مربوطة بطلبك، فبيعرف المحل شو طالب دغري.</p><a class="btn wa sm" style="width:auto" target="_blank" rel="noopener" href="${waLink(S().wa,"مرحبا، عندي استفسار")}">${IC.wa} أو احكينا عالواتساب</a></div>`;
 st.chatId=o.id;markRead(o);
 const others=orders.length>1?`<div class="chips scroll" style="padding:8px 14px 0;margin:0">${orders.slice(0,8).map(x=>`<button class="chip" data-chatsel="${x.id}" aria-pressed="${x.id===o.id}">#${x.id}</button>`).join("")}</div>`:"";
 return `<div class="chatwrap"><div class="chat-head">${st.stack.length?`<button class="iconbtn" data-act="back" aria-label="رجوع">${IC.back}</button>`:""}<span class="avatar on">${esc(S().shop.slice(0,1))}</span><span style="flex:1"><b>${esc(S().shop)}</b><br><span class="small muted">بخصوص طلب #${o.id}</span></span>
   <a class="iconbtn" style="color:var(--wa)" target="_blank" rel="noopener" href="${waLink(S().wa,`مرحبا، بخصوص طلبي رقم ${o.id}`)}" aria-label="واتساب">${IC.wa}</a></div>${others}
  <div class="msgs" id="msgs">${chatMsgs(o)}</div>
  <div class="quick">${["إيمتى بيوصل الفني؟","في عندكم تقسيط؟","بدي عدّل الطلب","شكراً 🙏"].map(q=>`<button data-quick="${esc(q)}">${q}</button>`).join("")}</div>
  <form class="composer" id="f-chat"><input id="msg" placeholder="اكتب رسالة…" autocomplete="off" enterkeyhint="send"><button aria-label="إرسال">${IC.send}</button></form></div>`};
function renderChatOnly(){const o=orders.find(x=>x.id===st.chatId);const m=$("#msgs");if(o&&m){m.innerHTML=chatMsgs(o);$("#view").scrollTop=1e6;markRead(o)}}
function markRead(o){if((o.chat||[]).some(m=>m.from==="admin"&&!m.read)){o.chat.forEach(m=>{if(m.from==="admin")m.read=1});save();setBadge(unread());api("read",{method:"POST",body:{token,orderId:o.id}}).catch(()=>{});setTimeout(renderNav,0)}}

/* ---------- checkout ---------- */
function checkoutSheet(kind){
 const isFix=kind==="fix",c=isFix?cat(st.route.cat):null,F=st.fix,list=cartList();
 if(!isFix&&!list.length){openSheet(`<div class="empty"><span class="ei">${IC.bag}</span><b style="color:var(--fg)">السلة فاضية</b><p class="small">ضيف قطع من الأقسام أو صمّم منظومة كاميرات.</p></div>`);return}
 openSheet(`<form id="f-checkout" class="stack" data-kind="${kind}"><h2 style="font-size:20px">${isFix?"طلب صيانة":"سلتك"}</h2>
  <div class="card" style="padding:6px 14px">${isFix?`<div class="sum-line"><span class="muted">القسم</span><b>${c.name}</b></div><div class="sum-line"><span class="muted">الشغل</span><b>${esc(F.issue)}</b></div><div class="sum-line"><span class="muted">الأولوية</span><b style="${F.urgent?"color:var(--bad)":""}">${F.urgent?"مستعجل":"عادي"}</b></div><div class="sum-line"><span class="muted">الوقت</span><b>${F.when}</b></div>${F.photos.length?`<div class="sum-line"><span class="muted">صور</span><b class="num">${F.photos.length}</b></div>`:""}`
   :list.map(x=>`<div class="sum-line"><span style="flex:1">${esc(x.n)}</span><span class="stepper" style="height:30px;transform:scale(.9)"><button type="button" data-q="${x.key}" data-d="1" data-insheet="1" aria-label="زيادة">+</button><span class="num">${x.q}</span><button type="button" data-q="${x.key}" data-d="-1" data-insheet="1" aria-label="نقصان">−</button></span><b class="num" style="min-width:56px;text-align:left">${money(x.p*x.q)}</b></div>`).join("")+`<div class="sum-total"><span class="muted">المجموع التقريبي</span><strong class="num">${money(cartTotal())}</strong></div>`}</div>
  <div class="row"><label class="field" style="flex:1"><span>الاسم</span><input class="input" id="c-name" value="${esc(user.name)}"></label><label class="field" style="flex:1"><span>الرقم</span><input class="input num" id="c-phone" dir="ltr" inputmode="tel" value="${esc(user.phone)}"></label></div>
  <div class="field"><span>كيف بتحب نتواصل معك؟</span><div class="chips" id="c-via">${["واتساب","اتصال","شات بالتطبيق"].map((v,i)=>`<button type="button" class="chip" data-via="${v}" aria-pressed="${i===0}">${v}</button>`).join("")}</div></div>
  <p class="small muted">${IC.pin.replace('width="16" height="16"','width="13" height="13" style="display:inline"')} على منطقة <b>${esc(user.area)}</b>. السعر النهائي بيتأكد معك قبل التنفيذ.</p>
  <p class="small" id="c-err" style="color:var(--bad)" hidden></p>
  <button class="btn" id="c-send">إرسال الطلب</button></form>`);
}

/* ---------- render ---------- */
function renderNav(){const nv=$("#nav");
 if(st.route.s==="ob"){nv.hidden=true;return}
 const t=st.route.s==="orders"?"orders":st.route.s==="chat"?"chat":"home",ur=unread(),oc=orders.filter(o=>o.status<3).length;
 nv.hidden=false;nv.innerHTML=[["home","الرئيسية"],["orders","طلباتي",oc],["chat","المحادثة",ur]].map(([k,l,b])=>`<button data-tabnav="${k}" ${t===k?'aria-current="page"':""}>${IC[k]}${l}${b?`<span class="badge num">${b}</span>`:""}</button>`).join("")}
function render(anim){
 if(!CATALOG){$("#view").innerHTML=`<div class="boot"><div class="stack" style="align-items:center"><span class="spin"></span><span>عم نحمّل…</span></div></div>`;return}
 const v=$("#view"),key=st.route.s+":"+(st.route.cat||"")+":"+(st.route.step??"");
 const changed=key!==lastKey;lastKey=key;const keep=changed?0:v.scrollTop;
 v.innerHTML=`${online?"":`<div class="offline">ما في اتصال بالإنترنت. عم نعرض آخر نسخة محفوظة.</div>`}<div class="${changed&&anim?"enter "+dir:""}" style="min-height:100%">${V[st.route.s]()}</div>`;
 v.scrollTop=keep;renderNav();tick();
 if($("#msgs"))v.scrollTop=1e6;
 const off=$("#offers");if(off&&off.firstElementChild){off.onscroll=()=>{const i=Math.round(Math.abs(off.scrollLeft)/(off.firstElementChild.offsetWidth+12));document.querySelectorAll("#dots i").forEach((d,j)=>d.classList.toggle("on",j===i))}}
 if($("#grid-cv"))drawGrid($("#grid-cv"));if($("#confetti"))confetti($("#confetti"));
}
let carouselPause=0;
setInterval(()=>{const off=$("#offers");if(!off||!off.firstElementChild||Date.now()<carouselPause||matchMedia("(prefers-reduced-motion:reduce)").matches)return;const w=off.firstElementChild.offsetWidth+12,i=Math.round(Math.abs(off.scrollLeft)/w),n=off.children.length;off.scrollTo({left:-(((i+1)%n)*w)})},4200);
document.addEventListener("pointerdown",e=>{if(e.target.closest("#offers"))carouselPause=Date.now()+8000});
window.addEventListener("installable",()=>{if(st.route.s==="home")render()});

/* ---------- events ---------- */
$("#scrim").onclick=closeSheet;
function setQty(key,d){cart[key]=Math.max(0,(cart[key]||0)+d);if(!cart[key])delete cart[key];save();tap()}
const keepNote=()=>{const n=$("#fix-note");if(n)st.fix.note=n.value};

document.addEventListener("click",e=>{
 const t=e.target.closest("button,a");if(!t)return;const d=t.dataset;
 if(d.tabnav){closeSheet();st.stack=[];st.route={s:d.tabnav};dir="";render(true);return}
 if(d.area){st.ob.area=d.area;render();return}
 if(d.setarea){user.area=d.setarea;save();closeSheet();render();return}
 if(d.sos){closeSheet();st.filter="الكل";st.tab="fix";nav({s:"cat",cat:d.sos});return}
 if(d.cat){st.filter="الكل";st.tab="parts";nav({s:"cat",cat:d.cat});return}
 if(d.offer){const o=CATALOG.offers.find(x=>x.id==d.offer);if(o.builder){Object.assign(st.b,{count:4,place:"out",tech:"analog",brand:"Hikvision",res:"2MP",install:true});nav({s:"builder"})}else{st.filter="الكل";st.tab="parts";nav({s:"cat",cat:o.cat})}return}
 if(d.goprod){const p=prodById(d.goprod);st.q="";st.filter=p.g;st.tab="parts";nav({s:"cat",cat:p.cat});return}
 if(d.q){setQty(d.q,+d.d);if(d.insheet){cartCount()?checkoutSheet("parts"):closeSheet()}render();const cc=$("#cc");if(cc&&+d.d>0)cc.classList.add("bump");return}
 if(d.filter){st.filter=d.filter;render();return}
 if(d.tab){keepNote();st.tab=d.tab;render();return}
 if(d.issue){keepNote();st.fix.issue=d.issue;tap();render();return}
 if(d.urg){keepNote();st.fix.urgent=d.urg==="1";render();return}
 if(d.when){keepNote();st.fix.when=d.when;render();return}
 if(d.b){st.b[d.b]=d.v;tap();render();return}
 if(d.cnt){st.b.count=Math.min(16,Math.max(1,st.b.count+ +d.cnt));tap();render();return}
 if(d.via){document.querySelectorAll("#c-via .chip").forEach(c=>c.setAttribute("aria-pressed",c===t));return}
 if(d.chatsel){st.chatId=+d.chatsel;render();return}
 if(d.quick){$("#msg").value=d.quick;$("#f-chat").requestSubmit();return}
 const a=d.act;if(!a)return;
 if(a==="back")back();
 else if(a==="close-sheet")closeSheet();
 else if(a==="install")doInstall();
 else if(a==="ob-back"){st.route={s:"ob",step:st.route.step-1};dir="back";render(true)}
 else if(a==="area")openSheet(`<h2 style="font-size:20px;margin-bottom:14px">غيّر منطقتك</h2><div class="areas">${AREAS().map(x=>`<button class="area" data-setarea="${esc(x)}" aria-pressed="${user.area===x}">${IC.pin}${esc(x)}</button>`).join("")}</div>`);
 else if(a==="cart")checkoutSheet("parts");
 else if(a==="builder")nav({s:"builder"});
 else if(a==="install-sw"){st.b.install=!st.b.install;render()}
 else if(a==="pkg-add"){const pk=buildPackage(),b=st.b,key="pkg:"+[b.count,b.place,b.tech,b.brand,b.res,b.install].join("-");
   pkgs[key]={n:`منظومة ${b.count} كاميرات ${b.tech==="wifi"?"واي فاي":b.tech==="ip"?"IP":"سلكية"} ${b.tech!=="wifi"?b.brand:""} ${b.res}${b.install?" مع التركيب":""}`.replace(/\s+/g," "),p:pk.total,cat:"cam",a:"dvr",lines:pk.lines};
   cart[key]=1;save();tap();toast("انضافت المنظومة للسلة",`${money(pk.total)} · ${pk.lines.length} بنود`,IC.bag);setTimeout(()=>checkoutSheet("parts"),350)}
 else if(a==="sos")openSheet(`<h2 style="font-size:20px;margin-bottom:6px">شو نوع العطل؟</h2><p class="small muted" style="margin-bottom:14px">منعطي الأعطال الطارئة أولوية.</p><div class="issues" style="padding:0">${CATDEF.map(c=>`<button class="issue" data-sos="${c.id}"><span class="ii" style="color:var(--c-${c.id})">${IC[c.id]}</span>${c.name}</button>`).join("")}</div>`),st.fix={issue:null,urgent:true,when:"أقرب وقت",note:"",photos:[]};
 else if(a==="fix-go"){keepNote();checkoutSheet("fix")}
 else if(a==="chat"){st.chatId=+d.id;closeSheet();nav({s:"chat"})}
});

document.addEventListener("input",e=>{
 const id=e.target.id;
 if(id==="ob-name"||id==="ob-phone"){st.ob[id==="ob-name"?"name":"phone"]=e.target.value;const s=st.route.step,o=st.ob;$("#ob-next").disabled=!(s===0?o.name.trim().length>1:o.phone.replace(/\D/g,"").length>=9)}
 if(id==="q"){st.q=e.target.value;const pos=e.target.selectionStart;render();const q=$("#q");q.focus();q.setSelectionRange(pos,pos)}
 if(id==="fix-note")st.fix.note=e.target.value;
});
document.addEventListener("change",e=>{if(e.target.id!=="photos")return;const files=[...e.target.files].slice(0,4-st.fix.photos.length);let left=files.length;
 files.forEach(f=>{const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const c=document.createElement("canvas"),k=Math.min(1,480/Math.max(img.width,img.height));c.width=img.width*k;c.height=img.height*k;c.getContext("2d").drawImage(img,0,0,c.width,c.height);st.fix.photos.push(c.toDataURL("image/jpeg",.6));if(--left===0)render()};img.src=r.result};r.readAsDataURL(f)})});

document.addEventListener("submit",async e=>{e.preventDefault();const f=e.target;
 if(f.id==="f-ob"){const s=st.route.step;if(s<2){st.route={s:"ob",step:s+1};dir="";render(true);setTimeout(()=>document.querySelector(".big-input")?.focus(),300)}else{user={name:st.ob.name.trim(),phone:st.ob.phone.trim(),area:st.ob.area};save();st.stack=[];st.route={s:"home"};render(true);toast(`أهلاً ${first(user.name)}!`,"صار فيك تطلب أي شي من هون",IC.elec)}}
 if(f.id==="f-checkout"){if(st.sending)return;st.sending=true;const btn=$("#c-send"),err=$("#c-err");btn.disabled=true;btn.innerHTML=`<span class="spin"></span> عم نبعت الطلب…`;err.hidden=true;
  user.name=$("#c-name").value.trim()||user.name;user.phone=$("#c-phone").value.trim()||user.phone;save();
  const via=document.querySelector('#c-via [aria-pressed="true"]')?.dataset.via,isFix=f.dataset.kind==="fix";
  const order={name:user.name,phone:user.phone,area:user.area,via};
  if(isFix)Object.assign(order,{kind:"fix",cat:st.route.cat,issue:st.fix.issue,urgent:st.fix.urgent,when:st.fix.when,note:st.fix.note,photos:st.fix.photos});
  else{const l=cartList();Object.assign(order,{kind:"parts",cat:l[0].cat,items:l.flatMap(x=>[{n:x.n,q:x.q,p:x.p}])})}
  try{const r=await api("orders",{method:"POST",body:{token,order}});
    if(!isFix){cart={};pkgs={}}st.fix={issue:null,urgent:false,when:"أقرب وقت",note:"",photos:[]};save();
    await loadOrders(false);closeSheet();st.stack=[];st.route={s:"success",id:r.id};render(true)}
  catch(x){err.textContent=x.status?x.message:"ما قدرنا نبعت الطلب. تأكد من الإنترنت وجرّب مرة تانية.";err.hidden=false;btn.disabled=false;btn.textContent="إرسال الطلب"}
  finally{st.sending=false}}
 if(f.id==="f-chat"){const inp=$("#msg"),v=inp.value.trim();if(!v)return;const o=orders.find(x=>x.id===st.chatId);inp.value="";
  (o.chat=o.chat||[]).push({from:"user",t:v,at:Date.now(),read:0});renderChatOnly();inp.focus();
  try{await api("msg",{method:"POST",body:{token,orderId:o.id,text:v}});loadOrders(true)}catch(x){toast("ما انبعتت الرسالة","تأكد من الإنترنت وجرّب مرة تانية",IC.chat);o.chat.pop();renderChatOnly();inp.value=v}}
});

/* ---------- boot ---------- */
(async()=>{render();await loadCatalog();if(!CATALOG){$("#view").innerHTML=`<div class="empty"><b style="color:var(--fg)">ما قدرنا نفتح التطبيق</b><p class="small">تأكد من الإنترنت وارجع افتحو.</p><button class="btn ink sm" style="width:auto" onclick="location.reload()">جرّب مرة تانية</button></div>`;return}
 if(user&&!AREAS().includes(user.area)&&AREAS().length){/* keep user's area even if list changed */}
 render(true);if(user)await loadOrders(false),render();})();
