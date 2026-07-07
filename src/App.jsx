import { useState, useEffect, useRef } from "react";
import { useFormSubmit } from "./hooks/useFormSubmit";
import { useFirebaseCollection } from "./hooks/useFirebaseCollection";
import { useYouTubeVideos } from "./hooks/useYouTubeVideos";
import { validateEmail } from "./validation";
import logo from "./assets/logo.png";

const NAV_LINKS = ["Home", "Ministries", "Sermons", "Events", "Connect", "Give", "Testimonies", "About"];

export const styles = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
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

body { font-family: 'DM Sans', sans-serif; background: var(--white); color: var(--gray-800); overflow-x: hidden; }
.font-display { font-family: 'Playfair Display', serif; }

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
  transition: all 0.3s ease;
}

.nav-inner {
  max-width: 1280px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 2rem; height: 70px;
}

.nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.logo-cross {
  width: 40px; height: 40px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; color: white; font-weight: 900;
  font-family: 'Playfair Display', serif;
  overflow: hidden; flex-shrink: 0;
}
.logo-cross img { width: 100%; height: 100%; object-fit: contain; }
.logo-text { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700; color: var(--navy); line-height: 1.2; }
.logo-sub { font-family: 'DM Sans', sans-serif; font-size: 0.65rem; font-weight: 500; color: var(--gold); letter-spacing: 0.08em; text-transform: uppercase; }

.nav-links { display: flex; gap: 0.1rem; align-items: center; }
.nav-link {
  padding: 0.5rem 0.85rem; border-radius: 6px;
  font-size: 0.85rem; font-weight: 500; color: var(--navy);
  text-decoration: none; transition: all 0.2s;
  cursor: pointer; background: none; border: none;
}
.nav-link:hover { background: rgba(201,168,76,0.1); color: var(--gold-dark); }
.nav-link.active { color: var(--gold-dark); }

.nav-cta {
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  color: white; padding: 0.5rem 1.25rem; border-radius: 8px;
  font-size: 0.85rem; font-weight: 600; border: none; cursor: pointer;
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
  padding: 1rem 0; font-size: 1.1rem; font-weight: 600; border-bottom: 1px solid var(--gray-200);
  width: 100%; text-align: left;
}
.dark-mode .mobile-drawer { background: rgba(10,15,30,0.98) !important; }
.dark-mode .mobile-drawer .nav-link { border-bottom-color: rgba(201,168,76,0.15) !important; }

.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 0.85rem 2rem; border-radius: 10px;
  font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 600;
  cursor: pointer; border: none; transition: all 0.25s; text-decoration: none;
}
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
.btn-outline:hover { background: rgba(255,255,255,0.15); border-color: white; }
.btn-navy {
  background: var(--navy); color: white;
  box-shadow: 0 4px 20px rgba(14,32,68,0.3);
}
.btn-navy:hover { background: var(--navy-mid); transform: translateY(-2px); }
.btn-white {
  background: white; color: var(--navy);
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
}
.btn-white:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.2); }
.btn-sm { padding: 0.6rem 1.4rem; font-size: 0.85rem; }

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
  font-family: 'Playfair Display', serif;
  font-size: clamp(2.5rem, 5vw, 4.2rem);
  font-weight: 900; line-height: 1.1; color: white;
  margin-bottom: 1.5rem;
  animation: fadeSlideUp 0.7s 0.1s ease both;
}

.hero-title span { color: var(--gold); }
.hero-desc {
  font-size: 1.1rem; line-height: 1.75; color: rgba(255,255,255,0.78);
  margin-bottom: 2.5rem; max-width: 520px;
  animation: fadeSlideUp 0.7s 0.2s ease both;
}

.hero-btns { display: flex; gap: 1rem; flex-wrap: wrap; animation: fadeSlideUp 0.7s 0.3s ease both; }

.hero-stats {
  display: flex; gap: 2.5rem; margin-top: 3rem;
  animation: fadeSlideUp 0.7s 0.4s ease both;
}
.hero-stat-num { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700; color: var(--gold); }
.hero-stat-label { font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-top: 2px; }

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
.service-time-name { font-size: 0.85rem; color: rgba(255,255,255,0.75); }
.service-time-val { font-size: 0.9rem; font-weight: 600; color: var(--gold-light); }

.countdown-section {
  margin-top: 1.5rem; padding-top: 1.5rem;
  border-top: 1px solid rgba(201,168,76,0.2);
}
.countdown-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.5); margin-bottom: 0.75rem; }
.countdown-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 0.5rem; }
.countdown-unit { text-align: center; background: rgba(201,168,76,0.15); border-radius: 8px; padding: 0.75rem 0.5rem; }
.countdown-num { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: var(--gold); }
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
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.8rem, 3vw, 2.8rem);
  font-weight: 700; color: var(--navy); line-height: 1.25;
  margin-bottom: 1rem;
}
.section-title.white { color: white; }
.section-desc { font-size: 1.05rem; color: var(--gray-600); line-height: 1.75; max-width: 600px; margin: 0 auto; }
.section-desc.white { color: rgba(255,255,255,0.75); }
.gold-line { width: 60px; height: 3px; background: linear-gradient(90deg, var(--gold), var(--gold-dark)); border-radius: 2px; margin: 1rem auto 0; }

