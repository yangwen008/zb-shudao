// ========================================================
// 🔐 第一部分：安全加固防线
// ========================================================
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password + "ShuDaoSalt2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ========================================================
// ⚙️ 第二部分：核心主引擎（数字多页盲炸 + 6大行业精准像素级切片中枢）
// ========================================================
async function runShudaoRadarPipeline(env) {
  console.log("📡 [6大类重炮雷达点火] 开启地毯式全行业盲炸清盘...");
  
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS aggregate_tenders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_platform TEXT,
        industry_category TEXT,
        origin_id TEXT UNIQUE,
        title TEXT,
        budget TEXT,
        region TEXT,
        origin_url TEXT,
        is_approved INTEGER DEFAULT 1,
        is_pushed INTEGER DEFAULT 0,
        contact_info TEXT,
        scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        username TEXT PRIMARY KEY,
        keywords TEXT,
        exclude_keywords TEXT,
        push_strategy INTEGER DEFAULT 1,
        is_active INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch(e) {}

  let totalInsertedCount = 0;
  const bruteForceTargets = [
    "https://zb.shudaojt.com/zbgg/zhaobiao.html",   
    "https://zb.shudaojt.com/zbgg/2.html",          
    "https://zb.shudaojt.com/zbgg/3.html"           
  ];

  const browserHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  };

  // 🌟 重新对齐的 6 大精准行业判定特征库
  const catKeywords = {
    IT: ["算力", "软件", "信息化", "系统集成", "服务器", "网络", "数字", "智能", "数据库", "开发", "云", "平台", "计算机", "AI", "大模型", "弱电"],
    DESIGN: ["设计", "三维", "BIM", "效果图", "模型", "方案", "景观", "空间", "测绘", "规划", "勘察"],
    CONSTRUCT: ["基础", "施工", "混凝土", "路基", "土建", "桥梁", "隧道", "路面", "土石方", "钢筋", "沥青"],
    ENERGY: ["电力", "充电桩", "光伏", "配电", "变压器", "线缆", "风电", "电网", "机电", "强电", "发电机", "绿电"],
    SECURITY: ["安防", "监控", "摄像头", "消防", "红外", "报警", "电子围栏", "门禁", "闸机", "巡检"],
    CONSULT: ["咨询", "监理", "评估", "造价", "审计", "招标代理", "可研", "绩效", "法律", "合规"]
  };

  for (let i = 0; i < bruteForceTargets.length; i++) {
    const activeUrl = bruteForceTargets[i];
    try {
      const response = await fetch(activeUrl, { method: "GET", headers: browserHeaders });
      if (!response.ok) continue;

      const htmlText = await response.text();
      const tenderRegex = /<a[^>]*href=["'](?:\.\.\/|\/)?zbgg\/([^"']+)\.html["'][^>]*title=["']([^"']+)["'][^>]*>/g;
      
      let match;
      while ((match = tenderRegex.exec(htmlText)) !== null) {
        const sourceId = match[1].trim(); 
        const title = match[2].trim();    
        const budget = "详见公告标书";
        const originUrl = `https://zb.shudaojt.com/zbgg/${sourceId}.html`;

        // 🌟 6大分类自动化流线判定
        let industryCategory = "CONSTRUCT"; // 默认土木大宗
        for (const [catName, keywords] of Object.entries(catKeywords)) {
          if (keywords.some(k => title.includes(k))) {
            industryCategory = catName;
            break;
          }
        }

        try {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO aggregate_tenders 
            (source_platform, industry_category, origin_id, title, budget, region, origin_url, is_approved) 
            VALUES ('shudao_jt', ?, ?, ?, ?, '四川', ?, 1)
          `).bind(industryCategory, sourceId, title, budget, originUrl).run();
          totalInsertedCount++;
        } catch (innerErr) {}
      }
    } catch (pageErr) {}
  }

  return { success: true, count: totalInsertedCount };
}

// ========================================================
// 🚀 第三部分：Worker 中央控制网关
// ========================================================
export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(runShudaoRadarPipeline(env)); },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PATCH",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const getJson = async () => { try { return await request.json(); } catch { return {}; } };

    if (url.pathname === "/api/radar/force-trigger" && request.method === "POST") {
      const radarResult = await runShudaoRadarPipeline(env);
      return new Response(JSON.stringify({ success: true, message: `6大类重炮盲炸成功！数据全量清算入库落地！` }), { headers: corsHeaders });
    }

    if (url.pathname === "/api/tenders/list" && request.method === "GET") {
      const category = url.searchParams.get("category") || "IT";
      try {
        const queryResult = await env.DB.prepare("SELECT * FROM aggregate_tenders WHERE industry_category = ? ORDER BY id DESC LIMIT 100").bind(category).all();
        return new Response(JSON.stringify(queryResult.results || []), { headers: [["Content-Type", "application/json;charset=UTF-8"]], ...corsHeaders });
      } catch (err) { return new Response(JSON.stringify([]), { headers: corsHeaders }); }
    }

    if (url.pathname === "/api/tenders/detail" && request.method === "GET") {
      const originId = url.searchParams.get("id") || "";
      try {
        const targetDetailUrl = `https://zb.shudaojt.com/zbgg/${originId}.html`;
        const res = await fetch(targetDetailUrl, { method: "GET", headers: { "User-Agent": "Mozilla/5.0" } });
        const text = await res.text();
        const contentRegex = /<div[^>]*?(?:class|id)=["'](?:content|article|detail-content|text|main-content|show_content|notice-content)["'][^>]*?>([\s\S]*?)<\/div>/i;
        const match = contentRegex.exec(text);
        
        let finalHtml = "";
        if (match && match[1].trim().length > 100) finalHtml = match[1];
        else {
          const bodyMatch = /<body[^>]*?>([\s\S]*?)<\/body>/i.exec(text);
          finalHtml = bodyMatch ? bodyMatch[1] : text;
        }
        finalHtml = finalHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
        finalHtml = finalHtml.replace(/src=["'](?:\.\.\/|\/)?(?:zbgg\/)?([^"']+)["']/gi, 'src="https://zb.shudaojt.com/zbgg/$1"');
        finalHtml = finalHtml.replace(/href=["'](?:\.\.\/|\/)?(?:zbgg\/)?([^"']+)["']/gi, 'href="https://zb.shudaojt.com/zbgg/$1"');
        
        const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(text);
        const cleanTitle = titleMatch ? titleMatch[1].replace("-蜀道投资集团有限责任公司招标采购网", "").trim() : "招标公告详情";
        return new Response(JSON.stringify({ title: cleanTitle, content: finalHtml }), { headers: [["Content-Type", "application/json;charset=UTF-8"]], ...corsHeaders });
      } catch (err) { return new Response(JSON.stringify({ title: "打捞阻断", content: err.message }), { headers: corsHeaders }); }
    }

    if (url.pathname === "/api/subscribe/save" && request.method === "POST") {
      const { username, keywords, exclude_keywords } = await getJson();
      await env.DB.prepare("INSERT OR REPLACE INTO user_subscriptions (username, keywords, exclude_keywords, push_strategy, is_active, updated_at) VALUES (?, ?, ?, 1, 1, CURRENT_TIMESTAMP)").bind(username.trim(), keywords || "", exclude_keywords || "").run();
      return new Response(JSON.stringify({ success: true, message: "📡 私人配置成功锁死！" }), { headers: corsHeaders });
    }

    if (url.pathname === "/api/subscribe/get" && request.method === "GET") {
      const sub = await env.DB.prepare("SELECT * FROM user_subscriptions WHERE username = ?").bind(url.searchParams.get("username") || "").first();
      return new Response(JSON.stringify(sub || { keywords: "", exclude_keywords: "" }), { headers: corsHeaders });
    }

    if (url.pathname === "/" || url.pathname === "/index.html") return env.assets.fetch(new Request(new URL("/index.html", request.url)));
    if (url.pathname === "/detail.html") return env.assets.fetch(new Request(new URL("/detail.html", request.url)));
    return env.assets.fetch(request);
  }
};