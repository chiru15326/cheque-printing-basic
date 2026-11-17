const inr = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 125000.5 -> "1,25,000.50" (Indian grouping) */
export function formatINR(amount) {
  const n = Number(amount);
  return Number.isFinite(n) ? inr.format(n) : "";
}

/** Local date as yyyy-mm-dd (for <input type="date">). Avoids the UTC shift of toISOString(). */
export function toInputDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "2026-11-16" or "2026-11-16T00:00:00" -> "16112026" for the date boxes on the cheque */
export function toChequeDigits(dateText) {
  if (!dateText) return "";
  const [y, m, d] = dateText.slice(0, 10).split("-");
  return y && m && d ? `${d}${m}${y}` : "";
}

/** "2026-11-16T14:05:00" -> "16-11-2026" (optionally with time) */
export function displayDate(dateText, withTime = false) {
  if (!dateText) return "";
  const [datePart, timePart = ""] = dateText.split("T");
  const [y, m, d] = datePart.split("-");
  const base = `${d}-${m}-${y}`;
  return withTime && timePart ? `${base} ${timePart.slice(0, 5)}` : base;
}
