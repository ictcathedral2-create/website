import { useState, useEffect, useRef, useMemo } from "react";
import { useFormSubmit } from "./hooks/useFormSubmit";
import { useFirebaseCollection } from "./hooks/useFirebaseCollection";
import { useYouTubeVideos } from "./hooks/useYouTubeVideos";
import { validateEmail, validatePhone } from "./validation";
import { compressImage, readPdfAsDataUri } from "./utils/fileToDataUri";
import SupportWidget from "./components/SupportWidget";
import logo from "./assets/logo.png";

const NAV_LINKS = ["Home", "Ministries", "Sermons", "Events", "Connect", "Give", "Community", "Testimonies", "About"];

const slugify = str => str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Maps a page name to its URL path (e.g. "Home" -> "/home") and back, so every
// page has a real, shareable, bookmarkable, refreshable URL instead of hidden state.
const pageToPath = page => `/${slugify(page)}`;
const pageFromPath = pathname => {
    const slug = pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
    return NAV_LINKS.find(p => slugify(p) === slug) || "Home";
};

export const styles = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'Manrope', Arial, sans-serif;
  --gold: #C9A84C;
  --gold-light: #F0D98A;
  --gold-dark: #9A7830;
  --navy: #0E2044;
  --navy-mid: #1A3660;
  --orange: #E07330;
  --cream: #FDF8F0;
  --white: #ffffff;
  --gray-100: #F5F5F0;
  --gray-200: #E8E4DC;
  --gray-400: #A0998A;
  --gray-600: #6B6358;
  --gray-800: #3A3530;
}

