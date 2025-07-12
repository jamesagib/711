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
      "learn"
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
      "let's play",
      "review",
    ],
  };

  const DEFAULT_CATEGORIES = Object.keys(CATEGORY_KEYWORDS).filter(
    (c) => c !== "All"
  );

  let selectedCategory = null;
  let floatingBtn = null; // reference to floating switcher button
  let allowedCategories = null; // user-chosen preferred categories
  let predictor = null; // ML predictor instance

  /* ------------------------ ML Predictor ----------------------- */
  class VideoCategoryPredictor {
    constructor() {
      this.modelParams = null;
      this.isLoaded = false;
    }

    // Load model parameters from JSON file
    async loadModel(modelPath) {
      try {
        const response = await fetch(modelPath);
        this.modelParams = await response.json();
        this.isLoaded = true;
        console.log('ML Model loaded successfully');
        console.log('Available categories:', this.modelParams.labels);
      } catch (error) {
        console.error('Error loading ML model:', error);
        throw error;
      }
    }

    // Tokenize text (simple word-based tokenization)
    tokenize(text) {
      // Convert to lowercase and split by whitespace
      return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
        .split(/\s+/)
        .filter(token => token.length > 0);
    }

    // Extract n-grams (unigrams and bigrams)
    extractNgrams(tokens, ngramRange = [1, 2]) {
      const ngrams = [];
      
      // Unigrams
      if (ngramRange[0] <= 1 && ngramRange[1] >= 1) {
        ngrams.push(...tokens);
      }
      
      // Bigrams
      if (ngramRange[0] <= 2 && ngramRange[1] >= 2) {
        for (let i = 0; i < tokens.length - 1; i++) {
          ngrams.push(tokens[i] + ' ' + tokens[i + 1]);
        }
      }
      
      return ngrams;
    }

    // Calculate TF-IDF features
    calculateTfIdf(text) {
      const tfidfParams = this.modelParams.tfidf_params;
      const vocabulary = tfidfParams.vocabulary_;
      const idf = tfidfParams.idf_;
      
      // Tokenize and extract n-grams
      const tokens = this.tokenize(text);
      const ngrams = this.extractNgrams(tokens, tfidfParams.ngram_range);
      
      // Count term frequencies
      const termFreq = {};
      ngrams.forEach(ngram => {
        termFreq[ngram] = (termFreq[ngram] || 0) + 1;
      });
      
      // Calculate TF-IDF scores
      const tfidfScores = {};
      const numTerms = ngrams.length;
      
      Object.keys(termFreq).forEach(term => {
        if (vocabulary.hasOwnProperty(term)) {
          const tf = termFreq[term] / numTerms;
          const idfScore = idf[vocabulary[term]];
          tfidfScores[vocabulary[term]] = tf * idfScore;
        }
      });
      
      return tfidfScores;
    }

    // Make prediction using SVM
    predict(text) {
      if (!this.isLoaded) {
        throw new Error('Model not loaded. Call loadModel() first.');
      }

      // Calculate TF-IDF features
      const features = this.calculateTfIdf(text);
      
      // Get SVM parameters
      const svmParams = this.modelParams.svm_params;
      const coef = svmParams.coef_;
      const intercept = svmParams.intercept_;
      const classes = svmParams.classes_;
      
      // Calculate decision scores for each class
      const scores = new Array(classes.length).fill(0);
      
      // For each class, calculate the decision score
      for (let i = 0; i < classes.length; i++) {
        let score = intercept[i];
        
        // Add contribution from each feature
        Object.keys(features).forEach(featureIndex => {
          const featureIdx = parseInt(featureIndex);
          if (featureIdx < coef[i].length) {
            score += coef[i][featureIdx] * features[featureIndex];
          }
        });
        
        scores[i] = score;
      }
      
      // Find the class with the highest score
      let maxScore = scores[0];
      let predictedClass = classes[0];
      
      for (let i = 1; i < scores.length; i++) {
        if (scores[i] > maxScore) {
          maxScore = scores[i];
          predictedClass = classes[i];
        }
      }
      
      return {
        category: predictedClass,
        confidence: this.calculateConfidence(scores),
        scores: scores.map((score, index) => ({
          category: classes[index],
          score: score
        }))
      };
    }

    // Calculate confidence based on score differences
    calculateConfidence(scores) {
      const maxScore = Math.max(...scores);
      const sortedScores = [...scores].sort((a, b) => b - a);
      const scoreDiff = maxScore - sortedScores[1]; // Difference between top 2 scores
      
      // Normalize confidence (0-1 scale)
      const confidence = Math.min(scoreDiff / 2 + 0.5, 1.0);
      return Math.round(confidence * 100) / 100;
    }

    // Get all available categories
    getCategories() {
      return this.modelParams ? this.modelParams.labels : [];
    }

    // Check if model is loaded
    isModelLoaded() {
      return this.isLoaded;
    }
  }

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
    // Use ML predictor if available, otherwise fall back to keyword matching
    if (predictor && predictor.isModelLoaded()) {
      try {
        const result = predictor.predict(text);
        console.log(`ML Prediction for "${text}": ${result.category} (confidence: ${result.confidence})`);
        return result.category;
      } catch (error) {
        console.error('ML prediction failed, falling back to keywords:', error);
        // Fall back to keyword matching
      }
    }

    // Fallback to keyword-based categorization
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
      "position:fixed;inset:0;background:#000;display:flex;align-items:center;justify-content:center;z-index:10000;color:white;font-family:Arial;";

    const grid = document.createElement("div");
    grid.style.cssText =
      "display:grid;grid-template-columns:repeat(auto-fit, minmax(120px,1fr));gap:24px;max-width:800px;text-align:center;";

    const list = [
      "All",
      ...(
        allowedCategories && allowedCategories.length
          ? allowedCategories
          : DEFAULT_CATEGORIES
      ),
    ];

    list.forEach((cat) => {
      const card = document.createElement("div");
      card.style.cssText =
        "cursor:pointer;padding:20px;border-radius:8px;background:rgba(255,255,255,0.1);font-size:18px;";
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

  /* ---------------------- onboarding storage helpers --------------------- */
  function loadUserCategories() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["userCategories"], (res) => {
        resolve(res.userCategories || null);
      });
    });
  }

  function saveUserCategories(arr) {
    chrome.storage.local.set({ userCategories: arr });
  }

  function loadOnboarded() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["onboarded"], (res) => {
        resolve(!!res.onboarded);
      });
    });
  }

  function markOnboarded() {
    chrome.storage.local.set({ onboarded: true });
  }

  /* ----------------------- onboarding overlay UI ----------------------- */
  function showPreferenceOverlay() {
    return new Promise((resolve) => {
      if (document.getElementById("ytps-pref-overlay")) return; // prevent dupes

      const overlay = document.createElement("div");
      overlay.id = "ytps-pref-overlay";
      overlay.style.cssText =
        "position:fixed;inset:0;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10000;color:white;font-family:Arial;text-align:center;";

      const title = document.createElement("h1");
      title.textContent = "Welcome to 7/11";
      title.style.marginBottom = "8px";
      title.style.fontSize = "48px";

      const subtitle = document.createElement("p");
      subtitle.textContent = "What do you usually watch? (pick all that apply)";
      subtitle.style.marginBottom = "32px";
      subtitle.style.fontSize = "20px";

      const grid = document.createElement("div");
      grid.style.cssText =
        "display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;max-width:900px;margin-bottom:40px;";

      const tmpSelection = new Set();

      DEFAULT_CATEGORIES.forEach((cat) => {
        const chip = document.createElement("div");
        chip.textContent = cat;
        chip.style.cssText =
          "padding:16px;border-radius:24px;background:rgba(255,255,255,0.1);cursor:pointer;transition:background 0.2s;font-size:18px;";

        chip.onclick = () => {
          if (tmpSelection.has(cat)) {
            tmpSelection.delete(cat);
            chip.style.background = "rgba(255,255,255,0.1)";
          } else {
            tmpSelection.add(cat);
            chip.style.background = "rgba(255,255,255,0.3)";
          }
          doneBtn.disabled = tmpSelection.size === 0;
        };

        grid.appendChild(chip);
      });

      const doneBtn = document.createElement("button");
      doneBtn.textContent = "✓ Done";
      doneBtn.disabled = true;
      doneBtn.style.cssText =
        "padding:14px 28px;border:none;border-radius:4px;background:white;color:black;font-weight:bold;cursor:pointer;opacity:0.6;";

      doneBtn.onclick = () => {
        if (tmpSelection.size === 0) return;
        allowedCategories = Array.from(tmpSelection);
        saveUserCategories(allowedCategories);
        markOnboarded();
        overlay.remove();
        resolve();
      };

      // Enable visual feedback for disabled state
      const btnObserver = new MutationObserver(() => {
        doneBtn.style.opacity = doneBtn.disabled ? "0.6" : "1";
      });
      btnObserver.observe(doneBtn, { attributes: true, attributeFilter: ["disabled"] });

      overlay.appendChild(title);
      overlay.appendChild(subtitle);
      overlay.appendChild(grid);
      overlay.appendChild(doneBtn);
      document.body.appendChild(overlay);
    });
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
    
    // Initialize ML predictor
    predictor = new VideoCategoryPredictor();
    try {
      await predictor.loadModel(chrome.runtime.getURL('model_params.json'));
      console.log('ML predictor initialized successfully');
    } catch (error) {
      console.error('Failed to load ML predictor, will use keyword fallback:', error);
      predictor = null;
    }
    
    const onboarded = await loadOnboarded();
    allowedCategories = await loadUserCategories();

    if (!onboarded || !allowedCategories || !allowedCategories.length) {
      await showPreferenceOverlay();
    }

    selectedCategory = await loadCategory();

    if (!selectedCategory || (allowedCategories && !allowedCategories.includes(selectedCategory) && selectedCategory !== "All")) {
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