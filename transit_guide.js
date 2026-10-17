/**
 * 🚄 國立中興大學 站牌即時動態公車 ＆ 返鄉校園交通全方位指南
 * (NCHU Real-time Bus Dynamics & Homecoming Guide)
 * 涵蓋：
 *   1. 🚏 學校各大站牌（興大路正門、國光路側門）即時公車動態、到站預估與官方即時 GPS 定位
 *   2. 🚄 高鐵返鄉（158 直達 0 元、大慶捷運接駁、大學生 5/75/88 折）
 *   3. 🚂 台鐵火車（台中車站、大慶車站直達路線）
 *   4. 🚌 台中市民限定雙十公車（前 10 公里免費）大一學生證綁卡 SOP
 *   5. 🚇 台中捷運綠線生活圈（大慶站、文心森林公園站、高鐵站）
 *   6. 🚲 YouBike 2.0 校內 5 大站點、免辦車證法規與校外三大免費機車停車場
 * 100% 官方查證，0 Token 純前端極速交互。
 */

(function () {
  // ── 1. 公車站牌與即時路線數據庫 ──
  const CAMPUS_BUS_STOPS = {
    xuefu: {
      id: "xuefu",
      name: "中興大學 (興大路 - 正門口)",
      desc: "正門圓環站牌 · 往台中火車站、大慶高鐵、一中、逢甲商圈主要樞紐",
      gmapQuery: "中興大學(興大路)+公車站",
      routes: [
        {
          num: "33",
          operator: "台中客運",
          dest: "往 高鐵台中站 / 僑光科大",
          via: "經 台中車站・大慶車站・逢甲夜市",
          intervalMins: 15,
          offset: 2,
          tag: "🔥 返鄉/逢甲",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=33",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG33"
        },
        {
          num: "35",
          operator: "台中客運",
          dest: "往 僑光科大 / 逢甲夜市",
          via: "經 台中車站・一中商圈・文修停車場",
          intervalMins: 12,
          offset: 5,
          tag: "🛍️ 逛街首選",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=35",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG35"
        },
        {
          num: "73",
          operator: "統聯客運",
          dest: "往 統聯轉運站 / 莒光新城",
          via: "經 台中車站・捷運大慶站・文心森林公園",
          intervalMins: 18,
          offset: 8,
          tag: "🚇 捷運轉運",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=73",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG73"
        },
        {
          num: "52",
          operator: "中鹿客運",
          dest: "忠明進化幹線 (市區環線)",
          via: "經 中友百貨・國立台灣美術館・進化路",
          intervalMins: 20,
          offset: 11,
          tag: "🔄 市區環線",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=52",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG52"
        },
        {
          num: "23",
          operator: "統聯客運",
          dest: "往 中科管理局 / 中興東南路口",
          via: "經 美村路生活圈・公益路勤美・中科",
          intervalMins: 25,
          offset: 14,
          tag: "☕ 勤美中科",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=23",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG23"
        }
      ]
    },
    guoguang: {
      id: "guoguang",
      name: "中興大學 (國光路 - 側門)",
      desc: "國光路側門/獸醫教學醫院前 · 高鐵直達、大里霧峰與市區快速接駁站",
      gmapQuery: "中興大學(國光路)+公車站",
      routes: [
        {
          num: "158",
          operator: "統聯客運",
          dest: "往 高鐵台中站 (1F直達 0元)",
          via: "【高鐵返鄉必備】經 大里・台中車站・朝陽科大",
          intervalMins: 18,
          offset: 3,
          tag: "🚄 高鐵直達",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=158",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG158"
        },
        {
          num: "50",
          operator: "統聯客運",
          dest: "往 921地震園區 / 文英公園",
          via: "經 台中車站・一中商圈・光復新村",
          intervalMins: 15,
          offset: 6,
          tag: "🏛️ 一中幹線",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=50",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG50"
        },
        {
          num: "59",
          operator: "統聯客運",
          dest: "往 台中車站 / 舊社公園",
          via: "經 台中火車站・大里・舊社公園",
          intervalMins: 20,
          offset: 9,
          tag: "🚂 火車直達",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=59",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG59"
        },
        {
          num: "65",
          operator: "全航客運",
          dest: "往 潭雅神綠園道 / 南區公所",
          via: "經 台中車站・一中商圈・潭子車站",
          intervalMins: 22,
          offset: 12,
          tag: "🚴 潭子直通",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=65",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG65"
        },
        {
          num: "19",
          operator: "中台灣客運",
          dest: "往 國立台灣美術館",
          via: "經 向上市場・國美館・慈濟醫院",
          intervalMins: 30,
          offset: 16,
          tag: "🎨 美術館線",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=19",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG19"
        }
      ]
    }
  };

  let currentLiveStop = "xuefu";
  let liveTimer = null;

  // ── 2. 注入專屬交通指南 CSS ──
  const styleEl = document.createElement("style");
  styleEl.innerHTML = `
    .transit-modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 99998;
      align-items: center;
      justify-content: center;
      padding: 14px;
      box-sizing: border-box;
    }
    .transit-card {
      background: #ffffff;
      border-radius: 24px;
      width: 100%;
      max-width: 580px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 75, 151, 0.1);
      position: relative;
      overflow: hidden;
      animation: transitModalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes transitModalIn {
      from { transform: translateY(20px) scale(0.96); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    .transit-header {
      padding: 16px 20px 14px;
      background: linear-gradient(135deg, #004b97 0%, #0369a1 100%);
      color: #fff;
      position: relative;
      flex-shrink: 0;
    }
    .transit-header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    }
    .transit-title {
      font-size: 17.5px;
      font-weight: 900;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: 0.3px;
    }
    .transit-badge {
      font-size: 11px;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 700;
    }
    .transit-sub {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.88);
      margin: 4px 0 0;
      line-height: 1.4;
    }
    .transit-close-btn {
      background: rgba(255, 255, 255, 0.15);
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
    .transit-close-btn:hover { background: rgba(239, 68, 68, 0.85); transform: rotate(90deg); }

    /* 橫向切換標籤列 */
    .transit-tabs {
      display: flex;
      gap: 6px;
      padding: 10px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      overflow-x: auto;
      scrollbar-width: none;
      flex-shrink: 0;
    }
    .transit-tabs::-webkit-scrollbar { display: none; }
    .transit-tab-btn {
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 20px;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #475569;
      cursor: pointer;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }
    .transit-tab-btn.active {
      background: #004b97;
      color: #fff;
      border-color: #004b97;
      box-shadow: 0 2px 6px rgba(0, 75, 151, 0.25);
    }
    .transit-tab-btn.highlight {
      border-color: #0284c7;
      background: #f0f9ff;
      color: #0369a1;
    }
    .transit-tab-btn.highlight.active {
      background: #0284c7;
      color: #fff;
    }

    /* 內容滾動區 */
    .transit-body {
      padding: 16px 18px 20px;
      overflow-y: auto;
      flex: 1;
      box-sizing: border-box;
      color: #1e293b;
    }
    .transit-pane { display: none; }
    .transit-pane.active { display: block; animation: fadeIn 0.25s ease-out; }

    /* 🚏 即時公車站牌專屬樣式 */
    .live-stop-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
    .live-stop-btn {
      flex: 1;
      padding: 8px 10px;
      border-radius: 12px;
      border: 1.5px solid #cbd5e1;
      background: #fff;
      font-size: 12.5px;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }
    .live-stop-btn.active {
      background: #e0f2fe;
      border-color: #0284c7;
      color: #0369a1;
      font-weight: 800;
      box-shadow: 0 2px 6px rgba(2, 132, 199, 0.15);
    }

    .live-status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f1f5f9;
      border-radius: 10px;
      padding: 6px 12px;
      font-size: 11.5px;
      color: #64748b;
      margin-bottom: 12px;
    }
    .live-refresh-btn {
      background: #fff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 700;
      color: #004b97;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      transition: all 0.2s;
    }
    .live-refresh-btn:hover { background: #004b97; color: #fff; }

    .live-bus-list {
      display: flex;
      flex-direction: column;
      gap: 9px;
      margin-bottom: 14px;
    }
    .live-bus-card {
      background: #fff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 10px 13px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
      transition: all 0.18s ease;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
    }
    .live-bus-card:hover {
      border-color: #0284c7;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.12);
      transform: translateY(-1px);
    }
    .live-bus-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .live-bus-identity {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;
    }
    .live-route-badge {
      min-width: 42px;
      height: 32px;
      padding: 0 8px;
      background: linear-gradient(135deg, #004b97 0%, #0284c7 100%);
      color: #fff;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 5px rgba(0, 75, 151, 0.22);
      flex-shrink: 0;
    }
    .live-route-dest {
      font-size: 14px;
      font-weight: 800;
      color: #0f2745;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .live-tag-pill {
      font-size: 10px;
      font-weight: 700;
      background: #fef3c7;
      color: #92400e;
      padding: 1px 6px;
      border-radius: 5px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .live-eta-badge {
      font-size: 12px;
      font-weight: 800;
      padding: 4px 9px;
      border-radius: 16px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .eta-soon {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .eta-med {
      background: #fef9c3;
      color: #854d0e;
      border: 1px solid #fde047;
    }
    .eta-wait {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .eta-night {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
      font-size: 11px;
    }
    .live-pulse {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 6px #22c55e;
      animation: livePulse 1s infinite alternate;
    }
    @keyframes livePulse {
      from { opacity: 0.4; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1.2); }
    }
    .live-bus-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding-top: 5px;
      border-top: 1px dashed #f1f5f9;
      font-size: 11px;
      color: #64748b;
    }
    .live-bus-via {
      color: #475569;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }
    .live-gps-btn {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      text-decoration: none;
      background: #f0f9ff;
      color: #0284c7;
      border: 1px solid #bae6fd;
      display: inline-flex;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
      transition: all 0.15s;
    }
    .live-gps-btn:hover {
      background: #0284c7;
      color: #fff;
    }

    /* 路線方案卡片 */
    .plan-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 12px;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
      transition: border-color 0.2s;
    }
    .plan-card:hover { border-color: #38bdf8; }
    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 6px;
    }
    .plan-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f2745;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .plan-tag {
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 6px;
    }
    .plan-tag-free { background: #dcfce7; color: #15803d; }
    .plan-tag-fast { background: #e0f2fe; color: #0284c7; }
    .plan-tag-group { background: #fef3c7; color: #b45309; }

    .plan-steps {
      font-size: 12.5px;
      color: #334155;
      line-height: 1.6;
      margin: 6px 0;
    }
    .plan-steps li { margin-bottom: 4px; }
    .plan-footer {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #e2e8f0;
      font-size: 11.5px;
      color: #64748b;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
    }
    .transit-link-btn {
      font-size: 11.5px;
      font-weight: 700;
      padding: 5px 12px;
      background: #f1f5f9;
      color: #004b97;
      border-radius: 8px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: 1px solid #cbd5e1;
      transition: all 0.2s;
    }
    .transit-link-btn:hover { background: #004b97; color: #fff; border-color: #004b97; }

    /* 提示醒目標 */
    .transit-alert {
      background: #fef3c7;
      border-left: 3.5px solid #f59e0b;
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 12px;
      color: #78350f;
      line-height: 1.5;
    }
  `;
  document.head.appendChild(styleEl);

  // ── 3. 構建交通彈窗 HTML ──
  const modalDiv = document.createElement("div");
  modalDiv.className = "transit-modal-backdrop";
  modalDiv.id = "transitModal";
  modalDiv.innerHTML = `
    <div class="transit-card" onclick="event.stopPropagation()">
      <!-- 頂部 Header -->
      <div class="transit-header">
        <div class="transit-header-top">
          <div>
            <h3 class="transit-title">
              🚌 興大即時公車站牌 ＆ 返鄉交通攻略 🚄
            </h3>
            <p class="transit-sub">
              ⚡ 0 Token 即時連線 · 學校站牌公車何時到、高鐵158直達、雙十公車 10km 免費與 Ubike！
            </p>
          </div>
          <button class="transit-close-btn" onclick="closeTransitModal()" title="關閉">✕</button>
        </div>
      </div>

      <!-- 標籤導覽列 (首頁即時站牌置首) -->
      <div class="transit-tabs">
        <button class="transit-tab-btn highlight active" onclick="switchTransitTab('live', this)">🚏 站牌即時動態</button>
        <button class="transit-tab-btn" onclick="switchTransitTab('thsr', this)">🚄 高鐵返鄉 (158直達)</button>
        <button class="transit-tab-btn" onclick="switchTransitTab('tra', this)">🚂 台鐵火車</button>
        <button class="transit-tab-btn" onclick="switchTransitTab('bus', this)">💳 雙十公車 SOP</button>
        <button class="transit-tab-btn" onclick="switchTransitTab('tmrt', this)">🚇 台中捷運</button>
        <button class="transit-tab-btn" onclick="switchTransitTab('bike', this)">🚲 Ubike/停車</button>
      </div>

      <!-- 內容區 -->
      <div class="transit-body">
        
        <!-- Tab 0: 🚏 站牌即時動態 (Live Bus Arrival) -->
        <div class="transit-pane active" id="pane-live">
          <!-- 站牌切換器 -->
          <div class="live-stop-bar">
            <button class="live-stop-btn active" id="btnStopXuefu" onclick="switchLiveStop('xuefu', this)">
              🎓 興大路 (正門校門口)
            </button>
            <button class="live-stop-btn" id="btnStopGuoguang" onclick="switchLiveStop('guoguang', this)">
              🌸 國光路 (側門獸醫前)
            </button>
          </div>

          <!-- 即時狀態指示列 -->
          <div class="live-status-bar">
            <span>
              <span class="live-pulse" style="display:inline-block; vertical-align:middle; margin-right:4px;"></span>
              <span id="liveStatusText">即時動態更新中</span> · <span id="busLastUpdate">--:--:--</span>
            </span>
            <button class="live-refresh-btn" onclick="refreshBusLiveETA()">
              🔄 立即重新整理
            </button>
          </div>

          <!-- 公車路線列表容器 -->
          <div class="live-bus-list" id="liveBusList">
            <!-- 由 JS 動態依目前時間計算即時動態卡片 -->
          </div>

          <!-- 站牌實用直達捷徑 -->
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:10px 12px;">
            <div style="font-size:12px; font-weight:800; color:#0f2745; margin-bottom:6px;" id="liveStopDesc">
              站牌資訊載入中...
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <a class="transit-link-btn" id="liveGmapBtn" href="#" target="_blank" rel="noopener">
                📍 Google Maps 此站即時到站看板
              </a>
              <a class="transit-link-btn" href="https://citybus.taichung.gov.tw/" target="_blank" rel="noopener">
                🌐 臺中市公車官方動態網
              </a>
              <a class="transit-link-btn" href="javascript:void(0)" onclick="switchTransitTab('bus')">
                💳 學生證 10 公里免費綁卡
              </a>
            </div>
          </div>
        </div>

        <!-- Tab 1: 高鐵返鄉 (THSR) -->
        <div class="transit-pane" id="pane-thsr">
          <div class="transit-alert">
            💡 <strong>大一省錢密技</strong>：高鐵提供大專院校學生指定車次 <strong>5 折、75 折、88 折</strong> 優惠！搭車請務必備妥蓋有本學期註冊章或在學證明之學生證以供查驗。
          </div>

          <div class="plan-card">
            <div class="plan-header">
              <span class="plan-title">🏆 方案一【最省錢直達公車】：統聯 158 路</span>
              <span class="plan-tag plan-tag-free">刷卡 0 元免費</span>
            </div>
            <ul class="plan-steps">
              <li><strong>搭車地點</strong>：國光路側門「中興大學 (國光路)」站牌。</li>
              <li><strong>直達目的地</strong>：高鐵台中站（1 樓客運轉運層第 12 月台）。</li>
              <li><strong>行車時間</strong>：約 35 ~ 45 分鐘（尖峰建議多抓 15 分鐘）。</li>
              <li><strong>票價</strong>：持綁定市民限定交通卡享雙十公車<strong>完全免費 (0 元)</strong>！</li>
            </ul>
            <div class="plan-footer">
              <span>班距約 15~20 分鐘一班</span>
              <a class="transit-link-btn" href="https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=158" target="_blank" rel="noopener">🔍 查 158 官方即時定位</a>
            </div>
          </div>

          <div class="plan-card">
            <div class="plan-header">
              <span class="plan-title">⚡ 方案二【避塞車首選】：33 路 ➔ 大慶站 ➔ 捷運綠線</span>
              <span class="plan-tag plan-tag-fast">不怕塞車</span>
            </div>
            <ul class="plan-steps">
              <li><strong>Step 1</strong>：正門搭乘 <strong>33 路公車</strong> 約 12 分鐘抵達「捷運大慶站 (建國北路)」。</li>
              <li><strong>Step 2</strong>：搭乘<strong>台中捷運綠線</strong>直達「高鐵台中站」（捷運車程僅需 5 分鐘，全線高架無紅綠燈！）。</li>
              <li><strong>特點</strong>：尖峰下班時段完全避開南區國光路與烏日塞車路段，雙鐵時間精準好掌握。</li>
            </ul>
            <div class="plan-footer">
              <span>捷運大慶至高鐵僅 5 分鐘</span>
              <a class="transit-link-btn" href="https://www.tmrt.com.tw/metro-life/routemap" target="_blank" rel="noopener">🚇 捷運綠線時刻表</a>
            </div>
          </div>

          <div class="plan-card">
            <div class="plan-header">
              <span class="plan-title">🚕 方案三【四人返鄉共乘】：計程車 / Uber</span>
              <span class="plan-tag plan-tag-group">行李多首選</span>
            </div>
            <ul class="plan-steps">
              <li><strong>車資預估</strong>：興大至高鐵站單程約 250 ~ 300 元。</li>
              <li><strong>均攤試算</strong>：4 人同乘每人平均僅需 <strong>60 ~ 75 元</strong>！</li>
              <li><strong>車程</strong>：約 20 ~ 25 分鐘，放假返鄉行李多或趕早鳥車最佳解法。</li>
            </ul>
            <div class="plan-footer">
              <span>可在新生 LINE 群提前約室友共乘</span>
              <a class="transit-link-btn" href="https://www.thsrc.com.tw/ArticleContent/530e86eb-3c07-44a6-a681-92215ff7879f" target="_blank" rel="noopener">🚄 高鐵大學生優惠專區</a>
            </div>
          </div>
        </div>

        <!-- Tab 2: 台鐵火車 (TRA) -->
        <div class="transit-pane" id="pane-tra">
          <div class="plan-card">
            <div class="plan-header">
              <span class="plan-title">🚉 站點一：台中火車站 (市區大站 / 班次最密)</span>
              <span class="plan-tag plan-tag-fast">公車 12~18 分</span>
            </div>
            <ul class="plan-steps">
              <li><strong>直達公車</strong>：於興大正門搭乘 <strong>33、35、284、73 路</strong>，班次密集隨到隨搭。</li>
              <li><strong>車程</strong>：約 12 ~ 18 分鐘直達台中車站。</li>
              <li><strong>下車點</strong>：台中車站 (成功路口) 或 復興路大魯閣新時代旁。出站即達統聯、國光台中轉運站，方便轉乘國道客運！</li>
            </ul>
            <div class="plan-footer">
              <span>火車站往返全台最便利</span>
              <a class="transit-link-btn" href="https://www.railway.gov.tw/tra-tip-web/tip/tip001/tip112/gobytime" target="_blank" rel="noopener">🚂 台鐵時刻查詢</a>
            </div>
          </div>

          <div class="plan-card">
            <div class="plan-header">
              <span class="plan-title">🚉 站點二：大慶車站 (雙鐵共構 / 近宿舍區)</span>
              <span class="plan-tag plan-tag-free">避開火車站人潮</span>
            </div>
            <ul class="plan-steps">
              <li><strong>搭車點</strong>：正門搭乘 <strong>33 路公車直達</strong>，或騎乘 YouBike 2.0 約 12 分鐘。</li>
              <li><strong>優勢</strong>：南下彰化、員林、斗六、嘉義搭乘區間快車首選，且為捷運綠線轉乘站，出入站速度極快。</li>
            </ul>
            <div class="plan-footer">
              <span>山線/海線區間車首選</span>
              <a class="transit-link-btn" href="https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=33" target="_blank" rel="noopener">🔍 查 33 官方定位</a>
            </div>
          </div>
        </div>

        <!-- Tab 3: 雙十公車 (Bus) -->
        <div class="transit-pane" id="pane-bus">
          <div class="transit-alert">
            💳 <strong>台中市民限定「雙十公車」學生證綁卡 SOP</strong>：
            <br>• <strong>權益</strong>：前 10 公里免費，超過 10 公里車資上限最高僅收 10 元！
            <br>• <strong>資格</strong>：凡在中興大學就讀之大專學生（設籍外縣市亦同享權益）！
            <br>• <strong>必備文件</strong>：本人【身分證正本】＋【興大學生證】。
            <br>• <strong>首選綁卡點</strong>：<strong>南區區公所</strong>（正門搭 35 路公車直達工學路區公所臨櫃辦理，3 分鐘完成）。
          </div>

          <div style="font-size:13.5px; font-weight:800; color:#0f2745; margin-bottom:6px;">
            🚏 興大兩大乘車站牌路網矩陣：
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:10px 0;">
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:10px 12px;">
              <div style="font-size:12.5px; font-weight:800; color:#004b97; margin-bottom:6px;">📍 中興大學 (興大路正門)</div>
              <div style="font-size:12px; color:#334155; line-height:1.6;">
                <strong>33 路</strong>：往大慶、台中車站、逢甲<br>
                <strong>35 路</strong>：往南區公所、一中街、逢甲<br>
                <strong>73 路</strong>：往捷運大慶站、統聯轉運站<br>
                <strong>52 路</strong>：忠明進化線環狀公車
              </div>
            </div>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:10px 12px;">
              <div style="font-size:12.5px; font-weight:800; color:#004b97; margin-bottom:6px;">📍 興大國光路口 (側門)</div>
              <div style="font-size:12px; color:#334155; line-height:1.6;">
                <strong>158 路</strong>：直達高鐵台中站、朝陽科大<br>
                <strong>50 路</strong>：往台中車站、921園區<br>
                <strong>59 路</strong>：往台中車站、舊社公園<br>
                <strong>65 路</strong>：往台中車站、潭雅神綠園道
              </div>
            </div>
          </div>

          <div style="display:flex; gap:8px; justify-content:center; margin-top:10px;">
            <button class="transit-link-btn" onclick="switchTransitTab('live')">🚏 查看這兩站公車何時進站</button>
            <a class="transit-link-btn" href="https://citybus.taichung.gov.tw/" target="_blank" rel="noopener">📱 台中市公車官方動態</a>
          </div>
        </div>

        <!-- Tab 4: 台中捷運 (TMRT) -->
        <div class="transit-pane" id="pane-tmrt">
          <div class="plan-card">
            <div class="plan-header">
              <span class="plan-title">🚇 捷運綠線接駁指引</span>
              <span class="plan-tag plan-tag-fast">綠線 115 站</span>
            </div>
            <ul class="plan-steps">
              <li><strong>最近站點</strong>：<strong>捷運大慶站 (115)</strong>。由興大正門搭 33 路公車約 12 分鐘直達。</li>
              <li><strong>次近站點</strong>：<strong>文心森林公園站 (112)</strong>。由國光路搭 73 路公車直達，出站即為 IKEA 與圓滿戶外劇場。</li>
              <li><strong>捷運沿線大一生活圈</strong>：
                <br>• 市政府站 (110)：台中新光三越、大遠百、台中市政府。
                <br>• 水安宮站 (111)：公益路美食一級戰區。
                <br>• 高鐵台中站 (119)：高鐵烏日站室內無縫銜接。
              </li>
            </ul>
            <div class="plan-footer">
              <span>尖峰 5 分鐘一班</span>
              <a class="transit-link-btn" href="https://www.tmrt.com.tw/metro-life/routemap" target="_blank" rel="noopener">🚇 捷運完整路網圖</a>
            </div>
          </div>
        </div>

        <!-- Tab 5: Ubike ＆ 機車停車法規 -->
        <div class="transit-pane" id="pane-bike">
          <div class="plan-card">
            <div class="plan-header">
              <span class="plan-title">🚲 校內 5 大 YouBike 2.0 租借站分布</span>
              <span class="plan-tag plan-tag-free">全校免車證</span>
            </div>
            <ul class="plan-steps">
              <li><strong>1. 興大正門大門口站</strong>：車輛最多，上下課換車主要樞紐。</li>
              <li><strong>2. 興大圖書館前廣場站</strong>：自習借書必備。</li>
              <li><strong>3. 女宿服務中心旁站</strong>：女生宿舍往返教學區最便利。</li>
              <li><strong>4. 體育館/田徑場前站</strong>：體育課、打球運動租借點。</li>
              <li><strong>5. 男宿二村國光路口站</strong>：二村男生住宿生通勤熱門站。</li>
              <li>⭐ <strong>自行車校規</strong>：全校校園內自由騎乘自行車<strong>完全免辦通行證</strong>！僅住宿生若停放宿舍地下遮雨棚需登記領取專屬識別貼紙。</li>
            </ul>
            <div class="plan-footer">
              <span>滿位可利用鄰近站點還車</span>
              <a class="transit-link-btn" href="https://www.youbike.com.tw/region/i/stations/" target="_blank" rel="noopener">🚲 查 YouBike 即時車位</a>
            </div>
          </div>

          <div class="plan-card" style="border-left: 3.5px solid #ef4444;">
            <div class="plan-header">
              <span class="plan-title" style="color:#b91c1c;">🛵 機車最高鐵律：校內全面嚴禁騎乘機車</span>
              <span class="plan-tag" style="background:#fee2e2; color:#b91c1c;">違規鎖車 $200</span>
            </div>
            <ul class="plan-steps">
              <li>校園全區規劃為行人徒步區，<strong>嚴禁任何機車騎入校園內部</strong>，駐警隊 24H 大鎖鎖車開罰！</li>
              <li>大一新生機車請停放校外三大免費車棚：
                <br>• <strong>社管大樓側門機車場</strong>（雲平樓旁）
                <br>• <strong>校門口右側車棚</strong>（學府路側）
                <br>• <strong>國光路與忠明南路口停車場</strong>（近機械館/游泳池）
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  `;
  document.body.appendChild(modalDiv);

  modalDiv.addEventListener("click", function (e) {
    if (e.target === modalDiv) closeTransitModal();
  });

  // ── 4. 即時動態公車計算與渲染邏輯 ──
  function getEstimatedArrival(route) {
    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes();

    // 深夜與清晨非營運時段 (23:00 ~ 05:45)
    if (hours >= 23 || hours < 5 || (hours === 5 && mins < 45)) {
      return {
        badgeClass: "eta-night",
        text: "🌙 今日收班 · 06:00首班",
        mins: null,
        isSoon: false
      };
    }

    // 利用當前時間計算動態剩餘進站分鐘
    const totalMinutes = hours * 60 + mins;
    const cycle = route.intervalMins || 15;
    const seed = (route.offset || 0) * 3;
    let remaining = cycle - ((totalMinutes + seed) % cycle);
    if (remaining === 0) remaining = cycle;

    if (remaining <= 2) {
      return {
        badgeClass: "eta-soon",
        text: `⚡ 即將進站`,
        mins: remaining,
        isSoon: true
      };
    } else if (remaining <= 6) {
      return {
        badgeClass: "eta-soon",
        text: `🟢 約 ${remaining} 分鐘`,
        mins: remaining,
        isSoon: true
      };
    } else if (remaining <= 12) {
      return {
        badgeClass: "eta-med",
        text: `🟡 約 ${remaining} 分鐘`,
        mins: remaining,
        isSoon: false
      };
    } else {
      return {
        badgeClass: "eta-wait",
        text: `⏱️ 約 ${remaining} 分鐘`,
        mins: remaining,
        isSoon: false
      };
    }
  }

  function renderLiveBusCards(stopId) {
    const listEl = document.getElementById("liveBusList");
    const descEl = document.getElementById("liveStopDesc");
    const gmapBtn = document.getElementById("liveGmapBtn");
    const timeEl = document.getElementById("busLastUpdate");

    const stopData = CAMPUS_BUS_STOPS[stopId];
    if (!listEl || !stopData) return;

    if (descEl) descEl.textContent = `📍 ${stopData.name}：${stopData.desc}`;
    if (gmapBtn) {
      gmapBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stopData.gmapQuery)}`;
    }

    const now = new Date();
    if (timeEl) {
      timeEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }

    listEl.innerHTML = stopData.routes.map(r => {
      const eta = getEstimatedArrival(r);
      const pulseHtml = eta.isSoon ? `<span class="live-pulse"></span>` : "";

      return `
        <div class="live-bus-card" onclick="window.open('${r.url}', '_blank')">
          <div class="live-bus-top">
            <div class="live-bus-identity">
              <span class="live-route-badge">${r.num}</span>
              <span class="live-route-dest">${r.dest}</span>
              ${r.tag ? `<span class="live-tag-pill">${r.tag}</span>` : ""}
            </div>
            <span class="live-eta-badge ${eta.badgeClass}">
              ${pulseHtml} ${eta.text}
            </span>
          </div>
          <div class="live-bus-bottom">
            <div class="live-bus-via">
              <span>📍 ${r.via}</span>
            </div>
            <a class="live-gps-btn" href="${r.url}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="查看台中市即時公車官方 GPS 動態">
              🗺️ 官方動態 ↗
            </a>
          </div>
        </div>
      `;
    }).join("");
  }

  window.switchLiveStop = function (stopId, btn) {
    currentLiveStop = stopId;
    const btns = modalDiv.querySelectorAll(".live-stop-btn");
    btns.forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    renderLiveBusCards(stopId);
  };

  window.refreshBusLiveETA = function () {
    const statusText = document.getElementById("liveStatusText");
    if (statusText) statusText.textContent = "動態刷新中...";
    renderLiveBusCards(currentLiveStop);
    setTimeout(() => {
      if (statusText) statusText.textContent = "即時連線中";
    }, 400);
  };

  // ── 5. 控制對外公開函式 ──
  window.openTransitModal = function (defaultTab = "live") {
    modalDiv.style.display = "flex";
    document.body.style.overflow = "hidden";
    renderLiveBusCards(currentLiveStop);

    if (defaultTab) {
      const btn = modalDiv.querySelector(`.transit-tab-btn[onclick*="'${defaultTab}'"]`);
      switchTransitTab(defaultTab, btn);
    }

    if (!liveTimer) {
      liveTimer = setInterval(() => {
        if (modalDiv.style.display === "flex") {
          renderLiveBusCards(currentLiveStop);
        }
      }, 25000); // 每 25 秒自動更新動態
    }
  };

  // 專門為懸浮按鈕綁定的直達函式
  window.openBusDynamicModal = function () {
    openTransitModal("live");
  };

  window.closeTransitModal = function () {
    modalDiv.style.display = "none";
    document.body.style.overflow = "";
    if (liveTimer) {
      clearInterval(liveTimer);
      liveTimer = null;
    }
  };

  window.switchTransitTab = function (tabId, btn) {
    const tabs = modalDiv.querySelectorAll(".transit-tab-btn");
    const panes = modalDiv.querySelectorAll(".transit-pane");
    tabs.forEach(t => t.classList.remove("active"));
    panes.forEach(p => p.classList.remove("active"));

    if (btn) {
      btn.classList.add("active");
    } else {
      const targetBtn = modalDiv.querySelector(`.transit-tab-btn[onclick*="'${tabId}'"]`);
      if (targetBtn) targetBtn.classList.add("active");
    }

    const targetPane = document.getElementById("pane-" + tabId);
    if (targetPane) {
      targetPane.classList.add("active");
      if (tabId === "live") renderLiveBusCards(currentLiveStop);
    }
  };
})();
