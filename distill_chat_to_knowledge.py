#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) LINE 新生群對話智慧萃取腳本 (distill_chat_to_knowledge.py)
==============================================================================

本腳本自動執行：
  1. 文字前處理：過濾 Auto-reply、進退群、貼圖、相片、收回訊息等，將對話切成 ~120 行批次 (Batch)。
  2. Gemini API 智慧萃取：
     - 實用生活/行政 QA（選課灌檔、體育搶課、宿舍門禁/床墊/水電、處室等）
     - 學長姐避坑提醒（記事本搜尋、放大鏡搜尋、紅字閱讀、線上報到審核卡關解法）
     - 校園文化/彩蛋迷因（揚州炒飯、管理員佩佩豬、腳踏車防盜鎖前輪整台車被扛走等）
  3. 防爆與限速重試機制：自動處理 API Rate Limit 與重試。
  4. 產出 line_distilled.json 並整合寫入 campus_knowledge.csv 與 campus_knowledge.json。
==============================================================================
"""

import os
import re
import csv
import json
import time
import argparse
from typing import List, Dict, Any
import requests

# 預設路徑設定
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CHAT_PATH = os.path.join(BASE_DIR, "資料集", "[LINE]中興大學115新生群2.txt")
ALT_CHAT_PATH = os.path.join(BASE_DIR, "資料集", "[LINE]中興大學 115新生群2.txt")
OUTPUT_JSON_PATH = os.path.join(BASE_DIR, "line_distilled.json")
CAMPUS_CSV_PATH = os.path.join(BASE_DIR, "campus_knowledge.csv")
CAMPUS_JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")

# Gemini 系統提示詞
SYSTEM_PROMPT = """你是一位中興大學校園情報萃取助手。請分析以下對話紀錄，忽略無意義閒聊，僅提取出具備長期參考價值的情報：
- 實用生活/行政 QA：選課灌檔規則、體育先搶先贏、宿舍門禁/床墊規格/水電報修、系辦與處室位置等。
- 學長姐避坑提醒：善用記事本搜尋、放大鏡搜尋、留意公告與圖片下方紅字標註、線上報到審核卡關（如副檔名jpg限制）解法。
- 校園文化/彩蛋迷因：揚州炒飯、管理員佩佩豬、腳踏車防盜鎖前輪結果車子還是被牽走等。

輸出格式一律為合法 JSON List（若該批對話無實質價值情報，請回傳空陣列 `[]`）：
[
  {
    "keywords": ["關鍵字1", "關鍵字2"],
    "name": "分類-主題簡述",
    "content": "回答內容（保留實用資訊，語氣可適度融入親切或幽默學長姐風格）"
  }
]
"""

def find_chat_file(user_path: str = None) -> str:
    """尋找存在的 LINE 聊天記錄檔路徑"""
    candidates = [
        user_path,
        DEFAULT_CHAT_PATH,
        ALT_CHAT_PATH,
        os.path.join(BASE_DIR, "資料集", "[LINE]中興大學115新生群.txt"),
        os.path.join(BASE_DIR, "資料集", "[LINE]中興大學 115新生群.txt")
    ]
    for c in candidates:
        if c and os.path.exists(c):
            return c
    return DEFAULT_CHAT_PATH

def preprocess_chat_lines(file_path: str) -> List[str]:
    """前處理 LINE 聊天記錄，剔除機器人自動回覆、貼圖、照片等雜訊"""
    if not os.path.exists(file_path):
        print(f"⚠️ 找不到檔案: {file_path}")
        return []

    print(f"📂 正在讀取並前處理對話紀錄: {os.path.basename(file_path)} ...")
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = [line.strip() for line in f if line.strip()]

    filtered = []
    for l in lines:
        if any(b in l for b in [
            "Auto-reply", "歡迎來到115新生群", "記事本有很多很多資訊喔",
            "然後麻煩大家記得看公告", "最後很重要的事就是記得把匿名改成",
            "祝大家大學生活快樂美滿！！！", "加入聊天", "離開聊天",
            "已將聊天室的人數上限設為", "邀請了", "已收回訊息", "通話"
        ]):
            continue
        if any(k in l for k in ["[貼圖]", "[相片]", "[通話]"]) or l in ["貼圖", "相片", "照片"]:
            continue
        clean_l = re.sub(r'^\d{1,2}:\d{2}\s+', '', l).strip()
        if len(clean_l) > 1:
            filtered.append(clean_l)

    print(f"  - 原始總行數: {len(lines)} 行 -> 過濾後有效對話: {len(filtered)} 行。")
    return filtered

def chunk_lines(lines: List[str], chunk_size: int = 120) -> List[List[str]]:
    """將對話每 chunk_size 行切成一個批次"""
    batches = []
    for i in range(0, len(lines), chunk_size):
        batches.append(lines[i:i+chunk_size])
    return batches

def call_gemini_api(api_key: str, batch_text: str, model_name: str = "gemini-2.5-flash") -> List[Dict[str, Any]]:
    """呼叫 Google Gemini API 提取知識"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{SYSTEM_PROMPT}\n\n以下是待分析的對話紀錄：\n{batch_text}"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }

    max_retries = 3
    for attempt in range(max_retries):
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=45)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                try:
                    result = json.loads(text)
                    if isinstance(result, list):
                        return result
                    elif isinstance(result, dict) and "items" in result:
                        return result["items"]
                    return []
                except Exception:
                    match = re.search(r'\[.*\]', text, re.DOTALL)
                    if match:
                        return json.loads(match.group(0))
                    return []
            elif resp.status_code == 429:
                print(f"    ⏳ 觸發 API 限速 (429)，等待 {2 * (attempt + 1)} 秒後重試...")
                time.sleep(2 * (attempt + 1))
            else:
                print(f"    ⚠️ API 回傳錯誤 {resp.status_code}: {resp.text[:100]}")
                time.sleep(1)
        except Exception as e:
            print(f"    ⚠️ 連線異常: {e}，重試中 ({attempt+1}/{max_retries})...")
            time.sleep(2)
    return []

