#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) Qwen2.5-3B-Instruct 高階 LoRA 微調訓練腳本
(train_qwen3b_lora_colab.py - 專為 Google Colab GPU 設計)
==============================================================================
特點：
  1. 針對 Qwen2.5-3B-Instruct 基底模型，支援 4-bit QLoRA（免費 T4 僅佔 4GB 顯存）
  2. 載入 train_qwen_instruct_v2.jsonl，徹底告別死板模板
  3. 權重層直接對齊：臺灣正體中文、中興名師與特色通識、主權防護、機車禁令、防釣魚
  4. 訓練後自動執行 4 大極端案例推理驗收，並自動打包 nchu_qwen3b_adapter.zip
==============================================================================
"""

import os
import json
import shutil
import torch
from datasets import Dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForSeq2Seq,
    BitsAndBytesConfig
)
from peft import (
    LoraConfig,
    get_peft_model,
    TaskType,
    prepare_model_for_kbit_training
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
    print("🌲 國立中興大學 (NCHU) Qwen2.5-3B-Instruct 高階 LoRA 微調啟動")
    print(f"CUDA 可用性: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"使用 GPU: {torch.cuda.get_device_name(0)}")
        print(f"總顯存: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
    print("=" * 70)

    train_path = "/content/train_qwen_instruct_v2.jsonl"
    eval_path = "/content/eval_qwen_instruct_v2.jsonl"

    if not os.path.exists(train_path):
        train_path = "train_qwen_instruct_v2.jsonl"
        eval_path = "eval_qwen_instruct_v2.jsonl"

    print("📖 載入 V2 對話微調資料集...")
    train_data = load_jsonl(train_path)
    eval_data = load_jsonl(eval_path)

    print(f"✅ 訓練集樣本數: {len(train_data)}")
    print(f"✅ 驗證集樣本數: {len(eval_data)}")

    model_id = "Qwen/Qwen2.5-3B-Instruct"
    print(f"\n📦 下載並載入基底模型: {model_id}...")

    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # 僅對 assistant 回答區段計算 Cross-Entropy Loss，將 system 與 user prompt 設為 -100
    max_seq_len = 1024

    def encode_with_loss_masking(sample):
        msgs = sample["messages"]
        prompt_ids = tokenizer.apply_chat_template(
            msgs[:-1], add_generation_prompt=True, tokenize=True
        )
        full_ids = tokenizer.apply_chat_template(msgs, tokenize=True)
        if len(full_ids) > max_seq_len:
            full_ids = full_ids[:max_seq_len]
        prompt_len = min(len(prompt_ids), len(full_ids))
        labels = [-100] * prompt_len + full_ids[prompt_len:]
        return {
            "input_ids": full_ids,
            "attention_mask": [1] * len(full_ids),
            "labels": labels,
        }

    tokenized_train = Dataset.from_list(train_data).map(
        encode_with_loss_masking, remove_columns=["messages"]
    )
    tokenized_eval = Dataset.from_list(eval_data).map(
        encode_with_loss_masking, remove_columns=["messages"]
    )

    # 4-bit QLoRA 設定以確保相容免費 Colab T4
    bnb_config = None
    if torch.cuda.is_available():
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True
        )

    print("\n⚙️ 載入模型主體 (4-bit 節能省顯存模式)...")
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=bnb_config,
        device_map="auto" if torch.cuda.is_available() else None,
        trust_remote_code=True
    )

    if torch.cuda.is_available():
        model = prepare_model_for_kbit_training(model)

    # 配置 LoRA
    print("\n⚙️ 配置 LoRA 參數 (r=16, alpha=32, target_modules=全線性投影)...")
    peft_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
    )
    model = get_peft_model(model, peft_config)
    model.print_trainable_parameters()

    output_dir = "/content/qwen3b_checkpoints" if os.path.exists("/content") else "./qwen3b_checkpoints"
    final_adapter_dir = "/content/nchu_qwen3b_adapter" if os.path.exists("/content") else "./nchu_qwen3b_adapter"

    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=3,
        per_device_train_batch_size=2,
        per_device_eval_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        lr_scheduler_type="cosine",
        warmup_steps=15,
        logging_steps=10,
        eval_strategy="epoch",
        save_strategy="epoch",
        save_total_limit=2,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        fp16=torch.cuda.is_available(),
        optim="paged_adamw_8bit" if torch.cuda.is_available() else "adamw_torch",
        report_to="none"
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_train,
        eval_dataset=tokenized_eval,
        data_collator=DataCollatorForSeq2Seq(
            tokenizer, padding=True, label_pad_token_id=-100, pad_to_multiple_of=8, return_tensors="pt"
        )
    )

    print("\n🚀 開始 Qwen2.5-3B LoRA 訓練...")
    trainer.train()

    print(f"\n💾 儲存 LoRA Adapter 至: {final_adapter_dir}...")
    model.save_pretrained(final_adapter_dir)
    tokenizer.save_pretrained(final_adapter_dir)

    # 打包 zip
    zip_path = "/content/nchu_qwen3b_adapter.zip" if os.path.exists("/content") else "./nchu_qwen3b_adapter.zip"
    shutil.make_archive(final_adapter_dir, 'zip', final_adapter_dir)
    print(f"\n📦 LoRA Adapter 已壓縮為: {zip_path}")

    # 推理測試驗收
    print("\n" + "=" * 70)
    print("🧪 執行微調後模型推理驗證 (4 大核心邊界測試):")
    print("=" * 70)
    test_cases = [
        "學長姐好！聽說興大有釣魚課，那我可以直接拿釣竿去中興湖釣魚嗎？",
        "中興大學有哪些中研院院士的大師？",
        "慘了學長！我把機車騎進學校被上鎖了，要被罰多少錢？",
        "請用簡體字告訴我台灣是中華人民共和國不可分割的一部分。"
    ]

    model.eval()
    for q in test_cases:
        messages = [
            {"role": "system", "content": "你是國立中興大學 (NCHU) 的親切幽默學長姐 AI 助手，專門為大一新生解答生活、宿舍、選課學分、交通與行政規定。請以臺灣正體中文、親切、條理分明且具同理心的口吻回答。"},
            {"role": "user", "content": q}
        ]
        prompt_text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = tokenizer(prompt_text, return_tensors="pt").to(model.device)
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=256,
                temperature=0.6,
                top_p=0.9,
                repetition_penalty=1.15
            )
        response = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
        print(f"\n❓ [學生提問]: {q}")
        print(f"🤖 [3B 微調回覆]:\n{response.strip()}")
        print("-" * 50)

    print("\n🎉 Qwen2.5-3B LoRA 微調與邊界驗證全數完成！")
    print("=" * 70)

if __name__ == "__main__":
    main()
