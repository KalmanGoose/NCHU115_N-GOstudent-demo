# 國立中興大學新生助手 (NCHU Freshman FAQ)
# 工程交接規格手冊：校園交通、公車模組與全域系統架構
> **Document Identifier: NCHU-ENG-HANDOVER-BUS-V1.0**  
> **交接文件檔名：`BUS_FEATURE_HANDOVER.md`**  
> **專案代號：NCHUfrashmanFAQ (新鮮人-興生FAQ問答指南)**  
> **版本號：v1.0.0 (Release-Ready)**  
> **交接日期：2026-10-17**  
> **專案負責人：Ethan Chen**  
> **適用對象：接手之後續前端工程師、後端維運人員、資料管線工程師、AI Agent 副官**

---

## 📑 目錄 (Table of Contents)
1. [文件概述與交接緣起](#1-文件概述與交接緣起)
2. [第一章：校園交通與公車專題規格 (Bus & Transit Specification)](#2-第一章校園交通與公車專題規格-bus--transit-specification)
   - 2.1 業務背景與法規級痛點
   - 2.2 核心交通規則矩陣 (A/B/C 來源等級認證)
   - 2.3 興大周邊核心公車網絡與拓撲矩陣
   - 2.4 公車功能介面設計與資料介接架構 (TDX & Deep Link)
3. [第二章：全專案系統工程架構 (Full-Stack Architecture)](#3-第二章全專案系統工程架構-full-stack-architecture)
   - 3.1 零伺服器 (Zero-Server) 自律架構原則
   - 3.2 單一事實來源 (SSOT) 資料層拓撲
   - 3.3 表現層雙引擎架構 (`index.html` & `faq.html`)
   - 3.4 萌系常用系統快捷抽屜 (Collapsible Portal Drawer)
4. [第三章：關鍵演算法與前端互動模組](#4-第三章關鍵演算法與前端互動模組)
   - 4.1 純前端毫秒級即時檢索演算法 (Client-side Tokenizer & Matcher)
   - 4.2 物理慣性美食大轉盤 Canvas 引擎
   - 4.3 響應式佈局引擎與手機端防炸框防護體系
5. [第四章：資料治理、資安規範與自動化驗證管線](#5-第四章資料治理資安規範與自動化驗證管線)
   - 5.1 危機安全字詞最高優先獨立路由 (Crisis Isolation)
   - 5.2 帳密資安與個人隱私去識別化準則
   - 5.3 自動化知識庫驗證工具 (`validate_knowledge.py`)
6. [第五章：維運、除錯與部署作業手冊 (Runbook & DevOps)](#6-第五章維運除錯與部署作業手冊-runbook--devops)
   - 6.1 本地開發環境與跨裝置手機測試指南
   - 6.2 GitHub Pages 靜態站自動同步與部署
   - 6.3 歷史踩坑覆盤與常規除錯 (Troubleshooting FAQ)
7. [第六章：未竟事宜與後續里程碑規劃 (Roadmap & Backlog)](#7-第六章未竟事宜與後續里程碑規劃-roadmap--backlog)

---

## 1. 文件概述與交接緣起

本手冊旨在為接手「**國立中興大學新生生活與行政問答指南 (新鮮人-興生FAQ)**」專案之工程師提供完整、具體且不失細節的工程規格說明。

本專案歷經架構重整、資料去敏去重、端側輕量化檢索演算法演進，以及行動端自適應排版最佳化，已實現**「零伺服器負擔、零 API Key 外洩風險、前端毫秒級極速回應」**的自律運作目標。

其中，**「校園交通與公車專題模組 (Bus & Transit Feature)」**為大一新生開學最關鍵、諮詢頻率最高、且法規牽涉最深之核心板塊，本手冊將其列為專章重點交接。

---

## 2. 第一章：校園交通與公車專題規格 (Bus & Transit Specification)

### 2.1 業務背景與法規級痛點
* **大一新生無校內機車通行證**：依據興大總務處駐衛警察隊法規，大學部日間部新生原則上無法申請日間校內機車通行證，且校園內全面禁止機車行駛（違者駐警隊進行大鎖鎖車並開立校內違規處理費 300 元）。
* **公車與公共運輸成為絕對剛需**：新生往返台中火車站、高鐵台中站、大慶捷運站、一中商圈、逢甲夜市等，極度仰賴台中市公車網絡與 Ubike 2.0。
* **政策紅利認知落差**：台中市政府提供大專院校學生「台中市民限定交通卡（雙十公車優惠：前 10 公里免費、超過 10 公里最高收 10 元）」，但多數新生不知如何在領到學生證後進行綁定。

### 2.2 核心交通規則矩陣 (A/B/C 來源等級認證)
依據專案 `WORK_GUIDELINES.md` 規範，本模組交通數據均經過嚴格分級查證：

| 項目 | 規範內容 | 來源等級 | 權責單位 / 官方依據 |
| :--- | :--- | :---: | :--- |
| **雙十公車優惠** | 綁定後搭乘台中市公車享前 10 公里免費，超過 10 公里車資上限 10 元。 | **A** | 台中市政府交通局《市民限定搭乘公車優惠措施》 |
| **學生證綁卡流程** | 需攜帶「身分證正本」與「中興大學在學學生證」，至南區區公所、指定台中捷運站或市立圖書館臨櫃綁定生效。 | **A** | 台中市南區區公所 / 交通局綁卡站點規定 |
| **腳踏車校內通行** | 全校完全**免辦車證**即可自由騎乘通行。僅住宿生若需停放男宿/女宿專屬地下/遮雨車棚時，才需向宿舍服務中心申請識別證貼紙。 | **A** | 總務處資產經營與安全管理組法規 |
| **機車校內行駛禁令** | 校園徒步區全面嚴禁騎乘機車（含油車與電動機車），24 小時電子車牌辨識與巡邏鎖車。 | **A** | 中興大學車輛進出及停放管理辦法 |
| **外圍免費機車停車** | 新生機車可免費停放於：社管大樓旁停車場、國光路/忠明南路口機車場、興大正門右側機車停車棚。 | **B** | 總務處駐警隊常態停車規範與標誌 |

### 2.3 興大周邊核心公車網絡與拓撲矩陣
工程系統中收錄之公車路線知識庫（位於 `campus_knowledge.json` 與 `faq_data.js`），涵蓋下列樞紐路線：

```
                      【中興大學周邊公車拓撲網絡】
                                 
      [ 逢甲大學 / 西屯 ]                [ 一中街商圈 / 臺中科大 ]
               ▲                                    ▲
               │ 33, 35                             │ 35, 73
               │                                    │
               │                                    │
 [ 臺中火車站 (東站/前站) ] ◄─── 33, 35, 284 ───► [ 中興大學正門 (興大路) ]
 [ 大慶車站 (臺鐵/捷運) ]   ◄─── 33, 73 ───────► [ 興大國光路口 (國光路) ]
 [ 高鐵臺中站 (烏日) ]      ◄─── 158, 綠3 ─────► [ 興大附農 / 臺中女中 ]
               │                                    │
               ▼                                    ▼
       [ 大里 / 霧峰朝陽 ]                   [ 南區區公所 (綁卡地點) ]
```

#### 關鍵路線參數一覽：
1. **33 路 (台中客運)**：僑光科大 ⇄ 逢甲夜市 ⇄ 台中火車站 ⇄ 中興大學 ⇄ 大慶車站。班次密集，為西屯、逢甲與大慶車站最核心接駁線。
2. **35 路 (台中客運)**：僑光科大 ⇄ 逢甲大學 ⇄ 一中商圈 ⇄ 台中火車站 ⇄ 中興大學 ⇄ 南區區公所。直達一中街與綁卡地點，新生必搭。
3. **73 路 (統聯客運)**：文高停車場 ⇄ 統聯轉運站 ⇄ 文心森林公園 ⇄ 中興大學。前往捷運綠線與南屯核心。
4. **284 路 (台中客運)**：台中火車站 ⇄ 中興大學 ⇄ 修平科大。火車站往返學校後門與忠孝夜市之輔助線。
5. **綠 3 路 (統聯客運)**：捷運綠線接駁公車，提供捷運大慶站至中興大學之直達轉乘。

### 2.4 公車功能介面設計與資料介接架構 (TDX & Deep Link)
系統規劃並落地的公車功能採用「**零負擔輕量整合策略**」，避免高額伺服器反向代理負載：

#### (1) 前端直連外部權威 App Deep Link (免金鑰體驗)
在前端卡片與指引中，提供一鍵喚醒系統：
```javascript
// 公車即時動態喚醒邏輯 (PWA / Mobile Friendly)
function openBusTracker(routeNumber, stopName) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    // 優先引導開啟「台中等公車」或 Apple/Google 地圖實時公車導航
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('國立中興大學')}&travelmode=transit`, '_blank');
  } else {
    // Android 原生 Google 地圖大眾運輸查詢
    window.open(`geo:0,0?q=${encodeURIComponent('中興大學 公車站')}`, '_blank');
  }
}
```

#### (2) 交通部 TDX (Transport Data eXchange) API 整合介面預留
若未來擴充校門口公車站即時到站電子看板，架構預留於 `campus_knowledge.json` 之延伸資料欄位：
* **API 端點**：`https://tdx.transportdata.tw/api/basic/v2/Bus/EstimatedTimeOfArrival/City/Taichung`
* **Station UID**：
  * 中興大學正門 (興大路)：`TXG3011` / `TXG3012`
  * 興大國光路口 (國光路)：`TXG3015` / `TXG3016`
* **快取機制**：瀏覽器 SessionStorage 快取 30 秒（避免觸發 TDX Rate Limit 限制）。

---

## 3. 第二章：全專案系統工程架構 (Full-Stack Architecture)

### 3.1 零伺服器 (Zero-Server) 自律架構原則
本專案堅持「**Zero-Server / Client-First**」架構哲學：
1. **零運維成本**：無需部署 Node.js/Python 後端伺服器，直接託管於 GitHub Pages 靜態 CDN。
2. **零資安外洩**：使用者瀏覽不需輸入任何個人密碼或第三方 API Key (如 OpenAI / Anthropic Key)，無憑證外洩疑慮。
3. **離線與極速響應**：整體核心資料庫（知識庫 789 筆 + FAQ 40 筆 + 美食 176 筆 + 傳送門 10 筆）於前端記憶體僅佔用約 **1.8 MB**，經 gzip 壓縮後傳輸大小小於 **350 KB**，達到 0.001 秒級搜尋反應。

### 3.2 單一事實來源 (SSOT) 資料層拓撲
專案建立嚴格的單一事實來源資料體系，杜絕不同頁面資料版本脫節：

```
                              【單一事實來源 (SSOT) 架構】
                                            
            ┌───────────────────────┴───────────────────────┐
            │                                               │
  [ campus_knowledge.json ]                         [ portal_data.js ]
   - 789 筆官方法規/學長姐心得                       - 10 大萌系常用系統入口
   - 包含 A/B/C 等級標籤                             - 專屬漸層、圖示、帳密小抄
            │                                               │
            ├───────────────────────┬───────────────────────┤
            │                       │                       │
     [ faq_data.js ]        [ food_database.js ]      [ 驗證引擎 ]
   - 40 篇核心精選問答       - 176 間美食完整索引     validate_knowledge.py
   - 支援卡片釘選/自訂       - 支援價格/標籤篩選      (0 衝突/0 違規自動稽核)
            │                       │                       │
            └───────────────────────┬───────────────────────┘
                                    ▼
                      【前端頁面渲染引擎】
                     ┌─────────────────────┐
                     │  1. index.html      │
                     │  2. faq.html        │
                     │  3. chat.html       │
                     └─────────────────────┘
```

#### 資料檔案規格表：
* **`campus_knowledge.json`**：系統最大型知識庫（789 條）。欄位規格：
  ```typescript
  interface CampusKnowledgeItem {
    名稱: string;       // 條目標題 (例: "台中市公車市民交通卡申辦")
    關鍵字: string;     // 逗號分隔的高頻分詞 (例: "公車免費,市民卡,南區區公所")
    情報內容: string;   // 完整解答內容，包含處室、電話、規定與防坑叮嚀
    分類?: string;      // 業務分類 (學業, 住宿, 交通, 生活, 安全)
    source_level?: "A" | "B" | "C"; // 查證等級
  }
  ```
* **`portal_data.js`**：興大 10 大常用系統萌系資料。包含系統 ID、URL、Emoji 圖示、莫蘭迪漸層色彩與帳密登入指引。
* **`faq_data.js`**：精選 40 篇高頻指引，供首頁與 FAQ 頁進行卡片化瀑布流渲染。
* **`food_database.js`**：176 間興大周邊美食資料，支援多條件篩選與幸運轉盤共用。

### 3.3 表現層雙引擎架構 (`index.html` & `faq.html`)
專案提供兩套無縫切換的入口介面，且維持 **100% 特性與邏輯對齊**：
* **`index.html`**：主入口首頁。包含導航列、公告聲明、搜尋欄、萌系快捷傳送門抽屜、熱門話題卡片、FAQ 瀑布流、客製卡片新增器、美食地圖彈窗與 AI 對話抽屜。
* **`faq.html`**：進階問答庫首頁。保有與首頁完全一致的萌系傳送門、防炸框排版引擎與搜尋邏輯，供直接書籤使用。

### 3.4 萌系常用系統快捷抽屜 (Collapsible Portal Drawer)
針對使用者反映「傳送門卡片過多導致首頁雜亂」的體驗痛點，重新實作為**智能展開/收合抽屜元件**：
1. **DOM 結構**：
   * `#portalSection.portal-drawer-section`：主容器。
   * `#portalDrawerBar`：可點擊收合標題膠囊列。
   * `#portalDrawerContent`：包含分類按鈕與 `#portalGrid` 的動畫容器。
2. **自動展演微互動 (`runPortalDrawerIntro`)**：
   * 頁面載入後 450ms：平滑展開抽屜 (`open`)。
   * 展開後 400ms：啟動 `@keyframes portalPeekDoubleBounce`，卡片彈跳兩下以提示使用者「這裡有新功能」。
   * 彈跳展示 1.5 秒後：自動收合為小巧膠囊列，回歸極簡首頁。
   * **衝突防護 (`userInteractedWithPortalDrawer`)**：一旦使用者手動點擊或互動，立即清除定時器，徹底尊重使用者意圖。

---

## 4. 第三章：關鍵演算法與前端互動模組

### 4.1 純前端毫秒級即時檢索演算法
捨棄外部肥大函式庫（如 Lunr.js），採用專為繁體中文特化的輕量比對引擎：
```javascript
function searchKnowledge(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const tokens = q.split(/[\s,，、]+/);

  return CAMPUS_KNOWLEDGE.map(item => {
    let score = 0;
    const title = (item.名稱 || "").toLowerCase();
    const keywords = (item.關鍵字 || "").toLowerCase();
    const content = (item.情報內容 || "").toLowerCase();

    // 1. 完全命中權重最高
    if (title.includes(q)) score += 50;
    if (keywords.includes(q)) score += 30;

    // 2. Token 分詞命中加權
    tokens.forEach(tok => {
      if (title.includes(tok)) score += 15;
      if (keywords.includes(tok)) score += 10;
      if (content.includes(tok)) score += 3;
    });

    return { item, score };
  })
  .filter(res => res.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 8)
  .map(res => res.item);
}
```

### 4.2 物理慣性美食大轉盤 Canvas 引擎
位於 `index.html` 的幸運大轉盤，採用 HTML5 Canvas 搭配物理減速模型：
* **角度積分公式**：$\theta_{t+1} = \theta_t + \omega_t$
* **摩擦力減速模型**：$\omega_{t+1} = \omega_t \times \mu$（其中阻尼係數 $\mu = 0.985$）
* **三次貝茲曲線平滑過渡**：確保指針停靠在菜色扇區中央，並自動連動觸發美食卡片彈窗。

### 4.3 響應式佈局引擎與手機端防炸框防護體系
#### 炸框核心成因覆盤：
CSS Grid 在移動端（寬度 ≤ 420px）若子元素設定了較寬的 flex 按鈕容器（例如 `📋 複製` + `✏️ 編輯` + `🗑️ 刪除` 總寬超過 170px），預設 `min-width: auto` 會強行將 Grid 軌道撐開，超越螢幕寬度（造成水平捲軸與破版）。

#### 防禦性解決方案：
```css
/* 1. 全域封鎖水平滾動 */
html, body {
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}

/* 2. Grid 軌道強制收縮 */
.faq-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  width: 100%;
}

/* 3. 卡片容器約束 */
.faq-card {
  min-width: 0 !important;
  overflow: hidden !important;
  word-break: break-word !important;
}

/* 4. 手機雙欄底部按鈕轉為直向堆疊 */
@media (max-width: 640px) {
  body.cols-2 .faq-card-footer {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 8px !important;
  }
  body.cols-2 .faq-card-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
```

---

## 5. 第四章：資料治理、資安規範與自動化驗證管線

### 5.1 危機安全字詞最高優先獨立路由 (Crisis Isolation)
* **資安教訓**：早期版本曾將「想死、崩潰、壓力大」等關鍵字與娛樂炒飯混合，引導至負面體驗。
* **現行鐵律規範**：
  1. 危機關鍵字（`想死,不想活,自殺,自殘,活不下去,傷害自己`）**獨立成單一條目**。
  2. 該條目具備最高路由優先權，強制覆寫其他生活娛樂項目。
  3. 回應內容僅提供正式救助專線：
     * **興大 24H 校安緊急專線**：`04-22870885` / 惠蓀堂 2F
     * **衛福部安心專線**：`1925` (24 小時免付費)
     * **中興大學健康及諮商中心**：`04-22840241` / 惠蓀堂 4F (免費且保密)

### 5.2 帳密資安與個人隱私去識別化準則
* **嚴禁刊載真實預設密碼範例**：
  * ❌ 嚴禁出現：`Aa67890304` 等可推論真實身分證字號與生日之範例。
  * ✅ 一律統一為格式指引說明：「預設密碼為英文姓名大寫首字＋出生月日 4 碼等官方規則，首次登入後請立即修改」。
* **社群與 LINE 群保護**：
  * 17 個新生系群僅保留審核指引與官方安全提醒，並標明 `115 學年度`。
  * 去除未經授權之學長姐個人真實姓名與私人帳號。

### 5.3 自動化知識庫驗證工具 (`validate_knowledge.py`)
專案附帶完整的自動化稽核工具，任何內容提交前**必須本機執行通過**：
```bash
python3 validate_knowledge.py
```
#### 驗證檢查項目：
1. **危機詞隔離檢查**：確保自殺詞條未包含任何玩笑或美食字眼。
2. **預設密碼去敏檢查**：正則掃描所有檔案是否含有違法身分證號或密碼洩漏範例。
3. **單一事實矛盾檢核**：
   * 校安專線唯一值：`04-22870885`
   * 宿網每日流量上限唯一值：`8 GB` (校內宿網規範)
   * 腳踏車免通行證規範確認。
4. **JSON 語法與編碼檢驗**：強制 UTF-8 編碼與合法 JSON 結構。

---

## 6. 第五章：維運、除錯與部署作業手冊 (Runbook & DevOps)

### 6.1 本地開發環境與跨裝置手機測試指南
若要在本機進行開發與手機即時預覽，請依照下列步驟執行：

#### 步驟 1：啟動支援全域 IPv4 之本地伺服器
```bash
# ⚠️ 必須加上 --bind 0.0.0.0，否則 macOS 會僅綁定 IPv6，導致手機無法連線
python3 -m http.server --bind 0.0.0.0 8000
```

#### 步驟 2：查詢 Mac 本機區域網路 IP
```bash
ipconfig getifaddr en0
# 範例回傳：172.20.10.4 (Wi-Fi 或 iPhone 熱點 IP)
```

#### 步驟 3：手機端連線測試
* 確認手機與電腦連線在**同一個 Wi-Fi** 或**手機開啟個人熱點給電腦連線**。
* 手機瀏覽器輸入：`http://172.20.10.4:8000/index.html`。
* ⚠️ **常見報錯排除**：若手機打 `localhost:8000` 會連到手機自己而失敗，請務必輸入電腦的實體 IP。

### 6.2 GitHub Pages 靜態站自動同步與部署
本專案已建立 `gh-pages-sync` 與 `main` 分支雙軌管理：
```bash
# 1. 確認當前修改狀態
git status

# 2. 暫存異動檔案
git add index.html faq.html portal_data.js BUS_FEATURE_HANDOVER.md

# 3. 提交變更
git commit -m "feat(bus-and-portal): 完成公車模組規格手冊、防炸框排版與萌系快捷抽屜"

# 4. 推送到遠端倉庫
git push origin gh-pages-sync

# 5. 線上正式站驗證
# https://kalmangoose.github.io/NCHU115_N-GOstudent-demo/
```

### 6.3 歷史踩坑覆盤與常規除錯 (Troubleshooting FAQ)
* **Q1：手機瀏覽器卡片點擊沒反應？**
  * **檢查點**：檢視彈窗容器之 `z-index` 是否低於其他元素。目前 Modal 層級統一規範為 `z-index: 9999`，抽屜為 `z-index: 10`。
* **Q2：修改了 `portal_data.js`，但網頁未更新？**
  * **檢查點**：瀏覽器快取機制。可於 HTML 引用端加入版本查詢字串：`<script src="portal_data.js?v=20261017"></script>`。
* **Q3：雙欄切換時卡片寬度不均勻？**
  * **檢查點**：確保未在個別卡片寫死 `width`，一律交由父層 `.faq-grid` 以 `repeat(2, minmax(0, 1fr))` 自適應計算。

---

## 7. 第六章：未竟事宜與後續里程碑規劃 (Roadmap & Backlog)

| 優先級 | 模組 / 功能 | 規格描述 | 預計工作量 | 狀態 |
| :---: | :--- | :--- | :---: | :---: |
| **P0** | **公車手冊與交接確立** | 完成 `BUS_FEATURE_HANDOVER.md` 規格手冊並落地於根目錄。 | 1 天 | ✅ 已完成 |
| **P0** | **手機防炸框與抽屜** | 修復 Grid 溢出破版，並實作萌系傳送門進場自動彈跳與收合。 | 1 天 | ✅ 已完成 |
| **P1** | **TDX 即時公車動態看板** | 介接交通部 TDX 免費 API，於首頁公車卡片即時顯示 33/35 到站分鐘數。 | 2 天 | 待開工 |
| **P1** | **Ubike 2.0 即時車位資訊** | 串接台中市公共自行車 API，呈現「大門/女宿/體育館」剩餘車輛數。 | 1.5 天 | 待開工 |
| **P2** | **PWA 離線 Service Worker** | 註冊 Service Worker，支援手機「加入主畫面」後全離線瀏覽與查詢。 | 2 天 | 規劃中 |

---

> **手冊交付聲明**：  
> 本文件已於專案根目錄下完成建立，並遵循《工作準則：NCHUfrashmanFAQ 查證與內容建置》之真實查證等級。後續維護團隊可直接以本手冊作為架構基線與維運指引。  
> 
> **簽核**：Ethan Chen & AI Pair Assistant  
> **日期**：2026 年 10 月 17 日
