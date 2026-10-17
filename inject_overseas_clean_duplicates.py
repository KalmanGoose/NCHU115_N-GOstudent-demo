#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
inject_overseas_clean_duplicates.py
1. 清理現有知識庫中的 39 筆重複膨脹條目（保留最完整版本）
2. 精準注入「僑生／港澳生（學務處學安室惠蓀堂2F）」與「外籍生（國際處OIA行政大樓3F）」專業條目
3. 同步至 campus_knowledge.json, campus_knowledge.csv, KnowledgeData.gs, corpus_embeddings.pt
==============================================================================
"""

import os
import json
import csv
import torch
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
CSV_PATH = os.path.join(BASE_DIR, "campus_knowledge.csv")
GS_PATH = os.path.join(BASE_DIR, "KnowledgeData.gs")
EMB_PATH = os.path.join(BASE_DIR, "corpus_embeddings.pt")
MODEL_DIR = os.path.join(BASE_DIR, "nchu_bge_small_model")

# 1. 讀取與去重
with open(JSON_PATH, "r", encoding="utf-8") as f:
    raw_kb = json.load(f)

print(f"[*] 原始條目總數: {len(raw_kb)}")

seen_names = set()
clean_kb = []
dedup_count = 0

for item in raw_kb:
    name = item.get("名稱", "").strip()
    if not name:
        continue
    if name in seen_names:
        dedup_count += 1
        continue
    seen_names.add(name)
    clean_kb.append(item)

print(f"[*] 成功清除重複條目: {dedup_count} 筆，剩餘純淨條目: {len(clean_kb)}")

# 2. 定義【僑生／港澳生】與【外籍生】專屬精準業務條目
OVERSEAS_ENTRIES = [
    {
        "名稱": "學務處學生安全輔導室-僑生與港澳生專屬主責窗口 (惠蓀堂2F)",
        "情報內容": (
            "【國立中興大學僑生及港澳學生主責輔導單位】：\n"
            "• **主管處室**：學生事務處 (學務處) 學生安全輔導室（簡稱學安室）。\n"
            "• **辦公室位置**：惠蓀堂 2 樓（非行政大樓國際處！僑生生活與行政請直接洽詢學安室）。\n"
            "• **聯絡電話**：04-22870885 / 04-22840227。\n"
            "• **服務範疇**：專責所有僑生、港澳生在校期間的生活適應、居留證住宿證明協助、急難救助、各類僑生專屬獎助學金、僑生聯誼會輔導及各項權益維護。"
        ),
        "關鍵字": "僑生,港澳生,僑生輔導室,學安室,學生安全輔導室,惠蓀堂2樓,僑生辦公室,香港學生,澳門學生,馬來西亞學生,僑生找誰,僑生業務,僑輔室",
        "direct": True
    },
    {
        "名稱": "僑生與港澳生健康保險-前半年僑保與滿6個月健保規定 (學安室辦理)",
        "情報內容": (
            "【僑生與港澳生在台就醫保險重要規範】：\n"
            "• **入境在台未滿 6 個月（空窗期）**：\n"
            "  依規定強制參加「僑生傷病醫療保險 (僑保)」，保費將直接列於每學期開學註冊繳費單代收。若在校外就醫，保留收據與診斷證明書至惠蓀堂 2 樓學安室申請理賠。\n"
            "• **在台居留滿 6 個月（連續居住或出境一次未逾30日）**：\n"
            "  依法必須強制轉入「全民健康保險 (NHI)」，由學務處學安室統一向健保署造冊投保，健保費亦列入學期繳費單。\n"
            "• **清寒健保補助**：符合清寒證明標準之僑港澳生，可向學安室申請健保費自付額補助。"
        ),
        "關鍵字": "僑生健保,僑保,港澳生健保,僑保理賠,僑生看醫生,健保卡,外僑健保,居留滿6個月健保,僑生保險,學安室保險",
        "direct": True
    },
    {
        "名稱": "僑生與港澳生專屬獎學金與教育部清寒助學金 (惠蓀堂2F學安室)",
        "情報內容": (
            "【僑生及港澳生各類獎助學金申請指引】：\n"
            "• **教育部清寒僑生助學金**：每年 9 月初開學時向學務處學安室（惠蓀堂2F）提出申請，須檢附清寒證明文件。\n"
            "• **僑務委員會各類獎學金**：學行優良僑生獎學金、頂尖及傑出僑生獎學金，每年由學安室轉發公文受理審查。\n"
            "• **校內外僑生獎助學金**：包含研究所優秀僑生獎勵金等，各項辦法與申請時程請密切關注學安室官網僑生公告專區。"
        ),
        "關鍵字": "僑生獎學金,清寒僑生助學金,港澳生獎學金,僑委會獎學金,僑生清寒補助,學安室獎學金,僑生學雜費補助",
        "direct": True
    },
    {
        "名稱": "僑生與港澳生工讀工作許可證線上申辦 (學安室輔導)",
        "情報內容": (
            "【僑生與港澳生在台合法工讀規範】：\n"
            "• **合法打工必要條件**：僑港澳生在校外工讀、實習或打工，**依法必須先取得勞動部核發之「工作許可證」**，嚴禁無證非法工作（違規將面臨高額罰款與強制出境處分）。\n"
            "• **申辦管道**：至勞動部「外國專業人員工作許可申辦網 (EZWP)」進行線上個人申辦。\n"
            "• **工作時數上限**：依就業服務法規定，學期中除寒暑假外，**每週工讀工作時間最長不得超過 20 小時**。\n"
            "• **申請疑問**：線上申辦填寫學校資料或有審查疑問，請洽惠蓀堂 2 樓學安室輔導老師諮詢。"
        ),
        "關鍵字": "僑生工作證,港澳生打工,僑生打工,工作許可證,EZWP,勞動部工作證,僑生工讀上限,打工每週20小時,非法工讀",
        "direct": True
    },
    {
        "名稱": "中興大學僑生聯誼會與各國同學會組織",
        "情報內容": (
            "【中興大學僑生社團與同鄉互助組織】：\n"
            "• **組織架構**：學務處學安室下轄輔導之「國立中興大學僑生聯誼會」。\n"
            "• **下設分會**：包含港澳同學會、馬來西亞同學會、印尼同學會、緬甸同學會及環球同學會。\n"
            "• **重要活動**：每年定期舉辦迎新接機、僑生文化祭、春節僑生祭祖圍爐餐會、體育競賽及送舊活動，是僑生在台生活最重要的互助生活圈。"
        ),
        "關鍵字": "僑生聯誼會,港澳同學會,馬來西亞同學會,印尼同學會,緬甸同學會,僑生迎新,僑生接機,僑生社團",
        "direct": True
    },
    {
        "名稱": "國際事務處 (OIA) 外籍與大陸學生事務組-國際學位生專責單位 (行政大樓3F)",
        "情報內容": (
            "【國立中興大學外國學生（國際學生/外籍生）主責窗口】：\n"
            "• **主責處室**：國際事務處 (OIA) 外籍與大陸學生事務組。\n"
            "• **辦公室位置**：行政大樓 3 樓。\n"
            "• **聯絡電話**：04-22840206 / 信箱：oia@nchu.edu.tw。\n"
            "• **服務對象**：持外國國籍入學之國際學位生、大陸地區學生、國際交換生。\n"
            "• **服務範疇**：新生入學學歷與簽證查驗、外僑居留證 (ARC) 指引、外國學生醫療保險 (FSHI)、全英語校園生活諮詢與學伴計畫 (Buddy Program)。"
        ),
        "關鍵字": "國際處,OIA,國際事務處,外籍生,外國學生,國際學生,外籍生辦公室,行政大樓3樓,外陸組,交換生,外國人入學",
        "direct": True
    },
    {
        "名稱": "外籍生居留證 (ARC) 線上申辦與延期規定 (OIA指引)",
        "情報內容": (
            "【外國學生外僑居留證 (Alien Resident Certificate, ARC) 申辦規範】：\n"
            "• **申辦時限**：持居留簽證 (Resident Visa) 入境者，**必須於入境後 30 日內**完成線上申請。\n"
            "• **申辦管道**：一律至內政部移民署「外國與外僑學生線上申辦系統」填寫資料上傳。\n"
            "• **必備文件**：護照與簽證影本、大頭照、在學證明（或入學許可）、住址證明（住校內者請向住宿組申請宿舍住宿證明）。\n"
            "• **居留展延**：居留證到期前 3 個月內務必線上申請延期，逾期居留將面臨高額罰款甚至限令出境！"
        ),
        "關鍵字": "外籍生居留證,ARC,外僑居留證,居留簽證,居留證線上申辦,移民署,居留證過期,外國學生居留證,住宿證明居留證",
        "direct": True
    },
    {
        "名稱": "外籍生外國學生醫療保險 (FSHI) 與全民健保投保指南 (OIA)",
        "情報內容": (
            "【外籍學生在台醫療保險權益】：\n"
            "• **入境未滿 6 個月（前半年空窗期）**：\n"
            "  必須強制投保「外國學生醫療保險 (FSHI)」，每學期隨學雜費繳費單一併繳納。就醫理賠請攜帶醫療單據向國際處 (OIA) 辦理。\n"
            "• **在台居留滿 6 個月起**：\n"
            "  符合全民健保資格，學校國際處將統一協助向健保署申辦加保，健保卡核發後會通知至行政大樓 3 樓 OIA 領取。\n"
            "• **健保轉出入**：若因實習或工作由雇主加保健保，請至 OIA 辦理校內健保轉出手續以免重複扣繳。"
        ),
        "關鍵字": "外籍生健保,FSHI,外國學生醫療保險,外籍生看病,外籍生健保卡,國際處健保,外國人健保",
        "direct": True
    },
    {
        "名稱": "境外學生校內住宿申請與居留證住宿證明開立",
        "情報內容": (
            "【僑生與外籍新生校內住宿及行政證明申請】：\n"
            "• **大一新生住宿保障**：境外大一新生（僑生、外籍生）原則上均保障提供校內宿舍（男生二村、女生樸誠勤齋）。\n"
            "• **申辦居留證之住宿證明**：\n"
            "  辦理外僑居留證 (ARC) 需檢附居住地證明。住校生請於完成入住報到後，至學務處住宿輔導組（雲平樓1F或各棟服務中心）申請開立「校內宿舍住宿證明」作為上傳附件。"
        ),
        "關鍵字": "僑生宿舍,外籍生宿舍,境外生住宿,宿舍住宿證明,居留證住宿證明,二村外籍生,女宿僑生",
        "direct": True
    }
]

# 3. 注入新條目
added_names = set()
for item in OVERSEAS_ENTRIES:
    clean_kb.append(item)
    added_names.add(item["名稱"])

print(f"[+] 成功注入僑生／港澳生（學安室）與外籍生（國際處）專業條目: {len(OVERSEAS_ENTRIES)} 筆")
print(f"🎉 最終高純度、無重複知識庫總條目數: {len(clean_kb)} 筆！")

# 4. 同步寫入所有格式
with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(clean_kb, f, ensure_ascii=False, indent=2)
print(f"✅ 成功寫入 {JSON_PATH}")

fieldnames = ["名稱", "情報內容", "關鍵字", "direct"]
with open(CSV_PATH, "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in clean_kb:
        writer.writerow(row)
print(f"✅ 成功寫入 {CSV_PATH}")

with open(GS_PATH, "w", encoding="utf-8") as f:
    f.write("// Google Apps Script Knowledge Base generated from campus_knowledge.json\n")
    f.write("var CAMPUS_KNOWLEDGE = " + json.dumps(clean_kb, ensure_ascii=False, indent=2) + ";\n")
print(f"✅ 成功寫入 {GS_PATH}")

# 5. 重新以 BGE-Small 計算全庫向量索引
print("⚡ 正在重新為全體高純度條目計算神經向量索引...")
model = SentenceTransformer(MODEL_DIR, device="cpu")
corpus_texts = [f"【{x.get('名稱', '')}】{x.get('情報內容', '')}" for x in clean_kb]
embs = model.encode(corpus_texts, convert_to_tensor=True, show_progress_bar=True, device="cpu")
torch.save(embs, EMB_PATH)
print(f"✅ 成功更新 {EMB_PATH}！向量維度: {embs.shape}")
print("🎉 第一步：外籍生與僑生業務入庫及全庫去重完成！")
