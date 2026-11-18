import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useFormSubmit } from "./hooks/useFormSubmit";
import { useFirebaseCollection } from "./hooks/useFirebaseCollection";
import { useYouTubeVideos } from "./hooks/useYouTubeVideos";
import { validateEmail, validatePhone } from "./validation";
import { compressImage, readPdfAsDataUri } from "./utils/fileToDataUri";
import SupportWidget from "./components/SupportWidget";
import LiturgyPage from "./components/LiturgyPage";
import logo from "./assets/logo.png";
import heroService from "./assets/youth-service.jpg";
import youthFellowship from "./assets/youth-fellowship.jpg";
import { NAV_LINKS, PAGE_SEO, PAGE_PATHS, SITE_URL, slugify, pageToPath, pageUrl } from "./seo";
import { eventDateOf } from "./utils/eventDate";
import { APK_AVAILABLE, APK_FILE_NAME, APK_URL, APP_VERSION } from "./appDownload";

// Five flat top-level destinations: every core page is one click away, with
// the rest on the utility strip below the bar and in the footer.
const NAV_MENU = [
    { label: "Home", page: "Home", icon: "home" },
    { label: "Sermons", page: "Sermons", icon: "book", activePages: ["Sermons", "Recorded Sermons", "Written Sermons", "Liturgy", "Gallery"] },
    { label: "Ministries", page: "Ministries", icon: "users", activePages: ["Ministries", "Testimonies"] },
    { label: "Events", page: "Events", icon: "calendar" },
    { label: "Opportunities", page: "Community", icon: "briefcase", activePages: ["Community", "Business Directory", "Requests", "Job Board", "Job Seekers"] }, { label: "About", page: "About", icon: "info" },
];

// Secondary destinations, kept visible on the utility strip under the top bar.
const UTILITY_LINKS = ["Liturgy", "Gallery", "Written Sermons", "Testimonies", "Give", "Connect", "Mobile App"];

const pageFromPath = pathname => {
    const slug = pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
    if (slug.startsWith("events/")) return "Events";
    if (slug.startsWith("ministries/")) return "Ministries";
    if (slug.startsWith("community/")) return "Community";
    if (slug === "join-us/register") return "Home";
    const matchedPage = Object.entries(PAGE_PATHS).find(([, path]) => path.slice(1) === slug);
    if (matchedPage) return matchedPage[0];
    return NAV_LINKS.find(p => slugify(p) === slug) || "Home";
};
const eventRegistrationPath = event => `/events/${slugify(event.title)}/register`;
const joinUsRegistrationPath = "/join-us/register";
const ministryRegistrationPath = ministryTitle => `/ministries/${slugify(ministryTitle)}/join`;
const ministryRegistrationSlug = pathname => {
    const match = pathname.match(/^\/ministries\/([^/]+)\/join\/?$/i);
    return match ? decodeURIComponent(match[1]).toLowerCase() : null;
};
const communityFormPath = form => `/community/${form}/submit`;
const communityFormFromPath = pathname => {
    const match = pathname.match(/^\/community\/(business|job|job-seeker|request)\/submit\/?$/i);
    return match ? match[1].toLowerCase() : null;
};
const eventRegistrationSlug = pathname => {
    const match = pathname.match(/^\/events\/([^/]+)\/register\/?$/i);
    return match ? decodeURIComponent(match[1]).toLowerCase() : null;
};

export const styles = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
  --crimson: #075CAC;
  --crimson-hover: #03477F;
  --line: #DCE5F0;
  --gold: #D6A42C;
  --gold-light: #F1C85B;
  --gold-dark: #8B6513;
  --navy: #062D57;
  --navy-mid: #0B477F;
  --orange: #B42346;
  --cream: #F7F9FC;
  --white: #ffffff;
  --gray-100: #F1F5F9;
  --gray-200: #DCE5F0;
  --gray-400: #68778A;
  --gray-600: #4D6075;
  --gray-800: #13293F;
  --shadow-sm: 0 10px 28px rgba(6, 45, 87, 0.08);
  --shadow-md: 0 18px 42px rgba(6, 45, 87, 0.13);
}

html { font-size: 16px; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body { font-family: var(--font-body); font-size: 0.97rem; font-weight: 400; line-height: 1.65; letter-spacing: 0; background: var(--white); color: var(--gray-800); overflow-x: hidden; -webkit-font-smoothing: antialiased; }
.tabular { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
button, input, select, textarea { font: inherit; }
.font-display { font-family: var(--font-display); }
button, a, input, select, textarea { -webkit-tap-highlight-color: transparent; }
button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
  outline: 3px solid var(--crimson); outline-offset: 3px;
}
button { touch-action: manipulation; }

.dark-mode {
  --gray-100: #221733;
  --gray-200: #2E2240;
  --gray-400: #ABA1B8;
  --gray-600: #D5CDDF;
  --gray-800: #EFEAF5;
  --line: #2E2240;
  background: #120C1C !important;
  color: #EFEAF5 !important;
}
.dark-mode nav { background: rgba(18,12,28,0.97) !important; border-bottom: 1px solid rgba(180,131,39,0.2) !important; }
.dark-mode .nav-link { color: #D5CDDF !important; }
.dark-mode .nav-link:hover { color: var(--gold-light) !important; }
.dark-mode .nav-link.active { color: var(--gold) !important; }
.dark-mode .logo-text { color: #EFEAF5 !important; }
.dark-mode .section-light { background: #120C1C !important; }
.dark-mode .section-cream { background: #1A1226 !important; }
.dark-mode .card { background: #1A1226 !important; border-color: rgba(180,131,39,0.15) !important; }
.dark-mode .section-title { color: #EFEAF5 !important; }
.dark-mode .section-desc { color: #ABA1B8 !important; }
.dark-mode .overline { color: var(--gold) !important; }
.dark-mode .form-label { color: #D5CDDF !important; }
.dark-mode .form-input,
.dark-mode .form-select,
.dark-mode .form-textarea { background: #221733 !important; border-color: rgba(180,131,39,0.25) !important; color: #EFEAF5 !important; }
.dark-mode .ministry-title,
.dark-mode .sermon-title,
.dark-mode .blog-title,
.dark-mode .event-title,
.dark-mode .team-name { color: #EFEAF5 !important; }
.dark-mode .ministry-desc,
.dark-mode .sermon-pastor,
.dark-mode .blog-excerpt,
.dark-mode .event-desc,
.dark-mode .team-bio { color: #ABA1B8 !important; }
.dark-mode .footer { background: #0C0814 !important; }

nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
  box-shadow: none;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}
nav.scrolled { box-shadow: 0 1px 3px rgba(33,22,52,0.07); }
.dark-mode nav.scrolled { box-shadow: 0 6px 24px rgba(0,0,0,0.35) !important; }

.nav-inner {
  max-width: 1440px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1.5rem; height: 70px; gap: 1.25rem;
}

.nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; transition: opacity 0.2s ease; background: none; border: none; padding: 0; text-align: left; cursor: pointer; }
.nav-logo:hover { opacity: 0.85; }
.logo-cross {
  width: 40px; height: 40px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; color: white; font-weight: 900;
  font-family: var(--font-display);
  overflow: hidden; flex-shrink: 0;
  transition: transform 0.25s ease;
}
.nav-logo:hover .logo-cross { transform: scale(1.06) rotate(-2deg); }
.logo-cross img { width: 100%; height: 100%; object-fit: contain; }
.logo-text { font-family: var(--font-display); font-size: 1.1rem; font-weight: 600; color: var(--navy); line-height: 0.95; letter-spacing: 0.01em; }
.logo-sub { font-family: var(--font-body); font-size: 0.62rem; font-weight: 600; color: var(--crimson); letter-spacing: 0.12em; text-transform: uppercase; }

.nav-links { display: flex; gap: 0.1rem; align-items: center; justify-content: flex-end; flex: 1; }
.nav-link {
  position: relative;
  min-height: 44px; padding: 0.6rem 0.72rem; border-radius: 8px;
  font-family: var(--font-body); font-size: 0.855rem; font-weight: 500; line-height: 1; letter-spacing: 0; text-transform: none; color: var(--gray-600);
  text-decoration: none; transition: color 0.2s ease, background 0.2s ease;
  cursor: pointer; background: none; border: none;
  display: inline-flex; align-items: center;
}
.nav-links .nav-link::after {
  content: ''; position: absolute; left: 0.72rem; right: 0.72rem; bottom: 2px;
  height: 2px; border-radius: 0;
  background: var(--crimson);
  transform: scaleX(0); transform-origin: center;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-link:hover { color: var(--gray-800); background: transparent; }
.nav-links .nav-link:hover::after { transform: scaleX(0.55); }
.nav-link.active { color: var(--gray-800); font-weight: 600; }
.nav-links .nav-link.active::after { transform: scaleX(1); }

.nav-item { position: relative; display: inline-flex; }
.nav-caret { display: inline-block; font-size: 0.68rem; margin-left: 6px; opacity: 0.6; transition: transform 0.25s ease, opacity 0.2s ease; }
.nav-item:hover .nav-caret { transform: rotate(180deg); opacity: 1; }
.nav-dropdown {
  position: absolute; top: 100%; left: 0; padding-top: 10px;
  opacity: 0; visibility: hidden; transform: translateY(4px);
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
  z-index: 1001;
}
.nav-item:hover .nav-dropdown, .nav-item:focus-within .nav-dropdown {
  opacity: 1; visibility: visible; transform: translateY(0);
}
.nav-dropdown-inner {
  background: white; border-radius: 14px;
  box-shadow: 0 12px 28px rgba(33,22,52,0.1);
  border: 1px solid var(--line);
  min-width: 230px; padding: 0.5rem; display: flex; flex-direction: column; gap: 2px;
}
.nav-dropdown-item {
  display: block; width: 100%; text-align: left; padding: 0.6rem 0.85rem; border-radius: 8px;
  font-size: 0.8rem; font-weight: 600; letter-spacing: 0.01em; color: var(--navy); background: none; border: none; cursor: pointer;
  text-decoration: none; transition: all 0.15s;
}
.nav-dropdown-item:hover { background: var(--gray-100); color: var(--crimson); }
.dark-mode .nav-dropdown-inner { background: #1A1226 !important; border-color: rgba(180,131,39,0.15) !important; }
.dark-mode .nav-dropdown-item { color: #EFEAF5 !important; }
.dark-mode .nav-dropdown-item:hover { background: rgba(180,131,39,0.12) !important; color: var(--gold-light) !important; }

.mobile-submenu { width: 100%; }
.mobile-submenu-toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.mobile-submenu-toggle .nav-caret { font-size: 0.8rem; transition: transform 0.25s; }
.mobile-submenu-toggle .nav-caret.open { transform: rotate(-180deg); }
.mobile-submenu-panel {
  max-height: 0; overflow: hidden;
  transition: max-height 0.3s ease;
  display: flex; flex-direction: column;
}
.mobile-submenu-panel.open { max-height: 480px; }
.mobile-submenu-item {
  display: block; width: 100%; text-align: left;
  padding: 0.75rem 0 0.75rem 1.25rem; font-size: 0.92rem; font-weight: 600;
  color: var(--gray-600); background: none; border: none; cursor: pointer;
  border-bottom: 1px solid var(--gray-200); text-decoration: none;
}
.mobile-submenu-item:hover { color: var(--crimson); }
.dark-mode .mobile-submenu-item { color: #ABA1B8 !important; border-bottom-color: rgba(180,131,39,0.15) !important; }
.dark-mode .mobile-submenu-item:hover { color: var(--gold-light) !important; }

.nav-cta {
  background: var(--crimson);
  color: white; padding: 0.55rem 1.1rem; border-radius: 10px;
  font-size: 0.78rem; font-weight: 600; letter-spacing: 0; border: none; cursor: pointer;
  transition: background 0.2s; box-shadow: none;
}
.nav-cta:hover { background: var(--crimson-hover); }

.mobile-menu-btn { display: none; background: none; border: none; cursor: pointer; padding: 0.5rem; }
.menu-toggle { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 10px; background: transparent; border: none; cursor: pointer; }
.menu-toggle:hover { background: var(--gray-100); }
.dark-mode .menu-toggle:hover { background: #221733; }
.hamburger { width: 24px; height: 2px; background: var(--navy); display: block; position: relative; transition: all 0.3s; }
.hamburger::before, .hamburger::after { content: ''; position: absolute; width: 24px; height: 2px; background: var(--navy); transition: all 0.3s; }
.hamburger::before { top: -7px; }
.hamburger::after { top: 7px; }

.mobile-drawer {
  display: none; position: fixed; top: 110px; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.98); backdrop-filter: blur(16px);
  z-index: 999; flex-direction: column; padding: 1.5rem 2rem 6rem;
  overflow-y: auto;
  animation: fadeSlideUp 0.25s ease both;
}
.mobile-drawer.open { display: flex; }
.mobile-drawer .nav-link {
  padding: 1rem 0; font-size: 1.15rem; font-weight: 700; border-bottom: 1px solid var(--gray-200);
  width: 100%; text-align: left;
}
.dark-mode .mobile-drawer { background: rgba(18,12,28,0.98) !important; }
.dark-mode .mobile-drawer .nav-link { border-bottom-color: rgba(180,131,39,0.15) !important; }

.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 0.7rem 1.35rem; border-radius: 12px; min-height: 44px; justify-content: center;
  font-family: var(--font-body); font-size: 0.84rem; font-weight: 600; letter-spacing: 0;
  cursor: pointer; border: none; transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease; text-decoration: none;
}
.btn:active:not(:disabled) { transform: scale(0.985); }
.btn:focus-visible { outline: 2px solid var(--crimson); outline-offset: 2px; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
.btn-gold {
  background: var(--crimson); color: white; box-shadow: none;
}
.btn-gold:hover { background: var(--crimson-hover); }
.btn-outline {
  background: transparent; color: white;
  border: 1px solid rgba(255,255,255,0.35);
}
.btn-outline:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.6); }
.btn-navy {
  background: var(--navy); color: white; box-shadow: none;
}
.btn-navy:hover { background: var(--navy-mid); }
.btn-white {
  background: white; color: var(--navy); box-shadow: none;
}
.btn-white:hover { background: var(--gray-100); }
.btn-sm { padding: 0.45rem 1rem; font-size: 0.76rem; min-height: 38px; }
a.footer-link:focus-visible, .nav-link:focus-visible, .social-btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

/* ─── HERO ─── */
.hero {
  min-height: 92vh; position: relative; overflow: hidden;
  display: flex; align-items: center;
  background: var(--navy);
}

/* The uploaded sanctuary photograph sits behind a flat navy scrim. */
.hero-pattern {
  position: absolute; inset: 0;
  background-size: cover; background-position: center 35%;
  opacity: 0.4;
}

.hero-cross-bg {
  position: absolute; inset: 0; width: 100%; height: 100%; transform: none; opacity: 1;
  background: linear-gradient(100deg, #211634 6%, rgba(33,22,52,0.92) 38%, rgba(33,22,52,0.62) 70%, rgba(33,22,52,0.45) 100%);
}

.hero-wave { display: none; }
.hero-wave-fill { fill: var(--cream); }
.dark-mode .hero-wave-fill { fill: #1A1226; }

.hero-content {
  position: relative; z-index: 2;
  max-width: 1280px; margin: 0 auto; padding: 8rem 2rem 5rem;
  display: grid; grid-template-columns: minmax(0, 1.12fr) minmax(340px, 0.88fr); gap: clamp(1.5rem, 2.5vw, 2.5rem); align-items: center;
}
.hero-text-col { text-align: left; transform: translateY(-2.5rem); }

.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: transparent; border: 1px solid rgba(255,255,255,0.22);
  padding: 0.4rem 0.85rem; border-radius: 8px;
  font-size: 0.7rem; font-weight: 600; color: var(--gold-light);
  letter-spacing: 0.1em; text-transform: uppercase;
  margin-bottom: 1.5rem;
  animation: fadeSlideUp 0.6s ease both;
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 4.4vw, 4rem);
  font-weight: 600; line-height: 1.08; letter-spacing: -0.02em; color: white;
  margin-bottom: 1.5rem;
  animation: fadeSlideUp 0.7s 0.1s ease both;
}

.hero-title span { color: var(--gold-light); }
.hero-desc {
  font-size: clamp(0.95rem, 1.2vw, 1.05rem); line-height: 1.75; color: rgba(255,255,255,0.78);
  margin: 0 0 2.25rem; max-width: 540px;
  animation: fadeSlideUp 0.7s 0.2s ease both;
}

.hero-btns { display: flex; gap: 1rem; flex-wrap: wrap; animation: fadeSlideUp 0.7s 0.3s ease both; }


.hero-visual {
  position: relative; width: min(100%, 360px); justify-self: start;
  animation: fadeSlideLeft 0.8s 0.2s ease both;
}
.hero-visual .service-card { padding: 1.25rem; }

.service-card {
  background: rgba(255,255,255,0.06); backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.14); border-radius: 16px;
  padding: 2rem; color: white;
}

.service-times-grid { display: grid; gap: 1rem; margin-top: 1.25rem; }
.service-time-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.8rem 1rem; background: rgba(255,255,255,0.05);
  border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
}
.service-time-name { font-size: 0.8rem; font-weight: 500; color: rgba(255,255,255,0.75); }
.service-time-val { font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-size: 0.82rem; font-weight: 600; color: var(--gold-light); }

/* ─── POSTER CAROUSEL ─── */
.poster-frame { perspective: 1200px; }
.poster-flip {
  width: 100%; height: auto;
  border-radius: 14px; overflow: hidden; position: relative;
  line-height: 0; opacity: 1; transition: opacity 0.9s ease;
}
.poster-flip.flipping { opacity: 0; }
.poster-image { width: 100%; height: auto; display: block; }
.poster-open-btn { position: absolute; inset: 0; z-index: 1; border: none; background: transparent; cursor: zoom-in; }
.poster-open-btn:focus-visible { outline: 3px solid var(--gold-light); outline-offset: -3px; }
.poster-caption {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  color: white; font-size: 0.75rem; font-weight: 500; padding: 20px 12px 10px; z-index: 2; pointer-events: none;
}
.poster-next-btn {
  position: absolute; top: 50%; right: 10px; transform: translateY(-50%);
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.3);
  color: white; font-size: 1.5rem; line-height: 1; cursor: pointer; z-index: 3;
  display: flex; align-items: center; justify-content: center; padding: 0 0 2px;
  transition: all 0.2s; backdrop-filter: blur(4px);
}
.poster-next-btn:hover { background: var(--gold); border-color: var(--gold); transform: translateY(-50%) scale(1.08); }
.poster-dots { display: flex; gap: 6px; justify-content: center; margin-top: 0.85rem; }
.poster-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.25); transition: all 0.25s; }
.poster-dot.active { background: var(--gold); width: 16px; border-radius: 3px; }
.poster-empty {
  width: 100%; height: 420px; border-radius: 14px;
  background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.2);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 1.5rem;
}

/* Posters keep their natural aspect ratio at every breakpoint, matching mobile. */

.poster-viewer-overlay {
  position: fixed; inset: 0; z-index: 3000; padding: 2rem;
  display: grid; place-items: center; background: rgba(5,10,20,0.9); backdrop-filter: blur(8px);
  animation: fadeSlideUp 0.2s ease both;
}
.community-poster-viewer { animation: none; }
.poster-viewer { position: relative; width: fit-content; max-width: 100%; max-height: 100%; }
.poster-viewer-image { display: block; max-width: 100%; max-height: calc(100vh - 4rem); object-fit: contain; border-radius: 16px; background: #0C0814; box-shadow: 0 24px 80px rgba(0,0,0,0.45); }
.poster-viewer-caption { color: white; text-align: center; font-size: 0.85rem; line-height: 1.5; margin-top: 0.8rem; }
.poster-viewer-close {
  position: absolute; top: -14px; right: -14px; z-index: 1; width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center; border: none; border-radius: 50%;
  background: var(--gold); color: white; font-size: 1.45rem; line-height: 1; cursor: pointer;
  box-shadow: 0 4px 18px rgba(0,0,0,0.35);
}
.poster-viewer-close:hover { background: var(--gold-dark); }
.poster-loading {
  border: none;
  background: linear-gradient(100deg, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 70%);
  background-size: 200% 100%;
  animation: posterShimmer 1.4s ease-in-out infinite;
}
@keyframes posterShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.happening-now-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(158,27,50,0.15); border: 1px solid rgba(158,27,50,0.4);
  padding: 0.5rem 1rem; border-radius: 50px;
  font-size: 0.8rem; font-weight: 700; color: var(--orange); text-transform: uppercase; letter-spacing: 0.08em;
}
.happening-now-badge::before {
  content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--orange);
  animation: urgentBlink 1s ease-in-out infinite;
}

.countdown-section {
  margin-top: 1.5rem; padding-top: 1.5rem;
  border-top: 1px solid rgba(180,131,39,0.2);
}
.countdown-label {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em;
  color: var(--gold-light); margin-bottom: 0.9rem;
}
.countdown-label::before {
  content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--gold);
  animation: urgentBlink 1.4s ease-in-out infinite;
}
.countdown-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 0.5rem; }
.countdown-unit {
  text-align: center; background: rgba(180,131,39,0.15); border-radius: 8px; padding: 0.75rem 0.5rem;
  border: 1px solid rgba(180,131,39,0.3);
}
.countdown-num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-size: 1.55rem; font-weight: 600; line-height: 1.1; color: var(--gold-light); }
.countdown-unit-label { font-size: 0.6rem; text-transform: uppercase; color: rgba(255,255,255,0.5); letter-spacing: 0.08em; }

/* ─── SECTIONS ─── */
.section { padding: 4.5rem 2rem; }
.section-sm { padding: 3rem 2rem; }
.section-light { background: var(--white); }
.section-cream { background: linear-gradient(180deg, #FAF8FC 0%, #F4EFF8 100%); }
.section-navy { background: var(--navy); }
.section-navy-mid { background: var(--navy-mid); }
.container { max-width: 1280px; margin: 0 auto; }
.container-sm { max-width: 900px; margin: 0 auto; }

.section-header { text-align: center; margin-bottom: 3.5rem; }
.overline {
  display: inline-block;
  font-size: 0.72rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.12em;
  color: var(--crimson); margin-bottom: 0.75rem;
}
.section-title {
  font-family: var(--font-display);
  font-size: clamp(1.9rem, 2.9vw, 2.85rem);
  font-weight: 600; color: var(--gray-800); line-height: 1.12; letter-spacing: -0.015em;
  margin-bottom: 1rem; text-wrap: balance;
}
.section-title.white { color: white; }
/* On navy, the crimson accent loses contrast: use brass instead. */
.section-navy .overline, .section-navy-mid .overline, .hero .overline, .giving-hero .overline, .newsletter .overline { color: var(--gold-light); }
.section-desc { font-size: clamp(0.92rem, 1.1vw, 1rem); color: var(--gray-600); line-height: 1.7; max-width: 640px; margin: 0 auto; }
.section-desc.white { color: rgba(255,255,255,0.75); }

/* ── Mobile app download ── */
.app-promo { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr); gap: 3rem; align-items: center; }
.app-promo .overline { color: var(--gold-light); }
.app-promo .section-title { text-align: left; }
.app-promo .section-desc { margin: 0 0 1.75rem; text-align: left; }
.app-badges { display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem; margin-top: 1.25rem; font-size: 0.82rem; color: rgba(255,255,255,0.6); }
.app-badges span::before { content: "✓"; color: var(--gold-light); margin-right: 6px; font-weight: 700; }
.app-download-row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
.app-download-btn { display: inline-flex; align-items: center; gap: 12px; padding: 0.8rem 1.4rem; border-radius: 12px; background: var(--crimson); color: white; text-decoration: none; font-weight: 600; text-align: left; box-shadow: none; transition: background 0.2s; }
.app-download-btn:hover { background: var(--crimson-hover); }
.app-download-btn small { display: block; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.75; }
.app-download-btn strong { display: block; font-size: 1.05rem; line-height: 1.1; }
.app-download-btn.disabled { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.85); box-shadow: none; cursor: default; }
.app-download-btn.disabled:hover { transform: none; }
.app-download-btn.on-light.disabled { background: var(--gray-100); color: var(--gray-600); }
.app-phone { justify-self: center; width: 230px; height: 440px; border-radius: 36px; background: #0A1530; padding: 12px; box-shadow: 0 30px 60px rgba(0,0,0,0.35), inset 0 0 0 2px rgba(255,255,255,0.08); transform: rotate(4deg); }
.app-phone-screen { height: 100%; border-radius: 26px; background: var(--cream); overflow: hidden; display: flex; flex-direction: column; }
.app-phone-top { background: var(--navy); color: white; padding: 1.4rem 1rem 1rem; display: flex; align-items: center; gap: 10px; }
.app-phone-top img { width: 34px; height: 34px; border-radius: 9px; object-fit: cover; }
.app-phone-top b { font-family: var(--font-display); font-size: 0.95rem; display: block; line-height: 1; white-space: nowrap; }
.app-phone-top span { font-size: 0.6rem; color: var(--gold-light); letter-spacing: 0.08em; text-transform: uppercase; }
.app-phone-body { flex: 1; padding: 0.8rem; display: grid; gap: 0.55rem; align-content: start; }
.app-phone-card { background: white; border-radius: 12px; padding: 0.65rem 0.75rem; box-shadow: 0 2px 8px rgba(33,22,52,0.06); }
.app-phone-card i { display: block; height: 7px; border-radius: 4px; background: #EFEAF5; margin-top: 6px; }
.app-phone-card i:first-child { margin-top: 0; width: 60%; background: var(--navy); opacity: 0.8; }
.app-phone-card.gold i:first-child { background: var(--gold); opacity: 1; }
.app-phone-tabs { display: flex; justify-content: space-around; padding: 0.6rem 0 0.8rem; background: white; border-top: 1px solid #EFEAF5; }
.app-phone-tabs i { width: 18px; height: 18px; border-radius: 6px; background: #EFEAF5; }
.app-phone-tabs i:first-child { background: var(--gold); }
.app-features { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 1.25rem; }
.app-feature { padding: 1.5rem; border-top: 2px solid var(--crimson); }
.app-feature h3 { font-family: var(--font-display); font-size: 1.15rem; font-weight: 600; color: var(--gray-800); margin-bottom: 0.35rem; }
.app-feature p { font-size: 0.92rem; color: var(--gray-600); line-height: 1.6; }
.app-steps { counter-reset: step; display: grid; gap: 1rem; max-width: 760px; margin: 0 auto; }
.app-step { display: flex; gap: 1rem; align-items: flex-start; padding: 1.25rem 1.4rem; }
.app-step::before { counter-increment: step; content: counter(step); flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%; background: var(--navy); color: var(--gold); font-weight: 700; display: flex; align-items: center; justify-content: center; }
.app-step h3 { font-size: 1rem; color: var(--navy); margin-bottom: 0.2rem; }
.app-step p { font-size: 0.9rem; color: var(--gray-600); line-height: 1.6; }
.dark-mode .app-feature h3, .dark-mode .app-step h3 { color: var(--gold-light); }
/* Liturgy page */
.lit-wrap { max-width: 780px; }
.lit-order { padding: 1.5rem 1.75rem; border-top: 2px solid var(--crimson); margin-bottom: 2rem; }
.lit-order ol { margin: 0.75rem 0 0; padding-left: 1.4rem; display: grid; gap: 0.35rem; font-family: var(--font-display); font-size: 1.2rem; color: var(--navy); }
.lit-key { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; font-size: 0.82rem; color: var(--gray-600); margin-bottom: 1.5rem; }
.lit-heading { margin: 2.5rem 0 1rem; text-align: left; }
.lit-part { margin-bottom: 2rem; }
.lit-title { font-family: var(--font-display); font-size: 1.5rem; color: var(--navy); margin: 0 0 0.75rem; padding-bottom: 0.4rem; border-bottom: 1px solid rgba(180,131,39,0.35); }
.lit-title small { display: block; font-family: var(--font-body); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gold-dark); margin-top: 0.2rem; }
.lit-line { display: flex; gap: 0.75rem; align-items: baseline; margin: 0 0 0.6rem; font-size: 1rem; line-height: 1.65; color: var(--gray-800, #2E2A25); }
.lit-all > span:last-child { font-weight: 700; }
.lit-role { flex-shrink: 0; display: inline-block; min-width: 4.6rem; padding: 1px 8px; border-radius: 6px; border: 1px solid var(--line); color: var(--gray-600); font-size: 0.66rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-align: center; line-height: 1.7; }
.lit-all .lit-role, .lit-role-all { background: var(--navy); border-color: var(--navy); color: white; }
.lit-minister .lit-role { background: var(--crimson); border-color: var(--crimson); color: white; }
.lit-key .lit-role { min-width: 0; margin-right: 0.3rem; }
.lit-note { font-style: italic; color: var(--gold-dark); font-size: 0.9rem; margin: 0.2rem 0 0.6rem; }
.lit-sung { font-style: italic; color: var(--crimson); margin: 0 0 0.4rem; }
.lit-song { padding: 1.25rem 1.5rem; background: var(--gray-100); }
.lit-song p { margin: 0 0 0.35rem; line-height: 1.55; }
.lit-lords-prayer { padding: 1.75rem 1.5rem; margin: 1rem 0 1.25rem; text-align: center; font-family: var(--font-display); font-size: 1.15rem; line-height: 1.55; color: var(--navy); }
.lit-lords-prayer h4 { font-size: 1.3rem; letter-spacing: 0.04em; text-transform: uppercase; margin: 0 0 0.75rem; color: var(--navy); }
.lit-lords-prayer p { margin: 0; }
.lit-amen { color: var(--crimson); font-weight: 700; }
.lit-lords-prayer .lit-amen { margin-top: 0.5rem; }
.lit-prayer { line-height: 1.7; margin: 0; }
.lit-or { text-align: center; font-style: italic; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; font-size: 0.75rem; color: var(--crimson); margin: 0.75rem 0; }
.dark-mode .lit-title, .dark-mode .lit-order ol, .dark-mode .lit-lords-prayer, .dark-mode .lit-lords-prayer h4 { color: var(--gold-light); }
.dark-mode .lit-line, .dark-mode .lit-prayer, .dark-mode .lit-song p { color: #EFEAF5; }
.dark-mode .lit-all .lit-role, .dark-mode .lit-key .lit-role-all { background: var(--gold); border-color: var(--gold); color: var(--navy); }
.dark-mode .lit-sung, .dark-mode .lit-amen { color: #E9A3B5; }
@media (max-width: 600px) {
  .lit-line { flex-direction: column; gap: 0.15rem; }
  .lit-role { min-width: 0; }
}
@media (max-width: 860px) {
  .app-promo { grid-template-columns: 1fr; gap: 2rem; text-align: center; }
  .app-promo .section-title, .app-promo .section-desc { text-align: center; }
  .app-promo .section-desc { margin: 0 auto 1.5rem; }
  .app-download-row, .app-badges { justify-content: center; }
  .app-phone { width: 190px; height: 360px; transform: none; }
}
/* App install prompt: small card bottom-left on desktop (support chat is bottom-right), bottom sheet on phones */
.app-prompt {
  position: fixed; left: 1.5rem; bottom: 1.5rem; z-index: 1150; width: 350px; max-width: calc(100vw - 2rem);
  background: var(--navy); color: white; border: 1px solid rgba(180,131,39,0.4); border-radius: 18px;
  padding: 1.25rem 1.25rem 1.3rem; box-shadow: 0 20px 50px rgba(0,0,0,0.35); animation: appPromptIn 0.35s ease;
}
@keyframes appPromptIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
.app-prompt-close {
  position: absolute; top: 8px; right: 8px; width: 36px; height: 36px; border: none; border-radius: 50%;
  background: transparent; color: rgba(255,255,255,0.7); font-size: 1.5rem; line-height: 1; cursor: pointer;
}
.app-prompt-close:hover, .app-prompt-close:focus-visible { background: rgba(255,255,255,0.1); color: white; }
.app-prompt-close:focus-visible, .app-prompt-link:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
.app-prompt-head { display: flex; align-items: center; gap: 12px; padding-right: 2rem; }
.app-prompt-head img { width: 48px; height: 48px; flex-shrink: 0; border-radius: 12px; background: white; object-fit: contain; padding: 4px; }
.app-prompt h2 { font-family: var(--font-display); font-size: 1.3rem; line-height: 1.1; color: white; }
.app-prompt-meta { margin-top: 4px; font-size: 0.74rem; color: var(--gold-light); letter-spacing: 0.02em; }
.app-prompt p { margin-top: 0.85rem; font-size: 0.9rem; line-height: 1.55; color: rgba(255,255,255,0.8); }
.app-prompt-hint strong { color: var(--gold-light); }
.app-prompt-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem 1rem; margin-top: 1rem; }
.app-prompt-actions .app-download-btn { padding: 0.65rem 1.1rem; }
.app-prompt-link { color: var(--gold-light); font-weight: 600; font-size: 0.9rem; text-decoration: underline; text-underline-offset: 3px; }
.dark-mode .app-prompt { background: #0A1530; border-color: rgba(180,131,39,0.6); }
@media (max-width: 640px) {
  .app-prompt {
    left: 0; right: 0; bottom: 0; width: auto; max-width: none; border-radius: 20px 20px 0 0;
    padding: 1.25rem 1rem calc(1.25rem + env(safe-area-inset-bottom)); animation-name: appPromptUp;
  }
  .app-prompt-actions .app-download-btn { flex: 1 1 100%; justify-content: center; }
  .app-prompt-actions .app-prompt-link { margin: 0 auto; }
}
@keyframes appPromptUp { from { transform: translateY(100%); } to { transform: none; } }
@media (prefers-reduced-motion: reduce) { .app-prompt { animation: none; } }
.gold-line { width: 44px; height: 2px; background: var(--gold); border-radius: 0; margin: 1.1rem auto 0; }

/* ─── CARDS ─── */
.card {
  background: white; border-radius: 16px;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease; overflow: hidden;
  position: relative;
}
.card:hover { border-color: rgba(158,27,50,0.28); box-shadow: var(--shadow-md); transform: translateY(-2px); }
@media (prefers-reduced-motion: reduce) { .card { transition: none; } .card:hover { transform: none; } }

.grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
.grid-3 { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem; align-items: stretch; }
.grid-4 { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; align-items: stretch; }

/* ─── ABOUT ─── */
.about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
.about-image-mock {
  position: relative; border-radius: 16px; overflow: hidden;
  background: var(--navy) center/cover no-repeat;
  padding: 3rem; min-height: 420px;
  display: flex; flex-direction: column; justify-content: flex-end;
}
.about-image-cross {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -60%);
  opacity: 0.08; font-size: 8rem; font-family: serif; color: var(--gold); font-weight: 900;
}
.about-quote {
  position: relative; z-index: 1;
  font-family: var(--font-display); font-size: 1.35rem; font-weight: 600; font-style: italic;
  color: rgba(255,255,255,0.9); line-height: 1.35;
  border-left: 3px solid var(--gold); padding-left: 1.25rem;
}

.value-pill {
  display: inline-flex; align-items: center; gap: 8px;
  background: white; border: 1px solid var(--line);
  padding: 0.55rem 1.1rem; border-radius: 10px; margin: 0.3rem;
  font-size: 0.84rem; font-weight: 500; color: var(--gray-800);
}
.value-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--crimson); }

/* ─── TEAM ─── */
.team-card { text-align: center; padding: 2rem 1.5rem; height: 100%; display: flex; flex-direction: column; }
.team-avatar {
  width: 100px; height: 100px; border-radius: 50%;
  background: var(--navy);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 2.2rem; font-weight: 600;
  color: var(--gold-light); margin: 0 auto 1.25rem;
  border: none; box-shadow: none;
}
.team-name { font-family: var(--font-body); font-size: 1.02rem; font-weight: 600; line-height: 1.35; letter-spacing: -0.005em; color: var(--gray-800); }
.team-role { font-size: 0.78rem; color: var(--crimson); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; min-height: 2.2em; }
.team-bio { font-size: 0.9rem; color: var(--gray-600); line-height: 1.7; margin-top: 0.75rem; }

/* ─── SHARED: 3-line clamp + Read More toggle (team bios, event/job/business descriptions) ─── */
.desc-clamp-3 {
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden;
}
.read-more-btn {
  background: none; border: none; padding: 0; margin-top: 6px; cursor: pointer;
  font-size: 0.8rem; font-weight: 600; color: var(--gold-dark); align-self: flex-start;
}

/* ─── MINISTRY CARDS ─── */
.ministry-card { padding: 2rem; }
.ministry-icon {
  width: 56px; height: 56px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem; margin-bottom: 1.25rem;
}
.ministry-title { font-family: var(--font-body); font-size: 1.02rem; font-weight: 600; line-height: 1.35; letter-spacing: -0.005em; color: var(--gray-800); margin-bottom: 0.6rem; }
.ministry-desc { font-size: 0.9rem; color: var(--gray-600); line-height: 1.7; }
.ministry-link { font-size: 0.82rem; font-weight: 600; color: var(--crimson); margin-top: 1rem; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; text-decoration: none; }
.ministry-card-full {
  padding: 2.5rem 2rem; display: flex; flex-direction: column; align-items: center;
  position: relative; overflow: hidden;
}
.ministry-card-full::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: var(--crimson);
}
.ministry-card-full .ministry-icon {
  border-radius: 50%; border: 2px solid rgba(180,131,39,0.3);
}
.ministry-link:hover { color: var(--crimson-hover); }

/* ─── SERMONS ─── */
.sermon-card { overflow: hidden; }
.sermon-thumb {
  height: 180px; background: var(--navy);
  display: flex; align-items: center; justify-content: center; position: relative;
}
.play-btn {
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--crimson); color: white; display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; cursor: pointer; transition: background 0.2s;
  box-shadow: 0 4px 20px rgba(180,131,39,0.5);
}
.play-btn:hover { background: var(--crimson-hover); }
.sermon-content { padding: 1.25rem; }
.sermon-tag { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--crimson); font-weight: 600; }
.sermon-title { font-family: var(--font-body); font-size: 0.98rem; font-weight: 600; color: var(--gray-800); margin-top: 0.5rem; line-height: 1.4; letter-spacing: -0.005em; }
.sermon-pastor { font-size: 0.82rem; color: var(--gray-400); margin-top: 0.4rem; }

/* ─── EVENTS ─── */
.event-card { display: flex; gap: 1.5rem; padding: 1.5rem; align-items: center; }
.event-date-block {
  width: 64px; min-width: 64px; padding: 0.65rem 0.4rem; background: var(--navy);
  border: 1px solid transparent;
  border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-family: var(--font-display); color: white; flex-shrink: 0;
}
.event-day { font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-size: 1.3rem; font-weight: 600; line-height: 1; color: var(--gold-light); }
.event-month {
  font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.14em; opacity: 0.85;
  margin-top: 5px; padding-top: 5px; width: 100%; text-align: center;
  border-top: 1px solid rgba(255,255,255,0.18);
}
.event-title { font-family: var(--font-body); font-size: 1.02rem; font-weight: 600; line-height: 1.35; letter-spacing: -0.005em; color: var(--gray-800); display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.event-meta { font-size: 0.82rem; color: var(--gray-400); margin-top: 4px; }
.event-desc { font-size: 0.9rem; color: var(--gray-600); margin-top: 0.4rem; line-height: 1.65; }

/* Home page "Upcoming Events" preview cards — uniform size, 3-line clamped description */
.home-events-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: stretch; }
@media (max-width: 760px) { .home-events-grid { grid-template-columns: 1fr; } }
.home-event-card { align-items: flex-start; height: 100%; }
.home-event-body { display: flex; flex-direction: column; width: 100%; min-height: 200px; }
.home-event-body .btn { margin-top: auto; align-self: flex-start; }

.event-date-block.urgent { background: var(--orange); animation: urgentGlow 1.4s ease-in-out infinite; }
.event-date-block.urgent .event-day { color: white; }
@keyframes urgentGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(158,27,50,0.6); }
  50% { box-shadow: 0 0 0 9px rgba(158,27,50,0); }
}
.event-urgent-badge {
  display: inline-flex; align-items: center; gap: 5px;
  background: var(--orange); color: white; font-size: 0.65rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em; padding: 3px 10px; border-radius: 20px;
  animation: urgentBlink 1.2s ease-in-out infinite; white-space: nowrap;
}
@keyframes urgentBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.event-actions { display: flex; flex-direction: column; gap: 0.5rem; flex-shrink: 0; min-width: 128px; }
.event-actions .btn { justify-content: center; }
.btn-ghost-navy { background: transparent; color: var(--navy); border: 1.5px solid rgba(33,22,52,0.22); }
.btn-ghost-navy:hover { background: rgba(33,22,52,0.06); border-color: var(--navy); transform: translateY(-2px); }
.dark-mode .btn-ghost-navy { color: #EFEAF5 !important; border-color: rgba(255,255,255,0.25) !important; }
.dark-mode .btn-ghost-navy:hover { background: rgba(255,255,255,0.08) !important; }

.event-form-label { text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.7rem !important; color: var(--gold-dark) !important; font-weight: 700 !important; }

/* Events page */
.events-hero { background: var(--navy); padding: 11rem 2rem 4rem; text-align: center; }
/* Dark page header; the top bar is 110px tall on desktop, 70px below 1100px. */
.page-hero { background: var(--navy); padding: 11rem 2rem 4rem; text-align: center; }
.events-page-heading { display: flex; align-items: end; justify-content: space-between; gap: 1.5rem; margin-bottom: 2rem; }
.events-page-heading .section-header { text-align: left; margin: 0; }
.events-page-heading .gold-line { margin-left: 0; }
.events-intro { max-width: 520px; color: var(--gray-600); font-size: 0.92rem; margin-top: 0.65rem; }
.events-count { flex-shrink: 0; padding: 0.55rem 0.85rem; border: 1px solid rgba(180,131,39,0.35); border-radius: 999px; color: var(--gold-dark); background: rgba(180,131,39,0.08); font-size: 0.76rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.events-list { display: grid; gap: 1rem; }
.events-page-card { position: relative; display: grid; grid-template-columns: 68px minmax(0, 1fr) auto; gap: 1.25rem; align-items: center; padding: 1.25rem; overflow: hidden; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
.events-page-card::before { content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 3px; background: var(--crimson); opacity: 0; transition: opacity 0.2s ease; }
.events-page-card:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(33,22,52,0.09); border-color: rgba(180,131,39,0.38); }
.events-page-card:hover::before { opacity: 1; }
.events-page-card .event-date-block { width: 68px; min-width: 68px; }
.events-page-card .event-title { font-size: 1.3rem !important; }
.events-page-card .event-meta { display: flex; align-items: center; gap: 0.35rem; margin-top: 0.5rem; font-weight: 600; }
.events-page-card .event-desc { max-width: 680px; }
.events-page-card .event-actions { flex-direction: row; min-width: 0; align-items: center; }
.events-page-card .event-actions .btn { min-width: 118px; white-space: nowrap; }
.event-registration-card { padding: 2.5rem; max-width: 600px; margin: 0 auto; border-top: 4px solid var(--gold); }
.dark-mode .events-count { color: var(--gold-light); background: rgba(180,131,39,0.12); }

/* ─── STATS ─── */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 2rem; text-align: center; }
.stat-num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-size: 2.9rem; font-weight: 600; color: var(--gold-light); line-height: 1; }
.stat-label { font-size: 0.88rem; color: rgba(255,255,255,0.7); margin-top: 0.5rem; }
.stat-divider { width: 24px; height: 2px; background: rgba(255,255,255,0.25); margin: 0.75rem auto; border-radius: 0; }

/* ─── GALLERY ─── */
.gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.gallery-item {
  border-radius: 12px; overflow: hidden; cursor: pointer; position: relative;
  aspect-ratio: 1; transition: transform 0.3s;
}
.gallery-item:hover { transform: scale(1.02); }
.gallery-item:nth-child(1) { grid-row: span 2; }
.gallery-bg {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem;
}

/* ─── BLOG ─── */
.blog-card { overflow: hidden; }
.blog-content { padding: 1.25rem; }
.blog-cat { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; color: var(--crimson); }
.blog-title { font-family: var(--font-body); font-size: 0.98rem; font-weight: 600; color: var(--gray-800); margin-top: 0.5rem; line-height: 1.4; letter-spacing: -0.005em; }
.blog-excerpt { font-size: 0.88rem; color: var(--gray-600); margin-top: 0.5rem; line-height: 1.65; }
.blog-meta { font-size: 0.78rem; color: var(--gray-400); margin-top: 0.75rem; display: flex; justify-content: space-between; }

/* ─── COMMUNITY BOARD CARDS (Job Board / Business Directory) — uniform size ─── */
.advert-preview {
  width: 100%; max-height: 520px; display: block; object-fit: contain; cursor: pointer; border: none; padding: 0; background: var(--gray-100);
}
.community-card { height: 100%; display: flex; flex-direction: column; }
.community-card-body { display: flex; flex-direction: column; width: 100%; padding: 1.5rem; flex: 1; }
.community-card-body .btn { margin-top: 1rem; }
.community-card-body .btn:last-child { margin-top: auto; }
.community-card-body .ministry-link { margin-top: 0.5rem; }
.community-contact { display: inline-flex; align-self: flex-start; margin-top: 0.85rem; color: var(--navy); font-size: 0.88rem; font-weight: 700; text-decoration: none; }
.community-contact:hover { color: var(--crimson); }

/* ─── FORMS ─── */
.form-group { margin-bottom: 0.9rem; }
.form-label { display: block; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gray-600); margin-bottom: 0.4rem; }
.form-input, .form-select, .form-textarea {
  width: 100%; padding: 0.65rem 0.85rem; border-radius: 10px;
  border: 1px solid var(--line); font-family: var(--font-body);
  font-size: 0.88rem; font-weight: 500; color: var(--gray-800); outline: none;
  transition: border-color 0.2s; background: white;
}
.form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--crimson); box-shadow: 0 0 0 3px rgba(158,27,50,0.12); }
.form-textarea { resize: vertical; min-height: 80px; }

