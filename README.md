# Maps UTM Lead Finder

A Chrome extension that scans Google Maps for businesses in any visible area and identifies which ones **don't use UTM tracking** on their listed website URL — turning them into actionable sales leads.

Built by [Fox Digital](https://foxdigital.co.il)

---

## What It Does

When a business lists their website on Google Maps, some include UTM parameters in the URL (e.g. `?utm_source=google`), which means they're already tracking their Google Maps traffic. Businesses **without** UTM parameters are not tracking this channel — making them great candidates for digital marketing services.

This extension:
- Searches Google Maps for any business type you define
- Scans each result one by one and checks the listed website URL
- Flags businesses with **No UTM** as leads (highlighted in green)
- Exports the full list to CSV

---

## Installation

> No app store listing — load it directly in Chrome as an unpacked extension.

**Step 1 — Download the extension**

Clone or download this repository:
```bash
git clone https://github.com/orenagassy/Maps-UTM-Lead-Finder.git
```
Or click **Code → Download ZIP** on GitHub and extract it.

**Step 2 — Open Chrome Extensions**

In Chrome, go to:
```
chrome://extensions/
```

**Step 3 — Enable Developer Mode**

Toggle **Developer mode** on (top-right corner of the extensions page).

**Step 4 — Load the extension**

Click **Load unpacked** and select the `Maps-UTM-Lead-Finder` folder you downloaded.

The extension icon (blue square) will appear in your Chrome toolbar. Pin it for easy access.

---

## How to Use

### Basic workflow

1. **Open Google Maps** — go to [google.com/maps](https://www.google.com/maps) in Chrome.

2. **Navigate to your target area** — pan and zoom the map to show the geographic area you want to scan (a city, neighborhood, or business district).

3. **Search for a business type** — optionally type a search in Google Maps first (e.g. *"plumbers in Brooklyn"*) so results are already visible. This is the most reliable approach.

4. **Open the extension** — click the Maps UTM Lead Finder icon in your toolbar.

5. **Enter a business type** — type the kind of business you're targeting (e.g. `plumber`, `dentist`, `gym`, `restaurant`).

6. **Click "Scan Current View"** — the extension will scan every visible result, clicking each business to check its website URL.

7. **Watch results appear** — each scanned business appears in the table:
   - **No UTM ★** (green) — no UTM tracking, this is a lead
   - **Has UTM** (grey) — already tracking, skip
   - **No site** (red) — no website listed

8. **Export** — click **Export CSV** to download the full list with name, address, website, and UTM status.

---

### Example

You want to find plumbers in Queens, NY who aren't tracking their Google Maps traffic:

1. Go to `google.com/maps` and search **"plumber Queens NY"**
2. Open the extension, type `plumber`, click **Scan Current View**
3. The extension scans ~20 results. Result:
   - Joe's Plumbing — `joesplumbing.com` — **No UTM ★** ← lead
   - Roto-Rooter — `rotorooter.com?utm_source=google` — Has UTM
   - Fast Flow Inc — *(no website)* — No site
4. Click **Export CSV** → open in Excel → reach out to the "No UTM" businesses

---

## Tips

- **Pre-search in Maps first** for the most reliable results. The extension can trigger the search itself, but Maps sometimes loads differently depending on your session.
- **Reload the Maps tab** if you see a connection error, then click Scan again.
- The extension scans up to **80 results** per run. Zoom in on a smaller area to get a more targeted list.
- Results are **saved automatically** — if you close and reopen the popup mid-scan, your results are still there.

---

## Privacy

This extension runs entirely in your browser. No data is sent to any external server. Results are stored only in your browser's local storage and cleared when you start a new scan.

---

## Built by

[Fox Digital](https://foxdigital.co.il) — Digital marketing & web solutions.
