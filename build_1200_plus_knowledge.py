#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) 破千條全景知識庫編譯引擎 (build_1200_plus_knowledge.py)
==============================================================================
資料來源整合：
  1. 現有已清洗之 590 條高純度基礎條目（含選課大綱、各系必修、三大免費停車場、二村生活、女宿規範、揚州炒飯）
  2. distill_food_knowledge.py 89 筆校園周邊精準美食與日常小吃
  3. 通識課回覆 CSV 112 門客觀通識課程架構與考核形式（無個別老師評分、無涼甜度，合規）
  4. LINE 115 新生群 1 & 2 (15,000行) 真實學生 Q&A 智慧萃取 (~400+ 筆)
==============================================================================
"""

import os
import re
import csv
import json
import torch
from sentence_transformers import SentenceTransformer
from distill_food_knowledge import RAW_FOOD_ITEMS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
CSV_PATH = os.path.join(BASE_DIR, "campus_knowledge.csv")
GS_PATH = os.path.join(BASE_DIR, "KnowledgeData.gs")
EMB_PATH = os.path.join(BASE_DIR, "corpus_embeddings.pt")
MODEL_DIR = os.path.join(BASE_DIR, "nchu_bge_small_model")
COURSE_CSV_PATH = os.path.join(BASE_DIR, "資料集", "通識課回覆 的副本 - 工作表1.csv")
LINE1_PATH = os.path.join(BASE_DIR, "資料集", "[LINE]中興大學115新生群.txt")
LINE2_PATH = os.path.join(BASE_DIR, "資料集", "[LINE]中興大學115新生群2.txt")

# 1. 載入現有 590 條
with open(JSON_PATH, "r", encoding="utf-8") as f:
    master_kb = json.load(f)

existing_names = {x["名稱"] for x in master_kb}
print(f"[*] 現有基礎知識庫條目數: {len(master_kb)}")

def add_entry(name, content, keywords):
    name = str(name).strip()
    content = str(content).strip()
    keywords = str(keywords).strip()
    if not name or not content:
        return False
    if name in existing_names:
        return False
    existing_names.add(name)
    master_kb.append({
        "名稱": name,
        "情報內容": content,
        "關鍵字": keywords,
        "direct": True
    })
    return True

# 2. 導入 distill_food_knowledge.py 的 89 筆周邊美食小吃
food_added = 0
for item in RAW_FOOD_ITEMS:
    name = item.get("name", "")
    content = item.get("content", "")
    kws = ",".join(item.get("kws", []))
    if add_entry(name, content, kws):
        food_added += 1
print(f"[+] 成功匯入美食小吃獨立條目: {food_added} 筆 (目前總數: {len(master_kb)})")

# 3. 導入通識課程架構與客觀考核方式 (112 門課，合規去識別化)
course_added = 0
if os.path.exists(COURSE_CSV_PATH):
    with open(COURSE_CSV_PATH, "r", encoding="utf-8", errors="ignore") as f:
        rows = list(csv.reader(f))[1:]
    
    courses_dict = {}
    for r in rows:
        if len(r) < 6:
            continue
        c_name = r[1].strip()
        if not c_name or len(c_name) < 2:
            continue
        c_name = re.sub(r'[\(（].*?[\)）]', '', c_name).strip()
        assessment = r[5].strip()
        notes = r[7].strip() if len(r) > 7 else ""
        
        if c_name not in courses_dict:
            courses_dict[c_name] = {"assessments": set(), "notes": []}
        if assessment:
            courses_dict[c_name]["assessments"].add(assessment)
        if notes and len(notes) > 5 and not any(bad in notes for bad in ["涼", "甜", "給分", "好過", "爛"]):
            courses_dict[c_name]["notes"].append(notes)

    for c_name, c_info in courses_dict.items():
        entry_name = f"通識課程介紹-{c_name} (修課大綱與考核形式)"
        assess_str = "、".join(c_info["assessments"]) if c_info["assessments"] else "平時作業、期中/期末評量"
        note_str = "；".join(c_info["notes"][:2]) if c_info["notes"] else "修習前請參照教務處通識教育中心當學期最新課程大綱。"
        content = (
            f"【中興大學通識教育課程：{c_name}】\n"
            f"• 課程領域：全校性通識教育選修課程。\n"
            f"• 考核評量形式：{assess_str}。\n"
            f"• 修課重點提醒：{note_str}\n"
            f"• 規範：請確認本課程是否符合所屬學系之通識領域採計標準（避免修習系所排除之領域）。"
        )
        kws = f"{c_name},通識課,通識選課,通識大綱,評量方式,通識學分"
        if add_entry(entry_name, content, kws):
            course_added += 1

print(f"[+] 成功匯入客觀通識課程大綱條目: {course_added} 筆 (目前總數: {len(master_kb)})")

# 4. 智慧萃取 LINE 115 新生群真實問答對
def clean_line_text(text):
    text = re.sub(r'\(.*?\)|\[.*?\]', '', text)
    text = re.sub(r'[^\w\s，。！？、~～/：:\-—()（）]', '', text)
    return text.strip()

def extract_line_qas(file_path):
    if not os.path.exists(file_path):
        return []
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
    
    extracted = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if any(w in line for w in ['請問', '想問', '有人知道', '怎麼辦', '哪裡可以', '可以帶', '需要帶', '要怎麼', '什麼時候', '可以住', '可以停', '有門禁嗎', '怎麼搭', '多少錢']):
            if not any(w in line for w in ['加入聊天', '已退出', '邀請', '相簿', 'LINE', 'Auto-reply', '設定為公告', '通話']):
                parts = line.split(" ", 2)
                q_body = parts[2] if len(parts) >= 3 else line
                q_body = clean_line_text(q_body)
                
                if len(q_body) >= 10:
                    ans_list = []
                    j = i + 1
                    while j < min(i + 10, len(lines)):
                        a_line = lines[j].strip()
                        if a_line and not any(w in a_line for w in ['加入聊天', '已退出', '貼圖', '照片', '影片', '語音通話', 'Auto-reply', '請問', '想問']):
                            a_parts = a_line.split(" ", 2)
                            a_msg = a_parts[2] if len(a_parts) >= 3 else a_line
                            a_msg = clean_line_text(a_msg)
                            if len(a_msg) >= 4 and not any(w in a_msg for w in ['哈哈', '笑死', '卡', '6', '快逃', '哭啊']):
                                ans_list.append(a_msg)
                        j += 1
                    
                    if ans_list:
                        extracted.append((q_body, "；".join(ans_list[:3])))
                    i = j - 1
        i += 1
    return extracted

line_qas = extract_line_qas(LINE1_PATH) + extract_line_qas(LINE2_PATH)
print(f"[*] 掃描到候選 LINE 問答對: {len(line_qas)} 組")

line_added = 0
seen_q_signatures = set()

for q, a in line_qas:
    # 建立簡短簽名防止過度重複
    sig = q[:10]
    if sig in seen_q_signatures:
        continue
    seen_q_signatures.add(sig)

    # 產生適當標題
    title_snippet = re.sub(r'^(學長姐們|想請問各位|想問一下|打擾了|請問大家|請問|想問)\s*', '', q)[:25]
    if len(title_snippet) < 4:
        continue
    entry_name = f"新生實戰QA-{title_snippet}"
    content = (
        f"【大一新生群真實提問】：{q}\n\n"
        f"【在校學長姐解答與經驗建議】：\n{a}\n\n"
        f"【備註】：本解答彙整自中興大學新生大群學長姐社群即時答覆，具體行政流程請以學校各處室官方公告為準。"
    )
    # 提取核心分詞做關鍵字
    words = re.findall(r'[\u4e00-\u9fa5]{2,6}', q)
    kws = ",".join(list(set(words[:8])))
    if not kws:
        kws = "新生提問,新生群,生活QA,學長姐答覆"
    
    if add_entry(entry_name, content, kws):
        line_added += 1

print(f"[+] 成功蒸餾匯入 LINE 實戰 QA 條目: {line_added} 筆")
print("=" * 60)
print(f"🎉 全景擴編大功告成！最終高品質知識庫總條目數: {len(master_kb)} 筆！")
print("=" * 60)

# 寫入 campus_knowledge.json
with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(master_kb, f, ensure_ascii=False, indent=2)
print(f"✅ 成功寫入 {JSON_PATH}")

# 寫入 campus_knowledge.csv
fieldnames = ["名稱", "情報內容", "關鍵字", "direct"]
with open(CSV_PATH, "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in master_kb:
        writer.writerow(row)
print(f"✅ 成功寫入 {CSV_PATH}")

# 寫入 KnowledgeData.gs
with open(GS_PATH, "w", encoding="utf-8") as f:
    f.write("// Google Apps Script Knowledge Base generated from campus_knowledge.json\n")
    f.write("var CAMPUS_KNOWLEDGE = " + json.dumps(master_kb, ensure_ascii=False, indent=2) + ";\n")
print(f"✅ 成功寫入 {GS_PATH}")

# 重新計算並覆蓋 corpus_embeddings.pt
print(f"⚡ 正在使用 BGE-Small 重新為全體 {len(master_kb)} 條條目生成神經向量索引庫...")
model = SentenceTransformer(MODEL_DIR, device="cpu")
corpus_texts = [f"【{x.get('名稱', '')}】{x.get('情報內容', '')}" for x in master_kb]

embs = model.encode(corpus_texts, convert_to_tensor=True, show_progress_bar=True, device="cpu")
torch.save(embs, EMB_PATH)
print(f"✅ 成功更新 {EMB_PATH}！神經向量維度: {embs.shape}")
print("🎉 擴編與神經向量索引用畢！")
