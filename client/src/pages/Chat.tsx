import { useMemo, useState } from "react";
import { Hash, MessageCircle, Plus, Settings2, Users, X } from "lucide-react";

type Channel = { id: string; name: string; category: string };
type Server = { id: string; name: string; channels: Channel[] };

const initialServers: Server[] = [
  { id: "serene", name: "Serene", channels: [{ id: "general", name: "general", category: "Welcome" }, { id: "games", name: "games", category: "Welcome" }, { id: "feedback", name: "feedback", category: "Community" }] },
  { id: "arcade", name: "Arcade Club", channels: [{ id: "lobby", name: "lobby", category: "Community" }, { id: "clips", name: "clips", category: "Community" }] },
];

export default function Chat() {
  const [servers, setServers] = useState<Server[]>(() => { try { return JSON.parse(localStorage.getItem("serene-chat-servers") || "") || initialServers; } catch { return initialServers; } });
  const [serverId, setServerId] = useState("serene");
  const [channelId, setChannelId] = useState("general");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Record<string, string[]>>(() => { try { return JSON.parse(localStorage.getItem("serene-chat-messages") || "{}") || {}; } catch { return {}; } });
  const [ownerTools, setOwnerTools] = useState(false);
  const [newChannel, setNewChannel] = useState("");
  const [newServer, setNewServer] = useState("");
  const server = servers.find((item) => item.id === serverId) ?? servers[0];
  const channel = server.channels.find((item) => item.id === channelId) ?? server.channels[0];
  const key = `${server.id}:${channel.id}`;
  const channelMessages = messages[key] ?? ["welcome to Serene chat", "keep it kind and have fun"];
  const grouped = useMemo(() => server.channels.reduce<Record<string, Channel[]>>((acc, item) => { (acc[item.category] ??= []).push(item); return acc; }, {}), [server]);

  const persistServers = (next: Server[]) => { setServers(next); localStorage.setItem("serene-chat-servers", JSON.stringify(next)); };
  const send = () => { const value = draft.trim(); if (!value) return; const next = { ...messages, [key]: [...channelMessages, value] }; setMessages(next); localStorage.setItem("serene-chat-messages", JSON.stringify(next)); setDraft(""); };

  return <div className="chat-page page-enter"><div className="page-title-row compact-title"><div><span className="eyebrow">Community</span><h1>Chat rooms.</h1><p>Servers, categories, and channels that stay inside Serene.</p></div><button className={`secondary-button small ${ownerTools ? "is-active" : ""}`} onClick={() => setOwnerTools(!ownerTools)}><Settings2 size={14} /> Owner tools</button></div><div className="chat-shell"><aside className="server-rail">{servers.map((item) => <button key={item.id} className={item.id === server.id ? "is-active" : ""} title={item.name} onClick={() => { setServerId(item.id); setChannelId(item.channels[0]?.id ?? ""); }}><span>{item.name.slice(0, 1).toUpperCase()}</span></button>)}<button className="server-add" onClick={() => setOwnerTools(true)}><Plus size={16} /></button></aside><aside className="channel-rail"><div className="channel-head"><strong>{server.name}</strong><Users size={15} /></div>{Object.entries(grouped).map(([category, items]) => <div className="channel-group" key={category}><span>{category}</span>{items.map((item) => <button key={item.id} className={item.id === channel.id ? "is-active" : ""} onClick={() => setChannelId(item.id)}><Hash size={14} />{item.name}</button>)}</div>)}{ownerTools && <div className="owner-chat-tools"><input value={newChannel} onChange={(e) => setNewChannel(e.target.value)} placeholder="new channel" /><button onClick={() => { const name = newChannel.trim().toLowerCase().replace(/\s+/g, "-"); if (!name) return; const next = servers.map((item) => item.id === server.id ? { ...item, channels: [...item.channels, { id: `${name}-${Date.now()}`, name, category: "Community" }] } : item); persistServers(next); setNewChannel(""); }}>Add</button><input value={newServer} onChange={(e) => setNewServer(e.target.value)} placeholder="new server" /><button onClick={() => { const name = newServer.trim(); if (!name) return; const id = `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`; const next = [...servers, { id, name, channels: [{ id: "general", name: "general", category: "Welcome" }] }]; persistServers(next); setServerId(id); setChannelId("general"); setNewServer(""); }}>Create</button></div>}</aside><section className="chat-main"><header><div><span className="eyebrow">#{channel.name}</span><h2>{channel.name}</h2></div><span className="chat-status"><i /> live</span></header><div className="chat-messages">{channelMessages.map((message, index) => <div className="chat-message" key={`${message}-${index}`}><span className="avatar">{index % 2 ? "S" : "E"}</span><div><strong>{index % 2 ? "serene member" : "Eternal"}</strong><p>{message}</p></div></div>)}</div><div className="chat-compose"><input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={`Message #${channel.name}`} /><button onClick={send}><MessageCircle size={16} /></button></div></section></div></div>;
}
