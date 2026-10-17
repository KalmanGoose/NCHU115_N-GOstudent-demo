#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) Qwen2.5-0.5B 語言模型對齊微調資料集生成腳本
(prepare_slm_data.py)
==============================================================================
從已淨化的 505 筆 campus_knowledge.json 條目中，自動合成結構化的
對話式指令微調資料集 (Instruction / Chat Tuning Dataset)。
輸出格式：符合 Hugging Face / TRL SFTTrainer 標準之 messages JSONL
==============================================================================
"""

import os
import re
import json
import random
from typing import List, Dict, Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
TRAIN_OUTPUT = os.path.join(BASE_DIR, "train_qwen_instruct.jsonl")
EVAL_OUTPUT = os.path.join(BASE_DIR, "eval_qwen_instruct.jsonl")

SYSTEM_PROMPT = (
    "你是國立中興大學 (NCHU) 的親切幽默學長姐 AI 助手，專門為大一新生解答生活、宿舍、"
    "選課學分、交通與行政規定。請以親切、清晰、負責任且具同理心的口吻回答，依據學校事實"
    "條理化說明，絕不提供未查證之負面評價。"
)

QUESTION_TEMPLATES = [
    "學長姐好，請問一下{}？",
    "想問一下有關{}的規定，大一新生需要注意什麼？",
    "請問中興大學{}？",
    "新生想了解{}，可以幫我說明一下嗎？",
    "請問{}是怎麼運作的？",
    "剛進中興不太清楚，想請問{}？",
    "{}"
]

SENIOR_INTROS = [
    "嗨嗨學弟妹！關於{}，學長姐幫你把重點整理好囉：\n\n",
    "歡迎加入中興大家庭！針對{}，目前的規範與建議如下：\n\n",
    "這個問題問得很好！大一剛進來確實很多規矩要摸清楚。關於{}：\n\n",
    "別擔心，學長姐剛入學時也問過這題！針對{}的詳細資訊：\n\n",
    "哈囉！關於你詢問的{}，請參考以下整理：\n\n"
]

SENIOR_OUTROS = [
    "\n\n如果還有不懂的，隨時再問學長姐喔，祝你在中興開學順利！🌲",
    "\n\n記得重要時程或申請要多留意學校系統公告喔！✨",
    "\n\n在中興生活有任何疑問都可以隨時來查，加油！💪",
    "\n\n以上整理供你參考，放寬心享受大學新生活吧！🎓"
]

def clean_text(text: str) -> str:
    if not text:
        return ""
    return re.sub(r'\s+', ' ', str(text)).strip()

def parse_keywords(raw_kws: Any) -> List[str]:
    if isinstance(raw_kws, list):
        items = raw_kws
    else:
        items = re.split(r'[,、，\s]+', str(raw_kws or ""))
    res = []
    seen = set()
    for it in items:
        k = clean_text(it)
        if k and len(k) >= 2 and k not in seen:
            seen.add(k)
            res.append(k)
    return res

def main():
    print("=" * 70)
    print("🎓 開始生成 Qwen2.5-0.5B 學長姐對齊微調資料集...")
    print("=" * 70)

    if not os.path.exists(JSON_PATH):
        print(f"❌ 找不到知識庫檔案: {JSON_PATH}")
        return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        kb_items = json.load(f)

    print(f"✅ 成功載入 {len(kb_items)} 筆淨化後的知識庫條目")

    chat_samples = []
    random.seed(42)

    for item in kb_items:
        name = clean_text(item.get("名稱", ""))
        content = str(item.get("情報內容", "")).strip()
        raw_kws = item.get("關鍵字", "")
        kws = parse_keywords(raw_kws)

        if not name or not content:
            continue

        # 組合使用者多種問法
        user_queries = [name]
        for kw in kws[:4]:
            user_queries.append(kw)

        for q in user_queries:
            # 隨機挑選問答包裹
            tmpl = random.choice(QUESTION_TEMPLATES)
            user_msg = tmpl.format(q)

            intro = random.choice(SENIOR_INTROS).format(name)
            outro = random.choice(SENIOR_OUTROS)
            assistant_reply = f"{intro}{content}{outro}"

            chat_samples.append({
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg},
                    {"role": "assistant", "content": assistant_reply}
                ]
            })

    print(f"✨ 總計生成 {len(chat_samples)} 組對話指令微調樣本！")

    random.shuffle(chat_samples)
    split_idx = int(len(chat_samples) * 0.9)
    train_data = chat_samples[:split_idx]
    eval_data = chat_samples[split_idx:]

    with open(TRAIN_OUTPUT, "w", encoding="utf-8") as f:
        for s in train_data:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")

    with open(EVAL_OUTPUT, "w", encoding="utf-8") as f:
        for s in eval_data:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")

    print(f"💾 寫入訓練集: {TRAIN_OUTPUT} ({len(train_data)} 筆)")
    print(f"💾 寫入驗證集: {EVAL_OUTPUT} ({len(eval_data)} 筆)")

    print("\n範例對話樣本:")
    sample = train_data[0]["messages"]
    print(f"  [User]     : {sample[1]['content']}")
    print(f"  [Assistant]: {sample[2]['content'][:80]}...")
    print("=" * 70)

if __name__ == "__main__":
    main()
