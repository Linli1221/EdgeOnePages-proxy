
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
    try {
      const targetUrl = `${ORIGIN}${path}`;
      const response = await fetch(targetUrl);
      return new Response(response.body, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("content-type") || "text/html",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } catch (error) {
      return new Response(
        `<html>
        <head><title>\u4EE3\u7406\u9519\u8BEF</title></head>
        <body>
          <h1>\u4EE3\u7406\u8BF7\u6C42\u5931\u8D25</h1>
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