# Chrome Web Store — Listing Content

## Extension name
Maps UTM Lead Finder

## Short description (max 132 chars)
Find businesses on Google Maps that don't use UTM tracking — identify marketing leads and export to CSV instantly.

## Full description

**Turn Google Maps into a lead generation tool.**

Maps UTM Lead Finder scans any area on Google Maps, checks each business's listed website URL for UTM tracking parameters, and flags businesses that aren't tracking their Google Maps traffic — making them ideal prospects for digital marketing services.

---

**How it works:**

1. Open Google Maps and navigate to your target area
2. Search for a business type (e.g. "plumber", "dentist", "gym")
3. Click Scan Current View in the extension popup
4. The extension visits each result, checks the listed website URL, and classifies it:
   - ✅ No UTM — not tracking Google Maps traffic → **your lead**
   - ⬜ Has UTM — already tracking, probably has a marketing team
   - ❌ No site — no website listed on their Maps profile

5. Export the full list to CSV with one click

---

**Features:**
- Scans up to 80 businesses per run
- Live results — appear row by row as each business is checked
- One-click CSV export (name, address, website, UTM status, Maps link)
- Results saved automatically if you close and reopen the popup
- No login, no API key, no account required
- Works entirely in your browser — no data sent anywhere

**Built by [Fox Digital](https://foxdigital.co.il)**

---

## Category
Productivity

## Language
English

## Privacy policy URL
https://foxdigital.co.il/privacy

## Homepage URL
https://foxdigital.co.il

## Support URL
https://github.com/orenagassy/Maps-UTM-Lead-Finder/issues

---

## Store Assets Checklist

### Required
- [x] `icon512.png` — 512×512 extension icon (fox on blue background)
- [x] `promo_small_440x280.png` — Small promotional tile (required for listing)
- [x] `screenshot_1280x800.png` — At least 1 screenshot (1280×800 or 640×400)
- [x] `maps-utm-lead-finder.zip` — Extension package (in parent folder)

### Optional but recommended
- [x] `promo_large_920x680.png` — Large promotional tile
- [ ] Additional screenshots (up to 5 total) — consider adding one showing the CSV export

### Manifest checklist (already set)
- [x] manifest_version: 3
- [x] name, version, description
- [x] icons at 16, 48, 128px
- [x] host_permissions scoped to google.com/maps only
- [x] No unnecessary permissions

---

## Submission Steps

1. Go to https://chrome.google.com/webstore/devconsole
2. Sign in with your Google account
3. Click **+ New Item**
4. Upload `maps-utm-lead-finder.zip` (in the extension root folder)
5. Fill in the store listing fields from this file
6. Upload store assets:
   - Icon: `store_assets/icon512.png`
   - Small promo tile: `store_assets/promo_small_440x280.png`
   - Large promo tile: `store_assets/promo_large_920x680.png`
   - Screenshot: `store_assets/screenshot_1280x800.png`
7. Set Category → **Productivity**
8. Set visibility → **Public** (or Unlisted for testing first)
9. Submit for review (typically 1–3 business days)

**One-time developer fee:** $5 USD (Google account registration, paid once)
