// ========================================================
// 🔐 第一部分：安全加固防线（边缘端纯原生 SHA-256 加盐哈希算法）
// ========================================================
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password + "ShuDaoSalt2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ========================================================
// ⚙️ 第二部分：自动化工厂（蜀道集采定时爬虫 + 包含/排除双向雷达对账中枢）
// ========================================================
async function runShudaoRadarPipeline(env) {
  console.log("📡 [边缘雷达长跑] 开启强攻蜀道数据链，目标定位：ztb.shudaolink.com ...");
  const targetUrl = "https://ztb.shudaolink.com/api/v1/notice/page";
  const payload = { pageNo: 1, pageSize: 40, noticeType: "1", title: "", projectType: "" };

  let insertedCount = 0;
  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://ztb.shudaolink.com/notice",
        "Origin": "https://ztb.shudaolink.com"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`❌ 上游响应失败，HTTP状态码: ${response.status}`);
      return { success: false, message: `上游接口响应失败: ${response.status}` };
    }

    const parsed = await response.json();
    if (!parsed || !parsed.data || !parsed.data.list) {
      console.error("❌ 未从上游捞到有效的数据结构列表");
      return { success: false, message: "上游未返回标准list数据" };
    }
    
    const rawList = parsed.data.list;
    console.log(`📡 [雷达探测成功] 本次成功拦截到 ${rawList.length} 条原始标讯，开始洗牌入库...`);

    const itKeywords = ["算力", "软件", "信息化", "系统集成", "服务器", "网络", "数字", "智能", "数据库", "开发", "云", "平台"];
    const designKeywords = ["设计", "三维", "BIM", "规划", "勘察", "效果图", "咨询", "测绘", "模型"];

    for (const item of rawList) {
      const title = item.noticeTitle || "";
      const sourceId = item.id || "";
      const budget = item.budgetAmount ? `${item.budgetAmount}元` : "详见标书内容";
      const originUrl = `https://ztb.shudaolink.com/notice/detail/${sourceId}`;

      let industryCategory = "CONSTRUCT"; 
      if (itKeywords.some(k => title.includes(k))) industryCategory = "IT";
      else if (designKeywords.some(k => title.includes(k))) industryCategory = "DESIGN";

      // 🛡️ 核心修复：强制设置 is_approved = 1，确保免登录大厅可以立刻无阻碍捞出展示
      const dbResult = await env.DB.prepare(`
        INSERT OR IGNORE INTO aggregate_tenders 
        (source_platform, industry_category, origin_id, title, budget, region, origin_url, is_approved) 
        VALUES ('shudao', ?, ?, ?, ?, '四川', ?, 1)
      `).bind(industryCategory, sourceId, title, budget, originUrl).run();

      if (dbResult.meta.changes > 0) {
        insertedCount++;
      }
    }

    console.log(`✅ [D1入库完成] 本次雷达突击对账，共有 ${insertedCount} 条新商业标讯注入大一统账本！`);

    // ================= 开始执行订阅雷达邮件喷发 =================
    const unpushed = await env.DB.prepare("SELECT * FROM aggregate_tenders WHERE is_pushed = 0 AND is_approved = 1").all();
    const subscribers = await env.DB.prepare("SELECT * FROM user_subscriptions WHERE is_active = 1").all();

    if (unpushed.results.length > 0 && subscribers.results.length > 0 && env.RESEND_API_KEY) {
      for (const user of subscribers.results) {
        const userKeywords = user.keywords.split(",").map(k => k.trim()).filter(k => k !== "");
        const userExcludeKeywords = user.exclude_keywords ? user.exclude_keywords.split(",").map(k => k.trim()).filter(k => k !== "") : [];
        const matchedTenders = unpushed.results.filter(t => {
          return userKeywords.some(k => t.title.includes(k)) && !userExcludeKeywords.some(k => t.title.includes(k)); 
        });

        if (matchedTenders.length > 0) {
          let tenderRows = "";
          matchedTenders.forEach(t => {
            let catTag = t.industry_category === 'IT' ? '🖥️ IT新基建' : (t.industry_category === 'DESIGN' ? '🎨 工业设计' : '🏗️ 传统土建');
            tenderRows += `<p>💡 <strong>[${catTag}] ${t.title}</strong> (预算: ${t.budget}) <a href="${t.origin_url}">直达公告</a></p>`;
          });

          const from_email = `tender-radar@${env.DOMAINS || 'shudao.ai'}`;
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${env.RESEND_API_KEY.trim()}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: `蜀道雷达中枢 <${from_email}>`,
              to: [`${user.username}@${env.DOMAINS || 'shudao.ai'}`], 
              subject: `【蜀道雷达】拦截到 ${matchedTenders.length} 条高价值商业标讯`,
              html: `<div>${tenderRows}</div>`
            })
          });
        }
      }
      await env.DB.prepare("UPDATE aggregate_tenders SET is_pushed = 1 WHERE is_pushed = 0").run();
    }
    return { success: true, count: insertedCount };
  } catch (err) { 
    console.error("💥 边缘雷达管道异常遭遇阻击:", err.message); 
    return { success: false, message: err.message };
  }
}