/* ─── CARDS ─── */
.card {
  background: white; border-radius: 16px;
  border: 1px solid rgba(201,168,76,0.12);
  box-shadow: 0 2px 20px rgba(14,32,68,0.06);
  transition: all 0.3s ease; overflow: hidden;
}
.card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(14,32,68,0.12); }

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
  font-family: 'Playfair Display', serif; font-size: 1.1rem; font-style: italic;
  color: rgba(255,255,255,0.9); line-height: 1.7;
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
  font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700;
  color: var(--gold); margin: 0 auto 1.25rem;
  border: 3px solid var(--gold-light);
  box-shadow: 0 4px 20px rgba(201,168,76,0.25);
}
.team-name { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 700; color: var(--navy); }
.team-role { font-size: 0.82rem; color: var(--gold-dark); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }
.team-bio { font-size: 0.88rem; color: var(--gray-600); line-height: 1.6; margin-top: 0.75rem; }

/* ─── MINISTRY CARDS ─── */
.ministry-card { padding: 2rem; }
.ministry-icon {
  width: 56px; height: 56px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem; margin-bottom: 1.25rem;
}
.ministry-title { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 700; color: var(--navy); margin-bottom: 0.6rem; }
.ministry-desc { font-size: 0.88rem; color: var(--gray-600); line-height: 1.65; }
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
.sermon-title { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700; color: var(--navy); margin-top: 0.4rem; line-height: 1.4; }
.sermon-pastor { font-size: 0.82rem; color: var(--gray-400); margin-top: 0.4rem; }

/* ─── EVENTS ─── */
.event-card { display: flex; gap: 1.5rem; padding: 1.5rem; align-items: flex-start; }
.event-date-block {
  min-width: 68px; height: 72px; background: var(--navy);
  border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-family: 'Playfair Display', serif; color: white; flex-shrink: 0;
}
.event-day { font-size: 1.8rem; font-weight: 700; line-height: 1; color: var(--gold); }
.event-month { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; }
.event-title { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 700; color: var(--navy); }
.event-meta { font-size: 0.82rem; color: var(--gray-400); margin-top: 4px; }
.event-desc { font-size: 0.88rem; color: var(--gray-600); margin-top: 0.4rem; line-height: 1.55; }

/* ─── STATS ─── */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 2rem; text-align: center; }
.stat-num { font-family: 'Playfair Display', serif; font-size: 3rem; font-weight: 900; color: var(--gold); line-height: 1; }
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
.blog-title { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700; color: var(--navy); margin-top: 0.4rem; line-height: 1.4; }
.blog-excerpt { font-size: 0.84rem; color: var(--gray-600); margin-top: 0.4rem; line-height: 1.55; }
.blog-meta { font-size: 0.78rem; color: var(--gray-400); margin-top: 0.75rem; display: flex; justify-content: space-between; }

/* ─── FORMS ─── */
.form-group { margin-bottom: 1.25rem; }
.form-label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--navy); margin-bottom: 0.5rem; }
.form-input, .form-select, .form-textarea {
  width: 100%; padding: 0.85rem 1rem; border-radius: 10px;
  border: 1.5px solid var(--gray-200); font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem; color: var(--gray-800); outline: none;
  transition: border-color 0.2s; background: white;
}
.form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.12); }
.form-textarea { resize: vertical; min-height: 110px; }

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
.footer-brand-name { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 700; color: white; margin-bottom: 0.3rem; letter-spacing: 0.01em; }
.footer-brand-sub { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--gold); }
.footer-desc { font-size: 0.9rem; line-height: 1.75; color: rgba(255,255,255,0.55); margin-top: 1.1rem; max-width: 340px; }
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
.footer-bottom {
  position: relative; max-width: 1280px; margin: 3.5rem auto 0;
  padding-top: 1.75rem; border-top: 1px solid rgba(255,255,255,0.08);
  display: flex; justify-content: space-between; align-items: center;
  font-size: 0.82rem; color: rgba(255,255,255,0.35);
  flex-wrap: wrap; gap: 1rem;
}

