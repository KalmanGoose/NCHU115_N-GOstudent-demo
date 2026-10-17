#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
中興大學新生 LINE 群「學長姐叫人爬文 / 指路幽默對話」萃取腳本 (extract_senior_roasts.py)
==============================================================================
"""

import os
import re
import json

TRIGGER_PATTERN = re.compile(
    r'(記事本|置頂|公告|爬文|新生專區|自己找|先看|教務處|選課須知|伸手|不是寫了|第.*次問|網站都有|看一下)'
)

def extract_senior_roasts(txt_path="資料集/[LINE]中興大學115新生群.txt", output_json="senior_roasts.json"):
    # 自動相容是否有空白的檔名
    if not os.path.exists(txt_path):
        alt_paths = [
            "資料集/[LINE]中興大學115新生群.txt",
            "資料集/[LINE]中興大學 115新生群.txt",
            os.path.join(os.path.dirname(__file__), "資料集", "[LINE]中興大學115新生群.txt"),
            os.path.join(os.path.dirname(__file__), "資料集", "[LINE]中興大學 115新生群.txt"),
        ]
        for alt in alt_paths:
            if os.path.exists(alt):
                txt_path = alt
                break

    if not os.path.exists(txt_path):
        print(f"❌ 找不到檔案: {txt_path}")
        return []

    print(f"📖 正在讀取 LINE 訊息檔: {txt_path} ...")
    with open(txt_path, "r", encoding="utf-8", errors="ignore") as f:
        raw_lines = [line.strip() for line in f if line.strip()]

    # 先排除所有系統與機器人行
    filtered_lines = []
    for l in raw_lines:
        if any(b in l for b in [
            "Auto-reply", 
            "歡迎來到115新生群", 
            "記事本有很多很多資訊喔", 
            "然後麻煩大家記得看公告", 
            "最後很重要的事就是記得把匿名改成",
            "最後很重要的事情就是記得把匿名改成",
            "祝大家大學生活快樂美滿！！！",
            "加入聊天",
            "離開聊天"
        ]):
            continue
        filtered_lines.append(l)

    extracted_events = []
    seen = set()

    for i, line in enumerate(filtered_lines):
        if TRIGGER_PATTERN.search(line):
            context_window = filtered_lines[max(0, i-2):min(len(filtered_lines), i+3)]
            clean_lines = []
            for l in context_window:
                if any(k in l for k in ["貼圖", "相片", "已收回", "通話"]):
                    continue
                clean_l = re.sub(r'^\d{1,2}:\d{2}\s+', '', l).strip()
                if clean_l:
                    clean_lines.append(clean_l)

            clean_dialogue = " \n ".join(clean_lines)
            if len(clean_dialogue) > 15 and clean_dialogue not in seen:
                seen.add(clean_dialogue)
                extracted_events.append(clean_dialogue)

    print(f"🔥 共抓出 {len(extracted_events)} 處學長姐叫人爬文/指路的經典現場！")

    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(extracted_events, f, ensure_ascii=False, indent=2)

    print(f"✅ 已成功儲存至 {output_json}")
    return extracted_events

if __name__ == "__main__":
    extract_senior_roasts()
