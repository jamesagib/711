/* YouTube Profile Selector – content script */
(function () {
  const CATEGORY_KEYWORDS = {
    "All": [], // disables filtering
    "Entertainment": [
      "music",
      "comedy",
      "vlog",
      "trailer",
      "movie",
      "show",
    ],
    "Study": [
      "study",
      "lecture",
      "tutorial",
      "course",
      "exam",
      "revision",
      "homework",
    ],
    "Motivation": [
      "motivation",
      "inspirational",
      "success",
      "productivity",
      "mindset",
    ],
    "How To": [
      "how to",
      "guide",
      "tutorial",
      "diy",
      "fix",
      "make",
      "build",
    ],
    "Money & Career": [
      "finance",
      "investing",
      "career",
      "job",
      "resume",
      "business",
      "startup",
    ],
    "Gaming": [
      "game",
      "gameplay",
      "walkthrough",
      "esports",
      "let’s play",
      "review",
    ],
  };

  let selectedCategory = null;
  let floatingBtn = null; // reference to floating switcher button

  /* ------------------------ storage helpers ----------------------- */
  function loadCategory() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["selectedCategory"], (res) => {
        resolve(res.selectedCategory || null);
      });
    });
  }

  function saveCategory(cat) {
    chrome.storage.local.set({ selectedCategory: cat });
  }

  /* -------------------------- filtering --------------------------- */
  function categorizeVideo(text) {
    const lower = text.toLowerCase();
    for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
      if (kws.some((kw) => lower.includes(kw))) return cat;
    }
    return null;
  }

  function filterVideos() {
    if (!selectedCategory) return;
    const videoEls = document.querySelectorAll(
      "ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer"
    );

    // If 'All' selected, reveal everything and reset badge
    if (selectedCategory === "All") {
      videoEls.forEach((el) => (el.style.display = ""));
      updateHiddenBadge(0);
      return;
    }

    let hiddenCount = 0;
    videoEls.forEach((el) => {
      // Cache classification on first inspection
      if (!el.dataset.ytpsProcessed) {
        const titleEl =
          el.querySelector("#video-title") || el.querySelector("a#video-title");
        const descEl =
          el.querySelector("#description") ||
          el.querySelector("yt-formatted-string#description-text");
        const title = titleEl ? titleEl.textContent : "";
        const desc = descEl ? descEl.textContent : "";
        el.dataset.ytpsCategory = categorizeVideo(`${title} ${desc}`) || "";
        el.dataset.ytpsProcessed = "1";
      }

      const matches = el.dataset.ytpsCategory === selectedCategory;
      // Show matching, hide non-matching
      el.style.display = matches ? "" : "none";
      if (!matches) hiddenCount += 1;
    });

    updateHiddenBadge(hiddenCount);
  }

  /* -------------------- observe dynamic page loads -------------------- */
  function debounce(fn, delay = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  function attachMutationObserver() {
    const observer = new MutationObserver(
      debounce(() => {
        filterVideos();
        cleanupContentDivs();
      }, 500)
    );
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* --------------------------- UI helpers -------------------------- */
  function createModal() {
    if (document.getElementById("ytps-modal")) return;

    const overlay = document.createElement("div");
    overlay.id = "ytps-modal";
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:10000;color:white;font-family:Arial;";

    const grid = document.createElement("div");
    grid.style.cssText =
      "display:grid;grid-template-columns:repeat(auto-fit, minmax(120px,1fr));gap:24px;max-width:800px;text-align:center;";

    Object.keys(CATEGORY_KEYWORDS).forEach((cat) => {
      const card = document.createElement("div");
      card.style.cssText =
        "cursor:pointer;padding:20px;border-radius:8px;background:rgba(255,255,255,0.1);";
      card.textContent = cat;
      card.onmouseenter = () =>
        (card.style.background = "rgba(255,255,255,0.3)");
      card.onmouseleave = () =>
        (card.style.background = "rgba(255,255,255,0.1)");
      card.onclick = () => {
        selectedCategory = cat;
        saveCategory(cat);
        overlay.remove();
        filterVideos();
      };
      grid.appendChild(card);
    });

    overlay.appendChild(grid);
    document.body.appendChild(overlay);
  }

  function createFloatingButton() {
    if (document.getElementById("ytps-switcher")) return;
    const btn = document.createElement("button");
    btn.id = "ytps-switcher";
    btn.textContent = "Categories";
    btn.style.cssText =
      "position:fixed;bottom:24px;right:24px;z-index:10000;padding:10px 14px;border-radius:50px;border:none;background:#cc0000;color:white;font-weight:bold;cursor:pointer;";
    btn.onclick = createModal;
    document.body.appendChild(btn);
    floatingBtn = btn; // store reference
  }

  function updateHiddenBadge(count) {
    if (!floatingBtn) return;
    floatingBtn.textContent = count ? `Categories (${count})` : "Categories";
  }

  /* --------------------- cross-tab selection sync --------------------- */
  function initStorageChangeListener() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.selectedCategory) {
        selectedCategory = changes.selectedCategory.newValue;
        filterVideos();
      }
    });
  }

  /* --------------------- cleanup functions --------------------- */
  function cleanupContentDivs() {
    // Delete all divs with id="content" and class="style-scope ytd-rich-section-renderer"
    const contentDivs = document.querySelectorAll('div#content.style-scope.ytd-rich-section-renderer');
    contentDivs.forEach(div => {
      console.log("Removing content div", div);
      div.remove();
    });
  }

  /* ----------------------------- init ----------------------------- */
  async function init() {
    // Clean up content divs on load
    cleanupContentDivs();
    console.log("cleaning");
    
    selectedCategory = await loadCategory();
    if (!selectedCategory) {
      createModal();
    } else {
      filterVideos();
    }
    createFloatingButton();
    attachMutationObserver();
    initStorageChangeListener();
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})(); 