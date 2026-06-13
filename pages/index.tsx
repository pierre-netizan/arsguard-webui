import { useState, useRef } from 'react';
import ChatPanel, { ChatPanelHandle } from '../components/ChatPanel';

export default function Home() {
  const [bothInput, setBothInput] = useState('');
  const nativeRef = useRef<ChatPanelHandle>(null);
  const hardenedRef = useRef<ChatPanelHandle>(null);

  function sendToBoth() {
    const msg = bothInput.trim();
    if (!msg) return;
    nativeRef.current?.sendMessage(msg);
    hardenedRef.current?.sendMessage(msg);
    setBothInput('');
  }

  return (
    <div className="split-pane">
      <div className="global-header">
        <div>
          <h1>
            🔒 harden-openclaw
            <span className="subtitle">对比测试面板</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <textarea
            value={bothInput}
            onChange={(e) => setBothInput(e.target.value)}
            placeholder="输入提示词，同时发送到上下两个面板..."
            rows={1}
            style={{
              padding: '6px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 13,
              resize: 'none',
              outline: 'none',
              width: 360,
              fontFamily: 'inherit',
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendToBoth(); } }}
          />
          <button className="send-both-btn" onClick={sendToBoth} disabled={!bothInput.trim()}>
            ⇄ 同时发送
          </button>
        </div>
      </div>

      <div className="split-pane-body">
        <ChatPanel
          ref={nativeRef}
          label="原生 OpenClaw（无加固）"
          badge="NATIVE"
          badgeClass="native"
          endpoint="/api/native"
          accentColor="#3b82f6"
        />
        <div className="pane-divider" />
        <ChatPanel
          ref={hardenedRef}
          label="harden-openclaw（arsguard 加固）"
          badge="HARDENED"
          badgeClass="hardened"
          endpoint="/api/hardened"
          accentColor="#059669"
          securityCheckUrl="/api/arsguard/check"
        />
      </div>
    </div>
  );
}
