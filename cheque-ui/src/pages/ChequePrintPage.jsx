import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import ChequeCanvas from "../components/ChequeCanvas.jsx";
import PrintPortal from "../components/PrintPortal.jsx";
import { formatINR, toInputDate } from "../utils/format.js";

// key={bankId} resets the whole form when switching between Union Bank and ICICI from the menu
export default function ChequePrintPage() {
  const { bankId } = useParams();
  return <ChequeForm key={bankId} bankId={bankId} />;
}

const emptyForm = () => ({
  chequeNo: "",
  chequeDate: toInputDate(),
  payeeName: "",
  amount: "",
  isAccountPayee: true
});

function ChequeForm({ bankId }) {
  const [bank, setBank] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [words, setWords] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }

  // What gets printed (kept separate from the form so the form can be cleared after saving)
  const [printData, setPrintData] = useState(null);
  const [printGuides, setPrintGuides] = useState(false);
  const [printRequest, setPrintRequest] = useState(0);

  // Load bank layout (positions of each field)
  useEffect(() => {
    api.getBank(bankId).then(setBank).catch((e) => setLoadError(e.message));
  }, [bankId]);

  // Live "amount in words" from the API (Indian system: lakh / crore)
  useEffect(() => {
    const amt = parseFloat(form.amount);
    if (!(amt > 0)) {
      setWords("");
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const r = await api.amountInWords(amt);
        if (!cancelled) setWords(r.words);
      } catch {
        /* preview only - ignore */
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [form.amount]);

  // Open the browser print dialog AFTER React has drawn the print data
  useEffect(() => {
    if (!printRequest) return;
    const t = setTimeout(() => window.print(), 100);
    return () => clearTimeout(t);
  }, [printRequest]);

  const set = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const previewData = {
    chequeDate: form.chequeDate,
    payeeName: form.payeeName,
    amount: form.amount,
    amountInWords: words,
    isAccountPayee: form.isAccountPayee
  };

  const printAndSave = async (e) => {
    e.preventDefault();
    setMessage(null);

    const amount = parseFloat(form.amount);
    const payeeName = form.payeeName.trim();
    if (!form.chequeDate) return setMessage({ type: "error", text: "Select the cheque date." });
    if (!payeeName) return setMessage({ type: "error", text: "Enter the payee name." });
    if (!(amount > 0)) return setMessage({ type: "error", text: "Enter an amount greater than 0." });

    const ok = window.confirm(
      `Print ${bank.bankName} cheque?\n\nPay: ${payeeName}\nAmount: ₹ ${formatINR(amount)}\n\n` +
        "Put the blank cheque leaf in the printer first."
    );
    if (!ok) return;

    setSaving(true);
    try {
      const saved = await api.saveCheque({
        bankId: Number(bankId),
        chequeNo: form.chequeNo.trim() || null,
        chequeDate: form.chequeDate,
        payeeName,
        amount,
        isAccountPayee: form.isAccountPayee
      });

      // Print exactly what the server saved (server calculates the amount in words)
      setPrintData({
        chequeDate: saved.chequeDate,
        payeeName: saved.payeeName,
        amount: saved.amount,
        amountInWords: saved.amountInWords,
        isAccountPayee: saved.isAccountPayee
      });
      setPrintGuides(false);
      setPrintRequest((n) => n + 1);

      setMessage({ type: "success", text: `Saved as record #${saved.id}. Sending to printer…` });
      setForm({ ...emptyForm(), chequeDate: form.chequeDate });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Prints the current preview WITH outlines on plain paper (not saved) - hold it over a cheque to check alignment
  const testPrint = () => {
    setPrintData({
      ...previewData,
      payeeName: previewData.payeeName || "SAMPLE PAYEE NAME",
      amount: previewData.amount || 125000.5,
      amountInWords: previewData.amountInWords || "One Lakh Twenty Five Thousand and Fifty Paise Only"
    });
    setPrintGuides(true);
    setPrintRequest((n) => n + 1);
  };

  if (loadError) return <div className="alert alert-error">{loadError}</div>;
  if (!bank) return <p className="muted">Loading…</p>;

  return (
    <>
      <div className="page-head">
        <h1>{bank.bankName} Cheque</h1>
        <Link to={`/settings/${bank.bankId}`} className="btn btn-small btn-outline">⚙ Adjust Print Positions</Link>
      </div>

      <div className="grid-2">
        <form className="card" onSubmit={printAndSave}>
          {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

          <div className="row-2">
            <label className="field">
              <span>Cheque date</span>
              <input type="date" value={form.chequeDate} onChange={set("chequeDate")} required />
            </label>
            <label className="field">
              <span>Cheque no. (optional)</span>
              <input value={form.chequeNo} onChange={set("chequeNo")} maxLength={20} inputMode="numeric" />
            </label>
          </div>

          <label className="field">
            <span>Pay (payee name)</span>
            <input value={form.payeeName} onChange={set("payeeName")} maxLength={150} required />
          </label>

          <label className="field">
            <span>Amount (₹)</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              value={form.amount}
              onChange={set("amount")}
              required
            />
          </label>

          <div className="field">
            <span>Amount in words</span>
            <div className="words-box">{words || <span className="muted">—</span>}</div>
          </div>

          <label className="check">
            <input type="checkbox" checked={form.isAccountPayee} onChange={set("isAccountPayee")} />
            <span>A/C Payee</span>
          </label>

          <div className="btn-row">
            <button className="btn" disabled={saving}>{saving ? "Saving…" : "🖨 Print & Save"}</button>
            <button type="button" className="btn btn-outline" onClick={testPrint}>Test Print (plain paper)</button>
            <button type="button" className="btn btn-light" onClick={() => setForm(emptyForm())}>Clear</button>
          </div>
        </form>

        <div className="card">
          <h3>Preview</h3>
          <p className="muted small">Dashed boxes show where each value will print. They are not printed on the cheque.</p>
          <div className="cheque-scroll">
            <ChequeCanvas bank={bank} data={previewData} guides />
          </div>
          <div className="alert alert-info small">
            <b>Printer settings (first time):</b> Scale <b>100%</b> / "Actual size", Margins <b>None</b>,
            Headers and footers <b>off</b>. Feed the cheque in the same position every time.
          </div>
        </div>
      </div>

      {printData && <PrintPortal bank={bank} data={printData} guides={printGuides} />}
    </>
  );
}
