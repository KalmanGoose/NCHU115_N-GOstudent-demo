#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) Qwen2.5-0.5B 學長姐對話模型本機測試腳本
(test_local_qwen.py)
==============================================================================
使用本機剛剛在 Colab 微調完成並下載的 LoRA 權重 (./nchu_qwen_adapter)，
在你的 Apple M1 Mac 上直接與專屬的「中興學長姐 AI」對話！
支援：
  python test_local_qwen.py "你的問題"
==============================================================================
"""

import os
import sys
import time
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ADAPTER_DIR = os.path.join(BASE_DIR, "nchu_qwen_adapter")
BASE_MODEL_ID = "Qwen/Qwen2.5-0.5B-Instruct"

SYSTEM_PROMPT = (
    "你是國立中興大學 (NCHU) 的親切幽默學長姐 AI 助手，專門為大一新生解答校園生活、"
    "宿舍、選課學分與周邊資訊。請依據學校事實以親切親民的口吻回答。"
)

def main():
    print("=" * 70)
    print("🌲 國立中興大學 (NCHU) - 本機 Qwen2.5-0.5B 學長姐對話模型測試")
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"硬體加速: Apple Silicon (裝置: {device})")
    print("=" * 70)

    if not os.path.exists(ADAPTER_DIR):
        print(f"❌ 找不到 LoRA 權重資料夾: {ADAPTER_DIR}")
        return

    # 1. 載入基底模型與分詞器
    print(f"📦 載入基底模型: {BASE_MODEL_ID} (0.49B 參數)...")
    t0 = time.time()
    tokenizer = AutoTokenizer.from_pretrained(ADAPTER_DIR, trust_remote_code=True)
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_ID,
        dtype=torch.float16 if torch.cuda.is_available() or torch.backends.mps.is_available() else torch.float32,
        device_map=device,
        trust_remote_code=True
    )

    # 2. 掛載中興專屬 LoRA Adapter
    print(f"🧩 掛載中興專屬 LoRA 微調權重: {ADAPTER_DIR}...")
    model = PeftModel.from_pretrained(base_model, ADAPTER_DIR)
    model.eval()
    print(f"✅ 模型與權重加載完成！耗時: {time.time() - t0:.2f} 秒\n")

    # 3. 準備問題
    if len(sys.argv) > 1:
        user_question = " ".join(sys.argv[1:])
    else:
        user_question = "學長姐好，大一新生保證有宿舍住嗎？男宿環境怎麼樣？"

    print(f"❓ 【大一新生提問】: {user_question}")
    print("💬 【中興學長姐正在回答中...】\n" + "-" * 60)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_question}
    ]

    prompt_text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(prompt_text, return_tensors="pt").to(device)

    t_start = time.time()
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

    latency = time.time() - t_start
    reply = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True).strip()

    print(reply)
    print("-" * 60)
    print(f"⏱️ 本機生成耗時: {latency:.2f} 秒")
    print("=" * 70)
    print("💡 提示：你可以隨時用本指令自訂問題測試：")
    print("   /opt/anaconda3/bin/python3 test_local_qwen.py \"你的問題\"")
    print("=" * 70)

if __name__ == "__main__":
    main()
