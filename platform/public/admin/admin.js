/* Admin app */
let KEY=LS.get("a_key",null);
let CATALOG=null,orders=[],lastMaxId=LS.get("a_maxid",0),online=true;
let st={route:{s:KEY?"inbox":"login"},stack:[],filter:"all",chatId:null,pcat:"cam",editing:null,loginErr:""};
let lastKey="",dir="",audioOK=false;

const unreadOf=o=>(o.chat||[]).filter(m=>m.from==="user"&&!m.read).length;
const unreadAll=()=>orders.reduce((s,o)=>s+unreadOf(o),0);
const newCount=()=>orders.filter(o=>o.status===0).length;

function nav(r){st.stack.push(st.route);dir="";st.route=r;render(true)}
function back(){dir="back";st.route=st.stack.pop()||{s:"inbox"};render(true)}

/* ---------- sync ---------- */
async function adm(path,opt={}){try{const r=await api("admin/"+path,{...opt,admin:KEY});online=true;return r}catch(e){if(e.status===401){logout("الرمز تغيّر أو غلط. ادخل مرة تانية.");throw e}if(!e.status)online=false;throw e}}
function logout(msg){KEY=null;LS.del("a_key");st.route={s:"login"};st.loginErr=msg||"";render(true)}
function beep(){if(!audioOK)return;try{const c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.3,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.35);o.start();o.stop(c.currentTime+.4);setTimeout(()=>{const o2=c.createOscillator();o2.connect(g);o2.frequency.value=1320;g.gain.setValueAtTime(.3,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.35);o2.start();o2.stop(c.currentTime+.4)},180)}catch(e){}}
document.addEventListener("pointerdown",()=>{audioOK=true},{once:true});

async function loadOrders(silent){
  if(!KEY)return;
  try{const list=await adm("orders");
    const maxId=list.reduce((m,o)=>Math.max(m,o.id),0);
    if(silent){
      const fresh=list.filter(o=>o.id>lastMaxId);
      if(fresh.length){toast(`وصلك طلب جديد #${fresh[0].id}`,`${fresh[0].name} · ${cat(fresh[0].cat).name} · ${fresh[0].area}`,IC.bag);beep()}
      else list.forEach(o=>{const old=orders.find(x=>x.id===o.id);if(old&&(o.chat||[]).length>(old.chat||[]).length){const m=o.chat[o.chat.length-1];if(m.from==="user"&&!(st.route.s==="chat"&&st.chatId===o.id)){toast(`رسالة من ${o.name}`,m.t,IC.chat);beep()}}});
    }
    lastMaxId=Math.max(lastMaxId,maxId);LS.set("a_maxid",lastMaxId);
    const changed=JSON.stringify(list)!==JSON.stringify(orders);orders=list;setBadge(newCount()+unreadAll());
    if(changed&&silent){if(st.route.s==="chat")renderChatOnly();else if(!document.querySelector("input:focus,textarea:focus,select:focus")&&!$("#sheet").classList.contains("on"))render();else renderNav()}
  }catch(e){}
}
async function loadCatalog(){try{CATALOG=await api("catalog");online=true}catch(e){online=false}}
async function saveCatalog(msg){try{await adm("catalog",{method:"PUT",body:{catalog:CATALOG}});if(msg)toast(msg,"بيوصل للزبائن فوراً",IC.check.replace('stroke="#fff"','stroke="currentColor"'))}catch(e){toast("ما انحفظ التعديل",e.message,IC.bell)}}
setInterval(()=>{if(document.visibilityState==="visible")loadOrders(true)},6000);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")loadOrders(true)});

