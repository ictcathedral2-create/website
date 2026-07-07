export const adminStyles = `
.admin-mobile-toggle { display: none; }
.admin-overlay { display: none; }

@media (max-width: 860px) {
  .admin-layout { position: relative; }
  .admin-sidebar {
    position: fixed; top: 0; left: 0; bottom: 0; z-index: 1200;
    transform: translateX(-100%); transition: transform 0.25s ease;
  }
  .admin-sidebar.open { transform: translateX(0); }
  .admin-main { width: 100%; padding: 4.5rem 1.25rem 2rem !important; }
  .admin-mobile-toggle {
    display: flex; align-items: center; justify-content: center;
    position: fixed; top: 1rem; left: 1rem; z-index: 1300;
    width: 42px; height: 42px; border-radius: 10px; border: none;
    background: var(--navy); color: white; font-size: 1.2rem; cursor: pointer;
    box-shadow: 0 2px 12px rgba(0,0,0,0.25);
  }
  .admin-overlay.open {
    display: block; position: fixed; inset: 0; z-index: 1100;
    background: rgba(0,0,0,0.4);
  }
}
`;
