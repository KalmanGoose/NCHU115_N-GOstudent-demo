#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) 知識庫深度淨化腳本 (clean_knowledge_data.py)
==============================================================================
任務：
  1. 備份原始 campus_knowledge.json
  2. 徹底剃除 207 筆「涼度/甜度/點名老師/學生個人打分」之破碎通識問卷條目
  3. 保留所有官方選課規章、通識素養架構、英文抵免、體育選課與行政生活法規
  4. 同步更新：
     - campus_knowledge.json
     - campus_knowledge.csv (UTF-8-SIG)
     - KnowledgeData.gs (var CAMPUS_KNOWLEDGE = [...];)
  5. 重新生成本機向量索引庫 corpus_embeddings.pt
==============================================================================
"""

import os
import csv
import json
import shutil
import time
import torch

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
BACKUP_PATH = os.path.join(BASE_DIR, "campus_knowledge.json.bak")
CSV_PATH = os.path.join(BASE_DIR, "campus_knowledge.csv")
GS_PATH = os.path.join(BASE_DIR, "KnowledgeData.gs")
CACHE_PATH = os.path.join(BASE_DIR, "corpus_embeddings.pt")
MODEL_DIR = os.path.join(BASE_DIR, "nchu_bge_small_model")

def is_noisy_review(item: dict) -> bool:
    name = str(item.get("名稱", "")).strip()
    content = str(item.get("情報內容", "")).strip()
    combined = f"{name} {content}"

    # 判定特徵：涼度、甜度、問卷編號打分、學長姐心得流水號
    if "涼度:" in combined or "涼度：" in combined or "涼度" in combined:
        return True
    if "甜度:" in combined or "甜度：" in combined or "甜度" in combined:
        return True
    if "學長姐心得#" in name or "心得#" in name:
        return True
    if "【編號#" in content and "涼度" in content:
        return True
    if name.startswith("通識-") and ("評量方式:" in content or "評量:[" in content or "授課教師：" in content):
        return True

    return False

def main():
    print("=" * 70)
    print("🧹 開始執行知識庫深層淨化（移除問卷打分雜訊）...")
    print("=" * 70)

    if not os.path.exists(JSON_PATH):
        print(f"❌ 找不到檔案: {JSON_PATH}")
        return

    # 1. 建立備份
    shutil.copyfile(JSON_PATH, BACKUP_PATH)
    print(f"📦 已建立資料備份: {BACKUP_PATH}")

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    total_count = len(data)
    cleaned_data = []
    removed_items = []

    for item in data:
        if is_noisy_review(item):
            removed_items.append(item.get("名稱", ""))
        else:
            cleaned_data.append(item)

    removed_count = len(removed_items)
    kept_count = len(cleaned_data)

    print(f"📊 原始條目總數: {total_count}")
    print(f"🗑️ 剔除打分雜訊: {removed_count} 筆")
    print(f"✨ 保留精確條目: {kept_count} 筆")

    # 2. 寫入 campus_knowledge.json
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(cleaned_data, f, ensure_ascii=False, indent=2)
    print(f"💾 已更新: {JSON_PATH}")

    # 3. 寫入 campus_knowledge.csv
    fieldnames = ["關鍵字", "名稱", "情報內容", "direct"]
    with open(CSV_PATH, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for item in cleaned_data:
            writer.writerow({
                "關鍵字": item.get("關鍵字", ""),
                "名稱": item.get("名稱", ""),
                "情報內容": item.get("情報內容", ""),
                "direct": item.get("direct", "")
            })
    print(f"💾 已更新: {CSV_PATH}")

    # 4. 寫入 KnowledgeData.gs (Google Apps Script 後端使用)
    gs_content = "// 國立中興大學新生問答 - 核心知識庫 (由 clean_knowledge_data.py 自動產生)\n"
    gs_content += "var CAMPUS_KNOWLEDGE = " + json.dumps(cleaned_data, ensure_ascii=False, indent=2) + ";\n"
    with open(GS_PATH, "w", encoding="utf-8") as f:
        f.write(gs_content)
    print(f"💾 已更新: {GS_PATH}")

    # 5. 重新生成本機向量快取 corpus_embeddings.pt
    if os.path.exists(MODEL_DIR):
        print("\n⚙️ 重新生成本機向量索引快取...")
        from sentence_transformers import SentenceTransformer
        device = "mps" if torch.backends.mps.is_available() else "cpu"
        model = SentenceTransformer(MODEL_DIR, device=device)

        corpus_texts = [f"【{it.get('名稱', '')}】{it.get('情報內容', '')}" for it in cleaned_data]
        t0 = time.time()
        corpus_embeddings = model.encode(corpus_texts, convert_to_tensor=True, show_progress_bar=False, device=device)
        torch.save(corpus_embeddings, CACHE_PATH)
        print(f"⚡ 新向量庫已寫入: {CACHE_PATH} (共 {len(corpus_texts)} 筆向量，耗時 {time.time() - t0:.2f} 秒)")

    print("=" * 70)
    print("🎉 知識庫深層淨化圓滿完成！")
    print("=" * 70)

if __name__ == "__main__":
    main()
