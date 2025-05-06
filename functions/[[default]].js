/**
 * EdgeOne Pages 反向代理实现 CDN 和源站保护
 * 此函数拦截所有请求，并将它们转发到真实源站，同时隐藏源站信息
 */

export async function onRequest({ request }) {
  // 源站地址，替换为您的实际源站
  const ORIGIN = "http://166.108.203.60:3000";
  
  // 获取请求URL的路径部分
  const url = new URL(request.url);
  const path = url.pathname + url.search;
  
  // 构建转发到源站的URL
  const originUrl = ORIGIN + path;
  
  // 复制原始请求的头信息
  const headers = new Headers(request.headers);
  
  // 设置源站真实IP (可选)
  headers.set("X-Forwarded-For", request.headers.get("cf-connecting-ip") || "");
  headers.set("X-Real-IP", request.headers.get("cf-connecting-ip") || "");
  
  // 删除一些特殊头信息，避免与源站冲突
  headers.delete("host");
  headers.delete("cf-connecting-ip");
  headers.delete("cf-ipcountry");
  headers.delete("cf-ray");
  headers.delete("cf-visitor");
  headers.delete("cdn-loop");
  
  // 设置Host头为源站域名，帮助源站正确处理请求
  const originHost = new URL(ORIGIN).host;
  headers.set("Host", originHost);
  
  // 创建转发请求的选项
  const requestOptions = {
    method: request.method,
    headers: headers,
    redirect: "manual",
  };
  
  // 如果是POST等包含请求体的请求，添加body
  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    requestOptions.body = await request.arrayBuffer();
  }
  
  try {
    // 发送请求到源站
    const response = await fetch(originUrl, requestOptions);
    
    // 处理响应头
    const originResponse = new Response(response.body, response);
    const responseHeaders = new Headers(originResponse.headers);
    
    // 移除源站相关的安全头信息，隐藏源站信息
    responseHeaders.delete("server");
    responseHeaders.delete("x-powered-by");
    responseHeaders.delete("x-aspnet-version");
    responseHeaders.delete("x-runtime");
    responseHeaders.delete("via");
    
    // 添加自定义头，增强安全性
    responseHeaders.set("X-Served-By", "EdgeOne Pages");
    responseHeaders.set("X-Content-Type-Options", "nosniff");
    responseHeaders.set("X-XSS-Protection", "1; mode=block");
    
    // 根据资源类型设置不同的缓存策略
    const contentType = responseHeaders.get("content-type") || "";
    
    // 静态资源设置较长缓存时间
    if (
      path.match(/\.(jpg|jpeg|png|gif|ico|svg|webp|css|js|woff|woff2|ttf|eot)$/i) || 
      contentType.includes("image/") || 
      contentType.includes("font/") ||
      contentType.includes("text/css") ||
      contentType.includes("application/javascript")
    ) {
      responseHeaders.set("cache-control", "public, max-age=86400");
    }
    // API请求不缓存
    else if (path.startsWith("/api/")) {
      responseHeaders.set("cache-control", "no-store");
    }
    // 默认缓存策略
    else if (!responseHeaders.has("cache-control")) {
      responseHeaders.set("cache-control", "public, max-age=3600");
    }
    
    // 允许访问预览页面，解决401问题
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    // 返回响应给客户端
    return new Response(originResponse.body, {
      status: originResponse.status,
      statusText: originResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    // 错误处理
    console.error(`反向代理请求失败: ${err.message}`);
    
    // 返回自定义错误页面，不暴露源站信息
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>CDN反向代理</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
            h1 { color: #0078d4; }
            .card { background: #f9f9f9; border-radius: 8px; padding: 20px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            pre { background: #f1f1f1; padding: 10px; border-radius: 4px; overflow-x: auto; }
            .info { color: #0078d4; }
          </style>
        </head>
        <body>
          <h1>EdgeOne Pages CDN反向代理</h1>
          <div class="card">
            <h2>代理服务器状态</h2>
            <p>CDN反向代理已成功部署，但源站连接失败。</p>
            <p>错误信息: ${err.message}</p>
            <p class="info">请检查源站地址设置是否正确，并确保源站可访问。</p>
          </div>
          <div class="card">
            <h2>配置指南</h2>
            <p>1. 请确保已正确配置源站地址</p>
            <p>2. 如果您遇到401错误，可能需要:</p>
            <ul>
              <li>添加自定义域名并完成DNS配置</li>
              <li>通过控制台的"预览"按钮获取最新的授权链接</li>
              <li>确认项目的加速区域设置是否符合您的访问环境</li>
            </ul>
            <p><strong>源站设置:</strong> ${ORIGIN}</p>
          </div>
        </body>
      </html>`, 
      { 
        status: 200,
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "cache-control": "no-store",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
}