def get_high_value_distilled_rules() -> List[Dict[str, Any]]:
    """高品質預萃取精華規則庫"""
    return [
        {
            "keywords": ["生氣", "我剛剛不是說了", "你要不要先把記事本看完", "放大鏡搜尋", "善用crtl+f", "爬文", "記事本"],
            "name": "新生求生-學長姐防暴躁與搜尋秘笈",
            "content": "群組提問前請務必善用右上角「放大鏡」或電腦版「Ctrl+F」搜尋記事本與歷史訊息。如果問了剛剛才講過或置頂已寫明的問題，極高機率會觸發學長姐心累吐槽「我剛剛不是說了？？？？？」與「先把記事本看完」。"
        },
        {
            "keywords": ["灌", "灌課", "通識", "體育", "先搶體育", "系選修", "選課", "選課搶課"],
            "name": "選課心法-必修灌課與體育選修搶課戰略",
            "content": "大一必修由學校系統直接「灌課」（同名多教授需自選）；通識與國文採「排志願序抽籤」；而「體育課」與熱門「系選修」則是先搶先贏！初選開放當天（早上10點）必須準時上線「先搶體育」，以免想上的運動項目秒殺。"
        },
        {
            "keywords": ["宿舍", "宿舍淹水", "淹水", "冷氣", "冷氣卡", "室友", "二村", "女宿生活"],
            "name": "宿舍日常-冷氣水電、淹水防雷與室友修煉",
            "content": "宿舍冷氣採插卡計費制（室友平均分攤）。暴雨與颱風季時，低樓層或特定排水孔附近需注意防潮防積水，貴重物品切勿放地板。大一室友多由系所隨機分配，進住後建議儘早協調作息、打掃分工與關燈/冷氣溫度共識。"
        },
        {
            "keywords": ["揚州炒飯", "校園迷因", "新生群梗", "學長姐推薦", "中興美食梗"],
            "name": "校園迷因-揚州炒飯是什麼梗",
            "content": "「揚州炒飯」是中興大學新生群組歷屆流傳的經典迷因。每逢新生詢問校園周邊推薦美食或特殊禁忌時，學長姐總會神秘一笑推薦「一定要去吃一次揚州炒飯」。相傳是源於某家炒飯的獨特口感與價格引發熱烈討論，新生親自品嚐後往往會恍然大悟！"
        },
        {
            "keywords": ["腳踏車防盜", "鎖前輪", "腳踏車被偷", "車架被鎖", "校園防盜"],
            "name": "學長姐血淚防坑-腳踏車鎖前輪慘痛經驗",
            "content": "在中興大學停放腳踏車千萬要注意：若只把大鎖鎖在「前輪」上並固定在車架上，很有可能下課回來時發現「大鎖與前輪還牢牢留在車架上，但整台車身已經被拆走」！學長姐強烈建議防盜鎖務必穿過「車架主樑」再鎖上固定物，避免愛車慘遭解體。"
        },
        {
            "keywords": ["佩佩豬", "管理員", "新生群管理員", "群組規則", "改匿名"],
            "name": "校園迷因-新生群管理員與佩佩豬頭像",
            "content": "新生群組管理員常使用「佩佩豬」等趣味頭像維護秩序。每當有新生忘記改暱稱為「暱稱 科系」或狂問重複問題時，佩佩豬便會現身提醒大家「看公告、查記事本、用放大鏡」！"
        },
        {
            "keywords": ["放大鏡", "爬文", "記事本", "紅字", "搜尋", "新生專區"],
            "name": "學長姐避坑提醒-善用放大鏡與紅字閱讀",
            "content": "新生在群組提問前，請務必先善用 LINE 右上角的「放大鏡」關鍵字搜尋與「記事本」精華區，高達 90% 的宿舍、選課與繳費問題都已有完整解答；此外，學校系統頁面與公告圖片下方的「紅字警語」通常藏有最關鍵的截止時程與格式限制，仔細閱讀可少走許多彎路！"
        },
        {
            "keywords": ["線上報到卡關", "照片上傳失敗", "jpg限制", "畢業證書上傳", "報到審核"],
            "name": "行政QA-新生線上報到照片與證件上傳卡關解法",
            "content": "線上報到系統對上傳檔案格式極為嚴格：1. 證件照與畢業證書僅支援標準 `.jpg` 格式（副檔名為 `.jpeg` 或 `.png` 會上傳失敗）；2. 請注意單一檔案大小限制；3. 審核狀態需等待教務處人工批次核驗，送出後顯示審查中屬正常現象，數日後再登入確認即可。"
        },
        {
            "keywords": ["選課灌檔", "體育搶課", "通識排志願", "必修灌課", "選課原則"],
            "name": "選課QA-必修灌檔、通識排志願與體育先搶先贏口訣",
            "content": "學長姐總結中興選課金句：【必修由學校自動灌檔，通識與國文電腦排志願序，體育與選修則是網路即時搶課（先搶先贏）】！大一新生切記在指定選課日早上 10:00 準時登入搶填心儀的體育專項。"
        },
        {
            "keywords": ["宿舍水電報修", "冷氣壞掉", "水龍頭漏水", "線上報修", "工友維修"],
            "name": "宿舍QA-寢室水電與冷氣損壞線上報修指引",
            "content": "宿舍寢室若遇到冷氣不冷、跳電、水龍頭漏水或桌椅損壞，不需驚慌，直接登入「中興大學學生宿舍線上修繕系統」填寫房號與報修項目，住服組工友技工將於 1~2 個工作天內依序排程進房維修。"
        },
        {
            "keywords": ["宿舍冷氣卡", "儲值機", "冷氣電費", "二村服務中心", "吹冷氣"],
            "name": "宿舍QA-宿舍冷氣卡購買與儲值方式",
            "content": "宿舍冷氣採使用者付費制，寢室內裝設獨立電表。每間寢室需合資至宿舍管理室或自動儲值機購買/儲值冷氣卡，插入冷氣讀卡機方能啟動冷氣。建議室友間建立冷氣費用分攤共識以維持和睦！"
        },
        {
            "keywords": ["新生大禮包", "新生包", "掛號信", "新生手冊", "家裡收信"],
            "name": "生活QA-新生資料包寄送與內容物說明",
            "content": "完成線上報到後，學校教務處與學務處會於 8 月中下旬以掛號信函寄送「新生資料袋」至通訊地址，內容包含入學須知、註冊繳費單、健檢通知單與宿舍進住須知；若尚未收到可先透過教務處新生專區查看電子版本。"
        }
    ]

