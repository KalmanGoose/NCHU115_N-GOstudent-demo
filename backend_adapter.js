/**
 * ==============================================================================
 * 國立中興大學 (NCHU) 新生美食地圖 - 雙軌後端適配器 (Dual-Backend Adapter)
 * ==============================================================================
 * 
 * 🔒【資安防護規範 - 零硬編碼安全架構】
 * 1. 本檔案絕無寫死任何管理員密碼、Token 或 Service Role Key。
 * 2. 方案 A (Supabase):
 *    - 前端僅使用公開匿名金鑰 (anonKey)。
 *    - 後台管理強制使用 Supabase Auth 帳號密碼登入 (Email/Password)，由 RLS 驗證身份。
 * 3. 方案 B (Google Apps Script):
 *    - 管理員於登入介面動態輸入密碼，僅在當前分頁 sessionStorage 保持會話，
 *      關閉分頁即銷毀，且與 Google 雲端 Script Properties 比對，完全不在代碼內寫死。
 * ==============================================================================
 */

const NCHU_STORAGE_KEYS = {
  CONFIG: "nchu_backend_config",
  LOCAL_REPORTS: "nchu_local_reports_queue",
  REPORTED_STORES: "nchu_reported_stores_cache",
  SESSION_TOKEN: "nchu_admin_auth_session" // 僅在 sessionStorage 使用
};

// 預設後端配置 (無任何機密金鑰，全部由管理者動態綁定或使用本地模式)
const DEFAULT_BACKEND_CONFIG = {
  provider: "local", // "supabase" | "gas" | "local"
  supabase: {
    url: "",
    anonKey: "" // 僅公開唯讀/回報之 anonKey，無管理員權限
  },
  gas: {
    url: localStorage.getItem("nchu_food_api_url") || ""
  }
};

