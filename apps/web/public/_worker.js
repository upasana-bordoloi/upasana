export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy requests starting with /api/ to the backend Worker API
    if (url.pathname.startsWith("/api/")) {
      const targetUrl = "https://gallery-api.jooart96.workers.dev" + url.pathname + url.search;
      const modifiedRequest = new Request(targetUrl, request);
      return fetch(modifiedRequest);
    }

    // Fallback to serving the static assets from Cloudflare Pages
    return env.ASSETS.fetch(request);
  },
};
