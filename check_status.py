import os, re, subprocess

log_path = "/content/train_gemma2_lora_colab.log"
with open(log_path, "rb") as f:
    f.seek(max(0, f.seek(0, 2) - 4000))
    chunk = f.read().decode("utf-8", errors="ignore")

# Find the latest step
matches = re.findall(r'(\d+)/1074\s*\[([^\]]+)\]', chunk)
if matches:
    latest_step, progress_info = matches[-1]
    pct = round(int(latest_step) / 1074 * 100, 1)
    print(f"當前步數: {latest_step} / 1074 ({pct}%)")
    print(f"訓練耗時與速度: {progress_info}")
    
    # 計算預估剩餘時間
    step_num = int(latest_step)
    rem_steps = 1074 - step_num
    print(f"已完成步數: {step_num} 步 | 剩餘: {rem_steps} 步")
    
# GPU 負載狀況
gpu_info = subprocess.check_output(["nvidia-smi", "--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw", "--format=csv,noheader"]).decode().strip()
print(f"GPU 即時負載: {gpu_info}")
