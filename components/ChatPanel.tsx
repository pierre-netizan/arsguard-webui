import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatPanelProps {
  label: string;
  badge: string;
  badgeClass: string;
  endpoint: string;
  accentColor: string;
  securityCheckUrl?: string;
  onError?: (msg: string) => void;
}

export interface ChatPanelHandle {
  sendMessage: (msg: string) => void;
}

const ChatPanel = forwardRef<ChatPanelHandle, ChatPanelProps>(
  ({ label, badge, badgeClass, endpoint, accentColor, securityCheckUrl, onError }, ref) => {
    const [messages, setMessages] = useState<Message[]>([
      { role: 'system', content: `${label} 面板已就绪` },
    ]);
    const [loading, setLoading] = useState(false);
    const [models, setModels] = useState<string[]>(['qwen3:0.6b']);
    const [selectedModel, setSelectedModel] = useState('qwen3:0.6b');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      fetchModels();
    }, []);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function fetchModels() {
      try {
        const res = await fetch(`${endpoint}/v1/models`);
        console.log(`[${badge}] fetchModels -> ${res.status}`);
        if (res.ok) {
          const data = await res.json();
          const list = data?.data?.map((m: any) => m.id || m.name) || [];
          if (list.length > 0) {
            setModels(list);
            setSelectedModel(list[0]);
          }
        }
      } catch (err) {
        console.warn(`[${badge}] fetchModels error:`, err);
      }
    }

    async function checkSecurity(prompt: string): Promise<{ allowed: boolean; reason?: string } | null> {
      if (!securityCheckUrl) return null;
      try {
        const res = await fetch(securityCheckUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        if (!res.ok) return null;
        return await res.json();
      } catch (err) {
        console.error(`[${badge}] security check error:`, err);
        return null;
      }
    }

    async function sendMessage(msg: string) {
      const text = msg.trim();
      if (!text || loading) return;
      console.log(`[${badge}] sendMessage: "${text.slice(0, 100)}"`);

      setMessages((prev) => [...prev, { role: 'user', content: text }]);
      setLoading(true);

      if (securityCheckUrl) {
        const verdict = await checkSecurity(text);
        if (verdict && !verdict.allowed) {
          const reason = verdict.reason || 'Blocked by security policy';
          console.log(`[${badge}] BLOCKED by arsguard: ${reason}`);
          setMessages((prev) => [...prev, { role: 'system', content: `🔒 Blocked: ${reason}` }]);
          setLoading(false);
          return;
        }
        if (verdict && verdict.allowed) {
          console.log(`[${badge}] ALLOWED by arsguard`);
        }
      }

      const payload = {
        model: selectedModel,
        messages: [...messages.filter(m => m.role !== 'system'), { role: 'user', content: text }],
        stream: false,
      };
      console.log(`[${badge}] POST ${endpoint}/v1/chat/completions`, payload);

      try {
        const res = await fetch(`${endpoint}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        console.log(`[${badge}] response status: ${res.status}`);
        if (!res.ok) {
          const errBody = await res.text().catch(() => '');
          console.error(`[${badge}] error body: ${errBody}`);
          let errMsg = `HTTP ${res.status}`;
          try { const j = JSON.parse(errBody); errMsg = j.error?.message || errMsg; } catch {}
          setMessages((prev) => [...prev, { role: 'system', content: `❌ ${errMsg}` }]);
          onError?.(errMsg);
          return;
        }

        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || data.response || JSON.stringify(data);
        console.log(`[${badge}] reply: "${(reply || '').slice(0, 100)}..."`);
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      } catch (err: any) {
        console.error(`[${badge}] fetch error:`, err);
        setMessages((prev) => [...prev, { role: 'system', content: `❌ Connection error: ${err.message}` }]);
        onError?.(err.message);
      } finally {
        setLoading(false);
      }
    }

    useImperativeHandle(ref, () => ({ sendMessage }), [sendMessage]);

    return (
      <div className="pane" style={{ borderTop: `3px solid ${accentColor}20` }}>
        <div className="pane-header">
          <div className="label">
            <span className={`badge ${badgeClass}`}>{badge}</span>
            {label}
          </div>
          <div className="model-select-group">
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{endpoint}</span>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              {msg.content}
              {loading && i === messages.length - 1 && msg.role === 'user' && (
                <span className="loading-dots" />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  }
);

ChatPanel.displayName = 'ChatPanel';
export default ChatPanel;
