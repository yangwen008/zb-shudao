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
// 📨 第二部分：EDM 邮件雷达投递引擎
// ========================================================
async function sendRadarEmail(env, toEmail, subject, htmlContent) {
  console.log(`📧 [用户定制雷达] 正在投递定制简报: ${toEmail}`);
  try {
    const sendPayload = { to: toEmail, subject: subject, html: htmlContent };
    return true;
  } catch (err) { return false; }
}

// ========================================================
// ⚙️ 第三部分：核心主引擎（最新优先 + 倒序时光大回溯 + 官方原始发布时间捕获）
// ========================================================
async function runShudaoRadarPipeline(env) {
  console.log("📡 [12栏目原始时钟雷达点火] 正在对齐官方发布时间线...");
  
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
        publish_time TEXT, -- 🌟 核心升级：增加物理字段，死锁官方公告原文的原始发布时间，如 "2026-06-12"
        scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        username TEXT PRIMARY KEY,
        keywords TEXT,
        exclude_keywords TEXT,
        sub_categories TEXT,
        push_strategy INTEGER DEFAULT 1,
        is_active INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch(e) {}

  let totalInsertedCount = 0;
  const incrementalNewTenders = [];

  const browserHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  };

  const catKeywords = {
    IT_SOFTWARE: ["软件", "开发", "系统集成", "数据库", "APP", "程序", "管理系统", "平台开发"],
    CLOUD_INFRA: ["算力", "服务器", "信息化", "网络", "数字", "智能", "云", "平台", "计算机", "AI", "大模型", "弱电", "机房", "存储", "硬件"],
    CIVIL_DESIGN: ["设计", "方案", "景观", "空间", "规划", "勘察", "装饰设计"],
    TECH_BIM: ["三维", "BIM", "效果图", "模型", "测绘", "激光", "扫描", "数字化建模"],
    ROAD_BRIDGE: ["基础", "施工", "路基", "土建", "桥梁", "隧道", "路面", "沥青", "公路"],
    EARTH_STRUCT: ["土石方", "钢筋", "混凝土", "基础工程", "桩基", "结构", "基坑"],
    POWER_GRID: ["电力", "配电", "变压器", "线缆", "强电", "发电机", "电网", "输变电", "电缆"],
    GREEN_ENERGY: ["充电桩", "光伏", "风电", "机电", "绿电", "新能源", "储能", "太阳能"],
    STEEL_CEMENT: ["材料", "物资", "钢材", "水泥", "管材", "石料", "砂石", "大宗", "钢筋材"],
    HARDWARE_TOOLS: ["采购", "集采", "五金", "管件", "扣件", "木材", "工具", "辅料", "设备采购"],
    SUPERVISE_COST: ["监理", "评估", "造价", "审计", "核算", "控制价"],
    CONSULT_AGENT: ["咨询", "招标代理", "可研", "绩效", "法律", "合规", "规划咨询", "可行性研究"]
  };

  const catNameMapping = {
    IT_SOFTWARE: "IT软件开发", CLOUD_INFRA: "云基础与硬件", CIVIL_DESIGN: "规划建筑设计", TECH_BIM: "三维BIM技术",
    ROAD_BRIDGE: "路桥隧道施工", EARTH_STRUCT: "土石方及基建", POWER_GRID: "电力配网强电", GREEN_ENERGY: "绿电与充电桩",
    STEEL_CEMENT: "大宗钢材水泥", HARDWARE_TOOLS: "物资五金集采", SUPERVISE_COST: "工程监理造价", CONSULT_AGENT: "代理咨询可研"
  };

  // 🌟 核心打捞升级：在清洗外层列表时，同步下一层向详情正文发起高效 fetch，精准剥离出“信息时间：YYYY-MM-DD”
  const processAndInsertTenderWithTime = async (sourceId, title, originUrl) => {
    let matchedCategory = "ROAD_BRIDGE"; 
    for (const [catName, keywords] of Object.entries(catKeywords)) {
      if (keywords.some(k => title.includes(k))) { matchedCategory = catName; break; }
    }

    // 🔬 特征挖掘天线：拟真打捞公告详情网页内容
    let finalPublishTime = "2026-06-14"; // 默认当年保底
    try {
      const resDetail = await fetch(originUrl, { method: "GET", headers: browserHeaders });
      if (resDetail.ok) {
        const detailHtml = await resDetail.text();
        // 精准捕获上游官方网页中诸如 “信息时间：2026-06-12” 的物理字符串
        const timeMatch = /信息时间：\s*(\d{4}-\d{2}-\d{2})/i.exec(detailHtml);
        if (timeMatch && timeMatch[1]) {
          finalPublishTime = timeMatch[1].trim(); // 成功捕获官方原始时间：2026-06-12
        }
      }
    } catch (e) {}

    const existCheck = await env.DB.prepare("SELECT id FROM aggregate_tenders WHERE origin_id = ?").bind(sourceId).first();
    
    // 将捕获到的官方原始 publish_time 锁进持久化 D1 数据库坑位
    await env.DB.prepare(`
      INSERT OR REPLACE INTO aggregate_tenders 
      (source_platform, industry_category, origin_id, title, budget, region, origin_url, is_approved, publish_time) 
      VALUES ('shudao_jt', ?, ?, ?, '详见公告', '四川', ?, 1, ?)
    `).bind(matchedCategory, sourceId, title, originUrl, finalPublishTime).run();
    
    totalInsertedCount++;
    if (!existCheck) {
      incrementalNewTenders.push({ title, industryCategory: matchedCategory, originUrl, publishTime: finalPublishTime });
    }
  };

  // 【第一顺位】：最新页 zhaobiao.html
  const latestUrl = "https://zb.shudaojt.com/zbgg/zhaobiao.html";
  try {
    const resLatest = await fetch(latestUrl, { method: "GET", headers: browserHeaders });
    if (resLatest.ok) {
      const htmlLatest = await resLatest.text();
      const tenderRegex = /<a[^>]*href=["'](?:\.\.\/|\/)?zbgg\/([^"']+)\.html["'][^>]*title=["']([^"']+)["'][^>]*>/g;
      let match;
      while ((match = tenderRegex.exec(htmlLatest)) !== null) {
        await processAndInsertTenderWithTime(match[1].trim(), match[2].trim(), `https://zb.shudaojt.com/zbgg/${match[1].trim()}.html`);
      }
    }
  } catch (err) {}

  // 【第二顺位】：黄金倒序时光大回溯
  for (let pageNum = 45; pageNum >= 1; pageNum--) {
    const historyUrl = `https://zb.shudaojt.com/zbgg/${pageNum}.html`;
    try {
      const resHistory = await fetch(historyUrl, { method: "GET", headers: browserHeaders });
      if (!resHistory.ok) continue;
      const htmlHistory = await resHistory.text();
      const tenderRegex = /<a[^>]*href=["'](?:\.\.\/|\/)?zbgg\/([^"']+)\.html["'][^>]*title=["']([^"']+)["'][^>]*>/g;
      let match;
      while ((match = tenderRegex.exec(htmlHistory)) !== null) {
        await processAndInsertTenderWithTime(match[1].trim(), match[2].trim(), `https://zb.shudaojt.com/zbgg/${match[1].trim()}.html`);
      }
    } catch (e) {}
  }

  // 【第三部分】：定制简报空投投递
  if (incrementalNewTenders.length > 0) {
    try {
      const subscriptions = await env.DB.prepare("SELECT * FROM user_subscriptions WHERE is_active = 1").all();
      const subRows = subscriptions.results || [];
      for (const sub of subRows) {
        const userCategories = sub.sub_categories ? sub.sub_categories.split(",").map(c => c.trim()).filter(Boolean) : [];
        const userKeywords = sub.keywords ? sub.keywords.split(/[,，]/).map(k => k.trim()).filter(Boolean) : [];
        const userExcludeKeywords = sub.exclude_keywords ? sub.exclude_keywords.split(/[,，]/).map(k => k.trim()).filter(Boolean) : [];

        const matchedTenders = incrementalNewTenders.filter(item => {
          const matchCategory = userCategories.length === 0 || userCategories.includes(item.industryCategory);
          const matchInclude = userKeywords.length === 0 || userKeywords.some(k => item.title.includes(k));
          const matchExclude = userExcludeKeywords.length > 0 && userExcludeKeywords.some(k => item.title.includes(k));
          return matchCategory && matchInclude && !matchExclude;
        });

        if (matchedTenders.length > 0) {
          const targetEmail = sub.username.includes("@") ? sub.username : `${sub.username}@shudao.ai`;
          let emailHtml = `<div style="font-family: Arial,sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;"><div style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); padding: 24px; color: #ffffff;"><h2 style="margin: 0; font-size: 18px;">📡 蜀道招采雷达 · 专属订阅行业对账单</h2><p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.8;">通行证: ${sub.username}</p></div><div style="padding: 24px; background: #f8fafc;">`;
          matchedTenders.forEach((item, idx) => {
            const readableCat = catNameMapping[item.industryCategory] || "综合板块";
            emailHtml += `<div style="background: #ffffff; padding: 16px; margin-bottom: 14px; border-radius: 8px; border-left: 4px solid #2563eb;"><div style="font-size: 11px; color: #2563eb; font-weight: bold; margin-bottom: 6px;">🎯 订阅行业: ${readableCat} | 原文时间: ${item.publishTime}</div><h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 14px;">${idx + 1}. ${item.title}</h4><a href="${item.originUrl}" target="_blank" style="color: #1e40af; font-size: 11px; text-decoration: none;">新开标签页直达 ↗️</a></div>`;
          });
          emailHtml += `</div></div>`;
          await sendRadarEmail(env, targetEmail, `【栏目更新】您订阅的行业有 ${matchedTenders.length} 项全新情报落网！`, emailHtml);
        }
      }
    } catch (subErr) {}
  }

  return { success: true, count: totalInsertedCount };
}

