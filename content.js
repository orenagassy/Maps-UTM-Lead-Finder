// Guard against double-injection (declarative manifest + executeScript fallback)
if (!window.__mapsUtmFinder) {
  window.__mapsUtmFinder = true;

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  let scanState = { running: false, aborted: false };

  // --- Selectors ---

  const NAME_SELECTORS = [
    "h1.DUwDvf",
    "h1[class*='fontHeadline']",
    "div[role='main'] h1",
    "h1"
  ];

  const WEBSITE_SELECTORS = [
    "a[data-item-id='authority']",
    "a[aria-label*='website' i]",
    "a[aria-label*='Visit' i][href^='http']"
  ];

  // Search box — priority-ordered fallbacks across Maps versions
  const SEARCH_INPUT_SELECTOR = [
    "input#searchboxinput",
    "input[aria-label='Search Google Maps']",
    "input[aria-label='Search']",
    "[role='combobox'] input[type='text']",
    "input.searchboxinput",
    "#searchbox input[type='text']",
    "input[name='q']"
  ].join(",");

  // --- Helpers ---

  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      const obs = new MutationObserver(() => {
        const found = document.querySelector(selector);
        if (found) { obs.disconnect(); resolve(found); }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { obs.disconnect(); resolve(null); }, timeout);
    });
  }

  function safeSend(msg) {
    try {
      if (chrome.runtime?.id) chrome.runtime.sendMessage(msg);
    } catch {
      scanState.aborted = true;
    }
  }

  function findBusinessName() {
    for (const sel of NAME_SELECTORS) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el;
    }
    return null;
  }

  function findWebsiteEl() {
    for (const sel of WEBSITE_SELECTORS) {
      const el = document.querySelector(sel);
      if (el && el.href) return el;
    }
    return null;
  }

  function extractAddress() {
    const byId = document.querySelector("[data-item-id='address']");
    if (byId) return byId.textContent.trim();
    const byAria = document.querySelector("button[aria-label*='Address']");
    if (byAria) return byAria.getAttribute("aria-label").replace(/^Address:\s*/i, "").trim();
    return "";
  }

  const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

  function checkUTM(rawHref) {
    try {
      const href = rawHref.includes("google.com/url")
        ? (new URL(rawHref).searchParams.get("q") || rawHref)
        : rawHref;
      const url = new URL(href);
      const found = UTM_KEYS.filter(k => url.searchParams.has(k));
      return { hasUTM: found.length > 0, utmParams: found, website: href };
    } catch {
      return { hasUTM: false, utmParams: [], website: rawHref };
    }
  }

  async function triggerSearch(businessType) {
    const input = document.querySelector(SEARCH_INPUT_SELECTOR);
    if (!input) return false;

    try {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, businessType);
    } catch {
      input.value = businessType;
    }

    input.dispatchEvent(new Event("input",  { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep(400);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keyup",   { key: "Enter", keyCode: 13, bubbles: true }));

    const btn = document.querySelector("button#searchbox-searchbutton, button[aria-label*='Search' i]");
    if (btn) btn.click();

    return true;
  }

  // --- Main scan ---

  async function runScan(businessType) {
    if (scanState.running) return;
    scanState = { running: true, aborted: false };

    // Use existing feed if already visible (user pre-searched), otherwise trigger search
    let feed = document.querySelector("div[role='feed']");

    if (!feed) {
      safeSend({ action: "SCAN_PROGRESS", message: "Searching…", current: 0, total: 0 });

      let searched = await triggerSearch(businessType);
      if (!searched) {
        await sleep(2000);
        searched = await triggerSearch(businessType);
      }
      if (!searched) {
        safeSend({
          action: "SCAN_ERROR",
          message: "Search box not found. Search for your business type in Google Maps first, then click Scan."
        });
        scanState.running = false;
        return;
      }

      feed = await waitForElement("div[role='feed']", 14000);
      if (!feed) {
        safeSend({ action: "SCAN_ERROR", message: "Results did not load. Try searching manually in Maps first." });
        scanState.running = false;
        return;
      }
    }

    await sleep(800);

    // Scroll to collect all result links (up to 80)
    safeSend({ action: "SCAN_PROGRESS", message: "Collecting results…", current: 0, total: 0 });
    const seenHrefs = new Set();
    const links = [];
    let stale = 0;

    while (stale < 3 && links.length < 80 && !scanState.aborted) {
      const before = links.length;
      feed.querySelectorAll("a[href*='/maps/place/']").forEach(el => {
        if (!seenHrefs.has(el.href)) {
          seenHrefs.add(el.href);
          links.push(el.href);
        }
      });
      stale = links.length === before ? stale + 1 : 0;
      feed.scrollTop = feed.scrollHeight;
      await sleep(900);
    }

    if (links.length === 0) {
      safeSend({ action: "SCAN_ERROR", message: "No business results found in this area." });
      scanState.running = false;
      return;
    }

    // Click through each result and extract details
    let leadsFound = 0;

    for (let i = 0; i < links.length; i++) {
      if (scanState.aborted) break;

      safeSend({
        action: "SCAN_PROGRESS",
        message: `Scanning ${i + 1} of ${links.length}…`,
        current: i + 1,
        total: links.length
      });

      // Re-query live DOM each iteration — feed may have re-rendered
      let target = null;
      for (const el of feed.querySelectorAll("a[href*='/maps/place/']")) {
        if (el.href === links[i]) { target = el; break; }
      }
      if (!target) {
        feed.scrollTop = 0;
        await sleep(500);
        for (const el of feed.querySelectorAll("a[href*='/maps/place/']")) {
          if (el.href === links[i]) { target = el; break; }
        }
      }
      if (!target) continue;

      const prevName = findBusinessName()?.textContent.trim() || "";
      target.click();

      // Wait for detail pane to show the new business name
      let nameEl = null;
      const nameDeadline = Date.now() + 8000;
      while (Date.now() < nameDeadline) {
        nameEl = findBusinessName();
        if (nameEl && nameEl.textContent.trim() && nameEl.textContent.trim() !== prevName) break;
        nameEl = null;
        await sleep(200);
      }
      if (!nameEl || scanState.aborted) continue;

      // Wait for website link (optional)
      let websiteEl = null;
      const webDeadline = Date.now() + 4000;
      while (Date.now() < webDeadline && !websiteEl) {
        websiteEl = findWebsiteEl();
        if (!websiteEl) await sleep(200);
      }

      const name    = nameEl.textContent.trim();
      const address = extractAddress();
      const mapsUrl = window.location.href;

      let website = null, hasUTM = false, utmParams = [];
      if (websiteEl) {
        ({ website, hasUTM, utmParams } = checkUTM(websiteEl.href));
      }

      if (!hasUTM && website) leadsFound++;

      safeSend({
        action: "SCAN_RESULT",
        result: { name, address, website, hasUTM, utmParams, mapsUrl, scannedAt: new Date().toISOString() }
      });

      await sleep(500 + Math.random() * 600);
    }

    safeSend({ action: "SCAN_COMPLETE", totalScanned: links.length, leadsFound });
    scanState.running = false;
  }

  // --- Message listener ---

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "BEGIN_SCAN") runScan(msg.businessType);
    if (msg.action === "ABORT_SCAN") {
      scanState.aborted = true;
      scanState.running = false;
    }
  });

} // end guard
