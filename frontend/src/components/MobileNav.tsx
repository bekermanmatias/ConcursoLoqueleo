import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { NavItem } from "../data/nav";

type Props = {
  items: NavItem[];
};

const PANEL_ID = "mobile-nav-panel";

export default function MobileNav({ items }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("mobile-nav-open", open);
    return () => document.body.classList.remove("mobile-nav-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (media.matches) setOpen(false);
    };

    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);

  const close = () => setOpen(false);

  const overlay =
    mounted &&
    createPortal(
      <>
        <div
          className={`mobile-nav-backdrop${open ? " mobile-nav-backdrop--visible" : ""}`}
          onClick={close}
          aria-hidden={!open}
        />

        <nav
          id={PANEL_ID}
          className={`mobile-nav-panel${open ? " mobile-nav-panel--open" : ""}`}
          aria-label="Menú principal"
          aria-hidden={!open}
        >
          <div className="mobile-nav-panel-head">
            <p className="mobile-nav-panel-label">Menú</p>
            <button type="button" className="mobile-nav-close" aria-label="Cerrar menú" onClick={close}>
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <ul className="mobile-nav-list">
            {items.map((item) => (
              <li key={item.section}>
                <a
                  href={item.href}
                  data-nav-link
                  data-section={item.section}
                  className="mobile-nav-link nav-link group"
                  onClick={close}
                >
                  <span className="mobile-nav-link-text">{item.label}</span>
                  <span
                    className="nav-link-indicator mobile-nav-link-indicator"
                    style={{
                      backgroundColor: "var(--color-brand-red)",
                      WebkitMaskImage: "url('/libro.svg')",
                      WebkitMaskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      WebkitMaskSize: "contain",
                      maskImage: "url('/libro.svg')",
                      maskRepeat: "no-repeat",
                      maskPosition: "center",
                      maskSize: "contain",
                    }}
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </>,
      document.body,
    );

  return (
    <div className="mobile-nav md:hidden">
      <button
        type="button"
        className={`mobile-nav-toggle${open ? " mobile-nav-toggle--open" : ""}`}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        aria-label={open ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="mobile-nav-toggle-icon" aria-hidden="true">
          <span className="mobile-nav-toggle-bar" />
          <span className="mobile-nav-toggle-bar" />
          <span className="mobile-nav-toggle-bar" />
        </span>
      </button>

      {overlay}
    </div>
  );
}
