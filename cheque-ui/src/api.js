// All calls use a relative URL, so the app works from any device:
// http://localhost:5000, http://192.168.1.10:5000, etc.
const API_BASE = "/api";

let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

function extractError(data) {
  if (!data) return null;
  if (data.message) return data.message;
  // ASP.NET validation errors: { errors: { Field: ["msg"] } }
  if (data.errors) {
    const first = Object.values(data.errors).flat()[0];
    if (first) return first;
  }
  return data.title || null;
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = localStorage.getItem("token");
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error("Cannot reach the server. Check that the host PC is on and connected to Wi-Fi.");
  }

  if (res.status === 401 && auth) {
    unauthorizedHandler?.();
    throw new Error("Your session has expired. Please log in again.");
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) throw new Error(extractError(data) || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // Auth
  register: (fullName, email, password) =>
    request("/auth/register", { method: "POST", body: { fullName, email, password }, auth: false }),
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password }, auth: false }),

  // Banks / layout
  getBanks: () => request("/banks"),
  getBank: (bankId) => request(`/banks/${bankId}`),
  saveLayout: (bankId, layout) => request(`/banks/${bankId}/layout`, { method: "PUT", body: layout }),

  // Cheques
  amountInWords: (amount) => request(`/cheques/amount-in-words?amount=${encodeURIComponent(amount)}`),
  saveCheque: (cheque) => request("/cheques", { method: "POST", body: cheque }),
  getCheques: ({ from, to, bankId, dateField }) => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (bankId) q.set("bankId", bankId);
    if (dateField) q.set("dateField", dateField);
    return request(`/cheques?${q.toString()}`);
  },
  deleteCheque: (id) => request(`/cheques/${id}`, { method: "DELETE" })
};
