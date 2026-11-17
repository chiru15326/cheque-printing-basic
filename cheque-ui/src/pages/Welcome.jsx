import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Welcome() {
  const { user } = useAuth();
  const [banks, setBanks] = useState([]);

  useEffect(() => {
    api.getBanks().then(setBanks).catch(() => setBanks([]));
  }, []);

  return (
    <>
      <div className="card welcome">
        <h1>Welcome, {user?.fullName} 👋</h1>
        <p className="muted">Choose a cheque to print, or open the reports.</p>
      </div>

      <div className="tiles">
        {banks.map((b) => (
          <Link key={b.bankId} to={`/cheque/${b.bankId}`} className="card tile">
            <div className="tile__icon">🏦</div>
            <div className="tile__title">{b.bankName} Cheque</div>
            <div className="muted">Print a {b.bankName} cheque</div>
          </Link>
        ))}

        <Link to="/reports" className="card tile">
          <div className="tile__icon">📊</div>
          <div className="tile__title">Reports</div>
          <div className="muted">Printed cheques by date</div>
        </Link>
      </div>
    </>
  );
}
