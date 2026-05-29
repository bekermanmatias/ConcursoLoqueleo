import { useEffect } from "react";

const SECTIONS = ["inicio", "como-participar", "retos", "premios"] as const;

type SectionId = (typeof SECTIONS)[number];

function setActiveSection(sectionId: SectionId) {
  document.querySelectorAll<HTMLElement>("[data-nav-link]").forEach((link) => {
    const isActive = link.dataset.section === sectionId;
    link.classList.toggle("nav-link--active", isActive);
    link.setAttribute("aria-current", isActive ? "true" : "false");
  });
}

function getScrollAnchorOffset(): number {
  const headerHeight =
    document.querySelector(".site-header")?.offsetHeight ??
    document.querySelector("header")?.offsetHeight ??
    88;
  const extra = window.matchMedia("(max-width: 767px)").matches ? 16 : 20;
  return headerHeight + extra;
}

function getSectionRoot(id: SectionId): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>(`[data-nav-section="${id}"]`) ??
    document.getElementById(id)
  );
}

/** Última sección cuyo inicio ya pasó la línea bajo el header. */
function getActiveSection(): SectionId {
  const anchorLine = getScrollAnchorOffset();
  let active: SectionId = "inicio";

  for (const id of SECTIONS) {
    const el = getSectionRoot(id);
    if (!el) continue;

    if (el.getBoundingClientRect().top <= anchorLine) {
      active = id;
    }
  }

  return active;
}

export default function NavScrollSpy() {
  useEffect(() => {
    if (window.location.pathname !== "/") return;

    const update = () => setActiveSection(getActiveSection());

    const hash = window.location.hash.replace("#", "") as SectionId;
    if (SECTIONS.includes(hash)) {
      setActiveSection(hash);
      requestAnimationFrame(update);
    } else {
      update();
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("hashchange", update);

    const links = document.querySelectorAll<HTMLElement>("[data-nav-link]");
    const onLinkClick = (event: Event) => {
      const link = event.currentTarget as HTMLElement;
      const section = link.dataset.section as SectionId | undefined;
      if (!section) return;

      setActiveSection(section);
      window.setTimeout(update, 400);
      window.setTimeout(update, 900);
    };

    links.forEach((link) => {
      link.addEventListener("click", onLinkClick);
    });

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("hashchange", update);
      links.forEach((link) => {
        link.removeEventListener("click", onLinkClick);
      });
    };
  }, []);

  return null;
}
