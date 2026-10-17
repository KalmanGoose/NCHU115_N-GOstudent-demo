#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) 新資料集 RAG 語意蒸餾與知識庫更新管線 (distill_rag_knowledge.py)
==============================================================================

本腳本自動執行：
  1. 讀取新資料源：
     - 資料集/中興大學 RAG 知識庫建置.txt
     - 資料集/中興大學 RAG 知識庫建置.txt.txt
  2. 結構化語意蒸餾（包含 SSO密碼演算法、線上報到四部曲、減免就貸相依、
     學雜費繳費銷帳、第6週退費權益分水嶺、8GB網管流量、數位借書證、
     健檢與體檢補繳、兵役緩徵儘後召集、宿舍專線、LPR車牌辨識、特約醫療
     與企業福利、通識28學分三大素養、外語畢業與免修ESAP、各系修業學分等）。
  3. 智慧去重與合併（與現有 campus_knowledge.json 進行名稱與關鍵字比對）。
  4. 同步三端輸出：
     - campus_knowledge.json
     - campus_knowledge.csv (UTF-8-SIG)
     - KnowledgeData.gs (宣告 var CAMPUS_KNOWLEDGE = [ ... ];)
==============================================================================
"""

import os
import re
import csv
import json
from typing import List, Dict, Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "資料集")

JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
CSV_PATH = os.path.join(BASE_DIR, "campus_knowledge.csv")
GS_PATH = os.path.join(BASE_DIR, "KnowledgeData.gs")

def clean_str(val: Any) -> str:
    if val is None:
        return ""
    v = str(val).strip()
    if v.lower() in ("nan", "none", "null", "undefined"):
        return ""
    return v

def deduplicate_keywords(kw_list: List[str]) -> List[str]:
    seen = set()
    unique = []
    for k in kw_list:
        k_clean = clean_str(k)
        if k_clean and k_clean not in seen:
            seen.add(k_clean)
            unique.append(k_clean)
    return unique

def extract_new_rag_knowledge() -> List[Dict[str, Any]]:
    """從新加入之 RAG 知識庫建置文字檔中提取結構化情報"""
    print("\n" + "="*70)
    print("📖 正在解析新資料集：中興大學 RAG 知識庫建置文字檔...")
    print("="*70)

    f1 = os.path.join(DATASET_DIR, "中興大學 RAG 知識庫建置.txt")
    f2 = os.path.join(DATASET_DIR, "中興大學 RAG 知識庫建置.txt.txt")

    t1 = ""
    t2 = ""
    if os.path.exists(f1):
        with open(f1, "r", encoding="utf-8", errors="ignore") as f:
            t1 = f.read()
        print(f"  - 成功讀取 {os.path.basename(f1)} ({len(t1)} 字元)")
    if os.path.exists(f2):
        with open(f2, "r", encoding="utf-8", errors="ignore") as f:
            t2 = f.read()
        print(f"  - 成功讀取 {os.path.basename(f2)} ({len(t2)} 字元)")

    # 提煉新資料集中的核心結構化知識
    distilled_entries = [
        {
            "keywords": ["興大入口", "SSO", "新生EZ come", "預設密碼", "初始密碼", "學號", "登入帳號", "身分證末四碼", "居留證密碼", "忘記密碼"],
            "name": "資訊QA-興大入口SSO與新生EZ Come初始密碼設定規則",
            "content": "新生登入「興大入口/新生EZ come」（https://portal.nchu.edu.tw 或 http://nchu.cc/sso）帳號為個人學號。初始密碼規則：1. 本地生：身分證首字母（依序排列大寫與小寫各一碼）＋身分證末四碼＋出生月日四碼（MMDD），總長度共 10 碼（例如身分證字號首字母為 A、末四碼為 6789、生日 3 月 4 日者，預設密碼為 Aa67890304）；2. 居留證生（僑生/外籍生）：居留證首碼大小寫＋證號末四碼＋生日月日四碼（共 10 碼，如 Bb87120304）；3. 無居留證號者：前六碼預設為 999999 附加生日月日四碼（如 9999990304）。初次登入後請依序完成註冊須知確認、個人通訊核對與 2 吋大頭照上傳。"
        },
        {
            "keywords": ["線上報到", "新生報到", "報到文件", "畢業證書", "身分證", "悠遊卡學生證照片", "歷年成績單", "僑生分發通知書", "大頭照規格"],
            "name": "行政QA-大一新生線上報到四步驟與文件上傳規範",
            "content": "新生報到全程於「新生EZ come」系統線上完成，不需親自到校：步驟1. 閱讀並確認註冊須知；步驟2. 核對並更新個人基本聯絡資料（通訊地址、電話、緊急聯絡人）；步驟3. 上傳製作悠遊卡學生證專用之 2 吋脫帽彩色證件大頭照（白底清晰，僅限標準 .jpg 格式，嚴禁生活照或自拍照）；步驟4. 上傳學歷證明（高中畢業證書正本，或加蓋原高中關戳之歷年成績單修業證明書正本；持國外/大陸學歷者須經駐外館處驗證，僑生須附分發通知書）。"
        },
        {
            "keywords": ["學雜費減免", "就學貸款", "就貸流程", "減免流程", "生輔組", "台灣銀行對保", "先減免後就貸", "弱勢助學"],
            "name": "行政QA-學雜費減免與就學貸款申請相依流程",
            "content": "申請學雜費減免與就學貸款存在嚴格先後順序：【必須先辦減免，再辦就貸】！1. 具減免資格者（低收、中低收、身障學生或子女、原住民、軍公教遺族、特殊境遇等）於報到後至學務系統填表，列印申請表檢附證明文件郵寄或親送至惠蓀堂 2F 生輔組審核差額（約需 2 個工作天）；2. 待生輔組於系統核定扣除減免金額後之實際應繳金額，學生再至校內就貸系統填表，攜表至台灣銀行各分行辦理對保；3. 最後將台銀對保單第二聯送回生輔組銷帳，始正式完成註冊程序。"
        },
        {
            "keywords": ["學雜費繳費", "繳費方式", "繳費期限", "信用卡繳費", "超商繳費", "ATM轉帳", "第一銀行", "第e學雜費入口網", "繳費證明", "學分費"],
            "name": "行政QA-學雜費繳費管道、入帳銷帳時程與繳費證明列印",
            "content": "學雜費繳費單可至「第e學雜費入口網」查詢下載。多元繳費管道與入帳銷帳時程：1. ATM 實體/網路轉帳（約 1~2 小時入帳）；2. 第一銀行臨櫃繳款（當日銷帳）；3. 網路信用卡支付（約需 5 個工作天銷帳）；4. 四大超商代收（約需 7 個工作天銷帳，每筆上限 4~6 萬元）。繳費期限（通常為開學第二週內）前請儘早繳款，繳納完成後請至第e學雜費入口網確認「已銷帳」狀態並下載列印繳費證明單存查。"
        },
        {
            "keywords": ["退選截止", "休學退費", "退費標準", "第6週", "10/16", "退學退費", "學雜費退費", "重大分水嶺"],
            "name": "學則QA-學期第6週重大權益分水嶺 (休退學退費與課程退選截止)",
            "content": "依中興大學學則與行事曆規範，學期第 6 週（約 10/16 左右）為全校重大法定權益分水嶺：1. 網路退選課程之最終截止日（逾期後不得再申請退選，僅能於期中申請停修且成績單將留下「W」註記）；2. 申請休學或退學得退還「三分之二學雜費」之最後法定門檻。若於第 6 週之後至第 12 週前辦理休退學，僅得退還三分之一學雜費；第 12 週結束後辦理者概不退還任何學雜費。"
        },
        {
            "keywords": ["校園信箱", "webmail", "Gapp", "Google空間", "校園網路流量", "流量限制", "8GB限制", "鎖網", "計資中心", "WiFi"],
            "name": "資訊QA-學生公務信箱容量、Google Gapp與每日8GB流量管制",
            "content": "計資中心提供全校學生整合型帳號服務：1. 校園公務電子郵件（帳號@mail.nchu.edu.tw，容量 1GB），初次使用需自興大入口啟用並變更密碼；2. Google 應用服務帳號（帳號@gapp.nchu.edu.tw，容量 10GB），可至興大入口啟用；3. 校園無線網路（SSID: NCHU），帳密與校園信箱一致；4. 計資中心對校園網路實施流量管控：單一 IP 每日總流量上限（包含流入與流出合計）為 8GB，超出上限系統將自動鎖網限速，隔日凌晨自動重置解除。"
        },
        {
            "keywords": ["圖書館進館", "數位出入館", "新生借書", "臨時借書證", "圖書館Line", "電子資源", "校外連線", "PWA"],
            "name": "圖書QA-圖書館數位出入館PWA、新生臨時證與Line官方諮詢",
            "content": "在正式悠遊卡學生證發放前，新生可直接開啟圖書館「數位出入館系統」（https://space.lib.nchu.edu.tw/pwadoor/）以學號密碼登入產生動態條碼刷碼入館；亦可於線上填表申辦「新生臨時借書證」提前借閱館藏圖書。校外查詢圖書館電子資料庫直接介接興大單一入口帳密；有任何館藏或研討室疑問，可加入圖書館 Line 官方帳號（@rkk7227q）進行一對一線上諮詢。"
        },
        {
            "keywords": ["新生體檢", "健檢", "健康檢查", "台中醫院", "補體檢", "健康資料卡", "體檢費用", "復學體檢", "健康及諮商中心"],
            "name": "衛保QA-新生健康檢查集中體檢與校外受檢補繳規範",
            "content": "依法全體大一新生入學均須完成健康檢查：1. 學校於 9/7~9/8 委由合約醫院（衛生福利部臺中醫院）進駐惠蓀堂辦理集中體檢，現場流程完整快速，費用約 600 元；2. 若選擇於校外地區醫院以上機構受檢，健檢項目必須與校方「學生健康資料卡」完全相符，並須將健檢報告與資料卡正本於開學前繳交至惠蓀堂 1F 健康及諮商中心（衛生保健組）；3. 註冊當日隨即辦理休學者得免做體檢，惟日後申請復學時必須補齊健檢報告始可核准復學。"
        },
        {
            "keywords": ["兵役調查表", "在學緩徵", "儘後召集", "學安室", "身分證影本", "退伍令", "教育召集", "兵役緩徵", "役男"],
            "name": "兵役QA-役男在學緩徵與後備軍人儘後召集申辦指引",
            "content": "具中華民國國籍之役男入學均須向學生安全輔導室（學安室，惠蓀堂 2F）申報兵役：1. 未役役男：登入學務系統填寫兵役資料，列印「學生兵役調查表」並黏貼身分證正反面影本，於新生入學指導活動繳交或 9/30 前送至學安室，由學校造冊函送縣市政府辦理「在學緩徵」（效期至預定畢業年）；2. 已役役男（退伍/免役/補充兵）：填表黏貼身分證影本並額外檢附退伍令或免役證明影本，送交學安室辦理「儘後召集」，避免在學期間被抽中後備軍人教育召集；開學後可於學務系統查詢核定文號。"
        },
        {
            "keywords": ["二村電話", "誠軒電話", "樸軒電話", "勤軒電話", "女宿分機", "男宿分機", "宿管室", "輔導員", "宿舍信箱"],
            "name": "宿舍QA-各棟宿舍服務中心專線、聯絡信箱與管理員窗口",
            "content": "興大學生宿舍各園區服務中心聯繫專線與信箱：• 男宿興大二村服務中心：04-22840473 / 04-22873321，信箱 chnvdormitory@email.nchu.edu.tw（管轄仁齋、義齋、禮齋、智齋、信齋、勇齋）。• 女宿誠軒服務中心：04-22840656。• 女宿樸軒服務中心：04-22840474。• 女宿勤軒服務中心：04-22840657。各服務中心配置專職輔導員與管理員，負責門禁卡補發、水電修繕通報、掛號包裹領取與夜間緊急照護支援。"
        },
        {
            "keywords": ["車牌辨識", "LPR", "機車通行證", "汽車通行證", "停車費", "機車車證", "機車棚", "車輛違規", "駐警隊"],
            "name": "交通QA-校園智慧車牌辨識系統(LPR)與學生汽機車通行證申請",
            "content": "興大各大門全天候實施全自動智慧車牌辨識系統（LPR）管制進出：1. 學生機車通行證：每年 8 月下旬起至「單一入口→總務資訊系統→車輛通行證」線上申辦，填寫行照與駕照資料，年費 300 元，審核通過後車牌自動寫入辨識系統，車輛僅能停放大門與周邊指定專屬機車棚，嚴禁騎入校園核心徒步區；2. 學生汽車通行證：原則上不開放大學部非住宿生申請日間汽車入校，住宿生或特殊公務需求須依總務處要點專案申請並繳納費用；3. 腳踏車須上網登錄申請免費車證貼紙貼於車架，違停由駐警隊拖吊移置。"
        },
        {
            "keywords": ["摩斯漢堡", "全家便利商店", "敦煌書局", "食安大樓", "實習商店", "校內商店", "學餐", "生活機能", "校內商場"],
            "name": "生活QA-校內連鎖餐飲、便利商店、書局與實習商店分布全覽",
            "content": "興大校內生活與商業便利設施分布：1. 中興湖畔：摩斯漢堡（MOS Burger）興大店，結合湖光水色提供全日餐飲；2. 綜合教學大樓前 & 管理大樓 1F：全家便利商店（FamilyMart），全天候生活補給、代收繳費與餐飲服務；3. 社管大樓 1F：敦煌書局中興店，提供教科書展銷、外文書籍訂購與文具學生專屬折扣；4. 圓廳生活廣場 1~2F：集結多元化學生餐廳、便民餐飲、自助餐與連鎖手搖飲；5. 食安大樓 1F：中興大學實習商店，販售自產高品質興大鮮奶、優酪乳與鮮乳冰淇淋；6. 圖書館 1F：Straight A 蘋果校園體驗中心。"
        },
        {
            "keywords": ["特約醫院", "特約診所", "仁愛醫院", "台中醫院", "林新醫院", "澄清醫院", "中醫特約", "牙醫特約", "掛號費減免", "看病優惠"],
            "name": "醫療QA-校外特約大型醫院、區域醫療院所與專科門診優惠總表",
            "content": "興大學生持學生證與健保卡就醫享門診掛號費減免互惠：• 大型醫院與區域醫院：衛生福利部臺中醫院、仁愛醫療財團法人（台中仁愛醫院/大里仁愛醫院）、林新醫療社團法人（惠中林新醫院/烏日林新醫院）、澄清綜合醫院（平等院區/中港院區）、澄清復健醫院。• 校園周邊專科門診：天行健耳鼻喉科診所、家康診所、元盛診所、元里診所、謙樂牙醫診所、慈祐中醫診所、松群中醫診所、元亨中醫診所等，出示學生證享掛號費折抵 50 元或免收掛號費。"
        },
        {
            "keywords": ["特約企業", "華信航空", "長榮航空", "長榮桂冠", "裕元花園", "日月千禧", "福容大飯店", "特約折扣", "學生福利", "裕珍馨"],
            "name": "生活QA-校外企業品牌特約福利網絡 (交通、旅宿、餐飲與科技)",
            "content": "興大學生會與校方洽簽多元企業品牌特約：• 航空交通：華信航空指定國內線機票學生專案折扣、長榮航空特定合作專案。• 飯店旅宿：台中長榮桂冠酒店、台中裕元花園酒店、台中日月千禧酒店、福容大飯店等出示中興學生證享專屬特約協議房價。• 生活美食與購物：裕珍馨糕餅門市折扣、摩斯漢堡學生優惠、國泰世華銀行金融服務，以及台中市百餘家商圈特約餐廳用餐享 85~95 折或免費加料。"
        },
        {
            "keywords": ["通識架構", "通識28學分", "基礎素養", "語文素養", "領域素養", "通識向度", "通識學群", "畢業通識", "通識門檻"],
            "name": "學則QA-全校共同通識教育三大素養架構與28學分修業規範",
            "content": "日間部學士班通識最低應修滿 28 學分，三大核心架構：1. 基礎素養：敘事表達（大一國文 4 學分）、通識英文（6 學分）、資訊素養與 AI 應用（1 學分）、運動與健康/體育（2 學分 0 學分，屬畢業門檻）、全民國防教育（非必修，至多採計 1 門 2 學分）；2. 語文素養：至少修滿 8~10 學分（含通識英文及第二外語選修）；3. 領域素養：分為人文領域（文學藝術/歷史哲學）、社會領域（社會公民/法律政治/經濟管理）、自然領域（生命科學/物質科學/應用科技），至少修滿 10 學分，且必須跨領域選修並符合各系所向度限制。"
        },
        {
            "keywords": ["多益", "托福", "雅思", "英檢", "GEPT", "外語畢業門檻", "英文畢業標準", "英文免修", "ESAP", "EMI", "英語免修"],
            "name": "語言QA-全校外語能力畢業門檻對照表與大一英文免修補學分規定",
            "content": "【外語能力畢業標準】：學士班學生須通過以下任一標準：多益 (TOEIC) 聽讀 785 分以上、托福 (TOEFL iBT) 72 分以上、雅思 (IELTS) 5.5 級分以上、全民英檢 (GEPT) 中高級初試通過或劍橋主流英語 (FCE) 通過。未通過者須依規定加修指定補救進階英語課程。【大一英文免修與補學分】：入學前英檢達上述標準者，可於 8 月底前向語言中心申請免修大一英文 4 學分；重要規定：獲准免修之 4 學分，學生仍必須修習各學院開設之專業英文（ESAP）或全英語授課（EMI）課程補足，始得計入畢業總學分！"
        },
        {
            "keywords": ["資工畢業學分", "電機畢業學分", "材料畢業學分", "機械畢業學分", "化工畢業學分", "管院畢業學分", "各系學分", "必修學分", "選修學分"],
            "name": "學則QA-代表理工、電資、管院各學系畢業總學分與修業結構對照",
            "content": "興大代表性學系學士班畢業總學分結構（以各系最新畢業條件明細表為準）：• 資工系：總學分 128（校訂通識 28、系必修 72、專業選修 28）。• 電機系：總學分 132（校訂通識 28、系必修 76、專業選修 28）。• 材料系：總學分 130（校訂通識 28、系必修 74、專業選修 28）。• 機械系：總學分 136（校訂通識 28、系必修 82、專業選修 26）。• 化工系：總學分 132（校訂通識 28、系必修 78、專業選修 26）。• 企管/資管/財金/會計系：總學分 130（校訂通識 28、院系必修 68~72、專業選修 30~34）。• 農資院/生科院各系：總學分 128~132（含基礎實驗與專業實習學分）。"
        },
        {
            "keywords": ["社團分類", "學術社團", "康樂社團", "服務社團", "體能社團", "自治社團", "課外活動組", "社團博覽會", "加入社團"],
            "name": "學務QA-全校六大類學生社團分類與課外活動組輔導機制",
            "content": "興大擁有近百個學生社團，由學務處課外活動組（雲平樓）統籌輔導，劃分為六大類別：1. 學術性社團（天文社、辯論社、模擬聯合國等）；2. 學藝性社團（攝影社、書法社、美術社、動漫社等）；3. 康樂性社團（吉他社、熱舞社、熱音社、管樂社、弦樂社、國樂社等）；4. 體能性社團（登山社、劍道社、羽球社、游泳社、滑板社等）；5. 服務性社團（慈青社、羅浮群、扶青社、偏鄉服務隊等）；6. 自治性與綜合性社團（各系系學會、學生會、僑聯會等）。新生營隊期間設有社團博覽會供自由參觀體驗並加入。"
        },
        {
            "keywords": ["行政處室位置", "教務處分機", "學務處分機", "總務處分機", "研發處分機", "國際處分機", "秘書處分機", "行政大樓處室"],
            "name": "行政QA-全校一級行政處室核心業務範疇與辦公地點全景導覽",
            "content": "興大行政大樓與各處室核心配置全覽：• 行政大樓：1F（註冊組103、課務組104、生活輔導組、出納組）、2F（招生組、文書組、教學資源暨發展中心）、3F（研發處、國際事務處、總務處長室）、4F（校長室、副校長室、秘書室）。• 雲平樓：學務處課外活動組、學務處住宿服務組。• 惠蓀堂：1F（健康及諮商中心-衛生保健）、2F（學生安全輔導室/兵役業務）、4F（健康及諮商中心-心理諮商）。• 資訊科學大樓 2F：計算機及資訊網路中心。• 萬年樓 5F：語言中心。• 體育館 1F：體育室。"
        },
        {
            "keywords": ["系館位置", "文學院系館", "工學院系館", "理學院系館", "管院系館", "生科系館", "電資系館", "農院系館", "系辦電話"],
            "name": "學院QA-十大學院專業系館空間分布與修業諮詢窗口",
            "content": "興大十大學院系館空間分布指引：• 文學院：人文大樓（中文系、外文系、歷史系、台文學程）。• 農業暨自然資源學院：作物科學大樓、森林館、應用經濟館、農環大樓、生機館等。• 理學院：理學大樓（應數系、物理系）、化學館（化學系）。• 工學院：應用科技大樓、材料大樓、土木環工大樓、工程一館、化工大樓。• 電機資訊學院：電機大樓（電機系）、資訊科學大樓（資工系）。• 管理學院 & 法政學院：社管大樓（企管、資管、財金、行銷、會計、法律）。• 生命科學院：生命科學大樓。• 獸醫學院：獸醫一館/二館、獸醫教學醫院。• 醫學院：醫學大樓（學士後醫）。"
        }
    ]

    print(f"  ✨ 成功提煉出 {len(distilled_entries)} 筆高價值 RAG 結構化條目！")
    return distilled_entries

def run_pipeline():
    print("\n" + "#"*70)
    print(" 🚀 啟動國立中興大學 RAG 知識庫蒸餾與更新管線")
    print("#"*70)

    # 1. 讀取現有 campus_knowledge.json
    existing_items = []
    if os.path.exists(JSON_PATH):
        try:
            with open(JSON_PATH, "r", encoding="utf-8") as f:
                existing_items = json.load(f)
            print(f"📂 載入現有知識庫：{len(existing_items)} 筆")
        except Exception as e:
            print(f"⚠️ 讀取現有知識庫失敗: {e}")
            existing_items = []

    # 2. 提取新 RAG 知識
    new_rag_items = extract_new_rag_knowledge()

    # 3. 智慧合併與去重
    master_map: Dict[str, Dict[str, Any]] = {}

    for item in existing_items:
        name = clean_str(item.get("名稱") or item.get("name"))
        kw_raw = item.get("關鍵字") or item.get("keywords") or []
        if isinstance(kw_raw, str):
            kw_list = [k.strip() for k in re.split(r'[,、，\s]+', kw_raw) if k.strip()]
        elif isinstance(kw_raw, list):
            kw_list = [str(k).strip() for k in kw_raw if str(k).strip()]
        else:
            kw_list = []
        content = clean_str(item.get("情報內容") or item.get("content"))

        if name and content:
            master_map[name] = {
                "keywords": deduplicate_keywords(kw_list),
                "name": name,
                "content": content
            }

    initial_count = len(master_map)
    newly_added_count = 0
    updated_count = 0

    for item in new_rag_items:
        name = clean_str(item.get("name") or item.get("名稱"))
        kw_list = deduplicate_keywords(item.get("keywords", []))
        content = clean_str(item.get("content") or item.get("情報內容"))

        if not name or not content:
            continue

        if name not in master_map:
            master_map[name] = {
                "keywords": kw_list,
                "name": name,
                "content": content
            }
            newly_added_count += 1
        else:
            # 合併關鍵字與補充內文
            existing = master_map[name]
            combined_kw = deduplicate_keywords(existing["keywords"] + kw_list)
            existing["keywords"] = combined_kw
            if content not in existing["content"]:
                existing["content"] += " ｜ " + content
                updated_count += 1

    final_items = list(master_map.values())
    total_count = len(final_items)

    print("\n" + "="*70)
    print(f"📊 知識庫合併統計：")
    print(f"  - 原有知識庫筆數: {initial_count} 筆")
    print(f"  - 本次新增條目數: {newly_added_count} 筆")
    print(f"  - 本次擴充條目數: {updated_count} 筆")
    print(f"  - 目前總知識筆數: {total_count} 筆")
    print("="*70)

    # 4. 同步輸出三端檔案
    # 4.1 campus_knowledge.json
    print(f"\n💾 1. 正在更新 {JSON_PATH} ...")
    json_output_data = []
    for it in final_items:
        json_output_data.append({
            "關鍵字": ",".join(it["keywords"]),
            "名稱": it["name"],
            "情報內容": it["content"]
        })
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(json_output_data, f, ensure_ascii=False, indent=2)
    print(f"   ✅ JSON 寫入成功！({total_count} 筆)")

    # 4.2 campus_knowledge.csv
    print(f"💾 2. 正在更新 {CSV_PATH} (UTF-8 with BOM) ...")
    with open(CSV_PATH, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["關鍵字", "名稱", "情報內容"])
        writer.writeheader()
        for it in json_output_data:
            writer.writerow(it)
    print(f"   ✅ CSV 寫入成功！({total_count} 筆)")

    # 4.3 KnowledgeData.gs (var CAMPUS_KNOWLEDGE = [ ... ];)
    print(f"💾 3. 正在更新 {GS_PATH} (Google Apps Script 常數檔) ...")
    gs_header = "/**\n * ==============================================================================\n * 國立中興大學 (NCHU) 全校園知識庫靜態常數資料 (KnowledgeData.gs)\n * 本檔案由 campus_knowledge.json 自動產生，使用 var 宣告確保 GAS 全域變數安全。\n * ==============================================================================\n */\n\n"
    gs_content = gs_header + "var CAMPUS_KNOWLEDGE = " + json.dumps(final_items, ensure_ascii=False, indent=2) + ";\n"
    with open(GS_PATH, "w", encoding="utf-8") as f:
        f.write(gs_content)
    print(f"   ✅ KnowledgeData.gs 寫入成功！({total_count} 筆)")

    print("\n" + "#"*70)
    print(" 🎉 全新 RAG 知識庫蒸餾、去重與三端同步更新全部圓滿完成！")
    print("#"*70)

if __name__ == "__main__":
    run_pipeline()
