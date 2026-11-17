import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="public-page">
      <div className="card hero">
        <div className="hero__icon">🧾</div>
        <h1>Cheque Printing</h1>
        <p>
          Print Union Bank and ICICI Bank cheques directly on blank cheque leaves: date, payee,
          amount, amount in words and A/C Payee. Every printed cheque is saved in reports.
        </p>

        {user ? (
          <Link to="/welcome" className="btn">Go to Dashboard</Link>
        ) : (
          <div className="btn-row center">
            <Link to="/login" className="btn">Login</Link>
            <Link to="/signup" className="btn btn-outline">Sign Up</Link>
          </div>
        )}
      </div>
    </div>
  );
}
