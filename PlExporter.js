/**
 * PLEX HISTORY EXPORTER — v4
 * ============================================
 * Export your complete Plex watch history to CSV
 *
 * HOW TO USE:
 * 1. Open:
 *    https://watch.plex.tv/account/history
 *
 * 2. Wait for the page to fully load
 *
 * 3. Open DevTools:
 *    F12 → Console
 *
 * 4. Paste this script and press Enter
 *
 * The CSV file will download automatically.
 */

(async () => {

  // Prevent multiple executions
  if (window.__plexHistoryExporterRunning) {
    console.warn("Plex History Exporter is already running.");
    return;
  }

  window.__plexHistoryExporterRunning = true;

  // ─────────────────────────────────────────────
  // UI Overlay
  // ─────────────────────────────────────────────

  const overlay = document.createElement("div");

  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    background: rgba(0,0,0,.88);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 14px;
    font-family: system-ui, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="font-size:24px;font-weight:700">
      Exporting Plex History...
    </div>

    <div id="plex-export-status" style="opacity:.8;font-size:14px">
      Initializing...
    </div>

    <div style="
      width:320px;
      height:6px;
      background:#333;
      border-radius:999px;
      overflow:hidden;
    ">
      <div id="plex-export-progress" style="
        height:100%;
        width:0%;
        background:#e5a00d;
        transition:width .3s;
      "></div>
    </div>

    <div id="plex-export-count" style="font-size:13px;opacity:.7">
      0 items collected
    </div>
  `;

  document.body.appendChild(overlay);

  const statusElement =
    document.getElementById("plex-export-status");

  const progressElement =
    document.getElementById("plex-export-progress");

  const countElement =
    document.getElementById("plex-export-count");

  // ─────────────────────────────────────────────
  // Storage
  // ─────────────────────────────────────────────

  const collectedItems = new Map();

  function updateCounter() {
    countElement.textContent =
      `${collectedItems.size} items collected`;
  }

  function addItems(items) {

    if (!Array.isArray(items)) return;

    for (const item of items) {

      if (!item || typeof item !== "object") continue;

      const id =
        item.id ||
        item.ratingKey ||
        item.guid ||
        crypto.randomUUID();

      if (!collectedItems.has(id)) {
        collectedItems.set(id, item);
      }
    }

    updateCounter();
  }

  // ─────────────────────────────────────────────
  // Recursive JSON Scanner
  // ─────────────────────────────────────────────

  function scanObject(object) {

    if (!object || typeof object !== "object") return;

    for (const key in object) {

      const value = object[key];

      if (Array.isArray(value)) {

        if (
          value.length > 0 &&
          typeof value[0] === "object"
        ) {

          const sample = value[0];

          const looksLikeMedia =
            sample.title ||
            sample.type ||
            sample.guid ||
            sample.ratingKey;

          if (looksLikeMedia) {
            addItems(value);
          }
        }

      } else if (typeof value === "object") {
        scanObject(value);
      }
    }
  }

  // ─────────────────────────────────────────────
  // Fetch Interceptor
  // ─────────────────────────────────────────────

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args) => {

    const response = await originalFetch(...args);

    try {

      const clone = response.clone();

      const contentType =
        clone.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {

        const json = await clone.json();

        scanObject(json);
      }

    } catch (_) {}

    return response;
  };

  // ─────────────────────────────────────────────
  // XMLHttpRequest Interceptor
  // ─────────────────────────────────────────────

  const originalXHROpen =
    XMLHttpRequest.prototype.open;

  const originalXHRSend =
    XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (...args) {

    this.__url = args[1];

    return originalXHROpen.apply(this, args);
  };

  XMLHttpRequest.prototype.send = function (...args) {

    this.addEventListener("load", function () {

      try {

        const contentType =
          this.getResponseHeader("content-type") || "";

        if (contentType.includes("application/json")) {

          const json = JSON.parse(this.responseText);

          scanObject(json);
        }

      } catch (_) {}

    });

    return originalXHRSend.apply(this, args);
  };

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ─────────────────────────────────────────────
  // Auto Scroll
  // ─────────────────────────────────────────────

  async function autoScroll() {

    let lastHeight = 0;
    let stableIterations = 0;

    while (stableIterations < 10) {

      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
      });

      await sleep(1500);

      const currentHeight =
        document.body.scrollHeight;

      if (currentHeight === lastHeight) {
        stableIterations++;
      } else {
        stableIterations = 0;
      }

      lastHeight = currentHeight;

      progressElement.style.width =
        `${Math.min(95, stableIterations * 10)}%`;

      statusElement.textContent =
        "Loading additional history items...";
    }
  }

  // ─────────────────────────────────────────────
  // Normalization
  // ─────────────────────────────────────────────

  function normalizeItem(item) {

    const type =
      item.type ||
      item.metadataType ||
      "";

    const watchedDate =
      item.viewedAt ||
      item.lastViewedAt ||
      item.date ||
      "";

    return {

      id:
        item.id ||
        item.ratingKey ||
        "",

      title:
        item.title ||
        item.grandparentTitle ||
        "",

      type,

      year:
        item.year ||
        "",

      watched_at:
        watchedDate,

      thumbnail:
        item.thumb ||
        item.image?.url ||
        "",

      plex_url:
        item.url ||
        item.link?.url ||
        ""
    };
  }

  // ─────────────────────────────────────────────
  // CSV Generator
  // ─────────────────────────────────────────────

  function generateCSV(rows) {

    const fields = [
      "id",
      "title",
      "type",
      "year",
      "watched_at",
      "thumbnail",
      "plex_url"
    ];

    const escapeValue = value =>
      `"${String(value ?? "")
        .replace(/"/g, '""')}"`;

    return [
      fields.join(","),
      ...rows.map(row =>
        fields
          .map(field => escapeValue(row[field]))
          .join(",")
      )
    ].join("\r\n");
  }

  // ─────────────────────────────────────────────
  // File Download
  // ─────────────────────────────────────────────

  function downloadCSV(content) {

    const blob = new Blob(
      ["\uFEFF" + content],
      {
        type: "text/csv;charset=utf-8;"
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
      `plex_history_${new Date()
        .toISOString()
        .slice(0,10)}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  }

  // ─────────────────────────────────────────────
  // Main
  // ─────────────────────────────────────────────

  try {

    statusElement.textContent =
      "Preparing export...";

    await sleep(1500);

    await autoScroll();

    if (collectedItems.size === 0) {
      throw new Error(
        "No history items were captured. Try refreshing the page and running the script again."
      );
    }

    statusElement.textContent =
      "Generating CSV file...";

    progressElement.style.width = "100%";

    const normalizedRows =
      [...collectedItems.values()]
        .map(normalizeItem);

    downloadCSV(
      generateCSV(normalizedRows)
    );

    console.log(
      `✅ Export completed: ${normalizedRows.length} items`
    );

    statusElement.textContent =
      `Export completed (${normalizedRows.length} items)`;

    await sleep(2500);

    overlay.remove();

  } catch (error) {

    console.error(
      "Plex History Exporter:",
      error
    );

    statusElement.textContent =
      "Export failed";

    countElement.textContent =
      error.message;

  } finally {

    // Restore original functions
    window.fetch = originalFetch;

    XMLHttpRequest.prototype.open =
      originalXHROpen;

    XMLHttpRequest.prototype.send =
      originalXHRSend;

    window.__plexHistoryExporterRunning = false;
  }

})();
