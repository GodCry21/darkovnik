import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Icon } from "./Icon";
import {
  call,
  initBridge,
  GAS_URL,
  GOOGLE_CLIENT_ID,
  session,
  setSession,
  readCached,
  writeCached,
  clearCached,
  money,
  shortDate,
  uploadWebP,
} from "./api";
const I = Icon as any;
type Screen =
  | "overview"
  | "wishes"
  | "groups"
  | "calendar"
  | "messages"
  | "profile";
type ModalName =
  | "gift"
  | "reserve"
  | "reservation"
  | "received"
  | "createGroup"
  | "groupSettings"
  | "invite"
  | "shares"
  | "event"
  | "alerts"
  | null;
const emptyGift = () => ({
  name: "",
  price: "",
  url: "",
  image: "",
  quantity: 1,
  notes: "",
  priority: "none",
  groupIds: [] as string[],
});
const NAV: [Screen, string, string][] = [
  ["overview", "Přehled", "home"],
  ["wishes", "Moje přání", "heart"],
  ["groups", "Skupiny", "users"],
  ["calendar", "Kalendář", "calendar"],
  ["messages", "Zprávy", "message"],
  ["profile", "Profil", "user"],
];
const stateTag = (p: any) =>
  p === "high"
    ? "Vysoká priorita"
    : p === "medium"
      ? "Střední priorita"
      : p === "low"
        ? "Nižší priorita"
        : "";
const bool = (v: any) => String(v).toLowerCase() === "true";
const eventType = (e: any) =>
  e.kind === "birthday"
    ? "birthday"
    : e.kind === "nameday"
      ? "nameday"
      : e.kind === "holiday"
        ? bool(e.isGifted)
          ? "giftHoliday"
          : "holiday"
        : "custom";
const eventText = (e: any) =>
  ({
    birthday: "Narozeniny",
    nameday: "Jmeniny",
    holiday: "Svátek",
    giftHoliday: "Svátek s dárky",
    custom: "Vlastní",
  })[eventType(e)];
// Bezpečně známé vokativy; u neznámých jmen nezobrazujeme chybný pád.
const vocative = (full: string) => {
  const first = (full || "").trim().split(/\s+/)[0];
  const names: Record<string, string> = {
    Jakub: "Jakube",
    Petr: "Petře",
    Martin: "Martine",
    Tomáš: "Tomáši",
    Jan: "Jane",
    Pavel: "Pavle",
    David: "Davide",
    Michal: "Michale",
    Ondřej: "Ondřeji",
    Jiří: "Jiří",
    Josef: "Josefe",
    Lukáš: "Lukáši",
    Adam: "Adame",
    Filip: "Filipe",
    Daniel: "Danieli",
    Jana: "Jano",
    Tereza: "Terezo",
    Lucie: "Lucie",
    Eva: "Evo",
    Anna: "Anno",
    Marie: "Marie",
    Kateřina: "Kateřino",
    Veronika: "Veroniko",
    Petra: "Petro",
    Lenka: "Lenko",
    Martina: "Martino",
    Barbora: "Barboro",
    Eliška: "Eliško",
    Karolína: "Karolíno",
    Klára: "Kláro",
    Monika: "Moniko",
  };
  return names[first] || "";
};
const dateForYear = (e: any, y: number) => {
  const s = String(e.date || "");
  return bool(e.repeatYearly) ? `${y}-${s.slice(5, 10)}` : s.slice(0, 10);
};
function Avatar({
  name = "",
  avatar = "",
  size = "md",
}: {
  name?: string;
  avatar?: string;
  size?: string;
}) {
  return (
    <span className={"avatar sage avatar-" + size}>
      {avatar ? (
        <img src={avatar} alt="" />
      ) : (
        name.trim().slice(0, 1).toUpperCase() || "?"
      )}
    </span>
  );
}
function Btn({
  children,
  onClick,
  variant = "primary",
  icon,
  disabled,
  type = "button",
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: string;
  icon?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={"button button-" + variant}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <I name={icon} size={17} />} {children}
    </button>
  );
}
function Header({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      <div className="header-actions">{children}</div>
    </header>
  );
}
function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {action && (
        <button onClick={onAction}>
          {action} <I name="chevron" size={15} />
        </button>
      )}
    </div>
  );
}
function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="live-empty panel">
      <I name="gift" size={25} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
