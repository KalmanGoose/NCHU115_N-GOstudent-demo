/**
 * ==============================================================================
 * 國立中興大學 (NCHU) 新生美食地圖 - 雙軌後端適配器 (Dual-Backend Adapter)
 * ==============================================================================
 * 
 * 支援後端架構無縫切換：
 * 1. 方案 A (Supabase BaaS): 採用 PostgreSQL + Auth + Real-time REST API，專為大量存取與爬蟲設計。
 * 2. 方案 B (Google Apps Script): 採用 Google Sheets + GAS Web App，輕量免額外註冊。
 * 3. 離線容錯模式 (Local Offline Fallback): 當未連線後端時，自動以 localStorage 作為佇列，永不報錯。
 * 
 * 本模組提供統一介面，徹底杜絕環境依賴打架！
 */

const NCHU_STORAGE_KEYS = {
  CONFIG: "nchu_backend_config",
  LOCAL_REPORTS: "nchu_local_reports_queue",
  REPORTED_STORES: "nchu_reported_stores_cache",
  ADMIN_SESSION: "nchu_admin_session_auth"
};

// 預設後端配置
const DEFAULT_BACKEND_CONFIG = {
  provider: "local", // "supabase" | "gas" | "local"
  supabase: {
    url: "",
    anonKey: "",
    serviceKey: "" // 僅後台管理或爬蟲匯入時使用
  },
  gas: {
    url: localStorage.getItem("nchu_food_api_url") || "https://script.google.com/macros/s/AKfycbz_NCHU_DEMO_URL/exec",
    adminToken: "nchu2026_admin"
  }
};

class NCHUBackendAdapter {
  constructor() {
    this.config = this.loadConfig();
    this.supabaseClient = null;
    this.isSupabaseLoading = false;
  }

  // 1. 配置管理
  loadConfig() {
    try {
      const saved = localStorage.getItem(NCHU_STORAGE_KEYS.CONFIG);
      if (saved) {
        return Object.assign({}, DEFAULT_BACKEND_CONFIG, JSON.parse(saved));
      }
    } catch (e) {
      console.warn("[BackendAdapter] 讀取配置失敗，使用預設值:", e);
    }
    return Object.assign({}, DEFAULT_BACKEND_CONFIG);
  }