/* ---------- views ---------- */
const V={};
V.login=()=>`<div class="ob"><div class="ob-hero"><canvas id="grid-cv"></canvas><span class="mark">${IC.orders}</span><h1>لوحة إدارة المحل</h1><p>الطلبات، المحادثات، المنتجات والعروض، من جوالك.</p></div>
 <form class="ob-card" id="f-login"><h2>رمز الدخول</h2><p class="muted small">الرمز اللي استلمته مع التطبيق.</p>
  <input class="input big-input num" id="key" dir="ltr" autocomplete="current-password" autocapitalize="off" spellcheck="false" placeholder="••••••••">
  <p class="small" style="color:var(--bad)" ${st.loginErr?"":"hidden"}>${esc(st.loginErr)}</p><div style="flex:1"></div>
  <button class="btn ink" id="login-btn">دخول</button></form></div>`;

function orderCard(o){const un=unreadOf(o);return `<div class="card req ${o.status===0?"new":""}">
  <div class="between"><span><b>#${o.id} · ${esc(o.name)}</b><br><span class="small muted">${IC.pin.replace('width="16" height="16"','width="12" height="12" style="display:inline"')} ${esc(o.area)} · ${cat(o.cat).name} · ${ago(o.at)}</span></span><span class="status s${o.status}">${STATUSES[o.status]}</span></div>
  ${o.kind==="fix"?`<p style="font-size:14px"><b>صيانة:</b> ${esc(o.issue)} ${o.urgent?`<span class="status" style="background:var(--bad-bg);color:var(--bad)">مستعجل</span>`:""}</p>${o.when?`<p class="small muted">وقت الزيارة: ${esc(o.when)}</p>`:""}${o.note?`<p class="small muted">"${esc(o.note)}"</p>`:""}${o.photos?.length?`<div class="thumbs">${o.photos.map((u,i)=>`<button data-photo="${o.id}:${i}" aria-label="تكبير الصورة"><img src="${u}" alt="صورة من الزبون"></button>`).join("")}</div>`:""}`
   :`<ul>${(o.items||[]).map(i=>`<li>${esc(i.n)} × ${i.q} <span class="num">(${money(i.p*i.q)})</span></li>`).join("")}</ul><div class="between"><span class="small muted">المجموع التقريبي</span><b class="num">${money(o.total)}</b></div>`}
  ${o.via?`<p class="small muted">بيفضّل التواصل: <b>${esc(o.via)}</b></p>`:""}
  <div class="statusbar">${STATUSES.map((s,i)=>`<button data-setst="${o.id}" data-v="${i}" aria-pressed="${o.status===i}">${s}</button>`).join("")}</div>
  <div class="acts"><a class="btn wa" target="_blank" rel="noopener" href="${waLink(localToWa(o.phone),`مرحبا ${first(o.name)}، بخصوص طلبك رقم ${o.id} من ${CATALOG?.settings.shop||""}`)}" data-contact="${o.id}">${IC.wa}واتساب</a><a class="btn soft" href="tel:${esc(o.phone.replace(/\s/g,""))}" data-contact="${o.id}">${IC.phone}اتصال</a><button class="btn ink" data-act="chat" data-id="${o.id}" style="position:relative">${IC.chat}شات${un?`<span class="badge num">${un}</span>`:""}</button></div>
  <div class="between"><span class="small muted num" dir="ltr">${esc(o.phone)}</span><button class="small muted" data-del="${o.id}" style="text-decoration:underline">حذف</button></div></div>`}

