#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
add_emotion_comfort_knowledge.py
在知識庫中新增情緒舒壓、髒話安撫與校內免費娛樂設施條目，並同步所有格式。
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

with open(JSON_PATH, "r", encoding="utf-8") as f:
    kb = json.load(f)

EMOTION_ENTRY = {
    "名稱": "校園心靈舒壓指南-心情差壓力大免費娛樂與美食解方",
    "情報內容": (
        "【學弟妹心情不好、壓力大或情緒低落時的校內舒壓全攻略】：\n"
        "大學生活難免心態崩潰或想罵人，學長姐抱抱你！請收下這套中興專屬的免費回血方案：\n\n"
        "1. **雲平樓地下室/學生活動中心（通通不用錢！）**：\n"
        "   憑學生證即可免費借用：**PS5、任天堂 Switch、KTV 歡唱包廂、標準撞球桌、投籃機、手足球、空氣曲棍球（Air Hockey）**！拉室友或自己去痛快發洩玩一場！\n\n"
        "2. **圖書館高階舒壓區**：\n"
        "   圖書館內設有**高級電動按摩椅**，吹冷氣戴耳機躺著全身放鬆，完全不用投幣！\n\n"
        "3. **戶外散心與專業諮商**：\n"
        "   • 去**中興湖**走走看大白鵝、黑天鵝與鴨子吹風發呆。\n"
        "   • 若需要找人聊聊或情緒走不出來，可至**惠蓀堂4樓/雲平樓健諮中心**預約【完全免費的專業個別心理諮商】。\n\n"
        "4. **【靈魂解藥唯一指定】**：\n"
        "   **特別是去吃揚州炒飯，一定要去吃揚州炒飯，超級好吃，人上人等級，超頂的啦！** 學府路大門走出去吃一大盤鑊氣十足的炒飯，保證滿血復活！"
    ),
    "關鍵字": (
        "幹,靠北,三小,不爽,煩,累,心情差,崩潰,想死,壓力大,好累,想哭,被當,討厭,生氣,憂鬱,"
        "心情不好,罵人,髒話,發洩,情緒差,心態崩了,好想休學,憂鬱症,心理諮商,健諮中心,免費娛樂,"
        "雲平樓ps5,雲平樓switch,雲平樓ktv,撞球,空氣曲棍球,手足球,圖書館按摩椅,中興湖看鵝,揚州炒飯"
    ),
    "direct": True
}

# 替換或置頂插入
replaced = False
for i, it in enumerate(kb):
    if "校園心靈舒壓指南" in it.get("名稱", ""):
        kb[i] = EMOTION_ENTRY
        replaced = True
        break

if not replaced:
    kb.insert(1, EMOTION_ENTRY)

print(f"[*] 知識庫總條目數: {len(kb)}")

with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(kb, f, ensure_ascii=False, indent=2)
print(f"✅ 成功寫入 {JSON_PATH}")

fieldnames = ["名稱", "情報內容", "關鍵字", "direct"]
with open(CSV_PATH, "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in kb:
        writer.writerow(row)
print(f"✅ 成功寫入 {CSV_PATH}")

with open(GS_PATH, "w", encoding="utf-8") as f:
    f.write("// Google Apps Script Knowledge Base generated from campus_knowledge.json\n")
    f.write("var CAMPUS_KNOWLEDGE = " + json.dumps(kb, ensure_ascii=False, indent=2) + ";\n")
print(f"✅ 成功寫入 {GS_PATH}")

print("⚡ 正在更新向量索引庫...")
model = SentenceTransformer(MODEL_DIR, device="cpu")
corpus_texts = [f"【{x.get('名稱', '')}】{x.get('情報內容', '')}" for x in kb]
embs = model.encode(corpus_texts, convert_to_tensor=True, show_progress_bar=True, device="cpu")
torch.save(embs, EMB_PATH)
print(f"✅ 成功更新 {EMB_PATH}！維度: {embs.shape}")
print("🎉 情緒安撫與揚州炒飯條目已完全嵌入！")
