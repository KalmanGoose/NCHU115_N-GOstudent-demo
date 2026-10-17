from app_rag_colab import respond

for q in ["大一新生可以騎機車進學校嗎？", "忠孝夜市有什麼好吃的"]:
    print(f"\n==================== [TEST QUERY: {q}] ====================")
    full_output = ""
    for chunk in respond(q, []):
        full_output = chunk
    print(full_output)
