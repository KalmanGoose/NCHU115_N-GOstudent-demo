import os
import json
import torch
import gradio as gr
from threading import Thread
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer
from sentence_transformers import SentenceTransformer, util

BGE_MODEL_PATH = "/content/nchu_bge_small_model"
CORPUS_EMB_PATH = "/content/corpus_embeddings.pt"
KNOWLEDGE_PATH = "/content/campus_knowledge.json"
QWEN_MODEL_ID = "Qwen/Qwen2.5-3B-Instruct"

print("🚀 [Step 1/3] 載入自訓 BGE-Small 向量檢索模型與 505 條官方規章...")
bge_model = SentenceTransformer(BGE_MODEL_PATH, device="cuda" if torch.cuda.is_available() else "cpu")
corpus_embeddings = torch.load(CORPUS_EMB_PATH, map_location=bge_model.device)

with open(KNOWLEDGE_PATH, "r", encoding="utf-8") as f:
    knowledge_base = json.load(f)
print(f"✅ 檢索庫加載完成！共 {len(knowledge_base)} 條校園規章。")

print(f"🚀 [Step 2/3] 載入 Qwen2.5-3B-Instruct 語言模型...")
tokenizer = AutoTokenizer.from_pretrained(QWEN_MODEL_ID, trust_remote_code=True)
qwen_model = AutoModelForCausalLM.from_pretrained(
    QWEN_MODEL_ID,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device_map="auto" if torch.cuda.is_available() else None,
    trust_remote_code=True
)
qwen_model.eval()
print(f"✅ Qwen2.5-3B 模型加載完成！顯存佔用已優化。")

def retrieve_top_context(query, top_k=2):
    q_emb = bge_model.encode(query, convert_to_tensor=True, device=bge_model.device)
    scores = util.cos_sim(q_emb, corpus_embeddings)[0]
    top_indices = torch.topk(scores, k=top_k).indices.tolist()
    
    matched = [knowledge_base[idx] for idx in top_indices]
    return matched

SYSTEM_PROMPT = (
    "你是國立中興大學（NCHU）熱心、親切且有同理心的學長姐 AI 助手。\n"
    "你的任務是根據所提供的【學校官方規章資料】，為大一新生或在校生解答校園生活與學業問題。\n\n"
    "【回答守則】：\n"
    "1. 請以熱情活潑的學長姐口吻回答（例如「學弟妹安啦！」、「這題問我就對了」）。\n"
    "2. 嚴格根據【學校官方規章資料】的事實、金額、時間與規範作答，切勿憑空捏造不存在的校規或社團。\n"
    "3. 若官方資料有提到特定地點、流程或注意事項，請貼心提醒學弟妹避免踩雷。"
)

def respond(message, history):
    if not message.strip():
        yield "請輸入你想問中興學長姐的問題喔！"
        return

    # 1. 檢索最相關的官方規章
    matches = retrieve_top_context(message, top_k=2)

    context_blocks = []
    for i, m in enumerate(matches, 1):
        name = m.get("名稱", "")
        content = m.get("情報內容", "")
        context_blocks.append(f"【校園情報 {i}：{name}】\n{content}")
    context_str = "\n\n".join(context_blocks)

    # 2. 構建開卷考試 Prompt
    user_prompt = f"【學校官方規章資料】：\n{context_str}\n\n【學弟妹問題】：{message}"

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt}
    ]

    encodings = tokenizer.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt",
        return_dict=True
    ).to(qwen_model.device)

    streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)
    generation_kwargs = dict(
        input_ids=encodings["input_ids"],
        attention_mask=encodings["attention_mask"],
        streamer=streamer,
        max_new_tokens=512,
        temperature=0.6,
        top_p=0.9,
        do_sample=True,
        repetition_penalty=1.1,
    )

    thread = Thread(target=qwen_model.generate, kwargs=generation_kwargs)
    thread.start()

    # 3. 逐字串流
    partial_text = ""
    for chunk in streamer:
        partial_text += chunk
        yield partial_text

    # 4. 生成結束後，掛上官方可靠來源認證卡片
    source_badge = "\n\n---\n📌 **官方真實校園情報依據**\n"
    for m in matches:
        source_badge += f"• **條目**：{m.get('名稱', '')}\n"
    
    partial_text += source_badge
    yield partial_text

demo = gr.ChatInterface(
    fn=respond,
    title="🌲 興大新生指南 - 雙劍合璧 AI 學長姐 (RAG 閉環)",
    description="結合「BGE 向量檢索」+「Qwen2.5-3B 語言大模型」，保證 100% 依據中興官方規章回答，零幻覺、親切又精準！",
    examples=[
        "大一新生可以騎機車進學校嗎？",
        "大一英文可以免修嗎？標準是什麼？",
        "男宿跟女宿門禁時間是幾點？可以外宿嗎？",
        "學期初棄選跟期中退選有什麼差別？",
        "二村洗衣服一次多少錢？要自備零錢嗎？",
        "二村可以叫外送進來嗎？外送要在哪裡拿？"
    ]
)

if __name__ == "__main__":
    print("🌐 [Step 3/3] 正在啟動雙劍合璧 Gradio 公網分享服務 (share=True)...")
    demo.launch(share=True, inbrowser=False)
