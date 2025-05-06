/**
 * EdgeOne Pages 反向代理实现 CDN 和源站保护
 * 此函数拦截所有请求，并将它们转发到真实源站，同时隐藏源站信息
 */

export async function onRequest({ request }) {
  // 源站地址，替换为您的实际源站
  const ORIGIN = "https://your-origin-website.com";
  
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
      `<html>
        <head>
          <title>服务暂时不可用</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            h1 { color: #333; }
            .error-container { max-width: 500px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>服务暂时不可用</h1>
            <p>我们的服务器正在维护中，请稍后再试。</p>
          </div>
        </body>
      </html>`, 
      { 
        status: 503,
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "cache-control": "no-store",
          "retry-after": "300"
        }
      }
    );
  }
}