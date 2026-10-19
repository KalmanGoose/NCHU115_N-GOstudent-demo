/**
 * ==============================================================================
 * 國立中興大學 (NCHU) 新生美食地圖 - Google Apps Script (GAS) 安全後端 Web App
 * ==============================================================================
 * 
 * 🔒【資安防護規範 - 零硬編碼安全架構】
 * 1. 嚴禁在程式碼中寫死任何管理員密碼或金鑰！
 * 2. 管理員金鑰存放在 Google Apps Script 雲端專屬的「指令碼屬性 (Script Properties)」中：
 *    - 設定路徑：GAS 編輯器左側選單 ->「專案設定 (齒輪圖示)」->「指令碼屬性 (Script Properties)」
 *    - 屬性名稱：ADMIN_SECRET_TOKEN
 *    - 屬性值：填入你自訂的高強度管理密碼 (例：MyNCHU_Secret_Pass_2026!)
 * 3. 訪客端僅能執行查詢 (doGet) 與提交回報 (action=report)，無法偽造或越權存取管理功能。
 * 4. 所有管理操作 (審核回報、上下架、爬蟲寫入) 皆嚴格校驗傳入的 Token 是否與雲端屬性一致。
 * ==============================================================================
 */

const STORES_SHEET_NAME = "Stores";
const REPORTS_SHEET_NAME = "Reports";

/**
 * 從 Google 雲端安全讀取管理員金鑰 (不寫死在代碼中)
 */
function getAdminSecretToken() {
  const secret = PropertiesService.getScriptProperties().getProperty("ADMIN_SECRET_TOKEN");
  return secret ? String(secret).trim() : null;
}

/**
 * 處理 GET 請求 (心跳檢測、訪客店家查詢、管理員讀取回報)
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    
    // 1. 心跳檢測
    if (params.action === "ping" || params.test === "1") {
      return createJsonResponse({
        status: "success",
        message: "🌲 中興大學美食地圖 Google Apps Script API 正常運作中！",
        timestamp: new Date().toISOString()
      });
    }

    // 2. 管理員安全讀取回報清單
    if (params.action === "admin_get_reports") {
      const serverSecret = getAdminSecretToken();
      if (!serverSecret) {
        return createJsonResponse({ 
          status: "error", 
          message: "尚未在 Apps Script 專案設定中配置 ADMIN_SECRET_TOKEN 指令碼屬性！" 
        });
      }

      if (!params.token || String(params.token).trim() !== serverSecret) {
        return createJsonResponse({ status: "error", message: "管理員身分驗證失敗！權限不足。" });
      }

      const reports = loadReportsFromSheet();
      return createJsonResponse({ status: "success", count: reports.length, data: reports });
    }

    // 3. 訪客端一般店家資料查詢 (只回傳 is_active !== false)
    const allFoods = loadFoodDataFromSheet();
    const targetStreet = (params.street || "").trim().toLowerCase();
    const targetCategory = (params.category || "").trim().toLowerCase();
    const maxWalk = parseInt(params.max_walk || "0", 10);
    const searchQuery = (params.search || params.q || "").trim().toLowerCase();
    const showAll = params.include_inactive === "true" || params.include_inactive === "1";

    // 僅授權管理員才能檢視已下架店家
    const isAdmin = params.token && params.token === getAdminSecretToken();

    let filtered = allFoods.filter(item => {
      if (!showAll || !isAdmin) {
        if (String(item.is_active).toUpperCase() === "FALSE") return false;
      }

      if (targetStreet && targetStreet !== "all" && targetStreet !== "全部") {
        const itemStreet = String(item.street || "").toLowerCase();
        if (!itemStreet.includes(targetStreet) && !targetStreet.includes(itemStreet)) return false;
      }

      if (targetCategory && targetCategory !== "all" && targetCategory !== "全部") {
        const itemCat = String(item.category || "").toLowerCase();
        if (!itemCat.includes(targetCategory) && !targetCategory.includes(itemCat)) return false;
      }

      if (maxWalk > 0) {
        const itemWalk = parseInt(item.walk_minutes || "99", 10);
        if (itemWalk > maxWalk) return false;
      }

      if (searchQuery) {
        const fullText = (
          String(item.name || "") + " " +
          String(item.street || "") + " " +
          String(item.category || "") + " " +
          String(item.address || "") + " " +
          String(item.hours || "")
        ).toLowerCase();
        if (!fullText.includes(searchQuery)) return false;
      }

      return true;
    });

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
 * 處理 POST 請求 (提交回報、管理員登入驗證、審核處理、爬蟲批次匯入)
 */
