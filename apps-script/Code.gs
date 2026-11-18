/** DÁRKOVNÍK – Google Apps Script backend. Deployment: Execute as me. */
const HEADERS = {
  Users: [
    "id",
    "email",
    "name",
    "birthday",
    "createdAt",
    "googleSub",
    "avatar",
  ],
  Groups: [
    "id",
    "name",
    "ownerId",
    "createdAt",
    "description",
    "image",
    "birthdaysEnabled",
    "christmasEnabled",
    "easterEnabled",
    "namedaysEnabled",
    "holidaysSelected",
  ],
  Members: ["id", "groupId", "userId", "role", "createdAt"],
  Invites: [
    "id",
    "groupId",
    "email",
    "invitedBy",
    "role",
    "expiresAt",
    "acceptedAt",
  ],
  Gifts: [
    "id",
    "ownerId",
    "name",
    "url",
    "image",
    "price",
    "quantity",
    "receivedQuantity",
    "notes",
    "createdAt",
  ],
  Shares: ["id", "giftId", "groupId"],
  Reservations: [
    "id",
    "giftId",
    "groupId",
    "buyerId",
    "quantity",
    "status",
    "createdAt",
  ],
  Events: [
    "id",
    "groupId",
    "name",
    "date",
    "repeatYearly",
    "userId",
    "createdBy",
  ],
  Notices: ["id", "key", "sentAt"],
  NameDays: ["date", "names", "isHoliday"],
  Alerts: [
    "id",
    "userId",
    "giftId",
    "message",
    "createdAt",
    "readAt",
    "emailStatus",
  ],
  Sessions: ["id", "userId", "tokenHash", "expiresAt", "createdAt"],
};
const ROLE = ["member", "admin"];
const ID_RE = /^[a-zA-Z0-9_-]{8,100}$/;
function setup() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty("SHEET_ID");
  if (!id) {
    const ss = SpreadsheetApp.create("Dárkovník – data");
    id = ss.getId();
    props.setProperty("SHEET_ID", id);
  }
  const ss = SpreadsheetApp.openById(id);
  Object.entries(HEADERS).forEach(([name, head]) => {
    let s = ss.getSheetByName(name);
    if (!s) s = ss.insertSheet(name);
    if (s.getLastRow() === 0) {
      s.appendRow(head);
      s.setFrozenRows(1);
    } else {
      const old = s.getRange(1, 1, 1, s.getLastColumn()).getDisplayValues()[0];
      head.forEach((h, i) => {
        if (old[i] && old[i] !== h)
          throw Error(
            "Nesouhlasí sloupec " + name + " / " + (i + 1) + ": " + old[i],
          );
        if (!old[i]) s.getRange(1, i + 1).setValue(h);
      });
    }
  });
  // Šablona všech dnů roku. Existující uživatelská data a jména se nikdy nepřepisují.
  const namedays = ss.getSheetByName("NameDays");
  if (namedays.getLastRow() === 1) {
    const dates = [];
    for (
      let d = new Date(Date.UTC(2024, 0, 1));
      d.getUTCFullYear() === 2024;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      dates.push([Utilities.formatDate(d, "UTC", "MM-dd"), "", "FALSE"]);
    }
    namedays.getRange(2, 1, dates.length, 3).setValues(dates);
    namedays.setFrozenRows(1);
  }
  if (!props.getProperty("GOOGLE_CLIENT_ID"))
    Logger.log("Doplňte GOOGLE_CLIENT_ID v Script Properties.");
  Logger.log("Datový sešit: " + ss.getUrl());
  Logger.log("HOTOVO – nasaďte webovou aplikaci.");
}
/** Spusťte jednou ručně v editoru Apps Scriptu po autorizaci.
 * Pouze správa triggerů tohoto projektu; existující cizí triggery nemaže.
 */
