// API for the shop platform: catalog, customer orders and chat, and the admin side.
// Storage: Cloudflare D1 (binding DB). Admin calls need header x-admin-key == env.ADMIN_KEY.

const PRODUCTS = [{"id":"elec1","cat":"elec","n":"قاطع كهربائي 32A","b":"Schneider","p":6,"g":"قواطع","a":"breaker","hot":0},{"id":"elec2","cat":"elec","n":"كبل نحاس 2.5 مم · 100م","b":"محلي","p":38,"g":"كبلات","a":"wire","hot":0},{"id":"elec3","cat":"elec","n":"إنفرتر هايبرد 3 كيلو","b":"Growatt","p":310,"g":"طاقة","a":"inverter","hot":1},{"id":"elec4","cat":"elec","n":"بطارية ليثيوم 100Ah","b":"Felicity","p":420,"g":"طاقة","a":"battery","hot":0},{"id":"elec5","cat":"elec","n":"لوح شمسي 550 واط","b":"Jinko","p":95,"g":"طاقة","a":"solar","hot":0},{"id":"elec6","cat":"elec","n":"لوحة توزيع 12 خط","b":"Hager","p":28,"g":"قواطع","a":"panel","hot":0},{"id":"cam1","cat":"cam","n":"كاميرا خارجية 2MP","b":"Hikvision","p":22,"g":"Hikvision","a":"bullet","hot":1},{"id":"cam2","cat":"cam","n":"كاميرا داخلية قبة 2MP","b":"Hikvision","p":20,"g":"Hikvision","a":"dome","hot":0},{"id":"cam3","cat":"cam","n":"كاميرا خارجية 2MP","b":"Dahua","p":19,"g":"Dahua","a":"bullet","hot":0},{"id":"cam4","cat":"cam","n":"كاميرا قبة 4MP","b":"Dahua","p":31,"g":"Dahua","a":"dome","hot":0},{"id":"cam5","cat":"cam","n":"كاميرا واي فاي متحركة","b":"Imou","p":34,"g":"واي فاي","a":"wifi","hot":1},{"id":"cam6","cat":"cam","n":"كاميرا واي فاي خارجية","b":"Ezviz","p":42,"g":"واي فاي","a":"wifi","hot":0},{"id":"cam7","cat":"cam","n":"كاميرا IP 4MP PoE","b":"Hikvision","p":48,"g":"IP","a":"ip","hot":0},{"id":"cam8","cat":"cam","n":"كاميرا IP 4MP PoE","b":"Dahua","p":44,"g":"IP","a":"ip","hot":0},{"id":"cam9","cat":"cam","n":"جهاز DVR 4 قنوات","b":"Hikvision","p":45,"g":"أجهزة تسجيل","a":"dvr","hot":0},{"id":"cam10","cat":"cam","n":"جهاز NVR 8 قنوات","b":"Dahua","p":78,"g":"أجهزة تسجيل","a":"dvr","hot":0},{"id":"cam11","cat":"cam","n":"هارد مراقبة 1TB","b":"WD Purple","p":42,"g":"أجهزة تسجيل","a":"hdd","hot":0},{"id":"cam12","cat":"cam","n":"كبل كاميرات · 100م","b":"محلي","p":18,"g":"توصيلات","a":"cable","hot":0},{"id":"cam13","cat":"cam","n":"باور سبلاي 4 مخارج","b":"محلي","p":9,"g":"توصيلات","a":"psu","hot":0},{"id":"cam14","cat":"cam","n":"رؤوس BNC · 10 قطع","b":"محلي","p":3,"g":"توصيلات","a":"bnc","hot":0},{"id":"alarm1","cat":"alarm","n":"لوحة إنذار سرقة لاسلكية","b":"Ajax","p":120,"g":"سرقة","a":"panel","hot":1},{"id":"alarm2","cat":"alarm","n":"حساس حركة لاسلكي","b":"Ajax","p":28,"g":"سرقة","a":"motion","hot":0},{"id":"alarm3","cat":"alarm","n":"حساس باب وشباك","b":"Ajax","p":18,"g":"سرقة","a":"door","hot":0},{"id":"alarm4","cat":"alarm","n":"كاشف دخان","b":"محلي","p":12,"g":"حريق","a":"smoke","hot":0},{"id":"alarm5","cat":"alarm","n":"لوحة إنذار حريق 4 مناطق","b":"محلي","p":95,"g":"حريق","a":"panel","hot":0},{"id":"alarm6","cat":"alarm","n":"صفارة إنذار خارجية","b":"محلي","p":15,"g":"صفارات","a":"siren","hot":0},{"id":"sound1","cat":"sound","n":"سماعة سقف 6 إنش","b":"محلي","p":11,"g":"سماعات","a":"speaker","hot":0},{"id":"sound2","cat":"sound","n":"مكبّر صوت 120 واط","b":"محلي","p":85,"g":"مكبرات","a":"amp","hot":1},{"id":"sound3","cat":"sound","n":"مايك لاسلكي مزدوج","b":"Shure","p":60,"g":"مايكات","a":"mic","hot":0},{"id":"sound4","cat":"sound","n":"بوق خارجي 50 واط","b":"محلي","p":24,"g":"سماعات","a":"horn","hot":0}];
const DEFAULT_OFFERS = [
  { id: 1, t: "منظومة 4 كاميرات كاملة", d: "4 كاميرات Hikvision مع DVR وهارد 1TB وتركيب", p: 175, old: 210, tag: "عرض الأسبوع", cat: "cam", art: "bullet", hrs: 168, color: 0, builder: 1 },
  { id: 2, t: "طاقة شمسية 3 كيلو", d: "إنفرتر هايبرد وبطارية ليثيوم و4 ألواح مع التركيب", p: 990, old: 1120, tag: "جديد", cat: "elec", art: "solar", hrs: 240, color: 1 },
  { id: 3, t: "إنذار سرقة للبيت", d: "لوحة Ajax و3 حساسات حركة وصفارة", p: 185, old: 206, tag: "خصم 10%", cat: "alarm", art: "siren", hrs: 120, color: 2 }
];
const DEFAULT_SETTINGS = {
  shop: "أمان للكهرباء والكاميرات",
  wa: "963900000000",
  areas: ["حلب", "إدلب", "سرمدا", "الدانا", "اعزاز", "الباب", "عفرين", "جرابلس", "أريحا", "معرة مصرين"]
};
const ID_OFFSET = 1000;

