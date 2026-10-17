/**
 * ==============================================================================
 * 國立中興大學 (NCHU) 新生問答助手 - 後端 GAS 核心程式碼
 * 【雙平台自動分流 (Gemini / OpenAI) + Direct 快速通道 + IDF 檢索升級版】
 * ==============================================================================
 */

const CONFIG = {
  GEMINI_MODEL: "gemini-3.6-flash",    // 主力 Gemini 模型
  FALLBACK_MODEL: "gemini-1.5-flash",  // 備用 Gemini 模型
  OPENAI_MODEL: "gpt-4o-mini",         // 預設 OpenAI 模型
  MAX_SEARCH_RESULTS: 3,
  MAX_CONTENT_LENGTH_PER_ITEM: 350,
  MAX_HISTORY_TURNS: 2,
  MAX_OUTPUT_TOKENS: 1648
};

const STOPWORDS = ["請問", "想問", "中興", "中興大學", "新生", "大家", "有沒有", "推薦", "老師", "可以", "怎麼", "如何", "甚麼", "什麼"];

let _IDF_CACHE = null;

function doGet(e) {
  const kb = getKnowledgeBase();
  return createJsonResponse({
    status: "ok",
    message: "🌲 國立中興大學 (NCHU) 新生問答助手 API 運作中 (Auto-Routing & Direct Channel)！",
    total_knowledge_items: kb.length,
    supported_providers: ["gemini", "openai", "groq", "deepseek", "custom"],
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    let postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        postData = {};
      }
    }

    const question = String(postData.message || postData.question || postData.query || postData.text || "").trim();
    const apiKey = String(postData.apiKey || postData.key || postData.geminiApiKey || "").trim();
    const provider = String(postData.provider || "auto").toLowerCase().trim();
    const model = String(postData.model || "").trim();
    const baseUrl = String(postData.baseUrl || "").trim();
    const history = Array.isArray(postData.history) ? postData.history : [];

    if (!apiKey) {
      return createJsonResponse({
        status: "error",
        error: "未偵測到 API Key，請先於前端右上角設定中填入",
        message: "未偵測到 API Key，請先於前端右上角設定中填入"
      });
    }

    if (!question) {
      return createJsonResponse({
        status: "error",
        error: "未收到有效的使用者訊息",
        message: "未收到有效的使用者訊息"
      });
    }

    // 1. 檢索最相關知識 (IDF + N-gram)
    const scoredResults = searchRelevantKnowledge(question, CONFIG.MAX_SEARCH_RESULTS);
    const relevantKnowledge = scoredResults.map(r => r.item);

    // 2. Direct 快速通道檢查（系群連結、固定單一回答直接回傳，Bypass LLM）
    if (scoredResults.length > 0) {
      const top = scoredResults[0];
      const secondScore = scoredResults.length > 1 ? scoredResults[1].score : 0;
      
      if (top.item.direct && (top.score >= 30 || top.score > secondScore * 1.5)) {
        return createJsonResponse({
          status: "success",
          reply: top.item.content,
          message: top.item.content,
          sources: [{ name: top.item.name }],
          direct_hit: true
        });
      }
    }

    // 3. 組裝 System Prompt
    const systemPrompt = buildConciseSystemPrompt(relevantKnowledge);

    // 4. 呼叫 LLM (具備金鑰前綴自動分流與多平台轉接)
    const replyText = callLlmApi(systemPrompt, apiKey, history, question, provider, model, baseUrl);

    return createJsonResponse({
      status: "success",
      reply: replyText,
      message: replyText,
      sources: relevantKnowledge.map(k => ({ name: k.name, keywords: k.keywords }))
    });

  } catch (err) {
    Logger.log("doPost Error: " + (err.message || err.toString()));
    return createJsonResponse({
      status: "error",
      error: "伺服器處理時發生錯誤: " + (err.message || err.toString()),
      message: "伺服器處理時發生錯誤: " + (err.message || err.toString())
    });
  }
}