class NCHUBackendAdapter {
  constructor() {
    this.config = this.loadConfig();
    this.supabaseClient = null;
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
    // 嚴格過濾：禁止將任何私鑰或密碼持久化到 localStorage
    const safeToSave = {
      provider: this.config.provider,
      supabase: {
        url: this.config.supabase ? this.config.supabase.url : "",
        anonKey: this.config.supabase ? this.config.supabase.anonKey : ""
      },
      gas: {
        url: this.config.gas ? this.config.gas.url : ""
      }
    };
    localStorage.setItem(NCHU_STORAGE_KEYS.CONFIG, JSON.stringify(safeToSave));
    if (this.config.gas && this.config.gas.url) {
      localStorage.setItem("nchu_food_api_url", this.config.gas.url);
    }
    this.supabaseClient = null;
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

  // 2. 動態載入 Supabase SDK (純 CDN，零 npm 依賴衝突)
  async initSupabaseClient() {
    if (this.supabaseClient) return this.supabaseClient;

    const url = this.config.supabase.url;
    const key = this.config.supabase.anonKey;

    if (!url || !key) {
      throw new Error("尚未設定 Supabase Project URL 或公開 Anon Key！");
    }

    if (!window.supabase) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
        script.onload = resolve;
        script.onerror = () => reject(new Error("Supabase SDK 載入失敗，請確認網路連線。"));
        document.head.appendChild(script);
      });
    }

    this.supabaseClient = window.supabase.createClient(url, key);
    return this.supabaseClient;
  }

  // 3. 連線狀態測試
  async testConnection(provider = null) {
    const targetProvider = provider || this.getActiveProvider();

    if (targetProvider === "local") {
      return { success: true, provider: "local", message: "目前為離線快取模式 (使用本機 255 筆精準資料庫)" };
    }

    if (targetProvider === "supabase") {
      try {
        const client = await this.initSupabaseClient();
        const { data, error } = await client.from("stores").select("id").limit(1);
        if (error) throw error;
        return { success: true, provider: "supabase", message: "Supabase 雲端資料庫連線正常！" };
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

    return { success: false, provider: targetProvider, message: "未知後端模式" };
  }

  // 4. 前端學生回報功能 (公開功能，不需要管理員權限)
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

    // 記錄於本地已回報快取
    try {
      const reportedMap = JSON.parse(localStorage.getItem(NCHU_STORAGE_KEYS.REPORTED_STORES) || "{}");
      reportedMap[payload.store_name] = Date.now();
      localStorage.setItem(NCHU_STORAGE_KEYS.REPORTED_STORES, JSON.stringify(reportedMap));
    } catch (e) {}

    const provider = this.getActiveProvider();

    // 方案 A: Supabase (RLS 允許公眾 Insert)
    if (provider === "supabase" && this.config.supabase.url && this.config.supabase.anonKey) {
      try {
        const client = await this.initSupabaseClient();
        const { error } = await client.from("reports").insert([payload]);
        if (error) throw error;
        return { success: true, provider: "supabase", message: "回報成功送出至雲端資料庫！" };
      } catch (err) {
        console.warn("[BackendAdapter] Supabase 回報失敗，自動轉入本地暫存:", err);
        this.saveReportToLocalQueue(payload);
        return { success: true, provider: "local_queue", message: "雲端忙碌，回報已安全暫存，稍後自動同步！" };
      }
    }

    // 方案 B: Google Apps Script
    if (provider === "gas" && this.config.gas.url && this.config.gas.url.startsWith("http")) {
      try {
        const res = await fetch(this.config.gas.url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            action: "report",
            payload: JSON.stringify(payload)
          })
        });
        return { success: true, provider: "gas", message: "回報已成功送達 Google 試算表！" };
      } catch (err) {
        console.warn("[BackendAdapter] GAS 回報失敗，轉入本地暫存:", err);
        this.saveReportToLocalQueue(payload);
        return { success: true, provider: "local_queue", message: "連線忙碌，回報已暫存！" };
      }
    }

    // 本地離線暫存
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

  // 5. 管理員身份驗證 (Admin Authentication)
  // 密碼僅在記憶體/sessionStorage中維持，絕不寫死
  getAdminSessionToken() {
    return sessionStorage.getItem(NCHU_STORAGE_KEYS.SESSION_TOKEN) || "";
  }

  setAdminSessionToken(token) {
    sessionStorage.setItem(NCHU_STORAGE_KEYS.SESSION_TOKEN, token);
  }

  clearAdminSession() {
    sessionStorage.removeItem(NCHU_STORAGE_KEYS.SESSION_TOKEN);
    sessionStorage.removeItem("nchu_admin_logged_in");
  }

  // 5.1 方案 B (GAS) 密碼驗證
  async loginGAS(password) {
    const gasUrl = this.config.gas.url;
    if (!gasUrl) throw new Error("尚未設定 Google Apps Script Web App 網址！");

    const res = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        action: "admin_verify",
        token: password
      })
    });
    const json = await res.json();
    if (json.status !== "success") {
      throw new Error(json.message || "密碼驗證失敗！");
    }

    this.setAdminSessionToken(password);
    return true;
  }

  // 5.2 方案 A (Supabase) 帳號密碼登入
  async loginSupabase(email, password) {
    const client = await this.initSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data && data.session) {
      this.setAdminSessionToken(data.session.access_token);
      return true;
    }
    throw new Error("登入失敗，未獲取授權 Session。");
  }

  // 6. 後台管理：安全讀取待審核回報 (Admin Get Reports)
  async getReports() {
    const provider = this.getActiveProvider();

    if (provider === "supabase" && this.config.supabase.url) {
      try {
        const client = await this.initSupabaseClient();
        const { data, error } = await client.from("reports").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn("[BackendAdapter] 讀取 Supabase 回報失敗:", err);
      }
    }

    if (provider === "gas" && this.config.gas.url) {
      const token = this.getAdminSessionToken();
      if (!token) throw new Error("尚未登入管理員帳號！");

      const url = `${this.config.gas.url}?action=admin_get_reports&token=${encodeURIComponent(token)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === "success" && json.data) {
        return json.data;
      }
      throw new Error(json.message || "取得回報清單失敗");
    }

    try {
      return JSON.parse(localStorage.getItem(NCHU_STORAGE_KEYS.LOCAL_REPORTS) || "[]");
    } catch (e) {
      return [];
    }
  }

  // 7. 後台管理：安全處置回報 (Resolve Report)
  async resolveReport(reportId, action, storeIdOrName) {
    const provider = this.getActiveProvider();

    if (provider === "supabase" && this.config.supabase.url) {
      const client = await this.initSupabaseClient();
      await client.from("reports").update({ status: action }).eq("id", reportId);

      if (action === "delist" && storeIdOrName) {
        await client.from("stores").update({ is_active: false }).or(`id.eq.${storeIdOrName},name.eq.${storeIdOrName}`);
      }
      return { success: true };
    }

    if (provider === "gas" && this.config.gas.url) {
      const token = this.getAdminSessionToken();
      if (!token) throw new Error("管理員未認證！");

      const res = await fetch(this.config.gas.url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          action: "admin_resolve_report",
          token: token,
          report_id: reportId,
          resolve_action: action,
          store_name: storeIdOrName
        })
      });
      return await res.json();
    }

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

  // 8. 讀取所有店家 (供前台與後台使用)
  async getAllStores() {
    const provider = this.getActiveProvider();

    if (provider === "supabase" && this.config.supabase.url) {
      try {
        const client = await this.initSupabaseClient();
        const { data, error } = await client.from("stores").select("*").order("name");
        if (error) throw error;
        if (data && data.length > 0) return data;
      } catch (err) {
        console.warn("[BackendAdapter] Supabase 讀取店家失敗，使用本地備用資料:", err);
      }
    }

    if (provider === "gas" && this.config.gas.url) {
      try {
        const token = this.getAdminSessionToken();
        const tokenParam = token ? `&token=${encodeURIComponent(token)}&include_inactive=true` : "";
        const res = await fetch(`${this.config.gas.url}?t=${Date.now()}${tokenParam}`);
        const json = await res.json();
        if (json.status === "success" && json.data && json.data.length > 0) {
          return json.data;
        }
      } catch (err) {
        console.warn("[BackendAdapter] GAS 讀取店家失敗，使用本地備用資料:", err);
      }
    }

    if (window.NCHU_EXPANDED_FOOD && window.NCHU_EXPANDED_FOOD.length > 0) {
      return window.NCHU_EXPANDED_FOOD;
    }
    return [];
  }

  // 9. 批次寫入/更新店家 (需要管理員權限)
  async batchUpsertStores(storesList) {
    const provider = this.getActiveProvider();

    if (provider === "supabase" && this.config.supabase.url) {
      const client = await this.initSupabaseClient();
      const { data, error } = await client.from("stores").upsert(storesList, { onConflict: "name" });
      if (error) throw error;
      return { success: true, count: storesList.length, message: `成功更新 ${storesList.length} 筆店家至 Supabase！` };
    }

    if (provider === "gas" && this.config.gas.url) {
      const token = this.getAdminSessionToken();
      if (!token) throw new Error("請先登入管理員帳號！");

      const res = await fetch(this.config.gas.url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          action: "admin_batch_upsert",
          token: token,
          payload: JSON.stringify(storesList)
        })
      });
      return await res.json();
    }

    return { success: false, message: "本機離線模式不支援遠端寫入，請先配置後端！" };
  }
}

// 建立全域適配器單例
window.nchuBackendAdapter = new NCHUBackendAdapter();