const J = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
const clip = (v, n) => String(v ?? "").slice(0, n);

let ready = false;
async function init(db) {
  if (ready) return;
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT NOT NULL, status INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)"),
    db.prepare("CREATE INDEX IF NOT EXISTS orders_token ON orders(token)"),
    db.prepare("CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, sender TEXT NOT NULL, text TEXT NOT NULL, at INTEGER NOT NULL, read INTEGER NOT NULL DEFAULT 0)"),
    db.prepare("CREATE INDEX IF NOT EXISTS messages_order ON messages(order_id)"),
    db.prepare("CREATE TABLE IF NOT EXISTS kv(k TEXT PRIMARY KEY, v TEXT NOT NULL)")
  ]);
  ready = true;
}

async function getCatalog(db) {
  const row = await db.prepare("SELECT v FROM kv WHERE k='catalog'").first();
  if (row) return JSON.parse(row.v);
  const now = Date.now();
  const cat = {
    settings: DEFAULT_SETTINGS,
    products: PRODUCTS,
    offers: DEFAULT_OFFERS.map(o => ({ ...o, ends: now + o.hrs * 3600e3 })),
    v: now
  };
  await db.prepare("INSERT OR IGNORE INTO kv(k,v) VALUES('catalog',?)").bind(JSON.stringify(cat)).run();
  return cat;
}

async function withMessages(db, rows) {
  if (!rows.length) return [];
  const ids = rows.map(r => r.id);
  const msgs = (await db.prepare(`SELECT * FROM messages WHERE order_id IN (${ids.map(() => "?").join(",")}) ORDER BY id`).bind(...ids).all()).results;
  return rows.map(r => ({
    ...JSON.parse(r.data), id: r.id + ID_OFFSET, status: r.status, at: r.created_at, updated: r.updated_at,
    chat: msgs.filter(m => m.order_id === r.id).map(m => ({ id: m.id, from: m.sender, t: m.text, at: m.at, read: m.read }))
  }));
}

function cleanOrder(o) {
  const items = Array.isArray(o.items) ? o.items.slice(0, 60).map(i => ({ n: clip(i.n, 200), q: Math.max(1, Math.min(999, +i.q || 1)), p: Math.max(0, +i.p || 0) })) : [];
  const photos = Array.isArray(o.photos) ? o.photos.filter(p => typeof p === "string" && p.startsWith("data:image/") && p.length < 60000).slice(0, 4) : [];
  return {
    name: clip(o.name, 80), phone: clip(o.phone, 30), area: clip(o.area, 60), via: clip(o.via, 30),
    kind: o.kind === "fix" ? "fix" : "parts", cat: clip(o.cat, 10),
    items, total: items.reduce((s, i) => s + i.p * i.q, 0),
    issue: clip(o.issue, 200), urgent: !!o.urgent, when: clip(o.when, 40), note: clip(o.note, 1000), photos
  };
}

const firstName = n => { const w = String(n).trim().split(/\s+/); return /^(أبو|ابو|أم|ام)$/.test(w[0]) && w[1] ? w[0] + " " + w[1] : w[0]; };

