import { useState, useEffect, useRef } from "react";
import { useFormSubmit } from "./hooks/useFormSubmit";
import { validateEmail } from "./validation";

const NAV_LINKS = ["Home", "About", "Ministries", "Sermons", "Events", "Connect", "Give", "Blog"];

const styles = `
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
  width: 36px; height: 36px;
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; color: white; font-weight: 900;
  font-family: 'Playfair Display', serif;
  box-shadow: 0 2px 12px rgba(201,168,76,0.4);
}
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
.blog-thumb { height: 160px; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
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
  background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 50%, #1E3A7A 100%);
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
.footer { background: #050A14; color: rgba(255,255,255,0.7); padding: 4rem 2rem 2rem; }
.footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 3rem; max-width: 1280px; margin: 0 auto; }
.footer-brand-name { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: white; margin-bottom: 0.25rem; }
.footer-brand-sub { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--gold); }
.footer-desc { font-size: 0.88rem; line-height: 1.7; color: rgba(255,255,255,0.55); margin-top: 1rem; }
.footer-verse {
  margin-top: 1.25rem; padding: 1rem;
  background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.2);
  border-radius: 10px; font-size: 0.82rem; font-style: italic; color: rgba(255,255,255,0.7);
}
.footer-verse cite { display: block; font-style: normal; font-weight: 600; color: var(--gold); margin-top: 0.4rem; font-size: 0.75rem; }
.footer-col-title { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--gold); margin-bottom: 1.25rem; }
.footer-link { display: block; font-size: 0.88rem; color: rgba(255,255,255,0.55); text-decoration: none; margin-bottom: 0.6rem; cursor: pointer; transition: color 0.2s; }
.footer-link:hover { color: var(--gold-light); }
.footer-socials { display: flex; gap: 0.75rem; margin-top: 1rem; }
.social-btn {
  width: 38px; height: 38px; border-radius: 10px;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem; color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.2s;
}
.social-btn:hover { background: var(--gold); border-color: var(--gold); color: white; }
.footer-bottom {
  max-width: 1280px; margin: 3rem auto 0;
  padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.08);
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
  .footer-grid { grid-template-columns: 1fr 1fr; }
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
  .event-card { flex-direction: column; gap: 1rem; }
  .prayer-widget { bottom: 1rem; right: 1rem; }
  .prayer-toggle { width: 48px; height: 48px; font-size: 1.1rem; }
  .prayer-panel { width: 280px; }
}
`;

const TEAM = [
    { initials: "JM", name: "Rev. James Mwangi", role: "Youth Chaplain", bio: "Passionate servant leader guiding St Paul's youth with faith and grace for over 12 years." },
    { initials: "GW", name: "Grace Wanjiku", role: "Youth Coordinator", bio: "Energetic coordinator building bridges between teens, young adults, and the wider community." },
    { initials: "DK", name: "David Kamau", role: "Worship Leader", bio: "Anointed musician leading the youth in powerful, Spirit-filled worship every Sunday." },
    { initials: "RN", name: "Rachel Njeri", role: "Outreach Director", bio: "Compassionate leader championing community impact and social transformation for God's glory." },
];

const MINISTRIES = [
    { icon: "🌱", color: "rgba(14,32,68,0.08)", title: "Teens Ministry", desc: "A safe, fun space for 13–17 year olds to discover their faith, build lasting friendships, and grow in Christ through weekly meetings and activities." },
    { icon: "🔥", color: "rgba(224,115,48,0.1)", title: "Young Adults", desc: "Empowering 18–35 year olds to live boldly for Christ, navigate life's challenges with faith, and build purposeful careers and relationships." },
    { icon: "🎵", color: "rgba(201,168,76,0.12)", title: "Worship Team", desc: "A talented group of musicians and singers leading the congregation in anointed worship. Open to all gifted youth who desire to serve through music." },
    { icon: "📖", color: "rgba(14,32,68,0.08)", title: "Bible Study", desc: "Deep, engaging weekly Bible study groups that unpack God's word, build theological foundations, and foster meaningful spiritual discussion." },
    { icon: "🤝", color: "rgba(201,168,76,0.1)", title: "Community Outreach", desc: "Serving Nairobi's most vulnerable through food drives, hospital visits, school mentorship, and neighborhood clean-up campaigns." },
    { icon: "👥", color: "rgba(224,115,48,0.08)", title: "Mentorship Program", desc: "Intentional one-on-one and group discipleship pairing mature believers with newer youth to walk together in faith, accountability, and life skills." },
];