/* ─── PRAYER WIDGET ─── */
.prayer-widget {
  position: fixed; bottom: 2rem; right: 2rem; z-index: 900;
}
.prayer-toggle {
  width: 58px; height: 58px; border-radius: 50%;
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  border: none; cursor: pointer; font-size: 1.4rem;
  box-shadow: 0 4px 25px rgba(201,168,76,0.6);
  transition: all 0.3s; display: flex; align-items: center; justify-content: center;
  color: white;
}
.prayer-toggle:hover { transform: scale(1.08); }
.prayer-panel {
  position: absolute; bottom: 70px; right: 0;
  width: 300px; background: white; border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  border: 1px solid rgba(201,168,76,0.2);
  overflow: hidden; transform-origin: bottom right;
  transition: all 0.3s; transform: scale(0.8); opacity: 0; pointer-events: none;
}
.prayer-panel.open { transform: scale(1); opacity: 1; pointer-events: all; }
.prayer-header { background: linear-gradient(135deg, var(--navy), var(--navy-mid)); padding: 1.25rem; color: white; }
.prayer-title { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700; }
.prayer-subtitle { font-size: 0.78rem; opacity: 0.7; margin-top: 2px; }
.prayer-body { padding: 1.25rem; }

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
.newsletter-input { flex: 1; min-width: 220px; padding: 0.85rem 1.25rem; border-radius: 10px; border: 1px solid rgba(201,168,76,0.3); background: rgba(255,255,255,0.1); color: white; font-family: 'DM Sans', sans-serif; outline: none; }
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
  background: white; border-radius: 20px; max-width: 480px; width: 100%;
  overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.dark-mode .modal-card { background: #131D35 !important; }
.modal-header {
  background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%);
  padding: 1.75rem 2rem; color: white; position: relative;
}
.modal-close {
  position: absolute; top: 1rem; right: 1rem;
  background: rgba(255,255,255,0.12); border: none; color: white;
  width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
  font-size: 1rem; display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.modal-close:hover { background: rgba(255,255,255,0.25); }
.modal-date-badge {
  display: inline-flex; flex-direction: column; align-items: center;
  background: rgba(201,168,76,0.15); border: 1px solid rgba(201,168,76,0.4);
  border-radius: 12px; padding: 0.5rem 1rem; margin-bottom: 0.75rem;
}
.modal-body { padding: 2rem; }
.modal-body p { color: var(--gray-600); line-height: 1.75; font-size: 0.95rem; }
.dark-mode .modal-body p { color: #A0A8B8 !important; }

/* ─── VIDEO MODAL ─── */
.modal-card-video { max-width: 860px; background: #000 !important; position: relative; }
.video-frame-wrap { position: relative; width: 100%; padding-top: 56.25%; background: #000; }
.video-frame-wrap iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }
.modal-video-info { padding: 1.5rem 1.75rem; background: white; }
.dark-mode .modal-video-info { background: #131D35 !important; }
.modal-video-info .modal-title { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 700; color: var(--navy); }
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
}
@media (max-width: 640px) {
  .nav-links { display: none; }
  .mobile-menu-btn { display: flex; align-items: center; gap: 0.75rem; }
  .nav-cta { display: none; }
  .section { padding: 3.5rem 1.25rem; }
  .hero-content { padding: 7rem 1.25rem 3rem; }
  .hero-stats { gap: 1.5rem; }
  .footer-grid { grid-template-columns: 1fr; }
  .footer-grid > div + div { border-left: none; padding-left: 0; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.06); }
  .event-card { flex-direction: column; gap: 1rem; }
  .prayer-widget { bottom: 1rem; right: 1rem; }
  .prayer-toggle { width: 48px; height: 48px; font-size: 1.1rem; }
  .prayer-panel { width: 280px; }
}
`;

const TEAM = [
    { initials: "JM", name: "Rev. James Mwangi", role: "Youth Chaplain", bio: "Passionate servant leader guiding ACK St Pauls youth with faith and grace for over 12 years." },
    { initials: "GW", name: "Grace Wanjiku", role: "Youth Coordinator", bio: "Energetic coordinator building bridges between teens, young adults, and the wider community." },
    { initials: "DK", name: "David Kamau", role: "Worship Leader", bio: "Anointed musician leading the youth in powerful, Spirit-filled worship every Sunday." },
    { initials: "RN", name: "Rachel Njeri", role: "Outreach Director", bio: "Compassionate leader championing community impact and social transformation for God's glory." },
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

// Computes the next occurrence of a given "nth weekday of the month" (e.g. 2nd Saturday),
// rolling over to next month automatically once this month's occurrence has passed.
function getNextNthWeekday(weekIndex, dayOfWeek, hour = 0, minute = 0) {
    const now = new Date();
    const build = (year, month) => {
        const firstWeekday = new Date(year, month, 1).getDay();
        const day = 1 + ((dayOfWeek - firstWeekday + 7) % 7) + (weekIndex - 1) * 7;
        return new Date(year, month, day, hour, minute, 0, 0);
    };
    let candidate = build(now.getFullYear(), now.getMonth());
    if (candidate < now) candidate = build(now.getFullYear(), now.getMonth() + 1);
    return candidate;
}

// Coffee Date: 2nd Saturday of every month, 3:00 PM
const NEXT_COFFEE_DATE = getNextNthWeekday(2, 6, 15, 0);

const EVENTS = [
    {
        day: String(NEXT_COFFEE_DATE.getDate()).padStart(2, "0"),
        month: NEXT_COFFEE_DATE.toLocaleString("en-US", { month: "short" }),
        title: "Coffee Date",
        time: "2nd Saturday of every month · 3:00 PM",
        desc: "A relaxed monthly hangout over coffee and snacks — good conversation, good company, and a chance to connect beyond Sunday. Open to all youth and newcomers.",
    },
    { day: "02", month: "Aug", title: "Worship Experience", time: "Sun · 4:00 PM – 6:30 PM", desc: "An immersive evening of praise, worship, and prophetic ministry for the whole youth community. Come ready to encounter God's presence." },
    { day: "16", month: "Aug", title: "ICT Literacy Training", time: "Sun · 2:00 PM – 5:00 PM", desc: "Hands-on computer and digital skills training equipping youth with practical ICT knowledge for school, work, and ministry." },
    { day: "23", month: "Aug", title: "Prayer Retreat", time: "Sun · 9:00 AM – 4:00 PM", desc: "A day set apart for fasting, prayer, and seeking God's direction together as a youth community. Meals and materials provided." },
    { day: "30", month: "Aug", title: "Sports Day", time: "Sun · 9:00 AM – 3:00 PM", desc: "Friendly games, football, and fun activities bringing the youth together in fellowship, teamwork, and fitness." },
];


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
    const [activePage, setActivePage] = useState("Home");
    const [dark, setDark] = useState(false);
    const [prayerOpen, setPrayerOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [statsVisible, setStatsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState("Video");
    const statsRef = useRef(null);
    const countdown = useCountdown(NEXT_COFFEE_DATE);

    const prayerWidget = useFormSubmit("prayerRequests", { name: "", request: "" }, ["request"]);

    const stat1 = useAnimatedCount(850, statsVisible);
    const stat2 = useAnimatedCount(12, statsVisible);
    const stat3 = useAnimatedCount(47, statsVisible);
    const stat4 = useAnimatedCount(3200, statsVisible);

    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.4 });
        if (statsRef.current) obs.observe(statsRef.current);
        return () => obs.disconnect();
    }, []);

    const navigate = (page) => { setActivePage(page); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

    return (
        <>
            <style>{styles}</style>
            <div className={dark ? "dark-mode" : ""} style={{ minHeight: "100vh" }}>
                {/* ─── NAV ─── */}
                <nav>
                    <div className="nav-inner">
                        <a className="nav-logo" onClick={() => navigate("Home")} style={{ cursor: "pointer" }}>
                            <div className="logo-cross"><img src={logo} alt="ACK St Pauls Cathedral crest" /></div>
                            <div>
                                <div className="logo-text">ACK St Pauls</div>
                                <div className="logo-sub">Youths</div>
                            </div>
                        </a>
                        <div className="nav-links">
                            {NAV_LINKS.map(p => (
                                <button key={p} className={`nav-link${activePage === p ? " active" : ""}`} onClick={() => navigate(p)}>{p}</button>
                            ))}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "0.5rem" }}>
                                <button
                                    className={`theme-toggle${dark ? " dark" : ""}`}
                                    onClick={() => setDark(!dark)}
                                    aria-label="Toggle dark mode"
                                    title={dark ? "Light mode" : "Dark mode"}
                                >
                                    <div className="toggle-thumb" />
                                </button>
                                <button className="nav-cta" onClick={() => navigate("Connect")}>Join Us</button>
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
                    {NAV_LINKS.map(p => (
                        <button key={p} className={`nav-link${activePage === p ? " active" : ""}`} onClick={() => navigate(p)}>{p}</button>
                    ))}
                    <button className="btn btn-gold" style={{ marginTop: "1rem" }} onClick={() => navigate("Connect")}>Join Us</button>
                </div>

                {/* ─── PAGES ─── */}
                {activePage === "Home" && <HomePage countdown={countdown} navigate={navigate} statsRef={statsRef} stat1={stat1} stat2={stat2} stat3={stat3} stat4={stat4} dark={dark} />}
                {activePage === "About" && <AboutPage navigate={navigate} dark={dark} />}
                {activePage === "Ministries" && <MinistriesPage navigate={navigate} dark={dark} />}
                {activePage === "Sermons" && <SermonsPage navigate={navigate} dark={dark} activeTab={activeTab} setActiveTab={setActiveTab} />}
                {activePage === "Events" && <EventsPage navigate={navigate} dark={dark} />}
                {activePage === "Connect" && <ConnectPage navigate={navigate} dark={dark} />}
                {activePage === "Give" && <GivePage dark={dark} />}
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
                                {["📘", "📸", "🐦", "▶️", "📱"].map((s, i) => <div key={i} className="social-btn">{s}</div>)}
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
                            <div className="footer-link">📍 Embu Town, Embu, Kenya</div>
                            <div className="footer-link">📞 +254 700 000 000</div>
                            <div className="footer-link">✉️ youths@ackstpauls.org</div>
                            <div className="footer-link">🌐 www.ackstpaulsyouths.org</div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <span>© 2026 ACK St Pauls Youths. All rights reserved.</span>
                        <span>Built with ♥ for God's Glory · Embu, Kenya</span>
                    </div>
                </footer>

                {/* ─── PRAYER WIDGET ─── */}
                <div className="prayer-widget">
                    <div className={`prayer-panel${prayerOpen ? " open" : ""}`}>
                        <div className="prayer-header">
                            <div className="prayer-title">🙏 Prayer Support</div>
                            <div className="prayer-subtitle">We're here for you, always.</div>
                        </div>
                        <div className="prayer-body">
                            {prayerWidget.submitted ? (
                                <p style={{ textAlign: "center", padding: "1rem 0", color: "var(--navy)", fontWeight: 600 }}>
                                    🙏 Your prayer request has been sent. Our team is praying for you.
                                </p>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Your Name</label>
                                        <input
                                            className="form-input"
                                            placeholder="Enter your name"
                                            value={prayerWidget.formData.name}
                                            onChange={e => prayerWidget.setField("name", e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Prayer Request</label>
                                        <textarea
                                            className="form-textarea"
                                            style={{ minHeight: 80 }}
                                            placeholder="Share your prayer need..."
                                            value={prayerWidget.formData.request}
                                            onChange={e => prayerWidget.setField("request", e.target.value)}
                                        />
                                    </div>
                                    {prayerWidget.error && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{prayerWidget.error}</p>}
                                    <button
                                        className="btn btn-gold"
                                        style={{ width: "100%", justifyContent: "center" }}
                                        disabled={prayerWidget.submitting}
                                        onClick={() => prayerWidget.handleSubmit({ source: "widget", anonymous: false })}
                                    >
                                        {prayerWidget.submitting ? "Sending..." : "Send Prayer Request"}
                                    </button>
                                    <p style={{ fontSize: "0.75rem", textAlign: "center", color: "var(--gray-400)", marginTop: 8 }}>
                                        Your request is kept confidential. Our team prays daily.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                    <button className="prayer-toggle" onClick={() => setPrayerOpen(!prayerOpen)}>🙏</button>
                </div>
            </div>
        </>
    );
}

function HomePage({ countdown, navigate, statsRef, stat1, stat2, stat3, stat4, dark }) {
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
                <div className="hero-content container">
                    <div>
                        <div className="hero-badge">✝ ACK St Paul's Cathedral · Embu · Est. 1954</div>
                        <h1 className="hero-title">
                            Where Youth<br /><span>Encounter God</span><br />& Change the World
                        </h1>
                        <p className="hero-desc">
                            A generation rising in faith, purpose, and power. Join ACK St Pauls Youths — Embu's most vibrant youth community.
                        </p>
                        <div className="hero-btns">
                            <button className="btn btn-gold" onClick={() => navigate("Connect")}>Join Us Today</button>
                            <button className="btn btn-outline" onClick={() => navigate("Sermons")}>▶ Watch Online</button>
                            <button className="btn btn-outline" onClick={() => navigate("Connect")}>Get Connected</button>
                        </div>
                        <div className="hero-stats">
                            <div><div className="hero-stat-num">850+</div><div className="hero-stat-label">Active Youth</div></div>
                            <div><div className="hero-stat-num">12+</div><div className="hero-stat-label">Ministries</div></div>
                            <div><div className="hero-stat-num">70+</div><div className="hero-stat-label">Years of Faith</div></div>
                        </div>
                    </div>
                    <div className="hero-visual animate-float">
                        <div className="service-card">
                            <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--gold-light)", fontWeight: 700, marginBottom: "0.75rem" }}>
                                🕊 This Sunday at ACK St Pauls
                            </div>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, color: "white", marginBottom: "0.25rem" }}>
                                "Rise Up & Shine"
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}>Isaiah 60:1 · Rev. James Mwangi</div>
                            <div className="service-times-grid">
                                {[["Devotion", "8:00 AM"], ["Youth Service", "8:30 AM"], ["Bible Study", "11:00 AM"]].map(([n, t]) => (
                                    <div key={n} className="service-time-item">
                                        <span className="service-time-name">{n}</span>
                                        <span className="service-time-val">{t}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="countdown-section">
                                {countdown.expired ? (
                                    <div style={{ textAlign: "center", padding: "1rem 0" }}>
                                        <div style={{ fontSize: "0.85rem", color: "var(--gold-light)", fontWeight: 600 }}>✨ Stay tuned for our next event!</div>
                                        <button className="btn btn-gold btn-sm" style={{ marginTop: "0.75rem" }} onClick={() => navigate("Events")}>View Upcoming Events</button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="countdown-label">⏰ Next Coffee Date In</div>
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
                    <div className="grid-2">
                        {EVENTS.map((e, i) => (
                            <div key={i} className="card event-card">
                                <div className="event-date-block">
                                    <div className="event-day">{e.day}</div>
                                    <div className="event-month">{e.month}</div>
                                </div>
                                <div>
                                    <div className="event-title">{e.title}</div>
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
                        <div style={{ background: "var(--navy)", borderRadius: 20, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                            <div
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
                            <div style={{ padding: "2.5rem" }}>
                                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--gold)", fontWeight: 700, marginBottom: "0.75rem" }}>
                                    {new Date(latestVideo.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </div>
                                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 700, color: "white", lineHeight: 1.25, marginBottom: "1rem" }}>{latestVideo.title}</div>
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
                                <div className="ministry-icon" style={{ background: m.color }}><span style={{ fontSize: "1.6rem" }}>{m.icon}</span></div>
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
                            <h2 className="section-title" style={{ textAlign: "left", marginBottom: "1.25rem" }}>Rooted in Faith Since 1954</h2>
                            <p style={{ color: "var(--gray-600)", lineHeight: 1.8, marginBottom: "1rem" }}>
                                ACK St Paul's Cathedral (Anglican Church of Kenya) has been a spiritual landmark in Embu for over seven decades. The Youth Ministry was established in the 1970s as a response to the growing need for intentional discipleship among the young people of the church family.
                            </p>
                            <p style={{ color: "var(--gray-600)", lineHeight: 1.8, marginBottom: "1rem" }}>
                                From humble beginnings with a handful of passionate teenagers, the ministry has grown into one of the largest and most impactful youth communities in Embu, now boasting over 850 active members across multiple programmes.
                            </p>
                            <p style={{ color: "var(--gray-600)", lineHeight: 1.8 }}>
                                Today, ACK St Pauls Youths stands as a testament to God's faithfulness — a vibrant, multicultural community united by a singular passion: to know Christ and make Him known.
                            </p>
                        </div>
                        <div className="about-image-mock">
                            <div className="about-image-cross">✝</div>
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
                            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>👁️</div>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "white", marginBottom: "1rem" }}>Our Vision</div>
                            <p style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.75 }}>
                                To be a generation of Christlike leaders who transform families, communities, and nations through the power of the Gospel.
                            </p>
                        </div>
                        <div className="card" style={{ padding: "2.5rem", background: "linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%)" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🎯</div>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "white", marginBottom: "1rem" }}>Our Mission</div>
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
                            ["📖", "Scripture", "We believe the Bible is the inspired, infallible Word of God — our ultimate authority for faith and life."],
                            ["✝️", "The Trinity", "We believe in one God — Father, Son, and Holy Spirit — eternally existing in three persons."],
                            ["🌟", "Salvation", "We believe salvation is by grace alone, through faith alone, in Christ alone — received as a free gift."],
                            ["🕊️", "The Holy Spirit", "We believe in the active work of the Holy Spirit, who indwells, guides, and empowers every believer."],
                            ["⛪", "The Church", "We believe in the universal Church — the body of Christ — called to worship, fellowship, and mission."],
                            ["🌅", "Second Coming", "We believe in the bodily return of Jesus Christ to judge the living and the dead and to establish His kingdom."],
                        ].map(([icon, title, text], i) => (
                            <div key={i} className="card" style={{ padding: "1.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)" }}>
                                <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>{icon}</div>
                                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: "var(--gold)", marginBottom: "0.5rem" }}>{title}</div>
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
    return (
        <>
            <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 50%, var(--gold-dark) 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
                <div className="overline" style={{ color: "var(--gold-light)" }}>Get Involved</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 900, color: "white", marginBottom: "1rem" }}>Our Ministries</h1>
                <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.85)", maxWidth: 550, margin: "0 auto" }}>Seven dynamic arms of ministry where every member finds their place, purpose, and calling to serve.</p>
            </div>
            <div className="section section-cream">
                <div className="container">
                    <div className="grid-3">
                        {MINISTRIES.map((m, i) => (
                            <div key={i} className="card ministry-card-full">
                                <div className="ministry-icon" style={{ background: m.color, width: 68, height: 68, margin: "0 auto 1.25rem" }}>
                                    <span style={{ fontSize: "1.9rem" }}>{m.icon}</span>
                                </div>
                                <div className="ministry-title" style={{ fontSize: "1.2rem", textAlign: "center" }}>{m.title}</div>
                                <div className="ministry-desc" style={{ marginTop: "0.6rem", textAlign: "center" }}>{m.desc}</div>
                                <button className="btn btn-gold btn-sm" style={{ marginTop: "1.5rem", width: "100%", justifyContent: "center" }} onClick={() => navigate("Connect")}>
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

function SermonsPage({ navigate, dark, activeTab, setActiveTab }) {
    const { videos, loading, error } = useYouTubeVideos();
    const [activeVideo, setActiveVideo] = useState(null);

    return (
        <>
            <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 50%, var(--gold-dark) 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
                <div className="overline" style={{ color: "var(--gold-light)" }}>The Word</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 900, color: "white", marginBottom: "1rem" }}>Sermons & Media</h1>
                <p style={{ color: "rgba(255,255,255,0.75)", maxWidth: 520, margin: "0 auto" }}>Be transformed by the renewing of your mind — Romans 12:2. Watch our full video library, straight from our YouTube channel.</p>
            </div>
            <div className="section section-cream">
                <div className="container">
                    <div className="tab-nav">
                        {["Video", "Gallery"].map(t => (
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

                    {activeTab === "Gallery" && (
                        <div className="gallery-grid">
                            {["🙌", "✝️", "🎵", "🙏", "🌟", "💛", "🕊️"].map((e, i) => (
                                <div key={i} className="gallery-item">
                                    <div className="gallery-bg" style={{ background: `linear-gradient(${135 + i * 20}deg, ${["var(--navy)", "var(--gold-dark)", "#1E3A7A", "var(--orange)", "var(--navy-mid)", "var(--gold)", "#2A4A80"][i]} 0%, ${["#1A3660", "var(--gold)", "var(--navy)", "#C9673A", "var(--navy)", "var(--orange)", "var(--navy-mid)"][i]} 100%)` }}>
                                        <span style={{ opacity: 0.4, fontSize: "2.5rem" }}>{e}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function EventsPage({ navigate, dark }) {
    const [detailsEvent, setDetailsEvent] = useState(null);
    const registration = useFormSubmit(
        "eventRegistrations",
        { fullName: "", phone: "", email: "", eventTitle: EVENTS[0].title, specialRequirements: "" },
        ["fullName", "phone", "email"]
    );

    const handleRegisterClick = (eventTitle) => {
        registration.setField("eventTitle", eventTitle);
        document.getElementById("event-registration-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleRegistrationSubmit = () => {
        if (!validateEmail(registration.formData.email)) return;
        registration.handleSubmit();
    };

    return (
        <>
            <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 50%, var(--gold-dark) 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
                <div className="overline" style={{ color: "var(--gold-light)" }}>What's Happening</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 900, color: "white", marginBottom: "1rem" }}>Events & Activities</h1>
                <p style={{ color: "rgba(255,255,255,0.85)", maxWidth: 540, margin: "0 auto" }}>Coffee dates, worship experiences, trainings, retreats, and more — join us for life-changing experiences.</p>
            </div>
            <div className="section section-cream">
                <div className="container">
                    <div className="section-header">
                        <div className="overline">July – August 2026</div>
                        <h2 className="section-title">Upcoming Events</h2>
                        <div className="gold-line" />
                    </div>
                    <div style={{ display: "grid", gap: "1.25rem" }}>
                        {EVENTS.map((e, i) => (
                            <div key={i} className="card event-card">
                                <div className="event-date-block">
                                    <div className="event-day">{e.day}</div>
                                    <div className="event-month">{e.month}</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="event-title" style={{ fontSize: "1.15rem" }}>{e.title}</div>
                                    <div className="event-meta">📅 {e.time}</div>
                                    <div className="event-desc">{e.desc}</div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
                                    <button className="btn btn-gold btn-sm" onClick={() => handleRegisterClick(e.title)}>Register</button>
                                    <button className="btn btn-navy btn-sm" onClick={() => setDetailsEvent(e)}>Details</button>
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
                                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--gold-light)", lineHeight: 1 }}>{detailsEvent.day}</div>
                                        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.8 }}>{detailsEvent.month}</div>
                                    </div>
                                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700 }}>{detailsEvent.title}</div>
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
                                        <label className="form-label">Full Name</label>
                                        <input className="form-input" placeholder="Your full name" value={registration.formData.fullName} onChange={e => registration.setField("fullName", e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone Number</label>
                                        <input className="form-input" placeholder="+254 700 000 000" value={registration.formData.phone} onChange={e => registration.setField("phone", e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Select Event</label>
                                    <select className="form-select" value={registration.formData.eventTitle} onChange={e => registration.setField("eventTitle", e.target.value)}>
                                        {EVENTS.map((e, i) => <option key={i}>{e.title}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input className="form-input" placeholder="your@email.com" value={registration.formData.email} onChange={e => registration.setField("email", e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Special Requirements or Questions</label>
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
        { name: "", preferredGroup: "Teens Bible Study (Mon · 5PM)" },
        ["name"]
    );

    const handleContactSubmit = () => {
        if (!validateEmail(contact.formData.email)) return;
        contact.handleSubmit();
    };

    return (
        <>
            <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 50%, var(--gold-dark) 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
                <div className="overline" style={{ color: "var(--gold-light)" }}>We'd Love to Hear From You</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 900, color: "white", marginBottom: "1rem" }}>Connect With Us</h1>
                <p style={{ color: "rgba(255,255,255,0.75)", maxWidth: 520, margin: "0 auto" }}>Whether you're new, returning, or just curious — reach out. We have a place for you here.</p>
            </div>
            <div className="section section-cream">
                <div className="container">
                    <div className="grid-2">
                        <div>
                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)", marginBottom: "1.5rem" }}>Send Us a Message</h3>
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
                                        <div className="form-group"><label className="form-label">Phone</label><input className="form-input" placeholder="+254 700 000 000" value={contact.formData.phone} onChange={e => contact.setField("phone", e.target.value)} /></div>
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

                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)", margin: "2rem 0 1.25rem" }}>Prayer Request</h3>
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
                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)", marginBottom: "1.5rem" }}>Find Us</h3>
                            <div className="map-container" style={{ marginBottom: "1.5rem" }}>
                                <div className="map-pin-mock">
                                    <div style={{ fontSize: "2.5rem" }}>📍</div>
                                    <div className="map-label">ACK St Pauls Youths</div>
                                </div>
                                <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(14,32,68,0.04) 0px, rgba(14,32,68,0.04) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(14,32,68,0.04) 0px, rgba(14,32,68,0.04) 1px, transparent 1px, transparent 40px)", borderRadius: 16 }} />
                            </div>
                            <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                                <div style={{ display: "grid", gap: "1rem" }}>
                                    {[["📍", "Address", "Embu Town, Embu, Kenya"], ["📞", "Phone", "+254 700 000 000"], ["✉️", "Email", "youths@ackstpauls.org"], ["🕐", "Office Hours", "Mon–Fri · 8:00 AM – 5:00 PM"]].map(([icon, label, val], i) => (
                                        <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                                            <div style={{ width: 36, height: 36, background: "var(--cream)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>{icon}</div>
                                            <div><div style={{ fontSize: "0.78rem", color: "var(--gray-400)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div><div style={{ fontSize: "0.92rem", color: "var(--navy)", fontWeight: 500, marginTop: 2 }}>{val}</div></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--navy)", marginBottom: "1.25rem" }}>Join a Small Group</h3>
                            <div className="card" style={{ padding: "1.75rem" }}>
                                {smallGroup.submitted ? (
                                    <p style={{ textAlign: "center", color: "var(--navy)", fontWeight: 600, padding: "1rem 0" }}>✓ You're signed up! See you at small group.</p>
                                ) : (
                                    <>
                                        <div className="form-group"><label className="form-label">Your Name</label><input className="form-input" placeholder="Full name" value={smallGroup.formData.name} onChange={e => smallGroup.setField("name", e.target.value)} /></div>
                                        <div className="form-group">
                                            <label className="form-label">Preferred Group</label>
                                            <select className="form-select" value={smallGroup.formData.preferredGroup} onChange={e => smallGroup.setField("preferredGroup", e.target.value)}>
                                                <option>Teens Bible Study (Mon · 5PM)</option>
                                                <option>Young Adults Fellowship (Tue · 7PM)</option>
                                                <option>Worship & Prayer (Thu · 6PM)</option>
                                                <option>Women's Circle (Sat · 10AM)</option>
                                                <option>Men's Accountability (Sat · 8AM)</option>
                                            </select>
                                        </div>
                                        {smallGroup.error && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{smallGroup.error}</p>}
                                        <button className="btn btn-navy" style={{ width: "100%", justifyContent: "center" }} disabled={smallGroup.submitting} onClick={() => smallGroup.handleSubmit()}>
                                            {smallGroup.submitting ? "Signing up..." : "Sign Me Up →"}
                                        </button>
                                    </>
                                )}
                            </div>

                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--navy)", margin: "1.5rem 0 1rem" }}>Follow Us</h3>
                            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                                {[["📘", "Facebook", "@ACKStPaulsYouths"], ["📸", "Instagram", "@ackstpaulsyouths"], ["▶️", "YouTube", "ACK St Pauls Youths"], ["🐦", "Twitter / X", "@ACKStPaulsYouths"]].map(([icon, name, handle], i) => (
                                    <div key={i} className="card" style={{ padding: "0.85rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", flex: "1 1 auto", cursor: "pointer" }}>
                                        <span style={{ fontSize: "1.3rem" }}>{icon}</span>
                                        <div><div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)" }}>{name}</div><div style={{ fontSize: "0.78rem", color: "var(--gray-400)" }}>{handle}</div></div>
                                    </div>
                                ))}
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

    const copyToClipboard = (text, label) => {
        navigator.clipboard?.writeText(text).then(() => {
            setCopied(label);
            setTimeout(() => setCopied(""), 2000);
        });
    };

    return (
        <>
            <div className="giving-hero">
                <div className="overline" style={{ color: "var(--gold)" }}>Give & Support</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 900, color: "white", marginBottom: "1rem" }}>Online Giving</h1>
                <p style={{ color: "rgba(255,255,255,0.8)", maxWidth: 540, margin: "0 auto" }}>
                    "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." — 2 Cor 9:7
                </p>
            </div>

            <div className="section section-cream">
                <div className="container-sm">
                    <div className="card" style={{ padding: "2.5rem", textAlign: "center", marginBottom: "2rem" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📱</div>
                        <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold-dark)", fontWeight: 700, marginBottom: "0.75rem" }}>M-Pesa Lipa na M-Pesa</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", color: "var(--gray-600)", marginBottom: "0.35rem" }}>Paybill Number</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", fontWeight: 900, color: "var(--navy)", letterSpacing: "0.05em" }}>400222</div>
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
                            { icon: "💛", name: "Offering", account: "90925#Offering" },
                            { icon: "🙏", name: "Tithe", account: "90925#Tithe" },
                            { icon: "✨", name: "Thanksgiving", account: "90925#Thanksgiving" },
                        ].map(a => (
                            <div key={a.name} className="card" style={{ padding: "2rem", textAlign: "center" }}>
                                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{a.icon}</div>
                                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem" }}>{a.name}</div>
                                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "var(--gold-dark)", marginBottom: "1.25rem", letterSpacing: "0.02em" }}>{a.account}</div>
                                <button className="btn btn-gold btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => copyToClipboard(a.account, a.name)}>
                                    {copied === a.name ? "✓ Copied" : "Copy Account Number"}
                                </button>
                            </div>
                        ))}
                    </div>

                    <p style={{ fontSize: "0.85rem", textAlign: "center", color: "var(--gray-400)", marginTop: "2.5rem" }}>
                        🔒 All gifts are given directly via Safaricom M-Pesa. God bless you for your generosity.
                    </p>
                </div>
            </div>
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
        ["name", "title", "story"]
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
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 900, color: "white", marginBottom: "1rem" }}>Testimonies</h1>
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
                                <div className="form-group"><label className="form-label">Your Name</label><input className="form-input" placeholder="Your full name" value={testimony.formData.name} onChange={e => testimony.setField("name", e.target.value)} /></div>
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