html { font-size: 16px; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body { font-family: var(--font-body); font-size: 1rem; font-weight: 400; line-height: 1.6; letter-spacing: 0.005em; background: var(--white); color: var(--gray-800); overflow-x: hidden; }
button, input, select, textarea { font: inherit; }
.font-display { font-family: var(--font-display); }

.dark-mode { background: #0A0F1E !important; color: #E8E4DC !important; }
.dark-mode nav { background: rgba(10,15,30,0.97) !important; border-bottom: 1px solid rgba(201,168,76,0.2) !important; }
.dark-mode .nav-link { color: #C8C0B4 !important; }
.dark-mode .nav-link:hover { color: var(--gold-light) !important; }
.dark-mode .nav-link.active { color: var(--gold) !important; }
.dark-mode .logo-text { color: #E8E4DC !important; }
.dark-mode .section-light { background: #0D1529 !important; }
.dark-mode .section-cream { background: #111826 !important; }
.dark-mode .card { background: #131D35 !important; border-color: rgba(201,168,76,0.15) !important; }
.dark-mode .section-title { color: #E8E4DC !important; }
.dark-mode .section-desc { color: #A0A8B8 !important; }
.dark-mode .overline { color: var(--gold) !important; }
.dark-mode .form-label { color: #C8C0B4 !important; }
.dark-mode .form-input,
.dark-mode .form-select,
.dark-mode .form-textarea { background: #1A2540 !important; border-color: rgba(201,168,76,0.25) !important; color: #E8E4DC !important; }
.dark-mode .ministry-title,
.dark-mode .sermon-title,
.dark-mode .blog-title,
.dark-mode .event-title,
.dark-mode .team-name { color: #E8E4DC !important; }
.dark-mode .ministry-desc,
.dark-mode .sermon-pastor,
.dark-mode .blog-excerpt,
.dark-mode .event-desc,
.dark-mode .team-bio { color: #A0A8B8 !important; }
.dark-mode .footer { background: #050A14 !important; }

nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  background: rgba(255,255,255,0.97);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(201,168,76,0.2);
  box-shadow: 0 0 0 rgba(14,32,68,0);
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}
nav.scrolled { box-shadow: 0 6px 24px rgba(14,32,68,0.08); border-bottom-color: rgba(201,168,76,0.3); }
.dark-mode nav.scrolled { box-shadow: 0 6px 24px rgba(0,0,0,0.35) !important; }

.nav-inner {
  max-width: 1280px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 2rem; height: 70px;
}

.nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; transition: opacity 0.2s ease; }
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
.logo-text { font-family: var(--font-display); font-size: 1.14rem; font-weight: 700; color: var(--navy); line-height: 0.95; letter-spacing: 0.01em; }
.logo-sub { font-family: var(--font-body); font-size: 0.64rem; font-weight: 700; color: var(--gold); letter-spacing: 0.1em; text-transform: uppercase; }

.nav-links { display: flex; gap: 0.25rem; align-items: center; }
.nav-link {
  position: relative;
  padding: 0.5rem 0.8rem; border-radius: 7px;
  font-size: 0.8rem; font-weight: 600; letter-spacing: 0.01em; color: var(--navy);
  text-decoration: none; transition: color 0.2s ease;
  cursor: pointer; background: none; border: none;
  display: inline-flex; align-items: center;
}
.nav-links .nav-link::after {
  content: ''; position: absolute; left: 0.8rem; right: 0.8rem; bottom: 3px;
  height: 2px; border-radius: 2px;
  background: linear-gradient(90deg, var(--gold), var(--gold-dark));
  transform: scaleX(0); transform-origin: center;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-link:hover { color: var(--gold-dark); }
.nav-links .nav-link:hover::after { transform: scaleX(0.55); }
.nav-link.active { color: var(--gold-dark); font-weight: 600; }
.nav-links .nav-link.active::after { transform: scaleX(1); }

.nav-item { position: relative; display: inline-flex; }
.nav-caret { display: inline-block; font-size: 0.6rem; margin-left: 4px; opacity: 0.55; transition: transform 0.25s ease, opacity 0.2s ease; }
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
  background: white; border-radius: 12px;
  box-shadow: 0 16px 40px rgba(14,32,68,0.16);
  border: 1px solid rgba(201,168,76,0.15);
  min-width: 230px; padding: 0.5rem; display: flex; flex-direction: column; gap: 2px;
}
.nav-dropdown-item {
  display: block; width: 100%; text-align: left; padding: 0.6rem 0.85rem; border-radius: 8px;
  font-size: 0.8rem; font-weight: 600; letter-spacing: 0.01em; color: var(--navy); background: none; border: none; cursor: pointer;
  transition: all 0.15s;
}
.nav-dropdown-item:hover { background: rgba(201,168,76,0.1); color: var(--gold-dark); }
.dark-mode .nav-dropdown-inner { background: #131D35 !important; border-color: rgba(201,168,76,0.15) !important; }
.dark-mode .nav-dropdown-item { color: #E8E4DC !important; }
.dark-mode .nav-dropdown-item:hover { background: rgba(201,168,76,0.12) !important; color: var(--gold-light) !important; }

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
  border-bottom: 1px solid var(--gray-200);
}
.mobile-submenu-item:hover { color: var(--gold-dark); }
.dark-mode .mobile-submenu-item { color: #A0A8B8 !important; border-bottom-color: rgba(201,168,76,0.15) !important; }
.dark-mode .mobile-submenu-item:hover { color: var(--gold-light) !important; }

.nav-cta {
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  color: white; padding: 0.42rem 1.05rem; border-radius: 8px;
  font-size: 0.78rem; font-weight: 700; letter-spacing: 0.03em; border: none; cursor: pointer;
  transition: all 0.2s; box-shadow: 0 2px 12px rgba(201,168,76,0.35);
}
.nav-cta:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(201,168,76,0.5); }

.mobile-menu-btn { display: none; background: none; border: none; cursor: pointer; padding: 0.5rem; }
.hamburger { width: 24px; height: 2px; background: var(--navy); display: block; position: relative; transition: all 0.3s; }
.hamburger::before, .hamburger::after { content: ''; position: absolute; width: 24px; height: 2px; background: var(--navy); transition: all 0.3s; }
.hamburger::before { top: -7px; }
.hamburger::after { top: 7px; }

.mobile-drawer {
  display: none; position: fixed; top: 70px; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.98); backdrop-filter: blur(16px);
  z-index: 999; flex-direction: column; padding: 1.5rem 2rem;
  animation: fadeSlideUp 0.25s ease both;
}
.mobile-drawer.open { display: flex; }
.mobile-drawer .nav-link {
  padding: 1rem 0; font-size: 1rem; font-weight: 700; border-bottom: 1px solid var(--gray-200);
  width: 100%; text-align: left;
}
.dark-mode .mobile-drawer { background: rgba(10,15,30,0.98) !important; }
.dark-mode .mobile-drawer .nav-link { border-bottom-color: rgba(201,168,76,0.15) !important; }

.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 0.65rem 1.5rem; border-radius: 9px;
  font-family: var(--font-body); font-size: 0.82rem; font-weight: 700; letter-spacing: 0.02em;
  cursor: pointer; border: none; transition: all 0.2s ease; text-decoration: none;
}
.btn:active:not(:disabled) { transform: translateY(0) scale(0.97); }
.btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
.btn-gold {
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  color: white; box-shadow: 0 4px 20px rgba(201,168,76,0.4);
}
.btn-gold:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(201,168,76,0.55); }
.btn-outline {
  background: transparent; color: white;
  border: 2px solid rgba(255,255,255,0.7);
}
.btn-outline:hover { background: rgba(255,255,255,0.15); border-color: white; transform: translateY(-2px); }
.btn-navy {
  background: var(--navy); color: white;
  box-shadow: 0 4px 20px rgba(14,32,68,0.3);
}
.btn-navy:hover { background: var(--navy-mid); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(14,32,68,0.4); }
.btn-white {
  background: white; color: var(--navy);
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
}
.btn-white:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.2); }
.btn-sm { padding: 0.45rem 1.1rem; font-size: 0.74rem; }
a.footer-link:focus-visible, .nav-link:focus-visible, .social-btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

/* ─── HERO ─── */
.hero {
  min-height: 100vh; position: relative; overflow: hidden;
  display: flex; align-items: center;
  background: linear-gradient(160deg, #0E2044 0%, #1A3660 40%, #2A4A80 70%, #0E2044 100%);
}

.hero-pattern {
  position: absolute; inset: 0;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(201,168,76,0.12) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(224,115,48,0.1) 0%, transparent 40%),
    radial-gradient(circle at 60% 80%, rgba(201,168,76,0.08) 0%, transparent 40%);
}

.hero-cross-bg {
  position: absolute; right: -5%; top: 50%; transform: translateY(-50%);
  width: 55%; height: 90%; opacity: 0.04;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300'%3E%3Crect x='85' y='0' width='30' height='300' fill='white'/%3E%3Crect x='0' y='90' width='200' height='30' fill='white'/%3E%3C/svg%3E") center/contain no-repeat;
}

.hero-wave { position: absolute; left: 0; right: 0; bottom: -1px; width: 100%; height: 44px; z-index: 3; display: block; }
.hero-wave-fill { fill: var(--cream); }
.dark-mode .hero-wave-fill { fill: #111826; }

.hero-content {
  position: relative; z-index: 2;
  max-width: 1280px; margin: 0 auto; padding: 8rem 2rem 5rem;
  display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;
}

.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(201,168,76,0.15); border: 1px solid rgba(201,168,76,0.4);
  padding: 0.45rem 1rem; border-radius: 50px;
  font-size: 0.78rem; font-weight: 600; color: var(--gold-light);
  letter-spacing: 0.1em; text-transform: uppercase;
  margin-bottom: 1.5rem;
  animation: fadeSlideUp 0.6s ease both;
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.7rem, 5vw, 4.8rem);
  font-weight: 700; line-height: 0.96; letter-spacing: -0.015em; color: white;
  margin-bottom: 1.5rem;
  animation: fadeSlideUp 0.7s 0.1s ease both;
}

.hero-title span { color: var(--gold); }
.hero-desc {
  font-size: clamp(1rem, 1.4vw, 1.12rem); line-height: 1.8; color: rgba(255,255,255,0.8);
  margin-bottom: 2.5rem; max-width: 520px;
  animation: fadeSlideUp 0.7s 0.2s ease both;
}

.hero-btns { display: flex; gap: 1rem; flex-wrap: wrap; animation: fadeSlideUp 0.7s 0.3s ease both; }

.hero-stats {
  display: flex; gap: 2.5rem; margin-top: 3rem;
  animation: fadeSlideUp 0.7s 0.4s ease both;
}
.hero-stat-num { font-family: var(--font-display); font-size: 2.4rem; font-weight: 700; line-height: 0.95; color: var(--gold); }
.hero-stat-label { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.04em; color: rgba(255,255,255,0.65); margin-top: 4px; }

.hero-visual {
  position: relative; animation: fadeSlideLeft 0.8s 0.2s ease both;
}

.service-card {
  background: rgba(255,255,255,0.07); backdrop-filter: blur(16px);
  border: 1px solid rgba(201,168,76,0.25); border-radius: 20px;
  padding: 2rem; color: white;
}

.service-times-grid { display: grid; gap: 1rem; margin-top: 1.25rem; }
.service-time-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.85rem 1rem; background: rgba(255,255,255,0.07);
  border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
}
.service-time-name { font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.75); }
.service-time-val { font-size: 0.84rem; font-weight: 700; color: var(--gold-light); }

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

/* Keep posters inside a stable desktop frame so portrait uploads cannot stretch the hero. */
@media (min-width: 641px) {
  .poster-frame { height: clamp(300px, 31vw, 420px); }
  .poster-flip, .poster-empty { height: 100%; }
  .poster-image { width: 100%; height: 100%; object-fit: contain; object-position: center; background: rgba(0,0,0,0.16); }
}

.poster-viewer-overlay {
  position: fixed; inset: 0; z-index: 3000; padding: 2rem;
  display: grid; place-items: center; background: rgba(5,10,20,0.9); backdrop-filter: blur(8px);
  animation: fadeSlideUp 0.2s ease both;
}
.poster-viewer { position: relative; width: fit-content; max-width: 100%; max-height: 100%; }
.poster-viewer-image { display: block; max-width: 100%; max-height: calc(100vh - 4rem); object-fit: contain; border-radius: 16px; background: #050A14; box-shadow: 0 24px 80px rgba(0,0,0,0.45); }
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
  background: rgba(224,115,48,0.15); border: 1px solid rgba(224,115,48,0.4);
  padding: 0.5rem 1rem; border-radius: 50px;
  font-size: 0.8rem; font-weight: 700; color: var(--orange); text-transform: uppercase; letter-spacing: 0.08em;
}
.happening-now-badge::before {
  content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--orange);
  animation: urgentBlink 1s ease-in-out infinite;
}

.countdown-section {
  margin-top: 1.5rem; padding-top: 1.5rem;
  border-top: 1px solid rgba(201,168,76,0.2);
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
  text-align: center; background: rgba(201,168,76,0.15); border-radius: 8px; padding: 0.75rem 0.5rem;
  border: 1px solid rgba(201,168,76,0.3);
}
.countdown-num { font-family: var(--font-display); font-size: 1.9rem; font-weight: 700; line-height: 0.9; color: var(--gold-light); }
.countdown-unit-label { font-size: 0.6rem; text-transform: uppercase; color: rgba(255,255,255,0.5); letter-spacing: 0.08em; }

/* ─── SECTIONS ─── */
.section { padding: 5rem 2rem; }
.section-sm { padding: 3rem 2rem; }
.section-light { background: var(--white); }
.section-cream { background: var(--cream); }
.section-navy { background: var(--navy); }
.section-navy-mid { background: var(--navy-mid); }
.container { max-width: 1280px; margin: 0 auto; }
.container-sm { max-width: 900px; margin: 0 auto; }

.section-header { text-align: center; margin-bottom: 3.5rem; }
.overline {
  display: inline-block;
  font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.15em;
  color: var(--gold-dark); margin-bottom: 0.75rem;
}
.section-title {
  font-family: var(--font-display);
  font-size: clamp(2.25rem, 3.5vw, 3.65rem);
  font-weight: 700; color: var(--navy); line-height: 0.98; letter-spacing: -0.01em;
  margin-bottom: 1rem;
}
.section-title.white { color: white; }
.section-desc { font-size: clamp(0.98rem, 1.2vw, 1.08rem); color: var(--gray-600); line-height: 1.8; max-width: 640px; margin: 0 auto; }
.section-desc.white { color: rgba(255,255,255,0.75); }
.gold-line { width: 60px; height: 3px; background: linear-gradient(90deg, var(--gold), var(--gold-dark)); border-radius: 2px; margin: 1rem auto 0; }

/* ─── CARDS ─── */
.card {
  background: white; border-radius: 16px;
  border: 1px solid rgba(201,168,76,0.12);
  box-shadow: 0 2px 20px rgba(14,32,68,0.06);
  transition: all 0.3s ease; overflow: hidden;
  position: relative;
}
.card::after {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, var(--gold), var(--gold-dark));
  transform: scaleX(0); transform-origin: left; transition: transform 0.3s ease;
}
.card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(14,32,68,0.12); border-color: rgba(201,168,76,0.3); }
.card:hover::after { transform: scaleX(1); }

.grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
.grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
.grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }

/* ─── ABOUT ─── */
.about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
.about-image-mock {
  position: relative; border-radius: 20px; overflow: hidden;
  background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%);
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
  background: var(--cream); border: 1px solid rgba(201,168,76,0.25);
  padding: 0.6rem 1.2rem; border-radius: 50px; margin: 0.35rem;
  font-size: 0.85rem; font-weight: 500; color: var(--navy);
}
.value-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gold); }

