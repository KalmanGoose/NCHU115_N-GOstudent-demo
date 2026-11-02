#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) 多模型自動接力訓練守護進程 (auto_pipeline_daemon.py)
==============================================================================
功能：
  1. 階段一：啟動 Google Gemma 2 (2B-it) LoRA 微調
  2. 階段二：接力啟動 Meta Llama 3.2 (3B-Instruct) LoRA 微調
  3. 階段三：接力啟動 國科會 TAIDE (7B-Chat) 台灣繁中 LoRA 微調
  4. 每一步自動保存 Checkpoint 與 Zip 封裝包，具備斷點跳過機制
==============================================================================
"""

import os
import sys
import time
import subprocess

def run_job(script_name, job_title):
    print("\n" + "=" * 70)
    print(f"🚀 [自動接力啟動] {job_title}")
    print(f"💻 執行: python3 /content/{script_name}")
    print("=" * 70)
    log_file = f"/content/{script_name.replace('.py', '.log')}"
    with open(log_file, "w") as f:
        p = subprocess.Popen(["python3", f"/content/{script_name}"], stdout=f, stderr=subprocess.STDOUT)
    print(f"✅ {job_title} 已在背景啟動 (PID: {p.pid})，即時日誌輸出至: {log_file}")
    p.wait()
    if p.returncode == 0:
        print(f"\n🎉 {job_title} 圓滿完賽！")
        return True
    else:
        print(f"\n❌ {job_title} 異常退出 (Exit code: {p.returncode})，日誌請見: {log_file}")
        return False

def main():
    print("=" * 70)
    print("🌲 國立中興大學 (NCHU) 全模型微調接力排程器啟動")
    print("=" * 70)

    # 階段 1: Google Gemma 2 (2B-it)
    if not os.path.exists("/content/nchu_gemma2_adapter.zip"):
        print("\n>>> 進入階段一：啟動 Google Gemma 2 (2B-it) 微調 <<<")
        run_job("train_gemma2_lora_colab.py", "Google Gemma 2 (2B-it) LoRA 微調")
    else:
        print("\n✅ Gemma 2 Adapter 封裝包已存在，跳過階段一。")

    # 階段 2: Meta Llama 3.2 (3B-Instruct)
    if not os.path.exists("/content/nchu_llama3_adapter.zip"):
        print("\n>>> 進入階段二：啟動 Meta Llama 3.2 (3B-Instruct) 微調 <<<")
        run_job("train_llama3_lora_colab.py", "Meta Llama 3.2 (3B-Instruct) LoRA 微調")
    else:
        print("\n✅ Llama 3.2 Adapter 封裝包已存在，跳過階段二。")

    # 階段 3: 國科會 TAIDE 7B
    if not os.path.exists("/content/nchu_taide_adapter.zip"):
        print("\n>>> 進入階段三：啟動 國科會 TAIDE 台灣繁中模型訓練 <<<")
        run_job("train_taide_lora_colab.py", "國科會 TAIDE (7B-Chat) 台灣繁中 LoRA 微調")
    else:
        print("\n✅ TAIDE Adapter 封裝包已存在，跳過階段三。")

    print("\n" + "=" * 70)
    print("🏆 全套模型微調接力全數完成！")
    print("產出物清單：")
    print(f"  - /content/nchu_bge_small_v2.zip (存在: {os.path.exists('/content/nchu_bge_small_v2.zip')})")
    print(f"  - /content/nchu_gemma2_adapter.zip (存在: {os.path.exists('/content/nchu_gemma2_adapter.zip')})")
    print(f"  - /content/nchu_llama3_adapter.zip (存在: {os.path.exists('/content/nchu_llama3_adapter.zip')})")
    print(f"  - /content/nchu_taide_adapter.zip (存在: {os.path.exists('/content/nchu_taide_adapter.zip')})")
    print("=" * 70)

if __name__ == "__main__":
    main()
