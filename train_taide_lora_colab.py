#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) 國科會 TAIDE 滿血版 LoRA 微調與邊緣量化導出腳本
(train_taide_lora_colab.py - 專為 Google Colab GPU / 邊緣運算設計)
==============================================================================
特點：
  1. 全面支援國科會 (NSTC) 台灣繁中主力模型：
     - taide/Llama-3.1-TAIDE-LX-8B-Chat (推薦主力，Llama 3.1 世代)
     - taide/TAIDE-LX-7B-Chat (經典 7B 輕量版)
     - taide/Gemma-3-TAIDE-12b-Chat-2602 (最新旗艦 12B，超長上下文)
  2. 遵循 TAIDE 社群雙重授權合規規範 (Built with TAIDE)
  3. 4-bit QLoRA 節能低顯存微調 (T4 顯存約 7.5GB~8.5GB)
  4. 載入滿血版 train_instruct_v3.jsonl (3,183 筆高階多角指令集)
  5. 支援一鍵合併與 GGUF 邊緣量化導出指引 (Q4_K_M，適配 Ollama / llama.cpp / HF Space)
==============================================================================
"""

import os
import sys
import json
import shutil
import argparse
import subprocess
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
    prepare_model_for_kbit_training,
    PeftModel
)

def load_jsonl(path):
    data = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                data.append(json.loads(line))
    return data

def main():
    parser = argparse.ArgumentParser(description="NCHU TAIDE LoRA Fine-Tuning & Quantization")
    parser.add_argument("--model_id", type=str, default="taide/Llama-3.1-TAIDE-LX-8B-Chat", 
                        help="Hugging Face Model ID (e.g. taide/Llama-3.1-TAIDE-LX-8B-Chat or taide/TAIDE-LX-7B-Chat)")
    parser.add_argument("--output_name", type=str, default="nchu_taide_adapter", help="Output adapter folder and zip name")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=1, help="Batch size per device (T4 推薦為 1)")
    parser.add_argument("--export_gguf", action="store_true", help="自動產出合併權重與 GGUF 量化部署腳本")
    args = parser.parse_args()

    # 顯存防碎片化設定
    os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"

    model_id = args.model_id
    output_name = args.output_name

    print("=" * 70)
    print(f"🌲 國立中興大學 (NCHU) 國科會 TAIDE 台灣繁中領域模型 LoRA 微調啟動")
    print(f"🎯 目標基底模型: {model_id}")
    print(f"📜 授權合規遵循: NSTC TAIDE Community License + Base Model Terms")
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

    print(f"\n📦 下載並載入 TAIDE Tokenizer: {model_id}...")
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    max_seq_len = 512

    def encode_with_loss_masking(sample):
        msgs = sample["messages"]
        prompt_ids = tokenizer.apply_chat_template(
            msgs[:-1], add_generation_prompt=True, tokenize=True, return_dict=False
        )
        full_ids = tokenizer.apply_chat_template(msgs, tokenize=True, return_dict=False)
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

    bnb_config = None
    if torch.cuda.is_available():
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True
        )

    print(f"\n⚙️ 載入 {model_id} 模型主體 (4-bit 節能省顯存模式，約佔 ~7.5GB)...")
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=bnb_config,
        torch_dtype=torch.float16,
        device_map="auto" if torch.cuda.is_available() else None,
        trust_remote_code=True
    )

    # 關鍵顯存優化：關閉訓練用不到的 KV 快取
    model.config.use_cache = False

    if torch.cuda.is_available():
        model = prepare_model_for_kbit_training(model)

    print("\n⚙️ 配置 TAIDE LoRA 參數 (r=16, alpha=32, target_modules=全線性投影)...")
    peft_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
    )
    model = get_peft_model(model, peft_config)

    # 關鍵顯存優化：prepare_model_for_kbit_training 會將 128k 詞表與 lm_head 轉為 fp32 (暴增 2.1GB)
    # 將非訓練的凍結參數轉回 fp16，僅保留 LoRA 權重為 fp32，直接省下 >2.1GB 顯存！
    if torch.cuda.is_available():
        for name, param in model.named_parameters():
            if not param.requires_grad and param.dtype == torch.float32:
                param.data = param.data.to(torch.float16)
        torch.cuda.empty_cache()

    model.print_trainable_parameters()

    output_dir = f"/content/{output_name}_checkpoints" if os.path.exists("/content") else f"./{output_name}_checkpoints"
    final_adapter_dir = f"/content/{output_name}" if os.path.exists("/content") else f"./{output_name}"

    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        gradient_accumulation_steps=8,
        gradient_checkpointing=True,
        gradient_checkpointing_kwargs={"use_reentrant": False},
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

    print(f"\n🚀 開始國科會 TAIDE ({model_id}) LoRA 訓練...")
    trainer.train()

    print(f"\n💾 儲存 TAIDE LoRA Adapter 至: {final_adapter_dir}...")
    model.save_pretrained(final_adapter_dir)
    tokenizer.save_pretrained(final_adapter_dir)

    zip_path = f"/content/{output_name}.zip" if os.path.exists("/content") else f"./{output_name}.zip"
    shutil.make_archive(final_adapter_dir, 'zip', final_adapter_dir)
    print(f"\n📦 TAIDE LoRA Adapter 已壓縮為: {zip_path}")

    # 推理測試驗收
    print("\n" + "=" * 70)
    print("🧪 執行微調後 TAIDE 模型推理驗證 (美食、特約就醫與邊界測試):")
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
    for q in test_cases:
        messages = [
            {"role": "system", "content": "你是國立中興大學 (NCHU) 的親切幽默學長姐 AI 助手，專門為大一新生解答生活、宿舍、選課學分、交通與行政規定。請以臺灣正體中文、親切、條理分明且具同理心的口吻回答。"},
            {"role": "user", "content": q}
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
        print(f"🤖 [TAIDE 微調回覆]:\n{response.strip()}")
        print("-" * 50)

    print("\n🎉 國科會 TAIDE LoRA 微調與邊界驗證全數完成！")
    print("=" * 70)

    # 產生 GGUF 邊緣量化一鍵腳本指引
    sh_export_path = f"/content/export_{output_name}_gguf.sh" if os.path.exists("/content") else f"./export_{output_name}_gguf.sh"
    merge_script = f"""#!/bin/bash
