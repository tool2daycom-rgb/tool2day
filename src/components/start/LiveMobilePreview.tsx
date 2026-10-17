"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/content";
import {
  getMobilePreviewCopy,
  inferAppKind,
  type AppKind,
  type MobilePreviewCopy,
} from "@/content/mobile-preview-i18n";
import type { getStartFormCopy } from "@/content/start-form";

type FormCopy = ReturnType<typeof getStartFormCopy>;

type Props = {
  locale: Locale;
  selected: string[];
  featureLabels: FormCopy["mobileFeatures"];
};

type Screen =
  | "home"
  | "browse"
  | "cart"
  | "checkout"
  | "orders"
  | "map"
  | "chat"
  | "inbox"
  | "files"
  | "camera"
  | "scan"
  | "profile"
  | "auth"
  | "admin";

type TabDef = { id: Screen; label: string };

function hasAny(selected: string[], ids: string[]) {
  return ids.some((id) => selected.includes(id));
}

function availableScreens(selected: string[]): Set<Screen> {
  const set = new Set<Screen>(["home", "browse", "profile"]);
  if (selected.includes("cart-orders")) set.add("cart");
  if (hasAny(selected, ["payments", "coupons", "subscriptions"])) set.add("checkout");
  if (hasAny(selected, ["order-status", "live-tracking"])) set.add("orders");
  if (hasAny(selected, ["maps-directions", "live-tracking"])) set.add("map");
  if (selected.includes("chat")) set.add("chat");
  if (selected.includes("in-app-messages")) set.add("inbox");
  if (selected.includes("file-transfer")) set.add("files");
  if (selected.includes("camera-upload")) set.add("camera");
  if (selected.includes("qr-scan")) set.add("scan");
  if (selected.includes("auth-login")) set.add("auth");
  if (hasAny(selected, ["admin-dashboard", "analytics", "external-api"])) set.add("admin");
  return set;
}

function buildTabs(
  kind: AppKind,
  selected: string[],
  app: MobilePreviewCopy["apps"][AppKind],
): TabDef[] {
  const tabs: TabDef[] = [{ id: "home", label: app.tabHome }];

  if (kind === "shop") {
    tabs.push({ id: "browse", label: app.tabBrowse });
    if (selected.includes("cart-orders")) tabs.push({ id: "cart", label: app.tabCart });
    else if (hasAny(selected, ["order-status", "live-tracking"]))
      tabs.push({ id: "orders", label: app.tabOrders });
  } else if (kind === "delivery") {
    if (hasAny(selected, ["maps-directions", "live-tracking", "order-status"]))
      tabs.push({ id: "map", label: app.tabTrack });
    else tabs.push({ id: "browse", label: app.tabBrowse });
    if (selected.includes("qr-scan")) tabs.push({ id: "scan", label: app.tabScan });
    else if (selected.includes("chat")) tabs.push({ id: "chat", label: app.tabInbox });
  } else if (kind === "client") {
    if (selected.includes("file-transfer")) tabs.push({ id: "files", label: app.tabFiles });
    else tabs.push({ id: "browse", label: app.tabBrowse });
    if (selected.includes("chat")) tabs.push({ id: "chat", label: app.tabInbox });
    else if (selected.includes("in-app-messages"))
      tabs.push({ id: "inbox", label: app.tabInbox });
  } else {
    tabs.push({ id: "browse", label: app.tabBrowse });
    if (selected.includes("chat") || selected.includes("in-app-messages"))
      tabs.push({
        id: selected.includes("chat") ? "chat" : "inbox",
        label: app.tabInbox,
      });
  }

  tabs.push({ id: "profile", label: app.tabProfile });
  return tabs.slice(0, 4);
}

function screenTitle(
  screen: Screen,
  p: MobilePreviewCopy,
  app: MobilePreviewCopy["apps"][AppKind],
): string {
  switch (screen) {
    case "home":
      return app.name;
    case "browse":
      return app.tabBrowse;
    case "cart":
      return p.cartTitle;
    case "checkout":
      return p.payTitle;
    case "orders":
      return p.orderTitle;
    case "map":
      return p.mapTitle;
    case "chat":
      return p.chatTitle;
    case "inbox":
      return p.messagesTitle;
    case "files":
      return p.filesTitle;
    case "camera":
      return p.cameraTitle;
    case "scan":
      return p.qrTitle;
    case "profile":
      return p.profileTitle;
    case "auth":
      return p.authTitle;
    case "admin":
      return p.adminTitle;
  }
}

