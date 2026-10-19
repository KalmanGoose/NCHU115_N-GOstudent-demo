#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) 新生美食地圖 - 爬蟲與店家資料自動化批次更新腳本
==============================================================================

【功能說明】
未來你寫完 Google Maps、IG、Dcard 或任何爬蟲腳本後，直接呼叫本模組，
就能自動將最新店家資訊批次更新到雲端後端 (支援 Supabase 或 Google Apps Script)！
完全不需要手動開試算表或編輯 JS 檔案！

【支援模式】
1. 方案 A (Supabase): 呼叫 REST API 進行批次 Upsert (衝突時自動更新)。
2. 方案 B (Google Apps Script): 呼叫 Web App POST API 批次更新。
==============================================================================
"""

import os
import sys
import json
import csv
import requests

# ============================
# ⚙️ 後端連線配置 (優先讀取環境變數，避免金鑰外洩)
# ============================
BACKEND_MODE = os.environ.get("BACKEND_MODE", "gas")  # 可選: "supabase" 或 "gas"

# 方案 A: Supabase 配置 (由環境變數讀取)
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# 方案 B: Google Apps Script 配置 (由環境變數讀取)
GAS_WEB_APP_URL = os.environ.get("GAS_WEB_APP_URL", "")
GAS_ADMIN_TOKEN = os.environ.get("GAS_ADMIN_TOKEN", "")


def upload_to_supabase(stores_list):
    """透過 Supabase REST API 批次 Upsert 店家資料"""
    if not SUPABASE_URL.startswith("http") or "your-project-id" in SUPABASE_URL:
        print("❌ 請先在腳本頂部設定正確的 SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY！")
        return False

    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/stores"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"  # 遇到相同名稱或 ID 時自動更新欄位
    }

    print(f"🚀 正在批次上傳 {len(stores_list)} 筆店家至 Supabase: {endpoint}...")
    try:
        response = requests.post(endpoint, json=stores_list, headers=headers, timeout=30)
        if response.status_code in [200, 201]:
            print(f"✅ 成功寫入/更新 {len(stores_list)} 筆店家至 Supabase！")
            return True
        else:
            print(f"❌ 上傳失敗 (HTTP {response.status_code}): {response.text}")
            return False
    except Exception as e:
        print(f"❌ 網路連線異常: {e}")
        return False


def upload_to_gas(stores_list):
    """透過 Google Apps Script Web App 批次 Upsert 店家資料"""
    if not GAS_WEB_APP_URL.startswith("http") or "your-gas-id" in GAS_WEB_APP_URL:
        print("❌ 請先在腳本頂部設定正確的 GAS_WEB_APP_URL 與 GAS_ADMIN_TOKEN！")
        return False

    payload = {
        "action": "admin_batch_upsert",
        "token": GAS_ADMIN_TOKEN,
        "payload": json.dumps(stores_list, ensure_ascii=False)
    }

    print(f"🚀 正在批次上傳 {len(stores_list)} 筆店家至 Google Apps Script...")
    try:
        response = requests.post(GAS_WEB_APP_URL, data=payload, timeout=60)
        res_json = response.json()
        if res_json.get("status") == "success":
            print(f"✅ {res_json.get('message', '成功更新試算表！')}")
            return True
        else:
            print(f"❌ GAS 回傳錯誤: {res_json.get('message')}")
            return False
    except Exception as e:
        print(f"❌ GAS 連線異常: {e}")
        return False


def load_from_csv(csv_path):
    """讀取 CSV 格式的店家爬蟲結果"""
    stores = []
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader):
            store = {
                "id": row.get("id") or f"scraped_{idx+1}",
                "name": row.get("name", "").strip(),
                "street": row.get("street", "學府路/頂橋巷弄").strip(),
                "category": row.get("category", "特色美食").strip(),
                "walk_minutes": int(row.get("walk_minutes") or 5),
                "rating": float(row.get("rating") or 4.5),
                "review_count": int(row.get("review_count") or 100),
                "hours": row.get("hours", "11:00 - 20:00").strip(),
                "address": row.get("address", "").strip(),
                "photo_url": row.get("photo_url", "").strip(),
                "maps_url": row.get("maps_url", "").strip(),
                "is_active": True,
                "content": row.get("content", "").strip()
            }
            if store["name"]:
                stores.append(store)
    return stores


def main():
    print("=" * 60)
    print("🌲 國立中興大學新生美食地圖 - 爬蟲自動化 API 匯入工具")
    print("=" * 60)

    # 範例資料 (模擬爬蟲產出的新店家)
    sample_scraped_data = [
        {
            "id": "crawler_demo_01",
            "name": "早安廚房 (學府店)",
            "street": "學府路/頂橋巷弄",
            "category": "早餐早午餐",
            "walk_minutes": 4,
            "rating": 4.6,
            "review_count": 210,
            "hours": "06:00 - 13:30 (週日公休)",
            "address": "台中市南區學府路88號",
            "is_active": True,
            "content": "興大早八熱門平價早餐，蛋餅與厚片吐司酥脆現點現做！"
        }
    ]

    # 如果有命令列參數傳入 CSV 檔案
    if len(sys.argv) > 1 and sys.argv[1].endswith(".csv"):
        csv_file = sys.argv[1]
        print(f"📂 正在從 CSV 檔案載入店家: {csv_file}")
        stores = load_from_csv(csv_file)
    else:
        stores = sample_scraped_data

    print(f"📊 待上傳總筆數: {len(stores)} 筆")

    # 執行上傳
    if BACKEND_MODE == "supabase":
        upload_to_supabase(stores)
    elif BACKEND_MODE == "gas":
        upload_to_gas(stores)
    else:
        print(f"❌ 未知後端模式: {BACKEND_MODE}，請設為 'supabase' 或 'gas'")


if __name__ == "__main__":
    main()
