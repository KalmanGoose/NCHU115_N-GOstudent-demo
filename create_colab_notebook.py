#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成一鍵式 Google Colab Notebook (NCHU_AI_Training_Colab.ipynb)
"""

import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
NOTEBOOK_PATH = os.path.join(BASE_DIR, "NCHU_AI_Training_Colab.ipynb")

notebook_data = {
    "nbformat": 4,
    "nbformat_minor": 0,
    "metadata": {
        "accelerator": "GPU",
        "colab": {
            "name": "國立中興大學 (NCHU) 雙軌 AI 微調訓練工作台",
            "provenance": []
        },
        "kernelspec": {
            "display_name": "Python 3",
            "name": "python3"
        },
        "language_info": {
            "name": "python"
        }
    },
    "cells": [
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "# 🌲 國立中興大學 (NCHU) 3B AI 雙軌模型微調工作台 (Google Colab 專用)\n",
                "\n",
                "本 Notebook 提供中興大學智慧對話核心之兩大專屬升級軌道：\n",
                "1. **【軌道 1】BGE-Small V2 向量檢索特徵微調**（強化中興黑話、處室 SOP、釣魚課與名師大師檢索）\n",
                "2. **【軌道 2】Qwen2.5-3B-Instruct 4-bit LoRA 人設與安全對齊微調**（自然臺灣口吻、防禦邊界肌肉記憶、無模板坍塌）\n",
                "\n",
                "請確認 Colab 執行階段已切換至 **GPU (T4 或 A100)**：`執行階段 -> 變更執行階段類型 -> T4 GPU`。"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "### 步驟 1：環境與 GPU 硬體檢查"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "!nvidia-smi"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "### 步驟 2：一鍵安裝微調必要套件"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "!pip install -q -U \"sentence-transformers>=3.0.0\" datasets accelerate transformers peft trl bitsandbytes"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "### 步驟 3：上傳並解壓縮訓練包 (`colab_all_finetune_bundle.zip`)\n",
                "請點選左側檔案夾圖示，直接拖曳上傳 `colab_all_finetune_bundle.zip`，或執行下方單元格上傳："
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "import os\n",
                "from google.colab import files\n",
                "\n",
                "if not os.path.exists('colab_all_finetune_bundle.zip'):\n",
                "    print('請上傳本機專案目錄下的 colab_all_finetune_bundle.zip：')\n",
                "    uploaded = files.upload()\n",
                "\n",
                "!unzip -o colab_all_finetune_bundle.zip\n",
                "!ls -la *.py *.jsonl"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 🚀 【軌道 1 執行】：微調 BGE-Small V2 向量檢索模型\n",
                "- 採用 Hard-Negative 三元組與 `MultipleNegativesRankingLoss`\n",
                "- 自動評測微調前後相似度\n",
                "- 預計耗時：約 10~15 分鐘（T4 GPU）\n",
                "- 輸出產物：`nchu_bge_small_v2.zip`"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "!python train_bge_colab_v2.py"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 🚀 【軌道 2 執行】：微調 Qwen2.5-3B-Instruct LoRA 人設對齊\n",
                "- 採用 4-bit QLoRA 節能微調，完全相容免費 T4 顯存（約佔 4GB）\n",
                "- 訓練後自動執行四大核心邊界推理驗證\n",
                "- 預計耗時：約 20~30 分鐘（T4 GPU）\n",
                "- 輸出產物：`nchu_qwen3b_adapter.zip`"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "!python train_qwen3b_lora_colab.py"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "### 步驟 4：自動下載微調完成的產出模型包\n",
                "下載後可將檔案解壓縮放回本地專案目錄，無縫完成模型熱升級！"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "from google.colab import files\n",
                "\n",
                "if os.path.exists('nchu_bge_small_v2.zip'):\n",
                "    print('📦 下載 BGE-Small V2 向量特徵權重...')\n",
                "    files.download('nchu_bge_small_v2.zip')\n",
                "\n",
                "if os.path.exists('nchu_qwen3b_adapter.zip'):\n",
                "    print('📦 下載 Qwen2.5-3B LoRA Adapter 權重...')\n",
                "    files.download('nchu_qwen3b_adapter.zip')"
            ]
        }
    ]
}

with open(NOTEBOOK_PATH, "w", encoding="utf-8") as f:
    json.dump(notebook_data, f, ensure_ascii=False, indent=2)

print(f"✅ Google Colab Notebook 建立完成：{NOTEBOOK_PATH}")
