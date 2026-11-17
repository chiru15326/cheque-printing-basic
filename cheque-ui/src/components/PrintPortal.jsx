import { useEffect } from "react";
import { createPortal } from "react-dom";
import ChequeCanvas from "./ChequeCanvas.jsx";

/**
 * Renders the cheque OUTSIDE #root, directly under <body>.
 * - On screen it is hidden.
 * - When printing, the normal page is hidden and only this cheque is printed,
 *   on a page exactly the size of the cheque with zero margins.
 */
export default function PrintPortal({ bank, data, guides }) {
  // Turn on "cheque print mode" only while this component is on screen,
  // so printing other pages (e.g. Reports) still works normally.
  useEffect(() => {
    document.body.classList.add("cheque-print-mode");
    return () => document.body.classList.remove("cheque-print-mode");
  }, []);

  const pageCss = `@page { size: ${Number(bank.chequeWidthMm) || 202}mm ${Number(bank.chequeHeightMm) || 92}mm; margin: 0; }`;

  return createPortal(
    <div className="print-root">
      <style>{pageCss}</style>
      <ChequeCanvas bank={bank} data={data} guides={guides} />
    </div>,
    document.body
  );
}
