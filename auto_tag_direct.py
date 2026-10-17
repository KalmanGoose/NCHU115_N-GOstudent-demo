import json
import csv
import os
import re
from typing import Dict, List, Any, Tuple

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
CSV_PATH = os.path.join(BASE_DIR, "campus_knowledge.csv")
GS_PATH = os.path.join(BASE_DIR, "KnowledgeData.gs")
FRESHMAN_GS_PATH = os.path.join(BASE_DIR, "FreshmanKnowledge.gs")

def check_is_direct(name: str, kws: List[str], content: str, existing_direct: bool = False) -> Tuple[bool, str]:
    if existing_direct:
        return True, "手動標記/現有Direct"

    name_lower = name.lower()
    kws_str = " ".join(kws).lower()
    content_lower = content.lower()

    # 1. 美食與餐飲情報
    food_name_patterns = ["美食", "小吃", "餐廳", "學餐", "忠孝夜市", "早餐", "宵夜", "飲料", "便當", "咖啡", "特約", "南門路"]
    food_kw_patterns = ["吃", "炒飯", "火鍋", "排骨飯", "外送", "菜單", "營業時間", "價位"]
    if any(p in name for p in food_name_patterns):
        return True, "美食與餐飲情報"
    if any(p in kws_str for p in food_kw_patterns):
        return True, "美食與餐飲情報"

    # 2. 系群、表單與外部連結
    link_patterns = ["系群", "新生群", "line群", "表單", "選課網址", "行事曆連結"]
    if any(p in name_lower for p in link_patterns) or any(p in kws_str for p in link_patterns):
        return True, "系群與社群連結"
    if "https://" in content and len(content) < 200:
        return True, "純外鏈導向條目"

    # 3. 處室聯絡與固定地點
    contact_patterns = ["分機", "電話", "辦公室位置", "聯絡資訊"]
    if any(p in name for p in contact_patterns):
        return True, "處室聯絡與固定地點"

    return False, ""

def process_and_sync_all():
    print("\n" + "="*70)
    print(" 🚀 啟動知識庫 Direct 快速通道全自動標記與同步程序")
    print("="*70)

    # 1. 讀取現有 KnowledgeData.gs 或 campus_knowledge.json
    entries = []
    if os.path.exists(GS_PATH):
        with open(GS_PATH, "r", encoding="utf-8") as f:
            text = f.read()
        match = re.search(r'var\s+CAMPUS_KNOWLEDGE\s*=\s*(\[[\s\S]*?\])\s*;', text)
        if match:
            try:
                entries = json.loads(match.group(1))
            except Exception as e:
                print(f"⚠️ JSON 解析 KnowledgeData.gs 失敗: {e}")

    if not entries and os.path.exists(JSON_PATH):
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            raw_json = json.load(f)
            for it in raw_json:
                kws = [k.strip() for k in it.get("關鍵字", "").split(",") if k.strip()]
                entries.append({
                    "keywords": kws,
                    "name": it.get("名稱", ""),
                    "content": it.get("情報內容", ""),
                    "direct": it.get("direct", False)
                })

    total_count = len(entries)
    print(f"📊 讀取到知識庫總條目數: {total_count} 筆")

    # 2. 自動標記統計
    stats = {
        "美食與餐飲情報": 0,
        "系群與社群連結": 0,
        "純外鏈導向條目": 0,
        "處室聯絡與固定地點": 0,
        "手動標記/現有Direct": 0
    }
    tagged_count = 0

    updated_entries = []
    for it in entries:
        name = it.get("name") or it.get("名稱") or ""
        kws = it.get("keywords") or []
        if isinstance(kws, str):
            kws = [k.strip() for k in kws.split(",") if k.strip()]
        content = it.get("content") or it.get("情報內容") or ""
        existing_direct = bool(it.get("direct", False))

        is_direct, reason = check_is_direct(name, kws, content, existing_direct)
        entry_obj = {
            "keywords": kws,
            "name": name,
            "content": content
        }
        if is_direct:
            entry_obj["direct"] = True
            tagged_count += 1
            if reason in stats:
                stats[reason] += 1
            else:
                stats["手動標記/現有Direct"] += 1

        updated_entries.append(entry_obj)

    # 3. 輸出 1: campus_knowledge.json
    print(f"\n💾 1. 正在更新 {JSON_PATH} ...")
    json_export = []
    for it in updated_entries:
        item_dict = {
            "關鍵字": ",".join(it["keywords"]),
            "名稱": it["name"],
            "情報內容": it["content"]
        }
        if it.get("direct"):
            item_dict["direct"] = True
        json_export.append(item_dict)

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(json_export, f, ensure_ascii=False, indent=2)
    print(f"  ✅ campus_knowledge.json 更新完成！({total_count} 筆)")

    # 4. 輸出 2: campus_knowledge.csv (UTF-8 with BOM)
    print(f"💾 2. 正在更新 {CSV_PATH} ...")
    with open(CSV_PATH, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["關鍵字", "名稱", "情報內容", "direct"])
        writer.writeheader()
        for it in json_export:
            row = {
                "關鍵字": it["關鍵字"],
                "名稱": it["名稱"],
                "情報內容": it["情報內容"],
                "direct": "true" if it.get("direct") else ""
            }
            writer.writerow(row)
    print(f"  ✅ campus_knowledge.csv 更新完成！({total_count} 筆)")

    # 5. 輸出 3: KnowledgeData.gs
    print(f"💾 3. 正在更新 {GS_PATH} ...")
    gs_header = "/**\n * ==============================================================================\n * 國立中興大學 (NCHU) 全校園知識庫靜態常數資料 (KnowledgeData.gs)\n * 本檔案由 auto_tag_direct.py 自動產生，已啟用 Direct 快速通道標記。\n * 總條目數: " + str(total_count) + " 筆 (Direct 快速通道: " + str(tagged_count) + " 筆)\n * ==============================================================================\n */\n\n"
    gs_content = gs_header + "var CAMPUS_KNOWLEDGE = " + json.dumps(updated_entries, ensure_ascii=False, indent=2) + ";\n"
    with open(GS_PATH, "w", encoding="utf-8") as f:
        f.write(gs_content)
    print(f"  ✅ KnowledgeData.gs 更新完成！({total_count} 筆)")

    print("\n" + "="*70)
    print(" 🎉 自動標記與同步作業完成！")
    print(f" 📌 知識庫總筆數: {total_count} 筆")
    print(f" ⚡ 總共成功標記 Direct 快速通道: {tagged_count} 筆 ({round(tagged_count/total_count*100, 1)}%)")
    print(" 📊 細項分類統計：")
    for category, count in stats.items():
        if count > 0:
            print(f"   • {category}: {count} 筆")
    print("="*70)

if __name__ == "__main__":
    process_and_sync_all()
