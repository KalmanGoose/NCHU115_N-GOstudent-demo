#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) 本機神經向量檢索測試腳本 (test_local_search.py)
==============================================================================
使用本機剛剛微調好的 nchu_bge_small_model，對 712 筆校園知識庫進行真實檢索！
支援：
  1. 預設測試問句比對
  2. 任意自訂問句: python test_local_search.py "你的自訂問題"
==============================================================================
"""

import os
import sys
import json
import time
import torch
from sentence_transformers import SentenceTransformer, util

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "nchu_bge_small_model")
JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
CACHE_PATH = os.path.join(BASE_DIR, "corpus_embeddings.pt")

def main():
    print("=" * 70)
    print("🌲 國立中興大學 (NCHU) - 本機領域小模型神經檢索測試")
    print(f"裝置架構: Apple Silicon (MPS 可用: {torch.backends.mps.is_available()})")
    print("=" * 70)

    if not os.path.exists(MODEL_DIR):
        print(f"❌ 找不到微調模型資料夾: {MODEL_DIR}")
        return

    # 1. 載入模型
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"📦 載入本地微調模型: {MODEL_DIR} (使用裝置: {device})...")
    t0 = time.time()
    model = SentenceTransformer(MODEL_DIR, device=device)
    print(f"✅ 模型載入完成！耗時: {time.time() - t0:.2f} 秒")

    # 2. 載入 712 筆校園知識庫
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        kb_items = json.load(f)
    print(f"📚 載入知識庫: 共 {len(kb_items)} 筆條目")

    corpus_texts = []
    for item in kb_items:
        name = item.get("名稱", "")
        content = item.get("情報內容", "")
        corpus_texts.append(f"【{name}】{content}")

    # 3. 計算或載入 712 筆條目的向量快取
    if os.path.exists(CACHE_PATH):
        print(f"⚡ 讀取已快取的知識庫向量庫: {CACHE_PATH}")
        corpus_embeddings = torch.load(CACHE_PATH, map_location=device)
    else:
        print("⚙️ 首次運行，正在為 712 筆校園條目生成神經向量座標 (僅需 1~2 秒)...")
        t0 = time.time()
        corpus_embeddings = model.encode(corpus_texts, convert_to_tensor=True, show_progress_bar=False, device=device)
        torch.save(corpus_embeddings, CACHE_PATH)
        print(f"💾 向量快取儲存成功！耗時: {time.time() - t0:.2f} 秒")

    # 4. 準備測試問句
    if len(sys.argv) > 1:
        test_queries = [" ".join(sys.argv[1:])]
    else:
        test_queries = [
            "二村洗衣服要投多少錢？",
            "圓廳二樓有什麼好吃的便當或宵夜？",
            "通識選課第一階段什麼時候開始？",
            "大一保證有宿舍住嗎？",
            "被推銷英文雜誌怎麼辦？"
        ]

    # 5. 執行神經檢索
    print("\n" + "=" * 70)
    print("🎯 開始執行神經向量比對 (Top-3 召回結果)")
    print("=" * 70)

    for q in test_queries:
        t_start = time.time()
        q_emb = model.encode(q, convert_to_tensor=True, device=device)
        cos_scores = util.cos_sim(q_emb, corpus_embeddings)[0]
        top_results = torch.topk(cos_scores, k=3)
        latency_ms = (time.time() - t_start) * 1000

        print(f"\n❓ 【使用者發問】: 「{q}」")
        print(f"   ⏱️ 向量運算耗時: {latency_ms:.1f} 毫秒 (極速)")
        print("   " + "-" * 60)

        for rank, (score, idx) in enumerate(zip(top_results.values, top_results.indices), 1):
            item = kb_items[idx.item()]
            name = item.get("名稱", "")
            content = item.get("情報內容", "").replace("\n", " ")
            direct = " [⚡Direct快速通道]" if item.get("direct") else ""
            print(f"   🥇 Rank #{rank} (相似度: {score.item():.4f}){direct}")
            print(f"      名稱: {name}")
            print(f"      內容: {content[:80]}...")
            print()

    print("=" * 70)
    print("💡 提示：你可以隨時用本指令自訂問題測試：")
    print("   /opt/anaconda3/bin/python3 test_local_search.py \"你的問題\"")
    print("=" * 70)

if __name__ == "__main__":
    main()
