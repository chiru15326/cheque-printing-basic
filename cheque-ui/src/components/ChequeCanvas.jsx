import { formatINR, toChequeDigits } from "../utils/format.js";

const num = (v) => Number(v) || 0;

/** Common absolute-position style for a field, all in millimetres */
function fieldStyle(f, extra = {}) {
  return {
    left: `${num(f.xMm)}mm`,
    top: `${num(f.yMm)}mm`,
    fontSize: `${num(f.fontSizePt)}pt`,
    lineHeight: `${num(f.lineHeightMm)}mm`,
    ...extra
  };
}

/**
 * Draws the values of a cheque at exact mm positions.
 * - guides = false : only the values (for printing on a real cheque leaf)
 * - guides = true  : also dashed outlines + field names (screen preview / test print on plain paper)
 *
 * bank = { chequeWidthMm, chequeHeightMm, offsetXMm, offsetYMm, fields: [...] }
 * data = { chequeDate, payeeName, amount, amountInWords, isAccountPayee }
 */
export default function ChequeCanvas({ bank, data, guides = false }) {
  const f = Object.fromEntries((bank.fields || []).map((x) => [x.fieldName, x]));
  const digits = toChequeDigits(data.chequeDate).padEnd(8, " ").split("");
  const amount = Number(data.amount);

  return (
    <div
      className={`cheque ${guides ? "cheque--guides" : ""}`}
      style={{ width: `${num(bank.chequeWidthMm)}mm`, height: `${num(bank.chequeHeightMm)}mm` }}
    >
      <div
        className="cheque__inner"
        style={{ transform: `translate(${num(bank.offsetXMm)}mm, ${num(bank.offsetYMm)}mm)` }}
      >
        {/* Date: one digit per box, DDMMYYYY */}
        {f.Date && (
          <div className="cheque__field cheque__date" style={fieldStyle(f.Date)}>
            {guides && <span className="cheque__tag">Date</span>}
            {digits.map((d, i) => (
              <span
                key={i}
                className="cheque__datebox"
                style={{ width: `${num(f.Date.widthMm)}mm`, height: `${num(f.Date.lineHeightMm)}mm` }}
              >
                {d.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Pay ________ */}
        {f.Payee && (
          <div
            className="cheque__field cheque__single"
            style={fieldStyle(f.Payee, { width: `${num(f.Payee.widthMm)}mm`, height: `${num(f.Payee.lineHeightMm)}mm` })}
          >
            {guides && <span className="cheque__tag">Pay</span>}
            {data.payeeName}
          </div>
        )}

        {/* Rupees (in words) - line 1 starts after the printed word "Rupees", line 2 wraps */}
        {f.AmountWords && (
          <div
            className="cheque__field cheque__words"
            style={fieldStyle(f.AmountWords, {
              width: `${num(f.AmountWords.widthMm)}mm`,
              minHeight: `${num(f.AmountWords.lineHeightMm) * 2}mm`,
              textIndent: `${num(f.AmountWords.indentMm)}mm`
            })}
          >
            {guides && <span className="cheque__tag">Rupees in words</span>}
            {data.amountInWords}
          </div>
        )}

        {/* ₹ amount box */}
        {f.Amount && (
          <div
            className="cheque__field cheque__single cheque__amount"
            style={fieldStyle(f.Amount, { width: `${num(f.Amount.widthMm)}mm`, height: `${num(f.Amount.lineHeightMm)}mm` })}
          >
            {guides && <span className="cheque__tag">₹ Amount</span>}
            {amount > 0 ? `**${formatINR(amount)}/-` : ""}
          </div>
        )}

        {/* A/C Payee: two parallel lines at the top-left corner */}
        {f.AcPayee && (data.isAccountPayee || guides) && (
          <div
            className={`cheque__field cheque__acpayee ${data.isAccountPayee ? "" : "cheque__acpayee--off"}`}
            style={fieldStyle(f.AcPayee, { width: `${num(f.AcPayee.widthMm)}mm` })}
          >
            {data.isAccountPayee ? "A/C PAYEE" : "A/C PAYEE (off)"}
          </div>
        )}
      </div>
    </div>
  );
}