const SERMONS = [
    { tag: "Series · Faith Forward", title: "When God Seems Silent", pastor: "Rev. James Mwangi", date: "Jun 29, 2026", icon: "🎙️" },
    { tag: "Series · Identity in Christ", title: "You Are Chosen", pastor: "Grace Wanjiku", date: "Jun 22, 2026", icon: "✝️" },
    { tag: "Series · Unshakeable", title: "Standing Firm in the Storm", pastor: "Rev. James Mwangi", date: "Jun 15, 2026", icon: "⚓" },
];

const EVENTS = [
    { day: "15", month: "Aug", title: "Youth Annual Conference 2026", time: "Fri–Sun · All day", desc: "Three days of worship, teaching, prayer, and community. Theme: 'Ignite — Set the World Ablaze'." },
    { day: "26", month: "Jul", title: "Worship Night — Open Heavens", time: "Sat · 5:00 PM – 9:00 PM", desc: "An evening of extended praise, intercession, and powerful ministry. Bring a friend!" },
    { day: "09", month: "Aug", title: "Community Clean-Up Drive", time: "Sat · 7:00 AM – 12:00 PM", desc: "Serving Nairobi CBD and surrounding neighborhoods. Gloves and refreshments provided." },
    { day: "22", month: "Aug", title: "Mid-Year Youth Camp — Ngong Hills", time: "Fri–Sun · Overnight", desc: "Outdoor retreat with devotionals, team challenges, bonfire nights, and deep fellowship." },
];

const BLOG_POSTS = [
    { emoji: "🌄", cat: "Devotional", title: "Rising Early with God: The Power of Morning Prayer", excerpt: "How a simple 15-minute morning devotion can completely reshape your entire day and spiritual walk.", author: "Grace Wanjiku", date: "Jul 1, 2026" },
    { emoji: "💬", cat: "Testimony", title: "From the Streets of Mathare to the Pulpit", excerpt: "Emmanuel's transformational story of how the youth group became his family and faith became his anchor.", author: "Emmanuel Omondi", date: "Jun 25, 2026" },
    { emoji: "📜", cat: "Scripture", title: "Jeremiah 29:11 — A Promise for Your Season", excerpt: "Unpacking God's words of hope to a generation that often feels lost, forgotten, or behind in life.", author: "David Kamau", date: "Jun 18, 2026" },
];

