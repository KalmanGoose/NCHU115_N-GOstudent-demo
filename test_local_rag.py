#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) 本機 RAG (BGE-Small 檢索 + Qwen-0.5B 開卷生成) 測試
(test_local_rag.py)
==============================================================================
"""

import os
import sys
import time
import json
import torch
from sentence_transformers import SentenceTransformer, util
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_BGE_DIR = os.path.join(BASE_DIR, "nchu_bge_small_model")
JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
EMB_PATH = os.path.join(BASE_DIR, "corpus_embeddings.pt")
ADAPTER_DIR = os.path.join(BASE_DIR, "nchu_qwen_adapter")
BASE_MODEL_ID = "Qwen/Qwen2.5-0.5B-Instruct"

device = "mps" if torch.backends.mps.is_available() else "cpu"

print(f"🌲 正在載入本地微調 BGE-Small 檢索器與 1,068 筆中興知識庫 (裝置: {device})...")
bge_model = SentenceTransformer(MODEL_BGE_DIR, device=device)
embs = torch.load(EMB_PATH, map_location=device)
with open(JSON_PATH, "r", encoding="utf-8") as f:
    kb = json.load(f)

print(f"🌲 正在載入本地 Qwen-0.5B 基底模型與 LoRA 權重...")
tokenizer = AutoTokenizer.from_pretrained(ADAPTER_DIR, trust_remote_code=True)
base_model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL_ID,
    torch_dtype=torch.float16 if device == "mps" else torch.float32,
    device_map=device,
    trust_remote_code=True
)
model = PeftModel.from_pretrained(base_model, ADAPTER_DIR)
model.eval()

def ask_nchu_rag(question):
    print("=" * 70)
    print(f"❓ 【大一新生提問】: {question}")
    
    # 1. 向量檢索 (BGE-Small)
    t0 = time.time()
    q_emb = bge_model.encode(f"為這個句子生成表示以用於檢索相關文章：{question}", convert_to_tensor=True, device=device)
    hits = util.semantic_search(q_emb, embs, top_k=2)[0]
    retrieval_ms = (time.time() - t0) * 1000
    
    top_items = [kb[h['corpus_id']] for h in hits]
    print(f"⚡ [檢索完成] 耗時 {retrieval_ms:.1f}ms | 命中知識: {[x['名稱'] for x in top_items]}")
    
    # 組裝檢索背景
    context_str = "\n\n".join([f"【資料 {i+1}：{it['名稱']}】\n{it['情報內容']}" for i, it in enumerate(top_items)])
    
    # 2. 開卷生成 (Qwen-0.5B)
    system_prompt = (
        "你是國立中興大學 (NCHU) 的親切幽默學長姐 AI 助手。\n"
        "請【嚴格依據下列提供的學校真實情報】回答學弟妹的問題。\n"
        "若資料中有提到具體地點、連結或規矩，請完整清楚地告知，千萬不可捏造資料中沒有的內容。"
    )
    user_content = f"【參考學校真實資料】：\n{context_str}\n\n【學弟妹問題】：\n{question}"
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content}
    ]
    
    prompt_text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(prompt_text, return_tensors="pt").to(device)
    
    t1 = time.time()
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=300,
            temperature=0.3,
            top_p=0.85,
            repetition_penalty=1.1,
            do_sample=True,
            pad_token_id=tokenizer.pad_token_id
        )
    gen_time = time.time() - t1
    reply = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True).strip()
    
    print("\n💬 【中興學長姐回答 (RAG 正確解答)】:")
    print("-" * 70)
    print(reply)
    print("-" * 70)
    print(f"⏱️ 檢索: {retrieval_ms:.1f}ms | 生成: {gen_time:.2f}s\n")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        ask_nchu_rag(" ".join(sys.argv[1:]))
    else:
        ask_nchu_rag("大一沒車證機車可以停哪？")
        ask_nchu_rag("二村垃圾怎麼丟？")
        ask_nchu_rag("揚州炒飯好吃嗎？在哪裡？")
