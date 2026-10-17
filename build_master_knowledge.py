#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
國立中興大學 (NCHU) 全景高粒度校園知識庫 Master 建置主腳本 (build_master_knowledge.py)
==============================================================================

本腳本自動依序執行：
  1. 萃取通識問卷 (General Education Survey):
     - 聚合 141 門課程評價，並對多人評鑑課程細拆獨立修課心得。
  2. 萃取日常與官方文件 (PDFs, RTF, TXT, RAG 知識庫):
     - 解析各一級行政處室、二級組別、十大學院系所辦公室。
     - 解析 28 筆關鍵校曆時程節點。
     - 解析 20 筆特約醫療院所與專科門診減免。
     - 解析 20 筆特約企業品牌、科技、旅宿與餐飲優惠。
     - 解析 25 筆學生社團與學生自治組織。
     - 解析 24 筆宿舍生活、齋別配置、門禁與設備規範。
     - 解析 30 筆學則、學分、大一二英文、AI程式、微學分與畢業門檻。
     - 解析 47 筆學長姐真實避坑與求生現場對話。
  3. 「關鍵字雷達」超展開 (Keyword Expansion Radar):
     - 每筆條目強制產出 8~15 個高覆蓋度複合關鍵字（涵蓋學術名稱、口語問法、情境動詞、常見錯別字）。
  4. 同步三端輸出：
     - campus_knowledge.json (標準 JSON 陣列)
     - campus_knowledge.csv (UTF-8-SIG，相容 Excel / Google Sheets / GAS)
     - KnowledgeData.gs (宣告 var CAMPUS_KNOWLEDGE = [ ... ];)
==============================================================================
"""

import os
import sys
from generate_comprehensive_knowledge import run_build

if __name__ == "__main__":
    run_build()
