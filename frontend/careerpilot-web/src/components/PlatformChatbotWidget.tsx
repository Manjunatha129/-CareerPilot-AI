import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Minimize2,
  Maximize2,
  Minus
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const PlatformChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: "👋 Hi! I'm your CareerPilot AI Platform Assistant. Ask me anything about how to use our platform modules—Resume Matching, Job Search, Career Intelligence, or Application Tracking!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const quickPrompts = [
    'What is CareerPilot AI?',
    'How does Resume Matching work?',
    'How to search Jobs & get Job Alerts?',
    'How to track Applications?',
    'How to edit Profile & Settings?'
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Strictly platform-only responses
  const getPlatformResponse = (query: string): string => {
    const q = query.toLowerCase().trim();

    // Greetings
    if (q === 'hi' || q === 'hii' || q === 'hello' || q === 'hey' || q === 'greetings') {
      return "Hi there! 👋 I'm your CareerPilot AI Platform Assistant. How can I help you navigate or use our platform modules today?";
    }

    // 1. Platform Overview
    if (q.includes('what is careerpilot') || q.includes('about platform') || q.includes('platform overview') || q.includes('what does this app do')) {
      return "🚀 **CareerPilot AI Platform Overview**:\n\n" +
             "CareerPilot AI is an all-in-one AI career intelligence and job search platform containing 5 core modules:\n\n" +
             "1. **Resume & Job Matcher**: Compare uploaded PDF resumes against target JDs side-by-side.\n" +
             "2. **Job Intelligence Explorer**: Search real job listings from LinkedIn, Naukri, and Indeed with instant match notifications.\n" +
             "3. **Career Intelligence**: Get AI role recommendations and customized weekly learning roadmaps.\n" +
             "4. **Application Tracker**: Manage your job application pipeline on a visual Kanban board.\n" +
             "5. **Profile & Settings**: Manage target roles and account preferences.";
    }

    // 2. Resume & Job Matcher Module
    if (q.includes('resume') || q.includes('matcher') || q.includes('skill gap') || q.includes('jd')) {
      return "📄 **Resume & Job Matcher Module**:\n\n" +
             "• **Upload Resume**: Click 'Upload New Resume PDF' to upload and parse your resume.\n" +
             "• **Target JD Matcher**: Paste any target Job Description (JD) text on the right side and click 'Match Customized JD with Active Resume'.\n" +
             "• **AI Analysis**: Instantly view your overall match score, matched technical skills, missing skills, and AI explanation.";
    }

    // 3. Jobs & Notifications Module
    if (q.includes('job') || q.includes('alert') || q.includes('linkedin') || q.includes('naukri') || q.includes('indeed') || q.includes('search')) {
      return "💼 **Job Intelligence & Match Alerts Module**:\n\n" +
             "• **Open-Source Listings**: Browse real job postings aggregated from **LinkedIn Jobs**, **Naukri.com**, and **Indeed**.\n" +
             "• **Direct Apply Buttons**: Click 'Apply on LinkedIn/Naukri/Indeed' to open the exact external job posting.\n" +
             "• **Instant Match Alerts 🔔**: Click the top 'Alerts' bell button to view live notifications for high-matching jobs!";
    }

    // 4. Career Intelligence Module
    if (q.includes('career') || q.includes('roadmap') || q.includes('langgraph') || q.includes('direction') || q.includes('dashboard')) {
      return "🧠 **Career Intelligence Dashboard**:\n\n" +
             "• Click 'Career Intelligence' in the sidebar to run full workflow analysis.\n" +
             "• Powered by **LangGraph + Gemini AI**, it generates personalized target role recommendations, skill gap prioritization, and structured **weekly learning roadmaps**.";
    }

    // 5. Application Tracking / Kanban Module
    if (q.includes('application') || q.includes('track') || q.includes('kanban') || q.includes('status') || q.includes('ats')) {
      return "📊 **Job Application Tracker & ATS Dashboard**:\n\n" +
             "• Click 'Applications' in the sidebar to open your Kanban pipeline.\n" +
             "• Move applications across 6 stages: *Saved*, *Applied*, *Screening*, *Interviews*, *Offers*, and *Closed*.\n" +
             "• Add interview dates and recruiter notes for each job application.";
    }

    // 6. Profile & Settings Module
    if (q.includes('profile') || q.includes('setting') || q.includes('account') || q.includes('edit')) {
      return "⚙️ **Profile & Settings**:\n\n" +
             "• Access profile controls via the **Facebook-style top-right profile dropdown menu**.\n" +
             "• Click 'Edit Candidate Profile' to update target job title, location, work mode preferences, and technical skills.";
    }

    // Off-topic / Strict Platform Guardrail
    return "I am specialized **strictly in CareerPilot AI platform guidance**. I can answer any questions about using our platform modules:\n\n" +
           "• 📄 How to use **Resume Intelligence & JD Matching**\n" +
           "• 💼 Finding jobs on **LinkedIn / Naukri / Indeed** & Job Alerts\n" +
           "• 🧠 Generating **Career Intelligence Roadmaps**\n" +
           "• 📊 Managing your **Job Application Tracker**\n" +
           "• ⚙️ Editing **Profile & Settings**\n\n" +
           "How can I help you navigate the platform today?";
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsTyping(true);

    setTimeout(() => {
      const responseText = getPlatformResponse(query);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 500);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `msg-welcome-${Date.now()}`,
        sender: 'bot',
        text: "👋 Hi! I'm your CareerPilot AI Platform Assistant. How can I help you navigate or use our platform modules today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Widget Toggle Button (when closed) */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white font-bold text-sm shadow-2xl shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <div className="relative">
            <Bot className="w-5 h-5 animate-bounce" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white absolute -top-1 -right-1" />
          </div>
          <span>Platform Assistant</span>
          <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            AI Help
          </span>
        </button>
      )}

      {/* Minimized Header Pill */}
      {isOpen && isMinimized && (
        <div className="flex items-center justify-between gap-4 px-5 py-3 rounded-full bg-surface-900 text-white border border-surface-700 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-brand-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">CareerPilot Platform Assistant</p>
              <p className="text-[10px] text-surface-400">Click to expand chat</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(false)}
              title="Maximize"
              className="p-1 text-surface-400 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              title="Close"
              className="p-1 text-surface-400 hover:text-rose-400 hover:bg-white/10 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Expanded Chatbot Window Modal */}
      {isOpen && !isMinimized && (
        <div
          className={`bg-white border border-surface-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 ${
            isMaximized
              ? 'w-[90vw] max-w-[700px] h-[80vh] max-h-[750px]'
              : 'w-[360px] sm:w-[440px] h-[580px]'
          }`}
        >
          {/* Header Bar with Controls */}
          <div className="bg-gradient-to-r from-surface-900 via-surface-800 to-surface-900 p-4 text-white flex items-center justify-between shrink-0 border-b border-surface-700">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-500 flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                  CareerPilot AI Assistant
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h3>
                <p className="text-[11px] text-surface-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Platform Knowledge Concierge
                </p>
              </div>
            </div>

            {/* Header Controls: Clear, Minimize, Maximize, Close */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleClearHistory}
                title="Clear Chat"
                className="p-1.5 text-surface-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsMinimized(true)}
                title="Minimize Window"
                className="p-1.5 text-surface-400 hover:text-amber-400 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? "Restore Window Size" : "Maximize Window"}
                className="p-1.5 text-surface-400 hover:text-brand-400 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="p-1.5 text-surface-400 hover:text-rose-400 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Category Chips */}
          <div className="bg-surface-50 p-2.5 border-b border-surface-200 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-full bg-white border border-surface-200 hover:border-brand-500 hover:bg-brand-50 text-[11px] font-semibold text-surface-700 hover:text-brand-700 whitespace-nowrap transition-all cursor-pointer shadow-2xs shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-surface-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[84%] space-y-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-brand-500 text-white font-medium rounded-tr-none shadow-md shadow-brand-500/20'
                        : 'bg-white text-surface-800 border border-surface-200 rounded-tl-none shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>
                  </div>
                  <p className="text-[9px] text-surface-400 px-1">{msg.timestamp}</p>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-surface-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-2 text-surface-400 text-xs p-2">
                <Bot className="w-4 h-4 animate-spin text-brand-500" />
                <span className="italic">CareerPilot Support is typing...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-surface-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about platform features & how to use modules..."
                className="flex-1 px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs text-surface-900 placeholder-surface-400 focus:outline-none focus:border-brand-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim()}
                className="p-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white transition-all shadow-md shadow-brand-500/20 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-center text-surface-400 mt-2">
              CareerPilot AI Platform Assistant • Strictly platform guidance & module support
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