function setupTriggers() {
  const desired = [
    ["sendQueuedAlerts", 10],
    ["sendReminders", 60],
  ];
  const existing = ScriptApp.getProjectTriggers();
  for (const [handler, minutes] of desired) {
    if (existing.some((t) => t.getHandlerFunction() === handler)) continue;
    if (minutes === 60)
      ScriptApp.newTrigger(handler).timeBased().everyHours(1).create();
    else
      ScriptApp.newTrigger(handler).timeBased().everyMinutes(minutes).create();
  }
  Logger.log("Triggery připraveny: " + desired.map((x) => x[0]).join(", "));
}
function doGet() {
  const t = HtmlService.createTemplateFromFile("Bridge");
  const origin =
    PropertiesService.getScriptProperties().getProperty("FRONTEND_ORIGIN");
  require_(
    origin && /^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(origin),
    "Nastavte FRONTEND_ORIGIN na přesný původ webu (bez cesty).",
  );
  t.allowedOrigin = origin;
  return t
    .evaluate()
    .setTitle("Dárkovník API")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
let currentSpreadsheet_ = null;
let currentSpreadsheetId_ = "";
function sheet_(name) {
  const id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  if (!id) throw Error("Nejprve spusťte setup().");
  if (!currentSpreadsheet_ || currentSpreadsheetId_ !== id) {
    currentSpreadsheet_ = SpreadsheetApp.openById(id);
    currentSpreadsheetId_ = id;
  }
  const s = currentSpreadsheet_.getSheetByName(name);
  if (!s) throw Error("Chybí list " + name);
  return s;
}
let memoRecords_ = {};
function records_(name) {
  if (memoRecords_[name]) return memoRecords_[name];
  const s = sheet_(name),
    v = s.getDataRange().getDisplayValues();
  const head = HEADERS[name];
  return (memoRecords_[name] = v
    .slice(1)
    .map((r, i) =>
      Object.fromEntries([
        ...head.map((h, j) => [h, r[j] || ""]),
        ["_row", i + 2],
      ]),
    ));
}
function add_(name, obj) {
  const v = HEADERS[name].map((k) =>
    obj[k] === undefined ? "" : String(obj[k]),
  );
  sheet_(name).appendRow(v);
  delete memoRecords_[name];
  return obj;
}
function update_(name, r, patch) {
  const s = sheet_(name),
    v = { ...r, ...patch };
  s.getRange(r._row, 1, 1, HEADERS[name].length).setValues([
    HEADERS[name].map((k) => (v[k] === undefined ? "" : String(v[k]))),
  ]);
  delete memoRecords_[name];
  return v;
}
function remove_(name, r) {
  sheet_(name).deleteRow(r._row);
  delete memoRecords_[name];
}
function uid_() {
  return Utilities.getUuid();
}
function now_() {
  return new Date().toISOString();
}
function require_(ok, msg = "Nemáte oprávnění.") {
  if (!ok) throw Error(msg);
}
function str_(v, max = 250) {
  return String(v || "")
    .trim()
    .slice(0, max);
}
function email_(e) {
  e = str_(e, 254).toLowerCase();
  require_(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e), "Neplatný e-mail.");
  return e;
}
function int_(v, min, max) {
  const n = Number(v);
  require_(Number.isInteger(n) && n >= min && n <= max, "Neplatné množství.");
  return n;
}
function url_(v) {
  const u = str_(v, 1200);
  if (!u) return "";
  require_(
    /^https:\/\/[a-z0-9][a-z0-9.-]+(?::443)?(?:[/?#]|$)/i.test(u),
    "Použijte veřejnou HTTPS adresu.",
  );
  return u;
}
function image_(v) {
  const x = String(v || "").trim();
  if (!x) return "";
  if (/^data:image\/(?:jpeg|webp|png);base64,[a-z0-9+/=]+$/i.test(x)) {
    require_(x.length <= 35000, "Obrázek je moc velký. Vyberte menší.");
    return x;
  }
  return url_(x);
}
function withLock_(fn) {
  const l = LockService.getScriptLock();
  require_(
    l.tryLock(20000),
    "Aplikace je právě zaneprázdněná. Zkuste to znovu.",
  );
  try {
    return fn();
  } finally {
    l.releaseLock();
  }
}
function clean_(r) {
  if (!r) return null;
  const { _row, ...rest } = r;
  return rest;
}
/** Google ID token musí být ověřen proti Google (signature, aud, iss, exp a email_verified).
 * tokeninfo ověřuje JWT na straně Google. Krátká cache šetří kvóty, platnost cache
 * však nikdy nepřekročí platnost samotného tokenu.
 */
function identity_(token) {
  require_(
    typeof token === "string" && token.length > 100 && token.length < 6000,
    "Nejste přihlášení.",
  );
  const clientId =
    PropertiesService.getScriptProperties().getProperty("GOOGLE_CLIENT_ID");
  require_(clientId, "Chybí GOOGLE_CLIENT_ID v nastavení Apps Script.");
  const cache = CacheService.getScriptCache();
  const key = Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token),
  );
  let data;
  const cached = cache.get(key);
  if (cached) data = JSON.parse(cached);
  else {
    const r = UrlFetchApp.fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" +
        encodeURIComponent(token),
      { muteHttpExceptions: true },
    );
    require_(
      r.getResponseCode() === 200,
      "Google přihlášení vypršelo. Přihlaste se znovu.",
    );
    data = JSON.parse(r.getContentText());
  }
  require_(data.aud === clientId, "Neplatné OAuth Client ID.");
  require_(
    data.iss === "accounts.google.com" ||
      data.iss === "https://accounts.google.com",
    "Neplatný vydavatel tokenu.",
  );
  require_(Number(data.exp) * 1000 > Date.now(), "Přihlášení vypršelo.");
  require_(
    data.email_verified === true || data.email_verified === "true",
    "E-mail účtu není ověřený.",
  );
  require_(data.sub && data.email, "Chybí ověřená identita.");
  if (!cached)
    cache.put(
      key,
      JSON.stringify(data),
      Math.max(
        1,
        Math.min(90, Math.floor(Number(data.exp) - Date.now() / 1000)),
      ),
    );
  return data;
}
/** Dlouhodobá relace: prohlížeč drží pouze náhodný opaque token, Sheets jen SHA-256 hash.
 * Google ID token se používá výhradně při prvním přihlášení / novém přihlášení.
 * Platnost je pevně 30 dní; žádné OAuth credentials se do localStorage neukládají.
 */
