/**
 * 國立中興大學 (NCHU) 新生問答指南 - 核心多語系模組 (i18n Engine)
 * 支援: 繁體中文 (zh-TW)、英文 (en)，並保留印尼文 (id) 擴充插槽
 */

const I18N_STORAGE_KEY = "nchu_lang";

const I18N_LOCALES = {
  "zh-TW": {
    code: "zh-TW",
    label: "繁中",
    flag: "🇹🇼",
    nativeName: "繁體中文"
  },
  "en": {
    code: "en",
    label: "EN",
    flag: "🌐",
    nativeName: "English"
  },
  "id": {
    code: "id",
    label: "ID",
    flag: "🇮🇩",
    nativeName: "Bahasa Indonesia"
  }
};

const I18N_RESOURCES = {
  "zh-TW": {
    // 頂部導航
    brand_title: "新鮮人-興生FAQ問答指南(非官方)",
    ask_ai_btn: "🤖 問 新鮮人-興生FAQ",
    cat_summon_title: "點擊召喚守護興大的黑貓 🐾",
    lang_btn_title: "切換語言 / Switch Language",

    // 免責宣告橫幅
    banner_text: "📌 本站資料大部分整理自學校各處室公開網站與公告文件；部分生活、美食、課程心得為學長姐經驗分享之整理，可能因口述資訊不足而有些微出入。這裡是懶人包中心——幫你快速上手用，重要事項請以學校官方最新公告為準。",
    banner_dismiss_title: "今日不再顯示",

    // Hero 區塊
    hero_badge: "🌱 0 Token 快速解答 · 不用等 AI",
    ios_install_badge: "📲 加到 iPhone 主畫面 (全螢幕 App 體驗)",
    hero_title_prefix: "興生入學",
    hero_title_highlight: "生活與行政",
    hero_title_suffix: "問答指南",
    hero_desc: "選課、宿舍、繳費、交通、獎助學金⋯高頻問題都有完整步驟解答。搜尋或點分類，點開卡片看詳細指引。(但別再問怎麼交女朋友交男朋友了)",
    search_placeholder: "搜尋問題(如:選課、宿舍、繳費、機車、獎學金...)",

    // 熱門話題
    hot_topics_title: "🔥 熱門話題",
    hot_line_title: "新生 LINE 群總整理",
    hot_line_badge: "115學年度",
    hot_line_desc: "【115學年度】17 系群快速加入，找系群、提早認識同學！(有洋蔥🥲)",
    hot_transit_title: "返鄉與交通全攻略 🚌",
    hot_transit_badge: "高鐵·台鐵·公車·捷運",
    hot_transit_desc: "高鐵158直達、火車站公車、大慶捷運、市民卡10公里免費與Ubike！",
    hot_health_title: "健康健檢與特約診所 🏥",
    hot_health_badge: "0元掛號·免費InBody",
    hot_health_desc: "惠蓀堂1F免費測體脂/駐診、20+間免掛號費特約診所與吃貨贖罪券！",
    hot_star_title: "敢在火車上唱歌跳舞?!",
    hot_star_desc: "學術小講座講師 許凱桓——ATCC 全國 12 強的履歷之路",
    hot_food_title: "興大美食清單 📝",
    hot_food_desc: "學長姐認證美食地圖，十顆星必吃揚州炒飯也在裡面！",
    hot_ai_title: "問 新鮮人-興生FAQ",
    hot_ai_desc: "選課、宿舍、美食⋯任何問題直接問，24 小時在線！",

    // 控制欄位
    result_count_prefix: "共",
    result_count_suffix: "篇問答指引",
    result_count_custom_prefix: " (含 ",
    result_count_custom_suffix: " 筆自訂筆記)",
    btn_add_card: "新增卡片",
    btn_export_backup: "匯出備份",
    btn_import_card: "匯入",
    sort_label: "🔀 排序：",
    sort_default: "預設排序",
    sort_starred: "⭐ 收藏優先",
    sort_custom: "📝 自訂優先",
    layout_toggle: "📐 排版",
    layout_grid: "▦ 雙欄",
    layout_list: "☰ 單欄",

    // 分類 Chip
    chip_all: "✨ 全部",
    chip_starred: "⭐ 我的收藏",
    chip_custom: "📝 我的筆記",
    chip_slot: "🎰 美食拉霸機",
    chip_food: "🍜 興大美食地圖",
    chip_pickle: "🏓 匹克球社群",

    // 分類看板名稱
    board_course: "📚 選課與學分",
    board_dorm: "🏠 宿舍生活",
    board_register: "💰 註冊與學雜費",
    board_transport: "🛵 交通與周邊",
    board_admin: "🏛️ 獎助與行政",
    board_club: "🎉 社團與活動",
    board_custom: "📝 私房備忘",

    // 卡片內文
    card_more: "查看解答 →",
    card_copy: "複製問題與解答",
    card_edit: "編輯此卡片",
    card_del: "刪除此卡片",
    card_custom_badge: "✏️ 自訂",
    card_spare_title: "點擊新增自訂問答筆記",
    card_spare_desc: "記錄系所避雷、選課清單或私房生活筆記，安全保存在本機瀏覽器中。",
    card_spare_action: "＋ 點擊立即編輯筆記 →",

    // 詳情彈窗 Modal
    modal_star_add: "☆ 收藏",
    modal_star_active: "⭐ 已收藏",
    modal_edit: "✏️ 編輯",
    modal_copy_all: "📋 複製完整問答",
    modal_copy_success: "✅ 已複製到剪貼簿！",
    modal_verify_tip: "⚠️ 內容由官方公告與學長姐經驗整理，可能隨學年度變動，重要事項請以官網為準。",
    modal_report_bug: "🐛 回報這題有誤",
    modal_ask_ai_food: "🤖 打開 AI 聊天室隨便聊美食",
    link_oaa: "教務處",
    link_osa: "學務處",
    link_dorm: "住宿服務",
    link_homepage: "學校首頁",

    // 底部導航欄
    nav_home: "首頁指南",
    nav_portal: "常用系統",
    nav_health: "健諮中心",
    nav_transit: "即時交通",
    nav_food: "興大美食",

    // 傳送門彈窗
    portal_modal_title: "🎒 興大常用系統快捷傳送門",
    portal_modal_badge: "11 大核心系統",
    portal_modal_desc: "選課、單一入口、公務信箱、學雜費⋯一鍵直達＋帳密小抄！",
    portal_cat_all: "全部 🌟",
    portal_cat_academic: "課業選課 📚",
    portal_cat_life: "校園生活 🎒",
    portal_cat_system: "帳號網路 💻",
    portal_btn_go: "🚀 前往",
    portal_btn_copy: "🔗 複製網址",
    portal_btn_tip: "💡 帳密小抄",
    portal_tip_modal_title: "系統名稱",
    portal_tip_header: "💡 帳號與登入小抄提示",
    portal_tip_url_label: "官方網址：",
    portal_tip_copy: "📋 複製",
    portal_tip_go: "🚀 前往官方網站",
    portal_tip_close: "關閉",

    // 美食地圖彈窗
    food_map_title: "🍜 興大校園與生活圈美食地圖",
    food_map_badge: "303 間全收錄 (100%真實地址)",
    food_map_desc: "⚡ 支援路名商圈、步行時間、咖啡甜點、校內學餐與 Google 試算表即時同步！",
    food_search_placeholder: "🔍 搜尋店名、菜色（如：炒飯、拉麵、咖啡、宵夜、加飯、牛肉麵）...",
    food_label_street: "📍 商圈",
    food_label_cat: "🏷️ 分類",
    food_filter_all_street: "全部商圈",
    food_filter_campus: "🌲 校內學餐 (1~3分)",
    food_filter_xuefu: "🎓 學府路/頂橋 (89間)",
    food_filter_nanmen: "🌸 南門路 (含樹瓦咖啡)",
    food_filter_kangdi: "🌊 康堤/興大路/永東街",
    food_filter_nightmarket: "🏮 忠孝夜市",
    food_filter_gaogong: "🛵 高工/美村南路",
    food_filter_damaijia: "🛒 大買家/大明路",
    food_filter_nightmarket_extra: "🎪 旱溪/大慶夜市",
    food_filter_remote: "🚗 台中市區/遠距名店",

    food_filter_all_cat: "全部分類",
    food_filter_cafe: "☕ 咖啡甜點 (自習/下午茶)",
    food_filter_bento: "🍱 主食便當 (深森/燒臘)",
    food_filter_noodle: "🍜 平價麵食 (玩麵/拉麵)",
    food_filter_brunch: "🥐 早餐早午餐",
    food_filter_hotpot: "🍲 火鍋排餐",
    food_filter_snack: "🍢 夜市宵夜",
    food_filter_drink: "🧋 飲品點心 (興大牛奶)",
    food_filter_specialty: "🍕 特色美食",
    food_filter_walk_3: "⚡ 3分內 (校內免出門)",
    food_filter_walk_5: "🚶 5分內 (正門/側門)",
    food_btn_slot: "🎰 天命拉霸機",
    food_btn_ask_ai: "🤖 AI 助手聊美食",
    food_btn_close: "關閉",
    food_btn_report: "🚩 回報",
    food_btn_reported: "✅ 已回報",
    food_btn_consult: "💬 諮詢",
    food_btn_nav: "📍 導航",
    food_count_prefix: "共篩選出 ",
    food_count_suffix: " 間美食店家 (含真實門牌地址)",
    food_empty_tip: "🍽️ 找不到符合條件的美食店家，換個路段或關鍵字試試吧！",

    // 幽靈店家回報彈窗
    report_modal_title: "🚩 回報店家問題 / 幽靈店家",
    report_modal_desc: "感謝你協助維護興大美食地圖！若此店已歇業、改名、搬遷或資訊有誤，請勾選回報，管理員審核後將即時修正或下架。",
    report_store_name: "店家名稱",
    report_issue_type: "問題類型 (請勾選)",
    report_opt_closed: "🛑 已永久停業 / 幽靈店家 (現場找不到)",
    report_opt_addr: "📍 地址門牌或地圖定位錯誤",
    report_opt_hours: "⏰ 營業時間或公休日不對",
    report_opt_name: "📝 店名有誤 / 已搬遷更名",
    report_opt_other: "💬 其他錯誤或菜單更新說明",
    report_details_label: "補充說明 (選填)",
    report_details_placeholder: "例：上個月已經頂讓換招牌了、或者新地址在...",
    report_btn_cancel: "取消",
    report_btn_submit: "確認送出回報",
    report_btn_submitting: "⏳ 送出中...",
    report_success_alert: "✅ 感謝中興同學的熱心回報！\n我們已收到回報，管理員將於控制台審核查核！",

    // 黑貓彩蛋
    cat_egg_bubble: "🐾 喵～我是守護興大的黑貓！往下拉這麼用力做什麼？最上面空空如也喵～",
    cat_egg_tip: "🐾 黑貓爪痕到此一遊！上面有很多實用新生 FAQ 快去看看啦～",
    cat_empty_bubble: "喵～學長姐的資料庫裡找不到這個（抓頭 🐾）",
    cat_empty_tip: "試試看其他關鍵字，或是直接點下方問 AI 助手！",
    cat_empty_btn: "🤖 直接詢問 AI 助手",

    // 自訂卡片彈窗
    custom_add_title: "➕ 新增自訂問答卡片",
    custom_edit_title: "✏️ 編輯自訂問答卡片",
    custom_modal_desc: "內容安全儲存於本機瀏覽器，重新整理不遺失，隨時可修改與匯出！",
    custom_q_label: "📌 問答標題／主題（必填）",
    custom_q_placeholder: "例如：資工系大一必修選課避雷、男宿洗衣離峰時間...",
    custom_board_label: "🏷️ 所屬分類",
    custom_kw_label: "🏷️ 標籤關鍵字（逗號分隔）",
    custom_kw_placeholder: "例如：避雷, 必修, 教授",
    custom_a_label: "💬 詳細內容與步驟解答（必填）",
    custom_a_placeholder: "輸入詳細說明、避雷心得、推薦技巧或待辦提醒...",
    custom_del_btn: "🗑️ 刪除卡片",
    custom_save_btn: "💾 儲存卡片",

    // 匯入匯出
    import_title: "📥 匯入自訂問答卡片 (JSON)",
    import_desc: "將先前匯出或好友分享的 JSON 資料貼在下方即可自動匯入：",
    import_submit: "確認匯入",

    // 頁尾 Footer
    footer_text: "國立中興大學新生助手 · 靜態知識庫由 789 筆官方規章與學長姐智慧蒸餾而成（經去敏與去重驗證）<br>資訊僅供參考，最新規定請以各處室官方公告為準",

    // 聊天室專用 (chat.html)
    chat_title: "中興新生生活問答",
    chat_badge: "AI 學長姐",
    chat_subtitle: "國立中興大學 (NCHU) 專屬生活與行政諮詢",
    chat_font_size_btn: "Aa",
    chat_whitepaper_btn: "📜",
    chat_clear_btn: "清除對話",
    chat_persona_label: "🎭 TAIDE 語氣：",
    persona_senior: "🌲 老司機學長",
    persona_gentle: "💖 暖心學姐",
    persona_official: "📜 嚴謹教務處",
    chat_welcome_title: "哈囉！歡迎來到國立中興大學 🎉",
    chat_welcome_msg: "我是你的<strong>新生生活與行政問答助手</strong>，選課加簽、通識評價、各處室位置、特約美食或生活大小事都可以直接問我！😊",
    chat_input_placeholder: "輸入問題...（例如：通識課推薦？課外組在哪？特約優惠？）",
    chat_input_hint: "💡 按右上角「Aa」可切換字體大小",
    chat_model_status: "🟢 AI 學長姐即時連線 (免金鑰)",
    chat_food_map_chip: "🍜 興大美食地圖",
    chat_whitepaper_chip: "📜 倫理白皮書",
    chat_hot_label: "🔥 熱門：",
    chip_extra_curr: "📍 課外組位置",
    chip_course_select: "🎓 選課與加簽",
    chip_general_rec: "📚 通識課推薦",
    chip_dorm_supplies: "🛏️ 宿舍與採買",
    chip_bike_permit: "🚲 腳踏車與宿舍車證",
    chip_deals: "🏷️ 特約商家",
    chip_eng_waive: "📑 英文免修",

    // 白皮書
    whitepaper_modal_title: "📜 中興新生 AI 使用須知與資安倫理白皮書",
    whitepaper_badge: "資訊素養指引",
    whitepaper_sub: "國立中興大學 (NCHU) 專屬校園生活導覽、個資防護與 AI 學術倫理守則",
    whitepaper_btn_agree: "我已詳細閱讀並瞭解",

    // iOS 指引
    ios_modal_tag: "iOS 專屬推薦體驗",
    ios_modal_title: "將「興生FAQ」加入 iPhone 主畫面",
    ios_modal_desc: "為獲得最佳校園生活指引，強烈建議將本指南<b>加入手機主畫面</b>！享受<b>全螢幕無網址列干擾、極速秒開</b>的專屬 App 級體驗，查公車、選課與美食更隨手就來！",
    ios_step_1: "點擊 Safari 下方工具列中央的<b>「分享」圖示</b>",
    ios_step_1_sub: "分享按鈕 (下方工具列)",
    ios_step_2: "在選單中向下滑動，找到並點選<b>「加入主畫面」</b>",
    ios_step_2_sub: "➕ 加入主畫面 (Add to Home Screen)",
    ios_step_3: "點擊右上角的<b>「新增」</b>，桌面就會出現興生專屬圖示，點開即可全螢幕極速使用！",
    ios_btn_ok: "✨ 我瞭解了，馬上試試看！",
    ios_btn_skip: "先逛逛網頁版",

    // 115 LINE 彈窗
    line_modal_tag: "💬 115學年度 新生 LINE 群",
    line_modal_title: "115學年度 各系新生 LINE 群總整理 🙇",
    line_modal_desc: "本整理專屬 <b>115 學年度（119級）</b> 新生！各系的 LINE 群連結目前<b>只有資工系是「點了直接加入」</b>，其他科系的連結都是 QR Code 圖片形式，請用新鮮人-興生FAQ輸入你的科系，就會拿到該系的加入方式！",
    line_modal_cs_btn: "✅ 我是資工系，點我直接加入新生群！(LINE OpenChat)",
    line_modal_other_btn: "🔍 其他科系：直接看 115 學年度各系新生群連結列表",
    line_modal_footer: "已收錄科系（115學年度）：環工、應數、農藝、昆蟲、應經、台文、電資、食生、資工、材料、獸醫、生機、企管、中文、外文、會計、水保"
  },

  "en": {
    // Top Navigation
    brand_title: "NCHU Freshman Life & Admin FAQ Guide",
    ask_ai_btn: "🤖 Ask AI Assistant",
    cat_summon_title: "Click to summon NCHU Guardian Black Cat 🐾",
    lang_btn_title: "Switch Language / 切換語言",

    // Disclaimer Banner
    banner_text: "📌 Notice: Most information is sourced from official NCHU division websites and student experiences. This is a quick-start survival guide. For critical academic schedules and fees, always refer to official university announcements.",
    banner_dismiss_title: "Dismiss for today",

    // Hero Section
    hero_badge: "🌱 0-Token Instant Answers · No AI Lag",
    ios_install_badge: "📲 Add to iPhone Home Screen (Fullscreen App)",
    hero_title_prefix: "Freshman Survival &",
    hero_title_highlight: "Campus Admin",
    hero_title_suffix: "Guide",
    hero_desc: "Step-by-step verified answers for course registration, dorm life, tuition, transit, scholarships, and campus rules. (Please stop asking how to find a date though!)",
    search_placeholder: "Search topics (e.g. course, dorm, tuition, scooter, bike, bus, scholarship...)",

    // Hot Topics
    hot_topics_title: "🔥 Trending Topics",
    hot_line_title: "Freshman LINE Groups",
    hot_line_badge: "AY 2026-2027",
    hot_line_desc: "Direct join links & QR codes for 17+ department newcomer groups!",
    hot_transit_title: "Campus & Hometown Transit 🚌",
    hot_transit_badge: "HSR · TRA · Bus · Metro",
    hot_transit_desc: "Direct HSR Bus 158, train stations, Metro, 10km free bus card & YouBike!",
    hot_health_title: "Health Care & Free Clinic Deals 🏥",
    hot_health_badge: "NT$0 Registration · Free InBody",
    hot_health_desc: "Huisun Hall 1F free body fat tests/physicians, 20+ zero-fee clinic partners!",
    hot_star_title: "Singing & Dancing on Trains?!",
    hot_star_desc: "Campus speaker Kai-Huan Hsu — from NCHU to National Top 12 ATCC.",
    hot_food_title: "NCHU Foodie Radar 📝",
    hot_food_desc: "Senior-approved food map featuring 300+ local eats and Yangzhou fried rice!",
    hot_ai_title: "Ask AI Assistant",
    hot_ai_desc: "Instant answers for courses, dorms, dining, and regulations 24/7!",

    // Controls
    result_count_prefix: "Showing ",
    result_count_suffix: " FAQ guides",
    result_count_custom_prefix: " (incl. ",
    result_count_custom_suffix: " custom notes)",
    btn_add_card: "Add Note",
    btn_export_backup: "Export Backup",
    btn_import_card: "Import",
    sort_label: "🔀 Sort:",
    sort_default: "Default",
    sort_starred: "⭐ Starred First",
    sort_custom: "📝 Notes First",
    layout_toggle: "📐 Layout",
    layout_grid: "▦ 2-Col",
    layout_list: "☰ 1-Col",

    // Chips
    chip_all: "✨ All",
    chip_starred: "⭐ Starred",
    chip_custom: "📝 My Notes",
    chip_slot: "🎰 Food Slot",
    chip_food: "🍜 Food Map",
    chip_pickle: "🏓 Pickleball",

    // Boards
    board_course: "📚 Courses & Credits",
    board_dorm: "🏠 Dormitory Life",
    board_register: "💰 Tuition & Fees",
    board_transport: "🛵 Transit & Rules",
    board_admin: "🏛️ Admin & Aid",
    board_club: "🎉 Clubs & Activities",
    board_custom: "📝 Private Notes",

    // Card text
    card_more: "Read Answer →",
    card_copy: "Copy Question & Answer",
    card_edit: "Edit Note",
    card_del: "Delete Note",
    card_custom_badge: "✏️ Custom",
    card_spare_title: "Click to add a custom note",
    card_spare_desc: "Keep private survival notes, professor tips, and schedules safely stored in your local browser.",
    card_spare_action: "＋ Create Note Now →",

    // Detail Modal
    modal_star_add: "☆ Star",
    modal_star_active: "⭐ Starred",
    modal_edit: "✏️ Edit",
    modal_copy_all: "📋 Copy QA",
    modal_copy_success: "✅ Copied to clipboard!",
    modal_verify_tip: "⚠️ Information compiled from official NCHU sources & student experiences. Rules may vary by academic year. Always verify with official announcements.",
    modal_report_bug: "🐛 Report Correction",
    modal_ask_ai_food: "🤖 Ask AI about Food Nearby",
    link_oaa: "Academic Affairs (OAA)",
    link_osa: "Student Affairs (OSA)",
    link_dorm: "Housing Service",
    link_homepage: "NCHU Homepage",

    // Bottom Tab Bar
    nav_home: "Home",
    nav_portal: "Portals",
    nav_health: "Health",
    nav_transit: "Transit",
    nav_food: "Food",

    // Portals Modal
    portal_modal_title: "🎒 NCHU Core Campus Portals",
    portal_modal_badge: "11 Essential Systems",
    portal_modal_desc: "One-click access & login credential cheatsheets for courses, SSO, Webmail, and tuition!",
    portal_cat_all: "All 🌟",
    portal_cat_academic: "Academic 📚",
    portal_cat_life: "Campus Life 🎒",
    portal_cat_system: "Account & IT 💻",
    portal_btn_go: "🚀 Open",
    portal_btn_copy: "🔗 Copy URL",
    portal_btn_tip: "💡 Login Tips",
    portal_tip_modal_title: "System Details",
    portal_tip_header: "💡 Login Cheatsheet & Tips",
    portal_tip_url_label: "Official URL:",
    portal_tip_copy: "📋 Copy",
    portal_tip_go: "🚀 Open Official Site",
    portal_tip_close: "Close",

    // Food Map Modal
    food_map_title: "🍜 NCHU Campus & Neighborhood Food Map",
    food_map_badge: "303 Verified Stores with Real Addresses",
    food_map_desc: "⚡ Instant local eats, walk minutes, cafes, night markets, and live Google Sheets sync!",
    food_search_placeholder: "🔍 Search store, dish (e.g. fried rice, ramen, bento, coffee, latte, late night)...",
    food_label_street: "📍 Area",
    food_label_cat: "🏷️ Type",
    food_filter_all_street: "All Areas",
    food_filter_campus: "🌲 On-Campus (1~3m)",
    food_filter_xuefu: "🎓 Xuefu Rd. (Main Gate)",
    food_filter_nanmen: "🌸 Nanmen Rd. (Suwa Cafe)",
    food_filter_kangdi: "🌊 Kangdi / Xingda Rd.",
    food_filter_nightmarket: "🏮 Zhongxiao Night Mkt",
    food_filter_gaogong: "🛵 Gaogong & Meicun",
    food_filter_damaijia: "🛒 Daming Rd. Area",
    food_filter_nightmarket_extra: "🎪 Hanxi / Daqing Mkt",
    food_filter_remote: "🚗 Taichung Downtown",

    food_filter_all_cat: "All Categories",
    food_filter_cafe: "☕ Cafe & Dessert",
    food_filter_bento: "🍱 Bento & Meals",
    food_filter_noodle: "🍜 Noodles & Pasta",
    food_filter_brunch: "🥐 Breakfast & Brunch",
    food_filter_hotpot: "🍲 Hotpot & Steak",
    food_filter_snack: "🍢 Night Snacks",
    food_filter_drink: "🧋 Boba & Milk",
    food_filter_specialty: "🍕 International Eats",
    food_filter_walk_3: "⚡ Under 3m (On-Campus)",
    food_filter_walk_5: "🚶 Under 5m (Near Gate)",
    food_btn_slot: "🎰 Food Slot",
    food_btn_ask_ai: "🤖 Ask AI about Food",
    food_btn_close: "Close",
    food_btn_report: "🚩 Report",
    food_btn_reported: "✅ Reported",
    food_btn_consult: "💬 Ask AI",
    food_btn_nav: "📍 Map",
    food_count_prefix: "Found ",
    food_count_suffix: " stores (with exact addresses)",
    food_empty_tip: "🍽️ No stores matched your filters. Try another keyword or street area!",

    // Store Report Modal
    report_modal_title: "🚩 Report Store Issue / Closed Shop",
    report_modal_desc: "Thank you for keeping NCHU food map updated! If this store has closed, moved, or changed names, submit a report for review.",
    report_store_name: "Store Name",
    report_issue_type: "Issue Type (Select one)",
    report_opt_closed: "🛑 Permanently Closed / Ghost Store",
    report_opt_addr: "📍 Incorrect Address or GPS Location",
    report_opt_hours: "⏰ Incorrect Business Hours or Day-off",
    report_opt_name: "📝 Wrong Name / Relocated & Renamed",
    report_opt_other: "💬 Other Information / Menu Updates",
    report_details_label: "Additional Details (Optional)",
    report_details_placeholder: "e.g., Ownership transferred last month, or moved to...",
    report_btn_cancel: "Cancel",
    report_btn_submit: "Submit Report",
    report_btn_submitting: "⏳ Submitting...",
    report_success_alert: "✅ Thank you for your report!\nWe have received the correction and will review it in the admin hub.",

    // Cat Easter Egg
    cat_egg_bubble: "🐾 Meow~ I am NCHU Guardian Black Cat! Why are you pulling down so hard? There's nothing up here meow~",
    cat_egg_tip: "🐾 Black cat paw print left here! Check out the practical freshman FAQs above~",
    cat_empty_bubble: "Meow~ Senior database found no match for this (scratching head 🐾)",
    cat_empty_tip: "Try other keywords or tap below to ask our AI assistant!",
    cat_empty_btn: "🤖 Ask AI Assistant Directly",

    // Custom FAQ Modal
    custom_add_title: "➕ Add Custom Note",
    custom_edit_title: "✏️ Edit Custom Note",
    custom_modal_desc: "Saved safely in your browser localStorage. Persistent across refreshes, editable and exportable anytime!",
    custom_q_label: "📌 Topic / Title (Required)",
    custom_q_placeholder: "e.g., CS Freshman course traps, best laundry off-peak hours...",
    custom_board_label: "🏷️ Category",
    custom_kw_label: "🏷️ Keywords (Comma-separated)",
    custom_kw_placeholder: "e.g., professor, courses, dorm",
    custom_a_label: "💬 Details & Advice (Required)",
    custom_a_placeholder: "Type detailed advice, tips, reminders, or checklist...",
    custom_del_btn: "🗑️ Delete Note",
    custom_save_btn: "💾 Save Note",

    // Import/Export
    import_title: "📥 Import Custom Notes (JSON)",
    import_desc: "Paste previously exported JSON data below to restore or sync notes:",
    import_submit: "Confirm Import",

    // Footer
    footer_text: "National Chung Hsing University (NCHU) Freshman Assistant · Built on 789 verified campus rules & student advice.<br>For reference only. Always confirm official dates and fees with university divisions.",

    // Chat
    chat_title: "NCHU Freshman Assistant",
    chat_badge: "AI Senior",
    chat_subtitle: "National Chung Hsing University Life & Admin Advice",
    chat_font_size_btn: "Aa",
    chat_whitepaper_btn: "📜",
    chat_clear_btn: "Clear Chat",
    chat_persona_label: "🎭 Tone Style:",
    persona_senior: "🌲 Savvy Senior",
    persona_gentle: "💖 Warm Senior Sister",
    persona_official: "📜 Academic Affairs Office",
    chat_welcome_title: "Welcome to National Chung Hsing University (NCHU)! 🎉",
    chat_welcome_msg: "I am your <strong>Freshman Life & Academic Admin Assistant</strong>. Ask me anything about course registration, dorm life, office locations, dining deals, or campus survival rules! 😊",
    chat_input_placeholder: "Ask a question... (e.g. course add/drop? Where is Extracurricular Division? Bike permit?)",
    chat_input_hint: "💡 Click 'Aa' in the top right to change font size",
    chat_model_status: "🟢 AI Senior Connected (Zero Key Required)",
    chat_food_map_chip: "🍜 Food Map",
    chat_whitepaper_chip: "📜 Ethics Whitepaper",
    chat_hot_label: "🔥 Popular:",
    chip_extra_curr: "📍 Extracurricular Office",
    chip_course_select: "🎓 Course Add/Drop",
    chip_general_rec: "📚 Gen-Ed Course Tips",
    chip_dorm_supplies: "🛏️ Dorm Supplies",
    chip_bike_permit: "🚲 Bike & Scooter Rules",
    chip_deals: "🏷️ Student Discounts",
    chip_eng_waive: "📑 English Waiver",

    // Whitepaper
    whitepaper_modal_title: "📜 NCHU Freshman AI Ethics & Security Whitepaper",
    whitepaper_badge: "Information Literacy",
    whitepaper_sub: "Campus Survival Guide, Privacy Protection, and Responsible AI Guidelines for NCHU",
    whitepaper_btn_agree: "I Have Read & Understood",

    // iOS Modal
    ios_modal_tag: "Recommended iOS Experience",
    ios_modal_title: "Add 'NCHU FAQ' to iPhone Home Screen",
    ios_modal_desc: "For the smoothest campus life guide, we strongly recommend <b>adding this page to your iPhone Home Screen</b>! Enjoy a <b>fullscreen app-like experience with zero browser bar clutter</b> to quickly check buses, courses, and food!",
    ios_step_1: "Tap the <b>Share icon</b> at the center of the bottom Safari toolbar",
    ios_step_1_sub: "Share button (bottom bar)",
    ios_step_2: "Scroll down in the action sheet and select <b>'Add to Home Screen'</b>",
    ios_step_2_sub: "➕ Add to Home Screen",
    ios_step_3: "Tap <b>'Add'</b> in the top right corner. The NCHU FAQ icon will appear on your screen for instant fullscreen access!",
    ios_btn_ok: "✨ Got it, let's do it!",
    ios_btn_skip: "Browse Web Version for Now",

    // LINE Groups Modal
    line_modal_tag: "💬 AY 2026-2027 Freshman LINE Groups",
    line_modal_title: "Freshman Department LINE Community Directory 🙇",
    line_modal_desc: "This directory is curated for <b>Academic Year 2026-2027</b> newcomers! Direct open chat links and QR code groups are compiled here to help you connect with classmates early.",
    line_modal_cs_btn: "✅ Computer Science (CS) OpenChat - Click to Join!",
    line_modal_other_btn: "🔍 Other Departments: View Full LINE Links Directory",
    line_modal_footer: "Covered departments: Environmental Eng, Applied Math, Agronomy, Entomology, Applied Econ, Taiwan Lit, EECS, Food Science, CS, Materials, Vet Med, Bio-Industrial Mechatronics, Business Admin, Chinese, Foreign Lang, Accounting, Soil & Water Cons."
  },

  "id": {
    // Top Navigation (Bahasa Indonesia)
    brand_title: "Panduan FAQ Mahasiswa Baru NCHU",
    ask_ai_btn: "🤖 Tanya Asisten AI",
    cat_summon_title: "Klik untuk memanggil Kucing Hitam Penjaga NCHU 🐾",
    lang_btn_title: "Ganti Bahasa / Switch Language",

    // Banner
    banner_text: "📌 Perhatian: Sebagian besar data dihimpun dari pengumuman resmi divisi NCHU dan pengalaman senior. Ini adalah panduan ringkas orientasi. Untuk jadwal dan biaya penting, selalu merujuk ke pengumuman resmi universitas.",
    banner_dismiss_title: "Tutup untuk hari ini",

    // Hero
    hero_badge: "🌱 Jawaban Cepat 0-Token · Tanpa Menunggu AI",
    ios_install_badge: "📲 Tambahkan ke Layar Utama iPhone",
    hero_title_prefix: "Panduan Masuk &",
    hero_title_highlight: "Administrasi Kampus",
    hero_title_suffix: "NCHU",
    hero_desc: "Jawaban terverifikasi langkah demi langkah untuk pemilihan mata kuliah, asrama, biaya kuliah, transportasi, beasiswa, dan tata tertib kampus.",
    search_placeholder: "Cari topik (mata kuliah, asrama, SPP, motor, sepeda, bus, beasiswa...)",

    // Trending
    hot_topics_title: "🔥 Topik Populer",
    hot_line_title: "Grup LINE Mahasiswa Baru",
    hot_line_badge: "Tahun Akademik 2026-2027",
    hot_line_desc: "Tautan bergabung langsung untuk 17+ grup jurusan mahasiswa baru!",
    hot_transit_title: "Panduan Lengkap Transportasi 🚌",
    hot_transit_badge: "HSR · Kereta Api · Bus · MRT",
    hot_transit_desc: "Bus HSR 158 langsung, stasiun kereta, MRT, kartu bus gratis 10km & YouBike!",
    hot_health_title: "Kesehatan & Diskon Klinik Mitra 🏥",
    hot_health_badge: "Biaya Pendaftaran NT$0 · InBody Gratis",
    hot_health_desc: "Tes lemak InBody gratis di Huisun Hall 1F, 20+ klinik mitra bebas biaya daftar!",
    hot_star_title: "Menyanyi & Menari di Kereta?!",
    hot_star_desc: "Pembicara kampus Kai-Huan Hsu — dari NCHU ke Top 12 ATCC Nasional.",
    hot_food_title: "Daftar Kuliner NCHU 📝",
    hot_food_desc: "Peta kuliner rekomendasi senior dengan 300+ tempat makan dan nasi goreng Yangzhou!",
    hot_ai_title: "Tanya Asisten AI",
    hot_ai_desc: "Jawaban instan untuk mata kuliah, asrama, dan kuliner 24 jam nonstop!",

    // Controls
    result_count_prefix: "Menampilkan ",
    result_count_suffix: " panduan FAQ",
    result_count_custom_prefix: " (termasuk ",
    result_count_custom_suffix: " catatan pribadi)",
    btn_add_card: "Tambah Catatan",
    btn_export_backup: "Ekspor Cadangan",
    btn_import_card: "Impor",
    sort_label: "🔀 Urutkan:",
    sort_default: "Bawaan",
    sort_starred: "⭐ Favorit Dahulu",
    sort_custom: "📝 Catatan Dahulu",
    layout_toggle: "📐 Tata Letak",
    layout_grid: "▦ 2 Kolom",
    layout_list: "☰ 1 Kolom",

    // Chips
    chip_all: "✨ Semua",
    chip_starred: "⭐ Favorit",
    chip_custom: "📝 Catatan Saya",
    chip_slot: "🎰 Mesin Kuliner",
    chip_food: "🍜 Peta Kuliner",
    chip_pickle: "🏓 Pickleball",

    // Boards
    board_course: "📚 Kuliah & SKS",
    board_dorm: "🏠 Kehidupan Asrama",
    board_register: "💰 SPP & Registrasi",
    board_transport: "🛵 Transportasi & Aturan",
    board_admin: "🏛️ Administrasi & Bantuan",
    board_club: "🎉 UKM & Kegiatan",
    board_custom: "📝 Catatan Pribadi",

    // Card
    card_more: "Lihat Jawaban →",
    card_copy: "Salin Pertanyaan & Jawaban",
    card_edit: "Edit Catatan",
    card_del: "Hapus Catatan",
    card_custom_badge: "✏️ Pribadi",
    card_spare_title: "Klik untuk menambah catatan pribadi",
    card_spare_desc: "Simpan tips dosen, rencana studi, atau daftar belanja aman di browser lokal Anda.",
    card_spare_action: "＋ Buat Catatan Sekarang →",

    // Modal
    modal_star_add: "☆ Favorit",
    modal_star_active: "⭐ Tersimpan",
    modal_edit: "✏️ Edit",
    modal_copy_all: "📋 Salin FAQ",
    modal_copy_success: "✅ Berhasil disalin ke papan klip!",
    modal_verify_tip: "⚠️ Informasi dirangkum dari pengumuman resmi dan pengalaman senior. Harap konfirmasi dengan divisi terkait.",
    modal_report_bug: "🐛 Laporkan Kesalahan",
    modal_ask_ai_food: "🤖 Tanya AI tentang Kuliner",
    link_oaa: "Akademik (OAA)",
    link_osa: "Kemahasiswaan (OSA)",
    link_dorm: "Layanan Asrama",
    link_homepage: "Beranda NCHU",

    // Bottom Navigation
    nav_home: "Beranda",
    nav_portal: "Portal",
    nav_health: "Kesehatan",
    nav_transit: "Transportasi",
    nav_food: "Kuliner",

    // Portals
    portal_modal_title: "🎒 Portal Utama Kampus NCHU",
    portal_modal_badge: "11 Sistem Penting",
    portal_modal_desc: "Akses satu klik & contekan akun untuk sistem kuliah, SSO, Webmail, dan SPP!",
    portal_cat_all: "Semua 🌟",
    portal_cat_academic: "Akademik 📚",
    portal_cat_life: "Kehidupan Kampus 🎒",
    portal_cat_system: "Akun & Jaringan 💻",
    portal_btn_go: "🚀 Buka",
    portal_btn_copy: "🔗 Salin URL",
    portal_btn_tip: "💡 Tips Login",
    portal_tip_modal_title: "Detail Sistem",
    portal_tip_header: "💡 Tips & Panduan Login Akun",
    portal_tip_url_label: "URL Resmi:",
    portal_tip_copy: "📋 Salin",
    portal_tip_go: "🚀 Buka Situs Resmi",
    portal_tip_close: "Tutup",

    // Food Map
    food_map_title: "🍜 Peta Kuliner Kampus & Sekitar NCHU",
    food_map_badge: "303 Tempat Makan Terverifikasi",
    food_map_desc: "⚡ Cari tempat makan terdekat, waktu jalan kaki, kafe, pasar malam, dan sinkronisasi Google Sheets!",
    food_search_placeholder: "🔍 Cari toko, makanan (nasi goreng, ramen, bento, kopi, camilan malam)...",
    food_label_street: "📍 Area",
    food_label_cat: "🏷️ Kategori",
    food_filter_all_street: "Semua Area",
    food_filter_campus: "🌲 Dalam Kampus (1~3m)",
    food_filter_xuefu: "🎓 Jl. Xuefu (Gerbang Utama)",
    food_filter_nanmen: "🌸 Jl. Nanmen (Suwa Cafe)",
    food_filter_kangdi: "🌊 Kangdi / Xingda Rd.",
    food_filter_nightmarket: "🏮 Pasar Malam Zhongxiao",
    food_filter_gaogong: "🛵 Gaogong & Meicun",
    food_filter_damaijia: "🛒 Area Jl. Daming",
    food_filter_nightmarket_extra: "🎪 Pasar Malam Hanxi/Daqing",
    food_filter_remote: "🚗 Pusat Kota Taichung",

    food_filter_all_cat: "Semua Kategori",
    food_filter_cafe: "☕ Kafe & Makanan Penutup",
    food_filter_bento: "🍱 Bento & Makanan Pokok",
    food_filter_noodle: "🍜 Mie & Pasta",
    food_filter_brunch: "🥐 Sarapan & Brunch",
    food_filter_hotpot: "🍲 Hotpot & Steak",
    food_filter_snack: "🍢 Camilan Malam",
    food_filter_drink: "🧋 Minuman & Susu NCHU",
    food_filter_specialty: "🍕 Makanan Internasional",
    food_filter_walk_3: "⚡ Kurang 3m (Dalam Kampus)",
    food_filter_walk_5: "🚶 Kurang 5m (Dekat Gerbang)",
    food_btn_slot: "🎰 Mesin Kuliner",
    food_btn_ask_ai: "🤖 Tanya AI tentang Kuliner",
    food_btn_close: "Tutup",
    food_btn_report: "🚩 Lapor",
    food_btn_reported: "✅ Dilaporkan",
    food_btn_consult: "💬 Tanya AI",
    food_btn_nav: "📍 Peta",
    food_count_prefix: "Ditemukan ",
    food_count_suffix: " tempat makan (dengan alamat asli)",
    food_empty_tip: "🍽️ Tidak ada toko yang cocok. Coba kata kunci atau area lain!",

    // Report
    report_modal_title: "🚩 Laporkan Masalah Toko / Toko Tutup",
    report_modal_desc: "Terima kasih telah membantu memperbarui peta kuliner NCHU! Jika tempat ini tutup permanen atau pindah, laporkan di sini.",
    report_store_name: "Nama Toko",
    report_issue_type: "Jenis Masalah (Pilih salah satu)",
    report_opt_closed: "🛑 Tutup Permanen / Tidak Ditemukan",
    report_opt_addr: "📍 Alamat atau Lokasi Peta Salah",
    report_opt_hours: "⏰ Jam Buka atau Hari Libur Salah",
    report_opt_name: "📝 Nama Salah / Pindah & Ganti Nama",
    report_opt_other: "💬 Catatan Lain / Update Menu",
    report_details_label: "Keterangan Tambahan (Opsional)",
    report_details_placeholder: "misal: sudah ganti pemilik bulan lalu, atau pindah ke...",
    report_btn_cancel: "Batal",
    report_btn_submit: "Kirim Laporan",
    report_btn_submitting: "⏳ Mengirim...",
    report_success_alert: "✅ Terima kasih atas laporan Anda!\nKami telah menerima data ini untuk ditinjau oleh admin.",

    // Cat Easter Egg
    cat_egg_bubble: "🐾 Meow~ Aku Kucing Hitam Penjaga NCHU! Mengapa ditarik begitu kuat? Di atas sini kosong meow~",
    cat_egg_tip: "🐾 Jejak cakar kucing hitam! Lihat FAQ praktis mahasiswa baru di atas~",
    cat_empty_bubble: "Meow~ Tidak ada data senior yang cocok untuk ini (menggaruk kepala 🐾)",
    cat_empty_tip: "Coba kata kunci lain atau klik tombol di bawah untuk bertanya pada AI!",
    cat_empty_btn: "🤖 Tanya Asisten AI Langsung",

    // Custom FAQ Modal
    custom_add_title: "➕ Tambah Catatan Baru",
    custom_edit_title: "✏️ Edit Catatan Pribadi",
    custom_modal_desc: "Tersimpan aman di browser Anda. Tidak hilang saat refresh, dapat diubah dan diekspor kapan saja!",
    custom_q_label: "📌 Topik / Judul (Wajib)",
    custom_q_placeholder: "misal: Tips memilih dosen, jam sepi mesin cuci asrama...",
    custom_board_label: "🏷️ Kategori",
    custom_kw_label: "🏷️ Kata Kunci (Dipisah koma)",
    custom_kw_placeholder: "misal: dosen, kuliah, asrama",
    custom_a_label: "💬 Penjelasan Detail (Wajib)",
    custom_a_placeholder: "Ketik penjelasan detail, tips, atau daftar pengingat...",
    custom_del_btn: "🗑️ Hapus Catatan",
    custom_save_btn: "💾 Simpan Catatan",

    // Import/Export
    import_title: "📥 Impor Catatan (JSON)",
    import_desc: "Tempelkan data JSON yang diekspor sebelumnya di bawah untuk memulihkan catatan:",
    import_submit: "Konfirmasi Impor",

    // Footer
    footer_text: "Asisten Mahasiswa Baru NCHU · Dirangkum dari 789 peraturan resmi kampus dan pengalaman senior.<br>Hanya untuk referensi. Harap pastikan jadwal dan biaya resmi di situs divisi.",

    // Chat
    chat_title: "Tanya Jawab Mahasiswa Baru NCHU",
    chat_badge: "AI Senior",
    chat_subtitle: "Konsultasi Kehidupan & Administrasi Kampus NCHU",
    chat_font_size_btn: "Aa",
    chat_whitepaper_btn: "📜",
    chat_clear_btn: "Hapus Chat",
    chat_persona_label: "🎭 Gaya Bahasa:",
    persona_senior: "🌲 Senior Berpengalaman",
    persona_gentle: "💖 Kakak Senior Hangat",
    persona_official: "📜 Kantor Urusan Akademik",
    chat_welcome_title: "Halo! Selamat datang di Universitas Nasional Chung Hsing (NCHU)! 🎉",
    chat_welcome_msg: "Saya adalah <strong>Asisten Orientasi & Administrasi Kampus</strong> Anda. Silakan tanyakan apa saja tentang kuliah, asrama, lokasi kantor, atau kuliner! 😊",
    chat_input_placeholder: "Ketik pertanyaan... (misal: Rekomendasi mata kuliah? Di mana Divisi Ekstrakurikuler? Aturan sepeda?)",
    chat_input_hint: "💡 Klik 'Aa' di kanan atas untuk menyesuaikan ukuran font",
    chat_model_status: "🟢 AI Senior Terhubung (Tanpa Perlu API Key)",
    chat_food_map_chip: "🍜 Peta Kuliner",
    chat_whitepaper_chip: "📜 Panduan Etika AI",
    chat_hot_label: "🔥 Populer:",
    chip_extra_curr: "📍 Kantor Ekstrakurikuler",
    chip_course_select: "🎓 Pemilihan Kuliah",
    chip_general_rec: "📚 Rekomendasi Matkul Umum",
    chip_dorm_supplies: "🛏️ Perlengkapan Asrama",
    chip_bike_permit: "🚲 Aturan Sepeda & Motor",
    chip_deals: "🏷️ Diskon Mahasiswa",
    chip_eng_waive: "📑 Pembebasan Bahasa Inggris",

    // Whitepaper
    whitepaper_modal_title: "📜 Panduan Etika AI & Privasi Mahasiswa Baru NCHU",
    whitepaper_badge: "Literasi Informasi",
    whitepaper_sub: "Panduan Kehidupan Kampus, Perlindungan Data Pribadi, dan Etika Akademik AI",
    whitepaper_btn_agree: "Saya Telah Membaca & Memahami",

    // iOS
    ios_modal_tag: "Pengalaman Terbaik di iPhone",
    ios_modal_title: "Tambahkan 'NCHU FAQ' ke Layar Utama",
    ios_modal_desc: "Untuk panduan terbaik, sangat disarankan <b>menambahkan panduan ini ke Layar Utama iPhone</b> untuk pengalaman layar penuh bebas gangguan!",
    ios_step_1: "Ketuk ikon <b>Bagikan (Share)</b> di bagian tengah bawah toolbar Safari",
    ios_step_1_sub: "Tombol Bagikan (Share)",
    ios_step_2: "Gulir ke bawah dan pilih <b>'Tambahkan ke Layar Utama' (Add to Home Screen)</b>",
    ios_step_2_sub: "➕ Tambahkan ke Layar Utama",
    ios_step_3: "Ketuk <b>'Tambah'</b> di pojok kanan atas untuk menyelesaikan!",
    ios_btn_ok: "✨ Saya mengerti, coba sekarang!",
    ios_btn_skip: "Buka Versi Web Saja",

    // LINE
    line_modal_tag: "💬 Grup LINE Mahasiswa Baru 2026-2027",
    line_modal_title: "Direktori Komunitas LINE Mahasiswa Baru NCHU 🙇",
    line_modal_desc: "Direktori ini disusun khusus untuk mahasiswa baru <b>Tahun Akademik 2026-2027</b> untuk memudahkan saling berkenalan sejak dini.",
    line_modal_cs_btn: "✅ Jurusan Teknik Informatika (CS) - Klik untuk Gabung Langsung!",
    line_modal_other_btn: "🔍 Jurusan Lain: Lihat Daftar Lengkap Grup LINE",
    line_modal_footer: "Jurusan tercakup: Teknik Lingkungan, Matematika Terapan, Agronomi, Entomologi, Ekonomi Terapan, Sastra Taiwan, EECS, Ilmu Pangan, CS, Material, Kedokteran Hewan, Mekatronika Hayati, Manajemen Bisnis, Sastra Mandarin, Bahasa Asing, Akuntansi, Konservasi Tanah & Air."
  }
};

