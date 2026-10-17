import json
import csv
import os
import torch
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "campus_knowledge.json")
CSV_PATH = os.path.join(BASE_DIR, "campus_knowledge.csv")
GS_PATH = os.path.join(BASE_DIR, "KnowledgeData.gs")
EMB_PATH = os.path.join(BASE_DIR, "corpus_embeddings.pt")
MODEL_DIR = os.path.join(BASE_DIR, "nchu_bge_small_model")

with open(JSON_PATH, "r", encoding="utf-8") as f:
    kb = json.load(f)

# 更新現有通則
for item in kb:
    if item["名稱"] == "機車通行證申請與停車規則":
        item["情報內容"] = (
            "【中興大學學生機車通行與停車通則】：\n"
            "1. 學生機車嚴禁騎入校園核心行人區（違規將被駐警隊鎖車開罰）。\n"
            "2. 大一新生第一學期通常無法申請校內機車通行證。\n"
            "3. 【沒車證可停的三大校園周圍免費機車停車場】：\n"
            "   • 社管大樓/雲平樓旁機車停車場（近文社管院、辦公處室）：https://maps.app.goo.gl/CJfqT9FqssFTvkV37?g_st=ic\n"
            "   • 校門口右側停車棚（近學府路大門、行政大樓）：https://maps.app.goo.gl/YP8jjduPuvnELR8s6?g_st=ic\n"
            "   • 國光路與忠明南路口停車場（通往機械系館、工學院、游泳池）：https://maps.app.goo.gl/ekNaz31T5NPfbVq38?g_st=ic\n"
            "4. 有車證者可依規定停放於各指定學生專屬停車棚。"
        )
        item["關鍵字"] += ",大一沒車證停哪,免費機車停車場,停車場地圖,不用車證的停車場"

# 新增 3 個具體停車場獨立條目
new_parking_entries = [
    {
        "關鍵字": "社管大樓停車場,雲平樓停車場,社管院機車停車,雲平樓機車,免費停車場社管,文學院停車,社管大樓機車格",
        "名稱": "興大免費機車停車場-社管大樓與雲平樓旁",
        "情報內容": (
            "【社管大樓／雲平樓旁機車停車場】：\n"
            "• 位置：位於社管大樓與雲平樓（學務處、生輔組、課外組所在地）側邊。\n"
            "• 適用對象：社管學院、文學院學生上課，或前往雲平樓辦理就學貸款、學雜費減免等行政業務者。\n"
            "• 車證限制：免申請校內通行證，完全免費自由停放。\n"
            "• 地圖導航：https://maps.app.goo.gl/CJfqT9FqssFTvkV37?g_st=ic"
        ),
        "direct": True
    },
    {
        "關鍵字": "校門口停車場,大門口機車停車場,學府路停車場,大門右側機車,免費停車大門,行政大樓機車停車",
        "名稱": "興大免費機車停車場-校門口右側停車棚（學府路大門側）",
        "情報內容": (
            "【興大大門口右側機車停車棚】：\n"
            "• 位置：興大正校門口右側外圍，緊鄰學府路商圈與行政大樓。\n"
            "• 適用對象：大一新生日常通勤、前往行政大樓或下課至學府路用餐時最常用之大型停車區。\n"
            "• 車證限制：免申請校內通行證，完全免費自由停放。\n"
            "• 地圖導航：https://maps.app.goo.gl/YP8jjduPuvnELR8s6?g_st=ic"
        ),
        "direct": True
    },
    {
        "關鍵字": "國光路忠明南路停車場,機械系停車場,工學院機車停車,游泳池停車場,體育場停車,國光路側門機車",
        "名稱": "興大免費機車停車場-國光路與忠明南路口（通往游泳池與機械館）",
        "情報內容": (
            "【國光路與忠明南路交叉口機車停車場】：\n"
            "• 位置：位於國光路與忠明南路交界處之校園側門。\n"
            "• 適用對象：工學院（機械系等）、電資學院，或前往游泳池、體育場活動之學生。\n"
            "• 特色：由該處側門可直接步行通往機械系館與體育運動區，免去繞行大門之麻煩。\n"
            "• 車證限制：免申請校內通行證，完全免費自由停放。\n"
            "• 地圖導航：https://maps.app.goo.gl/ekNaz31T5NPfbVq38?g_st=ic"
        ),
        "direct": True
    }
]

# 去重加入
existing_names = {x["名稱"] for x in kb}
for entry in new_parking_entries:
    if entry["名稱"] not in existing_names:
        kb.append(entry)

print(f"更新後條目數: {len(kb)}")

# 覆蓋檔案
with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(kb, f, ensure_ascii=False, indent=2)

fieldnames = ["名稱", "情報內容", "關鍵字", "direct"]
with open(CSV_PATH, "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in kb:
        writer.writerow(row)

with open(GS_PATH, "w", encoding="utf-8") as f:
    f.write("// Google Apps Script Knowledge Base generated from campus_knowledge.json\n")
    f.write("var CAMPUS_KNOWLEDGE = " + json.dumps(kb, ensure_ascii=False, indent=2) + ";\n")

# 重算向量
print("正在更新神經向量索引...")
model = SentenceTransformer(MODEL_DIR, device="cpu")
corpus_texts = [f"【{x.get('名稱', '')}】{x.get('情報內容', '')}" for x in kb]
embs = model.encode(corpus_texts, convert_to_tensor=True, show_progress_bar=False, device="cpu")
torch.save(embs, EMB_PATH)
print("向量更新完畢，shape:", embs.shape)
