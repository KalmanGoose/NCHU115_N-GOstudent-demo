#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) 知識庫 direct 屬性語意判讀與關鍵字自動補全腳本
(auto_classify_knowledge.py)
==============================================================================
"""

import os
import sys
import re
import csv
import json
import argparse
from typing import List, Dict, Any, Tuple

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
CSV_PATH = os.path.join(BASE_DIR, "campus_knowledge.csv")
GS_PATH = os.path.join(BASE_DIR, "KnowledgeData.gs")

def expand_conversational_keywords(base_kws: List[str], name: str, content: str, is_direct: bool) -> List[str]:
    """為每一筆條目擴充 5~10 個常見口語搜尋詞、簡稱與情境問法"""
    seen = set()
    expanded = []

    def add_kw(kw: str):
        k = kw.strip()
        if k and len(k) >= 2 and k.lower() not in seen:
            seen.add(k.lower())
            expanded.append(k)

    for k in base_kws:
        add_kw(k)

    # 1. 美食類別擴充
    if "美食" in name or "小吃" in name or "餐廳" in name or any(f in content for f in ["咖哩", "麵線", "沙拉", "便當", "火鍋", "甜點", "宵夜", "早餐", "午餐"]):
        for extra in ["中興吃什麼", "興大美食推薦", "校園周邊午餐", "晚餐吃什麼", "平價小吃", "學長姐推薦餐廳", "附近必吃", "好吃的店", "菜單價位"]:
            add_kw(extra)

    # 2. 系群 / 外部連結類別擴充
    elif "系群" in name or "新生群" in name or "LINE" in name:
        for extra in ["新生交流群", "系上line群組", "大一新生群組", "怎麼找系上同學", "加系群連結", "系學會邀請", "新生群qr", "OpenChat"]:
            add_kw(extra)

    # 3. 通識課程評價類別擴充
    elif "通識" in name or "評價" in name or "涼度" in content or "甜度" in content:
        for extra in ["通識選課推薦", "這堂課好過嗎", "會不會很當", "老師給分甜不甜", "涼課推薦", "甜課推薦", "期中期末好考嗎", "學長姐修課心得", "通識志願序"]:
            add_kw(extra)

    # 4. 行政處室 / 位置 / 聯絡電話類別擴充
    elif any(d in name for d in ["處", "組", "館", "院", "中心", "系辦"]) or "分機" in content or "辦公室" in content:
        for extra in ["處室位置在哪", "系辦電話多少", "辦公室怎麼走", "行政單位窗口", "各處室分機號碼", "洽公時間"]:
            add_kw(extra)

    # 5. 宿舍 / 生活設施類別擴充
    elif "宿舍" in name or "二村" in name or "男宿" in name or "女宿" in name:
        for extra in ["新生住宿規定", "宿舍住哪裡", "大一保證住宿嗎", "宿舍門禁幾點", "冷氣卡怎麼買", "床墊尺寸規格", "宿網流量限制"]:
            add_kw(extra)

    # 6. 行事曆 / 選課時程類別擴充
    elif "行事曆" in name or "時程" in name or "階段" in name or "9/3" in content or "8/20" in content:
        for extra in ["選課什麼時候開始", "重要日程表", "大一行事曆時間", "初選搶課日期", "加退選什麼時候", "開學時間"]:
            add_kw(extra)

    # 7. 特約商家 / 醫療優惠類別擴充
    elif "特約" in name or "優惠" in name or "診所" in name or "醫院" in name:
        for extra in ["學生證優惠折扣", "看病掛號費減免", "特約診所推薦", "興大學生特約折扣", "憑學生證打折"]:
            add_kw(extra)

    # 8. 學長姐避坑 / 吐槽類別擴充
    elif "避坑" in name or "吐槽" in name or "爬文" in name:
        for extra in ["新生常見雷點", "學長姐生氣常問", "記事本爬文指南", "別再問了先看這個", "新生求生手冊"]:
            add_kw(extra)

    # 限制 8 ~ 16 個精煉關鍵字
    return expanded[:16]

def classify_entry_semantic(name: str, kws: List[str], content: str) -> Tuple[bool, str]:
    """
    LLM 語意分類標準：
    1. direct: true (客觀固定事實 / 單純查詢，無需 AI 二度創作)
       - 美食店家名稱、價位、營業時間
       - 系群 LINE 邀請連結、官方表單、外部查詢網址
       - 處室位置、分機號碼、學院系所聯絡電話
       - 具體行事曆日期日程 (如 8/20, 9/3 等)
       - 特約診所醫療院所、特約企業品牌優惠清單
       - 學生社團固定練習時間與聯絡 IG
       - 固定硬體規格 (如 90x190cm 床墊, 8GB 流量, 台中公車 10公里免費)
    
    2. direct: false (主觀體驗 / 綜合諮詢 / 需 AI 推理與口語化建議)
       - 通識課心得評價 (涼度、甜度、評量方式、作業多寡)
       - 教授授課風格比較
       - 學長姐吐槽與新生求生避坑對話
       - 選課搶課戰略、志願序排法、加簽教學
       - 英文免修與 ESAP 補學分利弊分析
       - 先修微積分建議與大學生活諮詢
    """
    name_lower = name.lower()
    content_lower = content.lower()
    kws_str = " ".join(kws).lower()

    # --- 優先判定 direct: false (主觀經驗、諮詢、心得) ---
    if "通識-" in name or "心得" in name or "修課心得" in name or "涼度" in content or "甜度" in content:
        return False, "通識修課評價與心得 (主觀體驗)"

    if "學長姐避坑" in name or "學長姐吐槽" in name or "真實對話紀錄" in content:
        return False, "學長姐避坑對話與求生吐槽 (口語對話)"

    if any(q in name for q in ["選課心法", "選課攻略", "查法建議", "加簽", "防暴躁"]):
        return False, "選課加簽技巧與生活建議 (綜合諮詢)"

    if "大一英文分班" in name or "免修補學分規定" in name or "抵免規則" in name:
        return False, "英文抵免規定與選修利弊 (政策解釋)"

    if "先修微積分" in name and "建議" in content:
        return False, "暑期先修微積分評估建議 (綜合諮詢)"

    # --- 判定 direct: true (客觀固定事實、單純查詢、外鏈) ---
    if "美食推薦-" in name or "特約商家-" in name or "特約" in name:
        return True, "美食店家與特約商家情報 (客觀固定事實)"

    if "系群-" in name or "各系新生 LINE 群總覽" in name or "新生群" in name:
        return True, "系群與社群加入連結 (固定外鏈)"

    if "行事曆-" in name or "新生選課三階段時程" in name:
        return True, "行事曆日程與選課日期 (客觀固定時程)"

    if "學生社團-" in name:
        return True, "學生社團基本介紹與粉專 (固定事實資訊)"

    if "特約醫療-" in name or "企業福利-" in name:
        return True, "特約醫療診所與企業優惠 (固定事實資訊)"

    if any(c in name for c in ["學院", "系辦", "行政QA", "處室", "圖書館"]):
        return True, "處室位置與行政聯絡窗口 (客觀固定地點/電話)"

    if "https://" in content and len(content) < 220:
        return True, "官方外部連結與表單 (純外鏈導向)"

    if any(spec in name for spec in ["床墊規格", "交通卡", "市民限定", "腳踏車證", "8GB", "網管"]):
        return True, "校園固定硬體規範與交通優惠 (固定規格)"

    if "美食" in name or "小吃" in name or any(f in name for f in ["餐廳", "南門路", "夜市"]):
        return True, "餐飲美食推薦 (客觀事實)"

    # 預設：若無特殊外鏈且文字長度較長者交由 LLM 潤飾
    if len(content) > 250:
        return False, "長篇問答與說明 (需 AI 整合)"
    
    return True, "客觀事實條目 (單純查詢)"

def run_classification_pipeline(api_key: str = None):
    print("\n" + "="*70)
    print(" 🤖 啟動知識庫 direct 屬性語意判讀與關鍵字自動補全管線")
    print("="*70)

    if not os.path.exists(JSON_PATH):
        print(f"❌ 找不到知識庫檔案: {JSON_PATH}")
        return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    total_count = len(raw_data)
    print(f"📥 成功讀取 campus_knowledge.json: 共 {total_count} 筆條目")

    direct_true_count = 0
    direct_false_count = 0
    stats_by_reason = {}

    classified_items = []

    for item in raw_data:
        name = item.get("名稱") or item.get("name") or ""
        content = item.get("情報內容") or item.get("content") or ""
        raw_kws = item.get("關鍵字") or item.get("keywords") or []
        if isinstance(raw_kws, str):
            kws = [k.strip() for k in raw_kws.split(",") if k.strip()]
        else:
            kws = list(raw_kws)

        # 1. 語意判定 direct 屬性
        is_direct, reason = classify_entry_semantic(name, kws, content)

        # 2. 自動聯想並擴充 keywords
        enriched_kws = expand_conversational_keywords(kws, name, content, is_direct)

        if is_direct:
            direct_true_count += 1
        else:
            direct_false_count += 1

        stats_by_reason[reason] = stats_by_reason.get(reason, 0) + 1

        classified_items.append({
            "keywords": enriched_kws,
            "name": name,
            "content": content,
            "direct": is_direct
        })

    # 3. 輸出覆寫 1: campus_knowledge.json (UTF-8)
    print(f"\n💾 1. 正在更新 {JSON_PATH} ...")
    json_export = []
    for it in classified_items:
        entry = {
            "關鍵字": ",".join(it["keywords"]),
            "名稱": it["name"],
            "情報內容": it["content"]
        }
        if it["direct"]:
            entry["direct"] = True
        json_export.append(entry)

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(json_export, f, ensure_ascii=False, indent=2)
    print(f"  ✅ campus_knowledge.json 更新完成！({total_count} 筆)")

    # 4. 輸出覆寫 2: campus_knowledge.csv (UTF-8 with BOM)
    print(f"💾 2. 正在更新 {CSV_PATH} ...")
    with open(CSV_PATH, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["關鍵字", "名稱", "情報內容", "direct"])
        writer.writeheader()
        for it in json_export:
            writer.writerow({
                "關鍵字": it["關鍵字"],
                "名稱": it["名稱"],
                "情報內容": it["情報內容"],
                "direct": "true" if it.get("direct") else "false"
            })
    print(f"  ✅ campus_knowledge.csv 更新完成！({total_count} 筆)")

    # 5. 輸出覆寫 3: KnowledgeData.gs (var CAMPUS_KNOWLEDGE = [ ... ];)
    print(f"💾 3. 正在更新 {GS_PATH} ...")
    gs_header = "/**\n * ==============================================================================\n * 國立中興大學 (NCHU) 全校園知識庫靜態常數資料 (KnowledgeData.gs)\n * 本檔案由 auto_classify_knowledge.py 自動產生，包含 direct 快速通道與擴充關鍵字。\n * 總條目數: " + str(total_count) + " 筆 (direct: true = " + str(direct_true_count) + " 筆, direct: false = " + str(direct_false_count) + " 筆)\n * ==============================================================================\n */\n\n"
    gs_content = gs_header + "var CAMPUS_KNOWLEDGE = " + json.dumps(classified_items, ensure_ascii=False, indent=2) + ";\n"
    with open(GS_PATH, "w", encoding="utf-8") as f:
        f.write(gs_content)
    print(f"  ✅ KnowledgeData.gs 更新完成！({total_count} 筆)")

    # 6. 完整統計報告
    print("\n" + "="*70)
    print(" 🎉 知識庫 direct 分類與關鍵字擴充作業圓滿完成！")
    print(f" 📊 處理總筆數: {total_count} 筆")
    print(f" ⚡ direct: true (客觀固定事實 / 零延遲秒回): {direct_true_count} 筆 ({round(direct_true_count/total_count*100, 1)}%)")
    print(f" 🧠 direct: false (主觀體驗 / 綜合諮詢 / 需 AI 推理): {direct_false_count} 筆 ({round(direct_false_count/total_count*100, 1)}%)")
    print("\n 📋 各細項語意分類詳細統計：")
    for category, cnt in sorted(stats_by_reason.items(), key=lambda x: -x[1]):
        print(f"   • [{ '⚡ Direct' if '客觀' in category or '固定' in category or '外鏈' in category else '🧠 AI推論' }] {category}: {cnt} 筆")
    print("="*70)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Auto classify direct attribute and enrich keywords.")
    parser.add_argument("--api-key", type=str, default=None, help="Optional Gemini API key")
    args = parser.parse_args()

    api_k = args.api_key or os.environ.get("GEMINI_API_KEY")
    run_classification_pipeline(api_k)