const SESSION_DAYS = 30;
function sessionHash_(token) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token),
  );
}
function user_(token) {
  require_(
    typeof token === "string" && /^ds_[0-9a-f-]{36}_[0-9a-f-]{36}$/.test(token),
    "Neplatná relace. Přihlaste se znovu.",
  );
  const hash = sessionHash_(token);
  const session = records_("Sessions").find((s) => s.tokenHash === hash);
  require_(
    session && Date.parse(session.expiresAt) > Date.now(),
    "Relace vypršela. Přihlaste se znovu.",
  );
  const user = records_("Users").find((u) => u.id === session.userId);
  require_(user, "Uživatelský účet není dostupný.");
  return user;
}
function signInWithGoogle(token) {
  return withLock_(() => {
    const identity = identity_(token),
      email = email_(identity.email);
    let u = records_("Users").find((x) => x.googleSub === identity.sub);
    if (!u) {
      const conflict = records_("Users").find(
        (x) => x.email === email && x.googleSub && x.googleSub !== identity.sub,
      );
      require_(
        !conflict,
        "Tento e-mail je již propojený s jiným Google účtem.",
      );
      u = records_("Users").find((x) => x.email === email && !x.googleSub);
      if (u) u = update_("Users", u, { googleSub: identity.sub });
      else
        u = add_("Users", {
          id: uid_(),
          email,
          name: str_(identity.name, 80) || email.split("@")[0],
          birthday: "",
          googleSub: identity.sub,
          createdAt: now_(),
        });
    }
    const invitations = records_("Invites").filter(
      (x) =>
        x.email === email &&
        !x.acceptedAt &&
        Date.parse(x.expiresAt) > Date.now(),
    );
    invitations.forEach((i) => {
      if (!member_(u.id, i.groupId))
        add_("Members", {
          id: uid_(),
          groupId: i.groupId,
          userId: u.id,
          role: i.role,
          createdAt: now_(),
        });
      update_("Invites", i, { acceptedAt: now_() });
    });
    // Dvě nezávislá UUID; token není odvoditelný z identity uživatele.
    const sessionToken = "ds_" + uid_() + "_" + uid_();
    const expiresAt = new Date(
      Date.now() + SESSION_DAYS * 86400000,
    ).toISOString();
    add_("Sessions", {
      id: uid_(),
      userId: u.id,
      tokenHash: sessionHash_(sessionToken),
      expiresAt,
      createdAt: now_(),
    });
    return { profile: clean_(u), sessionToken, expiresAt };
  });
}
function logoutSession(token) {
  return withLock_(() => {
    const hash = sessionHash_(String(token || ""));
    const session = records_("Sessions").find((s) => s.tokenHash === hash);
    if (session) remove_("Sessions", session);
    return { ok: true };
  });
}
function config() {
  return {
    clientId:
      PropertiesService.getScriptProperties().getProperty("GOOGLE_CLIENT_ID") ||
      "",
  };
}
function member_(uid, gid) {
  return records_("Members").find((x) => x.userId === uid && x.groupId === gid);
}
function canAdmin_(uid, gid) {
  let m = member_(uid, gid);
  return m && m.role === "admin";
}
function gift_(id) {
  const g = records_("Gifts").find((x) => x.id === id);
  require_(g, "Dárek nenalezen.");
  return g;
}
function group_(id) {
  const g = records_("Groups").find((x) => x.id === id);
  require_(g, "Skupina nenalezena.");
  return g;
}
function send_(to, subject, body) {
  MailApp.sendEmail({ to, subject, body, name: "Dárkovník" });
}
function alertBuyer_(userId, giftId, message) {
  add_("Alerts", {
    id: uid_(),
    userId,
    giftId,
    message,
    createdAt: now_(),
    readAt: "",
    emailStatus: "pending",
  });
}
function markAlertRead(token, id) {
  return withLock_(() => {
    const u = user_(token),
      a = records_("Alerts").find((x) => x.id === id && x.userId === u.id);
    require_(a, "Oznámení nenalezeno.");
    update_("Alerts", a, { readAt: now_() });
    return { ok: true };
  });
}
/** Spouští se časovým triggerem po 5-15 minutách; odděluje rychlé zápisy od MailApp. */
function sendQueuedAlerts() {
  return withLock_(() => {
    const pending = records_("Alerts")
      .filter((a) => a.emailStatus === "pending")
      .slice(0, 30);
    const users = records_("Users");
    let sent = 0,
      failed = 0;
    for (const a of pending) {
      const u = users.find((x) => x.id === a.userId);
      try {
        if (!u) throw Error("Uživatel chybí");
        send_(
          u.email,
          "Upozornění na přání – Dárkovník",
          a.message + "\n\n" + link_(),
        );
        update_("Alerts", a, { emailStatus: "sent" });
        sent++;
      } catch (e) {
        Logger.log("Notifikace " + a.id + ": " + e);
        failed++;
      }
    }
    return { sent, failed };
  });
}
function link_() {
  return (
    PropertiesService.getScriptProperties().getProperty("APP_URL") ||
    "odkaz na aplikaci vám předá správce skupiny"
  );
}
function dashboard(token) {
  const u = user_(token),
    members = records_("Members"),
    groups = records_("Groups"),
    users = records_("Users"),
    gifts = records_("Gifts"),
    shares = records_("Shares"),
    res = records_("Reservations"),
    events = records_("Events");
  const myGroups = members
    .filter((m) => m.userId === u.id)
    .map((m) => ({
      ...clean_(groups.find((g) => g.id === m.groupId)),
      role: m.role,
      members: members
        .filter((y) => y.groupId === m.groupId)
        .map((y) => {
          const x = users.find((z) => z.id === y.userId);
          return {
            id: x.id,
            name: x.name,
            email: x.email,
            birthday: x.birthday,
            avatar: x.avatar || "",
            role: y.role,
          };
        }),
    }));
  const myGifts = gifts
    .filter((g) => g.ownerId === u.id)
    .map((g) => ({
      ...clean_(g),
      groupIds: shares.filter((s) => s.giftId === g.id).map((s) => s.groupId),
    }));
  const groupsIds = new Set(myGroups.map((g) => g.id));
  const visibleGifts = gifts
    .filter(
      (g) =>
        g.ownerId !== u.id &&
        shares.some((s) => s.giftId === g.id && groupsIds.has(s.groupId)),
    )
    .map((g) => {
      const r = res.filter((x) => x.giftId === g.id),
        taken = r.reduce((a, x) => a + Number(x.quantity), 0),
        purchased = r
          .filter((x) => x.status === "purchased")
          .reduce((a, x) => a + Number(x.quantity), 0);
      return {
        ...clean_(g),
        groupIds: shares
          .filter((s) => s.giftId === g.id && groupsIds.has(s.groupId))
          .map((s) => s.groupId),
        available: Math.max(0, Number(g.quantity) - taken),
        reserved: taken,
        purchased,
        ownerName: (users.find((x) => x.id === g.ownerId) || {}).name || "",
        mine: r.filter((x) => x.buyerId === u.id).map((x) => clean_(x)),
      };
    });
  const myReservations = res
    .filter((r) => r.buyerId === u.id && groupsIds.has(r.groupId))
    .map((r) => {
      const g = gifts.find((x) => x.id === r.giftId);
      const person = users.find((x) => x.id === g?.ownerId);
      return {
        ...clean_(r),
        giftName: g?.name || "Smazaný dárek",
        giftUrl: g?.url || "",
        personName: person?.name || "",
        image: g?.image || "",
      };
    });
  const nameDays = myGroups.some((g) => enabled_(g.namedaysEnabled))
    ? nameDaysByName_()
    : null;
  const holidayOptions = holidayOptions_();
  const autoEvents = [];
  for (const g of myGroups) {
    if (String(g.birthdaysEnabled).trim().toLowerCase() !== "false")
      for (const m of g.members) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(m.birthday || ""))
          autoEvents.push({
            id: "birthday:" + g.id + ":" + m.id,
            groupId: g.id,
            name: "Narozeniny – " + m.name,
            date: m.birthday,
            repeatYearly: "true",
            userId: m.id,
            kind: "birthday",
            automatic: true,
          });
      }
    autoEvents.push(...createHolidayEvents_(g, holidayOptions));
    if (
      enabled_(g.christmasEnabled) &&
      !holidaySelected_(g.holidaysSelected).some((id) => id === "12-24|Vánoce")
    )
      autoEvents.push({
        id: "christmas:" + g.id,
        groupId: g.id,
        name: "Vánoce",
        date: new Date().getFullYear() + "-12-24",
        repeatYearly: "true",
        userId: "",
        kind: "christmas",
        automatic: true,
      });
    if (enabled_(g.easterEnabled)) {
      const year = new Date().getFullYear();
      for (const y of [year, year + 1])
        autoEvents.push({
          id: "easter:" + g.id + ":" + y,
          groupId: g.id,
          name: "Velikonoční pondělí",
          date: easterMonday_(y),
          repeatYearly: "false",
          userId: "",
          kind: "easter",
          automatic: true,
        });
    }
    if (enabled_(g.namedaysEnabled))
      autoEvents.push(...createNameDayEvents_(g, g.members, nameDays));
  }
  return {
    profile: clean_(u),
    groups: myGroups,
    holidayOptions,
    myGifts,
    visibleGifts,
    myReservations,
    alerts: records_("Alerts")
      .filter((a) => a.userId === u.id)
      .map(clean_)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 30),
    events: events
      .filter((e) => groupsIds.has(e.groupId))
      .map(clean_)
      .concat(autoEvents),
  };
}
function saveProfile(token, data) {
  return withLock_(() => {
    const u = user_(token),
      name = str_(data.name, 80),
      birthday = str_(data.birthday, 10);
    require_(name, "Vyplňte jméno.");
    require_(
      !birthday || /^\d{4}-\d{2}-\d{2}$/.test(birthday),
      "Nesprávné datum.",
    );
    update_("Users", u, { name, birthday, avatar: image_(data.avatar) });
    return { ok: true };
  });
}
function createGroup(token, name) {
  return withLock_(() => {
    const u = user_(token);
    name = str_(name, 100);
    require_(name.length >= 2, "Vyplňte název skupiny.");
    const id = uid_();
    add_("Groups", {
      id,
      name,
      ownerId: u.id,
      createdAt: now_(),
      description: "",
      image: "",
      birthdaysEnabled: "true",
      christmasEnabled: "false",
      easterEnabled: "false",
      namedaysEnabled: "false",
      holidaysSelected: "[]",
    });
    add_("Members", {
      id: uid_(),
      groupId: id,
      userId: u.id,
      role: "admin",
      createdAt: now_(),
    });
    return { id };
  });
}
function enabled_(value) {
  return (
    value === true ||
    value === 1 ||
    String(value).trim().toLowerCase() === "true"
  );
}
function updateGroup(token, data) {
  return withLock_(() => {
    const u = user_(token),
      g = group_(str_(data.id, 100));
    require_(
      canAdmin_(u.id, g.id),
      "Nastavení může měnit pouze správce skupiny.",
    );
    const patch = {
      name: str_(data.name, 100),
      description: str_(data.description, 800),
      image: image_(data.image),
      birthdaysEnabled: String(enabled_(data.birthdaysEnabled)),
      christmasEnabled: "false",
      easterEnabled: String(enabled_(data.easterEnabled)),
      namedaysEnabled: String(enabled_(data.namedaysEnabled)),
      holidaysSelected: JSON.stringify(
        validateHolidaySelection_(data.holidaysSelected),
      ),
    };
    require_(patch.name.length >= 2, "Vyplňte název skupiny.");
    update_("Groups", g, patch);
    return { ok: true, group: { id: g.id, ...patch } };
  });
}
/** Významné svátky jsou řádky NameDays s isHoliday=TRUE.
 * Jeden den může mít více řádků, např. jmeniny i Vánoce.
 * ID kombinace datum|název je stabilní pro výběr v nastavení skupiny.
 */
