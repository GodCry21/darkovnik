import { useEffect, useRef, useState, type ReactNode } from "react";
import productStillLife from "./assets/product-still-life.png";
import profileJana from "./assets/profile-jana.png";

type Screen = "overview" | "wishes" | "groups" | "calendar" | "messages" | "profile";
type Flow =
  | "create"
  | "edit"
  | "detail"
  | "share"
  | "reserve"
  | "manage"
  | "received"
  | "group-create"
  | "group-settings"
  | "group-invite"
  | "group-sharing"
  | "event-create"
  | "event-edit"
  | "logout"
  | "new-wish-message"
  | "new-member-message"
  | "notifications"
  | null;
type Theme = "light" | "dark" | "system";
type IconName =
  | "home"
  | "heart"
  | "users"
  | "calendar"
  | "message"
  | "user"
  | "sun"
  | "moon"
  | "plus"
  | "chevron"
  | "gift"
  | "check"
  | "clock"
  | "more"
  | "search"
  | "send"
  | "link"
  | "share"
  | "settings"
  | "arrow"
  | "bell"
  | "menu"
  | "close";

const iconPaths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9" />
      <path d="M9 20v-7h6v7" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </>
  ),
  message: (
    <>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  gift: (
    <>
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13M3 12h18M7.5 8C5 8 4 6.7 4 5.3 4 4 5 3 6.3 3 8.5 3 12 8 12 8M16.5 8C19 8 20 6.7 20 5.3 20 4 19 3 17.7 3 15.5 3 12 8 12 8" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  arrow: (
    <>
      <path d="m15 18-6-6 6-6" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
};

function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}

const navItems: { id: Screen; label: string; icon: IconName }[] = [
  { id: "overview", label: "Přehled", icon: "home" },
  { id: "wishes", label: "Moje přání", icon: "heart" },
  { id: "groups", label: "Skupiny", icon: "users" },
  { id: "calendar", label: "Kalendář", icon: "calendar" },
  { id: "messages", label: "Zprávy", icon: "message" },
  { id: "profile", label: "Profil", icon: "user" },
];

const avatars: Record<string, string> = {
  Jana: "avatar rose",
  Petr: "avatar blue",
  Lucie: "avatar sage",
  Tomáš: "avatar sand",
  Marie: "avatar plum",
  David: "avatar teal",
};

function Avatar({
  name,
  size = "md",
  status = false,
}: {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: boolean;
}) {
  return (
    <span className={`${avatars[name] || "avatar sage"} avatar-${size}`} aria-label={name}>
      {name.slice(0, 1)}
      {status && <i className="online-dot" />}
    </span>
  );
}

function Button({
  children,
  icon,
  variant = "primary",
  onClick,
  className = "",
  type = "button",
}: {
  children?: ReactNode;
  icon?: IconName;
  variant?: "primary" | "secondary" | "ghost" | "icon";
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button type={type} onClick={onClick} className={`button button-${variant} ${className}`}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

function SectionHeader({
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
          {action}
          <Icon name="chevron" size={15} />
        </button>
      )}
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children && <div className="header-actions">{children}</div>}
    </header>
  );
}

function Overview({
  goTo,
  openFlow,
}: {
  goTo: (screen: Screen) => void;
  openFlow: (flow: Flow) => void;
}) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Úterý 14. května"
        title="Dobré ráno, Jano"
        description="Tři narozeniny se blíží. Máte vše připravené?"
      >
        <Button icon="plus" onClick={() => openFlow("create")}>
          Přidat přání
        </Button>
      </PageHeader>

      <div className="overview-grid">
        <section className="main-column">
          <SectionHeader
            title="Blížící se události"
            action="Celý kalendář"
            onAction={() => goTo("calendar")}
          />
          <div className="event-list panel">
            <article className="event-row">
              <div className="date-block">
                <strong>18</strong>
                <span>KVĚ</span>
              </div>
              <Avatar name="Petr" size="lg" />
              <div className="event-copy">
                <strong>Petr má narozeniny</strong>
                <span>Za 4 dny · 36 let</span>
              </div>
              <span className="status-pill sage">4 přání</span>
              <Button variant="icon" icon="chevron" />
            </article>
            <article className="event-row">
              <div className="date-block">
                <strong>26</strong>
                <span>KVĚ</span>
              </div>
              <Avatar name="Lucie" size="lg" />
              <div className="event-copy">
                <strong>Lucie má narozeniny</strong>
                <span>Za 12 dní · 29 let</span>
              </div>
              <span className="status-pill sand">2 přání</span>
              <Button variant="icon" icon="chevron" />
            </article>
            <article className="event-row">
              <div className="date-block">
                <strong>02</strong>
                <span>ČVN</span>
              </div>
              <Avatar name="Tomáš" size="lg" />
              <div className="event-copy">
                <strong>Výročí rodičů</strong>
                <span>Za 19 dní · Rodina Novákových</span>
              </div>
              <span className="status-pill blue">Společný dárek</span>
              <Button variant="icon" icon="chevron" />
            </article>
          </div>

          <SectionHeader
            title="Moje rezervace"
            action="Zobrazit všechny"
            onAction={() => openFlow("manage")}
          />
          <div className="reservation-grid">
            <article
              className="reservation-card panel"
              onClick={() => openFlow("manage")}
              tabIndex={0}
            >
              <div className="product-thumb crop-headphones">
                <img src={productStillLife} alt="Olivově zelená bezdrátová sluchátka" />
              </div>
              <div>
                <span className="micro-label">PRO PETRA</span>
                <h3>Sluchátka Urbanista</h3>
                <p>2 790 Kč</p>
              </div>
              <span className="reserved">
                <Icon name="check" size={14} /> Rezervováno
              </span>
            </article>
            <article
              className="reservation-card panel"
              onClick={() => openFlow("manage")}
              tabIndex={0}
            >
              <div className="product-thumb crop-book">
                <img src={productStillLife} alt="Kniha s cihlově červenou vazbou" />
              </div>
              <div>
                <span className="micro-label">PRO LUCII</span>
                <h3>Kniha Umění klidu</h3>
                <p>449 Kč</p>
              </div>
              <span className="reserved">
                <Icon name="check" size={14} /> Rezervováno
              </span>
            </article>
          </div>
        </section>

        <aside className="side-column">
          <SectionHeader title="Rychlé akce" />
          <div className="quick-actions panel">
            <button onClick={() => openFlow("create")}>
              <span>
                <Icon name="heart" />
              </span>
              <div>
                <strong>Nové přání</strong>
                <small>Přidejte něco na svůj seznam</small>
              </div>
              <Icon name="chevron" size={16} />
            </button>
            <button onClick={() => openFlow("group-invite")}>
              <span>
                <Icon name="users" />
              </span>
              <div>
                <strong>Pozvat do skupiny</strong>
                <small>Sdílejte pozvánku s blízkými</small>
              </div>
              <Icon name="chevron" size={16} />
            </button>
            <button onClick={() => openFlow("event-create")}>
              <span>
                <Icon name="calendar" />
              </span>
              <div>
                <strong>Přidat událost</strong>
                <small>Narozeniny nebo výročí</small>
              </div>
              <Icon name="chevron" size={16} />
            </button>
          </div>

          <SectionHeader title="Nové zprávy" action="Všechny" onAction={() => goTo("messages")} />
          <div className="message-preview panel" onClick={() => goTo("messages")}>
            <div className="anonymous-mark">
              <Icon name="message" />
            </div>
            <div>
              <strong>Anonym · Rodina</strong>
              <p>Myslíš, že by Petr raději tu zelenou variantu?</p>
              <span>Před 12 min</span>
            </div>
            <i className="unread-dot" />
          </div>
        </aside>
      </div>
    </div>
  );
}

const products = [
  {
    title: "Bezdrátová sluchátka Urbanista",
    price: "2 790 Kč",
    store: "designville.cz",
    crop: "crop-headphones",
    alt: "Olivově zelená bezdrátová sluchátka",
    priority: "Vysoká priorita",
  },
  {
    title: "Keramický hrnek Kinto",
    price: "690 Kč",
    store: "onesconcept.cz",
    crop: "crop-cup",
    alt: "Krémový keramický hrnek",
    priority: "",
  },
  {
    title: "Kniha Umění klidu",
    price: "449 Kč",
    store: "booktherapy.cz",
    crop: "crop-book",
    alt: "Kniha v cihlově červené vazbě",
    priority: "",
  },
  {
    title: "Instantní fotoaparát Mini 12",
    price: "2 299 Kč",
    store: "fotolab.cz",
    crop: "crop-camera",
    alt: "Tmavě modrý instantní fotoaparát",
    priority: "Tip pro skupinu",
  },
];

function FlowShell({
  title,
  eyebrow,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);
  return (
    <div className="flow-layer" role="dialog" aria-modal="true" aria-labelledby="flow-title">
      <button className="flow-backdrop" onClick={onClose} aria-label="Zavřít" />
      <section ref={panelRef} tabIndex={-1} className={`flow-panel ${wide ? "wide" : ""}`}>
        <header className="flow-header">
          <button className="flow-mobile-back" onClick={onClose} aria-label="Zpět">
            <Icon name="arrow" />
          </button>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 id="flow-title">{title}</h1>
          </div>
          <button className="flow-close" onClick={onClose} aria-label="Zavřít">
            <Icon name="close" />
          </button>
        </header>
        <div className="flow-content">{children}</div>
      </section>
    </div>
  );
}

function QuantityControl({
  value,
  onChange,
  max = 20,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  return (
    <div className="quantity-control" aria-label="Počet kusů">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1}>
        <span aria-hidden="true">−</span>
        <span className="sr-only">Odebrat kus</span>
      </button>
      <strong>{value}</strong>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Icon name="plus" size={16} />
        <span className="sr-only">Přidat kus</span>
      </button>
    </div>
  );
}

