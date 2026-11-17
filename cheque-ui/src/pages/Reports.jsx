import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import { displayDate, formatINR, toInputDate } from "../utils/format.js";

const firstOfMonth = () => {
  const d = new Date();
  return toInputDate(new Date(d.getFullYear(), d.getMonth(), 1));
};

export default function Reports() {
  const [banks, setBanks] = useState([]);
  const [filters, setFilters] = useState({
    from: firstOfMonth(),
    to: toInputDate(),
    bankId: "",
    dateField: "printed"
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (f) => {
    setError("");
    if (f.from && f.to && f.from > f.to) {
      setError("From date cannot be after To date.");
      return;
    }
    setLoading(true);
    try {
      setRows(await api.getCheques(f));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.getBanks().then(setBanks).catch(() => setBanks([]));
    load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  const search = (e) => {
    e.preventDefault();
    load(filters);
  };

  const remove = async (row) => {
    const ok = window.confirm(
      `Delete this record?\n\n${row.bankName} · ${row.payeeName} · ₹ ${formatINR(row.amount)}`
    );
    if (!ok) return;
    try {
      await api.deleteCheque(row.id);
      setRows((r) => r.filter((x) => x.id !== row.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <>
      <div className="page-head">
        <h1>Cheque Reports</h1>
        <button className="btn btn-small btn-outline no-print" onClick={() => window.print()}>🖨 Print report</button>
      </div>

      <form className="card filters no-print" onSubmit={search}>
        <label className="field">
          <span>From date</span>
          <input type="date" value={filters.from} onChange={set("from")} />
        </label>
        <label className="field">
          <span>To date</span>
          <input type="date" value={filters.to} onChange={set("to")} />
        </label>
        <label className="field">
          <span>Date type</span>
          <select value={filters.dateField} onChange={set("dateField")}>
            <option value="printed">Printed date</option>
            <option value="cheque">Cheque date</option>
          </select>
        </label>
        <label className="field">
          <span>Bank</span>
          <select value={filters.bankId} onChange={set("bankId")}>
            <option value="">All banks</option>
            {banks.map((b) => (
              <option key={b.bankId} value={b.bankId}>{b.bankName}</option>
            ))}
          </select>
        </label>
        <button className="btn" disabled={loading}>{loading ? "Loading…" : "Search"}</button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <p className="report-summary">
          {displayDate(filters.from)} to {displayDate(filters.to)} · <b>{rows.length}</b> cheque(s) · Total{" "}
          <b>₹ {formatINR(total)}</b>
        </p>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Printed on</th>
                <th>Bank</th>
                <th>Cheque no.</th>
                <th>Cheque date</th>
                <th>Payee</th>
                <th className="num">Amount (₹)</th>
                <th>A/C Payee</th>
                <th>Printed by</th>
                <th className="no-print"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="muted center">{loading ? "Loading…" : "No cheques found for these dates."}</td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{displayDate(r.printedOn, true)}</td>
                  <td>{r.bankName}</td>
                  <td>{r.chequeNo || "—"}</td>
                  <td>{displayDate(r.chequeDate)}</td>
                  <td title={r.amountInWords}>{r.payeeName}</td>
                  <td className="num">{formatINR(r.amount)}</td>
                  <td>{r.isAccountPayee ? "Yes" : "No"}</td>
                  <td>{r.printedByName}</td>
                  <td className="no-print">
                    <button className="btn btn-small btn-danger" onClick={() => remove(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