function Dialog({
  title,
  eyebrow = "DÁRKOVNÍK",
  children,
  onClose,
  wide = false,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      window.removeEventListener("keydown", key);
    };
  }, []);
  return (
    <div
      className="flow-layer"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button className="flow-backdrop" onClick={onClose} aria-label="Zavřít" />
      <section
        ref={ref}
        tabIndex={-1}
        className={"flow-panel" + (wide ? " wide" : "")}
      >
        <header className="flow-header">
          <button
            className="flow-mobile-back"
            onClick={onClose}
            aria-label="Zpět"
          >
            <I name="arrow" />
          </button>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
          </div>
          <button className="flow-close" onClick={onClose} aria-label="Zavřít">
            <I name="close" />
          </button>
        </header>
        <div className="flow-content">{children}</div>
      </section>
    </div>
  );
}
function Field({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label>{title}</label>
      {children}
    </div>
  );
}
function Qty({
  value,
  onChange,
  min = 1,
  max = 999,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="quantity-control">
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <input
        aria-label="Počet kusů"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))
        }
      />
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}
function Product({
  g,
  owner,
  groups,
  onEdit,
  onReserve,
  onReceive,
  onMessage,
  onManage,
}: {
  g: any;
  owner: boolean;
  groups: any[];
  onEdit: () => void;
  onReserve: () => void;
  onReceive: () => void;
  onMessage: () => void;
  onManage: (r: any) => void;
}) {
  const groupNames = (g.groupIds || [])
    .map((id: string) => groups.find((x) => x.id === id)?.name)
    .filter(Boolean);
  return (
    <article className="product-card panel">
      <div className="product-image live-image">
        {g.image ? (
          <img src={g.image} loading="lazy" alt="" />
        ) : (
          <I name="gift" size={39} />
        )}{" "}
        {stateTag(g.priority) && (
          <span className="image-badge">{stateTag(g.priority)}</span>
        )}
        {owner && (
          <button
            className="more-button"
            onClick={onEdit}
            aria-label={"Upravit " + g.name}
          >
            <I name="more" />
          </button>
        )}
      </div>
      <div className="product-content">
        <p className="store">
          {g.url ? (
            <a href={g.url} target="_blank" rel="noreferrer">
              <I name="link" size={14} />{" "}
              {(() => {
                try {
                  return new URL(g.url).hostname.replace("www.", "");
                } catch {
                  return "Odkaz na produkt";
                }
              })()}
            </a>
          ) : (
            <span>Seznam přání</span>
          )}
        </p>
        <h2>{g.name}</h2>
        <strong className="price">{money(g.price)}</strong>
        {g.notes?.trim() && (
          <p className="product-note" title={g.notes}>
            {g.notes}
          </p>
        )}
        <div className="product-meta">
          <span>
            Množství <b>{g.quantity} ks</b>
          </span>
          <span>
            {owner
              ? `Dostáno ${g.receivedQuantity || 0} ks`
              : g.available > 0
                ? `Volné ${g.available} ks`
                : "Vše rezervováno"}
          </span>
        </div>
        {owner && (
          <p className="live-caption">
            {groupNames.length
              ? "Sdíleno: " + groupNames.join(", ")
              : "Zatím nesdíleno"}
          </p>
        )}
        {!owner && <p className="live-caption">Pro: {g.ownerName}</p>}
        <div className="live-card-actions">
          {owner ? (
            <>
              <Btn variant="secondary" onClick={onEdit}>
                Upravit
              </Btn>
              <Btn variant="ghost" onClick={onReceive}>
                Už jsem dostal/a
              </Btn>
            </>
          ) : (
            <>
              <Btn onClick={onReserve} disabled={!(Number(g.available) > 0)}>
                Rezervovat
              </Btn>
              <Btn variant="secondary" onClick={onMessage}>
                Zeptat se
              </Btn>
            </>
          )}
        </div>
        {!owner &&
          (g.mine || []).map((r: any) => (
            <button
              className="live-inline-action"
              key={r.id}
              onClick={() => onManage(r)}
            >
              {r.status === "purchased" ? "Nakoupeno" : "Rezervováno"} ·{" "}
              {r.quantity} ks · Upravit
            </button>
          ))}
      </div>
    </article>
  );
}
function Login({
  onToken,
  problem,
}: {
  onToken: (v: string) => void;
  problem: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError("Chybí nastavení Google Client ID.");
      return;
    }
    let active = true;
    const init = () => {
      if (!active) return;
      try {
        if (!window.google?.accounts?.id) {
          setError("Google přihlášení se nenačetlo.");
          return;
        }
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (x: any) => onToken(x.credential),
        });
        if (ref.current) {
          ref.current.innerHTML = "";
          window.google.accounts.id.renderButton(ref.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            shape: "pill",
            width: 280,
            locale: "cs",
          });
        }
        setError("");
      } catch (e: any) {
        setError(e.message);
      }
    };
    if (window.google?.accounts?.id) init();
    else {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://accounts.google.com/gsi/client";
      s.onload = init;
      s.onerror = () => setError("Nelze načíst Google přihlášení.");
      document.body.appendChild(s);
    }
    return () => {
      active = false;
    };
  }, [onToken]);
  return (
    <div className="live-login">
      <div className="live-login-card panel">
        <span className="brand-mark">
          <I name="gift" />
        </span>
        <h1>Dárkovník</h1>
        <p>Přání, dárky a překvapení na jednom místě.</p>
        <div ref={ref} className="live-google" />
        {(error || problem) && (
          <p className="live-error" role="alert">
            {error || problem}
          </p>
        )}
      </div>
    </div>
  );
}
declare global {
  interface Window {
    google?: any;
  }
}
export default function LiveApp() {
  const [token, setToken] = useState(() => session());
  const [data, setData] = useState<any>(() => readCached(session()));
  const [firstLoad, setFirstLoad] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [screen, setScreen] = useState<Screen>("overview");
  const [modal, setModal] = useState<ModalName>(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    try {
      return (localStorage.getItem("darkovnik_theme") || "system") as any;
    } catch {
      return "system";
    }
  });
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [personId, setPersonId] = useState("");
  const [draft, setDraft] = useState<any>(emptyGift());
  const [current, setCurrent] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [reserveGroup, setReserveGroup] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [groupDraft, setGroupDraft] = useState<any>({});
  const [shareIds, setShareIds] = useState<string[]>([]);
  const [eventDraft, setEventDraft] = useState<any>({
    name: "",
    date: "",
    repeatYearly: true,
    groupId: "",
    userId: "",
  });
  const [showReceived, setShowReceived] = useState(false);
  const [ownStatus, setOwnStatus] = useState<any>(null);
  const [messageTarget, setMessageTarget] = useState<any>(null);
  const [unread, setUnread] = useState(0);
  const [messagesKey, setMessagesKey] = useState(0);
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [calendarView, setCalendarView] = useState<"month" | "agenda">("month");
  const [wishFilter, setWishFilter] = useState<"all" | "active" | "done">(
    "all",
  );
  const [savingImage, setSavingImage] = useState(false);
  const lastSync = useRef(0),
    syncingRef = useRef(false);
  useEffect(() => {
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const change = () =>
      document.documentElement.classList.toggle(
        "dark",
        theme === "dark" || (theme === "system" && system.matches),
      );
    change();
    system.addEventListener("change", change);
    try {
      localStorage.setItem("darkovnik_theme", theme);
    } catch {}
    return () => system.removeEventListener("change", change);
  }, [theme]);
  useEffect(() => {
    const x = () => setOffline(!navigator.onLine);
    addEventListener("online", x);
    addEventListener("offline", x);
    return () => {
      removeEventListener("online", x);
      removeEventListener("offline", x);
    };
  }, []);
  const refresh = useCallback(
    async (t = token, quiet = false) => {
      if (!t || syncingRef.current) return;
      if (!quiet) setSyncing(true);
      syncingRef.current = true;
      try {
        const result = await call("dashboard", t);
        setData(result);
        writeCached(t, result);
        lastSync.current = Date.now();
        setError("");
        return result;
      } catch (e: any) {
        if (!readCached(t)) setError(e.message || "Nepodařilo se načíst data.");
        if (/relace|neplatn|vypršel|přihlaste/i.test(e.message || "")) {
          clearCached(t);
          setSession("");
          setToken("");
          setData(null);
        }
        return null;
      } finally {
        setFirstLoad(false);
        setSyncing(false);
        syncingRef.current = false;
      }
    },
    [token],
  );
  useEffect(() => {
    initBridge();
    if (!token) {
      setFirstLoad(false);
      return;
    }
    refresh(token, true);
  }, []);
  useEffect(() => {
    if (!token) return;
    const fn = () => {
      if (
        navigator.onLine &&
        document.visibilityState === "visible" &&
        Date.now() - lastSync.current > 45000
      )
        refresh(token, true);
    };
    document.addEventListener("visibilitychange", fn);
    window.addEventListener("online", fn);
    return () => {
      document.removeEventListener("visibilitychange", fn);
      window.removeEventListener("online", fn);
    };
  }, [token, refresh]);
  const loadUnread = useCallback(() => {
    if (!token || !navigator.onLine) return;
    call("messageUnreadCount", token)
      .then((x: any) => setUnread(Number(x.count) || 0))
      .catch(() => {});
  }, [token]);
  useEffect(() => {
    loadUnread();
    const timer = setInterval(loadUnread, 90000);
    return () => clearInterval(timer);
  }, [loadUnread, messagesKey]);
  const signIn = useCallback(async (id: string) => {
    setBusy(true);
    setError("");
    try {
      const r: any = await call("signInWithGoogle", id);
      setSession(r.sessionToken);
      setToken(r.sessionToken);
      const result = await call("dashboard", r.sessionToken);
      setData(result);
      writeCached(r.sessionToken, result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
      setFirstLoad(false);
    }
  }, []);
  const mutate = async (fn: () => Promise<any>, after?: () => void) => {
    if (offline) {
      setError("Bez připojení nelze ukládat změny.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await fn();
      await refresh(token, true);
      after?.();
      setNotice("Změny byly uloženy.");
      setTimeout(() => setNotice(""), 4000);
    } catch (e: any) {
      setError(e.message || "Uložení selhalo.");
    } finally {
      setBusy(false);
    }
  };
  const logout = () => {
    const t = token;
    clearCached(t);
    setSession("");
    setToken("");
    setData(null);
    setScreen("overview");
    call("logoutSession", t).catch(() => {});
  };
  const groups: any[] = data?.groups || [],
    own: any[] = data?.myGifts || [],
    visible: any[] = data?.visibleGifts || [],
    reservations: any[] = data?.myReservations || [],
    events: any[] = data?.events || [],
    alerts: any[] = data?.alerts || [];
  const selectedGroup = groups.find((g) => g.id === groupId),
    person = selectedGroup?.members?.find((m: any) => m.id === personId);

  useEffect(() => {
    setPersonId("");

    if (groups.length === 1) {
      setGroupId(groups[0].id);
    } else {
      setGroupId("");
    }
  }, [groups.length, groups.length === 1 ? groups[0]?.id : null]);

  const go = (s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const newGift = (g?: any) => {
    setDraft(
      g
        ? { ...g, groupIds: [...(g.groupIds || [])] }
        : { ...emptyGift(), groupIds: groups.map((x) => x.id) },
    );
    setCurrent(g || null);
    setModal("gift");
  };
  const startMessage = (target: any) => {
    setMessageTarget(target);
    setMessagesKey((x) => x + 1);
    go("messages");
  };
  const openGroupSettings = (g: any) => {
    let holidaysSelected = [];
    try {
      holidaysSelected = JSON.parse(g.holidaysSelected || "[]");
    } catch {}
    setGroupDraft({
      ...g,
      birthdaysEnabled: String(g.birthdaysEnabled).toLowerCase() !== "false",
      namedaysEnabled: bool(g.namedaysEnabled),
      easterEnabled: bool(g.easterEnabled),
      holidaysSelected,
    });
    setModal("groupSettings");
  };
  const openEvent = (e?: any) => {
    setEventDraft(
      e
        ? { ...e, repeatYearly: bool(e.repeatYearly) }
        : {
            name: "",
            date: "",
            repeatYearly: true,
            groupId: groups.find((g) => g.role === "admin")?.id || "",
            userId: "",
          },
    );
    setModal("event");
  };
  const openReservation = (g: any) => {
    setCurrent(g);
    setQuantity(1);
    setReserveGroup(
      (g.groupIds || []).find((id: string) =>
        groups.some((x) => x.id === id),
      ) || "",
    );
    setModal("reserve");
  };
  const changeOwnStatus = async () => {
    if (ownStatus) {
      setOwnStatus(null);
      return;
    }
    setBusy(true);
    try {
      setOwnStatus(await call("ownGiftStatuses", token));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const listEvents = useMemo(
    () =>
      events
        .map((e: any) => ({ ...e, shownDate: dateForYear(e, year) }))
        .filter((e: any) =>
          e.shownDate.startsWith(
            `${year}-${String(month + 1).padStart(2, "0")}`,
          ),
        )
        .sort((a: any, b: any) => a.shownDate.localeCompare(b.shownDate)),
    [events, year, month],
  );
  const showEvent = (e: any) => {
    const d = new Date(e.shownDate + "T12:00:00");
    return (
      <article className="event-row" key={e.id}>
        <div className="date-block">
          <strong>{d.getDate()}</strong>
          <span>
            {d
              .toLocaleDateString("cs-CZ", { month: "short" })
              .replace(".", "")
              .toUpperCase()}
          </span>
        </div>
        <Avatar name={e.name} />
        <div className="event-copy">
          <strong>{e.name}</strong>
          <span>
            {groups.find((g) => g.id === e.groupId)?.name || "Skupina"}
          </span>
        </div>
        <span className={"status-pill event-kind-" + eventType(e)}>
          {eventText(e)}
        </span>
        {!e.automatic &&
          groups.find((g) => g.id === e.groupId)?.role === "admin" && (
            <button
              className="live-icon"
              onClick={() => openEvent(e)}
              aria-label="Upravit událost"
            >
              <I name="more" />
            </button>
          )}
      </article>
    );
  };
  if ((firstLoad && token && !data) || (busy && !data))
    return (
      <div className="live-loading" role="status" aria-live="polite">
        <span className="brand-mark">
          <I name="gift" />
        </span>
        <span className="live-spinner" />
        <h2>
          {busy ? "Přihlašuji a načítám data…" : "Načítám tvůj Dárkovník…"}
        </h2>
        <p>Chvíli ověřujeme účet a připravujeme tvá přání.</p>
      </div>
    );
  if (!data)
    return (
      <Login
        onToken={signIn}
        problem={error || (!GAS_URL ? "Chybí VITE_GAS_URL." : "")}
      />
    );
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Přeskočit na obsah
      </a>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <I name="gift" size={21} />
          </span>
          <strong>Dárkovník</strong>
          <button
            className="sidebar-notifications live-icon"
            onClick={() => setModal("alerts")}
            aria-label="Oznámení"
          >
            <I name="bell" />
            {alerts.some((a) => !a.readAt) && <i>!</i>}
          </button>
        </div>
        <nav aria-label="Hlavní navigace">
          {NAV.map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={screen === id ? "active" : ""}
            >
              <I name={icon} />
              <span>{label}</span>
              {id === "messages" && unread > 0 && <b>{unread}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className="theme-toggle"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            <I name="moon" />
            <span>{theme === "dark" ? "Světlý režim" : "Tmavý režim"}</span>
          </button>
          <button className="profile-chip" onClick={() => go("profile")}>
            <Avatar name={data.profile.name} avatar={data.profile.avatar} />
            <span>
              <strong>{data.profile.name}</strong>
              <small>{data.profile.email}</small>
            </span>
            <I name="more" />
          </button>
        </div>
      </aside>
      <div className="content-shell">
        <header className="mobile-header">
          <div className="brand">
            <span className="brand-mark">
              <I name="gift" />
            </span>
            <strong>Dárkovník</strong>
          </div>
          <div className="mobile-header-actions">
            <button onClick={() => setModal("alerts")} aria-label="Oznámení">
              <I name="bell" />
            </button>
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              aria-label="Přepnout motiv"
            >
              <I name="moon" />
            </button>
            <button onClick={() => go("profile")} aria-label="Profil">
              <I name="user" />
            </button>
          </div>
        </header>
        {offline && (
          <div className="offline-banner">
            <I name="link" /> Jste offline. Zobrazujeme naposledy uložená data,
            změny nejsou dostupné.
          </div>
        )}
        {syncing && <p className="live-sync">Aktualizuji údaje…</p>}
        <main id="main-content">
          <div className="page">
            {data?.profile &&
              groups.length === 0 &&
              own.length === 0 &&
              !welcomeDismissed &&
              !localStorage.getItem("darkovnik_welcome_" + data.profile.id) && (
                <section
                  className="panel live-welcome"
                  aria-label="První spuštění"
                >
                  <span className="eyebrow">VÍTEJ V DÁRKOVNÍKU</span>
                  <h2>Začni svým prvním přáním</h2>
                  <p>
                    Vytvoř seznam přání, sdílej ho s blízkými a rezervace
                    ostatních necháme jako překvapení.
                  </p>
                  <div>
                    <Btn
                      onClick={() => {
                        setWelcomeDismissed(true);
                        localStorage.setItem(
                          "darkovnik_welcome_" + data.profile.id,
                          "1",
                        );
                        newGift();
                      }}
                    >
                      Přidat přání
                    </Btn>
                    <Btn
                      variant="secondary"
                      onClick={() => {
                        setWelcomeDismissed(true);
                        localStorage.setItem(
                          "darkovnik_welcome_" + data.profile.id,
                          "1",
                        );
                        setGroupDraft({ name: "" });
                        setModal("createGroup");
                      }}
                    >
                      Založit skupinu
                    </Btn>
                    <Btn
                      variant="ghost"
                      onClick={() => {
                        setWelcomeDismissed(true);
                        localStorage.setItem(
                          "darkovnik_welcome_" + data.profile.id,
                          "1",
                        );
                      }}
                    >
                      Přeskočit
                    </Btn>
                  </div>
                </section>
              )}
            {error && (
              <div className="live-error" role="alert">
                {error} <button onClick={() => setError("")}>Zavřít</button>
              </div>
            )}
            {notice && (
              <div className="live-notice" role="status">
                {notice}
              </div>
            )}
            {screen === "overview" && (
              <>
                <Header
                  eyebrow={new Date().toLocaleDateString("cs-CZ", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                  title={
                    vocative(data.profile.name)
                      ? "Ahoj, " + vocative(data.profile.name) + "!"
                      : "Ahoj!"
                  }
                  description="Co se blíží a co je potřeba zařídit?"
                >
                  <Btn icon="plus" onClick={() => newGift()}>
                    Přidat přání
                  </Btn>
                </Header>
                <div className="overview-grid">
                  <div className="main-column">
                    <SectionTitle
                      title="Blížící se události"
                      action="Celý kalendář"
                      onAction={() => go("calendar")}
                    />
                    <div className="event-list panel">
                      {events.length ? (
                        events
                          .map((e: any) => {
                            const y = new Date().getFullYear();
                            const d = { ...e, shownDate: dateForYear(e, y) };
                            const when = new Date(d.shownDate + "T12:00:00");
                            if (
                              bool(e.repeatYearly) &&
                              when < new Date(new Date().toDateString())
                            )
                              d.shownDate = dateForYear(e, y + 1);
                            return d;
                          })
                          .filter(
                            (e: any) =>
                              e.shownDate >=
                              new Date().toISOString().slice(0, 10),
                          )
                          .sort((a: any, b: any) =>
                            a.shownDate.localeCompare(b.shownDate),
                          )
                          .slice(0, 5)
                          .map(showEvent)
                      ) : (
                        <p className="live-pad">
                          Zatím žádné blížící se události.
                        </p>
                      )}
                    </div>
                    <SectionTitle title="Moje rezervace" />
                    {reservations.length ? (
                      <div className="reservation-grid">
                        {reservations.slice(0, 4).map((r: any) => (
                          <button
                            key={r.id}
                            className="reservation-card panel live-reservation"
                            onClick={() => {
                              setCurrent(r);
                              setQuantity(Number(r.quantity));
                              setModal("reservation");
                            }}
                          >
                            <div className="product-thumb live-small-image">
                              {r.image ? (
                                <img src={r.image} alt="" />
                              ) : (
                                <I name="gift" />
                              )}
                            </div>
                            <div>
                              <span className="micro-label">
                                PRO {r.personName}
                              </span>
                              <h3>{r.giftName}</h3>
                              <p>{r.quantity} ks</p>
                            </div>
                            <span className="reserved">
                              {r.status === "purchased"
                                ? "Nakoupeno"
                                : "Rezervováno"}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <Empty
                        title="Žádné rezervace"
                        description="Dárky pro ostatní najdeš ve skupinách."
                      />
                    )}
                  </div>
                  <aside className="side-column">
                    <SectionTitle title="Rychlé akce" />
                    <div className="quick-actions panel">
                      {[
                        [
                          "heart",
                          "Nové přání",
                          "Přidat na seznam",
                          () => newGift(),
                        ],
                        [
                          "users",
                          "Nová skupina",
                          "Pro rodinu nebo přátele",
                          () => {
                            setGroupDraft({ name: "", description: "" });
                            setModal("createGroup");
                          },
                        ],
                        [
                          "calendar",
                          "Přidat událost",
                          "Výročí a oslavy",
                          () => openEvent(),
                        ],
                      ].map(([icon, title, desc, fn]: any) => (
                        <button key={title} onClick={fn}>
                          <span>
                            <I name={icon} />
                          </span>
                          <div>
                            <strong>{title}</strong>
                            <small>{desc}</small>
                          </div>
                          <I name="chevron" size={16} />
                        </button>
                      ))}
                    </div>
                    <SectionTitle
                      title="Nové zprávy"
                      action="Otevřít zprávy"
                      onAction={() => go("messages")}
                    />
                    <button
                      className="message-preview panel live-message-preview"
                      onClick={() => go("messages")}
                    >
                      <div className="anonymous-mark">
                        <I name="message" />
                      </div>
                      <div>
                        <strong>
                          {unread
                            ? `${unread} nepřečtených zpráv`
                            : "Anonymní zprávy"}
                        </strong>
                        <p>
                          {unread
                            ? "Někdo ti napsal."
                            : "Zeptej se ostatních, aniž bys prozradil/a překvapení."}
                        </p>
                      </div>
                    </button>
                  </aside>
                </div>
              </>
            )}
            {screen === "wishes" && (
              <>
                <Header
                  eyebrow="SEZNAM PŘÁNÍ"
                  title="Moje přání"
                  description="Věci, které by ti udělaly radost."
                >
                  <Btn icon="plus" onClick={() => newGift()}>
                    Přidat přání
                  </Btn>
                </Header>
                <div className="toolbar">
                  <div className="tabs">
                    {(
                      [
                        ["all", "Všechna"],
                        ["active", "Aktivní"],
                        ["done", "Obdržená"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        className={wishFilter === id ? "active" : ""}
                        onClick={() => setWishFilter(id)}
                      >
                        {label}{" "}
                        <span>
                          {id === "all"
                            ? own.length
                            : own.filter((g) =>
                                id === "done"
                                  ? Number(g.receivedQuantity) >=
                                    Number(g.quantity)
                                  : Number(g.receivedQuantity) <
                                    Number(g.quantity),
                              ).length}
                        </span>
                      </button>
                    ))}
                  </div>
                  <Btn variant="ghost" onClick={changeOwnStatus}>
                    {ownStatus ? "Skrýt rezervace" : "Odhalit rezervace"}
                  </Btn>
                </div>
                {ownStatus && (
                  <div className="live-notice">
                    Zobrazuješ souhrn rezervací svých přání. Identita kupujících
                    zůstává skrytá.
                  </div>
                )}
                <div className="product-grid">
                  {own
                    .filter(
                      (g) =>
                        wishFilter === "all" ||
                        (wishFilter === "done"
                          ? Number(g.receivedQuantity) >= Number(g.quantity)
                          : Number(g.receivedQuantity) < Number(g.quantity)),
                    )
                    .map((g) => (
                      <div key={g.id}>
                        <Product
                          g={g}
                          owner
                          groups={groups}
                          onEdit={() => newGift(g)}
                          onReceive={() => {
                            setCurrent(g);
                            setQuantity(Number(g.receivedQuantity) || 0);
                            setModal("received");
                          }}
                          onReserve={() => {}}
                          onMessage={() => {}}
                          onManage={() => {}}
                        />
                        {ownStatus && (
                          <p className="live-caption">
                            Rezervováno: {ownStatus[g.id]?.reserved || 0} ks ·
                            Nakoupeno: {ownStatus[g.id]?.purchased || 0} ks
                          </p>
                        )}
                      </div>
                    ))}
                  <button className="add-card" onClick={() => newGift()}>
                    <span>
                      <I name="plus" />
                    </span>
                    <strong>Přidat další přání</strong>
                    <small>Vlož odkaz nebo přidej ručně</small>
                  </button>
                </div>
              </>
            )}
            {screen === "groups" && (
              <>
                <Header
                  eyebrow="SPOLEČNÉ SEZNAMY"
                  title={
                    person ? person.name : selectedGroup?.name || "Moje skupiny"
                  }
                  description={
                    selectedGroup
                      ? `${selectedGroup.members.length} členů · ${selectedGroup.role === "admin" ? "Spravuješ skupinu" : "Jsi členem skupiny"}`
                      : "Přání rodiny a přátel."
                  }
                >
                  {groups.length > 1 && selectedGroup && (
                    <Btn
                      variant="secondary"
                      onClick={() => {
                        setGroupId("");
                        setPersonId("");
                      }}
                    >
                      Všechny skupiny
                    </Btn>
                  )}

                  <Btn
                    icon="plus"
                    onClick={() => {
                      setGroupDraft({
                        name: "",
                        description: "",
                      });
                      setModal("createGroup");
                    }}
                  >
                    Nová skupina
                  </Btn>
                </Header>
                {!selectedGroup ? (
                  <div className="live-group-grid">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        className="panel live-group-card"
                        onClick={() => {
                          setGroupId(g.id);
                          setPersonId("");
                        }}
                      >
                        <div className="group-symbol">
                          <I name="users" size={27} />
                        </div>
                        <h2>{g.name}</h2>
                        <p>{g.description || "Společný seznam přání"}</p>
                        <span>
                          {g.members.length} členů ·{" "}
                          {g.role === "admin" ? "Správce" : "Člen"}
                        </span>
                      </button>
                    ))}
                    {groups.length === 0 && (
                      <Empty
                        title="Zatím žádná skupina"
                        description="Založ skupinu a pozvi svoje blízké."
                      />
                    )}
                  </div>
                ) : (
                  <>
                    {!person && (
                      <>
                        <div className="live-group-actions">
                          <Btn
                            variant="secondary"
                            onClick={() => {
                              setShareIds(
                                own
                                  .filter((g) => g.groupIds?.includes(groupId))
                                  .map((g) => g.id),
                              );
                              setModal("shares");
                            }}
                          >
                            Spravovat sdílení
                          </Btn>
                          {selectedGroup.role === "admin" && (
                            <>
                              <Btn
                                variant="secondary"
                                onClick={() => openGroupSettings(selectedGroup)}
                              >
                                Nastavení
                              </Btn>
                              <Btn
                                icon="plus"
                                onClick={() => {
                                  setInviteEmail("");
                                  setInviteRole("member");
                                  setModal("invite");
                                }}
                              >
                                Pozvat člena
                              </Btn>
                            </>
                          )}
                        </div>
                        <SectionTitle title="Členové skupiny" />
                        <div className="live-member-grid">
                          {selectedGroup.members.map((m: any) => (
                            <div key={m.id} className="panel live-member">
                              <button onClick={() => setPersonId(m.id)}>
                                <Avatar name={m.name} avatar={m.avatar} />
                                <span>
                                  <strong>
                                    {m.name}
                                    {m.id === data.profile.id ? " (ty)" : ""}
                                  </strong>
                                  <small>
                                    {m.role === "admin"
                                      ? "Administrátor"
                                      : "Člen"}
                                  </small>
                                </span>
                                <I name="chevron" />
                              </button>
                              {m.id !== data.profile.id && (
                                <Btn
                                  variant="ghost"
                                  onClick={() =>
                                    startMessage({
                                      userId: m.id,
                                      groupId,
                                      name: m.name,
                                    })
                                  }
                                >
                                  Anonymní zpráva
                                </Btn>
                              )}
                              {selectedGroup.ownerId === data.profile.id &&
                                m.id !== data.profile.id && (
                                  <select
                                    value={m.role}
                                    onChange={(e) =>
                                      mutate(() =>
                                        call(
                                          "setRole",
                                          token,
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
                        <SectionTitle title="Přání ostatních" />
                        <div className="product-grid">
                          {visible
                            .filter((g) => g.groupIds.includes(groupId))
                            .map((g) => (
                              <Product
                                key={g.id}
                                g={g}
                                owner={false}
                                groups={groups}
                                onEdit={() => {}}
                                onReceive={() => {}}
                                onReserve={() => openReservation(g)}
                                onMessage={() =>
                                  startMessage({
                                    userId: g.ownerId,
                                    groupId,
                                    giftId: g.id,
                                    giftName: g.name,
                                    name: g.ownerName,
                                  })
                                }
                                onManage={(r) => {
                                  setCurrent(r);
                                  setQuantity(Number(r.quantity));
                                  setModal("reservation");
                                }}
                              />
                            ))}
                        </div>
                        {!visible.some((g) => g.groupIds.includes(groupId)) && (
                          <Empty
                            title="Zatím žádná přání"
                            description="Až členové zveřejní své seznamy, uvidíš je tady."
                          />
                        )}
                      </>
                    )}
                    {person && (
                      <>
                        <button
                          className="live-back"
                          onClick={() => setPersonId("")}
                        >
                          ← Zpět ke skupině
                        </button>
                        <div className="product-grid">
                          {(person.id === data.profile.id ? own : visible)
                            .filter(
                              (g) =>
                                g.ownerId === person.id &&
                                g.groupIds?.includes(groupId),
                            )
                            .map((g) => (
                              <Product
                                key={g.id}
                                g={g}
                                owner={person.id === data.profile.id}
                                groups={groups}
                                onEdit={() => newGift(g)}
                                onReceive={() => {
                                  setCurrent(g);
                                  setQuantity(Number(g.receivedQuantity) || 0);
                                  setModal("received");
                                }}
                                onReserve={() => openReservation(g)}
                                onMessage={() =>
                                  startMessage({
                                    userId: g.ownerId,
                                    groupId,
                                    giftId: g.id,
                                    giftName: g.name,
                                    name: g.ownerName,
                                  })
                                }
                                onManage={(r) => {
                                  setCurrent(r);
                                  setQuantity(Number(r.quantity));
                                  setModal("reservation");
                                }}
                              />
                            ))}
                        </div>
                        {person.id !== data.profile.id && (
                          <Btn
                            variant="secondary"
                            onClick={() =>
                              startMessage({
                                userId: person.id,
                                groupId,
                                name: person.name,
                              })
                            }
                          >
                            Poslat anonymní zprávu
                          </Btn>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}
            {screen === "calendar" && (
              <>
                <Header
                  eyebrow="CO SE BLÍŽÍ"
                  title="Kalendář"
                  description="Narozeniny, svátky a další příležitosti."
                >
                  {groups.some((g) => g.role === "admin") && (
                    <Btn icon="plus" onClick={() => openEvent()}>
                      Přidat událost
                    </Btn>
                  )}
                </Header>
                <div className="live-calendar-controls">
                  <Btn
                    variant="ghost"
                    onClick={() => {
                      if (month === 0) {
                        setMonth(11);
                        setYear((y) => y - 1);
                      } else setMonth((m) => m - 1);
                    }}
                  >
                    ‹
                  </Btn>
                  <h2>
                    {new Date(year, month, 1).toLocaleDateString("cs-CZ", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>
                  <Btn
                    variant="ghost"
                    onClick={() => {
                      if (month === 11) {
                        setMonth(0);
                        setYear((y) => y + 1);
                      } else setMonth((m) => m + 1);
                    }}
                  >
                    ›
                  </Btn>
                  <div className="tabs">
                    <button
                      className={calendarView === "month" ? "active" : ""}
                      onClick={() => setCalendarView("month")}
                    >
                      Měsíc
                    </button>
                    <button
                      className={calendarView === "agenda" ? "active" : ""}
                      onClick={() => setCalendarView("agenda")}
                    >
                      Seznam
                    </button>
                  </div>
                </div>
                {calendarView === "month" && (
                  <div className="live-calendar-grid panel">
                    {["Po", "Út", "St", "Čt", "Pá", "So", "Ne"].map((x) => (
                      <span key={x} className="live-calendar-label">
                        {x}
                      </span>
                    ))}
                    {Array.from(
                      { length: (new Date(year, month, 1).getDay() + 6) % 7 },
                      (_, i) => (
                        <span key={"offset" + i} />
                      ),
                    )}
                    {Array.from(
                      { length: new Date(year, month + 1, 0).getDate() },
                      (_, i) => {
                        const day = i + 1,
                          occ = listEvents.filter(
                            (x: any) =>
                              Number(x.shownDate.slice(8, 10)) === day,
                          );
                        return (
                          <div key={day} className="live-cal-day">
                            <b>{day}</b>
                            {occ.slice(0, 2).map((x: any) => (
                              <span
                                key={x.id}
                                className={
                                  "status-pill event-kind-" + eventType(x)
                                }
                                title={eventText(x) + ": " + x.name}
                              >
                                {x.name}
                              </span>
                            ))}
                            {occ.length > 2 && <small>+{occ.length - 2}</small>}
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
                <div className="event-legend">
                  {(
                    [
                      "birthday",
                      "nameday",
                      "holiday",
                      "giftHoliday",
                      "custom",
                    ] as const
                  ).map((k) => (
                    <span key={k} className={"event-kind-" + k}>
                      {
                        {
                          birthday: "Narozeniny",
                          nameday: "Jmeniny",
                          holiday: "Svátek",
                          giftHoliday: "Svátek s dárky",
                          custom: "Vlastní",
                        }[k]
                      }
                    </span>
                  ))}
                </div>
                <SectionTitle title="Události v měsíci" />
                <div className="event-list panel">
                  {listEvents.length ? (
                    listEvents.map(showEvent)
                  ) : (
                    <p className="live-pad">Žádné události v tomto měsíci.</p>
                  )}
                </div>
              </>
            )}
            {screen === "messages" && (
              <LiveMessages
                key={messagesKey}
                token={token}
                initialTarget={messageTarget}
                onClearTarget={() => setMessageTarget(null)}
                offline={offline}
                onUnread={loadUnread}
              />
            )}
            {screen === "profile" && (
              <>
                <Header
                  eyebrow="OSOBNÍ ÚČET"
                  title="Profil"
                  description="Spravuj osobní údaje, vzhled aplikace a přihlášení."
                />
                <div className="profile-redesign">
                  <aside className="panel profile-summary">
                    <Avatar
                      name={data.profile.name}
                      avatar={data.profile.avatar}
                      size="xl"
                    />
                    <label className="profile-avatar-upload">
                      {savingImage ? "Zpracovávám…" : "Změnit fotografii"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={savingImage || offline}
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setSavingImage(true);
                          try {
                            const avatar = await uploadWebP(token, f);
                            await mutate(() =>
                              call("saveProfile", token, {
                                name: data.profile.name,
                                birthday: data.profile.birthday || "",
                                avatar,
                              }),
                            );
                          } catch (err: any) {
                            setError(err.message || "Fotografii nelze uložit.");
                          } finally {
                            setSavingImage(false);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                    <h2>{data.profile.name}</h2>
                    <p>{data.profile.email}</p>
                    <span className="profile-member-since">
                      Člen od{" "}
                      {new Date(
                        data.profile.createdAt || Date.now(),
                      ).toLocaleDateString("cs-CZ", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <div className="profile-stats">
                      <div>
                        <strong>{own.length}</strong>
                        <small>Přání</small>
                      </div>
                      <div>
                        <strong>{groups.length}</strong>
                        <small>Skupiny</small>
                      </div>
                      <div>
                        <strong>{reservations.length}</strong>
                        <small>Rezervace</small>
                      </div>
                    </div>
                  </aside>
                  <div className="profile-right">
                    <section className="panel profile-detail">
                      <h2>
                        <I name="user" /> Osobní údaje
                      </h2>
                      <p>Tyto informace se zobrazují členům tvých skupin.</p>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const f = new FormData(e.currentTarget);
                          mutate(() =>
                            call("saveProfile", token, {
                              name: f.get("name"),
                              birthday: f.get("birthday"),
                              avatar: data.profile.avatar || "",
                            }),
                          );
                        }}
                      >
                        <Field title="Jméno a příjmení">
                          <input
                            name="name"
                            defaultValue={data.profile.name}
                            required
                            maxLength={80}
                          />
                        </Field>
                        <Field title="E-mail">
                          <input value={data.profile.email} readOnly />
                        </Field>
                        <Field title="Datum narození">
                          <input
                            type="date"
                            name="birthday"
                            defaultValue={data.profile.birthday || ""}
                          />
                        </Field>
                        <div className="live-form-actions">
                          <Btn type="submit" disabled={busy || offline}>
                            Uložit profil
                          </Btn>
                        </div>
                      </form>
                    </section>
                    <section className="panel profile-detail">
                      <h2>
                        <I name="moon" /> Vzhled aplikace
                      </h2>
                      <p>Vyber motiv, který ti nejlépe vyhovuje.</p>
                      <div className="profile-theme-choices">
                        {(
                          [
                            ["light", "Světlý", "Jasné a čisté rozhraní"],
                            ["dark", "Tmavý", "Příjemný pro oči večer"],
                            [
                              "system",
                              "Podle systému",
                              "Přizpůsobí se zařízení",
                            ],
                          ] as const
                        ).map(([value, label, desc]) => (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={theme === value}
                            className={theme === value ? "selected" : ""}
                            onClick={() => setTheme(value)}
                          >
                            <I
                              name={
                                value === "dark"
                                  ? "moon"
                                  : value === "light"
                                    ? "sun"
                                    : "settings"
                              }
                            />
                            <span>
                              <strong>{label}</strong>
                              <small>{desc}</small>
                            </span>
                            {theme === value && <I name="check" />}
                          </button>
                        ))}
                      </div>
                    </section>
                    <section className="panel profile-detail">
                      <h2>Účet</h2>
                      <p>
                        Odhlášením ukončíš aktuální relaci na tomto zařízení.
                      </p>
                      <Btn variant="secondary" onClick={logout}>
                        Odhlásit se
                      </Btn>
                    </section>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Mobilní navigace">
        {NAV.map(([id, label, icon]) => (
          <button
            key={id}
            className={screen === id ? "active" : ""}
            onClick={() => go(id)}
          >
            <span>
              <I name={icon} size={20} />
              {id === "messages" && unread > 0 && <i />}
            </span>
            <small>{label === "Moje přání" ? "Přání" : label}</small>
          </button>
        ))}
      </nav>
      {modal === "gift" && (
        <Dialog
          title={current ? "Upravit přání" : "Nové přání"}
          eyebrow="PŘIDAT NA SEZNAM"
          wide
          onClose={() => setModal(null)}
        >
          <form
            className="wish-redesign-form"
            onSubmit={(e) => {
              e.preventDefault();
              mutate(
                () => call("saveGift", token, draft),
                () => setModal(null),
              );
            }}
          >
            <div className="wish-form-grid">
              <div className="wish-form-main">
                <Field title="Odkaz na produkt">
                  <div className="wish-link-row">
                    <input
                      type="url"
                      value={draft.url}
                      onChange={(e) =>
                        setDraft((d: any) => ({ ...d, url: e.target.value }))
                      }
                      placeholder="https://obchod.cz/produkt"
                    />
                    <Btn
                      variant="secondary"
                      disabled={!draft.url || busy}
                      onClick={async () => {
                        setBusy(true);
                        setError("");
                        try {
                          const x: any = await call(
                            "fetchProduct",
                            token,
                            draft.url,
                          );
                          setDraft((d: any) => ({
                            ...d,
                            name: d.name || x.name || "",
                            price: d.price || String(x.price || ""),
                            image: d.image || x.image || "",
                          }));
                        } catch (err: any) {
                          setError(
                            err.message || "Nepodařilo se načíst produkt.",
                          );
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Načíst
                    </Btn>
                  </div>
                </Field>
                <Field title="Název přání *">
                  <input
                    required
                    maxLength={160}
                    value={draft.name}
                    placeholder="Co by ti udělalo radost?"
                    onChange={(e) =>
                      setDraft((d: any) => ({ ...d, name: e.target.value }))
                    }
                  />
                </Field>
                <div className="wish-inline-fields">
                  <Field title="Cena (Kč) – nepovinná">
                    <div className="wish-price">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={draft.price}
                        placeholder="0"
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9,.]/g, "");
                          if (/^\d*(?:[.,]\d{0,2})?$/.test(v))
                            setDraft((d: any) => ({ ...d, price: v }));
                        }}
                      />
                      <span>Kč</span>
                    </div>
                  </Field>
                  <Field title="Počet kusů">
                    <Qty
                      value={Number(draft.quantity)}
                      onChange={(v) =>
                        setDraft((d: any) => ({ ...d, quantity: v }))
                      }
                    />
                  </Field>
                </div>
                <Field title="Priorita">
                  <select
                    value={draft.priority || "none"}
                    onChange={(e) =>
                      setDraft((d: any) => ({ ...d, priority: e.target.value }))
                    }
                  >
                    <option value="none">Bez priority</option>
                    <option value="low">Nízká</option>
                    <option value="medium">Střední</option>
                    <option value="high">Vysoká</option>
                  </select>
                </Field>
                <Field title="Poznámka">
                  <textarea
                    maxLength={1000}
                    rows={4}
                    value={draft.notes || ""}
                    onChange={(e) =>
                      setDraft((d: any) => ({ ...d, notes: e.target.value }))
                    }
                    placeholder="Barva, velikost nebo cokoliv, co pomůže s výběrem…"
                  />
                  <small className="wish-counter">
                    {(draft.notes || "").length}/1000
                  </small>
                </Field>
              </div>
              <div className="wish-form-side">
                <div className="wish-image-field">
                  <span className="wish-section-label">Obrázek produktu</span>
                  <label className="wish-upload-zone">
                    {draft.image ? (
                      <img src={draft.image} alt="Náhled obrázku" />
                    ) : (
                      <>
                        <span className="wish-upload-plus">+</span>
                        <strong>
                          {savingImage
                            ? "Zpracovávám obrázek…"
                            : "Nahrát obrázek"}
                        </strong>
                        <small>Automatický převod do WebP</small>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={savingImage}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setSavingImage(true);
                        setError("");
                        try {
                          const image = await uploadWebP(token, f);
                          setDraft((d: any) => ({ ...d, image }));
                        } catch (err: any) {
                          setError(err.message);
                        } finally {
                          setSavingImage(false);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                  {draft.image && (
                    <Btn
                      variant="ghost"
                      onClick={() =>
                        setDraft((d: any) => ({ ...d, image: "" }))
                      }
                    >
                      Odebrat obrázek
                    </Btn>
                  )}
                  <p className="live-caption">
                    Obrázek převedeme do WebP, výsledná velikost nejvýše 8 MB.
                  </p>
                </div>
                <fieldset className="wish-share-list">
                  <legend>Sdílet se skupinami</legend>
                  <p className="live-caption">Vyber, kdo toto přání uvidí.</p>
                  {groups.map((g) => (
                    <label key={g.id}>
                      <input
                        type="checkbox"
                        checked={draft.groupIds.includes(g.id)}
                        onChange={(e) =>
                          setDraft((d: any) => ({
                            ...d,
                            groupIds: e.target.checked
                              ? [...d.groupIds, g.id]
                              : d.groupIds.filter((id: string) => id !== g.id),
                          }))
                        }
                      />
                      <span className="wish-group-badge">
                        <I name="users" size={17} />
                      </span>
                      <span className="wish-group-name">
                        <strong>{g.name}</strong>
                        <small>{g.members?.length || 0} členů</small>
                      </span>
                    </label>
                  ))}
                  {groups.length === 0 && (
                    <p className="live-caption">
                      Pro sdílení nejprve vytvoř skupinu.
                    </p>
                  )}
                </fieldset>
              </div>
            </div>
            <div className="wish-form-footer">
              {current && (
                <Btn
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm("Opravdu smazat přání?"))
                      mutate(
                        () => call("deleteGift", token, current.id),
                        () => setModal(null),
                      );
                  }}
                >
                  Smazat
                </Btn>
              )}
              <Btn variant="ghost" onClick={() => setModal(null)}>
                Zrušit
              </Btn>
              <Btn
                type="submit"
                disabled={busy || savingImage || offline}
                icon="check"
              >
                {busy ? "Ukládám…" : current ? "Uložit změny" : "Přidat přání"}
              </Btn>
            </div>
          </form>
        </Dialog>
      )}
      {modal === "reserve" && current && (
        <Dialog title="Rezervovat dárek" onClose={() => setModal(null)}>
          <div className="live-product-summary">
            <strong>{current.name}</strong>
            <span>
              {money(current.price)} · volné {current.available} ks
            </span>
          </div>
          <Field title="Počet kusů">
            <Qty
              value={quantity}
              max={Number(current.available) || 1}
              onChange={setQuantity}
            />
          </Field>
          {(current.groupIds || []).length > 1 && (
            <Field title="Skupina">
              <select
                value={reserveGroup}
                onChange={(e) => setReserveGroup(e.target.value)}
              >
                {current.groupIds.map((id: string) => (
                  <option key={id} value={id}>
                    {groups.find((g) => g.id === id)?.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <p className="live-caption">
            Majitel přání neuvidí, kdo rezervaci vytvořil.
          </p>
          <div className="live-form-actions">
            <Btn variant="secondary" onClick={() => setModal(null)}>
              Zrušit
            </Btn>
            <Btn
              disabled={busy || offline}
              onClick={() =>
                mutate(
                  () =>
                    call(
                      "reserveGift",
                      token,
                      current.id,
                      reserveGroup,
                      quantity,
                    ),
                  () => setModal(null),
                )
              }
            >
              Rezervovat
            </Btn>
          </div>
        </Dialog>
      )}
      {modal === "reservation" && current && (
        <Dialog title="Správa rezervace" onClose={() => setModal(null)}>
          <div className="live-product-summary">
            <strong>
              {current.giftName ||
                visible.find((g) => g.id === current.giftId)?.name}
            </strong>
            <span>
              Stav:{" "}
              {current.status === "purchased" ? "Nakoupeno" : "Rezervováno"} ·{" "}
              {current.quantity} ks
            </span>
          </div>
          <Field title="Kolik kusů změnit">
            <Qty
              value={quantity}
              max={Number(current.quantity)}
              onChange={setQuantity}
            />
          </Field>
          <div className="live-vertical-actions">
            <Btn
              disabled={busy || offline}
              onClick={() =>
                mutate(
                  () =>
                    call(
                      "updateReservation",
                      token,
                      current.id,
                      "purchased",
                      quantity,
                    ),
                  () => setModal(null),
                )
              }
            >
              Označit jako nakoupené
            </Btn>
            <Btn
              variant="secondary"
              disabled={busy || offline}
              onClick={() =>
                mutate(
                  () =>
                    call(
                      "updateReservation",
                      token,
                      current.id,
                      "reserved",
                      quantity,
                    ),
                  () => setModal(null),
                )
              }
            >
              Vrátit na rezervované
            </Btn>
            <Btn
              variant="ghost"
              disabled={busy || offline}
              onClick={() =>
                mutate(
                  () =>
                    call(
                      "updateReservation",
                      token,
                      current.id,
                      "cancel",
                      quantity,
                    ),
                  () => setModal(null),
                )
              }
            >
              Uvolnit rezervaci
            </Btn>
          </div>
        </Dialog>
      )}
      {modal === "received" && current && (
        <Dialog title="Kolik kusů už máš?" onClose={() => setModal(null)}>
          <p>Aktualizuj počet již obdržených kusů přání „{current.name}“.</p>
          <Field title="Celkový obdržený počet">
            <Qty
              min={0}
              max={Number(current.quantity)}
              value={quantity}
              onChange={setQuantity}
            />
          </Field>
          <div className="live-form-actions">
            <Btn variant="secondary" onClick={() => setModal(null)}>
              Zrušit
            </Btn>
            <Btn
              disabled={busy || offline}
              onClick={() =>
                mutate(
                  () => call("markReceived", token, current.id, quantity),
                  () => setModal(null),
                )
              }
            >
              Uložit
            </Btn>
          </div>
        </Dialog>
      )}
      {modal === "createGroup" && (
        <Dialog title="Nová skupina" onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutate(
                async () => {
                  const result: any = await call(
                    "createGroup",
                    token,
                    groupDraft.name,
                  );
                  setGroupId(result.id);
                  setPersonId("");
                  setGroupDraft({
                    id: result.id,
                    name: groupDraft.name,
                    description: "",
                    image: "",
                    birthdaysEnabled: true,
                    namedaysEnabled: false,
                    easterEnabled: false,
                    holidaysSelected: [],
                  });
                  go("groups");
                  return result;
                },
                () => {
                  setModal("groupSettings");
                },
              );
            }}
          >
            <Field title="Název skupiny">
              <input
                required
                minLength={2}
                maxLength={100}
                value={groupDraft.name || ""}
                onChange={(e) =>
                  setGroupDraft((v: any) => ({ ...v, name: e.target.value }))
                }
                placeholder="Například Rodina"
              />
            </Field>
            <p className="live-caption">
              Po vytvoření budeš správcem skupiny. Popis a události nastavíš v
              detailu.
            </p>
            <div className="live-form-actions">
              <Btn variant="secondary" onClick={() => setModal(null)}>
                Zrušit
              </Btn>
              <Btn type="submit" disabled={busy || offline}>
                Vytvořit skupinu
              </Btn>
            </div>
          </form>
        </Dialog>
      )}
      {modal === "groupSettings" && (
        <Dialog title="Nastavení skupiny" onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutate(
                () => call("updateGroup", token, groupDraft),
                () => setModal(null),
              );
            }}
          >
            <Field title="Název">
              <input
                required
                minLength={2}
                maxLength={100}
                value={groupDraft.name || ""}
                onChange={(e) =>
                  setGroupDraft((v: any) => ({ ...v, name: e.target.value }))
                }
              />
            </Field>
            <Field title="Popis">
              <textarea
                maxLength={800}
                value={groupDraft.description || ""}
                onChange={(e) =>
                  setGroupDraft((v: any) => ({
                    ...v,
                    description: e.target.value,
                  }))
                }
              />
            </Field>
            {[
              ["birthdaysEnabled", "Narozeniny"],
              ["namedaysEnabled", "Jmeniny"],
              ["easterEnabled", "Velikonoční pondělí"],
            ].map(([key, label]) => (
              <label key={key} className="live-toggle">
                <input
                  type="checkbox"
                  checked={!!groupDraft[key]}
                  onChange={(e) =>
                    setGroupDraft((v: any) => ({
                      ...v,
                      [key]: e.target.checked,
                    }))
                  }
                />
                {label}
              </label>
            ))}
            <fieldset className="live-checklist">
              <legend>Významné svátky</legend>
              {(data.holidayOptions || []).map((h: any) => {
                const id = h.id || h.key;
                return (
                  <label key={id}>
                    <input
                      type="checkbox"
                      checked={(groupDraft.holidaysSelected || []).includes(id)}
                      onChange={(e) =>
                        setGroupDraft((v: any) => ({
                          ...v,
                          holidaysSelected: e.target.checked
                            ? [...(v.holidaysSelected || []), id]
                            : (v.holidaysSelected || []).filter(
                                (x: string) => x !== id,
                              ),
                        }))
                      }
                    />
                    {h.name || h.title || id}
                  </label>
                );
              })}
            </fieldset>
            <div className="live-form-actions">
              <Btn variant="secondary" onClick={() => setModal(null)}>
                Zrušit
              </Btn>
              <Btn type="submit" disabled={busy || offline}>
                Uložit nastavení
              </Btn>
            </div>
          </form>
        </Dialog>
      )}
      {modal === "invite" && selectedGroup && (
        <Dialog title="Pozvat člena" onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutate(
                () =>
                  call(
                    "inviteMember",
                    token,
                    selectedGroup.id,
                    inviteEmail,
                    inviteRole,
                  ),
                () => setModal(null),
              );
            }}
          >
            <Field title="E-mail">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="jmeno@example.cz"
              />
            </Field>
            {selectedGroup.ownerId === data.profile.id && (
              <Field title="Role">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="member">Člen</option>
                  <option value="admin">Administrátor</option>
                </select>
              </Field>
            )}
            <p className="live-caption">
              Pozvánka platí 30 dní. Člen se přidá při přihlášení stejným Google
              účtem.
            </p>
            <div className="live-form-actions">
              <Btn variant="secondary" onClick={() => setModal(null)}>
                Zrušit
              </Btn>
              <Btn type="submit" disabled={busy || offline}>
                Odeslat pozvánku
              </Btn>
            </div>
          </form>
          {(selectedGroup.pendingInvites || []).length > 0 && (
            <div className="live-invites">
              <h3>Čekající pozvánky</h3>
              {selectedGroup.pendingInvites.map((i: any) => (
                <div key={i.id}>
                  <span>{i.email}</span>
                  <Btn
                    variant="ghost"
                    onClick={() =>
                      mutate(() => call("resendInvite", token, i.id))
                    }
                  >
                    Znovu poslat
                  </Btn>
                  <Btn
                    variant="ghost"
                    onClick={() =>
                      mutate(() => call("cancelInvite", token, i.id))
                    }
                  >
                    Zrušit
                  </Btn>
                </div>
              ))}
            </div>
          )}
        </Dialog>
      )}
      {modal === "shares" && selectedGroup && (
        <Dialog title="Sdílení přání" onClose={() => setModal(null)}>
          <p>
            Vyber přání, která mohou členové skupiny {selectedGroup.name} vidět.
          </p>
          <div className="live-checklist">
            {own.map((g) => (
              <label key={g.id}>
                <input
                  type="checkbox"
                  checked={shareIds.includes(g.id)}
                  onChange={(e) =>
                    setShareIds((v) =>
                      e.target.checked
                        ? [...v, g.id]
                        : v.filter((x) => x !== g.id),
                    )
                  }
                />
                <span>
                  {g.name} · {money(g.price)}
                </span>
              </label>
            ))}
          </div>
          <div className="live-form-actions">
            <Btn variant="secondary" onClick={() => setModal(null)}>
              Zrušit
            </Btn>
            <Btn
              disabled={busy || offline}
              onClick={() =>
                mutate(
                  () => call("setGroupShares", token, groupId, shareIds),
                  () => setModal(null),
                )
              }
            >
              Uložit sdílení
            </Btn>
          </div>
        </Dialog>
      )}
      {modal === "event" && (
        <Dialog
          title={eventDraft.id ? "Upravit událost" : "Nová událost"}
          onClose={() => setModal(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutate(
                () => call("saveEvent", token, eventDraft),
                () => setModal(null),
              );
            }}
          >
            <Field title="Název">
              <input
                required
                maxLength={110}
                value={eventDraft.name || ""}
                onChange={(e) =>
                  setEventDraft((v: any) => ({ ...v, name: e.target.value }))
                }
              />
            </Field>
            <Field title="Datum">
              <input
                required
                type="date"
                value={eventDraft.date || ""}
                onChange={(e) =>
                  setEventDraft((v: any) => ({ ...v, date: e.target.value }))
                }
              />
            </Field>
            <Field title="Skupina">
              <select
                required
                value={eventDraft.groupId}
                onChange={(e) =>
                  setEventDraft((v: any) => ({
                    ...v,
                    groupId: e.target.value,
                    userId: "",
                  }))
                }
              >
                {groups
                  .filter((g) => g.role === "admin")
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field title="Komu je událost určena">
              <select
                value={eventDraft.userId || ""}
                onChange={(e) =>
                  setEventDraft((v: any) => ({ ...v, userId: e.target.value }))
                }
              >
                <option value="">Všem členům</option>
                {groups
                  .find((g) => g.id === eventDraft.groupId)
                  ?.members?.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </Field>
            <label className="live-toggle">
              <input
                type="checkbox"
                checked={!!eventDraft.repeatYearly}
                onChange={(e) =>
                  setEventDraft((v: any) => ({
                    ...v,
                    repeatYearly: e.target.checked,
                  }))
                }
              />
              Opakovat každý rok
            </label>
            <div className="live-form-actions">
              {eventDraft.id && (
                <Btn
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm("Smazat událost?"))
                      mutate(
                        () => call("deleteEvent", token, eventDraft.id),
                        () => setModal(null),
                      );
                  }}
                >
                  Smazat
                </Btn>
              )}
              <Btn variant="secondary" onClick={() => setModal(null)}>
                Zrušit
              </Btn>
              <Btn type="submit" disabled={busy || offline}>
                Uložit událost
              </Btn>
            </div>
          </form>
        </Dialog>
      )}
      {modal === "alerts" && (
        <Dialog title="Oznámení" onClose={() => setModal(null)}>
          <div className="live-alert-list">
            {alerts.length ? (
              alerts.map((a) => (
                <button
                  key={a.id}
                  className={a.readAt ? "read" : ""}
                  onClick={() =>
                    mutate(() => call("markAlertRead", token, a.id))
                  }
                >
                  <strong>{a.readAt ? "Přečteno" : "Nové oznámení"}</strong>
                  <p>{a.message}</p>
                  <small>{shortDate(a.createdAt)}</small>
                </button>
              ))
            ) : (
              <p>Nemáš žádná oznámení.</p>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}

function LiveMessages({
  token,
  initialTarget,
  onClearTarget,
  offline,
  onUnread,
}: {
  token: string;
  initialTarget: any;
  onClearTarget: () => void;
  offline: boolean;
  onUnread: () => void;
}) {
  const [threads, setThreads] = useState<any[]>([]),
    [selected, setSelected] = useState(""),
    [history, setHistory] = useState<any[]>([]),
    [target, setTarget] = useState<any>(initialTarget),
    [draft, setDraft] = useState(""),
    [filter, setFilter] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [more, setMore] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setThreads(await call("conversations", token));
      setError("");
      onUnread();
    } catch (e: any) {
      setError(e.message);
    }
  }, [token, onUnread]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    if (initialTarget) {
      setTarget(initialTarget);
      setSelected("");
    }
  }, [initialTarget]);
  const open = async (id: string, offset = 0) => {
    setBusy(true);
    try {
      const x: any = await call("conversationMessages", token, id, 50, offset);
      setHistory((old) => (offset ? [...x.messages, ...old] : x.messages));
      setSelected(id);
      setTarget(null);
      setMore(x.hasMore);
      setError("");
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || offline || busy) return;
    setBusy(true);
    try {
      if (target) {
        const x: any = await call(
          "createConversation",
          token,
          target.userId,
          target.groupId,
          target.giftId || "",
          draft.trim(),
        );
        setTarget(null);
        onClearTarget();
        setDraft("");
        await open(x.id);
      } else {
        await call("sendMessage", token, selected, draft.trim());
        setDraft("");
        await open(selected);
      }
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const action = async (kind: string) => {
    if (!selected || offline) return;
    setBusy(true);
    try {
      await call("setConversationState", token, selected, kind);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const report = async () => {
    const reason = window.prompt("Proč tuto konverzaci nahlašuješ?");
    if (!reason?.trim()) return;
    try {
      await call("reportConversation", token, selected, reason);
      setError("Nahlášení bylo uloženo.");
    } catch (e: any) {
      setError(e.message);
    }
  };
  const item = threads.find((x) => x.id === selected);
  return (
    <div className="messages-page live-messages">
      <aside
        className={
          "conversation-list " + (selected || target ? "live-chat-open" : "")
        }
      >
        <div className="messages-heading">
          <div>
            <p className="eyebrow">SOUKROMÁ KOMUNIKACE</p>
            <h1>Zprávy</h1>
          </div>
          <button className="live-icon" onClick={refresh} aria-label="Obnovit">
            <I name="clock" />
          </button>
        </div>
        <label className="search">
          <I name="search" size={18} />
          <input
            placeholder="Hledat konverzaci"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
        <div className="conversation-items">
          {threads
            .filter((x) =>
              (x.recipientName + " " + x.giftName + " " + x.lastBody)
                .toLowerCase()
                .includes(filter.toLowerCase()),
            )
            .map((c) => (
              <button
                key={c.id}
                className={
                  "conversation " + (selected === c.id ? "selected" : "")
                }
                onClick={() => open(c.id)}
              >
                <span className="anonymous-mark">
                  <I name="message" />
                </span>
                <div>
                  <strong>
                    {c.isAnonymousSender ? c.recipientName : "Anonymní člen"}
                    {c.giftName ? " · " + c.giftName : ""}
                  </strong>
                  <p>{c.lastBody || "Nová konverzace"}</p>
                </div>
                <span>{shortDate(c.lastAt)}</span>
                {c.unread > 0 && <b>{c.unread}</b>}
              </button>
            ))}
          {threads.length === 0 && (
            <p className="live-pad">
              Žádné konverzace. Začni dotazem u přání nebo člena skupiny.
            </p>
          )}
        </div>
        <div className="anonymous-info">
          <I name="message" />
          <p>
            <strong>Chraň překvapení</strong>
            <span>Příjemce zprávy nevidí tvoji identitu ani rezervace.</span>
          </p>
        </div>
      </aside>
      <section
        className={"chat " + (selected || target ? "live-chat-open" : "")}
      >
        <header className="chat-header">
          <button
            className="mobile-back live-icon"
            onClick={() => {
              setSelected("");
              setTarget(null);
              onClearTarget();
            }}
            aria-label="Zpět"
          >
            <I name="arrow" />
          </button>
          <span className="anonymous-mark">
            <I name="message" />
          </span>
          <div>
            <strong>
              {target
                ? "Nová anonymní zpráva"
                : item
                  ? item.isAnonymousSender
                    ? item.recipientName
                    : "Anonymní člen"
                  : "Vyber konverzaci"}
            </strong>
            <span>
              {target?.giftName ||
                item?.giftName ||
                item?.groupName ||
                "Soukromá komunikace"}
            </span>
          </div>
          {item && (
            <div className="live-chat-actions">
              {item.closed && !item.blocked && (
                <Btn variant="ghost" onClick={() => action("reopen")}>
                  Otevřít
                </Btn>
              )}
              {!item.closed && (
                <Btn variant="ghost" onClick={() => action("close")}>
                  Uzavřít
                </Btn>
              )}
              {!item.isAnonymousSender && !item.blocked && (
                <Btn variant="ghost" onClick={() => action("block")}>
                  Blokovat
                </Btn>
              )}
              <Btn variant="ghost" onClick={report}>
                Nahlásit
              </Btn>
            </div>
          )}
        </header>
        {error && (
          <div className="live-error" role="alert">
            {error}
          </div>
        )}
        <div className="chat-body">
          {target && (
            <div className="live-chat-intro">
              <I name="message" size={32} />
              <h3>Nový anonymní dotaz</h3>
              <p>
                Příjemce neuvidí tvoje jméno. Podle obsahu ale může poznat, kdo
                píše.
              </p>
            </div>
          )}
          {!target && !item && (
            <div className="live-chat-intro">
              <I name="message" size={32} />
              <h3>Vyber konverzaci</h3>
            </div>
          )}
          {more && (
            <Btn variant="ghost" onClick={() => open(selected, history.length)}>
              Starší zprávy
            </Btn>
          )}
          {history.map((m) => (
            <div key={m.id} className={"bubble-row " + (m.mine ? "mine" : "")}>
              <div>
                <span className="sender">
                  {m.mine ? "Ty" : "Anonymní člen"}
                </span>
                <div className="bubble">{m.body}</div>
                <small className="read-state">{shortDate(m.createdAt)}</small>
              </div>
            </div>
          ))}
        </div>
        {(target || (item && !item.closed && !item.blocked)) && (
          <form className="live-chat-compose" onSubmit={send}>
            <textarea
              maxLength={2000}
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Napsat zprávu…"
              disabled={offline || busy}
            />
            <Btn
              type="submit"
              disabled={offline || busy || !draft.trim()}
              icon="send"
            >
              Odeslat
            </Btn>
          </form>
        )}
      </section>
    </div>
  );
}
