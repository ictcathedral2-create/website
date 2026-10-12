export const adminStyles = `
.adm { --adm-bg: #F6F4EF; --adm-line: #E6E1D6; --adm-muted: #8A8274; --adm-text: #2E2A25;
  --ok: #3E8E63; --ok-bg: rgba(62,142,99,0.12); --warn: #C2621F; --warn-bg: rgba(224,115,48,0.12);
  --info: #2F5E9E; --info-bg: rgba(47,94,158,0.1); --off: #8A8274; --off-bg: rgba(138,130,116,0.12);
  display: flex; height: 100vh; overflow: hidden; background: var(--adm-bg); color: var(--adm-text); font-family: var(--font-body); }

/* ── Sidebar ── */
.adm-sidebar { width: 268px; flex-shrink: 0; background: var(--navy); color: white; display: flex; flex-direction: column; height: 100vh; }
.adm-brand { display: flex; align-items: center; gap: 12px; padding: 1.4rem 1.25rem 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
.adm-brand img { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; background: white; }
.adm-brand-name { font-family: var(--font-display); font-weight: 700; font-size: 1.3rem; line-height: 1; }
.adm-brand-sub { font-size: 0.66rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gold-light); margin-top: 4px; }
.adm-nav { flex: 1; overflow-y: auto; padding: 0.75rem 0.75rem 1rem; }
.adm-nav-group { margin-top: 1rem; }
.adm-nav-group:first-child { margin-top: 0.25rem; }
.adm-nav-heading { font-size: 0.64rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.38); padding: 0 0.75rem 0.4rem; }
.adm-nav-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 0.55rem 0.75rem; border: none; border-radius: 8px; background: transparent;
  color: rgba(255,255,255,0.74); font-size: 0.84rem; font-weight: 500; text-align: left; cursor: pointer; transition: background 0.15s, color 0.15s; }
.adm-nav-item svg { flex-shrink: 0; opacity: 0.8; }
.adm-nav-item:hover { background: rgba(255,255,255,0.06); color: white; }
.adm-nav-item.active { background: rgba(201,168,76,0.16); color: var(--gold-light); font-weight: 600; }
.adm-nav-item.active svg { opacity: 1; }
.adm-nav-item:focus-visible { outline: 2px solid var(--gold); outline-offset: -2px; }
.adm-badge { margin-left: auto; min-width: 22px; padding: 1px 7px; border-radius: 999px; background: var(--gold); color: var(--navy); font-size: 0.7rem; font-weight: 700; text-align: center; }
.adm-user { padding: 1rem 1.25rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.08); }
.adm-user-email { font-size: 0.76rem; color: rgba(255,255,255,0.55); margin-bottom: 0.6rem; word-break: break-all; }
.adm-user-role { display: inline-block; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gold-light); margin-bottom: 0.35rem; }
.adm-user-actions { display: flex; gap: 0.5rem; }
.adm-user-actions a, .adm-user-actions button { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 0.5rem; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.18); background: transparent; color: rgba(255,255,255,0.85); font-size: 0.78rem; font-weight: 600; cursor: pointer; text-decoration: none; }
.adm-user-actions a:hover, .adm-user-actions button:hover { background: rgba(255,255,255,0.08); }

/* ── Main ── */
.adm-main { flex: 1; min-width: 0; overflow-y: auto; }
.adm-content { max-width: 1120px; margin: 0 auto; padding: 2.25rem 2.5rem 4rem; }
.adm-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
.adm-eyebrow { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold-dark); margin-bottom: 0.35rem; }
.adm-title { font-family: var(--font-display); font-size: 2.2rem; font-weight: 700; line-height: 1; color: var(--navy); margin: 0; }
.adm-title small { font-family: var(--font-body); font-size: 0.95rem; font-weight: 500; color: var(--adm-muted); margin-left: 0.4rem; }
.adm-subtitle { font-size: 0.88rem; color: var(--adm-muted); margin-top: 0.5rem; max-width: 620px; line-height: 1.5; }
.adm-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

/* Buttons (complements the site's .btn) */
.adm-btn { display: inline-flex; align-items: center; gap: 6px; padding: 0.5rem 0.95rem; border-radius: 8px; border: 1px solid var(--adm-line); background: white;
  color: var(--navy); font-size: 0.82rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 0.15s, border-color 0.15s; }
.adm-btn:hover:not(:disabled) { border-color: var(--gold); background: #FFFDF8; }
.adm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.adm-btn.primary { background: var(--navy); border-color: var(--navy); color: white; }
.adm-btn.primary:hover:not(:disabled) { background: var(--navy-mid); }
.adm-btn.gold { background: var(--gold); border-color: var(--gold); color: var(--navy); }
.adm-btn.gold:hover:not(:disabled) { background: var(--gold-light); }
.adm-btn.danger { color: #B4471A; }
.adm-btn.danger:hover:not(:disabled) { border-color: #E07330; background: rgba(224,115,48,0.06); }
.adm-btn.ghost { border-color: transparent; background: transparent; }
.adm-btn.ghost:hover:not(:disabled) { background: rgba(14,32,68,0.05); border-color: transparent; }
.adm-btn.sm { padding: 0.35rem 0.7rem; font-size: 0.76rem; }

/* Toolbar: search + filters */
.adm-toolbar { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-bottom: 1.25rem; }
.adm-search { position: relative; flex: 1; min-width: 220px; }
.adm-search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--adm-muted); }
.adm-search input { width: 100%; padding: 0.6rem 0.9rem 0.6rem 2.3rem; border: 1px solid var(--adm-line); border-radius: 10px; background: white; font-size: 0.86rem; color: var(--adm-text); }
.adm-search input:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.18); }
.adm-filters { display: flex; gap: 0.35rem; flex-wrap: wrap; }
.adm-filter { padding: 0.42rem 0.8rem; border-radius: 999px; border: 1px solid var(--adm-line); background: white; color: var(--adm-muted); font-size: 0.78rem; font-weight: 600; cursor: pointer; text-transform: capitalize; }
.adm-filter span { opacity: 0.7; margin-left: 4px; font-weight: 500; }
.adm-filter.active { background: var(--navy); border-color: var(--navy); color: white; }

/* Cards and records */
.adm-card { background: white; border: 1px solid var(--adm-line); border-radius: 14px; }
.adm-list { display: grid; gap: 0.75rem; }
.adm-record { padding: 1.1rem 1.25rem; }
.adm-record-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.adm-record-title { font-weight: 700; color: var(--navy); font-size: 0.98rem; line-height: 1.3; }
.adm-record-meta { font-size: 0.76rem; color: var(--adm-muted); margin-top: 3px; }
.adm-fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 0.6rem 1.25rem; margin-top: 0.85rem; }
.adm-field-label { font-size: 0.66rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--adm-muted); margin-bottom: 2px; }
.adm-field-value { font-size: 0.88rem; color: var(--adm-text); word-break: break-word; }
.adm-field-value a { color: var(--info); font-weight: 600; text-decoration: none; }
.adm-field.wide { grid-column: 1 / -1; }
.adm-longtext { white-space: pre-wrap; line-height: 1.55; }
.adm-more { border: none; background: none; color: var(--gold-dark); font-weight: 700; font-size: 0.78rem; cursor: pointer; padding: 0; margin-left: 4px; }
.adm-record-foot { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem; padding-top: 0.85rem; border-top: 1px solid var(--adm-line); }
.adm-status-set { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; }
.adm-status-set > span { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--adm-muted); margin-right: 0.25rem; }
.adm-group-title { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin: 1.75rem 0 0.75rem; }
.adm-group-title h3 { font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; color: var(--navy); margin: 0; }
.adm-group-title h3 small { font-family: var(--font-body); font-size: 0.8rem; font-weight: 500; color: var(--adm-muted); margin-left: 0.35rem; }

/* Status pills */
.adm-pill { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.03em; text-transform: capitalize; white-space: nowrap; border: 1px solid transparent; }
.adm-pill::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.adm-pill.tone-warn { background: var(--warn-bg); color: var(--warn); }
.adm-pill.tone-ok { background: var(--ok-bg); color: var(--ok); }
.adm-pill.tone-info { background: var(--info-bg); color: var(--info); }
.adm-pill.tone-off { background: var(--off-bg); color: var(--off); }
button.adm-pill { cursor: pointer; background: white; border-color: var(--adm-line); color: var(--adm-muted); }
button.adm-pill:hover:not(:disabled) { border-color: currentColor; }
button.adm-pill.selected.tone-warn { background: var(--warn-bg); color: var(--warn); border-color: transparent; }
button.adm-pill.selected.tone-ok { background: var(--ok-bg); color: var(--ok); border-color: transparent; }
button.adm-pill.selected.tone-info { background: var(--info-bg); color: var(--info); border-color: transparent; }
button.adm-pill.selected.tone-off { background: var(--off-bg); color: var(--off); border-color: transparent; }
button.adm-pill:not(.selected)::before { opacity: 0.35; }

/* Forms */
.adm-form { padding: 1.25rem; background: #FBFAF6; border: 1px solid var(--adm-line); border-radius: 14px; margin-bottom: 1rem; }
.adm-form-title { font-weight: 700; color: var(--navy); margin-bottom: 1rem; font-size: 1rem; }
.adm-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.9rem 1rem; }
.adm-form-grid .full { grid-column: 1 / -1; }
.adm-form .form-group { margin-bottom: 0; }
.adm-hint { font-size: 0.74rem; color: var(--adm-muted); margin-top: 4px; line-height: 1.45; }
.adm-form-actions { display: flex; gap: 0.5rem; margin-top: 1.1rem; }
.adm-check { display: flex; align-items: center; gap: 0.55rem; font-size: 0.86rem; color: var(--adm-text); cursor: pointer; }

/* Notices */
.adm-notice { display: flex; gap: 10px; align-items: flex-start; padding: 0.75rem 0.95rem; border-radius: 10px; font-size: 0.82rem; line-height: 1.5; margin-bottom: 0.9rem; }
.adm-notice svg { flex-shrink: 0; margin-top: 2px; }
.adm-notice.warn { background: var(--warn-bg); color: #8F4512; }
.adm-notice.error { background: rgba(190,50,30,0.1); color: #9B2C1A; }
.adm-notice.info { background: var(--info-bg); color: #24497D; }
.adm-notice ul { margin: 0; padding-left: 1.1rem; }

.adm-empty { text-align: center; padding: 3rem 1.5rem; color: var(--adm-muted); font-size: 0.9rem; }
.adm-empty svg { color: var(--gold); margin-bottom: 0.75rem; }
.adm-empty strong { display: block; color: var(--navy); font-size: 1rem; margin-bottom: 0.25rem; }
.adm-loading { padding: 2rem 0; color: var(--adm-muted); font-size: 0.9rem; }

/* Overview */
.adm-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.85rem; margin-bottom: 2rem; }
.adm-stat { display: flex; flex-direction: column; gap: 0.4rem; padding: 1.1rem 1.2rem; text-align: left; cursor: pointer; transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s; font: inherit; color: inherit; }
.adm-stat:hover { border-color: var(--gold); transform: translateY(-1px); box-shadow: 0 6px 18px rgba(14,32,68,0.06); }
.adm-stat-top { display: flex; align-items: center; justify-content: space-between; color: var(--adm-muted); font-size: 0.78rem; font-weight: 600; }
.adm-stat-top svg { color: var(--gold-dark); }
.adm-stat-num { font-family: var(--font-display); font-size: 2.3rem; font-weight: 700; line-height: 1; color: var(--navy); }
.adm-stat-num.zero { color: #C9C2B4; }
.adm-stat-note { font-size: 0.74rem; color: var(--adm-muted); }
.adm-two-col { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 1.25rem; }
.adm-panel { padding: 1.25rem 1.35rem; }
.adm-panel h3 { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--adm-muted); margin: 0 0 0.9rem; }
.adm-row { display: flex; align-items: center; gap: 0.85rem; padding: 0.7rem 0; border-top: 1px solid var(--adm-line); }
.adm-row:first-of-type { border-top: none; padding-top: 0; }
.adm-row-main { flex: 1; min-width: 0; }
.adm-row-title { font-weight: 600; color: var(--navy); font-size: 0.88rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.adm-row-sub { font-size: 0.76rem; color: var(--adm-muted); }

/* Event date tile */
.adm-date { width: 58px; height: 62px; flex-shrink: 0; border-radius: 12px; background: var(--navy); color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.adm-date b { font-family: var(--font-display); font-size: 1.6rem; line-height: 0.95; color: var(--gold); }
.adm-date span { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.85; }
.adm-date em { font-style: normal; font-size: 0.55rem; opacity: 0.6; }
.adm-date.past { background: #B9B2A4; }
.adm-date.past b { color: white; }
.adm-date.sm { width: 46px; height: 48px; border-radius: 10px; }
.adm-date.sm b { font-size: 1.25rem; }

/* Image grid */
.adm-images { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
.adm-image { overflow: hidden; }
.adm-image img { width: 100%; display: block; object-fit: cover; background: var(--adm-bg); }
.adm-image-body { padding: 0.8rem; display: grid; gap: 0.5rem; }
.adm-image-body input { width: 100%; padding: 0.5rem 0.7rem; border: 1px solid var(--adm-line); border-radius: 8px; font-size: 0.82rem; }
.adm-image-body input:focus { outline: none; border-color: var(--gold); }
.adm-dropzone { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem; padding: 1.5rem; border: 2px dashed var(--adm-line); border-radius: 14px;
  background: white; color: var(--adm-muted); font-size: 0.86rem; cursor: pointer; text-align: center; margin-bottom: 1.25rem; transition: border-color 0.15s, background 0.15s; }
.adm-dropzone:hover, .adm-dropzone.over { border-color: var(--gold); background: #FFFDF8; }
.adm-dropzone strong { color: var(--navy); }

/* Toasts */
.adm-toasts { position: fixed; right: 1.25rem; bottom: 1.25rem; z-index: 2000; display: grid; gap: 0.5rem; }
.adm-toast { display: flex; align-items: center; gap: 8px; padding: 0.7rem 1rem; border-radius: 10px; background: var(--navy); color: white; font-size: 0.84rem; font-weight: 500;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: adm-in 0.2s ease; max-width: 360px; }
.adm-toast.error { background: #9B2C1A; }
@keyframes adm-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* Mobile */
.adm-topbar { display: none; }
.adm-overlay { display: none; }
@media (max-width: 900px) {
  .adm-sidebar { position: fixed; top: 0; left: 0; bottom: 0; z-index: 1200; transform: translateX(-100%); transition: transform 0.25s ease; }
  .adm-sidebar.open { transform: none; box-shadow: 0 0 40px rgba(0,0,0,0.3); }
  .adm-overlay.open { display: block; position: fixed; inset: 0; z-index: 1100; background: rgba(0,0,0,0.4); }
  .adm-topbar { display: flex; align-items: center; gap: 0.75rem; position: sticky; top: 0; z-index: 10; padding: 0.7rem 1rem; background: var(--navy); color: white; }
  .adm-topbar button { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border: none; border-radius: 9px; background: rgba(255,255,255,0.1); color: white; cursor: pointer; }
  .adm-topbar strong { font-size: 0.95rem; }
  .adm-content { padding: 1.25rem 1rem 3rem; }
  .adm-title { font-size: 1.75rem; }
  .adm-two-col { grid-template-columns: 1fr; }
  .adm-form-grid { grid-template-columns: 1fr; }
  .adm-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
`;