class NCHUI18n {
  constructor() {
    this.currentLang = this.detectInitialLanguage();
    this.listeners = [];
  }

  detectInitialLanguage() {
    try {
      const saved = localStorage.getItem(I18N_STORAGE_KEY);
      if (saved && I18N_LOCALES[saved]) return saved;

      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get("lang");
      if (urlLang && I18N_LOCALES[urlLang]) return urlLang;

      const navLang = (navigator.language || navigator.userLanguage || "").toLowerCase();
      if (navLang.startsWith("en")) return "en";
      if (navLang.startsWith("id")) return "id";
    } catch (e) {
      console.warn("[i18n] Language detection fallback:", e);
    }
    return "zh-TW";
  }

  getLanguage() {
    return this.currentLang || "zh-TW";
  }

  getLocales() {
    return I18N_LOCALES;
  }

  t(key, fallback = "") {
    const lang = this.currentLang;
    const res = I18N_RESOURCES[lang] || I18N_RESOURCES["zh-TW"];
    if (res && res[key] !== undefined) return res[key];
    const defaultRes = I18N_RESOURCES["zh-TW"];
    if (defaultRes && defaultRes[key] !== undefined) return defaultRes[key];
    return fallback || key;
  }

  setLanguage(lang) {
    if (!I18N_LOCALES[lang]) {
      console.warn(`[i18n] Unsupported language: ${lang}`);
      return;
    }
    this.currentLang = lang;
    try {
      localStorage.setItem(I18N_STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch (e) {}

    // 更新 DOM 標記
    this.updateDom();

    // 通知所有監聽器
    this.listeners.forEach(cb => {
      try {
        cb(lang);
      } catch (err) {
        console.error("[i18n] Listener error:", err);
      }
    });

    // 跨 iframe / parent 通訊同步
    this.broadcastLanguageChange(lang);
  }

  toggleLanguage() {
    // 兩階段切換：zh-TW <-> en（若未來啟用 id 則循環切換）
    const nextLang = this.currentLang === "zh-TW" ? "en" : "zh-TW";
    this.setLanguage(nextLang);
  }

  onChange(callback) {
    if (typeof callback === "function") {
      this.listeners.push(callback);
    }
  }

  broadcastLanguageChange(lang) {
    try {
      // 若為 parent 網頁，向內嵌的 chatFrame 廣播
      const iframe = document.getElementById("chatFrame");
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "NCHU_I18N_CHANGE", lang }, "*");
      }

      // 若在 iframe 內，向 parent 廣播
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "NCHU_I18N_CHANGE", lang }, "*");
      }
    } catch (e) {}
  }

  initBroadcastListener() {
    window.addEventListener("message", (e) => {
      if (e.data && e.data.type === "NCHU_I18N_CHANGE" && e.data.lang) {
        if (e.data.lang !== this.currentLang && I18N_LOCALES[e.data.lang]) {
          this.currentLang = e.data.lang;
          try {
            localStorage.setItem(I18N_STORAGE_KEY, this.currentLang);
            document.documentElement.lang = this.currentLang;
          } catch (err) {}
          this.updateDom();
          this.listeners.forEach(cb => {
            try { cb(this.currentLang); } catch (err) {}
          });
        }
      }
    });
  }

  updateDom() {
    // 1. 文字替換：針對帶有 data-i18n 屬性的元素
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const text = this.t(key);
      if (text) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          el.placeholder = text;
        } else {
          el.innerHTML = text;
        }
      }
    });

    // 2. Placeholder 替換：針對 data-i18n-placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      const text = this.t(key);
      if (text) el.placeholder = text;
    });

    // 3. Title 提示替換：針對 data-i18n-title
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
      const key = el.getAttribute("data-i18n-title");
      const text = this.t(key);
      if (text) el.title = text;
    });

    // 4. 更新切換按鈕顯示狀態
    this.updateLanguageButtonUi();
  }

  renderLanguageSwitcherHtml() {
    const isEn = this.currentLang === "en";
    const isId = this.currentLang === "id";
    return `
      <div class="lang-switch-wrap" id="langSwitchWrap">
        <button type="button" class="lang-switch-btn ${this.currentLang === 'zh-TW' ? 'active' : ''}" onclick="window.nchuI18n.setLanguage('zh-TW')" title="切換為繁體中文">🇹🇼 繁中</button>
        <span class="lang-switch-sep">|</span>
        <button type="button" class="lang-switch-btn ${isEn ? 'active' : ''}" onclick="window.nchuI18n.setLanguage('en')" title="Switch to English">🌐 EN</button>
        ${isId ? `<span class="lang-switch-sep">|</span><button type="button" class="lang-switch-btn active" onclick="window.nchuI18n.setLanguage('id')" title="Bahasa Indonesia">🇮🇩 ID</button>` : ''}
      </div>
    `;
  }

  updateLanguageButtonUi() {
    document.querySelectorAll(".lang-switch-btn").forEach(btn => {
      const isTarget = (btn.textContent.includes("繁中") && this.currentLang === "zh-TW") ||
                       (btn.textContent.includes("EN") && this.currentLang === "en") ||
                       (btn.textContent.includes("ID") && this.currentLang === "id");
      btn.classList.toggle("active", isTarget);
    });
  }
}

// 建立全局唯一實例
window.nchuI18n = new NCHUI18n();
window.nchuI18n.initBroadcastListener();

// DOM 載入後自動套用
document.addEventListener("DOMContentLoaded", () => {
  window.nchuI18n.updateDom();
});
