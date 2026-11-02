#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) 全自動雙軌訓練調度主腳本 (run_all_training.py)
==============================================================================
依序執行：
  1. BGE-Small V2 向量檢索微調 (使用 train_triplets_v3.jsonl)
  2. Google Gemma 2 (2B-it) 4-bit QLoRA 領域微調 (使用 train_instruct_v3.jsonl)
  3. 自動打包壓縮產出物 (nchu_bge_small_v2.zip, nchu_gemma2_adapter.zip)
==============================================================================
"""

import os
import sys
import time
import subprocess

def run_cmd(cmd, desc):
    print("\n" + "=" * 70)
    print(f"🚀 [執行任務] {desc}")
    print(f"💻 指令: {' '.join(cmd)}")
    print("=" * 70)
    t0 = time.time()
    ret = subprocess.run(cmd)
    dt = time.time() - t0
    if ret.returncode != 0:
        print(f"\n❌ {desc} 執行失敗 (Exit code: {ret.returncode})，耗時: {dt:.1f} 秒")
        return False
    print(f"\n✅ {desc} 順利完成！耗時: {dt:.1f} 秒")
    return True

def main():
    print("=" * 70)
    print("🌲 國立中興大學 (NCHU) V3 滿血雙軌微調自動化調度器")
    print("=" * 70)

    # 任務 1: BGE 向量檢索微調
    ok1 = run_cmd(
        ["python3", "/content/train_bge_colab_v2.py"],
        "BGE 領域向量對比微調 (SentenceTransformer Triplets)"
    )
    if not ok1:
        print("⚠️ BGE 訓練異常，終止後續任務。")
        sys.exit(1)

    # 任務 2: Google Gemma 2 (2B-it) QLoRA 微調
    ok2 = run_cmd(
        [
            "python3", "/content/train_gemma2_lora_colab.py",
            "--model_id", "unsloth/gemma-2-2b-it",
            "--output_name", "nchu_gemma2_adapter",
            "--epochs", "3",
            "--batch_size", "2"
        ],
        "Google Gemma 2 (2B-it) 4-bit QLoRA 對齊微調"
    )
    if not ok2:
        print("⚠️ Gemma 2 訓練異常，請檢查日誌。")
        sys.exit(1)

    print("\n" + "=" * 70)
    print("🎉🎉🎉 恭喜！中興大學領域雙軌模型微調已全數圓滿成功！")
    print("產出權重壓縮包：")
    print("  1. /content/nchu_bge_small_v2.zip (語意檢索特徵庫)")
    print("  2. /content/nchu_gemma2_adapter.zip (Google Gemma 2 領域對話 Adapter)")
    print("=" * 70)

if __name__ == "__main__":
    main()
