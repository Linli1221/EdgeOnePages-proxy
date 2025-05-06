/**
 * EdgeOne Pages 反向代理 - 极简版
 * 解决白屏问题的简化实现
 */

// 简单化反向代理实现，避免参数错误问题

export async function onRequest(context) {
  // 源站地址
  const ORIGIN = "http://166.108.203.60:3000";
  
  // 获取请求路径
  const request = context.request;
  const url = new URL(request.url);
  const path = url.pathname + url.search;
  
  try {
    // 构造目标URL
    const targetUrl = `${ORIGIN}${path}`;
    
    // 简单代理请求
    const response = await fetch(targetUrl);
    
    // 返回代理响应
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "text/html",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    // 错误处理
    return new Response(
      `<html>
        <head><title>代理错误</title></head>
        <body>
          <h1>代理请求失败</h1>
          <p>${error.message}</p>
        </body>
      </html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      }
    );
  }
}