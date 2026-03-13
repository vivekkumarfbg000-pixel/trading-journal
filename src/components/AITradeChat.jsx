import { useState, useRef, useEffect } from 'react';
import './AITradeChat.css';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const SUGGESTIONS = [
  "What was my best trading day?",
  "Am I overtrading on any specific day?",
  "What's my win rate this month?",
  "Which strategy gives me the best results?",
  "Do I have any revenge trading patterns?",
  "How has my discipline improved over time?",
  "What tags are most profitable for me?",
  "Give me a performance summary"
];

export default function AITradeChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAuthHeaders = async () => {
    const { supabase } = await import('../lib/supabaseClient');
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': session ? `Bearer ${session.access_token}` : ''
    };
  };

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          message: text.trim(),
          conversationHistory
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Chat failed');
      }

      const data = await res.json();
      const aiMessage = { role: 'assistant', content: data.reply };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Error: ${err.message}. Please try again.`
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
    
    // Handle bullet points
    formatted = formatted.replace(/- (.*?)(<br\/>|$)/g, '<li>$1</li>');
    if (formatted.includes('<li>')) {
      formatted = formatted.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
    }

    return formatted;
  };

  return (
    <div className="card animate-in chat-container">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">💬</span> AI Trade Chat
        </span>
        {messages.length > 0 && (
          <button 
            className="btn-delete" 
            onClick={() => setMessages([])}
            title="Clear chat"
            style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px' }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <>
            <div className="chat-welcome">
              <span className="chat-welcome-icon">💬</span>
              <h3>Ask Anything About Your Trades</h3>
              <p>I have access to your complete trading history. Ask me about your P&L, patterns, best/worst days, strategy performance, and more.</p>
            </div>
            <div className="chat-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button 
                  key={i} 
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role === 'user' ? 'user' : 'ai'}`}>
              <div className="chat-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div 
                className="chat-bubble"
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
              />
            </div>
          ))
        )}

        {isLoading && (
          <div className="chat-typing">
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
            Analyzing your trades...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Ask about your trading performance..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button 
          className="chat-send-btn"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
        >
          →
        </button>
      </div>
    </div>
  );
}
