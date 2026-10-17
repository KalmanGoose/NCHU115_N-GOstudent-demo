#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) 神經檢索小模型 - 手機端即時體驗服務 (app_mobile.py)
==============================================================================
使用剛才微調好的 nchu_bge_small_model，啟動 Gradio 公開共享連結 (share=True)，
讓負責人可以在手機 (4G/Wi-Fi) 上直接點開網址，體驗毫秒級校園神經檢索！
==============================================================================
"""

import os
import json
import time
import torch
import gradio as gr
from sentence_transformers import SentenceTransformer, util

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "nchu_bge_small_model")
JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
CACHE_PATH = os.path.join(BASE_DIR, "corpus_embeddings.pt")

device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"📦 載入本地微調模型: {MODEL_DIR} (使用裝置: {device})...")
model = SentenceTransformer(MODEL_DIR, device=device)

with open(JSON_PATH, "r", encoding="utf-8") as f:
    kb_items = json.load(f)

print(f"⚡ 讀取 505 筆知識庫向量快取: {CACHE_PATH}")
corpus_embeddings = torch.load(CACHE_PATH, map_location=device)

def search_faq(query):
    if not query or not query.strip():
        return "<p style='color: #64748b;'>請輸入想查詢的問題～</p>"

    t0 = time.time()
    q_emb = model.encode(query.strip(), convert_to_tensor=True, device=device)
    cos_scores = util.cos_sim(q_emb, corpus_embeddings)[0]
    top_results = torch.topk(cos_scores, k=3)
    latency_ms = (time.time() - t0) * 1000

    html = f"<div style='margin-bottom: 12px; color: #15803d; font-weight: 600; font-size: 14px;'>⚡ 神經向量運算耗時：{latency_ms:.1f} 毫秒（Apple Silicon 邊緣端即時推論）</div>"

    for rank, (score, idx) in enumerate(zip(top_results.values, top_results.indices), 1):
        item = kb_items[idx.item()]
        name = item.get("名稱", "")
        content = item.get("情報內容", "").replace("\n", "<br>")
        direct = " <span style='background:#fef08a;color:#854d0e;padding:2px 6px;border-radius:4px;font-size:12px;font-weight:600;'>⚡Direct快速通道</span>" if item.get("direct") else ""

        html += f"""
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
            <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
                #{rank} {name}{direct}
                <span style="float: right; font-size: 13px; color: #0284c7; font-weight: 600;">相似度: {score.item():.4f}</span>
            </div>
            <div style="font-size: 14px; color: #334155; line-height: 1.6;">{content}</div>
        </div>
        """
    return html

demo = gr.Interface(
    fn=search_faq,
    inputs=gr.Textbox(
        label="💬 輸入你的中興校園問題 (口語問法/黑話)",
        placeholder="例如：二村洗衣服要投多少錢、大一保證有宿舍住嗎、圓廳吃什麼..."
    ),
    outputs=gr.HTML(label="🎯 中興專屬小模型神經檢索結果 (Top-3)"),
    title="🌲 國立中興大學 (NCHU) - 專屬小模型手機體驗版",
    description="這是你剛才在 Colab T4 GPU 微調完成的 0.02B BGE-Small 向量模型，目前正在你的 Mac M1 上提供毫秒級神經向量推論！",
    examples=[
        ["二村洗衣服要投多少錢？"],
        ["大一保證有宿舍住嗎？"],
        ["二村門禁幾點"],
        ["圓廳二樓有什麼好吃的便當或宵夜？"],
        ["通識選課第一階段幾點開始？"]
    ]
)

if __name__ == "__main__":
    demo.launch(share=True)
