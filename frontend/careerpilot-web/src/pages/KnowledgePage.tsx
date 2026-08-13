import React, { useState } from 'react';
import { knowledgeApi, ChatMessageTurn } from '../api/knowledgeApi';
import { Sparkles, Send, RefreshCw, AlertCircle, Bot, Trash2 } from 'lucide-react';

interface ChatTurn {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

export const KnowledgePage: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAskGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryText = prompt.trim();
    if (!queryText) return;

    // Build history payload for follow-up questions
    const historyPayload: ChatMessageTurn[] = turns.map(t => ({
      role: t.sender,
      content: t.text
    }));

    const userTurn: ChatTurn = {
      id: Date.now().toString() + '-user',
      sender: 'user',
      text: queryText
    };

    setTurns(prev => [...prev, userTurn]);
    setPrompt('');
    setLoading(true);
    setError(null);

    try {
      const res = await knowledgeApi.queryKnowledge(queryText, 4, historyPayload);
      if (res.success && res.data) {
        const assistantTurn: ChatTurn = {
          id: Date.now().toString() + '-assistant',
          sender: 'assistant',
          text: res.data.answer
        };
        setTurns(prev => [...prev, assistantTurn]);
      } else {
        setError(res.message || 'Failed to get response from Gemini AI.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gemini AI communication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setTurns([]);
    setPrompt('');
    setError(null);
  };

  const renderFormattedMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx} className="text-base font-bold text-orange-400 mt-4 mb-2">{trimmed.substring(4)}</h3>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-bold text-slate-100 mt-5 mb-2 border-b border-slate-800 pb-1">{trimmed.substring(3)}</h2>;
      }
      if (trimmed.startsWith('# ')) {
        return <h1 key={idx} className="text-xl font-extrabold text-slate-100 mt-6 mb-3">{trimmed.substring(2)}</h1>;
      }
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-200 py-0.5 leading-relaxed">
            {renderInlineMarkdown(trimmed.substring(2))}
          </li>
        );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        const content = trimmed.replace(/^\d+\.\s/, '');
        return (
          <li key={idx} className="ml-4 list-decimal text-slate-200 py-0.5 leading-relaxed">
            {renderInlineMarkdown(content)}
          </li>
        );
      }
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-sm text-slate-200 leading-relaxed my-1">
          {renderInlineMarkdown(trimmed)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (inlineText: string) => {
    const parts = inlineText.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-orange-300 font-mono text-xs border border-slate-700">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Gemini AI Assistant</h1>
            <p className="text-xs text-slate-400">Ask technical questions, career roadmaps, or interview guidance.</p>
          </div>
        </div>

        {turns.length > 0 && (
          <button
            onClick={handleClearChat}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Chat
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">✕</button>
        </div>
      )}

      {/* Conversation Thread Display */}
      {turns.length > 0 && (
        <div className="space-y-4">
          {turns.map((t) => (
            <div
              key={t.id}
              className={`rounded-xl p-6 shadow-xl border space-y-3 ${
                t.sender === 'user'
                  ? 'bg-slate-900/70 border-slate-800 ml-8'
                  : 'bg-slate-900 border-slate-800 mr-4'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider border-b border-slate-800 pb-2.5">
                {t.sender === 'user' ? (
                  <span className="text-slate-400 font-mono">You</span>
                ) : (
                  <span className="text-orange-400 flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-4 h-4 text-orange-400" /> CareerPilot Gemini AI
                  </span>
                )}
              </div>

              <div className="text-sm text-slate-200 leading-relaxed">
                {t.sender === 'user' ? (
                  <p className="font-medium text-slate-100">{t.text}</p>
                ) : (
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80">
                    {renderFormattedMarkdown(t.text)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single Prompt Window */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <form onSubmit={handleAskGemini} className="space-y-4">
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask Gemini AI a question (e.g., 'hi', 'what is Spring Boot dependency injection?', 'how can I improve my resume?')..."
            className="w-full p-4 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-orange-500 leading-relaxed resize-none font-sans"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAskGemini(e);
              }
            }}
          />

          <div className="flex justify-between items-center">
            <span className="text-[11px] text-slate-500">Press Enter to send, Shift+Enter for new line</span>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-all flex items-center gap-2 shadow-md shadow-orange-500/10 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Ask Gemini
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