V.inbox=()=>{const day=86400e3,today=orders.filter(o=>Date.now()-o.at<day),val=orders.filter(o=>Date.now()-o.at<30*day).reduce((s,o)=>s+(o.total||0),0);
 const days=[...Array(8)].map((_,i)=>orders.filter(o=>{const a=Date.now()-o.at;return a>=(7-i)*day&&a<(8-i)*day}).length),mx=Math.max(1,...days),pts=days.map((v,i)=>`${(i/7*300).toFixed(0)} ${(34-v/mx*28).toFixed(1)}`);
 const f=st.filter,list=orders.filter(o=>f==="all"||(f==="new"&&o.status===0)||(f==="active"&&o.status>0&&o.status<3)||(f==="done"&&o.status===3)||(f==="fix"&&o.kind==="fix")||(f==="parts"&&o.kind==="parts"));
 return `<div class="adm-head"><div class="between"><div><span class="small" style="opacity:.75">${esc(CATALOG?.settings.shop||"لوحة المحل")}</span><h1 style="font-size:22px">الطلبات الواردة</h1></div><button class="iconbtn" data-act="refresh" style="background:rgba(255,255,255,.1);border-color:transparent;color:inherit" aria-label="تحديث">${IC.bell}${newCount()?`<span class="badge num" style="border-color:var(--ink)">${newCount()}</span>`:""}</button></div>
  <div class="stats"><div class="stat"><strong class="num">${today.length}</strong><span>طلبات اليوم</span></div><div class="stat"><strong class="num">${newCount()}</strong><span>بانتظار تواصل</span></div><div class="stat"><strong class="num">${money(val)}</strong><span>قيمة آخر 30 يوم</span></div></div>
  <svg class="spark" viewBox="0 0 300 40" preserveAspectRatio="none" aria-label="الطلبات بآخر 8 أيام"><path d="M${pts.join(" L")}" fill="none" stroke="var(--amber)" stroke-width="2.5"/><path d="M${pts.join(" L")} L300 40 L0 40Z" fill="var(--amber)" opacity=".15"/><circle cx="297" cy="${pts[7].split(" ")[1]}" r="3.5" fill="var(--amber)"/></svg></div>
 ${installCard()}
 <div class="pad" style="padding-top:14px;padding-bottom:12px"><div class="chips scroll">${[["all","الكل"],["new","جديد"],["active","قيد التنفيذ"],["done","منتهي"],["parts","قطع"],["fix","صيانة"]].map(([k,l])=>`<button class="chip" data-af="${k}" aria-pressed="${f===k}">${l}</button>`).join("")}</div></div>
 ${list.map(orderCard).join("")||`<div class="empty"><span class="ei">${IC.orders}</span><b style="color:var(--fg)">${orders.length?"ما في طلبات بهالفلتر":"ما وصل طلبات لسا"}</b><p class="small">${orders.length?"":"أول ما يبعت زبون طلب بيطلع هون، وبيرن الجوال إذا التطبيق مفتوح."}</p></div>`}<div style="height:10px"></div>`};

V.chats=()=>{const list=orders.filter(o=>(o.chat||[]).some(m=>m.from==="user")).sort((a,b)=>b.updated-a.updated);
 return `<div class="topbar"><h2>المحادثات</h2></div>`+(list.length?list.map(o=>{const m=o.chat[o.chat.length-1],un=unreadOf(o);return `<button class="card offer-row" data-act="chat" data-id="${o.id}" style="width:calc(100% - 36px);text-align:start"><span class="avatar">${esc(o.name.slice(0,1))}</span><span style="flex:1;min-width:0"><b>${esc(o.name)}</b> <span class="small muted">#${o.id}</span><br><span class="small muted" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.from==="admin"?"أنت: ":""}${esc(m.t)}</span></span><span class="stack" style="gap:4px;align-items:flex-end"><span class="small muted">${ago(m.at)}</span>${un?`<span class="badge num" style="position:static">${un}</span>`:""}</span></button>`}).join("")
  :`<div class="empty"><span class="ei">${IC.chat}</span><b style="color:var(--fg)">ما في محادثات لسا</b><p class="small">لما يكتبلك زبون من التطبيق بتطلع رسالتو هون.</p></div>`)};

