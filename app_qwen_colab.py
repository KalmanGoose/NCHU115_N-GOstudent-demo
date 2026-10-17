import os
import torch
import gradio as gr
from threading import Thread
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer
from peft import PeftModel

BASE_MODEL_ID = "Qwen/Qwen2.5-0.5B-Instruct"
ADAPTER_PATH = "/content/nchu_qwen_adapter"

print("🚀 正在載入 Qwen2.5-0.5B-Instruct 基底模型與中興學長姐微調權重...")
device = "cuda" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_ID, trust_remote_code=True)
base_model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL_ID,
    torch_dtype=torch_dtype,
    device_map="auto" if torch.cuda.is_available() else None,
    trust_remote_code=True
)

if os.path.exists(ADAPTER_PATH):
    print(f"📦 正在掛載 LoRA 微調 Adapter: {ADAPTER_PATH}")
    model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
else:
    print(f"⚠️ 未找到 Adapter 目錄 ({ADAPTER_PATH})，使用原始模型。")
    model = base_model

model.eval()
print(f"✅ 模型加載完成！運行設備: {device}")

SYSTEM_PROMPT = (
    "你是國立中興大學（NCHU）的熱心學長姐 AI，專門為中興大學的新生與在校生解答校園生活、"
    "選課規則、宿舍生活、交通、校園周邊美食與社團活動等問題。"
    "請以熱情、親切且有同理心的學長姐口吻回答，並給予清晰實用的建議。"
)

def respond(message, history):
    if not message.strip():
        yield "請輸入你想詢問中興學長姐的問題喔！"
        return

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    if history:
        for item in history:
            if isinstance(item, (list, tuple)):
                u, a = item
                if u:
                    messages.append({"role": "user", "content": str(u)})
                if a:
                    messages.append({"role": "assistant", "content": str(a)})
            elif isinstance(item, dict):
                messages.append(item)

    messages.append({"role": "user", "content": message})

    encodings = tokenizer.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt",
        return_dict=True
    ).to(model.device)

    streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)
    generation_kwargs = dict(
        input_ids=encodings["input_ids"],
        attention_mask=encodings["attention_mask"],
        streamer=streamer,
        max_new_tokens=512,
        temperature=0.7,
        top_p=0.9,
        do_sample=True,
        repetition_penalty=1.1,
    )

    thread = Thread(target=model.generate, kwargs=generation_kwargs)
    thread.start()

    partial_text = ""
    for new_text in streamer:
        partial_text += new_text
        yield partial_text

custom_css = """
footer {visibility: hidden}
.gradio-container {max-width: 720px !important; margin: 0 auto !important;}
"""

demo = gr.ChatInterface(
    fn=respond,
    title="🌲 興大新生指南 - 中興學長姐 AI",
    description="專為中興大學學生打造的微調大模型 (Qwen2.5-0.5B LoRA)。可以直接在手機瀏覽器提問選課、宿舍、生活等問題！",
    examples=[
        "大一新生可以騎機車進學校嗎？",
        "大一英文可以免修嗎？標準是什麼？",
        "男宿跟女宿門禁時間是幾點？可以外宿嗎？",
        "學期初棄選跟期中退選有什麼差別？",
        "忠明南路地下道或忠孝夜市有什麼推薦的美食？"
    ]
)

if __name__ == "__main__":
    print("🌐 正在啟動 Gradio 公網分享服務 (share=True)...")
    demo.launch(share=True, inbrowser=False)
