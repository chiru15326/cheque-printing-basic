import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function NavBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [banks, setBanks] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Sub-menu items come from the Banks table (Union Bank, ICICI Bank, ...)
  useEffect(() => {
    api.getBanks().then(setBanks).catch(() => setBanks([]));
  }, []);

  // Close the dropdown when the page changes
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Close the dropdown when clicking / tapping outside it (needed for phones: no hover)
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [menuOpen]);

  const logout = () => {
    signOut();
    navigate("/", { replace: true });
  };

  const chequeActive = location.pathname.startsWith("/cheque") || location.pathname.startsWith("/settings");

  return (
    <header className="navbar no-print">
      <Link to="/welcome" className="navbar__brand">🧾 Cheque Printing</Link>

      <nav className="navbar__menu">
        <NavLink to="/welcome" className="navbar__link">Home</NavLink>

        <div className="dropdown" ref={menuRef}>
          <button
            type="button"
            className={`navbar__link dropdown__toggle ${chequeActive ? "active" : ""}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
          >
            Cheque Printing ▾
          </button>

          {menuOpen && (
            <div className="dropdown__menu">
              {banks.length === 0 && <span className="dropdown__empty">Loading…</span>}
              {banks.map((b) => (
                <NavLink key={b.bankId} to={`/cheque/${b.bankId}`} className="dropdown__item">
                  {b.bankName} Cheque
                </NavLink>
              ))}
            </div>
          )}
        </div>

        <NavLink to="/reports" className="navbar__link">Reports</NavLink>
      </nav>

      <div className="navbar__user">
        <span className="navbar__name">{user?.fullName}</span>
        <button type="button" className="btn btn-small btn-light" onClick={logout}>Logout</button>
      </div>
    </header>
  );
}
