/**
 * 🛡️ 國立中興大學 興大平安通行・宗教信仰・多元飲食指南
 * (NCHU Safe Transit, Places of Faith & Dietary Diversity Guide)
 * 核心特色：
 *   1. 🛡️ 平安通行：交通部/交警大隊興大周邊 4 大易肇事路口防禦駕駛警示 ＆ 24H 超商明亮夜行推薦動線
 *   2. 🚨 安全守護：學安室 24H 緊急救援、僑港澳生生活輔導窗口、國際處 (OIA) 外籍生專責電話一鍵直撥
 *   3. 🕊️ 心靈寄託：校內祈禱室、台中清真寺、天主教主教座堂 (印尼語/英語彌撒)、長老教會、雙語團契、文昌帝君與月老祈福
 *   4. 🥗 多元飲食：東協廣場 (ASEAN Square) Halal 清真印尼料理與東南亞超市攻略、一鍵連動興大美食地圖蔬食與清真友善篩選
 * 100% 純前端極速交互，0 Token 成本，全自適應手機螢幕防爆框，支援 zh-TW / en / id 多語系切換。
 */

(function () {

  function getGuideLang() {
    return (window.nchuI18n && typeof window.nchuI18n.getLanguage === 'function')
      ? window.nchuI18n.getLanguage()
      : 'zh-TW';
  }

  // ── 1. 易肇事路口防禦駕駛警示資料庫 ──
  const ACCIDENT_SPOTS = [
    {
      id: "spot_guoguang_xingda",
      level: "high",
      levelBadge: "🔴 易肇事高風險重點路口",
      levelBadge_en: "🔴 High-Risk Accident Intersection",
      levelBadge_id: "🔴 Titik Rawan Lalin Risiko Tinggi",
      name: "國光路 × 興大路口（正門 / 獸醫側門）",
      name_en: "Guoguang Rd. × Xingda Rd. (Main Gate / Vet Gate)",
      name_id: "Jl. Guoguang × Jl. Xingda (Gerbang Utama)",
      hazard: "國光路雙向車速極快、左轉進出校門視覺死角大、公車與重型大貨車匯流交織頻繁。",
      hazard_en: "High vehicle speeds on Guoguang Rd., large blind spots during left turns, heavy mix of city buses and freight trucks.",
      hazard_id: "Kecepatan kendaraan sangat tinggi, blind spot saat belok kiri, bus kota dan truk bermuatan sering melintas.",
      tip: "切勿搶黃燈搶快！機車進出校門左轉務必確實停等對向直行車流，確認無來車再通過；夜間出校門注意兩側高速直行車輛。",
      tip_en: "Never run amber lights! Always yield to oncoming straight traffic when turning left. Be vigilant of speeding vehicles at night.",
      tip_id: "Jangan menerobos lampu kuning! Berhenti dan pastikan tidak ada kendaraan lurus sebelum belok. Hati-hati saat malam hari.",
      query: "國光路與興大路交叉路口 台中市"
    },
    {
      id: "spot_xuefu_fuxing",
      level: "high",
      levelBadge: "🔴 地下道引道交織高風險",
      levelBadge_en: "🔴 High-Risk Underpass Merge Zone",
      levelBadge_id: "🔴 Risiko Tinggi Simpang Underpass",
      name: "學府路 × 復興路三段口（復興地下道旁）",
      name_en: "Xuefu Rd. × Fuxing Rd. Sec. 3 (Near Underpass)",
      name_id: "Jl. Xuefu × Jl. Fuxing Bagian 3 (Dekat Underpass)",
      hazard: "復興路地下道引道出入口，汽機車車流速度落差大，早晚尖峰時段機車爭道、變換車道事故頻傳。",
      hazard_en: "Entrance/exit ramps of Fuxing Underpass feature big speed differentials, motorcycle lane conflicts, and sudden lane changes during rush hours.",
      hazard_id: "Tanjakan underpass sering terjadi perbedaan kecepatan tinggi antar kendaraan, antrian padat dan salip jalur mendadak saat jam sibuk.",
      tip: "下引道前務必提早減速並保持 3 車身以上安全距離，嚴禁在地下道出口坡道處強行超車搶道。",
      tip_en: "Slow down well before ramp entrance. Maintain safe following distance. Absolutely no overtaking on the slope.",
      tip_id: "Kurangi kecepatan sebelum tanjakan. Jaga jarak aman minimal 3 kendaraan. Dilarang mendahului di tanjakan underpass.",
      query: "復興路三段與學府路口 台中市"
    },
    {
      id: "spot_zhongxiao_guoguang",
      level: "caution",
      levelBadge: "🟠 夜市商圈車流人潮密集",
      levelBadge_en: "🟠 Night Market Traffic & Pedestrian Zone",
      levelBadge_id: "🟠 Kawasan Padat Pasar Malam & Pejalan Kaki",
      name: "忠孝路 × 國光路口（忠孝夜市交界）",
      name_en: "Zhongxiao Rd. × Guoguang Rd. (Night Market)",
      name_id: "Jl. Zhongxiao × Jl. Guoguang (Pasar Malam)",
      hazard: "夜市傍晚至深夜人車極為密集，外送機車頻繁穿梭穿插、臨停汽機車眾多，容易發生擦撞。",
      hazard_en: "Dense evening night market crowds, frequent food delivery scooters darting across lanes, and curbside stopping vehicles.",
      hazard_id: "Sangat padat pengunjung sore-malam, banyak kurir makanan melintas cepat dan mobil berhenti di pinggir jalan.",
      tip: "嚴防「開車門鬼探頭」事故！行經路側臨停車輛時保留 1 公尺以上橫向間距，路口務必減速備煞。",
      tip_en: "Beware of sudden door openings! Keep at least 1 meter buffer from parked cars. Hover over brakes at crossings.",
      tip_id: "Waspada pintu mobil terbuka mendadak! Beri jarak minimal 1 meter dari mobil parkir. Siapkan rem saat melewati simpang.",
      query: "忠孝路與國光路交叉路口 台中市"
    },
    {
      id: "spot_wuquan_meicun",
      level: "caution",
      levelBadge: "🟠 多時相複雜大型路口",
      levelBadge_en: "🟠 Multi-Phase Complex Intersection",
      levelBadge_id: "🟠 Simpang Besar Berlapis Fase Lampu",
      name: "五權南路 × 美村南路 / 高工路口",
      name_en: "Wuquan S. Rd. × Meicun S. Rd. / Gaogong Rd.",
      name_id: "Jl. Wuquan S. × Jl. Meicun S. / Jl. Gaogong",
      hazard: "南區主幹道多路匯聚交會，車道寬敞且號誌時相繁複，搶快轉彎極易與對向快車道相撞。",
      hazard_en: "Wide multi-way arterial junction with multi-phase traffic signals. Rushing left turns across oncoming lanes causes severe crashes.",
      hazard_id: "Jalan protokol lebar dengan fase lampu banyak arah. Terburu-buru belok sering bertabrakan dengan kendaraan cepat dari lawan arah.",
      tip: "機車族務必落實「兩段式左轉」！嚴禁隨意違規「大外割」逕行左轉，嚴格遵照專用號誌燈行進。",
      tip_en: "Scooters must strictly use the two-stage left turn box! Obey turn arrows and never cut across directly.",
      tip_id: "Pengendara motor wajib belok dua tahap (two-stage turn)! Ikuti lampu panah dan jangan langsung memotong jalur cepat.",
      query: "五權南路與美村南路口 台中市"
    }
  ];

  // ── 2. 宗教信仰場所與心靈寄託資料庫 ──
  const FAITH_PLACES = [
    {
      id: "faith_prayer_room",
      cat: "islam",
      catLabel: "🕌 校內穆斯林與多信仰靜思",
      catLabel_en: "🕌 NCHU Multi-Faith Prayer Room",
      catLabel_id: "🕌 Ruang Doa & Ibadah Multi-Agama Kampus",
      name: "興大校內宗教祈禱室 (NCHU Prayer Room)",
      name_en: "NCHU Multi-Faith Prayer Room",
      name_id: "Ruang Ibadah & Doa Kampus NCHU",
      langBadges: ["🇹🇼 華語", "🌐 English", "🇮🇩 Bahasa"],
      transit: "校內徒步 2 分鐘（行政大樓 3F 國際處旁 / 圖書館友善沉思專區）",
      transit_en: "2-min walk on campus (Next to OIA 3F / Library quiet zone)",
      transit_id: "Jalan kaki 2 menit (Sebelah OIA Lt. 3 / Ruang Tenang Perpustakaan)",
      address: "臺中市南區興大路145號（行政大樓 3F）",
      desc: "專為校內穆斯林外籍生、交換生及全校師生打造之寧靜冥想與每日禮拜空間，備有淨身動線指引與地毯，尊重各國信仰文化。",
      desc_en: "Dedicated quiet reflection & prayer space for international Muslim students and staff, equipped with ablution facility guidance and prayer mats.",
      desc_id: "Ruangan tenang untuk salat harian dan meditasi bagi mahasiswa internasional dan staf Muslim, dilengkapi petunjuk wudhu dan sajadah.",
      query: "國立中興大學行政大樓"
    },
    {
      id: "faith_mosque",
      cat: "islam",
      catLabel: "🕌 伊斯蘭教清真寺 (Masjid)",
      catLabel_en: "🕌 Islamic Mosque (Masjid)",
      catLabel_id: "🕌 Masjid Agung & Pusat Komunitas Muslim",
      name: "台中清真寺 (Taichung Mosque)",
      name_en: "Taichung Mosque (Masjid Taichung)",
      name_id: "Masjid Taichung (Pusat Shalat Jum'at)",
      langBadges: ["🇮🇩 Bahasa Indonesia", "🌐 English/Arabic", "🇹🇼 華語"],
      transit: "興大正門搭 23 或 73 號公車至「大墩南路口 / 南屯路」約 18 分鐘",
      transit_en: "Bus 23 or 73 from NCHU Main Gate (approx. 18 mins)",
      transit_id: "Naik Bus 23 atau 73 dari Gerbang Utama NCHU (sekitar 18 mnt)",
      address: "臺中市南屯區大墩南路160號",
      phone: "04-24732519",
      desc: "中台灣歷史最悠久之大型清真寺，每週五固定舉行主麻日聚禮 (Shalat Jum'ah)，附設清真認證諮詢處、穆斯林青年交流與宗教文化中心。",
      desc_en: "The historic central mosque in Central Taiwan. Hosts Friday Jum'ah prayers, Halal certification inquiry desk, and Muslim student community activities.",
      desc_id: "Masjid bersejarah terbesar di Taiwan Tengah. Melaksanakan Shalat Jum'at berjamaah, konsultasi sertifikasi Halal, dan komunitas mahasiswa Muslim.",
      query: "台中清真寺 台中市南屯區大墩南路160號"
    },
    {
      id: "faith_cathedral",
      cat: "catholic",
      catLabel: "⛪ 天主教主教座堂",
      catLabel_en: "⛪ Catholic Cathedral",
      catLabel_id: "⛪ Katedral Katolik (Misa Bahasa Indonesia)",
      name: "耶穌救主總堂 (Sacred Heart Cathedral)",
      name_en: "Sacred Heart of Jesus Cathedral",
      name_id: "Katedral Hati Kudus Yesus (Gereja Sanmin)",
      langBadges: ["🇮🇩 印尼語彌撒", "🌐 英語彌撒", "🇹🇼 華語彌撒"],
      transit: "興大正門搭 35 / 52 / 73 號公車至第二市場 / 火車站約 12 分鐘",
      transit_en: "Bus 35, 52 or 73 to Second Market / Train Station (approx. 12 mins)",
      transit_id: "Naik Bus 35, 52 atau 73 ke Pasar Kedua / Stasiun Kereta (12 mnt)",
      address: "臺中市中區三民路二段100號",
      phone: "04-22223843",
      desc: "具有百年歷史之天主教台中教區核心總堂，每週日特別開設印尼語彌撒 (Misa Bahasa Indonesia) 與英語彌撒，神父修女熱情關懷異鄉遊子。",
      desc_en: "Historic Catholic diocesan mother church offering weekly Sunday Mass in Bahasa Indonesia and English. Very supportive community for overseas students.",
      desc_id: "Gereja Katedral Katolik bersejarah di Taichung. Menyediakan Misa rutin hari Minggu dalam Bahasa Indonesia dan Bahasa Inggris untuk perantau & mahasiswa.",
      query: "天主教台中教區主教座堂 耶穌救主總堂"
    },
    {
      id: "faith_presbyterian",
      cat: "christian",
      catLabel: "✝️ 基督長老教會青年團契",
      catLabel_en: "✝️ Presbyterian Youth Fellowship",
      catLabel_id: "✝️ Persekutuan Mahasiswa Kristen Presbiterian",
      name: "長老教會 — 南門教會 / 忠孝路教會",
      name_en: "Presbyterian Church (Nanmen / Zhongxiao)",
      name_id: "Gereja Presbiterian Nanmen & Zhongxiao",
      langBadges: ["🇹🇼 華語 / 台語", "🌐 English"],
      transit: "南門教會女宿步行 5 分鐘（南門路 113 號）；忠孝路教會搭公車 7 分鐘",
      transit_en: "Nanmen Church: 5-min walk from Female Dorm; Zhongxiao: 7-min bus",
      transit_id: "Gereja Nanmen: jalan kaki 5 mnt dari Asrama Putri; Zhongxiao: 7 mnt bus",
      address: "臺中市南區南門路113號 / 臺中市東區忠孝路288號",
      phone: "04-22872365",
      desc: "深耕興大學生生活圈半世紀，設有興大專屬大專青年團契、週五課業陪伴小組與音樂敬拜，為大一離家新生提供如家般的溫暖支持。",
      desc_en: "Close to NCHU dorms. Features active university student fellowships, Friday dinner groups, and music worship for campus freshmen.",
      desc_id: "Dekat dengan asrama NCHU. Memiliki persekutuan pemuda/mahasiswa aktif, kelompok belajar hari Jumat, dan dukungan ramah untuk mahasiswa baru.",
      query: "台灣基督長老教會南門教會 台中市南區南門路113號"
    },
    {
      id: "faith_bilingual",
      cat: "christian",
      catLabel: "✝️ 雙語國際教會團契",
      catLabel_en: "✝️ Bilingual International Fellowship",
      catLabel_id: "✝️ Persekutuan Internasional Bilingual (Inggris-Mandarin)",
      name: "台中思恩堂雙語國際團契 (Sien-Ean)",
      name_en: "Sien-Ean Church International Fellowship",
      name_id: "Persekutuan Internasional Gereja Sien-Ean",
      langBadges: ["🌐 English", "🇹🇼 華語"],
      transit: "搭 33 / 35 / 73 號公車直達進化路商圈約 15~18 分鐘",
      transit_en: "Bus 33, 35 or 73 to Jinhua Rd. area (approx. 15-18 mins)",
      transit_id: "Naik Bus 33, 35 atau 73 ke Jl. Jinhua (sekitar 15-18 mnt)",
      address: "臺中市北區進化路428號",
      phone: "04-22361660",
      desc: "專注於各大專院校外籍交換生與學者之跨文化事工，提供純英語主日崇拜、國際學生學伴交流、節慶文化感恩餐會與免費語言交換。",
      desc_en: "Dedicated cross-cultural ministry for international exchange students with English worship services, language exchange, and festive dinners.",
      desc_id: "Pelayanan lintas budaya untuk mahasiswa asing dan pertukaran pelajar dengan ibadah Bahasa Inggris, pertukaran bahasa, dan makan bersama.",
      query: "台中思恩堂 台中市北區進化路428號"
    },
    {
      id: "faith_traditional",
      cat: "traditional",
      catLabel: "🏮 在地文昌考運 ＆ 樂成宮月老",
      catLabel_en: "🏮 Historic Temples for Exams & Blessings",
      catLabel_id: "🏮 Kuil Tradisional untuk Ujian & Keselamatan",
      name: "在地信仰祈福（醒修宮 / 樂成宮）",
      name_en: "Xingxiu Temple & Lecheng Temple",
      name_id: "Kuil Xingxiu & Kuil Lecheng",
      langBadges: ["🇹🇼 華語導覽", "🌐 English Tour"],
      transit: "醒修宮國光路步行 10 分鐘；旱溪樂成宮搭 52 / 89 公車約 12 分鐘",
      transit_en: "Xingxiu Temple: 10-min walk; Lecheng Mazu Temple: 12-min bus",
      transit_id: "Kuil Xingxiu: jalan kaki 10 mnt; Kuil Lecheng: 12 mnt naik bus",
      address: "醒修宮（國光路262號）/ 樂成宮（東區旱溪街48號）",
      desc: "【興大學長姐必訪祈福指引】醒修宮主祀文昌帝君與關聖帝君，每逢期中期末考前眾多同學前來祈求考運金榜題名；三級古蹟樂成宮名揚全台，適合祈求行車平安符與月老良緣。",
      desc_en: "Famous local traditions: Xingxiu Temple for exam luck and wisdom; Lecheng Temple (national heritage) for road safety amulets and matchmaking blessings.",
      desc_id: "Tradisi lokal populer: Kuil Xingxiu untuk memohon kelancaran ujian kuliah; Kuil Lecheng untuk keselamatan berkendara dan perjodohan.",
      query: "台中市醒修宮"
    }
  ];

  let currentGuideTab = "safety";

  // ── 3. 注入專屬 CSS 樣式 ──
  const styleEl = document.createElement("style");
  styleEl.innerHTML = `
    .safety-modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 99999;
      align-items: center;
      justify-content: center;
      padding: 14px;
      box-sizing: border-box;
    }
    .safety-modal-card {
      background: #ffffff;
      border-radius: 24px;
      width: 100%;
      max-width: 680px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      border: 1.5px solid #a7f3d0;
      overflow: hidden;
      animation: safetyPop .28s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes safetyPop {
      from { opacity: 0; transform: scale(0.95) translateY(14px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .safety-header {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: #ffffff;
      padding: 16px 20px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .safety-header-title {
      font-size: 16.5px;
      font-weight: 900;
      letter-spacing: -0.2px;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .safety-badge-emerald {
      background: rgba(255, 255, 255, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.35);
      color: #ffffff;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 700;
      white-space: nowrap;
    }
    .safety-close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: #fff;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all .2s;
      flex-shrink: 0;
    }
    .safety-close-btn:hover {
      background: rgba(255, 255, 255, 0.35);
      transform: scale(1.08);
    }
    .safety-tabs-bar {
      display: flex;
      background: #ecfdf5;
      border-bottom: 1px solid #a7f3d0;
      padding: 6px 12px 0;
      gap: 6px;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      flex-shrink: 0;
    }
    .safety-tabs-bar::-webkit-scrollbar { display: none; }
    .safety-tab-btn {
      border: none;
      background: transparent;
      padding: 9px 14px;
      border-radius: 12px 12px 0 0;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      color: #065f46;
      cursor: pointer;
      transition: all .2s;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      user-select: none;
    }
    .safety-tab-btn.active {
      background: #ffffff;
      color: #059669;
      box-shadow: 0 -2px 6px rgba(5, 150, 105, 0.08);
      border: 1px solid #a7f3d0;
      border-bottom: none;
    }
    .safety-body {
      padding: 16px 20px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: #fafafa;
      box-sizing: border-box;
    }
    .safety-card-box {
      background: #ffffff;
      border: 1px solid #f3f4f6;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      box-sizing: border-box;
      width: 100%;
    }
    .safety-highlight-banner {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 1.5px solid #a7f3d0;
      border-radius: 16px;
      padding: 14px 16px;
      box-sizing: border-box;
      width: 100%;
    }
    .safety-spot-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 13px 15px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 10px;
      transition: all .2s;
      box-sizing: border-box;
      width: 100%;
    }
    .safety-spot-card:hover {
      border-color: #10b981;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);
    }
    .safety-spot-card.high {
      border-left: 5px solid #ef4444;
    }
    .safety-spot-card.caution {
      border-left: 5px solid #f59e0b;
    }
    .safety-pill-red {
      font-size: 11px;
      font-weight: 800;
      background: #fee2e2;
      color: #b91c1c;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #fca5a5;
      white-space: nowrap;
    }
    .safety-pill-amber {
      font-size: 11px;
      font-weight: 800;
      background: #fef3c7;
      color: #b45309;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #fcd34d;
      white-space: nowrap;
    }
    .safety-faith-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 13px 15px;
      display: flex;
      flex-direction: column;
      gap: 7px;
      margin-bottom: 10px;
      box-sizing: border-box;
      width: 100%;
      transition: all .2s;
    }
    .safety-faith-card:hover {
      border-color: #059669;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.08);
    }
    .safety-lang-chip {
      font-size: 10.5px;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
    }
    .safety-btn-row {
      display: flex;
      gap: 8px;
      margin-top: 4px;
      padding-top: 6px;
      border-top: 1px dashed #e2e8f0;
      flex-wrap: wrap;
    }
    .safety-action-btn {
      font-size: 11.5px;
      font-weight: 700;
      padding: 5px 11px;
      border-radius: 8px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: 1px solid transparent;
      cursor: pointer;
      user-select: none;
      transition: all .15s;
    }
    .safety-btn-map {
      background: #f0fdf4;
      color: #166534;
      border-color: #bbf7d0;
    }
    .safety-btn-map:hover {
      background: #dcfce7;
    }
    .safety-btn-call {
      background: #eff6ff;
      color: #1e40af;
      border-color: #bfdbfe;
    }
    .safety-btn-call:hover {
      background: #dbeafe;
    }
    .safety-btn-food-trigger {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 800;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
      transition: all .2s;
      width: 100%;
      box-sizing: border-box;
    }
    .safety-btn-food-trigger:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(5, 150, 105, 0.3);
    }

    /* 📱 手機端響應式防爆框優化 */
    @media (max-width: 480px) {
      .safety-modal-backdrop {
        padding: 8px;
      }
      .safety-modal-card {
        max-height: 92vh;
        border-radius: 20px;
      }
      .safety-header {
        padding: 12px 14px;
      }
      .safety-header-title {
        font-size: 15px;
      }
      .safety-tabs-bar {
        padding: 4px 8px 0;
        gap: 4px;
      }
      .safety-tab-btn {
        padding: 8px 10px;
        font-size: 12px;
      }
      .safety-body {
        padding: 12px;
        gap: 10px;
      }
      .safety-btn-row {
        flex-direction: column;
      }
      .safety-action-btn {
        justify-content: center;
        width: 100%;
        box-sizing: border-box;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // ── 4. 建立 Modal DOM ──
  const modalDiv = document.createElement("div");
  modalDiv.className = "safety-modal-backdrop";
  modalDiv.id = "safetyFaithModal";
  modalDiv.innerHTML = `
    <div class="safety-modal-card" onclick="event.stopPropagation()">
      <div class="safety-header">
        <div class="safety-header-title">
          <span>🛡️</span>
          <span id="safetyModalMainTitle">興大平安通行・宗教信仰・多元飲食指南</span>
          <span class="safety-badge-emerald">安全·心靈·清真</span>
        </div>
        <button class="safety-close-btn" onclick="closeSafetyFaithGuide()" title="關閉">✕</button>
      </div>

      <div class="safety-tabs-bar">
        <button class="safety-tab-btn active" id="safetyTabBtn-safety" onclick="switchSafetyFaithTab('safety')">
          🛡️ 平安通行
        </button>
        <button class="safety-tab-btn" id="safetyTabBtn-faith" onclick="switchSafetyFaithTab('faith')">
          🕊️ 宗教信仰
        </button>
        <button class="safety-tab-btn" id="safetyTabBtn-dietary" onclick="switchSafetyFaithTab('dietary')">
          🥗 清真與蔬食
        </button>
      </div>

      <div class="safety-body" id="safetyBodyContent">
        <!-- 動態渲染分頁內容 -->
      </div>
    </div>
  `;
  document.body.appendChild(modalDiv);

  modalDiv.addEventListener("click", function (e) {
    if (e.target === modalDiv) closeSafetyFaithGuide();
  });

  // ── 5. 分頁渲染函式 ──

  // 分頁 1：平安通行與防禦駕駛
  function renderSafetyTab() {
    const lang = getGuideLang();
    const isEn = lang === 'en';
    const isId = lang === 'id';

    return `
      <!-- 交通部與交警大隊防禦駕駛導讀 -->
      <div class="safety-highlight-banner">
        <div style="font-weight:900; font-size:15px; color:#065f46; display:flex; align-items:center; gap:6px;">
          <span>🛡️</span>
          <span>${isEn ? 'Defensive Driving & Traffic Safety Alerts' : (isId ? 'Peringatan Keselamatan Lalu Lintas & Mengemudi Defensif' : '興大校園周邊防禦駕駛 ＆ 易肇事路口警示')}</span>
        </div>
        <div style="font-size:12px; color:#047857; margin-top:4px; line-height:1.55;">
          ${isEn 
            ? 'Based on official traffic accident analyses from the Traffic Police Department. Practice defensive driving, beware of large vehicles\' blind spots, and avoid sudden lane cuts.' 
            : (isId 
              ? 'Berdasarkan data Kepolisian Lalu Lintas mengenai simpang rawan kecelakaan di sekitar kampus NCHU. Utamakan keselamatan dan waspadai blind spot.' 
              : '整理自交通部與台中市交警大隊興大周邊易肇事熱點統計。機車族進出校門請務必落實防禦駕駛，遠離大型車輛內輪差死角，安全第一！')}
        </div>
      </div>

      <!-- 4 大易肇事路口警示卡清單 -->
      <div class="safety-card-box">
        <div style="font-weight:900; font-size:13.5px; color:#0f172a; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
          <span>⚠️</span>
          <span>${isEn ? '4 High-Risk Intersections Around NCHU' : (isId ? '4 Titik Rawan Kecelakaan di Sekitar Kampus' : '興大周邊 4 大易肇事路口警示卡')}</span>
        </div>

        <div>
          ${ACCIDENT_SPOTS.map(s => {
            const badgeText = isEn ? s.levelBadge_en : (isId ? s.levelBadge_id : s.levelBadge);
            const nameText = isEn ? s.name_en : (isId ? s.name_id : s.name);
            const hazardText = isEn ? s.hazard_en : (isId ? s.hazard_id : s.hazard);
            const tipText = isEn ? s.tip_en : (isId ? s.tip_id : s.tip);
            const badgeClass = s.level === 'high' ? 'safety-pill-red' : 'safety-pill-amber';

            return `
              <div class="safety-spot-card ${s.level}">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;">
                  <span class="${badgeClass}">${badgeText}</span>
                  <div style="font-weight:800; font-size:13.5px; color:#0f172a; flex:1; min-width:200px;">
                    ${nameText}
                  </div>
                </div>
                <div style="font-size:11.5px; color:#475569; margin-top:2px; line-height:1.5;">
                  <strong>${isEn ? 'Risk Factor:' : (isId ? 'Penyebab Rawan:' : '🚨 事故成因：')}</strong> ${hazardText}
                </div>
                <div style="font-size:11.5px; color:#065f46; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:6px 10px; margin-top:2px; line-height:1.5;">
                  <strong>${isEn ? 'Defensive Tip:' : (isId ? 'Tips Aman:' : '💡 防禦要訣：')}</strong> ${tipText}
                </div>
                <div class="safety-btn-row">
                  <a class="safety-action-btn safety-btn-map" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.query)}" target="_blank" rel="noopener">
                    📍 ${isEn ? 'Google Maps Street View' : (isId ? 'Lihat di Google Maps' : 'Google Maps 實景位置')}
                  </a>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 🟢 深夜安心返宿推薦動線 -->
      <div class="safety-card-box" style="border-left:5px solid #10b981; background:#fafffd;">
        <div style="font-weight:900; font-size:13.5px; color:#065f46; display:flex; align-items:center; gap:6px;">
          <span>🟢</span>
          <span>${isEn ? 'Late-Night Safe Walk Routes (23:00+)' : (isId ? 'Rute Aman Pulang Malam (Setelah 23:00)' : '深夜安心返宿推薦動線 (23:00 以後)')}</span>
        </div>
        <div style="font-size:12px; color:#334155; margin-top:6px; line-height:1.6;">
          ${isEn
            ? 'When walking back to dorms after 23:00, prioritize well-lit main arteries: <strong>Xuefu Rd., Nanmen Rd., and Zhongxiao Rd.</strong>'
            : (isId
              ? 'Jika kembali ke asrama setelah pukul 23:00, utamakan jalan protokol yang terang: <strong>Jl. Xuefu, Jl. Nanmen, dan Jl. Zhongxiao</strong>.'
              : '深夜 23:00 後自圖書館或校外返宿，強烈建議優先行經<strong>「學府路、南門路、忠孝路」</strong>主要幹道：')}
        </div>
        <ul style="font-size:11.5px; color:#475569; margin:6px 0 0 18px; line-height:1.6;">
          <li>${isEn 
            ? '<strong>Dense 24H Convenience Stores:</strong> 7-Eleven and FamilyMart branches are located every 100~150m with continuous lighting, surveillance cameras, and staff available for urgent shelter.' 
            : (isId 
              ? '<strong>Minimarket 24 Jam:</strong> Terdapat 7-Eleven & FamilyMart setiap 100~150m dengan penerangan terang dan kamera CCTV untuk perlindungan darurat.' 
              : '<strong>24H 超商密集守護：</strong>沿線每 100～150 公尺即有 7-Eleven 與全家超商，騎樓光源充足、全天候錄影監視；若遇突發危險可立即入店求助。')}</li>
          <li>${isEn 
            ? '<strong>Avoid Dark Paths:</strong> Please avoid unlit pathways along Hanxi riverbanks or remote, narrow farm alleys late at night.' 
            : (isId 
              ? '<strong>Hindari Area Gelap:</strong> Hindari berjalan sendirian di pinggir sungai Hanxi yang minim penerangan atau gang sempit terpencil saat larut malam.' 
              : '<strong>避開幽暗死角：</strong>深夜請避免單獨行經旱溪自行車道無燈段、康橋水岸幽暗區或校園周邊無監視器之田間狹窄暗巷。')}</li>
        </ul>
      </div>

      <!-- 🚨 校園安全與僑外生窗口一鍵通報 -->
      <div class="safety-card-box">
        <div style="font-weight:900; font-size:13.5px; color:#0f172a; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
          <span>🚨</span>
          <span>${isEn ? 'Emergency Help & Student Support Contacts' : (isId ? 'Kontak Bantuan Darurat & Dukungan Mahasiswa' : '校園安全與僑外生專責窗口一鍵通報')}</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <!-- 學安室 24H -->
          <div style="display:flex; justify-content:space-between; align-items:center; background:#fef2f2; border:1px solid #fecaca; padding:10px 12px; border-radius:10px; gap:8px; flex-wrap:wrap;">
            <div>
              <div style="font-weight:900; font-size:12.5px; color:#991b1b;">
                🛡️ ${isEn ? 'NCHU Campus Security 24H Emergency Hot-line' : (isId ? 'Pusat Keamanan Kampus NCHU 24 Jam' : '學務處學安室 24H 緊急專線')}
              </div>
              <div style="font-size:11px; color:#7f1d1d; margin-top:2px;">
                ${isEn ? 'Traffic accidents, midnight medical transport, emergency escort' : (isId ? 'Kecelakaan lalu lintas, sakit mendadak larut malam, pengawalan darurat' : '校內外車禍協處、半夜急病送醫送診、夜間突發安全事件')}
              </div>
            </div>
            <a href="tel:0422870885" class="safety-action-btn" style="background:#dc2626; color:#fff; border-color:#b91c1c; font-weight:800;">
              📞 04-22870885
            </a>
          </div>

          <!-- 僑港澳生生活輔導窗口 -->
          <div style="display:flex; justify-content:space-between; align-items:center; background:#f0fdf4; border:1px solid #bbf7d0; padding:10px 12px; border-radius:10px; gap:8px; flex-wrap:wrap;">
            <div>
              <div style="font-weight:900; font-size:12.5px; color:#166534;">
                🌏 ${isEn ? 'Overseas Chinese & HK/Macau Student Affairs (Huisun 2F)' : (isId ? 'Konseling Mahasiswa Keturunan Tionghoa & HK/Macau (Huisun 2F)' : '學安室 — 僑生及港澳生生活輔導窗口 (惠蓀堂 2F)')}
              </div>
              <div style="font-size:11px; color:#14532d; margin-top:2px;">
                ${isEn ? 'Overseas health insurance, ARC residency, bursaries, student club' : (isId ? 'Asuransi kesehatan, izin tinggal ARC, beasiswa, kegiatan asosiasi' : '僑保健保、居留證延期、清寒助學金、僑聯會活動與急難救助')}
              </div>
            </div>
            <a href="tel:0422840250" class="safety-action-btn" style="background:#16a34a; color:#fff; border-color:#15803d; font-weight:800;">
              📞 04-22840250
            </a>
          </div>

          <!-- 國際事務處 OIA -->
          <div style="display:flex; justify-content:space-between; align-items:center; background:#eff6ff; border:1px solid #bfdbfe; padding:10px 12px; border-radius:10px; gap:8px; flex-wrap:wrap;">
            <div>
              <div style="font-weight:900; font-size:12.5px; color:#1e40af;">
                🌐 ${isEn ? 'Office of International Affairs (OIA, Admin Bldg 3F)' : (isId ? 'Kantor Urusan Internasional (OIA, Gedung Rektorat Lt. 3)' : '國際事務處 OIA — 外籍生服務窗口 (行政大樓 3F)')}
              </div>
              <div style="font-size:11px; color:#1e3a8a; margin-top:2px;">
                ${isEn ? 'Visas, ARC extensions, international buddy program, cross-culture' : (isId ? 'Visa pelajar asing, perpanjangan ARC, program buddy internasional' : '外籍學位生居留簽證、國際獎學金、學伴計畫與跨文化校園適應')}
              </div>
            </div>
            <a href="tel:0422840206" class="safety-action-btn" style="background:#2563eb; color:#fff; border-color:#1d4ed8; font-weight:800;">
              📞 04-22840206
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // 分頁 2：宗教場所與心靈寄託
  function renderFaithTab() {
    const lang = getGuideLang();
    const isEn = lang === 'en';
    const isId = lang === 'id';

    return `
      <div class="safety-highlight-banner" style="background:linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%); border-color:#7dd3fc;">
        <div style="font-weight:900; font-size:15px; color:#0369a1; display:flex; align-items:center; gap:6px;">
          <span>🕊️</span>
          <span>${isEn ? 'Places of Worship & Spiritual Support in Taichung' : (isId ? 'Tempat Ibadah & Komunitas Rohani di Taichung' : '多元信仰場所 ＆ 心靈寄託與聚會指南')}</span>
        </div>
        <div style="font-size:12px; color:#0284c7; margin-top:4px; line-height:1.55;">
          ${isEn
            ? 'Welcoming all beliefs: Muslim prayer rooms, Taichung Mosque, Catholic Cathedral (Indonesian/English Mass), Presbyterian youth groups, and historic local temples.'
            : (isId
              ? 'Menyambut semua keyakinan: Ruang doa kampus, Masjid Taichung, Katedral Katolik (Misa Bahasa Indonesia/Inggris), Persekutuan Kristen & Kuil Tradisional.'
              : '尊重並擁抱多元文化信仰：收錄校內多信仰祈禱室、台中清真寺、天主教主教座堂（專屬印尼語/英語彌撒）、長老教會青年團契、雙語國際教會與文昌帝君考運祈福。')}
        </div>
      </div>

      <div class="safety-card-box">
        <div style="font-weight:900; font-size:13px; color:#0f172a; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
          <span>🏛️</span>
          <span>${isEn ? 'Places of Faith & Community (With Language Badges & Transit)' : (isId ? 'Daftar Tempat Ibadah (Lengkap Bahasa & Rute Bus)' : '興大周邊 6 大宗教場所清單（語言徽章與交通指引）')}</span>
        </div>

        <div>
          ${FAITH_PLACES.map(f => {
            const catText = isEn ? f.catLabel_en : (isId ? f.catLabel_id : f.catLabel);
            const nameText = isEn ? f.name_en : (isId ? f.name_id : f.name);
            const transitText = isEn ? f.transit_en : (isId ? f.transit_id : f.transit);
            const descText = isEn ? f.desc_en : (isId ? f.desc_id : f.desc);

            return `
              <div class="safety-faith-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;">
                  <div>
                    <span style="font-size:11px; color:#059669; font-weight:800;">${catText}</span>
                    <div style="font-size:14px; font-weight:800; color:#0f172a; margin-top:1px;">
                      ${nameText}
                    </div>
                  </div>
                  <div style="display:flex; gap:4px; flex-wrap:wrap;">
                    ${f.langBadges.map(b => `<span class="safety-lang-chip">${b}</span>`).join('')}
                  </div>
                </div>

                <div style="font-size:11.5px; color:#0369a1; background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px; padding:4px 8px; margin-top:2px;">
                  🚌 <strong>${isEn ? 'Transit from NCHU:' : (isId ? 'Rute dari NCHU:' : '興大出發交通：')}</strong> ${transitText}
                </div>

                <div style="font-size:12px; color:#475569; line-height:1.5; margin-top:2px;">
                  ${descText}
                </div>

                <div style="font-size:11px; color:#64748b;">
                  📍 ${f.address}
                </div>

                <div class="safety-btn-row">
                  <a class="safety-action-btn safety-btn-map" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.query)}" target="_blank" rel="noopener">
                    📍 ${isEn ? 'Google Maps Navigation' : (isId ? 'Navigasi Google Maps' : 'Google Maps 導航')}
                  </a>
                  ${f.phone ? `
                    <a class="safety-action-btn safety-btn-call" href="tel:${f.phone.replace(/[^0-9]/g, '')}">
                      📞 ${isEn ? 'Call Church / Center' : (isId ? 'Hubungi Pengurus' : '電話洽詢')} (${f.phone})
                    </a>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // 分頁 3：清真・蔬食・多元飲食指南
  function renderDietaryTab() {
    const lang = getGuideLang();
    const isEn = lang === 'en';
    const isId = lang === 'id';

    return `
      <!-- 東協廣場 Halal 清真與東南亞美食攻略卡 -->
      <div class="safety-card-box" style="border:1.5px solid #10b981; background:#f7fee7;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
          <div>
            <div style="font-weight:900; font-size:15px; color:#365314; display:flex; align-items:center; gap:6px;">
              <span>🕌</span>
              <span>${isEn ? 'ASEAN Square: Halal & Southeast Asian Hub' : (isId ? 'ASEAN Square: Pusat Makanan Halal & Asia Tenggara' : '東協廣場 (ASEAN Square) 東南亞 ＆ Halal 清真美食大本營')}</span>
            </div>
            <div style="font-size:11.5px; color:#4d7c0f; margin-top:3px; font-weight:700;">
              ${isEn ? '🚌 10-12 mins direct bus (33, 35, 50, 52, 73) from NCHU Main Gate' : (isId ? '🚌 10-12 menit naik bus langsung (33, 35, 50, 52, 73) dari NCHU' : '🚌 從興大正門搭 33 / 35 / 50 / 52 / 73 號公車，約 10～12 分鐘直達台中火車站前')}
            </div>
          </div>
          <span style="background:#65a30d; color:#fff; font-size:10.5px; font-weight:800; padding:2px 7px; border-radius:6px; white-space:nowrap;">
            ${isEn ? '10m Direct Bus' : (isId ? '10 Mnt Langsung' : '直達商圈')}
          </span>
        </div>

        <div style="font-size:12px; color:#3f6212; margin-top:8px; line-height:1.6;">
          ${isEn 
            ? 'Located in front of Taichung Railway Station, ASEAN Square is the premier cultural and dining hub for international students, featuring dozens of certified Halal dining spots and supermarkets:' 
            : (isId 
              ? 'Terletak di depan Stasiun Kereta Taichung, ASEAN Square adalah pusat kuliner dan perbelanjaan favorit mahasiswa Indonesia dan Asia Tenggara:' 
              : '位於台中火車站前的「東協廣場」（前身第一廣場），是全中台灣最富盛名的東南亞與清真美食聚落，為穆斯林與僑外生採購家鄉料理的首選聖地：')}
        </div>

        <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px; font-size:11.5px;">
          <div style="background:#ffffff; border:1px solid #d9f99d; border-radius:8px; padding:8px 10px;">
            <strong>🇮🇩 ${isEn ? 'Authentic Indonesian Padang Dining:' : (isId ? 'Masakan Padang & Nusantara Halal:' : '道地印尼 Padang 料理與清真認證：')}</strong>
            <span style="color:#4b5563;">
              ${isEn ? 'Rendang, Nasi Kuning, fried Tempe, spicy Sambal, and Halal-certified poultry/beef.' : (isId ? 'Rendang empuk, Nasi Kuning, Tempe goreng, Sambal terasi, ayam bakar bersertifikasi Halal.' : '濃郁香氣巴東牛肉 (Rendang)、黃薑飯、炸天貝 (Tempe)、正宗香辣醬，肉品食材嚴格符合清真宰殺規格。')}
            </span>
          </div>
          <div style="background:#ffffff; border:1px solid #d9f99d; border-radius:8px; padding:8px 10px;">
            <strong>🇻🇳 ${isEn ? 'Vietnamese Pho & Banh Mi:' : (isId ? 'Pho & Roti Lapis Vietnam:' : '正宗越南生牛肉河粉 (Phở) 與越式麵包：')}</strong>
            <span style="color:#4b5563;">
              ${isEn ? 'Crispy baguettes, fresh herbs, lime, and rich beef broth.' : (isId ? 'Bánh mì renyah, kuah kaldu sapi segar dengan daun mint dan jeruk nipis.' : '現烤酥脆越式法包、九層塔檸檬牛肉湯頭清甜無負擔。')}
            </span>
          </div>
          <div style="background:#ffffff; border:1px solid #d9f99d; border-radius:8px; padding:8px 10px;">
            <strong>🛒 ${isEn ? 'Southeast Asian Supermarkets (RJ Mart):' : (isId ? 'Supermarket Asia Tenggara (RJ Mart dll):' : '大型東南亞連鎖超市（如 RJ Mart 等）：')}</strong>
            <span style="color:#4b5563;">
              ${isEn ? 'Imported coconut milk, instant noodles, authentic spices, and specialty snacks.' : (isId ? 'Santan, bumbu instan, Indomie aneka rasa, kecap, dan camilan khas Asia Tenggara.' : '平價購買椰漿、東南亞泡麵、道地香料粉、香茅草本與家鄉特色零食。')}
            </span>
          </div>
        </div>

        <div class="safety-btn-row" style="margin-top:10px;">
          <a class="safety-action-btn safety-btn-map" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('東協廣場 台中市中區綠川西街135號')}" target="_blank" rel="noopener">
            📍 ${isEn ? 'Google Maps Navigate to ASEAN Square' : (isId ? 'Buka Peta ASEAN Square' : 'Google Maps 導航至東協廣場')}
          </a>
        </div>
      </div>

      <!-- 一鍵連動現有美食地圖篩選按鈕 -->
      <div class="safety-card-box">
        <div style="font-weight:900; font-size:13.5px; color:#0f172a; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
          <span>🍜</span>
          <span>${isEn ? 'Instant Campus Food Map Filter' : (isId ? 'Filter Cepat Peta Kuliner Kampus' : '一鍵連動興大校園美食地圖（快速篩選）')}</span>
        </div>
        <p style="font-size:12px; color:#64748b; margin-top:2px; margin-bottom:12px; line-height:1.5;">
          ${isEn
            ? 'Instantly search 303 verified restaurants around NCHU with dietary presets:'
            : (isId
              ? 'Langsung cari dari 303 restoran terverifikasi di sekitar kampus NCHU:'
              : '直接呼叫整合之「303 間實體興大校園美食資料庫」，一鍵秒切換蔬食健康或異國清真風味：')}
        </p>

        <div style="display:flex; flex-direction:column; gap:10px;">
          <!-- 蔬食素食按鈕 -->
          <button class="safety-btn-food-trigger" onclick="triggerFoodMapFilter('vegetarian')">
            <span>🥬</span>
            <span>${isEn ? 'View Vegetarian & Plant-Based Eats Nearby' : (isId ? 'Lihat Restoran Vegetarian & Ramah Nabati' : '查看興大周邊蔬食 / 健康素食店家')}</span>
            <span style="font-size:11px; opacity:0.85;">→</span>
          </button>

          <!-- 東南亞與清真友善按鈕 -->
          <button class="safety-btn-food-trigger" style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%);" onclick="triggerFoodMapFilter('southeast_asian')">
            <span>🕌</span>
            <span>${isEn ? 'View Southeast Asian & Halal-Friendly Eats' : (isId ? 'Lihat Kuliner Asia Tenggara & Halal-Friendly' : '查看興大周邊東南亞 / 清真友善店家')}</span>
            <span style="font-size:11px; opacity:0.85;">→</span>
          </button>
        </div>
      </div>
    `;
  }

  // ── 6. 互動邏輯：切換分頁 ──
  window.switchSafetyFaithTab = function (tab) {
    currentGuideTab = tab;
    document.querySelectorAll(".safety-tab-btn").forEach(b => b.classList.remove("active"));
    const activeBtn = document.getElementById("safetyTabBtn-" + tab);
    if (activeBtn) activeBtn.classList.add("active");

    const container = document.getElementById("safetyBodyContent");
    if (!container) return;

    if (tab === "safety") container.innerHTML = renderSafetyTab();
    else if (tab === "faith") container.innerHTML = renderFaithTab();
    else if (tab === "dietary") container.innerHTML = renderDietaryTab();

    container.scrollTop = 0;
  };

  // ── 7. 觸發美食地圖連動篩選 ──
  window.triggerFoodMapFilter = function (type) {
    closeSafetyFaithGuide();
    const keyword = (type === 'vegetarian') ? '蔬' : '泰';
    
    if (typeof openFoodMap === 'function') {
      Promise.resolve(openFoodMap()).then(() => {
        const searchInput = document.getElementById("foodSearchInput");
        if (searchInput) {
          searchInput.value = keyword;
          if (typeof onFoodSearchChange === 'function') {
            onFoodSearchChange();
          }
        }
      });
    }
  };

  // ── 8. 開啟與關閉 Modal ──
  window.openSafetyFaithGuide = function (targetTab = "safety") {
    const modal = document.getElementById("safetyFaithModal");
    if (!modal) return;
    switchSafetyFaithTab(targetTab);
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  };

  window.closeSafetyFaithGuide = function () {
    const modal = document.getElementById("safetyFaithModal");
    if (modal) modal.style.display = "none";
    document.body.style.overflow = "";
    if (typeof window.resetBottomTabToHome === "function") {
      window.resetBottomTabToHome();
    }
  };

})();