function chatMsgs(o){return `<div class="msg sys">طلب #${o.id} · ${o.kind==="fix"?esc(o.issue):(o.items||[]).map(i=>`${esc(i.n)} × ${i.q}`).join("، ")}</div>${(o.chat||[]).map(m=>`<div class="msg ${m.from==="admin"?"me":"them"}">${esc(m.t)}<time class="num">${hm(m.at)}</time></div>`).join("")}`}
V.chat=()=>{const o=orders.find(x=>x.id===st.chatId);if(!o)return V.chats();markRead(o);
 return `<div class="chatwrap"><div class="chat-head"><button class="iconbtn" data-act="back" aria-label="رجوع">${IC.back}</button><span class="avatar on">${esc(o.name.slice(0,1))}</span><span style="flex:1"><b>${esc(o.name)}</b><br><span class="small muted">طلب #${o.id} · ${esc(o.area)} · ${STATUSES[o.status]}</span></span>
   <a class="iconbtn" href="tel:${esc(o.phone.replace(/\s/g,""))}" aria-label="اتصال">${IC.phone}</a><a class="iconbtn" style="color:var(--wa)" target="_blank" rel="noopener" href="${waLink(localToWa(o.phone))}" aria-label="واتساب">${IC.wa}</a></div>
  <div class="msgs" id="msgs">${chatMsgs(o)}</div>
  <div class="quick">${["أهلاً، شفنا طلبك 👍","الفني جاييك خلال ساعة","القطعة متوفرة","بدنا صورة للمشكلة","السعر النهائي "].map(q=>`<button data-quick="${esc(q)}">${q}</button>`).join("")}</div>
  <form class="composer" id="f-chat"><input id="msg" placeholder="اكتب رد…" autocomplete="off" enterkeyhint="send"><button aria-label="إرسال">${IC.send}</button></form></div>`};
function renderChatOnly(){const o=orders.find(x=>x.id===st.chatId),m=$("#msgs");if(o&&m){m.innerHTML=chatMsgs(o);$("#view").scrollTop=1e6;markRead(o)}renderNav()}
function markRead(o){if(unreadOf(o)){o.chat.forEach(m=>{if(m.from==="user")m.read=1});adm("read",{method:"POST",body:{orderId:o.id}}).catch(()=>{});setBadge(newCount()+unreadAll());setTimeout(renderNav,0)}}

V.products=()=>{const list=CATALOG.products.filter(p=>p.cat===st.pcat);
 return `<div class="topbar"><h2>المنتجات والأسعار</h2><button class="btn sm" style="width:auto" data-act="new-prod">${IC.plus} منتج</button></div>
 <div class="pad" style="padding-bottom:12px"><div class="chips scroll">${CATDEF.map(c=>`<button class="chip" data-pcat="${c.id}" aria-pressed="${st.pcat===c.id}">${c.name} <span class="num muted">${CATALOG.products.filter(p=>p.cat===c.id).length}</span></button>`).join("")}</div></div>
 <p class="pad small muted" style="margin-bottom:10px">عدّل السعر واضغط حفظ. "مخفي" يعني ما بيطلع للزبائن.</p>
 ${list.map(p=>`<div class="card offer-row" style="${p.off?"opacity:.55":""}"><span class="prod" style="padding:0"><span class="img" style="width:48px;color:var(--c-${p.cat})">${ART[p.a]||ART.psu}</span></span>
  <span style="flex:1;min-width:0"><b style="font-size:14px">${esc(p.n)}</b><br><span class="small muted">${esc(p.b)} · ${esc(p.g)}${p.hot?" · ⭐ مطلوب":""}${p.off?" · مخفي":""}</span></span>
  <button class="btn soft sm num" style="width:auto;min-width:64px" data-edit="${p.id}">${money(p.p)}</button></div>`).join("")||`<div class="empty"><b style="color:var(--fg)">ما في منتجات بهالقسم</b></div>`}<div style="height:10px"></div>`};