/* ─── TEAM ─── */
.team-card { text-align: center; padding: 2rem 1.5rem; }
.team-avatar {
  width: 100px; height: 100px; border-radius: 50%;
  background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 2.45rem; font-weight: 700;
  color: var(--gold); margin: 0 auto 1.25rem;
  border: 3px solid var(--gold-light);
  box-shadow: 0 4px 20px rgba(201,168,76,0.25);
}
.team-name { font-family: var(--font-display); font-size: 1.45rem; font-weight: 700; line-height: 1; color: var(--navy); }
.team-role { font-size: 0.82rem; color: var(--gold-dark); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }
.team-bio { font-size: 0.9rem; color: var(--gray-600); line-height: 1.7; margin-top: 0.75rem; }

/* ─── MINISTRY CARDS ─── */
.ministry-card { padding: 2rem; }
.ministry-icon {
  width: 56px; height: 56px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem; margin-bottom: 1.25rem;
}
.ministry-title { font-family: var(--font-display); font-size: 1.45rem; font-weight: 700; line-height: 1; color: var(--navy); margin-bottom: 0.7rem; }
.ministry-desc { font-size: 0.9rem; color: var(--gray-600); line-height: 1.7; }
.ministry-link { font-size: 0.82rem; font-weight: 600; color: var(--gold-dark); margin-top: 1rem; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; text-decoration: none; }
.ministry-card-full {
  padding: 2.5rem 2rem; display: flex; flex-direction: column; align-items: center;
  position: relative; overflow: hidden;
}
.ministry-card-full::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
  background: linear-gradient(90deg, var(--gold), var(--gold-dark));
}
.ministry-card-full .ministry-icon {
  border-radius: 50%; border: 2px solid rgba(201,168,76,0.3);
}
.ministry-link:hover { color: var(--gold); }

/* ─── SERMONS ─── */
.sermon-card { overflow: hidden; }
.sermon-thumb {
  height: 180px; background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%);
  display: flex; align-items: center; justify-content: center; position: relative;
}
.play-btn {
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--gold); display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(201,168,76,0.5);
}
.play-btn:hover { transform: scale(1.1); }
.sermon-content { padding: 1.25rem; }
.sermon-tag { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--gold-dark); font-weight: 700; }
.sermon-title { font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; color: var(--navy); margin-top: 0.5rem; line-height: 1.05; }
.sermon-pastor { font-size: 0.82rem; color: var(--gray-400); margin-top: 0.4rem; }

/* ─── EVENTS ─── */
.event-card { display: flex; gap: 1.5rem; padding: 1.5rem; align-items: center; }
.event-date-block {
  width: 64px; min-width: 64px; padding: 0.65rem 0.4rem; background: var(--navy);
  border: 1px solid rgba(201,168,76,0.28);
  border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-family: var(--font-display); color: white; flex-shrink: 0;
}
.event-day { font-size: 1.5rem; font-weight: 700; line-height: 1; color: var(--gold); }
.event-month {
  font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.14em; opacity: 0.85;
  margin-top: 5px; padding-top: 5px; width: 100%; text-align: center;
  border-top: 1px solid rgba(255,255,255,0.18);
}
.event-title { font-family: var(--font-display); font-size: 1.35rem; font-weight: 700; line-height: 1.05; color: var(--navy); display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.event-meta { font-size: 0.82rem; color: var(--gray-400); margin-top: 4px; }
.event-desc { font-size: 0.9rem; color: var(--gray-600); margin-top: 0.4rem; line-height: 1.65; }

.event-date-block.urgent { background: var(--orange); animation: urgentGlow 1.4s ease-in-out infinite; }
.event-date-block.urgent .event-day { color: white; }
@keyframes urgentGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(224,115,48,0.6); }
  50% { box-shadow: 0 0 0 9px rgba(224,115,48,0); }
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
.btn-ghost-navy { background: transparent; color: var(--navy); border: 1.5px solid rgba(14,32,68,0.22); }
.btn-ghost-navy:hover { background: rgba(14,32,68,0.06); border-color: var(--navy); transform: translateY(-2px); }
.dark-mode .btn-ghost-navy { color: #E8E4DC !important; border-color: rgba(255,255,255,0.25) !important; }
.dark-mode .btn-ghost-navy:hover { background: rgba(255,255,255,0.08) !important; }

.event-form-label { text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.7rem !important; color: var(--gold-dark) !important; font-weight: 700 !important; }

/* ─── STATS ─── */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 2rem; text-align: center; }
.stat-num { font-family: var(--font-display); font-size: 3.65rem; font-weight: 700; color: var(--gold); line-height: 0.9; }
.stat-label { font-size: 0.88rem; color: rgba(255,255,255,0.7); margin-top: 0.5rem; }
.stat-divider { width: 30px; height: 2px; background: var(--gold); margin: 0.75rem auto; border-radius: 2px; }

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
.blog-cat { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; color: var(--gold-dark); }
.blog-title { font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; color: var(--navy); margin-top: 0.5rem; line-height: 1.05; }
.blog-excerpt { font-size: 0.88rem; color: var(--gray-600); margin-top: 0.5rem; line-height: 1.65; }
.blog-meta { font-size: 0.78rem; color: var(--gray-400); margin-top: 0.75rem; display: flex; justify-content: space-between; }

/* ─── FORMS ─── */
.form-group { margin-bottom: 0.9rem; }
.form-label { display: block; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: var(--navy); margin-bottom: 0.35rem; }
.form-input, .form-select, .form-textarea {
  width: 100%; padding: 0.65rem 0.85rem; border-radius: 10px;
  border: 1.5px solid var(--gray-200); font-family: var(--font-body);
  font-size: 0.88rem; font-weight: 500; color: var(--gray-800); outline: none;
  transition: border-color 0.2s; background: white;
}
.form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.12); }
.form-textarea { resize: vertical; min-height: 80px; }

/* ─── GIVING ─── */
.giving-hero {
  background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 50%, var(--gold-dark) 100%);
  padding: 4rem 2rem; text-align: center;
}
.amount-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; margin: 1.5rem 0; }
.amount-btn {
  padding: 0.75rem 1.5rem; border-radius: 10px;
  border: 2px solid rgba(201,168,76,0.4); background: transparent;
  color: var(--gold-light); font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.amount-btn.selected, .amount-btn:hover { background: var(--gold); border-color: var(--gold); color: white; }

/* ─── FOOTER ─── */
.footer {
  position: relative; background: #050A14; color: rgba(255,255,255,0.7);
  padding: 5rem 2rem 2rem; overflow: hidden;
}
.footer::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent);
}
.footer::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(circle at 15% 0%, rgba(201,168,76,0.08) 0%, transparent 45%);
}
.footer-grid {
  position: relative; display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 3rem; max-width: 1280px; margin: 0 auto;
}
.footer-grid > div + div { padding-left: 2.5rem; border-left: 1px solid rgba(255,255,255,0.06); }
.footer-brand-name { font-family: var(--font-display); font-size: 1.75rem; font-weight: 700; line-height: 0.95; color: white; margin-bottom: 0.45rem; letter-spacing: 0.01em; }
.footer-brand-sub { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--gold); }
.footer-desc { font-size: 0.88rem; line-height: 1.8; color: rgba(255,255,255,0.6); margin-top: 1.1rem; max-width: 340px; }
.footer-verse {
  margin-top: 1.5rem; padding: 1.25rem 1.4rem;
  background: rgba(201,168,76,0.08); border-left: 3px solid var(--gold);
  border-radius: 0 10px 10px 0; font-size: 0.85rem; font-style: italic;
  line-height: 1.7; color: rgba(255,255,255,0.75);
}
.footer-verse cite { display: block; font-style: normal; font-weight: 600; color: var(--gold); margin-top: 0.6rem; font-size: 0.75rem; letter-spacing: 0.04em; }
.footer-col-title {
  font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em;
  color: var(--gold); margin-bottom: 1.4rem; padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(201,168,76,0.25); display: inline-block;
}
.footer-link { display: block; font-size: 0.89rem; color: rgba(255,255,255,0.55); text-decoration: none; margin-bottom: 0.75rem; cursor: pointer; transition: all 0.2s; }
.footer-link:hover { color: var(--gold-light); transform: translateX(2px); }
.footer-socials { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
.social-btn {
  width: 38px; height: 38px; border-radius: 10px;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem; color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.2s;
}
.social-btn:hover { background: var(--gold); border-color: var(--gold); color: white; transform: translateY(-2px); }

.footer-contact-row { display: flex; align-items: center; gap: 12px; margin-bottom: 1.1rem; text-decoration: none; cursor: default; }
a.footer-contact-row { cursor: pointer; }
.footer-contact-icon {
  width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
  background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.22);
  display: flex; align-items: center; justify-content: center;
  color: var(--gold-light); transition: all 0.2s;
}
.footer-contact-text { font-size: 0.89rem; color: rgba(255,255,255,0.6); line-height: 1.4; transition: color 0.2s; }
a.footer-contact-row:hover .footer-contact-icon { background: var(--gold); border-color: var(--gold); color: white; transform: translateY(-2px); }
a.footer-contact-row:hover .footer-contact-text { color: var(--gold-light); }

