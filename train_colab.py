#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) BGE-Small 領域向量微調訓練腳本
(train_colab.py)
==============================================================================
"""

import os
import json
import shutil
import torch
from datasets import Dataset
from sentence_transformers import (
    SentenceTransformer,
    SentenceTransformerTrainer,
    SentenceTransformerTrainingArguments,
    losses,
    util
)

def load_jsonl(path):
    data = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                data.append(json.loads(line))
    return data

def main():
    print("=" * 70)
    print("🌲 國立中興大學 (NCHU) 領域專屬 BGE-Small 向量模型微調啟動")
    print(f"CUDA 可用性: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"使用 GPU: {torch.cuda.get_device_name(0)}")
    print("=" * 70)

    train_path = "/content/train_triplets.jsonl"
    eval_path = "/content/eval_triplets.jsonl"

    if not os.path.exists(train_path):
        train_path = "train_triplets.jsonl"
        eval_path = "eval_triplets.jsonl"

    print("📖 載入三元組訓練資料集...")
    train_data = load_jsonl(train_path)
    eval_data = load_jsonl(eval_path)

    print(f"✅ 訓練集樣本數: {len(train_data)}")
    print(f"✅ 驗證集樣本數: {len(eval_data)}")

    train_dataset = Dataset.from_list(train_data)
    eval_dataset = Dataset.from_list(eval_data)

    base_model_id = "BAAI/bge-small-zh-v1.5"
    print(f"\n📦 下載並載入開源基底模型: {base_model_id} (24M 參數)...")
    base_model = SentenceTransformer(base_model_id)

    # 基準測試（微調前）
    test_queries = [
        ("二村洗衣服要投多少錢？", "【男宿二村生活設施】男宿二村備有投幣式洗衣機，每次 20 元，烘衣機每 30 分鐘 10 元。"),
        ("圓廳二樓有什麼好吃的？", "【圓廳學餐美食推薦】圓廳二樓設有自助餐、便當、現做麵食與飲品專區，為校內主要平價學餐。"),
        ("通識選課第一階段幾點開始？", "【新生選課三階段時程】通識第一階段 8/20 10:00 ～ 8/22 08:00（排通識志願序，含國文老師）。")
    ]

    print("\n🔍 記錄微調前 (Base Model) 相似度基準:")
    before_scores = []
    for q, pos in test_queries:
        q_emb = base_model.encode(q)
        pos_emb = base_model.encode(pos)
        sim = util.cos_sim(q_emb, pos_emb).item()
        before_scores.append(sim)
        print(f"   - 問題: '{q}' ➔ 相似度: {sim:.4f}")

    # 對比學習 Loss
    print("\n⚙️ 配置對比學習損失函數: MultipleNegativesRankingLoss (InfoNCE)...")
    train_loss = losses.MultipleNegativesRankingLoss(model=base_model)

    output_dir = "/content/output_checkpoints"
    final_model_dir = "/content/nchu_bge_small_model"

    training_args = SentenceTransformerTrainingArguments(
        output_dir=output_dir,
        num_train_epochs=3,
        per_device_train_batch_size=32,
        per_device_eval_batch_size=32,
        learning_rate=2e-5,
        warmup_ratio=0.1,
        fp16=torch.cuda.is_available(),
        eval_strategy="epoch",
        save_strategy="epoch",
        logging_steps=50,
        save_total_limit=1,
        report_to="none"
    )

    trainer = SentenceTransformerTrainer(
        model=base_model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        loss=train_loss,
    )

    print("\n🚀 開始微調訓練 (預計 3~5 分鐘)...")
    trainer.train()

    print(f"\n💾 儲存微調後的中興專屬模型至: {final_model_dir}...")
    base_model.save_pretrained(final_model_dir)

    # 基準測試（微調後）
    print("\n" + "=" * 70)
    print("📊 微調成果對比 (Before vs After 評測報告)")
    print("=" * 70)
    finetuned_model = SentenceTransformer(final_model_dir)

    for idx, (q, pos) in enumerate(test_queries):
        q_emb = finetuned_model.encode(q)
        pos_emb = finetuned_model.encode(pos)
        sim_after = util.cos_sim(q_emb, pos_emb).item()
        sim_before = before_scores[idx]
        diff = (sim_after - sim_before) * 100
        print(f"Query {idx+1}: {q}")
        print(f"   微調前: {sim_before:.4f}  ──►  微調後: {sim_after:.4f}  (提升: +{diff:.2f}%)")

    # 打包 zip 方便下載回本地
    zip_output = "/content/nchu_bge_small_model"
    shutil.make_archive(zip_output, 'zip', final_model_dir)
    print(f"\n📦 模型已壓縮至: {zip_output}.zip ({os.path.getsize(zip_output + '.zip') / 1024 / 1024:.2f} MB)")
    print("🎉 恭喜！中興領域向量小模型微調全流程圓滿完成！")
    print("=" * 70)

if __name__ == "__main__":
    main()