const GIVING_AMOUNTS = [200, 500, 1000, 2500, 5000];

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
    const [selectedAmount, setSelectedAmount] = useState(1000);
    const [customAmount, setCustomAmount] = useState("");
    const [statsVisible, setStatsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState("Video");
    const statsRef = useRef(null);
    const countdown = useCountdown("2026-08-15T08:00:00");

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
                            <div className="logo-cross">✝</div>
                            <div>
                                <div className="logo-text">St Paul's ACK</div>
                                <div className="logo-sub">Cathedral Youths</div>
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
                {activePage === "Give" && <GivePage selectedAmount={selectedAmount} setSelectedAmount={setSelectedAmount} customAmount={customAmount} setCustomAmount={setCustomAmount} dark={dark} />}
                {activePage === "Blog" && <BlogPage navigate={navigate} dark={dark} />}

                {/* ─── FOOTER ─── */}
                <footer className="footer">
                    <div className="footer-grid">
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                <div className="logo-cross">✝</div>
                                <div>
                                    <div className="footer-brand-name">St Paul's ACK Cathedral</div>
                                    <div className="footer-brand-sub">Youth Ministry</div>
                                </div>
                            </div>
                            <div className="footer-desc">A vibrant community of faith-filled youth growing together in Christ, serving Nairobi and beyond for God's glory.</div>
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
                            <div className="footer-link">Sunday School · 8:00 AM</div>
                            <div className="footer-link">Main Service · 9:30 AM</div>
                            <div className="footer-link">Youth Service · 11:30 AM</div>
                            <div className="footer-link">Wednesday Bible Study · 6:00 PM</div>
                            <div className="footer-link">Friday Prayer Night · 7:00 PM</div>
                        </div>
                        <div>
                            <div className="footer-col-title">Contact</div>
                            <div className="footer-link">📍 State House Rd, Nairobi, Kenya</div>
                            <div className="footer-link">📞 +254 700 000 000</div>
                            <div className="footer-link">✉️ youths@stpaulsack.org</div>
                            <div className="footer-link">🌐 www.stpaulsackyouths.org</div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <span>© 2026 St Paul's ACK Cathedral Youths. All rights reserved.</span>
                        <span>Built with ♥ for God's Glory · Nairobi, Kenya</span>
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
                        <div className="hero-badge">✝ ACK Cathedral · Nairobi · Est. 1954</div>
                        <h1 className="hero-title">
                            Where Youth<br /><span>Encounter God</span><br />& Change the World
                        </h1>
                        <p className="hero-desc">
                            A generation rising in faith, purpose, and power. Join St Paul's ACK Cathedral Youths — Nairobi's most vibrant youth community.
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
                                🕊 This Sunday at St Paul's
                            </div>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, color: "white", marginBottom: "0.25rem" }}>
                                "Rise Up & Shine"
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}>Isaiah 60:1 · Rev. James Mwangi</div>
                            <div className="service-times-grid">
                                {[["Sunday School", "8:00 AM"], ["Youth Service", "11:30 AM"], ["Wed Bible Study", "6:00 PM"], ["Fri Prayer Night", "7:00 PM"]].map(([n, t]) => (
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
                                        <div className="countdown-label">⏰ Next Youth Conference In</div>
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
                        Whether you're exploring faith for the first time or growing deeper in your walk with Christ, St Paul's ACK Cathedral Youths is your community. We gather, worship, learn, and serve together — because we are better together.
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
                    <div style={{ background: "var(--navy)", borderRadius: 20, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                        <div style={{ background: "linear-gradient(135deg, #0E2044 0%, #1A3660 100%)", padding: "3rem", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
                            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", cursor: "pointer", boxShadow: "0 0 40px rgba(201,168,76,0.5)", marginBottom: "1rem" }}>▶</div>
                            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>Click to watch · 42 min</div>
                        </div>
                        <div style={{ padding: "2.5rem" }}>
                            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--gold)", fontWeight: 700, marginBottom: "0.75rem" }}>Jun 29, 2026 · Youth Service</div>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 700, color: "white", lineHeight: 1.25, marginBottom: "1rem" }}>When God Seems Silent</div>
                            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", lineHeight: 1.75, marginBottom: "1.5rem" }}>In those dry, quiet seasons when heaven seems distant — what do we do? Rev. James unpacks Elijah's wilderness journey and reveals God's faithful whisper in the silence.</div>
                            <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem" }}>Rev. James Mwangi · Based on 1 Kings 19</div>
                            <div style={{ display: "flex", gap: "0.75rem" }}>
                                <button className="btn btn-gold btn-sm" onClick={() => navigate("Sermons")}>Watch Full Sermon</button>
                                <button className="btn btn-outline btn-sm" onClick={() => navigate("Sermons")}>All Sermons</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MINISTRIES PREVIEW */}
            <div className="section section-light">
                <div className="container">
                    <div className="section-header">
                        <div className="overline">Get Involved</div>
                        <h2 className="section-title">Our Youth Ministries</h2>
                        <p className="section-desc">Six vibrant arms of ministry — find where you belong and make your mark for God.</p>
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
            <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
                <div className="overline" style={{ color: "var(--gold)" }}>Our Story</div>
                <h1 className="section-title white" style={{ fontSize: "3rem", maxWidth: 700, margin: "0 auto 1rem" }}>About St Paul's ACK Cathedral Youths</h1>
                <p className="section-desc white" style={{ maxWidth: 600, margin: "0 auto" }}>A legacy of faith, a present of purpose, a future of hope.</p>
            </div>

            <div className="section section-cream">
                <div className="container">
                    <div className="about-grid">
                        <div>
                            <div className="overline">Our History</div>
                            <h2 className="section-title" style={{ textAlign: "left", marginBottom: "1.25rem" }}>Rooted in Faith Since 1954</h2>
                            <p style={{ color: "var(--gray-600)", lineHeight: 1.8, marginBottom: "1rem" }}>
                                St Paul's Anglican Church of Kenya Cathedral has been a spiritual landmark in Nairobi for over seven decades. The Youth Ministry was established in the 1970s as a response to the growing need for intentional discipleship among the young people of the cathedral family.
                            </p>
                            <p style={{ color: "var(--gray-600)", lineHeight: 1.8, marginBottom: "1rem" }}>
                                From humble beginnings with a handful of passionate teenagers, the ministry has grown into one of the largest and most impactful youth communities in Nairobi, now boasting over 850 active members across multiple programmes.
                            </p>
                            <p style={{ color: "var(--gray-600)", lineHeight: 1.8 }}>
                                Today, St Paul's ACK Cathedral Youths stands as a testament to God's faithfulness — a vibrant, multicultural community united by a singular passion: to know Christ and make Him known.
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
            <div style={{ background: "linear-gradient(135deg, var(--gold-dark) 0%, var(--gold) 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
                <div className="overline" style={{ color: "rgba(255,255,255,0.8)" }}>Get Involved</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 900, color: "white", marginBottom: "1rem" }}>Youth Ministries</h1>
                <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.85)", maxWidth: 550, margin: "0 auto" }}>Six dynamic arms of ministry where every young person finds their place, purpose, and calling.</p>
            </div>
            <div className="section section-cream">
                <div className="container">
                    <div className="grid-2">
                        {MINISTRIES.map((m, i) => (
                            <div key={i} className="card" style={{ padding: "2.5rem", display: "grid", gridTemplateColumns: "auto 1fr", gap: "1.5rem", alignItems: "flex-start" }}>
                                <div className="ministry-icon" style={{ background: m.color, width: 64, height: 64 }}><span style={{ fontSize: "1.8rem" }}>{m.icon}</span></div>
                                <div>
                                    <div className="ministry-title" style={{ fontSize: "1.25rem" }}>{m.title}</div>
                                    <div className="ministry-desc" style={{ marginTop: "0.5rem" }}>{m.desc}</div>
                                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
                                        <button className="btn btn-gold btn-sm" onClick={() => navigate("Connect")}>Join This Ministry</button>
                                        <button className="btn btn-navy btn-sm" onClick={() => navigate("Events")}>Upcoming Events</button>
                                    </div>
                                </div>
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

function SermonsPage({ navigate, dark, activeTab, setActiveTab }) {
    return (
        <>
            <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, #1E3A7A 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
                <div className="overline" style={{ color: "var(--gold)" }}>The Word</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 900, color: "white", marginBottom: "1rem" }}>Sermons & Media</h1>
                <p style={{ color: "rgba(255,255,255,0.75)", maxWidth: 520, margin: "0 auto" }}>Be transformed by the renewing of your mind — Romans 12:2. Access our complete sermon library.</p>
            </div>
            <div className="section section-cream">
                <div className="container">
                    <div className="tab-nav">
                        {["Video", "Podcast", "Livestream", "Gallery"].map(t => (
                            <button key={t} className={`tab-btn${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>{t}</button>
                        ))}
                    </div>

                    {activeTab === "Video" && (
                        <>
                            <div className="grid-3">
                                {SERMONS.map((s, i) => (
                                    <div key={i} className="card sermon-card">
                                        <div className="sermon-thumb">
                                            <div style={{ position: "absolute", fontSize: "3rem", opacity: 0.15 }}>{s.icon}</div>
                                            <div className="play-btn">▶</div>
                                        </div>
                                        <div className="sermon-content">
                                            <div className="sermon-tag">{s.tag}</div>
                                            <div className="sermon-title">{s.title}</div>
                                            <div className="sermon-pastor">{s.pastor} · {s.date}</div>
                                            <button className="btn btn-gold btn-sm" style={{ marginTop: "0.75rem" }}>Watch Now</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {activeTab === "Podcast" && (
                        <div style={{ display: "grid", gap: "1rem" }}>
                            {SERMONS.map((s, i) => (
                                <div key={i} className="card" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>
                                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>{s.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div className="sermon-tag">{s.tag}</div>
                                        <div className="sermon-title">{s.title}</div>
                                        <div className="sermon-pastor">{s.pastor} · {s.date}</div>
                                    </div>
                                    <button className="btn btn-navy btn-sm">🎧 Listen</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "Livestream" && (
                        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📡</div>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.75rem" }}>Live Every Sunday at 11:30 AM</div>
                            <p style={{ color: "var(--gray-600)", marginBottom: "1.5rem" }}>Join thousands streaming our youth services live. Turn on notifications to never miss a service.</p>
                            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                                <button className="btn btn-gold">▶ Watch on YouTube</button>
                                <button className="btn btn-navy">📘 Watch on Facebook</button>
                            </div>
                            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--cream)", borderRadius: 12, display: "inline-block" }}>
                                <div style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>Next Livestream:</div>
                                <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "var(--navy)", fontSize: "1.1rem" }}>Sunday, Jul 12 · 11:30 AM EAT</div>
                            </div>
                        </div>
                    )}

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
            <div style={{ background: "linear-gradient(135deg, var(--orange) 0%, var(--gold-dark) 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
                <div className="overline" style={{ color: "rgba(255,255,255,0.8)" }}>What's Happening</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 900, color: "white", marginBottom: "1rem" }}>Events & Activities</h1>
                <p style={{ color: "rgba(255,255,255,0.85)", maxWidth: 540, margin: "0 auto" }}>Conferences, worship nights, camps, outreach, and more — join us for life-changing experiences.</p>
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
                                    <button className="btn btn-navy btn-sm" onClick={() => handleRegisterClick(e.title)}>Details</button>
                                </div>
                            </div>
                        ))}
                    </div>

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
            <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
                <div className="overline" style={{ color: "var(--gold)" }}>We'd Love to Hear From You</div>
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
                                    <div className="map-label">St Paul's ACK Cathedral</div>
                                </div>
                                <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(14,32,68,0.04) 0px, rgba(14,32,68,0.04) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(14,32,68,0.04) 0px, rgba(14,32,68,0.04) 1px, transparent 1px, transparent 40px)", borderRadius: 16 }} />
                            </div>
                            <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                                <div style={{ display: "grid", gap: "1rem" }}>
                                    {[["📍", "Address", "State House Road, Nairobi, Kenya"], ["📞", "Phone", "+254 700 000 000"], ["✉️", "Email", "youths@stpaulsack.org"], ["🕐", "Office Hours", "Mon–Fri · 8:00 AM – 5:00 PM"]].map(([icon, label, val], i) => (
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
                                {[["📘", "Facebook", "@StPaulsACKYouths"], ["📸", "Instagram", "@stpaulsyouths"], ["▶️", "YouTube", "St Pauls ACK Youths"], ["🐦", "Twitter / X", "@StPaulsYouths"]].map(([icon, name, handle], i) => (
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

function GivePage({ selectedAmount, setSelectedAmount, customAmount, setCustomAmount, dark }) {
    const giving = useFormSubmit(
        "givingRecords",
        { firstName: "", lastName: "", email: "", category: "Tithes & Offerings", frequency: "One-Time Gift" },
        ["firstName", "lastName", "email"]
    );

    const finalAmount = Number(customAmount || selectedAmount || 0);

    const handleGiveSubmit = () => {
        if (!validateEmail(giving.formData.email) || finalAmount <= 0) return;
        giving.handleSubmit({ amount: finalAmount });
    };

    return (
        <>
            <div className="giving-hero">
                <div className="overline" style={{ color: "var(--gold)" }}>Give & Support</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 900, color: "white", marginBottom: "1rem" }}>Online Giving</h1>
                <p style={{ color: "rgba(255,255,255,0.8)", maxWidth: 540, margin: "0 auto 2rem" }}>
                    "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." — 2 Cor 9:7
                </p>
                <div className="amount-grid">
                    {GIVING_AMOUNTS.map(a => (
                        <button key={a} className={`amount-btn${selectedAmount === a ? " selected" : ""}`} onClick={() => { setSelectedAmount(a); setCustomAmount(""); }}>
                            KSh {a.toLocaleString()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="section section-cream">
                <div className="container">
                    <div className="grid-2">
                        <div>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 700, color: "var(--navy)", marginBottom: "1.5rem" }}>Make Your Gift</h2>
                            <div className="card" style={{ padding: "2.5rem" }}>
                                {giving.submitted ? (
                                    <p style={{ textAlign: "center", color: "var(--navy)", fontWeight: 600, padding: "1rem 0" }}>
                                        ✓ Thank you! Please complete your gift of KSh {finalAmount.toLocaleString()} via M-Pesa or bank transfer using the details on the right — our team will follow up to confirm.
                                    </p>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Gift Category</label>
                                            <select className="form-select" value={giving.formData.category} onChange={e => giving.setField("category", e.target.value)}>
                                                <option>Tithes & Offerings</option>
                                                <option>Youth Ministry Fund</option>
                                                <option>Mission & Outreach</option>
                                                <option>Building Fund</option>
                                                <option>Scholarship Fund</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Amount (KSh)</label>
                                            <input
                                                className="form-input"
                                                type="number"
                                                placeholder="Custom amount"
                                                value={customAmount || selectedAmount}
                                                onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                                            />
                                        </div>
                                        <div className="amount-grid" style={{ justifyContent: "flex-start", marginBottom: "1rem" }}>
                                            {GIVING_AMOUNTS.map(a => (
                                                <button key={a} className={`amount-btn${selectedAmount === a ? " selected" : ""}`} style={{ border: "1.5px solid rgba(201,168,76,0.4)", color: "var(--navy)" }} onClick={() => { setSelectedAmount(a); setCustomAmount(""); }}>
                                                    {a.toLocaleString()}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Frequency</label>
                                            <select className="form-select" value={giving.formData.frequency} onChange={e => giving.setField("frequency", e.target.value)}>
                                                <option>One-Time Gift</option>
                                                <option>Weekly</option>
                                                <option>Monthly</option>
                                            </select>
                                        </div>
                                        <div className="grid-2" style={{ gap: "1rem" }}>
                                            <div className="form-group"><label className="form-label">First Name</label><input className="form-input" placeholder="First name" value={giving.formData.firstName} onChange={e => giving.setField("firstName", e.target.value)} /></div>
                                            <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" placeholder="Last name" value={giving.formData.lastName} onChange={e => giving.setField("lastName", e.target.value)} /></div>
                                        </div>
                                        <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="your@email.com" value={giving.formData.email} onChange={e => giving.setField("email", e.target.value)} /></div>
                                        {giving.error && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{giving.error}</p>}
                                        <button className="btn btn-gold" style={{ width: "100%", justifyContent: "center", fontSize: "1rem" }} disabled={giving.submitting} onClick={handleGiveSubmit}>
                                            {giving.submitting ? "Submitting..." : `💛 Give KSh ${finalAmount.toLocaleString()}`}
                                        </button>
                                        <p style={{ fontSize: "0.78rem", textAlign: "center", color: "var(--gray-400)", marginTop: "0.75rem" }}>
                                            This records your giving intent — complete payment via M-Pesa or bank transfer below. No card or payment details are collected here.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 700, color: "var(--navy)", marginBottom: "1.5rem" }}>Other Ways to Give</h2>
                            {[
                                { icon: "📱", title: "M-Pesa Paybill", desc: "Paybill No: 123456 · Account: STPAULS", tag: "Instant" },
                                { icon: "🏦", title: "Bank Transfer", desc: "Equity Bank · A/C: 1234567890 · Branch: Nairobi CBD", tag: "3-5 Days" },
                                { icon: "💵", title: "Cash & Cheque", desc: "Visit the church office Mon–Fri 8AM–5PM", tag: "In-Person" },
                            ].map((m, i) => (
                                <div key={i} className="card" style={{ padding: "1.5rem", marginBottom: "1rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                                    <div style={{ width: 48, height: 48, background: "var(--cream)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>{m.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "var(--navy)", fontSize: "1rem" }}>{m.title}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--gray-600)", marginTop: 4 }}>{m.desc}</div>
                                    </div>
                                    <span style={{ background: "rgba(201,168,76,0.12)", color: "var(--gold-dark)", padding: "4px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, flexShrink: 0 }}>{m.tag}</span>
                                </div>
                            ))}
                            <div className="card" style={{ padding: "2rem", background: "var(--navy)", textAlign: "center" }}>
                                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🌍</div>
                                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>Support Our Missions</div>
                                <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: "1.25rem" }}>Your gift to our missions fund directly supports outreach programs across Nairobi and beyond.</p>
                                <button className="btn btn-gold btn-sm" style={{ margin: "0 auto" }}>Give to Missions</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function BlogPage({ navigate, dark }) {
    const devotionalSub = useFormSubmit("newsletterSignups", { email: "" }, ["email"]);
    const testimony = useFormSubmit(
        "testimonies",
        { name: "", category: "Testimony / Personal Story", title: "", story: "" },
        ["name", "title", "story"]
    );

    const handleDevotionalSubmit = () => {
        if (!validateEmail(devotionalSub.formData.email)) return;
        devotionalSub.handleSubmit({ source: "blog-devotional" });
    };

    const handleTestimonySubmit = () => {
        if (testimony.formData.story.trim().length < 50) return;
        testimony.handleSubmit();
    };

    return (
        <>
            <div style={{ background: "linear-gradient(135deg, #1A3660 0%, var(--gold-dark) 100%)", padding: "8rem 2rem 4rem", textAlign: "center" }}>
                <div className="overline" style={{ color: "rgba(255,255,255,0.8)" }}>Word & Wisdom</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 900, color: "white", marginBottom: "1rem" }}>Blog & Devotionals</h1>
                <p style={{ color: "rgba(255,255,255,0.8)", maxWidth: 520, margin: "0 auto" }}>Articles, testimonies, devotionals, and scripture reflections to fuel your faith journey.</p>
            </div>
            <div className="section section-cream">
                <div className="container">
                    <div className="grid-3" style={{ marginBottom: "3rem" }}>
                        {BLOG_POSTS.map((b, i) => (
                            <div key={i} className="card blog-card" style={{ cursor: "pointer" }}>
                                <div className="blog-thumb" style={{ background: `linear-gradient(135deg, ${["var(--navy)", "var(--gold-dark)", "#1E3A7A"][i]} 0%, ${["var(--navy-mid)", "var(--gold)", "var(--navy)"][i]} 100%)` }}>{b.emoji}</div>
                                <div className="blog-content">
                                    <div className="blog-cat">{b.cat}</div>
                                    <div className="blog-title">{b.title}</div>
                                    <div className="blog-excerpt">{b.excerpt}</div>
                                    <div className="blog-meta"><span>{b.author}</span><span>{b.date}</span></div>
                                    <button className="btn btn-gold btn-sm" style={{ marginTop: "0.75rem" }}>Read More →</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card" style={{ padding: "2.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center", background: "var(--navy)", marginBottom: "2rem" }}>
                        <div>
                            <div className="overline" style={{ color: "var(--gold)" }}>Daily Devotional</div>
                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 700, color: "white", margin: "0.75rem 0" }}>Today's Scripture</h3>
                            <div style={{ padding: "1.5rem", background: "rgba(201,168,76,0.1)", borderLeft: "3px solid var(--gold)", borderRadius: "0 12px 12px 0", marginBottom: "1.25rem" }}>
                                <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "rgba(255,255,255,0.9)", lineHeight: 1.75, fontSize: "1.05rem" }}>
                                    "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."
                                </p>
                                <div style={{ color: "var(--gold)", fontWeight: 700, fontSize: "0.85rem", marginTop: "0.75rem" }}>Proverbs 3:5–6 · NIV</div>
                            </div>
                            <button className="btn btn-gold btn-sm">Read Full Devotional →</button>
                        </div>
                        <div>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, color: "white", marginBottom: "1rem" }}>📬 Get Daily Devotionals</div>
                            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>Start your mornings with a scripture, reflection, and prayer — delivered to your inbox daily.</p>
                            {devotionalSub.submitted ? (
                                <p style={{ color: "var(--gold-light)", fontWeight: 600 }}>✓ Subscribed! Your first devotional arrives tomorrow.</p>
                            ) : (
                                <div style={{ display: "flex", gap: "0.75rem" }}>
                                    <input
                                        className="newsletter-input"
                                        placeholder="Your email address"
                                        type="email"
                                        style={{ flex: 1 }}
                                        value={devotionalSub.formData.email}
                                        onChange={e => devotionalSub.setField("email", e.target.value)}
                                    />
                                    <button className="btn btn-gold btn-sm" disabled={devotionalSub.submitting} onClick={handleDevotionalSubmit}>
                                        {devotionalSub.submitting ? "..." : "Subscribe"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="section-header">
                        <div className="overline">Share Your Story</div>
                        <h2 className="section-title">Submit a Testimony</h2>
                        <p className="section-desc">Has God done something remarkable in your life? Your story could inspire thousands.</p>
                        <div className="gold-line" />
                    </div>
                    <div className="card" style={{ padding: "2.5rem", maxWidth: 650, margin: "0 auto" }}>
                        {testimony.submitted ? (
                            <p style={{ textAlign: "center", color: "var(--navy)", fontWeight: 600, padding: "1rem 0" }}>✓ Thank you for sharing! Your testimony has been submitted for review.</p>
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
                                <div className="form-group"><label className="form-label">Your Story</label><textarea className="form-textarea" style={{ minHeight: 150 }} placeholder="Share what God has done in your life... (minimum 50 characters)" value={testimony.formData.story} onChange={e => testimony.setField("story", e.target.value)} /></div>
                                {testimony.error && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{testimony.error}</p>}
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