.footer-bottom {
  position: relative; max-width: 1280px; margin: 3.5rem auto 0;
  padding-top: 1.75rem; border-top: 1px solid rgba(255,255,255,0.08);
  display: flex; justify-content: space-between; align-items: center;
  font-size: 0.82rem; color: rgba(255,255,255,0.35);
  flex-wrap: wrap; gap: 1rem;
}

/* ─── SUPPORT WIDGET ─── */
.support-widget {
  position: fixed; bottom: 2rem; right: 2rem; z-index: 900;
}
.support-toggle {
  width: 58px; height: 58px; border-radius: 50%;
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  border: none; cursor: pointer; font-size: 1.4rem;
  box-shadow: 0 4px 25px rgba(201,168,76,0.6);
  transition: all 0.3s; display: flex; align-items: center; justify-content: center;
  color: white; position: relative;
}
.support-toggle:hover { transform: scale(1.08); }
.support-badge {
  position: absolute; top: -4px; right: -4px;
  background: var(--orange); color: white; font-size: 0.68rem; font-weight: 700;
  min-width: 19px; height: 19px; border-radius: 10px; padding: 0 4px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 0 2px white; line-height: 1;
}
.dark-mode .support-badge { box-shadow: 0 0 0 2px #0A0F1E !important; }
.chat-unread-badge {
  background: var(--orange); color: white; font-size: 0.65rem; font-weight: 700;
  min-width: 16px; height: 16px; border-radius: 9px; padding: 0 4px;
  display: inline-flex; align-items: center; justify-content: center; line-height: 1;
}
.support-panel {
  position: absolute; bottom: 70px; right: 0;
  width: 320px; max-height: min(520px, 80vh); display: flex; flex-direction: column;
  background: white; border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  border: 1px solid rgba(201,168,76,0.2);
  overflow: hidden; transform-origin: bottom right;
  transition: all 0.3s; transform: scale(0.8); opacity: 0; pointer-events: none;
}
.support-panel.open { transform: scale(1); opacity: 1; pointer-events: all; }
.dark-mode .support-panel { background: #131D35 !important; }
.support-header { background: linear-gradient(135deg, var(--navy), var(--navy-mid)); padding: 1.1rem 1.25rem; color: white; flex-shrink: 0; }
.support-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; line-height: 1; }
.support-subtitle { font-size: 0.76rem; opacity: 0.7; margin-top: 2px; }
.support-tab-nav { display: flex; border-bottom: 1px solid var(--gray-200); flex-shrink: 0; }
.dark-mode .support-tab-nav { border-color: rgba(201,168,76,0.15) !important; }
.support-tab-btn {
  flex: 1; padding: 0.6rem 0.4rem; border: none; background: transparent; cursor: pointer;
  font-size: 0.72rem; font-weight: 600; color: var(--gray-400); border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.support-tab-btn.active { color: var(--navy); border-bottom-color: var(--gold); }
.dark-mode .support-tab-btn.active { color: var(--gold-light) !important; }
.support-body { padding: 1.1rem; overflow-y: auto; flex: 1; }

/* Chat thread inside the "My Requests" tab */
.chat-request-item {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 0.7rem 0.85rem; border-radius: 10px; border: 1px solid var(--gray-200);
  cursor: pointer; margin-bottom: 0.6rem; text-align: left; width: 100%; background: none;
  font-family: var(--font-body);
}
.dark-mode .chat-request-item { border-color: rgba(201,168,76,0.2) !important; }
.chat-status-pill { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border-radius: 20px; }
.chat-status-pill.new { background: rgba(224,115,48,0.15); color: var(--orange); }
.chat-status-pill.responded { background: rgba(78,150,110,0.15); color: #4E966E; }
.chat-status-pill.closed { background: var(--gray-100); color: var(--gray-400); }
.chat-thread { display: flex; flex-direction: column; gap: 0.6rem; max-height: 260px; overflow-y: auto; margin-bottom: 0.85rem; padding-right: 2px; }
.chat-bubble { max-width: 82%; padding: 0.55rem 0.8rem; border-radius: 12px; font-size: 0.84rem; line-height: 1.45; }
.chat-bubble.user { align-self: flex-end; background: linear-gradient(135deg, var(--gold), var(--gold-dark)); color: white; border-bottom-right-radius: 3px; }
.chat-bubble.admin { align-self: flex-start; background: var(--gray-100); color: var(--gray-800); border-bottom-left-radius: 3px; }
.dark-mode .chat-bubble.admin { background: #1A2540 !important; color: #E8E4DC !important; }
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
.theme-toggle.dark { background: var(--navy); border-color: var(--gold); }
.toggle-thumb {
  position: absolute; width: 16px; height: 16px; border-radius: 50%;
  background: var(--gold-dark); top: 2px; left: 2px; transition: all 0.3s;
}
.theme-toggle.dark .toggle-thumb { left: 22px; background: var(--gold); }

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
  background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%);
  padding: 3.5rem 2rem; text-align: center;
}
.newsletter-form { display: flex; gap: 0.75rem; max-width: 480px; margin: 1.5rem auto 0; flex-wrap: wrap; justify-content: center; }
.newsletter-input { flex: 1; min-width: 220px; padding: 0.85rem 1.25rem; border-radius: 10px; border: 1px solid rgba(201,168,76,0.3); background: rgba(255,255,255,0.1); color: white; font-family: var(--font-body); font-size: 0.9rem; outline: none; }
.newsletter-input::placeholder { color: rgba(255,255,255,0.5); }
.newsletter-input:focus { border-color: var(--gold); }

/* ─── TABS ─── */
.tab-nav { display: flex; gap: 0.25rem; margin-bottom: 2rem; flex-wrap: wrap; background: var(--gray-100); padding: 0.35rem; border-radius: 12px; }
.tab-btn { padding: 0.6rem 1.25rem; border-radius: 9px; font-size: 0.875rem; font-weight: 500; border: none; background: transparent; cursor: pointer; color: var(--gray-600); transition: all 0.2s; }
.tab-btn.active { background: white; color: var(--navy); font-weight: 600; box-shadow: 0 1px 8px rgba(0,0,0,0.08); }

/* ─── EVENT DETAILS MODAL ─── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(14,32,68,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 1.5rem; animation: fadeSlideUp 0.2s ease both;
}
.modal-card {
  background: white; border-radius: 20px; max-width: 440px; width: 100%;
  max-height: 88vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  display: flex; flex-direction: column;
}
.dark-mode .modal-card { background: #131D35 !important; }
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
  background: rgba(201,168,76,0.15); border: 1px solid rgba(201,168,76,0.4);
  border-radius: 12px; padding: 0.5rem 1rem; margin-bottom: 0.75rem;
}
.modal-body { padding: 1.5rem; overflow-y: auto; }
.modal-body p { color: var(--gray-600); line-height: 1.75; font-size: 0.95rem; }
.dark-mode .modal-body p { color: #A0A8B8 !important; }

/* ─── VIDEO MODAL ─── */
.modal-card-video { max-width: 860px; background: #000 !important; position: relative; }
.video-frame-wrap { position: relative; width: 100%; padding-top: 56.25%; background: #000; }
.video-frame-wrap iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }
.modal-video-info { padding: 1.5rem 1.75rem; background: white; }
.dark-mode .modal-video-info { background: #131D35 !important; }
.modal-video-info .modal-title { font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; line-height: 1.05; color: var(--navy); }
.dark-mode .modal-video-info .modal-title { color: #E8E4DC !important; }
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
  .about-grid { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: 1fr 1fr; row-gap: 2.5rem; }
  .footer-grid > div + div { border-left: none; padding-left: 0; }
  .footer-grid > div:nth-child(2) { padding-left: 2.5rem; border-left: 1px solid rgba(255,255,255,0.06); }
  .gallery-grid { grid-template-columns: 1fr 1fr; }
  .gallery-item:nth-child(1) { grid-row: span 1; }
  .featured-sermon-grid { grid-template-columns: 1fr !important; }
}
@media (max-width: 640px) {
  .nav-links { display: none; }
  .mobile-menu-btn { display: flex; align-items: center; gap: 0.75rem; }
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
  .hero-stats { order: 6; gap: 1.5rem; margin-top: 1.5rem; }
  .footer-grid { grid-template-columns: 1fr; }
  .footer-grid > div + div { border-left: none; padding-left: 0; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.06); }
  .event-card { flex-direction: column; gap: 1rem; }
  .support-widget { bottom: 1rem; right: 1rem; }
  .support-toggle { width: 48px; height: 48px; font-size: 1.1rem; }
  .support-panel { width: 280px; }
  .featured-sermon-grid .featured-sermon-thumb { min-height: 200px !important; padding: 1.75rem !important; }
  .featured-sermon-grid .featured-sermon-info { padding: 1.75rem !important; }
  .featured-sermon-grid .featured-sermon-title { font-size: 1.4rem !important; }
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
    { initials: "BK", name: "Brian Kimani", role: "Care Ministry Contact Person", bio: "First point of contact for the Care Ministry, connecting members to support and practical care." },
    { initials: "RM", name: "Rozzie Muthoni", role: "Praise and Worship Contact Person", bio: "First point of contact for the Praise & Worship Ministry, coordinating rehearsals and worship needs." },
];

const MINISTRIES = [
    { icon: "💻", color: "rgba(14,32,68,0.08)", title: "ICT Ministry", desc: "Powering the church's digital presence — livestreaming services, managing sound and media systems, and equipping members with practical ICT skills." },
    { icon: "🎶", color: "rgba(201,168,76,0.12)", title: "Praise & Worship Ministry", desc: "Leading the congregation into God's presence through anointed singing, instrumentation, and prayerful worship in every service." },
    { icon: "❤️", color: "rgba(224,115,48,0.1)", title: "Care Ministry", desc: "Walking alongside members through life's seasons — hospital visits, bereavement support, and practical care for those in need." },
    { icon: "🚪", color: "rgba(14,32,68,0.08)", title: "Ushering Ministry", desc: "Warmly welcoming every visitor and member, maintaining order during services, and ensuring worship flows smoothly from start to finish." },
    { icon: "🙏", color: "rgba(201,168,76,0.1)", title: "Intercessory Ministry", desc: "Standing in the gap through dedicated prayer — covering the church, its leadership, and the community in intercession." },
    { icon: "🎨", color: "rgba(224,115,48,0.08)", title: "Creative Ministry", desc: "Expressing faith through art, drama, dance, and design — bringing creativity and beauty into worship and church communication." },
    { icon: "📖", color: "rgba(14,32,68,0.1)", title: "Pastoral Ministry", desc: "Providing spiritual oversight, discipleship, teaching, and pastoral guidance to nurture the whole church family in Christ." },
];

// Resolves a "day + short month" pair to the nearest upcoming date, rolling to next year once passed.
function resolveEventDate(day, monthAbbr) {
    const now = new Date();
    const monthIndex = new Date(`${monthAbbr} 1, 2000`).getMonth();
    let candidate = new Date(now.getFullYear(), monthIndex, Number(day), 23, 59, 59);
    if (candidate < now) candidate = new Date(now.getFullYear() + 1, monthIndex, Number(day), 23, 59, 59);
    return candidate;
}

const URGENT_THRESHOLD_DAYS = 7;

// Loads admin-managed events from Firebase, sorted soonest-first with an "urgent" flag
// (within URGENT_THRESHOLD_DAYS) computed fresh on every render.
function useEvents() {
    const { data } = useFirebaseCollection("events");
    return useMemo(() => {
        const list = data || [];
        return list
            .map(e => {
                const date = resolveEventDate(e.day, e.month);
                const daysUntil = Math.ceil((date - new Date()) / 86400000);
                return { ...e, date, urgent: daysUntil >= 0 && daysUntil <= URGENT_THRESHOLD_DAYS };
            })
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

function useAnimatedCount(end, trigger) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!trigger) return;
        let start = 0;
        const step = Math.ceil(end / 60);
        const id = setInterval(() => {
            start = Math.min(start + step, end);
            setVal(start);
            if (start >= end) clearInterval(id);
        }, 25);
        return () => clearInterval(id);
    }, [end, trigger]);
    return val;
}

export default function App() {
    const [activePage, setActivePage] = useState(() => pageFromPath(window.location.pathname));
    const [dark, setDark] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(null);
    const [joinUsOpen, setJoinUsOpen] = useState(false);
    const [statsVisible, setStatsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState("Video");
    const [scrolled, setScrolled] = useState(false);
    const statsRef = useRef(null);
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

    const stat1 = useAnimatedCount(350, statsVisible);
    const stat2 = useAnimatedCount(7, statsVisible);
    const stat3 = useAnimatedCount(10, statsVisible);
    const stat4 = useAnimatedCount(800, statsVisible);

    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.4 });
        if (statsRef.current) obs.observe(statsRef.current);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const navigate = (page) => {
        if (window.location.pathname !== pageToPath(page)) window.history.pushState({}, "", pageToPath(page));
        setActivePage(page);
        setMobileMenuOpen(false);
        setMobileSubmenuOpen(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const navigateToAnchor = (page, id) => {
        if (window.location.pathname !== pageToPath(page)) window.history.pushState({}, "", pageToPath(page));
        setActivePage(page);
        setMobileMenuOpen(false);
        setMobileSubmenuOpen(null);
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    };

    // Keeps activePage in sync with the browser's back/forward buttons.
    useEffect(() => {
        const onPopState = () => setActivePage(pageFromPath(window.location.pathname));
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    // Keeps the browser tab title matched to whichever page is showing.
    useEffect(() => {
        document.title = activePage === "Home"
            ? "ACK St Pauls Youths | Youth Ministry in Embu, Kenya"
            : `${activePage} | ACK St Pauls Youths`;
    }, [activePage]);
    const NAV_DROPDOWNS = {
        Ministries: MINISTRIES.map(m => ({ label: m.title, id: slugify(m.title) })),
        Events: events.map(e => ({ label: e.title, id: slugify(e.title) })),
    };

    return (
        <>
            <style>{styles}</style>
            <div className={dark ? "dark-mode" : ""} style={{ minHeight: "100vh" }}>
                {/* ─── NAV ─── */}
                <nav className={scrolled ? "scrolled" : ""}>
                    <div className="nav-inner">
                        <a className="nav-logo" onClick={() => navigate("Home")} style={{ cursor: "pointer" }}>
                            <div className="logo-cross"><img src={logo} alt="ACK St Pauls Cathedral crest" /></div>
                            <div>
                                <div className="logo-text">ACK St Pauls</div>
                                <div className="logo-sub">Youths</div>
                            </div>
                        </a>
                        <div className="nav-links">
                            {NAV_LINKS.map(p => {
                                const dropdown = NAV_DROPDOWNS[p];
                                if (dropdown) {
                                    return (
                                        <div key={p} className="nav-item">
                                            <button className={`nav-link${activePage === p ? " active" : ""}`} onClick={() => navigate(p)}>
                                                {p}<span className="nav-caret">▾</span>
                                            </button>
                                            <div className="nav-dropdown">
                                                <div className="nav-dropdown-inner">
                                                    {dropdown.map(item => (
                                                        <button key={item.id} className="nav-dropdown-item" onClick={() => navigateToAnchor(p, item.id)}>{item.label}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return <button key={p} className={`nav-link${activePage === p ? " active" : ""}`} onClick={() => navigate(p)}>{p}</button>;
                            })}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "0.5rem" }}>
                                <button
                                    className={`theme-toggle${dark ? " dark" : ""}`}
                                    onClick={() => setDark(!dark)}
                                    aria-label="Toggle dark mode"
                                    title={dark ? "Light mode" : "Dark mode"}
                                >
                                    <div className="toggle-thumb" />
                                </button>
                                <button className="nav-cta" onClick={() => setJoinUsOpen(true)}>Join Us</button>
                            </div>
                        </div>
                        <div className="mobile-menu-btn">
                            <button className={`theme-toggle${dark ? " dark" : ""}`} onClick={() => setDark(!dark)} aria-label="Toggle dark mode">
                                <div className="toggle-thumb" />
                            </button>
                            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem", color: dark ? "#E8E4DC" : "var(--navy)" }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                                {mobileMenuOpen ? "✕" : "☰"}
                            </button>
                        </div>
                    </div>
                </nav>

                {/* ─── MOBILE DRAWER ─── */}
                <div className={`mobile-drawer${mobileMenuOpen ? " open" : ""}`}>
                    {NAV_LINKS.map(p => {
                        const dropdown = NAV_DROPDOWNS[p];
                        if (dropdown) {
                            const expanded = mobileSubmenuOpen === p;
                            return (
                                <div key={p} className="mobile-submenu">
                                    <button
                                        className={`nav-link mobile-submenu-toggle${activePage === p ? " active" : ""}`}
                                        onClick={() => setMobileSubmenuOpen(expanded ? null : p)}
                                    >
                                        {p}
                                        <span className={`nav-caret${expanded ? " open" : ""}`}>▾</span>
                                    </button>
                                    <div className={`mobile-submenu-panel${expanded ? " open" : ""}`}>
                                        <button className="mobile-submenu-item" onClick={() => navigate(p)}>View All {p}</button>
                                        {dropdown.map(item => (
                                            <button key={item.id} className="mobile-submenu-item" onClick={() => navigateToAnchor(p, item.id)}>{item.label}</button>
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                        return <button key={p} className={`nav-link${activePage === p ? " active" : ""}`} onClick={() => navigate(p)}>{p}</button>;
                    })}
                    <button className="btn btn-gold" style={{ marginTop: "1rem" }} onClick={() => { setMobileMenuOpen(false); setJoinUsOpen(true); }}>Join Us</button>
                </div>

                {/* ─── PAGES ─── */}
                {activePage === "Home" && <HomePage countdown={countdown} nextEvent={nextEvent} eventPhase={eventPhase} events={events} navigate={navigate} statsRef={statsRef} stat1={stat1} stat2={stat2} stat3={stat3} stat4={stat4} dark={dark} onJoinUs={() => setJoinUsOpen(true)} />}
                {activePage === "About" && <AboutPage navigate={navigate} dark={dark} />}
                {activePage === "Ministries" && <MinistriesPage navigate={navigate} dark={dark} />}
                {activePage === "Sermons" && <SermonsPage navigate={navigate} dark={dark} activeTab={activeTab} setActiveTab={setActiveTab} />}
                {activePage === "Events" && <EventsPage events={events} navigate={navigate} dark={dark} />}
                {activePage === "Connect" && <ConnectPage navigate={navigate} dark={dark} />}
                {activePage === "Give" && <GivePage dark={dark} />}
                {activePage === "Community" && <CommunityPage dark={dark} />}
                {activePage === "Testimonies" && <TestimoniesPage navigate={navigate} dark={dark} />}

                {/* ─── FOOTER ─── */}
                <footer className="footer">
                    <div className="footer-grid">
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                <div className="logo-cross"><img src={logo} alt="ACK St Pauls Cathedral crest" /></div>
                                <div>
                                    <div className="footer-brand-name">ACK St Pauls Youths</div>
                                    <div className="footer-brand-sub">Youth Ministry</div>
                                </div>
                            </div>
                            <div className="footer-desc">A vibrant community of faith-filled youth growing together in Christ, serving Embu and beyond for God's glory.</div>
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
                            {NAV_LINKS.map(l => <div key={l} className="footer-link" onClick={() => navigate(l)}>{l}</div>)}
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
                                <div className="footer-contact-text">Embu Town, Embu, Kenya</div>
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

                <JoinUsModal open={joinUsOpen} onClose={() => setJoinUsOpen(false)} />
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

function HomePage({ countdown, nextEvent, eventPhase, events, navigate, statsRef, stat1, stat2, stat3, stat4, dark, onJoinUs }) {
    const newsletter = useFormSubmit("newsletterSignups", { email: "" }, ["email"]);
    const { videos, loading: videosLoading } = useYouTubeVideos();
    const [activeVideo, setActiveVideo] = useState(null);
    const latestVideo = videos.length > 0 ? videos[videos.length - 1] : null;

    const handleNewsletterSubmit = () => {
        if (!validateEmail(newsletter.formData.email)) return;
        newsletter.handleSubmit({ source: "home" });
    };

    return (
        <>
            {/* HERO */}
            <div className="hero">
                <div className="hero-pattern" />
                <div className="hero-cross-bg" />
                <svg className="hero-wave" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
                    <path className="hero-wave-fill" d="M0,32 C240,60 480,0 720,20 C960,40 1200,58 1440,24 L1440,60 L0,60 Z" />
                </svg>
                <div className="hero-content container">
                    <div className="hero-text-col">
                        <div className="hero-badge">✝ ACK St Paul's Cathedral · Embu</div>
                        <h1 className="hero-title">
                            Where Youth <br className="hero-title-break-1" /><span>Encounter God</span><br />& Change the World
                        </h1>
                        <p className="hero-desc">
                            A generation rising in faith, purpose, and power. Join ACK St Pauls Youths, Embu's most vibrant youth community.
                        </p>
                        <div className="hero-btns">
                            <button className="btn btn-gold" onClick={onJoinUs}>Join Us Today</button>
                            <button className="btn btn-outline" onClick={() => navigate("Sermons")}>▶ Watch Online</button>
                            <button className="btn btn-outline" onClick={() => navigate("Connect")}>Get Connected</button>
                        </div>
                        <div className="hero-stats">
                            <div><div className="hero-stat-num">350+</div><div className="hero-stat-label">Active Youth</div></div>
                            <div><div className="hero-stat-num">7+</div><div className="hero-stat-label">Ministries</div></div>
                            <div><div className="hero-stat-num">10+</div><div className="hero-stat-label">Years of Faith</div></div>
                        </div>
                    </div>
                    <div className="hero-visual animate-float">
                        <div className="service-card">
                            <PosterCarousel />
                            <div className="countdown-section">
                                {!nextEvent ? (
                                    <div style={{ textAlign: "center", padding: "1rem 0" }}>
                                        <div style={{ fontSize: "0.85rem", color: "var(--gold-light)", fontWeight: 600 }}>✨ Stay tuned for our next event!</div>
                                        <button className="btn btn-gold btn-sm" style={{ marginTop: "0.75rem" }} onClick={() => navigate("Events")}>View Upcoming Events</button>
                                    </div>
                                ) : eventPhase === "now" ? (
                                    <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                                        <span className="happening-now-badge">Happening Now</span>
                                        <div style={{ fontSize: "0.85rem", color: "white", fontWeight: 600, marginTop: 10 }}>{nextEvent.title}</div>
                                        <button className="btn btn-gold btn-sm" style={{ marginTop: "0.75rem" }} onClick={() => navigate("Events")}>View Details</button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="countdown-label">{eventPhase === "starting" ? "Starting In" : `Next Up: ${nextEvent.title} In`}</div>
                                        <div className="countdown-grid">
                                            {[["d", "Days"], ["h", "Hrs"], ["m", "Min"], ["s", "Sec"]].map(([k, l]) => (
                                                <div key={k} className="countdown-unit">
                                                    <div className="countdown-num">{String(countdown[k]).padStart(2, "0")}</div>
                                                    <div className="countdown-unit-label">{l}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* THIS SUNDAY */}
            <div className="section-sm section-light">
                <div className="container">
                    <div className="section-header" style={{ marginBottom: "2rem" }}>
                        <div className="overline">This Sunday at ACK St Pauls</div>
                        <h2 className="section-title" style={{ fontSize: "1.6rem" }}>"Rise Up &amp; Shine" <span style={{ color: "var(--gray-400)", fontWeight: 400, fontSize: "0.9rem" }}>· Isaiah 60:1</span></h2>
                    </div>
                    <div className="service-times-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                        {[["Devotion", "8:00 AM"], ["Youth Service", "8:30 AM"], ["Bible Study", "11:00 AM"]].map(([n, t]) => (
                            <div key={n} className="service-time-item" style={{ background: "var(--cream)", border: "1px solid rgba(201,168,76,0.2)" }}>
                                <span className="service-time-name" style={{ color: "var(--gray-600)" }}>{n}</span>
                                <span className="service-time-val" style={{ color: "var(--gold-dark)" }}>{t}</span>
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
                        Whether you're exploring faith for the first time or growing deeper in your walk with Christ, ACK St Pauls Youths is your community. We gather, worship, learn, and serve together — because we are better together.
                    </p>
                    <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}>
                        <button className="btn btn-gold" onClick={() => navigate("About")}>Our Story</button>
                        <button className="btn btn-navy" onClick={() => navigate("Ministries")}>Find Your Ministry</button>
                    </div>
                </div>
            </div>

            {/* STATS */}
            <div className="section section-navy" ref={statsRef}>
                <div className="container">
                    <div className="stats-grid">
                        {[[stat1, "+", "Active Youth Members"], [stat2, "+", "Ministry Programs"], [stat3, "+", "Outreach Events / Year"], [stat4, "+", "Lives Impacted"]].map(([n, s, l], i) => (
                            <div key={i} style={{ textAlign: "center" }}>
                                <div className="stat-num">{n.toLocaleString()}{s}</div>
                                <div className="stat-divider" />
                                <div className="stat-label">{l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* UPCOMING EVENTS */}
            <div className="section section-light">
                <div className="container">
                    <div className="section-header">
                        <div className="overline">What's Coming Up</div>
                        <h2 className="section-title">Upcoming Events</h2>
                        <div className="gold-line" />
                    </div>
                    {events.length === 0 && <p style={{ textAlign: "center", color: "var(--gray-400)" }}>No upcoming events yet — check back soon!</p>}
                    <div className="grid-2">
                        {events.slice(0, 4).map((e, i) => (
                            <div key={i} id={slugify(e.title)} className="card event-card">
                                <div className={`event-date-block${e.urgent ? " urgent" : ""}`}>
                                    <div className="event-day">{e.day}</div>
                                    <div className="event-month">{e.month}</div>
                                </div>
                                <div>
                                    <div className="event-title">{e.title}{e.urgent && <span className="event-urgent-badge">Starting Soon</span>}</div>
                                    <div className="event-meta">📅 {e.time}</div>
                                    <div className="event-desc">{e.desc}</div>
                                    <button className="btn btn-gold btn-sm" style={{ marginTop: "0.75rem" }} onClick={() => navigate("Events")}>Register Now</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ textAlign: "center", marginTop: "2rem" }}>
                        <button className="btn btn-navy" onClick={() => navigate("Events")}>View All Events</button>
                    </div>
                </div>
            </div>

            {/* FEATURED SERMON */}
            <div className="section section-cream">
                <div className="container">
                    <div className="section-header">
                        <div className="overline">Latest Message</div>
                        <h2 className="section-title">Featured Sermon</h2>
                        <div className="gold-line" />
                    </div>
                    {videosLoading && (
                        <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--gray-400)" }}>Loading latest sermon…</div>
                    )}
                    {!videosLoading && !latestVideo && (
                        <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--gray-400)" }}>
                            New sermon uploads will appear here soon.
                            <div style={{ marginTop: "1rem" }}>
                                <button className="btn btn-navy btn-sm" onClick={() => navigate("Sermons")}>Visit Sermons Page</button>
                            </div>
                        </div>
                    )}
                    {!videosLoading && latestVideo && (
                        <div className="featured-sermon-grid" style={{ background: "var(--navy)", borderRadius: 20, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                            <div
                                className="featured-sermon-thumb"
                                style={{
                                    backgroundImage: `linear-gradient(rgba(14,32,68,0.35), rgba(14,32,68,0.45)), url(${latestVideo.thumbnail})`,
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
            <div className="section section-light">
                <div className="container">
                    <div className="section-header">
                        <div className="overline">Get Involved</div>
                        <h2 className="section-title">Our Ministries</h2>
                        <p className="section-desc">Seven vibrant arms of ministry — find where you belong and make your mark for God.</p>
                        <div className="gold-line" />
                    </div>
                    <div className="grid-3">
                        {MINISTRIES.map((m, i) => (
                            <div key={i} className="card ministry-card">
                                <div className="ministry-title">{m.title}</div>
                                <div className="ministry-desc">{m.desc}</div>
                                <div className="ministry-link" onClick={() => navigate("Ministries")}>Learn More →</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

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

function AboutPage({ navigate, dark }) {
    return (
        <>
            <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 50%, var(--gold-dark) 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
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
                        <div className="about-image-mock">
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
                        <div className="card" style={{ padding: "2.5rem", background: "linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%)" }}>
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
                        {TEAM.map((t, i) => (
                            <div key={i} className="card team-card">
                                <div className="team-avatar">{t.initials}</div>
                                <div className="team-name">{t.name}</div>
                                <div className="team-role">{t.role}</div>
                                <div className="team-bio">{t.bio}</div>
                            </div>
                        ))}
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

function MinistriesPage({ navigate, dark }) {
    const [joiningMinistry, setJoiningMinistry] = useState(null);

    return (
        <>
            <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 50%, var(--gold-dark) 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
                <div className="overline" style={{ color: "var(--gold-light)" }}>Get Involved</div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.75rem, 5vw, 4.5rem)", fontWeight: 700, lineHeight: 0.95, color: "white", marginBottom: "1rem" }}>Our Ministries</h1>
                <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.85)", maxWidth: 550, margin: "0 auto" }}>Seven dynamic arms of ministry where every member finds their place, purpose, and calling to serve.</p>
            </div>
            <div className="section section-cream">
                <div className="container">
                    <div className="grid-3">
                        {MINISTRIES.map((m, i) => (
                            <div key={i} id={slugify(m.title)} className="card ministry-card-full">
                                <div className="ministry-title" style={{ fontSize: "1.2rem", textAlign: "center" }}>{m.title}</div>
                                <div className="ministry-desc" style={{ marginTop: "0.6rem", textAlign: "center" }}>{m.desc}</div>
                                <button className="btn btn-gold btn-sm" style={{ marginTop: "1.5rem", width: "100%", justifyContent: "center" }} onClick={() => setJoiningMinistry(m.title)}>
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

            {joiningMinistry && <MinistryJoinModal ministryTitle={joiningMinistry} onClose={() => setJoiningMinistry(null)} />}
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

function SermonsPage({ navigate, dark, activeTab, setActiveTab }) {
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
            <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 50%, var(--gold-dark) 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
                <div className="overline" style={{ color: "var(--gold-light)" }}>The Word</div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.75rem, 5vw, 4.5rem)", fontWeight: 700, lineHeight: 0.95, color: "white", marginBottom: "1rem" }}>Sermons & Media</h1>
                <p style={{ color: "rgba(255,255,255,0.75)", maxWidth: 520, margin: "0 auto" }}>Be transformed by the renewing of your mind — Romans 12:2. Watch our full video library, straight from our YouTube channel.</p>
            </div>
            <div className="section section-cream">
                <div className="container">
                    <div className="tab-nav">
                        {["Video", "Written", "Gallery"].map(t => (
                            <button key={t} className={`tab-btn${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>{t}</button>
                        ))}
                    </div>

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
                                                    backgroundImage: `linear-gradient(rgba(14,32,68,0.35), rgba(14,32,68,0.45)), url(${v.thumbnail})`,
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

function EventsPage({ events, navigate, dark }) {
    const [detailsEvent, setDetailsEvent] = useState(null);
    const registration = useFormSubmit(
        "eventRegistrations",
        { firstName: "", lastName: "", phone: "", eventTitle: "", specialRequirements: "" },
        ["firstName", "lastName", "phone"]
    );

    useEffect(() => {
        if (!registration.formData.eventTitle && events.length) registration.setField("eventTitle", events[0].title);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events]);

    const handleRegisterClick = (eventTitle) => {
        registration.setField("eventTitle", eventTitle);
        document.getElementById("event-registration-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleRegistrationSubmit = () => {
        registration.handleSubmit();
    };

    return (
        <>
            <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 50%, var(--gold-dark) 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
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
                                    <button className="btn btn-gold btn-sm" onClick={() => handleRegisterClick(e.title)}>Register →</button>
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
                                        onClick={() => { handleRegisterClick(detailsEvent.title); setDetailsEvent(null); }}
                                    >
                                        Register for This Event →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="section-header" style={{ marginTop: "4rem" }} id="event-registration-form">
                        <div className="overline">Register Today</div>
                        <h2 className="section-title">Event Registration</h2>
                        <div className="gold-line" />
                    </div>
                    <div className="card" style={{ padding: "2.5rem", maxWidth: 600, margin: "0 auto" }}>
                        {registration.submitted ? (
                            <p style={{ textAlign: "center", color: "var(--navy)", fontWeight: 600, padding: "1rem 0" }}>
                                ✓ You're registered for {registration.formData.eventTitle || "the event"}! We'll be in touch with details.
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
                                    <label className="form-label event-form-label">Select Event</label>
                                    <select className="form-select" value={registration.formData.eventTitle} onChange={e => registration.setField("eventTitle", e.target.value)}>
                                        {events.map((e, i) => <option key={i}>{e.title}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label event-form-label">Special Requirements or Questions</label>
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
        </>
    );
}

function ConnectPage({ navigate, dark }) {
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
            <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 50%, var(--gold-dark) 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
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

function GivePage({ dark }) {
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

// Builds a wa.me deep link so business/job "chat" happens on WhatsApp directly —
// no in-site messaging system or user accounts required.
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
        <div className="modal-overlay" onClick={onClose}>
            <img src={src} alt={alt} className="lightbox-img" onClick={e => e.stopPropagation()} />
            <button className="modal-close lightbox-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
    );
}

function BusinessListingModal({ open, onClose }) {
    const listing = useFormSubmit(
        "businessListings",
        { businessName: "", ownerName: "", phone: "", category: BUSINESS_CATEGORIES[0], description: "", websiteUrl: "", mediaType: "none", mediaData: "", mediaUrl: "" },
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
        { jobTitle: "", company: "", contactPhone: "", jobType: JOB_TYPES[0], description: "", jobUrl: "", advertType: "image", advertData: "" },
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
        <div className="card" style={{ overflow: "hidden" }}>
            {b.mediaType === "image" && b.mediaData && (
                <img
                    src={b.mediaData}
                    alt={b.businessName}
                    style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block", cursor: "pointer" }}
                    onClick={() => setLightbox(true)}
                />
            )}
            <div style={{ padding: "1.75rem" }}>
                <div className="blog-cat">{b.category}</div>
                <div className="blog-title" style={{ marginTop: 6 }}>{b.businessName}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--gray-400)", marginTop: 2 }}>By {b.ownerName}</div>
                <div className="blog-excerpt" style={{ marginTop: 8 }}>{b.description}</div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                    {b.mediaType === "video" && b.mediaUrl && (
                        <a href={b.mediaUrl} target="_blank" rel="noreferrer" className="ministry-link">▶ Watch Video</a>
                    )}
                    {b.websiteUrl && (
                        <a href={normalizeUrl(b.websiteUrl)} target="_blank" rel="noreferrer" className="ministry-link">🔗 Visit Website</a>
                    )}
                </div>
                <a
                    className="btn btn-gold btn-sm"
                    style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }}
                    href={whatsappLink(b.phone, `Hi ${b.businessName}, I found your business on the ACK St Pauls Youths website and I'd like to connect.`)}
                    target="_blank"
                    rel="noreferrer"
                >
                    💬 Chat on WhatsApp
                </a>
            </div>
            {lightbox && <PosterLightbox src={b.mediaData} alt={b.businessName} onClose={() => setLightbox(false)} />}
        </div>
    );
}

function JobCard({ j }) {
    const [lightbox, setLightbox] = useState(false);
    const downloadName = `${(j.jobTitle || "job-advert").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.${j.advertType === "pdf" ? "pdf" : "jpg"}`;
    return (
        <div className="card" style={{ overflow: "hidden" }}>
            {j.advertType === "image" && j.advertData && (
                <img
                    src={j.advertData}
                    alt={`${j.jobTitle} advert`}
                    style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block", cursor: "pointer" }}
                    onClick={() => setLightbox(true)}
                />
            )}
            {j.advertType === "pdf" && j.advertData && (
                <a
                    href={j.advertData}
                    target="_blank"
                    rel="noreferrer"
                    style={{ width: "100%", aspectRatio: "4 / 3", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--gray-100)", textDecoration: "none" }}
                >
                    <span style={{ fontSize: "2.5rem" }}>📄</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--navy)" }}>View PDF Advert</span>
                </a>
            )}
            <div style={{ padding: "1.75rem" }}>
                <div className="blog-cat">{j.jobType}</div>
                <div className="blog-title" style={{ marginTop: 6 }}>{j.jobTitle}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--gray-400)", marginTop: 2 }}>{j.company}</div>
                <div className="blog-excerpt" style={{ marginTop: 8 }}>{j.description}</div>
                {j.jobUrl && (
                    <a href={normalizeUrl(j.jobUrl)} target="_blank" rel="noreferrer" className="ministry-link">🔗 View Full Listing</a>
                )}
                <a
                    className="btn btn-gold btn-sm"
                    style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }}
                    href={j.advertData}
                    download={downloadName}
                >
                    ⬇ Download {j.advertType === "pdf" ? "PDF" : "Poster"}
                </a>
            </div>
            {lightbox && <PosterLightbox src={j.advertData} alt={`${j.jobTitle} advert`} onClose={() => setLightbox(false)} />}
        </div>
    );
}

function CommunityPage({ dark }) {
    const [activeTab, setActiveTab] = useState("Business");
    const [showBusinessForm, setShowBusinessForm] = useState(false);
    const [showJobForm, setShowJobForm] = useState(false);
    const { data: businessData, loading: businessLoading } = useFirebaseCollection("publicBusinessListings");
    const { data: jobData, loading: jobLoading } = useFirebaseCollection("publicJobPostings");

    const businesses = (businessData || []).slice().sort((a, b) => b.createdAt - a.createdAt);
    const jobs = (jobData || []).slice().sort((a, b) => b.createdAt - a.createdAt);

    return (
        <>
            <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 50%, var(--gold-dark) 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
                <div className="overline" style={{ color: "var(--gold-light)" }}>Grow Together</div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.75rem, 5vw, 4.5rem)", fontWeight: 700, lineHeight: 0.95, color: "white", marginBottom: "1rem" }}>Community Board</h1>
                <p style={{ color: "rgba(255,255,255,0.85)", maxWidth: 560, margin: "0 auto" }}>
                    A place for our youth to support each other's businesses and share job opportunities. Every listing is reviewed by our team before it goes live.
                </p>
            </div>

            <div className="section section-cream">
                <div className="container">
                    <div className="tab-nav">
                        {["Business", "Jobs"].map(t => (
                            <button key={t} className={`tab-btn${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
                                {t === "Business" ? "Business Directory" : "Job Board"}
                            </button>
                        ))}
                    </div>

                    {activeTab === "Business" && (
                        <>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
                                <div>
                                    <h2 className="section-title" style={{ fontSize: "1.6rem", marginBottom: "0.25rem" }}>Business Directory</h2>
                                    <p style={{ color: "var(--gray-600)", fontSize: "0.9rem" }}>Support youth-run businesses and connect directly on WhatsApp.</p>
                                </div>
                                <button className="btn btn-gold" onClick={() => setShowBusinessForm(true)}>+ List Your Business</button>
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
                                    <h2 className="section-title" style={{ fontSize: "1.6rem", marginBottom: "0.25rem" }}>Job Board</h2>
                                    <p style={{ color: "var(--gray-600)", fontSize: "0.9rem" }}>Opportunities shared by our community — view or download each advert.</p>
                                </div>
                                <button className="btn btn-gold" onClick={() => setShowJobForm(true)}>+ Post a Job</button>
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
                </div>
            </div>

            <BusinessListingModal open={showBusinessForm} onClose={() => setShowBusinessForm(false)} />
            <JobPostingModal open={showJobForm} onClose={() => setShowJobForm(false)} />
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

function TestimoniesPage({ navigate, dark }) {
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
            <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 50%, var(--gold-dark) 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
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
