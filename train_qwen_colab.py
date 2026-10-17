#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) Qwen2.5-0.5B-Instruct LoRA 微調訓練腳本
(train_qwen_colab.py)
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
    DataCollatorForSeq2Seq,
    Trainer
)
from peft import (
    LoraConfig,
    get_peft_model,
    TaskType
)
from trl import SFTTrainer

def load_jsonl(path):
    data = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                data.append(json.loads(line))
    return data

def main():
    print("=" * 70)
    print("🌲 國立中興大學 (NCHU) Qwen2.5-0.5B-Instruct LoRA 微調啟動")
    print(f"CUDA 可用性: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"使用 GPU: {torch.cuda.get_device_name(0)}")
    print("=" * 70)

    train_path = "/content/train_qwen_instruct.jsonl"
    eval_path = "/content/eval_qwen_instruct.jsonl"

    if not os.path.exists(train_path):
        train_path = "train_qwen_instruct.jsonl"
        eval_path = "eval_qwen_instruct.jsonl"

    print("📖 載入對話微調資料集...")
    train_data = load_jsonl(train_path)
    eval_data = load_jsonl(eval_path)

    print(f"✅ 訓練集樣本數: {len(train_data)}")
    print(f"✅ 驗證集樣本數: {len(eval_data)}")

    model_id = "Qwen/Qwen2.5-0.5B-Instruct"
    print(f"\n📦 下載並載入開源基底模型: {model_id}...")
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # 格式化 messages 為文字
    def format_chat(sample):
        text = tokenizer.apply_chat_template(sample["messages"], tokenize=False)
        return {"text": text}

    train_dataset = Dataset.from_list(train_data).map(format_chat)
    eval_dataset = Dataset.from_list(eval_data).map(format_chat)

    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map="auto" if torch.cuda.is_available() else None,
        trust_remote_code=True
    )

    # 配置 LoRA
    print("\n⚙️ 配置 LoRA 輕量微調參數 (r=16, alpha=32)...")
    peft_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
    )
    model = get_peft_model(model, peft_config)
    model.print_trainable_parameters()

    output_dir = "/content/qwen_checkpoints"
    final_adapter_dir = "/content/nchu_qwen_adapter"

    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=3,
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        warmup_steps=20,
        fp16=torch.cuda.is_available(),
        logging_steps=20,
        eval_strategy="epoch",
        save_strategy="epoch",
        save_total_limit=1,
        report_to="none"
    )

    def tokenize_fn(batch):
        tokenized = tokenizer(batch["text"], truncation=True, max_length=512)
        tokenized["labels"] = [ids[:] for ids in tokenized["input_ids"]]
        return tokenized

    print("✂️ 正在進行對話樣本分詞與標籤對齊...")
    train_tokenized = train_dataset.map(tokenize_fn, batched=True, remove_columns=["text"])
    eval_tokenized = eval_dataset.map(tokenize_fn, batched=True, remove_columns=["text"])

    data_collator = DataCollatorForSeq2Seq(tokenizer=tokenizer, padding=True, pad_to_multiple_of=8)

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_tokenized,
        eval_dataset=eval_tokenized,
        data_collator=data_collator,
    )

    print("\n🚀 開始微調 Qwen 學長姐對話模型 (預計 4~6 分鐘)...")
    trainer.train()

    print(f"\n💾 儲存 LoRA 微調權重至: {final_adapter_dir}...")
    model.save_pretrained(final_adapter_dir)
    tokenizer.save_pretrained(final_adapter_dir)

    # 執行真實推論測試
    print("\n" + "=" * 70)
    print("🎓 學長姐生成式問答實測 (Inference Demo)")
    print("=" * 70)
    model.eval()

    test_questions = [
        "大一保證有宿舍住嗎？男宿二村環境怎麼樣？",
        "二村洗衣服要投多少錢？有烘衣機嗎？"
    ]

    for q in test_questions:
        messages = [
            {"role": "system", "content": "你是國立中興大學 (NCHU) 的親切幽默學長姐 AI 助手。"},
            {"role": "user", "content": q}
        ]
        prompt_text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = tokenizer(prompt_text, return_tensors="pt").to(model.device)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=256,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.1,
                do_sample=True,
                pad_token_id=tokenizer.pad_token_id
            )

        response = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
        print(f"❓ 【學弟妹發問】: {q}")
        print(f"💬 【微調學長姐回答】:\n{response}")
        print("-" * 60)

    # 壓縮為 zip 檔
    zip_output = "/content/nchu_qwen_adapter"
    shutil.make_archive(zip_output, 'zip', final_adapter_dir)
    print(f"\n📦 LoRA 權重已打包: {zip_output}.zip ({os.path.getsize(zip_output + '.zip') / 1024 / 1024:.2f} MB)")
    print("🎉 恭喜！中興學長姐 Qwen2.5-0.5B 生成模型微調圓滿完成！")
    print("=" * 70)

if __name__ == "__main__":
    main()
