# 🌲 國立中興大學 (NCHU) 新生生活與行政問答指南 | 興生 N-GO 助手

> 專為國立中興大學（NCHU）大一新生與在校生打造的**全方位智慧生活與行政法規指南**。結合互動式生活工具、即時美食地圖、官方規章精確檢索，以及專屬微調開源小模型。

🔗 **線上正式體驗站 (GitHub Pages)**：  
👉 **[https://kalmangoose.github.io/NCHU115_N-GOstudent-demo/](https://kalmangoose.github.io/NCHU115_N-GOstudent-demo/)**

---

## ✨ 核心特色與亮點

### 1. 🎯 興大午餐吃什麼？幸運大轉盤
- **中午限定救星**：專門排除晚上才營業的夜市，精選大一午休 50 分鐘必衝的學府路、圓廳學餐 1-2F、南門路美食與中興湖開玩笑彩蛋！
- **流暢物理動畫**：採用 HTML5 Canvas 搭配三次貝茲曲線（Cubic-bezier）減速旋轉。
- **一鍵詢問 AI**：抽到後可一鍵跳轉問答，自動帶入菜色與學長姐心得。

### 2. 🍜 140+ 興大生活與周邊美食地圖
- **0 Token 毫秒級檢索**：涵蓋學府路、南門路、美村南路、大里及忠孝夜市美食。
- **一鍵 Google Maps 導航**：點擊店家卡片即可開啟手機地圖前往。

### 3. 🚲 交通與行政法規嚴格查證
- **真實校規防坑**：校內騎乘腳踏車【完全免辦車證】自由通行；僅住宿生停放宿舍專屬車棚時須向男宿/女宿服務中心申辦識別證。
- **機車最高鐵律**：校園內全面嚴禁騎乘機車，駐警隊 24H 取締鎖車；新生免費停放社管大樓、校門右側與國光忠明路口停車場。

### 4. ⚡ 零伺服器（Zero-Server）自律架構
- 整合 **1,066 筆興大官方行政規章與校園生活知識庫**，在學生瀏覽器本地記憶體中於 **0.001 秒** 內完成精準檢索。
- 零伺服器負擔、永久免費、不需 API Key、手機開啟秒速響應！

---

## 🧠 開源微調模型庫 (Hugging Face Model Hub)

本專案針對中興大學校園語料進行了端到端的領域微調（Domain Adaptation），並將模型權重全數開源：

| 模型名稱 | 類型 | 參數規模 | Hugging Face 模型庫連結 | 說明 |
| :--- | :--- | :--- | :--- | :--- |
| **NCHU-BGE-Small-V2** | 語意檢索 / Embedding | 24M (BGE-Small) | [NCHUPPBL/nchu-bge-small-v2](https://huggingface.co/NCHUPPBL/nchu-bge-small-v2) | 專為中興校園黑話與行政公文設計的向量檢索大腦，支援 HF Serverless Inference API |
| **NCHU-Qwen2.5-3B-LoRA** | 領域對話 / LLM | 3B (LoRA $r=16, \alpha=32$) | [NCHUPPBL/nchu-qwen2.5-3b-lora](https://huggingface.co/NCHUPPBL/nchu-qwen2.5-3b-lora) | 基於 Qwen2.5-3B-Instruct 微調之學長姐語氣生成模型權重 |

### 🚀 Python 快速載入 3B LoRA 模型
```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

base_model = "Qwen/Qwen2.5-3B-Instruct"
adapter_id = "NCHUPPBL/nchu-qwen2.5-3b-lora"

tokenizer = AutoTokenizer.from_pretrained(base_model)
model = AutoModelForCausalLM.from_pretrained(base_model, torch_dtype=torch.bfloat16, device_map="auto")
model = PeftModel.from_pretrained(model, adapter_id)

messages = [
    {"role": "system", "content": "你是國立中興大學的親切學長姐，熟悉校園生活與行政規定。"},
    {"role": "user", "content": "學長姐好！請問興大校內騎腳踏車需要申請車證嗎？"}
]
inputs = tokenizer(tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True), return_tensors="pt").to(model.device)
outputs = model.generate(**inputs, max_new_tokens=256)
print(tokenizer.decode(outputs[0][len(inputs.input_ids[0]):], skip_special_tokens=True))
```

---

## 📜 授權與免責聲明
- 本系統為學生社群與非官方專案，旨在提供新生更友善的校園指引。
- 涉及成績、學籍、繳費截止日等重大手續，請務必以國立中興大學（NCHU）各行政處室最新公告為準。