V.offers=()=>`<div class="topbar"><h2>العروض</h2><button class="btn sm" style="width:auto" data-act="new-offer">${IC.plus} عرض جديد</button></div>
 <p class="pad small muted" style="margin-bottom:12px">العروض بتطلع بأول صفحة عند كل الزبائن، وبتختفي لحالها لما يخلص وقتها.</p>
 ${CATALOG.offers.map(o=>`<div class="card offer-row" style="${o.ends<Date.now()?"opacity:.55":""}"><span class="sw-mini" style="background:${PALETTE[(o.color||0)%PALETTE.length]};color:#fff;display:grid;place-items:center"><span style="width:34px;height:34px">${ART[o.art]||ART.bullet}</span></span><span style="flex:1;min-width:0"><b>${esc(o.t)}</b><br><span class="small muted">${money(o.p)} · ${o.ends<Date.now()?"انتهى":`<span class="num" data-ends="${o.ends}"></span>`}</span></span><button class="iconbtn" data-deloff="${o.id}" aria-label="حذف العرض" style="color:var(--bad)">✕</button></div>`).join("")||`<div class="empty"><span class="ei">${IC.tag}</span><b style="color:var(--fg)">ما في عروض حالياً</b><p class="small">انشر عرض ليطلع للزبائن بأول صفحة.</p></div>`}`;

V.settings=()=>{const s=CATALOG.settings,base=location.origin;
 return `<div class="topbar"><h2>الإعدادات</h2></div><form class="pad stack" id="f-settings">
  <label class="field"><span>اسم المحل</span><input class="input" id="s-shop" value="${esc(s.shop)}" required></label>
  <label class="field"><span>رقم واتساب المحل (مع رمز الدولة)</span><input class="input num" id="s-wa" dir="ltr" inputmode="tel" value="${esc(s.wa)}" placeholder="9639xxxxxxxx" required></label>
  <label class="field"><span>المناطق (كل منطقة بسطر)</span><textarea class="input" id="s-areas" style="min-height:160px">${esc(s.areas.join("\n"))}</textarea></label>
  <button class="btn ink">حفظ الإعدادات</button></form>
  <div class="pad stack" style="margin-top:22px"><div class="card" style="padding:14px"><b>رابط تطبيق الزبائن</b><p class="small muted" style="margin:4px 0 10px">ابعتو للزبائن عالواتساب أو حطّو بالستاتس.</p><div class="row"><input class="input num small" dir="ltr" readonly value="${base}/app/" id="share-link"><button class="btn sm" style="width:auto" data-act="copy">نسخ</button></div>
   <a class="btn wa sm" style="margin-top:10px" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`اطلب كهرباء، كاميرات، إنذار وأنظمة صوت من ${s.shop} بضغطة 👇\n${base}/app/`)}">${IC.wa} شارك عالواتساب</a></div>
  <button class="btn soft" data-act="logout">تسجيل الخروج</button><div style="height:14px"></div></div>`};

