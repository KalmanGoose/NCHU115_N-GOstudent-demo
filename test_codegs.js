
const fs = require("fs");
const vm = require("vm");

const kdCode = fs.readFileSync("KnowledgeData.gs", "utf8");
vm.runInThisContext(kdCode);

const fkCode = fs.readFileSync("FreshmanKnowledge.gs", "utf8");
vm.runInThisContext(fkCode);

const codeGs = fs.readFileSync("Code.gs", "utf8");
global.Utilities = { sleep: function(ms) {} };
global.ContentService = {
  MimeType: { JSON: 'application/json' },
  createTextOutput: function(text) {
    return {
      setMimeType: function(type) {
        return { content: text, mimeType: type };
      }
    };
  }
};
global.UrlFetchApp = {
  fetch: function(url, options) {
    return {
      getResponseCode: function() { return 200; },
      getContentText: function() {
        return JSON.stringify({
          candidates: [{ content: { parts: [{ text: "這是測試環境的 AI 模擬回應。" }] } }]
        });
      }
    };
  }
};

vm.runInThisContext(codeGs);

// Test doGet
const getResp = JSON.parse(doGet({}).content);
console.log('doGet response:', getResp);

// Test Direct Fast Path
const directReq = {
  postData: {
    contents: JSON.stringify({
      message: '資工系新生群',
      apiKey: 'dummy_key'
    })
  }
};

const directResp = JSON.parse(doPost(directReq).content);
console.log('Direct Path (資工系新生群) response:', directResp);

// Test another direct path
const envReq = {
  postData: {
    contents: JSON.stringify({
      message: '環工系新生群',
      apiKey: 'dummy_key'
    })
  }
};
const envResp = JSON.parse(doPost(envReq).content);
console.log('Direct Path (環工系新生群) response:', envResp);

// Test Search IDF
const searchRes = searchRelevantKnowledge('選課時程 體育搶課', 3);
console.log('searchRelevantKnowledge (選課時程 體育搶課):', searchRes.map(r => ({ name: r.item.name, score: r.score.toFixed(1) })));

// Test Missing Key
const noKeyReq = {
  postData: {
    contents: JSON.stringify({
      message: '請問雲平樓在哪'
    })
  }
};
const noKeyResp = JSON.parse(doPost(noKeyReq).content);
console.log('Missing Key response:', noKeyResp);
