#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) Laya 終端互動測試工具 (laya_interactive.py)
==============================================================================
使用方式：
  python3 laya_interactive.py
輸入任何語句，實測 30ms 意圖分流、安全護欄與大模型派發！
輸入 exit 或 q 即可離開。
==============================================================================
"""

import sys
import time
from laya_gateway import NCHULayaGateway

def main():
    gateway = NCHULayaGateway()
    print("\n" + "=" * 65)
    print("🌲 中興大學 Laya 極速分流與安全風控終端測試器 (輸入 'q' 退出)")
    print("=" * 65)
    
    while True:
        try:
            query = input("\n💬 請輸入測試語句 > ").strip()
            if not query:
                continue
            if query.lower() in ["q", "exit", "quit"]:
                print("👋 感謝測試 Laya，掰掰！")
                break
            
            res = gateway.route_request(query)
            print("-" * 65)
            print(f"⏱️ [Laya 延遲]: \033[92m{res['latency_ms']} ms\033[0m")
            print(f"🎯 [路由分類]: \033[94m{res['route']}\033[0m")
            print(f"⚡ [觸發動作]: \033[93m{res['action']}\033[0m")
            print(f"💡 [即時輸出]:\n{res['response']}")
            print("-" * 65)
        except (KeyboardInterrupt, EOFError):
            print("\n👋 結束測試。")
            break

if __name__ == "__main__":
    main()
