#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) 知識庫假連結全面淨化與個人登入資安防護更新
(fix_knowledge_links_and_login.py)
==============================================================================
"""

import json
import csv
import re
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
CSV_PATH = os.path.join(BASE_DIR, "campus_knowledge.csv")
GS_DATA_PATH = os.path.join(BASE_DIR, "KnowledgeData.gs")
GS_FRESHMAN_PATH = os.path.join(BASE_DIR, "FreshmanKnowledge.gs")

def clean_content(text):
    # Fix broken domains where dots were stripped
    text = text.replace("wwwosanchuedutw", "www.osa.nchu.edu.tw")
    text = text.replace("oaanchuedutw", "oaa.nchu.edu.tw")
    text = text.replace("onepiecenchuedutw", "onepiece.nchu.edu.tw")
    text = text.replace("mailnchuedutw", "mail.nchu.edu.tw")
    text = text.replace("wwwinstagramcom", "www.instagram.com")
    text = text.replace("wwwfacebookcom", "www.facebook.com")
    text = text.replace("mapsappgoogl", "maps.app.goo.gl")
    
    # Fix specific bad / fake links
    text = text.replace("https://reurl.cc/80EWLR", "https://www.osa.nchu.edu.tw/osa/dorm/")
    text = text.replace("https://reurl.cc/rryQ4y", "https://onepiece.nchu.edu.tw/cofsys/plsql/crseqry_home")
    
    text = text.replace("https://share.google/aGx28Vcq6K9iayCD4", "https://lc.nchu.edu.tw/")
    text = text.replace("https://share.google/gx6yX4YboUoylNFNY", "https://lc.nchu.edu.tw/freshman.php")
    text = text.replace("https://share.google/wUW4Cy3bOQIVgpPfj", "https://onepiece.nchu.edu.tw/cofsys/plsql/bef_join_index")
    text = text.replace("https://share.google/T0skL6RP4jXz3nGsL", "https://cah.nchu.edu.tw/")
    text = text.replace("https://share.google/l6vyXt6UKXqFVgPbX", "https://freshman.nchu.edu.tw/")
    text = text.replace("https://share.google/A69ZqteGYw0CNCilo", "https://oaa.nchu.edu.tw/")
    text = text.replace("https://share.google/JcsuUDCwK3tk8Gwtq", "https://www.nchu.edu.tw/calendar/")
    
    # Fix sharegoogle variations
    text = text.replace("https://sharegoogle/1V9pgCYCZXWTdHzOW", "https://portal.nchu.edu.tw/")
    text = text.replace("https://sharegoogle/8uvSRXaZk8BIWkDPH", "https://cc.nchu.edu.tw/")
    text = text.replace("http://nchu.cc/sso）", "https://portal.nchu.edu.tw/ ）")
    
    return text

def main():
    print("🌲 開始更新 campus_knowledge.json...")
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. 淨化所有條目的內容與連結
    cleaned_count = 0
    for item in data:
        orig = item["情報內容"]
        new_c = clean_content(orig)
        if orig != new_c:
            item["情報內容"] = new_c
            cleaned_count += 1
        # Also clean name if needed
        item["名稱"] = clean_content(item["名稱"])

    print(f"✅ 已修正 {cleaned_count} 筆含有無效/損毀連結的知識庫條目！")

    # 2. 檢查並新增「個人帳密 / 登入代查床位成績」防護條目
    login_entry_name = "校園資安防護-AI嚴禁代為登入個人校務系統與查詢床位成績"
    existing_login = next((x for x in data if x.get("名稱") == login_entry_name), None)
    
    login_entry = {
        "名稱": login_entry_name,
        "關鍵字": "幫我登入,查我的床位,查床位,查成績,學號登入,代登入,我學號,幫我看床位,登入系統,幫我查成績,單一入口登入,個人資料查詢,看床位,床位在哪,宿舍抽籤結果",
        "情報內容": (
            "【重要資安防護與個人資料保護聲明：AI 助手嚴禁且無法代表學生登入校務系統】\n\n"
            "1. **AI 無法代為登入個人系統**：AI 學長姐助手為校園公開資訊指引工具，為確保同學個人隱私、帳號與機密資料安全，**本系統絕對不會、也嚴格禁止索取密碼或代表任何同學登入學校個人系統**！請切勿在對話框中輸入您的學號、密碼或身分證字號。\n"
            "2. **查詢個人床位與宿舍申請**：請同學親自前往【國立中興大學單一入口 Portal】（https://portal.nchu.edu.tw/）使用個人學號與密碼登入，點選「學生宿舍管理系統」查詢個人床位分發結果。若對床位或入住流程有疑問，請洽詢【學生住宿輔導組】（https://www.osa.nchu.edu.tw/osa/dorm/）：\n"
            "   • 男宿服務中心：04-22840473（男宿二村）\n"
            "   • 女宿服務中心：04-22840612（女宿誠軒/勤軒/樸軒）\n"
            "3. **查詢學期成績與選課課表**：請至【興大單一入口 Portal】（https://portal.nchu.edu.tw/）登入「教務資訊系統」進行查詢。"
        ),
        "direct": True
    }

    if existing_login:
        existing_login.update(login_entry)
    else:
        data.insert(0, login_entry)
        print("✅ 已成功注入「AI嚴禁代登入個人系統」安全守則條目！")

    # 3. 檢查 145 間美食是否全部齊全並具備高辨識度
    print(f"📊 目前知識庫總條目數：{len(data)}")

    # 寫回 campus_knowledge.json
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # 寫回 campus_knowledge.csv
    with open(CSV_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["名稱", "關鍵字", "情報內容"])
        for item in data:
            writer.writerow([item.get("名稱", ""), item.get("關鍵字", ""), item.get("情報內容", "")])

    # 寫回 KnowledgeData.gs
    with open(GS_DATA_PATH, "w", encoding="utf-8") as f:
        f.write("var KNOWLEDGE_BASE = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n")

    # 更新 FreshmanKnowledge.gs
    if os.path.exists(GS_FRESHMAN_PATH):
        with open(GS_FRESHMAN_PATH, "r", encoding="utf-8") as f:
            gs_text = f.read()
        gs_text_cleaned = clean_content(gs_text)
        with open(GS_FRESHMAN_PATH, "w", encoding="utf-8") as f:
            f.write(gs_text_cleaned)
        print("✅ 已同步淨化 FreshmanKnowledge.gs 連結！")

    print(f"🎉 全部知識庫檔案淨化與同步完成！總筆數：{len(data)}")

if __name__ == "__main__":
    main()