/**
 * 組合雙軌知識庫 (自動去重並保證手動維護區優先)
 */
function getKnowledgeBase() {
  const autoKB = (typeof CAMPUS_KNOWLEDGE !== 'undefined' && Array.isArray(CAMPUS_KNOWLEDGE)) ? CAMPUS_KNOWLEDGE : [];
  const manualKB = (typeof FRESHMAN_KNOWLEDGE !== 'undefined' && Array.isArray(FRESHMAN_KNOWLEDGE)) ? FRESHMAN_KNOWLEDGE : [];
  
  if (manualKB.length === 0 && autoKB.length === 0) return [];

  function normalize(item) {
    if (!item) return null;
    const name = item.name || item.名稱;
    if (!name) return null;
    return {
      name: String(name).trim(),
      content: String(item.content || item.情報內容 || "").trim(),
      keywords: item.keywords || item.關鍵字 || "",
      direct: item.direct === true
    };
  }

  const map = {};
  autoKB.forEach(it => {
    const norm = normalize(it);
    if (norm) map[norm.name] = norm;
  });
  manualKB.forEach(it => {
    const norm = normalize(it);
    if (norm) {
      map[norm.name] = Object.assign({}, map[norm.name] || {}, norm);
    }
  });
  
  const result = [];
  Object.keys(map).forEach(k => {
    result.push(map[k]);
  });
  return result;
}

/**
 * 計算並快取關鍵字 IDF 權重
 */
function getIdfMap() {
  if (_IDF_CACHE) return _IDF_CACHE;
  const kb = getKnowledgeBase();
  const N = kb.length || 1;
  const df = {};

  kb.forEach(item => {
    const seen = {};
    const kws = Array.isArray(item.keywords) ? item.keywords : (typeof item.keywords === 'string' ? item.keywords.split(/[,、，\s]+/) : []);
    kws.forEach(rawK => {
      const k = String(rawK || "").toLowerCase().trim();
      if (k && !seen[k]) {
        seen[k] = true;
        df[k] = (df[k] || 0) + 1;
      }
    });
  });

  const idf = {};
  Object.keys(df).forEach(k => {
    idf[k] = Math.log((N + 1) / df[k]) + 1;
  });

  _IDF_CACHE = idf;
  return idf;
}

/**
 * IDF + N-gram 關聯度評分檢索
 */
function searchRelevantKnowledge(query, maxResults) {
  const kb = getKnowledgeBase();
  if (!kb || kb.length === 0) return [];

  const cleanQuery = String(query || "").toLowerCase().trim();
  if (!cleanQuery) return [];

  const idfMap = getIdfMap();
  const limit = maxResults || 3;
  const scoredItems = [];

  // 產生 2-gram / 3-gram 片段
  let queryWithoutStop = cleanQuery;
  STOPWORDS.forEach(w => { queryWithoutStop = queryWithoutStop.split(w).join(""); });
  const grams = [];
  for (let len = 3; len >= 2; len--) {
    for (let s = 0; s <= queryWithoutStop.length - len; s++) {
      grams.push(queryWithoutStop.substring(s, s + len));
    }
  }

  for (let i = 0; i < kb.length; i++) {
    const item = kb[i];
    if (!item) continue;

    let score = 0;
    let kws = Array.isArray(item.keywords) ? item.keywords : (typeof item.keywords === 'string' ? item.keywords.split(/[,、，\s]+/) : []);
    kws = kws.map(k => String(k || "").toLowerCase().trim()).filter(Boolean);

    const nameLower = String(item.name || "").toLowerCase();
    const contentLower = String(item.content || "").toLowerCase();

    // 1. 關鍵字比對（結合 IDF 加權）
    for (let j = 0; j < kws.length; j++) {
      const k = kws[j];
      if (k && cleanQuery.includes(k)) {
        const weight = idfMap[k] || 2.0;
        score += 15 * weight;
      }
    }

    // 2. 名稱比對
    if (nameLower && (cleanQuery.includes(nameLower) || nameLower.includes(cleanQuery))) {
      score += 25;
    }

    // 3. 內文 Gram 滑動比對（上限 16 分，防長文洗分）
    let gramHits = 0;
    for (let g = 0; g < grams.length; g++) {
      if (contentLower.includes(grams[g])) {
        gramHits += 2;
      }
    }
    score += Math.min(gramHits, 16);

    if (score > 0) {
      let truncatedContent = item.content || "";
      const maxLen = CONFIG.MAX_CONTENT_LENGTH_PER_ITEM || 350;
      if (!item.direct && truncatedContent.length > maxLen) {
        truncatedContent = truncatedContent.substring(0, maxLen) + "...";
      }

      scoredItems.push({
        item: {
          keywords: item.keywords || [],
          name: item.name || "校園情報",
          content: truncatedContent,
          direct: !!item.direct
        },
        score: score
      });
    }
  }

  scoredItems.sort((a, b) => b.score - a.score);
  return scoredItems.slice(0, limit);
}

