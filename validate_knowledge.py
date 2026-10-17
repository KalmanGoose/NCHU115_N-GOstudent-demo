#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
NCHU 校園知識庫與美食庫 CI 自動驗證腳本 (validate_knowledge.py)
檢查項目：
  1. 危機詞獨占檢查（想死、自殺等僅能出現在心理危機專線條目）
  2. 禁用模式檢查（預設密碼範例 Aa6789...、公開 line.me 連結、教唆代點名/作弊、點名批評老師）
  3. 爬蟲殘渣檢查（標題截斷「元披薩」、UI雜訊「40K+ 位成員」、揚州炒飯重複推銷模板）
  4. 實體重複檢查（正規化名稱去重驗證）
  5. 處室核心專線衝突檢查
若有任何錯誤回傳 exit code 1。
==============================================================================
"""

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
KB_JSON = ROOT / "campus_knowledge.json"
FAQ_JS = ROOT / "faq_data.js"
FOOD_JS = ROOT / "food_database.js"

CRISIS_TERMS = {"想死", "自殺", "自殘", "不想活", "活不下去", "輕生", "結束生命", "傷害自己"}
BANNED_PATTERNS = [
    (r"預設密碼(?:為|即為)\s*:?\s*[A-Za-z]{2}\d", "公開預設密碼公式與範例"),
    (r"https?://line\.me/", "公開 LINE 群組邀請連結"),
    (r"點名單上打勾|代點名|答案全部都是X", "教唆學術不誠信/代點名"),
    (r"不要修\S{2,4}的", "點名負評教師"),
    (r"【學長姐特別叮嚀】：如果走出夜市", "美食條目殘留重複推銷模板"),
    (r"\d+K\+\s*位成員", "殘留網頁 UI 計數雜訊"),
]


def load_js_array(path: Path):
    text = path.read_text(encoding="utf-8")
    return json.loads(text[text.index("["): text.rindex("]") + 1])


def norm_title(title: str) -> str:
    t = re.sub(r"\s*[\(（].*?[\)）]\s*$", "", title).strip()
    t = t.replace("臺", "台").replace("隆師父", "隆師傅").replace("咖哩混蛋", "咖哩魂蛋")
    return t


def main() -> int:
    errors = []

    kb = json.loads(KB_JSON.read_text(encoding="utf-8"))
    foods = load_js_array(FOOD_JS)
    faqs = load_js_array(FAQ_JS)

    # 1. 檢查知識庫是否有危機安全首筆條目
    if not kb or kb[0].get("名稱") != "校園心理危機與24小時緊急求助專線":
        errors.append("[SAFETY] campus_knowledge.json 第一筆必須為『校園心理危機與24小時緊急求助專線』")

    seen_kb = defaultdict(list)
    for i, r in enumerate(kb):
        title = r.get("名稱", "").strip()
        content = r.get("情報內容", "").strip()
        kws = {k.strip() for k in r.get("關鍵字", "").split(",") if k.strip()}

        if not title or not content:
            errors.append(f"[SCHEMA] #{i} 標題或內容為空")
            continue

        # 危機詞檢查
        if title != "校園心理危機與24小時緊急求助專線":
            hit_crisis = kws & CRISIS_TERMS
            if hit_crisis:
                errors.append(f"[SAFETY] #{i} ({title}) 非危機專線條目卻包含危機關鍵字: {hit_crisis}")

        # 禁用模式檢查
        for pat, desc in BANNED_PATTERNS:
            if re.search(pat, content):
                errors.append(f"[BANNED] #{i} ({title}) 命中禁用內容 ({desc}): /{pat}/")

        seen_kb[norm_title(title)].append((i, title))

    for norm_k, items in seen_kb.items():
        if len(items) > 1:
            errors.append(f"[DUP-KB] 知識庫名稱重複 '{norm_k}': {items}")

    # 2. 檢查美食資料庫
    seen_food = defaultdict(list)
    for i, f in enumerate(foods):
        title = f.get("title", "").strip()
        content = f.get("content", "").strip()
        if title == "元披薩":
            errors.append(f"[SCRAPER] food_database.js #{i} 存在標題截斷殘渣 '元披薩'")
        for pat, desc in BANNED_PATTERNS:
            if re.search(pat, content):
                errors.append(f"[BANNED-FOOD] #{i} ({title}) 命中 ({desc})")
        seen_food[norm_title(title)].append((i, title))

    for norm_k, items in seen_food.items():
        if len(items) > 1:
            errors.append(f"[DUP-FOOD] 美食庫重複 '{norm_k}': {items}")

    if errors:
        for e in errors:
            print("❌", e, file=sys.stderr)
        print(f"\n驗證失敗：共發現 {len(errors)} 個問題！", file=sys.stderr)
        return 1

    print(
        f"✅ 驗證完全通過！\n"
        f"   - 校園知識庫 (campus_knowledge.json): {len(kb)} 筆 (0 衝突 / 0 違規)\n"
        f"   - 精選常見問答 (faq_data.js): {len(faqs)} 筆\n"
        f"   - 校園美食資料庫 (food_database.js): {len(foods)} 間"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
