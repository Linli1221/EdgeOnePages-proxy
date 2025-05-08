export async function onRequest(context) {
  // 获取原始请求的URL、方法、头部和主体
  const { request } = context;
  const url = new URL(request.url);
  const method = request.method;
  const headers = new Headers(request.headers);
  
  // 构建目标URL，将请求转发到目标服务器
  const targetUrl = new URL(`http://166.108.203.60:3000${url.pathname}${url.search}`);
  
  try {
    // 创建新的请求对象，保留原始请求的方法、头部和主体
    const targetRequest = new Request(targetUrl.toString(), {
      method: method,
      headers: headers,
      body: method !== 'GET' && method !== 'HEAD' ? await request.clone().arrayBuffer() : undefined,
      redirect: 'follow',
    });
    
    // 发送请求到目标服务器
    const response = await fetch(targetRequest);
    
    // 创建新的响应对象，保留原始响应的状态码、头部和主体
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
    
    return newResponse;
  } catch (error) {
    // 处理错误情况
    return new Response(`代理请求失败: ${error.message}`, { status: 500 });
  }
}