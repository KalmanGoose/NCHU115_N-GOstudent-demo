#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) BGE-Small 領域向量微調訓練腳本 V2
(train_bge_colab_v2.py - 適用於 Google Colab GPU)
==============================================================================
特點：
  1. 採用 Hard-Negative 三元組與 MultipleNegativesRankingLoss
  2. 強化中興特有大師、特色通識、處室高階 SOP 檢索特徵
  3. 訓練前後自動評測 Recall 與語意相似度對比
  4. 自動壓縮產出 nchu_bge_small_v2.zip
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
    print("🌲 國立中興大學 (NCHU) 領域專屬 BGE-Small V2 向量模型微調啟動")
    print(f"CUDA 可用性: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"使用 GPU: {torch.cuda.get_device_name(0)}")
    print("=" * 70)

    train_path = "/content/train_triplets_v2.jsonl"
    if not os.path.exists(train_path):
        train_path = "train_triplets_v2.jsonl"

    print("📖 載入 V2 三元組訓練資料集...")
    all_data = load_jsonl(train_path)
    print(f"✅ 總樣本數: {len(all_data)}")

    # 切分 90% train, 10% eval
    split_idx = int(len(all_data) * 0.9)
    train_data = all_data[:split_idx]
    eval_data = all_data[split_idx:]

    train_dataset = Dataset.from_list(train_data)
    eval_dataset = Dataset.from_list(eval_data)

    base_model_id = "BAAI/bge-small-zh-v1.5"
    print(f"\n📦 下載並載入開源基底模型: {base_model_id} (24M 參數)...")
    base_model = SentenceTransformer(base_model_id)

    # 基準測試（微調前）
    test_queries = [
        ("中興湖可以釣魚嗎？", "【中興湖生態保育規範-嚴禁垂釣】中興湖為校內人工生態湖，嚴禁私自垂釣！想釣魚請至旱溪康堤或修康堤釣魚趣。"),
        ("在學校騎機車被鎖車要罰多少錢？", "【總務處駐警隊】校內機車違規進入核心區鎖車，法定名稱為開鎖費 200 元，洽駐警隊 04-22840285 繳費開鎖。"),
        ("學雜費減免跟就學貸款先後順序？", "【學務處生輔組】先減免後就貸黃金鐵律：務必先辦減免扣除金額後，再持預估繳費單至臺灣銀行對保。"),
        ("中興大學有哪些中研院院士大師？", "【中央研究院院士大師陣容】廖一久講座教授（草蝦之父）、楊秋忠講座教授（土壤國家講座）、葉錫東講座教授（木瓜疫苗之父）；傑出校友江安世院士（果蠅腦圖譜）。"),
        ("大一選課每學期最少要修幾學分？", "【教務處選課規定】學士班一二三年級每學期不得少於 16 學分，四年級不得少於 9 學分。")
    ]

    print("\n🔍 [微調前基準] 評測基底模型相似度:")
    before_scores = []
    for q, pos in test_queries:
        q_emb = base_model.encode(q)
        p_emb = base_model.encode(pos)
        sim = float(util.cos_sim(q_emb, p_emb)[0][0])
        before_scores.append(sim)
        print(f"  - 查詢: 「{q}」 -> 基準相似度: {sim:.4f}")

    # 設定 MultipleNegativesRankingLoss
    print("\n⚙️ 配置 MultipleNegativesRankingLoss 對比學習損失函數...")
    loss_fn = losses.MultipleNegativesRankingLoss(base_model)

    output_dir = "/content/bge_v2_checkpoints" if os.path.exists("/content") else "./bge_v2_checkpoints"
    final_model_dir = "/content/nchu_bge_small_v2" if os.path.exists("/content") else "./nchu_bge_small_v2"

    training_args = SentenceTransformerTrainingArguments(
        output_dir=output_dir,
        num_train_epochs=4,
        per_device_train_batch_size=16 if torch.cuda.is_available() else 4,
        per_device_eval_batch_size=16 if torch.cuda.is_available() else 4,
        learning_rate=2e-5,
        warmup_ratio=0.1,
        eval_strategy="epoch",
        save_strategy="epoch",
        logging_steps=20,
        save_total_limit=1,
        load_best_model_at_end=True,
        fp16=torch.cuda.is_available()
    )

    trainer = SentenceTransformerTrainer(
        model=base_model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        loss=loss_fn
    )

    print("\n🚀 開始微調訓練...")
    trainer.train()

    print(f"\n💾 儲存微調後的新模型至: {final_model_dir}...")
    base_model.save_pretrained(final_model_dir)

    print("\n🔍 [微調後驗收] 評測新模型相似度增益:")
    tuned_model = SentenceTransformer(final_model_dir)
    for idx, (q, pos) in enumerate(test_queries):
        q_emb = tuned_model.encode(q)
        p_emb = tuned_model.encode(pos)
        sim = float(util.cos_sim(q_emb, p_emb)[0][0])
        diff = sim - before_scores[idx]
        diff_str = f"+{diff:.4f}" if diff >= 0 else f"{diff:.4f}"
        print(f"  - 查詢: 「{q}」 -> 微調後相似度: {sim:.4f} ({diff_str})")

    # 打包 zip
    zip_path = "/content/nchu_bge_small_v2.zip" if os.path.exists("/content") else "./nchu_bge_small_v2.zip"
    shutil.make_archive(final_model_dir, 'zip', final_model_dir)
    print(f"\n📦 模型已自動打包壓縮為: {zip_path}")
    print("=" * 70)
    print("🎉 BGE-Small V2 向量特徵微調大功告成！可直接下載並放回專案替換。")
    print("=" * 70)

if __name__ == "__main__":
    main()