/* ---------- sheets ---------- */
const ARTS=Object.keys(ART);
function prodSheet(p){const n=!p;p=p||{id:"p"+Date.now().toString(36),cat:st.pcat,n:"",b:"",p:0,g:"",a:{elec:"breaker",cam:"bullet",alarm:"motion",sound:"speaker"}[st.pcat],hot:0};
 openSheet(`<form id="f-prod" class="stack" data-id="${p.id}" data-new="${n?1:""}"><h2 style="font-size:20px">${n?"منتج جديد":"تعديل المنتج"}</h2>
  <label class="field"><span>الاسم</span><input class="input" id="p-n" required value="${esc(p.n)}" placeholder="مثلاً: كاميرا خارجية 4MP"></label>
  <div class="row"><label class="field" style="flex:1"><span>السعر $</span><input class="input num" id="p-p" type="number" min="0" step="0.5" required value="${p.p}"></label><label class="field" style="flex:1"><span>الماركة</span><input class="input" id="p-b" value="${esc(p.b)}" placeholder="Hikvision"></label></div>
  <div class="row"><label class="field" style="flex:1"><span>القسم</span><select class="input" id="p-c">${CATDEF.map(c=>`<option value="${c.id}" ${p.cat===c.id?"selected":""}>${c.name}</option>`).join("")}</select></label><label class="field" style="flex:1"><span>المجموعة</span><input class="input" id="p-g" value="${esc(p.g)}" placeholder="مثلاً: واي فاي" list="groups"></label></div>
  <datalist id="groups">${[...new Set(CATALOG.products.map(x=>x.g))].map(g=>`<option value="${esc(g)}">`).join("")}</datalist>
  <div class="field"><span>الرسمة</span><div class="chips" id="p-a">${ARTS.map(k=>`<button type="button" class="chip" data-art="${k}" aria-pressed="${p.a===k}" style="padding:6px"><span style="display:block;width:28px;height:28px">${ART[k]}</span></button>`).join("")}</div></div>
  <div class="toggle"><span><b>مطلوب ⭐</b><br><span class="small muted">بيطلع بقسم "الأكثر طلباً"</span></span><button type="button" class="sw" role="switch" id="p-hot" aria-checked="${!!p.hot}"></button></div>
  <div class="toggle"><span><b>ظاهر للزبائن</b><br><span class="small muted">طفيه إذا خلصت الكمية</span></span><button type="button" class="sw" role="switch" id="p-on" aria-checked="${!p.off}"></button></div>
  <button class="btn ink">حفظ</button>${n?"":`<button type="button" class="btn soft" style="color:var(--bad)" data-delprod="${p.id}">حذف المنتج</button>`}</form>`)}
function offerSheet(){openSheet(`<form id="f-offer" class="stack"><h2 style="font-size:20px">نشر عرض جديد</h2>
 <label class="field"><span>عنوان العرض</span><input class="input" id="of-t" required placeholder="مثلاً: عرض 8 كاميرات Dahua"></label>
 <label class="field"><span>التفاصيل</span><input class="input" id="of-d" placeholder="شو بيتضمن العرض"></label>
 <div class="row"><label class="field" style="flex:1"><span>السعر $</span><input class="input num" id="of-p" type="number" required min="1" placeholder="250"></label><label class="field" style="flex:1"><span>قبل الخصم $</span><input class="input num" id="of-o" type="number" min="0" placeholder="اختياري"></label></div>
 <div class="row"><label class="field" style="flex:1"><span>القسم</span><select class="input" id="of-c">${CATDEF.map(c=>`<option value="${c.id}">${c.name}</option>`).join("")}</select></label><label class="field" style="flex:1"><span>مدة العرض</span><select class="input" id="of-h"><option value="24">يوم</option><option value="72" selected>3 أيام</option><option value="168">أسبوع</option><option value="720">شهر</option></select></label></div>
 <label class="field"><span>الشارة</span><input class="input" id="of-g" value="عرض خاص"></label>
 <button class="btn">نشر العرض</button></form>`)}

/* ---------- render ---------- */
function renderNav(){const nv=$("#nav");if(st.route.s==="login"){nv.hidden=true;return}
 const map={inbox:"inbox",chats:"chats",chat:"chats",products:"products",offers:"offers",settings:"settings"},t=map[st.route.s];
 const gear='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
 nv.hidden=false;nv.innerHTML=[["inbox","الطلبات",IC.orders,newCount()],["chats","المحادثات",IC.chat,unreadAll()],["products","المنتجات",IC.bag],["offers","العروض",IC.tag],["settings","الإعدادات",gear]].map(([k,l,i,b])=>`<button data-tabnav="${k}" ${t===k?'aria-current="page"':""}>${i}${l}${b?`<span class="badge num">${b}</span>`:""}</button>`).join("")}