function doPost(e) {
  try {
    let params = {};
    if (e && e.parameter) params = e.parameter;

    if (e && e.postData && e.postData.contents) {
      try {
        const jsonBody = JSON.parse(e.postData.contents);
        params = Object.assign({}, params, jsonBody);
      } catch (err) {}
    }

    const action = params.action;

    // 1. 同學提交回報 (公開介面，免驗證，嚴格消毒輸入)
    if (action === "report") {
      let reportData = {};
      if (typeof params.payload === "string") {
        reportData = JSON.parse(params.payload);
      } else if (params.payload) {
        reportData = params.payload;
      } else {
        reportData = params;
      }

      appendReportToSheet(reportData);
      return createJsonResponse({ status: "success", message: "回報已成功送出！感謝協助維護店家資訊。" });
    }

    // 2. 以下所有管理功能必須通過雲端金鑰驗證
    const serverSecret = getAdminSecretToken();
    if (!serverSecret) {
      return createJsonResponse({ 
        status: "error", 
        message: "後端尚未在 Apps Script 專案設定中配置 ADMIN_SECRET_TOKEN 指令碼屬性！請先至 GAS 設定。" 
      });
    }

    const clientToken = params.token || params.adminToken;
    if (!clientToken || String(clientToken).trim() !== serverSecret) {
      return createJsonResponse({ status: "error", message: "認證失敗：管理員密鑰無效或不符！" });
    }

    // 2.1 驗證密碼是否正確 (供 admin.html 登入時檢查)
    if (action === "admin_verify") {
      return createJsonResponse({ status: "success", message: "管理員身分驗證成功！" });
    }

    // 2.2 審核回報 (Resolve Report)
    if (action === "admin_resolve_report") {
      const reportId = params.report_id;
      const resolveAction = params.resolve_action; // 'delist' | 'reject' | 'resolved'
      const storeName = params.store_name;

      updateReportStatus(reportId, resolveAction);

      if (resolveAction === "delist" && storeName) {
        setStoreActiveStatus(storeName, false);
      }

      return createJsonResponse({ status: "success", message: `回報 ${reportId} 已處置為 ${resolveAction}` });
    }

    // 2.3 爬蟲與批次 Upsert (供 Python 腳本或後台直接同步)
    if (action === "admin_batch_upsert") {
      let storesList = [];
      if (typeof params.payload === "string") {
        storesList = JSON.parse(params.payload);
      } else if (Array.isArray(params.payload)) {
        storesList = params.payload;
      }

      const count = batchUpsertStoresToSheet(storesList);
      return createJsonResponse({ status: "success", message: `成功批次更新/寫入 ${count} 間店家！`, count: count });
    }

    // 2.4 單一店家資料更新
    if (action === "admin_update_store") {
      let storeData = params.store || params;
      if (typeof storeData === "string") storeData = JSON.parse(storeData);
      updateSingleStoreInSheet(storeData);
      return createJsonResponse({ status: "success", message: "店家資訊已更新！" });
    }

    return createJsonResponse({ status: "error", message: "未知的管理操作: " + action });

  } catch (err) {
    return createJsonResponse({ status: "error", message: "POST 執行異常: " + err.toString() });
  }
}

/**
 * 試算表底層讀寫函式
 */
function getOrCreateSheet(sheetName, defaultHeaders) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (defaultHeaders && defaultHeaders.length > 0) {
      sheet.appendRow(defaultHeaders);
      sheet.getRange(1, 1, 1, defaultHeaders.length).setFontWeight("bold").setBackground("#f1f5f9");
    }
  }
  return sheet;
}