function buildConciseSystemPrompt(relevantKnowledge) {
  let contextSection = "";
  if (relevantKnowledge && relevantKnowledge.length > 0) {
    contextSection = "\n【參考知識庫】：\n" +
      relevantKnowledge.map(k => `[${k.name}] ${k.content}`).join("\n");
  }

  return `你是國立中興大學(NCHU)熱心學長姐助手。
請親切、條理分明、口語化且精簡地回答新生問題。善用 Markdown 粗體與條列重點。${contextSection}
若有提供參考資料，請優先依據參考資料客觀整合回答；若問題包含外部網址，請保持連結完整性。`;
}

/**
 * 統一 LLM API 呼叫入口（具備金鑰前綴自動分流與多平台相容）
 */
function callLlmApi(systemPrompt, apiKey, history, userQuestion, requestedProvider, requestedModel, customBaseUrl) {
  let provider = (requestedProvider || "auto").toLowerCase().trim();
  const cleanKey = String(apiKey || "").trim();

  // 1. 自動判斷規則 (Auto-detection rules)
  if (provider === "auto" || !provider) {
    if (cleanKey.startsWith("sk-")) {
      provider = "openai";
    } else if (cleanKey.startsWith("gsk_")) {
      provider = "groq";
    } else {
      provider = "gemini";
    }
  } else {
    // 智慧防呆：使用者選了 gemini 但傳入 sk- 金鑰
    if (provider === "gemini" && cleanKey.startsWith("sk-")) {
      provider = "openai";
    }
    // 智慧防呆：使用者選了 openai 但傳入 AIza 金鑰
    if ((provider === "openai" || provider === "groq") && cleanKey.startsWith("AIza")) {
      provider = "gemini";
    }
  }

  // 2. 分流發送請求
  if (provider === "gemini") {
    return callGeminiApi(systemPrompt, cleanKey, history, userQuestion, requestedModel);
  } else {
    return callOpenAiCompatibleApi(provider, requestedModel, customBaseUrl, systemPrompt, cleanKey, history, userQuestion);
  }
}

/**
 * Google Gemini 原生 API 端點呼叫
 */