// ========================================================
// 🚀 第三部分：Worker 中央总控制矩阵（多维入口接驳）
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

    // 🛡️ 【免登录公开浏览原则】非 API 请求时，直接指向 Assets 对应大厅主页
    if (!url.pathname.startsWith("/api/")) {
      if (url.pathname === "/" || url.pathname === "/index.html") {
        return env.assets.fetch(new Request(new URL("/index.html", request.url)));
      }
      if (url.pathname === "/login.html" || url.pathname === "/zb_login.html") {
        return env.assets.fetch(new Request(new URL("/zb_login.html", request.url)));
      }
    }

    // ================= 招标 API 控制网关 =================
    if (url.pathname === "/api/register" && request.method === "POST") {
      const { username, password } = await getJson();
      try {
        const cleanUser = username.split("@")[0].trim();
        const secureHash = await hashPassword(password);
        await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").bind(cleanUser, secureHash).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      } catch { return new Response(JSON.stringify({ success: false, message: "凭证名前缀已被占用" }), { status: 400, headers: corsHeaders }); }
    }
    
    if (url.pathname === "/api/login" && request.method === "POST") {
      const { username, password } = await getJson();
      const cleanUser = username ? username.split("@")[0].trim() : "";
      
      // 👑 【至高指挥官免密后门最高防线】
      if (cleanUser === "admin" && password === "ShuDaoAdmin666!@#") {
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      try {
        const secureHash = await hashPassword(password);
        const user = await env.DB.prepare("SELECT * FROM users WHERE username = ? AND password_hash = ?").bind(cleanUser, secureHash).first();
        if (user) return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      } catch (dbErr) {}
      
      return new Response(JSON.stringify({ success: false, message: "凭证名或安全密码错误" }), { status: 401, headers: corsHeaders });
    }

    if (url.pathname === "/api/subscribe/save" && request.method === "POST") {
      const { username, keywords, exclude_keywords, push_strategy } = await getJson();
      try {
        const cleanUser = username.split("@")[0].trim();
        await env.DB.prepare(`
          INSERT OR REPLACE INTO user_subscriptions (username, keywords, exclude_keywords, push_strategy, is_active, updated_at)
          VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        `).bind(cleanUser, keywords || "", exclude_keywords || "", push_strategy ?? 1).run();
        return new Response(JSON.stringify({ success: true, message: "📡 边缘雷达双向规则已无损锁死！" }), { headers: corsHeaders });
      } catch (err) { return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: corsHeaders }); }
    }

    if (url.pathname === "/api/subscribe/get" && request.method === "GET") {
      const username = url.searchParams.get("username");
      const cleanUser = username ? username.split("@")[0].trim() : "";
      const sub = await env.DB.prepare("SELECT * FROM user_subscriptions WHERE username = ?").bind(cleanUser).first();
      return new Response(JSON.stringify(sub || { keywords: "", exclude_keywords: "", push_strategy: 1 }), { headers: corsHeaders });
    }

    // 🌟 核心强制点火重构：使用 await 强行阻塞等待爬虫和 D1 写入完毕，不允许被异步截断！
    if (url.pathname === "/api/radar/force-trigger" && request.method === "POST") {
      const radarResult = await runShudaoRadarPipeline(env);
      if (radarResult.success) {
        return new Response(JSON.stringify({ success: true, message: `云端集采点火对账成功！本次捕获并新录入 ${radarResult.count} 条招标情报。` }), { headers: corsHeaders });
      } else {
        return new Response(JSON.stringify({ success: false, message: `采集受阻: ${radarResult.message}` }), { status: 500, headers: corsHeaders });
      }
    }

    if (url.pathname === "/api/tenders/list" && request.method === "GET") {
      const category = url.searchParams.get("category") || "IT";
      const { results } = await env.DB.prepare("SELECT * FROM aggregate_tenders WHERE industry_category = ? AND is_approved = 1 ORDER BY scraped_at DESC").bind(category).all();
      return new Response(JSON.stringify(results), { headers: corsHeaders });
    }

    if (url.pathname === "/api/tenders/create" && request.method === "POST") {
      try {
        const { title, industry_category, budget, contact_info } = await getJson();
        const fakeOriginId = "self_" + Math.random().toString(36).substring(2, 10);
        await env.DB.prepare suicide(`
          INSERT INTO aggregate_tenders 
          (source_platform, industry_category, origin_id, title, budget, region, origin_url, contact_info, is_approved) 
          VALUES ('self', ?, ?, ?, ?, '四川', '#自发', ?, 1)
        `).bind(industry_category, fakeOriginId, title, budget, contact_info).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      } catch (err) { return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: corsHeaders }); }
    }

    return env.assets.fetch(request);
  }
};