function DemoCue({ label, note }: { label: string; note: string }) {
  return (
    <p className="phone-demo-cue">
      <span>{label}</span> {note}
    </p>
  );
}

export function LiveMobilePreview({ locale, selected, featureLabels }: Props) {
  const p = getMobilePreviewCopy(locale);
  const [outerTab, setOuterTab] = useState<"preview" | "examples">("preview");
  const [screen, setScreen] = useState<Screen>("home");
  const [stack, setStack] = useState<Screen[]>([]);

  const kind = useMemo(() => inferAppKind(selected), [selected]);
  const app = p.apps[kind];
  const has = (id: string) => selected.includes(id);
  const screens = useMemo(() => availableScreens(selected), [selected]);
  const tabs = useMemo(() => buildTabs(kind, selected, app), [kind, selected, app]);
  const largeText = has("a11y");

  useEffect(() => {
    if (!screens.has(screen)) {
      setScreen("home");
      setStack([]);
    }
  }, [screens, screen]);

  useEffect(() => {
    setScreen("home");
    setStack([]);
  }, [kind]);

  function go(next: Screen) {
    if (!screens.has(next) && next !== "home" && next !== "browse" && next !== "profile") {
      return;
    }
    setStack((prev) => [...prev, screen]);
    setScreen(next);
  }

  function goTab(next: Screen) {
    setStack([]);
    setScreen(next);
  }

  function goBack() {
    setStack((prev) => {
      if (!prev.length) {
        setScreen("home");
        return prev;
      }
      const copy = [...prev];
      const last = copy.pop()!;
      setScreen(last);
      return copy;
    });
  }

  const showBack = stack.length > 0 && !tabs.some((t) => t.id === screen);
  const title = screenTitle(screen, p, app);

  function heroAction() {
    if (kind === "shop" && has("cart-orders")) go("cart");
    else if (kind === "shop" && (has("payments") || has("coupons") || has("subscriptions")))
      go("checkout");
    else if (kind === "delivery" && screens.has("map")) go("map");
    else if (kind === "client" && has("chat")) go("chat");
    else if (kind === "client" && has("in-app-messages")) go("inbox");
    else go("browse");
  }

  function tabIsActive(tabId: Screen) {
    if (screen === tabId) return true;
    if (tabId === "cart" && screen === "checkout") return true;
    if (
      tabId === "profile" &&
      (screen === "auth" || screen === "admin" || screen === "camera" || screen === "files")
    )
      return true;
    if (tabId === "map" && screen === "orders") return true;
    if (tabId === "files" && screen === "camera") return true;
    return false;
  }

  return (
    <div className="live-preview live-mobile">
      <div className="live-tabs" role="tablist" aria-label={p.tabPreview}>
        <button
          type="button"
          role="tab"
          aria-selected={outerTab === "preview"}
          className={outerTab === "preview" ? "is-active" : undefined}
          onClick={() => setOuterTab("preview")}
        >
          {p.tabPreview}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={outerTab === "examples"}
          className={outerTab === "examples" ? "is-active" : undefined}
          onClick={() => setOuterTab("examples")}
        >
          {p.tabExamples}
        </button>
      </div>

      {outerTab === "preview" ? (
        <div className="live-frame mobile-frame-wrap" role="tabpanel">
          <div className="iphone-frame" aria-label={app.name}>
            <div className="iphone-side-btn iphone-silent" aria-hidden="true" />
            <div className="iphone-side-btn iphone-vol-up" aria-hidden="true" />
            <div className="iphone-side-btn iphone-vol-down" aria-hidden="true" />
            <div className="iphone-side-btn iphone-power" aria-hidden="true" />

            <div
              className={`iphone-screen ${largeText ? "is-a11y" : ""}`}
              lang={locale}
              translate="no"
            >
              <div className="iphone-status" aria-hidden="true">
                <span className="iphone-time">9:41</span>
                <span className="iphone-island" />
                <span className="iphone-status-icons">
                  <span className="iphone-signal" />
                  <span className="iphone-wifi" />
                  <span className="iphone-battery" />
                </span>
              </div>

              {has("in-app-notify") && screen === "home" ? (
                <div className="phone-toast reveal-block" role="status">
                  <strong>{p.pushTitle}</strong>
                  <span>{p.pushBody}</span>
                  <em>{p.pushTime}</em>
                </div>
              ) : null}

              {has("offline-sync") ? (
                <div className="phone-offline-bar reveal-block">{p.offlineBadge}</div>
              ) : null}

              <header className="phone-nav-bar">
                {showBack ? (
                  <button type="button" className="phone-back" onClick={goBack}>
                    ‹ {p.back}
                  </button>
                ) : (
                  <strong className="phone-nav-brand">{app.name}</strong>
                )}
                <span className="phone-nav-title">{showBack ? title : ""}</span>
                <span className="phone-nav-trail">
                  {has("cart-orders") && screen !== "cart" ? (
                    <button
                      type="button"
                      className="phone-icon-btn"
                      aria-label={app.tabCart}
                      onClick={() => go("cart")}
                    >
                      <span className="phone-cart-glyph" aria-hidden="true" />
                      <i>1</i>
                    </button>
                  ) : null}
                </span>
              </header>

              <div className="phone-body phone-app-body">
                {!selected.length ? (
                  <section className="phone-empty-state">
                    <h3>{app.greeting}</h3>
                    <p>{p.emptyHint}</p>
                  </section>
                ) : null}

                {selected.length && screen === "home" ? (
                  <HomeScreen
                    p={p}
                    app={app}
                    kind={kind}
                    has={has}
                    onBrowse={() => goTab("browse")}
                    onHero={heroAction}
                    onOrders={() => go(screens.has("orders") ? "orders" : "map")}
                    onMap={() => go("map")}
                    onChat={() => go(has("chat") ? "chat" : "inbox")}
                    onFiles={() => go("files")}
                  />
                ) : null}

                {selected.length && screen === "browse" ? (
                  <BrowseScreen p={p} app={app} has={has} onOpenItem={heroAction} />
                ) : null}

                {screen === "cart" ? (
                  <CartScreen
                    p={p}
                    app={app}
                    has={has}
                    onCheckout={() => go(has("payments") || has("coupons") ? "checkout" : "orders")}
                  />
                ) : null}

                {screen === "checkout" ? <CheckoutScreen p={p} has={has} /> : null}

                {screen === "orders" ? (
                  <OrdersScreen p={p} has={has} onMap={() => go("map")} />
                ) : null}

                {screen === "map" ? <MapScreen p={p} has={has} /> : null}

                {screen === "chat" ? <ChatScreen p={p} /> : null}

                {screen === "inbox" ? <InboxScreen p={p} /> : null}

                {screen === "files" ? <FilesScreen p={p} /> : null}

                {screen === "camera" ? <CameraScreen p={p} /> : null}

                {screen === "scan" ? <ScanScreen p={p} /> : null}

                {screen === "profile" ? (
                  <ProfileScreen
                    p={p}
                    has={has}
                    onAuth={() => go("auth")}
                    onAdmin={() => go("admin")}
                    onCamera={() => go("camera")}
                    onFiles={() => go("files")}
                  />
                ) : null}

                {screen === "auth" ? <AuthScreen p={p} has={has} /> : null}

                {screen === "admin" ? <AdminScreen p={p} has={has} /> : null}
              </div>

              <nav className="phone-tabs" aria-label={app.name}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={tabIsActive(tab.id) ? "is-active" : undefined}
                    onClick={() => goTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="iphone-home-indicator" aria-hidden="true" />
            </div>
          </div>
        </div>
      ) : (
        <div className="live-examples" role="tabpanel">
          <p className="live-examples-lead">{p.examplesLead}</p>
          <ul className="live-example-list">
            {p.examples.map((example) => (
              <li key={example.id}>
                <div>
                  <strong>{example.title}</strong>
                  <p>{example.audience}</p>
                  <p>{example.problem}</p>
                </div>
                <details>
                  <summary>{p.viewExample}</summary>
                  {example.href ? (
                    <p className="demo-meta">
                      <a href={example.href} target="_blank" rel="noopener noreferrer">
                        {example.href}
                      </a>
                      <br />
                      {p.externalNote}
                    </p>
                  ) : (
                    <p className="demo-meta">
                      <span className="demo-badge">{p.demoShort}</span> {p.demoOnly}
                    </p>
                  )}
                </details>
              </li>
            ))}
          </ul>
          {selected.length ? (
            <ul className="live-example-list selected-features">
              {selected.map((id) => (
                <li key={id}>
                  <strong>{featureLabels[id]?.label ?? id}</strong>
                  <p>{featureLabels[id]?.desc}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="demo-empty">{p.examplesEmpty}</p>
          )}
        </div>
      )}
    </div>
  );
}

function HomeScreen({
  p,
  app,
  kind,
  has,
  onBrowse,
  onHero,
  onOrders,
  onMap,
  onChat,
  onFiles,
}: {
  p: MobilePreviewCopy;
  app: MobilePreviewCopy["apps"][AppKind];
  kind: AppKind;
  has: (id: string) => boolean;
  onBrowse: () => void;
  onHero: () => void;
  onOrders: () => void;
  onMap: () => void;
  onChat: () => void;
  onFiles: () => void;
}) {
  return (
    <div className="phone-screen-home">
      <div className="phone-home-head">
        <p className="phone-kicker">{app.greeting}</p>
        <h3>{app.homeSub}</h3>
      </div>

      {has("search-filters") ? (
        <button type="button" className="phone-search-pill" onClick={onBrowse}>
          {p.searchPlaceholder}
        </button>
      ) : null}

      {kind === "delivery" && (has("maps-directions") || has("live-tracking")) ? (
        <button type="button" className="phone-map-card" onClick={onMap}>
          <div className="demo-map phone-map-panel" aria-hidden="true">
            <span className="demo-pin" />
            <span className="phone-map-route" />
            <span className="phone-map-dot" />
          </div>
          <div className="phone-map-meta">
            <strong>{app.items[0].title}</strong>
            <p>{has("live-tracking") ? p.trackStatus : app.items[0].meta}</p>
            {has("live-tracking") ? <em>{p.mapEta}</em> : null}
          </div>
        </button>
      ) : null}

      {kind === "shop" || kind === "booking" ? (
        <ul className="phone-product-list">
          {app.items.slice(0, 2).map((item) => (
            <li key={item.title}>
              <button type="button" className="phone-product" onClick={onBrowse}>
                <span className={`phone-thumb tone-${(item.title.length % 3) + 1}`} />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                </span>
                {item.price ? <em>{item.price}</em> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {kind === "client" ? (
        <ul className="phone-feed phone-tight">
          {app.items.slice(0, 2).map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.meta}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {kind === "delivery" && !has("maps-directions") && !has("live-tracking") ? (
        <ul className="phone-feed phone-tight">
          {app.items.slice(0, 2).map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.meta}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {has("reviews") ? (
        <div className="phone-inline-note">
          <strong>{p.reviewsLabel}</strong>
          <p>{p.reviewSample}</p>
        </div>
      ) : null}

      {has("coupons") && kind === "shop" ? (
        <div className="phone-coupon-chip">
          <code>{p.couponCode}</code>
          <span>{p.couponApplied}</span>
        </div>
      ) : null}

      <div className="phone-home-actions">
        <button type="button" className="demo-btn solid" onClick={onHero}>
          {app.heroCta}
        </button>
        {has("order-status") ? (
          <button type="button" className="demo-btn" onClick={onOrders}>
            {p.orderTitle}
          </button>
        ) : null}
        {(has("chat") || has("in-app-messages")) && kind !== "client" ? (
          <button type="button" className="demo-btn" onClick={onChat}>
            {has("chat") ? p.chatTitle : p.messagesTitle}
          </button>
        ) : null}
        {has("file-transfer") && kind === "client" ? (
          <button type="button" className="demo-btn" onClick={onFiles}>
            {p.filesTitle}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function BrowseScreen({
  p,
  app,
  has,
  onOpenItem,
}: {
  p: MobilePreviewCopy;
  app: MobilePreviewCopy["apps"][AppKind];
  has: (id: string) => boolean;
  onOpenItem: () => void;
}) {
  return (
    <div className="phone-screen-stack">
      {has("search-filters") ? (
        <div className="phone-search-row">
          <input
            className="phone-search-input"
            placeholder={p.searchPlaceholder}
            aria-label={p.searchPlaceholder}
            readOnly
          />
          <span className="phone-chip">{p.filtersLabel}</span>
        </div>
      ) : null}

      {has("favorites") ? (
        <p className="phone-section-label">{p.favoritesLabel}</p>
      ) : null}

      <ul className="phone-product-list">
        {app.items.map((item) => (
          <li key={item.title}>
            <button type="button" className="phone-product" onClick={onOpenItem}>
              <span className={`phone-thumb tone-${(item.title.length % 3) + 1}`} />
              <span>
                <strong>{item.title}</strong>
                <small>{item.meta}</small>
              </span>
              {item.price ? <em>{item.price}</em> : null}
            </button>
          </li>
        ))}
      </ul>

      {has("reviews") ? (
        <div className="phone-inline-note">
          <strong>{p.reviewsLabel}</strong>
          <p>{p.reviewSample}</p>
        </div>
      ) : null}
    </div>
  );
}

function CartScreen({
  p,
  app,
  has,
  onCheckout,
}: {
  p: MobilePreviewCopy;
  app: MobilePreviewCopy["apps"][AppKind];
  has: (id: string) => boolean;
  onCheckout: () => void;
}) {
  const item = app.items[0];
  return (
    <div className="phone-screen-stack">
      <div className="phone-cart-line">
        <span className={`phone-thumb tone-1`} />
        <div>
          <strong>{item.title}</strong>
          <p>
            {p.cartQty} · {item.price ?? item.meta}
          </p>
        </div>
      </div>
      {has("coupons") ? (
        <div className="phone-coupon-chip">
          <code>{p.couponCode}</code>
          <span>{p.couponApplied}</span>
        </div>
      ) : null}
      <p className="phone-total">
        <strong>{p.cartTotal}</strong>
      </p>
      <button type="button" className="demo-btn solid" onClick={onCheckout}>
        {has("payments") ? p.checkoutCta : app.heroCta}
      </button>
    </div>
  );
}

function CheckoutScreen({
  p,
  has,
}: {
  p: MobilePreviewCopy;
  has: (id: string) => boolean;
}) {
  return (
    <div className="phone-screen-stack">
      <DemoCue label={p.demoShort} note={p.payNote} />
      {has("subscriptions") ? (
        <div className="phone-plan">
          <strong>{p.subPlan}</strong>
          <span>{p.subPrice}</span>
        </div>
      ) : null}
      <div className="phone-pay-row">
        <span>{p.payMethod}</span>
        <strong>{p.cartTotal}</strong>
      </div>
      {has("coupons") ? (
        <div className="phone-coupon-chip">
          <code>{p.couponCode}</code>
          <span>{p.couponLabel}</span>
        </div>
      ) : null}
      <button type="button" className="demo-btn solid" onClick={(e) => e.preventDefault()}>
        {p.payBtn}
      </button>
    </div>
  );
}

function OrdersScreen({
  p,
  has,
  onMap,
}: {
  p: MobilePreviewCopy;
  has: (id: string) => boolean;
  onMap: () => void;
}) {
  return (
    <div className="phone-screen-stack">
      <div className="phone-order-card">
        <strong>{p.orderId}</strong>
        <p>{p.orderSteps[1]}</p>
        <div className="phone-progress" aria-hidden="true">
          <span className="is-on" />
          <span className="is-on" />
          <span />
        </div>
        <ol className="phone-steps">
          {p.orderSteps.map((step, i) => (
            <li key={step} className={i < 2 ? "is-on" : undefined}>
              {step}
            </li>
          ))}
        </ol>
      </div>
      {has("maps-directions") || has("live-tracking") ? (
        <button type="button" className="demo-btn" onClick={onMap}>
          {p.mapTitle}
        </button>
      ) : null}
    </div>
  );
}

function MapScreen({ p, has }: { p: MobilePreviewCopy; has: (id: string) => boolean }) {
  return (
    <div className="phone-screen-stack">
      <DemoCue label={p.demoShort} note={p.mapNote} />
      <div className="phone-map-card is-full">
        <div className="demo-map phone-map-panel is-tall" aria-hidden="true">
          <span className="demo-pin" />
          <span className="phone-map-route" />
          <span className="phone-map-dot" />
        </div>
        <div className="phone-map-meta">
          <strong>{has("live-tracking") ? p.trackStatus : p.mapTitle}</strong>
          {has("live-tracking") ? <em>{p.mapEta}</em> : null}
        </div>
      </div>
    </div>
  );
}

function ChatScreen({ p }: { p: MobilePreviewCopy }) {
  return (
    <div className="phone-screen-stack">
      <div className="phone-chat">
        <p className="bubble in">{p.chatSample}</p>
        <p className="bubble out">{p.chatReply}</p>
      </div>
      <div className="phone-composer">
        <span>{p.chatPlaceholder}</span>
        <em>↑</em>
      </div>
    </div>
  );
}

function InboxScreen({ p }: { p: MobilePreviewCopy }) {
  return (
    <ul className="phone-feed phone-tight">
      {p.messages.map((msg) => (
        <li key={msg}>{msg}</li>
      ))}
    </ul>
  );
}

function FilesScreen({ p }: { p: MobilePreviewCopy }) {
  return (
    <div className="phone-screen-stack">
      <ul className="phone-feed phone-tight">
        {p.files.map((file) => (
          <li key={file}>{file}</li>
        ))}
      </ul>
      <button type="button" className="demo-btn solid" onClick={(e) => e.preventDefault()}>
        {p.filesBtn}
      </button>
    </div>
  );
}

function CameraScreen({ p }: { p: MobilePreviewCopy }) {
  return (
    <div className="phone-screen-stack">
      <DemoCue label={p.demoShort} note={p.cameraNote} />
      <div className="phone-camera" aria-hidden="true">
        <span className="phone-lens" />
      </div>
      <button type="button" className="demo-btn solid" onClick={(e) => e.preventDefault()}>
        {p.cameraBtn}
      </button>
    </div>
  );
}

function ScanScreen({ p }: { p: MobilePreviewCopy }) {
  return (
    <div className="phone-screen-stack">
      <DemoCue label={p.demoShort} note={p.cameraNote} />
      <p className="demo-meta">{p.qrHint}</p>
      <div className="phone-qr" aria-hidden="true" />
    </div>
  );
}

function ProfileScreen({
  p,
  has,
  onAuth,
  onAdmin,
  onCamera,
  onFiles,
}: {
  p: MobilePreviewCopy;
  has: (id: string) => boolean;
  onAuth: () => void;
  onAdmin: () => void;
  onCamera: () => void;
  onFiles: () => void;
}) {
  return (
    <div className="phone-screen-stack">
      <div className="phone-profile">
        <span className="app-avatar" />
        <div>
          <strong>{p.profileName}</strong>
          <p className="demo-meta">{p.profileEmail}</p>
        </div>
      </div>
      <ul className="phone-settings-list">
        {has("auth-login") ? (
          <li>
            <button type="button" onClick={onAuth}>
              {p.authTitle}
            </button>
          </li>
        ) : null}
        {has("multilang") ? <li>{p.langRow}</li> : null}
        {has("device-sync") ? <li>{p.syncRow}</li> : null}
        {has("a11y") ? <li>{p.a11yRow}</li> : null}
        {has("camera-upload") ? (
          <li>
            <button type="button" onClick={onCamera}>
              {p.cameraTitle}
            </button>
          </li>
        ) : null}
        {has("file-transfer") ? (
          <li>
            <button type="button" onClick={onFiles}>
              {p.filesTitle}
            </button>
          </li>
        ) : null}
        {has("admin-dashboard") || has("analytics") || has("external-api") ? (
          <li>
            <button type="button" onClick={onAdmin}>
              {p.adminTitle}
            </button>
          </li>
        ) : null}
        <li>{p.profileSettings}</li>
      </ul>
    </div>
  );
}

function AuthScreen({ p, has }: { p: MobilePreviewCopy; has: (id: string) => boolean }) {
  return (
    <div className="phone-screen-stack">
      <DemoCue label={p.demoShort} note={p.authNote} />
      <form className="demo-login" onSubmit={(e) => e.preventDefault()}>
        <label>
          <span>{p.authEmail}</span>
          <input type="email" autoComplete="off" defaultValue={p.profileEmail} readOnly />
        </label>
        <label>
          <span>{p.authPassword}</span>
          <input type="password" autoComplete="off" defaultValue="••••••••" readOnly />
        </label>
        <button type="submit">{p.authBtn}</button>
        <button type="button" className="demo-btn" onClick={(e) => e.preventDefault()}>
          {p.authSocial}
        </button>
        {has("biometrics") ? (
          <>
            <button type="button" className="demo-btn" onClick={(e) => e.preventDefault()}>
              {p.bioBtn}
            </button>
            <DemoCue label={p.demoShort} note={p.bioNote} />
          </>
        ) : null}
      </form>
    </div>
  );
}

function AdminScreen({ p, has }: { p: MobilePreviewCopy; has: (id: string) => boolean }) {
  return (
    <div className="phone-screen-stack">
      {has("admin-dashboard") ? (
        <div className="app-kpi-grid">
          <div>
            <span>{p.adminUsers}</span>
          </div>
          <div>
            <span>{p.adminOrders}</span>
          </div>
        </div>
      ) : null}
      {has("analytics") ? (
        <>
          <p className="phone-section-label">{p.analyticsTitle}</p>
          <div className="app-chart" aria-hidden="true">
            {[40, 55, 35, 70, 48, 80, 60].map((h, i) => (
              <span key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        </>
      ) : null}
      {has("external-api") ? (
        <div className="phone-inline-note">
          <strong>{p.apiTitle}</strong>
          <p>{p.apiSynced}</p>
        </div>
      ) : null}
    </div>
  );
}