function callGeminiApi(systemPrompt, apiKey, history, userQuestion, requestedModel) {
  const defaultModel = requestedModel || CONFIG.GEMINI_MODEL;
  const models = [defaultModel, CONFIG.FALLBACK_MODEL];
  const contents = [];

  if (Array.isArray(history) && history.length > 0) {
    const recentHistory = history.slice(-(CONFIG.MAX_HISTORY_TURNS * 2));
    for (let i = 0; i < recentHistory.length; i++) {
      const h = recentHistory[i];
      let text = "";
      if (h.parts && h.parts[0]?.text) {
        text = h.parts[0].text;
      } else if (typeof h.content === "string") {
        text = h.content;
      }
      if (text) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: text }]
        });
      }
    }
  }

  if (contents.length === 0 || contents[contents.length - 1].role !== "user") {
    contents.push({ role: "user", parts: [{ text: userQuestion }] });
  }

  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: CONFIG.MAX_OUTPUT_TOKENS
    }
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  let lastError = null;

  for (let m = 0; m < models.length; m++) {
    const currentModel = models[m];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

    try {
      const response = UrlFetchApp.fetch(url, options);
      const statusCode = response.getResponseCode();
      const responseData = JSON.parse(response.getContentText());

      if (statusCode === 200 && responseData.candidates && responseData.candidates[0]?.content?.parts) {
        return responseData.candidates[0].content.parts.map(p => p.text || "").join("");
      }

      const errMsg = responseData.error ? responseData.error.message : `HTTP ${statusCode}`;
      lastError = errMsg;
      Logger.log(`⚠️ Gemini 模型 ${currentModel} 請求失敗: ${errMsg}，準備切換備用模型...`);
      Utilities.sleep(1000);
    } catch (err) {
      lastError = err.message || err.toString();
    }
  }

  throw new Error(`Gemini 服務暫時無法回應: ${lastError}`);
}

/**
 * OpenAI 相容端點呼叫 (支援 OpenAI / Groq / DeepSeek / 自訂端點)
 */
function callOpenAiCompatibleApi(provider, modelName, customBaseUrl, systemPrompt, apiKey, history, userQuestion) {
  let endpoint = "";
  let finalModel = modelName;

  if (provider === "openai") {
    endpoint = "https://api.openai.com/v1/chat/completions";
    finalModel = finalModel || CONFIG.OPENAI_MODEL;
  } else if (provider === "groq") {
    endpoint = "https://api.groq.com/openai/v1/chat/completions";
    finalModel = finalModel || "llama-3.3-70b-versatile";
  } else if (provider === "deepseek") {
    endpoint = "https://api.deepseek.com/v1/chat/completions";
    finalModel = finalModel || "deepseek-chat";
  } else {
    // 自訂 OpenAI 相容端點 (custom)
    let base = (customBaseUrl || "").trim().replace(/\/+$/, "");
    if (!base) {
      base = "https://api.openai.com/v1";
    }
    if (base.endsWith("/chat/completions")) {
      endpoint = base;
    } else {
      endpoint = base + "/chat/completions";
    }
    finalModel = finalModel || "gpt-3.5-turbo";
  }

  const messages = [
    { role: "system", content: systemPrompt }
  ];

  if (Array.isArray(history) && history.length > 0) {
    const recentHistory = history.slice(-(CONFIG.MAX_HISTORY_TURNS * 2));
    for (let i = 0; i < recentHistory.length; i++) {
      const h = recentHistory[i];
      if (h && h.role) {
        let content = "";
        if (typeof h.content === "string") {
          content = h.content;
        } else if (h.parts && h.parts[0]?.text) {
          content = h.parts[0].text;
        }
        if (content) {
          messages.push({
            role: (h.role === "user" ? "user" : "assistant"),
            content: content
          });
        }
      }
    }
  }

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    messages.push({ role: "user", content: userQuestion });
  }

  const payload = {
    model: finalModel,
    messages: messages,
    temperature: 0.7,
    max_tokens: CONFIG.MAX_OUTPUT_TOKENS || 1024
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(endpoint, options);
    const statusCode = response.getResponseCode();
    const responseData = JSON.parse(response.getContentText());

    if (statusCode === 200 && responseData.choices && responseData.choices[0]?.message?.content) {
      return responseData.choices[0].message.content;
    }

    const errMsg = responseData.error ? (responseData.error.message || JSON.stringify(responseData.error)) : `HTTP ${statusCode}`;
    Logger.log(`⚠️ [${provider}] API 請求失敗 (${endpoint}): ${errMsg}`);
    throw new Error(`[${provider}] API 請求失敗: ${errMsg}`);
  } catch (err) {
    Logger.log(`⚠️ [${provider}] 呼叫異常: ${err.message || err.toString()}`);
    throw err;
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
