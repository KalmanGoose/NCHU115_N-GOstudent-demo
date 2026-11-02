/**
 * 💖 國立中興大學 興生身心應急 ＆ 特約就醫與健康減脂指南
 * (NCHU Health Care, Contracted Clinics & InBody Fitness Guide)
 * 核心特色：
 *   1. 🩺 惠蓀堂 1F 週一至週五 5 大專科醫師「校內免健保卡免費駐診」時刻表
 *   2. 🏥 興大周邊 20+ 間「出示學生證免收掛號費」特約診所庫（分類抽屜：牙醫/感冒家醫/身心/眼科/中醫/外科/綜合醫院）
 *   3. ⚖️ 惠蓀堂 1F 免費 InBody 身體組成分析儀（體脂計）自主檢測 ＆ 吃貨贖罪券體態計算機
 *   4. 🥗 健諮中心「興健康體健班」介紹（曾由校內知名特聘教授親自受邀代言支持）
 *   5. 🧰 惠蓀堂 1F 免費急救箱（宿營/系隊可借2盒）、輪椅拐杖外借與外傷換藥
 *   6. 💖 惠蓀堂 4F 心理諮商「161 模式」極速媒合與 24H 緊急專線
 * 100% 純前端極速交互，0 Token 成本，自適應手機螢幕防爆框。
 */

