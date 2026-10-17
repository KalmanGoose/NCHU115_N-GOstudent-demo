#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) 領域向量模型微調資料集自動生成腳本
(prepare_finetune_data.py)
==============================================================================
功能：
  1. 讀取 campus_knowledge.json (712 筆官方與校園生活條目)
  2. 提取口語關鍵字、名稱變體與自然問句生成 Query
  3. 實作同領域「難負樣本 (Hard Negative)」智慧採樣演算法
  4. 產出標準格式的訓練集 (train_triplets.jsonl) 與評測集 (eval_triplets.jsonl)
==============================================================================
"""

import os
import re
import json
import random
from typing import List, Dict, Any, Tuple

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
TRAIN_OUTPUT = os.path.join(BASE_DIR, "train_triplets.jsonl")
EVAL_OUTPUT = os.path.join(BASE_DIR, "eval_triplets.jsonl")

# 常見口語問句模板，用於資料增強 (Data Augmentation)
TEMPLATES = [
    "請問{}",
    "想問一下{}",
    "有關{}的規定",
    "中興大學{}",
    "新生想知道{}",
    "{}怎麼辦",
    "{}在哪裡",
    "{}",
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

def categorize_item(name: str, content: str) -> str:
    """粗分類，用於抽取同領域難負樣本 (Hard Negative)"""
    combined = f"{name} {content}".lower()
    if any(k in combined for k in ["宿舍", "二村", "男宿", "女宿", "宿網", "門禁", "洗衣", "冷氣"]):
        return "宿舍生活"
    if any(k in combined for k in ["選課", "學分", "通識", "體育", "加簽", "退選", "擋修", "畢業門檻"]):
        return "課務學分"
    if any(k in combined for k in ["學雜費", "就貸", "就學貸款", "減免", "註冊", "退費", "弱勢"]):
        return "學雜就貸"
    if any(k in combined for k in ["美食", "小吃", "餐廳", "圓廳", "宵夜", "早餐", "午餐", "好吃的"]):
        return "周邊美食"
    if any(k in combined for k in ["腳踏車", "公車", "高鐵", "停車", "車牌", "機車", "悠遊卡"]):
        return "交通出行"
    if any(k in combined for k in ["系群", "新生群", "line", "社團", "學生會", "系學會", "迎新"]):
        return "社群活動"
    if any(k in combined for k in ["體檢", "健檢", "請假", "兵役", "緩徵", "二手書", "包裹", "郵局"]):
        return "行政行政"
    return "一般校園"

def main():
    print("=" * 60)
    print("🚀 開始讀取中興知識庫並合成領域對比學習三元組...")
    print("=" * 60)

    if not os.path.exists(JSON_PATH):
        print(f"❌ 找不到知識庫檔案: {JSON_PATH}")
        return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        kb_items = json.load(f)

    print(f"✅ 成功載入 {len(kb_items)} 筆知識庫條目")

    # 1. 建立各分類索引，以便抽 Hard Negative
    category_map: Dict[str, List[int]] = {}
    valid_items = []

    for idx, item in enumerate(kb_items):
        name = clean_text(item.get("名稱", ""))
        content = clean_text(item.get("情報內容", ""))
        raw_kws = item.get("關鍵字", "")
        kws = parse_keywords(raw_kws)

        if not name or not content:
            continue

        cat = categorize_item(name, content)
        if cat not in category_map:
            category_map[cat] = []
        category_map[cat].append(len(valid_items))

        valid_items.append({
            "name": name,
            "content": content,
            "keywords": kws,
            "category": cat
        })

    print(f"📊 分類統計:")
    for cat, idxs in category_map.items():
        print(f"   - {cat}: {len(idxs)} 條")

    # 2. 生成三元組 (query, positive, negative)
    triplets = []
    seen_pairs = set()

    random.seed(42)

    for i, item in enumerate(valid_items):
        name = item["name"]
        content = item["content"]
        positive = f"【{name}】{content}"
        cat = item["category"]

        # 生成 queries
        queries = []
        for kw in item["keywords"]:
            queries.append(kw)
            # 隨機挑選 1 個口語模板包裹
            if random.random() < 0.3:
                tmpl = random.choice(TEMPLATES)
                queries.append(tmpl.format(kw))

        # 加入以名稱為主的問法
        queries.append(name)
        queries.append(f"想問{name}")
        queries.append(f"中興大學{name}")

        # 抽負樣本 (優先從同分類中抽不同條目作為 Hard Negative)
        cat_candidates = [idx for idx in category_map.get(cat, []) if idx != i]
        all_candidates = [idx for idx in range(len(valid_items)) if idx != i]

        for q in queries:
            q_clean = clean_text(q)
            if not q_clean or len(q_clean) < 2:
                continue

            pair_key = (q_clean, name)
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            # 70% 機率選同領域 Hard Negative，30% 機率選隨機 Negative
            if cat_candidates and random.random() < 0.7:
                neg_idx = random.choice(cat_candidates)
            else:
                neg_idx = random.choice(all_candidates)

            neg_item = valid_items[neg_idx]
            negative = f"【{neg_item['name']}】{neg_item['content']}"

            triplets.append({
                "query": q_clean,
                "positive": positive,
                "negative": negative
            })

    print(f"\n✨ 共生成 {len(triplets)} 組對比學習訓練三元組！")

    # 3. 切分訓練集 (90%) 與驗證集 (10%)
    random.shuffle(triplets)
    split_idx = int(len(triplets) * 0.9)
    train_set = triplets[:split_idx]
    eval_set = triplets[split_idx:]

    with open(TRAIN_OUTPUT, "w", encoding="utf-8") as f:
        for t in train_set:
            f.write(json.dumps(t, ensure_ascii=False) + "\n")

    with open(EVAL_OUTPUT, "w", encoding="utf-8") as f:
        for t in eval_set:
            f.write(json.dumps(t, ensure_ascii=False) + "\n")

    print(f"💾 寫入訓練集: {TRAIN_OUTPUT} ({len(train_set)} 筆)")
    print(f"💾 寫入驗證集: {EVAL_OUTPUT} ({len(eval_set)} 筆)")
    print("\n範例三元組:")
    sample = train_set[0]
    print(f"  [Query]   : {sample['query']}")
    print(f"  [Positive]: {sample['positive'][:60]}...")
    print(f"  [Negative]: {sample['negative'][:60]}...")
    print("=" * 60)

if __name__ == "__main__":
    main()
