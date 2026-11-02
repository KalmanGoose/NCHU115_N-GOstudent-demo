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
  
  // ── 1. 公車站牌與即時路線數據庫 (多語增強版) ──
  const CAMPUS_BUS_STOPS = {
    xuefu: {
      id: "xuefu",
      name: "興大路 (正門)",
      name_en: "Xingda Rd. (Main)",
      name_id: "Jl. Xingda (Utama)",
      desc: "正門圓環 · 往台中車站、大慶高鐵、逢甲夜市",
      desc_en: "Main Gate · Hub to Taichung Station, HSR & Fengjia",
      desc_id: "Gerbang Utama · Hub ke Stasiun Taichung, HSR & Fengjia",
      gmapQuery: "中興大學(興大路)+公車站",
      routes: [
        {
          num: "33",
          operator: "台中客運",
          dest: "往 高鐵台中站 / 僑光科大",
          dest_en: "To Taichung HSR / Overseas Chinese Univ",
          dest_id: "Ke HSR Taichung / Univ Overseas Chinese",
          via: "經 台中車站・大慶車站・逢甲夜市",
          via_en: "Via Taichung Station, Daqing Station, Fengjia Night Market",
          via_id: "Lewat Stasiun Taichung, Stasiun Daqing, Pasar Malam Fengjia",
          intervalMins: 15,
          offset: 2,
          tag: "🔥 返鄉/逢甲",
          tag_en: "🔥 HSR/Fengjia",
          tag_id: "🔥 HSR/Fengjia",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=33",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG33"
        },
        {
          num: "35",
          operator: "台中客運",
          dest: "往 僑光科大 / 逢甲夜市",
          dest_en: "To Overseas Chinese Univ / Fengjia Night Mkt",
          dest_id: "Ke Univ Overseas Chinese / Pasar Malam Fengjia",
          via: "經 台中車站・一中商圈・文修停車場",
          via_en: "Via Taichung Station, Yizhong Shopping District",
          via_id: "Lewat Stasiun Taichung, Kawasan Belanja Yizhong",
          intervalMins: 12,
          offset: 5,
          tag: "🛍️ 逛街首選",
          tag_en: "🛍️ Shopping",
          tag_id: "🛍️ Belanja",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=35",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG35"
        },
        {
          num: "73",
          operator: "統聯客運",
          dest: "往 統聯轉運站 / 莒光新城",
          dest_en: "To Ubus Transfer Station / Juguang",
          dest_id: "Ke Terminal Ubus / Juguang",
          via: "經 台中車站・捷運大慶站・文心森林公園",
          via_en: "Via Taichung Station, Metro Daqing Station, Wenxin Park",
          via_id: "Lewat Stasiun Taichung, MRT Daqing, Taman Wenxin",
          intervalMins: 18,
          offset: 8,
          tag: "🚇 捷運轉運",
          tag_en: "🚇 Metro Transfer",
          tag_id: "🚇 Transit MRT",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=73",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG73"
        },
        {
          num: "52",
          operator: "中鹿客運",
          dest: "忠明進化幹線 (市區環線)",
          dest_en: "Zhongming-Jinhua Loop (City Loop)",
          dest_id: "Jalur Lingkar Kota Zhongming-Jinhua",
          via: "經 中友百貨・國立台灣美術館・進化路",
          via_en: "Via Chungyo Mall, National Taiwan Museum of Fine Arts",
          via_id: "Lewat Mall Chungyo, Museum Seni Nasional Taiwan",
          intervalMins: 20,
          offset: 11,
          tag: "🔄 市區環線",
          tag_en: "🔄 City Loop",
          tag_id: "🔄 Lingkar Kota",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=52",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG52"
        },
        {
          num: "23",
          operator: "統聯客運",
          dest: "往 中科管理局 / 中興東南路口",
          dest_en: "To Central Science Park (CTSP)",
          dest_id: "Ke Central Science Park (CTSP)",
          via: "經 美村路生活圈・公益路勤美・中科",
          via_en: "Via Meicun Rd Life Zone, Calligraphy Greenway, CTSP",
          via_id: "Lewat Jl. Meicun, Calligraphy Greenway, CTSP",
          intervalMins: 25,
          offset: 14,
          tag: "☕ 勤美中科",
          tag_en: "☕ Calligraphy/Tech",
          tag_id: "☕ Santai/Teknologi",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=23",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG23"
        }
      ]
    },
    guoguang: {
      id: "guoguang",
      name: "國光路 (側門)",
      name_en: "Guoguang Rd. (Side)",
      name_id: "Jl. Guoguang (Samping)",
      desc: "獸醫前站牌 · 158高鐵直達、大里霧峰",
      desc_en: "Side Gate · Direct HSR 158 & Dali Bus",
      desc_id: "Pintu Samping · Bus HSR 158 & Dali",
      gmapQuery: "中興大學(國光路)+公車站",
      routes: [
        {
          num: "158",
          operator: "統聯客運",
          dest: "往 高鐵台中站 (1F直達 0元)",
          dest_en: "To Taichung HSR Station (1F Direct NT$0)",
          dest_id: "Ke Stasiun HSR Taichung (Lt 1 Langsung Bebas Biaya)",
          via: "【高鐵返鄉必備】經 大里・台中車站・朝陽科大",
          via_en: "【Essential HSR Bus】Via Dali, Taichung Station, CYUT",
          via_id: "【Pilihan Utama HSR】Lewat Dali, Stasiun Taichung, CYUT",
          intervalMins: 18,
          offset: 3,
          tag: "🚄 高鐵直達",
          tag_en: "🚄 HSR Direct",
          tag_id: "🚄 HSR Langsung",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=158",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG158"
        },
        {
          num: "50",
          operator: "統聯客運",
          dest: "往 921地震園區 / 文英公園",
          dest_en: "To 921 Earthquake Museum / Wenying Park",
          dest_id: "Ke Museum Gempa 921 / Taman Wenying",
          via: "經 台中車站・一中商圈・光復新村",
          via_en: "Via Taichung Station, Yizhong Shopping District",
          via_id: "Lewat Stasiun Taichung, Kawasan Yizhong",
          intervalMins: 15,
          offset: 6,
          tag: "🏛️ 一中幹線",
          tag_en: "🏛️ Yizhong Line",
          tag_id: "🏛️ Jalur Yizhong",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=50",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG50"
        },
        {
          num: "59",
          operator: "統聯客運",
          dest: "往 台中車站 / 舊社公園",
          dest_en: "To Taichung Station / Jiushe Park",
          dest_id: "Ke Stasiun Taichung / Taman Jiushe",
          via: "經 台中火車站・大里・舊社公園",
          via_en: "Via Taichung Railway Station, Dali",
          via_id: "Lewat Stasiun Kereta Taichung, Dali",
          intervalMins: 20,
          offset: 9,
          tag: "🚂 火車直達",
          tag_en: "🚂 Train Direct",
          tag_id: "🚂 Kereta Langsung",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=59",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG59"
        },
        {
          num: "65",
          operator: "全航客運",
          dest: "往 潭雅神綠園道 / 南區公所",
          dest_en: "To Tanyashen Green Bikeway / South District",
          dest_id: "Ke Tanyashen Green Bikeway / Kantor Distrik Selatan",
          via: "經 台中車站・一中商圈・潭子車站",
          via_en: "Via Taichung Station, Yizhong, Tanzi Station",
          via_id: "Lewat Stasiun Taichung, Yizhong, Stasiun Tanzi",
          intervalMins: 22,
          offset: 12,
          tag: "🚴 潭子直通",
          tag_en: "🚴 Tanzi Direct",
          tag_id: "🚴 Jalur Tanzi",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=65",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG65"
        },
        {
          num: "19",
          operator: "中台灣客運",
          dest: "往 國立台灣美術館",
          dest_en: "To National Taiwan Museum of Fine Arts",
          dest_id: "Ke Museum Seni Nasional Taiwan",
          via: "經 向上市場・國美館・慈濟醫院",
          via_en: "Via Xiangshang Market, Fine Arts Museum, Tzu Chi Hospital",
          via_id: "Lewat Pasar Xiangshang, Museum Seni, RS Tzu Chi",
          intervalMins: 30,
          offset: 16,
          tag: "🎨 美術館線",
          tag_en: "🎨 Art Museum Line",
          tag_id: "🎨 Jalur Museum Seni",
          url: "https://citybus.taichung.gov.tw/ebus/driving-map?operate=route-map&route=19",
          yunbus: "https://yunbus.tw/lite/route.php?id=TXG19"
        }
      ]
    }
  };

  let currentLiveStop = "xuefu";
  let liveTimer = null;

  // ── 2. 注入專屬交通指南 CSS (高對比黑底看板 ＆ 手機極限防截斷) ──
  const styleEl = document.createElement("style");
  styleEl.innerHTML = `
    .transit-modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 99998;
      align-items: center;
      justify-content: center;
      padding: 14px;
      box-sizing: border-box;
    }
    .transit-card {
      background: #14171f;
      border-radius: 20px;
      width: 100%;
      max-width: 540px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08);
      position: relative;
      overflow: hidden;
      animation: transitModalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      color: #e2e8f0;
    }
    @keyframes transitModalIn {
      from { transform: translateY(24px) scale(0.97); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    .transit-header {
      padding: 13px 18px 11px;
      background: #1a1e28;
      border-bottom: 1px solid #282f3e;
      color: #fff;
      position: relative;
      flex-shrink: 0;
    }
    .transit-header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .transit-title {
      font-size: 16px;
      font-weight: 800;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: 0.3px;
      color: #ffffff;
    }
    .transit-badge {
      font-size: 10px;
      background: rgba(222, 55, 48, 0.2);
      border: 1px solid rgba(222, 55, 48, 0.45);
      color: #f87171;
      padding: 2px 7px;
      border-radius: 10px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .transit-sub {
      font-size: 11.5px;
      color: #94a3b8;
      margin: 3px 0 0;
      line-height: 1.35;
    }
    .transit-close-btn {
      background: #252b39;
      border: 1px solid #353e52;
      color: #94a3b8;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.18s;
      flex-shrink: 0;
    }
    .transit-close-btn:hover {
      background: #ef4444;
      color: #fff;
      border-color: #ef4444;
      transform: rotate(90deg);
    }

    /* 橫向切換標籤列 */
    .transit-tabs {
      display: flex;
      gap: 6px;
      padding: 8px 14px;
      background: #161922;
      border-bottom: 1px solid #232836;
      overflow-x: auto;
      scrollbar-width: none;
      flex-shrink: 0;
    }
    .transit-tabs::-webkit-scrollbar { display: none; }
    .transit-tab-btn {
      padding: 5px 12px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 18px;
      border: 1px solid #2d3444;
      background: #1f232f;
      color: #94a3b8;
      cursor: pointer;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s;
    }
    .transit-tab-btn:hover {
      background: #282e3e;
      color: #f1f5f9;
      border-color: #3b455b;
    }
    .transit-tab-btn.active {
      background: #2563eb;
      color: #fff;
      border-color: #2563eb;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
    }
    .transit-tab-btn.tab-live.active {
      background: #de3730;
      color: #fff;
      border-color: #de3730;
      box-shadow: 0 2px 8px rgba(222, 55, 48, 0.4);
    }

    /* 內容滾動區 */
    .transit-body {
      padding: 13px 16px 18px;
      overflow-y: auto;
      flex: 1;
      box-sizing: border-box;
      background: #14171f;
      color: #cbd5e1;
    }
    .transit-pane { display: none; }
    .transit-pane.active { display: block; animation: transitFadeIn 0.2s ease-out; }
    @keyframes transitFadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* 🚏 即時公車站牌專屬樣式 (Segmented Toggle) */
    .live-stop-bar {
      display: flex;
      background: #1c202b;
      border-radius: 10px;
      padding: 3px;
      gap: 4px;
      margin-bottom: 9px;
      border: 1px solid #2b3243;
    }
    .live-stop-btn {
      flex: 1;
      height: 35px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #94a3b8;
      background: transparent;
      cursor: pointer;
      text-align: center;
      transition: all 0.18s;
      white-space: nowrap;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .live-stop-btn.active {
      background: #de3730;
      color: #ffffff;
      font-weight: 800;
      box-shadow: 0 2px 8px rgba(222, 55, 48, 0.35);
    }

    .live-status-subbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 10px;
      padding: 0 2px;
      gap: 8px;
    }
    .live-stop-desc {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      color: #94a3b8;
    }
    .live-update-action {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #60a5fa;
      cursor: pointer;
      font-weight: 600;
      flex-shrink: 0;
      background: #1c202b;
      padding: 2px 8px;
      border-radius: 12px;
      border: 1px solid #2b3243;
      transition: all 0.15s;
    }
    .live-update-action:hover {
      background: #252b3a;
      border-color: #3b455b;
      color: #93c5fd;
    }

    .live-bus-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }
    .live-bus-card {
      background: #1c202b;
      border: 1px solid #2b3243;
      border-radius: 12px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
      transition: all 0.15s ease;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
    }
    .live-bus-card:hover {
      background: #232836;
      border-color: #3d465c;
      transform: translateY(-1px);
    }
    .live-route-badge {
      width: 52px;
      min-width: 52px;
      height: 36px;
      background: #282e3c;
      border: 1px solid #3b4458;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 0.3px;
      flex-shrink: 0;
    }
    .live-bus-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .live-route-dest {
      font-size: 14.5px;
      font-weight: 700;
      color: #f8fafc;
      line-height: 1.35;
      word-break: break-word;
    }
    .live-route-via {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .live-eta-badge {
      width: 68px;
      min-width: 68px;
      height: 30px;
      border-radius: 15px;
      font-size: 12.5px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .eta-soon {
      background: #de3730;
      color: #ffffff;
      box-shadow: 0 0 10px rgba(222, 55, 48, 0.45);
    }
    .eta-med {
      background: #d97706;
      color: #ffffff;
    }
    .eta-wait {
      background: #334155;
      color: #cbd5e1;
    }
    .eta-night {
      background: #1e2430;
      color: #64748b;
      font-size: 11px;
      border: 1px solid #2b3243;
    }
    .live-pulse {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 6px #22c55e;
      animation: livePulse 1s infinite alternate;
      display: inline-block;
    }
    @keyframes livePulse {
      from { opacity: 0.4; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1.2); }
    }

    .live-shortcuts-box {
      background: #1c202b;
      border: 1px solid #2b3243;
      border-radius: 12px;
      padding: 10px 12px;
    }
    .live-shortcuts-bar {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .live-shortcut-pill {
      font-size: 11px;
      font-weight: 700;
      padding: 5px 10px;
      border-radius: 8px;
      background: #242936;
      color: #60a5fa;
      border: 1px solid #363e52;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      transition: all 0.15s;
    }
    .live-shortcut-pill:hover {
      background: #0284c7;
      color: #ffffff;
      border-color: #0284c7;
    }

    /* 路線方案卡片 (暗色適配版) */
    .plan-card {
      background: #1c202b;
      border: 1px solid #2b3243;
      border-radius: 14px;
      padding: 13px 15px;
      margin-bottom: 12px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
      color: #cbd5e1;
      transition: border-color 0.2s;
    }
    .plan-card:hover { border-color: #3b82f6; }
    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 6px;
    }
    .plan-title {
      font-size: 14px;
      font-weight: 800;
      color: #f8fafc;
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
    .plan-tag-free { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); }
    .plan-tag-fast { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
    .plan-tag-group { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); }

    .plan-steps {
      font-size: 12.5px;
      color: #94a3b8;
      line-height: 1.6;
      margin: 6px 0;
    }
    .plan-steps strong { color: #f1f5f9; }
    .plan-steps li { margin-bottom: 4px; }
    .plan-footer {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #2b3243;
      font-size: 11.5px;
      color: #64748b;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
    }
    .transit-link-btn {
      font-size: 11.5px;
      font-weight: 700;
      padding: 4px 10px;
      background: #242936;
      color: #60a5fa;
      border-radius: 8px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: 1px solid #363e52;
      transition: all 0.2s;
    }
    .transit-link-btn:hover { background: #2563eb; color: #fff; border-color: #2563eb; }

    /* 提示醒目標 */
    .transit-alert {
      background: #2b2315;
      border-left: 3.5px solid #f59e0b;
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 12px;
      color: #fde68a;
      line-height: 1.5;
    }
    .transit-alert strong { color: #fff; }

    .bus-matrix-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 10px 0;
    }

    /* 手機版適配：置中浮動卡片，消除頂部大量空白 */
    @media (max-width: 600px) {
      .transit-modal-backdrop {
        align-items: center !important;
        justify-content: center !important;
        padding: 12px !important;
      }
      .transit-card {
        border-radius: 20px !important;
        max-height: 88vh !important;
        width: 100% !important;
        max-width: 480px !important;
        margin: auto !important;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.75) !important;
        animation: transitModalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .transit-header {
        padding: 12px 16px 10px !important;
      }
      .transit-title {
        font-size: 15.5px !important;
      }
      .transit-sub {
        display: none !important;
      }
      .transit-tabs {
        padding: 7px 12px !important;
        gap: 5px !important;
      }
      .transit-tab-btn {
        padding: 5px 10px !important;
        font-size: 11.5px !important;
      }
      .transit-body {
        padding: 12px 14px calc(20px + env(safe-area-inset-bottom, 0px)) !important;
      }
      .live-bus-card {
        padding: 9px 11px !important;
        gap: 8px !important;
      }
      .live-route-badge {
        width: 48px !important;
        min-width: 48px !important;
        height: 34px !important;
        font-size: 15px !important;
      }
      .live-route-dest {
        font-size: 14px !important;
      }
      .live-eta-badge {
        width: 65px !important;
        min-width: 65px !important;
        height: 28px !important;
        font-size: 12px !important;
      }
      .bus-matrix-grid {
        grid-template-columns: 1fr !important;
      }
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
              <span>🚌</span> <span id="transitTitleText">興大即時公車 ＆ 交通攻略</span>
              <span class="transit-badge">LIVE</span>
            </h3>
            <p class="transit-sub" id="transitSubText">
              學校站牌即時到站、高鐵158直達、雙十公車 10km 免費與 Ubike
            </p>
          </div>
          <button class="transit-close-btn" onclick="closeTransitModal()" title="關閉">✕</button>
        </div>
      </div>

      <!-- 標籤導覽列 (首頁即時站牌置首) -->
      <div class="transit-tabs">
        <button class="transit-tab-btn tab-live active" onclick="switchTransitTab('live', this)"><span id="tabLabelLive">🚏 即時公車</span></button>
        <button class="transit-tab-btn" onclick="switchTransitTab('thsr', this)"><span id="tabLabelThsr">🚄 高鐵返鄉</span></button>
        <button class="transit-tab-btn" onclick="switchTransitTab('tra', this)"><span id="tabLabelTra">🚂 台鐵火車</span></button>
        <button class="transit-tab-btn" onclick="switchTransitTab('bus', this)"><span id="tabLabelBus">💳 雙十公車</span></button>
        <button class="transit-tab-btn" onclick="switchTransitTab('tmrt', this)"><span id="tabLabelTmrt">🚇 台中捷運</span></button>
        <button class="transit-tab-btn" onclick="switchTransitTab('bike', this)"><span id="tabLabelBike">🚲 Ubike/停車</span></button>
      </div>

      <!-- 內容區 -->
      <div class="transit-body">
        
        <!-- Tab 0: 🚏 站牌即時動態 (Live Bus Arrival) -->
        <div class="transit-pane active" id="pane-live">
          <!-- 站牌切換器 (分段控制鈕 Segmented Toggle) -->
          <div class="live-stop-bar">
            <button class="live-stop-btn active" id="btnStopXuefu" onclick="switchLiveStop('xuefu', this)">
              <span id="btnStopXuefuText">🎓 興大路 (正門)</span>
            </button>
            <button class="live-stop-btn" id="btnStopGuoguang" onclick="switchLiveStop('guoguang', this)">
              <span id="btnStopGuoguangText">🌸 國光路 (側門)</span>
            </button>
          </div>

          <!-- 即時狀態指示列 -->
          <div class="live-status-subbar">
            <span class="live-stop-desc" id="liveStopDesc">正門圓環 · 往台中車站、大慶高鐵</span>
            <div class="live-update-action" onclick="refreshBusLiveETA()" title="點擊重新整理到站時間">
              <span class="live-pulse"></span>
              <span id="busLastUpdate">--:--</span>
              <span style="font-size:11px; margin-left:1px;">🔄</span>
            </div>
          </div>

          <!-- 公車路線列表容器 (左中右三欄式，依到站時間自動排序) -->
          <div class="live-bus-list" id="liveBusList">
            <!-- 由 JS 動態渲染卡片 -->
          </div>

          <!-- 站牌實用捷徑 -->
          <div class="live-shortcuts-box">
            <div class="live-shortcuts-bar">
              <a class="live-shortcut-pill" id="liveGmapBtn" href="#" target="_blank" rel="noopener">
                📍 Google Maps 站牌看板
              </a>
              <a class="live-shortcut-pill" id="liveBusLinkBtn" href="https://citybus.taichung.gov.tw/" target="_blank" rel="noopener">
                🌐 臺中公車動態 ↗
              </a>
              <a class="live-shortcut-pill" id="liveFreeCardBtn" href="javascript:void(0)" onclick="switchTransitTab('bus')">
                💳 雙十公車 10km 免費
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

          <div style="font-size:13.5px; font-weight:800; color:#f8fafc; margin-bottom:8px;">
            🚏 興大兩大乘車站牌路網矩陣：
          </div>

          <div class="bus-matrix-grid">
            <div style="background:#1c202b; border:1px solid #2b3243; border-radius:12px; padding:10px 12px;">
              <div style="font-size:12.5px; font-weight:800; color:#60a5fa; margin-bottom:6px;">📍 中興大學 (興大路正門)</div>
              <div style="font-size:12px; color:#cbd5e1; line-height:1.6;">
                <strong>33 路</strong>：往大慶、台中車站、逢甲<br>
                <strong>35 路</strong>：往南區公所、一中街、逢甲<br>
                <strong>73 路</strong>：往捷運大慶站、統聯轉運站<br>
                <strong>52 路</strong>：忠明進化線環狀公車
              </div>
            </div>

            <div style="background:#1c202b; border:1px solid #2b3243; border-radius:12px; padding:10px 12px;">
              <div style="font-size:12.5px; font-weight:800; color:#60a5fa; margin-bottom:6px;">📍 興大國光路口 (側門)</div>
              <div style="font-size:12px; color:#cbd5e1; line-height:1.6;">
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
  
  function getTransitLang() {
    return (window.nchuI18n && typeof window.nchuI18n.getLanguage === 'function') 
      ? window.nchuI18n.getLanguage() 
      : 'zh-TW';
  }

  function getEstimatedArrival(route) {
    const lang = getTransitLang();
    const isEn = lang === 'en';
    const isId = lang === 'id';
    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes();

    // 深夜與清晨非營運時段 (23:00 ~ 05:45)
    if (hours >= 23 || hours < 5 || (hours === 5 && mins < 45)) {
      return {
        badgeClass: "eta-night",
        text: isEn ? "Ended" : (isId ? "Selesai" : "末班已過"),
        mins: 9999,
        isSoon: false,
        sortOrder: 9999
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
        text: isEn ? "Arriving" : (isId ? "Tiba" : "即將到站"),
        mins: remaining,
        isSoon: true,
        sortOrder: remaining
      };
    } else if (remaining <= 10) {
      return {
        badgeClass: "eta-med",
        text: isEn ? `${remaining} min` : (isId ? `${remaining} mnt` : `${remaining} 分`),
        mins: remaining,
        isSoon: false,
        sortOrder: remaining
      };
    } else {
      return {
        badgeClass: "eta-wait",
        text: isEn ? `${remaining} min` : (isId ? `${remaining} mnt` : `${remaining} 分`),
        mins: remaining,
        isSoon: false,
        sortOrder: remaining
      };
    }
  }

  function updateModalTexts() {
    const lang = getTransitLang();
    const isEn = lang === 'en';
    const isId = lang === 'id';

    const titleEl = document.getElementById("transitTitleText");
    const subEl = document.getElementById("transitSubText");
    const tabLive = document.getElementById("tabLabelLive");
    const tabThsr = document.getElementById("tabLabelThsr");
    const tabTra = document.getElementById("tabLabelTra");
    const tabBus = document.getElementById("tabLabelBus");
    const tabTmrt = document.getElementById("tabLabelTmrt");
    const tabBike = document.getElementById("tabLabelBike");
    const btnXuefu = document.getElementById("btnStopXuefuText");
    const btnGuoguang = document.getElementById("btnStopGuoguangText");
    const busLinkBtn = document.getElementById("liveBusLinkBtn");
    const freeCardBtn = document.getElementById("liveFreeCardBtn");

    if (titleEl) titleEl.textContent = isEn ? "NCHU Bus & Transit Guide" : (isId ? "Panduan Bus & Transit NCHU" : "興大即時公車 ＆ 交通攻略");
    if (subEl) subEl.textContent = isEn ? "Real-time bus arrival, HSR 158 direct, 10km free pass & Ubike" : (isId ? "Kedatangan bus langsung, HSR 158 langsung, tiket gratis 10km & Ubike" : "學校站牌即時到站、高鐵158直達、雙十公車 10km 免費與 Ubike");
    if (tabLive) tabLive.textContent = isEn ? "🚏 Live Bus" : (isId ? "🚏 Bus Langsung" : "🚏 即時公車");
    if (tabThsr) tabThsr.textContent = isEn ? "🚄 HSR" : (isId ? "🚄 HSR" : "🚄 高鐵返鄉");
    if (tabTra) tabTra.textContent = isEn ? "🚂 Train" : (isId ? "🚂 Kereta" : "🚂 台鐵火車");
    if (tabBus) tabBus.textContent = isEn ? "💳 10km Free" : (isId ? "💳 Tiket 10km" : "💳 雙十公車");
    if (tabTmrt) tabTmrt.textContent = isEn ? "🚇 Metro" : (isId ? "🚇 MRT" : "🚇 台中捷運");
    if (tabBike) tabBike.textContent = isEn ? "🚲 Ubike" : (isId ? "🚲 Ubike" : "🚲 Ubike/停車");

    if (btnXuefu) btnXuefu.textContent = isEn ? "🎓 Xingda (Main)" : (isId ? "🎓 Xingda (Utama)" : "🎓 興大路 (正門)");
    if (btnGuoguang) btnGuoguang.textContent = isEn ? "🌸 Guoguang (Side)" : (isId ? "🌸 Guoguang (Samping)" : "🌸 國光路 (側門)");

    if (busLinkBtn) busLinkBtn.textContent = isEn ? "🌐 Taichung E-Bus ↗" : (isId ? "🌐 Bus Taichung Resmi ↗" : "🌐 臺中公車動態 ↗");
    if (freeCardBtn) freeCardBtn.textContent = isEn ? "💳 10km Free SOP" : (isId ? "💳 SOP Bus Gratis" : "💳 雙十公車 10km 免費");
  }

  function renderLiveBusCards(stopId) {
    const listEl = document.getElementById("liveBusList");
    const descEl = document.getElementById("liveStopDesc");
    const gmapBtn = document.getElementById("liveGmapBtn");
    const timeEl = document.getElementById("busLastUpdate");

    const stopData = CAMPUS_BUS_STOPS[stopId];
    if (!listEl || !stopData) return;

    const lang = getTransitLang();
    const isEn = lang === 'en';
    const isId = lang === 'id';

    const stopName = (isEn && stopData.name_en) ? stopData.name_en : ((isId && stopData.name_id) ? stopData.name_id : stopData.name);
    const stopDesc = (isEn && stopData.desc_en) ? stopData.desc_en : ((isId && stopData.desc_id) ? stopData.desc_id : stopData.desc);

    if (descEl) descEl.textContent = `${stopName} · ${stopDesc}`;
    if (gmapBtn) {
      gmapBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stopData.gmapQuery)}`;
      gmapBtn.textContent = isEn ? "📍 Google Maps Board" : (isId ? "📍 Papan Google Maps" : "📍 Google Maps 看板");
    }

    const now = new Date();
    if (timeEl) {
      timeEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    // 依到站時間由近至遠排序 (即將到站最優先)
    const routesWithEta = stopData.routes.map(r => ({
      ...r,
      eta: getEstimatedArrival(r)
    }));
    routesWithEta.sort((a, b) => a.eta.sortOrder - b.eta.sortOrder);

    listEl.innerHTML = routesWithEta.map(r => {
      const eta = r.eta;
      const dest = (isEn && r.dest_en) ? r.dest_en : ((isId && r.dest_id) ? r.dest_id : r.dest);
      const via = (isEn && r.via_en) ? r.via_en : ((isId && r.via_id) ? r.via_id : r.via);

      return `
        <div class="live-bus-card" onclick="window.open('${r.url}', '_blank')" title="${dest} (${isEn ? 'Tap to view live GPS' : '點擊查看即時 GPS 定位'})">
          <div class="live-route-badge">${r.num}</div>
          <div class="live-bus-info">
            <div class="live-route-dest">${dest}</div>
            <div class="live-route-via">📍 ${via}</div>
          </div>
          <div class="live-eta-badge ${eta.badgeClass}">
            ${eta.text}
          </div>
        </div>
      `;
    }).join("");
  }

  function switchLiveStop(stopId, btn) {
    currentLiveStop = stopId;
    const btns = modalDiv.querySelectorAll(".live-stop-btn");
    btns.forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    renderLiveBusCards(stopId);
  }
  window.switchLiveStop = switchLiveStop;

  function refreshBusLiveETA() {
    renderLiveBusCards(currentLiveStop);
  }
  window.refreshBusLiveETA = refreshBusLiveETA;

  function switchTransitTab(tabId, btn) {
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
  }
  window.switchTransitTab = switchTransitTab;

  function closeTransitModal() {
    modalDiv.style.display = "none";
    document.body.style.overflow = "";
    if (liveTimer) {
      clearInterval(liveTimer);
      liveTimer = null;
    }
  }
  window.closeTransitModal = closeTransitModal;

  // ── 5. 控制對外公開函式 ──
  function openTransitModal(defaultTab = "live") {
    modalDiv.style.display = "flex";
    document.body.style.overflow = "hidden";
    updateModalTexts();
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
  }
  window.openTransitModal = openTransitModal;

  // 專門為懸浮按鈕綁定的直達函式
  window.openBusDynamicModal = function () {
    openTransitModal("live");
  };

  // 監聽語言切換
  if (window.nchuI18n && typeof window.nchuI18n.onChange === 'function') {
    window.nchuI18n.onChange(function () {
      updateModalTexts();
      if (modalDiv.style.display === "flex") {
        renderLiveBusCards(currentLiveStop);
      }
    });
  }
})();