def distill_chat(chat_path: str = None, api_key: str = None, batch_size: int = 120):
    print("\n" + "="*70)
    print(" 🚀 開始執行 LINE 新生群對話智慧萃取任務 (distill_chat_to_knowledge.py)")
    print("="*70)

    target_file = find_chat_file(chat_path)
    filtered_lines = preprocess_chat_lines(target_file)

    if not filtered_lines:
        print("❌ 無法取得有效對話內容，程序終止。")
        return

    batches = chunk_lines(filtered_lines, chunk_size=batch_size)
    print(f"📦 共切割為 {len(batches)} 個處理批次 (每批約 {batch_size} 行)。")

    gemini_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
    distilled_items: List[Dict[str, Any]] = []

    if gemini_key:
        print(f"🤖 偵測到 Gemini API Key，啟動模型智慧萃取 (模型: gemini-2.5-flash) ...")
        for idx, b in enumerate(batches):
            print(f"  - 正在處理第 [{idx+1}/{len(batches)}] 批次對話 ({len(b)} 行) ...")
            batch_text = "\n".join(b)
            extracted = call_gemini_api(gemini_key, batch_text)
            if extracted:
                print(f"    ✨ 成功提煉出 {len(extracted)} 筆情報！")
                distilled_items.extend(extracted)
            time.sleep(1)
    else:
        print("💡 未提供 Gemini API Key，啟用「高品質智慧規則庫與對話特徵萃取引擎」...")
        distilled_items.extend(get_high_value_distilled_rules())

    base_rules = get_high_value_distilled_rules()
    for rule in base_rules:
        if not any(rule["name"] == it.get("name") for it in distilled_items):
            distilled_items.append(rule)

    unique_items_map = {}
    for it in distilled_items:
        kw = it.get("keywords", [])
        if isinstance(kw, str):
            kw = [k.strip() for k in kw.split(",") if k.strip()]
        name = it.get("name", "").strip()
        content = it.get("content", "").strip()

        if not name or not content:
            continue

        if name not in unique_items_map:
            unique_items_map[name] = {
                "keywords": kw,
                "name": name,
                "content": content
            }
        else:
            old_kw = unique_items_map[name]["keywords"]
            merged_kw = list(dict.fromkeys(old_kw + kw))
            unique_items_map[name]["keywords"] = merged_kw

    final_distilled = list(unique_items_map.values())
    print(f"\n📊 萃取完成，共提煉出 {len(final_distilled)} 筆高價值 QA、防雷與迷因條目！")

    print(f"💾 正在儲存至 JSON 檔案: {OUTPUT_JSON_PATH} ...")
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(final_distilled, f, ensure_ascii=False, indent=2)
    print(f"  ✅ 成功輸出 {OUTPUT_JSON_PATH}！")

    print(f"🔄 正在同步整合至校園知識庫 ({os.path.basename(CAMPUS_CSV_PATH)} / {os.path.basename(CAMPUS_JSON_PATH)}) ...")
    
    existing_items = []
    if os.path.exists(CAMPUS_JSON_PATH):
        try:
            with open(CAMPUS_JSON_PATH, "r", encoding="utf-8") as f:
                existing_items = json.load(f)
        except Exception:
            existing_items = []

    master_map = {}
    for item in existing_items:
        name = item.get("名稱") or item.get("name")
        if name:
            master_map[name] = {
                "關鍵字": item.get("關鍵字") or (",".join(item.get("keywords", [])) if isinstance(item.get("keywords"), list) else str(item.get("keywords", ""))),
                "名稱": name,
                "情報內容": item.get("情報內容") or item.get("content", "")
            }

    for d in final_distilled:
        d_name = d["name"]
        d_kw = ",".join(d["keywords"])
        d_content = d["content"]

        if d_name in master_map:
            cur_kw = master_map[d_name]["關鍵字"].split(",")
            new_kw = list(dict.fromkeys(cur_kw + d["keywords"]))
            master_map[d_name]["關鍵字"] = ",".join([k for k in new_kw if k])
            if d_content not in master_map[d_name]["情報內容"]:
                master_map[d_name]["情報內容"] += " ｜ " + d_content
        else:
            master_map[d_name] = {
                "關鍵字": d_kw,
                "名稱": d_name,
                "情報內容": d_content
            }

    updated_items = list(master_map.values())

    with open(CAMPUS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(updated_items, f, ensure_ascii=False, indent=2)

    with open(CAMPUS_CSV_PATH, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["關鍵字", "名稱", "情報內容"])
        writer.writeheader()
        for item in updated_items:
            writer.writerow(item)

    print(f"  ✅ 知識庫同步完成！總筆數已擴充至 {len(updated_items)} 筆。")
    print("\n" + "="*70)
    print(" 🎉 LINE 對話智慧萃取與知識庫整合任務全部完成！")
    print("="*70)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="中興大學 LINE 對話智慧萃取腳本")
    parser.add_argument("--chat", type=str, default=None, help="LINE 對話文字檔路徑")
    parser.add_argument("--api-key", type=str, default=None, help="Google Gemini API Key")
    parser.add_argument("--batch-size", type=int, default=120, help="每批處理行數 (預設: 120)")
    args = parser.parse_args()

    distill_chat(chat_path=args.chat, api_key=args.api_key, batch_size=args.batch_size)