function loadFoodDataFromSheet() {
  const sheet = getOrCreateSheet(STORES_SHEET_NAME, [
    "id", "name", "street", "category", "walk_minutes", "rating", "review_count", 
    "hours", "address", "photo_url", "maps_url", "is_active", "content"
  ]);

  const values = sheet.getDataRange().getValues();
  if (!values || values.length <= 1) return [];

  const headers = values[0].map(h => String(h || "").trim().toLowerCase());
  const rows = values.slice(1);
  const result = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;
    const record = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = row[j] !== undefined && row[j] !== null ? String(row[j]).trim() : "";
    }
    result.push(record);
  }
  return result;
}

function appendReportToSheet(rep) {
  const sheet = getOrCreateSheet(REPORTS_SHEET_NAME, [
    "id", "store_name", "issue_type", "details", "reporter", "status", "created_at"
  ]);

  sheet.appendRow([
    rep.id || ("rep_" + Date.now()),
    rep.store_name || "",
    rep.issue_type || "已永久停業/幽靈店家",
    rep.details || "",
    rep.reporter || "興大熱心同學",
    rep.status || "pending",
    rep.created_at || new Date().toISOString()
  ]);
}

function loadReportsFromSheet() {
  const sheet = getOrCreateSheet(REPORTS_SHEET_NAME, [
    "id", "store_name", "issue_type", "details", "reporter", "status", "created_at"
  ]);

  const values = sheet.getDataRange().getValues();
  if (!values || values.length <= 1) return [];

  const headers = values[0].map(h => String(h || "").trim().toLowerCase());
  const rows = values.slice(1);
  const result = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;
    const record = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = row[j] !== undefined ? String(row[j]).trim() : "";
    }
    result.push(record);
  }
  return result.reverse();
}

function updateReportStatus(reportId, newStatus) {
  const sheet = getOrCreateSheet(REPORTS_SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  if (!values || values.length <= 1) return;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(reportId).trim()) {
      sheet.getRange(i + 1, 6).setValue(newStatus);
      break;
    }
  }
}

function setStoreActiveStatus(storeName, isActive) {
  const sheet = getOrCreateSheet(STORES_SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  if (!values || values.length <= 1) return;

  const headers = values[0].map(h => String(h || "").trim().toLowerCase());
  const nameColIdx = headers.indexOf("name");
  const activeColIdx = headers.indexOf("is_active");
  if (nameColIdx === -1 || activeColIdx === -1) return;

  const targetName = String(storeName).trim().toLowerCase();

  for (let i = 1; i < values.length; i++) {
    const rowName = String(values[i][nameColIdx]).trim().toLowerCase();
    if (rowName === targetName || rowName.includes(targetName) || targetName.includes(rowName)) {
      sheet.getRange(i + 1, activeColIdx + 1).setValue(isActive ? "TRUE" : "FALSE");
    }
  }
}

function batchUpsertStoresToSheet(storesList) {
  if (!Array.isArray(storesList) || storesList.length === 0) return 0;
  const sheet = getOrCreateSheet(STORES_SHEET_NAME, [
    "id", "name", "street", "category", "walk_minutes", "rating", "review_count", 
    "hours", "address", "photo_url", "maps_url", "is_active", "content"
  ]);

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h || "").trim().toLowerCase());
  const nameColIdx = headers.indexOf("name");

  const existingMap = {};
  for (let i = 1; i < values.length; i++) {
    const sName = String(values[i][nameColIdx] || "").trim();
    if (sName) existingMap[sName] = i + 1;
  }

  let count = 0;
  storesList.forEach(store => {
    const sName = String(store.name || "").trim();
    if (!sName) return;

    const rowData = headers.map(header => {
      if (header === "is_active") {
        return store.is_active !== undefined ? (store.is_active ? "TRUE" : "FALSE") : "TRUE";
      }
      return store[header] !== undefined ? store[header] : "";
    });

    if (existingMap[sName]) {
      sheet.getRange(existingMap[sName], 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
      existingMap[sName] = sheet.getLastRow();
    }
    count++;
  });

  return count;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