/* ─── GIVING ─── */
.giving-hero {
  background: var(--navy);
  padding: 11rem 2rem 4rem; text-align: center;
}
/* Any full-width dark header that starts the page clears the fixed bar. */
.below-bar { padding-top: 11rem; }
.amount-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; margin: 1.5rem 0; }
.amount-btn {
  padding: 0.7rem 1.4rem; border-radius: 12px;
  border: 1px solid var(--line); background: var(--white);
  font-family: var(--font-mono); font-variant-numeric: tabular-nums;
  color: var(--gray-800); font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: all 0.2s;
}
.dark-mode .amount-btn { background: transparent !important; }
.amount-btn.selected, .amount-btn:hover { background: var(--crimson); border-color: var(--crimson); color: white; }

/* ─── FOOTER ─── */
.footer {
  position: relative; background: #0C0814; color: rgba(255,255,255,0.7);
  padding: 5rem 2rem 2rem; overflow: hidden;
}
.footer::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: rgba(255,255,255,0.1);
}
.footer-grid {
  position: relative; display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 3rem; max-width: 1280px; margin: 0 auto;
}
.footer-grid > div + div { padding-left: 2.5rem; border-left: 1px solid rgba(255,255,255,0.06); }
.footer-brand-name { font-family: var(--font-display); font-size: 1.5rem; font-weight: 600; line-height: 0.95; color: white; margin-bottom: 0.45rem; letter-spacing: 0.01em; }
.footer-brand-sub { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--gold); }
.footer-desc { font-size: 0.88rem; line-height: 1.8; color: rgba(255,255,255,0.6); margin-top: 1.1rem; max-width: 340px; }
.footer-verse {
  margin-top: 1.5rem; padding: 1.25rem 1.4rem;
  background: rgba(180,131,39,0.08); border-left: 3px solid var(--gold);
  border-radius: 0 10px 10px 0; font-size: 0.85rem; font-style: italic;
  line-height: 1.7; color: rgba(255,255,255,0.75);
}
.footer-verse cite { display: block; font-style: normal; font-weight: 600; color: var(--gold); margin-top: 0.6rem; font-size: 0.75rem; letter-spacing: 0.04em; }
.footer-col-title {
  font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em;
  color: var(--gold); margin-bottom: 1.4rem; padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(180,131,39,0.25); display: inline-block;
}
.footer-link { display: block; font-size: 0.89rem; color: rgba(255,255,255,0.55); text-decoration: none; margin-bottom: 0.75rem; cursor: pointer; transition: all 0.2s; }
.footer-link:hover { color: white; }
.footer-socials { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
.social-btn {
  width: 38px; height: 38px; border-radius: 10px;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem; color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.2s;
}
.social-btn:hover { background: var(--crimson); border-color: var(--crimson); color: white; }

.footer-contact-row { display: flex; align-items: center; gap: 12px; margin-bottom: 1.1rem; text-decoration: none; cursor: default; }
a.footer-contact-row { cursor: pointer; }
.footer-contact-icon {
  width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
  background: rgba(180,131,39,0.1); border: 1px solid rgba(180,131,39,0.22);
  display: flex; align-items: center; justify-content: center;
  color: var(--gold-light); transition: all 0.2s;
}
.footer-contact-text { font-size: 0.89rem; color: rgba(255,255,255,0.6); line-height: 1.4; transition: color 0.2s; }
a.footer-contact-row:hover .footer-contact-icon { background: var(--crimson); border-color: var(--crimson); color: white; }
a.footer-contact-row:hover .footer-contact-text { color: white; }

.footer-bottom {
  position: relative; max-width: 1280px; margin: 3.5rem auto 0;
  padding-top: 1.75rem; border-top: 1px solid rgba(255,255,255,0.08);
  display: flex; justify-content: space-between; align-items: center;
  font-size: 0.82rem; color: rgba(255,255,255,0.35);
  flex-wrap: wrap; gap: 1rem;
}

/* ─── SUPPORT WIDGET ─── */
.support-widget {
  position: fixed; bottom: 2rem; right: 2rem; z-index: 1100;
}
.support-toggle {
  width: 48px; height: 48px; padding: 0; border-radius: 50%; justify-content: center;
  background: var(--crimson); border: none; cursor: pointer;
  box-shadow: 0 6px 20px rgba(158,27,50,0.35); color: white; position: relative;
  transition: transform 0.25s ease, box-shadow 0.25s ease; display: flex; align-items: center; gap: 8px;
}
.support-toggle:hover { transform: scale(1.05); box-shadow: 0 7px 30px rgba(180,131,39,0.7); }
.support-toggle-label { display: none; }
.support-toggle-icon { width: 20px; height: 20px; flex-shrink: 0; }
.support-launcher {
  width: 272px; padding: 0.5rem 0.35rem; border-radius: 18px;
  display: flex; align-items: stretch; justify-content: space-between;
  background: rgba(255,255,255,0.98); border: 1px solid rgba(33,22,52,0.1);
  box-shadow: 0 12px 34px rgba(33,22,52,0.2); backdrop-filter: blur(12px);
}
.support-launcher-item {
  flex: 1; min-width: 0; border: none; border-radius: 12px; padding: 0.42rem 0.25rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.28rem;
  background: transparent; color: var(--gray-400); cursor: pointer; font-family: var(--font-body);
  font-size: 0.76rem; font-weight: 700; transition: color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}
.support-launcher-item:hover, .support-launcher-item.active { color: #3677bc; background: rgba(54,119,188,0.09); }
.support-launcher-item:hover { transform: translateY(-1px); }
.support-launcher-icon { width: 25px; height: 25px; flex-shrink: 0; }
.support-launcher-icon-wrap { position: relative; display: flex; }
.dark-mode .support-launcher { background: rgba(19,29,53,0.98) !important; border-color: rgba(180,131,39,0.2) !important; }
.dark-mode .support-launcher-item { color: #ABA1B8 !important; }
.dark-mode .support-launcher-item:hover, .dark-mode .support-launcher-item.active { color: var(--gold-light) !important; background: rgba(180,131,39,0.12) !important; }
.support-badge {
  position: absolute; top: -7px; right: -9px;
  background: #e72b31; color: white; font-size: 0.68rem; font-weight: 700;
  min-width: 19px; height: 19px; border-radius: 10px; padding: 0 4px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 0 2px white; line-height: 1;
}
.dark-mode .support-badge { box-shadow: 0 0 0 2px #120C1C !important; }
.chat-unread-badge {
  background: var(--orange); color: white; font-size: 0.65rem; font-weight: 700;
  min-width: 16px; height: 16px; border-radius: 9px; padding: 0 4px;
  display: inline-flex; align-items: center; justify-content: center; line-height: 1;
}
.support-panel {
  position: absolute; bottom: 70px; right: 0;
  width: 320px; max-height: min(520px, calc(100vh - 190px)); display: flex; flex-direction: column;
  background: white; border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  border: 1px solid rgba(180,131,39,0.2);
  overflow: hidden; transform-origin: bottom right;
  transition: all 0.3s; transform: scale(0.8); opacity: 0; pointer-events: none;
}
.support-panel.open { transform: scale(1); opacity: 1; pointer-events: all; }
.dark-mode .support-panel { background: #1A1226 !important; }
.support-header { background: var(--navy); padding: 1.1rem 1.25rem; color: white; flex-shrink: 0; }
.support-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; line-height: 1; }
.support-subtitle { font-size: 0.76rem; opacity: 0.7; margin-top: 2px; }
.support-tab-nav { display: flex; border-top: 1px solid var(--gray-200); flex-shrink: 0; padding: 0.55rem 0.4rem; }
.dark-mode .support-tab-nav { border-color: rgba(180,131,39,0.15) !important; }
.support-tab-btn {
  flex: 1; padding: 0.35rem 0.2rem; border: none; border-radius: 10px; background: transparent; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 0.22rem; font-family: var(--font-body);
  font-size: 0.72rem; font-weight: 700; color: var(--gray-400); transition: all 0.2s;
}
.support-tab-btn.active { color: #3677bc; background: rgba(54,119,188,0.09); }
.support-tab-icon { width: 23px; height: 23px; }
.support-tab-icon-wrap { position: relative; display: flex; }
.dark-mode .support-tab-btn.active { color: var(--gold-light) !important; }
.support-body { padding: 1.1rem; overflow-y: auto; flex: 1; }

/* Chat thread inside the "My Requests" tab */
.chat-request-item {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 0.7rem 0.85rem; border-radius: 10px; border: 1px solid var(--gray-200);
  cursor: pointer; margin-bottom: 0.6rem; text-align: left; width: 100%; background: none;
  font-family: var(--font-body);
}
.dark-mode .chat-request-item { border-color: rgba(180,131,39,0.2) !important; }
.chat-status-pill { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border-radius: 20px; }
.chat-status-pill.new { background: rgba(158,27,50,0.15); color: var(--orange); }
.chat-status-pill.responded { background: rgba(78,150,110,0.15); color: #4E966E; }
.chat-status-pill.closed { background: var(--gray-100); color: var(--gray-400); }
.chat-thread { display: flex; flex-direction: column; gap: 0.6rem; max-height: 260px; overflow-y: auto; margin-bottom: 0.85rem; padding-right: 2px; }
.chat-bubble { max-width: 82%; padding: 0.55rem 0.8rem; border-radius: 12px; font-size: 0.84rem; line-height: 1.45; }
.chat-bubble.user { align-self: flex-end; background: var(--crimson); color: white; border-bottom-right-radius: 3px; }
.chat-bubble.admin { align-self: flex-start; background: var(--gray-100); color: var(--gray-800); border-bottom-left-radius: 3px; }
.dark-mode .chat-bubble.admin { background: #221733 !important; color: #EFEAF5 !important; }
.chat-bubble-meta { font-size: 0.65rem; opacity: 0.7; margin-top: 3px; }
.typing-indicator { display: flex; align-items: center; gap: 4px; padding: 0.65rem 0.9rem !important; }
.typing-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: 0.4; animation: typingBounce 1.2s infinite ease-in-out; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-4px); opacity: 1; } }
.chat-reply-row { display: flex; gap: 0.5rem; align-items: flex-end; }
.chat-reply-row textarea { flex: 1; min-height: 42px; }

/* ─── DARK MODE TOGGLE ─── */
.theme-toggle {
  width: 44px; height: 24px; border-radius: 50px;
  border: 2px solid var(--gray-200); background: var(--gray-100);
  cursor: pointer; position: relative; transition: all 0.3s;
}
.theme-toggle.dark { background: var(--navy); border-color: var(--navy); }
.toggle-thumb {
  position: absolute; width: 16px; height: 16px; border-radius: 50%;
  background: var(--crimson); top: 2px; left: 2px; transition: all 0.3s;
}
.theme-toggle.dark .toggle-thumb { left: 22px; background: var(--gold-light); }

/* ─── MAP EMBED ─── */
.map-container { 
  border-radius: 16px; overflow: hidden; height: 300px;
  background: linear-gradient(135deg, #e8e0d0 0%, #d4cabb 100%);
  display: flex; align-items: center; justify-content: center;
  position: relative; font-size: 3rem;
}
.map-pin-mock {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -60%);
  text-align: center;
}
.map-label { font-size: 0.85rem; font-weight: 600; color: var(--navy); margin-top: 0.5rem; background: white; padding: 4px 12px; border-radius: 20px; white-space: nowrap; box-shadow: 0 2px 12px rgba(0,0,0,0.15); }

/* ─── NEWSLETTER BANNER ─── */
.newsletter { 
  background: var(--navy);
  padding: 3.5rem 2rem; text-align: center;
}
.newsletter-form { display: flex; gap: 0.75rem; max-width: 480px; margin: 1.5rem auto 0; flex-wrap: wrap; justify-content: center; }
.newsletter-input { flex: 1; min-width: 220px; padding: 0.85rem 1.25rem; border-radius: 10px; border: 1px solid rgba(180,131,39,0.3); background: rgba(255,255,255,0.1); color: white; font-family: var(--font-body); font-size: 0.9rem; outline: none; }
.newsletter-input::placeholder { color: rgba(255,255,255,0.5); }
.newsletter-input:focus { border-color: var(--gold-light); }

/* ─── TABS ─── */
.tab-nav { display: flex; gap: 0.25rem; margin-bottom: 2rem; flex-wrap: wrap; background: var(--gray-100); padding: 0.35rem; border-radius: 12px; }
.tab-btn { padding: 0.6rem 1.25rem; border-radius: 9px; font-size: 0.875rem; font-weight: 500; border: none; background: transparent; cursor: pointer; color: var(--gray-600); transition: all 0.2s; }
.tab-btn.active { background: white; color: var(--gray-800); font-weight: 600; box-shadow: 0 1px 2px rgba(33,22,52,0.08); }

/* ─── EVENT DETAILS MODAL ─── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(33,22,52,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 1.5rem; animation: fadeSlideUp 0.2s ease both;
}
.modal-card {
  background: white; border-radius: 20px; max-width: 440px; width: 100%;
  max-height: 88vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  display: flex; flex-direction: column;
}
.dark-mode .modal-card { background: #1A1226 !important; }
.modal-header {
  background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%);
  padding: 1.35rem 1.5rem; color: white; position: relative; flex-shrink: 0;
}
.modal-close {
  position: absolute; top: 1rem; right: 1rem;
  background: rgba(255,255,255,0.12); border: none; color: white;
  width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
  font-size: 1rem; display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.modal-close:hover { background: rgba(255,255,255,0.25); }
.lightbox-img { max-width: 92vw; max-height: 88vh; border-radius: 14px; box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
.lightbox-close { position: fixed; top: 1.5rem; right: 1.5rem; background: rgba(255,255,255,0.15); }
.lightbox-close:hover { background: rgba(255,255,255,0.3); }
.modal-date-badge {
  display: inline-flex; flex-direction: column; align-items: center;
  background: rgba(180,131,39,0.15); border: 1px solid rgba(180,131,39,0.4);
  border-radius: 12px; padding: 0.5rem 1rem; margin-bottom: 0.75rem;
}
.modal-body { padding: 1.5rem; overflow-y: auto; }
.modal-body p { color: var(--gray-600); line-height: 1.75; font-size: 0.95rem; }
.dark-mode .modal-body p { color: #ABA1B8 !important; }

/* ─── VIDEO MODAL ─── */
.modal-card-video { max-width: 860px; background: #000 !important; position: relative; }
.video-frame-wrap { position: relative; width: 100%; padding-top: 56.25%; background: #000; }
.video-frame-wrap iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }
.modal-video-info { padding: 1.5rem 1.75rem; background: white; }
.dark-mode .modal-video-info { background: #1A1226 !important; }
.modal-video-info .modal-title { font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; line-height: 1.05; color: var(--navy); }
.dark-mode .modal-video-info .modal-title { color: #EFEAF5 !important; }
.modal-video-info .modal-meta { font-size: 0.82rem; color: var(--gray-400); margin-top: 4px; }
.modal-close-video {
  position: absolute; top: 0.75rem; right: 0.75rem; z-index: 5;
  background: rgba(0,0,0,0.5); border: none; color: white;
  width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
  font-size: 1.1rem; display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.modal-close-video:hover { background: rgba(0,0,0,0.7); }

/* ─── ANIMATIONS ─── */
@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeSlideLeft { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.animate-float { animation: float 4s ease-in-out infinite; }
.fade-in { animation: fadeSlideUp 0.6s ease both; }

/* ─── RESPONSIVE ─── */
@media (max-width: 900px) {
  .hero-content { grid-template-columns: 1fr; gap: 2.5rem; }
  .hero-visual { width: 100%; justify-self: stretch; }
  .hero-visual .service-card { padding: 2rem; }
  .about-grid { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: 1fr 1fr; row-gap: 2.5rem; }
  .footer-grid > div + div { border-left: none; padding-left: 0; }
  .footer-grid > div:nth-child(2) { padding-left: 2.5rem; border-left: 1px solid rgba(255,255,255,0.06); }
  .gallery-grid { grid-template-columns: 1fr 1fr; }
  .gallery-item:nth-child(1) { grid-row: span 1; }
  .featured-sermon-grid { grid-template-columns: 1fr !important; }
}
@media (max-width: 1100px) {
  .nav-links { display: none; }
  .mobile-menu-btn { display: flex; align-items: center; gap: 0.75rem; }
  .nav-inner { padding: 0 1.25rem; }
}
@media (max-width: 640px) {
  .nav-cta { display: none; }
  .section { padding: 3.5rem 1.25rem; }
  .hero-content { padding: 5.5rem 1.25rem 2rem; gap: 0; }
  .hero-text-col { display: contents; }
  .hero-badge { order: 1; font-size: 0.62rem; padding: 0.35rem 0.75rem; margin-bottom: 1rem; justify-self: center; }
  .hero-title { order: 2; font-size: 2.45rem; margin-bottom: 0.75rem; }
  .hero-title-break-1 { display: none; }
  .poster-empty { height: 250px; }
  .hero-desc { order: 3; font-size: 0.92rem; line-height: 1.65; margin-bottom: 1.25rem; }
  .hero-visual { order: 4; margin-bottom: 1.5rem; }
  .service-card { padding: 1.1rem; }
  .countdown-section { margin-top: 0.85rem; padding-top: 0.85rem; }
  .countdown-label { font-size: 0.7rem; margin-bottom: 0.6rem; }
  .countdown-unit { padding: 0.5rem 0.4rem; }
  .countdown-num { font-size: 1.25rem; }
  .hero-btns { order: 5; }
  .footer-grid { grid-template-columns: 1fr; }
  .footer-grid > div + div { border-left: none; padding-left: 0; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.06); }
  .event-card { flex-direction: column; gap: 1rem; }
  .support-widget { bottom: 1rem; right: 1rem; }
  .support-toggle { width: 44px; height: 44px; padding: 0; justify-content: center; }
  .support-toggle-label { display: none; }
  .support-toggle-icon { width: 18px; height: 18px; }
  .support-panel { width: 280px; }
  .featured-sermon-grid .featured-sermon-thumb { min-height: 200px !important; padding: 1.75rem !important; }
  .featured-sermon-grid .featured-sermon-info { padding: 1.75rem !important; }
  .featured-sermon-grid .featured-sermon-title { font-size: 1.4rem !important; }
  .community-tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.35rem; }
  .community-tabs .tab-btn { width: 100%; min-width: 0; padding: 0.7rem 0.4rem; font-size: 0.78rem; line-height: 1.2; }
  .events-hero, .page-hero, .giving-hero { padding: 7rem 1.25rem 3.25rem; }
  .below-bar { padding-top: 7rem; }
  .events-page-heading { align-items: flex-start; flex-direction: column; gap: 0.9rem; }
  .events-count { align-self: flex-start; }
  .events-page-card { grid-template-columns: 58px minmax(0, 1fr); gap: 1rem; padding: 1.1rem; }
  .events-page-card .event-date-block { width: 58px; min-width: 58px; }
  .events-page-card .event-actions { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; margin-top: 0.1rem; }
  .events-page-card .event-actions .btn { width: 100%; min-width: 0; padding-left: 0.6rem; padding-right: 0.6rem; }
  .event-registration-card { padding: 1.5rem; }
}

/* ─── 3-ZONE TOP BAR + UTILITY STRIP ─── */
.nav-actions { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
.nav-links { flex: 1; justify-content: center; gap: 0.35rem; }
.nav-sub { border-top: 1px solid var(--line); background: rgba(248,250,252,0.9); }
.nav-sub-inner { max-width: 1440px; margin: 0 auto; padding: 0 1.5rem; height: 44px; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; }
.nav-sub-info { font-size: 0.75rem; color: var(--gray-600); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nav-sub-info strong { color: var(--gray-800); font-weight: 600; }
.nav-sub-links { display: flex; align-items: center; gap: 0.15rem; flex-shrink: 0; }
.nav-sub-link { padding: 0.45rem 0.6rem; border: none; background: none; border-radius: 6px; cursor: pointer; font: inherit; font-size: 0.75rem; font-weight: 500; color: var(--gray-600); white-space: nowrap; }
.nav-sub-link:hover { color: var(--gray-800); background: var(--gray-100); }
.nav-sub-link.active { color: var(--crimson); font-weight: 600; }
.nav-sub-links .theme-toggle { margin-left: 0.6rem; }
.dark-mode .nav-sub { background: rgba(18,12,28,0.9) !important; border-top-color: #2E2240 !important; }
.dark-mode .nav-sub-link:hover { background: #221733 !important; color: #F7F3FB !important; }
.dark-mode .nav-sub-link.active { color: #C9A3E8 !important; }
.mobile-drawer-group { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gray-400); margin: 1.25rem 0 0.35rem; }
.mobile-drawer-group:first-child { margin-top: 0; }

/* Quiet secondary button on light surfaces */
.btn-quiet { background: white; color: var(--gray-800); border: 1px solid var(--line); }
.btn-quiet:hover { background: var(--gray-100); }
.dark-mode .btn-quiet { background: transparent !important; color: #EFEAF5 !important; border-color: #4A3760 !important; }
.dark-mode .btn-quiet:hover { background: #2E2240 !important; border-color: #6A5186 !important; }

/* ─── SPLIT HERO ─── */
.hero-wrap { padding-top: 10.5rem; background: radial-gradient(circle at 84% 16%, rgba(196,154,58,0.18), transparent 28%), linear-gradient(180deg, #FAF8FC 0%, #F0EAF5 100%); }
.hero-split { display: grid; grid-template-columns: minmax(0, 6fr) minmax(0, 6fr); gap: 1.75rem; align-items: stretch; }
.hero-copy { display: flex; flex-direction: column; justify-content: space-between; padding: 2.5rem; border-top: 3px solid var(--crimson); }
.hero-copy .overline { margin-bottom: 1rem; }
.hero-copy .hero-title { color: var(--gray-800); margin-bottom: 1.25rem; animation: none; }
.hero-copy .hero-title span { color: var(--crimson); }
.hero-copy .hero-desc { color: var(--gray-600); animation: none; margin-bottom: 1.25rem; }
.hero-verse { font-family: var(--font-display); font-style: italic; font-size: 0.98rem; line-height: 1.6; color: var(--gray-600); padding-left: 1rem; border-left: 2px solid var(--gold); }
.hero-verse cite { display: block; font-style: normal; font-family: var(--font-mono); font-size: 0.74rem; font-weight: 500; color: var(--crimson); margin-top: 0.5rem; }
.hero-foot { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--line); animation: none; }
.hero-foot .hero-btns { animation: none; }
.dark-mode .hero-copy .hero-title { color: #F7F3FB !important; }
.dark-mode .hero-copy .hero-title span { color: #C9A3E8 !important; }
.hero-photo { position: relative; min-height: 420px; border-radius: 16px; border: 1px solid rgba(33,22,52,0.13); overflow: hidden; background-size: cover; background-position: center 35%; box-shadow: var(--shadow-md); }
.hero-photo-cap { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; gap: 0.45rem; padding: 1.75rem;
  background: linear-gradient(to top, rgba(33,22,52,0.92) 0%, rgba(33,22,52,0.45) 45%, rgba(33,22,52,0.05) 100%); }
.hero-photo-times { font-family: var(--font-mono); font-size: 0.72rem; line-height: 1.5; color: var(--gold-light); }
.hero-photo-title { font-family: var(--font-display); font-size: 1.35rem; font-weight: 600; color: white; line-height: 1.25; }
.hero-photo-sub { font-size: 0.78rem; color: rgba(255,255,255,0.75); }

/* ─── SERVICE STRIP + OPPORTUNITIES SPOTLIGHT ─── */
.strip-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
.strip-head .section-header { margin-bottom: 0; text-align: left; }
.service-slot { padding: 1.35rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; }
.service-slot-time { font-family: var(--font-mono); font-size: 0.86rem; font-weight: 600; color: var(--crimson); }
.service-slot-title { font-size: 1rem; font-weight: 600; color: var(--gray-800); margin-top: 0.5rem; }
.service-slot-desc { font-size: 0.86rem; color: var(--gray-600); line-height: 1.6; margin-top: 0.35rem; }
.dark-mode .service-slot-title { color: #F7F3FB !important; }
.dark-mode .service-slot-time { color: #C9A3E8 !important; }

/* ─── NEXT UP ─── */
.next-up { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 1.5rem; padding: 1.5rem; align-items: center; }
.next-up-poster { border-radius: 12px; overflow: hidden; }
.next-up-body { padding: 0.5rem 0.5rem 0.5rem 0; }
.next-up-title { font-family: var(--font-display); font-size: 1.35rem; font-weight: 600; color: var(--gray-800); line-height: 1.25; margin: 0.5rem 0 1rem; }
.next-up-desc { font-size: 0.9rem; color: var(--gray-600); line-height: 1.65; margin-bottom: 1.25rem; max-width: 46ch; }
.next-up .countdown-label { color: var(--crimson); }
.next-up .countdown-label::before { background: var(--crimson); }
.next-up .countdown-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.6rem; max-width: 420px; }
.next-up .countdown-unit { background: var(--gray-100); border: 1px solid var(--line); border-radius: 12px; padding: 0.75rem 0.4rem; text-align: center; }
.next-up .countdown-num { color: var(--navy); font-size: 1.45rem; }
.next-up .countdown-unit-label { color: var(--gray-400); }
.dark-mode .next-up-title { color: #F7F3FB !important; }
.dark-mode .next-up .countdown-unit { background: #221733 !important; border-color: #2E2240 !important; }
.dark-mode .next-up .countdown-num { color: var(--gold-light) !important; }

/* ─── METRICS BAR ─── */
.metrics-card { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.5rem; padding: 1.75rem 2rem; }
.metrics-card .stat-num { color: var(--navy); font-size: 2.3rem; }
.metrics-card .stat-label { color: var(--gray-600); font-size: 0.8rem; margin-top: 0.35rem; }
.dark-mode .metrics-card .stat-num { color: var(--gold-light) !important; }

/* ─── HOME GALLERY MOMENTS ─── */
.home-gallery-grid { display: grid; grid-template-columns: 1.15fr 0.85fr 0.85fr; gap: 1rem; }
.home-gallery-card { min-height: 310px; position: relative; overflow: hidden; border-radius: 16px; background: var(--navy); box-shadow: var(--shadow-sm); }
/* Only span two rows when there are enough images to fill the second row. */
.home-gallery-card:first-child:nth-last-child(n+4) { min-height: 380px; grid-row: span 2; }
.home-gallery-card img { width: 100%; height: 100%; position: absolute; inset: 0; object-fit: cover; transition: transform 0.45s ease; }
.home-gallery-card:hover img { transform: scale(1.045); }
.home-gallery-card::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(33,22,52,0.76), rgba(33,22,52,0.02) 58%); pointer-events: none; }
.home-gallery-caption { position: absolute; z-index: 1; left: 1.25rem; right: 1.25rem; bottom: 1.1rem; color: white; font-family: var(--font-display); font-size: 1rem; line-height: 1.25; }
@media (max-width: 760px) {
  .home-gallery-grid { grid-template-columns: 1fr 1fr; }
  .home-gallery-card, .home-gallery-card:first-child { min-height: 210px; grid-row: auto; }
  .home-gallery-card:first-child { grid-column: 1 / -1; min-height: 290px; }
}

@media (max-width: 1100px) {
  .nav-sub { display: none; }
  .mobile-drawer { top: 70px; bottom: 0; }
  .footer { padding-bottom: 2rem; }
  .support-widget { bottom: 1rem; }
  .hero-wrap { padding-top: 7rem; }
  .hero-split { grid-template-columns: 1fr; }
  .hero-copy { padding: 1.75rem; }
  .hero-photo { min-height: 260px; }
  .next-up { grid-template-columns: 1fr; }
  .metrics-card { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 1.5rem; }
  .app-prompt { bottom: 1rem; }
}

@media (max-width: 640px) {
  .hero-copy { padding: 1.5rem; }
  .hero-copy .hero-title { font-size: clamp(2.2rem, 10vw, 3rem); }
  .hero-foot { margin-top: 1.5rem; padding-top: 1.25rem; }
  .hero-foot .hero-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; }
  .hero-foot .hero-btns .btn { width: 100%; }
  .hero-foot .hero-btns .btn:first-child { grid-column: 1 / -1; }
  .hero-copy .hero-title { font-size: clamp(1.95rem, 8.4vw, 2.5rem); }
  .hero-copy .hero-desc { font-size: 0.95rem; }
  .hero-where { margin-top: 1.25rem; padding-top: 1rem; }
  .hero-photo { min-height: 300px; }
  .hero-photo-cap { padding: 1.25rem; }
  .hero-photo-title { font-size: 1.18rem; }
  .next-up { padding: 1rem; }
  .metrics-card { gap: 1rem; }
}


/* ─── HOME: set like a service sheet ─── */
.hero-copy .hero-title { font-size: clamp(2.2rem, 3.5vw, 3.35rem); line-height: 1.05; letter-spacing: -0.025em; }
.hero-copy .hero-desc { max-width: 46ch; }
.hero-where { margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid var(--line); font-size: 0.86rem; line-height: 1.6; color: var(--gray-600); }
.hero-photo-cap { gap: 0.45rem; }
.dark-mode .hero-where { border-top-color: #2E2240 !important; }

/* Section headers: a title, what it is for, and the one way onward. */
.strip-head { margin-bottom: 1.75rem; }
.strip-title { font-size: clamp(1.55rem, 2.3vw, 2.05rem); margin-bottom: 0.3rem; text-align: left; }
.strip-sub { font-size: 0.85rem; color: var(--gray-600); }
.strip-sub.tabular { font-size: 0.78rem; }

/* The Sunday order of service: one sheet, ruled between the hours. */
.service-sheet { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); padding: 0; }
.service-sheet .service-slot { padding: 1.6rem 1.75rem; border-left: 1px solid var(--line); display: block; }
.service-sheet .service-slot:first-child { border-left: none; }
.service-slot-time { font-size: 1.15rem; letter-spacing: -0.01em; }
.service-sheet .service-slot-desc { max-width: 34ch; }
.dark-mode .service-sheet .service-slot { border-left-color: #2E2240 !important; }

/* The jobs board, where people are already browsing what is on. */
.opps-band {
  margin-top: 1.5rem; background: var(--navy); border-radius: 16px; padding: 1.6rem 1.9rem;
  display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap;
}
.opps-band h3 { font-family: var(--font-display); font-size: 1.25rem; font-weight: 600; color: white; line-height: 1.25; }
.opps-band p { font-size: 0.87rem; line-height: 1.6; color: rgba(255,255,255,0.72); margin-top: 0.35rem; max-width: 60ch; }

/* Ministries as an editorial directory: each team is defined by its purpose. */
.ministry-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 1px solid var(--line); border-left: 1px solid var(--line); }
.ministry-row {
  display: grid; grid-template-columns: 2.5rem 1fr; gap: 1rem; align-items: start; text-align: left;
  min-height: 142px; padding: 1.35rem 1.5rem; border: none; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line);
  background: none; font: inherit; color: inherit; cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}
.ministry-row:hover { background: white; }
.ministry-row-index { color: var(--gold-dark); font-family: var(--font-mono); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; line-height: 1.5; }
.ministry-row-title { display: block; font-family: var(--font-display); font-size: 1.18rem; font-weight: 600; line-height: 1.1; color: var(--navy); letter-spacing: -0.02em; }
.ministry-row-desc {
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  font-size: 0.86rem; line-height: 1.6; color: var(--gray-600); margin-top: 0.45rem;
}
.dark-mode .ministry-list, .dark-mode .ministry-row { border-color: #2E2240 !important; }
.dark-mode .ministry-row:hover { background: #1A1226; }
.dark-mode .ministry-row-title { color: #F7F3FB; }

/* Lift belongs to cards you can click, not to every panel on the page. */
.hero-copy:hover, .service-sheet:hover, .next-up:hover, .metrics-card:hover {
  transform: none; box-shadow: var(--shadow-sm); border-color: var(--line);
}

@media (max-width: 860px) {
  .service-sheet { grid-template-columns: 1fr; }
  .service-sheet .service-slot { border-left: none; border-top: 1px solid var(--line); padding: 1.25rem 1.35rem; }
  .service-sheet .service-slot:first-child { border-top: none; }
  .dark-mode .service-sheet .service-slot { border-left-color: transparent !important; border-top-color: #2E2240 !important; }
  .ministry-list { grid-template-columns: 1fr; }
  .ministry-row { min-height: 0; padding: 1.1rem 0; border-right: none; }
  .opps-band { padding: 1.35rem 1.4rem; }
  .strip-head { margin-bottom: 1.35rem; }
}

/* ─── INSTITUTIONAL POLISH ───
   A compact information band, bright masthead, precise accents and calmer
   panels give every public route one clear visual system. */
.nav-utility { background: var(--navy); color: rgba(255,255,255,0.82); }
.nav-utility-inner { max-width: 1440px; height: 34px; margin: 0 auto; padding: 0 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; font-size: 0.72rem; font-weight: 500; letter-spacing: 0.01em; }
.nav-utility-inner > div { display: flex; align-items: center; gap: 0.65rem; }
.nav-utility a, .nav-utility button { color: rgba(255,255,255,0.9); background: none; border: 0; padding: 0; font: inherit; cursor: pointer; text-decoration: none; }
.nav-utility a:hover, .nav-utility button:hover { color: var(--gold-light); }
.nav-utility-dot { color: var(--gold); }
nav { background: rgba(255,255,255,0.98); border-bottom-color: #D8E2ED; }
nav.scrolled { box-shadow: 0 5px 18px rgba(6,45,87,0.09); }
.nav-inner { height: 76px; }
.logo-cross { width: 46px; height: 46px; border-radius: 0; }
.logo-text { font-size: 1.16rem; color: var(--navy); }
.logo-sub { color: var(--crimson); }
.nav-links { gap: 0.35rem; }
.nav-link { min-height: 48px; padding: 0.7rem 0.82rem; border-radius: 0; font-size: 0.79rem; font-weight: 650; color: #40546A; text-transform: uppercase; letter-spacing: 0.035em; }
.nav-link:hover, .nav-link.active { color: var(--navy); }
.nav-links .nav-link::after { left: 0.82rem; right: 0.82rem; height: 3px; background: var(--gold); }
.nav-cta { border-radius: 4px; padding: 0.68rem 1.15rem; background: var(--crimson); box-shadow: 0 4px 12px rgba(7,92,172,0.18); }
.nav-cta:hover { background: var(--crimson-hover); }
.nav-sub { background: #F7F9FC; border-top: 0; border-bottom: 1px solid var(--line); }
.nav-sub-inner { height: 38px; }
.nav-sub-info { color: #60738A; }
.nav-sub-info strong { color: var(--navy); }
.nav-sub-link { border-radius: 0; font-size: 0.7rem; font-weight: 650; }
.nav-sub-link.active { color: var(--crimson); }

.hero-wrap { padding-top: 11.4rem; background: linear-gradient(135deg, #F8FBFE 0%, #ECF4FA 58%, #F8F3E5 100%); }
.hero-split { gap: 2.25rem; max-width: 1320px; }
.hero-copy { position: relative; padding: clamp(2rem,4vw,3.6rem); border: 1px solid #D6E2ED; border-top: 5px solid var(--gold); border-radius: 4px; box-shadow: none; background: rgba(255,255,255,0.88); }
.hero-copy::before { content: 'WELCOME TO'; color: var(--crimson); font-family: var(--font-mono); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.16em; margin-bottom: 1.1rem; }
.hero-copy .hero-title { font-size: clamp(2.5rem,4vw,4.25rem); color: var(--navy); line-height: 1.02; }
.hero-copy .hero-title span { color: var(--crimson); }
.hero-copy .hero-desc { font-size: 1.03rem; line-height: 1.8; }
.hero-verse { border-left: 3px solid var(--gold); color: #4C6279; }
.hero-foot { border-top-color: #D6E2ED; }
.hero-photo { border-radius: 4px; border: 0; min-height: 500px; box-shadow: 0 16px 40px rgba(6,45,87,0.16); }
.hero-photo-cap { background: linear-gradient(to top, rgba(6,45,87,0.94), rgba(6,45,87,0.38) 48%, transparent 75%); padding: 2rem; }
.hero-photo-title { font-size: 1.55rem; }

.section { padding-top: 5.5rem; padding-bottom: 5.5rem; }
.section-sm { padding-top: 3.75rem; padding-bottom: 3.75rem; }
.section-cream { background: #F5F8FB; }
.section-title { color: var(--navy); letter-spacing: -0.025em; }
.overline { color: var(--crimson); font-size: 0.68rem; letter-spacing: 0.15em; }
.section-header { margin-bottom: 3rem; }
.card { border-color: #DCE5F0; border-radius: 5px; box-shadow: none; }
.card:hover { box-shadow: 0 10px 24px rgba(6,45,87,0.08); }
.btn { border-radius: 4px; font-weight: 700; }
.btn-gold { background: var(--crimson); }
.btn-gold:hover { background: var(--crimson-hover); }
.btn-quiet { border-radius: 4px; }
.service-sheet { border-top: 3px solid var(--gold); }
.service-slot-time { color: var(--crimson); }
.next-up { border-left: 4px solid var(--gold); }
.metrics-card { border-top: 3px solid var(--crimson); }
.metrics-card .stat-num { color: var(--crimson); }
.opps-band { border-radius: 4px; border-left: 4px solid var(--gold); }
.home-gallery-card, .home-gallery-card:first-child { border-radius: 4px; }
.page-hero, .events-hero, .giving-hero { background: linear-gradient(115deg, #062D57, #0B4E8A); border-bottom: 4px solid var(--gold); }
.page-hero::after, .events-hero::after { content: ''; display: block; width: 56px; height: 3px; margin: 1.35rem auto 0; background: var(--gold); }
.newsletter { background: linear-gradient(115deg, #062D57, #0B477F); border-top: 4px solid var(--gold); }
.footer { background: #041F3D; border-top: 4px solid var(--gold); }
.footer-col-title { color: var(--gold-light); }
.footer-link:hover { color: var(--gold-light); }

@media (max-width: 1100px) {
  .nav-utility, .nav-sub { display: none; }
  .nav-inner { height: 70px; }
  .hero-wrap { padding-top: 7rem; }
}
@media (max-width: 640px) {
  .hero-wrap { padding: 5.7rem 1.25rem 2rem; }
  .hero-split { gap: 1rem; }
  .hero-copy { padding: 1.5rem; }
  .hero-copy::before { margin-bottom: 0.7rem; }
  .hero-photo { min-height: 340px; }
  .section { padding-top: 4rem; padding-bottom: 4rem; }
  .section-sm { padding-top: 2.75rem; padding-bottom: 2.75rem; }
}

/* The primary navigation deliberately follows the reference's institution
   header treatment: information band, white masthead, then one clear menu. */
.nav-sub { display: none; }
.mobile-menu-btn { display: flex; align-items: center; gap: 0.75rem; }
.mobile-drawer { top: 110px; padding: 2rem max(2rem, calc((100vw - 1180px) / 2)); background: rgba(255,255,255,0.99); }
.mobile-drawer .nav-link { max-width: 760px; margin: 0 auto; padding: 1.05rem 0; color: var(--navy); }
.mobile-drawer-group { max-width: 760px; width: 100%; margin-left: auto; margin-right: auto; color: var(--crimson); }
@media (min-width: 1101px) {
  .nav-links { display: flex; }
  .nav-cta { display: inline-flex; }
  .mobile-menu-btn { display: none; }
}

/* Navigation refinements: keep the menu lightweight and text-led. */
@media (min-width: 1101px) {
  .nav-inner { height: 80px; padding: 0 clamp(1.5rem, 3vw, 3rem); gap: 1.5rem; }
  .nav-links { flex: 0 1 auto; padding: 0; gap: 0.35rem; border: 0; border-radius: 0; background: transparent; }
  .nav-link { min-height: 42px; padding: 0.65rem 0.82rem; border-radius: 0; font-size: 0.75rem; letter-spacing: 0.045em; }
  .nav-links .nav-link::after { display: block; }
  .nav-link:hover { background: transparent; color: var(--navy); box-shadow: none; }
  .nav-link.active { background: transparent; color: var(--navy); box-shadow: none; }
  .nav-cta { min-height: 42px; padding: 0.7rem 1.15rem; border-radius: 8px; background: var(--gold); color: var(--navy); box-shadow: 0 3px 10px rgba(139,101,19,0.2); }
  .nav-cta:hover { background: var(--gold-light); }
}

@media (max-width: 1100px) {
  nav { background: rgba(255,255,255,0.98); border-bottom: 2px solid var(--gold); box-shadow: 0 3px 14px rgba(6,45,87,0.08); }
  .nav-inner { height: 68px; padding: 0 1.25rem; gap: 0.75rem; }
  .logo-cross { width: 42px; height: 42px; }
  .mobile-menu-btn { margin-left: auto; gap: 0.65rem; }
  .menu-toggle { width: 44px; height: 44px; border: 0; border-radius: 50%; background: var(--navy); color: white !important; }
  .menu-toggle:hover { background: var(--navy-mid); }
  .mobile-drawer { top: 68px; padding: 1.75rem max(1.25rem, calc((100vw - 720px) / 2)) 2.5rem; background: #FFFFFF; box-shadow: 0 14px 30px rgba(6,45,87,0.14); }
  .mobile-drawer-heading { max-width: 680px; width: 100%; margin: 0 auto 1.75rem; padding-bottom: 1.25rem; border-bottom: 1px solid #DCE5F0; }
  .mobile-drawer-kicker { display: block; margin-bottom: 0.35rem; color: var(--crimson); font-size: 0.66rem; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; }
  .mobile-drawer-heading strong { color: var(--navy); font-family: var(--font-display); font-size: 1.65rem; font-weight: 600; letter-spacing: -0.02em; }
  .mobile-drawer .nav-link { max-width: 680px; min-height: 52px; margin: 0 auto; padding: 0.95rem 0; border: 0; border-bottom: 1px solid #E4EBF2; border-radius: 0; background: transparent; color: var(--navy); font-size: 1rem; font-weight: 700; letter-spacing: 0.01em; box-shadow: none; }
  .mobile-drawer .nav-link:hover { background: transparent; color: var(--crimson); }
  .mobile-drawer .nav-link.active { background: transparent; border-color: #E4EBF2; color: var(--crimson); box-shadow: none; }
  .mobile-drawer-group { margin-top: 1.75rem; margin-bottom: 0.35rem; font-size: 0.66rem; letter-spacing: 0.14em; color: var(--gold-dark); }
  .mobile-drawer-heading + .mobile-drawer-group { margin-top: 0; }
  .mobile-drawer .btn { width: min(100%, 680px); min-height: 50px; margin-left: auto; margin-right: auto; border-radius: 4px; }
  .dark-mode .menu-toggle { background: var(--gold); color: var(--navy) !important; }
  .dark-mode .mobile-drawer { background: #130D1E !important; }
  .dark-mode .mobile-drawer-heading { border-bottom-color: rgba(180,131,39,0.25); }
  .dark-mode .mobile-drawer-heading strong { color: #F7F3FB; }
  .dark-mode .mobile-drawer .nav-link { background: transparent; border-color: rgba(180,131,39,0.16); color: #F7F3FB; }
  .dark-mode .mobile-drawer .nav-link.active { background: transparent; border-color: rgba(180,131,39,0.16); color: var(--gold-light); }
}
@media (max-width: 640px) {
  .nav-inner { padding: 0 1rem; }
  .logo-text { font-size: 1.02rem; }
  .logo-sub { font-size: 0.55rem; }
  .mobile-drawer { padding: 1.4rem 1rem 2rem; }
}

/* Full-width rotating hero: one changing image and one changing message,
   rather than a permanent two-column composition. */
.hero-slider { position: relative; min-height: 680px; padding-top: 110px; overflow: hidden; background: var(--navy); isolation: isolate; }
.hero-slider-image { position: absolute; inset: 0; z-index: -2; background-repeat: no-repeat; background-size: cover; animation: heroImageIn 0.8s ease both; }
.hero-slider-image-backdrop, .hero-slider-image-fit { display: none; }
.hero-slider-overlay { position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgba(3,27,55,0.45) 0%, rgba(3,36,71,0.26) 43%, rgba(3,36,71,0.08) 75%, transparent 100%); }
.hero-slider-content { position: relative; z-index: 1; min-height: 570px; padding: clamp(4rem, 9vw, 8.5rem) max(2rem, calc((100vw - 1280px) / 2)) 3rem; display: flex; flex-direction: column; justify-content: space-between; }
.hero-slider-copy { max-width: 650px; animation: heroCopyIn 0.7s 0.08s ease both; }
.hero-slider-eyebrow { color: var(--gold-light); font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 1.2rem; }
.hero-slider h1 { color: white; font-family: var(--font-display); font-size: clamp(2.85rem, 5vw, 5rem); font-weight: 600; letter-spacing: -0.035em; line-height: 0.98; margin: 0 0 1.35rem; text-shadow: 0 2px 14px rgba(3,27,55,0.55); text-wrap: balance; }
.hero-slider-desc { max-width: 56ch; color: rgba(255,255,255,0.9); font-size: 1.06rem; line-height: 1.75; margin-bottom: 1.6rem; }
.hero-slider blockquote { max-width: 49ch; border-left: 3px solid var(--gold); color: rgba(255,255,255,0.85); font-family: var(--font-display); font-size: 1rem; font-style: italic; line-height: 1.6; margin: 0 0 2rem; padding-left: 1rem; }
.hero-slider blockquote cite { display: block; color: var(--gold-light); font-family: var(--font-mono); font-size: 0.7rem; font-style: normal; font-weight: 700; letter-spacing: 0.08em; margin-top: 0.45rem; }
.hero-slider-detail { max-width: 570px; margin-bottom: 1.6rem; padding: 1.1rem 1.2rem; border: 1px solid rgba(255,255,255,0.28); border-left: 3px solid var(--gold); border-radius: 10px; background: rgba(3,27,55,0.74); box-shadow: 0 10px 26px rgba(0,0,0,0.18); backdrop-filter: blur(6px); }
.hero-slider-detail .hero-slider-desc { margin-bottom: 0.75rem; }
.hero-slider-detail blockquote { margin: 0; }
.hero-slider-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.hero-slider .btn-gold { background: var(--gold); color: var(--navy); }
.hero-slider .btn-gold:hover { background: var(--gold-light); }
.hero-slider .btn-sermon { background: var(--crimson); border-color: var(--crimson); color: white; }
.hero-slider .btn-sermon:hover { background: var(--crimson-hover); border-color: var(--crimson-hover); }
.hero-slider-controls { display: flex; gap: 0.6rem; align-items: center; }
.hero-slider-controls button { width: 35px; height: 4px; border: 0; background: rgba(255,255,255,0.38); cursor: pointer; padding: 0; transition: width 0.2s ease, background 0.2s ease; }
.hero-slider-controls button.active { width: 62px; background: var(--gold); }
@keyframes heroImageIn { from { opacity: 0.55; transform: scale(1.035); } to { opacity: 1; transform: scale(1); } }
@keyframes heroCopyIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

@media (min-width: 641px) {
  .hero-slider-image { background-image: none !important; background-color: var(--navy); }
  .hero-slider-image-backdrop { display: none; }
  .hero-slider-image-fit { display: block; position: absolute; inset: 0; background-repeat: no-repeat; background-position: center; background-size: contain; }
  .hero-slider-overlay { background: linear-gradient(180deg, rgba(3,27,55,0.14), transparent 45%, rgba(3,27,55,0.1)); }
}

@media (max-width: 1100px) {
  .mobile-drawer { top: 70px; padding: 1.5rem 2rem 5rem; }
  .hero-slider { min-height: 650px; padding-top: 70px; }
  .hero-slider-content { min-height: 580px; padding: 6rem 1.5rem 3rem; }
}
@media (max-width: 640px) {
  .mobile-drawer { padding: 1.5rem 1.25rem 5rem; }
  .hero-slider { min-height: 710px; }
  .hero-slider-overlay { background: linear-gradient(180deg, rgba(3,27,55,0.5) 0%, rgba(3,36,71,0.12) 58%, rgba(3,27,55,0.46) 100%); }
  .hero-slider-content { min-height: 640px; padding: 4.5rem 1.25rem 2rem; }
  .hero-slider h1 { font-size: clamp(2.45rem, 11vw, 3.25rem); }
  .hero-slider-detail { max-width: 330px; margin-bottom: 1.6rem; padding: 0.9rem 1rem; border: 1px solid rgba(255,255,255,0.28); border-left: 3px solid var(--gold); border-radius: 10px; background: rgba(3,27,55,0.78); box-shadow: 0 10px 26px rgba(0,0,0,0.18); backdrop-filter: blur(6px); }
  .hero-slider-detail .hero-slider-desc { font-size: 0.8rem; line-height: 1.5; margin-bottom: 0.7rem; }
  .hero-slider-detail blockquote { font-size: 0.74rem; line-height: 1.45; margin: 0; padding-left: 0.7rem; }
  .hero-slider-detail blockquote cite { font-size: 0.58rem; margin-top: 0.3rem; }
  .hero-slider-actions { display: grid; grid-template-columns: 1fr; }
  .hero-slider-actions .btn { width: 100%; }
}

`;

const TEAM = [
    { initials: "RW", name: "Rev. Ruth Wambui", role: "Youths Patron", bio: "Providing spiritual oversight and pastoral covering for the youth ministry, walking alongside every member's journey of faith." },
    { initials: "RM", name: "Roykeen Mwenda", role: "Youths Chairman", bio: "Leading the youth ministry with vision and integrity, coordinating programmes and rallying the team around a shared mission." },
    { initials: "EM", name: "Emmanuel Makokha", role: "Youths Vice Chairman", bio: "Supporting the Chairman in leadership, stepping in to guide ministry activities and look after member welfare." },
    { initials: "AF", name: "Abby Faith", role: "Secretary", bio: "Keeping the ministry organized — records, communication, and coordination across every youth programme." },
    { initials: "JF", name: "Joy Favour", role: "Treasurer", bio: "Faithfully stewarding the ministry's resources with transparency and accountability." },
    { initials: "SG", name: "Stephen Gitau", role: "ICT Contact Person", bio: "First point of contact for the ICT Ministry, coordinating media, sound, and livestream needs." },
    { initials: "SM", name: "Sharon Mirie", role: "Care Ministry Contact Person", bio: "First point of contact for the Care Ministry, connecting members to support and practical care." },
    { initials: "BK", name: "Bridget Karani", role: "Ushering Ministry Contact Person", bio: "First point of contact for the Ushering Ministry, coordinating welcome and order during services." },
    { initials: "AW", name: "Alex Winner", role: "Pastoral Ministry Contact Person", bio: "First point of contact for the Pastoral Ministry, connecting members to spiritual guidance and discipleship." },
    { initials: "AM", name: "Agostino Muchangi", role: "Care Ministry Contact Person", bio: "First point of contact for the Care Ministry, connecting members to support and practical care." },
    { initials: "DI", name: "Debby Irene", role: "Intercessory Ministry Contact Person", bio: "First point of contact for the Intercessory Ministry, coordinating prayer support for the church family." },
    { initials: "BK", name: "Brian Kimani", role: "Creative Generation Ministry Contact Person", bio: "First point of contact for the Creative Generation Ministry, coordinating its creative expression and activities." },
    { initials: "RM", name: "Rozzie Muthoni", role: "Praise and Worship Contact Person", bio: "First point of contact for the Praise & Worship Ministry, coordinating rehearsals and worship needs." },
];

const MINISTRIES = [
    { icon: "💻", color: "rgba(14,32,68,0.08)", title: "ICT Ministry", desc: "Powering the church's digital presence — livestreaming services, managing sound and media systems, and equipping members with practical ICT skills." },
    { icon: "🎶", color: "rgba(201,168,76,0.12)", title: "Praise & Worship Ministry", desc: "Leading the congregation into God's presence through anointed singing, instrumentation, and prayerful worship in every service." },
    { icon: "❤️", color: "rgba(224,115,48,0.1)", title: "Care Ministry", desc: "Walking alongside members through life's seasons — hospital visits, bereavement support, and practical care for those in need." },
    { icon: "🚪", color: "rgba(14,32,68,0.08)", title: "Ushering Ministry", desc: "Warmly welcoming every visitor and member, maintaining order during services, and ensuring worship flows smoothly from start to finish." },
    { icon: "🙏", color: "rgba(201,168,76,0.1)", title: "Intercessory Ministry", desc: "Standing in the gap through dedicated prayer — covering the church, its leadership, and the community in intercession." },
    { icon: "🎨", color: "rgba(224,115,48,0.08)", title: "Creative Ministry", desc: "Expressing faith through art, drama, dance, and design — bringing creativity and beauty into worship and church communication." },
    { icon: "🛍️", color: "rgba(201,168,76,0.12)", title: "Merchandise Ministry", desc: "Creating and coordinating ministry merchandise that strengthens our shared identity, supports outreach, and helps carry the message beyond our gatherings." },
    { icon: "📖", color: "rgba(14,32,68,0.1)", title: "Pastoral Ministry", desc: "Providing spiritual oversight, discipleship, teaching, and pastoral guidance to nurture the whole church family in Christ." },
];

const URGENT_THRESHOLD_DAYS = 7;

// Loads admin-managed events from Firebase, sorted soonest-first with an "urgent" flag
// (within URGENT_THRESHOLD_DAYS) computed fresh on every render.
function useEvents() {
    const { data } = useFirebaseCollection("events");
    return useMemo(() => {
        const list = data || [];
        return list
            .map(e => {
                const date = eventDateOf(e);
                if (!date) return null;
                const daysUntil = Math.ceil((date - new Date()) / 86400000);
                return { ...e, date, urgent: daysUntil >= 0 && daysUntil <= URGENT_THRESHOLD_DAYS };
            })
            .filter(Boolean)
            .sort((a, b) => a.date - b.date);
    }, [data]);
}


function useCountdown(targetDate) {
    const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false });
    useEffect(() => {
        const tick = () => {
            const diff = new Date(targetDate) - new Date();
            if (diff <= 0) { setTime({ d: 0, h: 0, m: 0, s: 0, expired: true }); return; }
            setTime({
                d: Math.floor(diff / 86400000),
                h: Math.floor((diff % 86400000) / 3600000),
                m: Math.floor((diff % 3600000) / 60000),
                s: Math.floor((diff % 60000) / 1000),
                expired: false,
            });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetDate]);
    return time;
}

function SocialIcon({ name, size = 18 }) {
    const stroke = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
    const fill = { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor" };
    switch (name) {
        case "facebook":
            return <svg {...fill}><path d="M22 12.06C22 6.5 17.5 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" /></svg>;
        case "instagram":
            return <svg {...stroke}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" /></svg>;
        case "twitter":
            return <svg {...fill}><path d="M18.9 3h3.3l-7.2 8.2L23.5 21h-6.6l-5.2-6.8L5.7 21H2.4l7.7-8.8L1.5 3h6.8l4.7 6.2L18.9 3Zm-1.2 16h1.8L7.4 4.9H5.5L17.7 19Z" /></svg>;
        case "youtube":
            return <svg {...fill}><rect x="2" y="5" width="20" height="14" rx="4" /><path d="M10 9.3v5.4l4.8-2.7Z" fill="var(--navy)" /></svg>;
        case "whatsapp":
            return <svg {...fill}><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.5 14.3c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.7-1.2-4.5-3.9-4.6-4.1-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 1-2.2.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.7.8 1.9.1.2.1.3 0 .5-.1.2-.2.3-.3.5-.2.2-.3.3-.5.5-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.5 1.5.2.1.4.1.5-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.5.7 1.7.8.2.1.4.2.4.3.1.2.1.6-.1 1.2Z" /></svg>;
        case "pin":
            return <svg {...stroke}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;
        case "phone":
            return <svg {...stroke}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 2.9a2 2 0 0 1-.4 2.1L8 10a16 16 0 0 0 6 6l1.3-1.4a2 2 0 0 1 2.1-.4c.9.4 1.9.6 2.9.7a2 2 0 0 1 1.7 2.1Z" /></svg>;
        case "mail":
            return <svg {...stroke}><rect x="2" y="4" width="20" height="16" rx="3" /><path d="m3 6.5 9 6.5 9-6.5" /></svg>;
        default:
            return null;
    }
}

function useAnimatedCount(end, trigger, instant = false) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!trigger || instant) return;
        let start = 0;
        const step = Math.ceil(end / 60);
        const id = setInterval(() => {
            start = Math.min(start + step, end);
            setVal(start);
            if (start >= end) clearInterval(id);
        }, 25);
        return () => clearInterval(id);
    }, [end, trigger, instant]);
    return trigger && instant ? end : val;
}

function HomeEventCard({ e, navigate }) {
    const [expanded, setExpanded] = useState(false);
    const canExpand = (e.desc || "").length > 130;

    return (
        <div id={slugify(e.title)} className="card event-card home-event-card">
            <div className={`event-date-block${e.urgent ? " urgent" : ""}`}>
                <div className="event-day">{e.day}</div>
                <div className="event-month">{e.month}</div>
            </div>
            <div className="home-event-body">
                <div className="event-title">{e.title}{e.urgent && <span className="event-urgent-badge">Starting Soon</span>}</div>
                <div className="event-meta">📅 {e.time}</div>
                <div className={`event-desc${expanded ? "" : " desc-clamp-3"}`}>{e.desc}</div>
                {canExpand && (
                    <button className="read-more-btn" onClick={() => setExpanded(!expanded)}>
                        {expanded ? "Show Less" : "Read More"} →
                    </button>
                )}
                <button className="btn btn-gold btn-sm" onClick={() => navigate("Events")}>Register Now</button>
            </div>
        </div>
    );
}

function TeamCard({ t }) {
    const [expanded, setExpanded] = useState(false);
    const canExpand = (t.bio || "").length > 130;

    return (
        <div className="card team-card">
            <div className="team-avatar">{t.initials}</div>
            <div className="team-name">{t.name}</div>
            <div className="team-role">{t.role}</div>
            <div className={`team-bio${expanded ? "" : " desc-clamp-3"}`}>{t.bio}</div>
            {canExpand && (
                <button className="read-more-btn" style={{ alignSelf: "center" }} onClick={() => setExpanded(!expanded)}>
                    {expanded ? "Show Less" : "Read More"} →
                </button>
            )}
        </div>
    );
}

export default function App() {
    const [activePage, setActivePage] = useState(() => pageFromPath(window.location.pathname));
    const [dark, setDark] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [joinUsOpen, setJoinUsOpen] = useState(() => window.location.pathname === joinUsRegistrationPath);
    // Without IntersectionObserver, or when the visitor prefers reduced motion,
    // the stats show their final numbers straight away instead of counting up.
    const [statsInstant] = useState(() =>
        typeof window.IntersectionObserver === "undefined" ||
        !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    const [statsVisible, setStatsVisible] = useState(statsInstant);
    const [activeTab, setActiveTab] = useState("Video");
    const [scrolled, setScrolled] = useState(false);
    // Callback ref: attaches the observer whenever the stats section mounts,
    // including when the visitor reaches Home from another page.
    const statsRef = useCallback(node => {
        if (!node || statsVisible) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.4 });
        obs.observe(node);
        return () => obs.disconnect();
    }, [statsVisible]);
    const events = useEvents();
    const nextEvent = events[0] || null;

    const eventTiming = useMemo(() => {
        if (!nextEvent) return null;
        const dayStart = new Date(nextEvent.date.getFullYear(), nextEvent.date.getMonth(), nextEvent.date.getDate(), 0, 0, 0);
        let startDateTime = dayStart;
        if (nextEvent.startTime) {
            const [hh, mm] = nextEvent.startTime.split(":").map(Number);
            if (!Number.isNaN(hh)) {
                startDateTime = new Date(dayStart);
                startDateTime.setHours(hh, mm || 0, 0, 0);
            }
        }
        return { dayStart, startDateTime };
    }, [nextEvent]);

    const countdown = useCountdown(eventTiming?.startDateTime || null);

    let eventPhase = "upcoming";
    if (nextEvent && eventTiming) {
        const now = new Date();
        if (now >= eventTiming.startDateTime) eventPhase = "now";
        else if (now >= eventTiming.dayStart) eventPhase = "starting";
    }

    const stat1 = useAnimatedCount(350, statsVisible, statsInstant);
    const stat2 = useAnimatedCount(7, statsVisible, statsInstant);
    const stat3 = useAnimatedCount(10, statsVisible, statsInstant);
    const stat4 = useAnimatedCount(800, statsVisible, statsInstant);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        if (!mobileMenuOpen) return undefined;
        const onKeyDown = event => {
            if (event.key === "Escape") setMobileMenuOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [mobileMenuOpen]);

    const navigate = (page) => {
        if (window.location.pathname !== pageToPath(page)) window.history.pushState({}, "", pageToPath(page));
        setActivePage(page);
        setMobileMenuOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.requestAnimationFrame(() => document.getElementById("main-content")?.focus());
    };

    const openJoinUs = () => {
        if (window.location.pathname !== joinUsRegistrationPath) window.history.pushState({}, "", joinUsRegistrationPath);
        setActivePage("Home");
        setJoinUsOpen(true);
        setMobileMenuOpen(false);
    };

    const closeJoinUs = () => {
        if (window.location.pathname === joinUsRegistrationPath) window.history.pushState({}, "", pageToPath("Home"));
        setJoinUsOpen(false);
    };

    // Keeps activePage in sync with the browser's back/forward buttons.
    useEffect(() => {
        const onPopState = () => {
            setActivePage(pageFromPath(window.location.pathname));
            setJoinUsOpen(window.location.pathname === joinUsRegistrationPath);
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    // Keeps each client-side route discoverable with its own title, description, canonical URL, and social preview.
    useEffect(() => {
        const seo = PAGE_SEO[activePage] || PAGE_SEO.Home;
        const url = pageUrl(PAGE_SEO[activePage] ? activePage : "Home");
        const setMeta = (selector, content) => document.querySelector(selector)?.setAttribute("content", content);

        document.title = seo.title;
        setMeta('meta[name="description"]', seo.description);
        setMeta('meta[property="og:title"]', seo.title);
        setMeta('meta[property="og:description"]', seo.description);
        setMeta('meta[property="og:url"]', url);
        setMeta('meta[name="twitter:title"]', seo.title);
        setMeta('meta[name="twitter:description"]', seo.description);
        document.querySelector('link[rel="canonical"]')?.setAttribute("href", url);

        // Google Analytics page view, sent after the title above is updated so
        // reports show the right page name (gtag is set up in index.html).
        window.gtag?.("event", "page_view", {
            page_title: seo.title,
            page_location: window.location.href,
            page_path: window.location.pathname,
        });
    }, [activePage]);

    // Publishes upcoming events as schema.org Event data so Google can show them as event results.
    // Fetched over the database's REST endpoint rather than the live connection, because
    // Google's renderer doesn't support WebSockets and never sees realtime data.
    useEffect(() => {
        let cancelled = false;
        const pad = n => String(n).padStart(2, "0");
        const toJsonLd = events => events.map(e => {
            const day = `${e.date.getFullYear()}-${pad(e.date.getMonth() + 1)}-${pad(e.date.getDate())}`;
            return {
                "@type": "Event",
                name: e.title,
                description: e.desc || undefined,
                startDate: /^\d{2}:\d{2}$/.test(e.startTime || "") ? `${day}T${e.startTime}:00+03:00` : day,
                eventStatus: "https://schema.org/EventScheduled",
                eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
                url: `${pageUrl("Events")}#${slugify(e.title)}`,
                image: [`${SITE_URL}/og-image.png`],
                // Events have no venue field and some are held off-site, so only claim the town.
                location: {
                    "@type": "Place",
                    name: "Embu, Kenya",
                    address: { "@type": "PostalAddress", addressLocality: "Embu", addressRegion: "Embu County", addressCountry: "KE" },
                },
                organizer: { "@type": "Organization", name: "ACK St Pauls Youths", url: `${SITE_URL}/` },
            };
        });
        fetch(`${import.meta.env.VITE_FIREBASE_DATABASE_URL}/events.json`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (cancelled || !data) return;
                const upcoming = Object.values(data)
                    .map(e => ({ ...e, date: eventDateOf(e) }))
                    .filter(e => e.date && e.title)
                    .sort((a, b) => a.date - b.date);
                if (!upcoming.length) return;
                const script = document.createElement("script");
                script.type = "application/ld+json";
                script.id = "events-jsonld";
                script.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": toJsonLd(upcoming) });
                document.getElementById("events-jsonld")?.remove();
                document.head.appendChild(script);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);
    const isNavItemActive = item => item.page === activePage || item.activePages?.includes(activePage);

    return (
        <>
            <style>{styles}</style>
            <div className={dark ? "dark-mode" : ""} style={{ minHeight: "100vh" }}>
                {/* ─── NAV ─── */}
                <nav className={scrolled ? "scrolled" : ""}>
                    <div className="nav-utility">
                        <div className="nav-utility-inner">
                            <span>ACK St Paul&apos;s Cathedral · Embu Town, Kenya</span>
                            <div>
                                <a href="mailto:ictcathedral2@gmail.com">ictcathedral2@gmail.com</a>
                                <span className="nav-utility-dot">•</span>
                                <button onClick={() => navigate("Connect")}>Plan your visit</button>
                            </div>
                        </div>
                    </div>
                    <div className="nav-inner">
                        <button className="nav-logo" onClick={() => navigate("Home")} aria-label="ACK St Pauls Youths home">
                            <div className="logo-cross"><img src={logo} alt="ACK St Pauls Cathedral crest" /></div>
                            <div>
                                <div className="logo-text">ACK St Pauls</div>
                                <div className="logo-sub">Youths</div>
                            </div>
                        </button>
                        <div className="nav-links">
                            {NAV_MENU.map(item => (
                                <button key={item.label} className={`nav-link${isNavItemActive(item) ? " active" : ""}`} onClick={() => navigate(item.page)}>{item.label}</button>
                            ))}
                        </div>
                        <div className="nav-actions">
                            <button className="nav-cta" onClick={openJoinUs}>Join Us</button>
                        </div>
                        <div className="mobile-menu-btn">
                            <button className={`theme-toggle${dark ? " dark" : ""}`} onClick={() => setDark(!dark)} aria-label="Toggle dark mode">
                                <div className="toggle-thumb" />
                            </button>
                            <button className="menu-toggle" style={{ fontSize: "1.4rem", color: dark ? "#EFEAF5" : "var(--navy)" }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation">
                                {mobileMenuOpen ? "✕" : "☰"}
                            </button>
                        </div>
                    </div>
                    {/* Utility strip: service details, secondary pages, theme */}
                    <div className="nav-sub">
                        <div className="nav-sub-inner">
                            <p className="nav-sub-info">
                                <strong>ACK St Paul&apos;s Cathedral</strong> · Embu Town · Sundays <span className="tabular">08:00</span>, <span className="tabular">08:30</span> &amp; <span className="tabular">11:00</span> AM
                            </p>
                            <div className="nav-sub-links">
                                {UTILITY_LINKS.map(page => (
                                    <button key={page} className={`nav-sub-link${activePage === page ? " active" : ""}`} onClick={() => navigate(page)}>{page}</button>
                                ))}
                                <button
                                    className={`theme-toggle${dark ? " dark" : ""}`}
                                    onClick={() => setDark(!dark)}
                                    aria-label="Toggle dark mode"
                                    title={dark ? "Light mode" : "Dark mode"}
                                >
                                    <div className="toggle-thumb" />
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* ─── MOBILE DRAWER ─── */}
                <div id="mobile-navigation" className={`mobile-drawer${mobileMenuOpen ? " open" : ""}`} aria-hidden={!mobileMenuOpen}>
                    <div className="mobile-drawer-heading">
                        <span className="mobile-drawer-kicker">ACK St Paul's Cathedral</span>
                        <strong>Explore the youth community</strong>
                    </div>
                    <div className="mobile-drawer-group">Main</div>
                    {NAV_MENU.map(item => (
                        <button key={item.label} className={`nav-link${isNavItemActive(item) ? " active" : ""}`} onClick={() => navigate(item.page)}>{item.label}</button>
                    ))}
                    <div className="mobile-drawer-group">More</div>
                    {UTILITY_LINKS.map(page => (
                        <button key={page} className={`nav-link${activePage === page ? " active" : ""}`} onClick={() => navigate(page)}>{page}</button>
                    ))}
                    <button className="btn btn-gold" style={{ marginTop: "1.25rem" }} onClick={() => { setMobileMenuOpen(false); openJoinUs(); }}>Join Us</button>
                </div>

                {/* ─── PAGES ─── */}
                <main id="main-content" className="app-content" tabIndex={-1}>
                    {activePage === "Home" && <HomePage countdown={countdown} nextEvent={nextEvent} eventPhase={eventPhase} events={events} navigate={navigate} statsRef={statsRef} stat1={stat1} stat2={stat2} stat3={stat3} stat4={stat4} dark={dark} onJoinUs={openJoinUs} />}
                    {activePage === "About" && <AboutPage navigate={navigate} dark={dark} />}
                    {activePage === "Mobile App" && <MobileAppPage navigate={navigate} />}
                    {activePage === "Ministries" && <MinistriesPage navigate={navigate} dark={dark} />}
                    {activePage === "Sermons" && <SermonsPage navigate={navigate} dark={dark} activeTab={activeTab} setActiveTab={setActiveTab} />}
                    {activePage === "Recorded Sermons" && <SermonsPage activeTab="Video" setActiveTab={() => {}} showTabs={false} />}
                    {activePage === "Written Sermons" && <SermonsPage activeTab="Written" setActiveTab={() => {}} showTabs={false} />}
                    {activePage === "Liturgy" && <LiturgyPage />}
                    {activePage === "Gallery" && <SermonsPage activeTab="Gallery" setActiveTab={() => {}} showTabs={false} />}
                    {activePage === "Events" && <EventsPage events={events} navigate={navigate} dark={dark} />}
                    {activePage === "Connect" && <ConnectPage navigate={navigate} dark={dark} />}
                    {activePage === "Give" && <GivePage dark={dark} />}
                    {activePage === "Community" && <CommunityPage dark={dark} />}
                    {activePage === "Business Directory" && <CommunityPage initialTab="Business" showTabs={false} />}
                    {activePage === "Requests" && <CommunityPage initialTab="Wanted" showTabs={false} />}
                    {activePage === "Job Board" && <CommunityPage initialTab="Jobs" showTabs={false} />}
                    {activePage === "Job Seekers" && <CommunityPage initialTab="JobSeekers" showTabs={false} />}
                    {activePage === "Testimonies" && <TestimoniesPage navigate={navigate} dark={dark} />}
                </main>

                {/* ─── FOOTER ─── */}
                <footer className="footer">
                    <div className="footer-grid">
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                <div className="logo-cross"><img src={logo} alt="ACK St Pauls Cathedral crest" /></div>
                                <div>
                                    <div className="footer-brand-name">ACK St Pauls Youths</div>
                                    <div className="footer-brand-sub">ACK St Paul's Cathedral, Embu</div>
                                </div>
                            </div>
                            <div className="footer-desc">The youth church of ACK St Paul's Cathedral, Embu (Anglican Church of Kenya): faith-filled young people growing together in Christ and serving Embu and beyond.</div>
                            <div className="footer-verse">
                                "Don't let anyone look down on you because you are young, but set an example in speech, conduct, love, faith, and purity."
                                <cite>— 1 Timothy 4:12</cite>
                            </div>
                            <div className="footer-socials">
                                {["facebook", "youtube", "whatsapp"].map(s => <div key={s} className="social-btn"><SocialIcon name={s} /></div>)}
                            </div>
                        </div>
                        <div>
                            <div className="footer-col-title">Quick Links</div>
                            {NAV_LINKS.map(l => <a key={l} className="footer-link" href={pageToPath(l)} onClick={e => { e.preventDefault(); navigate(l); }}>{l}</a>)}
                        </div>
                        <div>
                            <div className="footer-col-title">Service Times</div>
                            <div className="footer-link">Devotion · 8:00 AM</div>
                            <div className="footer-link">Youth Service · 8:30 AM</div>
                            <div className="footer-link">Bible Study · 11:00 AM</div>
                        </div>
                        <div>
                            <div className="footer-col-title">Contact</div>
                            <div className="footer-contact-row">
                                <div className="footer-contact-icon"><SocialIcon name="pin" size={16} /></div>
                                <div className="footer-contact-text">ACK St Paul's Cathedral, Embu Town, Kenya</div>
                            </div>
                            <a className="footer-contact-row" href="mailto:ictcathedral2@gmail.com">
                                <div className="footer-contact-icon"><SocialIcon name="mail" size={16} /></div>
                                <div className="footer-contact-text">ictcathedral2@gmail.com</div>
                            </a>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <span>© 2026 ACK St Pauls Youths. All rights reserved.</span>
                        <span>Built with ♥ for God's Glory · Embu, Kenya</span>
                    </div>
                </footer>

                <SupportWidget />

                <AppInstallPrompt activePage={activePage} navigate={navigate} />

                <JoinUsModal open={joinUsOpen} onClose={closeJoinUs} />
            </div>
        </>
    );
}

function JoinUsModal({ open, onClose }) {
    const registration = useFormSubmit(
        "joinUsRegistrations",
        { firstName: "", lastName: "", phone: "", area: "", gender: "Male" },
        ["firstName", "lastName", "phone", "area"]
    );

    if (!open) return null;

    const handleClose = () => {
        registration.reset();
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <button className="modal-close" onClick={handleClose} aria-label="Close">✕</button>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 700, lineHeight: 1 }}>Join Us</div>
                    <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Tell us a bit about yourself and we'll get you connected.</div>
                </div>
                <div className="modal-body">
                    {registration.submitted ? (
                        <p style={{ textAlign: "center", color: "var(--navy)", fontWeight: 600, padding: "1rem 0" }}>
                            ✓ Welcome to the family! We're excited to connect with you soon.
                        </p>
                    ) : (
                        <>
                            <div className="grid-2" style={{ gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <input className="form-input" placeholder="First name" value={registration.formData.firstName} onChange={e => registration.setField("firstName", e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input className="form-input" placeholder="Last name" value={registration.formData.lastName} onChange={e => registration.setField("lastName", e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input className="form-input" type="tel" inputMode="numeric" maxLength={10} placeholder="07XXXXXXXX or 01XXXXXXXX" value={registration.formData.phone} onChange={e => registration.setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Area (Where You Come From)</label>
                                <input className="form-input" placeholder="e.g. Kyeni, Embu" value={registration.formData.area} onChange={e => registration.setField("area", e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Gender</label>
                                <select className="form-select" value={registration.formData.gender} onChange={e => registration.setField("gender", e.target.value)}>
                                    <option>Male</option>
                                    <option>Female</option>
                                </select>
                            </div>
                            {registration.error && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{registration.error}</p>}
                            <button
                                className="btn btn-gold"
                                style={{ width: "100%", justifyContent: "center" }}
                                disabled={registration.submitting}
                                onClick={() => registration.handleSubmit()}
                            >
                                {registration.submitting ? "Submitting..." : "Complete Registration →"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function MinistryJoinModal({ ministryTitle, onClose }) {
    const registration = useFormSubmit(
        "ministryRegistrations",
        { firstName: "", lastName: "", phone: "", ministryTitle: ministryTitle || "" },
        ["firstName", "lastName", "phone"]
    );

    if (!ministryTitle) return null;

    const handleClose = () => {
        registration.reset();
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <button className="modal-close" onClick={handleClose} aria-label="Close">✕</button>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 700, lineHeight: 1 }}>Join {ministryTitle}</div>
                    <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Tell us a bit about yourself and we'll get you plugged in.</div>
                </div>
                <div className="modal-body">
                    {registration.submitted ? (
                        <p style={{ textAlign: "center", color: "var(--navy)", fontWeight: 600, padding: "1rem 0" }}>
                            ✓ You're on the list! A ministry leader will reach out to you soon.
                        </p>
                    ) : (
                        <>
                            <div className="grid-2" style={{ gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <input className="form-input" placeholder="First name" value={registration.formData.firstName} onChange={e => registration.setField("firstName", e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input className="form-input" placeholder="Last name" value={registration.formData.lastName} onChange={e => registration.setField("lastName", e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input className="form-input" type="tel" inputMode="numeric" maxLength={10} placeholder="07XXXXXXXX or 01XXXXXXXX" value={registration.formData.phone} onChange={e => registration.setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                            </div>
                            {registration.error && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{registration.error}</p>}
                            <button
                                className="btn btn-gold"
                                style={{ width: "100%", justifyContent: "center" }}
                                disabled={registration.submitting}
                                onClick={() => registration.handleSubmit()}
                            >
                                {registration.submitting ? "Submitting..." : "Complete Registration →"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Auto-rotating carousel of admin-uploaded event posters / after-event photos.
// Crossfades to the next item every 5 seconds, swapping the image once it's
// fully faded out so the transition reads as a slow, smooth dissolve.
function PosterCarousel() {
    const { data, loading } = useFirebaseCollection("gallery");
    const items = useMemo(() => (data || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), [data]);
    const [index, setIndex] = useState(0);
    const [flipping, setFlipping] = useState(false);
    const [expandedPoster, setExpandedPoster] = useState(null);
    const timerRef = useRef(null);

    const advance = () => {
        setFlipping(true);
        setTimeout(() => {
            setIndex(i => (i + 1) % items.length);
            setFlipping(false);
        }, 900);
    };

    const restartTimer = () => {
        clearInterval(timerRef.current);
        if (items.length < 2) return;
        timerRef.current = setInterval(advance, 5000);
    };

    useEffect(() => {
        restartTimer();
        return () => clearInterval(timerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items.length]);

    useEffect(() => {
        if (!expandedPoster) return undefined;
        const closeOnEscape = event => {
            if (event.key === "Escape") setExpandedPoster(null);
        };
        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [expandedPoster]);

    const handleNextClick = () => {
        advance();
        restartTimer();
    };

    if (loading) {
        return <div className="poster-empty poster-loading" />;
    }

    if (!items.length) {
        return (
            <div className="poster-empty">
                <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--gold-light)", fontWeight: 700 }}>Gallery</div>
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.82rem", marginTop: 8 }}>Event posters and photos will appear here.</div>
            </div>
        );
    }

    const current = items[index % items.length];
    return (
        <>
            <div className="poster-frame">
                <div className={`poster-flip${flipping ? " flipping" : ""}`}>
                    <img className="poster-image" src={current.imageData} alt={current.caption || "Event poster"} />
                    <button className="poster-open-btn" onClick={() => setExpandedPoster(current)} aria-label={`Open ${current.caption || "event poster"} in full view`} />
                    {current.caption && <div className="poster-caption">{current.caption}</div>}
                    {items.length > 1 && (
                        <button className="poster-next-btn" onClick={handleNextClick} aria-label="Next poster">›</button>
                    )}
                </div>
                {items.length > 1 && (
                    <div className="poster-dots">
                        {items.map((item, i) => <div key={item.id} className={`poster-dot${i === index ? " active" : ""}`} />)}
                    </div>
                )}
            </div>
            {expandedPoster && (
                <div className="poster-viewer-overlay" role="presentation" onClick={() => setExpandedPoster(null)}>
                    <div className="poster-viewer" role="dialog" aria-modal="true" aria-label={expandedPoster.caption || "Full event poster"} onClick={event => event.stopPropagation()}>
                        <button className="poster-viewer-close" onClick={() => setExpandedPoster(null)} aria-label="Close poster viewer">×</button>
                        <img className="poster-viewer-image" src={expandedPoster.imageData} alt={expandedPoster.caption || "Event poster"} />
                        {expandedPoster.caption && <div className="poster-viewer-caption">{expandedPoster.caption}</div>}
                    </div>
                </div>
            )}
        </>
    );
}

const APP_FEATURES = [
    { title: "Notifications", desc: "Coming in the next update: alerts when a new event, sermon or photo goes up, and you choose what you hear about." },
    { title: "Events in your pocket", desc: "See what's coming up with a live countdown, and register for events in a couple of taps." },
    { title: "Sermons on the go", desc: "Watch recorded services and read written sermons wherever you are." },
    { title: "Community board", desc: "Browse the business directory, job board, job seekers and requests from fellow youths." },
    { title: "Help when you need it", desc: "Chat with the team for prayer, pastoral care or any question, right from the app." },
    { title: "Give and testify", desc: "Support the ministry, and share or read testimonies of what God is doing among us." },
];

// Shows "Coming soon" until APK_AVAILABLE is switched on in appDownload.js.
function AppDownloadButton({ onLight = false, onClick }) {
    if (!APK_AVAILABLE) {
        return (
            <span className={`app-download-btn disabled${onLight ? " on-light" : ""}`} aria-disabled="true">
                <span><small>Android app</small><strong>Coming soon</strong></span>
            </span>
        );
    }
    return (
        <a className="app-download-btn" href={APK_URL} download={APK_FILE_NAME} rel="noopener" onClick={onClick}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.6 9.48l1.84-3.18a.38.38 0 0 0-.66-.38l-1.86 3.22a11.4 11.4 0 0 0-9.84 0L5.22 5.92a.38.38 0 0 0-.66.38L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
            </svg>
            <span><small>Download for Android</small><strong>Get the app · v{APP_VERSION}</strong></span>
        </a>
    );
}

const APP_PROMPT_KEY = "appPromptShown";

// "android", "ios", "app" (inside an Android WebView or a home-screen app) or "desktop".
function detectDevice() {
    const ua = navigator.userAgent || "";
    if (/; wv\)/.test(ua) || window.matchMedia?.("(display-mode: standalone)").matches) return "app";
    if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
    if (/Android/i.test(ua)) return "android";
    return "desktop";
}

// Offer the APK only where it is useful. Showing an Android download prompt on
// desktop obscures the first action a new visitor is trying to take.
function AppInstallPrompt({ activePage, navigate }) {
    const [open, setOpen] = useState(false);
    const [device] = useState(detectDevice);
    const shownRef = useRef(false);
    const dialogRef = useRef(null);
    const closeRef = useRef(null);
    const suppressed = !APK_AVAILABLE || device === "desktop" || device === "ios" || device === "app" || activePage === "Mobile App";

    useEffect(() => {
        if (suppressed || shownRef.current) return;
        try { if (sessionStorage.getItem(APP_PROMPT_KEY)) return; } catch { /* storage blocked: fall back to shownRef */ }
        const id = setTimeout(() => {
            shownRef.current = true;
            try { sessionStorage.setItem(APP_PROMPT_KEY, "1"); } catch { /* ignore */ }
            setOpen(true);
            window.gtag?.("event", "app_prompt_shown", { device });
        }, 12000);
        return () => clearTimeout(id);
    }, [suppressed, device]);

    const dismiss = useCallback(() => {
        setOpen(false);
        window.gtag?.("event", "app_prompt_dismissed", { device });
    }, [device]);

    useEffect(() => {
        if (!open || suppressed) return;
        const previous = document.activeElement;
        const dialog = dialogRef.current;
        closeRef.current?.focus({ preventScroll: true });
        const onKey = e => { if (e.key === "Escape") dismiss(); };
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            // Hand focus back only if it was still in the prompt (it falls to <body> once the prompt unmounts).
            const active = document.activeElement;
            if (previous instanceof HTMLElement && previous !== document.body && (!active || active === document.body || dialog?.contains(active))) {
                previous.focus({ preventScroll: true });
            }
        };
    }, [open, suppressed, dismiss]);

    if (!open || suppressed) return null;

    const goToAppPage = e => {
        e.preventDefault();
        setOpen(false);
        navigate("Mobile App");
    };

    return (
        <div className="app-prompt" role="dialog" aria-labelledby="app-prompt-title" aria-describedby="app-prompt-desc" ref={dialogRef}>
            <button type="button" className="app-prompt-close" aria-label="Close app download prompt" onClick={dismiss} ref={closeRef}>×</button>
            <div className="app-prompt-head">
                <img src={logo} alt="" />
                <div>
                    <h2 id="app-prompt-title">Get the ACK St Pauls Youths app</h2>
                    <div className="app-prompt-meta">Version {APP_VERSION} · Free · Android 7.0+</div>
                </div>
            </div>
            <p id="app-prompt-desc">Events, sermons, the community board, giving and live help, all in one app on your phone.</p>
            {device === "android" ? (
                <div className="app-prompt-actions">
                    <AppDownloadButton onClick={() => {
                        window.gtag?.("event", "app_prompt_download", { device });
                        setOpen(false);
                    }} />
                    <a className="app-prompt-link" href={pageToPath("Mobile App")} onClick={goToAppPage}>How to install</a>
                </div>
            ) : (
                <>
                    <p className="app-prompt-hint">Open <strong>ackstpaulsyouths.com/app</strong> on your Android phone to download it.</p>
                    <div className="app-prompt-actions">
                        <a className="btn btn-gold btn-sm" href={pageToPath("Mobile App")} onClick={goToAppPage}>See the app</a>
                    </div>
                </>
            )}
        </div>
    );
}

function AppPhoneMock() {
    return (
        <div className="app-phone" aria-hidden="true">
            <div className="app-phone-screen">
                <div className="app-phone-top">
                    <img src={logo} alt="" />
                    <div><b>ACK St Pauls</b><span>Youths</span></div>
                </div>
                <div className="app-phone-body">
                    <div className="app-phone-card gold"><i /><i /><i style={{ width: "70%" }} /></div>
                    <div className="app-phone-card"><i /><i style={{ width: "85%" }} /></div>
                    <div className="app-phone-card"><i /><i /><i style={{ width: "50%" }} /></div>
                    <div className="app-phone-card"><i /><i style={{ width: "65%" }} /></div>
                </div>
                <div className="app-phone-tabs"><i /><i /><i /><i /><i /></div>
            </div>
        </div>
    );
}

// Home page banner pointing to the Mobile App page.
function AppPromoSection({ navigate }) {
    return (
        <div className="section section-navy">
            <div className="container app-promo">
                <div>
                    <div className="overline">Mobile App</div>
                    <h2 className="section-title white">Take ACK St Pauls Youths with you</h2>
                    <p className="section-desc white">
                        Events, sermons, the community board, giving and live help, all in one free app.
                    </p>
                    <div className="app-download-row">
                        <AppDownloadButton />
                        <a className="btn btn-outline" href={pageToPath("Mobile App")} onClick={e => { e.preventDefault(); navigate("Mobile App"); }}>
                            {APK_AVAILABLE ? "How to install →" : "Learn more →"}
                        </a>
                    </div>
                    <div className="app-badges"><span>Free</span><span>Android</span><span>No account needed</span></div>
                </div>
                <AppPhoneMock />
            </div>
        </div>
    );
}

function MobileAppPage({ navigate }) {
    return (
        <>
            <div className="section section-navy below-bar">
                <div className="container app-promo">
                    <div>
                        <div className="overline">Mobile App</div>
                        <h1 className="section-title white" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>The ACK St Pauls Youths app</h1>
                        <p className="section-desc white">
                            Everything on this website, on your phone: events, sermons, the community board, giving and live help.
                        </p>
                        <div className="app-download-row"><AppDownloadButton /></div>
                        <div className="app-badges"><span>Free</span><span>Android 7.0 or newer</span><span>Version {APP_VERSION}</span></div>
                    </div>
                    <AppPhoneMock />
                </div>
            </div>

            <div className="section section-cream">
                <div className="container">
                    <div className="section-header">
                        <div className="overline">What's Inside</div>
                        <h2 className="section-title">Built for our youth community</h2>
                    </div>
                    <div className="app-features">
                        {APP_FEATURES.map(f => (
                            <div key={f.title} className="card app-feature">
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="section section-light">
                <div className="container">
                    <div className="section-header">
                        <div className="overline">Installing on Android</div>
                        <h2 className="section-title">Install in four steps</h2>
                        <p className="section-desc">The app isn't on the Play Store yet, so you install it straight from this website. The file comes from our own official release page.</p>
                    </div>
                    <div className="app-steps">
                        <div className="card app-step"><div><h3>Download the app</h3><p>Open this page on your Android phone and tap “Download for Android”. If your browser warns about the file type, choose “Download anyway”.</p></div></div>
                        <div className="card app-step"><div><h3>Open the file</h3><p>When the download finishes, tap the notification, or open your Files or Downloads app and tap <strong>{APK_FILE_NAME}</strong>.</p></div></div>
                        <div className="card app-step"><div><h3>Allow the install</h3><p>Android may say your browser isn't allowed to install apps. Tap <strong>Settings</strong>, turn on <strong>Allow from this source</strong>, then go back.</p></div></div>
                        <div className="card app-step"><div><h3>Install and open</h3><p>Tap <strong>Install</strong>, then <strong>Open</strong>. If it asks to send notifications, tap <strong>Allow</strong> so you're ready when they arrive in an update.</p></div></div>
                    </div>
                    <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
                        <AppDownloadButton onLight />
                        <p className="section-desc" style={{ marginTop: "1.5rem", fontSize: "0.92rem" }}>
                            On an iPhone? The app isn't available for iOS yet, but this website works fully on iPhone. In Safari, tap Share, then <strong>Add to Home Screen</strong> to keep it one tap away.
                            {" "}Need help installing? <a href={pageToPath("Connect")} onClick={e => { e.preventDefault(); navigate("Connect"); }} style={{ color: "var(--gold-dark)", fontWeight: 600 }}>Contact us</a>.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

function HomePage({ countdown, nextEvent, eventPhase, events, navigate, statsRef, stat1, stat2, stat3, stat4, onJoinUs }) {
    const newsletter = useFormSubmit("newsletterSignups", { email: "" }, ["email"]);
    const { videos, loading: videosLoading } = useYouTubeVideos();
    const { data: galleryData } = useFirebaseCollection("sermonGallery");
    const [activeVideo, setActiveVideo] = useState(null);
    const latestVideo = videos.length > 0 ? videos[videos.length - 1] : null;
    const galleryImages = (galleryData || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const heroImage = galleryImages[0]?.imageData || heroService;
    const secondaryHeroImage = galleryImages[1]?.imageData || youthFellowship;
    const thirdHeroImage = galleryImages[2]?.imageData || heroService;
    const fourthHeroImage = galleryImages[3]?.imageData || youthFellowship;
    const fifthHeroImage = galleryImages[4]?.imageData || heroService;
    const heroSlides = useMemo(() => [
        {
            eyebrow: "ACK St Paul's Cathedral · Embu",
            title: "Where youth encounter God and change the world",
            desc: "A generation rising in faith, purpose and power. Find a community where you can grow, serve, and become all God has called you to be.",
            verse: "Don't let anyone look down on you because you are young, but set an example in speech, conduct, love, faith, and purity.",
            cite: "1 Timothy 4:12",
            image: heroImage,
            position: "center 35%",
        },
        {
            eyebrow: "Every Sunday",
            title: "Worship together. Grow deeper. Live with purpose.",
            desc: "From joyful worship to honest conversations and Bible study, there is a place for you in our church family.",
            verse: "For where two or three gather in my name, there am I with them.",
            cite: "Matthew 18:20",
            image: secondaryHeroImage,
            position: "center 45%",
        },
        {
            eyebrow: "Faith in action",
            title: "Youths serving with joy and purpose.",
            desc: "From worship and hospitality to outreach and practical care, we use our gifts to strengthen the church and bless our city.",
            verse: "Each of you should use whatever gift you have received to serve others, as faithful stewards of God's grace.",
            cite: "1 Peter 4:10",
            image: thirdHeroImage,
            position: "center 35%",
        },
        {
            eyebrow: "Serving our community",
            title: "Hands ready to make a difference.",
            desc: "We step beyond the church walls to share Christ's love through kindness, service, and hope wherever there is a need.",
            verse: "Do not forget to do good and to share with others, for with such sacrifices God is pleased.",
            cite: "Hebrews 13:16",
            image: fourthHeroImage,
            position: "center 40%",
        },
        {
            eyebrow: "Serving one another",
            title: "Growing strong by lifting each other up.",
            desc: "In every gathering, project, and prayer, our youths encourage one another to lead, serve, and live out their faith.",
            verse: "Serve one another humbly in love.",
            cite: "Galatians 5:13",
            image: fifthHeroImage,
            position: "center 35%",
        },
    ], [heroImage, secondaryHeroImage, thirdHeroImage, fourthHeroImage, fifthHeroImage]);
    const [activeHeroSlide, setActiveHeroSlide] = useState(0);

    useEffect(() => {
        const id = window.setInterval(() => setActiveHeroSlide(current => (current + 1) % heroSlides.length), 6500);
        return () => window.clearInterval(id);
    }, [heroSlides.length]);

    const activeHero = heroSlides[activeHeroSlide];

    const handleNewsletterSubmit = () => {
        if (!validateEmail(newsletter.formData.email)) return;
        newsletter.handleSubmit({ source: "home" });
    };

    return (
        <>
            {/* HERO — a full-width rotating feature, inspired by the reference site's changing campus slides. */}
            <section className="hero-slider" aria-label="Welcome highlights">
                <div key={activeHeroSlide} className="hero-slider-image" style={{ backgroundImage: `url(${activeHero.image})`, backgroundPosition: activeHero.position }}>
                    <div className="hero-slider-image-backdrop" style={{ backgroundImage: `url(${activeHero.image})` }} />
                    <div className="hero-slider-image-fit" style={{ backgroundImage: `url(${activeHero.image})`, backgroundPosition: activeHero.position }} />
                </div>
                <div className="hero-slider-overlay" />
                <div className="container hero-slider-content">
                    <div key={`copy-${activeHeroSlide}`} className="hero-slider-copy">
                        <p className="hero-slider-eyebrow">{activeHero.eyebrow}</p>
                        <h1>{activeHero.title}</h1>
                        <div className="hero-slider-detail">
                            <p className="hero-slider-desc">{activeHero.desc}</p>
                            <blockquote>
                                “{activeHero.verse}”
                                <cite>{activeHero.cite}</cite>
                            </blockquote>
                        </div>
                        <div className="hero-slider-actions">
                            <button className="btn btn-gold" onClick={onJoinUs}>Join us this Sunday</button>
                            <button className="btn btn-sermon" onClick={() => navigate("Sermons")}>Watch a sermon</button>
                        </div>
                    </div>
                    <div className="hero-slider-controls" aria-label="Choose a welcome highlight">
                        {heroSlides.map((slide, index) => (
                            <button key={slide.title} className={index === activeHeroSlide ? "active" : ""} onClick={() => setActiveHeroSlide(index)} aria-label={`Show slide ${index + 1}`} aria-current={index === activeHeroSlide ? "true" : undefined} />
                        ))}
                    </div>
                </div>
            </section>

            {/* THIS SUNDAY — service strip plus the opportunities spotlight */}
            <div className="section-sm section-light">
                <div className="container">
                    <div className="strip-head">
                        <div>
                            <h2 className="section-title strip-title">This Sunday: &ldquo;Rise Up &amp; Shine&rdquo;</h2>
                            <p className="strip-sub tabular">Isaiah 60:1</p>
                        </div>
                        <button className="btn btn-quiet btn-sm" onClick={() => navigate("Liturgy")}>Order of service</button>
                    </div>
                    <div className="card service-sheet">
                        {[
                            ["08:00", "Devotion", "Open the day together in prayer and the Word."],
                            ["08:30", "Youth service", "Worship, teaching and fellowship as one family."],
                            ["11:00", "Bible study", "Go deeper in Scripture in smaller groups."],
                        ].map(([time, title, desc]) => (
                            <div key={title} className="service-slot">
                                <p className="service-slot-time tabular">{time}</p>
                                <h3 className="service-slot-title">{title}</h3>
                                <p className="service-slot-desc">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* NEXT UP — poster and countdown */}
            <div className="section-sm section-light" style={{ paddingTop: 0 }}>
                <div className="container">
                    <div className="card next-up">
                        <div className="next-up-poster"><PosterCarousel /></div>
                        <div className="next-up-body">
                            {!nextEvent ? (
                                <div>
                                    <div className="overline">What&apos;s next</div>
                                    <p className="next-up-title">Stay tuned for our next event</p>
                                    <p className="next-up-desc">New services, trainings and outreach dates are posted here as soon as they are confirmed.</p>
                                    <button className="btn btn-gold btn-sm" onClick={() => navigate("Events")}>View Upcoming Events</button>
                                </div>
                            ) : eventPhase === "now" ? (
                                <div>
                                    <span className="happening-now-badge">Happening Now</span>
                                    <p className="next-up-title">{nextEvent.title}</p>
                                    <button className="btn btn-gold btn-sm" onClick={() => navigate("Events")}>View Details</button>
                                </div>
                            ) : (
                                <div>
                                    <div className="countdown-label">{eventPhase === "starting" ? "Starting In" : "Next Up"}</div>
                                    <p className="next-up-title">{nextEvent.title}</p>
                                    <div className="countdown-grid">
                                        {[["d", "Days"], ["h", "Hrs"], ["m", "Min"], ["s", "Sec"]].map(([k, l]) => (
                                            <div key={k} className="countdown-unit">
                                                <div className="countdown-num">{String(countdown[k]).padStart(2, "0")}</div>
                                                <div className="countdown-unit-label">{l}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="btn btn-gold btn-sm" style={{ marginTop: "1.25rem" }} onClick={() => navigate("Events")}>View All Events</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* COMMUNITY METRICS */}
            <div className="section-sm section-light" ref={statsRef} style={{ paddingTop: 0 }}>
                <div className="container">
                    <div className="card metrics-card">
                        {[[stat1, "+", "Active Youth Members"], [stat2, "+", "Ministry Programs"], [stat3, "+", "Outreach Events / Year"], [stat4, "+", "Lives Impacted"]].map(([n, suffix, label], i) => (
                            <div key={i}>
                                <div className="stat-num tabular">{n.toLocaleString()}{suffix}</div>
                                <div className="stat-label">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* WELCOME STRIP */}
            <div className="section-sm section-cream">
                <div className="container" style={{ textAlign: "center" }}>
                    <div className="overline">Welcome Home</div>
                    <h2 className="section-title" style={{ marginBottom: "1rem" }}>A Family Built on Faith</h2>
                    <p className="section-desc" style={{ maxWidth: 700 }}>
                        Whether you're exploring faith for the first time or growing deeper in your walk with Christ, ACK St Pauls Youths is your community. We are the youth ministry of ACK St Paul's Cathedral in Embu town, part of the Anglican Church of Kenya (ACK). Young people from across Embu gather here every Sunday to worship, learn, and serve together, because we are better together.
                    </p>
                    <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}>
                        <button className="btn btn-gold" onClick={() => navigate("About")}>Our Story</button>
                        <button className="btn btn-navy" onClick={() => navigate("Ministries")}>Find Your Ministry</button>
                    </div>
                </div>
            </div>

            {galleryImages.length > 0 && (
                <div className="section section-light">
                    <div className="container">
                        <div className="strip-head">
                            <div>
                                <h2 className="section-title strip-title">Life together</h2>
                                <p className="strip-sub">Moments from around the community</p>
                            </div>
                            <button className="btn btn-quiet btn-sm" onClick={() => navigate("Gallery")}>View the gallery</button>
                        </div>
                        <div className="home-gallery-grid">
                            {galleryImages.slice(0, 3).map((image, index) => (
                                <div className="home-gallery-card" key={image.id || image.imageData}>
                                    <img src={image.imageData} alt={image.caption || `ACK St Pauls Youths community moment ${index + 1}`} />
                                    {image.caption && <p className="home-gallery-caption">{image.caption}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* UPCOMING EVENTS */}
            <div className="section section-cream">
                <div className="container">
                    <div className="strip-head">
                        <div>
                            <h2 className="section-title strip-title">What&apos;s coming up</h2>
                            <p className="strip-sub">Services, trainings and outreach you can join</p>
                        </div>
                        <button className="btn btn-quiet btn-sm" onClick={() => navigate("Events")}>View all events</button>
                    </div>
                    {events.length === 0 && <p style={{ color: "var(--gray-600)" }}>No upcoming events yet — check back soon.</p>}
                    <div className="grid-2 home-events-grid">
                        {events.slice(0, 4).map((e, i) => (
                            <HomeEventCard key={i} e={e} navigate={navigate} />
                        ))}
                    </div>
                    <div className="opps-band">
                        <div>
                            <h3>Jobs and the youth business directory</h3>
                            <p>Internships and attachments around Embu, youth-owned businesses, and requests from the community.</p>
                        </div>
                        <button className="btn btn-white btn-sm" onClick={() => navigate("Community")}>Browse opportunities</button>
                    </div>
                </div>
            </div>

            {/* FEATURED SERMON */}
            <div className="section section-light">
                <div className="container">
                    <div className="strip-head">
                        <div>
                            <h2 className="section-title strip-title">The latest message</h2>
                            <p className="strip-sub">Missed Sunday? Catch up here</p>
                        </div>
                        <button className="btn btn-quiet btn-sm" onClick={() => navigate("Sermons")}>All sermons</button>
                    </div>
                    {videosLoading && (
                        <div style={{ padding: "1.5rem 0", color: "var(--gray-600)" }}>Loading the latest sermon…</div>
                    )}
                    {!videosLoading && !latestVideo && (
                        <div style={{ padding: "1.5rem 0", color: "var(--gray-600)" }}>
                            New sermon uploads will appear here soon.
                        </div>
                    )}
                    {!videosLoading && latestVideo && (
                        <div className="featured-sermon-grid" style={{ background: "var(--navy)", borderRadius: 20, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                            <div
                                className="featured-sermon-thumb"
                                style={{
                                    backgroundImage: `linear-gradient(rgba(33,22,52,0.4), rgba(33,22,52,0.5)), url(${latestVideo.thumbnail})`,
                                    backgroundSize: "cover", backgroundPosition: "center",
                                    padding: "3rem", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                                    minHeight: 300, cursor: "pointer",
                                }}
                                onClick={() => setActiveVideo(latestVideo)}
                            >
                                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", boxShadow: "0 0 40px rgba(201,168,76,0.5)", marginBottom: "1rem" }}>▶</div>
                                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.85rem" }}>Click to watch</div>
                            </div>
                            <div className="featured-sermon-info" style={{ padding: "2.5rem" }}>
                                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--gold)", fontWeight: 700, marginBottom: "0.75rem" }}>
                                    {new Date(latestVideo.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </div>
                                <div className="featured-sermon-title" style={{ fontFamily: "var(--font-display)", fontSize: "2.15rem", fontWeight: 700, color: "white", lineHeight: 1, marginBottom: "1rem" }}>{latestVideo.title}</div>
                                {latestVideo.description && (
                                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", lineHeight: 1.75, marginBottom: "1.5rem", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                        {latestVideo.description}
                                    </div>
                                )}
                                <div style={{ display: "flex", gap: "0.75rem" }}>
                                    <button className="btn btn-gold btn-sm" onClick={() => setActiveVideo(latestVideo)}>Watch Full Sermon</button>
                                    <button className="btn btn-outline btn-sm" onClick={() => navigate("Sermons")}>All Sermons</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />

            {/* MINISTRIES PREVIEW */}
            <div className="section section-cream">
                <div className="container">
                    <div className="strip-head">
                        <div>
                            <h2 className="section-title strip-title">Find your place to serve</h2>
                            <p className="strip-sub">Eight ministry teams, one shared purpose</p>
                        </div>
                        <button className="btn btn-quiet btn-sm" onClick={() => navigate("Ministries")}>Explore ministries</button>
                    </div>
                    <div className="ministry-list">
                        {MINISTRIES.map((m, i) => (
                            <button key={i} className="ministry-row" onClick={() => navigate("Ministries")}>
                                <span className="ministry-row-index" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                                <span>
                                    <span className="ministry-row-title">{m.title}</span>
                                    <span className="ministry-row-desc">{m.desc}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <AppPromoSection navigate={navigate} />

            {/* NEWSLETTER */}
            <div className="newsletter">
                <div className="overline" style={{ color: "var(--gold)" }}>Stay Connected</div>
                <h2 className="section-title white">Get the Weekly Update</h2>
                <p className="section-desc white">Sermons, events, devotionals, and community news — straight to your inbox every Friday.</p>
                {newsletter.submitted ? (
                    <p style={{ color: "var(--gold-light)", fontWeight: 600, marginTop: "1.5rem" }}>✓ Subscribed! Watch your inbox on Fridays.</p>
                ) : (
                    <div className="newsletter-form">
                        <input
                            className="newsletter-input"
                            placeholder="Enter your email address"
                            type="email"
                            value={newsletter.formData.email}
                            onChange={e => newsletter.setField("email", e.target.value)}
                        />
                        <button className="btn btn-gold" disabled={newsletter.submitting} onClick={handleNewsletterSubmit}>
                            {newsletter.submitting ? "Subscribing..." : "Subscribe →"}
                        </button>
                    </div>
                )}
                {newsletter.error && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginTop: 8 }}>{newsletter.error}</p>}
                <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", marginTop: "1rem" }}>We respect your privacy. Unsubscribe anytime.</p>
            </div>
        </>
    );
}

function AboutPage() {
    return (
        <>
            <div className="events-hero">
                <div className="overline" style={{ color: "var(--gold-light)" }}>Our Story</div>
                <h1 className="section-title white" style={{ fontSize: "3rem", maxWidth: 700, margin: "0 auto 1rem" }}>About ACK St Pauls Youths</h1>
                <p className="section-desc white" style={{ maxWidth: 600, margin: "0 auto" }}>A legacy of faith, a present of purpose, a future of hope.</p>
            </div>

            <div className="section section-cream">
                <div className="container">
                    <div className="about-grid">
                        <div>
                            <div className="overline">Our History</div>
                            <h2 className="section-title" style={{ textAlign: "left", marginBottom: "1.25rem" }}>Rooted in Faith Since 2015</h2>
                            <p style={{ color: "var(--gray-600)", lineHeight: 1.8, marginBottom: "1rem" }}>
                                ACK St Paul's Cathedral (Anglican Church of Kenya) has been a spiritual landmark in Embu for decades. The Youth Ministry was established in 2015 as a response to the growing need for intentional discipleship among the young people of the church family.
                            </p>
                            <p style={{ color: "var(--gray-600)", lineHeight: 1.8, marginBottom: "1rem" }}>
                                From humble beginnings with a handful of passionate teenagers, the ministry has grown into one of the largest and most impactful youth communities in Embu, now boasting over 350 active members across multiple programmes.
                            </p>
                            <p style={{ color: "var(--gray-600)", lineHeight: 1.8 }}>
                                Today, ACK St Pauls Youths stands as a testament to God's faithfulness — a vibrant, multicultural community united by a singular passion: to know Christ and make Him known.
                            </p>
                        </div>
                        <div className="about-image-mock" style={{ backgroundImage: `linear-gradient(to top, rgba(33,22,52,0.95) 0%, rgba(33,22,52,0.55) 55%, rgba(33,22,52,0.25) 100%), url(${youthFellowship})` }}>
                            <div className="about-quote">
                                "For I know the plans I have for you, declares the Lord — plans to prosper you and not to harm you, plans to give you hope and a future."
                                <div style={{ fontSize: "0.8rem", marginTop: "0.75rem", color: "var(--gold)", fontStyle: "normal", fontWeight: 600 }}>— Jeremiah 29:11</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* VISION & MISSION */}
            <div className="section section-light">
                <div className="container">
                    <div className="grid-2">
                        <div className="card" style={{ padding: "2.5rem", background: "var(--navy)" }}>
                            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 700, color: "white", lineHeight: 1, marginBottom: "1rem" }}>Our Vision</div>
                            <p style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.75 }}>
                                To be a generation of Christlike leaders who transform families, communities, and nations through the power of the Gospel.
                            </p>
                        </div>
                        <div className="card" style={{ padding: "2.5rem", background: "var(--crimson)" }}>
                            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 700, color: "white", lineHeight: 1, marginBottom: "1rem" }}>Our Mission</div>
                            <p style={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.75 }}>
                                To equip, empower, and engage youth in meaningful discipleship, authentic worship, and transformative service to God and humanity.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CORE VALUES */}
            <div className="section section-cream">
                <div className="container">
                    <div className="section-header">
                        <div className="overline">What We Stand For</div>
                        <h2 className="section-title">Our Core Values</h2>
                        <div className="gold-line" />
                    </div>
                    <div style={{ textAlign: "center" }}>
                        {["Faith over Fear", "Authentic Worship", "Biblical Truth", "Radical Love", "Community & Belonging", "Servant Leadership", "Excellence in All Things", "Missional Living", "Integrity & Accountability", "Cultural Diversity"].map((v, i) => (
                            <span key={i} className="value-pill"><span className="value-dot" />{v}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* LEADERSHIP */}
            <div className="section section-light">
                <div className="container">
                    <div className="section-header">
                        <div className="overline">Meet the Team</div>
                        <h2 className="section-title">Our Leadership</h2>
                        <p className="section-desc">Dedicated servants of God committed to nurturing the next generation of Christ-followers.</p>
                        <div className="gold-line" />
                    </div>
                    <div className="grid-4">
                        {TEAM.map((t, i) => <TeamCard key={i} t={t} />)}
                    </div>
                </div>
            </div>

            {/* STATEMENT OF FAITH */}
            <div className="section section-navy">
                <div className="container-sm" style={{ textAlign: "center" }}>
                    <div className="overline" style={{ color: "var(--gold)" }}>What We Believe</div>
                    <h2 className="section-title white">Statement of Faith</h2>
                    <div className="gold-line" />
                    <div className="grid-2" style={{ marginTop: "2.5rem", textAlign: "left" }}>
                        {[
                            ["Scripture", "We believe the Bible is the inspired, infallible Word of God — our ultimate authority for faith and life."],
                            ["The Trinity", "We believe in one God — Father, Son, and Holy Spirit — eternally existing in three persons."],
                            ["Salvation", "We believe salvation is by grace alone, through faith alone, in Christ alone — received as a free gift."],
                            ["The Holy Spirit", "We believe in the active work of the Holy Spirit, who indwells, guides, and empowers every believer."],
                            ["The Church", "We believe in the universal Church — the body of Christ — called to worship, fellowship, and mission."],
                            ["Second Coming", "We believe in the bodily return of Jesus Christ to judge the living and the dead and to establish His kingdom."],
                        ].map(([title, text], i) => (
                            <div key={i} className="card" style={{ padding: "1.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)" }}>
                                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 700, color: "var(--gold)", lineHeight: 1, marginBottom: "0.5rem" }}>{title}</div>
                                <div style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>{text}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

function MinistriesPage({ navigate }) {
    const [joiningMinistry, setJoiningMinistry] = useState(() => {
        const slug = ministryRegistrationSlug(window.location.pathname);
        return MINISTRIES.find(ministry => slugify(ministry.title) === slug)?.title || null;
    });

    useEffect(() => {
        const onPopState = () => {
            const slug = ministryRegistrationSlug(window.location.pathname);
            setJoiningMinistry(MINISTRIES.find(ministry => slugify(ministry.title) === slug)?.title || null);
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    const openMinistryRegistration = title => {
        const path = ministryRegistrationPath(title);
        if (window.location.pathname !== path) window.history.pushState({}, "", path);
        setJoiningMinistry(title);
    };

    const closeMinistryRegistration = () => {
        if (ministryRegistrationSlug(window.location.pathname)) window.history.pushState({}, "", pageToPath("Ministries"));
        setJoiningMinistry(null);
    };

    return (
        <>
            <div className="page-hero">
                <div className="overline" style={{ color: "var(--gold-light)" }}>Get Involved</div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.75rem, 5vw, 4.5rem)", fontWeight: 700, lineHeight: 0.95, color: "white", marginBottom: "1rem" }}>Our Ministries</h1>
                <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.85)", maxWidth: 550, margin: "0 auto" }}>Eight dynamic arms of ministry where every member finds their place, purpose, and calling to serve.</p>
            </div>
            <div className="section section-cream">
                <div className="container">
                    <div className="grid-3">
                        {MINISTRIES.map((m, i) => (
                            <div key={i} id={slugify(m.title)} className="card ministry-card-full">
                                <div className="ministry-title" style={{ fontSize: "1.2rem", textAlign: "center" }}>{m.title}</div>
                                <div className="ministry-desc" style={{ marginTop: "0.6rem", textAlign: "center" }}>{m.desc}</div>
                                <button className="btn btn-gold btn-sm" style={{ marginTop: "1.5rem", width: "100%", justifyContent: "center" }} onClick={() => openMinistryRegistration(m.title)}>
                                    Join This Ministry →
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="newsletter">
                <h2 className="section-title white">Ready to Serve?</h2>
                <p className="section-desc white" style={{ marginBottom: "1.5rem" }}>Every ministry needs passionate volunteers. Join us and use your gifts for God's glory.</p>
                <button className="btn btn-gold" onClick={() => navigate("Connect")}>Get Connected Today →</button>
            </div>

            {joiningMinistry && <MinistryJoinModal ministryTitle={joiningMinistry} onClose={closeMinistryRegistration} />}
        </>
    );
}

function VideoModal({ video, onClose }) {
    if (!video) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card modal-card-video" onClick={e => e.stopPropagation()}>
                <button className="modal-close-video" onClick={onClose} aria-label="Close">✕</button>
                <div className="video-frame-wrap">
                    <iframe
                        src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
                <div className="modal-video-info">
                    <div className="modal-title">{video.title}</div>
                    <div className="modal-meta">
                        {new Date(video.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        {" · "}
                        <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer" style={{ color: "var(--gold-dark)" }}>
                            Watch on YouTube ↗
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

function WrittenSermonModal({ sermon, onClose }) {
    if (!sermon) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
                <div className="modal-header">
                    <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 700, lineHeight: 1.1 }}>{sermon.title}</div>
                    <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
                        {sermon.pastor}{sermon.date && ` · ${sermon.date}`}{sermon.scripture && ` · ${sermon.scripture}`}
                    </div>
                </div>
                <div className="modal-body">
                    <p style={{ whiteSpace: "pre-wrap" }}>{sermon.body}</p>
                </div>
            </div>
        </div>
    );
}

function SermonsPage({ activeTab, setActiveTab, showTabs = true }) {
    const { videos: videosOldestFirst, loading, error } = useYouTubeVideos();
    const videos = [...videosOldestFirst].reverse();
    const [activeVideo, setActiveVideo] = useState(null);
    const { data: writtenData, loading: writtenLoading } = useFirebaseCollection("writtenSermons");
    const writtenSermons = (writtenData || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const [activeSermon, setActiveSermon] = useState(null);
    const { data: galleryData, loading: galleryLoading } = useFirebaseCollection("sermonGallery");
    const galleryImages = (galleryData || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const [lightboxImage, setLightboxImage] = useState(null);

    return (
        <>
            <div className="page-hero">
                <div className="overline" style={{ color: "var(--gold-light)" }}>The Word</div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.75rem, 5vw, 4.5rem)", fontWeight: 700, lineHeight: 0.95, color: "white", marginBottom: "1rem" }}>Sermons & Media</h1>
                <p style={{ color: "rgba(255,255,255,0.75)", maxWidth: 520, margin: "0 auto" }}>Be transformed by the renewing of your mind — Romans 12:2. Watch our full video library, straight from our YouTube channel.</p>
            </div>
            <div className="section section-cream">
                <div className="container">
                    {showTabs && <div className="tab-nav">
                        {["Video", "Written", "Gallery"].map(t => (
                            <button key={t} className={`tab-btn${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>{t}</button>
                        ))}
                    </div>}

                    {activeTab === "Video" && (
                        <>
                            {loading && (
                                <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--gray-400)" }}>Loading videos from YouTube…</div>
                            )}
                            {!loading && error && (
                                <div className="card" style={{ padding: "2.5rem", textAlign: "center" }}>
                                    <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📡</div>
                                    <p style={{ color: "var(--gray-600)", marginBottom: "1.25rem" }}>{error}</p>
                                    <a
                                        href="https://youtube.com/@ackcathedralyouthembu"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-gold btn-sm"
                                    >
                                        Visit Our YouTube Channel →
                                    </a>
                                </div>
                            )}
                            {!loading && !error && videos.length === 0 && (
                                <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--gray-400)" }}>No videos found yet. Check back soon!</div>
                            )}
                            {!loading && !error && videos.length > 0 && (
                                <div className="grid-3">
                                    {videos.map(v => (
                                        <div
                                            key={v.id}
                                            className="card sermon-card"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => setActiveVideo(v)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={e => { if (e.key === "Enter") setActiveVideo(v); }}
                                        >
                                            <div
                                                className="sermon-thumb"
                                                style={{
                                                    backgroundImage: `linear-gradient(rgba(33,22,52,0.4), rgba(33,22,52,0.5)), url(${v.thumbnail})`,
                                                    backgroundSize: "cover",
                                                    backgroundPosition: "center",
                                                }}
                                            >
                                                <div className="play-btn">▶</div>
                                            </div>
                                            <div className="sermon-content">
                                                <div className="sermon-title">{v.title}</div>
                                                <div className="sermon-pastor">
                                                    {new Date(v.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />

                    {activeTab === "Written" && (
                        <>
                            {writtenLoading && (
                                <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--gray-400)" }}>Loading written sermons…</div>
                            )}
                            {!writtenLoading && writtenSermons.length === 0 && (
                                <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--gray-400)" }}>No written sermons posted yet. Check back soon!</div>
                            )}
                            {!writtenLoading && writtenSermons.length > 0 && (
                                <div className="grid-3">
                                    {writtenSermons.map(s => (
                                        <div key={s.id} className="card blog-card">
                                            <div className="blog-content">
                                                <div className="blog-cat">{s.scripture || "Sermon"}</div>
                                                <div className="blog-title">{s.title}</div>
                                                <div className="blog-excerpt">{s.body?.length > 160 ? `${s.body.slice(0, 160)}…` : s.body}</div>
                                                <div className="blog-meta">
                                                    <span>{s.pastor}</span>
                                                    <span>{s.date}</span>
                                                </div>
                                                <button
                                                    onClick={() => setActiveSermon(s)}
                                                    style={{ background: "none", border: "none", padding: 0, marginTop: "0.85rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: "var(--gold-dark)" }}
                                                >
                                                    Read Full Sermon →
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    <WrittenSermonModal sermon={activeSermon} onClose={() => setActiveSermon(null)} />

                    {activeTab === "Gallery" && (
                        <>
                            {galleryLoading && (
                                <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--gray-400)" }}>Loading gallery…</div>
                            )}
                            {!galleryLoading && galleryImages.length === 0 && (
                                <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--gray-400)" }}>No photos posted yet. Check back soon!</div>
                            )}
                            {!galleryLoading && galleryImages.length > 0 && (
                                <div className="gallery-grid">
                                    {galleryImages.map(img => (
                                        <div key={img.id} className="gallery-item" onClick={() => setLightboxImage(img)}>
                                            <div className="gallery-bg" style={{ padding: 0 }}>
                                                <img src={img.imageData} alt={img.caption || "Sermon gallery photo"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {lightboxImage && <PosterLightbox src={lightboxImage.imageData} alt={lightboxImage.caption || "Sermon gallery photo"} onClose={() => setLightboxImage(null)} />}
                </div>
            </div>
        </>
    );
}

function EventsPage({ events }) {
    const [detailsEvent, setDetailsEvent] = useState(null);
    const [registrationEvent, setRegistrationEvent] = useState(null);
    const registration = useFormSubmit(
        "eventRegistrations",
        { firstName: "", lastName: "", phone: "", eventTitle: "", specialRequirements: "" },
        ["firstName", "lastName", "phone"]
    );

    const openRegistrationFromUrl = () => {
        const eventSlug = eventRegistrationSlug(window.location.pathname);
        const event = events.find(item => slugify(item.title) === eventSlug);
        if (!event) return false;
        registration.reset();
        registration.setField("eventTitle", event.title);
        setRegistrationEvent(event);
        return true;
    };

    useEffect(() => {
        openRegistrationFromUrl();
        const onPopState = () => {
            if (!openRegistrationFromUrl()) {
                setRegistrationEvent(null);
                registration.reset();
            }
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
        // Event data is loaded asynchronously; re-check the URL when it arrives.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events]);

    const handleRegisterClick = (event) => {
        const path = eventRegistrationPath(event);
        if (window.location.pathname !== path) window.history.pushState({}, "", path);
        registration.reset();
        registration.setField("eventTitle", event.title);
        setRegistrationEvent(event);
    };

    const handleRegistrationSubmit = () => {
        registration.handleSubmit({ status: "registered" });
    };

    const closeRegistration = () => {
        if (eventRegistrationSlug(window.location.pathname)) window.history.pushState({}, "", pageToPath("Events"));
        setRegistrationEvent(null);
        registration.reset();
    };

    return (
        <>
            <div className="page-hero">
                <div className="overline" style={{ color: "var(--gold-light)" }}>What's Happening</div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.75rem, 5vw, 4.5rem)", fontWeight: 700, lineHeight: 0.95, color: "white", marginBottom: "1rem" }}>Events & Activities</h1>
                <p style={{ color: "rgba(255,255,255,0.85)", maxWidth: 540, margin: "0 auto" }}>Coffee dates, worship experiences, trainings, retreats, and more — join us for life-changing experiences.</p>
            </div>
            <div className="section section-cream">
                <div className="container">
                    <div className="section-header">
                        <div className="overline">July – August 2026</div>
                        <h2 className="section-title">Upcoming Events</h2>
                        <div className="gold-line" />
                    </div>
                    {events.length === 0 && <p style={{ textAlign: "center", color: "var(--gray-400)" }}>No upcoming events yet — check back soon!</p>}
                    <div style={{ display: "grid", gap: "1.25rem" }}>
                        {events.map((e, i) => (
                            <div key={i} id={slugify(e.title)} className="card event-card">
                                <div className={`event-date-block${e.urgent ? " urgent" : ""}`}>
                                    <div className="event-day">{e.day}</div>
                                    <div className="event-month">{e.month}</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="event-title" style={{ fontSize: "1.15rem" }}>{e.title}{e.urgent && <span className="event-urgent-badge">Starting Soon</span>}</div>
                                    <div className="event-meta">📅 {e.time}</div>
                                    <div className="event-desc">{e.desc}</div>
                                </div>
                                <div className="event-actions">
                                    <button className="btn btn-gold btn-sm" onClick={() => handleRegisterClick(e)}>Register →</button>
                                    <button className="btn btn-ghost-navy btn-sm" onClick={() => setDetailsEvent(e)}>View Details</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {detailsEvent && (
                        <div className="modal-overlay" onClick={() => setDetailsEvent(null)}>
                            <div className="modal-card" onClick={ev => ev.stopPropagation()}>
                                <div className="modal-header">
                                    <button className="modal-close" onClick={() => setDetailsEvent(null)} aria-label="Close">✕</button>
                                    <div className="modal-date-badge">
                                        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, color: "var(--gold-light)", lineHeight: 0.9 }}>{detailsEvent.day}</div>
                                        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.8 }}>{detailsEvent.month}</div>
                                    </div>
                                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 700, lineHeight: 1 }}>{detailsEvent.title}</div>
                                    <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginTop: 4 }}>📅 {detailsEvent.time}</div>
                                </div>
                                <div className="modal-body">
                                    <p>{detailsEvent.desc}</p>
                                    <button
                                        className="btn btn-gold"
                                        style={{ width: "100%", justifyContent: "center", marginTop: "1.5rem" }}
                                        onClick={() => { handleRegisterClick(detailsEvent); setDetailsEvent(null); }}
                                    >
                                        Register for This Event →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {registrationEvent && (
                        <div className="modal-overlay" onClick={closeRegistration}>
                            <div className="modal-card" style={{ maxWidth: 600 }} onClick={ev => ev.stopPropagation()}>
                                <div className="modal-header">
                                    <button className="modal-close" onClick={closeRegistration} aria-label="Close registration form">×</button>
                                    <div className="overline" style={{ color: "var(--gold-light)", marginBottom: "0.4rem" }}>Register Today</div>
                                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 700, lineHeight: 1.05 }}>Register for {registrationEvent.title}</div>
                                    <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginTop: 8 }}>📅 {registrationEvent.day} {registrationEvent.month} · {registrationEvent.time}</div>
                                </div>
                                <div className="modal-body">
                        {registration.submitted ? (
                            <p style={{ textAlign: "center", color: "var(--navy)", fontWeight: 600, padding: "1rem 0" }}>
                                ✓ You're registered for {registrationEvent.title}! We'll be in touch with details.
                            </p>
                        ) : (
                            <>
                                <div className="grid-2" style={{ gap: "1rem" }}>
                                    <div className="form-group">
                                        <label className="form-label event-form-label">First Name</label>
                                        <input className="form-input" placeholder="First name" value={registration.formData.firstName} onChange={e => registration.setField("firstName", e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label event-form-label">Last Name</label>
                                        <input className="form-input" placeholder="Last name" value={registration.formData.lastName} onChange={e => registration.setField("lastName", e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label event-form-label">Phone Number</label>
                                    <input className="form-input" type="tel" inputMode="numeric" maxLength={10} placeholder="07XXXXXXXX or 01XXXXXXXX" value={registration.formData.phone} onChange={e => registration.setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label event-form-label">Special Requirements or Questions (Optional)</label>
                                    <textarea className="form-textarea" placeholder="Dietary needs, mobility requirements, questions..." value={registration.formData.specialRequirements} onChange={e => registration.setField("specialRequirements", e.target.value)} />
                                </div>
                                {registration.error && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{registration.error}</p>}
                                <button className="btn btn-gold" style={{ width: "100%", justifyContent: "center" }} disabled={registration.submitting} onClick={handleRegistrationSubmit}>
                                    {registration.submitting ? "Submitting..." : "Submit Registration →"}
                                </button>
                            </>
                        )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function ConnectPage() {
    const contact = useFormSubmit(
        "contactMessages",
        { firstName: "", lastName: "", email: "", phone: "", helpType: "I'm new and want to know more", message: "" },
        ["firstName", "lastName", "email", "message"]
    );
    const connectPrayer = useFormSubmit("prayerRequests", { name: "", request: "" }, ["request"]);
    const [prayerAnonymous, setPrayerAnonymous] = useState(false);
    const smallGroup = useFormSubmit(
        "smallGroupSignups",
        { name: "", phone: "", preferredGroup: "Bible Study (Sunday · 11:00 AM)" },
        ["name", "phone"]
    );

    const handleContactSubmit = () => {
        if (!validateEmail(contact.formData.email)) return;
        contact.handleSubmit();
    };

    return (
        <>
            <div className="page-hero">
                <div className="overline" style={{ color: "var(--gold-light)" }}>We'd Love to Hear From You</div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.75rem, 5vw, 4.5rem)", fontWeight: 700, lineHeight: 0.95, color: "white", marginBottom: "1rem", letterSpacing: "0.01em", wordSpacing: "0.1em" }}>Connect With Us</h1>
                <p style={{ color: "rgba(255,255,255,0.75)", maxWidth: 520, margin: "0 auto" }}>Whether you're new, returning, or just curious — reach out. We have a place for you here.</p>
            </div>
            <div className="section section-cream">
                <div className="container">
                    <div className="grid-2">
                        <div>
                            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.85rem", fontWeight: 700, lineHeight: 1, color: "var(--navy)", marginBottom: "1.5rem" }}>Send Us a Message</h3>
                            <div className="card" style={{ padding: "2rem" }}>
                                {contact.submitted ? (
                                    <p style={{ textAlign: "center", color: "var(--navy)", fontWeight: 600, padding: "1rem 0" }}>✓ Message sent! We'll get back to you soon.</p>
                                ) : (
                                    <>
                                        <div className="grid-2" style={{ gap: "1rem" }}>
                                            <div className="form-group"><label className="form-label">First Name</label><input className="form-input" placeholder="First name" value={contact.formData.firstName} onChange={e => contact.setField("firstName", e.target.value)} /></div>
                                            <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" placeholder="Last name" value={contact.formData.lastName} onChange={e => contact.setField("lastName", e.target.value)} /></div>
                                        </div>
                                        <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="your@email.com" value={contact.formData.email} onChange={e => contact.setField("email", e.target.value)} /></div>
                                        <div className="form-group"><label className="form-label">Phone</label><input className="form-input" type="tel" inputMode="numeric" maxLength={10} placeholder="07XXXXXXXX or 01XXXXXXXX" value={contact.formData.phone} onChange={e => contact.setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} /></div>
                                        <div className="form-group">
                                            <label className="form-label">How Can We Help?</label>
                                            <select className="form-select" value={contact.formData.helpType} onChange={e => contact.setField("helpType", e.target.value)}>
                                                <option>I'm new and want to know more</option>
                                                <option>I'd like to join a ministry</option>
                                                <option>I need pastoral support</option>
                                                <option>Partnership or collaboration</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group"><label className="form-label">Message</label><textarea className="form-textarea" placeholder="Tell us more..." value={contact.formData.message} onChange={e => contact.setField("message", e.target.value)} /></div>
                                        {contact.error && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{contact.error}</p>}
                                        <button className="btn btn-gold" style={{ width: "100%", justifyContent: "center" }} disabled={contact.submitting} onClick={handleContactSubmit}>
                                            {contact.submitting ? "Sending..." : "Send Message →"}
                                        </button>
                                    </>
                                )}
                            </div>

                            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.85rem", fontWeight: 700, lineHeight: 1, color: "var(--navy)", margin: "2rem 0 1.25rem" }}>Prayer Request</h3>
                            <div className="card" style={{ padding: "2rem" }}>
                                {connectPrayer.submitted ? (
                                    <p style={{ textAlign: "center", color: "var(--navy)", fontWeight: 600, padding: "1rem 0" }}>🙏 Your prayer request has been submitted.</p>
                                ) : (
                                    <>
                                        <div className="form-group"><label className="form-label">Name (Optional)</label><input className="form-input" placeholder="Your name" disabled={prayerAnonymous} value={connectPrayer.formData.name} onChange={e => connectPrayer.setField("name", e.target.value)} /></div>
                                        <div className="form-group"><label className="form-label">Your Prayer Request</label><textarea className="form-textarea" placeholder="Share what's on your heart. Our prayer team prays over every request..." value={connectPrayer.formData.request} onChange={e => connectPrayer.setField("request", e.target.value)} /></div>
                                        {connectPrayer.error && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{connectPrayer.error}</p>}
                                        <div style={{ display: "flex", gap: "0.75rem" }}>
                                            <button
                                                className="btn btn-gold"
                                                style={{ flex: 1, justifyContent: "center" }}
                                                disabled={connectPrayer.submitting}
                                                onClick={() => connectPrayer.handleSubmit({ source: "connect-page", anonymous: prayerAnonymous, name: prayerAnonymous ? "" : connectPrayer.formData.name })}
                                            >
                                                {connectPrayer.submitting ? "Sending..." : "🙏 Submit Request"}
                                            </button>
                                            <button className={`btn btn-sm${prayerAnonymous ? " btn-gold" : " btn-navy"}`} onClick={() => setPrayerAnonymous(!prayerAnonymous)}>
                                                {prayerAnonymous ? "✓ Anonymous" : "Keep Anonymous"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.85rem", fontWeight: 700, lineHeight: 1, color: "var(--navy)", marginBottom: "1.5rem" }}>Find Us</h3>
                            <a
                                href="https://www.google.com/maps/place/St+Pauls+Ack+Cathedral-Embu/@-0.5279977,37.4488796,17z/data=!3m1!4b1!4m6!3m5!1s0x18262de925844709:0x8c05dc706a1f1a5a!8m2!3d-0.5279977!4d37.4514545!16s%2Fg%2F1q5cccb3n?entry=ttu&g_ep=EgoyMDI2MDYyOS4wIKXMDSoASAFQAw%3D%3D"
                                target="_blank"
                                rel="noreferrer"
                                className="map-container"
                                style={{ marginBottom: "1.5rem", textDecoration: "none", cursor: "pointer" }}
                            >
                                <div className="map-pin-mock">
                                    <div style={{ fontSize: "2.5rem" }}>📍</div>
                                    <div className="map-label">ACK St Pauls Cathedral, Embu</div>
                                </div>
                                <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(14,32,68,0.04) 0px, rgba(14,32,68,0.04) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(14,32,68,0.04) 0px, rgba(14,32,68,0.04) 1px, transparent 1px, transparent 40px)", borderRadius: 16 }} />
                            </a>
                            <a
                                href="https://www.google.com/maps/place/St+Pauls+Ack+Cathedral-Embu/@-0.5279977,37.4488796,17z/data=!3m1!4b1!4m6!3m5!1s0x18262de925844709:0x8c05dc706a1f1a5a!8m2!3d-0.5279977!4d37.4514545!16s%2Fg%2F1q5cccb3n?entry=ttu&g_ep=EgoyMDI2MDYyOS4wIKXMDSoASAFQAw%3D%3D"
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-navy btn-sm"
                                style={{ width: "100%", justifyContent: "center", marginBottom: "1.5rem" }}
                            >
                                Get Directions →
                            </a>
                            <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                                <div style={{ display: "grid", gap: "1rem" }}>
                                    {[["📍", "Address", "Embu Town, Embu, Kenya"], ["✉️", "Email", "ictcathedral2@gmail.com"]].map(([icon, label, val], i) => (
                                        <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                                            <div style={{ width: 36, height: 36, background: "var(--cream)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>{icon}</div>
                                            <div><div style={{ fontSize: "0.78rem", color: "var(--gray-400)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div><div style={{ fontSize: "0.92rem", color: "var(--navy)", fontWeight: 500, marginTop: 2 }}>{val}</div></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 700, lineHeight: 1, color: "var(--navy)", marginBottom: "1.25rem" }}>Join a Small Group</h3>
                            <div className="card" style={{ padding: "1.75rem" }}>
                                {smallGroup.submitted ? (
                                    <p style={{ textAlign: "center", color: "var(--navy)", fontWeight: 600, padding: "1rem 0" }}>✓ You're signed up! See you at small group.</p>
                                ) : (
                                    <>
                                        <div className="form-group"><label className="form-label">Your Name</label><input className="form-input" placeholder="Full name" value={smallGroup.formData.name} onChange={e => smallGroup.setField("name", e.target.value)} /></div>
                                        <div className="form-group"><label className="form-label">Phone Number</label><input className="form-input" type="tel" inputMode="numeric" maxLength={10} placeholder="07XXXXXXXX or 01XXXXXXXX" value={smallGroup.formData.phone} onChange={e => smallGroup.setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} /></div>
                                        <div className="form-group">
                                            <label className="form-label">Preferred Group</label>
                                            <select className="form-select" value={smallGroup.formData.preferredGroup} onChange={e => smallGroup.setField("preferredGroup", e.target.value)}>
                                                <option>Bible Study (Sunday · 11:00 AM)</option>
                                                <option>Missions</option>
                                                <option>Men's Fellowship (Friday · 5:00 PM)</option>
                                            </select>
                                        </div>
                                        {smallGroup.error && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{smallGroup.error}</p>}
                                        <button className="btn btn-navy" style={{ width: "100%", justifyContent: "center" }} disabled={smallGroup.submitting} onClick={() => smallGroup.handleSubmit()}>
                                            {smallGroup.submitting ? "Signing up..." : "Sign Me Up →"}
                                        </button>
                                    </>
                                )}
                            </div>

                            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 700, lineHeight: 1, color: "var(--navy)", margin: "1.5rem 0 1rem" }}>Follow Us</h3>
                            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                                {[
                                    ["facebook", "Facebook", "@ACKStPaulsYouths", null],
                                    ["youtube", "YouTube", "@ackcathedralyouthembu", "https://youtube.com/@ackcathedralyouthembu?si=muV2v5gj-71yYI7i"],
                                ].map(([icon, name, handle, link], i) => {
                                    const CardTag = link ? "a" : "div";
                                    return (
                                        <CardTag
                                            key={i}
                                            {...(link ? { href: link, target: "_blank", rel: "noreferrer" } : {})}
                                            className="card"
                                            style={{ padding: "0.85rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", flex: "1 1 auto", cursor: "pointer", textDecoration: "none" }}
                                        >
                                            <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--cream)", color: "var(--gold-dark)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><SocialIcon name={icon} size={19} /></span>
                                            <div><div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)" }}>{name}</div><div style={{ fontSize: "0.78rem", color: "var(--gray-400)" }}>{handle}</div></div>
                                        </CardTag>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function GivePage() {
    const [copied, setCopied] = useState("");
    const [stkForm, setStkForm] = useState({ accountType: "Offering", amount: "", phone: "" });
    const [stkState, setStkState] = useState("idle"); // idle | sending | awaiting | success | error
    const [stkError, setStkError] = useState(null);
    const [stkReceipt, setStkReceipt] = useState(null);
    const pollRef = useRef(null);

    const copyToClipboard = (text, label) => {
        navigator.clipboard?.writeText(text).then(() => {
            setCopied(label);
            setTimeout(() => setCopied(""), 2000);
        });
    };

    const setStkField = (key, value) => setStkForm(prev => ({ ...prev, [key]: value }));

    const pollStatus = (checkoutRequestId, attemptsLeft) => {
        if (attemptsLeft <= 0) {
            setStkState("error");
            setStkError("We didn't hear back in time. If you completed the payment on your phone, it'll still be recorded — otherwise please try again.");
            return;
        }
        pollRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/stk-status?checkoutRequestId=${encodeURIComponent(checkoutRequestId)}`);
                const data = await res.json();
                if (data.status === "completed") {
                    setStkState("success");
                    setStkReceipt(data.mpesaReceiptNumber);
                } else if (data.status === "failed") {
                    setStkState("error");
                    setStkError(data.resultDesc || "The payment was not completed.");
                } else {
                    pollStatus(checkoutRequestId, attemptsLeft - 1);
                }
            } catch {
                pollStatus(checkoutRequestId, attemptsLeft - 1);
            }
        }, 3000);
    };

    const handleStkSubmit = async () => {
        if (!validatePhone(stkForm.phone)) { setStkError("Enter a valid phone number: 10 digits starting with 01 or 07 (e.g. 0712345678)."); setStkState("error"); return; }
        if (!stkForm.amount || Number(stkForm.amount) < 1) { setStkError("Enter an amount to give."); setStkState("error"); return; }

        setStkState("sending");
        setStkError(null);
        try {
            const res = await fetch("/api/stk-push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(stkForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong.");
            setStkState("awaiting");
            pollStatus(data.checkoutRequestId, 20);
        } catch (err) {
            setStkState("error");
            setStkError(err.message || "Something went wrong initiating the payment.");
        }
    };

    useEffect(() => () => clearTimeout(pollRef.current), []);

    return (
        <>
            <div className="giving-hero">
                <div className="overline" style={{ color: "var(--gold)" }}>Give & Support</div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.75rem, 5vw, 4.5rem)", fontWeight: 700, lineHeight: 0.95, color: "white", marginBottom: "1rem" }}>Online Giving</h1>
                <p style={{ color: "rgba(255,255,255,0.8)", maxWidth: 540, margin: "0 auto" }}>
                    "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." — 2 Cor 9:7
                </p>
            </div>

            <div className="section section-cream">
                <div className="container-sm">
                    <div className="card" style={{ padding: "2.5rem", marginBottom: "2rem" }}>
                        <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold-dark)", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center" }}>Give Instantly</div>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)", textAlign: "center", marginBottom: "1.5rem" }}>Pay with M-Pesa (STK Push)</h2>

                        {stkState === "success" ? (
                            <div style={{ textAlign: "center", padding: "1rem 0" }}>
                                <p style={{ color: "var(--navy)", fontWeight: 600 }}>✓ Thank you for your generosity! Payment received.</p>
                                {stkReceipt && <p style={{ color: "var(--gray-400)", fontSize: "0.85rem", marginTop: 6 }}>M-Pesa receipt: {stkReceipt}</p>}
                                <button className="btn btn-navy btn-sm" style={{ marginTop: "1rem" }} onClick={() => { setStkState("idle"); setStkForm({ accountType: "Offering", amount: "", phone: "" }); }}>
                                    Give Again
                                </button>
                            </div>
                        ) : stkState === "awaiting" ? (
                            <div style={{ textAlign: "center", padding: "1rem 0" }}>
                                <p style={{ color: "var(--navy)", fontWeight: 600 }}>📱 Check your phone</p>
                                <p style={{ color: "var(--gray-600)", fontSize: "0.9rem", marginTop: 6 }}>Enter your M-Pesa PIN on the prompt sent to {stkForm.phone} to complete your gift.</p>
                            </div>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Giving Towards</label>
                                    <select className="form-select" value={stkForm.accountType} onChange={e => setStkField("accountType", e.target.value)}>
                                        <option>Offering</option>
                                        <option>Tithe</option>
                                        <option>Thanksgiving</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Amount (KSh)</label>
                                    <div className="amount-grid">
                                        {[100, 500, 1000, 2000].map(n => (
                                            <button key={n} type="button" className={`amount-btn${Number(stkForm.amount) === n ? " selected" : ""}`} onClick={() => setStkField("amount", String(n))}>
                                                {n.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                    <input className="form-input" type="number" min="1" placeholder="Or enter a custom amount" value={stkForm.amount} onChange={e => setStkField("amount", e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">M-Pesa Phone Number</label>
                                    <input className="form-input" type="tel" inputMode="numeric" maxLength={10} placeholder="07XXXXXXXX or 01XXXXXXXX" value={stkForm.phone} onChange={e => setStkField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                                </div>
                                {stkState === "error" && stkError && <p style={{ color: "var(--orange)", fontSize: "0.85rem", marginBottom: 12 }}>{stkError}</p>}
                                <button className="btn btn-gold" style={{ width: "100%", justifyContent: "center" }} disabled={stkState === "sending"} onClick={handleStkSubmit}>
                                    {stkState === "sending" ? "Sending request..." : "Give Now →"}
                                </button>
                            </>
                        )}
                    </div>

                    <div className="section-header">
                        <div className="overline">Or Give Manually</div>
                        <h2 className="section-title" style={{ fontSize: "1.5rem" }}>Enter It Yourself on M-Pesa</h2>
                    </div>

                    <div className="card" style={{ padding: "2.5rem", textAlign: "center", marginBottom: "2rem" }}>
                        <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold-dark)", fontWeight: 700, marginBottom: "0.75rem" }}>M-Pesa Lipa na M-Pesa</div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 600, lineHeight: 1, color: "var(--gray-600)", marginBottom: "0.45rem" }}>Paybill Number</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                            <div style={{ fontFamily: "var(--font-display)", fontSize: "3.2rem", fontWeight: 700, lineHeight: 0.9, color: "var(--navy)", letterSpacing: "0.05em" }}>400222</div>
                            <button className="btn btn-navy btn-sm" onClick={() => copyToClipboard("400222", "Paybill")}>
                                {copied === "Paybill" ? "✓ Copied" : "Copy"}
                            </button>
                        </div>
                    </div>

                    <div className="section-header">
                        <div className="overline">Choose One</div>
                        <h2 className="section-title">Account Number</h2>
                        <p className="section-desc">Use the account name that matches your gift when entering the M-Pesa transaction.</p>
                        <div className="gold-line" />
                    </div>

                    <div className="grid-3">
                        {[
                            { name: "Offering", account: "90925#Offering" },
                            { name: "Tithe", account: "90925#Tithe" },
                            { name: "Thanksgiving", account: "90925#Thanksgiving" },
                        ].map(a => (
                            <div key={a.name} className="card" style={{ padding: "2rem", textAlign: "center" }}>
                                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, lineHeight: 1, color: "var(--navy)", marginBottom: "0.5rem" }}>{a.name}</div>
                                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 700, lineHeight: 1, color: "var(--gold-dark)", marginBottom: "1.25rem", letterSpacing: "0.02em" }}>{a.account}</div>
                                <button className="btn btn-gold btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => copyToClipboard(a.account, a.name)}>
                                    {copied === a.name ? "✓ Copied" : "Copy Account Number"}
                                </button>
                            </div>
                        ))}
                    </div>

                    <p style={{ fontSize: "0.85rem", textAlign: "center", color: "var(--gray-400)", marginTop: "2.5rem" }}>
                        All gifts are given directly via Safaricom M-Pesa. God bless you for your generosity.
                    </p>
                </div>
            </div>
        </>
    );
}

const BUSINESS_CATEGORIES = ["Retail & Shops", "Food & Catering", "Services", "Agriculture", "Technology", "Fashion & Beauty", "Transport", "Other"];
const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Volunteer", "Casual"];

// Builds a wa.me deep link so people can reach a job seeker or wanted-post
// author directly — no in-site messaging system or user accounts required.
function whatsappLink(phone, message) {
    const digits = String(phone || "").replace(/\D/g, "");
    const normalized = digits.startsWith("0") ? `254${digits.slice(1)}` : digits;
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

// Users often paste links without a scheme (e.g. "facebook.com/mybiz") — treat
// those as https so the anchor doesn't resolve relative to our own site.
function normalizeUrl(url) {
    const trimmed = String(url || "").trim();
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function PosterLightbox({ src, alt, onClose }) {
    return (
        <div className="poster-viewer-overlay community-poster-viewer" role="presentation" onClick={onClose}>
            <div className="poster-viewer" role="dialog" aria-modal="true" aria-label={alt} onClick={e => e.stopPropagation()}>
                <img src={src} alt={alt} className="poster-viewer-image" loading="eager" decoding="sync" />
                <button className="poster-viewer-close" onClick={onClose} aria-label="Close poster">×</button>
            </div>
        </div>
    );
}

function BusinessListingModal({ open, onClose }) {
    const listing = useFormSubmit(
        "businessListings",
        { businessName: "", ownerName: "", phone: "", showPhone: false, category: BUSINESS_CATEGORIES[0], description: "", websiteUrl: "", mediaType: "none", mediaData: "", mediaUrl: "" },
        ["businessName", "ownerName", "phone", "description"]
    );
    const [mediaError, setMediaError] = useState(null);
    const [mediaBusy, setMediaBusy] = useState(false);

    if (!open) return null;

    const handleClose = () => {
        listing.reset();
        setMediaError(null);
        onClose();
    };

    const handleMediaTypeChange = type => {
        listing.setField("mediaType", type);
        listing.setField("mediaData", "");
        listing.setField("mediaUrl", "");
        setMediaError(null);
    };

    const handlePhotoChange = async e => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) { setMediaError("Please choose an image file."); return; }
        setMediaBusy(true);
        setMediaError(null);
        try {
            listing.setField("mediaData", await compressImage(file));
        } catch (err) {
            setMediaError(err.message || "Couldn't process that image.");
        } finally {
            setMediaBusy(false);
        }
    };

    const handleSubmit = () => {
        if (listing.formData.mediaType === "image" && !listing.formData.mediaData) {
            setMediaError("Upload a photo, or switch to \"No media\".");
            return;
        }
        if (listing.formData.mediaType === "video" && !listing.formData.mediaUrl.trim()) {
            setMediaError("Paste a video link, or switch to \"No media\".");
            return;
        }
        setMediaError(null);
        listing.handleSubmit({ status: "pending" });
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <button className="modal-close" onClick={handleClose} aria-label="Close">✕</button>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 700, lineHeight: 1 }}>List Your Business</div>
                    <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Submissions are reviewed by our team before appearing publicly.</div>
                </div>
                <div className="modal-body">
                    {listing.submitted ? (
                        <p style={{ textAlign: "center", color: "var(--navy)", fontWeight: 600, padding: "1rem 0" }}>
                            ✓ Thanks! Your listing will appear here once approved.
                        </p>
                    ) : (
                        <>
                            <div className="form-group">
                                <label className="form-label">Business Name</label>
                                <input className="form-input" placeholder="e.g. Grace Fresh Produce" value={listing.formData.businessName} onChange={e => listing.setField("businessName", e.target.value)} />
                            </div>
                            <div className="grid-2" style={{ gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label">Owner Name</label>
                                    <input className="form-input" placeholder="Your name" value={listing.formData.ownerName} onChange={e => listing.setField("ownerName", e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input className="form-input" type="tel" inputMode="numeric" maxLength={10} placeholder="07XXXXXXXX or 01XXXXXXXX" value={listing.formData.phone} onChange={e => listing.setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-select" value={listing.formData.category} onChange={e => listing.setField("category", e.target.value)}>
                                    {BUSINESS_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <label style={{ display: "flex", alignItems: "center", gap: "0.55rem", marginBottom: "0.9rem", fontSize: "0.85rem", color: "var(--gray-600)", cursor: "pointer" }}>
                                <input type="checkbox" checked={listing.formData.showPhone} onChange={e => listing.setField("showPhone", e.target.checked)} />
                                Display my phone number publicly on this business listing
                            </label>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-textarea" maxLength={400} placeholder="What does your business offer? (max 400 characters)" value={listing.formData.description} onChange={e => listing.setField("description", e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Website or Social Link (Optional)</label>
                                <input className="form-input" placeholder="e.g. facebook.com/yourbusiness" value={listing.formData.websiteUrl} onChange={e => listing.setField("websiteUrl", e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Photo or Video (Optional)</label>
                                <div className="tab-nav" style={{ marginBottom: "0.75rem" }}>
                                    {[["none", "No Media"], ["image", "Upload Photo"], ["video", "Video Link"]].map(([val, label]) => (
                                        <button key={val} type="button" className={`tab-btn${listing.formData.mediaType === val ? " active" : ""}`} onClick={() => handleMediaTypeChange(val)}>{label}</button>
                                    ))}
                                </div>
                                {listing.formData.mediaType === "image" && (
                                    <>
                                        <label className="btn btn-navy btn-sm" style={{ cursor: mediaBusy ? "not-allowed" : "pointer", opacity: mediaBusy ? 0.6 : 1 }}>
                                            {mediaBusy ? "Processing..." : listing.formData.mediaData ? "✓ Photo Selected — Change" : "Choose Photo"}
                                            <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={mediaBusy} style={{ display: "none" }} />
                                        </label>
                                        {listing.formData.mediaData && (
                                            <img src={listing.formData.mediaData} alt="Preview" style={{ display: "block", marginTop: "0.75rem", maxWidth: "100%", maxHeight: 160, borderRadius: 10 }} />
                                        )}
                                    </>
                                )}
                                {listing.formData.mediaType === "video" && (
                                    <input className="form-input" placeholder="Paste a YouTube, TikTok, or Facebook video link" value={listing.formData.mediaUrl} onChange={e => listing.setField("mediaUrl", e.target.value)} />
                                )}
                            </div>
                            {(mediaError || listing.error) && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{mediaError || listing.error}</p>}
                            <button
                                className="btn btn-gold"
                                style={{ width: "100%", justifyContent: "center" }}
                                disabled={listing.submitting || mediaBusy}
                                onClick={handleSubmit}
                            >
                                {listing.submitting ? "Submitting..." : "Submit for Review →"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function JobPostingModal({ open, onClose }) {
    const posting = useFormSubmit(
        "jobPostings",
        { jobTitle: "", company: "", contactPhone: "", showContactPhone: false, jobType: JOB_TYPES[0], description: "", jobUrl: "", advertType: "image", advertData: "" },
        ["jobTitle", "company", "contactPhone", "description"]
    );
    const [advertError, setAdvertError] = useState(null);
    const [advertBusy, setAdvertBusy] = useState(false);

    if (!open) return null;

    const handleClose = () => {
        posting.reset();
        setAdvertError(null);
        onClose();
    };

    const handleAdvertTypeChange = type => {
        posting.setField("advertType", type);
        posting.setField("advertData", "");
        setAdvertError(null);
    };

    const handleAdvertChange = async e => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setAdvertBusy(true);
        setAdvertError(null);
        try {
            if (posting.formData.advertType === "image") {
                if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
                posting.setField("advertData", await compressImage(file));
            } else {
                if (file.type !== "application/pdf") throw new Error("Please choose a PDF file.");
                posting.setField("advertData", await readPdfAsDataUri(file));
            }
        } catch (err) {
            setAdvertError(err.message || "Couldn't process that file.");
        } finally {
            setAdvertBusy(false);
        }
    };

    const handleSubmit = () => {
        if (!posting.formData.advertData) {
            setAdvertError("Upload your job advert (image or PDF) before submitting.");
            return;
        }
        setAdvertError(null);
        posting.handleSubmit({ status: "pending" });
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <button className="modal-close" onClick={handleClose} aria-label="Close">✕</button>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 700, lineHeight: 1 }}>Post a Job</div>
                    <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Submissions are reviewed by our team before appearing publicly.</div>
                </div>
                <div className="modal-body">
                    {posting.submitted ? (
                        <p style={{ textAlign: "center", color: "var(--navy)", fontWeight: 600, padding: "1rem 0" }}>
                            ✓ Thanks! Your job posting will appear here once approved.
                        </p>
                    ) : (
                        <>
                            <div className="grid-2" style={{ gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label">Job Title</label>
                                    <input className="form-input" placeholder="e.g. Sales Assistant" value={posting.formData.jobTitle} onChange={e => posting.setField("jobTitle", e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Company / Organization</label>
                                    <input className="form-input" placeholder="Company name" value={posting.formData.company} onChange={e => posting.setField("company", e.target.value)} />
                                </div>
                            </div>
                            <div className="grid-2" style={{ gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label">Contact Phone</label>
                                    <input className="form-input" type="tel" inputMode="numeric" maxLength={10} placeholder="07XXXXXXXX or 01XXXXXXXX" value={posting.formData.contactPhone} onChange={e => posting.setField("contactPhone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                                </div>
                            <div className="form-group">
                                <label className="form-label">Job Type</label>
                                <select className="form-select" value={posting.formData.jobType} onChange={e => posting.setField("jobType", e.target.value)}>
                                    {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <label style={{ display: "flex", alignItems: "center", gap: "0.55rem", marginBottom: "0.9rem", fontSize: "0.85rem", color: "var(--gray-600)", cursor: "pointer" }}>
                                <input type="checkbox" checked={posting.formData.showContactPhone} onChange={e => posting.setField("showContactPhone", e.target.checked)} />
                                Display the contact phone number publicly on this job post
                            </label>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-textarea" maxLength={400} placeholder="Role details, requirements, how to apply (max 400 characters)" value={posting.formData.description} onChange={e => posting.setField("description", e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Application Link or Website (Optional)</label>
                                <input className="form-input" placeholder="e.g. yourcompany.com/careers" value={posting.formData.jobUrl} onChange={e => posting.setField("jobUrl", e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Job Advert (Required)</label>
                                <div className="tab-nav" style={{ marginBottom: "0.75rem" }}>
                                    {[["image", "Image Poster"], ["pdf", "PDF Document"]].map(([val, label]) => (
                                        <button key={val} type="button" className={`tab-btn${posting.formData.advertType === val ? " active" : ""}`} onClick={() => handleAdvertTypeChange(val)}>{label}</button>
                                    ))}
                                </div>
                                <label className="btn btn-navy btn-sm" style={{ cursor: advertBusy ? "not-allowed" : "pointer", opacity: advertBusy ? 0.6 : 1 }}>
                                    {advertBusy ? "Processing..." : posting.formData.advertData ? "✓ Advert Selected — Change" : `Choose ${posting.formData.advertType === "pdf" ? "PDF" : "Image"}`}
                                    <input type="file" accept={posting.formData.advertType === "pdf" ? "application/pdf" : "image/*"} onChange={handleAdvertChange} disabled={advertBusy} style={{ display: "none" }} />
                                </label>
                                {posting.formData.advertType === "image" && posting.formData.advertData && (
                                    <img src={posting.formData.advertData} alt="Preview" style={{ display: "block", marginTop: "0.75rem", maxWidth: "100%", maxHeight: 160, borderRadius: 10 }} />
                                )}
                                {posting.formData.advertType === "pdf" && posting.formData.advertData && (
                                    <div style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "var(--navy)", fontWeight: 600 }}>📄 PDF attached</div>
                                )}
                            </div>
                            {(advertError || posting.error) && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{advertError || posting.error}</p>}
                            <button
                                className="btn btn-gold"
                                style={{ width: "100%", justifyContent: "center" }}
                                disabled={posting.submitting || advertBusy}
                                onClick={handleSubmit}
                            >
                                {posting.submitting ? "Submitting..." : "Submit for Review →"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function BusinessCard({ b }) {
    const [lightbox, setLightbox] = useState(false);

    return (
        <div className="card community-card">
            {b.mediaType === "image" && b.mediaData && (
                <img
                    className="advert-preview"
                    src={b.mediaData}
                    alt={b.businessName}
                    onClick={() => setLightbox(true)}
                />
            )}
            <div className="community-card-body">
                <div className="blog-cat">{b.category}</div>
                <div className="blog-title" style={{ marginTop: 6 }}>{b.businessName}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--gray-400)", marginTop: 2 }}>By {b.ownerName}</div>
                <div className="blog-excerpt" style={{ marginTop: 8 }}>{b.description}</div>
                {b.showPhone && b.phone && <a href={`tel:${b.phone}`} className="community-contact">📞 {b.phone}</a>}
                {b.mediaType === "video" && b.mediaUrl && (
                    <a href={normalizeUrl(b.mediaUrl)} target="_blank" rel="noreferrer" className="ministry-link">▶ Watch Video</a>
                )}
                {b.websiteUrl && (
                    <a href={normalizeUrl(b.websiteUrl)} target="_blank" rel="noreferrer" className="ministry-link">Visit Website</a>
                )}
            </div>
            {lightbox && <PosterLightbox src={b.mediaData} alt={b.businessName} onClose={() => setLightbox(false)} />}
        </div>
    );
}

function JobSeekerModal({ open, onClose }) {
    const seeker = useFormSubmit(
        "jobSeekers",
        { name: "", phone: "", desiredRole: "", bio: "", cvData: "" },
        ["name", "phone", "desiredRole", "bio"]
    );
    const [cvError, setCvError] = useState(null);
    const [cvBusy, setCvBusy] = useState(false);

    if (!open) return null;

    const handleClose = () => {
        seeker.reset();
        setCvError(null);
        onClose();
    };

    const handleCvChange = async e => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setCvBusy(true);
        setCvError(null);
        try {
            if (file.type !== "application/pdf") throw new Error("Please choose a PDF file.");
            seeker.setField("cvData", await readPdfAsDataUri(file));
        } catch (err) {
            setCvError(err.message || "Couldn't process that file.");
        } finally {
            setCvBusy(false);
        }
    };

    const handleSubmit = () => {
        if (!seeker.formData.cvData) {
            setCvError("Upload your CV (PDF) before submitting.");
            return;
        }
        setCvError(null);
        seeker.handleSubmit({ status: "pending" });
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <button className="modal-close" onClick={handleClose} aria-label="Close">✕</button>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 700, lineHeight: 1 }}>I'm Looking for a Job</div>
                    <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Submissions are reviewed by our team before appearing publicly.</div>
                </div>
                <div className="modal-body">
                    {seeker.submitted ? (
                        <p style={{ textAlign: "center", color: "var(--navy)", fontWeight: 600, padding: "1rem 0" }}>
                            ✓ Thanks! Your listing will appear here once approved.
                        </p>
                    ) : (
                        <>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input className="form-input" placeholder="Your name" value={seeker.formData.name} onChange={e => seeker.setField("name", e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input className="form-input" type="tel" inputMode="numeric" maxLength={10} placeholder="07XXXXXXXX or 01XXXXXXXX" value={seeker.formData.phone} onChange={e => seeker.setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Desired Role / Field</label>
                                <input className="form-input" placeholder="e.g. Accounting, ICT Support, Any" value={seeker.formData.desiredRole} onChange={e => seeker.setField("desiredRole", e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Bio / Skills</label>
                                <textarea className="form-textarea" maxLength={400} placeholder="Tell employers about your experience and skills (max 400 characters)" value={seeker.formData.bio} onChange={e => seeker.setField("bio", e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">CV (PDF, Required)</label>
                                <label className="btn btn-navy btn-sm" style={{ cursor: cvBusy ? "not-allowed" : "pointer", opacity: cvBusy ? 0.6 : 1 }}>
                                    {cvBusy ? "Processing..." : seeker.formData.cvData ? "✓ CV Selected — Change" : "Choose PDF"}
                                    <input type="file" accept="application/pdf" onChange={handleCvChange} disabled={cvBusy} style={{ display: "none" }} />
                                </label>
                            </div>
                            {(cvError || seeker.error) && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{cvError || seeker.error}</p>}
                            <button
                                className="btn btn-gold"
                                style={{ width: "100%", justifyContent: "center" }}
                                disabled={seeker.submitting || cvBusy}
                                onClick={handleSubmit}
                            >
                                {seeker.submitting ? "Submitting..." : "Submit for Review →"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function WantedModal({ open, onClose }) {
    const wanted = useFormSubmit(
        "wantedPosts",
        { name: "", phone: "", itemWanted: "", description: "" },
        ["name", "phone", "itemWanted", "description"]
    );

    if (!open) return null;

    const handleClose = () => {
        wanted.reset();
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <button className="modal-close" onClick={handleClose} aria-label="Close">✕</button>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 700, lineHeight: 1 }}>I'm Looking for Something</div>
                    <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Submissions are reviewed by our team before appearing publicly.</div>
                </div>
                <div className="modal-body">
                    {wanted.submitted ? (
                        <p style={{ textAlign: "center", color: "var(--navy)", fontWeight: 600, padding: "1rem 0" }}>
                            ✓ Thanks! Your post will appear here once approved.
                        </p>
                    ) : (
                        <>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input className="form-input" placeholder="Your name" value={wanted.formData.name} onChange={e => wanted.setField("name", e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input className="form-input" type="tel" inputMode="numeric" maxLength={10} placeholder="07XXXXXXXX or 01XXXXXXXX" value={wanted.formData.phone} onChange={e => wanted.setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">What Are You Looking For?</label>
                                <input className="form-input" placeholder="e.g. Second-hand laptop, Graphic designer" value={wanted.formData.itemWanted} onChange={e => wanted.setField("itemWanted", e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-textarea" maxLength={400} placeholder="Details — condition, budget, timeline, etc. (max 400 characters)" value={wanted.formData.description} onChange={e => wanted.setField("description", e.target.value)} />
                            </div>
                            {wanted.error && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{wanted.error}</p>}
                            <button
                                className="btn btn-gold"
                                style={{ width: "100%", justifyContent: "center" }}
                                disabled={wanted.submitting}
                                onClick={() => wanted.handleSubmit({ status: "pending" })}
                            >
                                {wanted.submitting ? "Submitting..." : "Submit for Review →"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function JobSeekerCard({ s }) {
    const [expanded, setExpanded] = useState(false);
    const canExpand = (s.bio || "").length > 130;

    return (
        <div className="card community-card">
            <div className="community-card-body">
                <div className="blog-cat">{s.desiredRole}</div>
                <div className="blog-title" style={{ marginTop: 6 }}>{s.name}</div>
                <div className={`blog-excerpt${expanded ? "" : " desc-clamp-3"}`} style={{ marginTop: 8 }}>{s.bio}</div>
                {canExpand && (
                    <button className="read-more-btn" onClick={() => setExpanded(!expanded)}>
                        {expanded ? "Show Less" : "Read More"} →
                    </button>
                )}
                {s.cvData && (
                    <a className="ministry-link" href={s.cvData} download={`${(s.name || "cv").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`}>📄 Download CV</a>
                )}
                <a
                    className="btn btn-gold btn-sm"
                    style={{ width: "100%", justifyContent: "center" }}
                    href={whatsappLink(s.phone, `Hi ${s.name}, I saw you're looking for work on the ACK St Pauls Youths website and I'd like to connect.`)}
                    target="_blank"
                    rel="noreferrer"
                >
                    💬 Contact on WhatsApp
                </a>
            </div>
        </div>
    );
}

function WantedCard({ w }) {
    const [expanded, setExpanded] = useState(false);
    const canExpand = (w.description || "").length > 130;

    return (
        <div className="card community-card">
            <div className="community-card-body">
                <div className="blog-title">{w.itemWanted}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--gray-400)", marginTop: 2 }}>By {w.name}</div>
                <div className={`blog-excerpt${expanded ? "" : " desc-clamp-3"}`} style={{ marginTop: 8 }}>{w.description}</div>
                {canExpand && (
                    <button className="read-more-btn" onClick={() => setExpanded(!expanded)}>
                        {expanded ? "Show Less" : "Read More"} →
                    </button>
                )}
                <a
                    className="btn btn-gold btn-sm"
                    style={{ width: "100%", justifyContent: "center" }}
                    href={whatsappLink(w.phone, `Hi ${w.name}, I saw you're looking for "${w.itemWanted}" on the ACK St Pauls Youths website and I'd like to connect.`)}
                    target="_blank"
                    rel="noreferrer"
                >
                    💬 Contact on WhatsApp
                </a>
            </div>
        </div>
    );
}

function JobCard({ j }) {
    const [lightbox, setLightbox] = useState(false);
    const downloadName = `${(j.jobTitle || "job-advert").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;

    return (
        <div className="card community-card">
            {j.advertType === "image" && j.advertData && (
                <img
                    className="advert-preview"
                    src={j.advertData}
                    alt={`${j.jobTitle} advert`}
                    onClick={() => setLightbox(true)}
                />
            )}
            <div className="community-card-body">
                <div className="blog-cat">{j.jobType}</div>
                <div className="blog-title" style={{ marginTop: 6 }}>{j.jobTitle}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--gray-400)", marginTop: 2 }}>{j.company}</div>
                <div className="blog-excerpt" style={{ marginTop: 8 }}>{j.description}</div>
                {j.showContactPhone && j.contactPhone && <a href={`tel:${j.contactPhone}`} className="community-contact">📞 {j.contactPhone}</a>}
                {j.jobUrl && (
                    <a href={normalizeUrl(j.jobUrl)} target="_blank" rel="noreferrer" className="ministry-link">🔗 View Full Listing</a>
                )}
                {j.advertType === "pdf" && j.advertData && (
                    <a
                        className="btn btn-gold btn-sm"
                        style={{ width: "100%", justifyContent: "center" }}
                        href={j.advertData}
                        download={downloadName}
                    >
                        ⬇ Download PDF
                    </a>
                )}
            </div>
            {lightbox && <PosterLightbox src={j.advertData} alt={`${j.jobTitle} advert`} onClose={() => setLightbox(false)} />}
        </div>
    );
}

function CommunityPage({ initialTab, showTabs = true }) {
    const initialForm = communityFormFromPath(window.location.pathname);
    const [activeTab, setActiveTab] = useState(() => ({ business: "Business", job: "Jobs", "job-seeker": "JobSeekers", request: "Wanted" }[initialForm] || initialTab || "Business"));
    const [activeForm, setActiveForm] = useState(initialForm);
    const { data: businessData, loading: businessLoading } = useFirebaseCollection("publicBusinessListings");
    const { data: jobData, loading: jobLoading } = useFirebaseCollection("publicJobPostings");
    const { data: jobSeekerData, loading: jobSeekerLoading } = useFirebaseCollection("publicJobSeekers");
    const { data: wantedData, loading: wantedLoading } = useFirebaseCollection("publicWantedPosts");

    const businesses = (businessData || []).slice().sort((a, b) => b.createdAt - a.createdAt);
    const jobs = (jobData || []).slice().sort((a, b) => b.createdAt - a.createdAt);
    const jobSeekers = (jobSeekerData || []).slice().sort((a, b) => b.createdAt - a.createdAt);
    const wantedPosts = (wantedData || []).slice().sort((a, b) => b.createdAt - a.createdAt);

    useEffect(() => {
        const onPopState = () => {
            const form = communityFormFromPath(window.location.pathname);
            setActiveForm(form);
            if (form) setActiveTab({ business: "Business", job: "Jobs", "job-seeker": "JobSeekers", request: "Wanted" }[form]);
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    const openCommunityForm = form => {
        const path = communityFormPath(form);
        if (window.location.pathname !== path) window.history.pushState({}, "", path);
        setActiveForm(form);
        setActiveTab({ business: "Business", job: "Jobs", "job-seeker": "JobSeekers", request: "Wanted" }[form]);
    };

    const closeCommunityForm = () => {
        if (communityFormFromPath(window.location.pathname)) window.history.pushState({}, "", pageToPath("Community"));
        setActiveForm(null);
    };

    return (
        <>
            <div className="page-hero">
                <div className="overline" style={{ color: "var(--gold-light)" }}>Grow Together</div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.75rem, 5vw, 4.5rem)", fontWeight: 700, lineHeight: 0.95, color: "white", marginBottom: "1rem" }}>Community Board</h1>
                <p style={{ color: "rgba(255,255,255,0.85)", maxWidth: 560, margin: "0 auto" }}>
                    A place for our youth to support each other's businesses and share job opportunities. Every listing is reviewed by our team before it goes live.
                </p>
            </div>

            <div className="section section-cream">
                <div className="container">
                    {showTabs && <div className="tab-nav community-tabs">
                        {[
                            ["Business", "Browse Businesses"],
                            ["Wanted", "Request Something"],
                            ["Jobs", "Find Jobs"],
                            ["JobSeekers", "Seek a Job"],
                        ].map(([key, label]) => (
                            <button key={key} className={`tab-btn${activeTab === key ? " active" : ""}`} onClick={() => setActiveTab(key)}>
                                {label}
                            </button>
                        ))}
                    </div>}

                    {activeTab === "Business" && (
                        <>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
                                <div>
                                    <h2 className="section-title" style={{ fontSize: "1.6rem", marginBottom: "0.25rem" }}>Browse Businesses</h2>
                                    <p style={{ color: "var(--gray-600)", fontSize: "0.9rem" }}>Discover and support youth-run businesses in our community.</p>
                                </div>
                                <button className="btn btn-gold" onClick={() => openCommunityForm("business")}>+ List Your Business</button>
                            </div>
                            {businessLoading && <p style={{ color: "var(--gray-400)" }}>Loading…</p>}
                            {!businessLoading && businesses.length === 0 && (
                                <p style={{ textAlign: "center", color: "var(--gray-400)", padding: "2rem 0" }}>No businesses listed yet — be the first to add yours!</p>
                            )}
                            <div className="grid-3">
                                {businesses.map(b => <BusinessCard key={b.id} b={b} />)}
                            </div>
                        </>
                    )}

                    {activeTab === "Jobs" && (
                        <>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
                                <div>
                                    <h2 className="section-title" style={{ fontSize: "1.6rem", marginBottom: "0.25rem" }}>Find Jobs</h2>
                                    <p style={{ color: "var(--gray-600)", fontSize: "0.9rem" }}>Opportunities shared by our community — view or download each advert.</p>
                                </div>
                                <button className="btn btn-gold" onClick={() => openCommunityForm("job")}>+ Post a Job</button>
                            </div>
                            {jobLoading && <p style={{ color: "var(--gray-400)" }}>Loading…</p>}
                            {!jobLoading && jobs.length === 0 && (
                                <p style={{ textAlign: "center", color: "var(--gray-400)", padding: "2rem 0" }}>No job opportunities posted yet — check back soon!</p>
                            )}
                            <div className="grid-3">
                                {jobs.map(j => <JobCard key={j.id} j={j} />)}
                            </div>
                        </>
                    )}

                    {activeTab === "JobSeekers" && (
                        <>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
                                <div>
                                    <h2 className="section-title" style={{ fontSize: "1.6rem", marginBottom: "0.25rem" }}>Seek a Job</h2>
                                    <p style={{ color: "var(--gray-600)", fontSize: "0.9rem" }}>Looking for work? Let employers in our community find you.</p>
                                </div>
                                <button className="btn btn-gold" onClick={() => openCommunityForm("job-seeker")}>+ I'm Looking for a Job</button>
                            </div>
                            {jobSeekerLoading && <p style={{ color: "var(--gray-400)" }}>Loading…</p>}
                            {!jobSeekerLoading && jobSeekers.length === 0 && (
                                <p style={{ textAlign: "center", color: "var(--gray-400)", padding: "2rem 0" }}>No one has posted yet — be the first to let employers know you're available!</p>
                            )}
                            <div className="grid-3">
                                {jobSeekers.map(s => <JobSeekerCard key={s.id} s={s} />)}
                            </div>
                        </>
                    )}

                    {activeTab === "Wanted" && (
                        <>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
                                <div>
                                    <h2 className="section-title" style={{ fontSize: "1.6rem", marginBottom: "0.25rem" }}>Request Something</h2>
                                    <p style={{ color: "var(--gray-600)", fontSize: "0.9rem" }}>Looking for a specific product or service? Post it here.</p>
                                </div>
                                <button className="btn btn-gold" onClick={() => openCommunityForm("request")}>+ I'm Looking for Something</button>
                            </div>
                            {wantedLoading && <p style={{ color: "var(--gray-400)" }}>Loading…</p>}
                            {!wantedLoading && wantedPosts.length === 0 && (
                                <p style={{ textAlign: "center", color: "var(--gray-400)", padding: "2rem 0" }}>No requests posted yet — be the first to post what you're looking for!</p>
                            )}
                            <div className="grid-3">
                                {wantedPosts.map(w => <WantedCard key={w.id} w={w} />)}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <BusinessListingModal open={activeForm === "business"} onClose={closeCommunityForm} />
            <JobPostingModal open={activeForm === "job"} onClose={closeCommunityForm} />
            <JobSeekerModal open={activeForm === "job-seeker"} onClose={closeCommunityForm} />
            <WantedModal open={activeForm === "request"} onClose={closeCommunityForm} />
        </>
    );
}

function TestimonyCard({ t }) {
    const [expanded, setExpanded] = useState(false);
    const words = t.story.trim().split(/\s+/);
    const isLong = words.length > 80;
    const displayText = expanded || !isLong ? t.story : words.slice(0, 80).join(" ") + "…";

    return (
        <div className="card blog-card">
            <div className="blog-content">
                <div className="blog-cat">{t.category}</div>
                <div className="blog-title">{t.title}</div>
                <div className="blog-excerpt">{displayText}</div>
                {isLong && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        style={{ background: "none", border: "none", padding: 0, marginTop: "0.5rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: "var(--gold-dark)" }}
                    >
                        {expanded ? "Show Less" : "Read More"} →
                    </button>
                )}
                <div className="blog-meta">
                    <span>{t.name || "Anonymous"}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
            </div>
        </div>
    );
}

function TestimoniesPage() {
    const { data: testimonies, loading, error } = useFirebaseCollection("publicTestimonies");
    const testimony = useFormSubmit(
        "testimonies",
        { name: "", category: "Testimony / Personal Story", title: "", story: "" },
        ["title", "story"]
    );

    const sortedTestimonies = (testimonies || []).slice().sort((a, b) => b.createdAt - a.createdAt);
    const [storyError, setStoryError] = useState(null);

    const handleTestimonySubmit = () => {
        if (testimony.formData.story.trim().length < 50) {
            setStoryError("Please share at least 50 characters so your story can be reviewed.");
            return;
        }
        setStoryError(null);
        testimony.handleSubmit({ status: "pending" });
    };

    return (
        <>
            <div className="page-hero">
                <div className="overline" style={{ color: "var(--gold-light)" }}>Word & Wisdom</div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.75rem, 5vw, 4.5rem)", fontWeight: 700, lineHeight: 0.95, color: "white", marginBottom: "1rem" }}>Testimonies</h1>
                <p style={{ color: "rgba(255,255,255,0.8)", maxWidth: 520, margin: "0 auto" }}>Real stories of what God is doing in the lives of our members — shared to encourage and inspire.</p>
            </div>
            <div className="section section-cream">
                <div className="container">
                    {loading && (
                        <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--gray-400)" }}>Loading testimonies…</div>
                    )}
                    {!loading && error && (
                        <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--gray-400)" }}>Couldn't load testimonies right now. Please check back soon.</div>
                    )}
                    {!loading && !error && sortedTestimonies.length === 0 && (
                        <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--gray-400)" }}>No testimonies published yet — be the first to share what God has done!</div>
                    )}
                    {!loading && !error && sortedTestimonies.length > 0 && (
                        <div className="grid-3" style={{ marginBottom: "3rem" }}>
                            {sortedTestimonies.map(t => (
                                <TestimonyCard key={t.id} t={t} />
                            ))}
                        </div>
                    )}

                    <div className="section-header">
                        <div className="overline">Share Your Story</div>
                        <h2 className="section-title">Submit a Testimony</h2>
                        <p className="section-desc">Has God done something remarkable in your life? Your story could inspire thousands. Submissions are reviewed by our team before appearing on the site.</p>
                        <div className="gold-line" />
                    </div>
                    <div className="card" style={{ padding: "2.5rem", maxWidth: 650, margin: "0 auto" }}>
                        {testimony.submitted ? (
                            <p style={{ textAlign: "center", color: "var(--navy)", fontWeight: 600, padding: "1rem 0" }}>✓ Thank you for sharing! Your testimony has been submitted and will appear once approved.</p>
                        ) : (
                            <>
                                <div className="form-group"><label className="form-label">Your Name (Optional)</label><input className="form-input" placeholder="Your full name" value={testimony.formData.name} onChange={e => testimony.setField("name", e.target.value)} /></div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select className="form-select" value={testimony.formData.category} onChange={e => testimony.setField("category", e.target.value)}>
                                        <option>Testimony / Personal Story</option>
                                        <option>Devotional Article</option>
                                        <option>Scripture Reflection</option>
                                        <option>Youth Experience</option>
                                    </select>
                                </div>
                                <div className="form-group"><label className="form-label">Title</label><input className="form-input" placeholder="Give your story a compelling title" value={testimony.formData.title} onChange={e => testimony.setField("title", e.target.value)} /></div>
                                <div className="form-group"><label className="form-label">Your Story</label><textarea className="form-textarea" style={{ minHeight: 150 }} placeholder="Share what God has done in your life... (minimum 50 characters)" value={testimony.formData.story} onChange={e => { testimony.setField("story", e.target.value); setStoryError(null); }} /></div>
                                {(testimony.error || storyError) && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{testimony.error || storyError}</p>}
                                <button className="btn btn-gold" style={{ width: "100%", justifyContent: "center" }} disabled={testimony.submitting} onClick={handleTestimonySubmit}>
                                    {testimony.submitting ? "Submitting..." : "Submit Story →"}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
