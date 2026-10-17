#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
NCHU 新生問答知識庫與美食庫全面健檢、去敏、衝突對齊與驗證腳本
(audit_and_fix_all.py)
==============================================================================
"""

import csv
import json
import os
import re
import shutil
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
KB_JSON = ROOT / "campus_knowledge.json"
KB_CSV = ROOT / "campus_knowledge.csv"
KB_GS = ROOT / "KnowledgeData.gs"
FOOD_JS = ROOT / "food_database.js"

CRISIS_TERMS = {
    "想死", "自殺", "自殘", "不想活", "活不下去", "輕生", "結束生命", "傷害自己", "絕望"
}

GENERIC_STOP_KWS = {
    "中興吃什麼", "興大美食推薦", "校園周邊午餐", "晚餐吃什麼", "平價小吃",
    "學長姐推薦餐廳", "附近必吃", "好吃的店", "菜單價位",
    "處室位置在哪", "系辦電話多少", "辦公室怎麼走", "行政單位窗口", "各處室分機號碼", "洽公時間",
    "通識選課推薦", "這堂課好過嗎", "會不會很當", "老師給分甜不甜", "涼課推薦", "甜課推薦",
    "期中期末好考嗎", "學長姐修課心得",
    "新生常見雷點", "學長姐生氣常問", "記事本爬文指南", "別再問了先看這個", "新生求生手冊"
}

PROMO_RE = re.compile(r"\n*【學長姐特別叮嚀】：如果走出夜市.*?不吃會後悔！", re.S)
COURSE_NORM_RE = re.compile(r"\n*• 規範：請確認本課程是否符合所屬學系之通識領域採計標準（避免修習系所排除之領域）。")
LINE_URL_RE = re.compile(r"https?://line\.me/\S+")
UI_NOISE_RE = re.compile(r"\s*國立中興大學\s*\d+K\+\s*位成員[\s\d]*$")

DEPT_PREFIX_RE = re.compile(
    r"^(?:[A-Za-z0-9\u4e00-\u9fa5/]+\s*\d{1,2}|[\u4e00-\u9fa5]{1,5}\s*\d{1,2}|"
    r"[\u4e00-\u9fa5]{2,7}(?:學系|系|學程|所|組)|"
    r"土木|企管|應數|外文|農藝|動科|機械|材料|電機|化工|生科|森林|昆蟲|獸醫|植病|"
    r"園藝|水保|環工|食生|生機|行銷|會計|財金|法律|國農|景觀|歷史|中文|台文|大一|學長|學姐)\s+"
)
BAD_QA_RE = re.compile(
    r"這邊嗎|這幾個數字|這樣的話|這個地方|這個的意思|這張|停機坪|盧嘉呈|收美金|"
    r"不健檢會怎麼樣|直屬什麼時候選|洪玉雯|林振祥|陳美娥|陳宏傑|Larson|ai小模型|"
    r"反串註明|折一個大的是|這種包裝|告訴我這張|再請一次|什麼心事|那所以腳踏車|"
    r"那個是全校的|是有辦法在8/29"
)
NOISE_SEG_RE = re.compile(
    r"圖片|貼圖|照片|已收回|記事本有很多|記得看公告|把匿名改成|不要修|很痛苦|"
    r"幹，|左轉Dcard|上網找得到|直接搜尋就有|我朋友好像|花花|Bang|原來|謝謝|"
    r"了解|沒問題|不會|可以啊"
)
IS_QUESTION_SEG_RE = re.compile(r"[？?]|請問|想問|想詢問|有人知道|還是.*嗎|嗎$|呢$|呀$|吧\?")


def bigrams(text: str) -> set[str]:
    s = re.sub(r"[^\u4e00-\u9fa5a-zA-Z0-9]", "", text.lower().replace("臺", "台"))
    if len(s) <= 1:
        return {s} if s else set()
    return {s[i:i + 2] for i in range(len(s) - 1)}


def dedupe_semicolon(text: str) -> str:
    seen = []
    out = []
    for seg in re.split(r"[;；]", text):
        s = seg.strip()
        key = s.rstrip("。！! ").replace(",", "，")
        if not key:
            continue
        if key in seen or (len(key) >= 8 and any(key in prev for prev in seen)):
            continue
        seen.append(key)
        out.append(s)
    return "；".join(out)


def clean_keywords_for_entry(title: str, content: str, raw_kws: str, is_safety: bool = False) -> str:
    kws = [k.strip() for k in raw_kws.split(",") if k.strip()]
    text_all = (title + " " + content).lower().replace("臺", "台")
    text_grams = bigrams(text_all)
    kept = []
    seen = set()

    for k in kws:
        kl = k.lower().replace("臺", "台")
        if kl in seen:
            continue
        if not is_safety and k in CRISIS_TERMS:
            continue
        if k in GENERIC_STOP_KWS and kl not in text_all:
            continue
        # Remove obviously misplaced keywords (e.g. medical keywords in credit rules, grading keywords in food)
        if k in {"特約醫院", "感冒看診"} and "醫" not in text_all and "診" not in text_all:
            continue
        if k in {"給分", "雷不雷", "甜課", "涼課", "期中期末", "修課心得"} and any(
            x in title for x in ["美食", "餐", "飯", "麵", "時程", "惠蓀活動", "英文"]
        ):
            continue
        if k in {"預設密碼", "學號查詢", "註冊須知", "登入帳號"} and not any(
            x in title for x in ["密碼", "登入", "報到", "入口", "帳號"]
        ):
            continue
        if k in {"參加社團", "課外組", "學生社團", "社團博覽會", "社辦借用"} and "社團" not in text_all:
            continue
        if k in {"機車停車場", "台中市民卡", "考駕照"} and not any(
            x in title for x in ["交通", "車", "駕照", "市民"]
        ):
            continue
        if k in {"運動場借用"} and "運動場" not in text_all:
            continue

        seen.add(kl)
        kept.append(k)

    if not kept:
        base_title = re.sub(r"\s*[\(（].*?[\)）]\s*$", "", title).strip()
        kept = [base_title]
    return ",".join(kept[:16])


def clean_food_database():
    raw_text = FOOD_JS.read_text(encoding="utf-8")
    items = json.loads(raw_text[raw_text.index("["): raw_text.rindex("]") + 1])

    by_norm = {}
    cleaned_list = []
    for item in items:
        title = item["title"].strip()
        if title == "元披薩":
            continue  # Truncated duplicate of 49元披薩

        title = title.replace("隆師父牛肉麵", "隆師傅牛肉麵專賣").replace("咖哩混蛋", "咖哩魂蛋")
        content = UI_NOISE_RE.sub("", item["content"]).strip()
        content = PROMO_RE.sub("", content).strip()
        content = dedupe_semicolon(content)

        # Clean generic keyword bloat
        kws_list = [k.strip() for k in item.get("kws", "").split(",") if k.strip() and k.strip() not in GENERIC_STOP_KWS]
        seen_k = set()
        dedup_kws = []
        for k in kws_list:
            kl = k.lower().replace("臺", "台")
            if kl not in seen_k:
                seen_k.add(kl)
                dedup_kws.append(k)

        norm_name = re.sub(r"\s*[\(（].*?[\)）]\s*$", "", title).strip().replace("臺", "台")
        new_obj = {
            "title": title,
            "content": content,
            "tags": list(dict.fromkeys(item.get("tags", ["all"]))),
            "kws": ",".join(dedup_kws[:12]),
        }

        if norm_name in by_norm:
            existing = by_norm[norm_name]
            existing["content"] = dedupe_semicolon(existing["content"] + "；" + new_obj["content"])
            existing["tags"] = list(dict.fromkeys(existing["tags"] + new_obj["tags"]))
            merged_k = [k for k in (existing["kws"] + "," + new_obj["kws"]).split(",") if k]
            existing["kws"] = ",".join(list(dict.fromkeys(merged_k))[:12])
        else:
            by_norm[norm_name] = new_obj
            cleaned_list.append(new_obj)

    js_out = (
        f"// 國立中興大學生活與周邊美食資料庫 (共 {len(cleaned_list)} 筆，經 audit_and_fix_all.py 驗證去重)\n"
        f"const SENIOR_FOOD_DB = {json.dumps(cleaned_list, ensure_ascii=False, indent=2)};\n"
    )
    FOOD_JS.write_text(js_out, encoding="utf-8")
    return cleaned_list


def clean_campus_knowledge():
    raw_data = json.loads(KB_JSON.read_text(encoding="utf-8"))

    safety_entry = {
        "名稱": "校園心理危機與24小時緊急求助專線",
        "關鍵字": "想死,自殺,自殘,不想活,活不下去,輕生,結束生命,傷害自己,絕望,安心專線,生命線,校安專線",
        "情報內容": (
            "【興大 24 小時心理危機守護與緊急求助專線】：\n"
            "你願意說出來非常重要！如果你現在感到難以承受或有立即危險，請先深呼吸，我們都在這裡陪你：\n"
            "• **校內 24 小時校安緊急專線**：04-22870885（全天候駐警與校安人員即時協助）\n"
            "• **衛福部 24 小時安心專線**：1925（依舊愛我，24 小時免付費心理支持）\n"
            "• **生命線協談專線**：1995 ／ **張老師專線**：1980\n"
            "• **健康及諮商中心（惠蓀堂 4 樓）**：04-22840241（提供在校生完全免費且嚴格保密的專業心理諮商）\n"
            "若遇緊急生命危險，請立即撥打 110 或 119 求助。"
        ),
        "direct": True,
    }

    safe_password_content = (
        "【興大單一入口 Portal／新生 EZ Come 帳號與密碼安全規範】：\n"
        "1. **登入入口**：https://portal.nchu.edu.tw/ （選課系統、教務資訊系統與信箱皆由此單一入口登入）。\n"
        "2. **登入帳號**：個人學號（大學部為開頭小寫英文字母 s 加學號數字）。\n"
        "3. **初始密碼與資安保護**：初始密碼規則請參閱學校寄發之「新生入學通知單」或計資中心官方說明（基於資安防護，本系統不公開密碼推算公式與範例）。\n"
        "4. **首次登入與忘記密碼**：初次登入後系統將強制要求變更密碼，請接著完成註冊須知確認、個人通訊核對與證件照上傳。若日後忘記密碼，可於入口點選「忘記密碼」透過備援信箱重設，或持學生證與身分證正本親至「資訊科學大樓 105 室計資中心服務櫃台」辦理重設（電話：04-22840306 分機 714、745）。"
    )

    processed = [safety_entry]
    by_canonical = {}
    qa_dropped = 0
    qa_kept = 0

    for item in raw_data:
        title = item.get("名稱", "").strip()
        content = item.get("情報內容", "").strip()
        kws = item.get("關鍵字", "").strip()
        direct = bool(item.get("direct", True))

        if not title or title == "校園心理危機與24小時緊急求助專線":
            continue

        # Drop outdated/conflicting office duplicates
        if title in {
            "學務處生活輔導組 (行政大樓1F)",
            "學務處住宿服務組 (雲平樓)",
            "學務處課外活動組 (雲平樓)",
            "總務處駐衛警察隊 (校門口)",
            "計算機及資訊網路中心 (計資中心/資訊科學大樓2F)",
            "國立中興大學圖書館",
            "國際事務處 (行政大樓3F)",
        }:
            continue

        # 1. Fix stress relief entry (#2)
        if "校園心靈舒壓指南" in title:
            content = (
                "【學弟妹心情不好、壓力大或情緒低落時的校內舒壓與諮商指南】：\n"
                "大學生活難免遇到課業或人際壓力，請收下這套中興專屬的支持與放鬆方案：\n\n"
                "1. **專業心理諮商與陪伴（惠蓀堂 4 樓健康及諮商中心）**：\n"
                "   若需要找人聊聊或情緒走不出來，可至**惠蓀堂 4 樓健諮中心**預約【完全免費且保密的專業個別心理諮商】（電話：04-22840241；24H 校安專線：04-22870885）。\n\n"
                "2. **雲平樓地下室／學生活動中心免費休閒設施**：\n"
                "   憑學生證即可免費借用：**PS5、任天堂 Switch、KTV 歡唱包廂、標準撞球桌、投籃機、手足球、空氣曲棍球（Air Hockey）**，適合與朋友一起放鬆紓壓。\n\n"
                "3. **圖書館舒壓區與中興湖散步**：\n"
                "   圖書館內設有**電動按摩椅**可免費使用；或至**中興湖**走走吹風散心。"
            )
            kws = "心情差,壓力大,好累,想哭,被當,情緒低落,心理諮商,健諮中心,免費娛樂,雲平樓ps5,雲平樓switch,雲平樓ktv,撞球,圖書館按摩椅,中興湖"

        # 2. Fix password formula entries
        if title in {
            "資訊QA-興大入口SSO與新生EZ Come初始密碼設定規則",
            "計資訊網路中心-興大單一入口預設密碼 10 碼規則與忘記密碼",
        }:
            content = safe_password_content
            kws = "單一入口密碼,預設密碼,忘記密碼,初始密碼,興大入口,新生EZ Come,計資中心105室,密碼重設"

        if title == "選課系統登入與入口網址":
            content = (
                "【中興大學選課系統專屬入口】：\n"
                "• 系統網址：https://onepiece.nchu.edu.tw/cofsys/plsql/acad_home （或由興大單一入口 Portal 進入）。\n"
                "• 登入帳號与密碼：使用個人學號與興大單一入口（SSO）密碼登入。\n"
                "• 重要提醒：選課重要訊息與抽籤結果一律寄發至學校信箱，選課前請務必至教務資訊系統確認常用聯絡信箱！"
            )

        # 3. Redact LINE URLs
        if LINE_URL_RE.search(content):
            content = LINE_URL_RE.sub(
                "（為防範詐騙集團混入，本系統不公開直接入群連結，請透過該系系學會官方 IG / FB 粉專或新生輔導員驗證身分後加入）",
                content,
            )

        # 4. Fix academic dishonesty in course reviews
        if "食物與政治" in title:
            content = content.replace(
                "他只有期末考是20題是非題，可以用AI，答案全部都是X，聽說下學期要改成問答但不知道會不會執行，然後幾乎只要有去上課就是總分+1分起跳，然後他不會當人（除非竄改分數被他抓到）",
                "期末評量以是非題或問答題為主，相當重視平時課堂出席與參與，按時出席並完成評量即可穩定取得學分。",
            )
        if "日本漫畫文化" in title:
            content = content.replace(
                "期中期末交漫畫或動漫觀影心得，可以請GPT幫忙其實蠻輕鬆。如果有找到人可以幫你在點名單上打勾就可以翹課，上課不能滑手機或聊天，睡覺、讀書都可以，老師很認真，想了解漫畫相關歷史或是策展之類的也可以學到東西。",
                "期中與期末需繳交漫畫或動漫觀影心得報告。課堂重視秩序（請勿滑手機或聊天），老師教學認真，想了解漫畫歷史或策展文化的同學能有豐富收穫。",
            )

        # 5. Strip food promo & course boilerplate
        content = PROMO_RE.sub("", content).strip()
        content = COURSE_NORM_RE.sub("", content).strip()

        # 6. Fix specific factual conflicts
        if title == "教務處註冊組 (行政大樓1F)":
            content = content.replace("悠遊卡學生證製發", "數位學生證（整合一卡通 iPass）製發")
        if title == "學務處住宿服務組 (雲平樓 / 男宿服務中心)":
            title = "學務處住宿輔導組 (興大二村南棟1F / 男女宿服務中心)"
            content = (
                "位於興大二村南棟 1 樓（電話：04-22840552，信箱：dorm@nchu.edu.tw）。"
                "統籌全校男女生宿舍床位抽籤、寒暑假住宿申請、宿舍門禁管理、冷氣卡儲值與公共區域修繕申報。"
                "男宿服務中心：04-22840473（興大二村）；女宿服務中心：04-22840612（校內女宿）。"
            )
        if title == "選課相關業務行政單位聯絡電話與辦公室位置":
            content = content.replace("萬年樓5F / 04-22840114", "萬年樓5F / 04-22840326")
            content = content.replace("惠蓀堂2F / 04-22840250", "惠蓀堂2F / 04-22840663")
        if title == "學務處學生安全輔導室-僑生與港澳生專屬主責窗口 (惠蓀堂2F)":
            content = content.replace("04-22870885 / 04-22840227", "04-22840663（24H 校安專線：04-22870885）")
        if title == "宿舍QA-各棟宿舍服務中心專線、聯絡信箱與管理員窗口":
            content = content.replace(
                "（管轄仁齋、義齋、禮齋、智齋、信齋、勇齋）",
                "（位於國光路 329 號興大二村，統籌二村各棟與校內男宿仁、義、禮、智、信齋服務）",
            )
        if title in {"興大二村-男生宿舍介紹（純男宿絕無女生/大一分發）", "興大二村-基本介紹與男宿定位（絕無女生）"}:
            content = content.replace(
                "位於校外南門路/興大路口附近",
                "位於台中市南區國光路 329 號（鄰近校外興大路／南門路生活圈）",
            )
        if title == "宿舍宿網每日流量上限與被鎖解鎖機制":
            content = content.replace("15 GB ～ 20 GB", "8 GB ～ 15 GB（依計資中心與宿網當學期流量規範）")
        if title == "大學部超修學分申請條件與流程":
            content = content.replace("上限通常為 30 學分", "上限通常為 28 至 30 學分，依各系修業規定為準")
        if title == "校園交通最高鐵律-校內絕對嚴禁騎乘機車 (違規必鎖車開罰)":
            content = content.replace("上大鎖鎖車並開立罰款單", "上大鎖鎖車並開立違規通知單（需繳納開鎖處理費 200 元）")
        content = content.replace("雲平樓1F或各棟服務中心", "興大二村南棟1F宿輔組或各棟服務中心")

        # 7. Handle 新生實戰QA-* strictly
        if title.startswith("新生實戰QA-"):
            if BAD_QA_RE.search(content + " " + title):
                qa_dropped += 1
                continue
            mq = re.search(
                r"【大一新生群真實提問】：(.*?)\n\n【在校學長姐解答與經驗建議】：\n(.*?)\n\n【備註】",
                content,
                re.S,
            )
            if not mq:
                qa_dropped += 1
                continue
            q_text, a_raw = mq.group(1).strip(), mq.group(2).strip()
            q_clean = DEPT_PREFIX_RE.sub("", q_text).strip()
            q_clean = DEPT_PREFIX_RE.sub("", q_clean).strip()
            if len(q_clean) < 8 or re.match(r"^(那|這個|這樣|請問這)", q_clean):
                qa_dropped += 1
                continue
            q_grams = bigrams(q_clean) - {
                "請問", "想問", "學長", "長姐", "學長姐", "可以", "一下", "什麼", "中興", "大學", "新生"
            }
            segs = [s.strip() for s in a_raw.split("；")]
            kept_segs = []
            for s in segs:
                s_clean = DEPT_PREFIX_RE.sub("", s).strip()
                s_clean = DEPT_PREFIX_RE.sub("", s_clean).strip()
                if len(s_clean) < 6 or NOISE_SEG_RE.search(s_clean) or IS_QUESTION_SEG_RE.search(s_clean):
                    continue
                if len(q_grams & bigrams(s_clean)) >= 1 and s_clean not in kept_segs:
                    kept_segs.append(s_clean)
            if not kept_segs or len("；".join(kept_segs)) < 10:
                qa_dropped += 1
                continue
            a_clean = "；".join(kept_segs)
            short_q = re.sub(r"^(學長姐們|想請問各位|想問一下|打擾了|請問大家|請問|想問)\s*", "", q_clean)[:24]
            title = f"新生實戰QA-{short_q}"
            content = (
                f"【大一新生常見提問】：{q_clean}\n\n"
                f"【學長姐經驗解答】：\n{a_clean}\n\n"
                f"【備註】：彙整自學長姐經驗分享，具體行政規定請以學校各處室最新公告為準。"
            )
            direct = False
            qa_kept += 1

        # 8. Normalize title for deduplication (courses & food)
        if title.startswith("通識課程介紹-"):
            c_name = re.sub(r"^通識課程介紹-", "", title)
            c_name = re.sub(r"\s*[\(（].*?[\)）]\s*$", "", c_name).strip()
            c_name = re.sub(r"\d{3,4}$", "", c_name).strip()
            c_name = c_name.replace("臺", "台").replace("媒體釋讀", "媒體識讀")
            c_name = re.sub(r"以科學(方式|辦法)解決生活問題", "以科學方法解決生活問題", c_name)
            title = f"通識課程介紹-{c_name} (修課大綱與考核形式)"
            content = re.sub(r"【中興大學通識教育課程：.*?】", f"【中興大學通識教育課程：{c_name}】", content)

        canon_key = re.sub(r"\s*[\(（].*?[\)）]\s*$", "", title).strip().replace("臺", "台")
        cleaned_kws = clean_keywords_for_entry(title, content, kws, is_safety=False)

        entry_obj = {
            "名稱": title,
            "情報內容": content,
            "關鍵字": cleaned_kws,
            "direct": direct,
        }

        if canon_key in by_canonical:
            existing = by_canonical[canon_key]
            # Merge keywords
            merged_k = list(dict.fromkeys((existing["關鍵字"] + "," + cleaned_kws).split(",")))
            existing["關鍵字"] = ",".join(merged_k[:16])
            # Keep longer/richer content or merge course notes
            if len(content) > len(existing["情報內容"]):
                existing["情報內容"] = content
        else:
            by_canonical[canon_key] = entry_obj
            processed.append(entry_obj)

    # Write campus_knowledge.json
    KB_JSON.write_text(json.dumps(processed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # Write campus_knowledge.csv
    fieldnames = ["名稱", "情報內容", "關鍵字", "direct"]
    with KB_CSV.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in processed:
            writer.writerow(row)

    # Write KnowledgeData.gs
    gs_text = (
        "// Google Apps Script Knowledge Base generated from campus_knowledge.json\n"
        f"var CAMPUS_KNOWLEDGE = {json.dumps(processed, ensure_ascii=False, indent=2)};\n"
    )
    KB_GS.write_text(gs_text, encoding="utf-8")

    return processed, qa_kept, qa_dropped


if __name__ == "__main__":
    foods = clean_food_database()
    kb, qa_kept, qa_dropped = clean_campus_knowledge()
    print(f"✅ 美食資料庫清理完成：共 {len(foods)} 間無重複店家")
    print(f"✅ 校園知識庫清理完成：共 {len(kb)} 筆高純度條目 (保留精選 QA: {qa_kept} 筆, 剔除錯位/雜訊 QA: {qa_dropped} 筆)")
