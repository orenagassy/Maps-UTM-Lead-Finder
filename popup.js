let port = null;
let results = [];
let scanRunning = false;

document.addEventListener("DOMContentLoaded", () => {
  port = chrome.runtime.connect({ name: "popup" });
  port.onMessage.addListener(handleMessage);

  // Restore any previous results / in-progress scan state
  chrome.storage.local.get(["scan_results", "scan_running"], (data) => {
    if (data.scan_results && data.scan_results.length > 0) {
      results = data.scan_results;
      renderAll();
    }
    if (data.scan_running) setScanRunning(true);
  });

  document.getElementById("scanBtn").addEventListener("click", startScan);
  document.getElementById("stopBtn").addEventListener("click", stopScan);
  document.getElementById("exportBtn").addEventListener("click", exportCSV);

  document.getElementById("businessType").addEventListener("keydown", (e) => {
    if (e.key === "Enter") startScan();
  });
});

// --- Scan control ---

async function startScan() {
  const businessType = document.getElementById("businessType").value.trim();
  if (!businessType) {
    setStatus("Enter a business type first (e.g. plumber, dentist).");
    return;
  }

  const tabs = await chrome.tabs.query({
    url: ["*://www.google.com/maps/*", "*://maps.google.com/*"],
    currentWindow: true
  });
  if (tabs.length === 0) {
    setStatus("No Google Maps tab found. Open google.com/maps in this window first.");
    return;
  }
  const tab = tabs[0];

  results = [];
  renderAll();
  setScanRunning(true);
  chrome.storage.local.set({ scan_results: [], scan_running: true });

  chrome.tabs.sendMessage(tab.id, { action: "BEGIN_SCAN", businessType }, () => {
    if (chrome.runtime.lastError) {
      // Content script not running — tab was open before extension was loaded.
      // Reload the Maps tab so manifest.json injects the script automatically.
      setStatus("Reload the Google Maps tab (F5), then click Scan again.");
      setScanRunning(false);
    }
  });
}

async function stopScan() {
  const tabs = await chrome.tabs.query({
    url: ["*://www.google.com/maps/*", "*://maps.google.com/*"],
    currentWindow: true
  });
  if (tabs.length > 0) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "ABORT_SCAN" }, () => {
      void chrome.runtime.lastError; // suppress error if content script is gone
    });
  }
  setScanRunning(false);
  setStatus("Scan stopped.");
  chrome.storage.local.set({ scan_running: false });
}

// --- Message handler ---

function handleMessage(msg) {
  switch (msg.action) {
    case "SCAN_PROGRESS":
      setStatus(msg.message);
      if (msg.total > 0) setProgress(msg.current, msg.total);
      break;

    case "SCAN_RESULT":
      results.push(msg.result);
      chrome.storage.local.set({ scan_results: results });
      appendRow(msg.result);
      updateResultsHeader();
      document.getElementById("emptyState").style.display = "none";
      break;

    case "SCAN_COMPLETE":
      setScanRunning(false);
      chrome.storage.local.set({ scan_running: false });
      setProgress(msg.totalScanned, msg.totalScanned);
      setStatus(`Done — ${msg.leadsFound} lead${msg.leadsFound !== 1 ? "s" : ""} (no UTM) out of ${msg.totalScanned} scanned.`);
      break;

    case "SCAN_ERROR":
      setScanRunning(false);
      chrome.storage.local.set({ scan_running: false });
      setStatus(`Error: ${msg.message}`);
      break;
  }
}

// --- UI helpers ---

function setScanRunning(running) {
  scanRunning = running;
  document.getElementById("scanBtn").disabled = running;
  document.getElementById("stopBtn").disabled = !running;
  document.getElementById("progressWrap").classList.toggle("visible", running);
  if (!running) document.getElementById("progressLabel").textContent = "";
}

function setStatus(msg) {
  document.getElementById("statusMsg").textContent = msg;
}

function setProgress(current, total) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  document.getElementById("progressBar").style.width = pct + "%";
  document.getElementById("progressLabel").textContent = `${current} / ${total}`;
}

function updateResultsHeader() {
  const leads = results.filter(r => !r.hasUTM && r.website).length;
  const total = results.length;
  document.getElementById("resultsCount").textContent =
    `${total} scanned — ${leads} lead${leads !== 1 ? "s" : ""} (no UTM)`;
  document.getElementById("exportBtn").disabled = total === 0;
}

// --- Table rendering ---

function renderAll() {
  const tbody = document.getElementById("resultsBody");
  tbody.innerHTML = "";
  results.forEach(r => tbody.appendChild(buildRow(r)));
  updateResultsHeader();
  const empty = document.getElementById("emptyState");
  empty.style.display = results.length === 0 ? "block" : "none";
}

function appendRow(result) {
  document.getElementById("resultsBody").appendChild(buildRow(result));
}

function buildRow(r) {
  const tr = document.createElement("tr");

  // Name (with Maps link)
  const tdName = document.createElement("td");
  if (r.mapsUrl) {
    const a = document.createElement("a");
    a.href = r.mapsUrl;
    a.target = "_blank";
    a.className = "site-link";
    a.title = r.name;
    a.textContent = r.name;
    tdName.appendChild(a);
  } else {
    tdName.textContent = r.name;
    tdName.title = r.name;
  }

  // Address
  const tdAddr = document.createElement("td");
  tdAddr.textContent = r.address || "—";
  tdAddr.title = r.address || "";

  // Website
  const tdSite = document.createElement("td");
  if (r.website) {
    const a = document.createElement("a");
    a.href = r.website;
    a.target = "_blank";
    a.className = "site-link";
    try {
      a.textContent = new URL(r.website).hostname.replace(/^www\./, "");
    } catch {
      a.textContent = r.website;
    }
    a.title = r.website;
    tdSite.appendChild(a);
  } else {
    tdSite.textContent = "—";
    tdSite.style.color = "#9aa0a6";
  }

  // UTM badge
  const tdUtm = document.createElement("td");
  if (!r.website) {
    tdUtm.innerHTML = `<span class="badge-nosite">No site</span>`;
  } else if (r.hasUTM) {
    tdUtm.innerHTML = `<span class="badge-tracked" title="${(r.utmParams || []).join(", ")}">Has UTM</span>`;
  } else {
    tdUtm.innerHTML = `<span class="badge-lead">No UTM ★</span>`;
  }

  tr.append(tdName, tdAddr, tdSite, tdUtm);

  // Highlight lead rows subtly
  if (!r.hasUTM && r.website) {
    tr.style.background = "#f0fdf4";
  }

  return tr;
}

// --- CSV export ---

function exportCSV() {
  const headers = ["Name", "Address", "Website", "UTM Status", "UTM Params", "Maps URL", "Scanned At"];
  const rows = results.map(r => [
    r.name,
    r.address || "",
    r.website || "",
    r.hasUTM ? "Has UTM" : (r.website ? "No UTM" : "No Website"),
    (r.utmParams || []).join("; "),
    r.mapsUrl || "",
    r.scannedAt || ""
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

  const csv = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: `utm-leads-${new Date().toISOString().slice(0, 10)}.csv`
  });
  a.click();
  URL.revokeObjectURL(url);
}
