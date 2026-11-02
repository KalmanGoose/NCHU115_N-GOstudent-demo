#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) 滿血版 V3 雙軌微調高階資料集生成器
(prepare_v3_mega_datasets.py)
==============================================================================
功能：
  1. 融合 8 大知識庫源（校園規章、美食完全體雙庫合併、健康及諮商中心全資料、
     全校 10 院 40 系所大白話迷思解讀、三大夜市攻略、交通公車高鐵雙十公車、
     通識課學生評價、LINE 群新生生存智慧與吐槽）
  2. 合成多視角問答、區域/餐別/科別聚合懶人包問答、RAG `<context>` 精準引述問答與防幻覺拒答
  3. 產出：
     - train_triplets_v3.jsonl (BGE-M3 對比檢索三元組)
     - train_qwen_instruct_v3.jsonl (SFT 訓練集)
     - eval_qwen_instruct_v3.jsonl (SFT 驗證集)
==============================================================================
"""

import os
import re
import csv
import json
import random
import subprocess
from typing import List, Dict, Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
TRIPLETS_OUTPUT = os.path.join(BASE_DIR, "train_triplets_v3.jsonl")
INSTRUCT_OUTPUT = os.path.join(BASE_DIR, "train_qwen_instruct_v3.jsonl")
EVAL_INSTRUCT_OUTPUT = os.path.join(BASE_DIR, "eval_qwen_instruct_v3.jsonl")

SYSTEM_PROMPT = (
    "你是國立中興大學 (NCHU) 的親切幽默學長姐 AI 助手，專門為大一新生解答生活、宿舍、"
    "選課學分、交通、特約診所就醫與行政規定。請以臺灣正體中文、親切幽默、條理分明且具同理心的口吻回答，"
    "依據中興大學官方真實規章與在地學長姐經驗說明，絕不提供未查證或造假之內容。若有提供參考脈絡 (<context>)，"
    "請嚴格依據脈絡內之地址、電話與事實精準回答，切勿憑空捏造數字。"
)

def sanitize_text(text: str) -> str:
    """嚴格脫敏過濾器：絕不出現代言特聘教授姓名"""
    if not text:
        return ""
    # Unicode 脫敏比對避免明文出現在原始碼中
    forbidden = [
        "\u67f3\u5a49\u90c1",  # 柳婉郁
        "\u67f3\u842c\u7389",  # 柳萬玉
        "\u67f3\u5a49\u8aed",  # 柳婉諭
        "\u67f3\u8001\u5e2b",  # 柳老師
        "\u67f3\u6559\u6388",  # 柳教授
    ]
    for f in forbidden:
        text = text.replace(f, "校內知名特聘教授")
    return text

# --------------------------------------------------------------------------
# 1. 載入並合併美食雙資料庫 (food_full_database.js + food_database.js)
# --------------------------------------------------------------------------
def load_and_merge_food_db() -> List[Dict[str, Any]]:
    full_path = os.path.join(BASE_DIR, "food_full_database.js")
    senior_path = os.path.join(BASE_DIR, "food_database.js")
    
    full_stores = []
    if os.path.exists(full_path):
        with open(full_path, "r", encoding="utf-8") as f:
            text = f.read()
        m = re.search(r'window\.NCHU_EXPANDED_FOOD\s*=\s*(\[.*?\]);?\s*$', text, re.DOTALL)
        if m:
            try:
                full_stores = json.loads(m.group(1))
            except Exception:
                pass

    senior_stores = []
    if os.path.exists(senior_path):
        with open(senior_path, "r", encoding="utf-8") as f:
            text = f.read()
        m = re.search(r'const SENIOR_FOOD_DB\s*=\s*(\[.*?\]);?\s*$', text, re.DOTALL)
        if m:
            try:
                senior_stores = json.loads(m.group(1))
            except Exception:
                pass

    merged_map = {}

    def normalize_name(n: str) -> str:
        n = re.sub(r'\(.*?\)|（.*?）', '', n).strip()
        return n.lower()

    # 先存 senior db (含學長姐短評、必點招牌與隱藏秘訣)
    for s in senior_stores:
        raw_title = s.get("title", "")
        norm = normalize_name(raw_title)
        merged_map[norm] = {
            "name": raw_title,
            "norm_name": norm,
            "senior_review": s.get("content", ""),
            "tags": s.get("tags", []),
            "kws": s.get("kws", ""),
            "address": "",
            "phone": "",
            "rating": "",
            "hours": "",
            "area": "中興商圈",
            "category": "特色美食"
        }

    # 再用 full db 補充精確經緯度、地址、電話、Google評分與詳細營業時間
    for s in full_stores:
        raw_name = s.get("name", "")
        norm = normalize_name(raw_name)
        if norm in merged_map:
            entry = merged_map[norm]
            entry["address"] = s.get("address", entry["address"])
            entry["phone"] = s.get("phone", entry["phone"])
            entry["rating"] = str(s.get("rating", entry["rating"]))
            entry["hours"] = s.get("hours", entry["hours"])
            entry["area"] = s.get("area", entry["area"])
            entry["category"] = s.get("category", entry["category"])
            entry["priceLevel"] = s.get("priceLevel", "$")
        else:
            merged_map[norm] = {
                "name": raw_name,
                "norm_name": norm,
                "senior_review": s.get("desc", ""),
                "tags": [s.get("category", ""), s.get("area", "")],
                "kws": f"{raw_name},{s.get('category','')},{s.get('area','')}",
                "address": s.get("address", ""),
                "phone": s.get("phone", ""),
                "rating": str(s.get("rating", "")),
                "hours": s.get("hours", ""),
                "area": s.get("area", "中興商圈"),
                "category": s.get("category", "美食"),
                "priceLevel": s.get("priceLevel", "$")
            }

    return list(merged_map.values())

# --------------------------------------------------------------------------
# 2. 載入健康及諮商中心特約診所、駐診醫師與身心資源 (透過 Node 解析 JS 陣列)
# --------------------------------------------------------------------------
def load_health_care_data() -> Dict[str, Any]:
    js_path = os.path.join(BASE_DIR, "health_care_guide.js")
    if not os.path.exists(js_path):
        return {"clinics": [], "doctors": []}
    
    node_code = r'''
const fs = require("fs");
const text = fs.readFileSync("health_care_guide.js", "utf-8");
const m1 = text.match(/const CAMPUS_DOCTOR_SCHEDULE\\s*=\\s*(\\[[\\s\\S]*?\\]);/);
const m2 = text.match(/const CONTRACTED_CLINICS\\s*=\\s*(\\[[\\s\\S]*?\\]);\\s*let currentActiveTab/);
const docs = m1 ? eval(m1[1]) : [];
const clinics = m2 ? eval(m2[1]) : [];
console.log(JSON.stringify({doctors: docs, clinics: clinics}));
'''
    try:
        out = subprocess.check_output(['node', '-e', node_code]).decode('utf-8')
        return json.loads(out)
    except Exception as e:
        print(f"⚠️ 解析 health_care_guide.js 失敗: {e}")
        return {"clinics": [], "doctors": []}

# --------------------------------------------------------------------------
# 3. 載入全校 10 大學院 40 系所迷思與大白話解讀蒸餾 (解析表格)
# --------------------------------------------------------------------------
def load_department_distillation() -> List[Dict[str, str]]:
    md_path = os.path.join(BASE_DIR, "資料集/蒸餾/中興大學全校科系迷思與大白話解讀整合蒸餾.md")
    dept_list = []
    if not os.path.exists(md_path):
        return dept_list
    with open(md_path, "r", encoding="utf-8") as f:
        text = f.read()

    # 從表格提取：| **學系** | 迷思 | 大白話解說 | 吐槽金句 |
    rows = re.findall(r'\|\s*\*\*([^*]+)\*\*\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|', text)
    for r in rows:
        dept_name = r[0].strip()
        myth = r[1].strip()
        explain = r[2].strip().replace("<br>", "\n")
        roast = r[3].strip()
        dept_list.append({
            "dept": dept_name,
            "myth": myth,
            "explain": explain,
            "roast": roast
        })
    return dept_list

# --------------------------------------------------------------------------
# 4. 載入三大夜市美食攻略
# --------------------------------------------------------------------------
def load_night_market_data() -> List[Dict[str, str]]:
    md_path = os.path.join(BASE_DIR, "資料集/蒸餾/夜市美食與賓果九宮格整合蒸餾.md")
    nm_list = []
    if not os.path.exists(md_path):
        return nm_list
    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()
    sections = re.split(r'\n(?=## )', content)
    for sec in sections:
        if "夜市" in sec:
            m = re.search(r'##\s+(.+)', sec)
            t = m.group(1).strip() if m else "夜市介紹"
            nm_list.append({
                "title": t,
                "content": sec.strip()
            })
    return nm_list

# --------------------------------------------------------------------------
# 5. 載入交通路線與公車站牌資料 (transit_guide.js)
# --------------------------------------------------------------------------
def load_transit_data() -> List[Dict[str, Any]]:
    js_path = os.path.join(BASE_DIR, "transit_guide.js")
    if not os.path.exists(js_path):
        return []
    node_code = r'''
const fs = require("fs");
const text = fs.readFileSync("transit_guide.js", "utf-8");
const m = text.match(/const CAMPUS_BUS_STOPS\s*=\s*(\{[\s\S]*?\});\s*let currentLiveStop/);
if (m) {
  const stops = eval("(" + m[1] + ")");
  const allRoutes = [];
  for (let k in stops) {
    const s = stops[k];
    s.routes.forEach(r => {
      allRoutes.push({...r, stopName: s.name});
    });
  }
  console.log(JSON.stringify(allRoutes));
} else {
  console.log("[]");
}
'''
    try:
        out = subprocess.check_output(['node', '-e', node_code]).decode('utf-8')
        return json.loads(out)
    except Exception:
        return []

# --------------------------------------------------------------------------
# 6. 載入通識課評價 CSV
# --------------------------------------------------------------------------
def load_general_courses() -> List[Dict[str, str]]:
    csv_path = os.path.join(BASE_DIR, "資料集/通識課回覆 的副本 - 工作表1.csv")
    courses = []
    if not os.path.exists(csv_path):
        return courses
    with open(csv_path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        for row in reader:
            if len(row) >= 7 and row[1].strip():
                name = row[1].strip()
                teacher = row[2].strip()
                chill = row[3].strip() # 涼度/水度
                sweet = row[4].strip() # 甜度
                eval_type = row[5].strip()
                comment = row[7].strip() if len(row) > 7 else ""
                courses.append({
                    "name": name,
                    "teacher": teacher,
                    "chill": chill,
                    "sweet": sweet,
                    "eval_type": eval_type,
                    "comment": comment
                })
    return courses

# --------------------------------------------------------------------------
# 7. 載入真實 LINE 群生存經驗與毒舌吐槽
# --------------------------------------------------------------------------
def load_line_and_roasts() -> List[str]:
    res = []
    r_path = os.path.join(BASE_DIR, "senior_roasts.json")
    if os.path.exists(r_path):
        try:
            with open(r_path, "r", encoding="utf-8") as f:
                res.extend(json.load(f))
        except Exception:
            pass
    l_path = os.path.join(BASE_DIR, "line_distilled.json")
    if os.path.exists(l_path):
        try:
            with open(l_path, "r", encoding="utf-8") as f:
                res.extend(json.load(f))
        except Exception:
            pass
    return res

# --------------------------------------------------------------------------
# 核心生成邏輯：打造多元問答 (Instruct) ＆ BGE-M3 檢索 Triplets
# --------------------------------------------------------------------------
def generate_mega_dataset():
    print("📦 正在整合全專案 8 大知識源...")

    # 1. 校園知識庫
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        campus_kb = json.load(f)
    print(f"  - campus_knowledge: {len(campus_kb)} 筆")

    # 2. 美食完全體雙庫合併
    food_stores = load_and_merge_food_db()
    print(f"  - 美食雙庫完全體: {len(food_stores)} 間店家")

    # 3. 健康與諮商中心
    health_data = load_health_care_data()
    clinics = health_data["clinics"]
    doctors = health_data["doctors"]
    print(f"  - 特約診所: {len(clinics)} 家，駐診醫師: {len(doctors)} 位")

    # 4. 全校 10 院 40 系所大白話迷思蒸餾
    dept_dist = load_department_distillation()
    print(f"  - 科系迷思蒸餾: {len(dept_dist)} 個系所學程")

    # 5. 三大夜市
    night_markets = load_night_market_data()
    print(f"  - 夜市深度攻略: {len(night_markets)} 篇")

    # 6. 交通路線
    transit_routes = load_transit_data()
    print(f"  - 公車與交通路線: {len(transit_routes)} 條")

    # 7. 通識課評價
    gen_courses = load_general_courses()
    print(f"  - 通識課學生實評: {len(gen_courses)} 門")

    # 8. LINE 群新生生存
    line_tips = load_line_and_roasts()
    print(f"  - 新生社群問答與吐槽: {len(line_tips)} 條")

    all_instruct = []
    all_triplets = []

    # =========================================================================
    # PART A: 美食完全體問答 (單店多角問答 + 路段/餐別/宵夜聚合問答)
    # =========================================================================
    print("🔥 正在生成美食完全體問答與路段聚合懶人包...")
    for s in food_stores:
        name = s["name"]
        area = s.get("area", "興大周邊")
        cat = s.get("category", "美食")
        rating = s.get("rating", "")
        hours = s.get("hours", "")
        addr = s.get("address", "")
        review = s.get("senior_review", "")

        # 單店問答 1: 直球查詢
        q1 = f"請問中興大學附近的「{name}」評價如何？有什麼推薦必點的嗎？"
        a1 = f"「{name}」在中興學生圈非常受歡迎！\n\n"
        if addr: a1 += f"📍 **地址**：{addr}\n"
        if rating: a1 += f"⭐ **Google 評分**：{rating} 星\n"
        if hours: a1 += f"🕒 **營業時間**：{hours}\n\n"
        a1 += f"💡 **學長姐推薦短評與招牌**：\n{review}\n\n大一入學一定要去吃吃看！"
        all_instruct.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": q1},
                {"role": "assistant", "content": a1}
            ]
        })

        # 單店問答 2: 情境問法 (在某路段想吃某類)
        q2 = f"我人在{area}，想吃{cat}，推薦「{name}」嗎？有什麼隱藏點法？"
        a2 = f"非常推薦！{name}正好位於{area}，是很多興大學生的愛店。\n\n"
        a2 += f"它的招牌與特色如下：\n{review}\n"
        if hours: a2 += f"\n去之前記得注意營業時間：{hours}，避免撲空喔！"
        all_instruct.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": q2},
                {"role": "assistant", "content": a2}
            ]
        })

        # BGE Triplet
        all_triplets.append({
            "query": f"中興大學 {area} {cat} {name} 推薦",
            "pos": f"【{name}】位於{area}，類別為{cat}。{review} 地址：{addr}，營業時間：{hours}。",
            "neg": f"【中興大學體育館借用規定】體育館羽球場與健身房需出示學生證並依規定預約登記。"
        })

    # 聚合問答: 依路段推薦 (學府路、南門路、永東街、忠孝路)
    target_areas = ["學府路", "南門路", "永東街", "忠孝路"]
    for tgt in target_areas:
        cand = [s for s in food_stores if tgt in s.get("area", "") or tgt in s.get("address", "") or tgt in s.get("kws", "")]
        if len(cand) >= 3:
            cand_sample = cand[:6]
            q = f"學長姐好，請問興大「{tgt}」有什麼推薦必吃的美食？可以幫我整理推薦清單嗎？"
            a = f"沒問題！【{tgt}】是興大學生的重要覓食戰區，幫你整理學長姐常去的精選名單：\n\n"
            for idx, c in enumerate(cand_sample, 1):
                a += f"{idx}. **{c['name']}**（{c.get('category','美食')}）\n"
                if c.get("rating"): a += f"   - 評價：⭐ {c['rating']} 星\n"
                desc = c.get('senior_review', '')[:80].replace('\n', ' ')
                a += f"   - 心得：{desc}...\n"
            a += "\n這幾家都在中興走路或騎車幾分鐘就到的範圍，新生可以一家一家踩點解鎖喔！🍜"
            all_instruct.append({
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": q},
                    {"role": "assistant", "content": a}
                ]
            })

    # 聚合問答: 宵夜推薦
    supper_stores = [s for s in food_stores if "宵夜" in s.get("category", "") or "宵夜" in s.get("kws", "") or "23:" in s.get("hours", "") or "00:" in s.get("hours", "")]
    if supper_stores:
        q = "半夜在興大趕報告肚子好餓，附近有推薦什麼宵夜嗎？"
        a = "夜貓子福利來了！中興大學周邊幾家著名的宵夜戰備糧食推薦給你：\n\n"
        for s in supper_stores[:6]:
            a += f"- **{s['name']}**：營業時間 {s.get('hours', '開到深夜')}，{s.get('senior_review','')[:60]}...\n"
        a += "\n⚠️ 吃完宵夜如果罪惡感很重，記得隔天去惠蓀堂 1F 衛生保健組免費量一下 InBody 體脂計檢測一下體態喔！⚖️"
        all_instruct.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": q},
                {"role": "assistant", "content": a}
            ]
        })

    # =========================================================================
    # PART B: 健康及諮商中心特約就醫、0元掛號費、校內駐診與 InBody 全系列問答
    # =========================================================================
    print("🩺 正在生成健康及諮商中心特約診所與身心健康問答...")
    for c in clinics:
        c_name = c["name"]
        c_cat = c["catLabel"]
        c_deal = c["deal"]
        c_addr = c["address"]
        c_phone = c["phone"]
        c_note = c["note"]

        q = f"請問興大看「{c_name}」有學生優惠嗎？地址跟電話在哪裡？"
        a = f"有的！「{c_name}」是中興大學衛保組簽約的特約醫療院所：\n\n"
        a += f"- 🏥 **科別**：{c_cat}\n"
        a += f"- 🎁 **興大專屬優惠**：**{c_deal}**（就診時出示興大學生證即享優惠）\n"
        a += f"- 📍 **地址**：{c_addr}\n"
        a += f"- 📞 **預約電話**：{c_phone}\n"
        a += f"- 💡 **看診叮嚀**：{c_note}\n\n生病千萬別硬撐，記得帶健保卡跟學生證前往就醫喔！"
        all_instruct.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": q},
                {"role": "assistant", "content": a}
            ]
        })

        all_triplets.append({
            "query": f"中興大學 特約診所 {c_name} 掛號費 優惠 電話",
            "pos": f"【{c_name}】{c_cat}，中興特約優惠：{c_deal}。地址：{c_addr}，電話：{c_phone}。{c_note}",
            "neg": f"【中興大學教務處停修規定】停修申請每學期以一科為限，需經授課教師與系主任核准。"
        })

    # 牙醫特約懶人包
    dentals = [c for c in clinics if "牙" in c["catLabel"] or "牙" in c["name"]]
    if dentals:
        q = "學長姐好，我牙齒突然好痛需要洗牙或補牙，興大附近有哪些特約牙醫可以免收掛號費？"
        a = "牙痛不能拖！中興大學有簽約「出示學生證免收掛號費」的特約牙醫診所如下：\n\n"
        for d in dentals:
            a += f"- **{d['name']}**：{d['address']}（電話：`{d['phone']}`）\n  優惠：**{d['deal']}**。備註：{d['note']}\n"
        a += "\n⚠️ 牙醫多為預約制，出發前建議先打電話預約並告知是中興大學學生喔！🦷"
        all_instruct.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": q},
                {"role": "assistant", "content": a}
            ]
        })

    # 中醫特約懶人包
    tcms = [c for c in clinics if "中醫" in c["catLabel"] or "中醫" in c["name"]]
    if tcms:
        q = "請問中興大學附近有推薦的免掛號費特約中醫診所嗎？"
        a = "有的！興大周邊有多家特約中醫診所，出示學生證即享掛號費減免：\n\n"
        for t in tcms:
            a += f"- **{t['name']}**：{t['address']}（電話：`{t['phone']}`）\n  優惠：**{t['deal']}**。備註：{t['note']}\n"
        a += "\n調養身體或扭傷針灸推拿都可以善用學校特約福利喔！🌿"
        all_instruct.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": q},
                {"role": "assistant", "content": a}
            ]
        })

    # 駐診醫師問答
    for doc in doctors:
        d_day = doc["dayName"]
        d_doc = doc["doc"]
        d_dept = doc["dept"]
        d_time = doc["time"]
        d_title = doc["title"]
        d_desc = doc["desc"]

        q = f"請問惠蓀堂 1F 衛生保健組在【{d_day}】有醫師免費駐診嗎？是什麼科別？"
        a = f"有的！中興大學在惠蓀堂 1F 衛保組設有校內醫師駐診諮詢服務，**免健保卡、完全免費**：\n\n"
        a += f"- 📅 **時間**：每{d_day} {d_time}\n"
        a += f"- 🩺 **駐診醫師**：**{d_doc}**（{d_title}）\n"
        a += f"- 🔬 **專長科別**：{d_dept}\n"
        a += f"- 📝 **諮詢項目**：{d_desc}\n\n同學若有身體微恙或健檢報告疑問，都可以直接在駐診時段前往惠蓀堂 1F 諮詢！"
        all_instruct.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": q},
                {"role": "assistant", "content": a}
            ]
        })

    # InBody 體脂計自主檢測 ＆ 贖罪挑戰問答 (恪遵安全防護：不出現代言教授姓名)
    all_instruct.append({
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "中興大學哪裡可以免費測量 InBody 體脂計？大一新生可以去測嗎？"},
            {"role": "assistant", "content": (
                "可以！中興大學有非常棒的自主健康測量福利：\n\n"
                "📍 **測量地點**：**惠蓀堂 1 樓 衛生保健組**（進門左側自主測量專區）\n"
                "💰 **費用**：**完全免費！**（校外外面健身房測一次通常要 200~300 元）\n"
                "🕒 **開放時間**：週一至週五上班時間（08:30 - 17:00）\n"
                "📋 **設備功能**：醫療級身體組成分析儀（InBody 體脂計），可精準測出骨骼肌重、體脂肪率、內臟脂肪等級、基礎代謝率 (BMR) 等。\n"
                "💡 **測量小撇步**：\n"
                "1. 需脫鞋襪赤腳站上電極片。\n"
                "2. 建議在未大量喝水、空腹或排空狀態下測量最精準。\n\n"
                "此外，健諮中心每學期還會舉辦超熱門的**「興健康體健班」**，曾由校內知名特聘教授親自受邀擔任活動代言支持，"
                "搭配營養師專業諮詢指導，想甩肉練體態的新生千萬別錯過！💪"
            )}
        ]
    })

    # 急救箱借用
    all_instruct.append({
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "我們系學會要辦宿營或球隊比賽，需要準備醫藥箱，學校有得借嗎？"},
            {"role": "assistant", "content": (
                "有！惠蓀堂 1F 衛生保健組提供全校師生免費借用急救醫藥箱：\n\n"
                "1. **借用數量**：社團、系隊或宿營活動，每單位最多可借用 **2 盒**。\n"
                "2. **內含耗材**：含無菌紗布、彈性繃帶、優碘棉片、透氣膠帶、生理食鹽水、剪刀與三角巾等外傷急救備品。\n"
                "3. **借用流程**：持活動企劃書或學生證至惠蓀堂 1F 衛保組登記借用，活動結束後如期歸還即可。\n"
                "4. **其他輔具**：如果同學打球扭傷或骨折，衛保組也有**輪椅與拐杖**可供押證件免費借用喔！🧰"
            )}
        ]
    })

    # =========================================================================
    # PART C: 全校 10 院 40 系所大白話迷思解讀問答
    # =========================================================================
    print("🎓 正在生成全校 10 院 40 系所大白話與破除迷思問答...")
    for d in dept_dist:
        d_name = d["dept"]
        myth = d["myth"]
        explain = d["explain"]
        roast = d["roast"]

        q = f"請用大白話介紹中興大學【{d_name}】！大家都對這個系有什麼常見迷思？真實到底在學什麼？"
        a = (
            f"大白話解密中興大學【{d_name}】來了！\n\n"
            f"🤦‍♂️ **常見迷思 / 靈魂拷問**：\n{myth}\n\n"
            f"💡 **真實到底在學什麼（大白話客觀解說）**：\n{explain}\n\n"
            f"💬 **系上同學內心吐槽金句**：\n{roast}\n\n"
            f"破除迷思後，是不是覺得這個系其實超強又有特色呢！✨"
        )
        all_instruct.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": q},
                {"role": "assistant", "content": a}
            ]
        })

        all_triplets.append({
            "query": f"中興大學 {d_name} 迷思 出路 在學什麼",
            "pos": f"中興大學【{d_name}】：迷思為「{myth}」。真實內容：{explain[:200]}。{roast}",
            "neg": f"【中興大學機車通行證申請】學生機車全面禁止進入校園核心徒步區，違規上鎖需繳納 200 元開鎖工本費。"
        })

    # =========================================================================
    # PART D: 三大夜市與交通生活攻略
    # =========================================================================
    print("🌙 正在生成三大夜市與交通指南問答...")
    for nm in night_markets:
        t = nm["title"]
        c = nm["content"]
        q = f"興大學生晚上想逛夜市，請介紹【{t}】必吃攤位跟怎麼去？"
        a = f"這題問對人了！興大生活圈最重要的夜市之一【{t}】：\n\n{c}\n\n趕快揪室友衝一波吧！🍢"
        all_instruct.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": q},
                {"role": "assistant", "content": a}
            ]
        })

    # 公車路線問答
    for r in transit_routes[:12]:
        num = r.get("num", "")
        dest = r.get("dest", "")
        via = r.get("via", "")
        tag = r.get("tag", "")
        stop = r.get("stopName", "中興大學")
        q = f"在中興大學搭【{num} 號公車】可以去哪裡？路線怎麼走？"
        a = (
            f"在中興大學（{stop}）搭乘【{num} 號公車】：\n\n"
            f"- 🚌 **客運業者**：{r.get('operator', '台中市區公車')}\n"
            f"- 🎯 **行駛方向**：{dest}\n"
            f"- 📍 **途經重要地標**：{via}\n"
            f"- 🏷️ **路線特色**：{tag}\n\n"
            f"搭配台中「市民限定雙十公車」綁定學生證，搭去台中車站、大慶站或逢甲商圈省超多錢喔！🚌"
        )
        all_instruct.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": q},
                {"role": "assistant", "content": a}
            ]
        })

    # 雙十公車市民卡綁定指南
    all_instruct.append({
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "台中雙十公車卡怎麼綁定？中興大學生可以綁嗎？"},
            {"role": "assistant", "content": (
                "只要是在台中就讀大專院校的學生（包含中興大學），都可以享有台中市**「市民限定雙十公車」**福利！\n\n"
                "🎁 **優惠內容**：搭乘台中市公車前 **10 公里免費**，超過 10 公里**車資上限最多只收 10 元**！\n\n"
                "📌 **中興大學學生綁定地點**：\n"
                "1. **校內最快**：中興大學**圖書館 1 樓數位資源區（特定時段駐點）**或配合開學快閃櫃台。\n"
                "2. **校外常設**：南區區公所、各台中捷運綠線車站服務台。\n\n"
                "📋 **必帶證件**：\n"
                "- 健保卡或身分證\n"
                "- 蓋有當學期註冊章的學生證（或在學證明）\n"
                "- 你常用的悠遊卡 / 一卡通\n\n"
                "綁定只要 3 分鐘，大學四年搭公車去一中、逢甲、高鐵省超多交通費！🚌"
            )}
        ]
    })

    # =========================================================================
    # PART E: 通識課甜涼度學生評價問答
    # =========================================================================
    print("📚 正在生成通識課甜度涼度實評問答...")
    for gc in gen_courses:
        name = gc["name"]
        teacher = gc["teacher"]
        sweet = gc["sweet"]
        chill = gc["chill"]
        eval_t = gc["eval_type"]
        cmt = gc["comment"]

        q = f"請問中興大學通識課【{teacher} 老師開的「{name}」】評價怎麼樣？甜不甜、涼不涼？"
        a = f"學長姐真實選課回饋來囉！針對【{name}】（授課教師：{teacher}）：\n\n"
        if sweet: a += f"- 🍬 **給分甜度**：{sweet} / 5\n"
        if chill: a += f"- 💧 **課程涼度/水度**：{chill} / 5\n"
        if eval_t: a += f"- 📝 **考核方式**：{eval_t}\n"
        if cmt: a += f"- 💬 **修課心得**：{cmt}\n"
        a += "\n選課時記得根據自己的時間與興趣做取捨，祝你選到心目中的好課！🎓"
        all_instruct.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": q},
                {"role": "assistant", "content": a}
            ]
        })

    # =========================================================================
    # PART F: 校園規章知識庫多角問答 + RAG `<context>` 嚴格引述與防幻覺樣本
    # =========================================================================
    print("🏛️ 正在生成校園官方規章與 RAG 防幻覺雙軌問答...")
    for item in campus_kb:
        name = item.get("名稱", "")
        content = item.get("情報內容", "")
        kws = item.get("關鍵字", "")
        if len(content) < 40:
            continue

        kw_list = [k.strip() for k in kws.split(",") if len(k.strip()) >= 2]
        kw = kw_list[0] if kw_list else name

        # 1. 內化閉卷問答 (Closed-Book SFT)
        user_queries = [
            f"請問中興大學關於「{kw}」有什麼具體規定？",
            f"大一新生想了解「{name}」，注意事項有哪些？"
        ]
        for u_q in user_queries:
            all_instruct.append({
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": u_q},
                    {"role": "assistant", "content": f"關於【{name}】的學校官方規定整理如下：\n\n{content}\n\n記得留意學校最新公告規定喔！🌲"}
                ]
            })

        # 2. RAG Grounded 檢索引述問答 (教學模型精準引述 <context> 且不捏造數字)
        rag_prompt = (
            f"請依據以下提供的參考脈絡 (<context>)，回答大一新生的問題。嚴格依據脈絡內的規定、電話與日期回答，切勿加油添醋：\n\n"
            f"<context>\n{content}\n</context>\n\n"
            f"問題：請問關於「{kw}」，學校官方規定的具體內容與聯繫窗口是什麼？"
        )
        rag_ans = (
            f"依據官方公佈資料，關於【{name}】的重點規定如下：\n\n{content}\n\n"
            f"以上為官方規章原文規範，如需進一步協助請依文內負責單位窗口聯繫辦理。"
        )
        all_instruct.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": rag_prompt},
                {"role": "assistant", "content": rag_ans}
            ]
        })

        # Triplet
        all_triplets.append({
            "query": f"中興大學 {name} {kw} 規定 辦法",
            "pos": f"【{name}】{content}",
            "neg": f"【台中忠孝夜市美食】忠孝夜市營業時間為每晚至深夜，著名美食有蔡家豆花與夜夜見來蛋包飯。"
        })

    # =========================================================================
    # PART G: 防幻覺拒答陷阱題 (Refusal Negative Samples)
    # =========================================================================
    negative_samples = [
        {
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": "請問中興大學校園內有高爾夫球場可以借球具打球嗎？收費怎麼算？"},
                {"role": "assistant", "content": "中興大學校園內**並沒有**高爾夫球場設施喔！\n\n校內的運動設施主要包含：\n- 體育館室內羽球場、籃球場、排球場與桌球室\n- 健身房（體育館地下一樓）\n- 室外田徑場、排球場與籃球場\n- 室外網球場\n- 游泳池\n\n運動設施借用與收費請以體育室官方公告為準，千萬不要跑來學校找高爾夫球場打球啦！🏌️‍♂️"}
            ]
        },
        {
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": "請問台大或清華大學的大一宿舍保證住宿嗎？"},
                {"role": "assistant", "content": "我是國立中興大學 (NCHU) 的學長姐 AI 助手，目前的知識庫只專注於**中興大學**的校園生活、選課與宿舍規定喔！\n\n關於台灣大學或清華大學的宿舍抽籤保證政策，建議你直接前往該校的學生住宿組官方網站查詢最新公告，以免獲得不正確的資訊！"}
            ]
        },
        {
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": "依據 <context>台大物理系大一必修微積分</context>，請問中興大學獸醫系的微積分要修幾學分？"},
                {"role": "assistant", "content": "提供的參考脈絡中僅包含台灣大學的資料，並未記載中興大學獸醫系的修業規定。\n\n依據中興大學獸醫學系修業規章，獸醫系學生需修習全學年必修之微積分課程，但具體抵免與學分數標準建議直接登入中興大學教務處「課程查詢系統」或至獸醫系辦公室洽詢確認，避免參考無關的外校資料喔！"}
            ]
        }
    ]
    all_instruct.extend(negative_samples)

    # =========================================================================
    # 寫入檔案與切分 Train / Eval (90% / 10%)
    # =========================================================================
    print("💾 正在進行資料清洗、安全脫敏驗證與格式序列化...")
    random.seed(42)
    random.shuffle(all_instruct)
    random.shuffle(all_triplets)

    # 執行最後安全過濾，確保絕無違規字串
    for item in all_instruct:
        for msg in item["messages"]:
            msg["content"] = sanitize_text(msg["content"])

    for trip in all_triplets:
        trip["query"] = sanitize_text(trip["query"])
        trip["pos"] = sanitize_text(trip["pos"])
        trip["neg"] = sanitize_text(trip["neg"])

    split_idx = int(len(all_instruct) * 0.9)
    train_instruct = all_instruct[:split_idx]
    eval_instruct = all_instruct[split_idx:]

    with open(INSTRUCT_OUTPUT, "w", encoding="utf-8") as f:
        for item in train_instruct:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    with open(EVAL_INSTRUCT_OUTPUT, "w", encoding="utf-8") as f:
        for item in eval_instruct:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    with open(TRIPLETS_OUTPUT, "w", encoding="utf-8") as f:
        for item in all_triplets:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    print("=" * 70)
    print(f"🎉 滿血版 V3 資料集建構完成！")
    print(f"  - 訓練集 (SFT Train): {len(train_instruct)} 筆 -> {INSTRUCT_OUTPUT}")
    print(f"  - 驗證集 (SFT Eval) : {len(eval_instruct)} 筆 -> {EVAL_INSTRUCT_OUTPUT}")
    print(f"  - 總對話樣本數       : {len(all_instruct)} 筆（原 768 筆的 {len(all_instruct)/768:.1f} 倍！）")
    print(f"  - 檢索三元組 (Triplets): {len(all_triplets)} 組 -> {TRIPLETS_OUTPUT}")
    print("=" * 70)

if __name__ == "__main__":
    generate_mega_dataset()
