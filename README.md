# Cheque Printing App

.NET 8 Web API + React (Vite) + SQLite. Runs on **one Windows PC**. Every phone, tablet or laptop on the same Wi-Fi opens it in a browser. No cloud, no SQL Server, and **nothing to install on the host PC** (the API is published self-contained).

```
ChequePrinting/
├─ ChequeApi/          .NET 8 Web API (also serves the React app from wwwroot)
│  ├─ Controllers/     Auth, Banks (layout), Cheques (print records + report)
│  ├─ Data/            AppDbContext + seed data (Union Bank, ICICI Bank, field positions)
│  ├─ Models/          User, Bank, ChequeLayout, ChequePrint
│  ├─ Services/        AmountInWords (Indian lakh/crore), TokenService (JWT)
│  └─ Program.cs
├─ cheque-ui/          React app (Vite)
│  └─ src/pages/       Home, Login, Signup, Welcome, ChequePrintPage, LayoutSettings, Reports
├─ publish.bat         build React + publish API to C:\Apps\ChequeApp
├─ install-service.bat Windows Service + firewall rule (run as admin, once)
├─ uninstall-service.bat
└─ backup-db.bat
```

## What you need on your DEVELOPMENT PC
- .NET 8 SDK
- Node.js 18+ (20 LTS recommended)

The **host PC** (the one that runs the app) needs nothing installed.

---

## 1. Before the first run

Open `ChequeApi/appsettings.json` and change `Jwt:Key` to your own long random text (at least 32 characters).

## 2. Run in development

Terminal 1 (API on port 5000):
```bash
cd ChequeApi
dotnet run
```
The first run creates `ChequeDb.db` with the tables, the two banks and starting field positions.

Terminal 2 (React on port 5173, forwards `/api` to 5000):
```bash
cd cheque-ui
npm install
npm run dev
```
Open http://localhost:5173 → Sign Up → you land on the Welcome page.

## 3. Deploy on the host PC (LAN)

1. Run **`publish.bat`**. It builds React into `ChequeApi/wwwroot` and publishes everything to `C:\Apps\ChequeApp`.
   (Build on another PC? Copy the `C:\Apps\ChequeApp` folder to the host PC.)
2. On the host PC, right-click **`install-service.bat`** → **Run as administrator**. It:
   - creates the Windows Service `ChequeApp` (starts automatically with Windows, restarts if it crashes)
   - opens TCP port 5000 in Windows Firewall for Private networks
   - shows the PC's IP address
3. In Windows, set the Wi-Fi network to **Private** (Settings → Network & Internet → Wi-Fi → your network).
4. Give the host PC a **fixed IP**. Best option: DHCP / Address Reservation in your router's admin page.
5. On any device on the Wi-Fi, open `http://<host-ip>:5000`, for example `http://192.168.1.10:5000`.

**Updating later:** run `publish.bat` again as administrator. It stops the service, copies the new files and starts it again. `ChequeDb.db` is never overwritten.

**Backup:** run `backup-db.bat` as administrator. It copies the database to `C:\Apps\ChequeBackups` with the date in the name.

---

## 4. Setting up cheque printing (do this once per bank)

1. Open **Cheque Printing → Union Bank Cheque → ⚙ Adjust Print Positions**.
2. With a ruler, measure each field on a real cheque leaf, in **mm from the top-left corner**, and enter:
   - **Date**: X/Y of the first date box. *Width* = width of ONE digit box (8 boxes, DDMMYYYY).
   - **Pay**: start of the payee line.
   - **Rupees in words**: X/Y of line 1. *Indent* = space before the text on line 1 (after the printed word "Rupees"). *Line height* = gap to line 2.
   - **Amount**: inside the ₹ box.
   - **A/C Payee**: top-left corner where the two crossing lines go.
3. **Save**, then **Test Print** on plain A4 paper fed exactly like a cheque. Hold it over a real cheque against the light and adjust.
4. If *everything* is off by the same amount (the printer feeds slightly differently), change only **Move ALL right/down**.
5. Repeat for ICICI Bank.

### Printer settings (in the browser's print dialog)
- Scale: **100%** / **Actual size** (not "Fit to page")
- Margins: **None**
- Headers and footers: **off**
- Paper: the app asks for a page the size of the cheque (202 × 92 mm). If your printer doesn't offer that size, add a custom paper size (202 × 92 mm) in the printer driver, or use A4 and fix the position with "Move ALL".
- Feed the cheque the same way every time (manual or envelope feed, against the same guide).

### Printing a cheque
Fill in date, payee, amount (the amount in words appears automatically), tick A/C Payee → **🖨 Print & Save**. The record is saved first, then the print dialog opens with only the cheque values on the page.

---

## 5. API endpoints

| Method | URL | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Sign up → JWT |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/banks` | Banks for the menu |
| GET | `/api/banks/{id}` | Bank + field positions |
| PUT | `/api/banks/{id}/layout` | Save positions |
| GET | `/api/cheques/amount-in-words?amount=125000.50` | Live amount in words |
| POST | `/api/cheques` | Save a printed cheque |
| GET | `/api/cheques?from=2026-11-01&to=2026-11-30&bankId=1&dateField=printed` | Report (`dateField` = `printed` or `cheque`) |
| DELETE | `/api/cheques/{id}` | Soft delete (hidden from reports, kept in the DB) |

## 6. Adding another bank later
Insert a row in `Banks` and its five rows in `ChequeLayouts` (copy from bank 1). It appears in the menu automatically. You can use DB Browser for SQLite to edit the tables.

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| Works on the host PC, not on the phone | Wi-Fi profile must be **Private**; check the firewall rule; use the right IP (`ipconfig`) |
| Page not found after refreshing `/reports` | Already handled by `MapFallbackToFile("index.html")`; make sure you ran `npm run build` before publishing |
| Service doesn't start | Check Event Viewer → Windows Logs → Application. Usually a `Jwt:Key` shorter than 32 characters |
| "Session expired" | The token is valid for 12 hours (`Jwt:ExpiryHours`). Log in again |
| Print is shrunk or shifted | Scale 100%, margins none, then calibrate with Test Print |
| The phone can't see the printer | Use a Wi-Fi printer, share the printer from the host PC, or print from the PC the printer is connected to |
| App stops after a while | Power settings on the host PC: Sleep → **Never** |

> Security: the app uses plain HTTP and is meant for your own Wi-Fi only. Use a Wi-Fi password your guests don't have, and **don't forward port 5000 to the internet** from your router.
