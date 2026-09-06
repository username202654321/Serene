export type BrowserRuntime = "direct" | "scramjet" | "blocked";

const configuredScramjetProxy = import.meta.env.VITE_SCRAMJET_PROXY_URL as string | undefined;
const scramjetProxyTemplate = (() => {
  if (!configuredScramjetProxy?.includes("{url}")) return undefined;
  try {
    const hostname = new URL(configuredScramjetProxy.replace("{url}", "https://example.com")).hostname;
    return hostname.endsWith(".example") || hostname === "example.com" || hostname === "www.example.com" ? undefined : configuredScramjetProxy;
  } catch {
    return undefined;
  }
})();
const blockedHosts = new Set(["www.youtube.com", "youtube.com", "github.com", "www.github.com", "duckduckgo.com"]);

export type BrowserDestination = {
  runtime: BrowserRuntime;
  url: string;
  reason?: string;
};

export function resolveBrowserDestination(url: string): BrowserDestination {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { runtime: "blocked", url, reason: "That is not a valid web address." };
  }
  if (!/^https?:$/.test(parsed.protocol)) return { runtime: "blocked", url, reason: "Only HTTP and HTTPS destinations are supported." };
  if (scramjetProxyTemplate?.includes("{url}")) return { runtime: "scramjet", url: scramjetProxyTemplate.replace("{url}", encodeURIComponent(parsed.toString())) };
  if (blockedHosts.has(parsed.hostname)) return { runtime: "blocked", url, reason: hasScramjetRuntime() ? "This destination cannot be displayed directly." : "Proxy unavailable. Configure an authorized Scramjet runtime to open this destination." };
  return { runtime: "direct", url: parsed.toString() };
}

export function hasScramjetRuntime() { return Boolean(scramjetProxyTemplate?.includes("{url}")); }