# ==============================================================================
# NCHU TAIDE LoRA 模型合併與 4-bit (Q4_K_M) GGUF 邊緣量化一鍵腳本
# 適用於: Ollama / llama.cpp / Hugging Face Spaces (免綁卡 16GB RAM)
# ==============================================================================
set -e
echo "🚀 [1/3] 克隆 llama.cpp 推論量化引擎..."
if [ ! -d "llama.cpp" ]; then
  git clone https://github.com/ggerganov/llama.cpp.git
  cd llama.cpp && cmake -B build && cmake --build build --config Release -j && cd ..
fi

echo "🚀 [2/3] 合併 LoRA Adapter 至基底模型..."
python3 -c '
import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

base_id = "{model_id}"
adapter_dir = "{final_adapter_dir}"
merged_dir = "./{output_name}_merged"

print(f"載入基底模型 {{base_id}}...")
base_model = AutoModelForCausalLM.from_pretrained(base_id, torch_dtype=torch.float16, device_map="cpu", trust_remote_code=True)
tokenizer = AutoTokenizer.from_pretrained(base_id, trust_remote_code=True)

print(f"合併 LoRA Adapter {{adapter_dir}}...")
model = PeftModel.from_pretrained(base_model, adapter_dir)
merged_model = model.merge_and_unload()

print(f"儲存合併後模型至 {{merged_dir}}...")
merged_model.save_pretrained(merged_dir)
tokenizer.save_pretrained(merged_dir)
print("✅ 合併完成！")
'

echo "🚀 [3/3] 轉換為 GGUF 格式並執行 4-bit (Q4_K_M) 邊緣量化..."
python3 llama.cpp/convert_hf_to_gguf.py ./{output_name}_merged --outfile ./{output_name}_f16.gguf
./llama.cpp/build/bin/llama-quantize ./{output_name}_f16.gguf ./{output_name}_q4_k_m.gguf Q4_K_M

echo "=============================================================================="
echo "🎉 恭喜！{output_name}_q4_k_m.gguf (約 4.5GB) 量化完成！"
echo "👉 可直接拖曳進 Ollama 或部署至 Hugging Face Space (CPU Basic 免卡) 運行！"
echo "=============================================================================="
"""
    with open(sh_export_path, "w", encoding="utf-8") as f:
        f.write(merge_script)
    os.chmod(sh_export_path, 0o755)

    print(f"\n📦 已自動生成 GGUF 邊緣量化一鍵腳本: {sh_export_path}")
    print(f"💡 若需匯出 GGUF 供邊緣端 (Ollama / HF Space) 部署，只需在終端執行:")
    print(f"   bash {sh_export_path}")
    print("=" * 70)

if __name__ == "__main__":
    main()