function render(anim){
 const v=$("#view");
 if(st.route.s!=="login"&&!CATALOG){v.innerHTML=`<div class="boot"><div class="stack" style="align-items:center"><span class="spin"></span><span>عم نحمّل…</span></div></div>`;renderNav();return}
 const key=st.route.s+":"+(st.chatId||""),changed=key!==lastKey;lastKey=key;const keep=changed?0:v.scrollTop;
 v.innerHTML=`${online?"":`<div class="offline">ما في اتصال بالإنترنت.</div>`}<div class="${changed&&anim?"enter "+dir:""}" style="min-height:100%">${V[st.route.s]()}</div>`;
 v.scrollTop=keep;renderNav();tick();if($("#msgs"))v.scrollTop=1e6;if($("#grid-cv"))drawGrid($("#grid-cv"));
}
window.addEventListener("installable",()=>{if(st.route.s==="inbox")render()});

/* ---------- events ---------- */
$("#scrim").onclick=closeSheet;
document.addEventListener("click",async e=>{
 const t=e.target.closest("button,a");if(!t)return;const d=t.dataset;
 if(d.tabnav){closeSheet();st.stack=[];st.route={s:d.tabnav};dir="";render(true);return}
 if(d.af){st.filter=d.af;render();return}
 if(d.pcat){st.pcat=d.pcat;render();return}
 if(d.setst){const o=orders.find(x=>x.id===+d.setst),v=+d.v;if(o.status===v)return;o.status=v;render();tap();
   try{await adm("status",{method:"POST",body:{orderId:o.id,status:v}});toast(`طلب #${o.id}`,"صار: "+STATUSES[v]+" · بيوصل إشعار للزبون",IC.check.replace('stroke="#fff"','stroke="currentColor"'))}catch(x){toast("ما انحفظ التغيير",x.message);loadOrders(false).then(render)}return}
 if(d.contact){const o=orders.find(x=>x.id===+d.contact);if(o&&o.status===0){o.status=1;adm("status",{method:"POST",body:{orderId:o.id,status:1}}).catch(()=>{});setTimeout(render,300)}return}
 if(d.del){if(t.dataset.confirm){await adm("delete",{method:"POST",body:{orderId:+d.del}}).catch(()=>{});orders=orders.filter(o=>o.id!==+d.del);render();toast("انحذف الطلب","",IC.orders)}else{t.dataset.confirm=1;t.textContent="اضغط مرة تانية للتأكيد";t.style.color="var(--bad)";setTimeout(()=>{if(t.isConnected){delete t.dataset.confirm;t.textContent="حذف";t.style.color=""}},3000)}return}
 if(d.photo){const [id,i]=d.photo.split(":"),o=orders.find(x=>x.id===+id);openSheet(`<img src="${o.photos[+i]}" alt="صورة من الزبون" style="width:100%;border-radius:16px">`);return}
 if(d.edit){prodSheet(CATALOG.products.find(p=>p.id===d.edit));return}
 if(d.art){document.querySelectorAll("#p-a .chip").forEach(c=>c.setAttribute("aria-pressed",c===t));return}
 if(t.classList.contains("sw")&&t.closest("#f-prod")){t.setAttribute("aria-checked",t.getAttribute("aria-checked")!=="true");return}
 if(d.delprod){if(!t.dataset.confirm){t.dataset.confirm=1;t.textContent="اضغط مرة تانية للتأكيد";return}CATALOG.products=CATALOG.products.filter(p=>p.id!==d.delprod);closeSheet();render();saveCatalog("انحذف المنتج");return}
 if(d.deloff){CATALOG.offers=CATALOG.offers.filter(o=>o.id!=d.deloff);render();saveCatalog("انحذف العرض");return}
 if(d.quick){const m=$("#msg");m.value=d.quick;m.focus();if(!d.quick.endsWith(" "))$("#f-chat").requestSubmit();return}
 const a=d.act;if(!a)return;
 if(a==="back")back();
 else if(a==="close-sheet")closeSheet();
 else if(a==="install")doInstall();
 else if(a==="refresh"){await loadOrders(false);render();toast("تم التحديث",`${orders.length} طلب`,IC.orders)}
 else if(a==="chat"){st.chatId=+d.id;nav({s:"chat"})}
 else if(a==="new-prod")prodSheet(null);
 else if(a==="new-offer")offerSheet();
 else if(a==="copy"){const i=$("#share-link");try{await navigator.clipboard.writeText(i.value);toast("انسخ الرابط","",IC.check.replace('stroke="#fff"','stroke="currentColor"'))}catch(x){i.select()}}
 else if(a==="logout")logout();
});

