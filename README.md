# 🌲 國立中興大學 (NCHU) 新生生活與行政問答指南 | 新鮮人-興生FAQ

> 專為國立中興大學（NCHU）大一新生與在校生打造的**全方位智慧生活與行政法規指南**。結合互動式生活工具、即時美食地圖、官方規章精確檢索，以及專屬微調開源小模型。

🔗 **線上正式體驗站 (GitHub Pages)**：  
👉 **[https://kalmangoose.github.io/NCHU115_N-GOstudent-demo/](https://kalmangoose.github.io/NCHU115_N-GOstudent-demo/)**

---

## ✨ 核心特色與亮點

### 1. 🎯 興大午餐吃什麼？幸運大轉盤
- **中午限定救星**：專門排除晚上才營業的夜市，精選大一午休 50 分鐘必衝的學府路、圓廳學餐 1-2F、南門路美食與中興湖開玩笑彩蛋！
- **流暢物理動畫**：採用 HTML5 Canvas 搭配三次貝茲曲線（Cubic-bezier）減速旋轉。
- **一鍵詢問 AI**：抽到後可一鍵跳轉問答，自動帶入菜色與學長姐心得。

### 2. 🍜 176 間興大生活與周邊美食地圖
- **0 Token 毫秒級檢索**：涵蓋學府路、南門路、美村南路、大里及忠孝夜市美食。
- **一鍵 Google Maps 導航**：點擊店家卡片即可開啟手機地圖前往。

### 3. 🚲 交通與行政法規嚴格查證
- **真實校規防坑**：校內騎乘腳踏車【完全免辦車證】自由通行；僅住宿生停放宿舍專屬車棚時須向男宿/女宿服務中心申辦識別證。
- **機車最高鐵律**：校園內全面嚴禁騎乘機車，駐警隊 24H 取締鎖車；新生免費停放社管大樓、校門右側與國光忠明路口停車場。

### 4. ⚡ 零伺服器（Zero-Server）自律架構
- 整合 **789 筆經嚴格去重與去敏驗證之興大官方行政規章與校園生活知識庫**，在學生瀏覽器本地記憶體中於 **0.001 秒** 內完成精準檢索。
- 零伺服器負擔、永久免費、不需 API Key、手機開啟秒速響應！

---

## 🧠 開源微調模型庫 (Hugging Face Model Hub)

本專案針對中興大學校園語料進行了端到端的領域微調（Domain Adaptation），並將模型權重全數開源：

| 模型名稱 | 類型 | 參數規模 | Hugging Face / 開源庫 | 說明 |
| :--- | :--- | :--- | :--- | :--- |
| **NCHU-BGE-Small-V2** | 語意檢索 / Embedding | 24M (BGE-Small) | `BAAI/bge-small-zh-v1.5` | 專為中興校園黑話與行政公文設計的向量檢索大腦，支援 30ms 毫秒級檢索 |
| **NCHU-Gemma2-2B-LoRA** | 領域對話 / SLM | 2.6B (LoRA $r=16, \alpha=32$) | `unsloth/gemma-2-2b-it` | Google 輕量小鋼砲，完美適配親切幽默學長姐對話與校園生活導航 |
| **NCHU-Llama3.2-3B-LoRA** | 領域對話 / SLM | 3.2B (LoRA $r=16, \alpha=32$) | `unsloth/Llama-3.2-3B-Instruct` | Meta 輕量開源旗艦，強大指令遵循與多輪對話能力 |
| **NCHU-TAIDE-7B-LoRA** | 台灣在地 / LLM | 7B (LoRA $r=16, \alpha=32$) | `taide/TAIDE-LX-7B-Chat` | 國科會與中研院初代繁中模型，台灣在地用語與公務制度適配 |
| **NCHU-Llama3.1-TAIDE-8B (LoRA & GGUF)** | 台灣主權 AI / 邊緣量化引擎 | 8B (`Q4_K_M` 4.90 GB) | `taide/Llama-3.1-TAIDE-LX-8B-Chat` | 3,183 筆興大語料微調；突破 188,256 繁中擴充詞表 BPE 校驗限制，由 16.25 GB 壓縮為 **4.90 GB 4-bit GGUF** 邊緣運算引擎 |
| **NCHU-Gemma3-TAIDE-12B-LoRA** | 台灣主權 AI / 2026 旗艦 | 12B (QLoRA `bfloat16`) | `taide/Gemma-3-TAIDE-12b-Chat-2602` | 國科會最新 12B 旗艦（A100 微調 Loss 由 `2.60` 收斂至 `0.79`），支援前端「🎭 TAIDE 語氣調色盤」三種學長姐角色切換 |
| **Laya Gateway (0.4.13)** | 極速路由 / 守護閘道 | 輕量特徵閘道器 | Local Rule & Pattern Gate | 30ms 極速分流：24H 校安危急攔截、InBody 體脂贖罪、特約門診、美食輪盤 |

### ⚡ 本機或免費邊緣端一鍵啟動 4-bit GGUF (`Ollama`)
將微調並量化完成之 `nchu_taide_8b_q4_k_m.gguf` (4.90 GB) 放至專案目錄，執行一行指令即可在 Mac (Apple Silicon) 或無獨顯環境秒速啟動興大專屬 AI 學長姐：
```bash
ollama create nchu-taide-8b -f Modelfile.nchu_taide_8b
ollama run nchu-taide-8b "學長好！請問大一新生校內可以騎機車嗎？男宿環境如何？"
```

### 🚀 Python 快速載入 Gemma 2 LoRA 模型
```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

base_model = "unsloth/gemma-2-2b-it"
adapter_id = "./nchu_gemma2_adapter"

tokenizer = AutoTokenizer.from_pretrained(base_model)
model = AutoModelForCausalLM.from_pretrained(base_model, torch_dtype=torch.float16, device_map="auto")
model = PeftModel.from_pretrained(model, adapter_id)

messages = [
    {
        "role": "user",
        "content": (
            "你是國立中興大學的親切學長姐，熟悉校園生活與行政規定。\n"
            "規則：\n"
            "1. 只能根據 <context> 內的資料回答；查不到時請回答「我查不到這題的可靠資料，建議直接洽詢相關處室。」\n"
            "2. 電話、日期、金額、網址必須逐字引用 context，不得自行推算或編造。\n\n"
            "學長姐好！請問興大校內騎腳踏車需要申請車證嗎？"
        )
    }
]
prompt_ids = tokenizer.apply_chat_template(messages, tokenize=True, add_generation_prompt=True, return_dict=False)
inputs = torch.tensor([prompt_ids]).to(model.device)
outputs = model.generate(inputs, max_new_tokens=256)
print(tokenizer.decode(outputs[0][len(prompt_ids):], skip_special_tokens=True))
```

---

## 📜 授權與免責聲明 (License & TAIDE Attribution)
- **Built with TAIDE**：本專案之台灣在地繁中微調模型與衍生量化權重（`NCHU-Llama3.1-TAIDE-8B`、`NCHU-Gemma3-TAIDE-12B`）係基於國家科學及技術委員會（NSTC）與財團法人國家實驗研究院（NARLabs）釋出之 **TAIDE 模型**建構，並嚴格遵循《TAIDE 模型授權同意書》與衍生作品標示規範（Built with TAIDE）。
- 本系統為學生社群與非官方專案，旨在提供新生更友善的校園指引。
- 涉及成績、學籍、繳費截止日等重大手續，請務必以國立中興大學（NCHU）各行政處室最新公告為準。