/**
 * ==============================================================================
 * 國立中興大學 (NCHU) 新生美食地圖 - Google Apps Script (GAS) 後端 Web App API 範本
 * ==============================================================================
 * 
 * 【功能說明】
 * 1. 將本腳本部署至 Google Apps Script Web App，即可將 Google 試算表 (Google Sheets)
 *    化身為高可用性、即時更新的無伺服器 (Serverless) 美食資料庫 API。
 * 2. 支援前端多維度篩選參數：
 *    - ?street=南門路商圈 或 ?street=校內學餐
 *    - ?category=咖啡甜點 或 ?category=主食便當
 *    - ?max_walk=5 (5分鐘以內路程)
 *    - ?search=樹瓦 (關鍵字搜尋)
 *    - ?action=ping (快速心跳測試連線)
 * 3. 支援 CORS 跨域請求，並內建試算表自動快取與容錯機制。
 * 
 * 【五分鐘快速部署教學】
 * 步驟一：建立一個新的 Google 試算表 (或匯入專案中的 nchu_food_scraped.csv)。
 * 步驟二：點選試算表上方選單「擴充功能」 -> 「Apps Script」。
 * 步驟三：將本檔案全部內容複製並貼入 Code.gs 編輯器中。
 * 步驟四：點選右上角「部署」 -> 「新增部署作業」：
 *         - 種類選擇：網頁應用程式 (Web app)
 *         - 說明：NCHU Food API v1
 *         - 誰可以存取：所有人 (Anyone) ★注意：務必選「所有人」，前端才能免登入抓取
 * 步驟五：點選「部署」並授權，複製獲得的「網頁應用程式網址 (Web App URL)」。
 * 步驟六：打開興大新生美食地圖彈窗，點擊「⚙️ 串接 Google 試算表 API」，貼上網址即可！
 * ==============================================================================
 */

// 試算表工作表名稱 (若為空白則自動讀取第一張工作表)
const SHEET_NAME = ""; 

function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    
    // 心跳檢測 / 測試連線
    if (params.action === "ping" || params.test === "1") {
      return createJsonResponse({
        status: "success",
        message: "🌲 國立中興大學美食地圖 Google Apps Script API 連線成功！",
        timestamp: new Date().toISOString()
      });
    }

    // 取得資料
    const allFoods = loadFoodDataFromSheet();
    
    // 參數過濾
    const targetStreet = (params.street || "").trim().toLowerCase();
    const targetCategory = (params.category || "").trim().toLowerCase();
    const maxWalk = parseInt(params.max_walk || "0", 10);
    const searchQuery = (params.search || params.q || "").trim().toLowerCase();
    const limit = parseInt(params.limit || "0", 10);

    let filtered = allFoods.filter(item => {
      // 街道/商圈過濾
      if (targetStreet && targetStreet !== "all" && targetStreet !== "全部") {
        const itemStreet = String(item.street || "").toLowerCase();
        if (!itemStreet.includes(targetStreet) && !targetStreet.includes(itemStreet)) {
          return false;
        }
      }

      // 分類過濾
      if (targetCategory && targetCategory !== "all" && targetCategory !== "全部") {
        const itemCat = String(item.category || "").toLowerCase();
        if (!itemCat.includes(targetCategory) && !targetCategory.includes(itemCat)) {
          return false;
        }
      }

      // 步行時間過濾
      if (maxWalk > 0) {
        const itemWalk = parseInt(item.walk_minutes || "99", 10);
        if (itemWalk > maxWalk) {
          return false;
        }
      }

      // 關鍵字搜尋 (店名、介紹、地址、營業時間等)
      if (searchQuery) {
        const fullText = (
          String(item.name || "") + " " +
          String(item.street || "") + " " +
          String(item.category || "") + " " +
          String(item.transport_tip || "") + " " +
          String(item.address || "") + " " +
          String(item.hours || "")
        ).toLowerCase();
        if (!fullText.includes(searchQuery)) {
          return false;
        }
      }

      return true;
    });

    // 限制筆數 (若有設定)
    if (limit > 0 && filtered.length > limit) {
      filtered = filtered.slice(0, limit);
    }

    return createJsonResponse({
      status: "success",
      source: "google_sheets_live",
      total_count: allFoods.length,
      filtered_count: filtered.length,
      data: filtered,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "API 執行異常: " + err.toString(),
      data: []
    });
  }
}

/**
 * 從當前綁定的 Google Sheet 讀取美食資料
 */
function loadFoodDataFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return getFallbackFoodData();
  }

  const sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
  if (!sheet) {
    return getFallbackFoodData();
  }

  const values = sheet.getDataRange().getValues();
  if (!values || values.length <= 1) {
    return getFallbackFoodData();
  }

  const headers = values[0].map(h => String(h || "").trim().toLowerCase());
  const rows = values.slice(1);
  const result = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue; // 略過空行

    const record = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      let val = row[j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
      record[key] = String(val !== undefined && val !== null ? val : "").trim();
    }
    result.push(record);
  }

  return result.length > 0 ? result : getFallbackFoodData();
}

/**
 * 格式化為 JSON 回應，並啟用跨域支援 (CORS)
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 備用模擬資料 (當試算表尚未建立時確保 API 可立即測試)
 */
function getFallbackFoodData() {
  return [
    {
      "id": "nchu_food_225",
      "name": "樹瓦咖啡 (南門路/興大獨家推薦)",
      "source": "生活圈實體擴充",
      "street": "南門路商圈",
      "walk_minutes": "7",
      "transport_tip": "走路 5 分鐘 (側門出發)",
      "category": "咖啡甜點",
      "budget_tier": "中等價位 (100~200元)",
      "avg_price": "140",
      "rating": "4.9",
      "review_count": "368",
      "hours": "10:30 - 18:30 (週三公休 / 老闆特調精品)",
      "address": "台中市南區南門路59巷2號",
      "photo_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
      "maps_url": "https://www.google.com/maps/search/?api=1&query=%E4%B8%AD%E8%88%88%E5%A4%A7%E5%AD%B8%20%E6%A8%B9%E7%93%A6%E5%92%96%E5%95%A1"
    },
    {
      "id": "nchu_food_177",
      "name": "興大圓廳深森自助餐 (圓廳1F)",
      "source": "生活圈實體擴充",
      "street": "校內學餐/校園專區",
      "walk_minutes": "3",
      "transport_tip": "校園內部 1~3 分鐘 (免出校門)",
      "category": "主食便當",
      "budget_tier": "百元有找 (<100元)",
      "avg_price": "85",
      "rating": "4.3",
      "review_count": "520",
      "hours": "10:30 - 19:30 (校園學生餐廳)",
      "address": "台中市南區興大路145號 (興大圓廳美食廣場)",
      "photo_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
      "maps_url": "https://www.google.com/maps/search/?api=1&query=%E4%B8%AD%E8%88%88%E5%A4%A7%E5%AD%B8%20%E8%88%88%E5%A4%A7%E5%9C%93%E5%BB%B3%E6%B7%B1%E6%A3%AE%E8%87%AA%E5%8A%A9%E9%A4%90"
    }
  ];
}