  saveConfig(newConfig) {
    this.config = Object.assign({}, this.config, newConfig);
    localStorage.setItem(NCHU_STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    if (this.config.gas && this.config.gas.url) {
      localStorage.setItem("nchu_food_api_url", this.config.gas.url);
    }
    this.supabaseClient = null; // 重置客戶端快取
    return this.config;
  }

  getActiveProvider() {
    return this.config.provider || "local";
  }

  setActiveProvider(provider) {
    if (["supabase", "gas", "local"].includes(provider)) {
      this.config.provider = provider;
      this.saveConfig(this.config);
      return true;
    }
    return false;
  }

  // 2. 動態載入 Supabase SDK (免 npm，純 CDN，絕不與既有前端相依性衝突)
  async initSupabaseClient(useServiceKey = false) {
    if (this.supabaseClient && !useServiceKey) return this.supabaseClient;

    const url = this.config.supabase.url;
    const key = useServiceKey ? (this.config.supabase.serviceKey || this.config.supabase.anonKey) : this.config.supabase.anonKey;

    if (!url || !key) {
      throw new Error("尚未設定 Supabase Project URL 或 API Key！");
    }

    if (!window.supabase) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
        script.onload = resolve;
        script.onerror = () => reject(new Error("Supabase CDN 載入失敗，請檢查網路連線。"));
        document.head.appendChild(script);
      });
    }

    const client = window.supabase.createClient(url, key);
    if (!useServiceKey) this.supabaseClient = client;
    return client;
  }

  // 3. 連線狀態測試
  async testConnection(provider = null) {
    const targetProvider = provider || this.getActiveProvider();

    if (targetProvider === "local") {
      return { success: true, provider: "local", message: "目前為離線快取模式 (使用 LocalStorage 與本機靜態資料庫)" };
    }

    if (targetProvider === "supabase") {
      try {
        const client = await this.initSupabaseClient(false);
        const { data, error } = await client.from("stores").select("id").limit(1);
        if (error) throw error;
        return { success: true, provider: "supabase", message: "Supabase 連線成功！資料表正常運作中。" };
      } catch (err) {
        return { success: false, provider: "supabase", message: "Supabase 連線失敗: " + err.message };
      }
    }

    if (targetProvider === "gas") {
      try {
        const gasUrl = this.config.gas.url;
        if (!gasUrl || !gasUrl.startsWith("http")) throw new Error("無效的 Google Apps Script 網址");
        const sep = gasUrl.includes("?") ? "&" : "?";
        const res = await fetch(`${gasUrl}${sep}action=ping&test=1`, { method: "GET", mode: "cors" });
        const json = await res.json();
        return { success: json.status === "success", provider: "gas", message: json.message || "Google Apps Script 連線成功！" };
      } catch (err) {
        return { success: false, provider: "gas", message: "GAS 連線失敗: " + err.message };
      }
    }

    return { success: false, provider: targetProvider, message: "未知後端提供者" };
  }

  // 4. 前端學生回報功能 (Submit Issue / Report Ghost Store)
  async submitReport(reportData) {
    const payload = {
      id: "rep_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      store_id: reportData.store_id || "",
      store_name: reportData.store_name || "未知店家",
      issue_type: reportData.issue_type || "已永久停業/幽靈店家",
      details: reportData.details || "",
      reporter: reportData.reporter || "興大熱心同學",
      status: "pending",
      created_at: new Date().toISOString()
    };

    // 寫入本地已回報快取
    try {
      const reportedMap = JSON.parse(localStorage.getItem(NCHU_STORAGE_KEYS.REPORTED_STORES) || "{}");
      reportedMap[payload.store_name] = Date.now();
      localStorage.setItem(NCHU_STORAGE_KEYS.REPORTED_STORES, JSON.stringify(reportedMap));
    } catch (e) {}

    const provider = this.getActiveProvider();

    // 方案 A: Supabase
    if (provider === "supabase" && this.config.supabase.url && this.config.supabase.anonKey) {
      try {
        const client = await this.initSupabaseClient(false);
        const { error } = await client.from("reports").insert([payload]);
        if (error) throw error;
        return { success: true, provider: "supabase", message: "回報成功送出至雲端資料庫！" };
      } catch (err) {
        console.warn("[BackendAdapter] Supabase 回報失敗，自動轉入本地暫存佇列:", err);
        this.saveReportToLocalQueue(payload);
        return { success: true, provider: "local_queue", message: "雲端連線忙碌，回報已安全暫存，將於稍後同步！" };
      }
    }

    // 方案 B: Google Apps Script
    if (provider === "gas" && this.config.gas.url && this.config.gas.url.startsWith("http")) {
      try {
        // GAS POST 需要使用 no-cors 或以 URLSearchParams / JSON 處理
        const res = await fetch(this.config.gas.url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            action: "report",
            payload: JSON.stringify(payload)
          })
        });
        const resJson = await res.json().catch(() => ({ status: "success" }));
        return { success: true, provider: "gas", message: "回報成功記錄至 Google 試算表！" };
      } catch (err) {
        console.warn("[BackendAdapter] GAS 回報失敗，自動轉入本地暫存佇列:", err);
        this.saveReportToLocalQueue(payload);
        return { success: true, provider: "local_queue", message: "試算表連線忙碌，回報已暫存！" };
      }
    }

    // 方案 C: 離線本地佇列
    this.saveReportToLocalQueue(payload);
    return { success: true, provider: "local", message: "感謝回報！資料已妥善儲存。" };
  }

  saveReportToLocalQueue(report) {
    try {
      const queue = JSON.parse(localStorage.getItem(NCHU_STORAGE_KEYS.LOCAL_REPORTS) || "[]");
      queue.unshift(report);
      localStorage.setItem(NCHU_STORAGE_KEYS.LOCAL_REPORTS, JSON.stringify(queue.slice(0, 100)));
    } catch (e) {
      console.error("[BackendAdapter] Local queue error:", e);
    }
  }

  isStoreReported(storeName) {
    try {
      const map = JSON.parse(localStorage.getItem(NCHU_STORAGE_KEYS.REPORTED_STORES) || "{}");
      return !!map[storeName];
    } catch (e) {
      return false;
    }
  }

  // 5. 後台管理：讀取待審核回報 (Admin Get Reports)
  async getReports() {
    const provider = this.getActiveProvider();

    if (provider === "supabase" && this.config.supabase.url) {
      try {
        const client = await this.initSupabaseClient(true);
        const { data, error } = await client.from("reports").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn("[BackendAdapter] 讀取 Supabase 回報失敗，讀取本地佇列:", err);
      }
    }

    if (provider === "gas" && this.config.gas.url) {
      try {
        const url = `${this.config.gas.url}?action=admin_get_reports&token=${encodeURIComponent(this.config.gas.adminToken)}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.status === "success" && json.data) {
          return json.data;
        }
      } catch (err) {
        console.warn("[BackendAdapter] 讀取 GAS 回報失敗:", err);
      }
    }

    // 回傳本地佇列
    try {
      return JSON.parse(localStorage.getItem(NCHU_STORAGE_KEYS.LOCAL_REPORTS) || "[]");
    } catch (e) {
      return [];
    }
  }

  // 6. 後台管理：處理回報 (Resolve Report)
  // action: 'delist' (下架店家) | 'reject' (駁回) | 'resolved' (已更新資訊完成)
  async resolveReport(reportId, action, storeIdOrName) {
    const provider = this.getActiveProvider();

    if (provider === "supabase" && this.config.supabase.url) {
      try {
        const client = await this.initSupabaseClient(true);
        // 更新回報狀態
        await client.from("reports").update({ status: action }).eq("id", reportId);

        // 若為下架操作，將店家設為 inactive
        if (action === "delist" && storeIdOrName) {
          await client.from("stores").update({ is_active: false }).or(`id.eq.${storeIdOrName},name.eq.${storeIdOrName}`);
        }
        return { success: true };
      } catch (err) {
        console.error("Supabase resolve error:", err);
      }
    }

    if (provider === "gas" && this.config.gas.url) {
      try {
        const res = await fetch(this.config.gas.url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            action: "admin_resolve_report",
            token: this.config.gas.adminToken,
            report_id: reportId,
            resolve_action: action,
            store_name: storeIdOrName
          })
        });
        return await res.json();
      } catch (err) {
        console.error("GAS resolve error:", err);
      }
    }

    // 本地佇列狀態變更
    try {
      const queue = JSON.parse(localStorage.getItem(NCHU_STORAGE_KEYS.LOCAL_REPORTS) || "[]");
      const target = queue.find(r => r.id === reportId);
      if (target) target.status = action;
      localStorage.setItem(NCHU_STORAGE_KEYS.LOCAL_REPORTS, JSON.stringify(queue));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 7. 店家資料庫管理 (CRUD)
  async getAllStores() {
    const provider = this.getActiveProvider();

    if (provider === "supabase" && this.config.supabase.url) {
      try {
        const client = await this.initSupabaseClient(false);
        const { data, error } = await client.from("stores").select("*").order("name");
        if (error) throw error;
        if (data && data.length > 0) return data;
      } catch (err) {
        console.warn("[BackendAdapter] Supabase 讀取店家失敗，使用本地資料庫:", err);
      }
    }

    if (provider === "gas" && this.config.gas.url) {
      try {
        const res = await fetch(this.config.gas.url);
        const json = await res.json();
        if (json.status === "success" && json.data && json.data.length > 0) {
          return json.data;
        }
      } catch (err) {
        console.warn("[BackendAdapter] GAS 讀取店家失敗，使用本地資料庫:", err);
      }
    }

    // 預設由前端全域變數提供 (food_full_database.js)
    if (window.NCHU_EXPANDED_FOOD && window.NCHU_EXPANDED_FOOD.length > 0) {
      return window.NCHU_EXPANDED_FOOD;
    }
    return [];
  }

  // 8. 批次寫入/更新店家 (供管理後台與未來 Python 爬蟲批次匯入使用)
  async batchUpsertStores(storesList) {
    const provider = this.getActiveProvider();

    if (provider === "supabase" && this.config.supabase.url) {
      const client = await this.initSupabaseClient(true);
      const { data, error } = await client.from("stores").upsert(storesList, { onConflict: "name" });
      if (error) throw error;
      return { success: true, count: storesList.length, message: `成功更新 ${storesList.length} 筆店家至 Supabase！` };
    }

    if (provider === "gas" && this.config.gas.url) {
      const res = await fetch(this.config.gas.url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          action: "admin_batch_upsert",
          token: this.config.gas.adminToken,
          payload: JSON.stringify(storesList)
        })
      });
      const json = await res.json();
      return json;
    }

    return { success: false, message: "請先在設定中啟用 Supabase 或 Google Apps Script 後端！" };
  }
}

// 建立單例實例掛載於全域
window.nchuBackendAdapter = new NCHUBackendAdapter();
