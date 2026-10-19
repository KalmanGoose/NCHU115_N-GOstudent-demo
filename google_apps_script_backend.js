/**
 * ==============================================================================
 * 國立中興大學 (NCHU) 新生美食地圖 - Google Apps Script (GAS) 升級版後端
 * ==============================================================================
 * 
 * 【特色】
 * 1. 同時支援「訪客免登入查詢」與「管理員 Token 授權管理」。
 * 2. 支援前端學生即時提交「幽靈店家 / 資訊錯誤」回報，自動記錄至 Reports 工作表。
 * 3. 支援後台審核一鍵將店家標記為停業 (is_active = FALSE)。
 * 4. 支援 Python 爬蟲與後台面板「批次 Upsert (新增或覆寫)」店家資料。
 * 5. 全面支援 CORS，無跨域障礙。
 * 
 * 【預設管理金鑰】
 * 在下方 ADMIN_SECRET_TOKEN 自訂你的管理密碼 (預設: nchu2026_admin)。
 * ==============================================================================
 */

const ADMIN_SECRET_TOKEN = "nchu2026_admin";
const STORES_SHEET_NAME = "Stores";
const REPORTS_SHEET_NAME = "Reports";

/**
 * 處理 GET 請求 (查詢店家、心跳檢測、讀取回報)
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

    // 2. 管理員讀取回報清單
    if (params.action === "admin_get_reports") {
      if (params.token !== ADMIN_SECRET_TOKEN) {
        return createJsonResponse({ status: "error", message: "管理員授權失敗！密鑰錯誤。" });
      }
      const reports = loadReportsFromSheet();
      return createJsonResponse({ status: "success", count: reports.length, data: reports });
    }

    // 3. 一般店家資料查詢
    const allFoods = loadFoodDataFromSheet();
    const targetStreet = (params.street || "").trim().toLowerCase();
    const targetCategory = (params.category || "").trim().toLowerCase();
    const maxWalk = parseInt(params.max_walk || "0", 10);
    const searchQuery = (params.search || params.q || "").trim().toLowerCase();
    const showAll = params.include_inactive === "true" || params.include_inactive === "1";

    let filtered = allFoods.filter(item => {
      // 預設只顯示 active 店家
      if (!showAll && String(item.is_active).toUpperCase() === "FALSE") {
        return false;
      }

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
        if (itemWalk > maxWalk) return false;
      }

      // 關鍵字搜尋
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
 * 處理 POST 請求 (提交回報、審核處理、爬蟲批次匯入)
 */
function doPost(e) {
  try {
    let params = {};
    if (e && e.parameter) params = e.parameter;

    // 嘗試解析 JSON postData
    if (e && e.postData && e.postData.contents) {
      try {
        const jsonBody = JSON.parse(e.postData.contents);
        params = Object.assign({}, params, jsonBody);
      } catch (err) {}
    }

    const action = params.action;

    // 1. 學生提交回報 (免 Token)
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
      return createJsonResponse({ status: "success", message: "回報已成功記錄至 Google 試算表！" });
    }

    // 2. 管理員操作 (需要 Token 驗證)
    const token = params.token || params.adminToken;
    if (token !== ADMIN_SECRET_TOKEN) {
      return createJsonResponse({ status: "error", message: "管理員授權失敗！密鑰不符。" });
    }

    // 2.1 審核回報 (Resolve Report)
    if (action === "admin_resolve_report") {
      const reportId = params.report_id;
      const resolveAction = params.resolve_action; // 'delist' | 'reject' | 'resolved'
      const storeName = params.store_name;

      updateReportStatus(reportId, resolveAction);

      // 若選擇下架，將該店家設為 FALSE
      if (resolveAction === "delist" && storeName) {
        setStoreActiveStatus(storeName, false);
      }

      return createJsonResponse({ status: "success", message: `回報 ${reportId} 已處置為 ${resolveAction}` });
    }

    // 2.2 批次匯入/爬蟲 Upsert 店家資料
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

    // 2.3 單一店家資料更新
    if (action === "admin_update_store") {
      let storeData = params.store || params;
      if (typeof storeData === "string") storeData = JSON.parse(storeData);
      updateSingleStoreInSheet(storeData);
      return createJsonResponse({ status: "success", message: "店家資訊已更新！" });
    }

    return createJsonResponse({ status: "error", message: "未知的 POST 操作: " + action });

  } catch (err) {
    return createJsonResponse({ status: "error", message: "POST 執行異常: " + err.toString() });
  }
}

/**
 * 試算表讀寫核心函式
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
  return result.reverse(); // 最新回報置頂
}

function updateReportStatus(reportId, newStatus) {
  const sheet = getOrCreateSheet(REPORTS_SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  if (!values || values.length <= 1) return;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(reportId).trim()) {
      sheet.getRange(i + 1, 6).setValue(newStatus); // 第6欄是 status
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

  // 現有店名與行數索引對應
  const existingMap = {};
  for (let i = 1; i < values.length; i++) {
    const sName = String(values[i][nameColIdx] || "").trim();
    if (sName) existingMap[sName] = i + 1; // 1-indexed row number
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
      // 覆寫既有行
      sheet.getRange(existingMap[sName], 1, 1, rowData.length).setValues([rowData]);
    } else {
      // 新增一行
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
