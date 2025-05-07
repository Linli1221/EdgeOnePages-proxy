
      let global = globalThis;

      class MessageChannel {
        constructor() {
          this.port1 = new MessagePort();
          this.port2 = new MessagePort();
        }
      }
      class MessagePort {
        constructor() {
          this.onmessage = null;
        }
        postMessage(data) {
          if (this.onmessage) {
            setTimeout(() => this.onmessage({ data }), 0);
          }
        }
      }
      global.MessageChannel = MessageChannel;

      let routeParams = {};
      let pagesFunctionResponse = null;
      async function handleRequest(context){
        const request = context.request;
        const urlInfo = new URL(request.url);

        if (urlInfo.pathname !== '/' && urlInfo.pathname.endsWith('/')) {
          urlInfo.pathname = urlInfo.pathname.slice(0, -1);
        }

        let matchedFunc = false;
        
          if(/^\/(.+?)$/.test(urlInfo.pathname)) {
            routeParams = {"id":"default","mode":2,"left":"/"};
            matchedFunc = true;
            (() => {
  // functions/[[default]].js
  async function onRequest(context) {
    const ORIGIN = "http://166.108.203.60:3000";
    const request = context.request;
    const url = new URL(request.url);
    const path = url.pathname + url.search;
    const targetUrl = path === "/" ? `${ORIGIN}/` : `${ORIGIN}${path}`;
    try {
      console.log(`\u4EE3\u7406\u8BF7\u6C42 ${request.method} ${path}`);
      const headers = new Headers();
      for (const [key, value] of request.headers.entries()) {
        if (!["host", "cf-connecting-ip", "cf-ray", "x-forwarded-for", "connection"].includes(key.toLowerCase())) {
          try {
            headers.set(key, value);
          } catch (e) {
            console.error(`\u65E0\u6CD5\u8BBE\u7F6E\u8BF7\u6C42\u5934 ${key}: ${e.message}`);
          }
        }
      }
      headers.set("Host", new URL(ORIGIN).host);
      headers.set("Origin", ORIGIN);
      headers.set("Referer", `${ORIGIN}${path}`);
      const cookies = request.headers.get("cookie");
      if (cookies) {
        console.log(`\u8F6C\u53D1Cookie: ${cookies.substring(0, 100)}...`);
      }
      const requestInit = {
        method: request.method,
        headers,
        redirect: "follow"
      };
      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        try {
          const contentType2 = request.headers.get("content-type");
          const bodyText = await request.clone().text();
          requestInit.body = bodyText;
          console.log(`\u8BF7\u6C42\u4F53\u7C7B\u578B: ${contentType2}, \u957F\u5EA6: ${bodyText.length}`);
        } catch (e) {
          console.error(`\u65E0\u6CD5\u8BFB\u53D6\u8BF7\u6C42\u4F53: ${e.message}`);
        }
      }
      console.log(`\u8BF7\u6C42\u6E90\u7AD9: ${targetUrl}`);
      const response = await fetch(targetUrl, requestInit);
      console.log(`\u6E90\u7AD9\u54CD\u5E94\u72B6\u6001: ${response.status} ${response.statusText}`);
      if (response.status === 404 && path === "/") {
        console.log("\u68C0\u6D4B\u5230\u4E3B\u9875404\u9519\u8BEF\uFF0C\u5C1D\u8BD5\u8BBF\u95EE\u6E90\u7AD9\u6839\u76EE\u5F55");
        return await fetch(`${ORIGIN}/`, requestInit).then(async (indexResponse) => {
          if (indexResponse.ok) {
            console.log("\u6210\u529F\u83B7\u53D6\u4E3B\u9875\u5185\u5BB9");
            return createProxyResponse(indexResponse, url);
          } else {
            throw new Error("\u65E0\u6CD5\u83B7\u53D6\u4E3B\u9875\u5185\u5BB9");
          }
        });
      }
      const responseHeaders = new Headers();
      const setCookieHeaders = [];
      for (const [key, value] of response.headers.entries()) {
        if (key.toLowerCase() === "set-cookie") {
          setCookieHeaders.push(value);
        } else if (key.toLowerCase() === "content-encoding") {
          console.log(`\u8DF3\u8FC7\u538B\u7F29\u5934 ${key}=${value}`);
          continue;
        } else {
          try {
            responseHeaders.set(key, value);
          } catch (e) {
            console.log(`\u8DF3\u8FC7\u54CD\u5E94\u5934 ${key}: ${e.message}`);
          }
        }
      }
      if (setCookieHeaders.length > 0) {
        console.log(`\u8FD4\u56DE${setCookieHeaders.length}\u4E2ACookie`);
        setCookieHeaders.forEach((cookie) => {
          responseHeaders.append("Set-Cookie", cookie);
        });
      }
      responseHeaders.set("Access-Control-Allow-Origin", url.origin);
      responseHeaders.set("Access-Control-Allow-Credentials", "true");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, New-API-User");
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: responseHeaders
        });
      }
      const contentType = response.headers.get("content-type") || "";
      console.log(`\u54CD\u5E94\u5185\u5BB9\u7C7B\u578B: ${contentType}`);
      if (contentType.includes("text/html")) {
        let htmlContent = await response.text();
        console.log(`HTML\u54CD\u5E94\u5927\u5C0F: ${htmlContent.length} \u5B57\u7B26`);
        console.log(`HTML\u5185\u5BB9\u5F00\u5934: ${htmlContent.substring(0, 100).replace(/\n/g, "\u21B5")}...`);
        if (!responseHeaders.has("content-type")) {
          responseHeaders.set("Content-Type", "text/html; charset=utf-8");
        }
        htmlContent = htmlContent.replace(/href=["']http:\/\/166\.108\.203\.60:3000\//g, 'href="/');
        htmlContent = htmlContent.replace(/src=["']http:\/\/166\.108\.203\.60:3000\//g, 'src="/');
        return new Response(htmlContent, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      } else if (contentType.includes("javascript") || path.endsWith(".js")) {
        const jsContent = await response.text();
        console.log(`JS\u54CD\u5E94\u5927\u5C0F: ${jsContent.length} \u5B57\u7B26`);
        responseHeaders.set("Content-Type", "application/javascript; charset=utf-8");
        return new Response(jsContent, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      } else if (contentType.includes("text/css") || path.endsWith(".css")) {
        const cssContent = await response.text();
        console.log(`CSS\u54CD\u5E94\u5927\u5C0F: ${cssContent.length} \u5B57\u7B26`);
        responseHeaders.set("Content-Type", "text/css; charset=utf-8");
        return new Response(cssContent, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      } else if (contentType.includes("application/json") || path.includes("/api/") || path.endsWith(".json")) {
        const jsonText = await response.text();
        console.log(`JSON\u54CD\u5E94\u5927\u5C0F: ${jsonText.length} \u5B57\u7B26`);
        try {
          JSON.parse(jsonText);
        } catch (e) {
          console.log(`\u8B66\u544A: \u54CD\u5E94\u58F0\u79F0\u662FJSON\uFF0C\u4F46\u683C\u5F0F\u4E0D\u6B63\u786E: ${e.message}`);
        }
        responseHeaders.set("Content-Type", "application/json; charset=utf-8");
        return new Response(jsonText, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      } else if ([".woff", ".woff2", ".ttf", ".eot", ".otf"].some((ext) => path.toLowerCase().endsWith(ext))) {
        const fontData = await response.arrayBuffer();
        console.log(`\u5B57\u4F53\u6587\u4EF6\u54CD\u5E94\u5927\u5C0F: ${fontData.byteLength} \u5B57\u8282`);
        if (path.endsWith(".woff"))
          responseHeaders.set("Content-Type", "font/woff");
        else if (path.endsWith(".woff2"))
          responseHeaders.set("Content-Type", "font/woff2");
        else if (path.endsWith(".ttf"))
          responseHeaders.set("Content-Type", "font/ttf");
        else if (path.endsWith(".eot"))
          responseHeaders.set("Content-Type", "application/vnd.ms-fontobject");
        else if (path.endsWith(".otf"))
          responseHeaders.set("Content-Type", "font/otf");
        return new Response(fontData, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      } else if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico"].some((ext) => path.toLowerCase().endsWith(ext))) {
        const imageData = await response.arrayBuffer();
        console.log(`\u56FE\u7247\u54CD\u5E94\u5927\u5C0F: ${imageData.byteLength} \u5B57\u8282`);
        if (path.endsWith(".png"))
          responseHeaders.set("Content-Type", "image/png");
        else if (path.endsWith(".jpg") || path.endsWith(".jpeg"))
          responseHeaders.set("Content-Type", "image/jpeg");
        else if (path.endsWith(".gif"))
          responseHeaders.set("Content-Type", "image/gif");
        else if (path.endsWith(".webp"))
          responseHeaders.set("Content-Type", "image/webp");
        else if (path.endsWith(".svg"))
          responseHeaders.set("Content-Type", "image/svg+xml");
        else if (path.endsWith(".ico"))
          responseHeaders.set("Content-Type", "image/x-icon");
        return new Response(imageData, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      } else {
        const data = await response.arrayBuffer();
        console.log(`\u5176\u4ED6\u7C7B\u578B\u54CD\u5E94\u5927\u5C0F: ${data.byteLength} \u5B57\u8282`);
        return new Response(data, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      }
    } catch (err) {
      console.error(`\u4EE3\u7406\u8BF7\u6C42\u5931\u8D25: ${err.message}`);
      console.error(err.stack);
      return new Response(
        `<!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <title>\u4EE3\u7406\u8BF7\u6C42\u5931\u8D25</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
          .error { background: #fff0f0; border: 1px solid #ffccc7; padding: 1rem; border-radius: 4px; }
          .details { margin-top: 1rem; background: #f5f5f5; padding: 1rem; border-radius: 4px; }
          code { font-family: monospace; background: #f0f0f0; padding: 0.2em 0.4em; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>\u4EE3\u7406\u8BF7\u6C42\u5931\u8D25</h1>
        <div class="error">
          <p><strong>\u9519\u8BEF\u4FE1\u606F:</strong> ${err.message}</p>
        </div>
        <div class="details">
          <p><strong>\u8BF7\u6C42\u8DEF\u5F84:</strong> <code>${path}</code></p>
          <p><strong>\u76EE\u6807URL:</strong> <code>${targetUrl}</code></p>
          <p><strong>\u8BF7\u6C42\u65B9\u6CD5:</strong> ${request.method}</p>
          <p><strong>\u65F6\u95F4:</strong> ${(/* @__PURE__ */ new Date()).toLocaleString()}</p>
        </div>
        <p>\u8BF7\u5237\u65B0\u9875\u9762\u91CD\u8BD5\uFF0C\u6216\u8054\u7CFB\u7BA1\u7406\u5458\u3002</p>
      </body>
      </html>`,
        {
          status: 500,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store"
          }
        }
      );
    }
  }
  function createProxyResponse(response, originalUrl) {
    const responseHeaders = new Headers();
    const setCookieHeaders = [];
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() === "set-cookie") {
        setCookieHeaders.push(value);
      } else if (key.toLowerCase() === "content-encoding") {
        continue;
      } else {
        try {
          responseHeaders.set(key, value);
        } catch (e) {
          console.log(`\u8DF3\u8FC7\u54CD\u5E94\u5934 ${key}: ${e.message}`);
        }
      }
    }
    if (setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookie) => {
        responseHeaders.append("Set-Cookie", cookie);
      });
    }
    responseHeaders.set("Access-Control-Allow-Origin", originalUrl.origin);
    responseHeaders.set("Access-Control-Allow-Credentials", "true");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, New-API-User");
    return response.text().then((htmlContent) => {
      htmlContent = htmlContent.replace(/href=["']http:\/\/166\.108\.203\.60:3000\//g, 'href="/');
      htmlContent = htmlContent.replace(/src=["']http:\/\/166\.108\.203\.60:3000\//g, 'src="/');
      responseHeaders.set("Content-Type", "text/html; charset=utf-8");
      return new Response(htmlContent, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
    });
  }

        pagesFunctionResponse = onRequest;
      })();
          }
        

        const params = {};
        if (routeParams.id) {
          if (routeParams.mode === 1) {
            const value = urlInfo.pathname.match(routeParams.left);        
            for (let i = 1; i < value.length; i++) {
              params[routeParams.id[i - 1]] = value[i];
            }
          } else {
            const value = urlInfo.pathname.replace(routeParams.left, '');
            const splitedValue = value.split('/');
            if (splitedValue.length === 1) {
              params[routeParams.id] = splitedValue[0];
            } else {
              params[routeParams.id] = splitedValue;
            }
          }
          
        }
        if(!matchedFunc){
          pagesFunctionResponse = function() {
            return new Response(null, {
              status: 404,
              headers: {
                "content-type": "text/html; charset=UTF-8",
                "x-edgefunctions-test": "Welcome to use Pages Functions.",
              },
            });
          }
        }
        return pagesFunctionResponse({request, params, env: {} });
      }addEventListener('fetch',event=>{return event.respondWith(handleRequest({request:event.request,params: {}, env: {} }))});