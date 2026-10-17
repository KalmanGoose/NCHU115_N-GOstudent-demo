/**
 * 🎰 國立中興大學 美食天命拉霸機 (NCHU Food Slot Machine)
 * 100% 動態抽取自 SENIOR_FOOD_DB (176 間真實學長姐認證美食庫)
 * 絕無 AI 幻覺，支援「區域鎖定」、「預算鎖定」、復古音效與 Google Maps 導航。
 */

(function () {
  // ── 1. 區域與預算定義 ──
  const REEL_LOCATIONS = [
    { id: "all", name: "🎲 隨機全區", filter: () => true },
    { id: "xuefu", name: "🎓 大門學府路", filter: f => (f.tags && f.tags.includes("xuefu")) || (f.kws && f.kws.includes("學府")) || (f.content && f.content.includes("學府")) },
    { id: "nanmen", name: "🌸 女宿南門路", filter: f => (f.tags && f.tags.includes("nanmen")) || (f.kws && f.kws.includes("南門")) || (f.content && f.content.includes("南門")) },
    { id: "gaogong", name: "🛵 高工美村", filter: f => (f.tags && f.tags.includes("gaogong")) || (f.kws && f.kws.includes("高工")) || (f.content && f.content.includes("美村")) },
    { id: "nightmarket", name: "🏮 忠孝夜市", filter: f => (f.tags && f.tags.includes("nightmarket")) || (f.kws && f.kws.includes("忠孝")) || (f.content && f.content.includes("夜市")) },
    { id: "campus", name: "🌲 校內圓廳學餐", filter: f => (f.tags && f.tags.includes("campus")) || (f.kws && f.kws.includes("學餐")) || (f.content && f.content.includes("圓廳")) },
    { id: "late_night", name: "🌙 深夜宵夜", filter: f => (f.tags && f.tags.includes("late_night")) || (f.kws && f.kws.includes("宵夜")) || (f.content && f.content.includes("宵夜")) },
    { id: "cafe", name: "☕ 飲料手搖甜點", filter: f => (f.tags && f.tags.includes("cafe")) || (f.kws && f.kws.includes("飲料")) || (f.content && f.content.includes("手搖")) }
  ];

  const REEL_BUDGETS = [
    { id: "any", name: "✨ 隨緣無拘", filter: () => true },
    { id: "budget", name: "💰 百元平價有找", filter: f => (f.tags && f.tags.includes("budget")) || (f.title && f.title.includes("百元")) || (f.content && f.content.includes("百元")) },
    { id: "student_deal", name: "🏷️ 學生特約優惠", filter: f => (f.tags && f.tags.includes("student_deal")) || (f.kws && f.kws.includes("特約")) || (f.content && f.content.includes("折扣")) },
    { id: "hearty", name: "🥩 吃粗飽大份量", filter: f => !f.tags.includes("cafe") && (f.content.includes("大碗") || f.content.includes("加飯") || f.content.includes("大份量") || f.content.includes("吃粗飽") || f.content.includes("飽")) }
  ];

  let currentLocIndex = 0;
  let currentBudIndex = 0;
  let isLocLocked = false;
  let isBudLocked = false;
  let isSlotSpinning = false;
  let currentJackpotFood = null;

  // ── 2. 純前端 Web Audio 音效產生器 ──
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playTickSound() {
    try {
      const ctx = getAudioCtx();
      if (!ctx || ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(420 + Math.random() * 80, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }

  function playJackpotSound() {
    try {
      const ctx = getAudioCtx();
      if (!ctx || ctx.state === "suspended") ctx.resume();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.35);
      });
    } catch (e) {}
  }

  // ── 3. 注入拉霸機專屬 CSS 樣式 (100% 契合興大清新官網風格) ──
  const styleEl = document.createElement("style");
  styleEl.innerHTML = `
    .slot-modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 99999;
      align-items: center;
      justify-content: center;
      padding: 14px;
      box-sizing: border-box;
    }
    .slot-card {
      background: #ffffff;
      border-radius: 24px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 75, 151, 0.1);
      position: relative;
      overflow: hidden;
      animation: slotPopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-sizing: border-box;
    }
    @keyframes slotPopIn {
      from { transform: translateY(18px) scale(0.96); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    .slot-header {
      padding: 16px 20px 14px;
      background: linear-gradient(135deg, #004b97 0%, #0369a1 100%);
      color: #fff;
      position: relative;
    }
    .slot-header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    }
    .slot-title {
      font-size: 17.5px;
      font-weight: 900;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: 0.3px;
      color: #fff;
    }
    .slot-badge {
      font-size: 11px;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 700;
    }
    .slot-sub {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.88);
      margin: 4px 0 0;
      line-height: 1.4;
    }
    .slot-close-btn {
      background: rgba(255, 255, 255, 0.18);
      border: none;
      color: #fff;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .slot-close-btn:hover { background: rgba(239, 68, 68, 0.85); transform: rotate(90deg); }

    .slot-body {
      padding: 16px 18px 20px;
      background: #f8fafc;
    }

    /* 🎰 滾輪機台框體 (清新簡潔卡片) */
    .slot-cabinet {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 18px;
      padding: 12px 10px;
      box-shadow: 0 4px 12px rgba(15, 39, 69, 0.05);
      position: relative;
      margin-bottom: 12px;
    }
    .slot-reels-row {
      display: grid;
      grid-template-columns: 1.15fr 1.15fr 1.7fr;
      gap: 8px;
    }
    .slot-reel {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .slot-reel-header {
      font-size: 10.5px;
      font-weight: 700;
      color: #64748b;
      padding: 4px 0;
      background: #eef2f6;
      border-bottom: 1px solid #e2e8f0;
      text-align: center;
    }
    .slot-reel-window {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background: #ffffff;
      overflow: hidden;
    }
    .slot-reel-window::before, .slot-reel-window::after {
      content: "";
      position: absolute;
      left: 0; right: 0;
      height: 12px;
      pointer-events: none;
      z-index: 2;
    }
    .slot-reel-window::before { top: 0; background: linear-gradient(180deg, #ffffff 0%, transparent 100%); }
    .slot-reel-window::after { bottom: 0; background: linear-gradient(0deg, #ffffff 0%, transparent 100%); }

    .slot-reel-val {
      font-size: 13px;
      font-weight: 800;
      color: #0f2745;
      padding: 4px 6px;
      text-align: center;
      word-break: break-word;
      line-height: 1.3;
      transition: transform 0.1s ease-out;
    }
    .slot-reel-main .slot-reel-val {
      font-size: 14px;
      color: #004b97;
      font-weight: 900;
    }
    .slot-reel-footer {
      font-size: 10px;
      color: #64748b;
      padding: 3px 0;
      background: #edf2f7;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-weight: 600;
    }

    /* 鎖定按鈕 */
    .slot-lock-toggle {
      background: #ffffff;
      border: none;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      transition: all 0.2s;
    }
    .slot-lock-toggle:hover {
      background: #f1f5f9;
      color: #004b97;
    }
    .slot-lock-toggle.locked {
      background: #e0f2fe;
      color: #0284c7;
      border-top-color: #bae6fd;
      font-weight: 800;
    }

    /* 🎰 大拉桿按鈕 (官網主要 CTA 膠囊風格) */
    .slot-spin-btn {
      width: 100%;
      background: linear-gradient(135deg, #004b97 0%, #0284c7 100%);
      color: #ffffff;
      font-weight: 900;
      font-size: 15px;
      padding: 12px 20px;
      border: none;
      border-radius: 999px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0, 75, 151, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .slot-spin-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 75, 151, 0.35);
      background: linear-gradient(135deg, #003a75 0%, #0369a1 100%);
    }
    .slot-spin-btn:active { transform: translateY(1px); }
    .slot-spin-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      transform: none;
    }

    /* 🌟 中獎結果卡片 (與 FAQ/美食卡片 100% 統一) */
    .slot-result-card {
      background: #ffffff;
      border: 1.5px solid #abdad5;
      border-radius: 16px;
      padding: 14px 14px 12px;
      margin-top: 12px;
      text-align: left;
      box-shadow: 0 4px 16px rgba(0, 75, 151, 0.08);
      animation: slotResultFade 0.35s ease-out;
    }
    @keyframes slotResultFade {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .slot-result-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 800;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 2px 8px;
      border-radius: 20px;
      margin-bottom: 4px;
    }
    .slot-result-title {
      font-size: 16.5px;
      font-weight: 900;
      color: #004b97;
      margin: 2px 0 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .slot-result-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 8px;
    }
    .slot-tag-pill {
      font-size: 11px;
      font-weight: 700;
      background: rgba(171, 218, 213, 0.35);
      color: #004b97;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .slot-quote-box {
      background: #f8fafc;
      border-left: 3px solid #004b97;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .slot-quote-text {
      font-size: 12.5px;
      color: #334155;
      line-height: 1.55;
      margin: 0;
      word-break: break-word;
    }
    .slot-result-actions {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }
    .slot-act-btn {
      font-size: 11.5px;
      font-weight: 700;
      padding: 7px 4px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      text-decoration: none;
      box-sizing: border-box;
      transition: all 0.2s;
    }
    .slot-act-map { background: #059669; color: #fff; }
    .slot-act-map:hover { background: #10b981; }
    .slot-act-fav { background: #ffffff; color: #475569; border: 1px solid #cbd5e1; }
    .slot-act-fav:hover { background: #f8fafc; color: #ca8a04; border-color: #fde047; }
    .slot-act-ask { background: linear-gradient(135deg, #004b97 0%, #0369a1 100%); color: #fff; }
    .slot-act-ask:hover { background: linear-gradient(135deg, #003a75 0%, #0284c7 100%); }
  `;
  document.head.appendChild(styleEl);

  // ── 4. 構建拉霸機 Modal HTML ──
  const modalDiv = document.createElement("div");
  modalDiv.className = "slot-modal-backdrop";
  modalDiv.id = "foodSlotModal";
  modalDiv.innerHTML = `
    <div class="slot-card" onclick="event.stopPropagation()">
      <div class="slot-header">
        <div class="slot-header-top">
          <div>
            <h3 class="slot-title">🎰 興大美食天命拉霸機 <span class="slot-badge">176 間真選</span></h3>
            <p class="slot-sub">⚡ 100% 抽取自學長姐真實認證美食庫 · 絕無 AI 幻覺</p>
          </div>
          <button class="slot-close-btn" onclick="closeFoodSlotModal()" title="關閉">✕</button>
        </div>
      </div>
      
      <div class="slot-body">
        <!-- 拉霸機台 -->
        <div class="slot-cabinet">
          <div class="slot-reels-row">
            <!-- 軸 1：區域 -->
            <div class="slot-reel">
              <div class="slot-reel-header">📍 出發區域</div>
              <div class="slot-reel-window">
                <div class="slot-reel-val" id="slotReelVal1">🎲 隨機全區</div>
              </div>
              <button class="slot-lock-toggle" id="slotLockBtn1" onclick="toggleReelLock(1)">
                <span id="slotLockIcon1">🔓</span> <span id="slotLockText1">鎖定</span>
              </button>
            </div>

            <!-- 軸 2：預算/偏好 -->
            <div class="slot-reel">
              <div class="slot-reel-header">💰 預算偏好</div>
              <div class="slot-reel-window">
                <div class="slot-reel-val" id="slotReelVal2">✨ 隨緣無拘</div>
              </div>
              <button class="slot-lock-toggle" id="slotLockBtn2" onclick="toggleReelLock(2)">
                <span id="slotLockIcon2">🔓</span> <span id="slotLockText2">鎖定</span>
              </button>
            </div>

            <!-- 軸 3：天選店家 -->
            <div class="slot-reel slot-reel-main">
              <div class="slot-reel-header">🍽️ 天命店家</div>
              <div class="slot-reel-window">
                <div class="slot-reel-val" id="slotReelVal3">🎰 點擊拉動！</div>
              </div>
              <div class="slot-reel-footer" id="slotPoolCount">
                176 間真實候選
              </div>
            </div>
          </div>
        </div>

        <!-- 拉霸按鈕 -->
        <button class="slot-spin-btn" id="slotSpinBtn" onclick="spinFoodSlot()">
          🎰 拉動命運拉霸！由天命決定
        </button>

        <!-- 中獎店家卡片 (100% 真實數據) -->
        <div class="slot-result-card" id="slotResultCard" style="display:none;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="slot-result-badge">
              <span>🎉</span>
              <span id="slotResultBadgeText">🏆 學長姐真心推薦</span>
            </div>
            <span style="font-size:11px; color:#64748b; font-weight:700;" id="slotResultPoolStats"></span>
          </div>
          
          <h4 class="slot-result-title">
            <span id="slotResultName">店家名稱</span>
          </h4>
          
          <div class="slot-result-tags" id="slotResultTags"></div>

          <div class="slot-quote-box">
            <p class="slot-quote-text" id="slotResultQuote">原汁原味學長姐評論...</p>
          </div>

          <div class="slot-result-actions">
            <a class="slot-act-btn slot-act-map" id="slotResultMapBtn" href="#" target="_blank" rel="noopener">
              📍 地圖導航
            </a>
            <button class="slot-act-btn slot-act-fav" id="slotResultFavBtn" onclick="toggleFavSlotFood()">
              ⭐ 收藏此店
            </button>
            <button class="slot-act-btn slot-act-ask" id="slotResultAskBtn" onclick="askSlotFood()">
              💬 問學長姐
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalDiv);

  modalDiv.addEventListener("click", function (e) {
    if (e.target === modalDiv) closeFoodSlotModal();
  });

  // ── 5. 控制邏輯與拉霸滾動演算法 ──
  window.openFoodSlotModal = function () {
    modalDiv.style.display = "flex";
    document.body.style.overflow = "hidden";
    updateCandidatePoolCount();
  };

  window.closeFoodSlotModal = function () {
    modalDiv.style.display = "none";
    document.body.style.overflow = "";
  };

  // 向下相容原本的大轉盤函式名
  window.openLunchWheelModal = window.openFoodSlotModal;
  window.closeLunchWheelModal = window.closeFoodSlotModal;
  window.closeLunchWheelModalOnBackdrop = function(e) {
    if (e.target && e.target.id === "lunchWheelModal") closeFoodSlotModal();
  };

  window.toggleReelLock = function (reelNum) {
    if (isSlotSpinning) return;
    if (reelNum === 1) {
      isLocLocked = !isLocLocked;
      const btn = document.getElementById("slotLockBtn1");
      const icon = document.getElementById("slotLockIcon1");
      const text = document.getElementById("slotLockText1");
      btn.classList.toggle("locked", isLocLocked);
      icon.textContent = isLocLocked ? "🔒" : "🔓";
      text.textContent = isLocLocked ? "已鎖定" : "鎖定";
    } else if (reelNum === 2) {
      isBudLocked = !isBudLocked;
      const btn = document.getElementById("slotLockBtn2");
      const icon = document.getElementById("slotLockIcon2");
      const text = document.getElementById("slotLockText2");
      btn.classList.toggle("locked", isBudLocked);
      icon.textContent = isBudLocked ? "🔒" : "🔓";
      text.textContent = isBudLocked ? "已鎖定" : "鎖定";
    }
    updateCandidatePoolCount();
  };

  function getEligibleFoods() {
    if (typeof SENIOR_FOOD_DB === "undefined" || !SENIOR_FOOD_DB.length) return [];
    const locFilter = REEL_LOCATIONS[currentLocIndex].filter;
    const budFilter = REEL_BUDGETS[currentBudIndex].filter;
    let pool = SENIOR_FOOD_DB.filter(f => locFilter(f) && budFilter(f));
    if (pool.length === 0) {
      // 若條件過度嚴苛導致交集為空，回退為符合區域的店家
      pool = SENIOR_FOOD_DB.filter(locFilter);
    }
    return pool.length > 0 ? pool : SENIOR_FOOD_DB;
  }

  function updateCandidatePoolCount() {
    const pool = getEligibleFoods();
    const lbl = document.getElementById("slotPoolCount");
    if (lbl) lbl.textContent = `${pool.length} 間真實備選`;
  }

  window.spinFoodSlot = function () {
    if (isSlotSpinning) return;
    if (typeof SENIOR_FOOD_DB === "undefined" || !SENIOR_FOOD_DB.length) {
      alert("美食資料庫載入中，請稍候重試！");
      return;
    }

    isSlotSpinning = true;
    const spinBtn = document.getElementById("slotSpinBtn");
    spinBtn.disabled = true;
    document.getElementById("slotResultCard").style.display = "none";

    const v1 = document.getElementById("slotReelVal1");
    const v2 = document.getElementById("slotReelVal2");
    const v3 = document.getElementById("slotReelVal3");

    // 1. 滾動軸 1 (若未鎖定)
    let t1 = 0;
    const timer1 = setInterval(() => {
      if (!isLocLocked) {
        currentLocIndex = (currentLocIndex + 1) % REEL_LOCATIONS.length;
        v1.textContent = REEL_LOCATIONS[currentLocIndex].name;
        v1.style.transform = `translateY(${Math.sin(t1) * 8}px)`;
        playTickSound();
      }
      t1++;
    }, 70);

    // 2. 滾動軸 2 (若未鎖定)
    let t2 = 0;
    const timer2 = setInterval(() => {
      if (!isBudLocked) {
        currentBudIndex = (currentBudIndex + 1) % REEL_BUDGETS.length;
        v2.textContent = REEL_BUDGETS[currentBudIndex].name;
        v2.style.transform = `translateY(${Math.cos(t2) * 8}px)`;
        playTickSound();
      }
      t2++;
    }, 85);

    // 3. 滾動軸 3 (真實店家名稱跳動)
    let t3 = 0;
    const timer3 = setInterval(() => {
      const randomCandidate = SENIOR_FOOD_DB[Math.floor(Math.random() * SENIOR_FOOD_DB.length)];
      v3.textContent = randomCandidate.title.replace(/\s*[\(（].*?[\)）]/, "");
      v3.style.transform = `translateY(${Math.sin(t3 * 1.5) * 10}px)`;
      playTickSound();
      t3++;
    }, 60);

    // 煞停排程 (軸 1 在 600ms 停，軸 2 在 1100ms 停，軸 3 在 1750ms 停)
    setTimeout(() => {
      clearInterval(timer1);
      v1.style.transform = "none";
      if (!isLocLocked) {
        currentLocIndex = Math.floor(Math.random() * REEL_LOCATIONS.length);
        v1.textContent = REEL_LOCATIONS[currentLocIndex].name;
      }
      playTickSound();
    }, 650);

    setTimeout(() => {
      clearInterval(timer2);
      v2.style.transform = "none";
      if (!isBudLocked) {
        currentBudIndex = Math.floor(Math.random() * REEL_BUDGETS.length);
        v2.textContent = REEL_BUDGETS[currentBudIndex].name;
      }
      playTickSound();
      updateCandidatePoolCount();
    }, 1150);

    setTimeout(() => {
      clearInterval(timer3);
      v3.style.transform = "none";

      // 決定真正的中獎店家 (100% 來自真實 pool)
      const pool = getEligibleFoods();
      currentJackpotFood = pool[Math.floor(Math.random() * pool.length)];

      v3.textContent = currentJackpotFood.title.replace(/\s*[\(（].*?[\)）]/, "");
      playJackpotSound();
      showJackpotResult(currentJackpotFood, pool.length);

      isSlotSpinning = false;
      spinBtn.disabled = false;
    }, 1750);
  };

  function showJackpotResult(food, poolTotal) {
    const card = document.getElementById("slotResultCard");
    const nameEl = document.getElementById("slotResultName");
    const tagsEl = document.getElementById("slotResultTags");
    const quoteEl = document.getElementById("slotResultQuote");
    const mapBtn = document.getElementById("slotResultMapBtn");
    const statsEl = document.getElementById("slotResultPoolStats");

    nameEl.textContent = food.title;
    statsEl.textContent = `命中率 1 / ${poolTotal} 間`;

    // 標籤轉換
    const tagMap = {
      budget: "💰 百元有找",
      xuefu: "🎓 學府路",
      nanmen: "🌸 南門路",
      gaogong: "🛵 高工美村",
      nightmarket: "🏮 忠孝夜市",
      campus: "🌲 校內學餐",
      late_night: "🌙 深夜宵夜",
      cafe: "☕ 手搖甜點",
      student_deal: "🏷️ 學生特約"
    };

    let tagsHtml = "";
    if (food.tags) {
      food.tags.forEach(t => {
        if (tagMap[t]) tagsHtml += `<span class="slot-tag-pill">${tagMap[t]}</span>`;
      });
    }
    tagsHtml += `<span class="slot-tag-pill" style="background:#0284c7; color:#fff;">⭐ 學長姐認證</span>`;
    tagsEl.innerHTML = tagsHtml;

    // 清洗過長或重複的原始 content，保留最有梗的學長姐心得
    let cleanContent = food.content || "";
    // 若含有分號分割的多段評論，取前段
    if (cleanContent.includes("；")) {
      const parts = cleanContent.split("；");
      cleanContent = parts[0];
    }
    quoteEl.textContent = cleanContent;

    // Google 地圖連結
    const cleanSearchName = food.title.replace(/\s*[\(（].*?[\)）]/, "").trim();
    mapBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanSearchName + " 台中 中興大學")}`;

    updateFavBtnState();
    card.style.display = "block";
  }

  window.toggleFavSlotFood = function () {
    if (!currentJackpotFood) return;
    const favKey = "NCHU_FAV_FOODS";
    let favs = [];
    try {
      favs = JSON.parse(localStorage.getItem(favKey) || "[]");
    } catch (e) { favs = []; }

    const idx = favs.findIndex(f => f.title === currentJackpotFood.title);
    if (idx >= 0) {
      favs.splice(idx, 1);
      alert(`已從口袋名單移除：${currentJackpotFood.title}`);
    } else {
      favs.push({
        title: currentJackpotFood.title,
        content: currentJackpotFood.content,
        time: new Date().toISOString()
      });
      alert(`⭐ 已成功收藏至口袋名單：\n${currentJackpotFood.title}`);
    }
    localStorage.setItem(favKey, JSON.stringify(favs));
    updateFavBtnState();
  };

  function updateFavBtnState() {
    if (!currentJackpotFood) return;
    const favBtn = document.getElementById("slotResultFavBtn");
    if (!favBtn) return;
    let favs = [];
    try {
      favs = JSON.parse(localStorage.getItem("NCHU_FAV_FOODS") || "[]");
    } catch (e) { favs = []; }
    const isFav = favs.some(f => f.title === currentJackpotFood.title);
    favBtn.innerHTML = isFav ? "★ 已收藏" : "⭐ 收藏此店";
    favBtn.style.color = isFav ? "#ca8a04" : "#475569";
    favBtn.style.background = isFav ? "#fef9c3" : "#ffffff";
    favBtn.style.borderColor = isFav ? "#fde047" : "#cbd5e1";
  }

  window.askSlotFood = function () {
    if (!currentJackpotFood) return;
    closeFoodSlotModal();
    const cleanName = currentJackpotFood.title.replace(/\s*[\(（].*?[\)）]/, "").trim();
    if (typeof openChatSheet === "function") {
      openChatSheet(cleanName + " 學長姐評價與推薦菜色");
    }
  };
})();
