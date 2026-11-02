#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) Laya 極速意圖決策與安全風控閘道器
(laya_gateway.py)
==============================================================================
核心架構：
  1. System-1 30ms 極速風控與意圖決策 (Laya Decision Engine)
  2. 危機攔截 (Crisis & Guardrail)：心理緊急、校安自傷在 0.03 秒內極速反饋 24H 專線
  3. 意圖分流 (Intent Routing)：
     - inbody_fitness: 惠蓀堂 1F InBody 體脂計 ＆ 吃貨贖罪挑戰
     - clinic_medical: 23 家 0 元掛號費特約診所 ＆ 校內駐診醫師
     - food_guide: 302 家興大周邊美食輪盤與夜市導航
     - campus_slm: 轉發至微調後之 Google Gemma 2 進行深度問答
==============================================================================
"""

import time
import json
from typing import Dict, Any

class NCHULayaGateway:
    def __init__(self):
        print("⚡ [Laya Gateway] 初始化中興大學 30ms 極速意圖分流與安全護欄引擎...")
        self.routes = [
            "crisis_safety",       # 心理危機/校安急救/違規安全
            "inbody_fitness",      # InBody 體脂計/基礎代謝/減脂贖罪
            "clinic_medical",      # 0元掛號特約診所/校醫駐診
            "food_guide",          # 美食搜尋/宵夜/必吃推薦
            "campus_qa"            # 轉發微調大模型 (Gemma 2 / SLM)
        ]

    def route_request(self, user_query: str) -> Dict[str, Any]:
        """以 30ms 速度執行高階意圖判定與安全過濾"""
        t0 = time.time()
        q = user_query.strip()
        q_lower = q.lower()

        # 1. 🚨 第一優先級：安全與心理危機攔截 (0 Token 延遲保護)
        crisis_kws = ["想不開", "自殺", "自殘", "不想活", "絕望", "憂鬱想要死", "救命", "被跟蹤", "性騷擾", "車禍受傷"]
        if any(k in q for k in crisis_kws):
            dt = (time.time() - t0) * 1000
            return {
                "route": "crisis_safety",
                "latency_ms": round(dt, 2),
                "action": "INTERCEPT_CRISIS",
                "response": (
                    "🚨 **【中興大學 24H 緊急校安與安心守護專線】**\n\n"
                    "同學請先深呼吸，我們都在這裡陪你，請立刻撥打以下電話尋求即時協助：\n"
                    "- 📞 **校安中心 24H 緊急專線**：`(04) 2287-0885`（全天候專人即時出動）\n"
                    "- 💖 **惠蓀堂 4F 心理諮商組**：`(04) 2284-0241`（日間駐校心理師緊急晤談）\n"
                    "- 🚑 **衛保組緊急醫療救護**：`(04) 2284-0235`\n"
                    "- 🆘 **衛福部 24 小時安心專線**：`1925`（依舊愛我，手機直撥免費）\n\n"
                    "你絕不是孤單一人，請讓我們協助你！"
                )
            }

        # 2. ⚖️ 第二優先級：InBody 體脂計 ＆ 吃貨贖罪挑戰
        inbody_kws = ["體脂", "inbody", "量體重", "贖罪", "基礎代謝", "bmr", "bmi", "減肥", "減脂", "體健班", "吃太胖"]
        if any(k in q_lower for k in inbody_kws):
            dt = (time.time() - t0) * 1000
            return {
                "route": "inbody_fitness",
                "latency_ms": round(dt, 2),
                "action": "TRIGGER_INBODY_MODAL",
                "response": (
                    "⚖️ **【惠蓀堂 1F 免費 InBody 體脂檢測 ＆ 吃貨贖罪挑戰】**\n\n"
                    "- 📍 **地點**：惠蓀堂 1 樓 衛生保健組（自主測量區）\n"
                    "- 💰 **費用**：**完全免費！**（外面健身房測一次 200~300 元）\n"
                    "- 🕒 **時間**：週一至週五 08:30 - 17:00（脫襪赤腳測量）\n"
                    "- 🥗 **體健班**：曾由校內知名特聘教授受邀代言支持，每學期有專業營養師指導控卡與體態雕塑！"
                )
            }

        # 3. 🏥 第三優先級：0 元掛號費特約診所 ＆ 校內駐診醫師
        clinic_kws = ["診所", "掛號費", "特約", "看病", "牙痛", "洗牙", "補牙", "皮膚科", "耳鼻喉", "中醫", "駐診", "校醫"]
        if any(k in q for k in clinic_kws):
            dt = (time.time() - t0) * 1000
            return {
                "route": "clinic_medical",
                "latency_ms": round(dt, 2),
                "action": "OPEN_CLINIC_NAV",
                "response": (
                    "🏥 **【興大特約醫療院所 0 元掛號費 ＆ 校內免費駐診導航】**\n\n"
                    "- 🎁 **專屬福利**：出示中興大學學生證，周邊 **23 家特約診所/醫院門診免收掛號費**！\n"
                    "- 🩺 **校內免費駐診**：惠蓀堂 1F 衛保組週一至五每日有專科醫師免健保卡免費諮詢：\n"
                    "  - 週一：家醫科/婦產科（許維邦 醫師）\n"
                    "  - 週二：一般外科（王志浩 醫師）\n"
                    "  - 週三：腸胃肝膽科（黃俊彥 醫師）\n"
                    "  - 週四：復健科（黃韻琴 醫師）\n"
                    "  - 週五：耳鼻喉科（施教煌 醫師）"
                )
            }

        # 4. 🍜 第四優先級：興大周邊美食推薦
        food_kws = ["吃什麼", "美食", "午餐", "晚餐", "宵夜", "學府路", "南門路", "忠孝夜市", "永東街", "紅線茶舖", "好吃"]
        if any(k in q for k in food_kws):
            dt = (time.time() - t0) * 1000
            return {
                "route": "food_guide",
                "latency_ms": round(dt, 2),
                "action": "SPIN_FOOD_SLOT",
                "response": (
                    "🍜 **【興大美食導航 ＆ 302 間精選完全體】**\n"
                    "已為你鎖定興大在地學長姐私房美食庫！學府路、南門路、永東街與忠孝夜市任你挑選，"
                    "吃完罪惡感太重還可以到惠蓀堂 1F 免費量 InBody 體脂計喔！"
                )
            }

        # 5. 🤖 轉發給微調後之 Google Gemma 2 (SLM)
        dt = (time.time() - t0) * 1000
        return {
            "route": "campus_qa",
            "latency_ms": round(dt, 2),
            "action": "FORWARD_TO_GEMMA2_SLM",
            "response": "轉發給微調後的 Google Gemma 2 領域語言模型進行生成回答。"
        }

if __name__ == "__main__":
    gateway = NCHULayaGateway()
    test_queries = [
        "學長救命，我期中考快被當了心情好絕望想不開...",
        "剛在學府路吃完炸雞排超罪惡，學校哪裡可以免費量 InBody 體脂？",
        "我牙齒痛到快死掉，興大附近哪家牙醫免掛號費？",
        "半夜趕報告肚子餓，學府路附近有什麼推薦的宵夜？",
        "大一必修如果被當掉，可以大二再重修嗎？"
    ]
    print("\n" + "=" * 65)
    print("⚡ [Laya 30ms 極速分流與安全風控驗證測試]")
    print("=" * 65)
    for q in test_queries:
        res = gateway.route_request(q)
        print(f"❓ [學生提問]: {q}")
        print(f"⏱️ [Laya 延遲]: {res['latency_ms']} ms | 🎯 [決策路徑]: {res['route']} ({res['action']})")
        print(f"💡 [即時輸出/動作]:\n{res['response']}")
        print("-" * 65)
