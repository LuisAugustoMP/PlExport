(async () => {
  if (window.__plexHistoryExporterRunning) {
    console.warn("Plex History Exporter is already running.");
    return;
  }

  window.__plexHistoryExporterRunning = true;

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
        item.url ||
        crypto.randomUUID();

      if (!collectedItems.has(id)) {
        collectedItems.set(id, item);
      }
    }

    updateCounter();
  }

  function scanObject(object) {
    if (!object || typeof object !== "object") return;

    if (Array.isArray(object)) {
      addItems(object);

      for (const item of object) {
        scanObject(item);
      }

      return;
    }

    for (const key in object) {
      scanObject(object[key]);
    }
  }

  function scanInitialData() {
    try {
      const scripts = [...document.querySelectorAll("script")];

      for (const script of scripts) {
        const text = script.textContent || "";

        if (
          text.includes("watchHistory") ||
          text.includes("ratingKey") ||
          text.includes("grandparentTitle")
        ) {
          const matches = text.match(/\{.*\}/gs);

          if (!matches) continue;

          for (const match of matches) {
            try {
              const json = JSON.parse(match);
              scanObject(json);
            } catch (_) {}
          }
        }
      }
    } catch (_) {}

    try {
      const html = document.documentElement.innerHTML;

      const regex =
        /"ratingKey"|\"grandparentTitle\"|\"watchHistory\"/;

      if (regex.test(html)) {
        const jsonMatches = html.match(/\{[\s\S]*?\}/g) || [];

        for (const block of jsonMatches) {
          try {
            const json = JSON.parse(block);
            scanObject(json);
          } catch (_) {}
        }
      }
    } catch (_) {}
  }

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

  const originalXHROpen =
    XMLHttpRequest.prototype.open;

  const originalXHRSend =
    XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (...args) {
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

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function autoScroll() {
    let lastCount = collectedItems.size;
    let stableIterations = 0;

    while (stableIterations < 8) {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
      });

      await sleep(1800);

      if (collectedItems.size === lastCount) {
        stableIterations++;
      } else {
        stableIterations = 0;
      }

      lastCount = collectedItems.size;

      progressElement.style.width =
        `${Math.min(95, (stableIterations / 8) * 100)}%`;

      statusElement.textContent =
        "Loading additional history items...";
    }
  }

  function normalizeItem(item) {
    const type =
      item.type ||
      item.metadataType ||
      "";

    const watchedDate =
      item.viewedAt ||
      item.lastViewedAt ||
      item.date ||
      item.viewedAtISO ||
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

  try {
    statusElement.textContent =
      "Scanning existing page data...";

    scanInitialData();

    await sleep(1000);

    statusElement.textContent =
      "Loading additional history items...";

    await autoScroll();

    if (collectedItems.size === 0) {
      throw new Error(
        "No history items were captured."
      );
    }

    statusElement.textContent =
      "Generating CSV file...";

    progressElement.style.width = "100%";

    const normalizedRows =
      [...collectedItems.values()]
        .map(normalizeItem)
        .filter(row => row.title);

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

    window.fetch = originalFetch;

    XMLHttpRequest.prototype.open =
      originalXHROpen;

    XMLHttpRequest.prototype.send =
      originalXHRSend;

    window.__plexHistoryExporterRunning = false;
  }

})();
