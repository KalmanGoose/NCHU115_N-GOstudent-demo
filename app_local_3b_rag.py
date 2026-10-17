#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) 本機 Qwen2.5-3B + BGE-Small 向量檢索 (RAG) 實測
(app_local_3b_rag.py)
==============================================================================
"""

import os
import sys
import time
import json
import torch
import mlx_lm
from sentence_transformers import SentenceTransformer, util

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_BGE_DIR = os.path.join(BASE_DIR, "nchu_bge_small_model")
JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
EMB_PATH = os.path.join(BASE_DIR, "corpus_embeddings.pt")
MODEL_3B_PATH = "mlx-community/Qwen2.5-3B-Instruct-4bit"

device = "mps" if torch.backends.mps.is_available() else "cpu"

print(f"🌲 正在載入 BGE-Small 檢索模型與 1,068 筆中興官方規章 (裝置: {device})...")
bge_model = SentenceTransformer(MODEL_BGE_DIR, device=device)
embs = torch.load(EMB_PATH, map_location=device)
with open(JSON_PATH, "r", encoding="utf-8") as f:
    kb = json.load(f)

print(f"🌲 正在載入 Qwen2.5-3B-Instruct (4-bit Metal 加速)...")
model_3b, tokenizer_3b = mlx_lm.load(MODEL_3B_PATH)
print("✅ 模型與向量庫加載完畢！\n")

SYSTEM_PROMPT = (
    "你是國立中興大學（NCHU）熱心、親切且有同理心的學長姐 AI 助手。\n"
    "你的任務是根據所提供的【學校官方真實情報】，為大一新生或在校生解答校園生活與學業問題。\n\n"
    "【校園交通最高鐵律（絕對寫死，不可違背）】：\n"
    "中興大學【校園內全面絕對嚴禁騎乘機車】！不管有沒有車證，學生機車絕對不能騎進校園內部任何路段（違規駐警隊必當場上大鎖開罰）。大一新生機車只能停在校外周邊三大免費停車場，校內移動一律靠走路或腳踏車！只要學弟妹問到能否騎機車進學校或校內騎車，必須第一句嚴正告知校內絕對不能騎機車！\n\n"
    "【回答守則】：\n"
    "1. 請以熱情活潑的學長姐口吻回答（例如「學弟妹安啦！」、「這題問我就對了」）。\n"
    "2. 嚴格根據【學校官方真實情報】的事實、金額、時間、規範與 Google Maps 連結作答，切勿憑空捏造不存在的校規或社團。\n"
    "3. 若官方資料有提到特定地點、流程或注意事項，請完整提醒學弟妹避免踩雷。"
)

def ask_nchu_3b(question):
    print("=" * 75)
    print(f"❓ 【大一新生提問】: {question}")
    
    # 1. 向量檢索
    t0 = time.time()
    q_emb = bge_model.encode(f"為這個句子生成表示以用於檢索相關文章：{question}", convert_to_tensor=True, device=device)
    hits = util.semantic_search(q_emb, embs, top_k=2)[0]
    retrieval_ms = (time.time() - t0) * 1000
    
    top_items = [kb[h['corpus_id']] for h in hits]
    hit_names = [x['名稱'] for x in top_items]
    print(f"⚡ [檢索完成] 耗時 {retrieval_ms:.1f}ms | 命中知識: {hit_names}")
    
    context_str = "\n\n".join([f"【資料 {i+1}：{it['名稱']}】\n{it['情報內容']}" for i, it in enumerate(top_items)])
    
    # 2. 開卷生成 Prompt
    prompt = (
        f"<|im_start|>system\n{SYSTEM_PROMPT}<|im_end|>\n"
        f"<|im_start|>user\n【學校官方真實情報】：\n{context_str}\n\n【學弟妹問題】：{question}<|im_end|>\n"
        f"<|im_start|>assistant\n"
    )
    
    t1 = time.time()
    response = mlx_lm.generate(
        model_3b,
        tokenizer_3b,
        prompt=prompt,
        max_tokens=400,
        verbose=False
    )
    gen_time = time.time() - t1
    
    print("\n💬 【中興學長姐回答 (3B RAG 正確解答)】:")
    print("-" * 75)
    print(response.strip())
    print("-" * 75)
    print(f"⏱️ 檢索耗時: {retrieval_ms:.1f}ms | 生成耗時: {gen_time:.2f}s\n")

if __name__ == "__main__":
    test_questions = [
        "大一沒車證機車可以停哪？",
        "二村垃圾怎麼丟？",
        "揚州炒飯好吃嗎？在哪裡？",
        "二村有女宿嗎？",
        "資工系畢業要修幾學分？"
    ]
    for q in test_questions:
        ask_nchu_3b(q)
