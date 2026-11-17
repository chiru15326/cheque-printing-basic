import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import ChequeCanvas from "../components/ChequeCanvas.jsx";
import PrintPortal from "../components/PrintPortal.jsx";
import { toInputDate } from "../utils/format.js";

const SAMPLE = {
  chequeDate: toInputDate(),
  payeeName: "SAMPLE PAYEE NAME",
  amount: 125000.5,
  amountInWords: "One Lakh Twenty Five Thousand and Fifty Paise Only",
  isAccountPayee: true
};

const BANK_KEYS = [
  ["chequeWidthMm", "Cheque width (mm)"],
  ["chequeHeightMm", "Cheque height (mm)"],
  ["offsetXMm", "Move ALL right (+) / left (−) mm"],
  ["offsetYMm", "Move ALL down (+) / up (−) mm"]
];

const FIELD_KEYS = [
  ["xMm", "X (mm)"],
  ["yMm", "Y (mm)"],
  ["widthMm", "Width (mm)"],
  ["fontSizePt", "Font (pt)"],
  ["lineHeightMm", "Line height (mm)"],
  ["indentMm", "Indent (mm)"]
];

export default function LayoutSettings() {
  const { bankId } = useParams();
  const [saved, setSaved] = useState(null); // last saved copy (for Reset)
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(0);

  useEffect(() => {
    setDraft(null);
    api
      .getBank(bankId)
      .then((b) => {
        setSaved(b);
        setDraft(structuredClone(b));
      })
      .catch((e) => setMessage({ type: "error", text: e.message }));
  }, [bankId]);

  useEffect(() => {
    if (!printing) return;
    const t = setTimeout(() => window.print(), 100);
    return () => clearTimeout(t);
  }, [printing]);

  // Values stay as text while typing (so "4." or "-" can be typed); converted on save
  const setBankValue = (key) => (e) => setDraft({ ...draft, [key]: e.target.value });
  const setFieldValue = (id, key) => (e) =>
    setDraft({
      ...draft,
      fields: draft.fields.map((f) => (f.id === id ? { ...f, [key]: e.target.value } : f))
    });

  const save = async () => {
    setMessage(null);
    setSaving(true);
    try {
      const n = (v) => Number(v) || 0;
      const result = await api.saveLayout(bankId, {
        chequeWidthMm: n(draft.chequeWidthMm),
        chequeHeightMm: n(draft.chequeHeightMm),
        offsetXMm: n(draft.offsetXMm),
        offsetYMm: n(draft.offsetYMm),
        fields: draft.fields.map((f) => ({
          ...f,
          xMm: n(f.xMm),
          yMm: n(f.yMm),
          widthMm: n(f.widthMm),
          fontSizePt: n(f.fontSizePt),
          lineHeightMm: n(f.lineHeightMm),
          indentMm: n(f.indentMm)
        }))
      });
      setSaved(result);
      setDraft(structuredClone(result));
      setMessage({ type: "success", text: "Positions saved." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!draft) {
    return message ? <div className={`alert alert-${message.type}`}>{message.text}</div> : <p className="muted">Loading…</p>;
  }

  return (
    <>
      <div className="page-head">
        <h1>Adjust Print Positions – {draft.bankName}</h1>
        <Link to={`/cheque/${draft.bankId}`} className="btn btn-small btn-outline">← Back to cheque</Link>
      </div>

      <div className="card">
        <ol className="steps small">
          <li>Measure each field on a real {draft.bankName} cheque leaf with a ruler, in mm from the <b>top-left corner</b>.</li>
          <li>Enter the values below and click <b>Save</b>.</li>
          <li>Click <b>Test Print</b> on plain A4 paper fed the same way as a cheque, hold it over a cheque against the light and correct the numbers.</li>
          <li>If <i>everything</i> is shifted by the same amount, change only the "Move ALL" values.</li>
        </ol>

        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <div className="row-4">
          {BANK_KEYS.map(([key, label]) => (
            <label key={key} className="field">
              <span>{label}</span>
              <input type="number" step="0.1" value={draft[key]} onChange={setBankValue(key)} />
            </label>
          ))}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Field</th>
                {FIELD_KEYS.map(([key, label]) => <th key={key}>{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {draft.fields.map((f) => (
                <tr key={f.id}>
                  <td>{f.label}</td>
                  {FIELD_KEYS.map(([key]) => (
                    <td key={key}>
                      <input
                        className="input-small"
                        type="number"
                        step="0.1"
                        value={f[key]}
                        onChange={setFieldValue(f.id, key)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          Date: <i>Width</i> = width of one digit box. Rupees in words: <i>Indent</i> = space before line 1
          (after the printed word "Rupees"), <i>Line height</i> = gap between line 1 and line 2.
        </p>

        <div className="btn-row">
          <button className="btn" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          <button className="btn btn-outline" onClick={() => setPrinting((n) => n + 1)}>Test Print (plain paper)</button>
          <button className="btn btn-light" onClick={() => setDraft(structuredClone(saved))}>Reset</button>
        </div>
      </div>

      <div className="card">
        <h3>Live preview</h3>
        <div className="cheque-scroll">
          <ChequeCanvas bank={draft} data={SAMPLE} guides />
        </div>
      </div>

      {printing > 0 && <PrintPortal bank={draft} data={SAMPLE} guides />}
    </>
  );
}