(function () {

  function getHealthLang() {
    return (window.nchuI18n && typeof window.nchuI18n.getLanguage === 'function')
      ? window.nchuI18n.getLanguage()
      : 'zh-TW';
  }

  // ── 1. 週一至週五 惠蓀堂 1F 醫師校內免費駐診時刻表 ──
  const CAMPUS_DOCTOR_SCHEDULE = [
    {
      day: 1,
      dayName: "週一",
      time: "14:00 - 16:30",
      doc: "許維邦 醫師",
      dept: "婦產科 / 家醫科",
      title: "富台診所院長 / 前台中榮總主治醫師",
      desc: "家醫科整合諮詢、婦科保健、疫苗諮詢、慢性病與日常健康評估。"
    },
    {
      day: 2,
      dayName: "週二",
      time: "09:00 - 11:30",
      doc: "王志浩 醫師",
      dept: "一般外科",
      title: "澄清綜合醫院平等院區 主治醫師",
      desc: "外傷處理評估、皮膚腫瘤、創傷縫合諮詢、腹痛外科急症初步篩檢。"
    },
    {
      day: 3,
      dayName: "週三",
      time: "14:00 - 16:30",
      doc: "黃俊彥 醫師",
      dept: "腸胃肝膽科",
      title: "澄清綜合醫院平等院區 主治醫師",
      desc: "胃痛脹氣、胃食道逆流、慢性腹瀉、肝功能異常與消化系統諮詢。"
    },
    {
      day: 4,
      dayName: "週四",
      time: "09:00 - 11:30",
      doc: "黃韻琴 醫師",
      dept: "復健科",
      title: "愛鄰復健科診所 院長",
      desc: "系隊打球運動傷害、腳踝翻船扭傷、脊椎側彎、肩頸腰背痠痛評估。"
    },
    {
      day: 5,
      dayName: "週五",
      time: "14:00 - 16:30",
      doc: "楊基瓏 醫師",
      dept: "耳鼻喉科 / 外科",
      title: "楊基瓏診所 院長",
      desc: "感冒咽喉痛、過敏性鼻炎、中耳炎眩暈、扁桃腺發炎與耳鼻喉專案檢查。"
    }
  ];

  // ── 2. 興大周邊特約醫療院所（出示學生證免收掛號費）資料庫 ──
  const CONTRACTED_CLINICS = [
    // 🦷 牙醫專科（免收掛號費）
    {
      id: "c_chengxin",
      name: "澄新牙醫診所",
      cat: "dental",
      catLabel: "🦷 牙醫專科",
      deal: "🎉 門診免收掛號費",
      address: "臺中市南區學府路58號（大門學府路近正門）",
      phone: "04-22859898",
      note: "定期洗牙、蛀牙補牙、智齒疼痛、口腔檢查。採預約制，出示學生證免收掛號費！"
    },
    {
      id: "c_yikang",
      name: "宜康牙醫診所",
      cat: "dental",
      catLabel: "🦷 牙醫專科",
      deal: "🎉 門診免收掛號費",
      address: "臺中市南區國光路206號（近興大國光路側門）",
      phone: "04-22852908",
      note: "一般牙科、牙結石清除、牙痛處置，含學生本人與眷屬享優待，採預約制。"
    },
    {
      id: "c_xinsheng",
      name: "新生牙醫診所",
      cat: "dental",
      catLabel: "🦷 牙醫專科",
      deal: "🎉 門診免收掛號費",
      address: "臺中市南區仁和路275號",
      phone: "04-22875153",
      note: "專業齒科診療、洗牙補牙，出示興大學生證免收掛號費（採預約制）。"
    },
    {
      id: "c_jiaren",
      name: "嘉仁牙醫診所",
      cat: "dental",
      catLabel: "🦷 牙醫專科",
      deal: "🎉 門診免收掛號費",
      address: "臺中市南區復興路三段272號",
      phone: "04-22205114",
      note: "一般牙科、根管治療、定期洗牙口腔預防保健，出示學生證享門診免掛號費。"
    },

    // 🩺 感冒 / 家醫 / 耳鼻喉專科（免收掛號費）
    {
      id: "c_qingyao",
      name: "慶燿診所",
      cat: "ent",
      catLabel: "🩺 感冒 / 家醫 / 兒科",
      deal: "🎉 門診免收掛號費",
      address: "臺中市南區國光路241號（國光側門對面）",
      phone: "04-22872877",
      note: "發燒感冒、上呼吸道感染、腸胃炎、日常急性病痛，出示學生證完全免收掛號費！"
    },
    {
      id: "c_hengyu",
      name: "恆宇診所",
      cat: "ent",
      catLabel: "🩺 家醫 / 慢性病 / 體重",
      deal: "🎉 門診免收掛號費",
      address: "臺中市南區國光路241號1樓（近國光側門）",
      phone: "04-22872877",
      note: "慢性病處方、一般內科、體質管理諮詢，出示興大證件享門診免掛號費。"
    },
    {
      id: "c_xinxin",
      name: "欣欣耳鼻喉科診所",
      cat: "ent",
      catLabel: "👂 耳鼻喉 / 感冒專科",
      deal: "🎉 門診免收掛號費",
      address: "臺中市南區美村南路34號（高工美村商圈）",
      phone: "04-22653777",
      note: "過敏性鼻炎、喉嚨發炎、耳道疼痛、流感篩檢，憑興大學生證免收門診掛號費。"
    },
    {
      id: "c_bai",
      name: "白耳鼻喉科診所",
      cat: "ent",
      catLabel: "👂 耳鼻喉 / 呼吸道專科",
      deal: "🏷️ 門診掛號費折抵50元",
      address: "臺中市南區學府路152號（學府路商圈核心）",
      phone: "04-22220600",
      note: "耳鼻喉內視鏡檢查、聲音沙啞、咽喉化膿，出示學生證享專案掛號費折抵。"
    },

    // 🧠 身心 / 精神科（青少年特診）
    {
      id: "c_longan",
      name: "宏恩醫院龍安分院",
      cat: "psych",
      catLabel: "🧠 身心專科 / 心理門診",
      deal: "🎉 門診、急診免收掛號費",
      address: "臺中市南區德富路145巷2號",
      phone: "04-37017188",
      note: "青少年身心特診、焦慮憂鬱失眠諮詢、壓力調適，持學生證看診免收掛號費。"
    },
    {
      id: "c_jianjian",
      name: "漸漸身心診所",
      cat: "psych",
      catLabel: "🧠 身心科 / 精神專科",
      deal: "🎉 門診免收掛號費",
      address: "臺中市東區復興路四段152號（臺中火車站對面）",
      phone: "04-22221368",
      note: "失眠睡不著、自律神經失調、情緒低落、恐慌焦慮特診，出示學生證免收門診掛號費。"
    },

    // 👀 眼科專科（免收掛號費）
    {
      id: "c_mingxuan",
      name: "明選眼科診所",
      cat: "eye",
      catLabel: "👀 眼科專科",
      deal: "🎉 門診免收掛號費",
      address: "臺中市南區高工路266巷3號",
      phone: "04-22606951",
      note: "眼睛乾澀刺痛、結膜炎、角膜破皮、視力檢測，出示學生證享門診免收掛號費。"
    },
    {
      id: "c_daming",
      name: "達明眼科醫院",
      cat: "eye",
      catLabel: "👀 專業眼科醫院",
      deal: "🎉 門診免收掛號費",
      address: "臺中市大里區中興路二段490號",
      phone: "04-24851437",
      note: "角膜塑型片折抵1000元、醫療配鏡折500元，出示學生證門診免掛號費。"
    },

    // 🌿 中醫傷科 / 針灸扭傷（免收掛號費）
    {
      id: "c_beida",
      name: "北大中醫診所",
      cat: "tcm",
      catLabel: "🌿 中醫傷科 / 針灸推拿",
      deal: "🎉 門診免收掛號費",
      address: "臺中市南區興大路430號（大門口正對面斜前方）",
      phone: "04-22857779",
      note: "【離校最近！】打球腳踝扭傷、落枕、經絡針灸推拿、體質調理，出示學生證免收掛號費！"
    },
    {
      id: "c_youan",
      name: "酉安中醫診所",
      cat: "tcm",
      catLabel: "🌿 中醫傷科 / 針灸調養",
      deal: "🎉 門診免收掛號費",
      address: "臺中市南區美村路113號",
      phone: "04-22621211",
      note: "系隊運動傷害、肌肉痠痛、中藥調理、針灸拔罐，出示學生證免門診掛號費。"
    },
    {
      id: "c_xianghe",
      name: "祥鶴中醫診所",
      cat: "tcm",
      catLabel: "🌿 中醫全科",
      deal: "🎉 門診免收掛號費",
      address: "臺中市東區大智路294號（近大智國小）",
      phone: "04-22802968",
      note: "中醫傷科與內科調養，出示興大學生證享門診免掛號費與自費產品折扣。"
    },
    {
      id: "c_xinshidai",
      name: "新世代中醫診所",
      cat: "tcm",
      catLabel: "🌿 中醫全科",
      deal: "🎉 門診免收掛號費",
      address: "臺中市東區台中路77號1-2樓",
      phone: "04-22212758",
      note: "內科開藥免收掛號費（若施作傷科推拿依規另加收 50 元）。"
    },

    // 🩹 外科 / 腸胃 / 創傷處置（免收掛號費）
    {
      id: "c_yongjia",
      name: "永佳診所",
      cat: "gi_surg",
      catLabel: "💊 肝膽腸胃 / 心臟 / 家醫",
      deal: "🎉 門診免收掛號費",
      address: "臺中市南區美村路二段156號",
      phone: "04-22655226",
      note: "消化道發炎、胃痛胃脹、胃食道逆流、心悸胸悶評估，持學生證免門診掛號費。"
    },
    {
      id: "c_luolun",
      name: "羅倫檭診所",
      cat: "gi_surg",
      catLabel: "🩹 家醫 / 外科處置",
      deal: "🎉 門診及急診免收掛號費",
      address: "臺中市南區仁和路185號",
      phone: "04-22871048",
      note: "外科局部縫合、外傷包紮換藥、家醫科急症，出示學生證門診急診均免收掛號費。"
    },
    {
      id: "c_fengtian",
      name: "豐田診所",
      cat: "gi_surg",
      catLabel: "🔬 腸胃肝膽 / 心臟 / 健檢",
      deal: "🎉 門診免收掛號費",
      address: "臺中市南區建成路1848號",
      phone: "04-22850066",
      note: "胃腸肝膽超音波、慢性心血管健康管理，出示學生證門診免掛號費、健檢享優惠。"
    },
    {
      id: "c_weifeng",
      name: "薇風整形外科診所",
      cat: "gi_surg",
      catLabel: "✨ 外科 / 皮膚創傷處置",
      deal: "🎉 門診免收掛號費",
      address: "臺中市南區工學路8之3號",
      phone: "04-22607228",
      note: "疤痕修復、皮膚創傷處置、雷射淡斑，出示學生證享門診免掛號費、手術95折。"
    },

    // 🏥 綜合醫院 / 24H 急診（免收掛號費）
    {
      id: "c_hongen",
      name: "宏恩醫院",
      cat: "hosp",
      catLabel: "🏥 綜合醫院 / 24H急診",
      deal: "🎉 門診、急診免收掛號費",
      address: "臺中市南區復興路二段38之13號",
      phone: "04-22623123",
      note: "【南區在地守護】半夜急診就醫、綜合科別門診，憑興大學生證門診與急診均免收掛號費！"
    },
    {
      id: "c_xinputi",
      name: "新菩提醫院",
      cat: "hosp",
      catLabel: "🏥 綜合醫院 / 24H急診",
      deal: "🎉 門診、急診免收掛號費",
      address: "臺中市大里區中興路二段621號（大里近南區）",
      phone: "04-24829966",
      note: "門診與急診免收掛號費；住院及自費檢驗享 8～9 折優待。"
    },
    {
      id: "c_chengging",
      name: "澄清綜合醫院（平等院區）",
      cat: "hosp",
      catLabel: "🏥 區域教學醫院",
      deal: "🎉 門診免收掛號費",
      address: "臺中市中區平等街139號",
      phone: "04-24632000",
      note: "百年知名教學醫院，持興大學生證享門診免收掛號費、病房費9折、健檢9折。"
    }
  ];

  let currentActiveTab = "doctors";
  let currentClinicCat = "all";

  // ── 3. 注入專屬 CSS 樣式（自適應移動端與防爆框） ──
  const styleEl = document.createElement("style");
  styleEl.innerHTML = `
    .health-modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 99999;
      align-items: center;
      justify-content: center;
      padding: 14px 10px;
      box-sizing: border-box;
      overflow-y: hidden;
    }
    .health-modal-card {
      background: #ffffff;
      border-radius: 22px;
      width: 100%;
      max-width: 600px;
      height: 88vh;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.35);
      border: 1.5px solid #fecdd3;
      overflow: hidden;
      box-sizing: border-box;
      animation: healthPop .28s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes healthPop {
      from { opacity: 0; transform: scale(0.95) translateY(14px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .health-header {
      background: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
      color: #ffffff;
      padding: 16px 20px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .health-header-title {
      font-size: 16.5px;
      font-weight: 900;
      letter-spacing: -0.2px;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .health-badge-rose {
      background: rgba(255, 255, 255, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.35);
      color: #ffffff;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 700;
      white-space: nowrap;
    }
    .health-close-btn {
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
    .health-close-btn:hover {
      background: rgba(255, 255, 255, 0.35);
      transform: scale(1.08);
    }
    .health-tabs-bar {
      display: flex;
      background: #fff1f2;
      border-bottom: 1px solid #fecdd3;
      padding: 6px 12px 0;
      gap: 6px;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      flex-shrink: 0;
    }
    .health-tabs-bar::-webkit-scrollbar { display: none; }
    .health-tab-btn {
      border: none;
      background: transparent;
      padding: 9px 13px;
      border-radius: 12px 12px 0 0;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      color: #881337;
      cursor: pointer;
      transition: all .2s;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      user-select: none;
    }
    .health-tab-btn.active {
      background: #ffffff;
      color: #e11d48;
      box-shadow: 0 -2px 6px rgba(225, 29, 72, 0.08);
      border: 1px solid #fecdd3;
      border-bottom: none;
    }
    .health-body {
      padding: 16px 20px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: #fafafa;
      box-sizing: border-box;
    }
    .health-card-box {
      background: #ffffff;
      border: 1px solid #f3f4f6;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      box-sizing: border-box;
      width: 100%;
    }
    .health-highlight-banner {
      background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
      border: 1.5px solid #fecdd3;
      border-radius: 16px;
      padding: 14px 16px;
      box-sizing: border-box;
      width: 100%;
    }
    .health-calc-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 10px;
      width: 100%;
      box-sizing: border-box;
    }
    .health-input-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .health-label {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
    }
    .health-input {
      padding: 9px 12px;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      font-size: 13.5px;
      outline: none;
      transition: border-color .2s;
      width: 100%;
      box-sizing: border-box;
      background: #ffffff;
      color: #0f172a;
    }
    .health-input:focus {
      border-color: #e11d48;
    }
    .health-calc-btn {
      grid-column: 1 / -1;
      background: linear-gradient(135deg, #e11d48, #be123c);
      color: #fff;
      border: none;
      padding: 11px;
      border-radius: 12px;
      font-size: 13.5px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25);
      transition: all .2s;
      margin-top: 4px;
      width: 100%;
      box-sizing: border-box;
    }
    .health-calc-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(225, 29, 72, 0.35);
    }
    .health-doc-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 12px 14px;
      border-radius: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      margin-bottom: 8px;
      transition: all .2s;
      gap: 10px;
    }
    .health-doc-item.today {
      background: #fff1f2;
      border-color: #fda4af;
      box-shadow: 0 2px 10px rgba(225, 29, 72, 0.12);
    }
    .clinic-filter-bar {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 6px;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      width: 100%;
    }
    .clinic-filter-bar::-webkit-scrollbar { display: none; }
    .clinic-filter-chip {
      padding: 5px 11px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      cursor: pointer;
      white-space: nowrap;
      transition: all .15s;
      user-select: none;
    }
    .clinic-filter-chip.active {
      background: #e11d48;
      color: #ffffff;
      border-color: #e11d48;
      box-shadow: 0 2px 6px rgba(225, 29, 72, 0.25);
    }
    .clinic-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 8px;
    }
    .clinic-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: all .2s;
      box-sizing: border-box;
      width: 100%;
    }
    .clinic-card:hover {
      border-color: #f43f5e;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(225, 29, 72, 0.08);
    }
    .clinic-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }
    .clinic-name {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }
    .clinic-deal-badge {
      font-size: 11px;
      font-weight: 800;
      background: #dcfce7;
      color: #15803d;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #86efac;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .clinic-actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
      padding-top: 6px;
      border-top: 1px dashed #e2e8f0;
      flex-wrap: wrap;
    }
    .clinic-btn {
      font-size: 11.5px;
      font-weight: 700;
      padding: 5px 10px;
      border-radius: 8px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: 1px solid transparent;
      cursor: pointer;
    }
    .clinic-btn-map {
      background: #f0fdf4;
      color: #166534;
      border-color: #bbf7d0;
    }
    .clinic-btn-call {
      background: #eff6ff;
      color: #1e40af;
      border-color: #bfdbfe;
    }

    /* 📱 手機端響應式強化防爆框 (統一規格: max-width 480px, max-height 88vh, radius: 20px) */
    @media (max-width: 600px) {
      .health-modal-backdrop {
        padding: 14px 10px;
      }
      .health-modal-card {
        max-width: 480px;
        max-height: 88vh;
        border-radius: 20px;
      }
      .health-header {
        padding: 12px 14px;
      }
      .health-header-title {
        font-size: 15px;
      }
      .health-tabs-bar {
        padding: 4px 8px 0;
        gap: 4px;
      }
      .health-tab-btn {
        padding: 8px 10px;
        font-size: 12px;
      }
      .health-body {
        padding: 12px;
        gap: 10px;
      }
      .health-calc-grid {
        grid-template-columns: 1fr;
        gap: 8px;
      }
      .clinic-actions {
        flex-direction: column;
      }
      .clinic-btn {
        justify-content: center;
        width: 100%;
        box-sizing: border-box;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // ── 4. 建立 Modal DOM ──
  const modalDiv = document.createElement("div");
  modalDiv.className = "health-modal-backdrop";
  modalDiv.id = "healthCareModal";
  modalDiv.innerHTML = `
    <div class="health-modal-card" onclick="event.stopPropagation()">
      <div class="health-header">
        <div class="health-header-title">
          <span>💖</span>
          <span>健諮中心 ＆ 特約就醫減脂指南</span>
          <span class="health-badge-rose">惠蓀堂 1F/4F</span>
        </div>
        <button class="health-close-btn" onclick="closeHealthCareGuide()" title="關閉">✕</button>
      </div>

      <div class="health-tabs-bar">
        <button class="health-tab-btn active" id="healthTabBtn-doctors" onclick="switchHealthTab('doctors')">
          🩺 醫師駐診
        </button>
        <button class="health-tab-btn" id="healthTabBtn-clinics" onclick="switchHealthTab('clinics')">
          🏥 0元特約診所
        </button>
        <button class="health-tab-btn" id="healthTabBtn-inbody" onclick="switchHealthTab('inbody')">
          ⚖️ 體脂 InBody
        </button>
        <button class="health-tab-btn" id="healthTabBtn-gear" onclick="switchHealthTab('gear')">
          🧰 急救箱借用
        </button>
        <button class="health-tab-btn" id="healthTabBtn-counseling" onclick="switchHealthTab('counseling')">
          💖 心理諮商
        </button>
      </div>

      <div class="health-body" id="healthBodyContent">
        <!-- 動態渲染分頁內容 -->
      </div>
    </div>
  `;
  document.body.appendChild(modalDiv);

  modalDiv.addEventListener("click", function (e) {
    if (e.target === modalDiv) closeHealthCareGuide();
  });

  // ── 5. 分頁渲染函式 ──

  // 抽屜 1：惠蓀堂 1F 校內醫師免健保卡免費駐診時刻表
  function renderDoctorsTab() {
    const today = new Date().getDay(); // 0 is Sunday, 1-5 is Mon-Fri
    return `
      <div class="health-highlight-banner">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
          <div>
            <div style="font-weight:900; font-size:15px; color:#9f1239; display:flex; align-items:center; gap:6px;">
              <span>🩺</span> 惠蓀堂 1F 醫師校內免費駐診
            </div>
            <div style="font-size:12px; color:#be123c; margin-top:4px; line-height:1.55;">
              免健保卡、免掛號費！興大聘請 <strong>5 大專科院長與主任級主治醫師</strong>到校一對一門診諮詢、外傷急症評估與綠色通道專業轉診建議。
            </div>
          </div>
          <span style="background:#e11d48; color:#fff; font-size:10.5px; font-weight:800; padding:2px 7px; border-radius:6px; white-space:nowrap;">校園專屬 0 元</span>
        </div>
      </div>

      <div class="health-card-box">
        <div style="font-weight:900; font-size:13.5px; color:#0f172a; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
          <span>📅</span> 週一至週五 5 大專科駐診排班表
        </div>

        <div>
          ${CAMPUS_DOCTOR_SCHEDULE.map(d => {
            const isToday = d.day === today;
            return `
              <div class="health-doc-item ${isToday ? 'today' : ''}">
                <div style="flex:1; min-width:0;">
                  <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    <span style="font-weight:900; font-size:13px; color:${isToday ? '#be123c' : '#1e293b'};">${d.dayName} ${d.time}</span>
                    <span style="font-size:11.5px; font-weight:800; color:#e11d48; background:#fff; padding:1px 6px; border-radius:4px; border:1px solid #fecdd3;">${d.dept}</span>
                    ${isToday ? `<span style="font-size:10px; background:#e11d48; color:#fff; padding:1px 5px; border-radius:4px; font-weight:800;">🔥 今天值班</span>` : ''}
                  </div>
                  <div style="font-size:12px; color:#475569; margin-top:3px;">
                    <strong>${d.doc}</strong> · <span style="color:#64748b;">${d.title}</span>
                  </div>
                  <div style="font-size:11px; color:#64748b; margin-top:2px; line-height:1.45;">
                    ${d.desc}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="background:#fff1f2; border:1px solid #fecdd3; border-radius:10px; padding:10px; margin-top:10px; font-size:11.5px; color:#9f1239; line-height:1.6;">
          📍 <strong>駐診地點</strong>：惠蓀堂 1 樓衛生保健組門診室（寒暑假及例假日停診）。<br>
          📞 <strong>校內分機</strong>：04-22840241 轉 14（可提前電話確認當日醫師排班動態）。
        </div>
      </div>
    `;
  }

  // 抽屜 2：0元特約診所庫（分類抽屜：牙醫/感冒/身心/眼科/中醫/外科/急診）
  function renderClinicsTab() {
    return `
      <div class="health-highlight-banner" style="background:linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-color:#bbf7d0;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
          <div>
            <div style="font-weight:900; font-size:15px; color:#166534; display:flex; align-items:center; gap:6px;">
              <span>🏥</span> 興大周邊特約醫療院所（出示學生證免收掛號費）
            </div>
            <div style="font-size:12px; color:#15803d; margin-top:4px; line-height:1.55;">
              生病看診不用花冤枉錢！出示興大學生證享專案掛號費減免（每次現省 <strong>$150～$200</strong>，健保法定部分負擔自付）。
            </div>
          </div>
          <span style="background:#16a34a; color:#fff; font-size:10.5px; font-weight:800; padding:2px 7px; border-radius:6px; white-space:nowrap;">現省掛號費</span>
        </div>
      </div>

      <div class="health-card-box">
        <div style="font-weight:900; font-size:13px; color:#0f172a; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
          <span>🏷️</span> 點擊科別快速切換抽屜：
        </div>

        <!-- 8 大分類抽屜 Filter Chips -->
        <div class="clinic-filter-bar" id="clinicFilterBar">
          <button class="clinic-filter-chip ${currentClinicCat === 'all' ? 'active' : ''}" onclick="filterClinics('all')">全部特約 (${CONTRACTED_CLINICS.length})</button>
          <button class="clinic-filter-chip ${currentClinicCat === 'dental' ? 'active' : ''}" onclick="filterClinics('dental')">🦷 牙醫專科</button>
          <button class="clinic-filter-chip ${currentClinicCat === 'ent' ? 'active' : ''}" onclick="filterClinics('ent')">🩺 感冒 / 家醫</button>
          <button class="clinic-filter-chip ${currentClinicCat === 'psych' ? 'active' : ''}" onclick="filterClinics('psych')">🧠 身心 / 精神科</button>
          <button class="clinic-filter-chip ${currentClinicCat === 'eye' ? 'active' : ''}" onclick="filterClinics('eye')">👀 眼科專科</button>
          <button class="clinic-filter-chip ${currentClinicCat === 'tcm' ? 'active' : ''}" onclick="filterClinics('tcm')">🌿 中醫傷科針灸</button>
          <button class="clinic-filter-chip ${currentClinicCat === 'gi_surg' ? 'active' : ''}" onclick="filterClinics('gi_surg')">🩹 外科 / 腸胃</button>
          <button class="clinic-filter-chip ${currentClinicCat === 'hosp' ? 'active' : ''}" onclick="filterClinics('hosp')">🏥 綜合醫院 / 急診</button>
        </div>

        <!-- 診所列表容器 -->
        <div class="clinic-list" id="clinicListContainer">
          ${renderClinicCards(currentClinicCat)}
        </div>
      </div>
    `;
  }

  function renderClinicCards(cat) {
    const list = cat === 'all' ? CONTRACTED_CLINICS : CONTRACTED_CLINICS.filter(c => c.cat === cat);
    if (!list || list.length === 0) {
      return `<div style="text-align:center; padding:20px; color:#94a3b8; font-size:13px;">該分類暫無診所資料</div>`;
    }
    return list.map(c => `
      <div class="clinic-card">
        <div class="clinic-card-top">
          <div>
            <span style="font-size:11px; color:#64748b; font-weight:700;">${c.catLabel}</span>
            <div class="clinic-name">${c.name}</div>
          </div>
          <span class="clinic-deal-badge">${c.deal}</span>
        </div>
        <div style="font-size:11.5px; color:#475569; line-height:1.45;">
          ${c.note}
        </div>
        <div style="font-size:11.5px; color:#64748b;">
          📍 ${c.address}
        </div>
        <div class="clinic-actions">
          <a class="clinic-btn clinic-btn-map" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.name + ' ' + c.address)}" target="_blank" rel="noopener">
            📍 地圖導航
          </a>
          <a class="clinic-btn clinic-btn-call" href="tel:${c.phone.replace(/[^0-9]/g, '')}">
            📞 電話預約 (${c.phone})
          </a>
        </div>
      </div>
    `).join('');
  }

  // 抽屜 3：體脂 InBody ＆ 吃貨贖罪券體態計算機（響應式防爆框）
  function renderInBodyTab() {
    return `
      <!-- 免費 InBody 介紹 -->
      <div class="health-highlight-banner">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
          <div>
            <div style="font-weight:900; font-size:15px; color:#9f1239; display:flex; align-items:center; gap:6px;">
              <span>⚖️</span> 惠蓀堂 1F 隱藏羊毛：免費 InBody 身體組成分析儀
            </div>
            <div style="font-size:12px; color:#be123c; margin-top:4px; line-height:1.55;">
              外面健身房量一次要 <strong>$200～$500</strong>，興大同學憑學生證於惠蓀堂 1 樓衛保組大廳<strong>完全免費、自主隨到隨測</strong>！
            </div>
          </div>
          <span style="background:#e11d48; color:#fff; font-size:10.5px; font-weight:800; padding:2px 7px; border-radius:6px; white-space:nowrap;">校園專屬 0 元</span>
        </div>
        
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-top:10px; font-size:11.5px; text-align:center;">
          <div style="background:#ffffff; padding:7px 4px; border-radius:10px; border:1px solid #fecdd3; min-width:0;">
            <div style="font-weight:800; color:#e11d48;">💪 骨骼肌重</div>
            <div style="color:#64748b; font-size:10.5px;">肌肉量精準解析</div>
          </div>
          <div style="background:#ffffff; padding:7px 4px; border-radius:10px; border:1px solid #fecdd3; min-width:0;">
            <div style="font-weight:800; color:#e11d48;">🔥 體脂率 / 內臟</div>
            <div style="color:#64748b; font-size:10.5px;">防大一幸福肥</div>
          </div>
          <div style="background:#ffffff; padding:7px 4px; border-radius:10px; border:1px solid #fecdd3; min-width:0;">
            <div style="font-weight:800; color:#e11d48;">⚡ 基礎代謝率</div>
            <div style="color:#64748b; font-size:10.5px;">每日燃脂基準值</div>
          </div>
        </div>
      </div>

      <!-- 興健康體健班介紹（知名特聘教授代言） -->
      <div class="health-card-box" style="border-left:4px solid #f43f5e;">
        <div style="font-weight:800; font-size:13.5px; color:#0f172a; display:flex; align-items:center; gap:6px;">
          <span>🥗</span> 【興健康講堂】體健班 ＆ 專任營養師諮詢
          <span style="font-size:10.5px; background:#fce7f3; color:#be185d; padding:1px 6px; border-radius:4px; font-weight:700;">名師代言加持</span>
        </div>
        <p style="font-size:12px; color:#475569; margin-top:6px; line-height:1.6;">
          本系列健康促進活動<strong>曾由校內知名特聘教授親自受邀擔任活動代言人</strong>大力推薦！由衛保組專任營養師郭雅娟親自領軍，針對體脂偏高（男性體脂率 &gt; 25%、女性體脂率 &gt; 30%）同學開放優先報名免費體態雕塑實體班，提供前後測 InBody 專業比對、運動處方與飲食減脂指導。
        </p>
        <div style="font-size:11.5px; color:#9f1239; background:#fff1f2; padding:6px 10px; border-radius:8px; margin-top:6px;">
          💡 <strong>營養師預約地點</strong>：惠蓀堂 1 樓衛生保健組（校內分機 04-22840241 轉 14）。
        </div>
      </div>

      <!-- 吃貨贖罪券：大一體態與熱量試算器（防爆框彈性排版） -->
      <div class="health-card-box">
        <div style="font-weight:800; font-size:13.5px; color:#0f172a; display:flex; align-items:center; gap:6px;">
          <span>🎯</span> 吃貨贖罪券：大一體態 ＆ BMR 快速自測儀
        </div>
        <div style="font-size:12px; color:#64748b; margin-top:2px;">
          剛吃完忠孝夜市或炸物宵夜心慌慌？快速估算你的基礎代謝與體態等級：
        </div>
        
        <div class="health-calc-grid">
          <div class="health-input-group">
            <label class="health-label">性別</label>
            <select class="health-input" id="calcGender">
              <option value="male">男生 (Male)</option>
              <option value="female">女生 (Female)</option>
            </select>
          </div>
          <div class="health-input-group">
            <label class="health-label">年齡 (歲)</label>
            <input type="number" class="health-input" id="calcAge" value="18" min="15" max="80">
          </div>
          <div class="health-input-group">
            <label class="health-label">身高 (cm)</label>
            <input type="number" class="health-input" id="calcHeight" placeholder="例如 170" value="170">
          </div>
          <div class="health-input-group">
            <label class="health-label">體重 (kg)</label>
            <input type="number" class="health-input" id="calcWeight" placeholder="例如 62" value="62">
          </div>
          <button class="health-calc-btn" onclick="runBMRCalculation()">
            ⚡ 立即計算 BMI 與基礎代謝率
          </button>
        </div>

        <div id="calcResultBox" style="display:none; margin-top:12px; background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:12px; padding:12px; width:100%; box-sizing:border-box;">
          <!-- 計算結果動態注入 -->
        </div>
      </div>
    `;
  }

  // 抽屜 4：急救箱借用 ＆ 拐杖輪椅 ＆ 學保
  function renderGearTab() {
    return `
      <!-- 免費急救箱外借（宿營/系隊必備） -->
      <div class="health-card-box" style="border-left:4px solid #10b981;">
        <div style="font-weight:900; font-size:14px; color:#0f172a; display:flex; align-items:center; gap:6px;">
          <span>🎒</span> 系隊比賽 ＆ 迎新宿營：免費借用簡易急救箱
        </div>
        <p style="font-size:12px; color:#475569; margin-top:6px; line-height:1.6;">
          系隊打大醫盃/大資盃、系學會辦迎新宿營不用自己花錢買醫藥箱！憑學生證或社團公文至惠蓀堂 1 樓衛保組，<strong>單次活動最多可免費外借 2 盒</strong>！
        </p>
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:10px; margin-top:8px; font-size:11.5px; color:#166534; line-height:1.6;">
          <strong>急救箱內裝齊全耗材：</strong> 生理食鹽水 1瓶、優碘 1瓶、透氣膠帶 1卷、滅菌紗布（2號/3號/4號各1包）、運動軟膏 1條、醫療專用剪刀 1把、OK繃 2片、滅菌棉棒 2包。借期至活動結束後次日歸還。
        </div>
      </div>

      <!-- 免費輪椅與鋁合金拐杖借用 -->
      <div class="health-card-box" style="border-left:4px solid #3b82f6;">
        <div style="font-weight:900; font-size:14px; color:#0f172a; display:flex; align-items:center; gap:6px;">
          <span>🦯</span> 運動扭傷骨折：免費借用鋁合金拐杖 ＆ 輪椅
        </div>
        <p style="font-size:12px; color:#475569; margin-top:6px; line-height:1.6;">
          在校內打球腳翻船、骨折或車禍行動不便時，憑學生證至惠蓀堂 1 樓衛保組填單即可免費借用：
        </p>
        <ul style="font-size:12px; color:#475569; margin:6px 0 0 18px; line-height:1.6;">
          <li><strong>鋁合金拐杖</strong>：每人限借 2 支（借期以 1 個月為原則）。</li>
          <li><strong>四腳拐杖</strong>：每人限借 1 支（借期以 1 個月為原則）。</li>
          <li><strong>輪椅</strong>：每人限借 1 輛（借期以 1 個月為原則）。</li>
          <li><strong>冰敷袋 / 熱敷袋</strong>：急症發炎可借用並索取冰塊冰敷。</li>
        </ul>
      </div>

      <!-- 學生團體保險（學保）理賠防跑錯提醒 -->
      <div class="health-card-box" style="background:#fffbeb; border:1.5px solid #fef3c7;">
        <div style="font-weight:900; font-size:14px; color:#92400e; display:flex; align-items:center; gap:6px;">
          <span>💰</span> 重要：學生團體保險（學保）理賠在「惠蓀堂 2F 生輔組」！
        </div>
        <p style="font-size:12px; color:#78350f; margin-top:6px; line-height:1.6;">
          同學常誤跑 1 樓衛保組，請記得：<strong>1 樓負責外傷換藥，2 樓生活輔導組才是辦理全球人壽學保退費的窗口！</strong>
        </p>
        <div style="font-size:11.5px; color:#92400e; margin-top:6px; line-height:1.55;">
          <strong>事故 2 年內均可申請理賠！備齊 5 寶直奔 2 樓：</strong><br>
          1. 診斷證明書（正本或蓋醫院章副本）<br>
          2. 醫療收據（正本或蓋醫院章副本）<br>
          3. 事故當學期學雜費繳費證明單（第一銀行第e學雜費網下載）<br>
          4. 學生本人存摺封面影本<br>
          5. 理賠申請書（生輔組網站下載或現場領取）
        </div>
      </div>
    `;
  }

  // 抽屜 5：心理諮商 ＆ 24H 緊急求助
  function renderCounselingTab() {
    return `
      <!-- 惠蓀堂 4F 心理諮商 161 模式 -->
      <div class="health-highlight-banner" style="background:linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-color:#fbcfe8;">
        <div style="font-weight:900; font-size:15px; color:#9d174d; display:flex; align-items:center; gap:6px;">
          <span>💖</span> 惠蓀堂 4F 心理諮商組：完全免費 6 次專業會談
        </div>
        <p style="font-size:12px; color:#831843; margin-top:4px; line-height:1.6;">
          在外面自費心理諮商一小時要 $2,500，興大每學期提供在學學生 <strong>完全免費 6 次個別心理諮商（161 模式）</strong>，由專業心理師一對一陪伴，室友磨合、學業壓力、戀愛迷惘、人際關係通通能聊！
        </p>
        <div style="background:#fff; border:1px solid #fbcfe8; border-radius:10px; padding:10px; margin-top:8px;">
          <div style="font-size:12px; font-weight:800; color:#db2777;">⚡ 7 天極速媒合通關秘笈：</div>
          <div style="font-size:11.5px; color:#475569; margin-top:3px; line-height:1.5;">
            至「興大單一入口 ➔ 諮商輔導申請暨轉介」填寫線上預約時，<strong>務必勾選 5 個（含）以上可晤談時段</strong>，中心將在 <strong>1 週內（7 個工作天）</strong> 快速媒合心理師！若前 2 次覺得不合適，還可申請更換心理師。
          </div>
        </div>
      </div>

      <!-- 24H 緊急校安與求助專線 -->
      <div class="health-card-box">
        <div style="font-weight:900; font-size:14px; color:#0f172a; display:flex; align-items:center; gap:6px; margin-bottom:8px;">
          <span>🚨</span> 興大校園 24H 緊急求助專線
        </div>
        <div style="display:flex; flex-direction:column; gap:6px; font-size:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:8px 10px; border-radius:8px; gap:8px;">
            <div>
              <strong>🛡️ 興大校安中心 24H 緊急專線</strong>
              <div style="font-size:10.5px; color:#64748b;">半夜急病救護、校園突發意外通報</div>
            </div>
            <a href="tel:0422870885" style="background:#e11d48; color:#fff; padding:5px 10px; border-radius:6px; font-size:12px; font-weight:800; text-decoration:none; white-space:nowrap;">04-22870885</a>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:8px 10px; border-radius:8px; gap:8px;">
            <div>
              <strong>🩹 惠蓀堂 1F 衛生保健組</strong>
              <div style="font-size:10.5px; color:#64748b;">體檢報告核銷、急救箱外借、換藥</div>
            </div>
            <a href="tel:0422840241" style="background:#0284c7; color:#fff; padding:5px 10px; border-radius:6px; font-size:12px; font-weight:800; text-decoration:none; white-space:nowrap;">04-22840241</a>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:8px 10px; border-radius:8px; gap:8px;">
            <div>
              <strong>🌙 衛福部安心專線 (24H 免費)</strong>
              <div style="font-size:10.5px; color:#64748b;">情緒低落、夜間即時心理支持</div>
            </div>
            <a href="tel:1925" style="background:#16a34a; color:#fff; padding:5px 10px; border-radius:6px; font-size:12px; font-weight:800; text-decoration:none; white-space:nowrap;">撥打 1925</a>
          </div>
        </div>
      </div>
    `;
  }

  // ── 6. 互動邏輯：切換分頁 ──
  window.switchHealthTab = function (tab) {
    currentActiveTab = tab;
    document.querySelectorAll(".health-tab-btn").forEach(b => b.classList.remove("active"));
    const activeBtn = document.getElementById("healthTabBtn-" + tab);
    if (activeBtn) activeBtn.classList.add("active");

    const container = document.getElementById("healthBodyContent");
    if (!container) return;

    if (tab === "doctors") container.innerHTML = renderDoctorsTab();
    else if (tab === "clinics") container.innerHTML = renderClinicsTab();
    else if (tab === "inbody") container.innerHTML = renderInBodyTab();
    else if (tab === "gear") container.innerHTML = renderGearTab();
    else if (tab === "counseling") container.innerHTML = renderCounselingTab();

    container.scrollTop = 0;
  };

  // ── 7. 互動邏輯：篩選特約診所 ──
  window.filterClinics = function (cat) {
    currentClinicCat = cat;
    document.querySelectorAll(".clinic-filter-chip").forEach(c => c.classList.remove("active"));
    const container = document.getElementById("clinicListContainer");
    if (container) container.innerHTML = renderClinicCards(cat);
    
    // 更新按鈕樣式
    const activeChip = Array.from(document.querySelectorAll(".clinic-filter-chip")).find(el => {
      const oc = el.getAttribute("onclick");
      return oc && oc.includes(`'${cat}'`);
    });
    if (activeChip) activeChip.classList.add("active");
  };

  // ── 8. 互動邏輯：BMR ＆ BMI 計算機（自適應防爆框） ──
  window.runBMRCalculation = function () {
    const gender = document.getElementById("calcGender").value;
    const age = parseFloat(document.getElementById("calcAge").value) || 18;
    const h = parseFloat(document.getElementById("calcHeight").value) || 170;
    const w = parseFloat(document.getElementById("calcWeight").value) || 60;

    const bmi = (w / ((h / 100) * (h / 100))).toFixed(1);
    
    // Harris-Benedict 基礎代謝率公式
    let bmr = 0;
    if (gender === "male") {
      bmr = Math.round(66.5 + (13.75 * w) + (5.003 * h) - (6.75 * age));
    } else {
      bmr = Math.round(655.1 + (9.563 * w) + (1.850 * h) - (4.676 * age));
    }

    let bmiStatus = "正常標準";
    let statusColor = "#16a34a";
    if (bmi < 18.5) { bmiStatus = "體重過輕"; statusColor = "#d97706"; }
    else if (bmi >= 24 && bmi < 27) { bmiStatus = "過重邊緣"; statusColor = "#d97706"; }
    else if (bmi >= 27) { bmiStatus = "輕度肥胖"; statusColor = "#dc2626"; }

    const resultBox = document.getElementById("calcResultBox");
    if (!resultBox) return;

    resultBox.style.display = "block";
    resultBox.innerHTML = `
      <div style="font-weight:800; font-size:13.5px; color:#166534; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
        <span>📊</span> 體態與熱量估算結果：
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; margin:6px 0;">
        <div style="display:flex; justify-content:space-between; align-items:center; background:#ffffff; padding:8px 12px; border-radius:8px; border:1px solid #bbf7d0; flex-wrap:wrap; gap:4px;">
          <span style="font-size:12.5px; color:#334155; font-weight:700;">BMI 身體質量指數</span>
          <span style="color:${statusColor}; font-weight:900; font-size:13px;">${bmi} (${bmiStatus})</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; background:#ffffff; padding:8px 12px; border-radius:8px; border:1px solid #bbf7d0; flex-wrap:wrap; gap:4px;">
          <span style="font-size:12.5px; color:#334155; font-weight:700;">基礎代謝率 (BMR)</span>
          <span style="color:#e11d48; font-weight:900; font-size:13px;">約 ${bmr} kcal / 天</span>
        </div>
      </div>
      
      <!-- 衛教與標準對照表（防爆框垂直列表） -->
      <div style="background:#ffffff; border-radius:8px; border:1px solid #bbf7d0; padding:8px 10px; margin-top:8px; font-size:11px; color:#475569;">
        <div style="font-weight:800; color:#166534; margin-bottom:4px;">📋 衛生福利部 BMI 體重標準對照：</div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding:2px 0;"><span>過輕：&lt; 18.5</span><span style="color:#64748b;">建議適當增加營養與肌肉</span></div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding:2px 0;"><span>正常：18.5 ～ 24</span><span style="color:#16a34a; font-weight:700;">最理想健康體態</span></div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding:2px 0;"><span>過重：24 ～ 27</span><span style="color:#d97706;">注意少吃宵夜手搖飲</span></div>
        <div style="display:flex; justify-content:space-between; padding:2px 0;"><span>肥胖：≥ 27</span><span style="color:#dc2626; font-weight:700;">可報名惠蓀堂體健班</span></div>
      </div>

      <div style="font-size:11.5px; color:#475569; line-height:1.55; margin-top:8px; border-top:1px dashed #bbf7d0; padding-top:6px;">
        💡 <strong>貼心建議</strong>：公式無法測量「<strong>骨骼肌量、體脂率與內臟脂肪等級</strong>」。現在就去<strong>惠蓀堂 1 樓衛保組</strong>免費站上 InBody 測量，現場還有專任營養師免費為你解讀分析！
      </div>
    `;
  };

  // ── 9. 開啟與關閉 Modal ──
  window.openHealthCareGuide = function (targetTab = "doctors") {
    const modal = document.getElementById("healthCareModal");
    if (!modal) return;
    switchHealthTab(targetTab);
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  };

  window.closeHealthCareGuide = function () {
    const modal = document.getElementById("healthCareModal");
    if (modal) modal.style.display = "none";
    document.body.style.overflow = "";
    if (typeof window.resetBottomTabToHome === "function") {
      window.resetBottomTabToHome();
    }
  };

})();
