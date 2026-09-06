export type BrowserRuntime = "direct" | "scramjet" | "blocked";

const scramjetProxyTemplate = import.meta.env.VITE_SCRAMJET_PROXY_URL as string | undefined;
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
  if (blockedHosts.has(parsed.hostname)) return { runtime: "blocked", url, reason: "This destination commonly blocks direct framing. Configure a permitted Scramjet runtime for supported browsing." };
  return { runtime: "direct", url: parsed.toString() };
}

export function hasScramjetRuntime() { return Boolean(scramjetProxyTemplate?.includes("{url}")); }