export async function onRequest({ request, env, params }) {
  const db = env.DB;
  const path = [].concat(params.path || []).join("/");
  const m = request.method;
  const url = new URL(request.url);
  try {
    await init(db);
    const body = (m === "POST" || m === "PUT") ? await request.json().catch(() => ({})) : {};
    const now = Date.now();

    // ---------- public / customer ----------
    if (path === "catalog" && m === "GET") return J(await getCatalog(db));

    if (path === "orders" && m === "POST") {
      const token = clip(body.token, 64);
      if (token.length < 16) return J({ error: "bad token" }, 400);
      const o = cleanOrder(body.order || {});
      if (!o.name || !o.phone) return J({ error: "الاسم والرقم مطلوبين" }, 400);
      if (o.kind === "parts" && !o.items.length) return J({ error: "السلة فاضية" }, 400);
      if (o.kind === "fix" && !o.issue) return J({ error: "اختار نوع المشكلة" }, 400);
      const r = await db.prepare("INSERT INTO orders(token,status,data,created_at,updated_at) VALUES(?,0,?,?,?) RETURNING id").bind(token, JSON.stringify(o), now, now).first();
      const cat = await getCatalog(db);
      await db.prepare("INSERT INTO messages(order_id,sender,text,at,read) VALUES(?,?,?,?,0)")
        .bind(r.id, "admin", `أهلاً ${firstName(o.name)}، وصلنا طلبك رقم ${r.id + ID_OFFSET} 👍 رح نتواصل معك ${o.urgent ? "خلال ساعة" : "بأقرب وقت"}. فيك تكتبلنا هون أي سؤال. — ${cat.settings.shop}`, now + 1).run();
      return J({ id: r.id + ID_OFFSET });
    }

    if (path === "my" && m === "GET") {
      const token = clip(url.searchParams.get("token"), 64);
      if (token.length < 16) return J([]);
      const rows = (await db.prepare("SELECT * FROM orders WHERE token=? ORDER BY id DESC LIMIT 50").bind(token).all()).results;
      return J(await withMessages(db, rows));
    }

    if ((path === "msg" || path === "read") && m === "POST") {
      const id = (+body.orderId || 0) - ID_OFFSET;
      const own = await db.prepare("SELECT id FROM orders WHERE id=? AND token=?").bind(id, clip(body.token, 64)).first();
      if (!own) return J({ error: "not found" }, 404);
      if (path === "read") { await db.prepare("UPDATE messages SET read=1 WHERE order_id=? AND sender='admin'").bind(id).run(); return J({ ok: 1 }); }
      const t = clip(body.text, 2000).trim();
      if (!t) return J({ error: "empty" }, 400);
      await db.prepare("INSERT INTO messages(order_id,sender,text,at,read) VALUES(?,?,?,?,0)").bind(id, "user", t, now).run();
      await db.prepare("UPDATE orders SET updated_at=? WHERE id=?").bind(now, id).run();
      return J({ ok: 1 });
    }

    // ---------- admin ----------
    if (path.startsWith("admin/")) {
      const key = request.headers.get("x-admin-key") || "";
      if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return J({ error: "unauthorized" }, 401);
      const sub = path.slice(6);
      if (sub === "check") return J({ ok: 1 });
      if (sub === "orders" && m === "GET") {
        const rows = (await db.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 300").all()).results;
        return J(await withMessages(db, rows));
      }
      if (sub === "status" && m === "POST") {
        const st = Math.max(0, Math.min(3, +body.status || 0));
        await db.prepare("UPDATE orders SET status=?, updated_at=? WHERE id=?").bind(st, now, (+body.orderId || 0) - ID_OFFSET).run();
        return J({ ok: 1 });
      }
      if (sub === "msg" && m === "POST") {
        const t = clip(body.text, 2000).trim(), id = (+body.orderId || 0) - ID_OFFSET;
        if (!t) return J({ error: "empty" }, 400);
        await db.prepare("INSERT INTO messages(order_id,sender,text,at,read) VALUES(?,?,?,?,0)").bind(id, "admin", t, now).run();
        await db.prepare("UPDATE orders SET updated_at=? WHERE id=?").bind(now, id).run();
        return J({ ok: 1 });
      }
      if (sub === "read" && m === "POST") {
        await db.prepare("UPDATE messages SET read=1 WHERE order_id=? AND sender='user'").bind((+body.orderId || 0) - ID_OFFSET).run();
        return J({ ok: 1 });
      }
      if (sub === "delete" && m === "POST") {
        const id = (+body.orderId || 0) - ID_OFFSET;
        await db.batch([db.prepare("DELETE FROM messages WHERE order_id=?").bind(id), db.prepare("DELETE FROM orders WHERE id=?").bind(id)]);
        return J({ ok: 1 });
      }
      if (sub === "catalog" && m === "PUT") {
        const c = body.catalog;
        if (!c || !Array.isArray(c.products) || !Array.isArray(c.offers) || !c.settings) return J({ error: "bad catalog" }, 400);
        const s = JSON.stringify({ ...c, v: now });
        if (s.length > 500000) return J({ error: "too large" }, 400);
        await db.prepare("INSERT INTO kv(k,v) VALUES('catalog',?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").bind(s).run();
        return J({ ok: 1, v: now });
      }
    }
    return J({ error: "not found" }, 404);
  } catch (e) {
    return J({ error: String(e && e.message || e) }, 500);
  }
}