function WishForm({
  mode,
  onClose,
  onDone,
}: {
  mode: "create" | "edit";
  onClose: () => void;
  onDone: () => void;
}) {
  const editing = mode === "edit";
  const [name, setName] = useState(editing ? "Bezdrátová sluchátka Urbanista" : "");
  const [url, setUrl] = useState(editing ? "https://designville.cz/urbanista-los-angeles" : "");
  const [price, setPrice] = useState(editing ? "2790" : "");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState(editing ? "Nejvíc se mi líbí olivově zelená varianta." : "");
  const [groups, setGroups] = useState(["Rodina Novákových"]);
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "done" | "error">(
    editing ? "done" : "idle",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const loadProduct = () => {
    if (!url.startsWith("http")) {
      setFetchState("error");
      setErrors((current) => ({ ...current, url: "Zadejte platnou adresu začínající http." }));
      return;
    }
    setErrors((current) => ({ ...current, url: "" }));
    setFetchState("loading");
    window.setTimeout(() => {
      setName("Bezdrátová sluchátka Urbanista");
      setPrice("2790");
      setFetchState("done");
    }, 850);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Doplňte název přání.";
    if (!price || Number(price) <= 0) nextErrors.price = "Zadejte cenu vyšší než 0 Kč.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    window.setTimeout(onDone, 850);
  };

  const toggleGroup = (group: string) =>
    setGroups((current) =>
      current.includes(group) ? current.filter((item) => item !== group) : [...current, group],
    );

  return (
    <FlowShell
      title={editing ? "Upravit přání" : "Nové přání"}
      eyebrow={editing ? "ÚPRAVA PŘÁNÍ" : "PŘIDAT NA SEZNAM"}
      onClose={onClose}
      wide
    >
      <form className="wish-form" onSubmit={submit} noValidate>
        <div className="form-main">
          <div className="field">
            <label htmlFor="wish-url">Odkaz na produkt</label>
            <div className={`url-field ${errors.url ? "invalid" : ""}`}>
              <Icon name="link" size={18} />
              <input
                id="wish-url"
                type="url"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setFetchState("idle");
                }}
                placeholder="https://obchod.cz/produkt"
              />
              <button type="button" onClick={loadProduct} disabled={fetchState === "loading"}>
                {fetchState === "loading" ? <span className="spinner" /> : "Načíst"}
              </button>
            </div>
            {errors.url && <span className="field-error">{errors.url}</span>}
            {fetchState === "done" && (
              <span className="field-success">
                <Icon name="check" size={14} /> Údaje produktu byly automaticky načteny.
              </span>
            )}
            {fetchState === "error" && !errors.url && (
              <span className="field-error">
                Produkt se nepodařilo načíst. Údaje vyplňte ručně.
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="wish-name">
              Název přání <b>*</b>
            </label>
            <input
              id="wish-name"
              className={errors.name ? "invalid" : ""}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Co by vám udělalo radost?"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="wish-price">Cena</label>
              <div className={`price-input ${errors.price ? "invalid" : ""}`}>
                <input
                  id="wish-price"
                  inputMode="numeric"
                  value={price ? Number(price).toLocaleString("cs-CZ") : ""}
                  onChange={(event) => setPrice(event.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                />
                <span>Kč</span>
              </div>
              {errors.price && <span className="field-error">{errors.price}</span>}
            </div>
            <div className="field">
              <label>Počet kusů</label>
              <QuantityControl value={quantity} onChange={setQuantity} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="wish-note">Poznámka</label>
            <textarea
              id="wish-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={300}
              placeholder="Barva, velikost nebo cokoli, co pomůže s výběrem…"
            />
            <span className="character-count">{note.length}/300</span>
          </div>
        </div>

        <aside className="form-side">
          <div className="field">
            <label>Obrázek produktu</label>
            <div className="image-upload crop-headphones">
              {(fetchState === "done" || editing) && (
                <img src={productStillLife} alt="Náhled produktu" />
              )}
              {fetchState !== "done" && !editing && (
                <div>
                  <Icon name="plus" />
                  <strong>Nahrát obrázek</strong>
                  <span>JPG nebo PNG do 5 MB</span>
                </div>
              )}
              {(fetchState === "done" || editing) && <button type="button">Změnit</button>}
            </div>
          </div>
          <fieldset className="group-select">
            <legend>Sdílet se skupinami</legend>
            <p>Vyberte, kdo toto přání uvidí.</p>
            {["Rodina Novákových", "Přátelé z Brna", "Kolegové"].map((group, index) => (
              <label key={group}>
                <input
                  type="checkbox"
                  checked={groups.includes(group)}
                  onChange={() => toggleGroup(group)}
                />
                <span className={`group-mini group-${index + 1}`}>
                  <Icon name="users" size={15} />
                </span>
                <span>
                  <strong>{group}</strong>
                  <small>{[6, 8, 12][index]} členů</small>
                </span>
              </label>
            ))}
          </fieldset>
        </aside>
        <footer className="flow-actions form-actions">
          <Button variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button type="submit" icon={saving ? undefined : "check"}>
            {saving ? (
              <>
                <span className="spinner light" /> Ukládám…
              </>
            ) : editing ? (
              "Uložit změny"
            ) : (
              "Přidat přání"
            )}
          </Button>
        </footer>
      </form>
    </FlowShell>
  );
}

function WishDetail({
  onClose,
  openFlow,
}: {
  onClose: () => void;
  openFlow: (flow: Flow) => void;
}) {
  return (
    <FlowShell title="Detail přání" eyebrow="MOJE PŘÁNÍ" onClose={onClose} wide>
      <div className="detail-layout">
        <div className="detail-image crop-headphones">
          <img src={productStillLife} alt="Olivově zelená bezdrátová sluchátka Urbanista" />
          <span className="image-badge">Vysoká priorita</span>
        </div>
        <div className="detail-copy">
          <p className="store">
            <Icon name="link" size={15} /> designville.cz
          </p>
          <h2>Bezdrátová sluchátka Urbanista</h2>
          <strong className="detail-price">2 790 Kč</strong>
          <p className="detail-note">Nejvíc se mi líbí olivově zelená varianta.</p>
          <dl>
            <div>
              <dt>Množství</dt>
              <dd>1 kus</dd>
            </div>
            <div>
              <dt>Dostupnost</dt>
              <dd className="available">Volné k rezervaci</dd>
            </div>
          </dl>
          <div className="shared-groups">
            <span>Sdíleno ve skupině</span>
            <div>
              <span className="group-mini group-1">
                <Icon name="users" size={15} />
              </span>
              <strong>Rodina Novákových</strong>
              <button onClick={() => openFlow("share")}>Změnit</button>
            </div>
          </div>
          <div className="detail-actions">
            <Button variant="secondary" icon="settings" onClick={() => openFlow("edit")}>
              Upravit
            </Button>
            <Button variant="secondary" icon="share" onClick={() => openFlow("share")}>
              Sdílet
            </Button>
            <Button variant="secondary" icon="message" onClick={() => openFlow("new-wish-message")}>
              Anonymní dotaz
            </Button>
            <Button icon="gift" onClick={() => openFlow("reserve")}>
              Vyzkoušet rezervaci
            </Button>
          </div>
        </div>
      </div>
    </FlowShell>
  );
}

function ShareWish({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState(["Rodina Novákových"]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const submit = () => {
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setDone(true);
    }, 700);
  };
  return (
    <FlowShell title="Sdílet přání" eyebrow="VIDITELNOST" onClose={onClose}>
      {done ? (
        <div className="success-state">
          <span>
            <Icon name="check" size={26} />
          </span>
          <h2>Přání je sdílené</h2>
          <p>Členové vybraných skupin jej nyní uvidí ve svém přehledu.</p>
          <Button onClick={onClose}>Hotovo</Button>
        </div>
      ) : (
        <>
          <div className="flow-product-row">
            <div className="product-thumb crop-headphones">
              <img src={productStillLife} alt="" />
            </div>
            <div>
              <strong>Bezdrátová sluchátka Urbanista</strong>
              <span>2 790 Kč · 1 kus</span>
            </div>
          </div>
          <div className="share-list">
            <p>Vyberte skupiny, ve kterých se přání zobrazí.</p>
            {["Rodina Novákových", "Přátelé z Brna", "Kolegové"].map((group, index) => (
              <label key={group}>
                <span className={`group-mini group-${index + 1}`}>
                  <Icon name="users" size={16} />
                </span>
                <span>
                  <strong>{group}</strong>
                  <small>{[6, 8, 12][index]} členů</small>
                </span>
                <input
                  type="checkbox"
                  checked={selected.includes(group)}
                  onChange={() =>
                    setSelected((current) =>
                      current.includes(group)
                        ? current.filter((item) => item !== group)
                        : [...current, group],
                    )
                  }
                />
              </label>
            ))}
          </div>
          <div className="privacy-note">
            <Icon name="check" />
            <div>
              <strong>Vaše rezervace zůstávají soukromé</strong>
              <p>Sdílením se ostatním nezobrazí, kdo jednotlivé dárky rezervoval.</p>
            </div>
          </div>
          <footer className="flow-actions">
            <Button variant="ghost" onClick={onClose}>
              Zrušit
            </Button>
            <Button onClick={submit}>
              {saving ? (
                <>
                  <span className="spinner light" /> Ukládám…
                </>
              ) : (
                `Sdílet do ${selected.length} ${selected.length === 1 ? "skupiny" : "skupin"}`
              )}
            </Button>
          </footer>
        </>
      )}
    </FlowShell>
  );
}

function ReservationFlow({
  mode,
  onClose,
  switchFlow,
}: {
  mode: "reserve" | "manage" | "received";
  onClose: () => void;
  switchFlow: (flow: Flow) => void;
}) {
  const [quantity, setQuantity] = useState(mode === "received" ? 1 : 1);
  const [status, setStatus] = useState<"reserved" | "purchased" | "released">(
    mode === "manage" ? "reserved" : "reserved",
  );
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const titles = {
    reserve: ["Rezervovat dárek", "REZERVACE PRO PETRA"],
    manage: ["Správa rezervace", "VAŠE REZERVACE"],
    received: ["Označit jako obdržené", "SPLNĚNÉ PŘÁNÍ"],
  };
  const confirm = () => {
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setDone(true);
    }, 800);
  };

  return (
    <FlowShell title={titles[mode][0]} eyebrow={titles[mode][1]} onClose={onClose}>
      {done ? (
        <div className="success-state">
          <span>
            <Icon name="check" size={26} />
          </span>
          <h2>
            {mode === "received"
              ? "Množství bylo upraveno"
              : status === "released"
                ? "Rezervace byla uvolněna"
                : status === "purchased"
                  ? "Označeno jako nakoupené"
                  : "Dárek je rezervovaný"}
          </h2>
          <p>
            {mode === "received"
              ? `${quantity} kus byl označen jako obdržený.`
              : "Změna je uložená. Obdarovaný neuvidí, kdo rezervaci provedl."}
          </p>
          <Button onClick={onClose}>Hotovo</Button>
        </div>
      ) : (
        <>
          <div className="flow-product-row">
            <div className="product-thumb crop-headphones">
              <img src={productStillLife} alt="" />
            </div>
            <div>
              <span className="micro-label">PŘÁNÍ PETRA</span>
              <strong>Bezdrátová sluchátka Urbanista</strong>
              <span>2 790 Kč za kus · požadováno 2 ks</span>
            </div>
          </div>

          {mode === "manage" && (
            <div className="status-field">
              <label>Stav rezervace</label>
              <div className="status-options">
                <button
                  className={status === "reserved" ? "active" : ""}
                  onClick={() => setStatus("reserved")}
                >
                  <Icon name="clock" size={17} />
                  <span>
                    <strong>Rezervováno</strong>
                    <small>Dárek plánujete koupit</small>
                  </span>
                </button>
                <button
                  className={status === "purchased" ? "active" : ""}
                  onClick={() => setStatus("purchased")}
                >
                  <Icon name="check" size={17} />
                  <span>
                    <strong>Nakoupeno</strong>
                    <small>Dárek už máte připravený</small>
                  </span>
                </button>
                <button
                  className={status === "released" ? "active danger" : ""}
                  onClick={() => setStatus("released")}
                >
                  <Icon name="close" size={17} />
                  <span>
                    <strong>Uvolnit</strong>
                    <small>Ostatní jej mohou rezervovat</small>
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="reservation-quantity">
            <div>
              <label>{mode === "received" ? "Kolik kusů jste obdrželi?" : "Počet kusů"}</label>
              <p>
                {mode === "received"
                  ? "Zbývá označit 2 kusy."
                  : "Jeden kus už rezervoval jiný člen."}
              </p>
            </div>
            <QuantityControl value={quantity} onChange={setQuantity} max={2} />
          </div>
          <div className="reservation-summary">
            <span>{mode === "received" ? "Obdržené množství" : "Celková cena"}</span>
            <strong>
              {mode === "received"
                ? `${quantity} z 2 ks`
                : `${(2790 * quantity).toLocaleString("cs-CZ")} Kč`}
            </strong>
          </div>
          {mode !== "received" && (
            <div className="privacy-note">
              <Icon name="check" />
              <div>
                <strong>Petr o rezervaci neuvidí</strong>
                <p>Rezervace i její stav jsou viditelné pouze ostatním členům skupiny.</p>
              </div>
            </div>
          )}
          {mode === "reserve" && (
            <button className="manage-link" onClick={() => switchFlow("manage")}>
              Ukázat správu existující rezervace <Icon name="chevron" size={15} />
            </button>
          )}
          {mode === "manage" && (
            <button className="manage-link" onClick={() => switchFlow("received")}>
              Označit obdržené množství <Icon name="chevron" size={15} />
            </button>
          )}
          <footer className="flow-actions">
            <Button variant="ghost" onClick={onClose}>
              Zrušit
            </Button>
            <Button onClick={confirm}>
              {saving ? (
                <>
                  <span className="spinner light" /> Ukládám…
                </>
              ) : mode === "received" ? (
                "Potvrdit množství"
              ) : status === "released" ? (
                "Uvolnit rezervaci"
              ) : (
                "Potvrdit změnu"
              )}
            </Button>
          </footer>
        </>
      )}
    </FlowShell>
  );
}

function Wishes({ openFlow }: { openFlow: (flow: Flow) => void }) {
  const [tab, setTab] = useState<"all" | "active" | "done">("all");
  return (
    <div className="page">
      <PageHeader
        eyebrow="SEZNAM PŘÁNÍ"
        title="Moje přání"
        description="Věci, které by vám udělaly radost. Sdílejte je s rodinou a přáteli."
      >
        <Button variant="secondary" icon="share" onClick={() => openFlow("share")}>
          Sdílet seznam
        </Button>
        <Button icon="plus" onClick={() => openFlow("create")}>
          Přidat přání
        </Button>
      </PageHeader>
      <div className="toolbar">
        <div className="tabs">
          <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>
            Všechna <span>8</span>
          </button>
          <button className={tab === "active" ? "active" : ""} onClick={() => setTab("active")}>
            Aktivní <span>6</span>
          </button>
          <button className={tab === "done" ? "active" : ""} onClick={() => setTab("done")}>
            Splněná <span>2</span>
          </button>
        </div>
        <button className="sort-button">
          Nejnovější <Icon name="chevron" size={15} />
        </button>
      </div>
      <div className="product-grid">
        {(tab === "done" ? products.slice(2) : products).map((product, index) => (
          <article
            className="product-card panel"
            key={product.title}
            onClick={() => openFlow("detail")}
          >
            <div className={`product-image ${product.crop}`}>
              <img src={productStillLife} alt={product.alt} />
              {product.priority && <span className="image-badge">{product.priority}</span>}
              <button
                className="more-button"
                aria-label={`Více možností pro ${product.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  openFlow("edit");
                }}
              >
                <Icon name="more" />
              </button>
            </div>
            <div className="product-content">
              <p className="store">
                <Icon name="link" size={14} />
                {product.store}
              </p>
              <h2>{product.title}</h2>
              <strong className="price">{product.price}</strong>
              <div className="product-meta">
                <span>
                  Množství <b>{index === 1 ? "2 ks" : "1 ks"}</b>
                </span>
                <span className={tab === "done" || index === 3 ? "claimed" : ""}>
                  {tab === "done" ? "Obdrženo" : index === 3 ? "1 rezervováno" : "Volné"}
                </span>
              </div>
            </div>
          </article>
        ))}
        {tab !== "done" && (
          <button className="add-card" onClick={() => openFlow("create")}>
            <span>
              <Icon name="plus" size={22} />
            </span>
            <strong>Přidat další přání</strong>
            <small>Vložte odkaz nebo přidejte ručně</small>
          </button>
        )}
      </div>
    </div>
  );
}

type GroupView = "list" | "detail" | "members" | "member-wishes";

const groupData = [
  {
    name: "Rodina Novákových",
    description: "Narozeniny, Vánoce a všechno mezi tím.",
    members: 6,
    wishes: 21,
    tone: "family",
    role: "Administrátor",
  },
  {
    name: "Přátelé z Brna",
    description: "Společné oslavy a malé radosti.",
    members: 8,
    wishes: 14,
    tone: "friends",
    role: "Člen",
  },
  {
    name: "Kolegové",
    description: "Dárky k narozeninám v našem týmu.",
    members: 12,
    wishes: 9,
    tone: "work",
    role: "Člen",
  },
];

function GroupArtwork({ tone, large = false }: { tone: string; large?: boolean }) {
  return (
    <div className={`group-artwork ${tone} ${large ? "large" : ""}`} aria-hidden="true">
      <span className="art-circle one" />
      <span className="art-circle two" />
      <span className="art-line" />
      <Icon name="gift" size={large ? 31 : 23} />
    </div>
  );
}

function GroupList({
  openGroup,
  openFlow,
}: {
  openGroup: () => void;
  openFlow: (flow: Flow) => void;
}) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="VAŠE KOMUNITY"
        title="Skupiny"
        description="Sdílejte přání a plánujte dárky s rodinou, přáteli i kolegy."
      >
        <Button icon="plus" onClick={() => openFlow("group-create")}>
          Vytvořit skupinu
        </Button>
      </PageHeader>
      <div className="groups-grid">
        {groupData.map((group, index) => (
          <article className="group-card panel" key={group.name} onClick={openGroup}>
            <GroupArtwork tone={group.tone} />
            <div className="group-card-body">
              <div className="group-card-title">
                <h2>{group.name}</h2>
                <span className={index === 0 ? "role-badge admin" : "role-badge"}>
                  {group.role}
                </span>
              </div>
              <p>{group.description}</p>
              <div className="group-card-meta">
                <span>
                  <Icon name="users" size={15} /> {group.members} členů
                </span>
                <span>
                  <Icon name="heart" size={15} /> {group.wishes} přání
                </span>
                <Icon name="chevron" size={17} />
              </div>
            </div>
          </article>
        ))}
        <button className="add-group-card" onClick={() => openFlow("group-create")}>
          <span>
            <Icon name="plus" />
          </span>
          <strong>Nová skupina</strong>
          <small>Pro rodinu, přátele nebo kolegy</small>
        </button>
      </div>
      <div className="member-permission-note">
        <Icon name="check" />
        <div>
          <strong>Role určují možnosti ve skupině</strong>
          <p>
            Členové mohou prohlížet přání a rezervovat dárky. Administrátoři navíc zvou členy a
            spravují nastavení.
          </p>
        </div>
      </div>
    </div>
  );
}

function CreateGroup({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Zadejte název skupiny.");
      return;
    }
    setSaving(true);
    window.setTimeout(onCreated, 850);
  };
  return (
    <FlowShell title="Vytvořit skupinu" eyebrow="NOVÁ SKUPINA" onClose={onClose}>
      <form onSubmit={submit} className="group-form" noValidate>
        <div className="field">
          <label htmlFor="group-name">
            Název skupiny <b>*</b>
          </label>
          <input
            id="group-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            className={error ? "invalid" : ""}
            placeholder="Například Rodina Novákových"
          />
          {error && <span className="field-error">{error}</span>}
        </div>
        <div className="field">
          <label htmlFor="group-description">Popis</label>
          <textarea
            id="group-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={180}
            placeholder="K čemu skupina slouží?"
          />
          <span className="character-count">{description.length}/180</span>
        </div>
        <div className="field">
          <label>Obrázek skupiny</label>
          <button className="group-image-picker" type="button">
            <GroupArtwork tone="family" large />
            <span>
              <strong>Nahrát vlastní obrázek</strong>
              <small>JPG nebo PNG do 5 MB</small>
            </span>
            <Icon name="plus" size={18} />
          </button>
        </div>
        <div className="admin-explainer">
          <Icon name="settings" size={19} />
          <p>
            <strong>Budete zakladatelem a administrátorem</strong>
            <span>Po vytvoření můžete pozvat členy a určit další administrátory.</span>
          </p>
        </div>
        <footer className="flow-actions">
          <Button variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button type="submit">
            {saving ? (
              <>
                <span className="spinner light" /> Vytvářím…
              </>
            ) : (
              "Vytvořit skupinu"
            )}
          </Button>
        </footer>
      </form>
    </FlowShell>
  );
}

function InviteMembers({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState(["klara.svobodova@email.cz"]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const addEmail = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Zadejte platnou e-mailovou adresu.");
      return;
    }
    if (emails.includes(email)) {
      setError("Tato adresa už je v seznamu.");
      return;
    }
    setEmails([...emails, email]);
    setEmail("");
    setError("");
  };
  const send = () => {
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setDone(true);
    }, 850);
  };
  return (
    <FlowShell title="Pozvat členy" eyebrow="RODINA NOVÁKOVÝCH" onClose={onClose}>
      {done ? (
        <div className="success-state">
          <span>
            <Icon name="send" size={25} />
          </span>
          <h2>Pozvánky byly odeslány</h2>
          <p>Odeslali jsme {emails.length} e-mailové pozvánky. Jejich stav najdete v nastavení.</p>
          <Button onClick={onClose}>Hotovo</Button>
        </div>
      ) : (
        <>
          <p className="flow-intro">
            Pozvaní obdrží e-mail s bezpečným odkazem pro vstup do skupiny.
          </p>
          <div className="field">
            <label htmlFor="invite-email">E-mailová adresa</label>
            <div className={`invite-input ${error ? "invalid" : ""}`}>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addEmail();
                  }
                }}
                placeholder="jmeno@email.cz"
              />
              <button onClick={addEmail}>Přidat</button>
            </div>
            {error && <span className="field-error">{error}</span>}
          </div>
          <div className="email-chips">
            {emails.map((item) => (
              <span key={item}>
                {item}
                <button onClick={() => setEmails(emails.filter((emailItem) => emailItem !== item))}>
                  <Icon name="close" size={13} />
                </button>
              </span>
            ))}
          </div>
          <div className="invite-role">
            <span>
              <strong>Role po přijetí</strong>
              <small>Role lze později změnit v seznamu členů.</small>
            </span>
            <select aria-label="Role po přijetí" defaultValue="member">
              <option value="member">Člen</option>
              <option value="admin">Administrátor</option>
            </select>
          </div>
          <footer className="flow-actions">
            <Button variant="ghost" onClick={onClose}>
              Zrušit
            </Button>
            <Button icon="send" onClick={send}>
              {sending ? (
                <>
                  <span className="spinner light" /> Odesílám…
                </>
              ) : (
                `Odeslat ${emails.length} ${emails.length === 1 ? "pozvánku" : "pozvánky"}`
              )}
            </Button>
          </footer>
        </>
      )}
    </FlowShell>
  );
}

function GroupSettings({ onClose, openInvite }: { onClose: () => void; openInvite: () => void }) {
  const [tab, setTab] = useState<"general" | "members" | "invites">("general");
  const [name, setName] = useState("Rodina Novákových");
  const [saved, setSaved] = useState(false);
  return (
    <FlowShell title="Nastavení skupiny" eyebrow="RODINA NOVÁKOVÝCH" onClose={onClose} wide>
      <div className="settings-tabs">
        <button className={tab === "general" ? "active" : ""} onClick={() => setTab("general")}>
          Obecné
        </button>
        <button className={tab === "members" ? "active" : ""} onClick={() => setTab("members")}>
          Členové a role
        </button>
        <button className={tab === "invites" ? "active" : ""} onClick={() => setTab("invites")}>
          Pozvánky <span>2</span>
        </button>
      </div>
      {tab === "general" && (
        <div className="settings-layout">
          <div>
            <div className="field">
              <label htmlFor="settings-name">Název skupiny</label>
              <input
                id="settings-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="settings-description">Popis</label>
              <textarea
                id="settings-description"
                defaultValue="Naše rodinná skupina pro narozeniny, Vánoce a všechno mezi tím."
              />
            </div>
            <div className="permission-grid">
              <label>
                <input type="checkbox" defaultChecked />
                <span>
                  <strong>Členové mohou zvát další lidi</strong>
                  <small>Nové pozvánky stále uvidí administrátoři.</small>
                </span>
              </label>
              <label>
                <input type="checkbox" defaultChecked />
                <span>
                  <strong>Členové vidí seznam ostatních</strong>
                  <small>Rezervace zůstávají vždy anonymní.</small>
                </span>
              </label>
            </div>
            <div className="danger-zone">
              <div>
                <strong>Opuštění a odstranění skupiny</strong>
                <p>Tyto akce připravujeme pro další verzi.</p>
              </div>
              <div>
                <button disabled>
                  Opustit skupinu <span>Brzy</span>
                </button>
                <button disabled>
                  Odstranit skupinu <span>Brzy</span>
                </button>
              </div>
            </div>
          </div>
          <aside>
            <label>Obrázek skupiny</label>
            <div className="settings-artwork">
              <GroupArtwork tone="family" large />
              <Button variant="secondary">Změnit obrázek</Button>
            </div>
            <div className="access-card">
              <Icon name="settings" />
              <p>
                <strong>Máte oprávnění administrátora</strong>
                <span>Můžete upravovat skupinu, zvát členy a spravovat role.</span>
              </p>
            </div>
          </aside>
        </div>
      )}
      {tab === "members" && (
        <div className="settings-member-list">
          <div className="settings-section-heading">
            <div>
              <h2>Členové a role</h2>
              <p>Jen zakladatel může měnit administrátorské role.</p>
            </div>
            <Button icon="plus" onClick={openInvite}>
              Pozvat člena
            </Button>
          </div>
          {[
            ["Jana", "jana@novakova.cz", "Zakladatel"],
            ["Petr", "petr.novak@email.cz", "Administrátor"],
            ["Lucie", "lucie@email.cz", "Člen"],
            ["Tomáš", "tomas@email.cz", "Člen"],
          ].map(([person, mail, role]) => (
            <div className="settings-member" key={person}>
              <Avatar name={person} />
              <span>
                <strong>
                  {person} {person === "Jana" && <i>Vy</i>}
                </strong>
                <small>{mail}</small>
              </span>
              <select
                defaultValue={role}
                disabled={role === "Zakladatel"}
                aria-label={`Role: ${person}`}
              >
                <option>Zakladatel</option>
                <option>Administrátor</option>
                <option>Člen</option>
              </select>
              <button className="future-action" disabled title="Připravujeme">
                <Icon name="more" />
              </button>
            </div>
          ))}
          <div className="future-hint">
            <Icon name="clock" size={17} />
            Odebrání člena bude dostupné v další verzi.
          </div>
        </div>
      )}
      {tab === "invites" && (
        <div className="pending-invites">
          <div className="settings-section-heading">
            <div>
              <h2>Čekající pozvánky</h2>
              <p>Pozvánky vyprší 14 dní po odeslání.</p>
            </div>
            <Button icon="plus" onClick={openInvite}>
              Nová pozvánka
            </Button>
          </div>
          {[
            ["klara.svobodova@email.cz", "Odesláno dnes", "13 dní"],
            ["martin@email.cz", "Odesláno 10. května", "9 dní"],
          ].map(([mail, sent, expiry]) => (
            <div className="pending-invite" key={mail}>
              <span className="invite-icon">
                <Icon name="send" size={17} />
              </span>
              <span>
                <strong>{mail}</strong>
                <small>{sent}</small>
              </span>
              <span>Vyprší za {expiry}</span>
              <button>Znovu odeslat</button>
              <button aria-label={`Zrušit pozvánku ${mail}`}>
                <Icon name="close" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      <footer className="flow-actions">
        <Button variant="ghost" onClick={onClose}>
          Zavřít
        </Button>
        {tab === "general" && (
          <Button
            icon="check"
            onClick={() => {
              setSaved(true);
              window.setTimeout(() => setSaved(false), 1600);
            }}
          >
            {saved ? "Uloženo" : "Uložit změny"}
          </Button>
        )}
      </footer>
    </FlowShell>
  );
}

function GroupMembers({
  onBack,
  openWishes,
  openInvite,
  isAdmin,
}: {
  onBack: () => void;
  openWishes: () => void;
  openInvite: () => void;
  isAdmin: boolean;
}) {
  const people = [
    ["Jana", "Zakladatel", "8 přání", "Aktivní dnes"],
    ["Petr", "Administrátor", "4 přání", "Aktivní dnes"],
    ["Lucie", "Člen", "7 přání", "Aktivní včera"],
    ["Tomáš", "Člen", "3 přání", "Aktivní před 3 dny"],
    ["Marie", "Člen", "5 přání", "Aktivní minulý týden"],
  ];
  return (
    <div className="page">
      <button className="back-link" onClick={onBack}>
        <Icon name="arrow" size={17} /> Rodina Novákových
      </button>
      <PageHeader
        eyebrow="6 ČLENŮ"
        title="Členové skupiny"
        description={
          isAdmin
            ? "Jako administrátor můžete zvát členy a spravovat jejich role."
            : "Jako člen můžete prohlížet profily a jejich sdílená přání."
        }
      >
        {isAdmin && (
          <Button icon="plus" onClick={openInvite}>
            Pozvat člena
          </Button>
        )}
      </PageHeader>
      <div className="members-table panel">
        {people.map(([person, role, wishes, active]) => (
          <button key={person} onClick={openWishes}>
            <Avatar name={person} size="lg" status={active === "Aktivní dnes"} />
            <span className="member-identity">
              <strong>
                {person} Novák{person === "Lucie" || person === "Marie" ? "ová" : ""}
              </strong>
              <small>{active}</small>
            </span>
            <span className={role === "Člen" ? "role-badge" : "role-badge admin"}>{role}</span>
            <span className="wish-count">{wishes}</span>
            <Icon name="chevron" size={17} />
          </button>
        ))}
      </div>
    </div>
  );
}

function MemberWishes({
  onBack,
  openFlow,
}: {
  onBack: () => void;
  openFlow: (flow: Flow) => void;
}) {
  return (
    <div className="page">
      <button className="back-link" onClick={onBack}>
        <Icon name="arrow" size={17} /> Členové skupiny
      </button>
      <div className="member-profile-head">
        <Avatar name="Petr" size="xl" status />
        <div>
          <p className="eyebrow">ČLEN SKUPINY</p>
          <h1>Petr Novák</h1>
          <p>Narozeniny za 4 dny · 18. května</p>
        </div>
        <div className="member-profile-actions">
          <span className="role-badge admin">Administrátor</span>
          <Button variant="secondary" icon="message" onClick={() => openFlow("new-member-message")}>
            Anonymní zpráva
          </Button>
        </div>
      </div>
      <div className="toolbar">
        <div className="tabs">
          <button className="active">
            Aktivní přání <span>4</span>
          </button>
          <button>
            Splněná <span>2</span>
          </button>
        </div>
      </div>
      <div className="product-grid member-product-grid">
        {products.slice(0, 3).map((product, index) => (
          <article
            className="product-card panel"
            key={product.title}
            onClick={() => openFlow(index === 0 ? "reserve" : "detail")}
          >
            <div className={`product-image ${product.crop}`}>
              <img src={productStillLife} alt={product.alt} />
              {index === 1 && <span className="image-badge">1 ze 2 rezervováno</span>}
            </div>
            <div className="product-content">
              <p className="store">{product.store}</p>
              <h2>{product.title}</h2>
              <strong className="price">{product.price}</strong>
              <div className="product-meta">
                <span>Množství {index === 1 ? "2 ks" : "1 ks"}</span>
                <span>{index === 1 ? "Částečně rezervováno" : "Volné"}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function GroupDetail({
  openFlow,
  onBack,
  openMembers,
  isAdmin,
  toggleRole,
}: {
  openFlow: (flow: Flow) => void;
  onBack: () => void;
  openMembers: () => void;
  isAdmin: boolean;
  toggleRole: () => void;
}) {
  const members = ["Jana", "Petr", "Lucie", "Tomáš", "Marie"];
  return (
    <div className="page">
      <button className="back-link" onClick={onBack}>
        <Icon name="arrow" size={17} /> Všechny skupiny
      </button>
      <div className="group-hero">
        <div className="group-symbol">
          <Icon name="users" size={28} />
        </div>
        <div>
          <p className="eyebrow">SOUKROMÁ SKUPINA · {isAdmin ? "ADMINISTRÁTOR" : "ČLEN"}</p>
          <h1>Rodina Novákových</h1>
          <p>Naše rodinná skupina pro narozeniny, Vánoce a všechno mezi tím.</p>
        </div>
        <div className="header-actions">
          {isAdmin && (
            <Button variant="secondary" icon="share" onClick={() => openFlow("group-invite")}>
              Pozvat
            </Button>
          )}
          <Button
            variant="icon"
            icon="settings"
            onClick={() => openFlow(isAdmin ? "group-settings" : "group-sharing")}
          />
        </div>
      </div>
      <div className="role-preview">
        <span>
          Náhled oprávnění: <strong>{isAdmin ? "Administrátor" : "Běžný člen"}</strong>
        </span>
        <button onClick={toggleRole}>Přepnout na {isAdmin ? "člena" : "administrátora"}</button>
      </div>
      <div className="group-meta panel">
        <div className="avatar-stack">
          {members.map((name) => (
            <Avatar name={name} key={name} />
          ))}
        </div>
        <button className="group-members-link" onClick={openMembers}>
          <strong>6 členů</strong>
          <span>5 aktivních tento týden</span>
        </button>
        <i />
        <div className="next-event">
          <span className="calendar-icon">
            <Icon name="calendar" />
          </span>
          <div>
            <strong>Nejbližší událost</strong>
            <span>Petrovy narozeniny · 18. května</span>
          </div>
        </div>
      </div>

      <div className="group-layout">
        <section>
          <SectionHeader title="Přání členů" action="Zobrazit vše" onAction={openMembers} />
          <div className="member-wishes panel">
            {[
              {
                name: "Petr",
                count: "4 přání",
                date: "Narozeniny za 4 dny",
                crop: "crop-headphones",
                title: "Sluchátka Urbanista",
                price: "2 790 Kč",
              },
              {
                name: "Lucie",
                count: "7 přání",
                date: "Narozeniny za 12 dní",
                crop: "crop-book",
                title: "Kniha Umění klidu",
                price: "449 Kč",
              },
              {
                name: "Tomáš",
                count: "3 přání",
                date: "Bez blízké události",
                crop: "crop-camera",
                title: "Instantní fotoaparát",
                price: "2 299 Kč",
              },
            ].map((person) => (
              <article
                className="member-wish"
                key={person.name}
                onClick={() => openFlow("reserve")}
              >
                <Avatar name={person.name} size="lg" />
                <div className="member-name">
                  <strong>{person.name}</strong>
                  <span>
                    {person.count} · {person.date}
                  </span>
                </div>
                <div className={`mini-product ${person.crop}`}>
                  <img src={productStillLife} alt="" />
                </div>
                <div className="mini-copy">
                  <strong>{person.title}</strong>
                  <span>{person.price}</span>
                </div>
                <Button variant="icon" icon="chevron" />
              </article>
            ))}
          </div>
        </section>
        <aside>
          <SectionHeader title="Aktivita" />
          <div className="activity panel">
            <div className="activity-item">
              <span className="activity-icon">
                <Icon name="gift" size={18} />
              </span>
              <p>
                <strong>Někdo rezervoval dárek</strong>
                <span>pro Petra · před 2 hodinami</span>
              </p>
            </div>
            <div className="activity-item">
              <Avatar name="Lucie" size="sm" />
              <p>
                <strong>Lucie přidala nové přání</strong>
                <span>před 5 hodinami</span>
              </p>
            </div>
            <div className="activity-item">
              <Avatar name="David" size="sm" />
              <p>
                <strong>David se připojil ke skupině</strong>
                <span>včera</span>
              </p>
            </div>
          </div>
          <div className="privacy-note">
            <Icon name="check" />
            <div>
              <strong>Rezervace zůstávají tajné</strong>
              <p>Obdarovaný nikdy neuvidí, kdo si jeho přání rezervoval.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MemberGroupSettings({ onClose }: { onClose: () => void }) {
  return (
    <FlowShell title="Moje nastavení skupiny" eyebrow="ROLE ČLENA" onClose={onClose}>
      <div className="access-card member-access">
        <Icon name="user" />
        <p>
          <strong>Jste běžný člen</strong>
          <span>Můžete prohlížet přání, rezervovat dárky a spravovat vlastní sdílení.</span>
        </p>
      </div>
      <div className="member-settings-list">
        <label>
          <span>
            <strong>Sdílet moje přání</strong>
            <small>Členové skupiny uvidí váš seznam přání.</small>
          </span>
          <input type="checkbox" defaultChecked />
        </label>
        <label>
          <span>
            <strong>Upozornění na nové události</strong>
            <small>Dáme vám vědět o narozeninách a změnách.</small>
          </span>
          <input type="checkbox" defaultChecked />
        </label>
      </div>
      <div className="permission-comparison">
        <div>
          <strong>Člen může</strong>
          <span>
            <Icon name="check" size={14} /> Prohlížet přání členů
          </span>
          <span>
            <Icon name="check" size={14} /> Rezervovat dárky
          </span>
          <span>
            <Icon name="check" size={14} /> Spravovat vlastní sdílení
          </span>
        </div>
        <div>
          <strong>Administrátor navíc</strong>
          <span>
            <Icon name="settings" size={14} /> Upravuje skupinu a role
          </span>
          <span>
            <Icon name="send" size={14} /> Zve nové členy
          </span>
          <span>
            <Icon name="clock" size={14} /> Sleduje čekající pozvánky
          </span>
        </div>
      </div>
      <div className="danger-zone compact">
        <div>
          <strong>Opustit skupinu</strong>
          <p>Tuto možnost připravujeme pro další verzi.</p>
        </div>
        <button disabled>
          Opustit skupinu <span>Brzy</span>
        </button>
      </div>
      <footer className="flow-actions">
        <Button variant="ghost" onClick={onClose}>
          Zrušit
        </Button>
        <Button icon="check" onClick={onClose}>
          Uložit nastavení
        </Button>
      </footer>
    </FlowShell>
  );
}

function GroupsWorkspace({ openFlow }: { openFlow: (flow: Flow) => void }) {
  const [view, setView] = useState<GroupView>("list");
  const [isAdmin, setIsAdmin] = useState(true);
  if (view === "list") {
    return <GroupList openGroup={() => setView("detail")} openFlow={openFlow} />;
  }
  if (view === "members") {
    return (
      <GroupMembers
        onBack={() => setView("detail")}
        openWishes={() => setView("member-wishes")}
        openInvite={() => openFlow("group-invite")}
        isAdmin={isAdmin}
      />
    );
  }
  if (view === "member-wishes") {
    return <MemberWishes onBack={() => setView("members")} openFlow={openFlow} />;
  }
  return (
    <GroupDetail
      openFlow={openFlow}
      onBack={() => setView("list")}
      openMembers={() => setView("members")}
      isAdmin={isAdmin}
      toggleRole={() => setIsAdmin((current) => !current)}
    />
  );
}

function NewAnonymousMessage({
  type,
  onClose,
  openMessages,
}: {
  type: "wish" | "member";
  onClose: () => void;
  openMessages: () => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const send = () => {
    if (!message.trim()) return;
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setDone(true);
    }, 800);
  };
  return (
    <FlowShell
      title={type === "wish" ? "Anonymní dotaz k přání" : "Anonymní zpráva členovi"}
      eyebrow="CHRÁNĚNÁ KONVERZACE"
      onClose={onClose}
    >
      {done ? (
        <div className="success-state">
          <span>
            <Icon name="message" size={25} />
          </span>
          <h2>Zpráva byla odeslána</h2>
          <p>Odpověď najdete ve Zprávách. Pro příjemce zůstáváte po celou dobu anonymní.</p>
          <Button onClick={openMessages}>Otevřít konverzaci</Button>
        </div>
      ) : (
        <>
          <div className="anonymous-recipient">
            {type === "wish" ? (
              <div className="product-thumb crop-headphones">
                <img src={productStillLife} alt="" />
              </div>
            ) : (
              <Avatar name="Petr" size="lg" />
            )}
            <div>
              <span>{type === "wish" ? "DOTAZ PRO PETRA" : "PŘÍJEMCE"}</span>
              <strong>{type === "wish" ? "Bezdrátová sluchátka Urbanista" : "Petr Novák"}</strong>
              <small>Společná skupina · Rodina Novákových</small>
            </div>
          </div>
          <div className="identity-shield">
            <Icon name="check" size={19} />
            <div>
              <strong>Vaše identita ani rezervace se neodesílají</strong>
              <p>
                Petr uvidí pouze obsah zprávy
                {type === "wish" ? " a název tohoto přání" : ""}. Neuvidí vaše jméno, profil ani
                rezervované dárky.
              </p>
            </div>
          </div>
          <div className="field anonymous-message-field">
            <label htmlFor="anonymous-message">Zpráva</label>
            <textarea
              id="anonymous-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={500}
              placeholder={
                type === "wish"
                  ? "Například: Která barevná varianta se ti líbí nejvíc?"
                  : "Napište zprávu bez uvedení osobních údajů…"
              }
            />
            <span className="character-count">{message.length}/500</span>
          </div>
          <footer className="flow-actions">
            <Button variant="ghost" onClick={onClose}>
              Zrušit
            </Button>
            <Button icon="send" onClick={send}>
              {sending ? (
                <>
                  <span className="spinner light" /> Odesílám…
                </>
              ) : (
                "Odeslat anonymně"
              )}
            </Button>
          </footer>
        </>
      )}
    </FlowShell>
  );
}

function NotificationCenter({
  onClose,
  openMessages,
}: {
  onClose: () => void;
  openMessages: () => void;
}) {
  const [cleared, setCleared] = useState(false);
  return (
    <FlowShell title="Oznámení" eyebrow="3 NOVÁ" onClose={onClose}>
      {cleared ? (
        <EmptyState
          icon="bell"
          title="Všechno je přečtené"
          text="Nová upozornění se zobrazí tady."
        />
      ) : (
        <div className="notification-list">
          <button onClick={openMessages}>
            <span className="notification-icon message">
              <Icon name="message" size={18} />
            </span>
            <div>
              <strong>Nová anonymní odpověď</strong>
              <p>„Nejvíc se mi líbí zelená varianta…“</p>
              <small>Před 12 minutami · Rodina Novákových</small>
            </div>
            <i />
          </button>
          <button onClick={openMessages}>
            <span className="notification-icon gift">
              <Icon name="gift" size={18} />
            </span>
            <div>
              <strong>Dotaz k vašemu přání</strong>
              <p>Někdo se ptá na Bezdrátová sluchátka Urbanista.</p>
              <small>Před 2 hodinami</small>
            </div>
            <i />
          </button>
          <button>
            <span className="notification-icon calendar">
              <Icon name="calendar" size={18} />
            </span>
            <div>
              <strong>Petrovy narozeniny se blíží</strong>
              <p>Do oslavy zbývají 4 dny.</p>
              <small>Včera</small>
            </div>
          </button>
        </div>
      )}
      {!cleared && (
        <button className="mark-read" onClick={() => setCleared(true)}>
          <Icon name="check" size={15} /> Označit vše jako přečtené
        </button>
      )}
    </FlowShell>
  );
}

const secureConversations = [
  {
    id: 1,
    name: "Dotaz k přání · Petr",
    text: "Zelená je moje nejoblíbenější.",
    time: "10:42",
    unread: 2,
    type: "wish",
    group: "Rodina Novákových",
  },
  {
    id: 2,
    name: "Anonymní zpráva · Lucie",
    text: "Díky, to zní jako dobrý plán.",
    time: "Včera",
    unread: 0,
    type: "general",
    group: "Přátelé z Brna",
  },
  {
    id: 3,
    name: "Dotaz k přání · Tomáš",
    text: "Zprávu se nepodařilo odeslat.",
    time: "Po",
    unread: 0,
    type: "wish",
    group: "Rodina Novákových",
  },
  {
    id: 4,
    name: "Anonymní zpráva · Marie",
    text: "Konverzace byla uzavřena.",
    time: "8. 5.",
    unread: 0,
    type: "general",
    group: "Rodina Novákových",
  },
];

function Messages({ openFlow }: { openFlow: (flow: Flow) => void }) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "closed">("all");
  const [sent, setSent] = useState<string[]>([]);
  const [selected, setSelected] = useState(1);
  const [mobileChat, setMobileChat] = useState(false);
  const [closed, setClosed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [reported, setReported] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [connectionError, setConnectionError] = useState(true);
  const current = secureConversations.find((item) => item.id === selected)!;
  const isWish = current.type === "wish";
  const filteredConversations = secureConversations.filter((item) => {
    const matchesQuery = `${item.name} ${item.group} ${item.text}`
      .toLocaleLowerCase("cs")
      .includes(query.toLocaleLowerCase("cs"));
    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && item.unread > 0) ||
      (filter === "closed" && item.id === 4);
    return matchesQuery && matchesFilter;
  });
  const choose = (id: number) => {
    setSelected(id);
    setMobileChat(true);
    setClosed(id === 4);
    setConnectionError(id === 3);
    setBlocked(false);
    setReported(false);
  };
  return (
    <div className={`messages-page ${mobileChat ? "mobile-chat-open" : ""}`}>
      <section className="conversation-list">
        <div className="messages-heading">
          <div>
            <p className="eyebrow">4 KONVERZACE · 2 NEPŘEČTENÉ</p>
            <h1>Zprávy</h1>
          </div>
          <Button variant="icon" icon="plus" onClick={() => openFlow("new-member-message")} />
        </div>
        <label className="search">
          <Icon name="search" size={18} />
          <input
            aria-label="Hledat v konverzacích"
            placeholder="Hledat konverzaci"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="message-filters">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
            Všechny
          </button>
          <button
            className={filter === "unread" ? "active" : ""}
            onClick={() => setFilter("unread")}
          >
            Nepřečtené <span>2</span>
          </button>
          <button
            className={filter === "closed" ? "active" : ""}
            onClick={() => setFilter("closed")}
          >
            Uzavřené
          </button>
        </div>
        <div className="conversation-items">
          {filteredConversations.map((item) => (
            <button
              className={`conversation ${selected === item.id ? "selected" : ""}`}
              key={item.id}
              onClick={() => choose(item.id)}
            >
              <div className={`conversation-type ${item.type}`}>
                <Icon name={item.type === "wish" ? "gift" : "message"} size={18} />
              </div>
              <div>
                <strong>{item.name}</strong>
                <span className="conversation-group">{item.group}</span>
                <p>{item.text}</p>
              </div>
              <span>{item.time}</span>
              {item.unread > 0 && <b>{item.unread}</b>}
            </button>
          ))}
          {filteredConversations.length === 0 && (
            <EmptyState
              icon="search"
              title="Nic jsme nenašli"
              text="Zkuste jiný výraz nebo filtr."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                >
                  Vymazat filtry
                </Button>
              }
            />
          )}
        </div>
        <div className="anonymous-info">
          <Icon name="check" size={18} />
          <p>
            <strong>Soukromí je součástí každé zprávy</strong>
            <span>Příjemce nikdy neuvidí vaši identitu ani rezervace.</span>
          </p>
        </div>
      </section>
      <section className="chat">
        <header className="chat-header">
          <button
            className="mobile-back"
            aria-label="Zpět ke konverzacím"
            onClick={() => setMobileChat(false)}
          >
            <Icon name="arrow" />
          </button>
          <div className={`conversation-type ${current.type}`}>
            <Icon name={isWish ? "gift" : "message"} size={18} />
          </div>
          <div>
            <strong>{current.name}</strong>
            <span>
              Anonymní vůči příjemci · {current.group}
              {closed && " · Uzavřeno"}
            </span>
          </div>
          <div className="chat-actions">
            <button onClick={() => setClosed(!closed)}>
              {closed ? "Znovu otevřít" : "Uzavřít"}
            </button>
            <Button variant="icon" icon="more" onClick={() => setShowActions(!showActions)} />
            {showActions && (
              <div className="chat-actions-menu">
                <button onClick={() => setBlocked(true)}>
                  <Icon name="close" size={16} /> Blokovat odesílatele
                </button>
                <button onClick={() => setReported(true)}>
                  <Icon name="bell" size={16} /> Nahlásit konverzaci
                </button>
              </div>
            )}
          </div>
        </header>
        {isWish && (
          <div className="chat-wish-context">
            <div className="product-thumb crop-headphones">
              <img src={productStillLife} alt="" />
            </div>
            <div>
              <span>DOTAZ K PŘÁNÍ</span>
              <strong>Bezdrátová sluchátka Urbanista</strong>
            </div>
            <small>Příjemce vidí pouze název přání</small>
          </div>
        )}
        {(blocked || reported) && (
          <div className={`moderation-banner ${blocked ? "blocked" : ""}`}>
            <Icon name={blocked ? "close" : "check"} size={17} />
            <div>
              <strong>{blocked ? "Odesílatel je blokovaný" : "Konverzace byla nahlášena"}</strong>
              <span>
                {blocked
                  ? "Další zprávy od tohoto anonymního účastníka neobdržíte."
                  : "Náš tým prověří obsah bez odhalení identity účastníků."}
              </span>
            </div>
            <button onClick={() => (blocked ? setBlocked(false) : setReported(false))}>Zpět</button>
          </div>
        )}
        {connectionError && (
          <div className="connection-error">
            <Icon name="clock" size={17} />
            <span>
              <strong>Zprávu se nepodařilo odeslat</strong>
              Zkontrolujte připojení a zkuste to znovu.
            </span>
            <button onClick={() => setConnectionError(false)}>Zkusit znovu</button>
          </div>
        )}
        <div className="chat-body">
          <div className="history-marker">
            <Icon name="check" size={14} /> Historie je bezpečně uchována od 9. května
          </div>
          <div className="day-divider">
            <span>Včera</span>
          </div>
          <div className="bubble-row mine">
            <div>
              <span className="sender">Vy · 18:24</span>
              <div className="bubble">
                {isWish
                  ? "Ahoj, která barevná varianta se ti líbí nejvíc?"
                  : "Ahoj, hodila by se ti pomoc s přípravou oslavy?"}
              </div>
              <span className="read-state">
                <Icon name="check" size={13} /> Přečteno
              </span>
            </div>
          </div>
          <div className="day-divider">
            <span>Dnes</span>
          </div>
          <div className="bubble-row">
            <div className="anonymous-avatar small">
              <Icon name="user" size={16} />
            </div>
            <div>
              <span className="sender">Příjemce · 10:36</span>
              <div className="bubble">
                {isWish
                  ? "Nejvíc se mi líbí zelená. Černá by ale byla také v pořádku."
                  : "To by bylo skvělé, děkuji. Ozvu se s podrobnostmi."}
              </div>
            </div>
          </div>
          <div className="bubble-row mine">
            <div>
              <span className="sender">Vy · 10:42</span>
              <div className="bubble">Super, děkuji za odpověď.</div>
              <span className="read-state">
                <Icon name="check" size={13} /> Přečteno
              </span>
            </div>
          </div>
          {sent.map((message, index) => (
            <div className="bubble-row mine" key={index}>
              <div>
                <span className="sender">Vy · právě teď</span>
                <div className="bubble">{message}</div>
              </div>
            </div>
          ))}
          {closed && (
            <div className="closed-marker">
              <Icon name="check" size={15} /> Konverzace byla uzavřena. Historie zůstává dostupná.
            </div>
          )}
        </div>
        {closed || blocked ? (
          <div className="chat-disabled">
            <span>{blocked ? "Konverzace je blokovaná." : "Konverzace je uzavřená."}</span>
            {!blocked && <button onClick={() => setClosed(false)}>Znovu otevřít</button>}
          </div>
        ) : (
          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              if (draft.trim()) {
                setSent([...sent, draft]);
                setDraft("");
              }
            }}
          >
            <div className="composer-shield" title="Odesíláte anonymně">
              <Icon name="check" size={16} />
            </div>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              aria-label="Napsat anonymní zprávu"
              placeholder="Napište anonymní zprávu…"
            />
            <button className="send-button" aria-label="Odeslat zprávu" disabled={!draft.trim()}>
              <Icon name="send" size={19} />
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

type EventType = "birthday" | "name-day" | "holiday" | "custom";

const eventLabels: Record<EventType, string> = {
  birthday: "Narozeniny",
  "name-day": "Jmeniny",
  holiday: "Svátek",
  custom: "Vlastní",
};

const calendarEvents = [
  { day: 1, title: "Svátek práce", type: "holiday" as EventType },
  { day: 8, title: "Den vítězství", type: "holiday" as EventType },
  { day: 12, title: "Pankrác", type: "name-day" as EventType },
  { day: 14, title: "Bonifác", type: "name-day" as EventType },
  { day: 18, title: "Petr má narozeniny", type: "birthday" as EventType },
  { day: 21, title: "Společná večeře", type: "custom" as EventType },
  { day: 26, title: "Lucie má narozeniny", type: "birthday" as EventType },
];

function EventTag({ type }: { type: EventType }) {
  return <span className={`event-tag ${type}`}>{eventLabels[type]}</span>;
}

function CalendarPage({ openFlow }: { openFlow: (flow: Flow) => void }) {
  const [display, setDisplay] = useState<"month" | "agenda">("month");
  const [monthIndex, setMonthIndex] = useState(4);
  const monthNames = [
    "Leden",
    "Únor",
    "Březen",
    "Duben",
    "Květen",
    "Červen",
    "Červenec",
    "Srpen",
    "Září",
    "Říjen",
    "Listopad",
    "Prosinec",
  ];
  const days = Array.from({ length: 35 }, (_, index) => {
    const value = index - 2;
    if (value <= 0) return { day: 30 + value, muted: true };
    if (value > 31) return { day: value - 31, muted: true };
    return { day: value, muted: false };
  });
  const agenda = [
    {
      date: "18",
      month: "KVĚ",
      title: "Petr má narozeniny",
      meta: "36 let · Rodina Novákových",
      type: "birthday" as EventType,
      avatar: "Petr",
    },
    {
      date: "21",
      month: "KVĚ",
      title: "Společná rodinná večeře",
      meta: "18:00 · Restaurace Eska",
      type: "custom" as EventType,
    },
    {
      date: "26",
      month: "KVĚ",
      title: "Lucie má narozeniny",
      meta: "29 let · Rodina Novákových",
      type: "birthday" as EventType,
      avatar: "Lucie",
    },
    {
      date: "02",
      month: "ČVN",
      title: "Výročí rodičů",
      meta: "35 let · Rodina Novákových",
      type: "custom" as EventType,
    },
    {
      date: "09",
      month: "ČVN",
      title: "Stanislava",
      meta: "Jmeniny · Česko",
      type: "name-day" as EventType,
    },
    {
      date: "21",
      month: "DUB",
      title: "Velikonoční pondělí",
      meta: "Státní svátek · 2025",
      type: "holiday" as EventType,
    },
  ];
  return (
    <div className="page calendar-page">
      <PageHeader
        eyebrow="KVĚTEN 2025"
        title="Kalendář"
        description="Narozeniny, jmeniny, svátky a společné události na jednom místě."
      >
        <Button icon="plus" onClick={() => openFlow("event-create")}>
          Přidat událost
        </Button>
      </PageHeader>
      <div className="calendar-toolbar">
        <div className="calendar-switch">
          <button
            className={display === "month" ? "active" : ""}
            onClick={() => setDisplay("month")}
          >
            Měsíc
          </button>
          <button
            className={display === "agenda" ? "active" : ""}
            onClick={() => setDisplay("agenda")}
          >
            Seznam
          </button>
        </div>
        <div className="month-control">
          <button
            aria-label="Předchozí měsíc"
            onClick={() => setMonthIndex((current) => (current + 11) % 12)}
          >
            <Icon name="arrow" size={17} />
          </button>
          <strong>{monthNames[monthIndex]} 2025</strong>
          <button
            aria-label="Další měsíc"
            onClick={() => setMonthIndex((current) => (current + 1) % 12)}
          >
            <Icon name="chevron" size={17} />
          </button>
          <button className="today-button" onClick={() => setMonthIndex(4)}>
            Dnes
          </button>
        </div>
      </div>
      <div className={`calendar-layout ${display === "agenda" ? "show-agenda" : ""}`}>
        <section className="month-calendar panel">
          <div className="weekdays">
            {["Po", "Út", "St", "Čt", "Pá", "So", "Ne"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {days.map((item, index) => {
              const events =
                item.muted || monthIndex !== 4
                  ? []
                  : calendarEvents.filter((event) => event.day === item.day);
              return (
                <button
                  key={`${item.day}-${index}`}
                  className={`${item.muted ? "muted" : ""} ${item.day === 14 && !item.muted ? "today" : ""}`}
                >
                  <span className="day-number">{item.day}</span>
                  <span className="calendar-day-events">
                    {events.slice(0, 2).map((event) => (
                      <span className={`calendar-event ${event.type}`} key={event.title}>
                        {event.title}
                      </span>
                    ))}
                  </span>
                  {events.length > 0 && (
                    <span className="mobile-event-dots">
                      {events.map((event) => (
                        <i className={event.type} key={event.title} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
        <aside className="calendar-agenda">
          <div className="agenda-header">
            <h2>Nadcházející</h2>
            <span>6 událostí</span>
          </div>
          <div className="agenda-list panel">
            {agenda.slice(0, 5).map((event) => (
              <article
                key={`${event.date}-${event.title}`}
                onClick={() => event.type === "custom" && openFlow("event-edit")}
                className={event.type === "custom" ? "editable" : ""}
              >
                <div className="agenda-date">
                  <strong>{event.date}</strong>
                  <span>{event.month}</span>
                </div>
                {event.avatar && <Avatar name={event.avatar} />}
                <div className="agenda-copy">
                  <EventTag type={event.type} />
                  <strong>{event.title}</strong>
                  <span>{event.meta}</span>
                </div>
                {event.type === "custom" && <Icon name="more" size={17} />}
              </article>
            ))}
          </div>
          <div className="event-legend">
            {(Object.keys(eventLabels) as EventType[]).map((type) => (
              <EventTag type={type} key={type} />
            ))}
          </div>
        </aside>
      </div>
      <section className="chronological-list">
        <SectionHeader title="Chronologický přehled" />
        <div className="timeline-month">
          <h3>Duben</h3>
          <article>
            <div className="agenda-date">
              <strong>21</strong>
              <span>DUB</span>
            </div>
            <div className="agenda-copy">
              <EventTag type="holiday" />
              <strong>Velikonoční pondělí</strong>
              <span>Státní svátek</span>
            </div>
          </article>
        </div>
        <div className="timeline-month">
          <h3>Květen</h3>
          {agenda.slice(0, 3).map((event) => (
            <article key={event.title}>
              <div className="agenda-date">
                <strong>{event.date}</strong>
                <span>{event.month}</span>
              </div>
              <div className="agenda-copy">
                <EventTag type={event.type} />
                <strong>{event.title}</strong>
                <span>{event.meta}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function EventForm({
  mode,
  onClose,
}: {
  mode: "event-create" | "event-edit";
  onClose: () => void;
}) {
  const editing = mode === "event-edit";
  const [title, setTitle] = useState(editing ? "Společná rodinná večeře" : "");
  const [type, setType] = useState<EventType>(editing ? "custom" : "birthday");
  const [date, setDate] = useState(editing ? "2025-05-21" : "2025-05-18");
  const [annual, setAnnual] = useState(!editing);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Zadejte název události.");
      return;
    }
    setSaving(true);
    window.setTimeout(onClose, 800);
  };
  return (
    <FlowShell
      title={editing ? "Upravit událost" : "Nová událost"}
      eyebrow="KALENDÁŘ SKUPINY"
      onClose={onClose}
    >
      {confirmDelete ? (
        <div className="delete-confirmation">
          <span>
            <Icon name="close" size={25} />
          </span>
          <h2>Smazat tuto událost?</h2>
          <p>Společná rodinná večeře bude odstraněna z kalendáře všech členů skupiny.</p>
          <div>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Ponechat
            </Button>
            <button className="danger-button" onClick={onClose}>
              Smazat událost
            </button>
          </div>
        </div>
      ) : (
        <form className="event-form" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="event-title">
              Název události <b>*</b>
            </label>
            <input
              id="event-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setError("");
              }}
              className={error ? "invalid" : ""}
              placeholder="Například Společná oslava"
            />
            {error && <span className="field-error">{error}</span>}
          </div>
          <fieldset className="event-type-select">
            <legend>Typ události</legend>
            <div>
              {(Object.keys(eventLabels) as EventType[]).map((item) => (
                <button
                  type="button"
                  className={type === item ? `active ${item}` : ""}
                  onClick={() => setType(item)}
                  key={item}
                >
                  <i /> {eventLabels[item]}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="form-row">
            <div className="field">
              <label htmlFor="event-date">Datum</label>
              <input
                id="event-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="event-group">Skupina</label>
              <select id="event-group" defaultValue="family">
                <option value="family">Rodina Novákových</option>
                <option value="friends">Přátelé z Brna</option>
                <option value="work">Kolegové</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="event-person">Osoba</label>
            <select id="event-person" defaultValue={type === "birthday" ? "petr" : ""}>
              <option value="">Bez konkrétní osoby</option>
              <option value="petr">Petr Novák</option>
              <option value="lucie">Lucie Nováková</option>
              <option value="tomas">Tomáš Novák</option>
            </select>
          </div>
          <label className="annual-toggle">
            <span>
              <Icon name="calendar" size={18} />
              <span>
                <strong>Opakovat každý rok</strong>
                <small>Událost se automaticky zobrazí i v dalších letech.</small>
              </span>
            </span>
            <input type="checkbox" checked={annual} onChange={() => setAnnual(!annual)} />
          </label>
          {editing && (
            <button
              type="button"
              className="delete-event-link"
              onClick={() => setConfirmDelete(true)}
            >
              Smazat vlastní událost
            </button>
          )}
          <footer className="flow-actions">
            <Button variant="ghost" onClick={onClose}>
              Zrušit
            </Button>
            <Button type="submit" icon={saving ? undefined : "check"}>
              {saving ? (
                <>
                  <span className="spinner light" /> Ukládám…
                </>
              ) : editing ? (
                "Uložit změny"
              ) : (
                "Přidat událost"
              )}
            </Button>
          </footer>
        </form>
      )}
    </FlowShell>
  );
}

function ProfilePage({
  theme,
  setTheme,
  openLogout,
  offline,
  setOffline,
}: {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  openLogout: () => void;
  offline: boolean;
  setOffline: (offline: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = () => {
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setEditing(false);
      window.setTimeout(() => setSaved(false), 1600);
    }, 700);
  };
  return (
    <div className="page profile-page">
      <PageHeader
        eyebrow="OSOBNÍ ÚČET"
        title="Profil"
        description="Spravujte osobní údaje, vzhled aplikace a přihlášení."
      >
        <Button
          variant={editing ? "primary" : "secondary"}
          icon={editing ? "check" : "settings"}
          onClick={editing ? save : () => setEditing(true)}
        >
          {saving ? "Ukládám…" : saved ? "Uloženo" : editing ? "Uložit změny" : "Upravit profil"}
        </Button>
      </PageHeader>
      <div className="profile-layout">
        <aside className="profile-card panel">
          <div className="profile-photo">
            <img src={profileJana} alt="Jana Nováková" />
            {editing && (
              <button aria-label="Změnit profilovou fotografii">
                <Icon name="settings" size={16} />
              </button>
            )}
          </div>
          <h2>Jana Nováková</h2>
          <p>jana@novakova.cz</p>
          <span className="profile-role">Členka od dubna 2023</span>
          <div className="profile-overview">
            <div>
              <strong>8</strong>
              <span>Přání</span>
            </div>
            <div>
              <strong>3</strong>
              <span>Skupiny</span>
            </div>
            <div>
              <strong>5</strong>
              <span>Rezervací</span>
            </div>
          </div>
        </aside>
        <div className="profile-settings">
          <section className="settings-section panel">
            <div className="settings-section-title">
              <span>
                <Icon name="user" size={19} />
              </span>
              <div>
                <h2>Osobní údaje</h2>
                <p>Tyto informace se zobrazují členům vašich skupin.</p>
              </div>
            </div>
            <div className="profile-form-grid">
              <div className="field">
                <label htmlFor="profile-name">Jméno a příjmení</label>
                <input id="profile-name" defaultValue="Jana Nováková" disabled={!editing} />
              </div>
              <div className="field">
                <label htmlFor="profile-email">E-mail</label>
                <input
                  id="profile-email"
                  type="email"
                  defaultValue="jana@novakova.cz"
                  disabled={!editing}
                />
              </div>
              <div className="field">
                <label htmlFor="profile-birthday">Datum narození</label>
                <input
                  id="profile-birthday"
                  type="date"
                  defaultValue="1992-09-14"
                  disabled={!editing}
                />
              </div>
            </div>
          </section>
          <section className="settings-section panel">
            <div className="settings-section-title">
              <span>
                <Icon name="sun" size={19} />
              </span>
              <div>
                <h2>Vzhled aplikace</h2>
                <p>Vyberte motiv, který vám nejlépe vyhovuje.</p>
              </div>
            </div>
            <div className="theme-options">
              {[
                ["light", "Světlý", "Jasné a čisté rozhraní", "sun"],
                ["dark", "Tmavý", "Příjemný pro oči večer", "moon"],
                ["system", "Podle systému", "Přizpůsobí se zařízení", "settings"],
              ].map(([value, label, text, icon]) => (
                <button
                  key={value}
                  className={theme === value ? "active" : ""}
                  onClick={() => setTheme(value as Theme)}
                >
                  <span>
                    <Icon name={icon as IconName} size={20} />
                  </span>
                  <strong>{label}</strong>
                  <small>{text}</small>
                  {theme === value && (
                    <i>
                      <Icon name="check" size={12} />
                    </i>
                  )}
                </button>
              ))}
            </div>
          </section>
          <section className="settings-section panel">
            <div className="settings-section-title">
              <span>
                <Icon name="link" size={19} />
              </span>
              <div>
                <h2>Připojení</h2>
                <p>Ověřte chování aplikace bez internetu.</p>
              </div>
            </div>
            <label className="offline-setting">
              <span>
                <strong>Offline režim</strong>
                <small>
                  {offline
                    ? "Zobrazujeme naposledy uložená data."
                    : "Aplikace je připojená a synchronizovaná."}
                </small>
              </span>
              <input
                type="checkbox"
                checked={offline}
                onChange={(event) => setOffline(event.target.checked)}
              />
            </label>
          </section>
          <section className="account-actions panel">
            <div>
              <h2>Účet</h2>
              <p>Odhlášením ukončíte aktuální relaci na tomto zařízení.</p>
            </div>
            <button onClick={openLogout}>Odhlásit se</button>
          </section>
        </div>
      </div>
    </div>
  );
}

function LogoutConfirmation({ onClose }: { onClose: () => void }) {
  return (
    <FlowShell title="Odhlásit se" eyebrow="POTVRZENÍ" onClose={onClose}>
      <div className="logout-confirmation">
        <div className="profile-photo small">
          <img src={profileJana} alt="" />
        </div>
        <h2>Opravdu se chcete odhlásit?</h2>
        <p>Vaše přání, rezervace a skupiny zůstanou bezpečně uložené.</p>
        <div>
          <Button variant="secondary" onClick={onClose}>
            Zůstat přihlášená
          </Button>
          <button className="logout-button" onClick={onClose}>
            Odhlásit se
          </button>
        </div>
      </div>
    </FlowShell>
  );
}

function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: IconName;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span>
        <Icon name={icon} size={25} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="page page-skeleton" aria-label="Načítání obsahu" aria-busy="true">
      <div className="skeleton-line eyebrow-line" />
      <div className="skeleton-line title-line" />
      <div className="skeleton-line copy-line" />
      <div className="skeleton-grid">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
      <span className="sr-only">Načítám…</span>
    </div>
  );
}

function Onboarding({
  onComplete,
}: {
  onComplete: (action: "overview" | "wish" | "group") => void;
}) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      eyebrow: "VÍTEJTE V DÁRKOVNÍKU",
      title: "Dárky bez dohadů",
      text: "Sdílejte přání, plánujte oslavy a rezervujte dárky. Obdarovaný nikdy neuvidí, kdo rezervaci vytvořil.",
      icon: "gift" as IconName,
    },
    {
      eyebrow: "SOUKROMÍ NA PRVNÍM MÍSTĚ",
      title: "Přehledné a anonymní",
      text: "Rezervace i anonymní dotazy zůstávají skryté. Ostatní uvidí jen informace, které sami nasdílíte.",
      icon: "check" as IconName,
    },
    {
      eyebrow: "PRVNÍ KROK",
      title: "Jak chcete začít?",
      text: "Přidejte první přání nebo vytvořte skupinu pro své blízké.",
      icon: "heart" as IconName,
    },
  ];
  const current = steps[step];
  return (
    <div
      className="onboarding-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div className="onboarding-card">
        <div className="onboarding-visual">
          <span className="onboarding-mark">
            <Icon name={current.icon} size={34} />
          </span>
          <div className="onboarding-orbit one" />
          <div className="onboarding-orbit two" />
          <div className="brand onboarding-brand">
            <span className="brand-mark">
              <Icon name="gift" size={19} />
            </span>
            <strong>Dárkovník</strong>
          </div>
        </div>
        <div className="onboarding-content">
          <button className="onboarding-skip" onClick={() => onComplete("overview")}>
            Přeskočit
          </button>
          <p className="eyebrow">{current.eyebrow}</p>
          <h1 id="welcome-title">{current.title}</h1>
          <p>{current.text}</p>
          <div className="onboarding-progress" aria-label={`Krok ${step + 1} ze 3`}>
            {steps.map((_, index) => (
              <i className={index === step ? "active" : ""} key={index} />
            ))}
          </div>
          {step < 2 ? (
            <Button icon="chevron" onClick={() => setStep(step + 1)}>
              Pokračovat
            </Button>
          ) : (
            <div className="onboarding-actions">
              <Button icon="plus" onClick={() => onComplete("wish")}>
                Přidat přání
              </Button>
              <Button variant="secondary" icon="users" onClick={() => onComplete("group")}>
                Vytvořit skupinu
              </Button>
            </div>
          )}
          <small>Účet je připravený. Nic dalšího nemusíte nastavovat.</small>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("overview");
  const [flow, setFlow] = useState<Flow>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const [dark, setDark] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [networkOnline, setNetworkOnline] = useState(navigator.onLine);
  const [offlineOverride, setOfflineOverride] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => sessionStorage.getItem("darkovnik-onboarding") !== "done",
  );
  const offline = offlineOverride || !networkOnline;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const nextDark = theme === "dark" || (theme === "system" && media.matches);
      setDark(nextDark);
      document.documentElement.classList.toggle("dark", nextDark);
    };
    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    const online = () => setNetworkOnline(true);
    const offlineListener = () => setNetworkOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offlineListener);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offlineListener);
    };
  }, []);

  const navigate = (next: Screen) => {
    if (next !== screen) {
      setRouteLoading(true);
      window.setTimeout(() => setRouteLoading(false), 420);
    }
    setScreen(next);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Přeskočit na obsah
      </a>
      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <Icon name="gift" size={21} />
          </span>
          <strong>Dárkovník</strong>
          <button
            className="sidebar-notifications"
            onClick={() => setFlow("notifications")}
            aria-label="Oznámení, 3 nová"
          >
            <Icon name="bell" size={18} />
            <i>3</i>
          </button>
          <button
            className="close-menu"
            onClick={() => setMobileMenu(false)}
            aria-label="Zavřít menu"
          >
            <Icon name="close" />
          </button>
        </div>
        <nav aria-label="Hlavní navigace">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={screen === item.id ? "active" : ""}
              aria-current={screen === item.id ? "page" : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === "messages" && <b>2</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="theme-toggle" onClick={() => setTheme(dark ? "light" : "dark")}>
            <Icon name={dark ? "sun" : "moon"} />
            <span>{dark ? "Světlý režim" : "Tmavý režim"}</span>
          </button>
          <button className="profile-chip" onClick={() => navigate("profile")}>
            <Avatar name="Jana" />
            <span>
              <strong>Jana Nováková</strong>
              <small>jana@novakova.cz</small>
            </span>
            <Icon name="more" size={18} />
          </button>
        </div>
      </aside>
      {mobileMenu && (
        <button className="scrim" onClick={() => setMobileMenu(false)} aria-label="Zavřít menu" />
      )}

      <div className="content-shell">
        <header className="mobile-header">
          <button onClick={() => setMobileMenu(true)} aria-label="Otevřít menu">
            <Icon name="menu" />
          </button>
          <div className="brand">
            <span className="brand-mark">
              <Icon name="gift" size={18} />
            </span>
            <strong>Dárkovník</strong>
          </div>
          <div className="mobile-header-actions">
            <button onClick={() => setFlow("notifications")} aria-label="Oznámení, 3 nová">
              <Icon name="bell" />
              <i>3</i>
            </button>
            <button
              onClick={() => setTheme(dark ? "light" : "dark")}
              aria-label={dark ? "Zapnout světlý režim" : "Zapnout tmavý režim"}
            >
              <Icon name={dark ? "sun" : "moon"} />
            </button>
          </div>
        </header>
        {offline && (
          <div className="offline-banner" role="status">
            <Icon name="link" size={17} />
            <span>
              <strong>Jste offline</strong>
              Zobrazujeme naposledy uložená data. Změny se odešlou po připojení.
            </span>
            {offlineOverride && <button onClick={() => setOfflineOverride(false)}>Připojit</button>}
          </div>
        )}
        <main id="main-content" tabIndex={-1}>
          {routeLoading ? (
            <PageSkeleton />
          ) : (
            <>
              {screen === "overview" && <Overview goTo={navigate} openFlow={setFlow} />}
              {screen === "wishes" && <Wishes openFlow={setFlow} />}
              {screen === "groups" && <GroupsWorkspace openFlow={setFlow} />}
              {screen === "messages" && <Messages openFlow={setFlow} />}
              {screen === "calendar" && <CalendarPage openFlow={setFlow} />}
              {screen === "profile" && (
                <ProfilePage
                  theme={theme}
                  setTheme={setTheme}
                  openLogout={() => setFlow("logout")}
                  offline={offline}
                  setOffline={setOfflineOverride}
                />
              )}
            </>
          )}
        </main>
      </div>

      {(flow === "create" || flow === "edit") && (
        <WishForm mode={flow} onClose={() => setFlow(null)} onDone={() => setFlow("detail")} />
      )}
      {flow === "detail" && <WishDetail onClose={() => setFlow(null)} openFlow={setFlow} />}
      {flow === "share" && <ShareWish onClose={() => setFlow(null)} />}
      {flow === "group-create" && (
        <CreateGroup onClose={() => setFlow(null)} onCreated={() => setFlow("group-settings")} />
      )}
      {flow === "group-invite" && <InviteMembers onClose={() => setFlow(null)} />}
      {flow === "group-settings" && (
        <GroupSettings onClose={() => setFlow(null)} openInvite={() => setFlow("group-invite")} />
      )}
      {flow === "group-sharing" && <MemberGroupSettings onClose={() => setFlow(null)} />}
      {(flow === "event-create" || flow === "event-edit") && (
        <EventForm mode={flow} onClose={() => setFlow(null)} />
      )}
      {flow === "logout" && <LogoutConfirmation onClose={() => setFlow(null)} />}
      {(flow === "new-wish-message" || flow === "new-member-message") && (
        <NewAnonymousMessage
          type={flow === "new-wish-message" ? "wish" : "member"}
          onClose={() => setFlow(null)}
          openMessages={() => {
            setFlow(null);
            navigate("messages");
          }}
        />
      )}
      {flow === "notifications" && (
        <NotificationCenter
          onClose={() => setFlow(null)}
          openMessages={() => {
            setFlow(null);
            navigate("messages");
          }}
        />
      )}
      {(flow === "reserve" || flow === "manage" || flow === "received") && (
        <ReservationFlow mode={flow} onClose={() => setFlow(null)} switchFlow={setFlow} />
      )}

      <nav className="bottom-nav" aria-label="Mobilní navigace">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className={screen === item.id ? "active" : ""}
            aria-current={screen === item.id ? "page" : undefined}
          >
            <span>
              <Icon name={item.icon} size={20} />
              {item.id === "messages" && <i>2</i>}
            </span>
            <small>{item.label === "Moje přání" ? "Přání" : item.label}</small>
          </button>
        ))}
      </nav>
      {showOnboarding && (
        <Onboarding
          onComplete={(action) => {
            sessionStorage.setItem("darkovnik-onboarding", "done");
            setShowOnboarding(false);
            if (action === "wish") setFlow("create");
            if (action === "group") setFlow("group-create");
          }}
        />
      )}
    </div>
  );
}
export { Icon };