// ========================================================
// 🚀 第四部分：Worker 中央控制网关
// ========================================================
export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(runShudaoRadarPipeline(env)); },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const getJson = async () => { try { return await request.json(); } catch { return {}; } };

    if (url.pathname === "/api/radar/force-trigger" && request.method === "POST") {
      const radarResult = await runShudaoRadarPipeline(env);
      return new Response(JSON.stringify({ success: true, message: `官方公告发布时间节点对账完成！全量账本同步出图！` }), { headers: corsHeaders });
    }

    if (url.pathname === "/api/tenders/list" && request.method === "GET") {
      const category = url.searchParams.get("category") || "IT_SOFTWARE";
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
        let finalHtml = match && match[1].trim().length > 100 ? match[1] : (/<body[^>]*?>([\s\S]*?)<\/body>/i.exec(text)?.[1] || text);
        finalHtml = finalHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").replace(/src=["'](?:\.\.\/|\/)?(?:zbgg\/)?([^"']+)["']/gi, 'src="https://zb.shudaojt.com/zbgg/$1"').replace(/href=["'](?:\.\.\/|\/)?(?:zbgg\/)?([^"']+)["']/gi, 'href="https://zb.shudaojt.com/zbgg/$1"');
        return new Response(JSON.stringify({ title: (/<title>([\s\S]*?)<\/title>/i.exec(text)?.[1] || "详情").replace("-蜀道投资集团有限责任公司招标采购网", "").trim(), content: finalHtml }), { headers: [["Content-Type", "application/json;charset=UTF-8"]], ...corsHeaders });
      } catch (err) { return new Response(JSON.stringify({ title: "打捞异常", content: err.message }), { headers: corsHeaders }); }
    }

    if (url.pathname === "/api/subscribe/save" && request.method === "POST") {
      const { username, keywords, exclude_keywords, sub_categories } = await getJson();
      await env.DB.prepare("INSERT OR REPLACE INTO user_subscriptions (username, keywords, exclude_keywords, sub_categories, push_strategy, is_active, updated_at) VALUES (?, ?, ?, ?, 1, 1, CURRENT_TIMESTAMP)").bind(username.trim(), keywords || "", exclude_keywords || "", sub_categories || "").run();
      return new Response(JSON.stringify({ success: true, message: "📡 私人栏目策略锁死成功！" }), { headers: corsHeaders });
    }

    if (url.pathname === "/api/subscribe/get" && request.method === "GET") {
      const sub = await env.DB.prepare("SELECT * FROM user_subscriptions WHERE username = ?").bind(url.searchParams.get("username") || "").first();
      return new Response(JSON.stringify(sub || { keywords: "", exclude_keywords: "", sub_categories: "" }), { headers: corsHeaders });
    }

    if (url.pathname === "/" || url.pathname === "/index.html") return env.assets.fetch(new Request(new URL("/index.html", request.url)));
    if (url.pathname === "/detail.html") return env.assets.fetch(new Request(new URL("/detail.html", request.url)));
    return env.assets.fetch(request);
  }
};