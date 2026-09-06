import { useEffect, useMemo, useState } from "react";
import { Hash, MessageCircle, MoreHorizontal, Plus, Search, Settings2, Smile, Trash2, Users, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Server = { id: string; name: string; icon: string; ownerId: string };
type Channel = { id: string; name: string; category: string; categoryId: string };
type Reaction = { emoji: string; count: number; reacted: boolean };
type Message = { id: string; body: string; authorId: string; username: string; displayName?: string; avatarSeed?: string; createdAt: string; reactions: Reaction[] };
type Emoji = { character: string; unicodeName: string };

async function api<T>(path: string, options?: RequestInit) {
  const response = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Chat request failed.");
  return data as T;
}

const emojiFallback: Emoji[] = ["😀", "😂", "😍", "😎", "🥳", "🤔", "🙌", "👏", "🔥", "✨", "❤️", "✅", "🎉", "🚀", "🌿", "☕"].map((character) => ({ character, unicodeName: character }));

export default function Chat() {
  const { user } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [serverId, setServerId] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelId, setChannelId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [newChannel, setNewChannel] = useState("");
  const [newServer, setNewServer] = useState("");
  const [emojiSearch, setEmojiSearch] = useState("");
  const [emojis, setEmojis] = useState<Emoji[]>(emojiFallback);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [ownerTools, setOwnerTools] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const isAdmin = user?.role === "owner" || user?.role === "admin";
  const server = servers.find((item) => item.id === serverId);
  const channel = channels.find((item) => item.id === channelId);
  const grouped = useMemo(() => channels.reduce<Record<string, Channel[]>>((acc, item) => { (acc[item.category] ??= []).push(item); return acc; }, {}), [channels]);

  const loadServers = async () => {
    const result = await api<{ servers: Server[] }>("/api/chat/servers");
    setServers(result.servers);
    setServerId((current) => current || result.servers[0]?.id || "");
  };
  const loadChannels = async (id: string) => {
    const result = await api<{ channels: Channel[] }>(`/api/chat/servers/${id}/channels`);
    setChannels(result.channels);
    setChannelId((current) => result.channels.some((item) => item.id === current) ? current : result.channels[0]?.id || "");
  };
  const loadMessages = async (id: string) => {
    setMessagesLoading(true);
    try { const result = await api<{ messages: Message[] }>(`/api/chat/channels/${id}/messages`); setMessages(result.messages); } finally { setMessagesLoading(false); }
  };
  useEffect(() => { if (!user) return; void loadServers().catch((err: Error) => setError(err.message)).finally(() => setLoading(false)); }, [user]);
  useEffect(() => { if (serverId) void loadChannels(serverId).catch((err: Error) => setError(err.message)); }, [serverId]);
  useEffect(() => { if (channelId) void loadMessages(channelId).catch((err: Error) => setError(err.message)); }, [channelId]);
  useEffect(() => {
    if (!emojiSearch.trim()) { setEmojis(emojiFallback); return; }
    const controller = new AbortController();
    const key = import.meta.env.VITE_EMOJI_API_KEY as string | undefined;
    const query = `https://emoji-api.com/emojis?search=${encodeURIComponent(emojiSearch)}${key ? `&access_key=${encodeURIComponent(key)}` : ""}`;
    void fetch(query, { signal: controller.signal }).then((response) => response.ok ? response.json() as Promise<Emoji[]> : []).then((result) => setEmojis(result.slice(0, 48))).catch(() => setEmojis(emojiFallback));
    return () => controller.abort();
  }, [emojiSearch]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !channelId) return;
    try { const result = await api<{ message: Message }>(`/api/chat/channels/${channelId}/messages`, { method: "POST", body: JSON.stringify({ body }) }); setMessages((current) => [...current, result.message]); setDraft(""); } catch (err) { setError(err instanceof Error ? err.message : "Could not send message."); }
  };
  const react = async (message: Message, emoji: string) => {
    const current = message.reactions.find((item) => item.emoji === emoji);
    try {
      if (current?.reacted) await api(`/api/chat/messages/${message.id}/reactions/${encodeURIComponent(emoji)}`, { method: "DELETE" });
      else await api(`/api/chat/messages/${message.id}/reactions`, { method: "POST", body: JSON.stringify({ emoji }) });
      await loadMessages(channelId);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update reaction."); }
  };
  const createServer = async () => { const name = newServer.trim(); if (!name) return; try { const result = await api<{ server: Server }>("/api/chat/servers", { method: "POST", body: JSON.stringify({ name }) }); setServers((current) => [...current, result.server]); setServerId(result.server.id); setNewServer(""); } catch (err) { setError(err instanceof Error ? err.message : "Could not create server."); } };
  const createChannel = async () => { const name = newChannel.trim(); if (!name || !serverId) return; try { const result = await api<{ channel: Channel }>(`/api/chat/servers/${serverId}/channels`, { method: "POST", body: JSON.stringify({ name }) }); setChannels((current) => [...current, result.channel]); setChannelId(result.channel.id); setNewChannel(""); } catch (err) { setError(err instanceof Error ? err.message : "Could not create channel."); } };
  const renameChannel = async (item: Channel) => { const name = window.prompt("Channel name", item.name); if (!name || name === item.name) return; try { await api(`/api/chat/channels/${item.id}`, { method: "PATCH", body: JSON.stringify({ name }) }); setChannels((current) => current.map((entry) => entry.id === item.id ? { ...entry, name } : entry)); } catch (err) { setError(err instanceof Error ? err.message : "Could not rename channel."); } };
  const deleteChannel = async (item: Channel) => { if (!window.confirm(`Delete #${item.name}?`)) return; try { await api(`/api/chat/channels/${item.id}`, { method: "DELETE" }); const next = channels.filter((entry) => entry.id !== item.id); setChannels(next); setChannelId(next[0]?.id || ""); } catch (err) { setError(err instanceof Error ? err.message : "Could not delete channel."); } };
  const deleteServer = async () => { if (!server || !window.confirm(`Delete ${server.name}?`)) return; try { await api(`/api/chat/servers/${server.id}`, { method: "DELETE" }); const next = servers.filter((entry) => entry.id !== server.id); setServers(next); setServerId(next[0]?.id || ""); } catch (err) { setError(err instanceof Error ? err.message : "Could not delete server."); } };

  if (loading) return <div className="profile-loading">Loading chat...</div>;
  if (!user) return <div className="chat-page page-enter"><div className="studio-empty">Sign in to join Serene chat.</div></div>;
  return <div className="chat-page page-enter">
    <div className="page-title-row compact-title"><div><span className="eyebrow">Community</span><h1>Chat rooms.</h1><p>Servers, categories, and channels that stay inside Serene.</p></div>{isAdmin && <button className={`secondary-button small ${ownerTools ? "is-active" : ""}`} onClick={() => setOwnerTools((value) => !value)}><Settings2 size={14} /> Owner tools</button>}</div>
    {error && <div className="auth-error">{error}<button onClick={() => setError("")} aria-label="Dismiss"><X size={13} /></button></div>}
    <div className="chat-shell"><aside className="server-rail"><div className="presence-orb" title="Online" />{servers.map((item) => <button key={item.id} className={item.id === server?.id ? "is-active" : ""} title={item.name} onClick={() => setServerId(item.id)}><span>{item.icon || item.name.slice(0, 1).toUpperCase()}</span></button>)}{isAdmin && <button className="server-add" onClick={() => setNewServer("")}><Plus size={16} /></button>}</aside>
      <aside className="channel-rail"><div className="channel-head"><strong>{server?.name || "No server"}</strong><Users size={15} /></div>{Object.entries(grouped).map(([category, items]) => <div className="channel-group" key={category}><span>{category}</span>{items.map((item) => <div className="channel-entry" key={item.id}><button className={item.id === channel?.id ? "is-active" : ""} onClick={() => setChannelId(item.id)}><Hash size={14} />{item.name}</button>{isAdmin && <span className="channel-actions"><button onClick={() => void renameChannel(item)} aria-label={`Rename ${item.name}`}><MoreHorizontal size={13} /></button><button onClick={() => void deleteChannel(item)} aria-label={`Delete ${item.name}`}><Trash2 size={12} /></button></span>}</div>)}</div>)}{!channels.length && <div className="studio-empty">No channels yet.</div>}{ownerTools && isAdmin && <div className="owner-chat-tools"><input value={newChannel} onChange={(e) => setNewChannel(e.target.value)} placeholder="New channel" /><button onClick={() => void createChannel()}>Add channel</button><input value={newServer} onChange={(e) => setNewServer(e.target.value)} placeholder="New server" /><button onClick={() => void createServer()}>Add server</button>{server && <button className="danger-button small" onClick={() => void deleteServer()}>Delete server</button>}</div>}</aside>
      <section className="chat-main"><header className="chat-main-head"><div><span className="eyebrow">Channel</span><h2><Hash size={17} /> {channel?.name || "Choose a channel"}</h2></div><span className="chat-status"><i /> Online in {server?.name || "Serene"}</span></header><div className="message-list">{messagesLoading ? <div className="chat-empty">Loading messages...</div> : messages.length ? messages.map((message) => <article className="message-row" key={message.id}><span className="message-avatar" title={message.displayName || message.username}>{(message.displayName || message.username).slice(0, 1).toUpperCase()}</span><div className="message-content"><div><strong>{message.displayName || message.username}</strong><small>@{message.username} · {new Date(message.createdAt).toLocaleString()}</small></div><p>{message.body}</p><div className="reaction-list">{message.reactions.map((reaction) => <button key={reaction.emoji} className={reaction.reacted ? "is-reacted" : ""} onClick={() => void react(message, reaction.emoji)}>{reaction.emoji} {reaction.count}</button>)}<button className="reaction-add" onClick={() => setEmojiOpen((open) => !open)} aria-label="Add reaction"><Smile size={13} /></button></div></div></article>) : <div className="chat-empty">No messages here yet. Start the conversation.</div>}</div><form className="chat-composer" onSubmit={(event) => { event.preventDefault(); void send(); }}><button type="button" className="emoji-trigger" onClick={() => setEmojiOpen((open) => !open)} aria-label="Open emoji picker"><Smile size={17} /></button><input value={draft} onChange={(event) => setDraft(event.target.value)} disabled={!channelId} placeholder={channelId ? `Message #${channel?.name}` : "Choose a channel first"} /><button className="primary-button small" disabled={!draft.trim() || !channelId}>Send</button>{emojiOpen && <div className="emoji-picker"><div className="emoji-search"><Search size={13} /><input value={emojiSearch} onChange={(event) => setEmojiSearch(event.target.value)} placeholder="Search emoji" /></div><div className="emoji-grid">{emojis.map((emoji) => <button type="button" key={`${emoji.character}-${emoji.unicodeName}`} title={emoji.unicodeName} onClick={() => { setDraft((current) => `${current}${emoji.character}`); setEmojiOpen(false); }}>{emoji.character}</button>)}</div></div>}</form></section></div>
  </div>;
}
