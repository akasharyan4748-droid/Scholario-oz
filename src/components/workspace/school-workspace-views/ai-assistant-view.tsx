'use client';

import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import type { WorkspaceAiLog } from './shared';

// -------------------------------------------------------------
// 16. AI ASSISTANT
// -------------------------------------------------------------

export interface AiAssistantViewProps {
  aiLogs: WorkspaceAiLog[];
  aiPrompt: string;
  setAiPrompt: (value: string) => void;
  handleRunAiAssistant: (e: React.FormEvent) => void;
}

export function AiAssistantView({
  aiLogs,
  aiPrompt,
  setAiPrompt,
  handleRunAiAssistant,
}: AiAssistantViewProps) {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
        <Bot className="w-5 h-5 text-brand-secondary" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Tenant AI Copilot</h3>
      </div>

      <div className="space-y-3">
        <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
          {aiLogs.map((log, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-200/30 dark:border-slate-800/30 bg-white/30 dark:bg-black/20 space-y-1">
              <span className="text-[10px] font-bold font-mono text-brand-secondary uppercase block">Prompt: {log.prompt}</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">{log.response}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleRunAiAssistant} className="flex gap-2">
          <input
            type="text"
            placeholder="Ask AI to draft lesson plan, generate quiz, or write circular..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold text-white bg-brand-secondary rounded-xl hover:brightness-110 cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" /> Generate
          </button>
        </form>
      </div>
    </div>
  );
}
