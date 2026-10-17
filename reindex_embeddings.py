#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
重新編碼中興大學純淨知識庫向量嵌入 (reindex_embeddings.py)
==============================================================================
"""

import os
import json
import torch
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_BGE_DIR = os.path.join(BASE_DIR, "nchu_bge_small_model")
JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
EMB_PATH = os.path.join(BASE_DIR, "corpus_embeddings.pt")

def main():
    print("🌲 加載 BGE-Small 檢索模型...")
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    bge_model = SentenceTransformer(MODEL_BGE_DIR, device=device)
    
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        knowledge = json.load(f)
        
    print(f"📊 正在為 {len(knowledge)} 筆知識庫生成向量嵌入...")
    corpus_texts = []
    for item in knowledge:
        name = item.get("名稱", "")
        kws = item.get("關鍵字", "")
        content = item.get("情報內容", "")
        # 將名稱、關鍵字與前 180 字內容作為檢索語境
        combined_text = f"名稱：{name}。關鍵字：{kws}。內容：{content[:180]}"
        corpus_texts.append(combined_text)
        
    embeddings = bge_model.encode(
        corpus_texts,
        convert_to_tensor=True,
        normalize_embeddings=True,
        show_progress_bar=True,
        device=device
    )
    
    torch.save(embeddings, EMB_PATH)
    print(f"✅ 向量嵌入更新完成！形狀：{embeddings.shape}，已儲存至 {EMB_PATH}")

if __name__ == "__main__":
    main()
