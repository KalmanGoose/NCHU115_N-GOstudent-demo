from app_qwen_colab import respond

print(">>> Testing respond function with question...")
output = ""
for chunk in respond("你好，請問大一新生可以騎機車進學校嗎？", []):
    output += chunk
    print(chunk, end="", flush=True)

print("\n\n>>> SUCCESS! Generation complete. Total chars:", len(output))