function holidayOptions_() {
  const seen = new Set(),
    result = [];
  for (const row of records_("NameDays")) {
    if (!enabled_(row.isHoliday)) continue;
    const date = String(row.date || "").trim();
    if (!/^(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])$/.test(date)) continue;
    const name = String(row.names || "").trim();
    if (!name) continue;
    const id = date + "|" + name;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push({ id, date, name });
  }
  return result.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.name.localeCompare(b.name, "cs"),
  );
}
function holidaySelected_(raw) {
  try {
    const items = Array.isArray(raw) ? raw : JSON.parse(String(raw || "[]"));
    return Array.isArray(items)
      ? items.filter((x) => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}
function validateHolidaySelection_(raw) {
  const items = holidaySelected_(raw);
  require_(items.length <= 366, "Příliš mnoho vybraných svátků.");
  const valid = new Set(holidayOptions_().map((x) => x.id));
  require_(
    items.every((id) => valid.has(id)),
    "Některý vybraný svátek není v tabulce NameDays.",
  );
  return [...new Set(items)];
}
function createHolidayEvents_(group, options) {
  const selected = new Set(holidaySelected_(group.holidaysSelected));
  return options
    .filter((h) => selected.has(h.id))
    .map((h) => ({
      id: "holiday:" + group.id + ":" + h.id,
      groupId: group.id,
      name: h.name,
      date: "2024-" + h.date,
      repeatYearly: "true",
      userId: "",
      kind: "holiday",
      automatic: true,
    }));
}
function setGroupShares(token, groupId, ids) {
  return withLock_(() => {
    const u = user_(token);
    require_(member_(u.id, groupId), "Nejste člen skupiny.");
    require_(Array.isArray(ids) && ids.length <= 2000, "Neplatný výběr.");
    const my = records_("Gifts").filter((g) => g.ownerId === u.id);
    const owned = new Set(my.map((g) => g.id));
    require_(
      ids.every((id) => owned.has(id)),
      "Cizí dárek nelze sdílet.",
    );
    const existing = records_("Shares").filter(
      (x) => x.groupId === groupId && owned.has(x.giftId),
    );
    const desired = new Set(ids);
    for (const x of existing.filter((x) => !desired.has(x.giftId)).reverse())
      remove_("Shares", x);
    const prev = new Set(existing.map((x) => x.giftId));
    ids
      .filter((x) => !prev.has(x))
      .forEach((giftId) => add_("Shares", { id: uid_(), giftId, groupId }));
    return { ok: true };
  });
}
function easterMonday_(year) {
  const a = year % 19,
    b = Math.floor(year / 100),
    c = year % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k + 7 * 7) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451),
    month = Math.floor((h + l - 7 * m + 114) / 31),
    day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(Date.UTC(year, month - 1, day));
  easter.setUTCDate(easter.getUTCDate() + 1);
  return easter.toISOString().slice(0, 10);
}
function normalizeName_(s) {
  return String(s || "")
    .toLocaleLowerCase("cs-CZ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
/** Jmeniny jsou spravované v listu NameDays: date = MM-DD, names = jména oddělená čárkou.
 * Shoduje se první jméno z profilu; porovnání ignoruje velikost písmen a diakritiku.
 * Seznam není veřejně zpřístupněn přes API; klient získává pouze události lidí ve skupině.
 */
function nameDaysByName_() {
  const cache = CacheService.getScriptCache(),
    key = "namedays-v1",
    cached = cache.get(key);
  if (cached) return JSON.parse(cached);
  const byName = {};
  for (const row of records_("NameDays")) {
    if (enabled_(row.isHoliday)) continue;
    const date = String(row.date || "").trim();
    if (!/^(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])$/.test(date)) continue;
    for (const candidate of String(row.names || "").split(/[,;\n]/)) {
      const name = normalizeName_(candidate.trim());
      if (name && !byName[name]) byName[name] = date;
    }
  }
  // Úpravy v tabulce se bez nasazení načtou nejpozději do pěti minut.
  cache.put(key, JSON.stringify(byName), 300);
  return byName;
}
function createNameDayEvents_(group, members, byName) {
  const events = [];
  for (const person of members) {
    const firstName = normalizeName_(
      String(person.name || "")
        .trim()
        .split(/\s+/)[0],
    );
    const date = byName[firstName];
    if (date)
      events.push({
        id: "nameday:" + group.id + ":" + person.id,
        groupId: group.id,
        name: "Svátek – " + person.name,
        date: "2024-" + date,
        repeatYearly: "true",
        userId: person.id,
        kind: "nameday",
        automatic: true,
      });
  }
  return events;
}
function inviteMember(token, groupId, address) {
  return withLock_(() => {
    const u = user_(token);
    group_(groupId);
    require_(canAdmin_(u.id, groupId));
    const email = email_(address);
    require_(email !== u.email, "Sebe už máte ve skupině.");
    const existing = records_("Users").find((x) => x.email === email);
    require_(
      !existing || !member_(existing.id, groupId),
      "Uživatel už je členem.",
    );
    const prev = records_("Invites").find(
      (x) =>
        x.groupId === groupId &&
        x.email === email &&
        !x.acceptedAt &&
        Date.parse(x.expiresAt) > Date.now(),
    );
    require_(!prev, "Pozvánka už byla odeslána.");
    add_("Invites", {
      id: uid_(),
      groupId,
      email,
      invitedBy: u.id,
      role: "member",
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      acceptedAt: "",
    });
    send_(
      email,
      "Pozvánka do skupiny – Dárkovník",
      "Byli jste pozváni do skupiny „" +
        group_(groupId).name +
        "“.\nOtevřete Dárkovník: " +
        link_() +
        "\nPřihlaste se pod e-mailem " +
        email +
        ". Pozvánka se automaticky přijme. Platí 30 dní.",
    );
    return { ok: true };
  });
}
function setRole(token, groupId, userId, role) {
  return withLock_(() => {
    const u = user_(token),
      g = group_(groupId);
    require_(g.ownerId === u.id, "Role může upravovat zakladatel skupiny.");
    require_(ROLE.includes(role), "Neplatná role.");
    require_(userId !== u.id, "Nemůžete změnit svoji roli.");
    const m = member_(userId, groupId);
    require_(m, "Člen nenalezen.");
    update_("Members", m, { role });
    return { ok: true };
  });
}
function saveGift(token, data) {
  return withLock_(() => {
    const u = user_(token),
      name = str_(data.name, 160),
      quantity = int_(data.quantity || 1, 1, 999),
      url = url_(data.url),
      image = url_(data.image),
      price = str_(data.price, 90),
      notes = str_(data.notes, 1000);
    require_(name, "Název dárku je povinný.");
    let gift,
      notified = 0;
    if (data.id) {
      gift = gift_(data.id);
      require_(gift.ownerId === u.id, "Tento dárek není váš.");
      const reserved = records_("Reservations")
        .filter((r) => r.giftId === gift.id)
        .reduce((a, r) => a + Number(r.quantity), 0);
      require_(
        quantity >= reserved,
        "Množství nelze snížit pod počet rezervovaných kusů.",
      );
      require_(
        quantity >= Number(gift.receivedQuantity),
        "Množství nelze snížit pod počet obdržených kusů.",
      );
      const changed =
        gift.name !== name ||
        gift.url !== url ||
        gift.image !== image ||
        gift.price !== price ||
        gift.notes !== notes ||
        Number(gift.quantity) !== quantity;
      update_("Gifts", gift, { name, quantity, url, image, price, notes });
      if (changed) {
        const buyers = records_("Reservations").filter(
          (r) => r.giftId === gift.id,
        );
        for (const buyer of new Set(buyers.map((r) => r.buyerId))) {
          alertBuyer_(
            buyer,
            gift.id,
            "Majitel upravil přání „" +
              name +
              "“, které máte rezervované nebo nakoupené. Zkontrolujte prosím změnu.",
          );
          notified++;
        }
      }
    } else {
      gift = add_("Gifts", {
        id: uid_(),
        ownerId: u.id,
        name,
        quantity,
        url,
        image,
        price,
        notes,
        receivedQuantity: 0,
        createdAt: now_(),
      });
    }
    const allowed = new Set(
      records_("Members")
        .filter((m) => m.userId === u.id)
        .map((m) => m.groupId),
    );
    const newGroups = (
      Array.isArray(data.groupIds) ? data.groupIds : []
    ).filter((id) => allowed.has(id));
    const old = records_("Shares").filter((x) => x.giftId === gift.id);
    old
      .filter((x) => !newGroups.includes(x.groupId))
      .reverse()
      .forEach((x) => remove_("Shares", x));
    newGroups
      .filter((id) => !old.some((x) => x.groupId === id))
      .forEach((groupId) =>
        add_("Shares", { id: uid_(), giftId: gift.id, groupId }),
      );
    return { id: gift.id, notified };
  });
}
function deleteGift(token, id) {
  return withLock_(() => {
    const u = user_(token),
      g = gift_(id);
    require_(g.ownerId === u.id);
    require_(
      !records_("Reservations").some((x) => x.giftId === id),
      "Dárek už někdo rezervoval. Nelze jej smazat.",
    );
    records_("Shares")
      .filter((x) => x.giftId === id)
      .reverse()
      .forEach((x) => remove_("Shares", x));
    remove_("Gifts", g);
    return { ok: true };
  });
}
function reserveGift(token, giftId, groupId, quantity) {
  return withLock_(() => {
    const u = user_(token),
      g = gift_(giftId);
    require_(g.ownerId !== u.id, "Svůj dárek nemůžete rezervovat.");
    require_(member_(u.id, groupId), "Nejste členem skupiny.");
    require_(
      records_("Shares").some(
        (s) => s.groupId === groupId && s.giftId === giftId,
      ),
      "Dárek není sdílen do této skupiny.",
    );
    quantity = int_(quantity, 1, 999);
    const used = records_("Reservations")
      .filter((r) => r.giftId === giftId)
      .reduce((a, r) => a + Number(r.quantity), 0);
    require_(
      quantity <= Number(g.quantity) - used,
      "Tolik kusů již není volných.",
    );
    add_("Reservations", {
      id: uid_(),
      giftId,
      groupId,
      buyerId: u.id,
      quantity,
      status: "reserved",
      createdAt: now_(),
    });
    return { ok: true };
  });
}
function updateReservation(token, id, status, partialQuantity) {
  return withLock_(() => {
    const u = user_(token),
      r = records_("Reservations").find((x) => x.id === id);
    require_(r && r.buyerId === u.id, "Rezervace nenalezena.");
    require_(
      ["reserved", "purchased", "cancel"].includes(status),
      "Nesprávný stav.",
    );
    const current = int_(r.quantity, 1, 999),
      qty =
        partialQuantity === undefined
          ? current
          : int_(partialQuantity, 1, current);
    require_(
      status === "cancel" || status !== r.status,
      "Tento počet kusů už má zvolený stav.",
    );
    if (qty === current) {
      if (status === "cancel") remove_("Reservations", r);
      else update_("Reservations", r, { status });
    } else {
      update_("Reservations", r, { quantity: current - qty });
      if (status !== "cancel")
        add_("Reservations", {
          id: uid_(),
          giftId: r.giftId,
          groupId: r.groupId,
          buyerId: r.buyerId,
          quantity: qty,
          status,
          createdAt: now_(),
        });
    }
    return { ok: true };
  });
}
function markReceived(token, giftId, quantity) {
  return withLock_(() => {
    const u = user_(token),
      g = gift_(giftId);
    require_(g.ownerId === u.id, "Dárek není váš.");
    quantity = int_(quantity, 0, Number(g.quantity));
    const before = Number(g.receivedQuantity) || 0;
    update_("Gifts", g, { receivedQuantity: quantity });
    let notified = 0;
    if (before !== quantity) {
      for (const buyer of new Set(
        records_("Reservations")
          .filter((x) => x.giftId === g.id)
          .map((x) => x.buyerId),
      )) {
        alertBuyer_(
          buyer,
          g.id,
          "Majitel přání „" +
            g.name +
            "“ změnil počet obdržených kusů. Zkontrolujte svůj nákup nebo rezervaci.",
        );
        notified++;
      }
    }
    return { ok: true, notified };
  });
}
function saveEvent(token, data) {
  return withLock_(() => {
    const u = user_(token),
      gid = str_(data.groupId, 100);
    require_(canAdmin_(u.id, gid), "Události spravují administrátoři.");
    const name = str_(data.name, 110),
      date = str_(data.date, 10),
      repeatYearly = !!data.repeatYearly,
      personId = str_(data.userId, 100);
    require_(name, "Název události je povinný.");
    require_(
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        !isNaN(new Date(date + "T12:00:00Z").getTime()),
      "Nesprávné datum.",
    );
    require_(!personId || member_(personId, gid), "Vybraná osoba není členem.");
    const v = {
      groupId: gid,
      name,
      date,
      repeatYearly: repeatYearly ? "true" : "false",
      userId: personId,
      createdBy: u.id,
    };
    if (data.id) {
      const e = records_("Events").find(
        (x) => x.id === data.id && x.groupId === gid,
      );
      require_(e, "Událost nenalezena.");
      update_("Events", e, v);
    } else add_("Events", { id: uid_(), ...v });
    return { ok: true };
  });
}
function deleteEvent(token, id) {
  return withLock_(() => {
    const u = user_(token),
      e = records_("Events").find((x) => x.id === id);
    require_(e && canAdmin_(u.id, e.groupId));
    remove_("Events", e);
    return { ok: true };
  });
}
/** Veřejné metadata e-shopu: JSON-LD Product, Open Graph a meta price. Jen povolené domény. */
function fetchProduct(token, raw) {
  user_(token);
  const link = url_(raw),
    host = link.match(/^https:\/\/([^/?#]+)/i)?.[1]?.toLowerCase();
  require_(
    ["alza.cz", "www.alza.cz", "datart.cz", "www.datart.cz"].includes(host),
    "Načítání podporuje Alzu a Datart.",
  );
  const cache = CacheService.getScriptCache(),
    key =
      "p:" +
      Utilities.base64EncodeWebSafe(
        Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, link),
      ).slice(0, 80),
    hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  const r = UrlFetchApp.fetch(link, {
    muteHttpExceptions: true,
    followRedirects: false,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Darkovnik/2.0)" },
  });
  require_(
    r.getResponseCode() === 200,
    "E-shop nepovolil načtení metadat. Zadejte údaje ručně.",
  );
  const html = r.getContentText().slice(0, 700000);
  const decode = (x) =>
    String(x || "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#(?:39|x27);/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  const meta = (key) => {
    const tags = html.match(/<meta\b[^>]*>/gi) || [];
    for (const tag of tags) {
      if (!tag.includes(key)) continue;
      const match = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i);
      if (match?.[1] !== key) continue;
      return decode(tag.match(/content\s*=\s*["']([^"']+)["']/i)?.[1] || "");
    }
    return "";
  };
  let product = null;
  const blocks = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].slice(0, 25);
  const locate = (x) => {
    if (!x || typeof x !== "object") return null;
    if (Array.isArray(x)) {
      for (const y of x) {
        const p = locate(y);
        if (p) return p;
      }
      return null;
    }
    if (
      String(x["@type"] || "")
        .toLowerCase()
        .includes("product")
    )
      return x;
    return locate(x["@graph"]);
  };
  for (const match of blocks)
    try {
      product = locate(JSON.parse(match[1]));
      if (product) break;
    } catch (e) {}
  const image = Array.isArray(product?.image)
    ? product.image[0]
    : typeof product?.image === "object"
      ? product.image.url
      : product?.image;
  const offers = Array.isArray(product?.offers)
    ? product.offers[0]
    : product?.offers;
  const price = String(
    offers?.price ||
      offers?.lowPrice ||
      meta("product:price:amount") ||
      meta("og:price:amount") ||
      "",
  );
  const result = {
    name: str_(
      decode(product?.name || meta("og:title") || meta("twitter:title")),
      160,
    ),
    image: str_(
      decode(image || meta("og:image") || meta("twitter:image")),
      1200,
    ),
    price: str_(price, 90),
  };
  if (!/^https:\/\//i.test(result.image)) result.image = "";
  require_(
    result.name || result.image,
    "Nepodařilo se přečíst produkt. Vyplňte údaje ručně.",
  );
  cache.put(key, JSON.stringify(result), 21600);
  return result;
}
/** Nastavte hodinový / denní trigger na sendReminders. Události s adresátem připomínají nákup 7 dnů předem a potvrzení obdržení den poté. */
function sendReminders() {
  return withLock_(() => {
    const events = records_("Events"),
      members = records_("Members"),
      users = records_("Users"),
      groups = records_("Groups"),
      gifts = records_("Gifts"),
      shares = records_("Shares"),
      rs = records_("Reservations"),
      notices = records_("Notices");
    const names = groups.some((g) => enabled_(g.namedaysEnabled))
      ? nameDaysByName_()
      : null;
    const holidays = holidayOptions_();
    for (const group of groups) {
      const gm = members.filter((x) => x.groupId === group.id);
      if (String(group.birthdaysEnabled).trim().toLowerCase() !== "false")
        for (const m of gm) {
          const user = users.find((x) => x.id === m.userId);
          if (user && /^\d{4}-\d{2}-\d{2}$/.test(user.birthday || ""))
            events.push({
              id: "birthday:" + group.id + ":" + user.id,
              groupId: group.id,
              name: "Narozeniny – " + user.name,
              date: user.birthday,
              repeatYearly: "true",
              userId: user.id,
            });
        }
      const selectedHolidays = holidaySelected_(group.holidaysSelected);
      events.push(...createHolidayEvents_(group, holidays));
      if (
        enabled_(group.christmasEnabled) &&
        !selectedHolidays.includes("12-24|Vánoce")
      )
        events.push({
          id: "christmas:" + group.id,
          groupId: group.id,
          name: "Vánoce",
          date: new Date().getFullYear() + "-12-24",
          repeatYearly: "true",
          userId: "",
        });
      if (enabled_(group.namedaysEnabled)) {
        const people = gm
          .map((m) => users.find((x) => x.id === m.userId))
          .filter(Boolean);
        events.push(...createNameDayEvents_(group, people, names));
      }
      if (enabled_(group.easterEnabled))
        for (const year of [
          new Date().getFullYear(),
          new Date().getFullYear() + 1,
        ])
          events.push({
            id: "easter:" + group.id + ":" + year,
            groupId: group.id,
            name: "Velikonoční pondělí",
            date: easterMonday_(year),
            repeatYearly: "false",
            userId: "",
          });
    }
    const tz = "Europe/Prague",
      today = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
    let sent = 0;
    for (const e of events) {
      let eventDate =
        e.repeatYearly === "true"
          ? today.slice(0, 4) + e.date.slice(4)
          : e.date;
      let date = new Date(eventDate + "T12:00:00Z");
      if (e.repeatYearly === "true" && date < new Date(today + "T12:00:00Z")) {
        eventDate = String(Number(today.slice(0, 4)) + 1) + e.date.slice(4);
        date = new Date(eventDate + "T12:00:00Z");
      }
      if (Number.isNaN(date.getTime())) continue;
      let delta = Math.round(
        (date - new Date(today + "T12:00:00Z")) / 86400000,
      );
      if (e.repeatYearly === "true" && delta > 300) {
        const prior = Number(today.slice(0, 4)) - 1;
        const pdate = prior + e.date.slice(4);
        const pd = Math.round(
          (new Date(pdate + "T12:00:00Z") - new Date(today + "T12:00:00Z")) /
            86400000,
        );
        if (pd === -1) {
          date = new Date(pdate + "T12:00:00Z");
          eventDate = pdate;
          delta = -1;
        }
      }
      if (delta !== 7 && delta !== -1) continue;
      const target = users.find((x) => x.id === e.userId);
      const matching = gifts.filter(
        (g) =>
          g.ownerId === e.userId &&
          shares.some((s) => s.giftId === g.id && s.groupId === e.groupId),
      );
      if (delta === 7) {
        for (const r of rs.filter(
          (r) =>
            r.groupId === e.groupId &&
            r.status === "reserved" &&
            matching.some((g) => g.id === r.giftId),
        )) {
          const person = users.find((x) => x.id === r.buyerId),
            gift = gifts.find((g) => g.id === r.giftId);
          if (!person) continue;
          const key = "before:" + e.id + ":" + eventDate + ":" + r.id;
          if (notices.some((n) => n.key === key)) continue;
          send_(
            person.email,
            "Připomínka dárku – " + e.name,
            "Za 7 dní je událost " +
              e.name +
              " (" +
              eventDate +
              ").\nNezapomeňte koupit " +
              gift.name +
              " (" +
              r.quantity +
              " ks) a označit rezervaci jako Nakoupeno.\n" +
              link_(),
          );
          add_("Notices", { id: uid_(), key, sentAt: now_() });
          sent++;
        }
      }
      if (delta === -1 && target && matching.length) {
        const key = "after:" + e.id + ":" + eventDate + ":" + target.id;
        if (notices.some((n) => n.key === key)) continue;
        send_(
          target.email,
          "Potvrzení dárků – " + e.name,
          "Včera proběhla událost " +
            e.name +
            ". Pokud jste některé dárky dostali, otevřete svůj seznam a nastavte u nich obdržené množství.\n" +
            link_(),
        );
        add_("Notices", { id: uid_(), key, sentAt: now_() });
        sent++;
      }
    }
    return { sent };
  });
}
