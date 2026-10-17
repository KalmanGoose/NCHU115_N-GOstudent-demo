#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
telemetry_logger.py
中興大學新生問答助手 - 隱私合規與個資去識別化日誌收集模組
遵守臺灣《個人資料保護法》原則：
1. 嚴禁記錄原始明文個資（自動遮蔽身分證、居留證、學號、電話、信箱）
2. 僅保留提問熱點分佈、命中分析與安全攔截統計
==============================================================================
"""

import os
import re
import json
import time
from datetime import datetime

LOG_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(LOG_DIR, "telemetry_logs.jsonl")

# 臺灣常見個資 Regex 偵測
RE_TW_ID = re.compile(r'[A-Za-z][1289]\d{8}')                  # 臺灣身分證字號 / 外僑居留證
RE_STUDENT_ID = re.compile(r'(?<!\d)[4-7]\d{7,9}(?!\d)')       # 大學學號格式（8~10碼）
RE_PHONE = re.compile(r'09\d{2}[-\s]?\d{3}[-\s]?\d{3}')         # 臺灣手機號碼
RE_EMAIL = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')

def sanitize_text(text: str) -> str:
    """自動過濾並脫敏文字中的任何隱私個資"""
    if not text:
        return ""
    s = text
    s = RE_TW_ID.sub("[個人證號已遮蔽]", s)
    s = RE_STUDENT_ID.sub("[學號已遮蔽]", s)
    s = RE_PHONE.sub("[手機號已遮蔽]", s)
    s = RE_EMAIL.sub("[電子郵件已遮蔽]", s)
    return s.strip()

def log_interaction(
    raw_query: str,
    matched_entry: str,
    similarity_score: float,
    guardrail_triggered: str = "none",
    latency_ms: float = 0.0
):
    """安全寫入去識別化日誌"""
    try:
        sanitized_query = sanitize_text(raw_query)
        record = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "query": sanitized_query,
            "matched_entry": matched_entry,
            "similarity_score": round(similarity_score, 4),
            "guardrail_triggered": guardrail_triggered,
            "latency_ms": round(latency_ms, 1)
        }
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception as e:
        print(f"[Telemetry Warning] 日誌寫入略過: {e}")

if __name__ == "__main__":
    # 單元測試脫敏效果
    sample = "我學號是4112056099，身分證B123456789，電話0912345678，請問二村怎麼倒垃圾？"
    print("原始問句:", sample)
    print("脫敏結果:", sanitize_text(sample))
