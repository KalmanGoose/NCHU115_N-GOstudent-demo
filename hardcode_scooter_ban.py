#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
hardcode_scooter_ban.py
在中興知識庫、向量快取、GAS 腳本與 3B 生成 Prompt 中直接寫死：
【校內全面絕對嚴禁騎乘機車】最高鐵律！
==============================================================================
"""

import os
import json
import csv
import torch
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
CSV_PATH = os.path.join(BASE_DIR, "campus_knowledge.csv")
GS_PATH = os.path.join(BASE_DIR, "KnowledgeData.gs")
FK_PATH = os.path.join(BASE_DIR, "FreshmanKnowledge.gs")
EMB_PATH = os.path.join(BASE_DIR, "corpus_embeddings.pt")
MODEL_DIR = os.path.join(BASE_DIR, "nchu_bge_small_model")

# 1. 讀取現有知識庫
with open(JSON_PATH, "r", encoding="utf-8") as f:
    kb = json.load(f)

# 定義寫死條目
BAN_ENTRY = {
    "名稱": "校園交通最高鐵律-校內絕對嚴禁騎乘機車 (違規必鎖車開罰)",
    "情報內容": (
        "【中興大學校園交通最高鐵律：校內全面絕對嚴禁騎乘機車！】\n\n"
        "1. **校園內絕對禁行機車**：中興大學全校園區（包含椰林大道、行政大樓前、綜合大樓、各學院走道及教學區）全面規劃為行人與自行車徒步區。無論是否有機車通行證，**任何學生機車一律嚴禁騎入校園內部**！\n"
        "2. **違規嚴格處分**：駐衛警察隊 24 小時嚴格巡邏取締，若違規騎機車進入校園，駐警隊將**當場攔截、上大鎖鎖車並開立罰款單**，車主必須親自至大門口警衛室/駐警隊繳納罰款方得解鎖！\n"
        "3. **校內合法交通工具**：進入校園後僅能以**步行（走路）、騎腳踏車（自行車）或滑板車**移動。\n"
        "4. **大一新生停車唯一解**：大一新生第一學期無法申請校內車證，機車請絕對不要嘗試騎進校門，一律停放於校園外圍三大免費機車停車場：\n"
        "   • 社管大樓/雲平樓旁免費停車場：https://maps.app.goo.gl/CJfqT9FqssFTvkV37?g_st=ic\n"
        "   • 校門口右側停車棚（學府路大門側）：https://maps.app.goo.gl/YP8jjduPuvnELR8s6?g_st=ic\n"
        "   • 國光路與忠明南路口停車場（通往機械館/游泳池）：https://maps.app.goo.gl/ekNaz31T5NPfbVq38?g_st=ic"
    ),
    "關鍵字": (
        "校內可以騎機車嗎,可以騎機車進學校嗎,機車可以騎進去嗎,大一新生可以騎機車進學校嗎,"
        "騎機車上課,校內騎車,校園騎機車,騎機車進校門,機車進學校,駐警隊鎖車,機車違規,"
        "校園交通規則,機車通行證,機車鎖車,大一騎車,校內機車,機車可以騎進校園嗎,可以騎車嗎"
    ),
    "direct": True
}

# 更新或插入
replaced = False
for i, it in enumerate(kb):
    if "校內絕對嚴禁騎乘機車" in it.get("名稱", "") or "大一新生可以騎機車進學校嗎" in it.get("名稱", ""):
        kb[i] = BAN_ENTRY
        replaced = True
        break

if not replaced:
    kb.insert(0, BAN_ENTRY)

# 同步強化「機車通行證申請與停車規則」
for it in kb:
    if it.get("名稱") == "機車通行證申請與停車規則":
        it["情報內容"] = (
            "【中興大學學生機車通行與停車最高通則】：\n"
            "1. **校內全面嚴禁騎乘機車**：學生機車絕對禁止騎入校園內部行人徒步區，違規必被駐警隊鎖車開罰！\n"
            "2. **大一第一學期無法申請車證**：新生車輛請勿騎入校內。\n"
            "3. **三大校外免費機車停車場**：\n"
            "   • 社管大樓/雲平樓旁：https://maps.app.goo.gl/CJfqT9FqssFTvkV37?g_st=ic\n"
            "   • 校門口右側停車棚：https://maps.app.goo.gl/YP8jjduPuvnELR8s6?g_st=ic\n"
            "   • 國光與忠明南路口：https://maps.app.goo.gl/ekNaz31T5NPfbVq38?g_st=ic\n"
            "4. 有車證之舊生僅能停於指定之外圍學生專用車棚，亦不可騎入教學核心區。"
        )

print(f"[*] 知識庫總條目數: {len(kb)}")

# 寫入 campus_knowledge.json
with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(kb, f, ensure_ascii=False, indent=2)
print(f"✅ 成功更新 {JSON_PATH}")

# 寫入 campus_knowledge.csv
fieldnames = ["名稱", "情報內容", "關鍵字", "direct"]
with open(CSV_PATH, "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in kb:
        writer.writerow(row)
print(f"✅ 成功更新 {CSV_PATH}")

# 寫入 KnowledgeData.gs
with open(GS_PATH, "w", encoding="utf-8") as f:
    f.write("// Google Apps Script Knowledge Base generated from campus_knowledge.json\n")
    f.write("var CAMPUS_KNOWLEDGE = " + json.dumps(kb, ensure_ascii=False, indent=2) + ";\n")
print(f"✅ 成功更新 {GS_PATH}")

# 重新計算向量索引
print("⚡ 重新以 BGE-Small 計算全庫向量索引...")
model = SentenceTransformer(MODEL_DIR, device="cpu")
corpus_texts = [f"【{x.get('名稱', '')}】{x.get('情報內容', '')}" for x in kb]
embs = model.encode(corpus_texts, convert_to_tensor=True, show_progress_bar=True, device="cpu")
torch.save(embs, EMB_PATH)
print(f"✅ 成功更新 {EMB_PATH}！維度: {embs.shape}")

print("🎉 機車禁行校內最高鐵律已成功寫死！")
