import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Signup() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/welcome" replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const auth = await api.register(form.fullName, form.email, form.password);
      signIn(auth);
      navigate("/welcome", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-page">
      <form className="card auth-card" onSubmit={submit}>
        <h2>Sign Up</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <label className="field">
          <span>Full name</span>
          <input value={form.fullName} onChange={set("fullName")} required autoFocus />
        </label>

        <label className="field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={set("email")} required />
        </label>

        <label className="field">
          <span>Password</span>
          <input type="password" value={form.password} onChange={set("password")} required />
        </label>

        <label className="field">
          <span>Confirm password</span>
          <input type="password" value={form.confirm} onChange={set("confirm")} required />
        </label>

        <button className="btn btn-block" disabled={loading}>{loading ? "Creating account…" : "Sign Up"}</button>

        <p className="muted center">
          Already registered? <Link to="/login">Login</Link> · <Link to="/">Home</Link>
        </p>
      </form>
    </div>
  );
}
