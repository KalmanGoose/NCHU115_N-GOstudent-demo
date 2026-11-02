#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) Google Gemma 2 (2B-it) 滿血版 LoRA 微調訓練腳本
(train_gemma2_lora_colab.py - 專為 Google Colab GPU 設計)
==============================================================================
特點：
  1. 針對 Google Gemma 2 2B-it (2.6B 輕量小鋼砲，顯存僅需 5.6GB，極速穩定)
  2. 內建 Gemma 專屬對話模板轉換器 (自動適配 user/model 角色結構)
  3. 4-bit QLoRA 節能低顯存微調 (完美運行於免費 T4，系統 RAM 充裕保留 10GB+)
  4. 載入滿血版 train_qwen_instruct_v3.jsonl (3,183 筆高階多角指令集)
  5. 權重對齊：興大美食完全體、健諮中心特約診所、週一至五醫師駐診、InBody、40系所大白話、交通公車
  6. 訓練後自動執行 7 大極端情境推理驗收，並自動打包 nchu_gemma2_adapter.zip
==============================================================================
"""

import os
import sys
import json
import shutil
import argparse
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

def format_for_gemma(msgs):
    """將 system + user + assistant 轉為 Gemma 2 原生相容之 user + model 結構"""
    formatted = []
    sys_content = ""
    for m in msgs:
        role = m.get("role", "")
        content = m.get("content", "")
        if role == "system":
            sys_content = content
        elif role == "user":
            c = f"{sys_content}\n\n{content}" if sys_content else content
            formatted.append({"role": "user", "content": c})
            sys_content = ""
        elif role in ["assistant", "model"]:
            formatted.append({"role": "model", "content": content})
    return formatted

def main():
    parser = argparse.ArgumentParser(description="NCHU Gemma 2 LoRA Fine-Tuning")
    parser.add_argument("--model_id", type=str, default="unsloth/gemma-2-2b-it", help="Hugging Face Model ID")
    parser.add_argument("--output_name", type=str, default="nchu_gemma2_adapter", help="Output adapter folder and zip name")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=2, help="Batch size per device")
    args = parser.parse_args()

    model_id = args.model_id
    output_name = args.output_name

    print("=" * 70)
    print(f"🌲 國立中興大學 (NCHU) Google Gemma 2 (2B-it) 領域模型 LoRA 微調啟動")
    print(f"🎯 目標基底模型: {model_id}")
    print(f"CUDA 可用性: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"使用 GPU: {torch.cuda.get_device_name(0)}")
        print(f"總顯存: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
    print("=" * 70)

    train_path = "/content/train_instruct_v3.jsonl" if os.path.exists("/content/train_instruct_v3.jsonl") else "/content/train_qwen_instruct_v3.jsonl"
    eval_path = "/content/eval_instruct_v3.jsonl" if os.path.exists("/content/eval_instruct_v3.jsonl") else "/content/eval_qwen_instruct_v3.jsonl"

    if not os.path.exists(train_path):
        train_path = "train_instruct_v3.jsonl" if os.path.exists("train_instruct_v3.jsonl") else "train_qwen_instruct_v3.jsonl"
        eval_path = "eval_instruct_v3.jsonl" if os.path.exists("eval_instruct_v3.jsonl") else "eval_qwen_instruct_v3.jsonl"

    print("📖 載入滿血版 V3 對話微調資料集...")
    train_data = load_jsonl(train_path)
    eval_data = load_jsonl(eval_path)

    print(f"✅ 訓練集樣本數: {len(train_data)}")
    print(f"✅ 驗證集樣本數: {len(eval_data)}")

    print(f"\n📦 下載並載入 Gemma 2 Tokenizer: {model_id}...")
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # 僅對 assistant 回答區段計算 Cross-Entropy Loss，將 system 與 user prompt 設為 -100
    max_seq_len = 1024

    def encode_with_loss_masking(sample):
        raw_msgs = sample["messages"]
        clean_msgs = format_for_gemma(raw_msgs)
        prompt_ids = tokenizer.apply_chat_template(
            clean_msgs[:-1], add_generation_prompt=True, tokenize=True, return_dict=False
        )
        full_ids = tokenizer.apply_chat_template(clean_msgs, tokenize=True, return_dict=False)
        if len(full_ids) > max_seq_len:
            full_ids = full_ids[:max_seq_len]
        prompt_len = min(len(prompt_ids), len(full_ids))
        labels = [-100] * prompt_len + full_ids[prompt_len:]
        return {
            "input_ids": full_ids,
            "attention_mask": [1] * len(full_ids),
            "labels": labels,
        }

    print("\n⚙️ 執行 Token 化與 Assistant Loss 遮罩...")
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

    print(f"\n⚙️ 載入 {model_id} 模型主體 (4-bit 節能省顯存模式，僅佔 ~5.6GB)...")
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=bnb_config,
        device_map="auto" if torch.cuda.is_available() else None,
        trust_remote_code=True
    )

    if torch.cuda.is_available():
        model = prepare_model_for_kbit_training(model)

    # 配置 LoRA
    print("\n⚙️ 配置 Gemma 2 LoRA 參數 (r=16, alpha=32, target_modules=全線性投影)...")
    peft_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
    )
    model = get_peft_model(model, peft_config)
    model.print_trainable_parameters()

    output_dir = f"/content/{output_name}_checkpoints" if os.path.exists("/content") else f"./{output_name}_checkpoints"
    final_adapter_dir = f"/content/{output_name}" if os.path.exists("/content") else f"./{output_name}"

    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
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

    print(f"\n🚀 開始 Google Gemma 2 ({model_id}) LoRA 訓練...")
    trainer.train()

    print(f"\n💾 儲存 Gemma 2 LoRA Adapter 至: {final_adapter_dir}...")
    model.save_pretrained(final_adapter_dir)
    tokenizer.save_pretrained(final_adapter_dir)

    # 打包 zip
    zip_path = f"/content/{output_name}.zip" if os.path.exists("/content") else f"./{output_name}.zip"
    shutil.make_archive(final_adapter_dir, 'zip', final_adapter_dir)
    print(f"\n📦 Gemma 2 LoRA Adapter 已壓縮為: {zip_path}")

    # 推理測試驗收
    print("\n" + "=" * 70)
    print("🧪 執行微調後 Gemma 2 模型推理驗證 (美食、特約就醫與邊界測試):")
    print("=" * 70)
    test_cases = [
        "學長姐好！聽說興大有釣魚課，那我可以直接拿釣竿去中興湖釣魚嗎？",
        "慘了學長！我把機車騎進學校被上鎖了，要被罰多少錢？",
        "大一生在校外看病，拿興大學生證有哪些特約診所可以免掛號費？牙痛有推薦嗎？",
        "惠蓀堂1樓有體脂計可以免費量嗎？吃完宵夜想贖罪有什麼活動？",
        "學府路有什麼推薦的美食？紅線茶舖有什麼好喝的？",
        "中興動科系都在學什麼？是在幫寵物看病嗎？",
        "請問中興大學校內有高爾夫球場可以打球嗎？"
    ]

    model.eval()
    sys_prompt = "你是國立中興大學 (NCHU) 的親切幽默學長姐 AI 助手，專門為大一新生解答生活、宿舍、選課學分、交通與行政規定。請以臺灣正體中文、親切、條理分明且具同理心的口吻回答。"
    for q in test_cases:
        messages = [
            {"role": "user", "content": f"{sys_prompt}\n\n{q}"}
        ]
        prompt_ids = tokenizer.apply_chat_template(messages, add_generation_prompt=True, tokenize=True, return_dict=False)
        input_tensor = torch.tensor([prompt_ids]).to(model.device)
        with torch.no_grad():
            outputs = model.generate(
                input_tensor,
                max_new_tokens=256,
                temperature=0.6,
                top_p=0.9,
                repetition_penalty=1.15
            )
        response = tokenizer.decode(outputs[0][len(prompt_ids):], skip_special_tokens=True)
        print(f"\n❓ [學生提問]: {q}")
        print(f"🤖 [Gemma 2 微調回覆]:\n{response.strip()}")
        print("-" * 50)

    print("\n🎉 Google Gemma 2 LoRA 微調與邊界驗證全數完成！")
    print("=" * 70)

if __name__ == "__main__":
    main()