document.addEventListener("submit",async e=>{e.preventDefault();const f=e.target;
 if(f.id==="f-login"){const k=$("#key").value.trim(),b=$("#login-btn");if(!k)return;b.disabled=true;b.innerHTML=`<span class="spin"></span>`;
  try{await api("admin/check",{admin:k});KEY=k;LS.set("a_key",k);st.loginErr="";await Promise.all([loadCatalog(),loadOrders(false)]);lastMaxId=orders.reduce((m,o)=>Math.max(m,o.id),0);LS.set("a_maxid",lastMaxId);st.route={s:"inbox"};render(true)}
  catch(x){st.loginErr=x.status===401?"الرمز غلط. تأكد منو وجرّب مرة تانية.":"ما في اتصال. تأكد من الإنترنت.";render()}return}
 if(f.id==="f-chat"){const inp=$("#msg"),v=inp.value.trim();if(!v)return;const o=orders.find(x=>x.id===st.chatId);inp.value="";
  o.chat.push({from:"admin",t:v,at:Date.now(),read:0});renderChatOnly();inp.focus();
  try{await adm("msg",{method:"POST",body:{orderId:o.id,text:v}})}catch(x){toast("ما انبعتت الرسالة",x.message,IC.chat);o.chat.pop();renderChatOnly();inp.value=v}return}
 if(f.id==="f-prod"){const id=f.dataset.id,p={id,n:$("#p-n").value.trim(),p:+$("#p-p").value||0,b:$("#p-b").value.trim(),cat:$("#p-c").value,g:$("#p-g").value.trim()||"عام",a:document.querySelector('#p-a [aria-pressed="true"]')?.dataset.art||"psu",hot:$("#p-hot").getAttribute("aria-checked")==="true"?1:0,off:$("#p-on").getAttribute("aria-checked")==="true"?0:1};
  const i=CATALOG.products.findIndex(x=>x.id===id);if(i>=0)CATALOG.products[i]=p;else CATALOG.products.push(p);st.pcat=p.cat;closeSheet();render();saveCatalog(f.dataset.new?"انضاف المنتج":"انحفظ المنتج");return}
 if(f.id==="f-offer"){const p=+$("#of-p").value,old=+$("#of-o").value||0,c=$("#of-c").value;
  CATALOG.offers.unshift({id:Date.now(),t:$("#of-t").value.trim(),d:$("#of-d").value.trim(),p,old:old>p?old:0,tag:$("#of-g").value.trim()||"عرض",cat:c,art:{elec:"solar",cam:"dome",alarm:"motion",sound:"speaker"}[c],ends:Date.now()+ +$("#of-h").value*3600e3,color:(CATALOG.offers.length+3)%PALETTE.length});
  closeSheet();render();saveCatalog("انتشر العرض");return}
 if(f.id==="f-settings"){const areas=$("#s-areas").value.split("\n").map(x=>x.trim()).filter(Boolean);const wa=$("#s-wa").value.replace(/\D/g,"");
  if(wa.length<9){toast("رقم الواتساب ناقص","اكتبو مع رمز الدولة، مثلاً 9639…",IC.wa);return}
  CATALOG.settings={shop:$("#s-shop").value.trim(),wa,areas:areas.length?areas:CATALOG.settings.areas};render();saveCatalog("انحفظت الإعدادات")}
});

/* ---------- boot ---------- */
(async()=>{render();if(KEY){await Promise.all([loadCatalog(),loadOrders(false)]);if(!lastMaxId){lastMaxId=orders.reduce((m,o)=>Math.max(m,o.id),0);LS.set("a_maxid",lastMaxId)}}render(true)})();
