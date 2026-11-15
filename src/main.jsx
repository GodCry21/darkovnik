import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createRoot } from "react-dom/client";
import {
  Gift,
  Users,
  CalendarDays,
  UserRound,
  Plus,
  LogOut,
  ExternalLink,
  Pencil,
  Trash2,
  Check,
  ShoppingBag,
  X,
  Mail,
  Shield,
  ArrowLeft,
  Sparkles,
  ListChecks,
  LoaderCircle,
  Bell,
  PackageCheck,
  ChevronRight,
  Link2,
} from "lucide-react";
import "./style.css";

const GAS_URL = import.meta.env.VITE_GAS_URL || "";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const isGAS = () => Boolean(GAS_URL);
let bridge = null,
  ready = false,
  seq = 0,
  waiters = new Map(),
  readyWaiters = [];
function initBridge() {
  if (bridge || !GAS_URL) return;
  bridge = document.createElement("iframe");
  bridge.src = GAS_URL;
  bridge.style.cssText =
    "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none";
  bridge.title = "Datové připojení";
  bridge.setAttribute("aria-hidden", "true");
  document.body.appendChild(bridge);
  window.addEventListener("message", (event) => {
    if (
      event.source !== bridge.contentWindow ||
      event.data?.app !== "darkovnik"
    )
      return;
    if (event.data.type === "ready") {
      ready = true;
      readyWaiters.splice(0).forEach((fn) => fn());
      return;
    }
    if (event.data.type === "result") {
      const item = waiters.get(event.data.id);
      if (!item) return;
      waiters.delete(event.data.id);
      clearTimeout(item.timer);
      event.data.ok
        ? item.resolve(event.data.result)
        : item.reject(new Error(event.data.error || "Neznámá chyba"));
    }
  });
}
function call(method, ...args) {
  return new Promise((resolve, reject) => {
    if (!GAS_URL) return reject(new Error("VITE_GAS_URL není nastaveno."));
    initBridge();
    const send = () => {
      const id = String(++seq),
        timer = setTimeout(() => {
          waiters.delete(id);
          reject(
            new Error(
              "Apps Script neodpovídá. Zkontroluj nasazení a případné blokování iframe.",
            ),
          );
        }, 35000);
      waiters.set(id, { resolve, reject, timer });
      bridge.contentWindow.postMessage(
        { app: "darkovnik", type: "call", id, method, args },
        "*",
      );
    };
    if (ready) send();
    else readyWaiters.push(send);
  });
}
const SESSION_KEY = "darkovnik_session_v1";
const emptyGift = {
  name: "",
  url: "",
  image: "",
  price: "",
  quantity: 1,
  notes: "",
  groupIds: [],
};
const dateCS = (s) => {
  if (!s) return "";
  const v = new Date(s.slice(0, 10) + "T12:00:00");
  return isNaN(+v)
    ? s
    : v.toLocaleDateString("cs-CZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
};
function Modal({ title, children, onClose }) {
  useEffect(() => {
    const listener = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [onClose]);
  return (
    <div
      className="modalOverlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modalHead">
          <h2>{title}</h2>
          <button className="iconButton" onClick={onClose} aria-label="Zavřít">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Button({ children, kind = "", ...props }) {
  return (
    <button
      {...props}
      className={"btn " + kind + " " + (props.className || "")}
    >
      {children}
    </button>
  );
}
function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Empty({ icon: Icon = Gift, title, desc, action }) {
  return (
    <div className="empty">
      <div className="emptyIcon">
        <Icon size={25} />
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
      {action}
    </div>
  );
}
function GoogleLogin({ onToken, clientId }) {
  const ref = useRef();
  const [state, setState] = useState("");
  useEffect(() => {
    if (!clientId) {
      setState("V Apps Script chybí GOOGLE_CLIENT_ID.");
      return;
    }
    let cancelled = false;
    const init = () => {
      if (cancelled) return;
      if (!window.google?.accounts?.id) {
        setState("Google knihovna se nenačetla. Obnovte stránku.");
        return;
      }
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => onToken(credential),
          auto_select: false,
        });
        if (ref.current) {
          ref.current.innerHTML = "";
          window.google.accounts.id.renderButton(ref.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            shape: "pill",
            text: "signin_with",
            width: 280,
            locale: "cs",
          });
        }
        setState("");
      } catch (e) {
        setState(e.message);
      }
    };
    if (window.google?.accounts?.id) init();
    else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = init;
      script.onerror = () => setState("Nelze načíst Google přihlášení.");
      document.body.appendChild(script);
    }
    return () => {
      cancelled = true;
    };
  }, [clientId, onToken]);
  return (
    <>
      <div className="googleButton" ref={ref} />
      {state && <p className="errorText">{state}</p>}
    </>
  );
}
function App() {
  const [idToken, setIdToken] = useState(() => {
    try {
      return localStorage.getItem(SESSION_KEY) || "";
    } catch {
      return "";
    }
  });
  const [clientId, setClientId] = useState(CLIENT_ID);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("home");
  const [groupId, setGroupId] = useState("");
  const [personId, setPersonId] = useState("");
  const [modal, setModal] = useState("");
  const [editing, setEditing] = useState(null);
  const [giftForm, setGiftForm] = useState(emptyGift);
  const [groupName, setGroupName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [eventForm, setEventForm] = useState({
    name: "",
    date: "",
    repeatYearly: true,
    userId: "",
  });
  const [profileForm, setProfileForm] = useState({ name: "", birthday: "" });
  const [reserveForm, setReserveForm] = useState({
    gift: null,
    groupId: "",
    quantity: 1,
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  useEffect(() => {
    initBridge();
    if (!GAS_URL) {
      setLoading(false);
      setError("Doplň VITE_GAS_URL do .env souboru.");
      return;
    }
    if (!CLIENT_ID) {
      setLoading(false);
      setError("Doplň VITE_GOOGLE_CLIENT_ID do .env souboru.");
      return;
    }
    let saved = "";
    try {
      saved = localStorage.getItem(SESSION_KEY) || "";
    } catch {}
    if (!saved) {
      setLoading(false);
      return;
    }
    call("dashboard", saved)
      .then((result) => {
        setData(result);
      })
      .catch(() => {
        try {
          localStorage.removeItem(SESSION_KEY);
        } catch {}
        setIdToken("");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);
  const refresh = useCallback(
    async (token = idToken) => {
      if (!token) return;
      setData(await call("dashboard", token));
    },
    [idToken],
  );
  const signIn = useCallback(async (token) => {
    setBusy(true);
    setError("");
    try {
      const result = await call("signInWithGoogle", token);
      const session = result.sessionToken;
      setData(await call("dashboard", session));
      try {
        localStorage.setItem(SESSION_KEY, session);
      } catch {}
      setIdToken(session);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, []);
  const perform = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await refresh();
      setModal("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const logout = () => {
    const old = idToken;
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
    if (old) call("logoutSession", old).catch(() => {});
    window.google?.accounts?.id?.disableAutoSelect?.();
    setIdToken("");
    setData(null);
    setTab("home");
    setGroupId("");
    setPersonId("");
  };
  const close = () => {
    setModal("");
    setError("");
  };
  const groups = data?.groups || [];
  const own = data?.myGifts || [];
  const visible = data?.visibleGifts || [];
  const myReservations = data?.myReservations || [];
  const selectedGroup = groups.find((x) => x.id === groupId);
  const currentPerson = selectedGroup?.members?.find((x) => x.id === personId);
  const openGift = (gift = null) => {
    setEditing(gift);
    setGiftForm(
      gift
        ? { ...gift, groupIds: gift.groupIds || [] }
        : { ...emptyGift, groupIds: groupId ? [groupId] : [] },
    );
    setModal("gift");
  };
  const openEvent = () => {
    setEventForm({ name: "", date: "", repeatYearly: true, userId: "" });
    setModal("event");
  };
  const availableFor = (gift) =>
    gift.groupIds.filter((id) => groups.some((g) => g.id === id));
  const reserve = (gift, gid) => {
    setReserveForm({ gift, groupId: gid || gift.groupIds[0], quantity: 1 });
    setModal("reserve");
  };
  const nav = [
    { id: "home", label: "Přehled", Icon: Gift },
    { id: "mine", label: "Moje přání", Icon: ListChecks },
    { id: "groups", label: "Skupiny", Icon: Users },
    { id: "calendar", label: "Kalendář", Icon: CalendarDays },
    { id: "profile", label: "Profil", Icon: UserRound },
  ];
  const go = (id) => {
    setTab(id);
    setGroupId("");
    setPersonId("");
    setError("");
  };
  const pageTitle =
    tab === "home"
      ? "Přehled"
      : tab === "mine"
        ? "Moje přání"
        : tab === "groups"
          ? "Moje skupiny"
          : tab === "calendar"
            ? "Kalendář"
            : "Můj profil";
  const coming = useMemo(() => {
    if (!data) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const out = data.events
      .map((e) => {
        let d = new Date(e.date + "T12:00:00");
        if (e.repeatYearly === "true") {
          d.setFullYear(now.getFullYear());
          if (d < now) d.setFullYear(now.getFullYear() + 1);
        }
        return { ...e, when: d };
      })
      .filter((e) => !isNaN(+e.when) && e.when >= now)
      .sort((a, b) => a.when - b.when);
    return out.slice(0, 6);
  }, [data]);
  const giftCards = (arr, { owner = false, gid = null } = {}) =>
    arr.map((g) => (
      <article className="giftCard" key={g.id}>
        <div className="giftImage">
          {g.image ? (
            <img
              src={g.image}
              loading="lazy"
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <Gift size={32} />
          )}
        </div>
        <div className="giftContent">
          <div className="giftMeta">
            {!owner && <span>{g.ownerName}</span>}
            {owner && Number(g.receivedQuantity) > 0 && (
              <span className="tag teal">
                Dostáno {g.receivedQuantity}/{g.quantity}
              </span>
            )}
          </div>
          <h3>{g.name}</h3>
          <div className="muted small">
            {g.price || "Cena neuvedena"} · {g.quantity} ks
          </div>
          {!owner && (
            <div className="small">
              <span className={"tag " + (g.available ? "green" : "grey")}>
                {g.available
                  ? "Volné " + g.available + " ks"
                  : "Vše rezervováno"}
              </span>
              {g.mine?.length > 0 && (
                <span className="tag teal">
                  Rezervuji {g.mine.reduce((n, r) => n + Number(r.quantity), 0)}{" "}
                  ks
                </span>
              )}
            </div>
          )}
          {owner && (
            <div className="muted small">
              Sdíleno do:{" "}
              {g.groupIds.length
                ? g.groupIds
                    .map(
                      (id) =>
                        groups.find((x) => x.id === id)?.name || "Skupina",
                    )
                    .join(", ")
                : "žádné skupiny"}
            </div>
          )}
          <div className="giftActions">
            {g.url && (
              <a
                className="smallLink"
                href={g.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={15} /> Otevřít odkaz
              </a>
            )}
            {owner ? (
              <>
                <button className="smallLink" onClick={() => openGift(g)}>
                  <Pencil size={15} /> Upravit
                </button>
                <button
                  className="smallLink"
                  onClick={() => {
                    setEditing(g);
                    setModal("received");
                  }}
                >
                  <Check size={15} /> Dostáno
                </button>
              </>
            ) : (
              g.available > 0 && (
                <Button
                  kind="sm"
                  onClick={() =>
                    reserve(g, gid && g.groupIds.includes(gid) ? gid : null)
                  }
                >
                  Rezervovat
                </Button>
              )
            )}
          </div>
        </div>
      </article>
    ));
  if (!data)
    return (
      <main className="loginShell">
        <div className="loginCard">
          <div className="brandIcon">
            <Gift size={27} />
          </div>
          <div className="eyebrow">VÍTÁ TĚ DÁRKOVNÍK</div>
          <h1>
            Dárky, které zůstanou <em>překvapením.</em>
          </h1>
          <p>
            Seznamy přání, rodinné skupiny a rezervace bez prozrazení
            překvapení.
          </p>
          {loading ? (
            <div className="muted">Načítám…</div>
          ) : (
            <GoogleLogin clientId={clientId} onToken={signIn} />
          )}{" "}
          {busy && <div className="muted">Přihlašuji…</div>}
          {error && <div className="alert">{error}</div>}{" "}
          {!isGAS() && (
            <p className="hint">
              Náhled běží lokálně. Přihlášení a data se aktivují po nasazení
              webu na Apps Script.
            </p>
          )}
        </div>
        <div className="loginArt">
          <div className="bigPresent">🎁</div>
          <span className="float float1">✦</span>
          <span className="float float2">✧</span>
          <span className="float float3">✦</span>
          <h2>Radost se plánuje lépe společně.</h2>
        </div>
      </main>
    );
  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="logo">
          <span className="logoIcon">
            <Gift size={22} />
          </span>{" "}
          Dárkovník
        </div>
        <div className="sideLabel">MENU</div>
        <nav>
          {nav.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={"navItem " + (tab === id ? "active" : "")}
              onClick={() => go(id)}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebarBottom">
          <div className="userChip">
            <div className="avatar">
              {data.profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <b>{data.profile.name}</b>
              <span>{data.profile.email}</span>
            </div>
          </div>
          <button className="navItem" onClick={logout}>
            <LogOut size={18} /> Odhlásit se
          </button>
        </div>
      </aside>
      <div className="mainWrap">
        <header className="topbar">
          <div className="mobileLogo">
            <Gift size={20} /> Dárkovník
          </div>
          <span className="topbarRight">
            <Bell size={18} />
            <div className="avatar mini">
              {data.profile.name.charAt(0).toUpperCase()}
            </div>
          </span>
        </header>
        <main className="content">
          {error && (
            <div className="alert">
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Zavřít">
                <X size={16} />
              </button>
            </div>
          )}
          {tab === "home" && (
            <>
              <div className="welcome">
                <div>
                  <div className="eyebrow">TVŮJ PROSTOR PRO RADOST</div>
                  <h1>
                    Ahoj, {data.profile.name.split(" ")[0]}! <span>👋</span>
                  </h1>
                  <p>Měj dárky, přání i překvapení hezky pod kontrolou.</p>
                  <Button onClick={() => openGift()}>
                    <Plus size={18} /> Přidat přání
                  </Button>
                </div>
                <div className="welcomeArt">🎁</div>
              </div>
              <div className="stats">
                <div className="stat">
                  <div className="statIcon peach">
                    <Gift />
                  </div>
                  <strong>{own.length}</strong>
                  <span>Mých přání</span>
                </div>
                <div className="stat">
                  <div className="statIcon lav">
                    <Users />
                  </div>
                  <strong>{groups.length}</strong>
                  <span>Skupin</span>
                </div>
                <div className="stat">
                  <div className="statIcon mint">
                    <ShoppingBag />
                  </div>
                  <strong>{myReservations.length}</strong>
                  <span>Mých rezervací</span>
                </div>
              </div>
              <div className="twoCols">
                <section className="panel">
                  <div className="panelHeading">
                    <h2>Moje rezervace</h2>
                    <span className="muted small">
                      Jen ty vidíš, co kupuješ
                    </span>
                  </div>
                  {!myReservations.length ? (
                    <Empty
                      icon={ShoppingBag}
                      title="Zatím nic nerezervuješ"
                      desc="Podívej se na přání ostatních ve svých skupinách."
                    />
                  ) : (
                    myReservations.slice(0, 5).map((r) => (
                      <div className="reservation" key={r.id}>
                        <div className="miniPresent">🎁</div>
                        <div className="reservationText">
                          <b>{r.giftName}</b>
                          <small>
                            Pro: {r.personName} · {r.quantity} ks
                          </small>
                        </div>
                        <span
                          className={
                            "tag " +
                            (r.status === "purchased" ? "teal" : "orange")
                          }
                        >
                          {r.status === "purchased" ? "Nakoupeno" : "Řeším"}
                        </span>
                      </div>
                    ))
                  )}
                </section>
                <section className="panel">
                  <div className="panelHeading">
                    <h2>Blížící se události</h2>
                    <button
                      className="textButton"
                      onClick={() => go("calendar")}
                    >
                      Kalendář <ChevronRight size={16} />
                    </button>
                  </div>
                  {!coming.length ? (
                    <Empty
                      icon={CalendarDays}
                      title="Kalendář je prázdný"
                      desc="Vytvoř událost ve skupině, třeba narozeniny nebo Vánoce."
                    />
                  ) : (
                    coming.map((e) => (
                      <div className="eventLine" key={e.id}>
                        <div className="dateSquare">
                          <b>{e.when.getDate()}</b>
                          <small>
                            {e.when.toLocaleDateString("cs-CZ", {
                              month: "short",
                            })}
                          </small>
                        </div>
                        <div>
                          <b>{e.name}</b>
                          <div className="muted small">
                            {groups.find((g) => g.id === e.groupId)?.name || ""}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </section>
              </div>
            </>
          )}
          {tab === "mine" && (
            <>
              <div className="pageHead">
                <div>
                  <div className="eyebrow">SEZNAM PŘÁNÍ</div>
                  <h1>Moje přání</h1>
                  <p>
                    Co by ti udělalo radost? Stav rezervací tu zůstává tajný.
                  </p>
                </div>
                <Button onClick={() => openGift()}>
                  <Plus size={18} /> Nové přání
                </Button>
              </div>
              {own.length ? (
                <div className="giftGrid">
                  {giftCards(own, { owner: true })}
                </div>
              ) : (
                <Empty
                  title="Tady začínají tvoje přání"
                  desc="Přidej první dárek a vyber skupiny, ve kterých se má zobrazovat."
                  action={
                    <Button onClick={() => openGift()}>
                      <Plus size={18} /> Přidat první přání
                    </Button>
                  }
                />
              )}
            </>
          )}
          {tab === "groups" && !selectedGroup && (
            <>
              <div className="pageHead">
                <div>
                  <div className="eyebrow">LIDÉ KOLEM TEBE</div>
                  <h1>Moje skupiny</h1>
                  <p>Každá skupina má vlastní členy, přání a události.</p>
                </div>
                <Button
                  onClick={() => {
                    setGroupName("");
                    setModal("group");
                  }}
                >
                  <Plus size={18} /> Založit skupinu
                </Button>
              </div>
              {groups.length ? (
                <div className="groupGrid">
                  {groups.map((g) => (
                    <button
                      className="groupCard"
                      key={g.id}
                      onClick={() => {
                        setGroupId(g.id);
                        setPersonId("");
                      }}
                    >
                      <div className="groupIcon">
                        <Users size={27} />
                      </div>
                      <h3>{g.name}</h3>
                      <p>
                        {g.members.length} členů ·{" "}
                        {g.role === "admin" ? "Administrátor" : "Člen"}
                      </p>
                      <span className="smallLink">
                        Otevřít skupinu <ChevronRight size={16} />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <Empty
                  icon={Users}
                  title="Zatím nejsi v žádné skupině"
                  desc="Založ rodinu, přátele nebo skupinu na společné Vánoce."
                  action={
                    <Button
                      onClick={() => {
                        setGroupName("");
                        setModal("group");
                      }}
                    >
                      <Plus size={18} /> Založit skupinu
                    </Button>
                  }
                />
              )}
            </>
          )}
          {tab === "groups" && selectedGroup && (
            <>
              <button
                className="back"
                onClick={() => (personId ? setPersonId("") : setGroupId(""))}
              >
                <ArrowLeft size={17} />{" "}
                {personId ? "Zpět na skupinu" : "Zpět na skupiny"}
              </button>
              <div className="pageHead">
                <div>
                  <div className="eyebrow">
                    {selectedGroup.role === "admin"
                      ? "SPRÁVA SKUPINY"
                      : "SKUPINA"}
                  </div>
                  <h1>{personId ? currentPerson?.name : selectedGroup.name}</h1>
                  <p>
                    {personId
                      ? "Seznam přání této osoby"
                      : `${selectedGroup.members.length} členů ve skupině`}
                  </p>
                </div>
                {!personId && selectedGroup.role === "admin" && (
                  <Button
                    onClick={() => {
                      setInviteEmail("");
                      setModal("invite");
                    }}
                  >
                    <Mail size={17} /> Pozvat člena
                  </Button>
                )}
              </div>
              {personId ? (
                <>
                  {currentPerson?.id === data.profile.id ? (
                    <div className="notice">
                      Toto jsou tvoje přání. Rezervace vlastních dárků není
                      možná.
                    </div>
                  ) : null}
                  {(() => {
                    const arr =
                      personId === data.profile.id
                        ? own.filter((g) => g.groupIds.includes(groupId))
                        : visible.filter(
                            (g) =>
                              g.ownerId === personId &&
                              g.groupIds.includes(groupId),
                          );
                    return arr.length ? (
                      <div className="giftGrid">
                        {giftCards(arr, {
                          owner: personId === data.profile.id,
                          gid: groupId,
                        })}
                      </div>
                    ) : (
                      <Empty
                        title="Zatím žádná sdílená přání"
                        desc="Tato osoba nemá ve skupině viditelná přání."
                      />
                    );
                  })()}
                </>
              ) : (
                <>
                  <section className="panel">
                    <div className="panelHeading">
                      <h2>Členové skupiny</h2>
                    </div>
                    <div className="memberGrid">
                      {selectedGroup.members.map((m) => (
                        <div className="memberCard" key={m.id}>
                          <button
                            className="memberLink"
                            onClick={() => setPersonId(m.id)}
                          >
                            <div className="avatar">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <b>
                                {m.name}
                                {m.id === data.profile.id ? " (ty)" : ""}
                              </b>
                              <small>
                                {m.role === "admin" ? "Administrátor" : "Člen"}
                              </small>
                            </div>
                            <ChevronRight size={17} />
                          </button>
                          {selectedGroup.ownerId === data.profile.id &&
                            m.id !== data.profile.id && (
                              <select
                                aria-label={"Role " + m.name}
                                value={m.role}
                                onChange={(e) =>
                                  perform(() =>
                                    call(
                                      "setRole",
                                      idToken,
                                      groupId,
                                      m.id,
                                      e.target.value,
                                    ),
                                  )
                                }
                              >
                                <option value="member">Člen</option>
                                <option value="admin">Administrátor</option>
                              </select>
                            )}
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="panel">
                    <div className="panelHeading">
                      <h2>Přání ve skupině</h2>
                    </div>
                    {visible.filter((g) => g.groupIds.includes(groupId))
                      .length ? (
                      <div className="giftGrid compact">
                        {giftCards(
                          visible.filter((g) => g.groupIds.includes(groupId)),
                          { gid: groupId },
                        )}
                      </div>
                    ) : (
                      <Empty
                        title="Zatím žádná přání ostatních"
                        desc="Až členové nasdílí svá přání, najdeš je tady."
                      />
                    )}
                  </section>
                </>
              )}
            </>
          )}
          {tab === "calendar" && (
            <>
              <div className="pageHead">
                <div>
                  <div className="eyebrow">DŮLEŽITÁ DATA</div>
                  <h1>Kalendář událostí</h1>
                  <p>
                    Narozeniny, Vánoce i společné oslavy. Upozornění se zasílají
                    e-mailem.
                  </p>
                </div>
                {groups.some((g) => g.role === "admin") && (
                  <Button onClick={openEvent}>
                    <Plus size={18} /> Přidat událost
                  </Button>
                )}
              </div>
              <div className="monthSelector">
                <button
                  onClick={() => setSelectedMonth((selectedMonth + 11) % 12)}
                  aria-label="Předchozí měsíc"
                >
                  ‹
                </button>
                <b>
                  {new Date(2026, selectedMonth, 1).toLocaleDateString(
                    "cs-CZ",
                    { month: "long" },
                  )}
                </b>
                <button
                  onClick={() => setSelectedMonth((selectedMonth + 1) % 12)}
                  aria-label="Další měsíc"
                >
                  ›
                </button>
              </div>
              <div className="panel">
                {(() => {
                  const events = data.events
                    .filter(
                      (e) => Number(e.date.slice(5, 7)) === selectedMonth + 1,
                    )
                    .sort((a, b) =>
                      a.date.slice(8).localeCompare(b.date.slice(8)),
                    );
                  return events.length ? (
                    events.map((e) => (
                      <div className="eventLine" key={e.id}>
                        <div className="dateSquare">
                          <b>{Number(e.date.slice(8, 10))}</b>
                          <small>
                            {new Date(
                              2026,
                              selectedMonth,
                              1,
                            ).toLocaleDateString("cs-CZ", { month: "short" })}
                          </small>
                        </div>
                        <div className="eventDescription">
                          <b>{e.name}</b>
                          <div className="muted small">
                            {groups.find((g) => g.id === e.groupId)?.name}{" "}
                            {e.repeatYearly === "true" ? "· Každý rok" : ""}
                          </div>
                        </div>
                        {groups.find((g) => g.id === e.groupId)?.role ===
                          "admin" && (
                          <button
                            className="iconButton"
                            title="Smazat událost"
                            onClick={() => {
                              if (confirm("Smazat událost?"))
                                perform(() =>
                                  call("deleteEvent", idToken, e.id),
                                );
                            }}
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <Empty
                      icon={CalendarDays}
                      title="Tento měsíc nic neplánuješ"
                      desc="Zkus jiný měsíc nebo přidej událost."
                    />
                  );
                })()}
              </div>
            </>
          )}
          {tab === "profile" && (
            <>
              <div className="pageHead">
                <div>
                  <div className="eyebrow">TVŮJ ÚČET</div>
                  <h1>Profil</h1>
                  <p>Informace pro tvé skupiny a přání.</p>
                </div>
              </div>
              <section className="panel profilePanel">
                <div className="profileAvatar">
                  {data.profile.name.charAt(0).toUpperCase()}
                </div>
                <h2>{data.profile.name}</h2>
                <p>{data.profile.email}</p>
                <p className="muted small">
                  Narozeniny: {dateCS(data.profile.birthday) || "Neuvedeno"}
                </p>
                <Button
                  onClick={() => {
                    setProfileForm({
                      name: data.profile.name,
                      birthday: data.profile.birthday || "",
                    });
                    setModal("profile");
                  }}
                >
                  <Pencil size={17} /> Upravit profil
                </Button>
                <p className="hint">
                  Účet je zabezpečený přihlášením přes Google. E-mail spravuješ
                  ve svém Google účtu.
                </p>
              </section>
            </>
          )}
        </main>
      </div>
      <nav className="mobileNav">
        {nav.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => go(id)}
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {error && modal && (
        <div className="toastError" role="alert">
          {error}
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {modal === "gift" && (
        <Modal title={editing ? "Upravit přání" : "Nové přání"} onClose={close}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              perform(() => call("saveGift", idToken, giftForm));
            }}
            className="modalForm"
          >
            <Field label="Název dárku *">
              <input
                required
                maxLength={160}
                value={giftForm.name}
                onChange={(e) =>
                  setGiftForm({ ...giftForm, name: e.target.value })
                }
                placeholder="Např. Kniha, sluchátka…"
              />
            </Field>
            <Field label="Odkaz na produkt">
              <div className="inputRow">
                <input
                  type="url"
                  value={giftForm.url}
                  onChange={(e) =>
                    setGiftForm({ ...giftForm, url: e.target.value })
                  }
                  placeholder="https://…"
                />
                <button
                  type="button"
                  className="subtleBtn"
                  disabled={!giftForm.url || busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      const res = await call(
                        "fetchProduct",
                        idToken,
                        giftForm.url,
                      );
                      setGiftForm((f) => ({
                        ...f,
                        name: res.name || f.name,
                        image: res.image || f.image,
                        price: res.price || f.price,
                      }));
                    } catch (e) {
                      setError(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Sparkles size={15} /> Načíst
                </button>
              </div>
            </Field>
            <Field label="Obrázek (URL)">
              <input
                type="url"
                value={giftForm.image}
                onChange={(e) =>
                  setGiftForm({ ...giftForm, image: e.target.value })
                }
                placeholder="https://…"
              />
            </Field>
            <div className="formTwo">
              <Field label="Cena / odhad">
                <input
                  value={giftForm.price}
                  onChange={(e) =>
                    setGiftForm({ ...giftForm, price: e.target.value })
                  }
                  placeholder="500–800 Kč"
                />
              </Field>
              <Field label="Množství">
                <input
                  type="number"
                  min="1"
                  max="999"
                  required
                  value={giftForm.quantity}
                  onChange={(e) =>
                    setGiftForm({
                      ...giftForm,
                      quantity: Number(e.target.value),
                    })
                  }
                />
              </Field>
            </div>
            <Field label="Poznámka">
              <textarea
                rows={2}
                maxLength={1000}
                value={giftForm.notes}
                onChange={(e) =>
                  setGiftForm({ ...giftForm, notes: e.target.value })
                }
                placeholder="Velikost, barva, varianta…"
              />
            </Field>
            <div className="field">
              <span>Zobrazit ve skupinách</span>
              <div className="checkList">
                {groups.length ? (
                  groups.map((g) => (
                    <label key={g.id}>
                      <input
                        type="checkbox"
                        checked={giftForm.groupIds.includes(g.id)}
                        onChange={(e) =>
                          setGiftForm((f) => ({
                            ...f,
                            groupIds: e.target.checked
                              ? [...f.groupIds, g.id]
                              : f.groupIds.filter((x) => x !== g.id),
                          }))
                        }
                      />
                      {g.name}
                    </label>
                  ))
                ) : (
                  <p className="muted small">
                    Pro sdílení nejprve založ nebo přijmi pozvánku do skupiny.
                  </p>
                )}
              </div>
            </div>
            <p className="hint">
              Rezervace svých přání neuvidíš. Přidávej je v tomto okně, aby
              zůstala překvapením.
            </p>
            <div className="modalActions">
              {editing && (
                <button
                  type="button"
                  className="dangerLink"
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(
                        "Smazat přání? Pokud už ho někdo rezervoval, smazání nebude možné.",
                      )
                    )
                      perform(() => call("deleteGift", idToken, editing.id));
                  }}
                >
                  <Trash2 size={16} /> Smazat
                </button>
              )}
              <Button type="submit" disabled={busy}>
                {busy ? "Ukládám…" : "Uložit přání"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "group" && (
        <Modal title="Nová skupina" onClose={close}>
          <form
            className="modalForm"
            onSubmit={(e) => {
              e.preventDefault();
              perform(() => call("createGroup", idToken, groupName));
            }}
          >
            <Field label="Název skupiny">
              <input
                required
                minLength={2}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Např. Rodina, Kamarádi…"
              />
            </Field>
            <p className="hint">
              Automaticky se staneš správcem a můžeš zvát ostatní.
            </p>
            <div className="modalActions">
              <Button type="submit" disabled={busy}>
                Vytvořit skupinu
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "invite" && (
        <Modal title="Pozvat člena" onClose={close}>
          <form
            className="modalForm"
            onSubmit={(e) => {
              e.preventDefault();
              perform(() =>
                call("inviteMember", idToken, groupId, inviteEmail),
              );
            }}
          >
            <Field label="E-mail pozvaného">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="clen@gmail.com"
              />
            </Field>
            <p className="hint">
              Pozvánka přijde e-mailem. Člověk se přihlásí stejným Google účtem
              a automaticky se přidá do skupiny.
            </p>
            <div className="modalActions">
              <Button type="submit" disabled={busy}>
                <Mail size={16} /> Odeslat pozvánku
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "reserve" && (
        <Modal title="Rezervovat dárek" onClose={close}>
          <form
            className="modalForm"
            onSubmit={(e) => {
              e.preventDefault();
              perform(() =>
                call(
                  "reserveGift",
                  idToken,
                  reserveForm.gift.id,
                  reserveForm.groupId,
                  reserveForm.quantity,
                ),
              );
            }}
          >
            <h3>{reserveForm.gift.name}</h3>
            <p className="muted">Volných kusů: {reserveForm.gift.available}</p>
            <Field label="Počet kusů">
              <input
                type="number"
                required
                min={1}
                max={reserveForm.gift.available}
                value={reserveForm.quantity}
                onChange={(e) =>
                  setReserveForm({
                    ...reserveForm,
                    quantity: Number(e.target.value),
                  })
                }
              />
            </Field>
            {reserveForm.gift.groupIds.length > 1 && (
              <Field label="Skupina">
                <select
                  value={reserveForm.groupId}
                  onChange={(e) =>
                    setReserveForm({ ...reserveForm, groupId: e.target.value })
                  }
                >
                  {availableFor(reserveForm.gift).map((id) => (
                    <option key={id} value={id}>
                      {groups.find((g) => g.id === id)?.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <p className="hint">
              Rezervace bude viditelná pro tebe a ostatní obdarovávající,
              nikoliv pro majitele přání.
            </p>
            <div className="modalActions">
              <Button type="submit" disabled={busy}>
                Potvrdit rezervaci
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "received" && (
        <Modal title="Kolik kusů jsi dostal/a?" onClose={close}>
          <form
            className="modalForm"
            onSubmit={(e) => {
              e.preventDefault();
              perform(() =>
                call(
                  "markReceived",
                  idToken,
                  editing.id,
                  Number(e.currentTarget.elements.received.value),
                ),
              );
            }}
          >
            <p>{editing.name}</p>
            <Field label="Počet obdržených kusů">
              <input
                name="received"
                type="number"
                min="0"
                max={editing.quantity}
                defaultValue={editing.receivedQuantity || 0}
              />
            </Field>
            <p className="hint">
              Tento údaj si nastavuje pouze majitel přání. Neprozradíme ti
              žádnou rezervaci.
            </p>
            <div className="modalActions">
              <Button type="submit" disabled={busy}>
                Uložit
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "event" && (
        <Modal title="Nová událost" onClose={close}>
          <form
            className="modalForm"
            onSubmit={(e) => {
              e.preventDefault();
              perform(() => call("saveEvent", idToken, eventForm));
            }}
          >
            <Field label="Skupina">
              <select
                required
                value={eventForm.groupId || ""}
                onChange={(e) =>
                  setEventForm({ ...eventForm, groupId: e.target.value })
                }
              >
                <option value="">Vyber skupinu…</option>
                {groups
                  .filter((g) => g.role === "admin")
                  .map((g) => (
                    <option value={g.id} key={g.id}>
                      {g.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Název">
              <input
                required
                value={eventForm.name}
                onChange={(e) =>
                  setEventForm({ ...eventForm, name: e.target.value })
                }
                placeholder="Narozeniny, Vánoce…"
              />
            </Field>
            <Field label="Datum">
              <input
                type="date"
                required
                value={eventForm.date}
                onChange={(e) =>
                  setEventForm({ ...eventForm, date: e.target.value })
                }
              />
            </Field>
            <Field label="Komu patří událost">
              <select
                value={eventForm.userId}
                onChange={(e) =>
                  setEventForm({ ...eventForm, userId: e.target.value })
                }
              >
                <option value="">Všem / bez konkrétní osoby</option>
                {groups
                  .find((g) => g.id === eventForm.groupId)
                  ?.members.map((m) => (
                    <option value={m.id} key={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </Field>
            <label className="checkLine">
              <input
                type="checkbox"
                checked={eventForm.repeatYearly}
                onChange={(e) =>
                  setEventForm({ ...eventForm, repeatYearly: e.target.checked })
                }
              />{" "}
              Opakovat každý rok
            </label>
            <p className="hint">
              Připomínky odcházejí 7 dní před událostí kupujícím a den po
              události obdarovanému (pokud událost patří konkrétní osobě).
            </p>
            <div className="modalActions">
              <Button type="submit" disabled={busy}>
                Uložit událost
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "profile" && (
        <Modal title="Upravit profil" onClose={close}>
          <form
            className="modalForm"
            onSubmit={(e) => {
              e.preventDefault();
              perform(() => call("saveProfile", idToken, profileForm));
            }}
          >
            <Field label="Zobrazované jméno">
              <input
                required
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
              />
            </Field>
            <Field label="Datum narození">
              <input
                type="date"
                value={profileForm.birthday}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, birthday: e.target.value })
                }
              />
            </Field>
            <div className="modalActions">
              <Button type="submit" disabled={busy}>
                Uložit profil
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
